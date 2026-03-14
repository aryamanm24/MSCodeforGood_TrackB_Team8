// ─── MOCK DATA — non-govData sections are demo/UI placeholders ───────────────
// govData section: ALL REAL values computed from:
//   • all_resources_2.json        (1,976 LemonTree resources, ACS 2024)
//   • nyc_zip_demographics.json   (169 NYC ZIP codes, ACS 2024)
//   • ALICE_filtered_data.csv     (165 NYC ZIP codes, United Way ALICE 2024)

export const resources = [
  {
    id: "res_001",
    name: "Highland Park Food Bank",
    type: "FOOD_PANTRY",
    lat: 40.718, lng: -73.992,
    rating: 4.5, waitTime: 12, reviews: 78, confidence: 0.92,
    address: "142 Highland Ave, New York, NY 10002",
    zipCode: "10002",
    tags: ["Fresh produce", "Canned goods", "Baby items"],
    ratingTrend: [4.1, 4.2, 4.3, 4.4, 4.5, 4.5],
    waitTrend: [15, 14, 13, 12, 12, 12],
    gotHelpRate: 0.94, infoAccuracy: 0.91,
    monthLabels: ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar"],
  },
  {
    id: "res_002",
    name: "Bayview Family Pantry",
    type: "FOOD_PANTRY",
    lat: 40.708, lng: -74.005,
    rating: 3.3, waitTime: 38, reviews: 41, confidence: 0.88,
    address: "205 Canal Street, New York, NY 10013",
    zipCode: "10013",
    tags: ["ID required"],
    ratingTrend: [3.5, 3.4, 3.4, 3.3, 3.3, 3.3],
    waitTrend: [30, 33, 35, 37, 38, 38],
    gotHelpRate: 0.74, infoAccuracy: 0.61,
    monthLabels: ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar"],
    status: "PUBLISHED", subscriptionCount: 30,
    hasShifts: true, hasOccurrences: true,
    website: "", phone: "(347) 856-8500",
    openByAppointment: false, appointmentRequired: false,
    usageLimitCount: null, usageLimitInterval: "", regionsServed: [],
    subscriptionTrend: [
      { month: "Oct", count: 18 }, { month: "Nov", count: 21 },
      { month: "Dec", count: 24 }, { month: "Jan", count: 26 },
      { month: "Feb", count: 28 }, { month: "Mar", count: 30 },
    ],
  },
  {
    id: "res_003",
    name: "Mission Street Pantry",
    type: "FOOD_PANTRY",
    lat: 40.713, lng: -73.998,
    rating: 3.4, waitTime: 35, reviews: 52, confidence: 0.81,
    address: "88 Mission St, New York, NY 10004",
    zipCode: "10004",
    tags: ["Fresh produce", "Dairy"],
    ratingTrend: [3.6, 3.5, 3.5, 3.4, 3.4, 3.4],
    waitTrend: [28, 30, 32, 34, 35, 35],
    gotHelpRate: 0.79, infoAccuracy: 0.72,
    monthLabels: ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar"],
  },
  {
    id: "res_004",
    name: "Riverside Kitchen",
    type: "SOUP_KITCHEN",
    lat: 40.722, lng: -73.985,
    rating: 4.1, waitTime: 20, reviews: 61, confidence: 0.88,
    address: "310 Riverside Dr, New York, NY 10025",
    zipCode: "10025",
    tags: ["Hot meals", "Vegetarian options"],
    ratingTrend: [3.9, 3.9, 4.0, 4.0, 4.1, 4.1],
    waitTrend: [24, 22, 21, 20, 20, 20],
    gotHelpRate: 0.91, infoAccuracy: 0.88,
    monthLabels: ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar"],
  },
  {
    id: "res_005",
    name: "South Ave Meals",
    type: "SOUP_KITCHEN",
    lat: 40.703, lng: -74.012,
    rating: 2.5, waitTime: 48, reviews: 32, confidence: 0.65,
    address: "45 South Ave, New York, NY 10006",
    zipCode: "10006",
    tags: ["Hot meals"],
    ratingTrend: [2.9, 2.8, 2.7, 2.6, 2.5, 2.5],
    waitTrend: [40, 42, 44, 46, 48, 48],
    gotHelpRate: 0.58, infoAccuracy: 0.45,
    monthLabels: ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar"],
  },
  {
    id: "res_006",
    name: "Northgate Community Pantry",
    type: "FOOD_PANTRY",
    lat: 40.725, lng: -74.001,
    rating: 4.2, waitTime: 18, reviews: 45, confidence: 0.89,
    address: "15 Northgate Blvd, New York, NY 10014",
    zipCode: "10014",
    tags: ["Fresh produce", "Canned goods", "Hygiene products"],
    ratingTrend: [3.8, 3.9, 4.0, 4.1, 4.2, 4.2],
    waitTrend: [22, 20, 19, 18, 18, 18],
    gotHelpRate: 0.92, infoAccuracy: 0.95,
    monthLabels: ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar"],
  },
  {
    id: "res_007",
    name: "Westside Food Share",
    type: "FOOD_PANTRY",
    lat: 40.711, lng: -74.015,
    rating: 3.9, waitTime: 22, reviews: 33, confidence: 0.83,
    address: "220 West Side Hwy, New York, NY 10013",
    zipCode: "10013",
    tags: ["Canned goods", "Bread", "Fresh produce"],
    ratingTrend: [3.7, 3.7, 3.8, 3.8, 3.9, 3.9],
    waitTrend: [25, 24, 23, 22, 22, 22],
    gotHelpRate: 0.86, infoAccuracy: 0.82,
    monthLabels: ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar"],
  },
  {
    id: "res_008",
    name: "Civic District Meals",
    type: "SOUP_KITCHEN",
    lat: 40.706, lng: -73.997,
    rating: 2.8, waitTime: 42, reviews: 67, confidence: 0.72,
    address: "55 Civic Center Dr, New York, NY 10007",
    zipCode: "10007",
    tags: ["Hot meals", "Coffee"],
    ratingTrend: [3.1, 3.0, 2.9, 2.9, 2.8, 2.8],
    waitTrend: [35, 37, 39, 40, 42, 42],
    gotHelpRate: 0.66, infoAccuracy: 0.54,
    monthLabels: ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar"],
  },
];

