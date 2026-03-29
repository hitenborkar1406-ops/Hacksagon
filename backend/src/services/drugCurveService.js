import Vitals from '../models/Vitals.js';
import { emitInsightUpdate } from '../sockets/index.js';

// In-memory store for latest insight (PRD §10.4 — in-memory for v1.0)
let latestInsight = null;

export function getLatestInsight() {
  return latestInsight;
}

/**
 * PRD §8.5 — Drug Impact Curve computation.
 * Called asynchronously after iv_start event. Does NOT block HTTP response.
 */
export async function computeDrugCurve(io, ivStartTime) {
  try {
    const startTs = new Date(ivStartTime);

    // Baseline: vitals in the 10 minutes before IV start
    const baselineFrom = new Date(startTs.getTime() - 10 * 60_000);
    const baselineRecords = await Vitals.find({
      timestamp: { $gte: baselineFrom, $lt: startTs },
    }).sort({ timestamp: 1 });

    if (!baselineRecords.length) {
      latestInsight = {
        ivStartTime: startTs,
        baseline: null,
        responseDelayMins: null,
        improvement: null,
        stabilisationMins: null,
        insight: 'No measurable response to IV administration detected within the observation window.',
        vitalsTimeline: [],
      };
      emitInsightUpdate(io, latestInsight);
      return;
    }

    // Compute baseline means (PRD FR-D02)
    const baseline = {
      heartRate: baselineRecords.reduce((s, r) => s + r.heartRate, 0) / baselineRecords.length,
      spo2: baselineRecords.reduce((s, r) => s + r.spo2, 0) / baselineRecords.length,
    };

    // Wait 30 minutes then fetch post-IV vitals
    const windowMs = 30 * 60_000;
    await new Promise((resolve) => setTimeout(resolve, windowMs));

    const postRecords = await Vitals.find({
      timestamp: { $gte: startTs, $lte: new Date(startTs.getTime() + windowMs) },
    }).sort({ timestamp: 1 });

    const vitalsTimeline = postRecords.map((r) => ({
      t: (r.timestamp - startTs) / 60_000,
      heartRate: r.heartRate,
      spo2: r.spo2,
    }));

    // Response delay — first reading where spo2 improves ≥2 OR HR moves ≥5 closer to 75 (PRD FR-D04)
    let responseDelayMins = null;
    for (const point of vitalsTimeline) {
      const spo2Improved = point.spo2 - baseline.spo2 >= 2;
      const hrImproved = Math.abs(point.heartRate - 75) <= Math.abs(baseline.heartRate - 75) - 5;
      if (spo2Improved || hrImproved) {
        responseDelayMins = Math.round(point.t * 10) / 10;
        break;
      }
    }

    // Stabilisation — 5 consecutive readings with spo2>93 and HR 55-100 (PRD FR-D06)
    let stabilisationMins = null;
    for (let i = 0; i <= vitalsTimeline.length - 5; i++) {
      const window = vitalsTimeline.slice(i, i + 5);
      const stable = window.every((p) => p.spo2 > 93 && p.heartRate >= 55 && p.heartRate <= 100);
      if (stable) {
        stabilisationMins = Math.round(window[0].t * 10) / 10;
        break;
      }
    }

    // Improvement (PRD FR-D05)
    const postMeanHr = vitalsTimeline.reduce((s, p) => s + p.heartRate, 0) / (vitalsTimeline.length || 1);
    const postMeanSpo2 = vitalsTimeline.reduce((s, p) => s + p.spo2, 0) / (vitalsTimeline.length || 1);
    const improvement = {
      heartRate: Math.round((postMeanHr - baseline.heartRate) * 10) / 10,
      spo2: Math.round((postMeanSpo2 - baseline.spo2) * 10) / 10,
    };

    // Insight string (PRD §8.7)
    let insight;
    if (responseDelayMins === null) {
      insight = 'No measurable response to IV administration detected within the observation window.';
    } else if (stabilisationMins !== null && stabilisationMins < 20) {
      insight = `Patient responded within ${responseDelayMins} minutes. Vitals stabilised at ${stabilisationMins} minutes after IV start.`;
    } else if (stabilisationMins !== null) {
      insight = `Patient showed initial response at ${responseDelayMins} minutes but required extended time to stabilise (${stabilisationMins} minutes).`;
    } else {
      insight = `Response detected at ${responseDelayMins} minutes. Stabilisation not achieved within the 30-minute observation window.`;
    }

    latestInsight = { ivStartTime: startTs, baseline, responseDelayMins, improvement, stabilisationMins, insight, vitalsTimeline };
    emitInsightUpdate(io, latestInsight);
  } catch (err) {
    console.error('drugCurveService error:', err.message);
  }
}
