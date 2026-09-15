"use client";

import React from "react";

import type { LaboratoryModuleMeta } from "@/lib/laboratory";
import { useLaboratoryWriterBridge } from "@/components/live-writer-bridge/use-laboratory-writer-bridge";
import { useLiveWriterTargets } from "@/components/live-writer-bridge/use-live-writer-targets";
import { useLaboratoryResultPersistence } from "@/components/laboratory/use-laboratory-result-persistence";
import { LabCodeInsightPanel } from "@/components/laboratory/code-insight/lab-code-insight-panel";
import { PROBABILITY_PRESETS } from "@/components/laboratory/modules/probability-studio/constants";
import { useProbabilityStudio } from "@/components/laboratory/modules/probability-studio/use-probability-studio";
import { StudioHeaderBar } from "@/components/laboratory/modules/probability-studio/components/studio-header-bar";
import { StudioStatusBar } from "@/components/laboratory/modules/probability-studio/components/studio-status-bar";
import { SolveViewV2 as SolveView } from "@/components/laboratory/modules/probability-studio/views/solve-view-v2";
import { VisualizeView } from "@/components/laboratory/modules/probability-studio/views/visualize-view";
import { CompareView } from "@/components/laboratory/modules/probability-studio/views/compare-view";
import { ReportView } from "@/components/laboratory/modules/probability-studio/views/report-view";
import { type WriterBridgeBlockData, type WriterBridgePublicationProfile } from "@/lib/live-writer-bridge";
import type { ProbabilityStudioState } from "@/components/laboratory/modules/probability-studio/types";

function buildProbabilityReportMarkdown(state: ProbabilityStudioState) {
    return `# Probability Report

## Problem Statement
- Mode: ${state.mode}
- Dimension: ${state.dimension}
- Dataset / model input: ${state.datasetExpression}
- Parameters: ${state.parameterExpression}
- Sample size: ${state.summary.sampleSize ?? "pending"}

## Method
- Method: ${state.analyticSolution?.exact.method_label ?? "client fallback"}
- Distribution family: ${state.contractSummary.family}
- Primary diagnostic: ${state.summary.testStatistic ?? state.summary.power ?? state.summary.residualSignal ?? state.summary.posteriorPredictive ?? state.summary.pcaSignal ?? state.summary.acfSignal ?? state.summary.bootstrapSignal ?? "pending"}
- Report notes: ${state.reportNotes.join(" | ") || "none"}

## Solution
- Final result: ${state.analyticSolution?.exact.result_latex ?? state.result.finalFormula ?? "pending"}
- Auxiliary result: ${state.analyticSolution?.exact.auxiliary_latex ?? state.result.auxiliaryFormula ?? "pending"}
- Secondary diagnostic: ${state.summary.intervalSignal ?? state.summary.forecastInterval ?? state.summary.explainedVariance ?? state.summary.convergenceSignal ?? "pending"}
- Forecast: ${state.summary.forecast ?? state.summary.posteriorPredictive ?? "pending"}

## Verification
- Contract: ${state.contractSummary.status}
- Readiness: ${state.contractSummary.readinessLabel}
- Risk level: ${state.contractSummary.riskLevel}
- Checks passed: ${state.contractSummary.checks.filter((item) => item.status === "ok").length}/${state.contractSummary.checks.length}
- Benchmark: ${state.benchmarkSummary ? `${state.benchmarkSummary.label} -> ${state.benchmarkSummary.status}` : "n/a"}

## Graph Interpretation
- Distribution, forecast, scatter or diagnostic series are carried in the structured payload when available.
- Risk signal: ${state.summary.riskSignal ?? "pending"}

## Code Appendix
- Use the Code tab for the editable reproducibility implementation.

## Conclusion
- Probability analysis remains ${state.contractSummary.readinessLabel}; interpret uncertainty and risk signals with the stated assumptions.`;
}

function buildProbabilityLivePayload(state: ProbabilityStudioState, targetId: string): WriterBridgeBlockData {
    const plotSeries = [
        state.result.lineSeries?.length ? { label: "Primary series", color: "#2563eb", points: state.result.lineSeries } : null,
        state.result.secondaryLineSeries?.length ? { label: "Secondary series", color: "#7c3aed", points: state.result.secondaryLineSeries } : null,
        state.result.scatterSeries?.length ? { label: "Scatter", color: "#059669", points: state.result.scatterSeries } : null,
        state.result.forecastSeries?.length ? { label: "Forecast", color: "#ea580c", points: state.result.forecastSeries } : null,
    ].filter(Boolean) as WriterBridgeBlockData["plotSeries"];

    return {
        id: targetId,
        status: "ready",
        moduleSlug: "probability-studio",
        kind: state.mode,
        title: `Probability report: ${state.mode}`,
        summary: state.analyticSolution?.exact.method_label ?? "Probability laboratory report export",
        generatedAt: new Date().toISOString(),
        metrics: [
            { label: "Mode", value: state.mode },
            { label: "Sample Size", value: state.summary.sampleSize ?? "pending" },
            { label: "Risk", value: state.summary.riskSignal ?? "pending" },
            { label: "Statistic", value: state.summary.testStatistic ?? state.summary.pValue ?? "pending" },
        ],
        notes: state.reportNotes,
        plotSeries,
    };
}

