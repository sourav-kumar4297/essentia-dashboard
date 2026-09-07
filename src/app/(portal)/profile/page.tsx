"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button, Field, PageHeader, Panel, inputClass } from "@/components/ui";
import { useAuth } from "@/lib/auth-context";
import { teamLabel } from "@/lib/teams";
import { ROLE_LABELS } from "@/lib/rbac";
import { isValidPhone, PHONE_FORMAT_HINT, withIndiaPhonePrefix } from "@/lib/phone";
import type { AuthUser } from "@/lib/bd-types";

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout, applyUser } = useAuth();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState(() => withIndiaPhonePrefix(""));
  const [toast, setToast] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(user?.name ?? "");
    setPhone(withIndiaPhonePrefix(user?.phone ?? ""));
  }, [user]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setToast("Display name is required.");
      return;
    }
    if (phone.trim() && !isValidPhone(phone)) {
      setToast(PHONE_FORMAT_HINT);
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), phone: phone.trim() }),
      });
      const data = (await res.json()) as { error?: string; user?: AuthUser };
      if (!res.ok || !data.user) {
        setToast(data.error || "Could not save.");
        setSaving(false);
        return;
      }
      applyUser(data.user);
      setToast("Profile saved.");
    } catch {
      setToast("Network error.");
    }
    setSaving(false);
  };

  return (
    <div>
      <PageHeader
        eyebrow="Account"
        title="Profile"
        description="Your details as shown across the portal."
      />

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <Panel className="animate-rise self-start">
          <div className="flex flex-col items-center py-4 text-center">
            <span className="flex h-16 w-16 items-center justify-center border border-line-strong bg-surface-hover font-body text-[26px] font-light text-fg">
              {(user?.name?.trim()[0] ?? "a").toLowerCase()}
            </span>
            <p className="heading mt-4 text-[20px]">{user?.name ?? "—"}</p>
            <p className="label mt-1 text-fg-muted">
              {user?.role ? ROLE_LABELS[user.role] : "—"}
            </p>
            {user?.team ? (
              <p className="label mt-1 text-fg-dim">{teamLabel(user.team)}</p>
            ) : null}
            <p className="metric mt-3 text-fg-dim">
              {user?.email ?? "Signed out"}
            </p>
            <Button
              variant="secondary"
              className="mt-5"
              onClick={async () => {
                await logout();
                router.replace("/login");
              }}
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </Button>
          </div>
        </Panel>

        <Panel className="animate-rise delay-1" title="Edit profile">
          <form onSubmit={(e) => void save(e)} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Display name">
                <input
                  className={inputClass}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                />
              </Field>
              <Field label="Phone">
                <input
                  className={inputClass}
                  value={phone}
                  onChange={(e) => setPhone(withIndiaPhonePrefix(e.target.value))}
                  placeholder="+91 9876543210"
                  inputMode="tel"
                />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Email">
                <input
                  type="email"
                  className={`${inputClass} opacity-70`}
                  value={user?.email ?? ""}
                  readOnly
                  disabled
                />
              </Field>
              <Field label="Role">
                <input
                  className={`${inputClass} opacity-70`}
                  value={user?.role ? ROLE_LABELS[user.role] : ""}
                  readOnly
                  disabled
                />
              </Field>
            </div>

            {toast && (
              <p className="label border border-line px-3 py-2 text-fg-muted">
                {toast}
              </p>
            )}

            <div className="border-t border-line pt-5">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </form>
        </Panel>
      </div>
    </div>
  );
}
