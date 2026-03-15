const { getSupabaseClient } = require("../lib/supabase");
const { getZipGeo } = require("../data/zipGeo");

const PAGE_SIZE = 1000;

// Tag names we count as restrictive (ID, registration, etc.)
const RESTRICTIVE_TAGS = [
  "id required",
  "registration required",
  "appointment only",
  "proof of address required",
  "call in advance",
];

function normalizeTagName(t) {
  if (typeof t === "string") return t.toLowerCase().trim();
  if (t && typeof t.name === "string") return t.name.toLowerCase().trim();
  return "";
}

/**
 * Build access barriers array from list of resources (with raw.tags).
 */
function buildAccessBarriers(resources) {
  const countByTag = new Map();
  resources.forEach((r) => {
    const raw = r.raw || r;
    const tags = r.tags || r.tag_ids || raw.tags || raw.tag_ids || [];
    const list = Array.isArray(tags) ? tags : [];
    list.forEach((t) => {
      const name = normalizeTagName(t);
      if (!name) return;
      const key = name.replace(/\b\w/g, (c) => c.toUpperCase());
      countByTag.set(key, (countByTag.get(key) || 0) + 1);
    });
  });
  const total = resources.length;
  const barriers = [];
  const preferOrder = [
    "ID required",
    "First come, first serve",
    "Registration required",
    "Appointment only",
    "Proof of address required",
    "Fresh produce available",
  ];
  preferOrder.forEach((tag) => {
    const c = countByTag.get(tag) || 0;
    if (c > 0) {
      barriers.push({
        tag,
        count: c,
        pct: Math.round((c / total) * 100),
        restrictive: RESTRICTIVE_TAGS.some((x) => tag.toLowerCase().includes(x)),
      });
    }
  });
  // Add any other tags not in preferOrder
  countByTag.forEach((count, tag) => {
    if (!preferOrder.includes(tag)) {
      barriers.push({
        tag,
        count,
        pct: Math.round((count / total) * 100),
        restrictive: RESTRICTIVE_TAGS.some((x) => tag.toLowerCase().includes(x)),
      });
    }
  });
  return barriers.sort((a, b) => b.count - a.count);
}

/**
 * Normalize resource type for grouping (resource_type_name or raw.resourceType).
 */
function getResourceTypeName(r) {
  const raw = r.raw || r;
  const name = r.resource_type_name || raw.resource_type_name || raw.resourceType?.name || raw.resourceType?.id;
  return (name || "").toUpperCase().replace(/\s+/g, "_");
}

