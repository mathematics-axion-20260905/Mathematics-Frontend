import React from "react";
import { Activity, Trash2, Zap } from "lucide-react";

import { LaboratoryModuleMeta } from "@/lib/laboratory";
import type { LaboratorySignal } from "@/components/laboratory/laboratory-signal-panel";
import type { ReportGeneratorFormat } from "@/components/laboratory/laboratory-report-layout";
import { useLaboratoryWriterBridge } from "@/components/live-writer-bridge/use-laboratory-writer-bridge";
import { useLaboratoryResultPersistence } from "@/components/laboratory/use-laboratory-result-persistence";
import type { WriterBridgePublicationProfile } from "@/lib/live-writer-bridge";
import { verifyIntegralCertificate, type VerificationCertificate } from "@/lib/laboratory-verification";
import { useLocale } from "@/components/locale-provider";
import { LaboratoryFormattingService } from "@/components/laboratory/services/formatting-service";

import { useIntegralStudio } from "./integral-studio/use-integral-studio";
import type { IntegralComputationSummary } from "./integral-studio/types";
import {
    exportGuides,
    workspaceTabs,
    INTEGRAL_PRESETS,
    INTEGRAL_WORKFLOW_TEMPLATES,
} from "./integral-studio/constants";
import {
    buildExactSolutionMarkdown,
    buildExactMethodMarkdown,
    buildNumericalPromptMarkdown,
    buildIntegralLivePayload,
    evaluateIntegralBenchmark,
} from "./integral-studio/utils";

import {
    buildTaxonomyLaneGuidance,
    buildResultConsoleData,
    buildWorkflowReadinessCards,
    buildSolveOverviewCards,
    buildAnalyticStatusCard,
    buildAssumptionsMarkdown,
    buildMethodAuditMarkdown,
    buildAssumptionCards,
    buildMethodAuditCards,
    buildVerificationLayerCards,
    buildVisualizeOverviewCards,
    buildMethodTableRows,
    buildSampleTableRows,
    buildSweepTableRows,
    buildResultLevelCards,
    buildCompareOverviewCards,
    buildRiskRegisterCards,
    buildReportSkeletonMarkdown,
    buildReportExecutiveCards,
    buildReportSupportCards,
    buildReportReadinessCards,
    buildStatusBarCards,
} from "./integral-studio/services/presentation-service";

// Local Components
import { SolverControl } from "./integral-studio/components/solver-control";
import { VisualizerDeck } from "./integral-studio/components/visualizer-deck";
import { TrustPanel } from "./integral-studio/components/trust-panel";
import { AnnotationPanel } from "./integral-studio/components/annotation-panel";
import { ScenarioPanel } from "./integral-studio/components/scenario-panel";
import { StudioHeaderBar } from "./integral-studio/components/studio-header-bar";
import { StudioStatusBar } from "./integral-studio/components/studio-status-bar";
import { CompareView } from "./integral-studio/views/compare-view";
import { CodeView } from "./integral-studio/views/code-view";
import { ReportView } from "./integral-studio/views/report-view";
import { SolveView } from "./integral-studio/views/solve-view";
import { VisualizeView } from "./integral-studio/views/visualize-view";

