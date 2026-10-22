import { LaboratoryFormattingService } from "@/components/laboratory/services/formatting-service";
import type { LaboratorySignal } from "@/components/laboratory/laboratory-signal-panel";
import type { VerificationCertificate } from "@/lib/laboratory-verification";
import type { ReportGeneratorFormat } from "@/components/laboratory/laboratory-report-layout";
import type { Locale } from "@/lib/i18n";
import type { StudioMetricCard, StudioTone } from "../presentation-types";
import type {
    IntegralAnalyticSolveResponse,
    IntegralClassification,
    IntegralComputationSummary,
    IntegralMode,
    SingleIntegralSummary,
    DoubleIntegralSummary,
    TripleIntegralSummary,
} from "../types";
import { buildNumericalPromptMarkdown } from "../utils";

export function buildTaxonomyLaneGuidance(classification: IntegralClassification) {
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
}

export function buildResultConsoleData(params: {
    analyticSolution: IntegralAnalyticSolveResponse | null;
    summary: IntegralComputationSummary | null;
    mode: IntegralMode;
    singleDiagnostics: any;
    solvePhase: string;
    solverStatusText: string;
    isUz: boolean;
    normalizedXResolution: number;
    normalizedYResolution: number;
    normalizedZResolution: number;
    warningCount: number;
}) {
    const {
        analyticSolution,
        summary,
        mode,
        singleDiagnostics,
        solverStatusText,
        isUz,
        normalizedXResolution,
        normalizedYResolution,
        normalizedZResolution,
        warningCount,
    } = params;

    if (analyticSolution?.status === "exact") {
        return {
            source: "exact",
            sourceLabel: isUz ? "Aniq natija" : "Exact result",
            sourceClassName: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
            headline: analyticSolution.exact.numeric_approximation || analyticSolution.exact.evaluated_latex || "Exact result",
            subline: analyticSolution.exact.method_label || (isUz ? "Ramziy soddalashtirish" : "Symbolic reduction"),
            latex: analyticSolution.exact.evaluated_latex ? `$$${analyticSolution.exact.evaluated_latex}$$` : null,
            confidenceLabel: isUz ? "Yuqori ishonch" : "High confidence",
            confidenceDetail: isUz ? "Ramziy yechuvchi yopiq shakldagi natijani qaytardi." : "The symbolic solver returned a closed-form result.",
            confidenceClassName: "text-emerald-700 dark:text-emerald-300",
            nextAction: warningCount > 0 ? (isUz ? "Taqqoslash bo‘limida signallar va sezgirlik tahlilini ko‘rib chiqing." : "Review signals and the sensitivity analysis in Compare.") : (isUz ? "Natijani Writer yoki Notebook’ga yuboring." : "Send the result to Writer or Notebook when ready."),
        };
    }
    if (summary && mode === "single") {
        const relativeSpread = singleDiagnostics?.relativeSpread || 0;
        return {
            source: "numerical",
            sourceLabel: isUz ? "Sonli natija" : "Numerical result",
            sourceClassName: "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300",
            headline: LaboratoryFormattingService.formatMetric((summary as SingleIntegralSummary).simpson, 6),
            subline: isUz ? "Simpson bahosi" : "Simpson estimate",
            latex: null,
            confidenceLabel: relativeSpread < 0.02 ? (isUz ? "Yuqori ishonch" : "High confidence") : relativeSpread < 0.06 ? (isUz ? "O‘rtacha ishonch" : "Moderate confidence") : (isUz ? "Tekshiruv zarur" : "Review required"),
            confidenceDetail: relativeSpread < 0.02 ? (isUz ? "Usullar orasidagi farq juda kichik." : "The numerical methods agree closely.") : relativeSpread < 0.06 ? (isUz ? "Baho ishlatilishi mumkin, ammo taqqoslash foydali." : "The estimate is usable; comparison is recommended.") : (isUz ? "Usullar orasidagi farq sezilarli; segmentlar sonini oshiring." : "Method spread is material; increase the number of segments."),
            confidenceClassName: relativeSpread < 0.02 ? "text-emerald-700 dark:text-emerald-300" : relativeSpread < 0.06 ? "text-amber-700 dark:text-amber-300" : "text-rose-700 dark:text-rose-300",
            nextAction: warningCount > 0 ? (isUz ? "Sezgirlik tahlili va taqqoslash orqali barqarorlikni tekshiring." : "Review stability through the sensitivity and comparison views.") : (isUz ? "Natijani Writer yoki Notebook’ga yuborish mumkin." : "The result can be sent to Writer or Notebook."),
        };
    }
    if (summary && mode === "double") {
        return {
            source: "numerical",
            sourceLabel: isUz ? "Sirt bahosi" : "Surface estimate",
            sourceClassName: "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300",
            headline: LaboratoryFormattingService.formatMetric((summary as DoubleIntegralSummary).value, 6),
            subline: isUz ? `${normalizedXResolution} × ${normalizedYResolution} hisoblash to‘ri` : `${normalizedXResolution} × ${normalizedYResolution} grid`,
            latex: null,
            confidenceLabel: warningCount > 1 ? (isUz ? "O‘rtacha ishonch" : "Moderate confidence") : (isUz ? "Barqaror to‘r" : "Stable grid"),
            confidenceDetail: warningCount > 1 ? (isUz ? "To‘r va soha signallarini qayta ko‘rib chiqing." : "Review the grid and domain signals.") : (isUz ? "Sirt to‘ri bo‘yicha baho tayyor." : "The surface-grid estimate is ready."),
            confidenceClassName: warningCount > 1 ? "text-amber-700 dark:text-amber-300" : "text-emerald-700 dark:text-emerald-300",
            nextAction: isUz ? "Vizualizatsiya va jadvallar bo‘limida maksimum hamda profillarni tekshiring." : "Review peaks and profiles in the visualization and tables views.",
        };
    }
    if (summary && mode === "triple") {
        return {
            source: "numerical",
            sourceLabel: isUz ? "Hajmiy baho" : "Volume estimate",
            sourceClassName: "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300",
            headline: LaboratoryFormattingService.formatMetric((summary as TripleIntegralSummary).value, 6),
            subline: isUz ? `${normalizedXResolution} × ${normalizedYResolution} × ${normalizedZResolution} hisoblash to‘ri` : `${normalizedXResolution} × ${normalizedYResolution} × ${normalizedZResolution} grid`,
            latex: null,
            confidenceLabel: warningCount > 1 ? (isUz ? "O‘rtacha ishonch" : "Moderate confidence") : (isUz ? "Tadqiqot ko‘rigi" : "Research preview"),
            confidenceDetail: warningCount > 1 ? (isUz ? "Hajmiy to‘rni zichlashtirib, qayta tekshiring." : "Increase the volumetric-grid resolution and verify again.") : (isUz ? "Joriy voksel to‘ri bo‘yicha baho tayyor." : "The estimate is ready for the current voxel grid."),
            confidenceClassName: warningCount > 1 ? "text-amber-700 dark:text-amber-300" : "text-emerald-700 dark:text-emerald-300",
            nextAction: isUz ? "Zichlik profilini ko‘rib, natijani hisobot tuzilmasida hujjatlashtiring." : "Review the density profile and document the result in the report structure.",
        };
    }
    return {
        source: "idle",
        sourceLabel: "Awaiting Solve",
        sourceClassName: "border-border/60 bg-background/70 text-muted-foreground",
        headline: isUz ? "Natija hali mavjud emas" : "No result yet",
        subline: solverStatusText,
        latex: null,
        confidenceLabel: isUz ? "Ishonchlilik hali baholanmagan" : "Confidence not yet assessed",
        confidenceDetail: isUz ? "Formula va soha tayyor bo‘lgach yechish ishga tushadi." : "Solve will run once the formula and domain are ready.",
        confidenceClassName: "text-muted-foreground",
        nextAction: isUz ? "Masalani tekshiring va analitik yoki sonli yechishni ishga tushiring." : "Review the problem and run an analytical or numerical solve.",
    };
}

