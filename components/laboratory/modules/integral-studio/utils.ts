import { 
    IntegralMode, 
    IntegralAnalyticSolveResponse, 
    IntegralSolveSnapshot, 
    IntegralComputationSummary, 
    SingleIntegralSummary,
    DoubleIntegralSummary,
    TripleIntegralSummary
} from "./types";
import { type WriterBridgeBlockData } from "@/lib/live-writer-bridge";
import { LaboratoryFormattingService } from "@/components/laboratory/services/formatting-service";
import { evaluate } from "mathjs";
import type { Locale } from "@/lib/i18n";

export const { formatMetric, toTexExpression, clampInteger } = LaboratoryFormattingService;

export const parserNoteTone = LaboratoryFormattingService.getParserNoteTone;
export const stepToneClasses = LaboratoryFormattingService.getStepToneClasses;

export function parseLooseNumericValue(value: string | null | undefined) {
    if (!value) {
        return null;
    }
    const normalized = value.replace(/[^0-9eE+\-.]/g, "");
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
}

export function areSolveSnapshotsEqual(left: IntegralSolveSnapshot, right: IntegralSolveSnapshot) {
    return (
        left.mode === right.mode &&
        left.coordinates === right.coordinates &&
        left.expression === right.expression &&
        left.lower === right.lower &&
        left.upper === right.upper &&
        left.xMin === right.xMin &&
        left.xMax === right.xMax &&
        left.yMin === right.yMin &&
        left.yMax === right.yMax &&
        left.zMin === right.zMin &&
        left.zMax === right.zMax &&
        left.segments === right.segments &&
        left.xResolution === right.xResolution &&
        left.yResolution === right.yResolution &&
        left.zResolution === right.zResolution
    );
}

export function isFiniteInput(value: string) {
    const trimmed = value.trim().toLowerCase();
    if (["inf", "+inf", "infinity", "+infinity", "-inf", "-infinity"].includes(trimmed)) return true;
    return trimmed.length > 0 && Number.isFinite(parseBoundValue(value));
}

