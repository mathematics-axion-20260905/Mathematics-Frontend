import Link from "next/link";
import { Activity, ArrowRight, AreaChart, Blocks, Sigma, TrendingUp } from "lucide-react";

import { fetchLaboratoryModules } from "@/lib/laboratory";
import { EcosystemTransferIntake } from "@/components/laboratory/ecosystem-transfer-intake";

const moduleIcons = {
    "integral-studio": Sigma,
    "differential-studio": Activity,
    "matrix-studio": Blocks,
    "probability-studio": AreaChart,
    "series-limit-studio": TrendingUp,
} as const;

const moduleDescriptions: Record<string, string> = {
    "integral-studio": "Symbolic, numerical and geometric integration in one focused workspace.",
    "differential-studio": "Derivatives, Jacobians, Hessians and differential systems with visual analysis.",
    "matrix-studio": "Matrix algebra, spectral analysis and transformations with clear geometric output.",
    "probability-studio": "Distributions, inference, regression and simulation built for visual inspection.",
    "series-limit-studio": "Limits, sequences, series and convergence workflows with precise comparison.",
};

export default async function LaboratoryPage() {
    const modules = await fetchLaboratoryModules();

    return (
        <div className="ax-workspace-root">
            <EcosystemTransferIntake />
            <div className="ax-work-container">
                <section className="ax-work-pagehead">
                    <div>
                        <div className="ax-work-kicker">MathSphere Laboratory</div>
                        <h1 className="ax-work-title">Focused mathematical workspaces.</h1>
                        <p className="ax-work-lead">Choose a studio and work directly with exact results, numerical checks and large scientific visualizations. The chrome stays quiet; the mathematics stays primary.</p>
                    </div>
                    <div className="ax-work-stats">
                        <div className="ax-work-stat"><div className="ax-work-stat-value">{modules.length}</div><div className="ax-work-stat-label">Studios</div></div>
                        <div className="ax-work-stat"><div className="ax-work-stat-value">2D/3D</div><div className="ax-work-stat-label">Visual</div></div>
                        <div className="ax-work-stat"><div className="ax-work-stat-value">Local</div><div className="ax-work-stat-label">Compute</div></div>
                    </div>
                </section>

                <section className="ax-work-section">
                    <div className="mb-5 flex items-end justify-between gap-6">
                        <div>
                            <div className="ax-work-kicker">Studios</div>
                            <div className="mt-2 font-serif text-[26px] tracking-[-0.035em]">Choose the mathematical instrument.</div>
                        </div>
                        <div className="hidden text-[11px] text-[var(--ax-text-faint)] sm:block">Exact first · visual by default · reproducible output</div>
                    </div>

                    <div className="ax-work-list">
                        {modules.map((module, index) => {
                            const Icon = moduleIcons[module.slug as keyof typeof moduleIcons] ?? AreaChart;
                            return (
                                <Link
                                    key={module.id}
                                    href={`/laboratory/${module.slug}`}
                                    className="ax-work-row group grid min-h-[136px] gap-5 px-1 py-6 sm:grid-cols-[56px_minmax(0,1fr)_auto] sm:items-center sm:px-5 lg:px-7"
                                    style={{ contentVisibility: "auto", containIntrinsicSize: "136px" }}
                                >
                                    <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--ax-work-line)] bg-[var(--ax-surface)] text-[var(--ax-accent)]">
                                        <Icon className="h-[18px] w-[18px]" />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-[9px] font-semibold uppercase tracking-[0.15em] text-[var(--ax-text-faint)]">{String(index + 1).padStart(2, "0")} · {module.category}</div>
                                        <h2 className="mt-2 font-serif text-[30px] tracking-[-0.04em] text-[var(--ax-text)]">{module.title}</h2>
                                        <p className="mt-2 max-w-[760px] text-[12px] leading-6 text-[var(--ax-text-soft)]">{moduleDescriptions[module.slug] || module.summary}</p>
                                    </div>
                                    <div className="flex items-center gap-2 text-[11px] font-semibold text-[var(--ax-accent)]">Open studio <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" /></div>
                                </Link>
                            );
                        })}
                    </div>
                </section>
            </div>

            <section className="border-y border-[var(--ax-work-line)] bg-[var(--ax-surface)]">
                <div className="ax-work-container grid md:grid-cols-3 md:divide-x md:divide-[var(--ax-work-line)]">
                    {[
                        ["Exact first", "Prefer symbolic structure before approximation."],
                        ["Visual by default", "Treat plots and geometry as primary mathematical output."],
                        ["Reproducible", "Keep inputs, assumptions and results structured for reuse."],
                    ].map(([title, text]) => (
                        <div key={title} className="py-7 md:px-8 md:first:pl-0 md:last:pr-0">
                            <div className="font-serif text-[22px] tracking-[-0.03em]">{title}</div>
                            <p className="mt-2 max-w-sm text-[11px] leading-5 text-[var(--ax-text-soft)]">{text}</p>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}
