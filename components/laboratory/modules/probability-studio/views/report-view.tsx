import { LaboratoryReportLayout } from "@/components/laboratory/laboratory-report-layout";
import type { WriterBridgePublicationProfile } from "@/lib/live-writer-bridge";
import type { ProbabilityStudioState } from "../types";

type LiveTarget = {
    id: string;
    title: string;
};

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
    state: ProbabilityStudioState;
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
    const verificationLines = [
        `- contract status: ${state.contractSummary.status}`,
        `- readiness: ${state.contractSummary.readinessLabel}`,
        `- risk level: ${state.contractSummary.riskLevel}`,
        `- checks passed: ${state.contractSummary.checks.filter((item) => item.status === "ok").length}/${state.contractSummary.checks.length}`,
        `- benchmark error: ${state.benchmarkSummary?.absoluteError != null ? state.benchmarkSummary.absoluteError.toExponential(2) : "n/a"}`,
    ];

    const reportSkeletonMarkdown = `# Probability Report
- mode: ${state.mode}
- dimension: ${state.dimension}
- sample size: ${state.summary.sampleSize ?? "pending"}
- method: ${state.analyticSolution?.exact.method_label ?? "client fallback"}
- final: ${state.analyticSolution?.exact.result_latex ?? state.result.finalFormula ?? "pending"}
- auxiliary: ${state.analyticSolution?.exact.auxiliary_latex ?? state.result.auxiliaryFormula ?? "pending"}
- risk: ${state.summary.riskSignal ?? "pending"}
- contract: ${state.contractSummary.status}
- readiness: ${state.contractSummary.readinessLabel}
- contract risk: ${state.contractSummary.riskLevel}
- family: ${state.contractSummary.family}
- primary diagnostic: ${state.summary.testStatistic ?? state.summary.power ?? state.summary.residualSignal ?? state.summary.posteriorPredictive ?? state.summary.pcaSignal ?? state.summary.acfSignal ?? state.summary.bootstrapSignal ?? "pending"}
- secondary diagnostic: ${state.summary.intervalSignal ?? state.summary.forecastInterval ?? state.summary.explainedVariance ?? state.summary.convergenceSignal ?? "pending"}
- benchmark: ${state.benchmarkSummary ? `${state.benchmarkSummary.label} -> ${state.benchmarkSummary.status}` : "n/a"}
- review notes: ${state.contractSummary.reviewNotes.join(" | ") || "none"}

## Verification Certificate
${verificationLines.join("\n")}`;

    const executiveCards = [
        { eyebrow: "Mode", value: state.mode, detail: "Active probability lane", tone: "neutral" as const },
        { eyebrow: "Sample", value: state.summary.sampleSize ?? "pending", detail: "Observed sample scale", tone: "info" as const },
        { eyebrow: "Method", value: state.analyticSolution?.exact.method_label ?? "client fallback", detail: "Primary report lane", tone: "success" as const },
        { eyebrow: "Readiness", value: state.contractSummary.readinessLabel, detail: "Probability contract", tone: "info" as const },
    ];

    const supportCards = [
        { eyebrow: "Risk", value: state.summary.riskSignal ?? "pending", detail: "Primary caution signal", tone: "warn" as const },
        { eyebrow: "Statistic", value: state.summary.testStatistic ?? state.summary.pValue ?? "pending", detail: "Inference / test output", tone: "info" as const },
        { eyebrow: "Forecast", value: state.summary.forecast ?? state.summary.posteriorPredictive ?? "pending", detail: "Forward-looking signal", tone: "neutral" as const },
        { eyebrow: "Band", value: state.summary.intervalSignal ?? state.summary.forecastInterval ?? state.summary.confidenceInterval ?? "pending", detail: "Interval / uncertainty signal", tone: "info" as const },
        { eyebrow: "Shape", value: state.summary.shape ?? state.summary.distributionFamily ?? "pending", detail: "Distribution / dataset profile", tone: "success" as const },
        { eyebrow: "Contract Risk", value: state.contractSummary.riskLevel, detail: state.contractSummary.status, tone: "warn" as const },
    ];

    const readinessCards = [
        { eyebrow: "Notes", value: String(state.reportNotes.length), detail: "Prepared report notes", tone: "info" as const },
        { eyebrow: "Steps", value: state.analyticSolution?.exact.steps?.length ? String(state.analyticSolution.exact.steps.length) : String(state.result.steps.length), detail: "Available method trace", tone: "neutral" as const },
        { eyebrow: "Live", value: liveTargets.length ? "Ready" : "Waiting", detail: liveTargets.length ? "Writer target available" : "Open Writer to publish live", tone: liveTargets.length ? "success" as const : "warn" as const },
        { eyebrow: "State", value: state.solveErrorMessage ? "Review" : "Ready", detail: state.solveErrorMessage ?? "Report packet can be exported", tone: state.solveErrorMessage ? "warn" as const : "success" as const },
        { eyebrow: "Benchmark", value: state.benchmarkSummary?.status ?? "n/a", detail: state.benchmarkSummary?.label ?? "No canonical benchmark matched", tone: "neutral" as const },
        { eyebrow: "Certificate", value: state.contractSummary.status, detail: state.benchmarkSummary?.absoluteError != null ? `error ${state.benchmarkSummary.absoluteError.toExponential(2)}` : "benchmark pending", tone: state.benchmarkSummary?.status === "verified" ? "success" as const : "neutral" as const },
    ];

    return (
        <LaboratoryReportLayout
            executiveCards={executiveCards}
            supportCards={supportCards}
            readinessCards={readinessCards}
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
        />
    );
}
