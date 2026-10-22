import React from "react";

import { LaboratoryInlineMathMarkdown } from "@/components/laboratory/laboratory-inline-math-markdown";
import { FormulaQuickPalette } from "@/components/laboratory/formula-quick-palette";

import { buildSeriesLimitAuxPreview, buildSeriesLimitPreview, inferSeriesLimitMode } from "../series-limit-input";
import type { SeriesLimitExperienceLevel, SeriesLimitMode, SeriesLimitSummary } from "../types";

const modeCopy: Record<SeriesLimitMode, { label: string; helper: string; expressionPlaceholder: string; auxPlaceholder: string }> = {
    limits: {
        label: "Limit Analysis",
        helper: "Ifoda va limit nuqtasini kiriting. Lokal asymptotic behavior shu lane ichida ko'rinadi.",
        expressionPlaceholder: "(sin(x))/x",
        auxPlaceholder: "x -> 0",
    },
    sequences: {
        label: "Sequence Analysis",
        helper: "Ketma-ketlik formulasini kiriting. Discrete growth va convergence signallari shu yerda chiqadi.",
        expressionPlaceholder: "(1 + 1/n)^n",
        auxPlaceholder: "n -> inf",
    },
    series: {
        label: "Series Analysis",
        helper: "Infinite series, oscillatory oilalar, log-corrected borderline holatlar va singular start indexlarni shu lane ichida audit qiling.",
        expressionPlaceholder: "sum((-1)^(n+1)/n, n=1..inf)",
        auxPlaceholder: "alternating",
    },
    convergence: {
        label: "Convergence Tests",
        helper: "Ratio, root, comparison, integral va borderline singular families uchun expression kiriting.",
        expressionPlaceholder: "sum(n!/n^n, n=1..inf)",
        auxPlaceholder: "ratio test",
    },
    "power-series": {
        label: "Power Series",
        helper: "Power series, center va radius signalini ko'rish uchun expression kiriting.",
        expressionPlaceholder: "sum(x^n/n, n=1..inf)",
        auxPlaceholder: "center=0",
    },
};

const dimensionOptions: Record<SeriesLimitMode, string[]> = {
    limits: ["1 variable", "one-sided", "asymptotic", "oscillatory"],
    sequences: ["discrete", "tail behavior", "stability"],
    series: ["infinite series", "oscillatory series", "summability", "harmonic-derived"],
    convergence: ["test audit", "comparison lane", "borderline singular"],
    "power-series": ["power series", "endpoint audit", "radius study"],
};

