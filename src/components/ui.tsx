import { clsx } from "clsx";
import type { Qualification } from "@/lib/types";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 animate-rise">
      <div className="min-w-0 max-w-2xl">
        {eyebrow && (
          <p className="label tracking-[0.18em] text-fg-muted uppercase">
            {eyebrow}
          </p>
        )}
        <h1 className="heading mt-0.5 text-[24px] leading-tight">{title}</h1>
        {description && (
          <p className="label mt-1 max-w-xl text-fg-muted">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap gap-2 sm:justify-end">{actions}</div>
      )}
    </div>
  );
}

export function Panel({
  children,
  className,
  title,
  action,
}: {
  children: React.ReactNode;
  className?: string;
  title?: string;
  action?: React.ReactNode;
}) {
  return (
    <section className={clsx("panel-surface p-5 md:p-7", className)}>
      {(title || action) && (
        <div className="mb-5 flex items-center justify-between gap-3 border-b border-line pb-3">
          {title && <h2 className="heading text-[22px]">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Button({
  children,
  variant = "primary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "forest";
}) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center gap-2 px-4 py-2.5 font-body text-[11px] font-normal uppercase tracking-[0.14em] transition disabled:cursor-not-allowed disabled:opacity-35",
        variant === "primary" &&
          "bg-accent text-accent-fg hover:opacity-90 active:opacity-80",
        variant === "secondary" &&
          "border border-line-strong bg-transparent text-fg hover:bg-surface-hover active:opacity-90",
        variant === "ghost" && "text-fg-muted hover:text-fg",
        variant === "danger" &&
          "border border-error/50 text-error hover:bg-error/10",
        variant === "forest" &&
          "border border-line-strong bg-surface text-fg hover:border-fg",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="label mb-1.5 block text-fg-muted">{label}</span>
      {children}
      {hint && <span className="label mt-1 block text-fg-dim">{hint}</span>}
    </label>
  );
}

export const inputClass =
  "w-full border border-line bg-bg px-3 py-2.5 font-body text-[13px] font-light text-fg outline-none transition placeholder:text-fg-dim focus:border-line-strong hover:border-line-strong";

const QUAL_STYLES: Record<Qualification, string> = {
  Hot: "border-[#e85d4c]/55 bg-[#e85d4c]/10 text-[#e85d4c]",
  Warm: "border-[#d4a017]/55 bg-[#d4a017]/10 text-[#d4a017]",
  Cold: "border-[#5b8def]/55 bg-[#5b8def]/10 text-[#5b8def]",
  Unqualified: "border-line-strong bg-transparent text-fg-muted",
};

export function QualBadge({ q }: { q: Qualification }) {
  return (
    <span
      className={clsx(
        "inline-flex border px-2.5 py-1 font-body text-[10px] font-light uppercase tracking-[0.14em]",
        QUAL_STYLES[q],
      )}
    >
      {q}
    </span>
  );
}

export function Stat({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "alert" | "good" | "amber";
}) {
  return (
    <div
      className={clsx(
        "panel-surface px-5 py-5 animate-rise",
        tone === "alert" && "!border-error/40",
        tone === "good" && "!border-ok/40",
      )}
    >
      <p className="label text-fg-muted">{label}</p>
      <p className="metric mt-3 text-[15px] tracking-wide text-fg">{value}</p>
      {hint && <p className="label mt-1.5 text-fg-dim">{hint}</p>}
    </div>
  );
}

export function ScreenState({
  state,
  emptyTitle = "Nothing here yet",
  emptyBody,
  errorMessage,
  onRetry,
  children,
}: {
  state: "default" | "loading" | "error" | "empty";
  emptyTitle?: string;
  emptyBody?: string;
  errorMessage?: string;
  onRetry?: () => void;
  children: React.ReactNode;
}) {
  if (state === "loading") {
    return (
      <div className="flex min-h-[220px] items-center justify-center panel-surface animate-fade">
        <p className="label animate-pulse-soft text-fg-muted">Loading…</p>
      </div>
    );
  }
  if (state === "error") {
    return (
      <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 border border-error/40 bg-surface px-6 text-center animate-fade">
        <p className="label text-error">
          {errorMessage ?? "Something went wrong."}
        </p>
        {onRetry && (
          <Button variant="secondary" type="button" onClick={onRetry}>
            Retry
          </Button>
        )}
      </div>
    );
  }
  if (state === "empty") {
    return (
      <div className="flex min-h-[220px] flex-col items-center justify-center gap-2 panel-surface px-6 text-center animate-fade">
        <p className="heading text-[20px]">{emptyTitle}</p>
        {emptyBody && <p className="label text-fg-muted">{emptyBody}</p>}
      </div>
    );
  }
  return <>{children}</>;
}
