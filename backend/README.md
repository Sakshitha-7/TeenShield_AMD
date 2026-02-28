# TeenShield FastAPI Backend

Production inference API that loads pre-trained ML models and serves predictions.

## Quick Start

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

## Connect Frontend

Set the environment variable before running the Vite frontend:

```bash
VITE_API_BASE_URL=http://localhost:8000
```

Or create a `.env` file in the project root:

```
VITE_API_BASE_URL=http://localhost:8000
```

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/predict-transaction` | Run all 4 ML models on transaction features |
| GET | `/model-metrics` | Admin-only: model metadata |
| GET | `/health` | Health check |
| GET | `/docs` | Swagger UI |

## Models (DO NOT MODIFY)

All models live in `saved_models/` and are loaded at startup:

- `mule_model.pkl` — Mule chain detection
- `freeze_model.pkl` — Account freeze probability
- `meta_model.pkl` — Scam type classification (meta-learner)
- `label_encoder.pkl` — Scam label encoder
- `feature_columns.pkl` — Feature column order
- `model_metadata.json` — Training metadata

## Project Structure

```
backend/
├── main.py                 # FastAPI app
├── requirements.txt        # Python dependencies
├── saved_models/           
│   ├── mule_model.pkl
│   ├── freeze_model.pkl
│   ├── meta_model.pkl
│   ├── label_encoder.pkl
│   ├── feature_columns.pkl
│   └── model_metadata.json
└── data/                   # Reference datasets
    ├── transaction_pattern_dataset.csv
    ├── teen_behavior_dataset.csv
    └── sender_behavior_dataset.csv
```
