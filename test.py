import traceback
from backend.main import load_models

try:
    load_models()
except Exception as e:
    print(traceback.format_exc())
