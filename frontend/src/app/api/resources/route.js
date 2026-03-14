import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabaseServer";

// Supabase/PostgREST caps at 1000 rows per request; we paginate to get all.
const PAGE_SIZE = 1000;

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export async function GET() {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return NextResponse.json(
      {
        error: "Supabase not configured",
        hint: "Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to .env.local",
      },
      { status: 503 }
    );
  }

  const baseQuery = supabase
    .from("resources")
    .select("raw", { count: "exact" })
    .eq("status", "PUBLISHED")
    .or("merged_to_resource_id.is.null,merged_to_resource_id.eq.")
    .order("id", { ascending: true });

  const allRows = [];
  let from = 0;
  let hasMore = true;

  while (hasMore) {
    const to = from + PAGE_SIZE - 1;
    const { data, error } = await baseQuery.range(from, to);

    if (error) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: 502 }
      );
    }

    const page = data || [];
    allRows.push(...page);
    hasMore = page.length === PAGE_SIZE;
    from += PAGE_SIZE;
  }

  const resources = allRows
    .map((row) => row?.raw)
    .filter((r) => r != null && r.id != null);

  return NextResponse.json(resources);
}