export function SolverControl({
    mode,
    setMode,
    expression,
    setExpression,
    auxiliaryExpression,
    setAuxiliaryExpression,
    dimension,
    setDimension,
    experienceLevel,
    activePresetLabel,
    summary,
}: {
    mode: SeriesLimitMode;
    setMode: (value: SeriesLimitMode) => void;
    expression: string;
    setExpression: (value: string) => void;
    auxiliaryExpression: string;
    setAuxiliaryExpression: (value: string) => void;
    dimension: string;
    setDimension: (value: string) => void;
    experienceLevel: SeriesLimitExperienceLevel;
    activePresetLabel?: string;
    summary: SeriesLimitSummary;
}) {
    const inferredMode = React.useMemo(() => inferSeriesLimitMode(expression, auxiliaryExpression, mode), [auxiliaryExpression, expression, mode]);
    const copy = modeCopy[mode];
    const dimensions = dimensionOptions[mode];
    const resolvedDimension = dimensions.includes(dimension) ? dimension : dimensions[0];
    const previewContent = React.useMemo(() => buildSeriesLimitPreview(mode, expression, auxiliaryExpression), [auxiliaryExpression, expression, mode]);
    const auxiliaryPreviewContent = React.useMemo(() => buildSeriesLimitAuxPreview(mode, auxiliaryExpression), [auxiliaryExpression, mode]);

    React.useEffect(() => {
        if (dimension !== resolvedDimension) {
            setDimension(resolvedDimension);
        }
    }, [dimension, resolvedDimension, setDimension]);

    return (
        <div className="rounded-3xl border border-border/50 bg-background p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">Problem Composer</div>
                    <div className="mt-2 text-xl font-black tracking-tight text-foreground">{copy.label}</div>
                    <div className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{copy.helper}</div>
                </div>
                <div className="rounded-2xl border border-border/60 bg-muted/30 px-3 py-2 text-right">
                    <div className="text-[9px] font-black uppercase tracking-[0.18em] text-muted-foreground">Preset</div>
                    <div className="mt-1 text-sm font-bold text-foreground">{activePresetLabel ?? "Custom"}</div>
                    {mode !== inferredMode ? (
                        <div className="mt-1 text-[10px] font-black uppercase tracking-[0.16em] text-accent">
                            detected {modeCopy[inferredMode].label}
                        </div>
                    ) : null}
                </div>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-[0.8fr_1.1fr_0.8fr]">
                <label className="space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">Analysis Mode</span>
                    <select value={mode} onChange={(event) => setMode(event.target.value as SeriesLimitMode)} className="h-11 w-full rounded-2xl border border-border/60 bg-background px-4 text-sm font-semibold text-foreground outline-none transition focus:border-accent">
                        <option value="limits">Limits</option>
                        <option value="sequences">Sequences</option>
                        <option value="series">Series</option>
                        <option value="convergence">Convergence</option>
                        <option value="power-series">Power Series</option>
                    </select>
                </label>
                <label className="space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">Dimension Scope</span>
                    <select
                        value={resolvedDimension}
                        onChange={(event) => setDimension(event.target.value)}
                        className="h-11 w-full rounded-2xl border border-border/60 bg-background px-4 text-sm font-semibold text-foreground outline-none transition focus:border-accent"
                    >
                        {dimensions.map((item) => (
                            <option key={item} value={item}>
                                {item}
                            </option>
                        ))}
                    </select>
                </label>
                <div className="rounded-2xl border border-border/60 bg-muted/20 px-4 py-3">
                    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">Experience</div>
                    <div className="mt-1 text-sm font-bold text-foreground">{experienceLevel}</div>
                    <div className="mt-1 text-xs leading-5 text-muted-foreground">Limit, sequence, series va power-series oilalari shu shell ichida yig&apos;iladi.</div>
                </div>
            </div>

            <div className="mt-5 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
                <div className="space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">Expression</span>
                    <FormulaQuickPalette
                        onInsert={(snippet) => setExpression(expression ? `${expression} ${snippet}` : snippet)}
                        currentMode={mode}
                        className="mb-2"
                    />
                    <textarea
                        value={expression}
                        onChange={(event) => setExpression(event.target.value)}
                        rows={6}
                        spellCheck={false}
                        placeholder={copy.expressionPlaceholder}
                        className="min-h-[160px] w-full resize-none rounded-3xl border border-border/60 bg-background px-4 py-4 font-mono text-sm leading-7 text-foreground outline-none transition focus:border-accent"
                    />
                </div>
                <div className="space-y-4">
                    <label className="block space-y-2">
                        <span className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">Auxiliary Context</span>
                        <textarea
                            value={auxiliaryExpression}
                            onChange={(event) => setAuxiliaryExpression(event.target.value)}
                            rows={5}
                            spellCheck={false}
                            placeholder={copy.auxPlaceholder}
                            className="w-full resize-none rounded-3xl border border-border/60 bg-background px-4 py-4 font-mono text-sm leading-7 text-foreground outline-none transition focus:border-accent"
                        />
                    </label>
                    <div className="rounded-3xl border border-border/60 bg-muted/20 p-4">
                        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">Rendered Preview</div>
                        <div className="mt-3 overflow-x-auto rounded-2xl border border-border/60 bg-background p-4 text-sm text-foreground">
                            <MathValue value={previewContent} fallback="Expression pending." />
                        </div>
                        {auxiliaryExpression ? (
                            <div className="mt-3 overflow-x-auto rounded-2xl border border-border/60 bg-background p-4 text-sm text-foreground">
                                <MathValue value={auxiliaryPreviewContent} fallback="Auxiliary context pending." />
                            </div>
                        ) : null}
                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                            <PreviewMetric label="Lane" value={modeCopy[mode].label} />
                            <PreviewMetric label="Detected" value={modeCopy[inferredMode].label} />
                            <PreviewMetric label="Family" value={summary.detectedFamily ?? "pending"} />
                            <PreviewMetric label="Candidate" value={summary.candidateResult ?? "pending"} />
                            <PreviewMetric label="Convergence" value={summary.convergenceSignal ?? summary.radiusSignal ?? "pending"} />
                            <PreviewMetric label="Risk" value={summary.riskSignal ?? "pending"} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function MathValue({ value, fallback }: { value?: string; fallback: string }) {
    if (!value?.trim()) {
        return <div className="text-sm text-muted-foreground">{fallback}</div>;
    }

    return <LaboratoryInlineMathMarkdown content={toMathMarkdown(value)} />;
}

function PreviewMetric({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-2xl border border-border/60 bg-background p-3">
            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
            <div className="mt-2 text-sm font-semibold text-foreground">{value}</div>
        </div>
    );
}

function toMathMarkdown(value: string) {
    const trimmed = value.trim();
    if (!trimmed) return "";
    if (trimmed.includes("$$")) return trimmed;
    if (trimmed.startsWith("\\(") || trimmed.startsWith("\\[")) return trimmed;
    return `$$${trimmed}$$`;
}