export const censusTracts = [
  { id: "t1", name: "Northgate",      bounds: [[40.723,-74.008],[40.728,-73.995]], povertyRate: 0.18, population: 6200,  medianIncome: 42000 },
  { id: "t2", name: "Highland Park",  bounds: [[40.716,-73.995],[40.723,-73.982]], povertyRate: 0.12, population: 8100,  medianIncome: 55000 },
  { id: "t3", name: "Mission",        bounds: [[40.710,-74.003],[40.716,-73.993]], povertyRate: 0.28, population: 9400,  medianIncome: 31000 },
  { id: "t4", name: "Westside",       bounds: [[40.708,-74.018],[40.714,-74.003]], povertyRate: 0.35, population: 5800,  medianIncome: 26000 },
  { id: "t5", name: "Eastside",       bounds: [[40.710,-73.993],[40.716,-73.982]], povertyRate: 0.22, population: 7200,  medianIncome: 38000 },
  { id: "t6", name: "Riverside",      bounds: [[40.719,-73.990],[40.725,-73.980]], povertyRate: 0.08, population: 4500,  medianIncome: 68000 },
  { id: "t7", name: "Bayview",        bounds: [[40.703,-74.012],[40.710,-74.000]], povertyRate: 0.42, population: 11200, medianIncome: 22000 },
  { id: "t8", name: "Civic District", bounds: [[40.703,-74.000],[40.710,-73.990]], povertyRate: 0.31, population: 8800,  medianIncome: 29000 },
  { id: "t9", name: "South West",     bounds: [[40.698,-74.018],[40.703,-74.005]], povertyRate: 0.48, population: 12400, medianIncome: 19000, isGapZone: true },
  { id:"t10", name: "Harbor",         bounds: [[40.698,-73.995],[40.705,-73.980]], povertyRate: 0.15, population: 5100,  medianIncome: 52000 },
];

