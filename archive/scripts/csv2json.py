# 将csv表格转化为JSON的小工具。

import csv
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data"
CSV_PATH = DATA_DIR / "bmslist.csv"
JSON_PATH = DATA_DIR / "bmstable.json"


with CSV_PATH.open("r", encoding="utf-8", newline="") as csv_file:
    rows = list(csv.DictReader(csv_file))

with JSON_PATH.open("w", encoding="utf-8") as json_file:
    json.dump(rows, json_file, ensure_ascii=False, indent=2)
    json_file.write("\n")
