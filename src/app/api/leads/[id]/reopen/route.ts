import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { canAccessLead } from "@/lib/rbac";

type Params = { params: Promise<{ id: string }> };

/** Reopen LOST / HOLD → IN_DISCUSSION */
export async function POST(_req: Request, { params }: Params) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const existing = await prisma.lead.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!canAccessLead(user, existing)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (existing.status !== "LOST" && existing.status !== "HOLD") {
    return NextResponse.json(
      { error: "Only Lost or Hold leads can be reopened." },
      { status: 400 },
    );
  }

  const lead = await prisma.lead.update({
    where: { id },
    data: { status: "IN_DISCUSSION" },
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
    },
  });

  await prisma.leadActivity.create({
    data: {
      leadId: id,
      createdById: user.id,
      type: "STATUS",
      body: `Reopened from ${existing.status} → IN_DISCUSSION.`,
    },
  });

  return NextResponse.json({ lead });
}
