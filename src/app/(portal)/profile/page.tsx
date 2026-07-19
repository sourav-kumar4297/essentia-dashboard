"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button, Field, PageHeader, Panel, inputClass } from "@/components/ui";
import { useProfile } from "@/lib/profile";
import { logout, DEMO_CREDENTIALS } from "@/lib/auth";

export default function ProfilePage() {
  const router = useRouter();
  const { profile, updateProfile } = useProfile();
  const [form, setForm] = useState(profile);
  const [toast, setToast] = useState("");

  useEffect(() => {
    setForm(profile);
  }, [profile]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setToast("Display name is required.");
      return;
    }
    updateProfile({
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      title: form.title.trim(),
    });
    setToast("Profile saved.");
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
            <span className="flex h-16 w-16 items-center justify-center border border-line-strong bg-surface-hover font-display text-[26px] text-fg">
              {(profile.name.trim()[0] ?? "A").toUpperCase()}
            </span>
            <p className="heading mt-4 text-[20px]">{profile.name}</p>
            <p className="label mt-1 text-fg-muted">{profile.title || "—"}</p>
            <p className="metric mt-3 text-fg-dim">
              Signed in as {DEMO_CREDENTIALS.username}
            </p>
            <Button
              variant="secondary"
              className="mt-5"
              onClick={() => {
                logout();
                router.replace("/login");
              }}
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </Button>
          </div>
        </Panel>

        <Panel className="animate-rise delay-1" title="Edit profile">
          <form onSubmit={save} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Display name">
                <input
                  className={inputClass}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Your name"
                />
              </Field>
              <Field label="Role / title">
                <input
                  className={inputClass}
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Growth Advisor"
                />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Email">
                <input
                  type="email"
                  className={inputClass}
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="name@essentia.com"
                />
              </Field>
              <Field label="Phone">
                <input
                  className={inputClass}
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+91 …"
                />
              </Field>
            </div>

            {toast && (
              <p className="label border border-line px-3 py-2 text-fg-muted">
                {toast}
              </p>
            )}

            <div className="border-t border-line pt-5">
              <Button type="submit">Save changes</Button>
            </div>
          </form>
        </Panel>
      </div>
    </div>
  );
}