async function getGovData(req, res) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return res.status(503).json({
      error: "Supabase not configured",
      hint: "Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to backend/.env",
    });
  }

  try {
    // ── 1) Fetch all resources (published + unavailable) for counts and tags ──
    const resourceRows = [];
    let from = 0;
    let hasMore = true;
    const resourceQuery = supabase
      .from("resources")
      .select("id, status, zip_code, borough, resource_type_name, rating_average, raw")
      .or("merged_to_resource_id.is.null,merged_to_resource_id.eq.")
      .order("id", { ascending: true });

    while (hasMore) {
      const to = from + PAGE_SIZE - 1;
      const { data, error } = await resourceQuery.range(from, to);
      if (error) throw error;
      const page = data || [];
      resourceRows.push(...page);
      hasMore = page.length === PAGE_SIZE;
      from += PAGE_SIZE;
    }

    const totalResources = resourceRows.length;
    const published = resourceRows.filter((r) => (r.status || "").toUpperCase() === "PUBLISHED");
    const publishedCount = published.length;
    const unavailableCount = totalResources - publishedCount;
    const unavailableRate = totalResources ? Math.round((unavailableCount / totalResources) * 100) : 0;

    const withRating = published.filter((r) => r.rating_average != null && !Number.isNaN(Number(r.rating_average)));
    const totalRated = withRating.length;
    const avgRating = totalRated
      ? Math.round(withRating.reduce((s, r) => s + Number(r.rating_average), 0) / totalRated * 100) / 100
      : 0;

    const typeCounts = {};
    published.forEach((r) => {
      const t = getResourceTypeName(r) || "OTHER";
      const key = t === "FOOD_PANTRY" ? "foodPantry" : t === "SOUP_KITCHEN" ? "soupKitchen" : t === "COMMUNITY_FRIDGE" ? "communityFridge" : t === "MEAL_DELIVERY" ? "mealDelivery" : "other";
      typeCounts[key] = (typeCounts[key] || 0) + 1;
    });
    if (!typeCounts.other) typeCounts.other = 0;

    const boroughCounts = {};
    resourceRows.forEach((r) => {
      const b = (r.borough || "Unknown").trim();
      if (!b) return;
      const key = b === "Staten Island" ? "StatenIsland" : b;
      if (!boroughCounts[key]) boroughCounts[key] = { total: 0, published: 0, unavailable: 0 };
      boroughCounts[key].total += 1;
      if ((r.status || "").toUpperCase() === "PUBLISHED") boroughCounts[key].published += 1;
      else boroughCounts[key].unavailable += 1;
    });

    // ── 2) Fetch zip_demographics ──
    const { data: zipRows, error: zipError } = await supabase
      .from("zip_demographics")
      .select("zip_code, borough, population, median_income, poverty_rate_pct, demand_proxy, pantry_count, total_resources, pantries_per_10k, demand_proxy_per_pantry");

    if (zipError) throw zipError;
    const zips = zipRows || [];

    // Underserved: high poverty and/or high demand per pantry (low coverage)
    const needScore = (row) => {
      const poverty = Number(row.poverty_rate_pct) || 0;
      const perPantry = Number(row.demand_proxy_per_pantry) || 0;
      const per10k = Number(row.pantries_per_10k) || 0;
      return poverty * 0.5 + Math.min(perPantry / 400, 40) + (per10k < 1 ? 15 : per10k < 2 ? 5 : 0);
    };

    const underservedFromZips = zips
      .filter((z) => {
        const pop = Number(z.population) || 0;
        const pantryCount = Number(z.pantry_count) || 0;
        const poverty = Number(z.poverty_rate_pct) || 0;
        return pop > 0 && (poverty >= 18 || (pantryCount > 0 && needScore(z) >= 45));
      })
      .sort((a, b) => needScore(b) - needScore(a))
      .slice(0, 10);

    const underservedZips = underservedFromZips.map((z) => {
      const geo = getZipGeo(z.zip_code);
      const poverty = Number(z.poverty_rate_pct) || 0;
      const population = Number(z.population) || 0;
      const pantryCount = Number(z.pantry_count) || 0;
      const demandProxy = Number(z.demand_proxy) || 0;
      const snapPerPantry = pantryCount > 0 ? Math.round((z.demand_proxy_per_pantry || 0)) : 0;
      return {
        zip: String(z.zip_code),
        neighborhood: geo.neighborhood,
        borough: z.borough || "Unknown",
        poverty: Math.round(poverty * 100) / 100,
        foodInsecurity: demandProxy,
        population,
        pantryCount,
        snapPerPantry,
        needScore: Math.round(needScore(z) * 10) / 10,
        medianIncome: Number(z.median_income) || null,
        lat: geo.lat,
        lng: geo.lng,
        bounds: geo.bounds,
      };
    });

    const zeroPantryZips = zips
      .filter((z) => (Number(z.pantry_count) || 0) === 0 && (Number(z.population) || 0) > 0)
      .sort((a, b) => (Number(b.population) || 0) - (Number(a.population) || 0))
      .slice(0, 5)
      .map((z) => {
        const geo = getZipGeo(z.zip_code);
        const poverty = Number(z.poverty_rate_pct) || 0;
        const demandProxy = Number(z.demand_proxy) || 0;
        return {
          zip: String(z.zip_code),
          neighborhood: geo.neighborhood,
          borough: z.borough || "Unknown",
          poverty: Math.round(poverty * 100) / 100,
          foodInsecurity: demandProxy,
          population: Number(z.population) || 0,
          pantryCount: 0,
          needScore: Math.round(needScore(z) * 10) / 10,
          medianIncome: Number(z.median_income) || null,
          lat: geo.lat,
          lng: geo.lng,
          bounds: geo.bounds,
        };
      });

    const underservedZipCodes = new Set(underservedZips.map((z) => z.zip));
    const inUnderserved = resourceRows.filter((r) => underservedZipCodes.has(String(r.zip_code || "").trim()));
    const publishedInUnderserved = inUnderserved.filter((r) => (r.status || "").toUpperCase() === "PUBLISHED").length;
    const unavailableInUnderserved = inUnderserved.length - publishedInUnderserved;
    const pctOfflineInUnderserved = inUnderserved.length
      ? Math.round((unavailableInUnderserved / inUnderserved.length) * 100)
      : 0;

    const barriers = buildAccessBarriers(published);
    const totalPublished = published.length;

    const communityFridgeType = /COMMUNITY_FRIDGE|FRIDGE/i;
    const fridgeResources = published.filter((r) => communityFridgeType.test(getResourceTypeName(r)));
    const fridgeZips = new Map();
    fridgeResources.forEach((r) => {
      const zip = String(r.zip_code || "").trim();
      if (!zip) return;
      fridgeZips.set(zip, (fridgeZips.get(zip) || 0) + 1);
    });
    const totalFridges = fridgeResources.length;
    const inUnderservedZips = fridgeResources.filter((r) => underservedZipCodes.has(String(r.zip_code || "").trim())).length;
    const pctMisaligned = totalFridges ? Math.round(((totalFridges - inUnderservedZips) / totalFridges) * 100) : 0;
    const topZips = Array.from(fridgeZips.entries())
      .map(([zip, count]) => ({ zip, count, underserved: underservedZipCodes.has(zip) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const boroughStats = {};
    ["Manhattan", "Brooklyn", "Queens", "Bronx", "Staten Island"].forEach((b) => {
      const key = b === "Staten Island" ? "StatenIsland" : b;
      const stats = boroughCounts[key] || { total: 0, published: 0, unavailable: 0 };
      boroughStats[key] = stats;
    });

    res.json({
      systemStats: {
        totalResources,
        publishedResources: publishedCount,
        unavailableResources: unavailableCount,
        unavailableRate,
        totalRated,
        avgRating,
        resourceTypes: {
          foodPantry: typeCounts.foodPantry || 0,
          soupKitchen: typeCounts.soupKitchen || 0,
          communityFridge: typeCounts.communityFridge || 0,
          mealDelivery: typeCounts.mealDelivery || 0,
          snapEbt: typeCounts.snapEbt || 0,
        },
      },
      underservedZips,
      zeroPantryZips,
      reliability: {
        unavailableInUnderservedZips: unavailableInUnderserved,
        publishedInUnderservedZips: publishedInUnderserved,
        pctOfflineInUnderserved,
      },
      accessBarriers: { totalPublished, barriers },
      communityFridges: {
        total: totalFridges,
        inUnderservedZips,
        pctMisaligned,
        topZips,
      },
      boroughStats,
    });
  } catch (err) {
    console.error("[gov/data] error:", err.message || err);
    res.status(502).json({ error: err.message || "Failed to load government data" });
  }
}

module.exports = { getGovData };
