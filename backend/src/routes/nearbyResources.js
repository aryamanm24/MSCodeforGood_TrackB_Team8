const LEMONTREE_API = "https://platform.foodhelpline.org/api/resources";

/**
 * GET /api/resources/nearby?lat=40.7128&lng=-74.0060&take=20
 * Proxies to Lemontree API and returns a slim list of resources for the feedback form picker.
 */
async function getNearbyResources(req, res) {
  const lat = req.query.lat;
  const lng = req.query.lng;
  const take = Math.min(parseInt(req.query.take, 10) || 20, 50);

  if (lat == null || lat === "" || lng == null || lng === "") {
    return res.status(400).json({
      error: "lat and lng query parameters are required",
    });
  }

  const numLat = parseFloat(lat);
  const numLng = parseFloat(lng);
  if (Number.isNaN(numLat) || Number.isNaN(numLng)) {
    return res.status(400).json({ error: "lat and lng must be numbers" });
  }

  try {
    const response = await fetch(
      `${LEMONTREE_API}?lat=${encodeURIComponent(numLat)}&lng=${encodeURIComponent(numLng)}&take=${take}`
    );
    const data = await response.json();
    const inner = data?.json ?? data;
    const resources = inner?.resources ?? [];

    const slim = resources.map((r) => ({
      id: r.id,
      name: r.name ?? "",
      addressStreet1: r.addressStreet1 ?? null,
      city: r.city ?? null,
      state: r.state ?? null,
      zipCode: r.zipCode ?? null,
      latitude: r.latitude ?? null,
      longitude: r.longitude ?? null,
    }));

    res.json(slim);
  } catch (err) {
    console.error("[GET /api/resources/nearby]", err.message);
    res.status(502).json({
      error: "Failed to fetch nearby resources",
      detail: err.message,
    });
  }
}

module.exports = { getNearbyResources };