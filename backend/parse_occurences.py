"""
parse_occurrences.py
Reads lemontree_nyc.csv and adds human-readable schedule columns.

Usage:
    python parse_occurrences.py

Input:  lemontree_nyc.csv
Output: lemontree_nyc_readable.csv
"""

import pandas as pd
import json
from datetime import datetime, timezone


def fmt_occurrence(occ: dict) -> str:
    """
    Convert a single occurrence dict to a readable string.
    e.g. "Wed Mar 19, 4:30pm – 7:00pm"
    """
    try:
        start = datetime.fromisoformat(occ["start"])
        end   = datetime.fromisoformat(occ["end"])

        # Convert to local time if timezone-aware
        start = start.astimezone(tz=None)
        end   = end.astimezone(tz=None)

        date_str  = start.strftime("%a %b %-d")
        start_str = start.strftime("%-I:%M%p").lower()
        end_str   = end.strftime("%-I:%M%p").lower()
        confirmed = " ✓" if occ.get("confirmed") else ""

        return f"{date_str}, {start_str} – {end_str}{confirmed}"
    except Exception:
        return ""


def parse_upcoming(raw: str) -> list[dict]:
    """Parse the JSON string from the CSV cell."""
    try:
        return json.loads(raw) if isinstance(raw, str) else []
    except Exception:
        return []


def next_open_readable(raw: str) -> str:
    """First non-empty occurrence as a readable string."""
    occs = parse_upcoming(raw)
    if not occs:
        return ""
    return fmt_occurrence(occs[0])


def upcoming_schedule(raw: str) -> str:
    """All upcoming occurrences joined by ' | '."""
    occs = parse_upcoming(raw)
    parts = [fmt_occurrence(o) for o in occs if o]
    return " | ".join(p for p in parts if p)


def next_confirmed(raw: str) -> str:
    occs = parse_upcoming(raw)
    if not occs:
        return ""
    return "Yes" if occs[0].get("confirmed") else "No"


def main():
    df = pd.read_csv("lemontree_nyc.csv")

    df["next_open_readable"] = df["upcoming_occurrences"].apply(next_open_readable)
    df["next_confirmed"]     = df["upcoming_occurrences"].apply(next_confirmed)
    df["upcoming_schedule"]  = df["upcoming_occurrences"].apply(upcoming_schedule)

    # Drop the raw JSON column now that we have readable versions
    df = df.drop(columns=["upcoming_occurrences"])

    df.to_csv("lemontree_nyc_readable.csv", index=False)
    print("Saved to lemontree_nyc_readable.csv")

    # Preview
    cols = ["name", "city", "next_open_readable", "next_confirmed", "upcoming_schedule"]
    print(df[cols].head(10).to_string(index=False))


if __name__ == "__main__":
    main()