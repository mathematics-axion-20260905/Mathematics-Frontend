import React from "react";

import { LaboratoryReportLayout } from "@/components/laboratory/laboratory-report-layout";
import { AnnotationPanel } from "../components/annotation-panel";
import type { WriterBridgePublicationProfile } from "@/lib/live-writer-bridge";
import type {
    DifferentialAnalyticSolveResponse,
    DifferentialBenchmarkSummary,
    DifferentialComputationSummary,
    DifferentialMetricCard,
} from "../types";

interface ReportViewState {
    reportExecutiveCards?: DifferentialMetricCard[];
    reportSupportCards?: DifferentialMetricCard[];
    annotationPanelProps: React.ComponentProps<typeof AnnotationPanel>;
    expression: string;
    variable: string;
    point: string;
    summary: DifferentialComputationSummary | null;
    mode: string;
    analyticSolution: DifferentialAnalyticSolveResponse | null;
    benchmarkSummary?: DifferentialBenchmarkSummary | null;
}

type LiveTarget = {
    id: string;
    title: string;
};

function describePrimaryMetric(summary: DifferentialComputationSummary | null): string {
    if (!summary) return "Pending solve";
    if (summary.type === "ode") return `y(T) = ${summary.valueAtPoint.toFixed(6)}`;
    if (summary.type === "pde") return `${summary.family} profile`;
    if (summary.type === "sde") return `E[X(T)] = ${summary.terminalMean.toFixed(6)}`;
    if ("matrix" in summary) {
        return summary.type === "jacobian"
            ? `Jacobian ${summary.size.rows}x${summary.size.cols}`
            : `Hessian ${summary.size}x${summary.size}`;
    }
    if (summary.type === "gradient") return `|grad f| = ${summary.magnitude.toFixed(6)}`;
    if (summary.type === "directional") return `D_u f = ${summary.directionalDerivative.toFixed(6)}`;
    if (summary.type === "higher_order") return `Taylor order ${summary.maxOrder}`;
    if ("tangentLine" in summary) return `Slope = ${summary.tangentLine.slope.toFixed(6)}`;
    return `Rate = ${summary.partialAtPoint.toFixed(6)}`;
}

function describeAnalyticLaneResult(mode: string, analyticSolution: DifferentialAnalyticSolveResponse | null): string[] {
    if (!analyticSolution) return ["- Result pending"];
    if (mode === "ode" || mode === "pde" || mode === "sde") {
        return [
            `- Method: \`${analyticSolution.exact?.method_label ?? "specialized"}\``,
            `- Exact / primary form: \`${analyticSolution.exact?.derivative_latex ?? "n/a"}\``,
            `- Evaluated note: \`${analyticSolution.exact?.evaluated_latex ?? "n/a"}\``,
            `- Numeric approximation: \`${analyticSolution.exact?.numeric_approximation ?? "n/a"}\``,
        ];
    }
    return ["- Result pending"];
}

function describeResultBlock(summary: DifferentialComputationSummary | null): string[] {
    if (!summary) return ["- Result pending"];
    if (summary.type === "ode") {
        return [
            `- Terminal state: \`${summary.valueAtPoint.toFixed(6)}\``,
            `- Equilibria: \`${summary.equilibriumPoints.map((value) => value.toFixed(3)).join(", ") || "none"}\``,
            `- Stability: \`${summary.stabilityLabel}\``,
        ];
    }
    if (summary.type === "pde") {
        return [
            `- Family: \`${summary.family}\``,
            `- Grid: \`${summary.grid.nx}x${summary.grid.nt}\``,
            `- Stability ratio: \`${summary.stabilityRatio.toFixed(6)}\``,
        ];
    }
    if (summary.type === "sde") {
        return [
            `- Paths: \`${summary.pathCount}\``,
            `- Terminal mean: \`${summary.terminalMean.toFixed(6)}\``,
            `- Terminal std: \`${summary.terminalStd.toFixed(6)}\``,
        ];
    }
    if ("matrix" in summary) {
        return summary.matrix.map((row, index) => `- Row ${index + 1}: [${row.map((value) => value.toFixed(5)).join(", ")}]`);
    }
    if (summary.type === "gradient") {
        return [
            `- f(point): \`${summary.valueAtPoint.toFixed(6)}\``,
            `- Gradient: \`[${summary.gradient.map((value) => value.toFixed(5)).join(", ")}]\``,
            `- Magnitude: \`${summary.magnitude.toFixed(6)}\``,
        ];
    }
    if (summary.type === "directional") {
        return [
            `- f(point): \`${summary.valueAtPoint.toFixed(6)}\``,
            `- Gradient: \`[${summary.gradient.map((value) => value.toFixed(5)).join(", ")}]\``,
            `- Unit direction: \`[${summary.unitDirection.map((value) => value.toFixed(5)).join(", ")}]\``,
            `- Directional derivative: \`${summary.directionalDerivative.toFixed(6)}\``,
        ];
    }
    if (summary.type === "higher_order") {
        return summary.derivatives.map((value, index) => `- Order ${index}: \`${value.toFixed(6)}\``);
    }
    if ("tangentLine" in summary) {
        return [
            `- f(point): \`${summary.valueAtPoint.toFixed(6)}\``,
            `- Derivative: \`${summary.derivativeAtPoint.toFixed(6)}\``,
            `- Tangent line: \`${summary.tangentLine.latex}\``,
        ];
    }
    return [
        `- f(point): \`${summary.valueAtPoint.toFixed(6)}\``,
        `- Partial: \`${summary.partialAtPoint.toFixed(6)}\``,
        `- Variable: \`${summary.variable}\``,
    ];
}

