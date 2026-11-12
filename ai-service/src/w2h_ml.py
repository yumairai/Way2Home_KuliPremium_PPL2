"""
w2h_ml — utilitas inference model AI Analisis Kendala Way2Home.

Komponen:
1. Risk Level: Random Forest (HIGH / MEDIUM / LOW) varian w2h_compatible.
2. Estimasi Keterlambatan: HistGradientBoosting regresor (ClippedRegressor >= 0 hari) varian w2h_compatible.
Catatan: Model Cost Prediction TIDAK dimuat atau digunakan sesuai spesifikasi.
Risiko pembengkakan biaya ditangani secara Rule-Based di service aplikasi.
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd
from sklearn.base import BaseEstimator, RegressorMixin, clone


class ClippedRegressor(BaseEstimator, RegressorMixin):
    """Regresor yang memotong prediksi ke [min_value, max_value] saat inference.

    Target asli tidak diubah; clipping hanya diterapkan pada keluaran predict().
    """

    def __init__(self, estimator=None, min_value: float | None = 0.0, max_value: float | None = None):
        self.estimator = estimator
        self.min_value = min_value
        self.max_value = max_value

    def fit(self, X, y, **fit_params):
        self.estimator_ = clone(self.estimator).fit(X, y, **fit_params)
        return self

    @classmethod
    def from_fitted(cls, fitted_estimator, min_value: float | None = 0.0, max_value: float | None = None):
        obj = cls(estimator=fitted_estimator, min_value=min_value, max_value=max_value)
        obj.estimator_ = fitted_estimator
        return obj

    def predict(self, X):
        return np.clip(self.estimator_.predict(X), self.min_value, self.max_value)

    @property
    def feature_names_in_(self):
        return self.estimator_.feature_names_in_


# Kategori resmi Way2Home
KNOWN_WAY2HOME_CATEGORIES = {
    "MATERIAL_PERALATAN",
    "CUACA_LINGKUNGAN",
    "TENAGA_KERJA",
    "TEKNIS_KONSTRUKSI",
    "DESAIN_SPESIFIKASI",
    "ANGGARAN_PENGADAAN",
    "PERIZINAN_EKSTERNAL",
    "LAINNYA",
    # Alias / toleransi input singkat
    "MATERIAL",
    "CUACA",
    "KESELAMATAN",
    "PERALATAN",
}

KESELAMATAN_KEYWORDS = (
    "keselamatan", "k3", "kecelakaan", "cedera", "luka", "jatuh", "tertimbun", "tertusuk", "bahaya fisik"
)


def way2home_input_to_features(payload: dict) -> dict:
    """Ubah input kendala Way2Home menjadi fitur untuk model w2h_compatible.

    Fitur target (7 fitur):
    - flag_kendala_material
    - flag_kendala_cuaca
    - flag_kendala_keselamatan
    - dampak_waktu_hari
    - dampak_waktu_material_hari
    - dampak_waktu_cuaca_hari
    - progress_persen

    Ketentuan:
    - Fitur yang tidak ada atau tidak valid dibiarkan np.nan agar ditangani
      oleh imputer pipeline resmi, bukan diisi nol atau asumsi sembarangan.
    """
    raw_kat = str(payload.get("kategori") or "").strip().upper()
    deskripsi = str(payload.get("deskripsi") or "").lower()
    info_tambahan = str(payload.get("informasi_tambahan") or "").lower()
    combined_text = f"{deskripsi} {info_tambahan}"

    is_known = raw_kat in KNOWN_WAY2HOME_CATEGORIES or bool(raw_kat)

    feats: dict[str, Any] = {}

    if not raw_kat:
        feats["flag_kendala_material"] = np.nan
        feats["flag_kendala_cuaca"] = np.nan
        feats["flag_kendala_keselamatan"] = np.nan
    else:
        # Material
        is_material = raw_kat in ("MATERIAL_PERALATAN", "MATERIAL", "PERALATAN")
        feats["flag_kendala_material"] = 1.0 if is_material else 0.0

        # Cuaca
        is_cuaca = raw_kat in ("CUACA_LINGKUNGAN", "CUACA")
        feats["flag_kendala_cuaca"] = 1.0 if is_cuaca else 0.0

        # Keselamatan
        is_keselamatan_kat = raw_kat == "KESELAMATAN"
        is_keselamatan_keyword = any(kw in combined_text for kw in KESELAMATAN_KEYWORDS)
        is_keselamatan = is_keselamatan_kat or (raw_kat == "TENAGA_KERJA" and is_keselamatan_keyword)
        feats["flag_kendala_keselamatan"] = 1.0 if is_keselamatan else 0.0

    # Dampak waktu hari
    dampak = payload.get("dampak_waktu_hari")
    if dampak is not None and str(dampak).strip() != "":
        try:
            dampak_val = float(dampak)
            feats["dampak_waktu_hari"] = max(0.0, dampak_val)
        except (ValueError, TypeError):
            feats["dampak_waktu_hari"] = np.nan
    else:
        feats["dampak_waktu_hari"] = np.nan

    dampak_hari = feats["dampak_waktu_hari"]

    # Dampak spesifik material & cuaca
    if pd.isna(dampak_hari) or pd.isna(feats["flag_kendala_material"]):
        feats["dampak_waktu_material_hari"] = np.nan
    else:
        feats["dampak_waktu_material_hari"] = dampak_hari if feats["flag_kendala_material"] == 1.0 else 0.0

    if pd.isna(dampak_hari) or pd.isna(feats["flag_kendala_cuaca"]):
        feats["dampak_waktu_cuaca_hari"] = np.nan
    else:
        feats["dampak_waktu_cuaca_hari"] = dampak_hari if feats["flag_kendala_cuaca"] == 1.0 else 0.0

    # Progress proyek
    prog = payload.get("progress_persen")
    if prog is not None and str(prog).strip() != "":
        try:
            feats["progress_persen"] = float(prog)
        except (ValueError, TypeError):
            feats["progress_persen"] = np.nan
    else:
        feats["progress_persen"] = np.nan

    return feats


class Way2HomeKendalaPredictor:
    """Memuat model export (Random Forest & HistGradientBoosting) dan memprediksi record kendala.

    HANYA memuat model risk_classification dan delay_regression.
    Model cost_prediction TIDAK dimuat sesuai spesifikasi.
    """

    TASKS = ("risk_classification", "delay_regression")

    def __init__(self, models_dir: str | Path, variant: str = "w2h_compatible"):
        import joblib

        self.models_dir = Path(models_dir)
        self.variant = variant
        self.models: dict[str, Any] = {}
        self.meta: dict[str, Any] = {}

        for task in self.TASKS:
            suffix = "" if variant == "full" else "_w2h_compatible"
            mpath = self.models_dir / f"{task}_model{suffix}.joblib"
            jpath = self.models_dir / f"{task}_model{suffix}_metadata.json"
            if mpath.exists():
                self.models[task] = joblib.load(mpath)
                self.meta[task] = json.loads(jpath.read_text(encoding="utf-8"))

    def _frame(self, task: str, features: dict) -> tuple[pd.DataFrame, list[str]]:
        cols = self.meta[task]["features"]
        missing = [c for c in cols if c not in features or pd.isna(features.get(c))]
        row = {c: features.get(c, np.nan) for c in cols}
        return pd.DataFrame([row], columns=cols).astype(float), missing

    def predict(self, features: dict) -> dict:
        out: dict[str, Any] = {
            "variant": self.variant,
            "model_outputs": {},
            "missing_features": {},
        }

        # 1. Risk Level (Random Forest)
        if "risk_classification" in self.models:
            X, miss = self._frame("risk_classification", features)
            m = self.models["risk_classification"]
            classes = self.meta["risk_classification"]["class_order"]
            proba = m.predict_proba(X)[0]
            pred_idx = int(np.argmax(proba))
            out["model_outputs"]["risk_level"] = classes[pred_idx]
            out["model_outputs"]["risk_proba"] = {
                c: round(float(p), 4) for c, p in zip(classes, proba)
            }
            out["missing_features"]["risk_classification"] = miss

        # 2. Estimasi Keterlambatan (HistGradientBoosting / ClippedRegressor >= 0)
        if "delay_regression" in self.models:
            X, miss = self._frame("delay_regression", features)
            pred_delay = float(self.models["delay_regression"].predict(X)[0])
            out["model_outputs"]["delay_days"] = max(0.0, round(pred_delay, 1))
            out["missing_features"]["delay_regression"] = miss

        return out
