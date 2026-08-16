import { NextResponse } from "next/server";
import { syncRecentHubspotContacts } from "@/lib/hubspot";

export const maxDuration = 60;

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return process.env.NODE_ENV !== "production";
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

/** Vercel Cron — daily incremental HubSpot pull. */
export async function GET(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await syncRecentHubspotContacts({ lookbackHours: 48 });
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}
