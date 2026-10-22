"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle({ className = "" }: { className?: string }) {
    const { theme, setTheme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <div
                className={`inline-block h-5 w-5 rounded-full border border-[var(--ax-line)] bg-[var(--ax-surface-soft)] ${className}`}
                aria-hidden="true"
            />
        );
    }

    const isDark = resolvedTheme === "dark" || theme === "dark";

    return (
        <button
            type="button"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            title={isDark ? "Kunduzgi rejim (Light)" : "Qorong'u rejim (Dark)"}
            aria-label="Toggle visual theme"
            className={`inline-flex h-5 w-5 items-center justify-center rounded-full border border-[var(--ax-line)] bg-[var(--ax-surface-soft)] text-[var(--ax-text-soft)] shadow-xs transition-colors hover:border-[var(--ax-line-strong)] hover:text-[var(--ax-text)] active:scale-95 ${className}`}
        >
            {isDark ? (
                <Sun className="h-3 w-3 text-amber-400 transition-transform hover:rotate-45" />
            ) : (
                <Moon className="h-3 w-3 text-slate-700 dark:text-slate-300 transition-transform hover:-rotate-12" />
            )}
        </button>
    );
}