export function buildWorkflowReadinessCards(params: {
    solverStatusText: string;
    analyticSolution: IntegralAnalyticSolveResponse | null;
    summary: IntegralComputationSummary | null;
    solvePhase: string;
    blockingValidationCount: number;
    solverWarning: boolean;
}): StudioMetricCard[] {
    const { solverStatusText, analyticSolution, summary, solvePhase, blockingValidationCount, solverWarning } = params;
    return [
        {
            eyebrow: "Solve",
            value: solverStatusText,
            detail: analyticSolution?.status === "exact" ? "Exact solver javob berdi." : summary ? "Numerik result tayyor." : "Solve hali kutilyapti.",
            tone: analyticSolution?.status === "exact" || summary ? "success" : solvePhase === "error" ? "warn" : "info",
        },
        {
            eyebrow: "Validation",
            value: blockingValidationCount > 0 ? `${blockingValidationCount} blocker` : "Clean",
            detail: blockingValidationCount > 0 ? "Inputda to'g'rilanishi kerak bo'lgan maydonlar bor." : "Input oqimi hozir yaroqli.",
            tone: blockingValidationCount > 0 ? "warn" : "success",
        },
        {
            eyebrow: "Visuals",
            value: summary ? "Ready" : "Waiting",
            detail: summary ? "Grafik va sample data tayyor." : "Vizual qatlam solve natijasini kutmoqda.",
            tone: summary ? "success" : "neutral",
        },
        {
            eyebrow: "Export",
            value: summary && !solverWarning ? "Ready" : "Blocked",
            detail: summary && !solverWarning ? "Report va writer bridge ishlaydi." : "Toza natija chiqmaguncha export bloklangan.",
            tone: summary && !solverWarning ? "success" : "warn",
        },
    ];
}

