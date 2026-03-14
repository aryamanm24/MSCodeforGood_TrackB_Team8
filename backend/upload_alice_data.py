"""
Read ALICE_filtered_data.csv and update the zip_demographics table in Supabase
with total_households, pct_below_alice, and alice_households columns.

Run the ALTER TABLE SQL in Supabase first, then:
    cd backend && source venv/bin/activate && python upload_alice_data.py
"""

import os
import csv
import math


def load_env():
    env_path = os.path.join(os.path.dirname(__file__), ".env")
    if not os.path.exists(env_path):
        return
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, val = line.split("=", 1)
            os.environ.setdefault(key.strip(), val.strip())


def main():
    load_env()
    from supabase import create_client

    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        raise SystemExit("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set")

    sb = create_client(url, key)
    csv_path = os.path.join(os.path.dirname(__file__), "ALICE_filtered_data.csv")

    rows = []
    with open(csv_path, newline="") as f:
        reader = csv.DictReader(f)
        for r in reader:
            zipcode = r["zipcode"].strip()
            total_hh = int(r["Total Households"])
            pct_alice = float(r["% Below ALICE Threshold"])
            alice_hh = math.floor(total_hh * pct_alice / 100)
            rows.append({
                "zip_code": zipcode,
                "total_households": total_hh,
                "pct_below_alice": pct_alice,
                "alice_households": alice_hh,
            })

    print(f"Parsed {len(rows)} zip codes from ALICE CSV.")

    updated = 0
    skipped = 0
    for row in rows:
        result = (
            sb.table("zip_demographics")
            .update({
                "total_households": row["total_households"],
                "pct_below_alice": row["pct_below_alice"],
                "alice_households": row["alice_households"],
            })
            .eq("zip_code", row["zip_code"])
            .execute()
        )
        if result.data:
            updated += 1
        else:
            skipped += 1

    print(f"Updated: {updated}  |  Skipped (zip not in table): {skipped}")
    print("Done.")


if __name__ == "__main__":
    main()
