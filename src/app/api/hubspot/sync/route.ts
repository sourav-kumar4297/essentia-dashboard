import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { canSyncHubspot } from "@/lib/rbac";
import { syncHubspotChunk, syncRecentHubspotContacts } from "@/lib/hubspot";

/**
 * Chunked HubSpot sync.
 * Body: { recent?: boolean, reset?: boolean, after?: string | null, limit?: number }
 * `recent: true` pulls contacts changed in the last 48h (no wipe).
 */
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!canSyncHubspot(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: {
    recent?: boolean;
    reset?: boolean;
    after?: string | null;
    limit?: number;
  } = {};
  try {
    body = (await req.json()) as typeof body;
  } catch {
    body = {};
  }

  if (body.recent) {
    const result = await syncRecentHubspotContacts({
      createdById: user.id,
      lookbackHours: 48,
    });
    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  }

  const result = await syncHubspotChunk({
    reset: Boolean(body.reset),
    after: body.after ?? null,
    limit: body.limit ?? 200,
    createdById: user.id,
  });

  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
