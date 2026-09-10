import { LaboratoryReportLayout } from "@/components/laboratory/laboratory-report-layout";
import type { WriterBridgePublicationProfile } from "@/lib/live-writer-bridge";
import type { MatrixStudioState } from "../types";

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
    state: MatrixStudioState;
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
    const reportSkeletonMarkdown = `# Matrix Studio Report

mode: ${state.mode}
dimension: ${state.dimension}
determinant: ${state.summary.determinant ?? "pending"}
trace: ${state.summary.trace ?? "pending"}
rank: ${state.summary.rank ?? "pending"}
method: ${state.analyticSolution?.exact.method_label ?? "pending"}
contract: ${state.analyticSolution?.diagnostics.contract?.status ?? "pending"}
readiness: ${state.analyticSolution?.diagnostics.contract?.readiness_label ?? "pending"}
risk_level: ${state.analyticSolution?.diagnostics.contract?.risk_level ?? "pending"}
condition_number: ${state.summary.conditionNumber ?? "pending"}
diagonalizable: ${state.summary.diagonalizable == null ? "pending" : state.summary.diagonalizable ? "yes" : "no"}
spectral_radius: ${state.summary.spectralRadius ?? "pending"}
residual_norm: ${state.summary.residualNorm ?? "pending"}
decomposition: ${state.summary.decompositionSummary ?? "pending"}
solver_kind: ${state.summary.solverKind ?? "pending"}
stability: ${state.summary.stabilitySummary ?? "pending"}
least_squares: ${state.summary.leastSquaresSummary ?? "pending"}
iterative: ${state.summary.iterativeSummary ?? "pending"}
factor_audit: ${state.summary.factorAuditSummary ?? "pending"}
svd: ${state.summary.svdSummary ?? "pending"}
sparse: ${state.summary.sparseSummary ?? "pending"}
tensor_shape: ${state.summary.tensorShape ?? "pending"}
mode_ranks: ${state.summary.modeRanks?.join(", ") ?? "pending"}
tensor_product: ${state.summary.tensorProductSummary ?? "pending"}
tucker: ${state.summary.tuckerSummary ?? "pending"}
cp_probe: ${state.summary.cpSummary ?? "pending"}
tensor_eigen: ${state.summary.tensorEigenSummary ?? "pending"}

## planned sections
- matrix/tensor family and dimension snapshot
- structural audit and conditioning interpretation
- decomposition or contraction lane notes
- sparse profile and solver roadmap
- review notes: ${(state.analyticSolution?.diagnostics.contract?.review_notes ?? []).join(" | ") || "none"}`;

    const executiveCards = [
        { eyebrow: "Mode", value: state.mode, detail: "Active matrix family", tone: "neutral" as const },
        { eyebrow: "Shape", value: state.summary.shape ?? "pending", detail: "Matrix / tensor shape", tone: "info" as const },
        { eyebrow: "Method", value: state.analyticSolution?.exact.method_label ?? "client fallback", detail: "Primary solve lane", tone: "success" as const },
        { eyebrow: "Readiness", value: state.analyticSolution?.diagnostics.contract?.readiness_label ?? "pending", detail: "Solver contract", tone: "info" as const },
    ];

    const supportCards = [
        { eyebrow: "Determinant", value: state.summary.determinant ?? "pending", detail: "Volume / invertibility cue", tone: "info" as const },
        { eyebrow: "Rank", value: state.summary.rank ?? "pending", detail: "Structural rank audit", tone: "neutral" as const },
        { eyebrow: "Condition", value: state.summary.conditionNumber ?? "pending", detail: state.summary.stabilitySummary ?? "Sensitivity signal", tone: "warn" as const },
        { eyebrow: "Spectrum", value: state.summary.spectralRadius ?? "pending", detail: "Dominant eigen-scale", tone: "success" as const },
        { eyebrow: "Risk", value: state.analyticSolution?.diagnostics.contract?.risk_level ?? "pending", detail: state.analyticSolution?.diagnostics.contract?.status ?? "Contract state", tone: "info" as const },
    ];

    const readinessCards = [
        { eyebrow: "Notes", value: String(state.reportNotes.length), detail: "Exportable report notes", tone: "info" as const },
        { eyebrow: "Trace", value: state.analyticSolution?.exact.steps?.length ? String(state.analyticSolution.exact.steps.length) : "0", detail: state.summary.factorAuditSummary ?? "Available derivation steps", tone: "neutral" as const },
        { eyebrow: "Live", value: liveTargets.length ? "Ready" : "Waiting", detail: liveTargets.length ? "Writer target available" : "Open Writer to publish live", tone: liveTargets.length ? "success" as const : "warn" as const },
        { eyebrow: "State", value: state.solveErrorMessage ? "Review" : "Ready", detail: state.solveErrorMessage ?? "Report packet can be exported", tone: state.solveErrorMessage ? "warn" as const : "success" as const },
        { eyebrow: "Hazards", value: String(state.analyticSolution?.diagnostics.contract?.hazard_count ?? 0), detail: "Contract review pressure", tone: "neutral" as const },
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
