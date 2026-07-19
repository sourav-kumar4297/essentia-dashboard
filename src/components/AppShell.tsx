"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clsx } from "clsx";
import {
  LayoutDashboard,
  Inbox,
  GitBranch,
  Radio,
  FileText,
  Calculator,
  MessagesSquare,
  Handshake,
  LogOut,
  Menu,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Settings,
  UserRound,
  ChevronsUpDown,
} from "lucide-react";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";
import { logout } from "@/lib/auth";
import { usePortal } from "@/lib/store";
import { useProfile } from "@/lib/profile";
import { useTheme } from "@/lib/theme";

const COLLAPSE_KEY = "essentia_sidebar_collapsed_v1";

const NAV = [
  {
    group: "Lead platform",
    items: [
      {
        href: "/pipeline",
        label: "Dashboard",
        hint: "Lead intelligence",
        icon: LayoutDashboard,
      },
      {
        href: "/leads",
        label: "All Leads",
        hint: "Full lead list",
        icon: Inbox,
      },
      {
        href: "/board",
        label: "Pipeline",
        hint: "Stage board",
        icon: GitBranch,
      },
      {
        href: "/channels",
        label: "Channels",
        hint: "Source mix",
        icon: Radio,
      },
    ],
  },
  {
    group: "Tools",
    items: [
      {
        href: "/company-profile",
        label: "Profile Generator",
        hint: "Company profile",
        icon: FileText,
      },
      {
        href: "/proposals",
        label: "Fee Configurator",
        hint: "Design fee proposal",
        icon: Calculator,
      },
    ],
  },
  {
    group: "Journey",
    items: [
      {
        href: "/consultation",
        label: "Consultation",
        hint: "Discovery capture",
        icon: MessagesSquare,
      },
      {
        href: "/closing",
        label: "Closing",
        hint: "Order · handoff",
        icon: Handshake,
      },
    ],
  },
  {
    group: "Account",
    items: [
      {
        href: "/profile",
        label: "Profile",
        hint: "Your details",
        icon: UserRound,
      },
      {
        href: "/settings",
        label: "Settings",
        hint: "Preferences",
        icon: Settings,
      },
    ],
  },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { leads } = usePortal();
  const { profile } = useProfile();
  const { theme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const logoVariant = theme === "dark" ? "white" : "espresso";
  const initial = (profile.name.trim()[0] ?? "A").toUpperCase();

  useEffect(() => {
    setProfileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (localStorage.getItem(COLLAPSE_KEY) === "1") setCollapsed(true);
  }, []);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      return next;
    });
  }

  const navBody = (opts: { compact: boolean; onNavigate?: () => void }) => {
    const { compact, onNavigate } = opts;
    return (
      <>
        <div
          className={clsx(
            "border-b border-line",
            compact ? "px-2 pb-4 pt-5" : "px-5 pb-5 pt-6",
          )}
        >
          <div
            className={clsx(
              "flex items-center",
              compact ? "justify-center" : "justify-between gap-2",
            )}
          >
            <Link
              href="/pipeline"
              onClick={onNavigate}
              className={clsx(compact && "flex justify-center")}
              title="essentia"
            >
              {compact ? (
                <span className="flex h-9 w-9 items-center justify-center border border-line font-body text-[13px] font-light text-fg">
                  e
                </span>
              ) : (
                <Logo variant={logoVariant} height={20} />
              )}
            </Link>
            {!compact && (
              <button
                type="button"
                onClick={toggleCollapsed}
                className="hidden border border-line p-1.5 text-fg-muted transition hover:border-line-strong hover:text-fg md:inline-flex"
                aria-label="Collapse sidebar"
                title="Show icons only"
              >
                <PanelLeftClose className="h-4 w-4" strokeWidth={1.5} />
              </button>
            )}
          </div>
          {!compact && (
            <>
              <p className="label mt-5 tracking-[0.18em] text-fg-muted uppercase">
                Client Advisory
              </p>
              <p className="heading mt-1.5 text-[17px]">
                Lead Management Platform
              </p>
            </>
          )}
        </div>

        <nav
          className={clsx(
            "no-scrollbar flex-1 space-y-5 overflow-y-auto pb-4",
            compact ? "px-1.5" : "px-2.5",
          )}
        >
          {NAV.map((section) => (
            <div key={section.group}>
              {!compact && (
                <p className="label mb-1.5 px-2.5 tracking-[0.18em] text-fg-dim uppercase">
                  {section.group}
                </p>
              )}
              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const active =
                    pathname === item.href ||
                    pathname.startsWith(`${item.href}/`);
                  const Icon = item.icon;
                  const leadCount =
                    item.href === "/leads" ? leads.length : null;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onNavigate}
                        title={compact ? item.label : undefined}
                        className={clsx(
                          "nav-link flex items-center transition",
                          compact
                            ? "justify-center px-1 py-2.5"
                            : "gap-3 px-2.5 py-2.5",
                          active
                            ? "nav-link-active"
                            : "text-fg-muted hover:bg-surface-hover hover:text-fg",
                        )}
                      >
                        <span
                          className={clsx(
                            "flex h-8 w-8 shrink-0 items-center justify-center border",
                            active
                              ? "border-line-strong bg-bg/50"
                              : "border-line",
                          )}
                        >
                          <Icon className="h-3.5 w-3.5" strokeWidth={1.5} />
                        </span>
                        {!compact && (
                          <span className="min-w-0 flex-1">
                            <span className="label flex items-center gap-2 text-fg">
                              {item.label}
                              {leadCount != null && (
                                <span className="metric text-fg-dim">
                                  ({leadCount})
                                </span>
                              )}
                            </span>
                            <span className="metric block text-fg-dim">
                              {item.hint}
                            </span>
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div
          className={clsx(
            "shrink-0 space-y-2 border-t border-line",
            compact ? "p-2" : "p-3",
          )}
        >
          {compact && (
            <button
              type="button"
              onClick={toggleCollapsed}
              className="flex w-full items-center justify-center border border-line p-2 text-fg-muted transition hover:border-line-strong hover:text-fg"
              aria-label="Expand sidebar"
              title="Show full menu"
            >
              <PanelLeftOpen className="h-4 w-4" strokeWidth={1.5} />
            </button>
          )}

          <div className="relative">
            {profileMenuOpen && (
              <>
                <button
                  type="button"
                  aria-label="Close profile menu"
                  className="fixed inset-0 z-10 cursor-default"
                  onClick={() => setProfileMenuOpen(false)}
                />
                <div className="absolute bottom-[calc(100%+8px)] left-0 z-20 w-52 border border-line bg-bg shadow-xl">
                  <Link
                    href="/profile"
                    onClick={() => {
                      setProfileMenuOpen(false);
                      onNavigate?.();
                    }}
                    className="label flex items-center gap-2.5 px-3.5 py-2.5 text-fg transition hover:bg-surface-hover"
                  >
                    <UserRound className="h-3.5 w-3.5" strokeWidth={1.5} />
                    Edit profile
                  </Link>
                  <Link
                    href="/settings"
                    onClick={() => {
                      setProfileMenuOpen(false);
                      onNavigate?.();
                    }}
                    className="label flex items-center gap-2.5 px-3.5 py-2.5 text-fg transition hover:bg-surface-hover"
                  >
                    <Settings className="h-3.5 w-3.5" strokeWidth={1.5} />
                    Settings
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setProfileMenuOpen(false);
                      logout();
                      router.replace("/login");
                    }}
                    className="label flex w-full items-center gap-2.5 border-t border-line px-3.5 py-2.5 text-fg transition hover:bg-surface-hover"
                  >
                    <LogOut className="h-3.5 w-3.5" strokeWidth={1.5} />
                    Sign out
                  </button>
                </div>
              </>
            )}

            <button
              type="button"
              onClick={() => setProfileMenuOpen((v) => !v)}
              aria-label="Account menu"
              title={compact ? profile.name : undefined}
              className={clsx(
                "flex w-full items-center transition",
                compact
                  ? "justify-center border border-line p-1.5 hover:border-line-strong"
                  : "gap-3 border border-line px-3 py-2.5 hover:border-line-strong hover:bg-surface-hover",
              )}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center border border-line-strong bg-surface-hover font-body text-[13px] font-light text-fg">
                {initial}
              </span>
              {!compact && (
                <>
                  <span className="min-w-0 flex-1 text-left">
                    <span className="label block truncate text-fg">
                      {profile.name}
                    </span>
                    <span className="metric block truncate text-fg-dim">
                      {profile.email || profile.title}
                    </span>
                  </span>
                  <ChevronsUpDown
                    className="h-3.5 w-3.5 shrink-0 text-fg-dim"
                    strokeWidth={1.5}
                  />
                </>
              )}
            </button>
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="flex min-h-screen bg-bg text-fg">
      <aside
        className={clsx(
          "no-print fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-line bg-sidebar transition-[width] duration-200 ease-out md:flex",
          collapsed ? "w-[72px]" : "w-[268px]",
        )}
      >
        {navBody({ compact: collapsed })}
      </aside>

      {mobileOpen && (
        <div className="no-print fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/45"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-[280px] max-w-[85vw] flex-col border-r border-line bg-sidebar shadow-2xl">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-4 z-10 p-1.5 text-fg-muted hover:text-fg"
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" />
            </button>
            {navBody({
              compact: false,
              onNavigate: () => setMobileOpen(false),
            })}
          </aside>
        </div>
      )}

      <div
        className={clsx(
          "flex min-h-screen min-w-0 flex-1 flex-col transition-[padding] duration-200 ease-out",
          collapsed ? "md:pl-[72px]" : "md:pl-[268px]",
        )}
      >
        <header
          className="no-print sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-line px-4 backdrop-blur-md md:px-8"
          style={{ background: "var(--header)" }}
        >
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="border border-line p-2 text-fg transition hover:border-line-strong hover:bg-surface md:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-4 w-4" />
            </button>
            {collapsed && (
              <button
                type="button"
                className="hidden border border-line p-2 text-fg transition hover:border-line-strong hover:bg-surface md:inline-flex"
                onClick={toggleCollapsed}
                aria-label="Expand sidebar"
                title="Show full menu"
              >
                <PanelLeftOpen className="h-4 w-4" strokeWidth={1.5} />
              </button>
            )}
            <p className="label hidden text-fg-dim sm:block">
              essentia group · Lead Management
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/leads?new=1"
              className="hidden items-center gap-1.5 border border-line px-3 py-1.5 font-body text-[11px] font-light uppercase tracking-[0.14em] text-fg transition hover:bg-surface sm:inline-flex"
            >
              <Plus className="h-3.5 w-3.5" />
              New Lead
            </Link>
            <ThemeToggle />
          </div>
        </header>

        <main className="shell-main min-w-0 flex-1 px-4 py-8 md:px-10 md:py-10">
          <div className="mx-auto min-w-0 max-w-5xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
