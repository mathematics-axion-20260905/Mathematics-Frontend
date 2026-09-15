"use client";

import React from "react";

import { type LaboratoryModuleMeta } from "@/lib/laboratory";
import { useLaboratoryWriterBridge } from "@/components/live-writer-bridge/use-laboratory-writer-bridge";
import { useLiveWriterTargets } from "@/components/live-writer-bridge/use-live-writer-targets";
import { useLaboratoryResultPersistence } from "@/components/laboratory/use-laboratory-result-persistence";
import { LabCodeInsightPanel } from "@/components/laboratory/code-insight/lab-code-insight-panel";
import { MATRIX_PRESETS } from "@/components/laboratory/modules/matrix-studio/constants";
import { useMatrixStudio } from "@/components/laboratory/modules/matrix-studio/use-matrix-studio";
import { StudioHeaderBar } from "@/components/laboratory/modules/matrix-studio/components/studio-header-bar";
import { StudioStatusBar } from "@/components/laboratory/modules/matrix-studio/components/studio-status-bar";
import { SolveViewV2 as SolveView } from "@/components/laboratory/modules/matrix-studio/views/solve-view-v2";
import { VisualizeView } from "@/components/laboratory/modules/matrix-studio/views/visualize-view";
import { CompareView } from "@/components/laboratory/modules/matrix-studio/views/compare-view";
import { ReportView } from "@/components/laboratory/modules/matrix-studio/views/report-view";
import { type WriterBridgeBlockData, type WriterBridgePublicationProfile } from "@/lib/live-writer-bridge";
import type { MatrixStudioState } from "@/components/laboratory/modules/matrix-studio/types";

function buildMatrixReportMarkdown(state: MatrixStudioState) {
    return `# Matrix Studio Report

## Problem Statement
- Mode: ${state.mode}
- Dimension: ${state.dimension}
- Input matrix: ${state.matrixExpression}
- Right-hand side: ${state.rhsExpression || "none"}

## Method
- Method: ${state.analyticSolution?.exact.method_label ?? "client fallback"}
- Solver kind: ${state.summary.solverKind ?? "pending"}
- Decomposition: ${state.summary.decompositionSummary ?? "pending"}
- Report notes: ${state.reportNotes.join(" | ") || "none"}

## Solution
- Shape: ${state.summary.shape ?? "pending"}
- Determinant: ${state.summary.determinant ?? "pending"}
- Trace: ${state.summary.trace ?? "pending"}
- Rank: ${state.summary.rank ?? "pending"}
- Condition number: ${state.summary.conditionNumber ?? "pending"}
- Spectral radius: ${state.summary.spectralRadius ?? "pending"}
- Stability: ${state.summary.stabilitySummary ?? "pending"}
- Least squares: ${state.summary.leastSquaresSummary ?? "pending"}
- Iterative solve: ${state.summary.iterativeSummary ?? "pending"}
- Tensor shape: ${state.summary.tensorShape ?? "pending"}
- Tensor ranks: ${state.summary.modeRanks?.join(", ") ?? "pending"}

## Verification
- Contract: ${state.analyticSolution?.diagnostics.contract?.status ?? "pending"}
- Readiness: ${state.analyticSolution?.diagnostics.contract?.readiness_label ?? "pending"}
- Risk level: ${state.analyticSolution?.diagnostics.contract?.risk_level ?? "pending"}
- Residual norm: ${state.summary.residualNorm ?? "pending"}
- Factor audit: ${state.summary.factorAuditSummary ?? "pending"}

## Graph Interpretation
- Spectral radius: ${state.summary.spectralRadius ?? "pending"}
- Visualization uses the active matrix/tensor structure and the current numerical result.

## Code Appendix
- Use the Code tab for the editable reproducibility implementation and selected solver method.

## Conclusion
- Matrix/tensor analysis is ${state.analyticSolution?.diagnostics.contract?.readiness_label ?? "pending"}; review risk and residual diagnostics before publication.`;
}

function toNumericMatrix(rows: string[][]) {
    const matrix = rows.map((row) =>
        row.map((entry) => {
            const value = Number(entry);
            return Number.isFinite(value) ? value : 0;
        }),
    );

    return matrix.length && matrix[0]?.length ? matrix : null;
}

