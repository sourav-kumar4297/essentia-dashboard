"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Inbox,
  LayoutDashboard,
  Calculator,
  FileText,
} from "lucide-react";
import { login, DEMO_CREDENTIALS } from "@/lib/auth";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Field, inputClass } from "@/components/ui";
import { clsx } from "clsx";

const HIGHLIGHTS = [
  {
    icon: LayoutDashboard,
    title: "Lead Intelligence",
    body: "EE & EH enquiries, win rate and channel mix on one screen.",
  },
  {
    icon: Inbox,
    title: "All Leads",
    body: "Search, filter and qualify every enquiry in seconds.",
  },
  {
    icon: FileText,
    title: "Profile Generator",
    body: "Curated company profiles ready to send after consultation.",
  },
  {
    icon: Calculator,
    title: "Fee Configurator",
    body: "Design fee proposals priced by service, area and privilege.",
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

/** Counts from 0 to target once on mount. */
function CountUp({ target, suffix }: { target: number; suffix: string }) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const duration = 1200;
    const start = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(target * eased));
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
  const brandRef = useRef<HTMLElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
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

  // Cursor-following glow on the brand panel.
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

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!username.trim() || !password) {
      fail("Enter username and password to continue.");
      return;
    }
    if (!login(username, password)) {
      fail("Invalid credentials — try admin / password123.");
      return;
    }
    setLoading(true);
    setTimeout(() => router.replace("/pipeline"), 450);
  }

  const active = HIGHLIGHTS[slide];
  const ActiveIcon = active.icon;

  return (
    <div className="flex min-h-screen bg-bg text-fg">
      {/* Brand panel — always black, like essentiaenvironments.com */}
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
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-40 -left-24 h-[420px] w-[420px] rounded-full"
          style={{
            background:
              "radial-gradient(closest-side, rgba(255,255,255,0.05), transparent)",
          }}
        />

        <div className="animate-rise">
          <Logo variant="white" height={22} />
          <p className="label mt-3 tracking-[0.2em] uppercase text-white/50">
            Client Advisory · Lead Management
          </p>
        </div>

        <div className="relative z-10">
          <h2 className="heading text-[34px] leading-[1.15] text-white xl:text-[40px]">
            From first enquiry
            <br />
            to signed proposal.
          </h2>

          {/* Rotating highlight */}
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

          <div className="mt-5 flex gap-2">
            {HIGHLIGHTS.map((h, i) => (
              <button
                key={h.title}
                type="button"
                aria-label={h.title}
                onClick={() => setSlide(i)}
                className={clsx(
                  "h-[3px] flex-1 transition-all duration-300",
                  i === slide ? "bg-white" : "bg-white/20 hover:bg-white/40",
                )}
              />
            ))}
          </div>

          {/* Animated brand stats */}
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

      {/* Form panel */}
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
            Sign in to manage leads, consultations and proposals.
          </p>

          <form
            key={shake}
            onSubmit={onSubmit}
            className={clsx("mt-8 space-y-4", shake > 0 && "animate-shake")}
          >
            <Field label="Username">
              <input
                className={clsx(inputClass, error && "!border-error/60")}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                autoComplete="username"
                autoFocus
              />
            </Field>
            <Field label="Password">
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className={clsx(
                    inputClass,
                    "!pr-11",
                    error && "!border-error/60",
                  )}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyUp={(e) =>
                    setCapsLock(e.getModifierState?.("CapsLock") ?? false)
                  }
                  placeholder="••••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-fg-dim transition hover:text-fg"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" strokeWidth={1.5} />
                  ) : (
                    <Eye className="h-4 w-4" strokeWidth={1.5} />
                  )}
                </button>
              </div>
            </Field>

            {capsLock && (
              <p className="label border border-line px-3 py-2 text-fg-muted">
                Caps Lock is on.
              </p>
            )}

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
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border border-accent-fg/30 border-t-accent-fg" />
                  Entering portal…
                </>
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

          <button
            type="button"
            onClick={() => {
              setUsername(DEMO_CREDENTIALS.username);
              setPassword(DEMO_CREDENTIALS.password);
              setError("");
            }}
            className="label mt-6 flex w-full items-center justify-between gap-2 border border-dashed border-line px-4 py-3 text-fg-muted transition hover:border-line-strong hover:bg-surface hover:text-fg"
          >
            <span className="min-w-0 truncate">
              Demo access — {DEMO_CREDENTIALS.username} /{" "}
              {DEMO_CREDENTIALS.password}
            </span>
            <span className="metric shrink-0">Tap to fill</span>
          </button>
        </div>
      </main>
    </div>
  );
}
