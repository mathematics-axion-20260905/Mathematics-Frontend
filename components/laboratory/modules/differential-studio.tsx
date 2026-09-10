import React from "react";

import { LaboratoryModuleMeta } from "@/lib/laboratory";
import { useLaboratoryWriterBridge } from "@/components/live-writer-bridge/use-laboratory-writer-bridge";
import { useLiveWriterTargets } from "@/components/live-writer-bridge/use-live-writer-targets";
import { useLaboratoryResultPersistence } from "@/components/laboratory/use-laboratory-result-persistence";
import { useDifferentialStudio } from "./differential-studio/use-differential-studio";
import { DIFFERENTIAL_PRESETS, DIFFERENTIAL_WORKFLOW_TEMPLATES } from "./differential-studio/constants";
import { type WriterBridgeBlockData, type WriterBridgePublicationProfile } from "@/lib/live-writer-bridge";

// Local Components
import { StudioHeaderBar } from "./differential-studio/components/studio-header-bar";
import { StudioStatusBar } from "./differential-studio/components/studio-status-bar";
import { CodeView } from "./differential-studio/views/code-view";
import { CompareView } from "./differential-studio/views/compare-view";
import { ReportView } from "./differential-studio/views/report-view";
import { SolveView } from "./differential-studio/views/solve-view";
import { VisualizeView } from "./differential-studio/views/visualize-view";
import type { DifferentialComputationSummary, DifferentialExtendedMode, DifferentialValidationSignal } from "./differential-studio/types";

type DifferentialTemplatePreset = {
    label: string;
    mode: DifferentialExtendedMode;
    expr: string;
    variable?: string;
    point?: string;
    order?: string;
    direction?: string;
};

function buildDifferentialReportMarkdown(state: ReturnType<typeof useDifferentialStudio>["state"]) {
    const exact = state.analyticSolution?.exact;
    const diagnostics = state.analyticSolution?.diagnostics;
    const contract = diagnostics?.contract;
    const result = describeDifferentialResult(state.summary) ?? exact?.numeric_approximation ?? "pending";
    return `# Differential / ODE Analysis Report

## Title
Differential analysis of "${state.expression || "untitled expression"}"

## Objective
Solve or analyze the submitted derivative/ODE task, expose the method route, preserve numerical fallback data, and prepare a Writer-ready laboratory result.

## Problem Statement
- Mode: ${state.mode}
- Expression: ${state.expression}
- Variable: ${state.variable}
- Evaluation point: ${state.point}
- Classification: ${state.classification.label}

## Method
- Method: ${exact?.method_label ?? "client fallback"}
- Method summary: ${exact?.method_label ?? state.classification.summary}
- Continuity: ${diagnostics?.continuity ?? "pending"}
- Differentiability: ${diagnostics?.differentiability ?? "pending"}
- Taxonomy: ${diagnostics?.taxonomy?.family ?? "pending"}

## Symbolic Solution
${exact?.derivative_latex ? `$$${exact.derivative_latex}$$` : "Symbolic derivative/ODE expression is pending or not available."}

## Numerical Fallback
- Result: ${result}
- Numeric approximation: ${exact?.numeric_approximation ?? "not available"}
- Benchmark status: ${state.benchmarkSummary?.status ?? "n/a"}
- Benchmark detail: ${state.benchmarkSummary?.detail ?? "none"}

## Visualization
Differential Studio visualization stores slope/trajectory/sample information where the selected mode supports it. Include the plot panel when exporting a final manuscript.

## Interpretation
- Contract: ${contract?.status ?? "n/a"}
- Readiness: ${contract?.readiness_label ?? "n/a"}
- Risk level: ${contract?.risk_level ?? "n/a"}
- Trust score: ${state.reportExecutiveCards?.[2]?.value ?? "pending"}

## Limitations
- Blockers: ${(diagnostics?.domain_analysis?.blockers ?? []).join(" | ") || "none"}
- Review notes: ${(contract?.review_notes ?? []).join(" | ") || "none"}
- Numerical ODE/SDE/PDE results should include tolerance, step size, and convergence diagnostics before publication use.

## Code Appendix
Use the Code tab to generate editable reproducibility code for this differential task.

## References
- SymPy documentation: symbolic differentiation and equation solving.
- SciPy documentation: solve_ivp and numerical differential equation solvers.
- MathSphere Laboratory saved-result schema for Writer bridge import.`;
}

