"""
Compare `resources` and `clean_resources` in Supabase.
Find rows that exist in resources but not in clean_resources, and explain why.

Reasons a resource can be in resources but not in clean_resources:
  1. ZIP_NOT_NYC  - zip_code is null, empty, or not in the NYC zip list used by fetch_and_clean.py
  2. NOT_IN_API   - (inferred) not returned by Lemontree API when we fetched (e.g. removed or different ID)

Run from backend/ with venv activated. Uses .env for SupABASE_*.
"""

import os
import json

# Reuse NYC zip set from fetch_and_clean
NYC_ZIPS = {
    "10001","10002","10003","10004","10005","10006","10007","10009","10010","10011",
    "10012","10013","10016","10017","10018","10019","10020","10021","10022","10023",
    "10024","10025","10026","10027","10029","10030","10031","10032","10033","10034",
    "10035","10036","10037","10038","10039","10040","10044","10065","10075","10119",
    "10128","10301","10302","10303","10304","10305","10306","10307","10308","10309",
    "10310","10312","10314","10451","10452","10453","10454","10455","10456","10457",
    "10458","10459","10460","10461","10462","10463","10464","10466","10467","10468",
    "10469","10470","10471","10472","10473","10474","10475","11020","11040",
    "11101","11102","11103","11104","11105","11106",
    "11201","11203","11204","11205","11206","11207","11208","11209","11210","11211",
    "11212","11213","11214","11215","11216","11217","11218","11219","11220","11221",
    "11222","11223","11224","11225","11226","11229","11230","11231","11232","11233",
    "11234","11235","11236","11237","11238","11239","11249",
    "11354","11355","11356","11357","11358","11361","11362","11363","11365","11366",
    "11367","11368","11369","11370","11372","11373","11374","11375","11377","11378",
    "11379","11385","11411","11412","11413","11414","11416","11417","11418","11419",
    "11420","11421","11422","11423","11424","11426","11427","11428","11429","11432",
    "11433","11434","11435","11436","11580","11691","11692","11693","11694",
}


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


def fetch_all(sb, table, columns="*", page_size=1000):
    """Fetch all rows from a table with server-side pagination."""
    rows = []
    offset = 0
    while True:
        r = sb.table(table).select(columns).range(offset, offset + page_size - 1).execute()
        data = r.data or []
        rows.extend(data)
        if len(data) < page_size:
            break
        offset += page_size
    return rows


