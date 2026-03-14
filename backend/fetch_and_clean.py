"""
Fetch all NYC food resources from the Lemontree API, clean them,
and upsert into the Supabase `clean_resources` table.

Usage:
    pip install requests supabase
    python fetch_and_clean.py

Reads SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from backend/.env
(or environment variables).
"""

import os
import re
import json
import time
import datetime
import requests

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

LEMONTREE_API = "https://platform.foodhelpline.org/api/resources"

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

BOROUGH_RANGES = [
    (10001, 10282, "Manhattan"),
    (10301, 10314, "Staten Island"),
    (10451, 10475, "Bronx"),
    (11004, 11109, "Queens"),
    (11201, 11256, "Brooklyn"),
    (11351, 11697, "Queens"),
]

STATE_MAP = {
    "new york": "NY", "ny": "NY",
    "new jersey": "NJ", "nj": "NJ",
    "connecticut": "CT", "ct": "CT",
    "pennsylvania": "PA", "pa": "PA",
}

PHONE_PATTERN = re.compile(r"\d{3}.*\d{3}.*\d{4}")

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def load_env():
    """Read backend/.env into os.environ if not already set."""
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


def get_borough(zip_code):
    if not zip_code:
        return None
    try:
        n = int(str(zip_code).strip())
    except ValueError:
        return None
    for lo, hi, borough in BOROUGH_RANGES:
        if lo <= n <= hi:
            return borough
    return None


def get_next_occurrence(resource):
    """Return the earliest future occurrence (start, confirmed) or (None, False)."""
    now = datetime.datetime.now(datetime.timezone.utc)
    best = None
    for occ in resource.get("occurrences") or []:
        if occ.get("skippedAt"):
            continue
        start_str = occ.get("startTime")
        if not start_str:
            continue
        try:
            start = datetime.datetime.fromisoformat(start_str.replace("Z", "+00:00"))
        except ValueError:
            continue
        if start >= now and (best is None or start < best[0]):
            best = (start, bool(occ.get("confirmedAt")))
    if best:
        return best[0].isoformat(), best[1]
    return None, False


# ---------------------------------------------------------------------------
# Fetching
# ---------------------------------------------------------------------------

def fetch_all_resources():
    """Paginate through the Lemontree API using cursor-based pagination."""
    all_resources = []
    cursor = None
    page = 0
    while True:
        page += 1
        params = {}
        if cursor:
            params["cursor"] = cursor
        if page % 10 == 1:
            print(f"  Fetching page {page} ({len(all_resources)} so far)...")
        resp = requests.get(LEMONTREE_API, params=params, timeout=30)
        resp.raise_for_status()
        data = resp.json().get("json", {})
        resources = data.get("resources", [])
        if not resources:
            break
        all_resources.extend(resources)
        total = data.get("count", 0)
        cursor = data.get("cursor")
        if not cursor or len(all_resources) >= total:
            break
        time.sleep(0.15)
    return all_resources


# ---------------------------------------------------------------------------
# Cleaning
# ---------------------------------------------------------------------------

def clean_resource(raw, log_entries):
    """Clean a single resource dict in-place. Appends changes to log_entries."""
    rid = str(raw.get("id", "?"))

    def record(field, original, cleaned):
        log_entries.append({
            "resource_id": rid,
            "resource_name": raw.get("name", ""),
            "field": field,
            "original": original,
            "cleaned": cleaned,
        })

    # 1. Trim name
    name = raw.get("name")
    if name and name != name.strip():
        record("name", name, name.strip())
        raw["name"] = name.strip()

    # 2. Trim city
    city = raw.get("city")
    if city and city != city.strip():
        record("city", city, city.strip())
        raw["city"] = city.strip()

    # 3. Normalize state
    state = raw.get("state")
    if state:
        normalized = STATE_MAP.get(state.strip().lower(), state.strip().upper())
        if normalized != state:
            record("state", state, normalized)
            raw["state"] = normalized

    # 4. Clean website
    website = raw.get("website")
    if website and isinstance(website, str) and website.strip():
        original_website = website
        website = website.strip()
        if "@" in website and not website.startswith("http"):
            record("website", original_website, None)
            raw["website"] = None
        elif not website.startswith("http://") and not website.startswith("https://"):
            cleaned = "https://" + website
            record("website", original_website, cleaned)
            raw["website"] = cleaned

    # 5. Clean phone (first contact)
    contacts = raw.get("contacts") or []
    if contacts and isinstance(contacts, list) and len(contacts) > 0:
        phone = contacts[0].get("phone")
        if phone and isinstance(phone, str) and phone.strip():
            if not PHONE_PATTERN.search(phone):
                record("contacts[0].phone", phone, None)
                contacts[0]["phone"] = None

    # 6. Truncate descriptions to 500 chars
    for desc_field in ("description", "description_es"):
        desc = raw.get(desc_field)
        if desc and isinstance(desc, str) and len(desc) > 500:
            truncated = desc[:497] + "..."
            record(desc_field, f"({len(desc)} chars)", f"({len(truncated)} chars, truncated)")
            raw[desc_field] = truncated

    # 7. Usage limit consistency
    count = raw.get("usageLimitCount")
    interval = raw.get("usageLimitIntervalUnit")
    if count is not None and interval is None:
        record("usageLimitCount", count, None)
        raw["usageLimitCount"] = None
    if interval is not None and count is None:
        record("usageLimitIntervalUnit", interval, None)
        raw["usageLimitIntervalUnit"] = None

    # 8. Trim addressStreet1
    addr = raw.get("addressStreet1")
    if addr and addr != addr.strip():
        record("addressStreet1", addr, addr.strip())
        raw["addressStreet1"] = addr.strip()


