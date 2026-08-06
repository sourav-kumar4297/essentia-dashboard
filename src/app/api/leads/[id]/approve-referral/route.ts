import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { canApproveReferrals } from "@/lib/rbac";

type Params = { params: Promise<{ id: string }> };

export async function POST(req: Request, { params }: Params) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!canApproveReferrals(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = (await req.json()) as { decision?: "APPROVED" | "REJECTED" };
  if (body.decision !== "APPROVED" && body.decision !== "REJECTED") {
    return NextResponse.json(
      { error: "decision must be APPROVED or REJECTED." },
      { status: 400 },
    );
  }

  const existing = await prisma.lead.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!existing.isPersonalReferral) {
    return NextResponse.json(
      { error: "Lead is not a personal referral." },
      { status: 400 },
    );
  }

  const lead = await prisma.lead.update({
    where: { id },
    data: { referralApproval: body.decision },
    include: {
      assignedTo: { select: { id: true, name: true, email: true } },
    },
  });

  await prisma.leadActivity.create({
    data: {
      leadId: id,
      createdById: user.id,
      type: "NOTE",
      body:
        body.decision === "APPROVED"
          ? "Personal referral approved by Admin."
          : "Personal referral rejected by Admin.",
    },
  });

  return NextResponse.json({ lead });
}
