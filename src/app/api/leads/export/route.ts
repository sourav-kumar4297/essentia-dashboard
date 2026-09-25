import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { canExportAllLeads } from "@/lib/rbac";

const COLUMNS = [
  "id",
  "name",
  "phone",
  "email",
  "source",
  "status",
  "qualification",
  "location",
  "territory",
  "businessUnit",
  "projectType",
  "budgetIndication",
  "dealValue",
  "notes",
  "hubspotId",
  "referralApproval",
  "isPersonalReferral",
  "assignedToName",
  "assignedToEmail",
  "createdByName",
  "createdByEmail",
  "pioReleased",
  "firstPaymentReceived",
  "docsComplete",
  "handoverComplete",
  "handoverNotes",
  "crmTeamLead",
  "createdAt",
  "updatedAt",
  "lastFollowUpAt",
  "firstContactedAt",
] as const;

function csvEscape(value: unknown): string {
  if (value == null) return "";
  const str =
    value instanceof Date
      ? value.toISOString()
      : typeof value === "boolean"
        ? value
          ? "true"
          : "false"
        : String(value);
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toIso(value: Date | null | undefined): string {
  return value ? value.toISOString() : "";
}

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!canExportAllLeads(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const leads = await prisma.lead.findMany({
    include: {
      assignedTo: { select: { name: true, email: true } },
      createdBy: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const rows = leads.map((lead) =>
    [
      lead.id,
      lead.name,
      lead.phone,
      lead.email,
      lead.source,
      lead.status,
      lead.qualification,
      lead.location,
      lead.territory,
      lead.businessUnit,
      lead.projectType,
      lead.budgetIndication ?? "",
      lead.dealValue ?? "",
      lead.notes ?? "",
      lead.hubspotId ?? "",
      lead.referralApproval,
      lead.isPersonalReferral,
      lead.assignedTo?.name ?? "",
      lead.assignedTo?.email ?? "",
      lead.createdBy?.name ?? "",
      lead.createdBy?.email ?? "",
      lead.pioReleased,
      lead.firstPaymentReceived,
      lead.docsComplete,
      lead.handoverComplete,
      lead.handoverNotes ?? "",
      lead.crmTeamLead ?? "",
      toIso(lead.createdAt),
      toIso(lead.updatedAt),
      toIso(lead.lastFollowUpAt),
      toIso(lead.firstContactedAt),
    ]
      .map(csvEscape)
      .join(","),
  );

  const csv = ["\uFEFF" + COLUMNS.join(","), ...rows].join("\r\n");
  const stamp = new Date().toISOString().slice(0, 10);
  const filename = `essentia-leads-${stamp}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
