import { LaboratoryReportLayout } from "@/components/laboratory/laboratory-report-layout";
import { AnnotationPanel } from "../components/annotation-panel";
import type { WriterBridgePublicationProfile } from "@/lib/live-writer-bridge";
import type { SeriesLimitStudioState } from "../types";

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
    state: SeriesLimitStudioState;
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
    const reportBody = `# Series / Limit Research Report

## Problem Statement
- mode: ${state.mode}
- expression: ${state.expression}
- auxiliary: ${state.auxiliaryExpression || "none"}
- dimension: ${state.dimension}

## Classification
- family: ${state.summary.detectedFamily ?? "pending"}
- shape: ${state.summary.shape ?? "pending"}
- asymptotic class: ${state.summary.asymptoticClass ?? "pending"}
- dominant term: ${state.summary.dominantTerm ?? "pending"}

## Main Result
- final: ${state.analyticSolution?.exact.result_latex ?? state.result.finalFormula ?? "pending"}
- convergence: ${state.summary.convergenceSignal ?? state.summary.radiusSignal ?? "pending"}
- partial sum signal: ${state.summary.partialSumSignal ?? "pending"}
- interval signal: ${state.summary.intervalSignal ?? state.summary.asymptoticSignal ?? "pending"}
- error bound: ${state.summary.errorBoundSignal ?? "pending"}
- special family: ${state.summary.specialFamilySignal ?? "pending"}

## Proof Architecture
- primary test: ${state.summary.testFamily ?? "pending"}
- secondary test: ${state.summary.secondaryTestFamily ?? "pending"}
- proof signal: ${state.summary.proofSignal ?? "pending"}
- comparison signal: ${state.summary.comparisonSignal ?? "pending"}

## Endpoint / Tail Audit
- endpoint signal: ${state.summary.endpointSignal ?? "pending"}
- endpoint details: ${(state.summary.endpointDetails ?? ["pending"]).join(" | ")}
- monotonicity: ${state.summary.monotonicity ?? "pending"}
- boundedness: ${state.summary.boundedness ?? "pending"}

## Diagnostics
- expansion: ${state.summary.expansionSignal ?? "pending"}
- risk: ${state.summary.riskSignal ?? "pending"}
- method: ${state.analyticSolution?.exact.method_label ?? "client-side preview"}
- readiness: ${state.contractSummary.readinessLabel}
- contract: ${state.contractSummary.status}
- contract risk: ${state.contractSummary.riskLevel}
- benchmark: ${state.benchmarkSummary ? `${state.benchmarkSummary.label} -> ${state.benchmarkSummary.status}` : "n/a"}
- review notes: ${state.contractSummary.reviewNotes.join(" | ") || "none"}`;

    const abstractText =
        state.mode === "limits"
            ? `${state.summary.detectedFamily ?? "This limit"} was analyzed through ${state.summary.specialFamilySignal ?? "a symbolic"} lane. The current limit is ${state.analyticSolution?.exact.result_latex ?? state.result.finalFormula ?? "pending"}, with local risk signal ${state.summary.riskSignal ?? "pending"} and error proxy ${state.summary.errorBoundSignal ?? "pending"}.`
            : `${state.summary.detectedFamily ?? "This lane"} was analyzed in ${state.mode} mode. The current result is ${state.analyticSolution?.exact.result_latex ?? state.result.finalFormula ?? "pending"}, supported by ${state.summary.testFamily ?? "pending"} with ${state.summary.secondaryTestFamily ?? "pending"} as a backup lane. Risk remains ${state.summary.riskSignal ?? "pending"}.`;

    const executiveCards = [
        { eyebrow: "Mode", value: state.mode, detail: "Active series / limit lane", tone: "neutral" as const },
        { eyebrow: "Family", value: state.summary.detectedFamily ?? "pending", detail: "Detected research family", tone: "info" as const },
        { eyebrow: "Result", value: state.analyticSolution?.exact.result_latex ?? state.result.finalFormula ?? "pending", detail: "Primary report result", tone: "success" as const },
        { eyebrow: "Readiness", value: state.contractSummary.readinessLabel, detail: "Series / limit contract", tone: "info" as const },
    ];

    const supportCards = [
        { eyebrow: "Proof", value: state.summary.proofSignal ?? "pending", detail: "Proof architecture status", tone: "info" as const },
        { eyebrow: "Error Bound", value: state.summary.errorBoundSignal ?? "pending", detail: "Tail / approximation control", tone: "warn" as const },
        { eyebrow: "Endpoint", value: state.summary.endpointSignal ?? "pending", detail: "Boundary audit state", tone: "neutral" as const },
        { eyebrow: "Method", value: state.analyticSolution?.exact.method_label ?? "client preview", detail: "Primary symbolic lane", tone: "success" as const },
        { eyebrow: "Contract Risk", value: state.contractSummary.riskLevel, detail: state.contractSummary.status, tone: "warn" as const },
    ];

    const readinessCards = [
        { eyebrow: "Notes", value: String(state.reportNotes.length), detail: "Prepared report notes", tone: "info" as const },
        { eyebrow: "Annotations", value: String(state.annotationPanelProps.state.annotations.length), detail: "Saved research notes", tone: "neutral" as const },
        { eyebrow: "Live", value: liveTargets.length ? "Ready" : "Waiting", detail: liveTargets.length ? "Writer target available" : "Open Writer to publish live", tone: liveTargets.length ? "success" as const : "warn" as const },
        { eyebrow: "State", value: state.solveErrorMessage ? "Review" : "Ready", detail: state.solveErrorMessage ?? "Report packet can be exported", tone: state.solveErrorMessage ? "warn" as const : "success" as const },
        { eyebrow: "Benchmark", value: state.benchmarkSummary?.status ?? "n/a", detail: state.benchmarkSummary?.label ?? "No canonical benchmark matched", tone: "neutral" as const },
    ];

    return (
        <LaboratoryReportLayout
            executiveCards={executiveCards}
            supportCards={supportCards}
            readinessCards={readinessCards}
            reportMarkdown={reportBody}
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
            annotationNode={<AnnotationPanel {...state.annotationPanelProps} />}
            summaryNode={
                <div className="rounded-3xl border border-border/50 bg-background p-5 shadow-sm">
                    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">Submission Abstract</div>
                    <div className="mt-4 rounded-2xl border border-border/60 bg-muted/10 p-4 text-sm leading-7 text-foreground">
                        {abstractText}
                    </div>
                </div>
            }
        />
    );
}
