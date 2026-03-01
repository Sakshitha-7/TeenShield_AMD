# ============================================
# TEENSHIELD – FULL ML SYSTEM (COLAB READY)
# ============================================

# -------------------------------
# 1️⃣ INSTALL LIBRARIES
# -------------------------------

# -------------------------------
# 2️⃣ IMPORTS
# -------------------------------
import pandas as pd
import numpy as np
import xgboost as xgb
import shap
import joblib
import json
from datetime import datetime

from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
from sklearn.preprocessing import LabelEncoder

np.random.seed(42)

# -------------------------------
# 3️⃣ GENERATE REALISTIC DATA
# -------------------------------
N = 12000

df = pd.DataFrame({
    "txn_amount": np.random.uniform(500, 10000, N),
    "txn_hour": np.random.randint(0, 24, N),
    "incoming_txn_count_24h": np.random.randint(0, 25, N),
    "outgoing_txn_count_24h": np.random.randint(0, 25, N),
    "forwarding_ratio": np.random.uniform(0, 1, N),
    "account_age_days": np.random.randint(10, 365, N),
    "cross_state_flag": np.random.choice([0,1], N, p=[0.85,0.15]),
    "rapid_forward_flag": np.random.choice([0,1], N, p=[0.8,0.2]),
    "similar_amount_burst_flag": np.random.choice([0,1], N, p=[0.85,0.15]),
    "high_frequency_flag": np.random.choice([0,1], N, p=[0.85,0.15]),
})

# -------------------------------
# 4️⃣ FEATURE ENGINEERING
# -------------------------------
df["transaction_velocity"] = (
    df["incoming_txn_count_24h"] + df["outgoing_txn_count_24h"]
) / (df["account_age_days"] + 1)

df["daily_transaction_count"] = (
    df["incoming_txn_count_24h"] + df["outgoing_txn_count_24h"]
)

df["commission_pattern_flag"] = (
    (df["forwarding_ratio"] > 0.75) &
    (df["txn_amount"] < 4000)
).astype(int)

df["investment_flag"] = np.where(df["txn_hour"] > 20, 1, 0)

df["unusual_amount_flag"] = np.where(df["txn_amount"] > 8500, 1, 0)

df["rapid_transfer_flag"] = (
    (df["rapid_forward_flag"] == 1) &
    (df["transaction_velocity"] > 0.05)
).astype(int)

# -------------------------------
# 5️⃣ CREATE REALISTIC TARGETS
# -------------------------------
def sigmoid(x):
    return 1 / (1 + np.exp(-x))

risk_signal = (
    1.5 * df["rapid_transfer_flag"] +
    1.2 * df["cross_state_flag"] +
    1.3 * df["commission_pattern_flag"] +
    0.8 * df["unusual_amount_flag"]
)

fraud_probability = sigmoid(risk_signal - 2)

df["mule_target"] = np.random.binomial(1, fraud_probability)
df["freeze_target"] = np.random.binomial(1, sigmoid(risk_signal - 2.5))

# -------------------------------
# 6️⃣ SCAM CATEGORY (MULTI-CLASS)
# -------------------------------
def assign_scam(row):
    if row["investment_flag"] == 1:
        return "Crypto"
    elif row["rapid_transfer_flag"] == 1:
        return "Forex"
    elif row["similar_amount_burst_flag"] == 1:
        return "Betting"
    elif row["commission_pattern_flag"] == 1:
        return "Ponzi"
    else:
        return "Safe"

df["scam_category"] = df.apply(assign_scam, axis=1)

df["scam_binary"] = np.where(df["scam_category"]=="Safe", 0, 1)

le = LabelEncoder()
df["scam_target"] = df["scam_binary"]

# -------------------------------
# 7️⃣ FEATURES
# -------------------------------
feature_cols = [
    "txn_amount","txn_hour","rapid_forward_flag",
    "similar_amount_burst_flag","high_frequency_flag",
    "incoming_txn_count_24h","outgoing_txn_count_24h",
    "forwarding_ratio","transaction_velocity",
    "cross_state_flag","commission_pattern_flag",
    "investment_flag","unusual_amount_flag",
    "daily_transaction_count","rapid_transfer_flag"
]

X = df[feature_cols]

# -------------------------------
# 8️⃣ TRAIN TEST SPLIT
# -------------------------------
X_train, X_test, y_mule_train, y_mule_test = train_test_split(
    X, df["mule_target"],
    test_size=0.2,
    stratify=df["mule_target"],
    random_state=42
)

_, _, y_freeze_train, y_freeze_test = train_test_split(
    X, df["freeze_target"],
    test_size=0.2,
    stratify=df["freeze_target"],
    random_state=42
)

_, _, y_scam_train, y_scam_test = train_test_split(
    X, df["scam_binary"],
    test_size=0.2,
    stratify=df["scam_binary"],
    random_state=42
)

