import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import {
  canAccessLead,
  canAssignLeads,
  canViewAllLeads,
} from "@/lib/rbac";
import type { BdLeadStatus, ReferralApproval } from "@/lib/bd-types";

const leadInclude = {
  assignedTo: { select: { id: true, name: true, email: true, role: true } },
  createdBy: { select: { id: true, name: true, email: true } },
  activities: {
    orderBy: { createdAt: "desc" as const },
    take: 20,
    include: {
      createdBy: { select: { id: true, name: true } },
    },
  },
};

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const lead = await prisma.lead.findUnique({
    where: { id },
    include: leadInclude,
  });
  if (!lead) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!canAccessLead(user, lead)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return NextResponse.json({ lead });
}

export async function PATCH(req: Request, { params }: Params) {
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

  // Rejected personal referrals: Member may edit and auto-resubmit to PENDING
  const body = (await req.json()) as Record<string, unknown>;
  const data: Record<string, unknown> = {};

  const stringFields = [
    "name",
    "phone",
    "email",
    "source",
    "qualification",
    "location",
    "territory",
    "businessUnit",
    "projectType",
    "budgetIndication",
    "notes",
    "handoverNotes",
    "crmTeamLead",
  ] as const;

  for (const key of stringFields) {
    if (key in body) {
      const v = body[key];
      data[key] = v === null || v === undefined ? null : String(v);
    }
  }

  if ("dealValue" in body) {
    data.dealValue =
      body.dealValue === null || body.dealValue === ""
        ? null
        : Number(body.dealValue);
  }

  for (const key of [
    "pioReleased",
    "firstPaymentReceived",
    "docsComplete",
    "handoverComplete",
  ] as const) {
    if (key in body) data[key] = Boolean(body[key]);
  }

  if ("status" in body && typeof body.status === "string") {
    data.status = body.status as BdLeadStatus;
    if (body.status !== "NEW" && !existing.firstContactedAt) {
      data.firstContactedAt = new Date();
    }
  }

  if ("assignedToId" in body) {
    if (!canAssignLeads(user.role)) {
      return NextResponse.json(
        { error: "Only Admin can assign leads." },
        { status: 403 },
      );
    }
    data.assignedToId = body.assignedToId
      ? String(body.assignedToId)
      : null;
  }

  // Resubmit rejected personal referral
  if (
    existing.isPersonalReferral &&
    existing.referralApproval === "REJECTED" &&
    !canViewAllLeads(user.role)
  ) {
    data.referralApproval = "PENDING" satisfies ReferralApproval;
  }

  // Explicit resubmit flag
  if (body.resubmitReferral === true && existing.isPersonalReferral) {
    data.referralApproval = "PENDING";
  }

  const lead = await prisma.lead.update({
    where: { id },
    data,
    include: leadInclude,
  });

  if (data.status && data.status !== existing.status) {
    await prisma.leadActivity.create({
      data: {
        leadId: id,
        createdById: user.id,
        type: "STATUS",
        body: `Status changed to ${String(data.status)}.`,
      },
    });
  }

  if (data.referralApproval === "PENDING" && existing.referralApproval === "REJECTED") {
    await prisma.leadActivity.create({
      data: {
        leadId: id,
        createdById: user.id,
        type: "NOTE",
        body: "Personal referral resubmitted for Admin approval.",
      },
    });
  }

  return NextResponse.json({ lead });
}
