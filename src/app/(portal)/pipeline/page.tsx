"use client";

import Link from "next/link";
import { PageHeader, Panel, Stat, Button } from "@/components/ui";
import { usePortal } from "@/lib/store";
import { leadIntelligence, relativeAge } from "@/lib/lead-intel";
import { clsx } from "clsx";

export default function DashboardPage() {
  const { leads } = usePortal();
  const intel = leadIntelligence(leads);
  const maxChannel = Math.max(...intel.channels.map((c) => c.count), 1);
  const recent = [...leads].sort(
    (a, b) =>
      new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime(),
  );

  return (
    <div>
      <PageHeader
        eyebrow="Overview"
        title="Lead Intelligence Dashboard"
        description="Essentia Environments (EE) and Essentia Home (EH) leads across channels."
        actions={
          <Link href="/leads?new=1">
            <Button>+ New Lead</Button>
          </Link>
        }
      />

      {/* Top tabs like reference */}
      <div className="mb-8 flex flex-wrap gap-1 border-b border-line">
        {[
          { href: "/pipeline", label: "Dashboard", active: true },
          { href: "/leads", label: `All Leads (${leads.length})` },
          { href: "/board", label: "Pipeline" },
          { href: "/channels", label: "Channels" },
        ].map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={clsx(
              "label border-b-2 px-3 py-2.5 transition",
              tab.active
                ? "border-fg text-fg"
                : "border-transparent text-fg-muted hover:text-fg",
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <div className="mb-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Total leads"
          value={intel.total}
          hint="All channels, all BUs"
        />
        <div className="panel-surface border-t-2 border-t-[#2e3f6b] px-5 py-5 animate-rise">
          <p className="label text-fg-muted">EE leads</p>
          <p className="metric mt-3 text-[15px] tracking-wide">{intel.ee}</p>
          <p className="label mt-1.5 text-fg-dim">Essentia Environments</p>
        </div>
        <div className="panel-surface border-t-2 border-t-[#2e5c3a] px-5 py-5 animate-rise delay-1">
          <p className="label text-fg-muted">EH leads</p>
          <p className="metric mt-3 text-[15px] tracking-wide">{intel.eh}</p>
          <p className="label mt-1.5 text-fg-dim">Essentia Home</p>
        </div>
        <Stat
          label="Win rate"
          value={`${intel.winRate}%`}
          hint={`${intel.signed} signed`}
        />
      </div>

      <div className="mb-8 grid gap-3 sm:grid-cols-3">
        <Stat
          label="Cross-sell clients"
          value={intel.crossSell}
          hint="Active with both EE & EH"
        />
        <Stat
          label="Top channel"
          value={intel.topChannel}
          hint={`${intel.topChannelCount} leads`}
        />
        <Stat
          label="This month"
          value={intel.thisMonth}
          hint="Leads since month start"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Leads by channel" className="animate-rise">
          <ul className="space-y-4">
            {intel.channels.map(({ channel, count }) => (
              <li key={channel}>
                <div className="mb-1.5 flex items-baseline justify-between gap-3">
                  <span className="label text-fg">{channel}</span>
                  <span className="metric text-fg-muted">{count}</span>
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
        </Panel>

        <Panel title="Recent leads" className="animate-rise delay-1">
          <ul className="divide-y divide-line">
            {recent.map((lead) => (
              <li key={lead.id}>
                <Link
                  href={`/leads?focus=${lead.id}`}
                  className="flex items-start justify-between gap-3 py-3 transition hover:bg-surface-hover"
                >
                  <div className="min-w-0">
                    <p className="label text-fg">{lead.name}</p>
                    <p className="metric mt-0.5 text-fg-dim">
                      {lead.source} · {lead.territory}
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
                      {relativeAge(lead.capturedAt)}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