# -------------------------------
# 9️⃣ TRAINING FUNCTION
# -------------------------------
def train_model(X_train, y_train, multi=False):

    if not multi:
        scale = (len(y_train) - sum(y_train)) / sum(y_train)
        model = xgb.XGBClassifier(
            objective="binary:logistic",
            eval_metric="auc",
            scale_pos_weight=scale,
            n_estimators=300,
            max_depth=5,
            learning_rate=0.05,
            subsample=0.8,
            colsample_bytree=0.8,
            random_state=42
        )
    else:
        model = xgb.XGBClassifier(
            objective="multi:softprob",
            eval_metric="mlogloss",
            n_estimators=300,
            max_depth=5,
            learning_rate=0.05,
            subsample=0.8,
            colsample_bytree=0.8,
            random_state=42
        )

    model.fit(X_train, y_train)
    return model

# -------------------------------
# 🔟 TRAIN BASE MODELS
# -------------------------------
mule_model = train_model(X_train, y_mule_train)
freeze_model = train_model(X_train, y_freeze_train)
scam_model = train_model(X_train, y_scam_train, multi=False)

# -------------------------------
# 11️⃣ EVALUATION
# -------------------------------
print("MULE MODEL")
print(classification_report(y_mule_test, mule_model.predict(X_test)))

print("FREEZE MODEL")
print(classification_report(y_freeze_test, freeze_model.predict(X_test)))

print("SCAM MODEL")
print(classification_report(y_scam_test, scam_model.predict(X_test)))

# -------------------------------
# 12️⃣ META MODEL (FINAL RISK)
# -------------------------------
mule_prob_test = mule_model.predict_proba(X_test)[:,1]
freeze_prob_test = freeze_model.predict_proba(X_test)[:,1]
scam_conf_test = scam_model.predict_proba(X_test)[:,1]

meta_X = pd.DataFrame({
    "mule_prob": mule_prob_test,
    "freeze_prob": freeze_prob_test,
    "scam_confidence": scam_conf_test
})

meta_target = np.random.binomial(
    1,
    sigmoid(mule_prob_test + freeze_prob_test)
)

meta_model = train_model(meta_X, meta_target)

mule_prob = mule_model.predict_proba(X_train)[:,1]
freeze_prob = freeze_model.predict_proba(X_train)[:,1]
scam_conf = scam_model.predict_proba(X_train)[:,1]

meta_X_train = pd.DataFrame({
    "mule_prob": mule_prob,
    "freeze_prob": freeze_prob,
    "scam_confidence": scam_conf
})

meta_target = np.random.binomial(1, sigmoid(mule_prob + freeze_prob))

meta_model = train_model(meta_X_train, meta_target)

# -------------------------------
# 13️⃣ SHAP EXPLAINER
# -------------------------------
explainer = shap.TreeExplainer(meta_model)

# -------------------------------
# 14️⃣ UNIFIED PREDICTION FUNCTION
# -------------------------------
def unified_predict(input_df):

    mule_p = mule_model.predict_proba(input_df)[:,1]
    freeze_p = freeze_model.predict_proba(input_df)[:,1]
    scam_p = scam_model.predict_proba(input_df)[:,1]
    
    scam_label = np.where(scam_p > 0.5, "Scam", "Safe")

    meta_input = pd.DataFrame({
        "mule_prob": mule_p,
        "freeze_prob": freeze_p,
        "scam_confidence": scam_p
    })

    risk_prob = meta_model.predict_proba(meta_input)[:,1]
    risk_score = (risk_prob * 100).round(2)

    shap_values = explainer.shap_values(meta_input)[0]
    importance = sorted(
        zip(meta_input.columns, shap_values),
        key=lambda x: abs(x[1]),
        reverse=True
    )[:3]

    return {
        "risk_score": float(risk_score[0]),
        "scam_type": scam_label[0],
        "freeze_probability": float(freeze_p[0]),
        "top_risk_drivers": [f"{f[0]} ({round(float(f[1]),3)})" for f in importance]
    }

# -------------------------------
# 15️⃣ SAVE ALL FILES
# -------------------------------
joblib.dump(mule_model, "mule_model.pkl")
joblib.dump(freeze_model, "freeze_model.pkl")
joblib.dump(scam_model, "scam_model.pkl")
joblib.dump(meta_model, "meta_model.pkl")

joblib.dump(feature_cols, "feature_columns.pkl")
joblib.dump(le, "label_encoder.pkl")

metadata = {
    "version": "1.0",
    "trained_at": str(datetime.now()),
    "features": feature_cols
}

with open("model_metadata.json", "w") as f:
    json.dump(metadata, f)

print("\n✅ ALL MODELS SAVED SUCCESSFULLY!")

