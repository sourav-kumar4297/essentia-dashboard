import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { canSyncHubspot } from "@/lib/rbac";
import { syncHubspotChunk } from "@/lib/hubspot";

/**
 * Chunked HubSpot sync.
 * Body: { reset?: boolean, after?: string | null, limit?: number }
 * Call repeatedly with `after` until `done: true`.
 */
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!canSyncHubspot(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { reset?: boolean; after?: string | null; limit?: number } = {};
  try {
    body = (await req.json()) as typeof body;
  } catch {
    body = {};
  }

  const result = await syncHubspotChunk({
    reset: Boolean(body.reset),
    after: body.after ?? null,
    limit: body.limit ?? 200,
    createdById: user.id,
  });

  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
