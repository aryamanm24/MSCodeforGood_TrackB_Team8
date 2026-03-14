// app/api/reviews/route.js — proxies to the Express backend
//
// The feedbackform sends POST /api/reviews here (same-origin),
// then this route forwards the payload to the Express backend at BACKEND_URL.
// This avoids CORS issues from the browser and keeps the backend URL private.

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:4000";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const backendRes = await fetch(`${BACKEND_URL}/api/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await backendRes.json();
    return Response.json(data, { status: backendRes.status });
  } catch (err) {
    console.error("[feedbackform /api/reviews] Failed to reach backend:", err.message);
    return Response.json(
      { error: "Backend unavailable", detail: err.message },
      { status: 502 }
    );
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const resourceId = searchParams.get("resource_id") || "";

  try {
    const url = resourceId
      ? `${BACKEND_URL}/api/reviews?resource_id=${encodeURIComponent(resourceId)}`
      : `${BACKEND_URL}/api/reviews`;

    const backendRes = await fetch(url);
    const data = await backendRes.json();
    return Response.json(data, { status: backendRes.status });
  } catch (err) {
    console.error("[feedbackform /api/reviews] Failed to reach backend:", err.message);
    return Response.json(
      { error: "Backend unavailable", detail: err.message },
      { status: 502 }
    );
  }
}
