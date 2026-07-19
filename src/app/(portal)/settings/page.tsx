"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Moon, RefreshCw, Sun, UserRound } from "lucide-react";
import { Button, PageHeader, Panel } from "@/components/ui";
import { useTheme } from "@/lib/theme";
import { usePortal } from "@/lib/store";
import { useProfile } from "@/lib/profile";
import { clsx } from "clsx";

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const { resetDemo, leads } = usePortal();
  const { profile } = useProfile();
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  return (
    <div>
      <PageHeader
        eyebrow="Account"
        title="Settings"
        description="Appearance, data and account preferences."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel className="animate-rise" title="Appearance">
          <p className="label mb-4 text-fg-muted">
            Choose how the portal looks. Your preference is remembered on this
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

        <Panel className="animate-rise delay-1" title="Profile">
          <p className="label mb-4 text-fg-muted">
            Signed in as <span className="text-fg">{profile.name}</span>
            {profile.email ? ` · ${profile.email}` : ""}. Update your details
            from the profile page.
          </p>
          <Link href="/profile">
            <Button variant="secondary">
              <UserRound className="h-3.5 w-3.5" />
              Edit profile
            </Button>
          </Link>
        </Panel>

        <Panel className="animate-rise delay-2" title="Demo data">
          <p className="label mb-4 text-fg-muted">
            The portal currently holds {leads.length} sample lead
            {leads.length === 1 ? "" : "s"}. Resetting restores the original
            sample dataset — anything you added will be removed.
          </p>
          <Button
            variant="danger"
            onClick={() => {
              if (confirm("Reset demo data? Everything you added will be lost.")) {
                resetDemo();
                setToast("Demo data restored.");
              }
            }}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Reset sample data
          </Button>
          {toast && (
            <p className="label mt-4 border border-line px-3 py-2 text-fg-muted">
              {toast}
            </p>
          )}
        </Panel>
      </div>
    </div>
  );
}
