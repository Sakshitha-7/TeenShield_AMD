import io
import pickle
import sys

class RenameUnpickler(pickle.Unpickler):
    def find_class(self, module, name):
        # Handle some renaming if necessary
        return super().find_class(module, name)

try:
    with open('backend/saved_models/label_encoder.pkl', 'rb') as f:
        # Some older scikit-learn models use numpy types which changed
        load = RenameUnpickler(f).load()
        print("Successfully loaded label_encoder!")
except Exception as e:
    import traceback
    print(traceback.format_exc())
