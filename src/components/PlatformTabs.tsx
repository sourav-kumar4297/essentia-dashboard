"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { useLeadTotal } from "@/lib/use-bd-leads";
import { useNavProgress } from "@/components/RouteProgress";

const TABS = [
  { href: "/pipeline", label: "Dashboard" },
  { href: "/leads", label: "All Leads" },
  { href: "/board", label: "Pipeline" },
  { href: "/channels", label: "Channels" },
] as const;

export function PlatformTabs() {
  const pathname = usePathname();
  const { total } = useLeadTotal();
  const { pendingHref, startNav } = useNavProgress();

  return (
    <div className="mb-5 flex flex-wrap gap-1 border-b border-line/80">
      {TABS.map((tab) => {
        const active =
          tab.href === "/pipeline"
            ? pathname === "/pipeline"
            : pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        const pending =
          !active && pendingHref.split("?")[0] === tab.href;
        const label =
          tab.href === "/leads" ? `All Leads (${total.toLocaleString()})` : tab.label;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            onClick={() => startNav(tab.href)}
            className={clsx(
              "label relative -mb-px border-b-2 px-3.5 py-2.5 tracking-[0.04em] transition active:opacity-60",
              active
                ? "border-fg text-fg"
                : pending
                  ? "border-fg/40 text-fg animate-pulse-soft"
                  : "border-transparent text-fg-muted hover:border-line-strong hover:text-fg",
            )}
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}
