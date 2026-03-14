import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabaseServer";
import { getBorough } from "@/lib/zipToBorough";

const PAGE_SIZE = 1000;

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

function computeMeta(resources) {
  if (!Array.isArray(resources) || resources.length === 0) {
    return { types: [], zips: [], boroughs: [], tags: [], regions: [], totalCount: 0 };
  }
  const types = [...new Set(resources.map((r) => r?.resourceType?.id).filter(Boolean))].sort();
  const zips = [...new Set(resources.map((r) => r?.zipCode).filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b)));
  const tags = [...new Set(resources.flatMap((r) => (r?.tags || []).map((t) => t?.name).filter(Boolean)))].sort();
  const boroughs = [...new Set(resources.map((r) => getBorough(r?.zipCode)).filter(Boolean))].sort();
  const regions = [...new Set(resources.flatMap((r) => (r?.regions || []).map((reg) => reg?.id).filter(Boolean)))].sort();
  return { types, zips, boroughs, tags, regions, totalCount: resources.length };
}

export async function GET() {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 503 }
    );
  }

  const baseQuery = supabase
    .from("resources")
    .select("raw")
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

  const resources = allRows.map((row) => row?.raw).filter((r) => r != null);
  const meta = computeMeta(resources);
  return NextResponse.json(meta);
}