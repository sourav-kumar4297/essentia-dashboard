"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clsx } from "clsx";
import {
  LayoutDashboard,
  Inbox,
  GitBranch,
  Radio,
  Calculator,
  LogOut,
  Menu,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Settings,
  UserRound,
  ChevronsUpDown,
  ChevronDown,
} from "lucide-react";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";
import { NotificationsMenu } from "./NotificationsMenu";
import { useAuth } from "@/lib/auth-context";
import { useLeadTotal } from "@/lib/use-bd-leads";
import { useTheme } from "@/lib/theme";
import { useNavProgress } from "@/components/RouteProgress";

const COLLAPSE_KEY = "essentia_sidebar_collapsed_v1";

const MAIN_NAV = [
  {
    group: "",
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
        href: "/proposals",
        label: "Fee Configurator",
        hint: "Design fee proposal",
        icon: Calculator,
      },
    ],
  },
] as const;

const DASH_HREFS = ["/pipeline", "/leads", "/board", "/channels"] as const;

function isDashPath(pathname: string) {
  return DASH_HREFS.some((href) =>
    href === "/pipeline"
      ? pathname === "/pipeline"
      : pathname === href || pathname.startsWith(`${href}/`),
  );
}

const ACCOUNT_NAV = [
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
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { total: leadTotal } = useLeadTotal();
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const { pendingHref, startNav } = useNavProgress();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const onDash = isDashPath(pathname);
  const [dashOpen, setDashOpen] = useState(onDash);
  const wasOnDash = useRef(onDash);
  const logoVariant = theme === "dark" ? "white" : "espresso";
  const displayName = user?.name ?? "User";
  const displayEmail = user?.email ?? "";
  const initial = (displayName.trim()[0] ?? "A").toUpperCase();
  const roleLabel = user?.role ?? "MEMBER";
  const wide =
    pathname.startsWith("/leads") ||
    pathname.startsWith("/board") ||
    pathname.startsWith("/pipeline") ||
    pathname.startsWith("/channels") ||
    pathname.startsWith("/proposals");

  useEffect(() => {
    setProfileMenuOpen(false);
  }, [pathname]);

  // Open when entering lead-platform pages; close when leaving. Manual toggle otherwise.
  useEffect(() => {
    if (onDash === wasOnDash.current) return;
    wasOnDash.current = onDash;
    setDashOpen(onDash);
  }, [onDash]);

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
      <div className="flex h-full min-h-0 flex-col justify-between">
        <div className="min-h-0">
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
              onClick={() => {
                startNav("/pipeline");
                onNavigate?.();
              }}
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
            <p className="heading mt-5 text-[20px] leading-snug text-fg">
              Lead Management Platform
            </p>
          )}
        </div>

        <nav
          className={clsx(
            "no-scrollbar space-y-5 overflow-y-auto pb-4",
            compact ? "px-1.5" : "px-2.5",
          )}
        >
          {MAIN_NAV.map((section) => {
            const isDashGroup = !section.group;
            const showDashChildren = isDashGroup && dashOpen;
            return (
            <div key={section.group || "main"}>
              {!compact && section.group && (
                <p className="label mb-1.5 px-2.5 tracking-[0.18em] text-fg-dim uppercase">
                  {section.group}
                </p>
              )}
              {isDashGroup && !compact && (
                <div
                  className={clsx(
                    "nav-link relative z-10 mb-0.5 flex w-full items-center gap-1 px-1 py-1",
                    onDash || dashOpen
                      ? "text-fg"
                      : "text-fg-muted",
                  )}
                >
                  <Link
                    href="/pipeline"
                    onClick={() => {
                      startNav("/pipeline");
                      setDashOpen(true);
                      setProfileMenuOpen(false);
                      onNavigate?.();
                    }}
                    className={clsx(
                      "flex min-w-0 flex-1 items-center gap-3 px-1.5 py-1.5 transition hover:bg-surface-hover hover:text-fg",
                      pathname === "/pipeline" && "nav-link-active",
                    )}
                  >
                    <span
                      className={clsx(
                        "flex h-8 w-8 shrink-0 items-center justify-center border",
                        onDash || dashOpen
                          ? "border-line-strong bg-bg/50"
                          : "border-line",
                      )}
                    >
                      <LayoutDashboard
                        className="h-3.5 w-3.5"
                        strokeWidth={1.5}
                      />
                    </span>
                    <span className="min-w-0 flex-1 text-left">
                      <span className="label block text-fg">Dashboard</span>
                      <span className="metric block text-fg-dim">
                        Lead platform
                      </span>
                    </span>
                  </Link>
                  <button
                    type="button"
                    aria-label={dashOpen ? "Collapse dashboard menu" : "Expand dashboard menu"}
                    aria-expanded={dashOpen}
                    aria-controls="sidebar-dash-menu"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDashOpen((v) => !v);
                    }}
                    className="flex h-9 w-9 shrink-0 items-center justify-center border border-transparent text-fg-dim transition hover:border-line hover:bg-surface-hover hover:text-fg"
                  >
                    <ChevronDown
                      className={clsx(
                        "h-3.5 w-3.5 transition-transform duration-200",
                        dashOpen && "rotate-180",
                      )}
                      strokeWidth={1.5}
                    />
                  </button>
                </div>
              )}
              {(compact || !isDashGroup || showDashChildren) && (
              <ul
                id={isDashGroup ? "sidebar-dash-menu" : undefined}
                className="space-y-0.5"
              >
                {section.items
                  .filter(
                    (item) =>
                      compact || !isDashGroup || item.href !== "/pipeline",
                  )
                  .map((item) => {
                  const active =
                    item.href === "/pipeline"
                      ? pathname === "/pipeline"
                      : pathname === item.href ||
                        pathname.startsWith(`${item.href}/`);
                  const pending =
                    !active && pendingHref.split("?")[0] === item.href;
                  const Icon = item.icon;
                  const leadCount =
                    item.href === "/leads" ? leadTotal : null;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => {
                          startNav(item.href);
                          setProfileMenuOpen(false);
                          onNavigate?.();
                        }}
                        title={compact ? item.label : undefined}
                        className={clsx(
                          "nav-link relative z-10 flex items-center",
                          compact
                            ? "justify-center px-1 py-2.5"
                            : "gap-3 px-2.5 py-2.5",
                          !compact && isDashGroup && "ml-3",
                          active
                            ? "nav-link-active"
                            : pending
                              ? "nav-link-pending"
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
              )}
            </div>
            );
          })}
        </nav>
        </div>

        <div
          className={clsx(
            "relative z-20 shrink-0 space-y-2 border-t border-line bg-sidebar",
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

          {!compact && (
            <p className="label px-1 pb-1 tracking-[0.18em] text-fg-dim uppercase">
              Account
            </p>
          )}
          <ul className="space-y-0.5">
            {ACCOUNT_NAV.map((item) => {
              const active =
                pathname === item.href ||
                pathname.startsWith(`${item.href}/`);
              const pending =
                !active && pendingHref.split("?")[0] === item.href;
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => {
                      startNav(item.href);
                      setProfileMenuOpen(false);
                      onNavigate?.();
                    }}
                    title={compact ? item.label : undefined}
                    className={clsx(
                      "nav-link relative z-10 flex items-center",
                      compact
                        ? "justify-center px-1 py-2.5"
                        : "gap-3 px-2.5 py-2.5",
                      active
                        ? "nav-link-active"
                        : pending
                          ? "nav-link-pending"
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
                        <span className="label block text-fg">{item.label}</span>
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

          <div className="relative">
            {profileMenuOpen && (
              <div className="absolute bottom-[calc(100%+8px)] left-0 z-50 w-full min-w-[200px] max-w-[240px] border border-line bg-bg shadow-xl">
                <Link
                  href="/profile"
                  onClick={() => {
                    startNav("/profile");
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
                    startNav("/settings");
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
                  onClick={async () => {
                    setProfileMenuOpen(false);
                    await logout();
                    router.replace("/login");
                  }}
                  className="label flex w-full items-center gap-2.5 border-t border-line px-3.5 py-2.5 text-fg transition hover:bg-surface-hover"
                >
                  <LogOut className="h-3.5 w-3.5" strokeWidth={1.5} />
                  Sign out
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => setProfileMenuOpen((v) => !v)}
              aria-label="Account menu"
              title={compact ? displayName : undefined}
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
                      {displayName}
                    </span>
                    <span className="metric block truncate text-fg-dim">
                      {roleLabel} · {displayEmail}
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
      </div>
    );
  };

  return (
    <div className="flex h-dvh min-h-0 overflow-hidden bg-bg text-fg">
      {profileMenuOpen && (
        <button
          type="button"
          aria-label="Close profile menu"
          className="fixed inset-0 z-[35] cursor-default"
          onClick={() => setProfileMenuOpen(false)}
        />
      )}

      <aside
        className={clsx(
          "no-print fixed inset-y-0 left-0 z-40 hidden h-screen flex-col overflow-hidden border-r border-line bg-sidebar transition-[width] duration-200 ease-out md:flex",
          collapsed ? "w-[72px]" : "w-[268px]",
        )}
        style={{
          background:
            "linear-gradient(180deg, var(--sidebar) 0%, color-mix(in srgb, var(--sidebar) 92%, var(--bg-soft)) 100%)",
        }}
      >
        <div className="flex h-full min-h-0 flex-col">{navBody({ compact: collapsed })}</div>
      </aside>

      {mobileOpen && (
        <div className="no-print fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/45"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex h-full w-[280px] max-w-[85vw] flex-col overflow-hidden border-r border-line bg-sidebar shadow-2xl">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-4 z-10 p-1.5 text-fg-muted hover:text-fg"
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex h-full min-h-0 flex-col">
              {navBody({
                compact: false,
                onNavigate: () => setMobileOpen(false),
              })}
            </div>
          </aside>
        </div>
      )}

      <div
        className={clsx(
          "flex h-dvh min-h-0 min-w-0 flex-1 flex-col transition-[padding] duration-200 ease-out",
          collapsed ? "md:pl-[72px]" : "md:pl-[268px]",
        )}
      >
        <header
          className="no-print sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-line px-4 backdrop-blur-md md:px-8"
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
              onClick={() => startNav("/leads?new=1")}
              className="hidden items-center gap-1.5 bg-fg px-3.5 py-1.5 font-body text-[11px] font-normal uppercase tracking-[0.14em] text-bg shadow-[var(--elev-sm)] transition hover:opacity-90 active:scale-[0.98] sm:inline-flex"
            >
              <Plus className="h-3.5 w-3.5" />
              New Lead
            </Link>
            <NotificationsMenu />
            <ThemeToggle />
          </div>
        </header>

        <main
          className={clsx(
            "shell-main flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto py-6 md:py-8",
            wide ? "px-3 md:px-4 lg:px-5" : "px-4 md:px-6 lg:px-8",
          )}
        >
          <div
            key={pathname}
            className={clsx(
              "page-enter mx-auto flex min-h-0 w-full min-w-0 flex-1 flex-col",
              wide ? "max-w-none" : "max-w-5xl",
            )}
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