def main():
    load_env()
    from supabase import create_client

    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        raise SystemExit("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set")

    sb = create_client(url, key)
    script_dir = os.path.dirname(os.path.abspath(__file__))

    print("Fetching all rows from resources...")
    resources = fetch_all(sb, "resources", "id, zip_code, name, city, status, merged_to_resource_id")
    print(f"  resources: {len(resources)} rows")

    print("Fetching all IDs from clean_resources...")
    clean = fetch_all(sb, "clean_resources", "id")
    clean_ids = {str(r["id"]) for r in clean}
    print(f"  clean_resources: {len(clean_ids)} rows")

    # Only consider active rows (not merged away)
    resource_ids = {str(r["id"]) for r in resources}
    in_both = resource_ids & clean_ids
    only_in_resources = resource_ids - clean_ids

    # For each only_in_resources, get full row to inspect zip_code
    only_rows = [r for r in resources if str(r["id"]) in only_in_resources]

    # Classify why missing from clean_resources
    reason_zip_not_nyc = []   # zip null, empty, or not in NYC_ZIPS
    reason_other = []         # zip is in NYC_ZIPS -> then likely not in API when we ran fetch

    for r in only_rows:
        rid = str(r["id"])
        zip_val = r.get("zip_code")
        if zip_val is None or (isinstance(zip_val, str) and not zip_val.strip()):
            reason_zip_not_nyc.append({**r, "reason": "zip_code is null or empty"})
        elif str(zip_val).strip() not in NYC_ZIPS:
            reason_zip_not_nyc.append({**r, "reason": f"zip_code '{zip_val}' not in NYC zip list"})
        else:
            reason_other.append({**r, "reason": "zip is NYC but not in clean_resources (likely not returned by Lemontree API when fetch_and_clean ran)"})

    # Report
    summary = {
        "resources_table_count": len(resources),
        "clean_resources_table_count": len(clean_ids),
        "in_both_tables": len(in_both),
        "only_in_resources": len(only_in_resources),
        "only_in_clean_resources": len(clean_ids - resource_ids),
        "reasons_only_in_resources": {
            "zip_not_nyc_or_missing": len(reason_zip_not_nyc),
            "zip_nyc_but_not_in_api_or_filtered": len(reason_other),
        },
        "by_zip_reason": {},
    }

    # Group by reason text for zip_not_nyc
    for r in reason_zip_not_nyc:
        reason = r.pop("reason", "")
        summary["by_zip_reason"][reason] = summary["by_zip_reason"].get(reason, 0) + 1
        r["reason"] = reason

    print()
    print("=" * 60)
    print("COMPARISON: resources vs clean_resources")
    print("=" * 60)
    print(f"  resources total:              {summary['resources_table_count']}")
    print(f"  clean_resources total:        {summary['clean_resources_table_count']}")
    print(f"  In both:                      {summary['in_both_tables']}")
    print(f"  Only in resources:            {summary['only_in_resources']}")
    print(f"  Only in clean_resources:      {summary['only_in_clean_resources']}")
    print()
    print("Why only_in_resources (not in clean_resources):")
    print(f"  • Zip null/empty or not in NYC list: {summary['reasons_only_in_resources']['zip_not_nyc_or_missing']}")
    print(f"  • Zip is NYC but not in API/filter:  {summary['reasons_only_in_resources']['zip_nyc_but_not_in_api_or_filtered']}")
    print()

    # Write detailed report
    report = {
        "summary": summary,
        "only_in_resources_details": {
            "zip_not_nyc_or_missing": reason_zip_not_nyc,
            "zip_nyc_but_not_in_clean": reason_other,
        },
    }

    out_json = os.path.join(script_dir, "resources_vs_clean_report.json")
    with open(out_json, "w") as f:
        json.dump(report, f, indent=2, default=str)
    print(f"Full report written to: {out_json}")

    # Human-readable text report
    out_txt = os.path.join(script_dir, "resources_vs_clean_report.txt")
    with open(out_txt, "w") as f:
        f.write("RESOURCES IN 'resources' BUT NOT IN 'clean_resources'\n")
        f.write("=" * 60 + "\n\n")
        f.write("Summary\n")
        f.write("-" * 40 + "\n")
        for k, v in summary.items():
            if k != "by_zip_reason" and isinstance(v, (int, str)):
                f.write(f"  {k}: {v}\n")
        f.write("\nReasons (only_in_resources):\n")
        f.write(f"  zip not NYC or missing: {summary['reasons_only_in_resources']['zip_not_nyc_or_missing']}\n")
        f.write(f"  zip NYC but not in clean: {summary['reasons_only_in_resources']['zip_nyc_but_not_in_api_or_filtered']}\n")
        f.write("\n\nDetails: Zip not NYC or missing\n")
        f.write("-" * 40 + "\n")
        for r in reason_zip_not_nyc[:200]:
            f.write(f"  id={r.get('id')} zip_code={r.get('zip_code')!r} name={r.get('name')!r} reason={r.get('reason')}\n")
        if len(reason_zip_not_nyc) > 200:
            f.write(f"  ... and {len(reason_zip_not_nyc) - 200} more\n")
        f.write("\n\nDetails: Zip is NYC but not in clean_resources\n")
        f.write("-" * 40 + "\n")
        for r in reason_other[:200]:
            f.write(f"  id={r.get('id')} zip_code={r.get('zip_code')} name={r.get('name')}\n")
        if len(reason_other) > 200:
            f.write(f"  ... and {len(reason_other) - 200} more\n")
    print(f"Text report written to: {out_txt}")


if __name__ == "__main__":
    main()
