"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Field, inputClass } from "@/components/ui";
import { useAuth } from "@/lib/auth-context";
import type { AuthUser } from "@/lib/bd-types";
import { isValidPhone, PHONE_FORMAT_HINT, withIndiaPhonePrefix } from "@/lib/phone";
import { clsx } from "clsx";

export default function OnboardingPage() {
  const router = useRouter();
  const { user, applyUser, logout } = useAuth();
  const [name, setName] = useState(user?.name && !user.name.includes("@") ? user.name : "");
  const [phone, setPhone] = useState(() =>
    withIndiaPhonePrefix(user?.phone ?? ""),
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function exitSetup() {
    await logout();
    router.replace("/login");
  }

  async function finish(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim()) {
      setError("enter your name.");
      return;
    }
    if (!isValidPhone(phone)) {
      setError(PHONE_FORMAT_HINT.toLowerCase());
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/setup-profile", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), phone: phone.trim() }),
      });
      const data = (await res.json()) as { error?: string; user?: AuthUser };
      if (!res.ok || !data.user) {
        setError(data.error || "could not save profile.");
        setLoading(false);
        return;
      }
      applyUser(data.user);
      router.replace("/pipeline");
    } catch {
      setError("network error. try again.");
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-bg px-6 py-16 text-fg">
      <div className="absolute left-5 top-5">
        <div className="bg-black px-3 py-2">
          <Logo variant="white" height={16} />
        </div>
      </div>
      <div className="absolute right-5 top-5">
        <ThemeToggle />
      </div>

      <div className="panel-surface w-full max-w-md px-6 py-8 md:px-8 md:py-10">
        <div className="flex items-center justify-between gap-3">
          <p className="label text-[13px] tracking-[0.16em] text-fg-muted">
            profile setup
          </p>
          <button
            type="button"
            onClick={() => void exitSetup()}
            className="inline-flex items-center border border-line px-2.5 py-1.5 font-body text-[12px] font-light text-fg-muted transition hover:border-line-strong hover:text-fg"
          >
            exit
          </button>
        </div>

        <h1 className="heading mt-3 text-[32px] md:text-[36px]">
          set up your profile
        </h1>
        <p className="label mt-2 text-[14px] leading-relaxed text-fg-muted">
          {user?.email ? `signed in as ${user.email}. ` : null}
          add your name and phone number to continue. you only do this once.
        </p>

        <form onSubmit={finish} className="mt-8 space-y-4">
          <Field label="name">
            <input
              className={clsx(inputClass, error && !name.trim() && "!border-error/60")}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="your full name"
              autoComplete="name"
              autoFocus
              disabled={loading}
            />
          </Field>
          <Field label="phone number">
            <input
              className={clsx(
                inputClass,
                error && !isValidPhone(phone) && "!border-error/60",
              )}
              value={phone}
              onChange={(e) => setPhone(withIndiaPhonePrefix(e.target.value))}
              placeholder="+91 9876543210"
              inputMode="tel"
              autoComplete="tel"
              disabled={loading}
            />
          </Field>

          {error && (
            <p className="label border border-error/40 px-3 py-2 text-[14px] text-error">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 bg-fg px-4 py-3.5 font-body text-[13px] font-light lowercase tracking-[0.14em] text-bg disabled:opacity-40"
          >
            {loading ? (
              <>
                <Loader2
                  className="h-3.5 w-3.5 animate-spin"
                  strokeWidth={1.5}
                />
                saving…
              </>
            ) : (
              <>
                enter portal
                <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