export function buildSolveOverviewCards(params: {
    resultConsoleData: ReturnType<typeof buildResultConsoleData>;
    mode: IntegralMode;
    summary: IntegralComputationSummary | null;
    singleDiagnostics: any;
    normalizedXResolution: number;
    normalizedYResolution: number;
    normalizedZResolution: number;
    doubleDiagnostics: any;
    tripleDiagnostics: any;
}): StudioMetricCard[] {
    const {
        resultConsoleData,
        mode,
        summary,
        singleDiagnostics,
        normalizedXResolution,
        normalizedYResolution,
        normalizedZResolution,
        doubleDiagnostics,
        tripleDiagnostics,
    } = params;

    const cards: StudioMetricCard[] = [
        { eyebrow: "Result", value: resultConsoleData.headline, detail: resultConsoleData.subline, tone: resultConsoleData.source === "idle" ? "neutral" : resultConsoleData.source === "exact" ? "success" : "info" },
        { eyebrow: "Source", value: resultConsoleData.sourceLabel, detail: resultConsoleData.nextAction, tone: resultConsoleData.source === "exact" ? "success" : resultConsoleData.source === "numerical" ? "info" : "neutral" },
        { eyebrow: "Confidence", value: resultConsoleData.confidenceLabel, detail: resultConsoleData.confidenceDetail, tone: resultConsoleData.confidenceLabel === "High trust" || resultConsoleData.confidenceLabel === "High confidence" || resultConsoleData.confidenceLabel === "Yuqori ishonch" || resultConsoleData.confidenceLabel === "Stable grid" || resultConsoleData.confidenceLabel === "Barqaror to‘r" ? "success" : resultConsoleData.confidenceLabel === "No confidence yet" || resultConsoleData.confidenceLabel === "Confidence not yet assessed" || resultConsoleData.confidenceLabel === "Ishonchlilik hali baholanmagan" ? "neutral" : "warn" },
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
}

export function buildAnalyticStatusCard(params: {
    classification: IntegralClassification;
    taxonomyLaneGuidance: ReturnType<typeof buildTaxonomyLaneGuidance>;
    analyticSolution: IntegralAnalyticSolveResponse | null;
    solvePhase: string;
    summary: IntegralComputationSummary | null;
    mode: IntegralMode;
    locale: Locale;
}) {
    const { classification, taxonomyLaneGuidance, analyticSolution, solvePhase, summary, mode, locale } = params;

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
        body: buildNumericalPromptMarkdown(mode, analyticSolution, locale),
        badge: "Guidance",
        toneClass: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    };
}

