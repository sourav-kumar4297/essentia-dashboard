"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Moon, RefreshCw, Sun, UserRound } from "lucide-react";
import { Button, PageHeader, Panel } from "@/components/ui";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/lib/auth-context";
import { canSyncHubspot, ROLE_LABELS } from "@/lib/rbac";
import { clsx } from "clsx";

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const [toast, setToast] = useState("");
  const [hubspotBusy, setHubspotBusy] = useState(false);
  const [hubspotBg, setHubspotBg] = useState(false);
  const [hubspotProgress, setHubspotProgress] = useState("");

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 6000);
    return () => clearTimeout(t);
  }, [toast]);

  async function syncChunk(body: {
    recent?: boolean;
    reset?: boolean;
    after?: string | null;
    limit?: number;
  }) {
    const res = await fetch("/api/hubspot/sync", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return (await res.json()) as {
      ok: boolean;
      message?: string;
      error?: string;
      done?: boolean;
      after?: string | null;
      created?: number;
      leadCount?: number;
    };
  }

  async function pullLatest() {
    setHubspotBusy(true);
    setHubspotProgress("");
    try {
      const result = await syncChunk({ recent: true });
      setToast(result.message || result.error || "Pull finished.");
    } catch {
      setToast("HubSpot pull failed.");
    } finally {
      setHubspotBusy(false);
    }
  }

  async function syncHubspot() {
    setHubspotBusy(true);
    setHubspotBg(false);
    setHubspotProgress("");
    try {
      // First 200 — clear + save + unlock UI
      const first = await syncChunk({ reset: true, limit: 200 });
      if (!first.ok) {
        setToast(first.message || first.error || "Sync failed.");
        setHubspotBusy(false);
        return;
      }

      setToast(
        `First ${first.created ?? 200} leads ready — open All Leads. Rest syncing in background…`,
      );
      setHubspotBusy(false);

      if (first.done) {
        setToast(first.message || "HubSpot sync complete.");
        return;
      }

      // Background: remaining chunks
      setHubspotBg(true);
      let after = first.after ?? null;
      while (after) {
        const chunk = await syncChunk({ reset: false, after, limit: 200 });
        if (!chunk.ok) {
          setToast(chunk.message || "Background sync stopped.");
          break;
        }
        setHubspotProgress(
          `${chunk.leadCount ?? 0} leads synced…`,
        );
        if (chunk.done) {
          setToast(chunk.message || "HubSpot sync complete.");
          after = null;
        } else {
          after = chunk.after ?? null;
        }
      }
    } catch {
      setToast("HubSpot sync failed.");
    } finally {
      setHubspotBusy(false);
      setHubspotBg(false);
      setHubspotProgress("");
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Account"
        title="Settings"
        description="Appearance, role and integrations."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel className="animate-rise" title="Appearance">
          <p className="label mb-4 text-fg-muted">
            Choose how the portal looks. Preference is remembered on this
            device.
          </p>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                ["dark", "Dark", Moon],
                ["light", "Light", Sun],
              ] as const
            ).map(([mode, label, Icon]) => (
              <button
                key={mode}
                type="button"
                onClick={() => theme !== mode && toggleTheme()}
                className={clsx(
                  "label flex items-center justify-center gap-2 border px-3 py-3 transition",
                  theme === mode
                    ? "border-fg bg-surface-hover text-fg"
                    : "border-line text-fg-muted hover:border-line-strong",
                )}
              >
                <Icon className="h-3.5 w-3.5" strokeWidth={1.5} />
                {label}
              </button>
            ))}
          </div>
        </Panel>

        <Panel className="animate-rise delay-1" title="Account">
          <p className="label mb-1 text-fg-muted">Signed in as</p>
          <p className="label text-fg">{user?.name}</p>
          <p className="metric mt-1 text-fg-dim">{user?.email}</p>
          <p className="label mt-3 text-fg-muted">
            Role:{" "}
            <span className="text-fg">
              {user ? ROLE_LABELS[user.role] : "—"}
            </span>
          </p>
          <p className="label mt-1 text-fg-dim">
            {user?.role === "MEMBER"
              ? "You see assigned leads. Call, log notes, set Hot/Warm/Cold, then return ready leads to Team Leader."
              : user?.role === "ADMIN"
                ? "Assign leads to executives. When an executive returns a Hot or Warm lead, you send it to the next team (coming next)."
                : "All flows — users, HubSpot, assign, and pipeline."}
          </p>
          <Link href="/profile" className="mt-4 inline-block">
            <Button variant="secondary">
              <UserRound className="h-3.5 w-3.5" />
              Edit profile
            </Button>
          </Link>
        </Panel>

        {user && canSyncHubspot(user.role) && (
          <Panel className="animate-rise delay-2" title="HubSpot">
            <p className="label mb-4 text-fg-muted">
              All Leads pulls new and updated HubSpot contacts when you open
              the page, then every minute while it stays open. Dates are the
              HubSpot created time. Daily cron at 2:00 AM IST is a backup.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                disabled={hubspotBusy || hubspotBg}
                onClick={() => void pullLatest()}
              >
                <RefreshCw
                  className={clsx(
                    "h-3.5 w-3.5",
                    hubspotBusy && !hubspotBg && "animate-spin",
                  )}
                />
                {hubspotBusy && !hubspotBg ? "Pulling…" : "Pull latest"}
              </Button>
              <Button
                variant="ghost"
                disabled={hubspotBusy || hubspotBg}
                onClick={() => void syncHubspot()}
              >
                {hubspotBg ? "Re-importing…" : "Full re-import"}
              </Button>
            </div>
            {(toast || hubspotProgress) && (
              <p className="label mt-4 border border-line px-3 py-2 text-fg-muted">
                {hubspotProgress || toast}
              </p>
            )}
          </Panel>
        )}

        {user?.role === "SUPERADMIN" && <TeamRolesPanel />}
      </div>
    </div>
  );
}