function describeDifferentialResult(summary: DifferentialComputationSummary | null) {
    if (!summary) return null;
    if (summary.type === "ode") return `y(T)=${summary.valueAtPoint.toFixed(6)}`;
    if (summary.type === "pde") return `${summary.family} ${summary.grid.nx}x${summary.grid.nt}`;
    if (summary.type === "sde") return `E[X(T)]=${summary.terminalMean.toFixed(6)}`;
    if ("matrix" in summary) return `${summary.type} ${summary.matrix.length}x${summary.matrix[0]?.length ?? summary.matrix.length}`;
    if (summary.type === "gradient") return `|grad|=${summary.magnitude.toFixed(6)}`;
    if (summary.type === "directional") return `${summary.directionalDerivative.toFixed(6)}`;
    if (summary.type === "higher_order") return `order ${summary.maxOrder}`;
    if ("partialAtPoint" in summary) return `${summary.partialAtPoint.toFixed(6)}`;
    if ("derivativeAtPoint" in summary) return `${summary.derivativeAtPoint.toFixed(6)}`;
    return null;
}

function buildDifferentialLivePayload(state: ReturnType<typeof useDifferentialStudio>["state"], targetId: string): WriterBridgeBlockData {
    const matrixTables =
        state.summary && "matrix" in state.summary
            ? [{ label: state.summary.type, matrix: state.summary.matrix }]
            : undefined;
    const plotSeries =
        state.summary && "samples" in state.summary && Array.isArray(state.summary.samples)
            ? [{ label: "Samples", color: "#2563eb", points: state.summary.samples }]
            : undefined;

    return {
        id: targetId,
        status: "ready",
        moduleSlug: "differential-studio",
        kind: state.mode,
        title: `Differential report: ${state.mode}`,
        summary: state.analyticSolution?.exact.method_label ?? state.classification.label,
        generatedAt: new Date().toISOString(),
        metrics: [
            { label: "Mode", value: state.mode },
            { label: "Variable", value: state.variable },
            { label: "Point", value: state.point },
            { label: "Result", value: describeDifferentialResult(state.summary) ?? state.analyticSolution?.exact.numeric_approximation ?? "pending" },
        ],
        notes: [
            state.classification.summary,
            ...(state.analyticSolution?.diagnostics?.domain_analysis?.blockers ?? []),
            ...(state.analyticSolution?.parser?.notes ?? []),
        ],
        matrixTables,
        plotSeries,
    };
}

