import React from "react";
import {
    Activity,
    Trash2,
    Zap
} from "lucide-react";

import { LaboratoryModuleMeta } from "@/lib/laboratory";
import { LaboratoryMathPanel } from "@/components/laboratory/laboratory-math-panel";
import type { LaboratorySignal } from "@/components/laboratory/laboratory-signal-panel";
import type { ReportGeneratorFormat } from "@/components/laboratory/laboratory-report-layout";
import { useLaboratoryWriterBridge } from "@/components/live-writer-bridge/use-laboratory-writer-bridge";
import { useLaboratoryResultPersistence } from "@/components/laboratory/use-laboratory-result-persistence";
import type { WriterBridgePublicationProfile } from "@/lib/live-writer-bridge";
import { verifyIntegralCertificate, type VerificationCertificate } from "@/lib/laboratory-verification";

// Shared Services
import { LaboratoryFormattingService } from "@/components/laboratory/services/formatting-service";

import { useIntegralStudio } from "./integral-studio/use-integral-studio";
import { 
    IntegralComputationSummary, 
    SingleIntegralSummary,
    DoubleIntegralSummary, 
    TripleIntegralSummary
} from "./integral-studio/types";
import {
    exportGuides, 
    workspaceTabs,
    INTEGRAL_PRESETS,
    INTEGRAL_WORKFLOW_TEMPLATES
} from "./integral-studio/constants";
import { 
    buildExactSolutionMarkdown,
    buildExactMethodMarkdown,
    buildNumericalPromptMarkdown, 
    buildIntegralMarkdown, 
    buildIntegralLivePayload, 
    evaluateIntegralBenchmark,
} from "./integral-studio/utils";

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

type StudioCardTone = "neutral" | "info" | "success" | "warn";
type StudioCard = { eyebrow: string; value: string; detail: string; tone: StudioCardTone };

