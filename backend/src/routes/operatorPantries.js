const { getSupabaseClient } = require("../lib/supabase");

const TARGET_NAMES = [
  "Salvation Army, Brownsville Corps - Food Pantry",
  "Met Council- Sephardic Bikur Holim",
  "St. Teresa of Avila Community Services",
  "Centro Evangelistico MMM Inc Community Food Pantry Program",
  "South Asian Council for Social Services Food Pantry",
];

const SELECT_COLS = [
  "id", "name", "description", "address_street1", "address_street2",
  "city", "state", "zip_code", "latitude", "longitude", "borough",
  "website", "phone", "confidence", "rating_average", "review_count",
  "subscription_count", "wait_time_minutes_avg", "tags", "tag_ids",
  "status", "appointment_required", "open_by_appointment",
  "skip_range_count", "next_occurrence_start", "raw",
].join(", ");

function computeCompleteness(row, raw) {
  const checks = [
    !!row.phone,
    !!row.website,
    !!row.description,
    Array.isArray(raw?.shifts) && raw.shifts.length > 0,
    Array.isArray(raw?.occurrences) && raw.occurrences.length > 0,
    Array.isArray(raw?.tags) && raw.tags.length > 0,
    Array.isArray(raw?.images) && raw.images.length > 0,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

function mapRow(row) {
  const raw = row.raw ?? {};
  const tags = Array.isArray(raw.tags) ? raw.tags.map((t) => t.name ?? t) : [];
  const hasShifts = Array.isArray(raw.shifts) && raw.shifts.length > 0;
  const hasOccurrences = Array.isArray(raw.occurrences) && raw.occurrences.length > 0;

  return {
    id: row.id,
    name: row.name,
    address: [row.address_street1, row.address_street2].filter(Boolean).join(", ")
      + (row.city ? `, ${row.city}` : "")
      + (row.state ? `, ${row.state}` : "")
      + (row.zip_code ? ` ${row.zip_code}` : ""),
    lat: row.latitude,
    lng: row.longitude,
    zipCode: row.zip_code,
    borough: row.borough,
    status: row.status ?? "PUBLISHED",
    rating: row.rating_average ?? 0,
    reviewCount: row.review_count ?? 0,
    subscriptionCount: row.subscription_count ?? 0,
    confidence: row.confidence ?? 0,
    waitTime: row.wait_time_minutes_avg ?? null,
    website: row.website ?? "",
    phone: row.phone ?? "",
    description: row.description ?? "",
    tags,
    hasShifts,
    hasOccurrences,
    appointmentRequired: row.appointment_required ?? false,
    completeness: computeCompleteness(row, raw),
  };
}

function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 3958.8;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function median(arr) {
  if (!arr.length) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

async function getOperatorPantries(req, res) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return res.status(503).json({ error: "Supabase not configured" });
  }

  try {
    const [targetResult, benchmarkResult] = await Promise.all([
      supabase
        .from("resources")
        .select(SELECT_COLS)
        .in("name", TARGET_NAMES)
        .eq("status", "PUBLISHED")
        .is("merged_to_resource_id", null),
      supabase
        .from("resources")
        .select("rating_average, review_count, subscription_count, confidence")
        .eq("status", "PUBLISHED")
        .is("merged_to_resource_id", null)
        .not("rating_average", "is", null),
    ]);

    if (targetResult.error) throw targetResult.error;
    if (benchmarkResult.error) throw benchmarkResult.error;

    const resources = (targetResult.data ?? []).map(mapRow);

    const allRated = benchmarkResult.data ?? [];
    const ratings = allRated.map((r) => r.rating_average).filter(Boolean);
    const reviews = allRated.map((r) => r.review_count ?? 0);
    const subs = allRated.map((r) => r.subscription_count ?? 0);
    const confs = allRated.map((r) => r.confidence ?? 0).filter((c) => c > 0);

    const avgRating = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
    const avgConf = confs.length ? confs.reduce((a, b) => a + b, 0) / confs.length : 0;
    const medReviews = median(reviews);
    const medSubs = median(subs);

    const benchmarks = {
      avgRating: Math.round(avgRating * 100) / 100,
      medianReviews: Math.round(medReviews),
      medianSubs: Math.round(medSubs),
      avgConfidence: Math.round(avgConf * 100) / 100,
      ratedCount: ratings.length,
      totalPublished: allRated.length,
      radarAvg: {
        rating: Math.round((avgRating / 5) * 100),
        reviews: Math.min(Math.round((medReviews / 50) * 100), 100),
        subscribers: Math.min(Math.round((medSubs / 200) * 100), 100),
        confidence: Math.round(avgConf * 100),
        schedule: 78,
      },
    };

    for (const r of resources) {
      const ratingRank = ratings.filter((v) => v < r.rating).length;
      r.ratingPercentile = Math.round((ratingRank / ratings.length) * 100);
      const reviewRank = reviews.filter((v) => v < r.reviewCount).length;
      r.reviewPercentile = Math.round((reviewRank / reviews.length) * 100);
      const subRank = subs.filter((v) => v < r.subscriptionCount).length;
      r.subPercentile = Math.round((subRank / subs.length) * 100);
    }

    res.json({ source: "supabase", resources, benchmarks });
  } catch (err) {
    console.error("[operator/pantries] Supabase error:", err.message ?? err);
    res.status(500).json({ error: err.message });
  }
}

async function getOperatorNeighborhood(req, res) {
  const { zip, lat, lng } = req.query;
  if (!zip) return res.status(400).json({ error: "zip is required" });

  const supabase = getSupabaseClient();
  if (!supabase) {
    return res.status(503).json({ error: "Supabase not configured" });
  }

  try {
    const { data: rows, error } = await supabase
      .from("resources")
      .select("id, name, rating_average, review_count, subscription_count, confidence, latitude, longitude, status, website, phone, description, raw")
      .eq("zip_code", zip)
      .eq("status", "PUBLISHED")
      .is("merged_to_resource_id", null);

    if (error) throw error;

    const refLat = parseFloat(lat) || 0;
    const refLng = parseFloat(lng) || 0;

    const neighbors = (rows ?? []).map((row) => {
      const raw = row.raw ?? {};
      const dist =
        refLat && refLng && row.latitude && row.longitude
          ? haversineDistance(refLat, refLng, row.latitude, row.longitude)
          : 0;

      return {
        id: row.id,
        name: row.name,
        rating: row.rating_average ?? 0,
        reviewCount: row.review_count ?? 0,
        subscriptionCount: row.subscription_count ?? 0,
        confidence: row.confidence ?? 0,
        distance: Math.round(dist * 100) / 100,
        completeness: computeCompleteness(row, raw),
      };
    });

    neighbors.sort((a, b) => a.distance - b.distance);

    res.json({ neighbors });
  } catch (err) {
    console.error("[operator/neighborhood]", err.message ?? err);
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getOperatorPantries, getOperatorNeighborhood };