export function buildAssumptionsMarkdown(params: {
    coordinates: string;
    taxonomyLaneGuidance: ReturnType<typeof buildTaxonomyLaneGuidance>;
    mode: IntegralMode;
    lower: string;
    upper: string;
    xMin: string;
    xMax: string;
    yMin: string;
    yMax: string;
    zMin: string;
    zMax: string;
    diagnosticsSnapshot: any;
    analyticSolution: IntegralAnalyticSolveResponse | null;
}): string {
    const {
        coordinates,
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
    } = params;

    const assumptions: string[] = [];
    assumptions.push(`- Coordinate system: **${coordinates}**.`);
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
        diagnosticsSnapshot.domainConstraints.forEach((constraint: any) => assumptions.push(`- ${constraint.label}: ${constraint.detail}`));
    }
    if (diagnosticsSnapshot.domainBlockers.length) {
        assumptions.push(`- Active blockers: ${diagnosticsSnapshot.domainBlockers.join(", ")}.`);
    }
    if (diagnosticsSnapshot.domainAssumptions.length) {
        diagnosticsSnapshot.domainAssumptions.forEach((assumption: string) => assumptions.push(`- ${assumption}`));
    }
    if (diagnosticsSnapshot.hazardDetails.length) {
        diagnosticsSnapshot.hazardDetails.forEach((hazard: any) => assumptions.push(`- Hazard (${hazard.label}): ${hazard.detail}`));
    }
    if (diagnosticsSnapshot.piecewiseRegions.length) {
        assumptions.push(`- Piecewise region analysis active: **${diagnosticsSnapshot.piecewiseSource}** source.`);
        diagnosticsSnapshot.piecewiseRegions.forEach((branch: any) => {
            assumptions.push(`- Region ${branch.region}: ${branch.behavior}`);
        });
    }
    if (analyticSolution?.parser.notes.length) {
        assumptions.push(`- Parser normalization notes: ${analyticSolution.parser.notes.join(" ")}`);
    }
    if (diagnosticsSnapshot.research.review_notes.length) {
        diagnosticsSnapshot.research.review_notes.forEach((note: string) => assumptions.push(`- Research review: ${note}`));
    }

    return assumptions.join("\n");
}

export function buildMethodAuditMarkdown(params: {
    mode: IntegralMode;
    taxonomyLaneGuidance: ReturnType<typeof buildTaxonomyLaneGuidance>;
    analyticSolution: IntegralAnalyticSolveResponse | null;
    diagnosticsSnapshot: any;
    singleDiagnostics: any;
    doubleDiagnostics: any;
    tripleDiagnostics: any;
    normalizedXResolution: number;
    normalizedYResolution: number;
    normalizedZResolution: number;
}): string {
    const {
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
    } = params;

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
}