function buildMatrixLivePayload(state: MatrixStudioState, targetId: string): WriterBridgeBlockData {
    const numericMatrix = toNumericMatrix(state.matrixRows);

    return {
        id: targetId,
        status: "ready",
        moduleSlug: "matrix-studio",
        kind: state.mode,
        title: `Matrix report: ${state.mode}`,
        summary: state.analyticSolution?.exact.method_label ?? "Matrix laboratory report export",
        generatedAt: new Date().toISOString(),
        metrics: [
            { label: "Mode", value: state.mode },
            { label: "Shape", value: state.summary.shape ?? "pending" },
            { label: "Rank", value: state.summary.rank ?? "pending" },
            { label: "Condition", value: state.summary.conditionNumber ?? "pending" },
            { label: "Spectral Radius", value: state.summary.spectralRadius ?? "pending" },
        ],
        notes: state.reportNotes,
        matrixTables: numericMatrix ? [{ label: "Input matrix", matrix: numericMatrix }] : undefined,
    };
}

export function MatrixStudioModule({ module }: { module: LaboratoryModuleMeta }) {
    const { state, actions } = useMatrixStudio(module);
    const [templatesOpen, setTemplatesOpen] = React.useState(false);
    const [publicationProfile, setPublicationProfile] = React.useState<WriterBridgePublicationProfile>("summary");
    const [, setExportState] = React.useState<"idle" | "copied" | "sent">("idle");
    const { liveTargets, selectedLiveTargetId, setSelectedLiveTargetId } = useLiveWriterTargets();
    const reportMarkdown = React.useMemo(() => buildMatrixReportMarkdown(state), [state]);
    const { saveResult, saveState, saveError, lastSavedResult } = useLaboratoryResultPersistence({
        ready: Boolean(state.summary.shape || state.analyticSolution),
        moduleSlug: module.slug,
        moduleTitle: module.title,
        mode: state.mode,
        buildTitle: () => `Matrix report: ${state.mode}`,
        buildSummary: () => state.analyticSolution?.exact.method_label ?? state.summary.decompositionSummary ?? state.summary.systemSummary ?? "Matrix report asset",
        buildReportMarkdown: () => reportMarkdown,
        buildStructuredPayload: (targetId) => buildMatrixLivePayload(state, targetId),
        buildInputSnapshot: () => ({
            mode: state.mode,
            matrixExpression: state.matrixExpression,
            rhsExpression: state.rhsExpression,
            dimension: state.dimension,
            matrixRows: state.matrixRows,
            rhsRows: state.rhsRows,
            tensorSlices: state.tensorSlices,
        }),
        buildMetadata: () => ({
            sourceLabel: "Matrix Studio",
            preset: state.activePresetLabel ?? null,
        }),
    });
    const { copyMarkdownExport, sendToWriter, sendToNotebook, pushLiveResult, lastTransfer, transferState, transferError } = useLaboratoryWriterBridge({
        ready: Boolean(state.summary.shape || state.analyticSolution),
        sourceLabel: "Matrix Studio",
        liveTargets,
        selectedLiveTargetId,
        setExportState,
        buildMarkdown: () => reportMarkdown,
        buildBlock: (targetId) => buildMatrixLivePayload(state, targetId),
        publicationProfile,
        getInputSnapshot: () => ({
            mode: state.mode,
            matrixExpression: state.matrixExpression,
            rhsExpression: state.rhsExpression,
            dimension: state.dimension,
            matrixRows: state.matrixRows,
            rhsRows: state.rhsRows,
            tensorSlices: state.tensorSlices,
        }),
        getSavedResultMeta: () => ({ id: lastSavedResult?.id ?? null, revision: lastSavedResult?.revision ?? null, scientificObjectId: typeof lastSavedResult?.metadata?.scientific_object_id === "string" ? lastSavedResult.metadata.scientific_object_id : null }),
        getDraftMeta: () => ({
            title: "Matrix Analysis",
            abstract: "Exported from Matrix Studio.",
            keywords: `${state.mode},matrix`,
        }),
    });

    const renderedTab = React.useMemo(() => {
        switch (state.activeTab) {
            case "solve":
                return <SolveView state={state} actions={actions} />;
            case "code":
                return (
                    <LabCodeInsightPanel
                        module="matrix"
                        title="Matrix"
                        expression={state.matrixExpression}
                        secondary={state.rhsExpression || state.dimension}
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
                presets={MATRIX_PRESETS}
                activePresetLabel={state.activePresetLabel}
                applyPreset={actions.applyPreset}
            />

            <div className="flex-1 overflow-hidden">
                <div className="h-full overflow-y-auto px-4 py-4 lg:px-6">
                    {renderedTab}
                </div>
            </div>

            <StudioStatusBar
                solvePhase={state.solvePhase}
                isResultStale={state.isResultStale}
                mode={state.mode}
            />
        </div>
    );
}