function describeVerificationCertificate(
    analyticSolution: DifferentialAnalyticSolveResponse | null,
    benchmarkSummary: DifferentialBenchmarkSummary | null,
): string[] {
    const contract = analyticSolution?.diagnostics?.contract;
    const checks = contract?.checks ?? [];
    return [
        `- **Contract status:** \`${contract?.status ?? "n/a"}\``,
        `- **Readiness:** \`${contract?.readiness_label ?? "n/a"}\``,
        `- **Risk level:** \`${contract?.risk_level ?? "n/a"}\``,
        `- **Checks passed:** \`${checks.filter((item) => item.status === "ok").length}/${checks.length || 0}\``,
        `- **Benchmark:** \`${benchmarkSummary ? `${benchmarkSummary.label} -> ${benchmarkSummary.status}` : "n/a"}\``,
        `- **Benchmark error:** \`${benchmarkSummary?.absoluteError != null ? benchmarkSummary.absoluteError.toExponential(2) : "n/a"}\``,
    ];
}

export function ReportView({
    state,
    copyMarkdownExport,
    saveResult,
    saveState,
    saveError,
    lastSavedResultTitle,
    sendToWriter,
    sendToNotebook,
    pushLiveResult,
    liveTargets,
    selectedLiveTargetId,
    setSelectedLiveTargetId,
    publicationProfile,
    setPublicationProfile,
}: {
    state: ReportViewState;
    copyMarkdownExport: () => void;
    saveResult: () => void | Promise<unknown>;
    saveState: "idle" | "saving" | "saved" | "error";
    saveError: string | null;
    lastSavedResultTitle: string | null;
    sendToWriter: () => void;
    sendToNotebook: () => void;
    pushLiveResult: () => void;
    liveTargets: LiveTarget[];
    selectedLiveTargetId: string | null;
    setSelectedLiveTargetId: (id: string) => void;
    publicationProfile: WriterBridgePublicationProfile;
    setPublicationProfile: (profile: WriterBridgePublicationProfile) => void;
}) {
    const {
        reportExecutiveCards = [],
        reportSupportCards = [],
        annotationPanelProps,
        expression,
        variable,
        point,
        summary,
        mode,
        analyticSolution,
        benchmarkSummary = null,
    } = state;

    const taxonomyFamily = analyticSolution?.diagnostics?.taxonomy?.family ?? summary?.type ?? "pending";
    const domainNotes = analyticSolution?.diagnostics?.domain_analysis?.constraints ?? [];
    const matrixDiagnostics = analyticSolution?.diagnostics?.matrix;

    const reportSkeletonMarkdown = `
# Differential Evaluation Report

### Analysis Parameters
- **Formula:** \`${expression}\`
- **Mode:** \`${mode}\`
- **Variable focus:** ${variable}
- **Evaluation Point:** ${point}

### Core Results
- **Primary Metric:** \`${describePrimaryMetric(summary)}\`
${summary ? describeResultBlock(summary).join("\n") : describeAnalyticLaneResult(mode, analyticSolution).join("\n")}

### Symbolic Taxonomy
- **Family:** \`${taxonomyFamily}\`
- **Lane:** \`${analyticSolution?.diagnostics?.taxonomy?.lane ?? mode}\`
- **Tags:** \`${(analyticSolution?.diagnostics?.taxonomy?.tags ?? []).join(", ") || "n/a"}\`
- **Summary:** ${analyticSolution?.diagnostics?.taxonomy?.summary ?? "No taxonomy note"}
${analyticSolution?.exact?.method_label ? `- **Method label:** \`${analyticSolution.exact.method_label}\`` : ""}