export function IntegralStudioModule({ module }: { module: LaboratoryModuleMeta }) {
    const { locale } = useLocale();
    const isUz = locale === "uz";
    const { state, actions } = useIntegralStudio(module);
    const {
        mode,
        experienceLevel, setExperienceLevel,
        activeTab, setActiveTab,
        expression,
        lower,
        upper,
        xMin, xMax,
        yMin, yMax,
        zMin, zMax,
        sweepStart, setSweepStart,
        sweepEnd, setSweepEnd,
        activeTemplateId,
        annotations,
        savedExperiments,
        setExportState,
        guideMode, setGuideMode,
        solvePhase,
        solveErrorMessage,
        analyticSolution,
        solveMethod,
        setSolveMethod,
        normalizedSegments,
        normalizedXResolution,
        normalizedYResolution,
        normalizedZResolution,
        error,
        summary,
        inputValidationSignals,
        blockingValidationCount,
        classification,
        singleDiagnostics,
        doubleDiagnostics,
        tripleDiagnostics,
        sweepSeries,
        isResultStale,
        availableTabs,
        liveBridge,
    } = state;

    const {
        applyPreset,
        applyWorkflowTemplate,
        resetWorkspace,
    } = actions;

    const [templatesOpen, setTemplatesOpen] = React.useState(false);
    const [publicationProfile, setPublicationProfile] = React.useState<WriterBridgePublicationProfile>("summary");
    const [reportFormat, setReportFormat] = React.useState<ReportGeneratorFormat>("scientific-report");
    const [verificationCertificate, setVerificationCertificate] = React.useState<VerificationCertificate | null>(null);
    const [verificationState, setVerificationState] = React.useState<"idle" | "checking" | "ready" | "error">("idle");

    const solverWarning = Boolean(error || solveErrorMessage);

    const diagnosticsSnapshot = React.useMemo(() => {
        const diagnostics = analyticSolution?.diagnostics;
        return {
            diagnostics,
            domainConstraints: diagnostics?.domain_analysis?.constraints || [],
            domainAssumptions: diagnostics?.domain_analysis?.assumptions || [],
            domainBlockers: diagnostics?.domain_analysis?.blockers || [],
            hazardDetails: diagnostics?.hazard_details || [],
            piecewiseRegions: diagnostics?.piecewise?.regions || [],
            piecewiseSource: diagnostics?.piecewise?.source || "none",
            convergenceReason: diagnostics?.convergence_reason || "standard_finite_interval",
            research: diagnostics?.research || {
                exactness_tier: "pending",
                domain_risk_level: "medium",
                readiness_label: "pending",
                blocker_count: 0,
                hazard_count: 0,
                piecewise_active: false,
                special_function_signal: false,
                review_notes: [],
            },
        };
    }, [analyticSolution?.diagnostics]);

    const warningSignals = React.useMemo<LaboratorySignal[]>(() => {
        const signals: LaboratorySignal[] = [];
        if (solverWarning) {
            signals.push({ tone: "warn", label: "Solver Alert", text: error || solveErrorMessage });
        }
        if (analyticSolution?.diagnostics?.convergence === "divergent") {
            signals.push({ tone: "warn", label: "Divergence", text: analyticSolution.diagnostics.convergence_detail });
        }
        if (analyticSolution?.diagnostics?.convergence === "unresolved") {
            signals.push({ tone: "warn", label: "Convergence", text: analyticSolution.diagnostics.convergence_detail });
        }
        if (diagnosticsSnapshot.hazardDetails.length) {
            signals.push({ tone: "warn", label: diagnosticsSnapshot.hazardDetails[0].label, text: diagnosticsSnapshot.hazardDetails[0].detail });
        }
        if (diagnosticsSnapshot.research.domain_risk_level === "high") {
            signals.push({ tone: "warn", label: "Research risk", text: diagnosticsSnapshot.research.review_notes[0] || "High-risk symbolic audit requires review." });
        }
        if (diagnosticsSnapshot.piecewiseRegions.length) {
            signals.push({ tone: "info", label: "Piecewise", text: "Expression regionlarga bo'linadi, branch audit active." });
        }
        if (mode === "single" && summary) {
            const spread = singleDiagnostics?.relativeSpread || 0;
            if (spread > 0.08) signals.push({ tone: "warn", label: "Stability", text: "Method spread yuqori, segment sonini oshirish kerak." });
        }
        return signals;
    }, [analyticSolution, diagnosticsSnapshot, error, mode, singleDiagnostics?.relativeSpread, solveErrorMessage, solverWarning, summary]);

    const visibleSignals = React.useMemo(
        () => [...inputValidationSignals, ...warningSignals],
        [inputValidationSignals, warningSignals],
    );

    const solverStatusText =
        solvePhase === "analytic-loading"
            ? (isUz ? "Analitik yechim tekshirilmoqda" : "Checking analytical solution")
            : solvePhase === "exact-ready"
              ? (isUz ? "Analitik yechim tayyor" : "Analytical solution ready")
              : solvePhase === "needs-numerical"
                ? (isUz ? "Sonli hisoblashni tasdiqlash kutilmoqda" : "Awaiting numerical confirmation")
                : summary
                  ? (isUz ? "Sonli baho tayyor" : "Numerical estimate ready")
                  : solvePhase === "error"
                    ? (isUz ? "Yechuvchi ogohlantirishi" : "Solver warning")
                    : (isUz ? "Yechish kutilmoqda" : "Awaiting solve");

    const taxonomyLaneGuidance = React.useMemo(
        () => buildTaxonomyLaneGuidance(classification),
        [classification],
    );

    const resultConsoleData = React.useMemo(
        () =>
            buildResultConsoleData({
                analyticSolution,
                summary,
                mode,
                singleDiagnostics,
                solvePhase,
                solverStatusText,
                isUz,
                normalizedXResolution,
                normalizedYResolution,
                normalizedZResolution,
                warningCount: warningSignals.length,
            }),
        [analyticSolution, isUz, mode, normalizedXResolution, normalizedYResolution, normalizedZResolution, singleDiagnostics, solvePhase, solverStatusText, summary, warningSignals.length],
    );

    const solveOverviewCards = React.useMemo(
        () =>
            buildSolveOverviewCards({
                resultConsoleData,
                mode,
                summary,
                singleDiagnostics,
                normalizedXResolution,
                normalizedYResolution,
                normalizedZResolution,
                doubleDiagnostics,
                tripleDiagnostics,
            }),
        [doubleDiagnostics, mode, normalizedXResolution, normalizedYResolution, normalizedZResolution, resultConsoleData, singleDiagnostics, summary, tripleDiagnostics],
    );

    const analyticStatusCard = React.useMemo(
        () =>
            buildAnalyticStatusCard({
                classification,
                taxonomyLaneGuidance,
                analyticSolution,
                solvePhase,
                summary,
                mode,
                locale,
            }),
        [analyticSolution, classification, locale, mode, solvePhase, summary, taxonomyLaneGuidance],
    );

    const fallbackExactSteps = React.useMemo(() => {
        if (analyticSolution?.status !== "exact") return [];
        const derivedSteps = [];
        if (analyticSolution.exact.antiderivative_latex) {
            derivedSteps.push({
                title: "Antiderivative",
                summary: "Symbolic solver antiderivative topdi.",
                latex: analyticSolution.exact.antiderivative_latex,
                tone: "info" as const,
            });
        }
        if (analyticSolution.exact.definite_integral_latex) {
            derivedSteps.push({
                title: "Boundary substitution",
                summary: "Chegaralar qo'yilib definite integral ifodasi hosil qilindi.",
                latex: analyticSolution.exact.definite_integral_latex,
                tone: "success" as const,
            });
        }
        if (analyticSolution.exact.evaluated_latex) {
            derivedSteps.push({
                title: "Final evaluation",
                summary: analyticSolution.exact.numeric_approximation
                    ? `Yakuniy qiymat va yaqinlashgan sonli ko'rinish: ${analyticSolution.exact.numeric_approximation}`
                    : "Yakuniy exact natija olindi.",
                latex: analyticSolution.exact.evaluated_latex,
                tone: "success" as const,
            });
        }
        return derivedSteps;
    }, [analyticSolution]);

    const visibleExactSteps = analyticSolution?.exact.steps?.length ? analyticSolution.exact.steps : fallbackExactSteps;

    React.useEffect(() => {
        if (mode !== "single" || analyticSolution?.status !== "exact" || !expression.trim()) {
            setVerificationCertificate(null);
            setVerificationState("idle");
            return;
        }

        let cancelled = false;
        setVerificationState("checking");
        verifyIntegralCertificate({
            expression,
            lower,
            upper,
            antiderivative_latex: analyticSolution.exact.antiderivative_latex || "",
            result_latex: analyticSolution.exact.evaluated_latex || "",
            method: analyticSolution.reproducibility?.selected_method || solveMethod,
        })
            .then((certificate) => {
                if (!cancelled) {
                    setVerificationCertificate(certificate);
                    setVerificationState("ready");
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setVerificationCertificate(null);
                    setVerificationState("error");
                }
            });

        return () => {
            cancelled = true;
        };
    }, [analyticSolution, expression, lower, mode, solveMethod, upper]);

    const renderedProblemContent = React.useMemo(() => {
        const texExpression = LaboratoryFormattingService.toTexExpression(expression);
        if (mode === "single") {
            if (classification.kind === "indefinite_single") {
                return `$$I = \\int (${texExpression}) \\, dx$$`;
            }
            return `$$I = \\int_{${lower}}^{${upper}} (${texExpression}) \\, dx$$`;
        }
        if (mode === "double") {
            return `$$I = \\int_{${xMin}}^{${xMax}} \\int_{${yMin}}^{${yMax}} (${texExpression}) \\, dy \\, dx$$`;
        }
        return `$$I = \\int_{${xMin}}^{${xMax}} \\int_{${yMin}}^{${yMax}} \\int_{${zMin}}^{${zMax}} (${texExpression}) \\, dz \\, dy \\, dx$$`;
    }, [classification.kind, expression, lower, mode, upper, xMax, xMin, yMax, yMin, zMax, zMin]);

    const stalePanelClassName = isResultStale ? "opacity-45 grayscale-[0.35] transition-all" : "";
    const staleOverlay = isResultStale ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-[inherit] bg-background/55 backdrop-blur-[2px]">
            <div className="rounded-2xl border border-accent/30 bg-background/90 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-accent shadow-lg">
                {isUz ? "Natija kutilmoqda" : "Waiting for result"}
            </div>
        </div>
    ) : null;

    const assumptionsMarkdown = React.useMemo(
        () =>
            buildAssumptionsMarkdown({
                coordinates: state.coordinates,
                taxonomyLaneGuidance,
                mode,
                lower,
                upper,
                xMin,
                xMax,
                yMin,
                yMax,
                zMin,
                zMax,
                diagnosticsSnapshot,
                analyticSolution,
            }),
        [analyticSolution, diagnosticsSnapshot, lower, mode, state.coordinates, taxonomyLaneGuidance, upper, xMax, xMin, yMax, yMin, zMax, zMin],
    );

    const methodAuditMarkdown = React.useMemo(
        () =>
            buildMethodAuditMarkdown({
                mode,
                taxonomyLaneGuidance,
                analyticSolution,
                diagnosticsSnapshot,
                singleDiagnostics,
                doubleDiagnostics,
                tripleDiagnostics,
                normalizedXResolution,
                normalizedYResolution,
                normalizedZResolution,
            }),
        [analyticSolution, diagnosticsSnapshot, doubleDiagnostics, mode, normalizedXResolution, normalizedYResolution, normalizedZResolution, singleDiagnostics, taxonomyLaneGuidance, tripleDiagnostics],
    );

    const assumptionCards = React.useMemo(
        () =>
            buildAssumptionCards({
                coordinates: state.coordinates,
                mode,
                lower,
                upper,
                xMin,
                xMax,
                yMin,
                yMax,
                zMin,
                zMax,
                classification,
                analyticSolution,
                diagnosticsSnapshot,
                taxonomyLaneGuidance,
            }),
        [analyticSolution, classification, diagnosticsSnapshot, lower, mode, state.coordinates, taxonomyLaneGuidance, upper, xMax, xMin, yMax, yMin, zMax, zMin],
    );

    const methodAuditCards = React.useMemo(
        () =>
            buildMethodAuditCards({
                mode,
                taxonomyLaneGuidance,
                analyticSolution,
                classification,
                summary,
                normalizedSegments,
                singleDiagnostics,
                doubleDiagnostics,
                tripleDiagnostics,
                normalizedXResolution,
                normalizedYResolution,
                normalizedZResolution,
                diagnosticsSnapshot,
            }),
        [analyticSolution, classification, diagnosticsSnapshot, doubleDiagnostics, mode, normalizedSegments, normalizedXResolution, normalizedYResolution, normalizedZResolution, singleDiagnostics, summary, taxonomyLaneGuidance, tripleDiagnostics],
    );

    const verificationLayerCards = React.useMemo(
        () =>
            buildVerificationLayerCards({
                verificationState,
                verificationCertificate,
                analyticSolution,
                summary,
                diagnosticsSnapshot,
            }),
        [analyticSolution, diagnosticsSnapshot, summary, verificationCertificate, verificationState],
    );

    const researchAuditCards = React.useMemo(
        () => [...methodAuditCards, ...verificationLayerCards],
        [methodAuditCards, verificationLayerCards],
    );

    const visualizeOverviewCards = React.useMemo(
        () =>
            buildVisualizeOverviewCards({
                isResultStale,
                summary,
                analyticSolution,
                mode,
                lower,
                upper,
                singleDiagnostics,
                doubleDiagnostics,
                tripleDiagnostics,
                normalizedSegments,
                normalizedXResolution,
                normalizedYResolution,
                normalizedZResolution,
                xMin,
                xMax,
                yMin,
                yMax,
                zMin,
                zMax,
            }),
        [analyticSolution, doubleDiagnostics, isResultStale, lower, mode, normalizedSegments, normalizedXResolution, normalizedYResolution, normalizedZResolution, singleDiagnostics, summary, tripleDiagnostics, upper, xMax, xMin, yMax, yMin, zMax, zMin],
    );

    const methodTableRows = React.useMemo(
        () =>
            buildMethodTableRows({
                summary,
                mode,
                singleDiagnostics,
                doubleDiagnostics,
                tripleDiagnostics,
                normalizedXResolution,
                normalizedYResolution,
                normalizedZResolution,
            }),
        [doubleDiagnostics, mode, normalizedXResolution, normalizedYResolution, normalizedZResolution, singleDiagnostics, summary, tripleDiagnostics],
    );

    const sampleTableRows = React.useMemo(
        () => buildSampleTableRows(summary, mode),
        [mode, summary],
    );

    const sweepTableRows = React.useMemo(
        () => buildSweepTableRows(sweepSeries),
        [sweepSeries],
    );

    const resultLevelCards = React.useMemo(
        () => buildResultLevelCards(summary, mode, singleDiagnostics, doubleDiagnostics, tripleDiagnostics),
        [doubleDiagnostics, mode, singleDiagnostics, summary, tripleDiagnostics],
    );

    const compareOverviewCards = React.useMemo(
        () =>
            buildCompareOverviewCards({
                mode,
                summary,
                analyticSolution,
                singleDiagnostics,
                doubleDiagnostics,
                tripleDiagnostics,
                visibleSignals,
            }),
        [analyticSolution, doubleDiagnostics, mode, singleDiagnostics, summary, tripleDiagnostics, visibleSignals],
    );

    const benchmarkSummary = React.useMemo(
        () => evaluateIntegralBenchmark({ mode, expression, lower, upper, analyticSolution, summary }),
        [analyticSolution, expression, lower, mode, summary, upper],
    );

    const riskRegisterCards = React.useMemo(
        () =>
            buildRiskRegisterCards({
                blockingValidationCount,
                warningSignals,
                diagnosticsSnapshot,
                benchmarkSummary,
            }),
        [benchmarkSummary, blockingValidationCount, diagnosticsSnapshot, warningSignals],
    );

    const reportSkeletonMarkdown = React.useMemo(
        () =>
            buildReportSkeletonMarkdown({
                summary,
                analyticSolution,
                expression,
                lower,
                upper,
                mode,
                solveMethod,
                methodAuditMarkdown,
                assumptionsMarkdown,
                diagnosticsSnapshot,
                verificationLayerCards,
                singleDiagnostics,
                normalizedXResolution,
                normalizedYResolution,
                normalizedZResolution,
                solverStatusText,
                solverWarning,
                benchmarkSummary,
                reportFormat,
            }),
        [analyticSolution, assumptionsMarkdown, benchmarkSummary, diagnosticsSnapshot, expression, lower, methodAuditMarkdown, mode, normalizedXResolution, normalizedYResolution, normalizedZResolution, reportFormat, singleDiagnostics, solveMethod, solverStatusText, solverWarning, summary, upper, verificationLayerCards],
    );

    const reportExecutiveCards = React.useMemo(
        () =>
            buildReportExecutiveCards({
                summary,
                mode,
                analyticSolution,
                diagnosticsSnapshot,
                warningSignals,
                assumptionCards,
                researchAuditCards,
            }),
        [analyticSolution, assumptionCards, diagnosticsSnapshot, mode, researchAuditCards, summary, warningSignals],
    );

    const reportSupportCards = React.useMemo(
        () =>
            buildReportSupportCards({
                resultConsoleData,
                diagnosticsSnapshot,
                annotations,
                savedExperiments,
                summary,
                solverWarning,
            }),
        [annotations, diagnosticsSnapshot, resultConsoleData, savedExperiments, solverWarning, summary],
    );

    const reportReadinessCards = React.useMemo(
        () =>
            buildReportReadinessCards({
                assumptionCards,
                researchAuditCards,
                diagnosticsSnapshot,
                annotations,
                summary,
                solverWarning,
            }),
        [annotations, assumptionCards, diagnosticsSnapshot, researchAuditCards, solverWarning, summary],
    );

    const { copyMarkdownExport, sendToWriter, sendToNotebook, pushLiveResult, lastTransfer, transferState, transferError } = useLaboratoryWriterBridge({
        ready: Boolean(summary && !solverWarning),
        sourceLabel: "Integral Studio",
        liveTargets: liveBridge.liveTargets,
        selectedLiveTargetId: liveBridge.selectedLiveTargetId,
        setExportState,
        setGuideMode,
        buildMarkdown: () => reportSkeletonMarkdown,
        buildBlock: (targetId: string) =>
            buildIntegralLivePayload({
                targetId,
                mode,
                expression,
                lower: Number(lower),
                upper: Number(upper),
                xMin: Number(xMin),
                xMax: Number(xMax),
                yMin: Number(yMin),
                yMax: Number(yMax),
                zMin: Number(zMin),
                zMax: Number(zMax),
                segmentsUsed: normalizedSegments,
                xResolution: normalizedXResolution,
                yResolution: normalizedYResolution,
                zResolution: normalizedZResolution,
                summary: summary as IntegralComputationSummary,
            }),
        publicationProfile,
        getSavedResultMeta: () => ({
            id: lastSavedResult?.id ?? null,
            revision: lastSavedResult?.revision ?? null,
            scientificObjectId: typeof lastSavedResult?.metadata?.scientific_object_id === "string" ? lastSavedResult.metadata.scientific_object_id : null,
        }),
        getInputSnapshot: () => ({
            mode,
            expression,
            lower,
            upper,
            xMin,
            xMax,
            yMin,
            yMax,
            zMin,
            zMax,
            segmentsUsed: normalizedSegments,
            xResolution: normalizedXResolution,
            yResolution: normalizedYResolution,
            zResolution: normalizedZResolution,
        }),
        getDraftMeta: () => ({
            title: "Integral Analysis",
            abstract: "Exported from laboratory.",
            keywords: `${mode},integral`,
        }),
    });

    const { saveResult, saveState, saveError, lastSavedResult } = useLaboratoryResultPersistence({
        ready: Boolean(summary && !solverWarning),
        moduleSlug: module.slug,
        moduleTitle: module.title,
        mode,
        buildTitle: () => `Integral report: ${expression || mode}`,
        buildSummary: () => resultConsoleData.subline,
        buildReportMarkdown: () => reportSkeletonMarkdown,
        buildStructuredPayload: (targetId) =>
            buildIntegralLivePayload({
                targetId,
                mode,
                expression,
                lower: Number(lower),
                upper: Number(upper),
                xMin: Number(xMin),
                xMax: Number(xMax),
                yMin: Number(yMin),
                yMax: Number(yMax),
                zMin: Number(zMin),
                zMax: Number(zMax),
                segmentsUsed: normalizedSegments,
                xResolution: normalizedXResolution,
                yResolution: normalizedYResolution,
                zResolution: normalizedZResolution,
                summary: summary as IntegralComputationSummary,
            }),
        buildInputSnapshot: () => ({
            mode,
            expression,
            lower,
            upper,
            xMin,
            xMax,
            yMin,
            yMax,
            zMin,
            zMax,
            segmentsUsed: normalizedSegments,
            xResolution: normalizedXResolution,
            yResolution: normalizedYResolution,
            zResolution: normalizedZResolution,
        }),
        buildMetadata: () => ({
            sourceLabel: "Integral Studio",
            classification: classification.label,
            solverStatusText,
            method: analyticSolution?.reproducibility?.selected_method || solveMethod,
            engine: analyticSolution?.reproducibility?.engine || "sympy/manual-js-hybrid",
            computation: {
                status: analyticSolution?.status === "exact" ? "exact" : summary ? "numeric" : "unknown",
                method: analyticSolution?.reproducibility?.selected_method || solveMethod,
                method_label: analyticSolution?.reproducibility?.method || solveMethod,
                method_family: analyticSolution?.reproducibility?.method_family || "hybrid",
                tolerance: analyticSolution?.reproducibility?.numeric_strategy || null,
                engine: analyticSolution?.reproducibility?.engine || "sympy/manual-js-hybrid",
                warnings: warningSignals.map((signal) => `${signal.label}: ${signal.text}`),
                errors: solverWarning ? [solverWarning] : [],
            },
            verification_certificate: verificationCertificate || {
                status: verificationState === "checking" ? "pending" : "not_requested",
                trust_score: null,
                checks: [],
                warnings: [],
                recommendations: ["Open Report Center and run/refresh verification before publication export."],
            },
            report_contract: {
                format: reportFormat,
                required_sections: ["Problem Statement", "Method", "Solution", "Verification", "Graph Interpretation", "Code Appendix", "Conclusion"],
                readiness: summary && !solverWarning ? "draft-ready" : "blocked",
                export_formats: ["PDF", "LaTeX", "DOCX", "Writer"],
            },
            billing_signal: {
                tier: "pro",
                feature: "full-report-verification-code-appendix",
                reason: "Full report, verification certificate, code appendix, and Writer bridge are paid-value outputs.",
            },
        }),
    });

    const solverControlProps: React.ComponentProps<typeof SolverControl> = {
        ...state,
        ...actions,
        renderedProblemContent,
        analyticStatusTitle: analyticStatusCard.title,
        analyticStatusBody: analyticStatusCard.body,
        analyticStatusBadge: analyticStatusCard.badge,
        analyticStatusToneClass: analyticStatusCard.toneClass,
        classification,
        isResultStale,
        saveResult,
        saveState,
    };

    const visualizerProps: React.ComponentProps<typeof VisualizerDeck> = {
        ...state,
        analyticSolution,
        lower,
        upper,
        isResultStale,
    };

    const trustPanelProps: React.ComponentProps<typeof TrustPanel> = {
        solverStatusText,
        warningSignals,
        visibleWarnings: visibleSignals,
        parserNotes: analyticSolution?.parser.notes || [],
        researchReadiness: diagnosticsSnapshot.research.readiness_label,
        researchRisk: diagnosticsSnapshot.research.domain_risk_level,
        exactnessTier: diagnosticsSnapshot.research.exactness_tier,
        blockerCount: diagnosticsSnapshot.research.blocker_count,
        benchmarkSummary,
    };

    const scenarioPanelProps: React.ComponentProps<typeof ScenarioPanel> = {
        ...state,
        ...actions,
    };

    const annotationPanelProps: React.ComponentProps<typeof AnnotationPanel> = {
        ...state,
        ...actions,
    };

    const statusBarCards = React.useMemo(
        () =>
            buildStatusBarCards({
                classification,
                analyticStatusCard,
                solvePhase,
                analyticSolution,
                activeTab,
                solveMethod,
                summary,
                saveState,
                lastSavedResult,
                saveError,
            }),
        [activeTab, analyticSolution, analyticStatusCard, classification, lastSavedResult, saveError, saveState, solveMethod, solvePhase, summary],
    );

    return (
        <div className="space-y-8 pb-20">
            <StudioHeaderBar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                availableTabs={availableTabs}
                tabs={workspaceTabs}
                templatesOpen={templatesOpen}
                setTemplatesOpen={setTemplatesOpen}
                experienceLevel={experienceLevel}
                setExperienceLevel={setExperienceLevel}
                workflowTemplates={INTEGRAL_WORKFLOW_TEMPLATES}
                activeTemplateId={activeTemplateId}
                applyWorkflowTemplate={applyWorkflowTemplate}
                presets={INTEGRAL_PRESETS}
                activePresetLabel={state.activePreset?.label}
                applyPreset={applyPreset}
            />

            {/* Guide */}
            {guideMode && (
                <div className="rounded-3xl border border-accent/30 bg-accent/5 p-6 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="flex items-start justify-between gap-4">
                        <div className="space-y-2">
                            <div className="inline-flex items-center rounded-full bg-accent px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white">
                                {exportGuides[guideMode].badge}
                            </div>
                            <h3 className="text-lg font-black tracking-tight text-foreground">{exportGuides[guideMode].title}</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">{exportGuides[guideMode].description}</p>
                        </div>
                        <button onClick={() => setGuideMode(null)} className="rounded-xl border border-border/60 p-2 text-muted-foreground hover:bg-muted transition-colors">
                            <Trash2 className="h-4 w-4" />
                        </button>
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                        {exportGuides[guideMode].steps.map((step, idx) => (
                            <div key={idx} className="rounded-2xl border border-border/60 bg-background/50 p-3 space-y-1">
                                <div className="text-[10px] font-black text-accent uppercase">Step {idx + 1}</div>
                                <div className="text-xs leading-5 text-foreground font-medium">{step}</div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 flex gap-3">
                        <button
                            onClick={guideMode === "copy" ? copyMarkdownExport : sendToWriter}
                            className="inline-flex h-10 items-center justify-center rounded-2xl bg-accent px-6 text-sm font-bold text-white shadow-lg shadow-accent/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                        >
                            {guideMode === "copy" ? (
                                <><Activity className="mr-2 h-4 w-4" /> Nusxa olish</>
                            ) : (
                                <><Zap className="mr-2 h-4 w-4" /> Writer ga yuborish</>
                            )}
                        </button>
                        <button onClick={() => setGuideMode(null)} className="px-5 text-sm font-bold text-muted-foreground">Yopish</button>
                    </div>
                </div>
            )}

            {/* Main Tabs Content */}
            <div className="grid gap-8">
                {activeTab === "solve" && (
                    <SolveView
                        solverControlProps={solverControlProps}
                        visualizerProps={visualizerProps}
                        staleOverlay={staleOverlay}
                        stalePanelClassName={stalePanelClassName}
                        solveOverviewCards={solveOverviewCards}
                        analyticDerivationTitle={analyticSolution?.status === "exact" ? "Exact solution" : "Solver guidance"}
                        analyticDerivationContent={analyticSolution?.status === "exact" ? buildExactSolutionMarkdown(analyticSolution, locale) : buildNumericalPromptMarkdown(mode, analyticSolution, locale)}
                        analyticDerivationAccentClassName={analyticSolution?.status === "exact" ? "text-emerald-600" : "text-amber-600"}
                        showMethodTrace={mode === "single" && !taxonomyLaneGuidance}
                        methodTraceContent={buildExactMethodMarkdown(analyticSolution, locale)}
                        exactSteps={visibleExactSteps}
                        methodAuditCards={methodAuditCards}
                        visibleSignals={visibleSignals}
                        assumptionCards={assumptionCards}
                        experienceLevel={experienceLevel}
                    />
                )}

                {activeTab === "code" && (
                    <CodeView
                        analyticSolution={analyticSolution}
                        expression={expression}
                        lower={lower}
                        upper={upper}
                        solveMethod={solveMethod}
                        setSolveMethod={setSolveMethod}
                    />
                )}

                {activeTab === "visualize" && (
                    <VisualizeView
                        visualizerProps={visualizerProps}
                        staleOverlay={staleOverlay}
                        stalePanelClassName={stalePanelClassName}
                        mode={mode}
                        methodTableRows={methodTableRows}
                        sampleTableRows={sampleTableRows}
                        visualizeOverviewCards={visualizeOverviewCards}
                        methodAuditCards={researchAuditCards}
                        visibleSignals={visibleSignals}
                        sweepSeries={sweepSeries}
                        sweepTableRows={sweepTableRows}
                        sweepStart={sweepStart}
                        setSweepStart={setSweepStart}
                        sweepEnd={sweepEnd}
                        setSweepEnd={setSweepEnd}
                        experienceLevel={experienceLevel}
                    />
                )}

                {activeTab === "compare" && (
                    <CompareView
                        compareOverviewCards={compareOverviewCards}
                        trustPanelProps={trustPanelProps}
                        resultLevelCards={resultLevelCards}
                        riskRegisterCards={riskRegisterCards}
                        methodAuditCards={researchAuditCards}
                        scenarioPanelProps={scenarioPanelProps}
                        summary={summary as IntegralComputationSummary | null}
                    />
                )}

                {activeTab === "report" && (
                    <ReportView
                        reportExecutiveCards={reportExecutiveCards}
                        reportSupportCards={reportSupportCards}
                        reportSkeletonMarkdown={reportSkeletonMarkdown}
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
                        reportReadinessCards={reportReadinessCards}
                        annotationPanelProps={annotationPanelProps}
                        liveTargets={liveBridge.liveTargets.map((target) => ({ id: `${target.paperId}::${target.id}`, title: `${target.paperTitle} · ${target.title}` }))}
                        selectedLiveTargetId={liveBridge.selectedLiveTargetId}
                        setSelectedLiveTargetId={liveBridge.setSelectedLiveTargetId}
                        pushLiveResult={pushLiveResult}
                        publicationProfile={publicationProfile}
                        setPublicationProfile={setPublicationProfile}
                        reportFormat={reportFormat}
                        setReportFormat={setReportFormat}
                    />
                )}
            </div>

            {/* Sleek Status Bar */}
            <StudioStatusBar cards={statusBarCards} resetWorkspace={resetWorkspace} />
        </div>
    );
}
