import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { canViewAllLeads } from "@/lib/rbac";
import {
  BD_CHANNEL_ORDER,
  WEBSITE_SITES,
  isWebsiteSource,
  matchWebsiteSite,
} from "@/lib/bd-channels";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const roleWhere = canViewAllLeads(user.role)
    ? {}
    : {
        OR: [{ assignedToId: user.id }, { createdById: user.id }],
      };

  const where =
    Object.keys(roleWhere).length === 0 ? undefined : roleWhere;

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const monthWhere = where
    ? { AND: [where, { createdAt: { gte: monthStart } }] }
    : { createdAt: { gte: monthStart } };

  const [
    total,
    byStatus,
    bySource,
    byUnit,
    thisMonth,
    won,
    recent,
  ] = await Promise.all([
    prisma.lead.count({ where: where as never }),
    prisma.lead.groupBy({
      by: ["status"],
      where: where as never,
      _count: { _all: true },
    }),
    prisma.lead.groupBy({
      by: ["source"],
      where: where as never,
      _count: { _all: true },
    }),
    prisma.lead.groupBy({
      by: ["businessUnit"],
      where: where as never,
      _count: { _all: true },
    }),
    prisma.lead.count({ where: monthWhere as never }),
    prisma.lead.count({
      where: {
        ...(where ?? {}),
        status: "WON",
      } as never,
    }),
    prisma.lead.findMany({
      where: where as never,
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        name: true,
        phone: true,
        source: true,
        status: true,
        businessUnit: true,
        territory: true,
        createdAt: true,
      },
    }),
  ]);

  const sourceMap = new Map(
    bySource.map((r) => [r.source, r._count._all]),
  );

  const websiteSites = WEBSITE_SITES.map((site) => {
    let count = 0;
    for (const [source, n] of sourceMap) {
      const matched = matchWebsiteSite(source);
      if (matched?.id === site.id) count += n;
      else if (
        !matched &&
        (source === "Website" || source === site.source) &&
        site.id === "ee"
      ) {
        // Plain "Website" rolls into EE site
        count += n;
      }
    }
    return {
      id: site.id,
      label: site.label,
      url: site.url,
      source: site.source,
      count,
    };
  });

  const websiteTotal = websiteSites.reduce((sum, s) => sum + s.count, 0);

  const known = new Set<string>(BD_CHANNEL_ORDER);
  const channels = [
    ...BD_CHANNEL_ORDER.map((channel) => {
      if (channel === "Website") {
        return { channel, count: websiteTotal };
      }
      return { channel, count: sourceMap.get(channel) ?? 0 };
    }),
    ...[...sourceMap.entries()]
      .filter(
        ([channel]) =>
          !known.has(channel) &&
          !isWebsiteSource(channel) &&
          !matchWebsiteSite(channel),
      )
      .sort((a, b) => b[1] - a[1])
      .map(([channel, count]) => ({ channel, count })),
  ];

  const statusCounts: Record<string, number> = {};
  for (const row of byStatus) {
    statusCounts[row.status] = row._count._all;
  }

  const unitCounts: Record<string, number> = {};
  for (const row of byUnit) {
    unitCounts[row.businessUnit] = row._count._all;
  }

  const top = [...channels].sort((a, b) => b.count - a.count)[0];
  const winRate = total ? Math.round((won / total) * 100) : 0;

  return NextResponse.json({
    total,
    won,
    winRate,
    thisMonth,
    ee: unitCounts.EE ?? 0,
    eh: unitCounts.EH ?? 0,
    cc: unitCounts.CC ?? 0,
    statusCounts,
    topChannel: top?.count ? top.channel : "—",
    topChannelCount: top?.count ?? 0,
    activeChannels: channels.filter((c) => c.count > 0).length,
    channels,
    websiteSites,
    recent,
  });
}
