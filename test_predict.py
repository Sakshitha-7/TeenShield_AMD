from backend.main import load_models, models, _build_dataframe, TransactionFeatures
import json
import traceback

print("Loading models...")
load_models()

payload = {
    "txn_amount":5000,
    "txn_hour":12,
    "rapid_forward_flag":1,
    "similar_amount_burst_flag":1,
    "high_frequency_flag":1,
    "incoming_txn_count_24h":5,
    "outgoing_txn_count_24h":5,
    "forwarding_ratio":1.0,
    "transaction_velocity":2.0,
    "cross_state_flag":1,
    "commission_pattern_flag":1,
    "investment_flag":1,
    "unusual_amount_flag":1,
    "daily_transaction_count":10,
    "rapid_transfer_flag":1
}

print("Building dataframe...")
features = TransactionFeatures(**payload)
df = _build_dataframe(features)
mule_prob = float(models["mule"].predict_proba(df)[:, 1][0])
freeze_prob = float(models["freeze"].predict_proba(df)[:, 1][0])

try:
    print("Running meta predict with expanded features...")
    meta_input = df.copy()
    meta_input["mule_probability"] = mule_prob
    meta_input["freeze_probability"] = freeze_prob
    
    print("Expected meta features:", getattr(models["meta"], "feature_names_in_", "Unknown"))
    
    # Try the exact same logic as main.py
    scam_encoded = models["meta"].predict(meta_input)[0]
    print(f"Scam encoded: {scam_encoded}")

except Exception as e:
    print(traceback.format_exc())

    try:
        print("Running meta predict with base features...")
        scam_encoded = models["meta"].predict(df)[0]
        print(f"Scam encoded: {scam_encoded}")
    except Exception as e:
        print(traceback.format_exc())