export function buildAssumptionCards(params: {
    coordinates: string;
    mode: IntegralMode;
    lower: string;
    upper: string;
    xMin: string;
    xMax: string;
    yMin: string;
    yMax: string;
    zMin: string;
    zMax: string;
    classification: IntegralClassification;
    analyticSolution: IntegralAnalyticSolveResponse | null;
    diagnosticsSnapshot: any;
    taxonomyLaneGuidance: ReturnType<typeof buildTaxonomyLaneGuidance>;
}): StudioMetricCard[] {
    const {
        coordinates,
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
    } = params;

    const cards: StudioMetricCard[] = [
        {
            eyebrow: "Coordinates",
            value: coordinates,
            detail:
                mode === "single"
                    ? `${lower} < x < ${upper}`
                    : mode === "double"
                      ? `x:[${xMin}, ${xMax}], y:[${yMin}, ${yMax}]`
                      : `x:[${xMin}, ${xMax}], y:[${yMin}, ${yMax}], z:[${zMin}, ${zMax}]`,
            tone: "info",
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
        const poleHazard = diagnosticsSnapshot.hazardDetails.find((item: any) => item.kind === "pole") || diagnosticsSnapshot.hazardDetails[0];
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
        diagnosticsSnapshot.domainConstraints.slice(0, 2).forEach((constraint: any, index: number) => {
            cards.push({
                eyebrow: index === 0 ? "Domain rule" : "Constraint",
                value: constraint.label,
                detail: constraint.detail,
                tone: constraint.severity === "blocker" ? "warn" : "info",
            });
        });
    }
    if (diagnosticsSnapshot.domainBlockers.length) {
        cards.push({
            eyebrow: "Blockers",
            value: `${diagnosticsSnapshot.domainBlockers.length}`,
            detail: diagnosticsSnapshot.domainBlockers.join(", "),
            tone: "warn",
        });
    }
    if (analyticSolution?.parser.notes.length) {
        cards.push({
            eyebrow: "Parser",
            value: `${analyticSolution.parser.notes.length} notes`,
            detail: analyticSolution.parser.notes[0],
            tone: "neutral",
        });
    }
    if (diagnosticsSnapshot.piecewiseRegions.length) {
        const firstRegion = diagnosticsSnapshot.piecewiseRegions[0];
        cards.push({
            eyebrow: "Piecewise",
            value: `${diagnosticsSnapshot.piecewiseRegions.length} regions`,
            detail: firstRegion ? `${firstRegion.region}: ${firstRegion.behavior}` : "Branch split detected.",
            tone: "info",
        });
    }
    if (taxonomyLaneGuidance) {
        cards.push({
            eyebrow: "Lane",
            value: taxonomyLaneGuidance.title,
            detail: "Scalar solver o'rniga taxonomy guidance va future lane mapping ishlaydi.",
            tone: "info",
        });
    }

    return cards.slice(0, 4);
}

export function buildMethodAuditCards(params: {
    mode: IntegralMode;
    taxonomyLaneGuidance: ReturnType<typeof buildTaxonomyLaneGuidance>;
    analyticSolution: IntegralAnalyticSolveResponse | null;
    classification: IntegralClassification;
    summary: IntegralComputationSummary | null;
    normalizedSegments: number;
    singleDiagnostics: any;
    doubleDiagnostics: any;
    tripleDiagnostics: any;
    normalizedXResolution: number;
    normalizedYResolution: number;
    normalizedZResolution: number;
    diagnosticsSnapshot: any;
}): StudioMetricCard[] {
    const {
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
    } = params;

    const spreadTone: StudioTone = (singleDiagnostics?.relativeSpread || 0) < 0.06 ? "success" : "warn";

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
                tone: analyticSolution?.status === "exact" ? "success" : "info",
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
                tone: "neutral",
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
            { eyebrow: "Primary", value: "Midpoint grid", detail: "2D numerical surface integration is active.", tone: "info" },
            { eyebrow: "Grid", value: `${normalizedXResolution} x ${normalizedYResolution}`, detail: `${doubleDiagnostics?.sampleCount || 0} accepted surface samples.`, tone: "neutral" },
            { eyebrow: "Peak / Mean", value: `${LaboratoryFormattingService.formatMetric(doubleDiagnostics?.peak, 4)} / ${LaboratoryFormattingService.formatMetric(doubleDiagnostics?.mean, 4)}`, detail: "Measured directly from computed surface samples.", tone: "success" },
        ];
    }

    return [
        { eyebrow: "Primary", value: "Voxel midpoint", detail: "3D volumetric numerical integration is active.", tone: "info" },
        { eyebrow: "Grid", value: `${normalizedXResolution} x ${normalizedYResolution} x ${normalizedZResolution}`, detail: `${tripleDiagnostics?.sampleCount || 0} accepted volume samples.`, tone: "neutral" },
        { eyebrow: "Voxel", value: LaboratoryFormattingService.formatMetric(tripleDiagnostics?.voxelVolume, 6), detail: "Measured cell volume used by the estimate.", tone: "success" },
    ];
}

export function buildVerificationLayerCards(params: {
    verificationState: string;
    verificationCertificate: VerificationCertificate | null;
    analyticSolution: IntegralAnalyticSolveResponse | null;
    summary: IntegralComputationSummary | null;
    diagnosticsSnapshot: any;
}): StudioMetricCard[] {
    const { verificationState, verificationCertificate, analyticSolution, summary, diagnosticsSnapshot } = params;
    const cards: StudioMetricCard[] = [];

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
}

export function buildVisualizeOverviewCards(params: {
    isResultStale: boolean;
    summary: IntegralComputationSummary | null;
    analyticSolution: IntegralAnalyticSolveResponse | null;
    mode: IntegralMode;
    lower: string;
    upper: string;
    singleDiagnostics: any;
    doubleDiagnostics: any;
    tripleDiagnostics: any;
    normalizedSegments: number;
    normalizedXResolution: number;
    normalizedYResolution: number;
    normalizedZResolution: number;
    xMin: string;
    xMax: string;
    yMin: string;
    yMax: string;
    zMin: string;
    zMax: string;
}): StudioMetricCard[] {
    const {
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
    } = params;

    const staleTone: StudioTone = isResultStale ? "warn" : summary ? "success" : "neutral";
    const summaryTone: StudioTone = (singleDiagnostics?.relativeSpread || 0) < 0.06 ? "success" : "warn";

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
                tone: "info",
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
        const renderTone: StudioTone = summary ? "success" : "neutral";
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
                tone: "info",
            },
            {
                eyebrow: "Amplitude",
                value: `${LaboratoryFormattingService.formatMetric(doubleDiagnostics?.peak, 4)}`,
                detail: `Mean ${LaboratoryFormattingService.formatMetric(doubleDiagnostics?.mean, 4)}`,
                tone: "success",
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
            tone: "info",
        },
        {
            eyebrow: "Voxel",
            value: LaboratoryFormattingService.formatMetric(tripleDiagnostics?.voxelVolume, 6),
            detail: `Peak ${LaboratoryFormattingService.formatMetric(tripleDiagnostics?.peak, 4)}`,
            tone: "success",
        },
    ];
}

