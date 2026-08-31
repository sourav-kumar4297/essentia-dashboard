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
import type { BdLeadStatus } from "@/lib/bd-types";

export async function PATCH(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as {
    ids?: string[];
    assignedToId?: string | null;
    status?: string;
    qualification?: string;
    returnToAdmin?: boolean;
  };

  const ids = Array.isArray(body.ids)
    ? [...new Set(body.ids.map(String).filter(Boolean))]
    : [];
  if (ids.length === 0) {
    return NextResponse.json({ error: "Select at least one lead." }, { status: 400 });
  }
  if (ids.length > 100) {
    return NextResponse.json({ error: "Max 100 leads at once." }, { status: 400 });
  }

  const hasAssign = "assignedToId" in body;
  const hasStatus = typeof body.status === "string" && body.status.length > 0;
  const hasQual =
    typeof body.qualification === "string" && body.qualification.length > 0;
  const returnToAdmin = body.returnToAdmin === true;

  if (!hasAssign && !hasStatus && !hasQual && !returnToAdmin) {
    return NextResponse.json({ error: "No bulk action provided." }, { status: 400 });
  }

  if (hasAssign && !canAssignLeads(user.role)) {
    return NextResponse.json(
      { error: "Only Admin can assign leads." },
      { status: 403 },
    );
  }

  let assignTo: string | null | undefined;
  if (hasAssign) {
    assignTo = body.assignedToId ? String(body.assignedToId) : null;
    if (assignTo) {
      const target = await prisma.user.findUnique({ where: { id: assignTo } });
      if (!target || target.role !== "MEMBER") {
        return NextResponse.json(
          { error: "Leads can only be assigned to BD Members." },
          { status: 400 },
        );
      }
    }
  }

  if (hasStatus && !canViewAllLeads(user.role) && !memberCanSetStatus(body.status!)) {
    return NextResponse.json(
      { error: "Members cannot set that status." },
      { status: 403 },
    );
  }

  const leads = await prisma.lead.findMany({ where: { id: { in: ids } } });
  const byId = new Map(leads.map((l) => [l.id, l]));

  let updated = 0;
  const errors: string[] = [];

  for (const id of ids) {
    const existing = byId.get(id);
    if (!existing) {
      errors.push(`${id}: not found`);
      continue;
    }
    if (!canAccessLead(user, existing)) {
      errors.push(`${existing.name}: forbidden`);
      continue;
    }

    const data: Record<string, unknown> = {};

    if (returnToAdmin) {
      if (!canViewAllLeads(user.role) && existing.assignedToId !== user.id) {
        errors.push(`${existing.name}: not assigned to you`);
        continue;
      }
      const qual = hasQual ? body.qualification! : existing.qualification;
      if (!isHotOrWarm(qual)) {
        errors.push(`${existing.name}: mark Hot/Warm first`);
        continue;
      }
      data.assignedToId = null;
      if (hasQual) data.qualification = body.qualification;
    } else {
      if (hasAssign) data.assignedToId = assignTo;
      if (hasStatus) {
        data.status = body.status as BdLeadStatus;
        if (body.status !== "NEW" && !existing.firstContactedAt) {
          data.firstContactedAt = new Date();
        }
      }
      if (hasQual) data.qualification = body.qualification;
    }

    if (Object.keys(data).length === 0) continue;

    await prisma.lead.update({ where: { id }, data });

    const note = returnToAdmin
      ? `Bulk: returned to Admin (${String(data.qualification ?? existing.qualification)}).`
      : hasAssign
        ? data.assignedToId
          ? "Bulk: assigned."
          : "Bulk: unassigned."
        : hasStatus
          ? `Bulk: status → ${body.status}.`
          : hasQual
            ? `Bulk: type → ${body.qualification}.`
            : "Bulk update.";

    await prisma.leadActivity.create({
      data: {
        leadId: id,
        createdById: user.id,
        type: hasStatus ? "STATUS" : "NOTE",
        body: note,
      },
    });
    updated += 1;
  }

  return NextResponse.json({ ok: true, updated, errors });
}
