import json
import os

nb_path = "c:\\Users\\Sakshitha\\Downloads\\TeenShield_Modified_Project\\backend\\trained_model\\ML_model.ipynb"
out_path = "c:\\Users\\Sakshitha\\Downloads\\TeenShield_Modified_Project\\backend\\trained_model\\run_ml.py"

with open(nb_path, "r", encoding="utf-8") as f:
    nb = json.load(f)

with open(out_path, "w", encoding="utf-8") as out:
    for cell in nb.get("cells", []):
        if cell.get("cell_type") == "code":
            source_lines = cell.get("source", [])
            for line in source_lines:
                if not line.strip().startswith("!"):
                    out.write(line)
            out.write("\n\n")
print(f"Successfully converted {nb_path} to {out_path}")
