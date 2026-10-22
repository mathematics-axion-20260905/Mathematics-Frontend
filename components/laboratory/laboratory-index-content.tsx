"use client";

import Link from "next/link";
import { Activity, ArrowRight, AreaChart, Blocks, Sigma, TrendingUp, Sparkles } from "lucide-react";

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

const studioHighlights: Record<string, { tagsUz: string[]; tagsEn: string[]; formula: string }> = {
    "integral-studio": {
        tagsUz: ["Bir va ko'p karrali", "Vektor maydonlari", "Sirt integrallari", "Tirik to'lqin PDE"],
        tagsEn: ["Single & Multiple", "Vector Fields", "Surface Integrals", "Living Wave PDE"],
        formula: "∫ f(x) dx  ·  ∬_D (∇ × F)·dS",
    },
    "differential-studio": {
        tagsUz: ["ODE / PDE / SDE", "Yakobian & Gessian", "Lorenz 60 FPS", "Fazaviy portret"],
        tagsEn: ["ODE / PDE / SDE", "Jacobian & Hessian", "Lorenz 60 FPS", "Phase Portrait"],
        formula: "dx/dt = f(x,t) + σ dW",
    },
    "matrix-studio": {
        tagsUz: ["Xos qiymatlar & SVD", "Chiziqli almashtirishlar", "Tenstrorlar", "Eng kichik kvadratlar"],
        tagsEn: ["Eigen & SVD", "Linear Transforms", "Tensors", "Least Squares"],
        formula: "A = U Σ Vᵀ  ·  det(A - λI) = 0",
    },
    "probability-studio": {
        tagsUz: ["Nazariy taqsimotlar", "Gipoteza & A/B test", "Monte-Karlo simulyatsiya", "Bayes tahlili"],
        tagsEn: ["Distributions", "Hypothesis & A/B", "Monte Carlo Simulation", "Bayesian Inference"],
        formula: "P(A|B) = [P(B|A)P(A)] / P(B)",
    },
    "series-limit-studio": {
        tagsUz: ["Teylor yaqinlashuvi", "Furye episikllari", "Cheksiz qatorlar", "Yaqinlashuv radiusi"],
        tagsEn: ["Taylor Convergence", "Fourier Epicycles", "Infinite Series", "Radius of Convergence"],
        formula: "∑ a_n xⁿ  ·  lim_{x→x₀} f(x)",
    },
};

