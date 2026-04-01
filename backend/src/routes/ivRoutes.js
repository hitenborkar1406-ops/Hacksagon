import express from "express";
import mongoose from "mongoose";
import authRequired from "../middleware/authRequired.js";
import Vitals from "../models/Vitals.js";
import User from "../models/User.js";

const router = express.Router();

const DEFAULT_RATE = 45;
const DEFAULT_REMAINING_ML = 500;

/**
 * GET /api/iv/:patientId
 * Frontend expects { valveOpen, rate, remaining, ... }; derived from latest vitals + defaults.
 */
router.get("/:patientId", authRequired, async (req, res) => {
  const { role, userId } = req.auth;
  const { patientId } = req.params;

  try {
    if (!mongoose.Types.ObjectId.isValid(patientId)) {
      return res.status(400).json({ success: false, error: "Invalid patient id" });
    }
    if (role === "patient" && String(patientId) !== String(userId)) {
      return res.status(403).json({ success: false, error: "Forbidden" });
    }

    const patient = await User.findById(patientId).select("_id role");
    if (!patient || patient.role !== "patient") {
      return res.status(404).json({ success: false, error: "Patient not found" });
    }

    const latest = await Vitals.findOne({ patientId }).sort({ timestamp: -1 });
    const valveOpen = latest ? latest.ivStatus === "running" : true;
    const rate = DEFAULT_RATE;

    return res.json({
      success: true,
      data: {
        patientId,
        valveOpen,
        rate,
        remaining: DEFAULT_REMAINING_ML,
        ivStatus: latest?.ivStatus || "running",
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
