"""
food_access_risk_simple.py
===========================
Combines borough CSVs with hardcoded poverty rates to produce a
Food Access Risk score per resource.

No Census API key needed.

Usage:
    python food_access_risk_simple.py

Inputs:
    manhattan.csv, brooklyn.csv, queens.csv, bronx.csv, staten_island.csv

Output:
    food_access_risk.csv
"""

import pandas as pd
import json
from pathlib import Path
from math import radians, cos, sin, asin, sqrt


# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

# ACS 5-year estimates (2019-2023), borough-level poverty rates
BOROUGH_POVERTY_RATES = {
    "Manhattan":     0.16,
    "Brooklyn":      0.18,
    "Queens":        0.12,
    "The Bronx":     0.26,
    "Staten Island": 0.09,
}

BOROUGH_FILES = {
    "Manhattan":     "/Users/harish_a/MS_CodeforGood_TrackB_Team8-2/backend/boroughs/Manhattan/Manhattan.csv",
    "Brooklyn":      "/Users/harish_a/MS_CodeforGood_TrackB_Team8-2/backend/boroughs/Brooklyn/Brooklyn.csv",
    "Queens":        "/Users/harish_a/MS_CodeforGood_TrackB_Team8-2/backend/boroughs/Brooklyn/Brooklyn.csv",
    "The Bronx":     "/Users/harish_a/MS_CodeforGood_TrackB_Team8-2/backend/boroughs/Bronx/Bronx.csv",
    "Staten Island": "/Users/harish_a/MS_CodeforGood_TrackB_Team8-2/backend/boroughs/Staten Island/Staten Island.csv",
}


# ---------------------------------------------------------------------------
# Haversine distance (miles) between two lat/lng points
# ---------------------------------------------------------------------------

def haversine(lat1, lng1, lat2, lng2) -> float:
    R = 3958.8  # Earth radius in miles
    lat1, lng1, lat2, lng2 = map(radians, [lat1, lng1, lat2, lng2])
    dlat = lat2 - lat1
    dlng = lng2 - lng1
    a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlng / 2) ** 2
    return R * 2 * asin(sqrt(a))


# ---------------------------------------------------------------------------
# Load + combine borough CSVs
# ---------------------------------------------------------------------------

def load_boroughs() -> pd.DataFrame:
    frames = []
    for borough, filepath in BOROUGH_FILES.items():
        path = Path(filepath)
        if not path.exists():
            print(f"  Warning: {filepath} not found, skipping {borough}")
            continue
        df = pd.read_csv(path)
        df["borough"] = borough
        df["poverty_rate"] = BOROUGH_POVERTY_RATES[borough]
        frames.append(df)
        print(f"  Loaded {len(df):>4} resources from {filepath}")

    combined = pd.concat(frames, ignore_index=True)
    combined = combined.dropna(subset=["latitude", "longitude"])
    print(f"\n  Total resources with coordinates: {len(combined)}")
    return combined


# ---------------------------------------------------------------------------
# Distance to nearest pantry per resource
# (Each resource's nearest *other* pantry in the dataset)
# ---------------------------------------------------------------------------

def add_nearest_pantry_distance(df: pd.DataFrame) -> pd.DataFrame:
    """
    For each resource, find the distance in miles to the nearest
    *other* resource in the dataset.
    """
    print("Calculating distance to nearest pantry...")

    lats = df["latitude"].values
    lngs = df["longitude"].values
    distances = []

    for i, (lat, lng) in enumerate(zip(lats, lngs)):
        min_dist = float("inf")
        for j, (lat2, lng2) in enumerate(zip(lats, lngs)):
            if i == j:
                continue
            d = haversine(lat, lng, lat2, lng2)
            if d < min_dist:
                min_dist = d
        distances.append(round(min_dist, 3) if min_dist != float("inf") else None)

    df["distance_to_nearest_pantry_miles"] = distances
    return df


# ---------------------------------------------------------------------------
# Food Access Risk score
# ---------------------------------------------------------------------------

def add_risk_score(df: pd.DataFrame) -> pd.DataFrame:
    """
    Food Access Risk = poverty_rate × distance_to_nearest_pantry_miles
    Normalized 0–1 across all resources.
    """
    raw = df["poverty_rate"] * df["distance_to_nearest_pantry_miles"]
    df["food_access_risk_raw"] = raw.round(4)

    min_r, max_r = raw.min(), raw.max()
    df["food_access_risk"] = ((raw - min_r) / (max_r - min_r)).round(4)

    def tier(score):
        if pd.isna(score):  return "unknown"
        if score >= 0.75:   return "critical"
        if score >= 0.50:   return "high"
        if score >= 0.25:   return "moderate"
        return "low"

    df["risk_tier"] = df["food_access_risk"].apply(tier)
    return df


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    print("=" * 55)
    print("Food Access Risk — NYC Boroughs (hardcoded poverty rates)")
    print("=" * 55)

    # Load
    print("\nLoading CSVs...")
    df = load_boroughs()

    # Distance
    df = add_nearest_pantry_distance(df)

    # Risk score
    df = add_risk_score(df)
    for borough, group in df.groupby("borough"):
        filename = f"food_access_risk_{borough.lower().replace(' ', '_')}.csv"
        group.to_csv(filename, index=False)
        print(f"  Saved {filename} ({len(group)} rows)")

    # Save
    df.to_csv("food_access_risk.csv", index=False)
    print(f"\nSaved food_access_risk.csv ({len(df)} rows)")

    # Summary
    print("\n--- Risk Summary by Borough ---")
    summary = (
        df.groupby("borough")
        .agg(
            resources=("id", "count"),
            poverty_rate=("poverty_rate", "first"),
            avg_distance_miles=("distance_to_nearest_pantry_miles", "mean"),
            avg_risk_score=("food_access_risk", "mean"),
            critical=("risk_tier", lambda x: (x == "critical").sum()),
            high=("risk_tier", lambda x: (x == "high").sum()),
        )
        .round(3)
    )
    summary.to_csv("food_access_risk_summary.csv", index=False)

    print(summary.to_string())

    print("\n--- Top 10 Highest Risk Resources ---")
    top = df.nlargest(10, "food_access_risk")[
        ["name", "borough", "city", "poverty_rate",
         "distance_to_nearest_pantry_miles", "food_access_risk", "risk_tier"]
    ]
    print(top.to_string(index=False))


if __name__ == "__main__":
    main()