export function parseBoundValue(value: string | number) {
    if (typeof value === "number") return value;
    const trimmed = value.trim().toLowerCase();
    if (["inf", "+inf", "infinity", "+infinity"].includes(trimmed)) return Infinity;
    if (["-inf", "-infinity"].includes(trimmed)) return -Infinity;
    const directNumeric = Number(value);
    if (Number.isFinite(directNumeric)) {
        return directNumeric;
    }

    try {
        const normalized = value
            .replace(/\u2212/g, "-")
            .replace(/[\u00D7\u22C5\u00B7]/g, "*")
            .replace(/[\u00F7]/g, "/")
            .replace(/\u03C0/g, "pi")
            .replace(/\bln\s*\(/gi, "log(")
            .trim();
        const computed = Number(evaluate(normalized));
        return Number.isFinite(computed) ? computed : Number.NaN;
    } catch {
        return Number.NaN;
    }
}

export function buildAveragedProfile(
    samples: Array<{ x: number; y: number; z?: number; value?: number }>,
    axis: "x" | "y" | "z",
    valueKey: "z" | "value",
) {
    const buckets = new Map<number, { sum: number; count: number }>();
    samples.forEach((sample) => {
        const axisValue = sample[axis];
        const targetValue = sample[valueKey];
        if (typeof axisValue !== "number" || typeof targetValue !== "number" || !Number.isFinite(axisValue) || !Number.isFinite(targetValue)) {
            return;
        }
        const key = Number(axisValue.toFixed(4));
        const current = buckets.get(key) || { sum: 0, count: 0 };
        current.sum += targetValue;
        current.count += 1;
        buckets.set(key, current);
    });
    return Array.from(buckets.entries())
        .sort((left, right) => left[0] - right[0])
        .map(([x, bucket]) => ({ x, y: bucket.sum / bucket.count }));
}

function normalizeBenchmarkExpression(expression: string) {
    return expression
        .replace(/\s+/g, "")
        .replace(/ln\(/gi, "log(")
        .replace(/\u2212/g, "-")
        .toLowerCase();
}

function normalizeBenchmarkBound(value: string) {
    return value
        .trim()
        .replace(/\s+/g, "")
        .replace(/\u221e/g, "inf")
        .replace(/oo/gi, "inf")
        .replace(/infinity/gi, "inf")
        .toLowerCase();
}

export function evaluateIntegralBenchmark(params: {
    mode: IntegralMode;
    expression: string;
    lower: string;
    upper: string;
    analyticSolution: IntegralAnalyticSolveResponse | null;
    summary: IntegralComputationSummary | null;
}) {
    if (params.mode !== "single") {
        return null;
    }

    const normalizedExpression = normalizeBenchmarkExpression(
        params.analyticSolution?.parser.expression_normalized || params.expression,
    );
    const normalizedLower = normalizeBenchmarkBound(params.analyticSolution?.parser.lower_normalized || params.lower);
    const normalizedUpper = normalizeBenchmarkBound(params.analyticSolution?.parser.upper_normalized || params.upper);

    const canonicalBenchmarks = [
        { id: "poly_unit_interval", label: "Polynomial benchmark", expression: "x^2", lower: "0", upper: "1", expectedValue: 1 / 3, note: "Elementary polynomial integral on unit interval." },
        { id: "improper_exponential_tail", label: "Improper exponential tail", expression: "exp(-x)", lower: "0", upper: "inf", expectedValue: 1, note: "Canonical convergent improper integral with symbolic limit." },
        { id: "endpoint_singularity_root", label: "Endpoint singularity benchmark", expression: "1/sqrt(x)", lower: "0", upper: "1", expectedValue: 2, note: "Integrable endpoint singularity check." },
        { id: "piecewise_abs_symmetric", label: "Piecewise symmetry benchmark", expression: "abs(x)", lower: "-1", upper: "1", expectedValue: 1, note: "Piecewise branch audit on symmetric interval." },
    ];

    const match = canonicalBenchmarks.find((item) =>
        item.expression === normalizedExpression
        && item.lower === normalizedLower
        && item.upper === normalizedUpper,
    );
    if (!match) {
        return null;
    }

    const actualNumeric = parseLooseNumericValue(params.analyticSolution?.exact.numeric_approximation)
        ?? (params.summary ? (params.summary as SingleIntegralSummary).simpson : null);
    const absoluteError = actualNumeric === null ? null : Math.abs(actualNumeric - match.expectedValue);
    const status: "verified" | "review" = absoluteError !== null && absoluteError <= 1e-5 ? "verified" : "review";

    return {
        id: match.id,
        label: match.label,
        expectedValue: LaboratoryFormattingService.formatMetric(match.expectedValue, 8),
        actualValue: actualNumeric === null ? "n/a" : LaboratoryFormattingService.formatMetric(actualNumeric, 8),
        absoluteError,
        status,
        detail:
            status === "verified"
                ? `${match.note} Solver canonical benchmark bilan mos tushdi.`
                : `${match.note} Natija benchmark bilan qo'lda tekshirilishi kerak.`,
    };
}

export function buildExactSolutionMarkdown(solution: IntegralAnalyticSolveResponse | null, locale: Locale = "en") {
    const isUz = locale === "uz";
    if (!solution || solution.status !== "exact") {
        return isUz ? "- Analitik yechim hali tayyor emas." : "- The analytical solution is not ready yet.";
    }
    const isDefinite = Boolean(solution.exact.definite_integral_latex);
    return [
        isDefinite
            ? (isUz ? "- Server `SymPy` orqali aniq integralni analitik usulda yechishga urindi." : "- The server attempted an analytical solution of the definite integral with `SymPy`.")
            : (isUz ? "- Server `SymPy` orqali aniqmas integral uchun ramziy antiderivativni aniqladi." : "- The server searched for a symbolic antiderivative of the indefinite integral with `SymPy`."),
        solution.exact.method_label
            ? `- ${isUz ? "Asosiy ramziy yo‘nalish" : "Primary symbolic route"}: **${solution.exact.method_label}**.`
            : (isUz ? "- Ramziy yechim strategiyasi ajratilmadi." : "- No symbolic solution strategy was identified."),
        solution.exact.antiderivative_latex
            ? `$$F(x) = ${solution.exact.antiderivative_latex}$$`
            : isDefinite
              ? (isUz ? "- Antiderivativ yopiq shaklda ajratilmadi, ammo aniq integral baholandi." : "- A closed-form antiderivative was not isolated, but the definite integral was evaluated.")
              : (isUz ? "- Antiderivativ yopiq shaklda ajratilmadi." : "- A closed-form antiderivative was not isolated."),
        solution.exact.definite_integral_latex && solution.exact.evaluated_latex
            ? `$$${solution.exact.definite_integral_latex} = ${solution.exact.evaluated_latex}$$`
            : solution.exact.evaluated_latex
              ? `$$${solution.exact.evaluated_latex}$$`
              : "- Yakuniy analitik ifoda qaytarilmadi.",
        solution.exact.numeric_approximation
            ? `- ${isUz ? "Sonli ko‘rinish" : "Numerical form"}: **${solution.exact.numeric_approximation}**`
            : isDefinite
              ? (isUz ? "- Sonli yaqinlashuv qaytarilmadi." : "- No numerical approximation was returned.")
              : (isUz ? "- Aniqmas integral uchun sonli yaqinlashuv talab qilinmadi." : "- A numerical approximation was not required for the indefinite integral."),
        solution.exact.contains_special_functions
            ? (isUz ? "- Yechim maxsus funksiyalar orqali ifodalangan bo‘lishi mumkin; bu analitik natija hisoblanadi." : "- The result may use special functions; it remains an analytical result.")
            : (isUz ? "- Natija elementar yoki bevosita ramziy ko‘rinishda qaytarildi." : "- The result was returned in an elementary or direct symbolic form."),
        solution.diagnostics?.research
            ? `- ${isUz ? "Tadqiqotga tayyorlik" : "Research readiness"}: **${solution.diagnostics.research.readiness_label}** | ${isUz ? "xavf" : "risk"}: **${solution.diagnostics.research.domain_risk_level}** | ${isUz ? "daraja" : "tier"}: **${solution.diagnostics.research.exactness_tier}**`
            : (isUz ? "- Tadqiqot auditi metama’lumotlari hali mavjud emas." : "- Research-audit metadata is not available yet."),
    ].join("\n");
}

export function buildExactMethodMarkdown(solution: IntegralAnalyticSolveResponse | null, locale: Locale = "en") {
    const isUz = locale === "uz";
    if (!solution || solution.status !== "exact") {
        return isUz ? "- Avval analitik yechishni ishga tushiring; ramziy natija shu yerda ko‘rsatiladi." : "- Run the analytical solve first; the symbolic result will appear here.";
    }
    const isDefinite = Boolean(solution.exact.definite_integral_latex);
    return [
        isDefinite ? (isUz ? "**Aniq integralning analitik jarayoni**" : "**Definite analytical workflow**") : (isUz ? "**Aniqmas integralning analitik jarayoni**" : "**Indefinite analytical workflow**"),
        "",
        isUz ? "1. Integrand `SymPy` parseri orqali xavfsiz ramziy ifodaga aylantiriladi." : "1. The integrand is converted to a safe symbolic expression by the `SymPy` parser.",
        solution.parser.notes.length
            ? `2. ${isUz ? "Parser kiritmani normallashtirdi" : "The parser normalized the input"}: ${solution.parser.notes.join(" ")}`
            : (isUz ? "2. Parser kiritmani o‘zgartirmasdan ramziy ko‘rinishga tayyorladi." : "2. The parser prepared the input for symbolic evaluation without modification."),
        solution.exact.method_summary
            ? `3. ${isUz ? "Strategiya" : "Strategy"}: **${solution.exact.method_label || (isUz ? "Ramziy soddalashtirish" : "Symbolic reduction")}**. ${solution.exact.method_summary}`
            : (isUz ? "3. `SymPy` antiderivativni umumiy ramziy soddalashtirish orqali aniqladi." : "3. `SymPy` used general symbolic reduction to identify an antiderivative."),
        isUz ? "4. Avval antiderivativ aniqlanadi." : "4. The antiderivative is identified first.",
        isDefinite ? (isUz ? "5. So‘ng aniq integral chegaralarda baholanadi." : "5. The definite integral is then evaluated at the bounds.") : (isUz ? "5. Antiderivativ `+ C` bilan yakuniy ramziy ko‘rinishga keltiriladi." : "5. The antiderivative is completed with `+ C`."),
        isUz ? "6. Yopiq shakl mavjud bo‘lsa, natija LaTeX ko‘rinishida qaytariladi." : "6. If a closed form exists, it is returned in LaTeX form.",
        solution.exact.antiderivative_latex
            ? `- ${isUz ? "Aniqlangan antiderivativ" : "Antiderivative identified"}: $$${solution.exact.antiderivative_latex}$$`
            : (isUz ? "- Antiderivativ topilmasa, sonli usulga o‘tish tavsiya qilinadi." : "- If no antiderivative is found, a numerical fallback is recommended."),
    ].join("\n");
}

export function buildNumericalPromptMarkdown(
    mode: IntegralMode,
    solution: IntegralAnalyticSolveResponse | null,
    locale: Locale = "en",
) {
    const isUz = locale === "uz";
    if (mode === "single") {
        if (solution && !solution.can_offer_numerical) {
            return [
                solution.message || "Bu solve lane numerik fallback bermaydi.",
                isUz ? "- Ushbu integral turi ramziy yoki yaqinlashuv tahlili bilan yakunlanadi." : "- This integral type is handled by symbolic or convergence analysis.",
                isUz ? "- Ushbu yo‘nalishda sonli tasdiqlash mavjud emas." : "- Numerical confirmation is not available for this route.",
            ].join("\n");
        }
        return [
            solution?.message || (isUz ? "Analitik yopiq shakldagi yechim topilmadi." : "No analytical closed-form solution was found."),
            isUz ? "- Ushbu ifoda uchun sonli baholashni davom ettirish mumkin." : "- Numerical evaluation is available for this expression.",
            isUz ? "- Hisoblash avtomatik boshlanmaydi; davom ettirishni tugma orqali tasdiqlang." : "- Computation does not start automatically; confirm continuation with the action button.",
            isUz ? "- Tasdiqdan so‘ng Simpson, midpoint va trapezoid usullari taqqoslanadi." : "- Simpson, midpoint and trapezoid methods will be compared after confirmation.",
        ].join("\n");
    }
    return [
        mode === "double"
            ? (isUz ? "- Ikki o‘lchamli integral ramziy emas, sonli hisoblash to‘ri orqali baholanadi." : "- The two-dimensional integral is evaluated numerically on a grid.")
            : (isUz ? "- Uch o‘lchamli integral hajmiy hisoblash to‘ri orqali baholanadi." : "- The three-dimensional integral is evaluated on a volumetric grid."),
        isUz ? "- Katta hisoblashlar avtomatik ishga tushmaydi." : "- Large computations do not start automatically.",
        isUz ? "- Davom etsangiz, joriy to‘r bo‘yicha baho va vizual tahlil quriladi." : "- If you continue, an estimate and visual analysis will be generated for the current grid.",
    ].join("\n");
}

export function generateSweepValues(startText: string, endText: string, countText: string, min: number, max: number) {
    const start = clampInteger(startText, min, min, max);
    const end = clampInteger(endText, Math.min(max, start + 20), min, max);
    const count = clampInteger(countText, 4, 2, 6);
    const actualStart = Math.min(start, end);
    const actualEnd = Math.max(start, end);
    const step = count === 1 ? 0 : (actualEnd - actualStart) / Math.max(1, count - 1);
    const values = Array.from({ length: count }, (_, index) => Math.round(actualStart + step * index));
    return Array.from(new Set(values.map((value) => Math.min(max, Math.max(min, value))))).sort((left, right) => left - right);
}

export function buildIntegralMarkdown(params: {
    mode: IntegralMode;
    expression: string;
    lower: number;
    upper: number;
    xMin: number;
    xMax: number;
    yMin: number;
    yMax: number;
    zMin: number;
    zMax: number;
    segmentsUsed: number;
    xResolution: number;
    yResolution: number;
    zResolution: number;
    summary: IntegralComputationSummary;
}) {
    const { mode, expression, lower, upper, xMin, xMax, yMin, yMax, zMin, zMax, segmentsUsed, xResolution, yResolution, zResolution, summary } = params;
    if (mode === "single") {
        const singleSummary = summary as SingleIntegralSummary;
        const spread = Math.max(singleSummary.midpoint, singleSummary.trapezoid, singleSummary.simpson) - Math.min(singleSummary.midpoint, singleSummary.trapezoid, singleSummary.simpson);
        return `## Laboratory Export: Integral Studio\n\n### Problem\n- Function: \`${expression}\`\n- Interval: [${formatMetric(lower, 4)}, ${formatMetric(upper, 4)}]\n- Segments: ${segmentsUsed}\n\n### Numerical Estimates\n- Simpson: ${formatMetric(singleSummary.simpson, 6)}\n- Midpoint: ${formatMetric(singleSummary.midpoint, 6)}\n- Trapezoid: ${formatMetric(singleSummary.trapezoid, 6)}\n- Method spread: ${formatMetric(spread, 6)}`;
    }
    if (mode === "double") {
        const doubleSummary = summary as DoubleIntegralSummary;
        return `## Laboratory Export: Double Integral Studio\n\n### Problem\n- Function: \`${expression}\`\n- X domain: [${formatMetric(xMin, 4)}, ${formatMetric(xMax, 4)}]\n- Y domain: [${formatMetric(yMin, 4)}, ${formatMetric(yMax, 4)}]\n- Grid: ${xResolution} x ${yResolution}\n\n### Numerical Estimate\n- Integral value: ${formatMetric(doubleSummary.value, 8)}\n- Sample count: ${doubleSummary.samples.length}`;
    }
    const tripleSummary = summary as TripleIntegralSummary;
    return `## Laboratory Export: Triple Integral Studio\n\n### Problem\n- Function: \`${expression}\`\n- X domain: [${formatMetric(xMin, 4)}, ${formatMetric(xMax, 4)}]\n- Y domain: [${formatMetric(yMin, 4)}, ${formatMetric(yMax, 4)}]\n- Z domain: [${formatMetric(zMin, 4)}, ${formatMetric(zMax, 4)}]\n- Grid: ${xResolution} x ${yResolution} x ${zResolution}\n\n### Numerical Estimate\n- Integral value: ${formatMetric(tripleSummary.value, 8)}\n- Sparse sample count: ${tripleSummary.samples.length}`;
}

export function buildIntegralLivePayload(params: {
    targetId: string;
    mode: IntegralMode;
    expression: string;
    lower: number;
    upper: number;
    xMin: number;
    xMax: number;
    yMin: number;
    yMax: number;
    zMin: number;
    zMax: number;
    segmentsUsed: number;
    xResolution: number;
    yResolution: number;
    zResolution: number;
    summary: IntegralComputationSummary;
}): WriterBridgeBlockData {
    const { targetId, mode, expression, lower, upper, xMin, xMax, yMin, yMax, zMin, zMax, segmentsUsed, xResolution, yResolution, zResolution, summary } = params;
    if (mode === "single") {
        const singleSummary = summary as SingleIntegralSummary;
        return {
            id: targetId,
            status: "ready",
            moduleSlug: "integral-studio",
            kind: "integral",
            title: `Integral study: ${expression}`,
            summary: "Laboratoriyadan live yuborilgan single integral hisoboti.",
            generatedAt: new Date().toISOString(),
            metrics: [
                { label: "Lower", value: formatMetric(lower, 4) },
                { label: "Upper", value: formatMetric(upper, 4) },
                { label: "Segments", value: String(segmentsUsed) },
                { label: "Simpson", value: formatMetric(singleSummary.simpson, 6) },
            ],
            notes: [`Function: ${expression}`],
            plotSeries: [{ label: "f(x)", color: "#2563eb", points: singleSummary.samples }],
        };
    }
    if (mode === "double") {
        const doubleSummary = summary as DoubleIntegralSummary;
        const xProfile = buildAveragedProfile(doubleSummary.samples, "x", "z");
        return {
            id: targetId,
            status: "ready",
            moduleSlug: "integral-studio",
            kind: "double-integral",
            title: `Double integral: ${expression}`,
            summary: "Surface integral laboratoriyadan eksport qilindi.",
            generatedAt: new Date().toISOString(),
            metrics: [
                { label: "Value", value: formatMetric(doubleSummary.value, 8) },
                { label: "Grid", value: `${xResolution}x${yResolution}` },
                { label: "X span", value: `${formatMetric(xMin, 3)}..${formatMetric(xMax, 3)}` },
                { label: "Y span", value: `${formatMetric(yMin, 3)}..${formatMetric(yMax, 3)}` },
            ],
            notes: [`Function: ${expression}`, `Samples: ${doubleSummary.samples.length}`],
            plotSeries: [{ label: "x-average height", color: "#2563eb", points: xProfile }],
        };
    }
    const tripleSummary = summary as TripleIntegralSummary;
    const xProfile = buildAveragedProfile(tripleSummary.samples, "x", "value");
    return {
        id: targetId,
        status: "ready",
        moduleSlug: "integral-studio",
        kind: "triple-integral",
        title: `Triple integral: ${expression}`,
        summary: "Volumetric integral laboratoriyadan eksport qilindi.",
        generatedAt: new Date().toISOString(),
        metrics: [
            { label: "Value", value: formatMetric(tripleSummary.value, 8) },
            { label: "Grid", value: `${xResolution}x${yResolution}x${zResolution}` },
            { label: "X span", value: `${formatMetric(xMin, 3)}..${formatMetric(xMax, 3)}` },
            { label: "Z span", value: `${formatMetric(zMin, 3)}..${formatMetric(zMax, 3)}` },
        ],
        notes: [`Function: ${expression}`, `Sparse samples: ${tripleSummary.samples.length}`, `Y span: ${formatMetric(yMin, 3)}..${formatMetric(yMax, 3)}`],
        plotSeries: [{ label: "x-average density", color: "#7c3aed", points: xProfile }],
    };
}