function buildAdvancedLaneSignals(state: ReturnType<typeof useDifferentialStudio>["state"]): DifferentialValidationSignal[] {
    const signals: DifferentialValidationSignal[] = [];
    const expression = state.expression.trim();
    const point = state.point.trim();

    if (state.mode === "ode") {
        if (!expression.includes("=")) {
            signals.push({ field: "ode-equation", tone: "warn", label: "Equation format", text: "ODE lane uchun `y' = f(x,y)` ko'rinishidagi equation kerak.", blocking: true });
        }
        if (!/y\(/i.test(`${expression};${point}`)) {
            signals.push({ field: "ode-ic", tone: "info", label: "Initial data", text: "Initial condition berilmasa trajectory default seed bilan quriladi.", blocking: false });
        }
        if (state.summary?.type === "ode" && state.summary.stabilityLabel === "undetermined") {
            signals.push({ field: "ode-phase", tone: "warn", label: "Phase read weak", text: "Autonomous stability classification aniq chiqmagan; rhs ni soddalashtirib qayta tekshiring.", blocking: false });
        }
    }

    if (state.mode === "pde") {
        if (!/u_t/i.test(expression) || !/u_x|u_xx|u_y|u_yy/i.test(expression)) {
            signals.push({ field: "pde-syntax", tone: "warn", label: "PDE shorthand", text: "PDE lane `u_t = ...` va kamida bitta spatial derivative token kutadi.", blocking: true });
        }
        if (!/u\(x,0\)/i.test(`${expression};${point}`)) {
            signals.push({ field: "pde-ic", tone: "info", label: "Initial profile", text: "Initial profile berilmasa default `sin(x)` ishlatiladi.", blocking: false });
        }
        if (state.summary?.type === "pde" && state.summary.family === "heat" && state.summary.stabilityRatio > 0.5) {
            signals.push({ field: "pde-cfl", tone: "warn", label: "CFL watch", text: "Explicit heat mesh stability chegarasiga yaqinlashdi.", blocking: false });
        }
    }

    if (state.mode === "sde") {
        if (!/dX\s*=.+\*dt.+\*dW/i.test(expression.replace(/\s+/g, ""))) {
            signals.push({ field: "sde-syntax", tone: "warn", label: "SDE syntax", text: "SDE lane `dX = mu*dt + sigma*dW` ko'rinishini kutadi.", blocking: true });
        }
        if (!/X\(0\)/i.test(`${expression};${point}`) || !/t:\s*\[/i.test(`${expression};${point}`) || !/n\s*=/i.test(`${expression};${point}`)) {
            signals.push({ field: "sde-grid", tone: "info", label: "Simulation contract", text: "X(0), t:[t0,t1], n kabi parametrlar kiritilsa ensemble yanada ishonchli quriladi.", blocking: false });
        }
        if (state.summary?.type === "sde" && state.summary.pathCount < 20) {
            signals.push({ field: "sde-ensemble", tone: "warn", label: "Low ensemble size", text: "Stochastic lane kamida 20 ta path bilan o‘qilgani ma’qul.", blocking: false });
        }
    }

    return signals;
}

export function DifferentialStudioModule({ module }: { module: LaboratoryModuleMeta }) {
    const { state, actions } = useDifferentialStudio(module);
    const {
        experienceLevel,
        activeTab,
        solvePhase,
        solveErrorMessage,
        error,
        isResultStale,
    } = state;

    const {
        setExperienceLevel,
        setActiveTab,
    } = actions;

    const [templatesOpen, setTemplatesOpen] = React.useState(false);
    const [activeTemplateId, setActiveTemplateId] = React.useState<string | null>(null);
    const [activePresetLabel, setActivePresetLabel] = React.useState<string | undefined>(DIFFERENTIAL_PRESETS[0]?.label);
    const [publicationProfile, setPublicationProfile] = React.useState<WriterBridgePublicationProfile>("summary");
    const [, setExportState] = React.useState<"idle" | "copied" | "sent">("idle");
    const { liveTargets, selectedLiveTargetId, setSelectedLiveTargetId } = useLiveWriterTargets();
    const reportMarkdown = React.useMemo(() => buildDifferentialReportMarkdown(state), [state]);
    const { saveResult, saveState, saveError, lastSavedResult } = useLaboratoryResultPersistence({
        ready: Boolean((state.summary || state.analyticSolution) && !(state.error || state.solveErrorMessage)),
        moduleSlug: module.slug,
        moduleTitle: module.title,
        mode: state.mode,
        buildTitle: () => `Differential report: ${state.mode}`,
        buildSummary: () => state.analyticSolution?.exact.method_label ?? state.classification.label,
        buildReportMarkdown: () => reportMarkdown,
        buildStructuredPayload: (targetId) => buildDifferentialLivePayload(state, targetId),
        buildInputSnapshot: () => ({
            mode: state.mode,
            expression: state.expression,
            variable: state.variable,
            point: state.point,
            order: state.order,
            direction: state.direction,
            coordinates: state.coordinates,
        }),
        buildMetadata: () => ({
            sourceLabel: "Differential Studio",
            classification: state.classification.label,
            solvePhase: state.solvePhase,
        }),
    });
    const { copyMarkdownExport, sendToWriter, sendToNotebook, pushLiveResult } = useLaboratoryWriterBridge({
        ready: Boolean((state.summary || state.analyticSolution) && !(state.error || state.solveErrorMessage)),
        sourceLabel: "Differential Studio",
        liveTargets,
        selectedLiveTargetId,
        setExportState,
        buildMarkdown: () => reportMarkdown,
        buildBlock: (targetId) => buildDifferentialLivePayload(state, targetId),
        publicationProfile,
        getSavedResultMeta: () => ({ id: lastSavedResult?.id ?? null, revision: lastSavedResult?.revision ?? null, scientificObjectId: typeof lastSavedResult?.metadata?.scientific_object_id === "string" ? lastSavedResult.metadata.scientific_object_id : null }),
        getDraftMeta: () => ({
            title: "Differential Analysis",
            abstract: "Exported from Differential Studio.",
            keywords: `${state.mode},differential`,
        }),
    });

    const applyPreset = (preset: DifferentialTemplatePreset) => {
        actions.setMode(preset.mode);
        actions.setExpression(preset.expr);
        actions.setVariable(preset.variable ?? "");
        actions.setPoint(preset.point ?? "");
        actions.setOrder(preset.order ?? "1");
        actions.setDirection(preset.direction ?? "");
        setActivePresetLabel(preset.label);
    };

    const warningSignals = React.useMemo<DifferentialValidationSignal[]>(() => {
        const signals: DifferentialValidationSignal[] = [];
        if (error || solveErrorMessage) {
            signals.push({
                field: "solver",
                tone: "warn",
                label: "Solver Alert",
                text: error || solveErrorMessage,
                blocking: false,
            });
        }
        signals.push(...buildAdvancedLaneSignals(state));
        return signals;
    }, [error, solveErrorMessage, state]);

    const visibleSignals = React.useMemo(() => [...warningSignals], [warningSignals]);

    // Keep this file as a thin orchestration shell.
    // Future work should stay inside tab views/services so new differential lanes
    // can be added without turning the module entrypoint into another monolith.
    const renderedTab = React.useMemo(() => {
        switch (activeTab) {
            case "solve":
                return (
                    <SolveView
                        state={state}
                        actions={actions}
                        visibleSignals={visibleSignals}
                    />
                );
            case "code":
                return (
                    <CodeView
                        analyticSolution={state.analyticSolution}
                        mode={state.mode}
                        expression={state.expression}
                        variable={state.variable}
                        point={state.point}
                        order={state.order}
                        direction={state.direction}
                    />
                );
            case "visualize":
                return (
                    <VisualizeView
                        state={state}
                    />
                );
            case "compare":
                return (
                    <CompareView
                        state={state}
                    />
                );
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
    }, [activeTab, actions, copyMarkdownExport, liveTargets, publicationProfile, pushLiveResult, saveError, saveResult, saveState, selectedLiveTargetId, sendToNotebook, sendToWriter, setSelectedLiveTargetId, state, visibleSignals, lastSavedResult?.title]);

    return (
        <div className="flex grow flex-col overflow-hidden rounded-3xl border border-border/40 bg-background/50">
            <StudioHeaderBar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                availableTabs={["solve", "code", "visualize", "compare", "report"]}
                tabs={[
                    { id: "solve", label: "Solve" },
                    { id: "code", label: "Code" },
                    { id: "visualize", label: "Visualize" },
                    { id: "compare", label: "Compare" },
                    { id: "report", label: "Report" },
                ]}
                templatesOpen={templatesOpen}
                setTemplatesOpen={setTemplatesOpen}
                experienceLevel={experienceLevel}
                setExperienceLevel={setExperienceLevel}
                workflowTemplates={DIFFERENTIAL_WORKFLOW_TEMPLATES}
                activeTemplateId={activeTemplateId}
                applyWorkflowTemplate={(templateId) => {
                    const template = DIFFERENTIAL_WORKFLOW_TEMPLATES.find((item) => item.id === templateId);
                    if (!template) {
                        return;
                    }
                    setActiveTemplateId(template.id);
                    applyPreset(template);
                }}
                presets={DIFFERENTIAL_PRESETS}
                activePresetLabel={activePresetLabel}
                applyPreset={applyPreset}
            />
            
            <div className="flex-1 overflow-hidden">
                <div className="h-full overflow-y-auto px-4 py-4 lg:px-6">
                    {renderedTab}
                </div>
            </div>

            <StudioStatusBar
                solvePhase={solvePhase}
                isResultStale={isResultStale}
            />
        </div>
    );
}
