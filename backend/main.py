"""
TeenShield FastAPI Backend

Models loaded from: ./saved_models/
"""

import json
import pickle
from pathlib import Path
from contextlib import asynccontextmanager

import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# ── Paths ────────────────────────────────────────────
MODEL_DIR = Path(__file__).parent / "saved_models"

# ── Global model references (populated at startup) ──
models: dict = {}


def load_models():
    models["mule"] = pickle.loads((MODEL_DIR / "mule_model.pkl").read_bytes())
    models["freeze"] = pickle.loads((MODEL_DIR / "freeze_model.pkl").read_bytes())
    models["meta"] = pickle.loads((MODEL_DIR / "meta_model.pkl").read_bytes())
    models["label_encoder"] = pickle.loads(
        (MODEL_DIR / "label_encoder.pkl").read_bytes()
    )
    models["feature_columns"] = pickle.loads(
        (MODEL_DIR / "feature_columns.pkl").read_bytes()
    )
    with open(MODEL_DIR / "model_metadata.json") as f:
        models["metadata"] = json.load(f)
    print(f"✅ Loaded {len(models)} artifacts from {MODEL_DIR}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    load_models()
    yield


# ── App ──────────────────────────────────────────────
app = FastAPI(
    title="TeenShield ML API",
    version="1.0.0",
    description="Production inference API – models are pre-trained and immutable.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Schemas ──────────────────────────────────────────
class TransactionFeatures(BaseModel):
    txn_amount: float
    txn_hour: int
    rapid_forward_flag: int
    similar_amount_burst_flag: int
    high_frequency_flag: int
    incoming_txn_count_24h: int
    outgoing_txn_count_24h: int
    forwarding_ratio: float
    transaction_velocity: float
    cross_state_flag: int
    commission_pattern_flag: int
    investment_flag: int
    unusual_amount_flag: int
    daily_transaction_count: int
    rapid_transfer_flag: int


class PredictionResponse(BaseModel):
    risk_score: float
    risk_level: str          # LOW | MEDIUM | HIGH
    scam_type: str
    freeze_probability: float


# ── Helpers ──────────────────────────────────────────
def _risk_level(score: float) -> str:
    if score <= 40:
        return "LOW"
    if score <= 70:
        return "MEDIUM"
    return "HIGH"


def _build_dataframe(features: TransactionFeatures) -> pd.DataFrame:
    """Build a single-row DataFrame with columns in the exact training order."""
    feature_cols = models["feature_columns"]
    data = {col: [getattr(features, col)] for col in feature_cols}
    return pd.DataFrame(data, columns=feature_cols)


# ── Endpoints ────────────────────────────────────────
@app.post("/predict-transaction", response_model=PredictionResponse)
async def predict_transaction(features: TransactionFeatures):
    """Run all 4 ML models on a single transaction — exactly as trained."""
    try:
        df = _build_dataframe(features)

        # 1) Mule probability
        mule_prob = float(models["mule"].predict_proba(df)[:, 1][0])

        # 2) Freeze probability
        freeze_prob = float(models["freeze"].predict_proba(df)[:, 1][0])

        # 3) Scam classification
        # The meta model may expect mule_prob and freeze_prob as extra features
        # Try with the base features first; if column mismatch, add derived cols
        try:
            meta_input = df.copy()
            meta_input["mule_probability"] = mule_prob
            meta_input["freeze_probability"] = freeze_prob
            scam_encoded = models["meta"].predict(meta_input)[0]
        except Exception:
            # Fallback: use base features only
            scam_encoded = models["meta"].predict(df)[0]

        scam_type = models["label_encoder"].inverse_transform([scam_encoded])[0]

        # 4) Risk score (0-100)
        # Composite score from mule + freeze + scam severity
        scam_severity = 0.0
        severity_map = {
            "mule_chain": 1.0,
            "ponzi_investment": 0.95,
            "crypto_mining": 0.9,
            "forex_trading": 0.85,
            "betting_app": 0.7,
        }
        scam_severity = severity_map.get(scam_type, 0.0)

        risk_score = min(
            round(
                mule_prob * 40
                + freeze_prob * 30
                + scam_severity * 20
                + min(features.txn_amount / 5000, 1) * 10,
                2,
            ),
            100.0,
        )

        return PredictionResponse(
            risk_score=risk_score,
            risk_level=_risk_level(risk_score),
            scam_type=scam_type,
            freeze_probability=round(freeze_prob, 4),
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/model-metrics")
async def model_metrics():
    """Hidden admin endpoint — returns model metadata."""
    return {
        "metadata": models.get("metadata", {}),
        "feature_columns": list(models.get("feature_columns", [])),
        "scam_classes": list(models["label_encoder"].classes_)
        if "label_encoder" in models
        else [],
    }


@app.get("/health")
async def health():
    return {"status": "ok", "models_loaded": len(models)}
