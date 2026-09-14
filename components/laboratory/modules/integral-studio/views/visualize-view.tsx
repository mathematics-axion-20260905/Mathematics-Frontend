import React from "react";
import { useLocale } from "@/components/locale-provider";

import { CartesianPlot } from "@/components/laboratory/cartesian-plot";
import { LaboratoryDataTable } from "@/components/laboratory/laboratory-data-table";
import { LaboratoryMetricCard } from "@/components/laboratory/laboratory-metric-card";
import { LaboratorySignalPanel } from "@/components/laboratory/laboratory-signal-panel";

import { VisualizerDeck } from "../components/visualizer-deck";
import { StudioMetricCard, StudioSignal } from "../presentation-types";
import type { IntegralExperienceLevel } from "../types";

type SweepSeriesLike = {
    title: string;
    plotSeries: React.ComponentProps<typeof CartesianPlot>["series"];
    metricLabel: string;
} | null;

type VisualizeViewProps = {
    visualizerProps: React.ComponentProps<typeof VisualizerDeck>;
    staleOverlay: React.ReactNode;
    stalePanelClassName: string;
    mode: "single" | "double" | "triple";
    methodTableRows: string[][];
    sampleTableRows: string[][];
    visualizeOverviewCards: StudioMetricCard[];
    methodAuditCards: StudioMetricCard[];
    visibleSignals: StudioSignal[];
    sweepSeries: SweepSeriesLike;
    sweepTableRows: string[][];
    sweepStart: string;
    setSweepStart: (value: string) => void;
    sweepEnd: string;
    setSweepEnd: (value: string) => void;
    experienceLevel: IntegralExperienceLevel;
};

export function VisualizeView({
    visualizerProps,
    staleOverlay,
    stalePanelClassName,
    mode,
    methodTableRows,
    sampleTableRows,
    visualizeOverviewCards,
    methodAuditCards,
    visibleSignals,
    sweepSeries,
    sweepTableRows,
    sweepStart,
    setSweepStart,
    sweepEnd,
    setSweepEnd,
    experienceLevel,
}: VisualizeViewProps) {
    const { locale } = useLocale();
    const copy = locale === "uz"
        ? {
              metrics: "Metrikalar",
              computationAudit: "Hisoblash auditi",
              samples: "Namunalar",
              renderedPoints: "Qurilgan nuqtalar",
              noMetrics: "Metrikalar mavjud emas",
              noSamples: "Namunalar mavjud emas",
              visualAudit: "Vizual audit",
              sensitivity: "Sezgirlik tahlili",
              sweepHint: "Segment yoki to‘r zichligi o‘zgarganda baholash siljishini kuzating.",
              sweepTable: "Sezgirlik jadvali",
              detailedDrift: "Siljish tafsilotlari",
              noSweep: "Sezgirlik jadvali mavjud emas",
              sweepEmpty: "Jadval ifoda va soha yaroqli bo‘lganda quriladi.",
              runtimeSignals: "Bajarilish signallari",
              validation: "Vizualizatsiya validatsiyasi",
          }
        : {
              metrics: "Metrics",
              computationAudit: "Computation Audit",
              samples: "Samples",
              renderedPoints: "Rendered Data Points",
              noMetrics: "No metrics",
              noSamples: "No samples",
              visualAudit: "Visual Audit",
              sensitivity: "Sensitivity Sweep",
              sweepHint: "Monitor estimate drift as segment or grid density changes.",
              sweepTable: "Sweep Table",
              detailedDrift: "Detailed Drift",
              noSweep: "No sweep",
              sweepEmpty: "The sweep table appears when the expression and domain are valid.",
              runtimeSignals: "Runtime Signals",
              validation: "Visualization validation",
          };
    const showTables = experienceLevel !== "beginner";
    const showSweep = experienceLevel === "research";
    const showSignals = experienceLevel === "research";
    const auditCards = experienceLevel === "advanced" ? visualizeOverviewCards : [...visualizeOverviewCards, ...methodAuditCards];

    return (
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-8">
                <div className="relative">
                    {staleOverlay}
                    <div className={stalePanelClassName}>
                        <VisualizerDeck {...visualizerProps} />
                    </div>
                </div>
                {showTables ? (
                <div className="relative">
                    {staleOverlay}
                    <div className={`grid gap-8 lg:grid-cols-2 ${stalePanelClassName}`}>
                        <LaboratoryDataTable eyebrow={copy.metrics} title={copy.computationAudit} columns={locale === "uz" ? ["Metrika", "Qiymat", "Izoh"] : ["Metric", "Value", "Notes"]} rows={methodTableRows} emptyMessage={copy.noMetrics} />
                        <LaboratoryDataTable
                            eyebrow={copy.samples}
                            title={copy.renderedPoints}
                            columns={mode === "single" ? ["x", "y"] : mode === "double" ? ["x", "y", "z"] : ["x", "y", "z", "val"]}
                            rows={sampleTableRows}
                            emptyMessage={copy.noSamples}
                        />
                    </div>
                </div>
                ) : null}
            </div>
            <div className="space-y-8">
                <div className="relative">
                    {staleOverlay}
                    <div className={`site-panel space-y-4 p-5 ${stalePanelClassName}`}>
                        <div className="site-eyebrow text-accent">{copy.visualAudit}</div>
                        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                            {auditCards.map((card) => (
                                <LaboratoryMetricCard key={`visual-${card.eyebrow}-${card.value}`} {...card} />
                            ))}
                        </div>
                    </div>
                </div>
                {showSweep ? (
                <div className="relative">
                    {staleOverlay}
                    <div className={`site-panel space-y-6 p-6 ${stalePanelClassName}`}>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <div className="site-eyebrow text-accent">{copy.sensitivity}</div>
                                <div className="mt-2 text-sm leading-7 text-muted-foreground">
                                    {copy.sweepHint}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <input value={sweepStart} onChange={(e) => setSweepStart(e.target.value)} className="site-input w-20 text-center" />
                                <input value={sweepEnd} onChange={(e) => setSweepEnd(e.target.value)} className="site-input w-20 text-center" />
                            </div>
                        </div>
                        {sweepSeries ? (
                            <div className="grid gap-6">
                                <CartesianPlot title={sweepSeries.title} series={sweepSeries.plotSeries} />
                                <LaboratoryDataTable
                                    eyebrow={copy.sweepTable}
                                    title={copy.detailedDrift}
                                    columns={sweepSeries.metricLabel === "segments" ? ["Segments", "Simpson", "Midpoint", "Trapezoid"] : ["Grid", "Estimate", "Samples", "Z-Grid"]}
                                    rows={sweepTableRows}
                                    emptyMessage={copy.noSweep}
                                />
                            </div>
                        ) : (
                            <div className="rounded-2xl border border-dashed border-border/60 bg-background/45 px-4 py-6 text-sm leading-7 text-muted-foreground">
                                {copy.sweepEmpty}
                            </div>
                        )}
                    </div>
                </div>
                ) : null}
                {showSignals ? (
                <div className="relative">
                    {staleOverlay}
                    <div className={stalePanelClassName}>
                        <LaboratorySignalPanel eyebrow={copy.runtimeSignals} title={copy.validation} items={visibleSignals} />
                    </div>
                </div>
                ) : null}
            </div>
        </div>
    );
}
