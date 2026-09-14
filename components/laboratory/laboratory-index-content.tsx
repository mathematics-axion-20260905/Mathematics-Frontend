"use client";

import Link from "next/link";
import { Activity, ArrowRight, AreaChart, Blocks, Sigma, TrendingUp } from "lucide-react";

import type { LaboratoryModuleMeta } from "@/lib/laboratory";
import { useLocale } from "@/components/locale-provider";

const moduleIcons = {
    "integral-studio": Sigma,
    "differential-studio": Activity,
    "matrix-studio": Blocks,
    "probability-studio": AreaChart,
    "series-limit-studio": TrendingUp,
} as const;

const moduleDescriptions = {
    en: {
        "integral-studio": "Symbolic, numerical and geometric integration in one focused workspace.",
        "differential-studio": "Derivatives, Jacobians, Hessians and differential systems with visual analysis.",
        "matrix-studio": "Matrix algebra, spectral analysis and transformations with clear geometric output.",
        "probability-studio": "Distributions, inference, regression and simulation built for visual inspection.",
        "series-limit-studio": "Limits, sequences, series and convergence workflows with precise comparison.",
    },
    uz: {
        "integral-studio": "Ramziy, sonli va geometrik integrallar uchun yagona ish maydoni.",
        "differential-studio": "Hosilalar, Yakobianlar, Gessianlar va differensial tizimlarning vizual tahlili.",
        "matrix-studio": "Matritsa algebrasi, spektral tahlil va almashtirishlarning geometrik ko‘rinishi.",
        "probability-studio": "Taqsimot, inferensiya, regressiya va simulyatsiya natijalarini vizual tekshirish.",
        "series-limit-studio": "Limit, ketma-ketlik, qator va yaqinlashuvni aniq taqqoslash.",
    },
} as const;

export function LaboratoryIndexContent({ modules }: { modules: LaboratoryModuleMeta[] }) {
    const { locale } = useLocale();
    const copy = locale === "uz"
        ? {
            kicker: "MathSphere laboratoriyasi", title: "Fokuslangan matematik ish maydonlari.", lead: "Studiyani tanlab, aniq natijalar, sonli tekshiruvlar va ilmiy vizualizatsiyalar bilan ishlang. Interfeys ikkilamchi, matematika esa markazda qoladi.", studios: "Studiyalar", visual: "Vizual", compute: "Hisoblash", choose: "Matematik modulni tanlang.", note: "Avval aniq · standart vizualizatsiya · qayta ishlab bo‘ladigan chiqish", open: "Studiyani ochish", exact: "Avval aniq", exactCopy: "Yaqinlashtirishdan oldin ramziy tuzilmani afzal ko‘ring.", visualTitle: "Standart vizualizatsiya", visualCopy: "Grafik va geometriyani matematik natijaning asosiy qismi sifatida ko‘ring.", reproducible: "Qayta ishlab bo‘ladigan", reproducibleCopy: "Kiritmalar, farazlar va natijalarni qayta foydalanish uchun tuzilmali saqlang."
        }
        : {
            kicker: "MathSphere Laboratory", title: "Focused mathematical workspaces.", lead: "Choose a studio and work directly with exact results, numerical checks and scientific visualizations. The interface remains secondary to the mathematics.", studios: "Studios", visual: "Visual", compute: "Compute", choose: "Choose a mathematical module.", note: "Exact first · visual by default · reproducible output", open: "Open studio", exact: "Exact first", exactCopy: "Prefer symbolic structure before approximation.", visualTitle: "Visual by default", visualCopy: "Treat plots and geometry as primary mathematical output.", reproducible: "Reproducible", reproducibleCopy: "Keep inputs, assumptions and results structured for reuse."
        };
    const descriptions = moduleDescriptions[locale];

    return (
        <>
            <div className="ax-work-container">
                <section className="ax-work-pagehead">
                    <div>
                        <div className="ax-work-kicker">{copy.kicker}</div>
                        <h1 className="ax-work-title">{copy.title}</h1>
                        <p className="ax-work-lead">{copy.lead}</p>
                    </div>
                    <div className="ax-work-stats">
                        <div className="ax-work-stat"><div className="ax-work-stat-value">{modules.length}</div><div className="ax-work-stat-label">{copy.studios}</div></div>
                        <div className="ax-work-stat"><div className="ax-work-stat-value">2D/3D</div><div className="ax-work-stat-label">{copy.visual}</div></div>
                        <div className="ax-work-stat"><div className="ax-work-stat-value">{locale === "uz" ? "Lokal" : "Local"}</div><div className="ax-work-stat-label">{copy.compute}</div></div>
                    </div>
                </section>

                <section className="ax-work-section">
                    <div className="mb-5 flex items-end justify-between gap-6">
                        <div>
                            <div className="ax-work-kicker">{copy.studios}</div>
                            <div className="mt-2 font-serif text-[26px] tracking-[-0.035em]">{copy.choose}</div>
                        </div>
                        <div className="hidden text-[11px] text-[var(--ax-text-faint)] sm:block">{copy.note}</div>
                    </div>

                    <div className="ax-work-list">
                        {modules.map((module, index) => {
                            const Icon = moduleIcons[module.slug as keyof typeof moduleIcons] ?? AreaChart;
                            const description = descriptions[module.slug as keyof typeof descriptions] || module.summary;
                            return (
                                <Link key={module.id} href={`/laboratory/${module.slug}`} className="ax-work-row group grid min-h-[136px] gap-5 px-1 py-6 sm:grid-cols-[56px_minmax(0,1fr)_auto] sm:items-center sm:px-5 lg:px-7" style={{ contentVisibility: "auto", containIntrinsicSize: "136px" }}>
                                    <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--ax-work-line)] bg-[var(--ax-surface)] text-[var(--ax-accent)]"><Icon className="h-[18px] w-[18px]" /></div>
                                    <div className="min-w-0">
                                        <div className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[var(--ax-text-faint)]">{String(index + 1).padStart(2, "0")} · {module.category}</div>
                                        <h2 className="mt-2 font-serif text-[30px] tracking-[-0.04em] text-[var(--ax-text)]">{module.title}</h2>
                                        <p className="mt-2 max-w-[760px] text-[12px] leading-6 text-[var(--ax-text-soft)]">{description}</p>
                                    </div>
                                    <div className="flex items-center gap-2 text-[11px] font-semibold text-[var(--ax-accent)]">{copy.open} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></div>
                                </Link>
                            );
                        })}
                    </div>
                </section>
            </div>

            <section className="border-y border-[var(--ax-work-line)] bg-[var(--ax-surface)]">
                <div className="ax-work-container grid md:grid-cols-3 md:divide-x md:divide-[var(--ax-work-line)]">
                    {[[copy.exact, copy.exactCopy], [copy.visualTitle, copy.visualCopy], [copy.reproducible, copy.reproducibleCopy]].map(([title, text]) => (
                        <div key={title} className="py-7 md:px-8 md:first:pl-0 md:last:pr-0"><div className="font-serif text-[22px] tracking-[-0.03em]">{title}</div><p className="mt-2 max-w-sm text-[11px] leading-5 text-[var(--ax-text-soft)]">{text}</p></div>
                    ))}
                </div>
            </section>
        </>
    );
}
