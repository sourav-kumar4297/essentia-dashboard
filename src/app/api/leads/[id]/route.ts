import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import {
  canAccessLead,
  canAssignLeads,
  canViewAllLeads,
  isHotOrWarm,
  memberCanSetStatus,
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

  const body = (await req.json()) as Record<string, unknown>;
  const data: Record<string, unknown> = {};
  const member = !canViewAllLeads(user.role);

  if (body.returnToAdmin === true) {
    if (member && existing.assignedToId !== user.id) {
      return NextResponse.json(
        { error: "Only the assigned member can return this lead." },
        { status: 403 },
      );
    }
    const qual =
      typeof body.qualification === "string"
        ? body.qualification
        : existing.qualification;
    if (!isHotOrWarm(qual)) {
      return NextResponse.json(
        { error: "Mark the lead Hot or Warm before returning it to Admin." },
        { status: 400 },
      );
    }
    if (typeof body.qualification === "string") {
      data.qualification = body.qualification;
    }
    data.assignedToId = null;
  }

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
    if (key in body && body.returnToAdmin !== true) {
      const v = body[key];
      data[key] = v === null || v === undefined ? null : String(v);
    }
  }
  if (
    body.returnToAdmin === true &&
    typeof body.qualification === "string" &&
    !("qualification" in data)
  ) {
    data.qualification = body.qualification;
  }

  if ("dealValue" in body) {
    data.dealValue =
      body.dealValue === null || body.dealValue === ""
        ? null
        : Number(body.dealValue);
  }

  if (!member) {
    for (const key of [
      "pioReleased",
      "firstPaymentReceived",
      "docsComplete",
      "handoverComplete",
    ] as const) {
      if (key in body) data[key] = Boolean(body[key]);
    }
  }

  if ("status" in body && typeof body.status === "string") {
    if (member && !memberCanSetStatus(body.status)) {
      return NextResponse.json(
        {
          error:
            "Members can set New, Contacted, In Discussion, Hold or Lost. Return Hot/Warm leads to Admin for the next team.",
        },
        { status: 403 },
      );
    }
    data.status = body.status as BdLeadStatus;
    if (body.status !== "NEW" && !existing.firstContactedAt) {
      data.firstContactedAt = new Date();
    }
  }

  if ("assignedToId" in body && body.returnToAdmin !== true) {
    if (!canAssignLeads(user.role)) {
      return NextResponse.json(
        { error: "Only Admin can assign leads." },
        { status: 403 },
      );
    }
    const nextId = body.assignedToId ? String(body.assignedToId) : null;
    if (nextId) {
      const target = await prisma.user.findUnique({ where: { id: nextId } });
      if (!target || target.role !== "MEMBER") {
        return NextResponse.json(
          { error: "Leads can only be assigned to BD Members." },
          { status: 400 },
        );
      }
    }
    data.assignedToId = nextId;
  }

  if (
    existing.isPersonalReferral &&
    existing.referralApproval === "REJECTED" &&
    member
  ) {
    data.referralApproval = "PENDING" satisfies ReferralApproval;
  }

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

  if (body.returnToAdmin === true) {
    await prisma.leadActivity.create({
      data: {
        leadId: id,
        createdById: user.id,
        type: "NOTE",
        body: `Returned to Admin — ${String(data.qualification ?? existing.qualification)} lead, client ready for next team.`,
      },
    });
  } else if (
    "assignedToId" in data &&
    data.assignedToId !== existing.assignedToId
  ) {
    const name = lead.assignedTo?.name ?? "Unassigned";
    await prisma.leadActivity.create({
      data: {
        leadId: id,
        createdById: user.id,
        type: "NOTE",
        body: data.assignedToId
          ? `Assigned to ${name}.`
          : "Unassigned.",
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
