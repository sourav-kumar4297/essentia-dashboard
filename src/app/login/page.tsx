"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/auth";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button, Field, inputClass, ScreenState } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!username.trim() || !password) {
      setError("Enter username and password to continue.");
      return;
    }
    setLoading(true);
    const ok = login(username, password);
    if (!ok) {
      setError("Invalid credentials.");
      setLoading(false);
      return;
    }
    router.replace("/pipeline");
  }

  return (
    <div className="flex min-h-screen flex-col bg-bg text-fg">
      <header
        className="flex h-14 items-center justify-between border-b border-line px-6 backdrop-blur-md"
        style={{ background: "var(--header)" }}
      >
        <div className="bg-black px-3 py-2">
          <Logo variant="white" height={18} />
        </div>
        <ThemeToggle />
      </header>

      <main className="shell-main flex flex-1 items-center justify-center px-6 py-16">
        <div className="w-full max-w-md animate-rise">
          <div className="panel-surface p-8 md:p-10">
            <p className="label tracking-[0.18em] text-fg-muted uppercase">
              Internal portal
            </p>
            <h1 className="heading mt-2 text-[28px]">Sign in</h1>
            <p className="label mt-2 text-fg-muted">
              Lead Management Platform — Dashboard, All Leads, Profile Generator
              and Fee Configurator.
            </p>

            {loading ? (
              <div className="mt-10">
                <ScreenState state="loading">{null}</ScreenState>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="mt-8 space-y-4">
                <Field label="Username">
                  <input
                    className={inputClass}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                    required
                  />
                </Field>
                <Field label="Password">
                  <input
                    type="password"
                    className={inputClass}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                </Field>
                {error && (
                  <p className="label border border-error/40 px-3 py-2 text-error">
                    {error}
                  </p>
                )}
                <Button type="submit" className="w-full">
                  Enter portal
                </Button>
              </form>
            )}

            <div className="mt-8 border border-line px-4 py-3">
              <p className="label text-fg-muted">Credentials</p>
              <p className="metric mt-1">admin / password123</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
