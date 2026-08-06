"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Inbox,
  LayoutDashboard,
  Calculator,
  FileText,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Field, inputClass } from "@/components/ui";
import { useAuth } from "@/lib/auth-context";
import { clsx } from "clsx";

const HIGHLIGHTS = [
  {
    icon: LayoutDashboard,
    title: "Lead Intelligence",
    body: "Pipeline health, win rate and channel mix on one screen.",
  },
  {
    icon: Inbox,
    title: "All Leads",
    body: "Create, assign and move every enquiry through BD stages.",
  },
  {
    icon: FileText,
    title: "Referral approval",
    body: "Personal referrals stay gated until Admin approves.",
  },
  {
    icon: Calculator,
    title: "Won checklist",
    body: "PIO, first payment, documents and CRM handover in one place.",
  },
];

const BRAND_STATS = [
  { value: 27, suffix: "+", label: "Years of craft" },
  { value: 500, suffix: "+", label: "Projects delivered" },
  { value: 2, suffix: "", label: "Business units" },
];

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function CountUp({ target, suffix }: { target: number; suffix: string }) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const duration = 1200;
    const start = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      setValue(Math.round(target * (1 - Math.pow(1 - t, 3))));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return (
    <span className="metric text-[22px] tracking-wide text-white">
      {value}
      {suffix}
    </span>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const brandRef = useRef<HTMLElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [shake, setShake] = useState(0);
  const [loading, setLoading] = useState(false);
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    const t = setInterval(
      () => setSlide((s) => (s + 1) % HIGHLIGHTS.length),
      3500,
    );
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const panel = brandRef.current;
    const glow = glowRef.current;
    if (!panel || !glow) return;
    const onMove = (e: MouseEvent) => {
      const rect = panel.getBoundingClientRect();
      glow.style.transform = `translate(${e.clientX - rect.left - 200}px, ${
        e.clientY - rect.top - 200
      }px)`;
    };
    panel.addEventListener("mousemove", onMove);
    return () => panel.removeEventListener("mousemove", onMove);
  }, []);

  function fail(message: string) {
    setError(message);
    setShake((n) => n + 1);
  }

  async function signIn(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!username.trim() || !password) {
      fail("Enter username and password.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        fail(data.error || "Invalid username or password.");
        return;
      }
      await refresh();
      router.replace("/pipeline");
    } catch {
      fail("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  const active = HIGHLIGHTS[slide];
  const ActiveIcon = active.icon;

  return (
    <div className="flex min-h-screen bg-bg text-fg">
      <aside
        ref={brandRef}
        className="relative hidden w-[46%] flex-col justify-between overflow-hidden bg-black p-10 text-white lg:flex xl:p-14"
      >
        <div
          ref={glowRef}
          aria-hidden
          className="pointer-events-none absolute left-0 top-0 h-[400px] w-[400px] rounded-full transition-transform duration-300 ease-out"
          style={{
            background:
              "radial-gradient(closest-side, rgba(255,255,255,0.07), transparent)",
          }}
        />
        <div className="animate-rise">
          <Logo variant="white" height={22} />
          <p className="label mt-3 tracking-[0.2em] uppercase text-white/50">
            BD Portal · Lead to handover
          </p>
        </div>

        <div className="relative z-10">
          <h2 className="heading text-[34px] leading-[1.15] text-white xl:text-[40px]">
            From first enquiry
            <br />
            to CRM handover.
          </h2>
          <div
            key={slide}
            className="mt-8 flex items-start gap-4 border border-white/15 bg-white/[0.04] p-5 animate-rise"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-white/25">
              <ActiveIcon className="h-4 w-4" strokeWidth={1.5} />
            </span>
            <div className="min-w-0">
              <p className="label text-white">{active.title}</p>
              <p className="label mt-1 text-white/55">{active.body}</p>
            </div>
          </div>
          <div className="mt-10 grid grid-cols-3 gap-4 border-t border-white/10 pt-6">
            {BRAND_STATS.map((s) => (
              <div key={s.label}>
                <CountUp target={s.value} suffix={s.suffix} />
                <p className="label mt-1 text-white/45">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="metric relative z-10 text-white/40">
          essentia group · Environments & Home · since 1999
        </p>
      </aside>

      <main className="relative flex flex-1 items-center justify-center px-6 py-16">
        <div className="absolute right-5 top-5">
          <ThemeToggle />
        </div>
        <div className="absolute left-5 top-5 lg:hidden">
          <div className="bg-black px-3 py-2">
            <Logo variant="white" height={16} />
          </div>
        </div>

        <div className="w-full max-w-sm animate-rise">
          <p className="label tracking-[0.18em] text-fg-muted uppercase">
            Internal portal
          </p>
          <h1 className="heading mt-2 text-[30px]">{greeting()}</h1>
          <p className="label mt-2 text-fg-muted">
            Sign in with your username and password.
          </p>

          <form
            key={`login-${shake}`}
            onSubmit={signIn}
            className={clsx("mt-8 space-y-4", shake > 0 && "animate-shake")}
          >
            <Field label="Username">
              <input
                type="text"
                className={clsx(inputClass, error && "!border-error/60")}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                autoComplete="username"
                autoFocus
              />
            </Field>
            <Field label="Password">
              <input
                type="password"
                className={clsx(inputClass, error && "!border-error/60")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </Field>
            {error && (
              <p className="label border border-error/40 px-3 py-2 text-error">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="group inline-flex w-full items-center justify-center gap-2 bg-accent px-4 py-3 font-body text-[11px] font-normal uppercase tracking-[0.14em] text-accent-fg transition hover:opacity-90 disabled:opacity-60"
            >
              {loading ? (
                "Signing in…"
              ) : (
                <>
                  Enter portal
                  <ArrowRight
                    className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1"
                    strokeWidth={1.5}
                  />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 border border-dashed border-line px-4 py-3">
            <p className="label text-fg-dim">Demo credentials</p>
            <p className="label mt-1.5 text-fg-muted">
              Username: <span className="text-fg">admin</span>
            </p>
            <p className="label text-fg-muted">
              Password: <span className="text-fg">password123</span>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