function TeamRolesPanel() {
  const { user, switchUser, isImpersonating } = useAuth();
  const [users, setUsers] = useState<
    {
      id: string;
      name: string;
      email: string;
      role: string;
      blocked?: boolean;
    }[]
  >([]);
  const [busyId, setBusyId] = useState("");
  const [toast, setToast] = useState("");

  useEffect(() => {
    void fetch("/api/users", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setUsers(d.users ?? []))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  async function patchUser(
    id: string,
    body: { role?: "ADMIN" | "MEMBER"; blocked?: boolean },
  ) {
    setBusyId(id);
    const res = await fetch(`/api/users/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const data = (await res.json()) as {
        user: {
          id: string;
          role: string;
          blocked: boolean;
        };
      };
      setUsers((list) =>
        list.map((u) =>
          u.id === id
            ? { ...u, role: data.user.role, blocked: data.user.blocked }
            : u,
        ),
      );
    }
    setBusyId("");
  }

  async function removeUser(id: string, email: string) {
    const ok = window.confirm(
      `Remove ${email}?\n\nTheir account is deleted. If they sign in again with the same email, they get a fresh profile.`,
    );
    if (!ok) return;
    setBusyId(id);
    const res = await fetch(`/api/users/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    setBusyId("");
    if (!res.ok) {
      setToast(data.error || "Could not remove user.");
      return;
    }
    setUsers((list) => list.filter((u) => u.id !== id));
    setToast("User removed. They can join again as a fresh profile.");
  }

  async function checkIn(id: string) {
    setBusyId(id);
    const result = await switchUser(id);
    setBusyId("");
    if (!result.ok) {
      setToast(result.error || "Could not check in.");
      return;
    }
    window.location.assign("/pipeline");
  }

  const canEditRoles = user?.role === "SUPERADMIN" && !isImpersonating;

  return (
    <Panel className="animate-rise delay-2 lg:col-span-2" title="Team access">
      <p className="label mb-4 text-fg-muted">
        Super Admin — check in as any team leader / executive without OTP. Remove
        deletes the account; if they sign in again, they start as a fresh
        profile.
      </p>
      {toast && (
        <p
          className={`label mb-3 border px-3 py-2 ${
            toast.includes("removed") || toast.includes("fresh")
              ? "border-line text-fg-muted"
              : "border-error/40 text-error"
          }`}
        >
          {toast}
        </p>
      )}
      <ul className="divide-y divide-line border border-line">
        {users.map((u) => {
          const viewingAs = user?.id === u.id;
          return (
            <li
              key={u.id}
              className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5"
            >
              <div className="min-w-0">
                <p className="label text-fg">
                  {u.name}
                  {viewingAs ? (
                    <span className="ml-2 text-fg-muted">(you)</span>
                  ) : null}
                </p>
                <p className="metric text-fg-dim">{u.email}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {u.role === "SUPERADMIN" ? (
                  <span className="label text-fg-muted">
                    {ROLE_LABELS.SUPERADMIN}
                  </span>
                ) : (
                  <>
                    {canEditRoles ? (
                      <>
                        <select
                          className="border border-line bg-transparent px-2 py-1.5 font-body text-[13px] font-light text-fg outline-none"
                          value={u.role}
                          disabled={busyId === u.id}
                          onChange={(e) =>
                            void patchUser(u.id, {
                              role: e.target.value as "ADMIN" | "MEMBER",
                            })
                          }
                        >
                          <option value="ADMIN">{ROLE_LABELS.ADMIN}</option>
                          <option value="MEMBER">{ROLE_LABELS.MEMBER}</option>
                        </select>
                        <Button
                          variant="danger"
                          disabled={busyId === u.id}
                          onClick={() => void removeUser(u.id, u.email)}
                        >
                          Remove
                        </Button>
                      </>
                    ) : (
                      <span className="label text-fg-muted">
                        {ROLE_LABELS[u.role as keyof typeof ROLE_LABELS] ??
                          u.role}
                      </span>
                    )}
                    {!u.blocked && !viewingAs && (
                      <Button
                        variant="secondary"
                        disabled={busyId === u.id}
                        onClick={() => void checkIn(u.id)}
                      >
                        Check in
                      </Button>
                    )}
                  </>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}