def map_to_row(raw):
    """Convert a cleaned Lemontree resource to a clean_resources table row."""
    zip_code = raw.get("zipCode") or ""
    zip_str = str(zip_code).strip() if zip_code else None

    contacts = raw.get("contacts") or []
    phone = None
    if contacts and isinstance(contacts, list) and len(contacts) > 0:
        phone = contacts[0].get("phone")

    tags = raw.get("tags") or []
    tag_names = [t.get("name") for t in tags if t.get("name")] if isinstance(tags, list) else []
    tag_ids = [t.get("id") for t in tags if t.get("id")] if isinstance(tags, list) else []

    rt = raw.get("resourceType") or {}
    status = (raw.get("resourceStatus") or {}).get("id", "PUBLISHED")

    next_start, next_confirmed = get_next_occurrence(raw)

    skip_ranges = raw.get("occurrenceSkipRanges") or []

    return {
        "id": str(raw.get("id", "")),
        "name": raw.get("name"),
        "description": raw.get("description"),
        "description_es": raw.get("description_es"),
        "resource_type_id": rt.get("id"),
        "resource_type_name": rt.get("name"),
        "status": status,
        "address_street1": raw.get("addressStreet1"),
        "address_street2": raw.get("addressStreet2"),
        "city": raw.get("city"),
        "state": raw.get("state"),
        "zip_code": zip_str,
        "latitude": raw.get("latitude"),
        "longitude": raw.get("longitude"),
        "timezone": raw.get("timezone"),
        "borough": get_borough(zip_str),
        "website": raw.get("website"),
        "phone": phone,
        "accepting_new_clients": raw.get("acceptingNewClients"),
        "appointment_required": raw.get("appointmentRequired"),
        "open_by_appointment": raw.get("openByAppointment"),
        "wait_time_minutes_avg": raw.get("waitTimeMinutesAverage"),
        "usage_limit_count": raw.get("usageLimitCount"),
        "usage_limit_interval_count": raw.get("usageLimitIntervalCount"),
        "usage_limit_interval_unit": raw.get("usageLimitIntervalUnit"),
        "usage_limit_calendar_reset": raw.get("usageLimitCalendarReset"),
        "confidence": raw.get("confidence"),
        "rating_average": raw.get("ratingAverage"),
        "review_count": (raw.get("_count") or {}).get("reviews"),
        "subscription_count": (raw.get("_count") or {}).get("resourceSubscriptions"),
        "skip_range_count": len(skip_ranges),
        "next_occurrence_start": next_start,
        "next_occurrence_confirmed": next_confirmed,
        "tags": json.dumps(tag_names),
        "tag_ids": json.dumps(tag_ids),
        "merged_to_resource_id": raw.get("mergedToResourceId"),
        "raw": json.dumps(raw),
    }


# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------

