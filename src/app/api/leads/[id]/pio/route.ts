import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { canAccessLead } from "@/lib/rbac";
import {
  buildDefaultDesignPio,
  normalizeDesignPio,
  type DesignPioData,
} from "@/lib/design-pio";

type Params = { params: Promise<{ id: string }> };

/** Any role that can open the lead may view / edit Design PIO. */
export async function GET(_req: Request, { params }: Params) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const lead = await prisma.lead.findUnique({ where: { id } });
  if (!lead) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!canAccessLead(user, lead)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const pio = lead.pioData
    ? normalizeDesignPio(lead.pioData, lead)
    : buildDefaultDesignPio(lead);

  return NextResponse.json({
    pio,
    exists: Boolean(lead.pioData),
    pioReleased: lead.pioReleased,
  });
}

export async function PUT(req: Request, { params }: Params) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const lead = await prisma.lead.findUnique({ where: { id } });
  if (!lead) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!canAccessLead(user, lead)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    pio?: DesignPioData;
    markReleased?: boolean;
  };
  if (!body.pio || typeof body.pio !== "object") {
    return NextResponse.json({ error: "PIO data required." }, { status: 400 });
  }

  const pio = normalizeDesignPio(body.pio, lead);
  const updated = await prisma.lead.update({
    where: { id },
    data: {
      pioData: pio as unknown as Prisma.InputJsonValue,
      ...(body.markReleased ? { pioReleased: true } : {}),
    },
  });

  await prisma.leadActivity.create({
    data: {
      leadId: id,
      createdById: user.id,
      type: "NOTE",
      body: body.markReleased
        ? `Design PIO ${pio.pioNo} saved and marked released.`
        : `Design PIO ${pio.pioNo} updated.`,
    },
  });

  return NextResponse.json({
    ok: true,
    pio,
    pioReleased: updated.pioReleased,
  });
}
