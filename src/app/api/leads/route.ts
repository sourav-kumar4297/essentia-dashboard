import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { canViewAllLeads } from "@/lib/rbac";
import type { BdLeadStatus, ReferralApproval } from "@/lib/bd-types";

const leadInclude = {
  assignedTo: { select: { id: true, name: true, email: true, role: true } },
  createdBy: { select: { id: true, name: true, email: true } },
} as const;

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const limit = Math.min(
    Math.max(Number(url.searchParams.get("limit") || 200), 1),
    500,
  );
  const offset = Math.max(Number(url.searchParams.get("offset") || 0), 0);
  const status = url.searchParams.get("status");
  const q = url.searchParams.get("q")?.trim().toLowerCase();
  const source = url.searchParams.get("source")?.trim();
  const qualification = url.searchParams.get("qualification")?.trim();
  const since = url.searchParams.get("since")?.trim();
  const sort = url.searchParams.get("sort")?.trim() || "newest";

  const roleWhere = canViewAllLeads(user.role)
    ? {}
    : {
        OR: [{ assignedToId: user.id }, { createdById: user.id }],
      };

  const filters: Record<string, unknown>[] = [];
  if (Object.keys(roleWhere).length) filters.push(roleWhere);
  if (status && status !== "all") filters.push({ status });
  if (qualification && qualification !== "all") {
    filters.push({ qualification });
  }
  if (source && source !== "all") {
    if (source === "Website") {
      filters.push({
        OR: [
          { source: "Website" },
          { source: { startsWith: "Website" } },
        ],
      });
    } else {
      filters.push({ source });
    }
  }
  if (since && since !== "all") {
    const days =
      since === "today" ? 1 : since === "7d" ? 7 : since === "30d" ? 30 : since === "90d" ? 90 : 0;
    if (days > 0) {
      const start = new Date();
      if (since === "today") {
        start.setHours(0, 0, 0, 0);
      } else {
        start.setDate(start.getDate() - days);
      }
      filters.push({ createdAt: { gte: start } });
    }
  }
  if (q) {
    filters.push({
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { phone: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { source: { contains: q, mode: "insensitive" } },
        { location: { contains: q, mode: "insensitive" } },
      ],
    });
  }

  // SQLite / Postgres: Prisma SQLite may not support mode insensitive — Neon does
  const where =
    filters.length === 0
      ? undefined
      : filters.length === 1
        ? filters[0]
        : { AND: filters };

  const orderBy =
    sort === "az"
      ? { name: "asc" as const }
      : sort === "za"
        ? { name: "desc" as const }
        : sort === "oldest"
          ? { createdAt: "asc" as const }
          : { createdAt: "desc" as const };

  const [leads, total] = await Promise.all([
    prisma.lead.findMany({
      where: where as never,
      include: leadInclude,
      orderBy,
      take: limit,
      skip: offset,
    }),
    prisma.lead.count({ where: where as never }),
  ]);

  return NextResponse.json({
    leads,
    total,
    limit,
    offset,
    hasMore: offset + leads.length < total,
  });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await req.json()) as Record<string, unknown>;
    const name = String(body.name ?? "").trim();
    const phone = String(body.phone ?? "").trim();
    if (!name || !phone) {
      return NextResponse.json(
        { error: "Name and phone are required." },
        { status: 400 },
      );
    }

    const isPersonalReferral = Boolean(body.isPersonalReferral);
    const referralApproval: ReferralApproval = isPersonalReferral
      ? "PENDING"
      : "NONE";

    const lead = await prisma.lead.create({
      data: {
        name,
        phone,
        email: String(body.email ?? "").trim(),
        source: String(body.source ?? "Website"),
        status: (body.status as BdLeadStatus) || "NEW",
        isPersonalReferral,
        referralApproval,
        qualification: String(body.qualification ?? "Unqualified"),
        location: String(body.location ?? ""),
        territory: String(body.territory ?? "Gurugram"),
        businessUnit: String(body.businessUnit ?? "EE"),
        projectType: String(body.projectType ?? "residential"),
        budgetIndication: body.budgetIndication
          ? String(body.budgetIndication)
          : null,
        notes: body.notes ? String(body.notes) : null,
        dealValue:
          typeof body.dealValue === "number" ? body.dealValue : null,
        assignedToId: canViewAllLeads(user.role)
          ? (body.assignedToId as string) || user.id
          : user.id,
        createdById: user.id,
      },
      include: leadInclude,
    });

    await prisma.leadActivity.create({
      data: {
        leadId: lead.id,
        createdById: user.id,
        type: "STATUS",
        body: isPersonalReferral
          ? "Personal referral created — pending Admin approval."
          : "Lead created.",
      },
    });

    return NextResponse.json({ lead }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Could not create lead." },
      { status: 500 },
    );
  }
}
