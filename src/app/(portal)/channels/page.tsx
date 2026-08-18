"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { PageHeader, Panel, Stat } from "@/components/ui";
import { ChannelsSkeleton } from "@/components/PortalSkeleton";
import { PlatformTabs } from "@/components/PlatformTabs";
import { useLeadStats } from "@/lib/use-lead-stats";

export default function ChannelsPage() {
  const { stats, loading } = useLeadStats();
  const channels = stats?.channels ?? [];
  const websiteSites = stats?.websiteSites ?? [];
  const websiteTotal = websiteSites.reduce((sum, s) => sum + s.count, 0);
  const max = Math.max(
    ...channels.map((c) => c.count),
    websiteTotal,
    1,
  );
  const withLeads = channels.filter((c) => c.count > 0);
  const empty = channels.filter((c) => c.count === 0);
  const otherChannels = channels.filter((c) => c.channel !== "Website");

  return (
    <div className="w-full min-w-0">
      <PageHeader
        eyebrow="Lead platform"
        title="Channels"
        description="Source mix — Website includes essentiaenvironments.com and essentiahome.com."
      />

      <PlatformTabs />

      {loading && !stats && <ChannelsSkeleton />}

      {stats && (
        <>
          <div className="mb-6 grid gap-3 sm:grid-cols-3">
            <Stat label="Top channel" value={stats.topChannel} />
            <Stat label="Active channels" value={stats.activeChannels} />
            <Stat
              label="Total leads"
              value={stats.total.toLocaleString()}
            />
          </div>

          <div className="mb-4 flex w-full items-center border border-line bg-surface px-3 py-2.5">
            <p className="label text-fg-muted">
              Showing {withLeads.length} active
              {empty.length > 0
                ? ` · ${empty.length} channels with no leads yet`
                : ""}
            </p>
          </div>

          <Panel title="All channels" className="mb-6">
            {/* Website first — total of both brand sites */}
            <div className="mb-6 border border-line bg-bg px-4 py-4">
              <div className="mb-3 flex items-baseline justify-between gap-3">
                <div>
                  <p className="label text-fg">Website</p>
                  <p className="metric mt-0.5 text-fg-dim">
                    Combined brand site traffic
                  </p>
                </div>
                <span className="metric text-fg">
                  {websiteTotal.toLocaleString()} lead
                  {websiteTotal === 1 ? "" : "s"}
                </span>
              </div>
              <div className="mb-4 h-1 w-full bg-line">
                <div
                  className="h-full bg-fg transition-all"
                  style={{
                    width: `${Math.max((websiteTotal / max) * 100, websiteTotal ? 3 : 0)}%`,
                    opacity: websiteTotal ? 1 : 0.12,
                  }}
                />
              </div>

              <ul className="space-y-3 border-t border-line pt-3">
                {websiteSites.map((site) => (
                  <li
                    key={site.id}
                    className="flex flex-wrap items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <Link
                        href={`/leads?q=${encodeURIComponent(site.label)}`}
                        className="label text-fg hover:underline"
                      >
                        {site.label}
                      </Link>
                      <a
                        href={site.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="metric mt-0.5 flex items-center gap-1 text-fg-dim hover:text-fg"
                      >
                        {site.url.replace(/^https?:\/\//, "")}
                        <ExternalLink
                          className="h-3 w-3 shrink-0"
                          strokeWidth={1.5}
                        />
                      </a>
                    </div>
                    <span className="metric text-fg-muted">
                      {site.count.toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <ul className="space-y-5">
              {otherChannels.map(({ channel, count }) => (
                <li key={channel}>
                  <div className="mb-2 flex items-baseline justify-between gap-3">
                    <Link
                      href={`/leads?q=${encodeURIComponent(channel)}`}
                      className="label text-fg hover:underline"
                    >
                      {channel}
                    </Link>
                    <span className="metric text-fg-muted">
                      {count.toLocaleString()} lead{count === 1 ? "" : "s"}
                    </span>
                  </div>
                  <div className="h-1 w-full bg-line">
                    <div
                      className="h-full bg-fg transition-all"
                      style={{
                        width: `${Math.max((count / max) * 100, count ? 3 : 0)}%`,
                        opacity: count ? 1 : 0.12,
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </Panel>
        </>
      )}
    </div>
  );
}
