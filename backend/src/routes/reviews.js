const crypto = require("crypto");
const { getSupabaseClient } = require("../lib/supabase");

/**
 * POST /api/reviews
 * Insert a client feedback review into the client_feedback table.
 *
 * Required body fields: resourceId, shareTextWithResource
 * authorId falls back to "anonymous" when not provided (until auth is wired).
 */
async function createReview(req, res) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return res.status(503).json({
      error: "Supabase not configured",
      hint: "Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to backend/.env",
    });
  }

  const body = req.body || {};

  const attended = body.attended ?? null;

  const row = {
    id: crypto.randomUUID(),
    author_id: body.authorId || "anonymous",
    resource_id: body.resourceId || "unspecified",
    occurrence_id: body.occurrenceId ?? null,
    user_id: body.userId ?? null,
    reviewed_by_user_id: body.reviewedByUserId ?? null,

    attended,
    did_not_attend_reason:
      attended === false ? (body.didNotAttendReason ?? null) : null,

    rating: attended === true ? (body.rating ?? null) : null,
    wait_time_minutes:
      attended === true ? (body.waitTimeMinutes ?? null) : null,

    information_accurate: body.informationAccurate ?? null,
    text:
      body.text && typeof body.text === "string" && body.text.trim().length > 0
        ? body.text.trim()
        : null,
    share_text_with_resource: body.shareTextWithResource === true,

    photo_url: body.photoUrl ?? null,
    photo_public: body.photoUrl ? body.photoPublic === true : null,
  };

  if (body.createdAt) {
    row.created_at = body.createdAt;
  }

  try {
    const { data, error } = await supabase
      .from("client_feedback")
      .insert([row])
      .select()
      .single();

    if (error) {
      console.error("[POST /api/reviews] Supabase error:", error);
      return res.status(502).json({ error: error.message, code: error.code });
    }

    return res.status(201).json(data);
  } catch (err) {
    console.error("[POST /api/reviews] Unexpected error:", err);
    return res.status(500).json({ error: "Failed to save review" });
  }
}

/**
 * GET /api/reviews?resource_id=...
 * Fetch reviews for a given resource (active only, newest first).
 */
async function getReviews(req, res) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return res.status(503).json({
      error: "Supabase not configured",
      hint: "Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to backend/.env",
    });
  }

  let query = supabase
    .from("client_feedback")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  const resourceId = req.query.resource_id;
  if (resourceId) {
    query = query.eq("resource_id", resourceId);
  }

  const { data, error } = await query.limit(200);

  if (error) {
    return res.status(502).json({ error: error.message, code: error.code });
  }

  return res.json(data || []);
}

module.exports = { createReview, getReviews };
