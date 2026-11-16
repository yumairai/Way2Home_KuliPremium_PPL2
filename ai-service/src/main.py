"""
main.py — FastAPI service untuk inference AI Analisis Kendala Way2Home.

Menyediakan endpoint:
- GET  /health   : Cek status service dan model yang terpasang
- POST /predict  : Prediksi Risk Level (Random Forest) dan Estimasi Keterlambatan (HistGradientBoosting)
"""
from __future__ import annotations

import os
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from w2h_ml import Way2HomeKendalaPredictor, way2home_input_to_features

# Tentukan lokasi folder models
ROOT_DIR = Path(__file__).resolve().parent.parent.parent
MODELS_DIR = Path(os.environ.get("MODELS_DIR", ROOT_DIR / "models"))

app = FastAPI(
    title="Way2Home AI Kendala Service",
    description="Layanan inference Random Forest (Risk Level) dan HistGradientBoosting (Estimasi Keterlambatan) untuk kendala proyek Way2Home.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inisialisasi predictor
predictor: Optional[Way2HomeKendalaPredictor] = None


@app.on_event("startup")
def load_models():
    global predictor
    if not MODELS_DIR.exists():
        raise RuntimeError(f"Direktori model tidak ditemukan di {MODELS_DIR}")
    predictor = Way2HomeKendalaPredictor(models_dir=MODELS_DIR, variant="w2h_compatible")
    print(f"[AI Service] Model berhasil dimuat dari {MODELS_DIR}: {list(predictor.models.keys())}")


class KendalaPayload(BaseModel):
    kategori: str = Field(..., description="Kategori kendala Way2Home (e.g. MATERIAL_PERALATAN, CUACA_LINGKUNGAN)")
    dampak_waktu_hari: Optional[float] = Field(None, description="Estimasi dampak waktu dalam hari dari Mandor")
    deskripsi: Optional[str] = Field(None, description="Deskripsi kendala")
    kondisi_pekerjaan: Optional[str] = Field(None, description="Kondisi pekerjaan (BERHENTI, TERHAMBAT_SEBAGIAN, BERJALAN)")
    informasi_tambahan: Optional[str] = Field(None, description="Informasi tambahan kendala")
    progress_persen: Optional[float] = Field(None, description="Persentase progres proyek (0-100), atau None")


class KendalaPredictResponse(BaseModel):
    success: bool
    risk_level: str
    risk_proba: dict[str, float]
    delay_days: float
    missing_features: dict[str, list[str]]


@app.get("/health")
def health_check():
    loaded = list(predictor.models.keys()) if predictor else []
    return {
        "status": "ok",
        "service": "Way2Home AI Kendala Service",
        "loaded_models": loaded,
        "variant": "w2h_compatible",
    }


@app.post("/predict", response_model=KendalaPredictResponse)
def predict_kendala(payload: KendalaPayload):
    if predictor is None:
        raise HTTPException(status_code=503, detail="Model belum siap atau gagal dimuat.")

    raw_dict = payload.model_dump()
    features = way2home_input_to_features(raw_dict)
    prediction = predictor.predict(features)

    mo = prediction.get("model_outputs", {})
    risk_level = mo.get("risk_level", "MEDIUM")
    risk_proba = mo.get("risk_proba", {})
    delay_days = mo.get("delay_days", 0.0)

    # Validasi output non-negatif
    if delay_days < 0:
        delay_days = 0.0

    return KendalaPredictResponse(
        success=True,
        risk_level=risk_level,
        risk_proba=risk_proba,
        delay_days=delay_days,
        missing_features=prediction.get("missing_features", {}),
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=False)

