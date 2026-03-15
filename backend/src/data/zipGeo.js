/**
 * Static NYC ZIP → geo (lat, lng, bounds) and display name.
 * zip_demographics has no geometry; we use this for map overlays.
 * Bounds are [south, west], [north, east] for L.rectangle.
 */
const ZIP_GEO = {
  "10029": { lat: 40.7918, lng: -73.9440, bounds: [[40.778, -73.957], [40.800, -73.933]], neighborhood: "East Harlem / Upper East Side" },
  "10030": { lat: 40.8178, lng: -73.9437, bounds: [[40.810, -73.952], [40.825, -73.933]], neighborhood: "Central Harlem North" },
  "10039": { lat: 40.8280, lng: -73.9393, bounds: [[40.818, -73.948], [40.838, -73.930]], neighborhood: "Washington Heights" },
  "10031": { lat: 40.8234, lng: -73.9500, bounds: [[40.815, -73.963], [40.832, -73.944]], neighborhood: "Hamilton Heights" },
  "10032": { lat: 40.8368, lng: -73.9400, bounds: [[40.829, -73.955], [40.845, -73.936]], neighborhood: "Washington Heights South" },
  "10038": { lat: 40.7077, lng: -74.0023, bounds: [[40.700, -74.010], [40.715, -73.993]], neighborhood: "Financial District / Fulton" },
  "10016": { lat: 40.7462, lng: -73.9817, bounds: [[40.739, -73.991], [40.753, -73.971]], neighborhood: "Murray Hill / Kip's Bay" },
  "11221": { lat: 40.6905, lng: -73.9274, bounds: [[40.682, -73.938], [40.698, -73.916]], neighborhood: "Bushwick" },
  "11206": { lat: 40.7018, lng: -73.9422, bounds: [[40.694, -73.952], [40.708, -73.932]], neighborhood: "Bushwick / Williamsburg" },
  "11231": { lat: 40.6783, lng: -74.0092, bounds: [[40.670, -74.018], [40.686, -74.000]], neighborhood: "Carroll Gardens" },
  "11216": { lat: 40.6805, lng: -73.9498, bounds: [[40.672, -73.960], [40.688, -73.940]], neighborhood: "Crown Heights" },
  "10454": { lat: 40.8055, lng: -73.9182, bounds: [[40.798, -73.928], [40.812, -73.908]], neighborhood: "Mott Haven" },
};

function getZipGeo(zipCode) {
  const z = String(zipCode).trim();
  return ZIP_GEO[z] || {
    lat: 40.7128,
    lng: -74.006,
    bounds: [[40.70, -74.02], [40.73, -73.99]],
    neighborhood: `ZIP ${z}`,
  };
}

module.exports = { getZipGeo, ZIP_GEO };
