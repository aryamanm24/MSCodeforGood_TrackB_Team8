// Proxies GET /api/resources/nearby to the Express backend (Lemontree API).

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:4000";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");
  const take = searchParams.get("take") || "20";

  if (!lat || !lng) {
    return Response.json(
      { error: "lat and lng query parameters are required" },
      { status: 400 }
    );
  }

  try {
    const url = `${BACKEND_URL}/api/resources/nearby?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}&take=${encodeURIComponent(take)}`;
    const backendRes = await fetch(url);
    const data = await backendRes.json();
    return Response.json(data, { status: backendRes.status });
  } catch (err) {
    console.error("[feedbackform /api/resources/nearby]", err.message);
    return Response.json(
      { error: "Backend unavailable", detail: err.message },
      { status: 502 }
    );
  }
}
