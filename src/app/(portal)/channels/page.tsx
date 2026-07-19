"use client";

import Link from "next/link";
import { PageHeader, Panel, Stat } from "@/components/ui";
import { usePortal } from "@/lib/store";
import { leadIntelligence } from "@/lib/lead-intel";
import { clsx } from "clsx";

export default function ChannelsPage() {
  const { leads } = usePortal();
  const intel = leadIntelligence(leads);
  const max = Math.max(...intel.channels.map((c) => c.count), 1);

  return (
    <div>
      <PageHeader
        eyebrow="Channels"
        title="Source mix"
        description="Where leads enter — Website, Instagram, referral and more."
      />

      <div className="mb-8 flex flex-wrap gap-1 border-b border-line">
        {[
          { href: "/pipeline", label: "Dashboard" },
          { href: "/leads", label: `All Leads (${leads.length})` },
          { href: "/board", label: "Pipeline" },
          { href: "/channels", label: "Channels", active: true },
        ].map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={clsx(
              "label border-b-2 px-3 py-2.5 transition",
              "active" in tab && tab.active
                ? "border-fg text-fg"
                : "border-transparent text-fg-muted hover:text-fg",
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Stat label="Top channel" value={intel.topChannel} />
        <Stat label="Active channels" value={intel.channels.filter((c) => c.count > 0).length} />
        <Stat label="Total leads" value={intel.total} />
      </div>

      <Panel title="All channels">
        <ul className="space-y-5">
          {intel.channels.map(({ channel, count }) => (
            <li key={channel}>
              <div className="mb-2 flex justify-between">
                <span className="label text-fg">{channel}</span>
                <span className="metric text-fg-muted">
                  {count} lead{count === 1 ? "" : "s"}
                </span>
              </div>
              <div className="h-1 w-full bg-line">
                <div
                  className="h-full bg-fg"
                  style={{
                    width: `${(count / max) * 100}%`,
                    opacity: count ? 1 : 0.15,
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
