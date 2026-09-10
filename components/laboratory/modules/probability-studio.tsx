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
    return `# Probability Report\n\n- mode: ${state.mode}\n- dimension: ${state.dimension}\n- sample size: ${state.summary.sampleSize ?? "pending"}\n- final: ${state.analyticSolution?.exact.result_latex ?? state.result.finalFormula ?? "pending"}\n- auxiliary: ${state.analyticSolution?.exact.auxiliary_latex ?? state.result.auxiliaryFormula ?? "pending"}\n- method: ${state.analyticSolution?.exact.method_label ?? "client fallback"}\n- risk: ${state.summary.riskSignal ?? "pending"}\n- readiness: ${state.contractSummary.readinessLabel}\n- contract: ${state.contractSummary.status}\n- contract risk: ${state.contractSummary.riskLevel}\n- benchmark: ${state.benchmarkSummary?.status ?? "n/a"}\n\n## report notes\n${state.reportNotes.map((note) => `- ${note}`).join("\n")}`;
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
    const { copyMarkdownExport, sendToWriter, pushLiveResult } = useLaboratoryWriterBridge({
        ready: Boolean(state.analyticSolution || state.result.finalFormula || state.summary.sampleSize),
        sourceLabel: "Probability Studio",
        liveTargets,
        selectedLiveTargetId,
        setExportState,
        buildMarkdown: () => reportMarkdown,
        buildBlock: (targetId) => buildProbabilityLivePayload(state, targetId),
        publicationProfile,
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
    }, [actions, copyMarkdownExport, liveTargets, publicationProfile, pushLiveResult, saveError, saveResult, saveState, selectedLiveTargetId, sendToWriter, setSelectedLiveTargetId, state, lastSavedResult?.title]);

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
