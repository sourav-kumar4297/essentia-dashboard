"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/theme";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
      className="inline-flex items-center gap-2 border border-line px-2.5 py-1.5 text-fg transition hover:border-line-strong hover:bg-surface"
    >
      {isDark ? (
        <Sun className="h-3.5 w-3.5" strokeWidth={1.5} />
      ) : (
        <Moon className="h-3.5 w-3.5" strokeWidth={1.5} />
      )}
      <span className="label hidden text-fg-muted sm:inline">
        {isDark ? "Light" : "Dark"}
      </span>
    </button>
  );
}
