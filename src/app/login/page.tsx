"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Inbox,
  LayoutDashboard,
  Calculator,
  FileText,
  Loader2,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Field, inputClass } from "@/components/ui";
import { useAuth } from "@/lib/auth-context";
import type { AuthUser } from "@/lib/bd-types";
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

const OTP_LEN = 6;

function OtpBoxes({
  value,
  onChange,
  disabled,
  invalid,
}: {
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
  invalid?: boolean;
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length: OTP_LEN }, (_, i) => value[i] ?? "");

  function setAt(index: number, digit: string) {
    const next = Array.from({ length: OTP_LEN }, (_, i) =>
      i === index ? digit : (value[i] ?? ""),
    );
    onChange(next.join("").replace(/\D/g, "").slice(0, OTP_LEN));
  }

  function focusAt(index: number) {
    const el = refs.current[Math.max(0, Math.min(OTP_LEN - 1, index))];
    el?.focus();
    el?.select();
  }

  return (
    <div
      className="flex items-center justify-between gap-2 sm:gap-2.5"
      role="group"
      aria-label="one-time code"
    >
      {digits.map((digit, i) => {
        const filled = Boolean(digit);
        return (
          <input
            key={i}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete={i === 0 ? "one-time-code" : "off"}
            maxLength={1}
            value={digit}
            disabled={disabled}
            autoFocus={i === 0}
            aria-label={`digit ${i + 1}`}
            className={clsx(
              "h-12 w-12 shrink-0 rounded-lg border-2 bg-surface-hover text-center font-body text-[22px] font-light text-fg outline-none transition sm:h-14 sm:w-14 sm:text-[24px]",
              "caret-fg selection:bg-fg/15",
              "disabled:cursor-not-allowed disabled:opacity-50",
              "focus:border-fg focus:bg-surface focus:shadow-[0_0_0_4px_color-mix(in_srgb,var(--fg)_12%,transparent)]",
              invalid
                ? "border-error/55 bg-error/5"
                : filled
                  ? "border-fg/45 bg-surface"
                  : "border-line-strong hover:border-fg/35",
            )}
            onChange={(e) => {
              const raw = e.target.value.replace(/\D/g, "");
              if (!raw) {
                setAt(i, "");
                return;
              }
              // Paste or multi-digit into one box: fill forward
              if (raw.length > 1) {
                const filledDigits = value.split("");
                for (let j = 0; j < raw.length && i + j < OTP_LEN; j++) {
                  filledDigits[i + j] = raw[j]!;
                }
                const joined = filledDigits
                  .join("")
                  .replace(/\D/g, "")
                  .slice(0, OTP_LEN);
                onChange(joined);
                focusAt(Math.min(i + raw.length, OTP_LEN - 1));
                return;
              }
              setAt(i, raw);
              if (i < OTP_LEN - 1) focusAt(i + 1);
            }}
            onKeyDown={(e) => {
              if (e.key === "Backspace") {
                e.preventDefault();
                if (digits[i]) {
                  setAt(i, "");
                } else if (i > 0) {
                  setAt(i - 1, "");
                  focusAt(i - 1);
                }
                return;
              }
              if (e.key === "ArrowLeft" && i > 0) {
                e.preventDefault();
                focusAt(i - 1);
              }
              if (e.key === "ArrowRight" && i < OTP_LEN - 1) {
                e.preventDefault();
                focusAt(i + 1);
              }
              if (
                e.key.length === 1 &&
                !/[0-9]/.test(e.key) &&
                !e.ctrlKey &&
                !e.metaKey &&
                !e.altKey
              ) {
                e.preventDefault();
              }
            }}
            onPaste={(e) => {
              e.preventDefault();
              const pasted = e.clipboardData
                .getData("text")
                .replace(/\D/g, "")
                .slice(0, OTP_LEN);
              if (!pasted) return;
              onChange(pasted);
              focusAt(Math.min(pasted.length, OTP_LEN) - 1);
            }}
            onFocus={(e) => e.target.select()}
          />
        );
      })}
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { applyUser } = useAuth();
  const brandRef = useRef<HTMLElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [previewCode, setPreviewCode] = useState("");
  const [hint, setHint] = useState("");
  const [error, setError] = useState("");
  const [shake, setShake] = useState(0);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [slide, setSlide] = useState(0);
  const otpAutoTried = useRef("");

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

  async function sendCode(e: FormEvent) {
    e.preventDefault();
    setError("");
    setHint("");
    setPreviewCode("");
    if (!email.trim() || !email.includes("@")) {
      fail("Enter a valid email.");
      return;
    }
    setLoading(true);
    setStatus("Sending code…");
    try {
      const res = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = (await res.json()) as {
        error?: string;
        hint?: string;
        previewCode?: string;
        delivered?: boolean;
        directLogin?: boolean;
        user?: AuthUser;
      };
      if (!res.ok) {
        fail(data.error || "Could not send OTP.");
        setLoading(false);
        setStatus("");
        return;
      }
      if (data.directLogin && data.user) {
        setStatus("Opening dashboard…");
        applyUser(data.user);
        router.replace("/pipeline");
        return;
      }
      if (data.previewCode) {
        setPreviewCode(data.previewCode);
        setHint(
          data.hint ||
            "Email was not delivered — use the on-screen code to continue.",
        );
      }
      setStep("code");
      setLoading(false);
      setStatus("");
    } catch {
      fail("Network error. Try again.");
      setLoading(false);
      setStatus("");
    }
  }

  async function verifyCode(e?: FormEvent) {
    e?.preventDefault();
    setError("");
    const otp = code.replace(/\D/g, "");
    if (otp.length !== 6) {
      fail("Enter the 6-digit code.");
      return;
    }
    otpAutoTried.current = otp;
    setLoading(true);
    setStatus("Signing in…");
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: email.trim(), code: otp }),
      });
      const data = (await res.json()) as { error?: string; user?: AuthUser };
      if (!res.ok || !data.user) {
        fail(data.error || "Invalid or expired code.");
        setLoading(false);
        setStatus("");
        return;
      }
      setStatus("Opening dashboard…");
      applyUser(data.user);
      router.replace("/pipeline");
    } catch {
      fail("Network error. Try again.");
      setLoading(false);
      setStatus("");
    }
  }

  useEffect(() => {
    if (step !== "code" || loading) return;
    const otp = code.replace(/\D/g, "");
    if (otp.length !== 6) {
      otpAutoTried.current = "";
      return;
    }
    if (otpAutoTried.current === otp) return;
    void verifyCode();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- auto-submit when OTP complete
  }, [code, step, loading]);

  const active = HIGHLIGHTS[slide];
  const ActiveIcon = active.icon;

  return (
    <div className="relative flex min-h-screen bg-bg text-fg">
      {loading && (
        <div
          className="fixed inset-0 z-30 flex items-center justify-center bg-bg/70"
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <div className="flex min-w-[240px] flex-col items-center border border-line bg-surface px-8 py-7">
            <Loader2
              className="h-5 w-5 animate-spin text-fg"
              strokeWidth={1.5}
            />
            <p className="label mt-4 tracking-[0.18em] text-fg lowercase">
              {status || "Signing in…"}
            </p>
            <p className="metric mt-2 text-center text-fg-muted">
              Waiting for the server — this can take a few seconds.
            </p>
          </div>
        </div>
      )}
      <aside
        ref={brandRef}
        className="relative hidden w-[46%] flex-col justify-between overflow-hidden bg-black p-10 text-white lg:flex xl:p-14"
      >
        <div
          ref={glowRef}
          aria-hidden
          className="pointer-events-none absolute left-0 top-0 h-[400px] w-[400px] rounded-full"
          style={{
            background:
              "radial-gradient(closest-side, rgba(255,255,255,0.07), transparent)",
          }}
        />
        <div className="relative z-10">
          <Logo variant="white" height={22} />
          <p className="label mt-3 tracking-[0.2em] lowercase text-white/50">
            Design · Build · Furniture
          </p>
        </div>

        <div className="relative z-10">
          <h2 className="heading text-[34px] leading-[1.15] text-white xl:text-[40px]">
            The essentia
            <br />
            dashboard.
          </h2>
          <div className="mt-8 flex items-start gap-4 border border-white/15 bg-white/[0.04] p-5">
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

        <div className="w-full max-w-sm">
          <p className="label tracking-[0.18em] text-fg-muted lowercase">
            essentia dashboard
          </p>
          <h1 className="heading mt-2 text-[30px]">{greeting()}</h1>
          <p className="label mt-2 text-fg-muted">
            Sign in with your email. We’ll send a one-time code.
          </p>

          {step === "email" ? (
            <form
              key={`email-${shake}`}
              onSubmit={sendCode}
              aria-busy={loading}
              className={clsx("mt-8 space-y-4", shake > 0 && "animate-shake")}
            >
              <Field label="Email">
                <input
                  type="email"
                  className={clsx(inputClass, error && "!border-error/60")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  autoComplete="email"
                  autoFocus
                  disabled={loading}
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
                className="group inline-flex w-full items-center justify-center gap-2 bg-fg px-4 py-3 font-body text-[11px] font-light lowercase tracking-[0.14em] text-bg hover:opacity-90 disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.5} />
                    {status || "Sending…"}
                  </>
                ) : (
                  <>
                    Send code
                    <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form
              key={`code-${shake}`}
              onSubmit={verifyCode}
              aria-busy={loading}
              className={clsx("mt-8 space-y-4", shake > 0 && "animate-shake")}
            >
              <p className="label text-fg-muted">
                Code sent to <span className="text-fg">{email}</span>
              </p>
              <div>
                <p className="label mb-1.5 text-fg-muted">one-time code</p>
                <OtpBoxes
                  value={code}
                  onChange={setCode}
                  disabled={loading}
                  invalid={Boolean(error)}
                />
              </div>
              {previewCode && (
                <p className="label border border-line px-3 py-2 text-fg">
                  On-screen code (email not delivered): {previewCode}
                </p>
              )}
              {hint && !previewCode && (
                <p className="label text-fg-dim">{hint}</p>
              )}
              {error && (
                <p className="label border border-error/40 px-3 py-2 text-error">
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="group inline-flex w-full items-center justify-center gap-2 bg-fg px-4 py-3 font-body text-[11px] font-light lowercase tracking-[0.14em] text-bg hover:opacity-90 disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.5} />
                    {status || "Signing in…"}
                  </>
                ) : (
                  <>
                    Enter portal
                    <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} />
                  </>
                )}
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => {
                  setStep("email");
                  setCode("");
                  otpAutoTried.current = "";
                  setPreviewCode("");
                  setHint("");
                  setError("");
                }}
                className="label w-full text-center text-fg-muted hover:text-fg"
              >
                Use a different email
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
