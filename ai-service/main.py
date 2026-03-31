"""
IV DRIP SYSTEM Service — OpenCV IV Vision Pipeline
POST /analyze-frame  →  { status: "normal"|"backflow"|"empty"|"air_detected"|"error" }
Never returns 4xx/5xx (PRD FR-AI07).
"""
import io
import numpy as np
import cv2
from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse

app = FastAPI(title="IV DRIP SYSTEM Service", version="1.0.0")


@app.get("/health")
def health():
    return {"status": "ok", "service": "ai-service"}


@app.post("/analyze-frame")
async def analyze_frame(frame: UploadFile = File(...)):
    try:
        contents = await frame.read()
        arr = np.frombuffer(contents, dtype=np.uint8)
        img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        if img is None:
            return JSONResponse({"status": "error", "message": "Could not decode image"})

        # 1. Backflow detection (FR-AI03) — red pixel mask in HSV
        hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
        mask_low  = cv2.inRange(hsv, np.array([0, 70, 50]),   np.array([10, 255, 255]))
        mask_high = cv2.inRange(hsv, np.array([160, 70, 50]), np.array([180, 255, 255]))
        red_pixels = cv2.countNonZero(mask_low | mask_high)
        if red_pixels > 500:
            return JSONResponse({"status": "backflow"})

        # 2. Empty bottle detection (FR-AI04) — high mean brightness in grayscale
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        if float(np.mean(gray)) > 240.0:
            return JSONResponse({"status": "empty"})

        # 3. Air bubble detection (FR-AI05) — SimpleBlobDetector
        params = cv2.SimpleBlobDetector_Params()
        params.filterByCircularity = True
        params.minCircularity = 0.6
        params.filterByArea = True
        params.minArea = 20
        detector = cv2.SimpleBlobDetector_create(params)
        keypoints = detector.detect(gray)
        if len(keypoints) > 0:
            return JSONResponse({"status": "air_detected"})

        return JSONResponse({"status": "normal"})

    except Exception as exc:
        return JSONResponse({"status": "error", "message": str(exc)})