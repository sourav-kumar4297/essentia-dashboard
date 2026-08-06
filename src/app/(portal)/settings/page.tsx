"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Moon, RefreshCw, Sun, UserRound } from "lucide-react";
import { Button, PageHeader, Panel } from "@/components/ui";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/lib/auth-context";
import { canSyncHubspot } from "@/lib/rbac";
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
            Role: <span className="text-fg">{user?.role}</span>
          </p>
          <p className="label mt-1 text-fg-dim">
            {user?.role === "MEMBER"
              ? "Members see assigned leads and can create personal referrals."
              : "Full BD access — assign, approve referrals, sync HubSpot."}
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
              Saves the <span className="text-fg">first 200</span> contacts
              immediately, then imports the rest in the background so the UI
              stays usable.
            </p>
            <Button
              variant="secondary"
              disabled={hubspotBusy || hubspotBg}
              onClick={() => void syncHubspot()}
            >
              <RefreshCw
                className={clsx(
                  "h-3.5 w-3.5",
                  (hubspotBusy || hubspotBg) && "animate-spin",
                )}
              />
              {hubspotBusy
                ? "Saving first 200…"
                : hubspotBg
                  ? "Syncing rest in background…"
                  : "Sync HubSpot contacts"}
            </Button>
            {(toast || hubspotProgress) && (
              <p className="label mt-4 border border-line px-3 py-2 text-fg-muted">
                {hubspotProgress || toast}
              </p>
            )}
          </Panel>
        )}
      </div>
    </div>
  );
}