export function ProbabilityStudioModule({ module }: { module: LaboratoryModuleMeta }) {
    const { state, actions } = useProbabilityStudio(module);
    const [templatesOpen, setTemplatesOpen] = React.useState(false);
    const [publicationProfile, setPublicationProfile] = React.useState<WriterBridgePublicationProfile>("summary");
    const [, setExportState] = React.useState<"idle" | "copied" | "sent">("idle");
    const { liveTargets, selectedLiveTargetId, setSelectedLiveTargetId } = useLiveWriterTargets();
    const reportMarkdown = React.useMemo(() => buildProbabilityReportMarkdown(state), [state]);
    const { saveResult, saveState, saveError, lastSavedResult } = useLaboratoryResultPersistence({
        ready: Boolean(state.analyticSolution || state.result.finalFormula || state.summary.sampleSize),
        moduleSlug: module.slug,
        moduleTitle: module.title,
        mode: state.mode,
        buildTitle: () => `Probability report: ${state.mode}`,
        buildSummary: () => state.analyticSolution?.exact.method_label ?? state.summary.riskSignal ?? "Probability report asset",
        buildReportMarkdown: () => reportMarkdown,
        buildStructuredPayload: (targetId) => buildProbabilityLivePayload(state, targetId),
        buildInputSnapshot: () => ({
            mode: state.mode,
            datasetExpression: state.datasetExpression,
            parameterExpression: state.parameterExpression,
            dimension: state.dimension,
        }),
        buildMetadata: () => ({
            sourceLabel: "Probability Studio",
            preset: state.activePresetLabel ?? null,
        }),
    });
    const { copyMarkdownExport, sendToWriter, sendToNotebook, pushLiveResult, lastTransfer, transferState, transferError } = useLaboratoryWriterBridge({
        ready: Boolean(state.analyticSolution || state.result.finalFormula || state.summary.sampleSize),
        sourceLabel: "Probability Studio",
        liveTargets,
        selectedLiveTargetId,
        setExportState,
        buildMarkdown: () => reportMarkdown,
        buildBlock: (targetId) => buildProbabilityLivePayload(state, targetId),
        publicationProfile,
        getInputSnapshot: () => ({
            mode: state.mode,
            datasetExpression: state.datasetExpression,
            parameterExpression: state.parameterExpression,
            dimension: state.dimension,
        }),
        getSavedResultMeta: () => ({ id: lastSavedResult?.id ?? null, revision: lastSavedResult?.revision ?? null, scientificObjectId: typeof lastSavedResult?.metadata?.scientific_object_id === "string" ? lastSavedResult.metadata.scientific_object_id : null }),
        getDraftMeta: () => ({
            title: "Probability Analysis",
            abstract: "Exported from Probability Studio.",
            keywords: `${state.mode},probability`,
        }),
    });

    const renderedTab = React.useMemo(() => {
        switch (state.activeTab) {
            case "solve":
                return <SolveView state={state} actions={actions} />;
            case "code":
                return (
                    <LabCodeInsightPanel
                        module="probability"
                        title="Probability"
                        expression={state.datasetExpression}
                        secondary={state.parameterExpression || state.dimension}
                        analyticSolution={state.analyticSolution}
                    />
                );
            case "visualize":
                return <VisualizeView state={state} />;
            case "compare":
                return <CompareView state={state} />;
            case "report":
                return (
                    <ReportView
                        state={state}
                        copyMarkdownExport={copyMarkdownExport}
                        saveResult={saveResult}
                        saveState={saveState}
                        saveError={saveError}
                        lastSavedResultTitle={lastSavedResult?.title ?? null}
                        sendToWriter={sendToWriter}
                        sendToNotebook={sendToNotebook}
                        lastTransfer={lastTransfer}
                        transferState={transferState}
                        transferError={transferError}
                        pushLiveResult={pushLiveResult}
                        liveTargets={liveTargets.map((target) => ({ id: `${target.paperId}::${target.id}`, title: `${target.paperTitle} · ${target.title}` }))}
                        selectedLiveTargetId={selectedLiveTargetId || null}
                        setSelectedLiveTargetId={setSelectedLiveTargetId}
                        publicationProfile={publicationProfile}
                        setPublicationProfile={setPublicationProfile}
                    />
                );
            default:
                return null;
        }
    }, [actions, copyMarkdownExport, liveTargets, publicationProfile, pushLiveResult, saveError, saveResult, saveState, selectedLiveTargetId, sendToNotebook, sendToWriter, setSelectedLiveTargetId, state, lastSavedResult?.title]);

    return (
        <div className="flex grow flex-col overflow-hidden rounded-3xl border border-border/40 bg-background/50">
            <StudioHeaderBar
                activeTab={state.activeTab}
                setActiveTab={actions.setActiveTab}
                templatesOpen={templatesOpen}
                setTemplatesOpen={setTemplatesOpen}
                experienceLevel={state.experienceLevel}
                setExperienceLevel={actions.setExperienceLevel}
                presets={PROBABILITY_PRESETS}
                activePresetLabel={state.activePresetLabel}
                applyPreset={actions.applyPreset}
            />

            <div className="flex-1 overflow-hidden">
                <div className="h-full overflow-y-auto px-4 py-4 lg:px-6">{renderedTab}</div>
            </div>

            <StudioStatusBar solvePhase={state.solvePhase} isResultStale={state.isResultStale} mode={state.mode} />
        </div>
    );
}
