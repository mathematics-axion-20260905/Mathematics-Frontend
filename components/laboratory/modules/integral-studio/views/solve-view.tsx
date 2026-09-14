import React from "react";
import { useLocale } from "@/components/locale-provider";

import { LaboratoryMathPanel } from "@/components/laboratory/laboratory-math-panel";
import { LaboratoryMetricCard } from "@/components/laboratory/laboratory-metric-card";
import { LaboratorySignalPanel } from "@/components/laboratory/laboratory-signal-panel";
import { LaboratorySolveDetailCard } from "@/components/laboratory/laboratory-solve-detail-card";

import {
    IntegralProblemComposerV2,
    type IntegralProblemComposerV2Props,
} from "../components/integral-problem-composer-v2";
import { IntegralPrimaryVisualization } from "../components/integral-primary-visualization";
import { VisualizerDeck } from "../components/visualizer-deck";
import { StudioExactStep, StudioMetricCard, StudioSignal } from "../presentation-types";
import type { IntegralExperienceLevel } from "../types";

type SolveViewProps = {
    solverControlProps: IntegralProblemComposerV2Props;
    visualizerProps: React.ComponentProps<typeof VisualizerDeck>;
    staleOverlay: React.ReactNode;
    stalePanelClassName: string;
    solveOverviewCards: StudioMetricCard[];
    analyticDerivationTitle: string;
    analyticDerivationContent: string;
    analyticDerivationAccentClassName: string;
    showMethodTrace: boolean;
    methodTraceContent: string;
    exactSteps: StudioExactStep[];
    methodAuditCards: StudioMetricCard[];
    visibleSignals: StudioSignal[];
    assumptionCards: StudioMetricCard[];
    experienceLevel: IntegralExperienceLevel;
};

