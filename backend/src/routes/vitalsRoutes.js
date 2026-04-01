import express from "express";
import authRequired from "../middleware/authRequired.js";
import {
  createVitals,
  getLatestVitals,
  getVitalsHistory,
  getVitalsHistoryForPatient,
} from "../controllers/vitalsController.js";

const router = express.Router();

router.post("/", authRequired, async (req, res) => {
  try {
    const vitals = await createVitals(req);
    res.status(201).json({ success: true, data: vitals });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get("/latest", authRequired, async (req, res) => {
  try {
    const latest = await getLatestVitals(req.auth);
    res.json({ success: true, data: latest });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get("/history", authRequired, async (req, res) => {
  try {
    const history = await getVitalsHistory(req.auth, req.query.limit);
    res.json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Frontend calls GET /api/vitals/:patientId?limit= (see openapi convenience routes)
router.get("/:patientId", authRequired, async (req, res) => {
  try {
    const history = await getVitalsHistoryForPatient(
      req.auth,
      req.params.patientId,
      req.query.limit
    );
    res.json({ success: true, data: history });
  } catch (error) {
    const msg = error.message || "Error";
    if (msg === "Forbidden") {
      return res.status(403).json({ success: false, error: msg });
    }
    if (msg === "Invalid patient id") {
      return res.status(400).json({ success: false, error: msg });
    }
    res.status(400).json({ success: false, error: msg });
  }
});

export default router;