export function LaboratoryIndexContent({ modules }: { modules: LaboratoryModuleMeta[] }) {
    const { locale } = useLocale();
    const copy = locale === "uz"
        ? {
              kicker: "MathSphere laboratoriyasi",
              title: "Fokuslangan matematik ish maydonlari.",
              lead: "Studiyani tanlab, aniq natijalar, sonli tekshiruvlar va ilmiy vizualizatsiyalar bilan ishlang. Interfeys ikkilamchi, matematika esa markazda qoladi.",
              studios: "Studiyalar",
              visual: "Vizual",
              compute: "Hisoblash",
              choose: "Matematik modulni tanlang.",
              note: "Avval aniq · standart vizualizatsiya · qayta ishlab bo‘ladigan chiqish",
              open: "Studiyani ochish",
              exact: "Avval aniq",
              exactCopy: "Yaqinlashtirishdan oldin ramziy tuzilmani afzal ko‘ring.",
              visualTitle: "Standart vizualizatsiya",
              visualCopy: "Grafik va geometriyani matematik natijaning asosiy qismi sifatida ko‘ring.",
              reproducible: "Qayta ishlab bo‘ladigan",
              reproducibleCopy: "Kiritmalar, farazlar va natijalarni qayta foydalanish uchun tuzilmali saqlang.",
          }
        : {
              kicker: "MathSphere Laboratory",
              title: "Focused mathematical workspaces.",
              lead: "Choose a studio and work directly with exact results, numerical checks and scientific visualizations. The interface remains secondary to the mathematics.",
              studios: "Studios",
              visual: "Visual",
              compute: "Compute",
              choose: "Choose a mathematical module.",
              note: "Exact first · visual by default · reproducible output",
              open: "Open studio",
              exact: "Exact first",
              exactCopy: "Prefer symbolic structure before approximation.",
              visualTitle: "Visual by default",
              visualCopy: "Treat plots and geometry as primary mathematical output.",
              reproducible: "Reproducible",
              reproducibleCopy: "Keep inputs, assumptions and results structured for reuse.",
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
                        <div className="ax-work-stat">
                            <div className="ax-work-stat-value">{modules.length}</div>
                            <div className="ax-work-stat-label">{copy.studios}</div>
                        </div>
                        <div className="ax-work-stat">
                            <div className="ax-work-stat-value">2D / 3D</div>
                            <div className="ax-work-stat-label">{copy.visual}</div>
                        </div>
                        <div className="ax-work-stat">
                            <div className="ax-work-stat-value">{locale === "uz" ? "Lokal" : "Local"}</div>
                            <div className="ax-work-stat-label">{copy.compute}</div>
                        </div>
                    </div>
                </section>

                <section className="ax-work-section">
                    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                        <div>
                            <div className="ax-work-kicker">{copy.studios}</div>
                            <div className="mt-2 font-serif text-[28px] tracking-[-0.035em] text-[var(--ax-text)]">{copy.choose}</div>
                        </div>
                        <div className="text-[11px] font-semibold text-[var(--ax-text-faint)]">
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--ax-work-line)] bg-[var(--ax-surface)] px-3 py-1">
                                <Sparkles className="h-3 w-3 text-amber-500" />
                                {copy.note}
                            </span>
                        </div>
                    </div>

                    <div className="grid gap-4 sm:gap-5">
                        {modules.map((module, index) => {
                            const Icon = moduleIcons[module.slug as keyof typeof moduleIcons] ?? AreaChart;
                            const description = descriptions[module.slug as keyof typeof descriptions] || module.summary;
                            const highlight = studioHighlights[module.slug];
                            const tags = locale === "uz" ? highlight?.tagsUz : highlight?.tagsEn;

                            return (
                                <Link
                                    key={module.id}
                                    href={`/laboratory/${module.slug}`}
                                    className="group relative flex flex-col justify-between overflow-hidden rounded-[var(--ax-radius-panel)] border border-[var(--ax-work-line)] bg-[var(--ax-surface)] p-6 shadow-xs transition-all duration-200 hover:border-[var(--ax-accent)] hover:shadow-md hover:translate-y-[-2px] sm:p-7"
                                >
                                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                        <div className="flex items-start gap-4">
                                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[var(--ax-work-line-strong)] bg-[var(--ax-surface-soft)] text-[var(--ax-accent)] shadow-xs transition-transform group-hover:scale-105">
                                                <Icon className="h-5 w-5" />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className="text-[9.5px] font-bold uppercase tracking-[0.16em] text-[var(--ax-text-faint)]">
                                                        {String(index + 1).padStart(2, "0")} · {module.category}
                                                    </span>
                                                    {highlight?.formula && (
                                                        <span className="rounded-md border border-[var(--ax-work-line)] bg-[var(--ax-surface-soft)] px-2 py-0.5 font-mono text-[10px] font-medium text-[var(--ax-accent)]">
                                                            {highlight.formula}
                                                        </span>
                                                    )}
                                                </div>
                                                <h2 className="mt-2 font-serif text-[26px] font-medium tracking-[-0.035em] text-[var(--ax-text)] group-hover:text-[var(--ax-accent)] transition-colors sm:text-[30px]">
                                                    {module.title}
                                                </h2>
                                                <p className="mt-2 max-w-[780px] text-xs leading-6 text-[var(--ax-text-soft)] sm:text-[13px]">
                                                    {description}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 self-start rounded-full border border-[var(--ax-work-line)] bg-[var(--ax-surface-soft)] px-4 py-2 text-xs font-bold text-[var(--ax-accent)] transition-colors group-hover:bg-[var(--ax-accent)] group-hover:text-white lg:self-center shrink-0">
                                            <span>{copy.open}</span>
                                            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                                        </div>
                                    </div>

                                    {tags && tags.length > 0 && (
                                        <div className="mt-5 flex flex-wrap items-center gap-1.5 border-t border-[var(--ax-work-line)] pt-3.5">
                                            {tags.map((tag) => (
                                                <span
                                                    key={tag}
                                                    className="rounded-full border border-[var(--ax-work-line)] bg-[var(--ax-surface-soft)] px-2.5 py-0.5 text-[10px] font-semibold text-[var(--ax-text-soft)]"
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </Link>
                            );
                        })}
                    </div>
                </section>
            </div>

            <section className="border-y border-[var(--ax-work-line)] bg-[var(--ax-surface)]">
                <div className="ax-work-container grid md:grid-cols-3 md:divide-x md:divide-[var(--ax-work-line)]">
                    {[
                        [copy.exact, copy.exactCopy],
                        [copy.visualTitle, copy.visualCopy],
                        [copy.reproducible, copy.reproducibleCopy],
                    ].map(([title, text]) => (
                        <div key={title} className="py-7 md:px-8 md:first:pl-0 md:last:pr-0">
                            <div className="font-serif text-[22px] tracking-[-0.03em] text-[var(--ax-text)]">{title}</div>
                            <p className="mt-2 max-w-sm text-[12px] leading-6 text-[var(--ax-text-soft)]">{text}</p>
                        </div>
                    ))}
                </div>
            </section>
        </>
    );
}