export function buildMethodTableRows(params: {
    summary: IntegralComputationSummary | null;
    mode: IntegralMode;
    singleDiagnostics: any;
    doubleDiagnostics: any;
    tripleDiagnostics: any;
    normalizedXResolution: number;
    normalizedYResolution: number;
    normalizedZResolution: number;
}): string[][] {
    const { summary, mode, singleDiagnostics, doubleDiagnostics, tripleDiagnostics, normalizedXResolution, normalizedYResolution, normalizedZResolution } = params;
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
}

export function buildSampleTableRows(summary: IntegralComputationSummary | null, mode: IntegralMode): string[][] {
    if (!summary) return [];
    if (mode === "single") {
        return (summary as SingleIntegralSummary).samples.slice(0, 8).map((p) => [LaboratoryFormattingService.formatMetric(p.x, 4), LaboratoryFormattingService.formatMetric(p.y, 6)]);
    }
    if (mode === "double") {
        return (summary as DoubleIntegralSummary).samples.slice(0, 8).map((p) => [LaboratoryFormattingService.formatMetric(p.x, 4), LaboratoryFormattingService.formatMetric(p.y, 4), LaboratoryFormattingService.formatMetric(p.z, 6)]);
    }
    return (summary as TripleIntegralSummary).samples.slice(0, 8).map((p) => [LaboratoryFormattingService.formatMetric(p.x, 4), LaboratoryFormattingService.formatMetric(p.y, 4), LaboratoryFormattingService.formatMetric(p.z, 4), LaboratoryFormattingService.formatMetric(p.value, 6)]);
}

export function buildSweepTableRows(sweepSeries: any): string[][] {
    if (!sweepSeries) return [];
    return sweepSeries.summary.slice(0, 6).map((entry: any) =>
        "simpson" in entry
            ? [String(entry.x), LaboratoryFormattingService.formatMetric(entry.simpson, 8), LaboratoryFormattingService.formatMetric(entry.midpoint, 8), LaboratoryFormattingService.formatMetric(entry.trapezoid, 8)]
            : [String(entry.x), LaboratoryFormattingService.formatMetric(entry.estimate, 8), String(entry.sampleCount), "zGrid" in entry ? String(entry.zGrid) : "--"]
    );
}

export function buildResultLevelCards(summary: IntegralComputationSummary | null, mode: IntegralMode, singleDiagnostics: any, doubleDiagnostics: any, tripleDiagnostics: any) {
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
}

export function buildCompareOverviewCards(params: {
    mode: IntegralMode;
    summary: IntegralComputationSummary | null;
    analyticSolution: IntegralAnalyticSolveResponse | null;
    singleDiagnostics: any;
    doubleDiagnostics: any;
    tripleDiagnostics: any;
    visibleSignals: LaboratorySignal[];
}): StudioMetricCard[] {
    const { mode, summary, analyticSolution, singleDiagnostics, doubleDiagnostics, tripleDiagnostics, visibleSignals } = params;
    const warningCount = visibleSignals.filter((item) => item.tone !== "info").length;
    const trustTone: StudioTone = warningCount === 0 ? "success" : "warn";

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
}

export function buildRiskRegisterCards(params: {
    blockingValidationCount: number;
    warningSignals: LaboratorySignal[];
    diagnosticsSnapshot: any;
    benchmarkSummary: any;
}): StudioMetricCard[] {
    const { blockingValidationCount, warningSignals, diagnosticsSnapshot, benchmarkSummary } = params;
    const cards: StudioMetricCard[] = [];

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
}