export function SolveView({
    solverControlProps,
    visualizerProps,
    staleOverlay,
    stalePanelClassName,
    solveOverviewCards,
    analyticDerivationTitle,
    analyticDerivationContent,
    analyticDerivationAccentClassName,
    showMethodTrace,
    methodTraceContent,
    exactSteps,
    methodAuditCards,
    visibleSignals,
    assumptionCards,
    experienceLevel,
}: SolveViewProps) {
    const { locale } = useLocale();
    const copy = locale === "uz"
        ? {
              result: "Natija",
              primaryResult: "Asosiy natija",
              exactFirst: "Avval aniq yechim · zarur bo‘lsa sonli usul",
              interpretation: "Talqin",
              analyticDerivation: "Analitik hosila",
              methodTrace: "Usul izi",
              derivationStrategy: "Hosil qilish strategiyasi",
              visualization: "Vizualizatsiya",
              inspectResult: "Asosiy matematik natijani tekshiring",
              analysisDetails: "Tahlil tafsilotlari",
              analysisHint: "Bosqichlar, sonli audit, farazlar va bajarilish diagnostikasi",
              show: "Ko‘rsatish",
              hide: "Yashirish",
              methodAudit: "Usul auditi",
              assumptions: "Farazlar",
              noAssumptions: "Alohida soha yoki yaqinlashuv farazlari qayd etilmadi.",
              runtimeSignals: "Bajarilish signallari",
              validationState: "Validatsiya va yechuvchi holati",
          }
        : {
              result: "Result",
              primaryResult: "Primary result",
              exactFirst: "Exact first · numerical when needed",
              interpretation: "Interpretation",
              analyticDerivation: "Analytic derivation",
              methodTrace: "Method Trace",
              derivationStrategy: "Derivation strategy",
              visualization: "Visualization",
              inspectResult: "Inspect the primary mathematical result",
              analysisDetails: "Analysis details",
              analysisHint: "Steps, numerical audit, assumptions and runtime diagnostics",
              show: "Show",
              hide: "Hide",
              methodAudit: "Method audit",
              assumptions: "Assumptions",
              noAssumptions: "No separate domain or convergence assumptions were emitted.",
              runtimeSignals: "Runtime Signals",
              validationState: "Validation and solver state",
          };
    const showResearchTools = experienceLevel === "research";
    const showAdvancedTools = experienceLevel === "advanced" || experienceLevel === "research";
    const hasPrimaryResult = solveOverviewCards.length > 0;

    const resultSection = hasPrimaryResult ? (
        <section className="rounded-[10px] border border-[#dfe4ea] bg-white px-4 py-4">
            <div className="mb-3 flex items-center justify-between gap-4">
                <div>
                    <div className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[#184eb8]">{copy.result}</div>
                    <div className="mt-1 font-serif text-[22px] tracking-[-0.025em] text-[#171a20]">{copy.primaryResult}</div>
                </div>
                <div className="text-[10px] text-[#949ba5]">{copy.exactFirst}</div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                {solveOverviewCards.map((card) => (
                    <LaboratoryMetricCard key={`solve-${card.eyebrow}-${card.value}`} {...card} />
                ))}
            </div>
        </section>
    ) : null;

    const derivationSection = (
        <section className="relative rounded-[10px] border border-[#dfe4ea] bg-white p-4">
            {staleOverlay}
            <div className={stalePanelClassName}>
                <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.13em] text-[#7b8490]">{copy.interpretation}</div>
                <LaboratoryMathPanel
                    eyebrow={copy.analyticDerivation}
                    title={analyticDerivationTitle}
                    content={analyticDerivationContent}
                    accentClassName={analyticDerivationAccentClassName}
                />
            </div>
        </section>
    );

    const methodTraceSection = showMethodTrace ? (
        <div className="relative">
            {staleOverlay}
            <div className={stalePanelClassName}>
                <LaboratoryMathPanel
                    eyebrow={copy.methodTrace}
                    title={copy.derivationStrategy}
                    content={methodTraceContent}
                    accentClassName="text-sky-600"
                />
            </div>
        </div>
    ) : null;

    const exactStepsSection = exactSteps.length ? (
        <div className="relative">
            {staleOverlay}
            <div className={`grid gap-2 ${stalePanelClassName}`}>
                {exactSteps.map((step, index) => (
                    <LaboratorySolveDetailCard
                        key={`${step.title}-${index}`}
                        id={String(index + 1)}
                        action={step.title}
                        result={step.summary}
                        formula={step.latex ? `$$${step.latex}$$` : undefined}
                        tone={step.tone}
                    />
                ))}
            </div>
        </div>
    ) : null;

    return (
        <div className="space-y-5">
            <div className="grid items-start gap-4 xl:grid-cols-[340px_minmax(0,1fr)] 2xl:grid-cols-[360px_minmax(0,1fr)]">
                <aside className="min-w-0 xl:sticky xl:top-[78px]">
                    <IntegralProblemComposerV2 {...solverControlProps} />
                </aside>

                <main className="min-w-0 space-y-4">
                    <section>
                        <div className="mb-2 flex items-center justify-between gap-4 px-1">
                            <div className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[#184eb8]">{copy.visualization}</div>
                            <div className="text-[10px] text-[#949ba5]">{copy.inspectResult}</div>
                        </div>
                        <div className="relative min-h-[360px] overflow-hidden rounded-[11px] border border-[#dfe4ea] bg-white p-2 [&>.site-panel-strong]:!static [&>.site-panel-strong]:!top-auto [&>.site-panel-strong]:!rounded-[8px] [&>.site-panel-strong]:!border-0 [&>.site-panel-strong]:!bg-white [&>.site-panel-strong]:!p-0 [&>.site-panel-strong]:!shadow-none">
                            {staleOverlay}
                            <div className={stalePanelClassName}>
                                <IntegralPrimaryVisualization {...visualizerProps} />
                            </div>
                        </div>
                    </section>

                    {resultSection}
                    {derivationSection}
                </main>
            </div>

            {showAdvancedTools ? (
                <section className="border-t border-[#e5e8ed] pt-4">
                    <details className="group rounded-[10px] border border-[#dfe4ea] bg-white" open={showResearchTools}>
                        <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3.5">
                            <div>
                                <div className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[#7b8490]">{copy.analysisDetails}</div>
                                <div className="mt-1 text-[12px] text-[#59616c]">{copy.analysisHint}</div>
                            </div>
                            <div className="text-[10px] font-semibold text-[#184eb8] group-open:hidden">{copy.show}</div>
                            <div className="hidden text-[10px] font-semibold text-[#184eb8] group-open:block">{copy.hide}</div>
                        </summary>

                        <div className="space-y-4 border-t border-[#e8ebef] p-4">
                            {exactStepsSection}
                            {showResearchTools && methodTraceSection ? methodTraceSection : null}

                            <div className="grid gap-4 lg:grid-cols-2">
                                <div className="rounded-[9px] border border-[#e2e6ec] bg-[#fcfdff] p-4">
                                    <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#66707c]">{copy.methodAudit}</div>
                                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                                        {methodAuditCards.slice(0, 4).map((card) => (
                                            <LaboratoryMetricCard key={`${card.eyebrow}-${card.value}`} {...card} />
                                        ))}
                                    </div>
                                </div>

                                <div className="rounded-[9px] border border-[#e2e6ec] bg-[#fcfdff] p-4">
                                    <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#66707c]">{copy.assumptions}</div>
                                    {assumptionCards.length ? (
                                        <div className="mt-3 grid gap-2 sm:grid-cols-2">
                                            {assumptionCards.map((card) => (
                                                <LaboratoryMetricCard key={`${card.eyebrow}-${card.value}`} {...card} />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="mt-3 text-[12px] leading-5 text-[#7c8490]">{copy.noAssumptions}</div>
                                    )}
                                </div>
                            </div>

                            {showResearchTools ? (
                                <LaboratorySignalPanel eyebrow={copy.runtimeSignals} title={copy.validationState} items={visibleSignals} />
                            ) : null}
                        </div>
                    </details>
                </section>
            ) : null}
        </div>
    );
}