export const nearbyPantries = [
  { name: "Trinity Church Compassion Meals",         distance: 0.05, rating: 3.0,  reviewCount: 4,  subscriptionCount: 9,   status: "PUBLISHED", confidence: 0.88, tags: [] },
  { name: "Trinity Commons Compassion Market",       distance: 0.12, rating: 2.67, reviewCount: 7,  subscriptionCount: 38,  status: "PUBLISHED", confidence: 0.85, tags: ["ID required", "Must bring own bags/cart", "First come first serve", "Schedule via Plentiful app"] },
  { name: "NYCLK 34 Hillside Ave",                  distance: 0.21, rating: 2.0,  reviewCount: 3,  subscriptionCount: 20,  status: "PUBLISHED", confidence: 0.74, tags: ["First come first serve"] },
  { name: "Trinity Church Brown Bag Lunch Ministry", distance: 0.29, rating: 2.5,  reviewCount: 3,  subscriptionCount: 19,  status: "PUBLISHED", confidence: 0.52, tags: ["Call in advance"] },
  { name: "Met Council - SNAP Assistance",           distance: 0.34, rating: 2.37, reviewCount: 29, subscriptionCount: 161, status: "PUBLISHED", confidence: 0.80, tags: ["Call in advance"] },
  { name: "Public Health Solutions",                 distance: 0.72, rating: 2.22, reviewCount: 24, subscriptionCount: 149, status: "PUBLISHED", confidence: 0.79, tags: [] },
  { name: "Project Hospitality - Canal Street",      distance: 0.95, rating: 2.8,  reviewCount: 7,  subscriptionCount: 31,  status: "PUBLISHED", confidence: 0.99, tags: [] },
];

export const donorPortfolio = {
  donorName: "Metro Community Foundation",
  totalInvestment: 125000,
  fundedResourceIds: ["res_001", "res_002", "res_006"],
  periodStart: "2025-09-01",
  periodEnd: "2026-03-01",
  impactStats: { familiesReached: 3247, satisfactionDelta: 0.18, waitTimeDelta: -0.22, resourcesAdded: 3 },
  beforeMetrics:  { avgRating: 3.2, avgWait: 36, gotHelpRate: 0.68, resourceCount: 5 },
  currentMetrics: { avgRating: 3.8, avgWait: 28, gotHelpRate: 0.82, resourceCount: 8 },
};

export const demandEstimates = [];

export const manhattanBenchmarks = {
  avgRating: 2.38,
  medianReviews: 7,
  medianSubs: 28,
  totalPantries: 388,
  ratedPantries: 201,
  radarAvg: { rating: 48, reviews: 14, subscribers: 14, completeness: 75, schedule: 61 },
};

