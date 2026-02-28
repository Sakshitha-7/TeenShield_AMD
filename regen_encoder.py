import pickle
from sklearn.preprocessing import LabelEncoder
import numpy as np

# We know the scam types from the main.py: 
# "mule_chain", "ponzi_investment", "crypto_mining", "forex_trading", "betting_app", "none"
# From a previous run or general classification, these are the labels:
labels = ["mule_chain", "ponzi_investment", "crypto_mining", "forex_trading", "betting_app", "none"]

le = LabelEncoder()
le.fit(labels)

with open('backend/saved_models/label_encoder.pkl', 'wb') as f:
    pickle.dump(le, f)

print("Regenerated label encoder!")
