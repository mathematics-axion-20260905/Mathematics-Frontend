"use client";

import Link from "next/link";
import {
    Activity,
    AreaChart,
    ArrowLeft,
    ArrowRight,
    Blocks,
    Info,
    Sigma,
    TrendingUp,
} from "lucide-react";

import { LabEngineProvider } from "@/components/laboratory/lab-engine";
import { laboratoryModuleRegistry } from "@/components/laboratory/module-registry";
import { type LaboratoryModuleMeta } from "@/lib/laboratory";
import { useLocale } from "@/components/locale-provider";

const STUDIO_NAV_ITEMS = [
    { slug: "integral-studio", labelUz: "Integrallar", labelEn: "Integrals", icon: Sigma },
    { slug: "differential-studio", labelUz: "Differensiallar", labelEn: "Differentials", icon: Activity },
    { slug: "matrix-studio", labelUz: "Matritsalar", labelEn: "Matrices", icon: Blocks },
    { slug: "probability-studio", labelUz: "Ehtimollik", labelEn: "Probability", icon: AreaChart },
    { slug: "series-limit-studio", labelUz: "Qatorlar & Limitlar", labelEn: "Series & Limits", icon: TrendingUp },
];

export function LaboratoryWorkspaceShell({ module }: { module: LaboratoryModuleMeta }) {
    const { locale } = useLocale();
    const copy = locale === "uz"
        ? {
              title: "Ish maydoni hali ulanmagan.",
              lead: "Reyestr {module} modulini taniydi, ammo uning maxsus interfeysi hali mavjud emas.",
              back: "Laboratoriyaga qaytish",
              laboratory: "Laboratoriya",
          }
        : {
              title: "Workspace is not connected yet.",
              lead: "Registry recognizes {module}, but its dedicated interface is not available yet.",
              back: "Back to Laboratory",
              laboratory: "Laboratory",
          };

    const definition = laboratoryModuleRegistry[module.slug];
    const ModuleComponent = definition?.component;

    return (
        <LabEngineProvider>
            <main className="min-w-0">
                {/* Modern studio breadcrumbs & instant cross-studio navigation */}
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2.5 px-0.5">
                    <div className="flex items-center gap-2">
                        <Link
                            href="/laboratory"
                            className="inline-flex h-7 items-center gap-1.5 rounded-full border border-[var(--ax-work-line)] bg-[var(--ax-surface)] px-2.5 text-[11px] font-semibold text-[var(--ax-text-soft)] shadow-xs transition-colors hover:border-[var(--ax-accent)] hover:text-[var(--ax-text)]"
                        >
                            <ArrowLeft className="h-3 w-3" />
                            <span>{copy.laboratory}</span>
                        </Link>
                        <span className="text-xs text-[var(--ax-text-faint)]">/</span>
                        <span className="font-serif text-sm font-semibold tracking-tight text-[var(--ax-text)]">
                            {module.title}
                        </span>
                    </div>

                    <nav className="flex flex-wrap items-center gap-1 overflow-x-auto rounded-full border border-[var(--ax-work-line)] bg-[var(--ax-surface-soft)] p-0.5" aria-label="Studio Switcher">
                        {STUDIO_NAV_ITEMS.map((item) => {
                            const active = item.slug === module.slug;
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.slug}
                                    href={`/laboratory/${item.slug}`}
                                    className={`inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-[9.5px] font-bold uppercase tracking-[0.08em] transition-all ${
                                        active
                                            ? "border border-[var(--ax-work-line-strong)] bg-[var(--ax-surface)] text-[var(--ax-text)] shadow-xs"
                                            : "text-[var(--ax-text-faint)] hover:bg-[var(--ax-surface)]/60 hover:text-[var(--ax-text)]"
                                    }`}
                                >
                                    <Icon className="h-3 w-3" />
                                    <span>{locale === "uz" ? item.labelUz : item.labelEn}</span>
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                {ModuleComponent ? (
                    <div className="lab-workspace-stage overflow-hidden rounded-[var(--ax-work-panel-radius)] border border-[var(--ax-work-line)] bg-[var(--ax-surface)] shadow-[var(--ax-work-shadow)]">
                        <ModuleComponent module={module} />
                    </div>
                ) : (
                    <div className="flex min-h-[460px] flex-col items-center justify-center rounded-[var(--ax-work-panel-radius)] border border-[var(--ax-work-line)] bg-[var(--ax-surface)] p-10 text-center shadow-[var(--ax-work-shadow)]">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--ax-work-line)] bg-[var(--ax-surface-soft)] text-[var(--ax-warning)]">
                            <Info className="h-5 w-5" />
                        </div>
                        <h2 className="mt-6 font-serif text-3xl tracking-[-0.04em] text-[var(--ax-text)]">{copy.title}</h2>
                        <p className="mt-3 max-w-md text-sm leading-6 text-[var(--ax-text-soft)]">
                            {copy.lead.split("{module}")[0]}
                            <span className="font-semibold text-[var(--ax-text)]">{module.title}</span>
                            {copy.lead.split("{module}")[1]}
                        </p>
                        <Link
                            href="/laboratory"
                            className="mt-7 inline-flex h-10 items-center gap-2 rounded-[var(--ax-work-control-radius)] bg-[var(--ax-accent-strong)] px-5 text-xs font-semibold text-white hover:bg-[var(--ax-accent)]"
                        >
                            {copy.back}
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>
                )}
            </main>
        </LabEngineProvider>
    );
}
