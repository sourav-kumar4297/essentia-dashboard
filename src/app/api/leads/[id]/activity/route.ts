import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { canAccessLead } from "@/lib/rbac";
import type { ActivityType } from "@/lib/bd-types";

const ALLOWED: ActivityType[] = [
  "CALL",
  "EMAIL",
  "WHATSAPP",
  "MEETING",
  "NOTE",
];

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Params) {
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

  const body = (await req.json()) as {
    type?: string;
    body?: string;
    qualification?: string;
  };
  const type = (body.type ?? "CALL") as ActivityType;
  const text = String(body.body ?? "").trim();
  if (!text) {
    return NextResponse.json(
      { error: "Call notes are required." },
      { status: 400 },
    );
  }
  if (!ALLOWED.includes(type)) {
    return NextResponse.json({ error: "Invalid activity type." }, { status: 400 });
  }

  if (body.qualification) {
    await prisma.lead.update({
      where: { id },
      data: { qualification: String(body.qualification) },
    });
  }

  const activity = await prisma.leadActivity.create({
    data: {
      leadId: id,
      createdById: user.id,
      type,
      body: text,
    },
    include: { createdBy: { select: { id: true, name: true } } },
  });

  return NextResponse.json({ activity }, { status: 201 });
}