export function IntegralStudioModule({ module }: { module: LaboratoryModuleMeta }) {
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
        annotationTitle, setAnnotationTitle,
        annotationNote, setAnnotationNote,
        experimentLabel, setExperimentLabel,
        activeTemplateId,
        annotations, setAnnotations,
        savedExperiments, setSavedExperiments,
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
        previewVisualization,
        isResultStale,
        availableTabs,
        liveBridge
    } = state;

    const {
        applyPreset,
        applyWorkflowTemplate,
        requestAnalyticSolve,
        confirmNumericalSolve,
        addAnnotationFromCurrentResult,
        saveCurrentExperiment,
        resetWorkspace,
        loadSavedExperiment,
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

    const { copyMarkdownExport, sendToWriter, sendToNotebook, pushLiveResult } = useLaboratoryWriterBridge({
        ready: Boolean(summary && !solverWarning),
        sourceLabel: "Integral Studio",
        liveTargets: liveBridge.liveTargets,
        selectedLiveTargetId: liveBridge.selectedLiveTargetId,
        setExportState,
        setGuideMode,
        buildMarkdown: () =>
            buildIntegralMarkdown({
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
        getDraftMeta: () => ({
            title: "Integral Analysis",
            abstract: "Exported from laboratory.",
            keywords: `${mode},integral`,
        }),
    });

    const solverStatusText =
        solvePhase === "analytic-loading"
            ? "Analitik solve tekshirilmoqda"
            : solvePhase === "exact-ready"
              ? "Analitik yechim tayyor"
              : solvePhase === "needs-numerical"
                ? "Numerik tasdiq kutilmoqda"
                : summary
                  ? "Numerik estimate tayyor"
                  : solvePhase === "error"
                    ? "Solver warning"
                    : "Solve kutilmoqda";

    const taxonomyLaneGuidance = React.useMemo(() => {
        if (classification.kind === "line_integral_candidate") {
            return {
                title: "Line integral lane",
                body: [
                    "- Parametric path yoki circulation signali aniqlandi.",
                    classification.support === "supported"
                        ? "- Structured line(...) syntax active. Backend parametrik line solver ishlaydi."
                        : "- To'liq solve uchun kerak bo'ladigan qismlar: vector field, path parametrization, parameter interval.",
                    classification.support === "supported"
                        ? "- Natija F(r(t)) · r'(t) yoki scalar arc-length lane orqali hisoblanadi."
                        : "- Hozircha erkin matn line oilasini scalar solve qilmaydi; structured syntax kerak.",
                ].join("\n"),
                accent: "text-rose-600",
            };
        }
        if (classification.kind === "surface_integral_candidate") {
            return {
                title: "Surface integral lane",
                body: [
                    "- Flux yoki surface normal signali aniqlandi.",
                    classification.support === "supported"
                        ? "- Structured surface(...) syntax active. Backend parametrik surface solver ishlaydi."
                        : "- To'liq solve uchun kerak bo'ladigan qismlar: surface parametrization, normal orientation, domain patch.",
                    classification.support === "supported"
                        ? "- Natija patch normal yoki area element orqali surface lane’da hisoblanadi."
                        : "- Hozircha erkin matn surface oilasini scalar solve qilmaydi; structured syntax kerak.",
                ].join("\n"),
                accent: "text-rose-600",
            };
        }
        if (classification.kind === "contour_integral_candidate") {
            return {
                title: "Contour integral lane",
                body: [
                    "- Complex contour yoki residue signali aniqlandi.",
                    classification.support === "supported"
                        ? "- Structured contour(...) syntax active. Backend contour pullback solver ishlaydi."
                        : "- To'liq solve uchun kerak bo'ladigan qismlar: contour definition, singular points, orientation, residue structure.",
                    classification.support === "supported"
                        ? "- Natija z(t) va dz/dt orqali parameter integralga o'tkazilib hisoblanadi."
                        : "- Hozircha erkin matn contour oilasini scalar solve qilmaydi; structured syntax kerak.",
                ].join("\n"),
                accent: "text-rose-600",
            };
        }
        return null;
    }, [classification.kind, classification.support]);

    const resultConsoleData = React.useMemo(() => {
        const warningCount = warningSignals.length;
        if (analyticSolution?.status === "exact") {
            return {
                source: "exact",
                sourceLabel: "Exact Result",
                sourceClassName: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
                headline: analyticSolution.exact.numeric_approximation || analyticSolution.exact.evaluated_latex || "Exact result",
                subline: analyticSolution.exact.method_label || "Symbolic Reduction",
                latex: analyticSolution.exact.evaluated_latex ? `$$${analyticSolution.exact.evaluated_latex}$$` : null,
                confidenceLabel: "High trust",
                confidenceDetail: "Symbolic solver closed-form natijani topdi.",
                confidenceClassName: "text-emerald-700 dark:text-emerald-300",
                nextAction: warningCount > 0 ? "Compare tabida signal va sweep'ni ko'rib chiqing." : "Xohlasangiz numerik compare yoki report export qiling.",
            };
        }
        if (summary && mode === "single") {
            const relativeSpread = singleDiagnostics?.relativeSpread || 0;
            return {
                source: "numerical",
                sourceLabel: "Numerical Result",
                sourceClassName: "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300",
                headline: LaboratoryFormattingService.formatMetric((summary as SingleIntegralSummary).simpson, 6),
                subline: "Simpson estimate",
                latex: null,
                confidenceLabel: relativeSpread < 0.02 ? "High trust" : relativeSpread < 0.06 ? "Medium trust" : "Cautious",
                confidenceDetail: relativeSpread < 0.02 ? "Metodlar orasidagi farq juda kichik." : relativeSpread < 0.06 ? "Estimate ishlatish mumkin, lekin compare foydali." : "Method spread sezilarli, segmentni oshirish kerak.",
                confidenceClassName: relativeSpread < 0.02 ? "text-emerald-700 dark:text-emerald-300" : relativeSpread < 0.06 ? "text-amber-700 dark:text-amber-300" : "text-rose-700 dark:text-rose-300",
                nextAction: warningCount > 0 ? "Sweep va compare section orqali barqarorlikni tekshiring." : "Natijani writer yoki note oqimiga olib o'tish mumkin.",
            };
        }
        if (summary && mode === "double") {
            return {
                source: "numerical",
                sourceLabel: "Surface Estimate",
                sourceClassName: "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300",
                headline: LaboratoryFormattingService.formatMetric((summary as DoubleIntegralSummary).value, 6),
                subline: `${normalizedXResolution} x ${normalizedYResolution} grid`,
                latex: null,
                confidenceLabel: warningCount > 1 ? "Medium trust" : "Stable grid",
                confidenceDetail: warningCount > 1 ? "Grid va domain signallarini qayta ko'rish tavsiya etiladi." : "Surface grid bo'yicha estimate tayyor.",
                confidenceClassName: warningCount > 1 ? "text-amber-700 dark:text-amber-300" : "text-emerald-700 dark:text-emerald-300",
                nextAction: "Visualizer va tables section orqali peak hamda profile'larni tekshiring.",
            };
        }
        if (summary && mode === "triple") {
            return {
                source: "numerical",
                sourceLabel: "Volume Estimate",
                sourceClassName: "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300",
                headline: LaboratoryFormattingService.formatMetric((summary as TripleIntegralSummary).value, 6),
                subline: `${normalizedXResolution} x ${normalizedYResolution} x ${normalizedZResolution} grid`,
                latex: null,
                confidenceLabel: warningCount > 1 ? "Medium trust" : "Research preview",
                confidenceDetail: warningCount > 1 ? "Volumetric grid'ni kuchaytirib qayta tekshirish kerak." : "Hozirgi voxel grid bo'yicha estimate tayyor.",
                confidenceClassName: warningCount > 1 ? "text-amber-700 dark:text-amber-300" : "text-emerald-700 dark:text-emerald-300",
                nextAction: "Density profile va report skeleton bilan natijani hujjatlashtiring.",
            };
        }
        return {
            source: "idle",
            sourceLabel: "Awaiting Solve",
            sourceClassName: "border-border/60 bg-background/70 text-muted-foreground",
            headline: "Natija hali yo'q",
            subline: solverStatusText,
            latex: null,
            confidenceLabel: "No confidence yet",
            confidenceDetail: "Formula va domain tayyor bo'lgach solve ishga tushadi.",
            confidenceClassName: "text-muted-foreground",
            nextAction: "Masalani tekshirib, analytic solve yoki numerik tayyorlashni bosing.",
        };
    }, [analyticSolution, mode, normalizedXResolution, normalizedYResolution, normalizedZResolution, singleDiagnostics, solvePhase, solverStatusText, summary, warningSignals.length]);

    const workflowReadinessCards = React.useMemo<StudioCard[]>(() => ([
        { eyebrow: "Solve", value: solverStatusText, detail: analyticSolution?.status === "exact" ? "Exact solver javob berdi." : summary ? "Numerik result tayyor." : "Solve hali kutilyapti.", tone: analyticSolution?.status === "exact" || summary ? "success" : solvePhase === "error" ? "warn" : "info" },
        { eyebrow: "Validation", value: blockingValidationCount > 0 ? `${blockingValidationCount} blocker` : "Clean", detail: blockingValidationCount > 0 ? "Inputda to'g'rilanishi kerak bo'lgan maydonlar bor." : "Input oqimi hozir yaroqli.", tone: blockingValidationCount > 0 ? "warn" : "success" },
        { eyebrow: "Visuals", value: summary ? "Ready" : "Waiting", detail: summary ? "Grafik va sample data tayyor." : "Vizual qatlam solve natijasini kutmoqda.", tone: summary ? "success" : "neutral" },
        { eyebrow: "Export", value: summary && !solverWarning ? "Ready" : "Blocked", detail: summary && !solverWarning ? "Report va writer bridge ishlaydi." : "Toza natija chiqmaguncha export bloklangan.", tone: summary && !solverWarning ? "success" : "warn" },
    ]), [analyticSolution?.status, blockingValidationCount, solvePhase, solverStatusText, solverWarning, summary]);

    const solveOverviewCards = React.useMemo<StudioCard[]>(() => {
        const primaryValue = resultConsoleData.headline;
        const cards: StudioCard[] = [
            { eyebrow: "Result", value: primaryValue, detail: resultConsoleData.subline, tone: resultConsoleData.source === "idle" ? "neutral" : resultConsoleData.source === "exact" ? "success" : "info" },
            { eyebrow: "Source", value: resultConsoleData.sourceLabel, detail: resultConsoleData.nextAction, tone: resultConsoleData.source === "exact" ? "success" : resultConsoleData.source === "numerical" ? "info" : "neutral" },
            { eyebrow: "Confidence", value: resultConsoleData.confidenceLabel, detail: resultConsoleData.confidenceDetail, tone: resultConsoleData.confidenceLabel === "High trust" || resultConsoleData.confidenceLabel === "Stable grid" ? "success" : resultConsoleData.confidenceLabel === "No confidence yet" ? "neutral" : "warn" },
        ];

        if (mode === "single" && summary) {
            cards.push({
                eyebrow: "Spread",
                value: LaboratoryFormattingService.formatMetric(singleDiagnostics?.spread || 0, 6),
                detail: singleDiagnostics?.stability || "Method spread",
                tone: (singleDiagnostics?.relativeSpread || 0) < 0.06 ? "success" : "warn",
            });
        } else if (mode === "double" && summary) {
            cards.push({
                eyebrow: "Grid",
                value: `${normalizedXResolution} x ${normalizedYResolution}`,
                detail: `Peak ${LaboratoryFormattingService.formatMetric(doubleDiagnostics?.peak, 4)}`,
                tone: "info",
            });
        } else if (mode === "triple" && summary) {
            cards.push({
                eyebrow: "Voxel",
                value: LaboratoryFormattingService.formatMetric(tripleDiagnostics?.voxelVolume, 6),
                detail: `${normalizedXResolution} x ${normalizedYResolution} x ${normalizedZResolution} grid`,
                tone: "info",
            });
        }

        return cards;
    }, [doubleDiagnostics?.peak, mode, normalizedXResolution, normalizedYResolution, normalizedZResolution, resultConsoleData, singleDiagnostics?.relativeSpread, singleDiagnostics?.spread, singleDiagnostics?.stability, summary, tripleDiagnostics?.voxelVolume]);

    const analyticStatusCard = React.useMemo(() => {
        if (classification.support !== "supported") {
            return {
                eyebrow: "Analytic Status",
                title: classification.label,
                body: taxonomyLaneGuidance?.body || classification.summary,
                badge: classification.support === "partial" ? "Partial" : "Unsupported",
                toneClass:
                    classification.support === "partial"
                        ? "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                        : "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300",
            };
        }

        if (analyticSolution?.status === "exact") {
            return {
                eyebrow: "Analytic Status",
                title: analyticSolution.exact.method_label || "Exact solution ready",
                body: analyticSolution.exact.method_summary || "Symbolic solver integral uchun yopiq shakldagi javob topdi.",
                badge: "Exact",
                toneClass: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
            };
        }

        return {
            eyebrow: "Analytic Status",
            title: solvePhase === "analytic-loading" ? "Analytic solve running" : solvePhase === "needs-numerical" || summary ? "Numerical path active" : "Waiting for solve",
            body: buildNumericalPromptMarkdown(mode, analyticSolution),
            badge: "Guidance",
            toneClass: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
        };
    }, [analyticSolution, classification, mode, solvePhase, summary, taxonomyLaneGuidance]);

    const fallbackExactSteps = React.useMemo(() => {
        if (analyticSolution?.status !== "exact") {
            return [];
        }

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
                Natija kutilmoqda
            </div>
        </div>
    ) : null;

    const reportSupportCards = React.useMemo<StudioCard[]>(() => ([
        { eyebrow: "Source", value: resultConsoleData.sourceLabel, detail: "Report skeleton qaysi natija qatlamidan oziqlanayotganini ko'rsatadi.", tone: resultConsoleData.source === "exact" ? "success" : resultConsoleData.source === "numerical" ? "info" : "warn" },
        { eyebrow: "Research", value: diagnosticsSnapshot.research.readiness_label, detail: `${diagnosticsSnapshot.research.exactness_tier} | risk ${diagnosticsSnapshot.research.domain_risk_level}`, tone: diagnosticsSnapshot.research.domain_risk_level === "low" ? "success" : diagnosticsSnapshot.research.domain_risk_level === "medium" ? "info" : "warn" },
        { eyebrow: "Annotations", value: `${annotations.length}`, detail: annotations.length ? "Current result uchun note'lar mavjud." : "Reportga qo'shish uchun hali note yozilmagan.", tone: annotations.length ? "info" : "neutral" },
        { eyebrow: "Scenarios", value: `${savedExperiments.length}`, detail: savedExperiments.length ? "Saved scenario'lar report comparison uchun tayyor." : "Scenario library hali bo'sh.", tone: savedExperiments.length ? "info" : "neutral" },
        { eyebrow: "Bridge", value: summary && !solverWarning ? "Ready" : "Blocked", detail: summary && !solverWarning ? "Copy, send va live push ishlatish mumkin." : "Writer bridge solve tozalanmaguncha bloklangan.", tone: summary && !solverWarning ? "success" : "warn" },
    ]), [annotations.length, diagnosticsSnapshot.research.domain_risk_level, diagnosticsSnapshot.research.exactness_tier, diagnosticsSnapshot.research.readiness_label, resultConsoleData.source, resultConsoleData.sourceLabel, savedExperiments.length, solverWarning, summary]);

    const assumptionsMarkdown = React.useMemo(() => {
        const assumptions: string[] = [];
        assumptions.push(`- Coordinate system: **${state.coordinates}**.`);
        if (taxonomyLaneGuidance) {
            assumptions.push(`- Research lane: **${taxonomyLaneGuidance.title}**.`);
        }
        if (mode === "single") {
            assumptions.push(`- Bound ordering enforced: **${lower} < ${upper}**.`);
            assumptions.push("- Variable support shu rejimda faqat integralning faol o'zgaruvchilariga bog'langan.");
        } else if (mode === "double") {
            assumptions.push(`- Domain box: **x in [${xMin}, ${xMax}]**, **y in [${yMin}, ${yMax}]**.`);
            assumptions.push("- 2D integral midpoint grid orqali baholanadi; singular yoki undefined nuqtalar sample sifatida chiqarib tashlanadi.");
        } else {
            assumptions.push(`- Domain box: **x in [${xMin}, ${xMax}]**, **y in [${yMin}, ${yMax}]**, **z in [${zMin}, ${zMax}]**.`);
            assumptions.push("- 3D estimate sparse voxel sampling bilan quriladi; coordinate jacobian avtomatik qo'llanadi.");
        }

        if (diagnosticsSnapshot.domainConstraints.length) {
            diagnosticsSnapshot.domainConstraints.forEach((constraint) => assumptions.push(`- ${constraint.label}: ${constraint.detail}`));
        }
        if (diagnosticsSnapshot.domainBlockers.length) {
            assumptions.push(`- Active blockers: ${diagnosticsSnapshot.domainBlockers.join(", ")}.`);
        }
        if (diagnosticsSnapshot.domainAssumptions.length) {
            diagnosticsSnapshot.domainAssumptions.forEach((assumption) => assumptions.push(`- ${assumption}`));
        }
        if (diagnosticsSnapshot.hazardDetails.length) {
            diagnosticsSnapshot.hazardDetails.forEach((hazard) => assumptions.push(`- Hazard (${hazard.label}): ${hazard.detail}`));
        }
        if (diagnosticsSnapshot.piecewiseRegions.length) {
            assumptions.push(`- Piecewise region analysis active: **${diagnosticsSnapshot.piecewiseSource}** source.`);
            diagnosticsSnapshot.piecewiseRegions.forEach((branch) => {
                assumptions.push(`- Region ${branch.region}: ${branch.behavior}`);
            });
        }
        if (analyticSolution?.parser.notes.length) {
            assumptions.push(`- Parser normalization notes: ${analyticSolution.parser.notes.join(" ")}`);
        }
        if (diagnosticsSnapshot.research.review_notes.length) {
            diagnosticsSnapshot.research.review_notes.forEach((note) => assumptions.push(`- Research review: ${note}`));
        }

        return assumptions.join("\n");
    }, [analyticSolution, diagnosticsSnapshot, lower, mode, state.coordinates, taxonomyLaneGuidance, upper, xMax, xMin, yMax, yMin, zMax, zMin]);

    const methodAuditMarkdown = React.useMemo(() => {
        if (mode === "single") {
            return [
                taxonomyLaneGuidance
                    ? `- Active taxonomy lane: **${taxonomyLaneGuidance.title}**.`
                    : analyticSolution?.status === "exact"
                      ? `- Primary path: **${analyticSolution.exact.method_label || "Exact symbolic"}**.`
                      : "- Primary path: **Simpson** estimate.",
                analyticSolution?.diagnostics?.convergence && analyticSolution.diagnostics.convergence !== "not_applicable"
                    ? `- Convergence state: **${analyticSolution.diagnostics.convergence}**. ${analyticSolution.diagnostics.convergence_detail} Reason: **${diagnosticsSnapshot.convergenceReason}**.`
                    : "- Convergence audit bu lane uchun markaziy signal emas.",
                diagnosticsSnapshot.piecewiseRegions.length
                    ? `- Piecewise branches: **${diagnosticsSnapshot.piecewiseRegions.length}** ta region detected from **${diagnosticsSnapshot.piecewiseSource}**.`
                    : "- Piecewise split aniqlanmadi.",
                taxonomyLaneGuidance
                    ? "- Solver o'rniga lane mapping, assumptions va report guidance ko'rsatiladi."
                    : "- Reference methods: midpoint va trapezoid parallel ko'riladi.",
                `- Method spread: **${LaboratoryFormattingService.formatMetric(singleDiagnostics?.spread || 0, 6)}**.`,
                `- Stability label: **${singleDiagnostics?.stability || "Pending"}**.`,
                `- Research readiness: **${diagnosticsSnapshot.research.readiness_label}** | exactness: **${diagnosticsSnapshot.research.exactness_tier}**.`,
                diagnosticsSnapshot.domainBlockers.length
                    ? `- Domain blockers: **${diagnosticsSnapshot.domainBlockers.join(", ")}**.`
                    : "- Domain blockers aniqlanmadi.",
                analyticSolution?.status === "exact"
                    ? "- Exact symbolic result numeric estimate bilan cross-check qilinadi."
                    : "- Closed-form topilmasa numerical confirmation oqimi ishlaydi.",
            ].join("\n");
        }

        if (mode === "double") {
            return [
            "- Primary path: **2D midpoint grid integration**.",
            `- Active grid: **${normalizedXResolution} x ${normalizedYResolution}**.`,
            `- Surface peak: **${LaboratoryFormattingService.formatMetric(doubleDiagnostics?.peak, 6)}**.`,
            `- Surface mean: **${LaboratoryFormattingService.formatMetric(doubleDiagnostics?.mean, 6)}**.`,
            diagnosticsSnapshot.domainBlockers.length ? `- Domain blockers: **${diagnosticsSnapshot.domainBlockers.join(", ")}**.` : "- Domain blockers aniqlanmadi.",
            "- Grid sweep compare tabida estimate driftni audit qiladi.",
        ].join("\n");
        }

        return [
            "- Primary path: **3D voxel midpoint integration**.",
            `- Active grid: **${normalizedXResolution} x ${normalizedYResolution} x ${normalizedZResolution}**.`,
            `- Peak density: **${LaboratoryFormattingService.formatMetric(tripleDiagnostics?.peak, 6)}**.`,
            `- Mean density: **${LaboratoryFormattingService.formatMetric(tripleDiagnostics?.mean, 6)}**.`,
            `- Voxel volume: **${LaboratoryFormattingService.formatMetric(tripleDiagnostics?.voxelVolume, 6)}**.`,
            diagnosticsSnapshot.domainBlockers.length ? `- Domain blockers: **${diagnosticsSnapshot.domainBlockers.join(", ")}**.` : "- Domain blockers aniqlanmadi.",
        ].join("\n");
    }, [analyticSolution, diagnosticsSnapshot.convergenceReason, diagnosticsSnapshot.domainBlockers, diagnosticsSnapshot.piecewiseRegions.length, diagnosticsSnapshot.piecewiseSource, diagnosticsSnapshot.research.exactness_tier, diagnosticsSnapshot.research.readiness_label, doubleDiagnostics?.mean, doubleDiagnostics?.peak, mode, normalizedXResolution, normalizedYResolution, normalizedZResolution, singleDiagnostics?.spread, singleDiagnostics?.stability, taxonomyLaneGuidance, tripleDiagnostics?.mean, tripleDiagnostics?.peak, tripleDiagnostics?.voxelVolume]);

    const assumptionCards = React.useMemo<StudioCard[]>(() => {
        const cards: StudioCard[] = [
            {
                eyebrow: "Coordinates",
                value: state.coordinates,
                detail:
                    mode === "single"
                        ? `${lower} < x < ${upper}`
                        : mode === "double"
                          ? `x:[${xMin}, ${xMax}], y:[${yMin}, ${yMax}]`
                          : `x:[${xMin}, ${xMax}], y:[${yMin}, ${yMax}], z:[${zMin}, ${zMax}]`,
                tone: "info" as const,
            },
        ];

        if (classification.kind === "improper_infinite_bounds") {
            cards.push({
                eyebrow: "Convergence",
                value: analyticSolution?.diagnostics?.convergence || (analyticSolution?.status === "exact" ? "limit-resolved" : "needs review"),
                detail: analyticSolution?.diagnostics?.convergence_detail || (analyticSolution?.status === "exact"
                    ? "Cheksiz bound symbolic limit bilan baholandi."
                    : "Improper integral uchun convergence audit talab qilinadi."),
                tone: analyticSolution?.diagnostics?.convergence === "convergent" || analyticSolution?.status === "exact" ? "success" : "warn",
            });
        }

        if (classification.kind === "improper_endpoint_singularity") {
            const poleHazard = diagnosticsSnapshot.hazardDetails.find((item) => item.kind === "pole") || diagnosticsSnapshot.hazardDetails[0];
            cards.push({
                eyebrow: "Pole risk",
                value: analyticSolution?.diagnostics?.singularity || (analyticSolution?.status === "exact" ? "endpoint-resolved" : "endpoint singularity"),
                detail: poleHazard?.detail || (analyticSolution?.status === "exact"
                    ? "Boundary singularity symbolic lane orqali tekshirildi."
                    : "Boundary yaqinida singularity bor, convergence signalini tekshirish kerak."),
                tone: analyticSolution?.status === "exact" ? "success" : "warn",
            });
        }

        if (diagnosticsSnapshot.domainConstraints.length) {
            diagnosticsSnapshot.domainConstraints.slice(0, 2).forEach((constraint, index) => {
                cards.push({
                    eyebrow: index === 0 ? "Domain rule" : "Constraint",
                    value: constraint.label,
                    detail: constraint.detail,
                    tone: constraint.severity === "blocker" ? "warn" as const : "info" as const,
                });
            });
        }
        if (diagnosticsSnapshot.domainBlockers.length) {
            cards.push({
                eyebrow: "Blockers",
                value: `${diagnosticsSnapshot.domainBlockers.length}`,
                detail: diagnosticsSnapshot.domainBlockers.join(", "),
                tone: "warn" as const,
            });
        }
        if (analyticSolution?.parser.notes.length) {
            cards.push({
                eyebrow: "Parser",
                value: `${analyticSolution.parser.notes.length} notes`,
                detail: analyticSolution.parser.notes[0],
                tone: "neutral" as const,
            });
        }
        if (diagnosticsSnapshot.piecewiseRegions.length) {
            const firstRegion = diagnosticsSnapshot.piecewiseRegions[0];
            cards.push({
                eyebrow: "Piecewise",
                value: `${diagnosticsSnapshot.piecewiseRegions.length} regions`,
                detail: firstRegion ? `${firstRegion.region}: ${firstRegion.behavior}` : "Branch split detected.",
                tone: "info" as const,
            });
        }
        if (taxonomyLaneGuidance) {
            cards.push({
                eyebrow: "Lane",
                value: taxonomyLaneGuidance.title,
                detail: "Scalar solver o'rniga taxonomy guidance va future lane mapping ishlaydi.",
                tone: "info" as const,
            });
        }

        return cards.slice(0, 4);
    }, [analyticSolution, classification.kind, diagnosticsSnapshot, lower, mode, state.coordinates, taxonomyLaneGuidance, upper, xMax, xMin, yMax, yMin, zMax, zMin]);

    const methodAuditCards = React.useMemo<Array<{ eyebrow: string; value: string; detail: string; tone: "neutral" | "info" | "success" | "warn" }>>(() => {
        const spreadTone: "success" | "warn" = (singleDiagnostics?.relativeSpread || 0) < 0.06 ? "success" : "warn";
        if (mode === "single") {
            const singleSummary = summary as SingleIntegralSummary | null;
            return [
                {
                    eyebrow: "Primary",
                    value: taxonomyLaneGuidance ? taxonomyLaneGuidance.title : analyticSolution?.status === "exact" ? analyticSolution.exact.method_label || "Exact" : classification.kind === "improper_endpoint_singularity" ? "Improper audit" : "Simpson composite",
                    detail: taxonomyLaneGuidance
                        ? "Line/surface/contour oilalari uchun alohida solver lane hali ajratilmoqda."
                        : analyticSolution?.status === "exact"
                        ? "Backend exact solver verified the result."
                        : classification.kind === "improper_infinite_bounds" || classification.kind === "improper_endpoint_singularity"
                          ? "Improper integral symbolic audit lane active."
                          : "Frontend numerical estimate is currently leading.",
                    tone: analyticSolution?.status === "exact" ? ("success" as const) : ("info" as const),
                },
                {
                    eyebrow: "Cross-check",
                    value: taxonomyLaneGuidance ? "Lane requirements" : classification.kind === "improper_infinite_bounds" || classification.kind === "improper_endpoint_singularity" ? "Convergence lane" : "Midpoint + Trap",
                    detail:
                        classification.kind === "contour_integral_candidate" && analyticSolution?.exact.residue_analysis
                            ? `${analyticSolution.exact.residue_analysis.enclosed_poles.length} enclosed poles, theorem value ${analyticSolution.exact.residue_analysis.theorem_value_latex}.`
                            :
                        taxonomyLaneGuidance
                            ? taxonomyLaneGuidance.body.split("\n")[1]?.replace(/^- /, "") || "Lane metadata tayyor."
                            : classification.kind === "improper_infinite_bounds" || classification.kind === "improper_endpoint_singularity"
                            ? `${analyticSolution?.message || "Improper integral convergence signalini ko'rsatadi."} (${diagnosticsSnapshot.convergenceReason})`
                            : diagnosticsSnapshot.piecewiseRegions.length
                            ? `${diagnosticsSnapshot.piecewiseRegions.length} ta branch audit qilinmoqda.`
                            : `${singleSummary?.samples.length || 0} plotted samples, ${singleSummary?.segmentsUsed || normalizedSegments} active segments.`,
                    tone: "neutral" as const,
                },
                {
                    eyebrow: taxonomyLaneGuidance ? "Status" : classification.kind === "improper_infinite_bounds" || classification.kind === "improper_endpoint_singularity" ? "Status" : "Spread",
                    value:
                        classification.kind === "contour_integral_candidate" && analyticSolution?.exact.residue_analysis
                            ? analyticSolution.exact.residue_analysis.direct_value_match ? "residue-match" : "review"
                            :
                        taxonomyLaneGuidance
                            ? "taxonomy-only"
                            : classification.kind === "improper_infinite_bounds" || classification.kind === "improper_endpoint_singularity"
                            ? analyticSolution?.status === "exact"
                                ? "convergent"
                                : "watch"
                            : LaboratoryFormattingService.formatMetric(singleDiagnostics?.spread || 0, 6),
                    detail:
                        classification.kind === "contour_integral_candidate" && analyticSolution?.exact.residue_analysis
                            ? `Contour ${analyticSolution.exact.residue_analysis.orientation}, center ${analyticSolution.exact.residue_analysis.center_latex}, radius ${analyticSolution.exact.residue_analysis.radius_latex}.`
                            :
                        taxonomyLaneGuidance
                            ? "Solver implementation keyingi lane bosqichida ulanadi."
                            : classification.kind === "improper_infinite_bounds" || classification.kind === "improper_endpoint_singularity"
                            ? analyticSolution?.status === "exact"
                                ? (analyticSolution?.diagnostics?.convergence_detail || "Symbolic limit evaluation completed.")
                                : (analyticSolution?.diagnostics?.convergence_detail || "Closed-form convergence hali tasdiqlanmagan.")
                            : singleDiagnostics?.stability || "Pending",
                    tone:
                        classification.kind === "contour_integral_candidate" && analyticSolution?.exact.residue_analysis
                            ? (analyticSolution.exact.residue_analysis.direct_value_match ? "success" : "warn")
                            :
                        taxonomyLaneGuidance
                            ? "info"
                            : classification.kind === "improper_infinite_bounds" || classification.kind === "improper_endpoint_singularity"
                            ? (analyticSolution?.status === "exact" ? "success" : "warn")
                            : spreadTone,
                },
                {
                    eyebrow: "Research",
                    value: diagnosticsSnapshot.research.readiness_label,
                    detail: `${diagnosticsSnapshot.research.exactness_tier} | risk ${diagnosticsSnapshot.research.domain_risk_level}`,
                    tone: diagnosticsSnapshot.research.domain_risk_level === "low" ? "success" : diagnosticsSnapshot.research.domain_risk_level === "medium" ? "info" : "warn",
                },
            ];
        }

        if (mode === "double") {
            return [
                { eyebrow: "Primary", value: "Midpoint grid", detail: "2D numerical surface integration is active.", tone: "info" as const },
                { eyebrow: "Grid", value: `${normalizedXResolution} x ${normalizedYResolution}`, detail: `${doubleDiagnostics?.sampleCount || 0} accepted surface samples.`, tone: "neutral" as const },
                { eyebrow: "Peak / Mean", value: `${LaboratoryFormattingService.formatMetric(doubleDiagnostics?.peak, 4)} / ${LaboratoryFormattingService.formatMetric(doubleDiagnostics?.mean, 4)}`, detail: "Measured directly from computed surface samples.", tone: "success" as const },
            ];
        }

        return [
            { eyebrow: "Primary", value: "Voxel midpoint", detail: "3D volumetric numerical integration is active.", tone: "info" as const },
            { eyebrow: "Grid", value: `${normalizedXResolution} x ${normalizedYResolution} x ${normalizedZResolution}`, detail: `${tripleDiagnostics?.sampleCount || 0} accepted volume samples.`, tone: "neutral" as const },
            { eyebrow: "Voxel", value: LaboratoryFormattingService.formatMetric(tripleDiagnostics?.voxelVolume, 6), detail: "Measured cell volume used by the estimate.", tone: "success" as const },
        ];
    }, [analyticSolution, classification.kind, diagnosticsSnapshot.convergenceReason, diagnosticsSnapshot.piecewiseRegions.length, diagnosticsSnapshot.research.domain_risk_level, diagnosticsSnapshot.research.exactness_tier, diagnosticsSnapshot.research.readiness_label, doubleDiagnostics?.mean, doubleDiagnostics?.peak, doubleDiagnostics?.sampleCount, mode, normalizedSegments, normalizedXResolution, normalizedYResolution, normalizedZResolution, singleDiagnostics?.relativeSpread, singleDiagnostics?.spread, singleDiagnostics?.stability, summary, taxonomyLaneGuidance, tripleDiagnostics?.sampleCount, tripleDiagnostics?.voxelVolume]);

    const verificationLayerCards = React.useMemo<Array<{ eyebrow: string; value: string; detail: string; tone: "neutral" | "info" | "success" | "warn" }>>(() => {
        const cards: Array<{ eyebrow: string; value: string; detail: string; tone: "neutral" | "info" | "success" | "warn" }> = [];
        if (verificationState === "checking") {
            cards.push({
                eyebrow: "Certificate",
                value: "Checking",
                detail: "Backend verification certificate is being prepared.",
                tone: "info",
            });
        } else if (verificationCertificate) {
            cards.push({
                eyebrow: "Certificate",
                value: `${verificationCertificate.trust_score}/100`,
                detail: `${verificationCertificate.status}: ${verificationCertificate.checks.length} checks recorded.`,
                tone: verificationCertificate.status === "verified" ? "success" : verificationCertificate.status === "blocked" ? "warn" : "info",
            });
        } else if (verificationState === "error") {
            cards.push({
                eyebrow: "Certificate",
                value: "Unavailable",
                detail: "Backend certificate endpoint did not return a verification packet.",
                tone: "warn",
            });
        }
        cards.push({
            eyebrow: "Check result",
            value: analyticSolution?.status === "exact" ? "symbolic" : summary ? "numeric" : "pending",
            detail: analyticSolution?.status === "exact"
                ? "Exact result is available for derivative/substitution verification."
                : summary
                  ? "Numerical result is available; compare against symbolic lane when possible."
                  : "Run solve to build the verification certificate.",
            tone: analyticSolution?.status === "exact" ? "success" : summary ? "info" : "neutral",
        });
        cards.push({
            eyebrow: "Derivative check",
            value: analyticSolution?.exact?.antiderivative_latex ? "available" : "pending",
            detail: "Analytic primitive can be differentiated back to the submitted integrand; unresolved lanes stay flagged.",
            tone: analyticSolution?.exact?.antiderivative_latex ? "success" : "warn",
        });
        cards.push({
            eyebrow: "Numeric vs symbolic",
            value: analyticSolution?.exact?.numeric_approximation ? "compared" : summary ? "numeric-only" : "pending",
            detail: analyticSolution?.exact?.numeric_approximation
                ? `Backend decimal check: ${analyticSolution.exact.numeric_approximation}.`
                : "Symbolic decimal check is not available for this lane yet.",
            tone: analyticSolution?.exact?.numeric_approximation ? "success" : summary ? "info" : "neutral",
        });
        cards.push({
            eyebrow: "Domain / singularity",
            value: diagnosticsSnapshot.research.domain_risk_level,
            detail: diagnosticsSnapshot.domainBlockers.length
                ? diagnosticsSnapshot.domainBlockers.join("; ")
                : diagnosticsSnapshot.hazardDetails.length
                  ? diagnosticsSnapshot.hazardDetails[0].detail
                  : "No blocking domain restriction detected.",
            tone: diagnosticsSnapshot.research.domain_risk_level === "low" ? "success" : diagnosticsSnapshot.research.domain_risk_level === "medium" ? "info" : "warn",
        });
        cards.push({
            eyebrow: "Convergence",
            value: analyticSolution?.diagnostics?.convergence || "not_applicable",
            detail: diagnosticsSnapshot.convergenceReason || "Convergence audit is not applicable for this lane.",
            tone: analyticSolution?.diagnostics?.convergence === "divergent" || analyticSolution?.diagnostics?.convergence === "unresolved" ? "warn" : "success",
        });
        return cards;
    }, [analyticSolution, diagnosticsSnapshot.convergenceReason, diagnosticsSnapshot.domainBlockers, diagnosticsSnapshot.hazardDetails, diagnosticsSnapshot.research.domain_risk_level, summary, verificationCertificate, verificationState]);

    const researchAuditCards = React.useMemo(
        () => [...methodAuditCards, ...verificationLayerCards],
        [methodAuditCards, verificationLayerCards],
    );

    const visualizeOverviewCards = React.useMemo<Array<{ eyebrow: string; value: string; detail: string; tone: "neutral" | "info" | "success" | "warn" }>>(() => {
        const staleTone: "warn" | "success" | "neutral" = isResultStale ? "warn" : summary ? "success" : "neutral";
        const summaryTone: "success" | "warn" = (singleDiagnostics?.relativeSpread || 0) < 0.06 ? "success" : "warn";
        if (mode === "single") {
            const singleSummary = summary as SingleIntegralSummary | null;
            return [
                {
                    eyebrow: "Render source",
                    value: isResultStale ? "Live preview" : analyticSolution?.status === "exact" ? "Exact + numeric" : summary ? "Numeric trace" : "Pending",
                    detail: isResultStale ? "Plot current inputdan real-time qurildi." : "Visualizer latest solved snapshot bilan sinxron.",
                    tone: staleTone,
                },
                {
                    eyebrow: "Interval",
                    value: `[${lower}, ${upper}]`,
                    detail: `${singleSummary?.samples.length || 0} chart samples rendered.`,
                    tone: "info" as const,
                },
                {
                    eyebrow: "Quadrature",
                    value: `${singleSummary?.segmentsUsed || normalizedSegments} seg`,
                    detail: singleDiagnostics?.stability || "Awaiting stable estimate",
                    tone: summaryTone,
                },
            ];
        }

        if (mode === "double") {
            const renderTone: "success" | "neutral" = summary ? "success" : "neutral";
            return [
                {
                    eyebrow: "Render source",
                    value: summary ? "Surface field" : "Preview",
                    detail: `${doubleDiagnostics?.sampleCount || 0} accepted samples.`,
                    tone: renderTone,
                },
                {
                    eyebrow: "Domain",
                    value: `${normalizedXResolution} x ${normalizedYResolution}`,
                    detail: `x:[${xMin}, ${xMax}], y:[${yMin}, ${yMax}]`,
                    tone: "info" as const,
                },
                {
                    eyebrow: "Amplitude",
                    value: `${LaboratoryFormattingService.formatMetric(doubleDiagnostics?.peak, 4)}`,
                    detail: `Mean ${LaboratoryFormattingService.formatMetric(doubleDiagnostics?.mean, 4)}`,
                    tone: "success" as const,
                },
            ];
        }

        return [
            {
                eyebrow: "Render source",
                value: summary ? "Volume field" : "Preview",
                detail: `${tripleDiagnostics?.sampleCount || 0} accepted samples.`,
                tone: summary ? "success" : "neutral",
            },
            {
                eyebrow: "Domain",
                value: `${normalizedXResolution} x ${normalizedYResolution} x ${normalizedZResolution}`,
                detail: `x:[${xMin}, ${xMax}], y:[${yMin}, ${yMax}], z:[${zMin}, ${zMax}]`,
                tone: "info" as const,
            },
            {
                eyebrow: "Voxel",
                value: LaboratoryFormattingService.formatMetric(tripleDiagnostics?.voxelVolume, 6),
                detail: `Peak ${LaboratoryFormattingService.formatMetric(tripleDiagnostics?.peak, 4)}`,
                tone: "success" as const,
            },
        ];
    }, [analyticSolution?.status, doubleDiagnostics?.mean, doubleDiagnostics?.peak, doubleDiagnostics?.sampleCount, isResultStale, lower, mode, normalizedSegments, normalizedXResolution, normalizedYResolution, normalizedZResolution, singleDiagnostics?.relativeSpread, singleDiagnostics?.stability, summary, tripleDiagnostics?.peak, tripleDiagnostics?.sampleCount, tripleDiagnostics?.voxelVolume, upper, xMax, xMin, yMax, yMin, zMax, zMin]);

    const methodTableRows = React.useMemo(() => {
        if (!summary) return [];
        if (mode === "single") {
            const ss = summary as SingleIntegralSummary;
            return [
                ["Simpson", LaboratoryFormattingService.formatMetric(ss.simpson, 8), singleDiagnostics?.stability || "--"],
                ["Midpoint", LaboratoryFormattingService.formatMetric(ss.midpoint, 8), "Reference"],
                ["Trapezoid", LaboratoryFormattingService.formatMetric(ss.trapezoid, 8), "Reference"],
            ];
        }
        if (mode === "double") {
            const ds = summary as DoubleIntegralSummary;
            return [
                ["Integral", LaboratoryFormattingService.formatMetric(ds.value, 8), "Surface estimate"],
                ["Grid cells", String(doubleDiagnostics?.gridCells || "--"), `${normalizedXResolution} x ${normalizedYResolution}`],
                ["Peak", LaboratoryFormattingService.formatMetric(doubleDiagnostics?.peak, 8), "Surface max"],
                ["Mean", LaboratoryFormattingService.formatMetric(doubleDiagnostics?.mean, 8), "Average height"],
            ];
        }
        const ts = summary as TripleIntegralSummary;
        return [
            ["Integral", LaboratoryFormattingService.formatMetric(ts.value, 8), "Volume estimate"],
            ["Grid cells", String(tripleDiagnostics?.gridCells || "--"), `${normalizedXResolution} x ${normalizedYResolution} x ${normalizedZResolution}`],
            ["Peak", LaboratoryFormattingService.formatMetric(ts.samples.reduce((max, s) => Math.max(max, s.value), 0), 8), "Density max"],
            ["Voxel", LaboratoryFormattingService.formatMetric(tripleDiagnostics?.voxelVolume, 8), "Cell volume"],
        ];
    }, [doubleDiagnostics, mode, normalizedXResolution, normalizedYResolution, normalizedZResolution, singleDiagnostics, summary, tripleDiagnostics]);

    const sampleTableRows = React.useMemo(() => {
        if (!summary) return [];
        if (mode === "single") return (summary as SingleIntegralSummary).samples.slice(0, 8).map(p => [LaboratoryFormattingService.formatMetric(p.x, 4), LaboratoryFormattingService.formatMetric(p.y, 6)]);
        if (mode === "double") return (summary as DoubleIntegralSummary).samples.slice(0, 8).map(p => [LaboratoryFormattingService.formatMetric(p.x, 4), LaboratoryFormattingService.formatMetric(p.y, 4), LaboratoryFormattingService.formatMetric(p.z, 6)]);
        return (summary as TripleIntegralSummary).samples.slice(0, 8).map(p => [LaboratoryFormattingService.formatMetric(p.x, 4), LaboratoryFormattingService.formatMetric(p.y, 4), LaboratoryFormattingService.formatMetric(p.z, 4), LaboratoryFormattingService.formatMetric(p.value, 6)]);
    }, [mode, summary]);

    const sweepTableRows = React.useMemo(() => {
        if (!sweepSeries) return [];
        return sweepSeries.summary.slice(0, 6).map((entry) =>
            "simpson" in entry
                ? [String(entry.x), LaboratoryFormattingService.formatMetric(entry.simpson, 8), LaboratoryFormattingService.formatMetric(entry.midpoint, 8), LaboratoryFormattingService.formatMetric(entry.trapezoid, 8)]
                : [String(entry.x), LaboratoryFormattingService.formatMetric(entry.estimate, 8), String(entry.sampleCount), "zGrid" in entry ? String(entry.zGrid) : "--"]
        );
    }, [sweepSeries]);

    const resultLevelCards = React.useMemo(() => {
        if (!summary) return [];
        if (mode === "single") {
            const singleValue = (summary as SingleIntegralSummary).simpson;
            return [
                { label: "Fast", summary: `Integral qiymati taxminan **${LaboratoryFormattingService.formatMetric(singleValue, 8)}** ga teng.`, tone: "text-sky-600" },
                { label: "Technical", summary: `Simpson, midpoint va trapezoid orasidagi spread **${LaboratoryFormattingService.formatMetric(singleDiagnostics?.spread || 0, 6)}** bo‘ldi.`, tone: "text-emerald-600" },
                { label: "Research", summary: "Single integral uchun convergence va method drift audit qilindi.", tone: "text-amber-600" },
            ];
        }
        if (mode === "double") {
            const ds = summary as DoubleIntegralSummary;
            return [
                { label: "Fast", summary: `2D integral estimate **${LaboratoryFormattingService.formatMetric(ds.value, 8)}** bo‘ldi.`, tone: "text-sky-600" },
                { label: "Technical", summary: `Grid hajmi **${doubleDiagnostics?.gridCells || 0}** va peak height **${LaboratoryFormattingService.formatMetric(doubleDiagnostics?.peak, 6)}** bilan tekshirildi.`, tone: "text-emerald-600" },
                { label: "Research", summary: "Surface profile va grid sweep orqali reliefning qaysi qismi integralga ko‘proq ta’sir qilishi ko‘riladi.", tone: "text-amber-600" },
            ];
        }
        const ts = summary as TripleIntegralSummary;
        return [
            { label: "Fast", summary: `3D integral estimate **${LaboratoryFormattingService.formatMetric(ts.value, 8)}** bo‘ldi.`, tone: "text-sky-600" },
            { label: "Technical", summary: `Voxel count **${tripleDiagnostics?.gridCells || 0}** va voxel volume **${LaboratoryFormattingService.formatMetric(tripleDiagnostics?.voxelVolume, 6)}** bilan audit qilindi.`, tone: "text-emerald-600" },
            { label: "Research", summary: "Volumetric density sample, x-profile va grid sensitivity birga tahlil qilinadi.", tone: "text-amber-600" },
        ];
    }, [doubleDiagnostics, mode, singleDiagnostics, summary, tripleDiagnostics]);

    const compareOverviewCards = React.useMemo<Array<{ eyebrow: string; value: string; detail: string; tone: "neutral" | "info" | "success" | "warn" }>>(() => {
        const warningCount = visibleSignals.filter((item) => item.tone !== "info").length;
        const trustTone: "neutral" | "info" | "success" | "warn" = warningCount === 0 ? "success" : warningCount < 3 ? "warn" : "warn";

        if (mode === "single" && summary) {
            const singleSummary = summary as SingleIntegralSummary;
            return [
                {
                    eyebrow: "Primary result",
                    value: LaboratoryFormattingService.formatMetric(singleSummary.simpson, 6),
                    detail: analyticSolution?.status === "exact" ? "Exact backend check available." : "Simpson composite is the active estimate.",
                    tone: analyticSolution?.status === "exact" ? "success" : "info",
                },
                {
                    eyebrow: "Delta check",
                    value: LaboratoryFormattingService.formatMetric(singleDiagnostics?.spread || 0, 6),
                    detail: `Midpoint/trapezoid spread: ${singleDiagnostics?.stability || "Pending"}`,
                    tone: (singleDiagnostics?.relativeSpread || 0) < 0.06 ? "success" : "warn",
                },
                {
                    eyebrow: "Risk load",
                    value: `${warningCount}`,
                    detail: warningCount === 0 ? "No active warnings or domain blockers." : "Warnings and domain signals require review.",
                    tone: trustTone,
                },
            ];
        }

        if (mode === "double" && summary) {
            const doubleSummary = summary as DoubleIntegralSummary;
            return [
                {
                    eyebrow: "Primary result",
                    value: LaboratoryFormattingService.formatMetric(doubleSummary.value, 6),
                    detail: "2D midpoint grid estimate.",
                    tone: "info",
                },
                {
                    eyebrow: "Surface signal",
                    value: `${LaboratoryFormattingService.formatMetric(doubleDiagnostics?.peak, 4)} / ${LaboratoryFormattingService.formatMetric(doubleDiagnostics?.mean, 4)}`,
                    detail: "Peak / mean profile from accepted samples.",
                    tone: "success",
                },
                {
                    eyebrow: "Risk load",
                    value: `${warningCount}`,
                    detail: warningCount === 0 ? "No active warnings or domain blockers." : "Warnings and domain signals require review.",
                    tone: trustTone,
                },
            ];
        }

        if (mode === "triple" && summary) {
            const tripleSummary = summary as TripleIntegralSummary;
            return [
                {
                    eyebrow: "Primary result",
                    value: LaboratoryFormattingService.formatMetric(tripleSummary.value, 6),
                    detail: "3D voxel midpoint estimate.",
                    tone: "info",
                },
                {
                    eyebrow: "Volume signal",
                    value: LaboratoryFormattingService.formatMetric(tripleDiagnostics?.voxelVolume, 6),
                    detail: `Peak density ${LaboratoryFormattingService.formatMetric(tripleDiagnostics?.peak, 4)}`,
                    tone: "success",
                },
                {
                    eyebrow: "Risk load",
                    value: `${warningCount}`,
                    detail: warningCount === 0 ? "No active warnings or domain blockers." : "Warnings and domain signals require review.",
                    tone: trustTone,
                },
            ];
        }

        return [
            {
                eyebrow: "Compare state",
                value: "Pending",
                detail: "Solve yoki numerical confirmationdan keyin comparison cards to'ladi.",
                tone: "neutral",
            },
        ];
    }, [analyticSolution?.status, doubleDiagnostics?.mean, doubleDiagnostics?.peak, mode, singleDiagnostics?.relativeSpread, singleDiagnostics?.spread, singleDiagnostics?.stability, summary, tripleDiagnostics?.peak, tripleDiagnostics?.voxelVolume, visibleSignals]);

    const benchmarkSummary = React.useMemo(
        () => evaluateIntegralBenchmark({ mode, expression, lower, upper, analyticSolution, summary }),
        [analyticSolution, expression, lower, mode, summary, upper],
    );

    const riskRegisterCards = React.useMemo<Array<{ eyebrow: string; value: string; detail: string; tone: "neutral" | "info" | "success" | "warn" }>>(() => {
        const cards: Array<{ eyebrow: string; value: string; detail: string; tone: "neutral" | "info" | "success" | "warn" }> = [];

        if (blockingValidationCount > 0) {
            cards.push({
                eyebrow: "Validation",
                value: `${blockingValidationCount} blocker`,
                detail: "Input bounds yoki expression hali to'liq yaroqli emas.",
                tone: "warn",
            });
        }

        if (warningSignals.length) {
            cards.push({
                eyebrow: "Runtime",
                value: `${warningSignals.length} warning`,
                detail: warningSignals[0]?.text || "Solver warning mavjud.",
                tone: "warn",
            });
        }

        if (diagnosticsSnapshot.hazardDetails.length) {
            cards.push({
                eyebrow: diagnosticsSnapshot.hazardDetails[0].label,
                value: diagnosticsSnapshot.hazardDetails[0].severity === "warn" ? "Active" : "Watch",
                detail: diagnosticsSnapshot.hazardDetails[0].detail,
                tone: "warn",
            });
        }

        if (diagnosticsSnapshot.domainConstraints.length) {
            cards.push({
                eyebrow: "Domain risk",
                value: diagnosticsSnapshot.domainConstraints[0].label,
                detail: diagnosticsSnapshot.domainConstraints[0].detail,
                tone: "warn",
            });
        }

        if (diagnosticsSnapshot.research.readiness_label !== "pending") {
            cards.push({
                eyebrow: "Research audit",
                value: diagnosticsSnapshot.research.readiness_label,
                detail: diagnosticsSnapshot.research.review_notes[0] || `risk ${diagnosticsSnapshot.research.domain_risk_level}`,
                tone: diagnosticsSnapshot.research.domain_risk_level === "low" ? "success" : "warn",
            });
        }

        if (benchmarkSummary?.status === "review") {
            cards.push({
                eyebrow: "Benchmark",
                value: "Review",
                detail: benchmarkSummary.detail,
                tone: "warn",
            });
        }

        if (!cards.length) {
            cards.push({
                eyebrow: "Risk register",
                value: "Clean",
                detail: "Hozircha keskin domain yoki runtime risk signal topilmadi.",
                tone: "success",
            });
        }

        return cards.slice(0, 4);
    }, [benchmarkSummary, blockingValidationCount, diagnosticsSnapshot.domainConstraints, diagnosticsSnapshot.hazardDetails, diagnosticsSnapshot.research.domain_risk_level, diagnosticsSnapshot.research.readiness_label, diagnosticsSnapshot.research.review_notes, warningSignals]);

    const reportSkeletonMarkdown = React.useMemo(() => {
        if (!summary) return "- Solver natijasi tayyor bo'lgach full research report quriladi.";
        const exact = analyticSolution?.exact;
        const reproducibility = analyticSolution?.reproducibility;
        const formatTitles: Record<ReportGeneratorFormat, string> = {
            "student-solution": "Student Solution",
            "teacher-explanation": "Teacher Explanation",
            "scientific-report": "Scientific Report",
            "lab-report": "Lab Report",
            "code-appendix": "Code Appendix",
            "latex-paper-section": "LaTeX Paper Section",
        };
        const formatFocus: Record<ReportGeneratorFormat, string> = {
            "student-solution": "Show a clean step-by-step solution, then verify the answer and state the final result.",
            "teacher-explanation": "Explain why the selected method works, where students can make mistakes, and how the result is checked.",
            "scientific-report": "Document the computational method, symbolic/numerical agreement, assumptions, limitations, and reproducibility metadata.",
            "lab-report": "Record objective, procedure, observation, result, interpretation, and conclusion in laboratory style.",
            "code-appendix": "Prioritize reproducible code, inputs, engine metadata, and exact/numerical outputs for rerun.",
            "latex-paper-section": "Produce a concise academic section suitable for inserting into a LaTeX manuscript.",
        };
        const title = `# ${formatTitles[reportFormat]}: Integral Analysis\n\n## Title\nIntegral analysis of "${expression || "untitled expression"}"`;
        const objective = `\n\n## Objective\n${formatFocus[reportFormat]} Preserve enough computation metadata for later Writer import and laboratory reopening.`;
        const problemStatement = mode === "single"
            ? `\n\n## Problem Statement\nCompute\n\n$$\\int_{${lower || "a"}}^{${upper || "b"}} ${analyticSolution?.parser?.expression_latex || expression} \\, dx$$\n\nInput expression: "${expression}".\nBounds: lower="${lower}", upper="${upper}".`
            : `\n\n## Problem Statement\nCompute a ${mode} integral for "${expression}" over the configured coordinate ranges.`;
        const method = `\n\n## Method\n- Selected method: ${reproducibility?.method || solveMethod}\n- Method family: ${reproducibility?.method_family || "hybrid"}\n- Engine: ${reproducibility?.engine || "sympy/manual-js-hybrid"}\n- Numeric strategy: ${reproducibility?.numeric_strategy || "frontend estimator / symbolic decimal check"}\n- Adapter status: ${reproducibility?.adapter_status || "active"}\n\n${methodAuditMarkdown}`;
        const symbolicSolution = `\n\n## Solution\n${exact?.antiderivative_latex ? `Antiderivative:\n\n$$F(x)=${exact.antiderivative_latex}$$\n` : "Antiderivative was not produced for this lane.\n"}${exact?.evaluated_latex ? `Exact evaluated result:\n\n$$${exact.evaluated_latex}$$` : "Exact evaluated result is unavailable or not applicable."}`;
        const numericalFallback = mode === "single"
            ? `\n\n## Numerical Fallback\n- Simpson estimate: ${LaboratoryFormattingService.formatMetric((summary as SingleIntegralSummary).simpson, 10)}\n- Midpoint estimate: ${LaboratoryFormattingService.formatMetric((summary as SingleIntegralSummary).midpoint, 10)}\n- Trapezoid estimate: ${LaboratoryFormattingService.formatMetric((summary as SingleIntegralSummary).trapezoid, 10)}\n- Method spread: ${LaboratoryFormattingService.formatMetric(singleDiagnostics?.spread, 10)}\n- Backend decimal check: ${exact?.numeric_approximation || "not available"}`
            : `\n\n## Numerical Fallback\n- Grid estimate: ${LaboratoryFormattingService.formatMetric(mode === "double" ? (summary as DoubleIntegralSummary).value : (summary as TripleIntegralSummary).value, 10)}\n- Resolution: ${mode === "double" ? `${normalizedXResolution} x ${normalizedYResolution}` : `${normalizedXResolution} x ${normalizedYResolution} x ${normalizedZResolution}`}`;
        const visualization = `\n\n## Graph Interpretation\nThe laboratory visualization panel renders the integrand geometry, sampled trace/grid, and result overlays. Positive and negative area/volume regions should be interpreted with the selected coordinate system and domain restrictions. For exported reports, include the current plot screenshot from the laboratory UI when preparing a final manuscript.`;
        const interpretation = `\n\n## Interpretation\n- Solver state: ${solverStatusText}\n- Readiness: ${diagnosticsSnapshot.research.readiness_label}\n- Exactness tier: ${diagnosticsSnapshot.research.exactness_tier}\n- Domain risk: ${diagnosticsSnapshot.research.domain_risk_level}\n- Primary review note: ${diagnosticsSnapshot.research.review_notes[0] || "none"}`;
        const verification = `\n\n## Verification\n${verificationLayerCards.map((card) => `- **${card.eyebrow}:** ${card.value} - ${card.detail}`).join("\n")}`;
        const limitations = `\n\n## Limitations\n- Blockers: ${diagnosticsSnapshot.research.blocker_count}\n- Hazard warnings: ${diagnosticsSnapshot.research.hazard_count}\n- Domain constraints: ${diagnosticsSnapshot.domainConstraints.length ? diagnosticsSnapshot.domainConstraints.join("; ") : "none detected"}\n- Numerical fallback should be independently tightened for publication-grade tolerance if the selected method adapter is code-ready/planned.`;
        const codeAppendix = `\n\n## Code Appendix\n\`\`\`python\n${reproducibility?.code || "Run analytic solve to attach backend reproducibility code."}\n\`\`\``;
        const references = `\n\n## References\n- SymPy documentation: symbolic integration and expression simplification.\n- SciPy documentation: adaptive quadrature and numerical integration methods.\n- MathSphere Laboratory saved-result schema: canonical bridge payload with input snapshot, computation metadata, and provenance.`;
        const assumptionsSection = `\n\n## Assumptions & Domains\n${assumptionsMarkdown}`;
        const researchSection = `\n\n## Research Contract\n- Readiness: ${diagnosticsSnapshot.research.readiness_label}\n- Exactness tier: ${diagnosticsSnapshot.research.exactness_tier}\n- Domain risk: ${diagnosticsSnapshot.research.domain_risk_level}\n- Blockers: ${diagnosticsSnapshot.research.blocker_count}\n- Hazard warnings: ${diagnosticsSnapshot.research.hazard_count}\n- Review note: ${diagnosticsSnapshot.research.review_notes[0] || "none"}`;
        const benchmarkSection = benchmarkSummary
            ? `\n\n## Benchmark Confidence\n- Benchmark: ${benchmarkSummary.label}\n- Status: ${benchmarkSummary.status}\n- Expected: ${benchmarkSummary.expectedValue}\n- Actual: ${benchmarkSummary.actualValue}\n- Detail: ${benchmarkSummary.detail}`
            : "";
        const trustSection = `\n\n## Export & Bridge\n- Export state: ${summary && !solverWarning ? "Ready" : "Blocked"}\n- Writer bridge: saved laboratory result can be imported later from Writer's saved-result import block.\n- Available exports: PDF print, LaTeX source, Word-compatible document, Writer bridge.`;
        const conclusion = `\n\n## Conclusion\nThe reported result is ${diagnosticsSnapshot.research.readiness_label.toLowerCase()} with ${diagnosticsSnapshot.research.domain_risk_level} domain risk. Use the exact symbolic solution when available; otherwise treat the numerical fallback as an approximation that should be tightened before publication.`;
        return [
            title,
            objective,
            problemStatement,
            method,
            symbolicSolution,
            numericalFallback,
            visualization,
            interpretation,
            verification,
            limitations,
            assumptionsSection,
            researchSection,
            benchmarkSection,
            codeAppendix,
            references,
            trustSection,
            conclusion,
        ].filter(Boolean).join("");
    }, [analyticSolution, assumptionsMarkdown, benchmarkSummary, diagnosticsSnapshot.domainConstraints, diagnosticsSnapshot.research.blocker_count, diagnosticsSnapshot.research.domain_risk_level, diagnosticsSnapshot.research.exactness_tier, diagnosticsSnapshot.research.hazard_count, diagnosticsSnapshot.research.readiness_label, diagnosticsSnapshot.research.review_notes, expression, lower, methodAuditMarkdown, mode, normalizedXResolution, normalizedYResolution, normalizedZResolution, reportFormat, singleDiagnostics?.spread, solveMethod, solverStatusText, solverWarning, summary, upper, verificationLayerCards]);

    const reportExecutiveCards = React.useMemo<Array<{ eyebrow: string; value: string; detail: string; tone: "neutral" | "info" | "success" | "warn" }>>(() => {
        if (!summary) {
            return [
                {
                    eyebrow: "Report state",
                    value: "Pending",
                    detail: "To'liq report packet solve yoki numerical confirmationdan keyin tayyor bo'ladi.",
                    tone: "neutral",
                },
            ];
        }

        if (mode === "single") {
            const singleSummary = summary as SingleIntegralSummary;
            return [
                {
                    eyebrow: "Result",
                    value: LaboratoryFormattingService.formatMetric(singleSummary.simpson, 6),
                    detail: analyticSolution?.status === "exact" ? "Exact result verified." : "Simpson composite estimate.",
                    tone: analyticSolution?.status === "exact" ? "success" : "info",
                },
                {
                    eyebrow: "Trust",
                    value: diagnosticsSnapshot.research.readiness_label,
                    detail: warningSignals.length ? "Warnings mavjud, reportga diagnostic note qo'shish kerak." : diagnosticsSnapshot.research.review_notes[0] || "Current packet export-ready.",
                    tone: diagnosticsSnapshot.research.domain_risk_level === "low" ? "success" : "warn",
                },
                {
                    eyebrow: "Coverage",
                    value: `${assumptionCards.length + researchAuditCards.length}`,
                    detail: "Assumption va method audit signal'lari reportga kiritiladi.",
                    tone: "info",
                },
            ];
        }

        const resultValue = mode === "double"
            ? LaboratoryFormattingService.formatMetric((summary as DoubleIntegralSummary).value, 6)
            : LaboratoryFormattingService.formatMetric((summary as TripleIntegralSummary).value, 6);

        return [
            {
                eyebrow: "Result",
                value: resultValue,
                detail: mode === "double" ? "Surface estimate packet." : "Volume estimate packet.",
                tone: "info",
            },
            {
                eyebrow: "Trust",
                value: diagnosticsSnapshot.research.readiness_label,
                detail: warningSignals.length ? "Warnings mavjud, diagnostic section muhim." : diagnosticsSnapshot.research.review_notes[0] || "Current packet export-ready.",
                tone: diagnosticsSnapshot.research.domain_risk_level === "low" ? "success" : "warn",
            },
            {
                eyebrow: "Coverage",
                value: `${assumptionCards.length + researchAuditCards.length}`,
                detail: "Assumption va method audit signal'lari reportga kiritiladi.",
                tone: "info",
            },
        ];
    }, [analyticSolution?.status, assumptionCards.length, diagnosticsSnapshot.research.domain_risk_level, diagnosticsSnapshot.research.readiness_label, diagnosticsSnapshot.research.review_notes, mode, researchAuditCards.length, summary, warningSignals.length]);

    const reportReadinessCards = React.useMemo<Array<{ eyebrow: string; value: string; detail: string; tone: "neutral" | "info" | "success" | "warn" }>>(() => ([
        {
            eyebrow: "Assumptions",
            value: `${assumptionCards.length}`,
            detail: assumptionCards.length ? "Domain va coordinate signallari mavjud." : "Assumption signal topilmadi.",
            tone: assumptionCards.length ? "info" : "neutral",
        },
        {
            eyebrow: "Method audit",
            value: `${researchAuditCards.length}`,
            detail: "Computation pathway report packetga ulanadi.",
            tone: researchAuditCards.length ? "success" : "neutral",
        },
        {
            eyebrow: "Research",
            value: diagnosticsSnapshot.research.exactness_tier,
            detail: `risk ${diagnosticsSnapshot.research.domain_risk_level}, blockers ${diagnosticsSnapshot.research.blocker_count}`,
            tone: diagnosticsSnapshot.research.domain_risk_level === "low" ? "success" : "warn",
        },
        {
            eyebrow: "Notes",
            value: `${annotations.length}`,
            detail: annotations.length ? "Manual research notes mavjud." : "Reportga qo'shish uchun note yozilmagan.",
            tone: annotations.length ? "info" : "neutral",
        },
        {
            eyebrow: "Bridge",
            value: summary && !solverWarning ? "Ready" : "Blocked",
            detail: summary && !solverWarning ? "Copy, writer send, live push available." : "Export clean result kutmoqda.",
            tone: summary && !solverWarning ? "success" : "warn",
        },
    ]), [annotations.length, assumptionCards.length, diagnosticsSnapshot.research.blocker_count, diagnosticsSnapshot.research.domain_risk_level, diagnosticsSnapshot.research.exactness_tier, researchAuditCards.length, solverWarning, summary]);
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

    const statusBarCards = React.useMemo<StudioCard[]>(() => {
        const cards: StudioCard[] = [
            {
                eyebrow: "Type",
                value: classification.label,
                detail: classification.summary,
                tone: classification.support === "supported" ? "success" : classification.support === "partial" ? "info" : "warn",
            },
            {
                eyebrow: "Solve",
                value: analyticStatusCard.badge,
                detail: analyticStatusCard.body,
                tone: solvePhase === "exact-ready" ? "success" : solvePhase === "needs-numerical" ? "warn" : solvePhase === "analytic-loading" ? "info" : "neutral",
            },
            {
                eyebrow: "Engine",
                value: analyticSolution?.reproducibility?.engine || (activeTab === "code" ? "sympy" : "hybrid"),
                detail: analyticSolution?.reproducibility?.method || solveMethod,
                tone: "info",
            },
            {
                eyebrow: "Numeric",
                value: analyticSolution?.reproducibility?.numeric_strategy || (summary ? "ready" : "pending"),
                detail: summary ? "Numerical comparison data is available." : "Run solve or fallback to populate numeric data.",
                tone: summary ? "success" : "neutral",
            },
            {
                eyebrow: "Save",
                value: saveState === "saving" ? "saving" : saveState === "saved" ? "saved" : lastSavedResult ? `rev ${lastSavedResult.revision}` : "not saved",
                detail: saveError || (lastSavedResult ? lastSavedResult.title : "Use Save Bridge to store this result."),
                tone: saveState === "error" ? "warn" : saveState === "saved" || lastSavedResult ? "success" : "neutral",
            },
        ];
        return cards;
    }, [activeTab, analyticSolution?.reproducibility?.engine, analyticSolution?.reproducibility?.method, analyticSolution?.reproducibility?.numeric_strategy, analyticStatusCard.badge, analyticStatusCard.body, classification.label, classification.summary, classification.support, lastSavedResult, saveError, saveState, solveMethod, solvePhase, summary]);

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
                        analyticDerivationContent={analyticSolution?.status === "exact" ? buildExactSolutionMarkdown(analyticSolution) : buildNumericalPromptMarkdown(mode, analyticSolution)}
                        analyticDerivationAccentClassName={analyticSolution?.status === "exact" ? "text-emerald-600" : "text-amber-600"}
                        showMethodTrace={mode === "single" && !taxonomyLaneGuidance}
                        methodTraceContent={buildExactMethodMarkdown(analyticSolution)}
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