### Domain And Diagnostics
- **Continuity:** \`${analyticSolution?.diagnostics?.continuity ?? "pending"}\`
- **Differentiability:** \`${analyticSolution?.diagnostics?.differentiability ?? "pending"}\`
- **Constraints:** \`${domainNotes.length}\`
${domainNotes.map((item) => `- ${item.label}: ${item.detail}`).join("\n")}
${matrixDiagnostics ? `- **Matrix status:** \`${matrixDiagnostics.determinant_status ?? "n/a"}\`` : ""}
${matrixDiagnostics?.critical_point_type ? `- **Critical point type:** ${matrixDiagnostics.critical_point_type}` : ""}
${analyticSolution?.diagnostics?.contract ? `- **Contract status:** \`${analyticSolution.diagnostics.contract.status}\`\n- **Contract completeness:** \`${analyticSolution.diagnostics.contract.completeness ?? "n/a"}\`\n- **Readiness:** \`${analyticSolution.diagnostics.contract.readiness_label ?? "n/a"}\`\n- **Risk level:** \`${analyticSolution.diagnostics.contract.risk_level ?? "n/a"}\`` : ""}
${analyticSolution?.diagnostics?.contract?.review_notes?.length ? analyticSolution.diagnostics.contract.review_notes.map((item) => `- ${item}`).join("\n") : ""}
${benchmarkSummary ? `- **Benchmark:** \`${benchmarkSummary.label}\`\n- **Benchmark status:** \`${benchmarkSummary.status}\`\n- **Expected vs actual:** \`${benchmarkSummary.expectedValue}\` vs \`${benchmarkSummary.actualValue}\`` : ""}
${mode === "sde" ? "- **Stochastic note:** single seeded path; ensemble statistics hali chiqarilmagan." : ""}

### Verification Certificate
${describeVerificationCertificate(analyticSolution, benchmarkSummary).join("\n")}

_Autogenerated by MathSphere Laboratory._
`.trim();

    const reportReadinessCards = [
        { eyebrow: "Markdown", value: `${reportSkeletonMarkdown.length} chars`, detail: "Content density", tone: "info" as const },
        { eyebrow: "Variables", value: String(variable.split(",").map((entry) => entry.trim()).filter(Boolean).length || 1), detail: "Observed spaces", tone: "neutral" as const },
        { eyebrow: "Result Type", value: summary?.type ?? "pending", detail: "Active report lane", tone: "success" as const },
        { eyebrow: "Taxonomy", value: taxonomyFamily, detail: "Symbolic family", tone: "info" as const },
        { eyebrow: "Certificate", value: analyticSolution?.diagnostics?.contract?.status ?? "n/a", detail: benchmarkSummary?.status ?? "benchmark n/a", tone: benchmarkSummary?.status === "verified" ? "success" as const : "neutral" as const },
    ];

    return (
        <LaboratoryReportLayout
            executiveCards={reportExecutiveCards}
            supportCards={reportSupportCards}
            readinessCards={reportReadinessCards}
            reportMarkdown={reportSkeletonMarkdown}
            publicationProfile={publicationProfile}
            setPublicationProfile={setPublicationProfile}
            copyMarkdownExport={copyMarkdownExport}
            saveResult={saveResult}
            saveState={saveState}
            saveError={saveError}
            lastSavedResultTitle={lastSavedResultTitle}
            sendToWriter={sendToWriter}
            sendToNotebook={sendToNotebook}
            pushLiveResult={pushLiveResult}
            liveTargets={liveTargets}
            selectedLiveTargetId={selectedLiveTargetId}
            setSelectedLiveTargetId={setSelectedLiveTargetId}
            annotationNode={<AnnotationPanel {...annotationPanelProps} />}
        />
    );
}