export function buildReportSkeletonMarkdown(params: {
    summary: IntegralComputationSummary | null;
    analyticSolution: IntegralAnalyticSolveResponse | null;
    expression: string;
    lower: string;
    upper: string;
    mode: IntegralMode;
    solveMethod: string;
    methodAuditMarkdown: string;
    assumptionsMarkdown: string;
    diagnosticsSnapshot: any;
    verificationLayerCards: StudioMetricCard[];
    singleDiagnostics: any;
    normalizedXResolution: number;
    normalizedYResolution: number;
    normalizedZResolution: number;
    solverStatusText: string;
    solverWarning: boolean;
    benchmarkSummary: any;
    reportFormat: ReportGeneratorFormat;
}): string {
    const {
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
    } = params;

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
}

export function buildReportExecutiveCards(params: {
    summary: IntegralComputationSummary | null;
    mode: IntegralMode;
    analyticSolution: IntegralAnalyticSolveResponse | null;
    diagnosticsSnapshot: any;
    warningSignals: LaboratorySignal[];
    assumptionCards: StudioMetricCard[];
    researchAuditCards: StudioMetricCard[];
}): StudioMetricCard[] {
    const { summary, mode, analyticSolution, diagnosticsSnapshot, warningSignals, assumptionCards, researchAuditCards } = params;

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
}

export function buildReportSupportCards(params: {
    resultConsoleData: ReturnType<typeof buildResultConsoleData>;
    diagnosticsSnapshot: any;
    annotations: any[];
    savedExperiments: any[];
    summary: IntegralComputationSummary | null;
    solverWarning: boolean;
}): StudioMetricCard[] {
    const { resultConsoleData, diagnosticsSnapshot, annotations, savedExperiments, summary, solverWarning } = params;
    return [
        { eyebrow: "Source", value: resultConsoleData.sourceLabel, detail: "Report skeleton qaysi natija qatlamidan oziqlanayotganini ko'rsatadi.", tone: resultConsoleData.source === "exact" ? "success" : resultConsoleData.source === "numerical" ? "info" : "warn" },
        { eyebrow: "Research", value: diagnosticsSnapshot.research.readiness_label, detail: `${diagnosticsSnapshot.research.exactness_tier} | risk ${diagnosticsSnapshot.research.domain_risk_level}`, tone: diagnosticsSnapshot.research.domain_risk_level === "low" ? "success" : diagnosticsSnapshot.research.domain_risk_level === "medium" ? "info" : "warn" },
        { eyebrow: "Annotations", value: `${annotations.length}`, detail: annotations.length ? "Current result uchun note'lar mavjud." : "Reportga qo'shish uchun hali note yozilmagan.", tone: annotations.length ? "info" : "neutral" },
        { eyebrow: "Scenarios", value: `${savedExperiments.length}`, detail: savedExperiments.length ? "Saved scenario'lar report comparison uchun tayyor." : "Scenario library hali bo'sh.", tone: savedExperiments.length ? "info" : "neutral" },
        { eyebrow: "Bridge", value: summary && !solverWarning ? "Ready" : "Blocked", detail: summary && !solverWarning ? "Copy, send va live push ishlatish mumkin." : "Writer bridge solve tozalanmaguncha bloklangan.", tone: summary && !solverWarning ? "success" : "warn" },
    ];
}

export function buildReportReadinessCards(params: {
    assumptionCards: StudioMetricCard[];
    researchAuditCards: StudioMetricCard[];
    diagnosticsSnapshot: any;
    annotations: any[];
    summary: IntegralComputationSummary | null;
    solverWarning: boolean;
}): StudioMetricCard[] {
    const { assumptionCards, researchAuditCards, diagnosticsSnapshot, annotations, summary, solverWarning } = params;
    return [
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
    ];
}

export function buildStatusBarCards(params: {
    classification: IntegralClassification;
    analyticStatusCard: any;
    solvePhase: string;
    analyticSolution: IntegralAnalyticSolveResponse | null;
    activeTab: string;
    solveMethod: string;
    summary: IntegralComputationSummary | null;
    saveState: string;
    lastSavedResult: any;
    saveError: string | null;
}): StudioMetricCard[] {
    const { classification, analyticStatusCard, solvePhase, analyticSolution, activeTab, solveMethod, summary, saveState, lastSavedResult, saveError } = params;
    return [
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
}