def write_logs(log_entries, total_fetched, nyc_count, script_dir):
    field_groups = {}
    resources_with_changes = set()

    for entry in log_entries:
        field = entry["field"]
        field_groups.setdefault(field, []).append(entry)
        resources_with_changes.add(entry["resource_id"])

    # --- Text log ---
    txt_path = os.path.join(script_dir, "cleaning_log.txt")
    with open(txt_path, "w") as f:
        f.write("=" * 70 + "\n")
        f.write("LEMONTREE DATA CLEANING LOG\n")
        f.write(f"Generated: {datetime.datetime.now().isoformat()}\n")
        f.write("=" * 70 + "\n\n")

        f.write("SUMMARY\n")
        f.write("-" * 40 + "\n")
        f.write(f"Total resources fetched from API:  {total_fetched}\n")
        f.write(f"Resources in target NYC zips:      {nyc_count}\n")
        f.write(f"Total changes made:                {len(log_entries)}\n")
        f.write(f"Resources with at least 1 change:  {len(resources_with_changes)}\n\n")

        f.write("CHANGES PER FIELD\n")
        f.write("-" * 40 + "\n")
        for field in sorted(field_groups.keys()):
            f.write(f"  {field:<30} {len(field_groups[field]):>5} changes\n")
        f.write("\n")

        for field in sorted(field_groups.keys()):
            entries = field_groups[field]
            f.write("=" * 70 + "\n")
            f.write(f"FIELD: {field}  ({len(entries)} changes)\n")
            f.write("=" * 70 + "\n")
            for e in entries:
                f.write(f"  Resource {e['resource_id']}: {e['resource_name']}\n")
                f.write(f"    Before: {e['original']}\n")
                f.write(f"    After:  {e['cleaned']}\n\n")

    # --- JSON log ---
    json_path = os.path.join(script_dir, "cleaning_log.json")
    summary = {
        "generated": datetime.datetime.now().isoformat(),
        "total_fetched": total_fetched,
        "nyc_zip_count": nyc_count,
        "total_changes": len(log_entries),
        "resources_with_changes": len(resources_with_changes),
        "changes_per_field": {f: len(entries) for f, entries in field_groups.items()},
        "changes": log_entries,
    }
    with open(json_path, "w") as f:
        json.dump(summary, f, indent=2, default=str)

    return txt_path, json_path


# ---------------------------------------------------------------------------
# Upsert to Supabase
# ---------------------------------------------------------------------------

def upsert_to_supabase(rows):
    """Upsert rows into clean_resources using the Supabase REST API."""
    from supabase import create_client

    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        raise RuntimeError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set")

    sb = create_client(url, key)

    batch_size = 500
    for i in range(0, len(rows), batch_size):
        batch = rows[i : i + batch_size]
        sb.table("clean_resources").upsert(batch, on_conflict="id").execute()
        print(f"  Upserted batch {i // batch_size + 1} ({len(batch)} rows)")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    load_env()
    script_dir = os.path.dirname(os.path.abspath(__file__))

    print("Step 1: Fetching all resources from Lemontree API...")
    all_resources = fetch_all_resources()
    total_fetched = len(all_resources)
    print(f"  Fetched {total_fetched} total resources.\n")

    print("Step 2: Filtering to NYC zip codes...")
    nyc_resources = [
        r for r in all_resources
        if str(r.get("zipCode", "")).strip() in NYC_ZIPS
    ]
    nyc_count = len(nyc_resources)
    print(f"  {nyc_count} resources match target NYC zips.\n")

    print("Step 3: Cleaning data...")
    log_entries = []
    for r in nyc_resources:
        clean_resource(r, log_entries)
    print(f"  {len(log_entries)} total changes across {len(set(e['resource_id'] for e in log_entries))} resources.\n")

    print("Step 4: Mapping to table schema...")
    rows = [map_to_row(r) for r in nyc_resources]
    # Filter out rows without an id
    rows = [r for r in rows if r["id"]]
    print(f"  {len(rows)} rows ready for upsert.\n")

    print("Step 5: Upserting to Supabase clean_resources...")
    upsert_to_supabase(rows)
    print("  Done.\n")

    print("Step 6: Writing logs...")
    txt_path, json_path = write_logs(log_entries, total_fetched, nyc_count, script_dir)
    print(f"  {txt_path}")
    print(f"  {json_path}\n")

    print("=" * 50)
    print("COMPLETE")
    print(f"  {total_fetched} fetched → {nyc_count} in NYC zips → {len(rows)} upserted")
    print(f"  {len(log_entries)} fields cleaned across {len(set(e['resource_id'] for e in log_entries))} resources")


if __name__ == "__main__":
    main()
