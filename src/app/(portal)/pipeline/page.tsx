"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader, Panel, Stat, Button } from "@/components/ui";
import { PlatformTabs } from "@/components/PlatformTabs";
import { useLeadStats } from "@/lib/use-lead-stats";
import { useHubspotLiveSync } from "@/lib/use-bd-leads";
import { BD_STATUS_LABELS, type BdLeadStatus } from "@/lib/bd-types";
import { clsx } from "clsx";
import { format } from "date-fns";

export default function DashboardPage() {
  const { stats, loading, refresh } = useLeadStats();
  useHubspotLiveSync(refresh);
  const total = stats?.total ?? 0;
  const channels = stats?.channels ?? [];
  const recent = stats?.recent ?? [];
  const maxChannel = Math.max(...channels.map((c) => c.count), 1);
  const topChannels = [...channels]
    .filter((c) => c.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
  const displayChannels =
    topChannels.length > 0 ? topChannels : channels.slice(0, 8);

  const statusOrder: BdLeadStatus[] = [
    "NEW",
    "CONTACTED",
    "IN_DISCUSSION",
    "PROPOSAL_SENT",
    "WON",
    "HOLD",
    "LOST",
  ];

  return (
    <div className="w-full min-w-0">
      <PageHeader
        eyebrow="Lead platform"
        title="Dashboard"
        description="Live BD lead intelligence across channels and business units."
        actions={
          <Link href="/leads?new=1">
            <Button>
              <Plus className="mr-1.5 h-3.5 w-3.5" strokeWidth={1.5} />
              New Lead
            </Button>
          </Link>
        }
      />

      <PlatformTabs />

      {loading && !stats && (
        <p className="label py-10 text-center text-fg-muted">Loading…</p>
      )}

      {stats && (
        <>
          <div className="mb-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat
              label="Total leads"
              value={total.toLocaleString()}
              hint="All channels, all BUs"
            />
            <div className="panel-surface border-t-2 border-t-[#2e3f6b] px-5 py-5 animate-rise">
              <p className="label text-fg-muted">EE leads</p>
              <p className="metric mt-3 text-[15px] tracking-wide text-fg">
                {stats.ee.toLocaleString()}
              </p>
              <p className="label mt-1.5 text-fg-dim">Essentia Environments</p>
            </div>
            <div className="panel-surface border-t-2 border-t-[#2e5c3a] px-5 py-5 animate-rise delay-1">
              <p className="label text-fg-muted">EH / other</p>
              <p className="metric mt-3 text-[15px] tracking-wide text-fg">
                {(stats.eh + stats.cc).toLocaleString()}
              </p>
              <p className="label mt-1.5 text-fg-dim">
                EH {stats.eh} · CC {stats.cc}
              </p>
            </div>
            <Stat
              label="Win rate"
              value={`${stats.winRate}%`}
              hint={`${stats.won.toLocaleString()} won`}
            />
          </div>

          <div className="mb-8 grid gap-3 sm:grid-cols-3">
            <Stat
              label="Top channel"
              value={stats.topChannel}
              hint={`${stats.topChannelCount.toLocaleString()} leads`}
            />
            <Stat
              label="This month"
              value={stats.thisMonth.toLocaleString()}
              hint="Leads since month start"
            />
            <Stat
              label="Active channels"
              value={stats.activeChannels}
              hint={`${channels.length} tracked sources`}
            />
          </div>

          <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
            {statusOrder.map((status) => (
              <Link
                key={status}
                href={`/leads?status=${status}`}
                className="panel-surface px-4 py-4 transition hover:border-line-strong"
              >
                <p className="label text-fg-muted">
                  {BD_STATUS_LABELS[status]}
                </p>
                <p className="metric mt-2 text-[18px] text-fg">
                  {(stats.statusCounts[status] ?? 0).toLocaleString()}
                </p>
              </Link>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Panel title="Leads by channel" className="animate-rise">
              <ul className="space-y-4">
                {displayChannels.map(({ channel, count }) => (
                  <li key={channel}>
                    <div className="mb-1.5 flex items-baseline justify-between gap-3">
                      <span className="label text-fg">{channel}</span>
                      <span className="metric text-fg-muted">
                        {count.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-[3px] w-full bg-line">
                      <div
                        className="h-full bg-fg transition-all duration-500"
                        style={{
                          width: `${Math.max((count / maxChannel) * 100, count ? 4 : 0)}%`,
                          opacity: count ? 1 : 0.2,
                        }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
              <Link
                href="/channels"
                className="label mt-5 inline-block text-fg-muted underline-offset-2 hover:text-fg hover:underline"
              >
                View all channels →
              </Link>
            </Panel>

            <Panel title="Recent leads" className="animate-rise delay-1">
              <ul className="divide-y divide-line">
                {recent.length === 0 && (
                  <li className="label py-6 text-center text-fg-dim">
                    No leads yet.
                  </li>
                )}
                {recent.map((lead) => (
                  <li key={lead.id}>
                    <Link
                      href={`/leads?focus=${lead.id}`}
                      className="flex items-start justify-between gap-3 py-3 transition hover:bg-surface-hover"
                    >
                      <div className="min-w-0">
                        <p className="label truncate text-fg">{lead.name}</p>
                        <p className="metric mt-0.5 truncate text-fg-dim">
                          {lead.source} · {lead.territory || "—"}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <span
                          className={clsx(
                            "metric border px-1.5 py-0.5",
                            lead.businessUnit === "EE"
                              ? "border-[#2e3f6b]/40 text-[#2e3f6b]"
                              : "border-[#2e5c3a]/40 text-[#2e5c3a]",
                          )}
                        >
                          {lead.businessUnit}
                        </span>
                        <span className="metric text-fg-dim">
                          {format(new Date(lead.createdAt), "dd MMM yyyy, HH:mm")}
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
              <Link
                href="/leads"
                className="label mt-4 inline-block text-fg-muted underline-offset-2 hover:text-fg hover:underline"
              >
                Open all leads →
              </Link>
            </Panel>
          </div>
        </>
      )}
    </div>
  );
}
