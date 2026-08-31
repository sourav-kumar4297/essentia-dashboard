import { clsx } from "clsx";
import type { Qualification } from "@/lib/types";
import { ContentSkeleton } from "@/components/PortalSkeleton";

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
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3 animate-rise">
      <div className="min-w-0 max-w-2xl">
        {eyebrow && (
          <nav aria-label="Breadcrumb">
            <p className="label tracking-[0.16em] text-fg-dim uppercase">
              {eyebrow}
              <span className="mx-2 text-fg-dim/70">/</span>
              <span className="text-fg-muted">{title}</span>
            </p>
          </nav>
        )}
        <h1 className="heading mt-1.5 text-[28px] leading-[1.15] tracking-[0.01em] text-fg">
          {title}
        </h1>
        {description && (
          <p className="label mt-2 max-w-xl text-[13px] leading-relaxed text-fg-muted">
            {description}
          </p>
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
          "bg-fg text-bg shadow-[var(--elev-sm)] hover:opacity-90 active:scale-[0.98]",
        variant === "secondary" &&
          "border border-line-strong bg-surface text-fg shadow-[var(--elev-sm)] hover:border-fg/40 hover:bg-surface-hover active:scale-[0.98]",
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
  "w-full border border-line bg-surface px-3 py-2.5 font-body text-[13px] font-light text-fg outline-none transition placeholder:text-fg-dim focus:border-fg/50 focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--fg)_10%,transparent)] hover:border-line-strong";

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
  value: React.ReactNode;
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
      <p className="heading mt-3 text-[26px] leading-none tracking-wide text-fg">
        {value}
      </p>
      {hint && <p className="label mt-2 text-fg-dim">{hint}</p>}
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
    return <ContentSkeleton />;
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