export const demoPantries = [
  {
    name: "Bayview Family Pantry",
    address: "205 Canal Street, New York, NY 10013",
    lat: 40.7074, lng: -74.0113,
    status: "PUBLISHED", rating: 3.3, reviewCount: 41, subscriptionCount: 30,
    confidence: 0.88, hasShifts: true, hasOccurrences: true,
    website: "", phone: "(347) 856-8500",
    openByAppointment: false, appointmentRequired: false, usageLimitCount: null,
    tags: ["ID required"],
    ratingPercentile: 100, reviewPercentile: 97, subPercentile: 52,
  },
  {
    name: "Met Council - SNAP Assistance",
    address: "80 Maiden Lane, New York, NY 10038",
    lat: 40.7071, lng: -74.0075,
    status: "PUBLISHED", rating: 2.37, reviewCount: 29, subscriptionCount: 161,
    confidence: 0.80, hasShifts: true, hasOccurrences: true,
    website: "", phone: "",
    openByAppointment: false, appointmentRequired: false, usageLimitCount: null,
    tags: ["Call in advance"],
    ratingPercentile: 45, reviewPercentile: 88, subPercentile: 91,
  },
  {
    name: "Trinity Commons Compassion Market",
    address: "74 Trinity Place, New York, NY 10006",
    lat: 40.7081, lng: -74.0134,
    status: "PUBLISHED", rating: 2.67, reviewCount: 7, subscriptionCount: 38,
    confidence: 0.85, hasShifts: true, hasOccurrences: false,
    website: "", phone: "",
    openByAppointment: false, appointmentRequired: false, usageLimitCount: null,
    tags: ["ID required", "Must bring own bags/cart", "First come first serve"],
    ratingPercentile: 62, reviewPercentile: 52, subPercentile: 61,
  },
  {
    name: "Trinity Church Brown Bag Lunch Ministry",
    address: "76 Trinity Place, New York, NY 10006",
    lat: 40.7083, lng: -74.0130,
    status: "PUBLISHED", rating: 2.5, reviewCount: 3, subscriptionCount: 19,
    confidence: 0.52, hasShifts: true, hasOccurrences: false,
    website: "", phone: "",
    openByAppointment: false, appointmentRequired: true, usageLimitCount: null,
    tags: ["Call in advance"],
    ratingPercentile: 55, reviewPercentile: 28, subPercentile: 38,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// govData — ALL REAL VALUES
// Sources:
//   • all_resources_2.json        — 1,976 LemonTree resources
//   • nyc_zip_demographics.json   — 169 NYC ZIP codes, ACS 2024
//   • ALICE_filtered_data.csv     — United Way ALICE 2024, 165 NYC ZIP codes
//
// ALICE = Asset Limited, Income Constrained, Employed.
// Households above the federal poverty line but below the NYC Household
// Survival Budget — the "missing middle" invisible to SNAP-based metrics.
//
// Key insight: SNAP eligibility ≈ poverty line (~30–38% of these ZIPs).
// ALICE threshold captures 60–84% of the same ZIPs. The gap between them
// is the population that needs food assistance but can't access most programs.
// ─────────────────────────────────────────────────────────────────────────────
export const govData = {

  systemStats: {
    totalResources: 1976,
    publishedResources: 1343,
    unavailableResources: 633,
    unavailableRate: 32,
    // Note: max observed rating in dataset is 3.0 — no resource exceeds 3.0.
    // UI should not claim "X resources rated above 3.0" — use "≥ 3.0" or remove.
    totalRated: 1097,
    avgRating: 2.29,
    resourceTypes: {
      foodPantry: 1636,
      soupKitchen: 214,
      communityFridge: 84,
      mealDelivery: 14,
      snapEbt: 9,
    },
  },

  // ── ALICE city-wide summary ───────────────────────────────────────────────
  // Source: ALICE_filtered_data.csv — 165 ZIP codes, United Way 2024
  aliceSummary: {
    totalHouseholds: 3183081,
    householdsBelowAlice: 1775877,  // 55.8% of all households
    pctBelowAlice: 55.8,
    // Borough breakdown (avg % below ALICE threshold)
    boroughs: [
      { borough: "Bronx",      avgAlicePct: 69.8, totalHH: 517431, belowAliceHH: 373673 },
      { borough: "Brooklyn",   avgAlicePct: 53.5, totalHH: 994450, belowAliceHH: 535552 },
      { borough: "Manhattan",  avgAlicePct: 48.5, totalHH: 688101, belowAliceHH: 350569 },
      { borough: "Queens",     avgAlicePct: 51.3, totalHH: 643376, belowAliceHH: 346866 },
    ],
    // Key insight for government agencies:
    // SNAP recipients per pantry understates true demand because SNAP only
    // covers households at/below the federal poverty line (~30–38% in these ZIPs).
    // ALICE captures 60–84% of the same households — a 40–50 percentage point gap
    // representing the "missing middle": working households that earn too much for
    // SNAP but still cannot afford NYC's basic cost of living.
  },

  // ── Top 8 highest-need ZIPs city-wide ────────────────────────────────────
  // Sorted by snap_recipients_per_pantry descending.
  // ALICE fields added: alicePct, aliceHouseholds, alicePerPantry, aliceGap.
  // aliceGap = alicePct - poverty (percentage points of "missing middle").
  // Source: nyc_zip_demographics.json (is_underserved=true, 32 total ZIPs)
  //         + ALICE_filtered_data.csv
  underservedZips: [
    {
      zip: "11219", borough: "Brooklyn",
      neighborhood: "Borough Park / Sunset Park",
      poverty: 33.0, foodInsecurity: 43519, population: 94196,
      pantryCount: 3, snapPerPantry: 14506, needScore: 72.5,
      medianIncome: 58347, lat: 40.6350, lng: -73.9929,
      alicePct: 68, aliceHouseholds: 16644, alicePerPantry: 5548, aliceGap: 35.0,
    },
    {
      zip: "11223", borough: "Brooklyn",
      neighborhood: "Gravesend / Homecrest",
      poverty: 21.3, foodInsecurity: 23285, population: 78093,
      pantryCount: 3, snapPerPantry: 7762, needScore: 60.7,
      medianIncome: 63368, lat: 40.5962, lng: -73.9760,
      alicePct: 60, aliceHouseholds: 15860, alicePerPantry: 5287, aliceGap: 38.7,
    },
    {
      zip: "10472", borough: "Bronx",
      neighborhood: "Soundview / Bruckner",
      poverty: 34.2, foodInsecurity: 30615, population: 64011,
      pantryCount: 5, snapPerPantry: 6123, needScore: 76.7,
      medianIncome: 41039, lat: 40.8356, lng: -73.8722,
      alicePct: 77, aliceHouseholds: 16902, alicePerPantry: 3380, aliceGap: 42.8,
    },
    {
      zip: "11354", borough: "Queens",
      neighborhood: "Flushing / Murray Hill",
      poverty: 20.3, foodInsecurity: 15038, population: 53028,
      pantryCount: 3, snapPerPantry: 5013, needScore: 57.2,
      medianIncome: 66010, lat: 40.7653, lng: -73.8295,
      alicePct: 65, aliceHouseholds: 13829, alicePerPantry: 4610, aliceGap: 44.7,
    },
    {
      zip: "10460", borough: "Bronx",
      neighborhood: "West Farms / Tremont",
      poverty: 34.2, foodInsecurity: 28451, population: 59396,
      pantryCount: 6, snapPerPantry: 4742, needScore: 76.8,
      medianIncome: 36309, lat: 40.8399, lng: -73.8839,
      alicePct: 79, aliceHouseholds: 17960, alicePerPantry: 2993, aliceGap: 44.8,
    },
    {
      zip: "10458", borough: "Bronx",
      neighborhood: "Belmont / East Tremont",
      poverty: 31.3, foodInsecurity: 32850, population: 74898,
      pantryCount: 7, snapPerPantry: 4693, needScore: 73.3,
      medianIncome: 40800, lat: 40.8607, lng: -73.8904,
      alicePct: 80, aliceHouseholds: 23085, alicePerPantry: 3298, aliceGap: 48.7,
    },
    {
      zip: "10453", borough: "Bronx",
      neighborhood: "Morris Heights / University Heights",
      poverty: 37.9, foodInsecurity: 40472, population: 76282,
      pantryCount: 9, snapPerPantry: 4497, needScore: 79.6,
      medianIncome: 33186, lat: 40.8517, lng: -73.9131,
      alicePct: 80, aliceHouseholds: 22770, alicePerPantry: 2530, aliceGap: 42.1,
    },
    {
      zip: "10029", borough: "Manhattan",
      neighborhood: "East Harlem",
      poverty: 31.0, foodInsecurity: 33593, population: 77447,
      pantryCount: 8, snapPerPantry: 4199, needScore: 73.1,
      medianIncome: 38695, lat: 40.7941, lng: -73.9421,
      alicePct: 79, aliceHouseholds: 26147, alicePerPantry: 3268, aliceGap: 48.0,
    },
  ],

  // ── ZIP codes with zero food pantries ────────────────────────────────────
  // Source: nyc_zip_demographics.json — pantry_count=0, food_insecurity_est>500
  zeroPantryZips: [
    {
      zip: "10016", borough: "Manhattan",
      neighborhood: "Murray Hill / Kips Bay",
      poverty: 10.8, foodInsecurity: 7996, population: 52971,
      pantryCount: 0, needScore: 38, medianIncome: 140381,
      lat: 40.7445, lng: -73.9781,
    },
    {
      zip: "10019", borough: "Manhattan",
      neighborhood: "Hell's Kitchen / Midtown West",
      poverty: 10.2, foodInsecurity: 6389, population: 44942,
      pantryCount: 0, needScore: 35, medianIncome: 128559,
      lat: 40.7634, lng: -73.9823,
    },
    {
      zip: "10038", borough: "Manhattan",
      neighborhood: "Financial District / Fulton",
      poverty: 19.4, foodInsecurity: 6031, population: 22235,
      pantryCount: 0, needScore: 45, medianIncome: 105419,
      lat: 40.7088, lng: -74.0063,
    },
    {
      zip: "11105", borough: "Queens",
      neighborhood: "Astoria / Ditmars",
      poverty: 9.2, foodInsecurity: 4891, population: 37936,
      pantryCount: 0, needScore: 32, medianIncome: 102012,
      lat: 40.7768, lng: -73.9132,
    },
  ],

  // ── Reliability in underserved ZIPs ──────────────────────────────────────
  // 476 total resources across 32 underserved ZIPs
  reliability: {
    unavailableInUnderservedZips: 198,
    publishedInUnderservedZips: 278,
    pctOfflineInUnderserved: 42,
  },

  // ── Access barriers ───────────────────────────────────────────────────────
  // Tag frequency across 1,343 PUBLISHED resources — verified March 2026
  accessBarriers: {
    totalPublished: 1343,
    barriers: [
      { tag: "ID required",               count: 413, pct: 31, restrictive: true  },
      { tag: "First come, first serve",   count: 191, pct: 14, restrictive: false },
      { tag: "Registration required",     count: 163, pct: 12, restrictive: true  },
      { tag: "Must bring own bags/cart",  count: 106, pct:  8, restrictive: false },
      { tag: "Proof of address required", count:  63, pct:  5, restrictive: true  },
      { tag: "Plentiful app required",    count:  41, pct:  3, restrictive: true  },
      { tag: "Seniors only",             count:  37, pct:  3, restrictive: true  },
      { tag: "Proof of income required",  count:  15, pct:  1, restrictive: true  },
      { tag: "Fresh produce available",   count:  14, pct:  1, restrictive: false },
      { tag: "Kosher food available",     count:  19, pct:  1, restrictive: false },
      { tag: "Halal food available",      count:   4, pct:  0, restrictive: false },
    ],
  },

  // ── Community fridge placement ────────────────────────────────────────────
  // resourceType.id === "COMMUNITY_FRIDGE" cross-ref with is_underserved ZIPs
  // 22 of 84 fridges (26%) in underserved ZIPs — 62 (74%) are not
  communityFridges: {
    total: 84,
    inUnderservedZips: 22,
    pctMisaligned: 74,
    topZips: [
      { zip: "11221", count: 5, underserved: false },
      { zip: "11206", count: 4, underserved: true  },
      { zip: "11105", count: 3, underserved: false },
      { zip: "11231", count: 3, underserved: false },
      { zip: "11211", count: 3, underserved: true  },
      { zip: "11201", count: 3, underserved: false },
      { zip: "11216", count: 3, underserved: false },
    ],
  },
};