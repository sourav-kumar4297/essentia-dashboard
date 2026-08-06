"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { useLeadTotal } from "@/lib/use-bd-leads";

const TABS = [
  { href: "/pipeline", label: "Dashboard" },
  { href: "/leads", label: "All Leads" },
  { href: "/board", label: "Pipeline" },
  { href: "/channels", label: "Channels" },
] as const;

export function PlatformTabs() {
  const pathname = usePathname();
  const { total } = useLeadTotal();

  return (
    <div className="mb-5 flex flex-wrap gap-1 border-b border-line">
      {TABS.map((tab) => {
        const active =
          tab.href === "/pipeline"
            ? pathname === "/pipeline"
            : pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        const label =
          tab.href === "/leads" ? `All Leads (${total.toLocaleString()})` : tab.label;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={clsx(
              "label border-b-2 px-3 py-2.5 transition",
              active
                ? "border-fg text-fg"
                : "border-transparent text-fg-muted hover:text-fg",
            )}
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}
