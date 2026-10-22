import React from "react";
import { Activity, ChevronDown, Orbit, Save, SlidersHorizontal, Sparkles } from "lucide-react";
import { LaboratoryInlineMathMarkdown } from "@/components/laboratory/laboratory-inline-math-markdown";
import { IntegralClassification, IntegralCoordinateSystem, IntegralMode } from "../types";
import { GeometryLaneBuilder } from "./geometry-lane-builder";
import { FormulaQuickPalette } from "@/components/laboratory/formula-quick-palette";

interface SolverControlProps {
    mode: IntegralMode;
    setMode: (mode: IntegralMode) => void;
    coordinates: IntegralCoordinateSystem;
    setCoordinates: (val: IntegralCoordinateSystem) => void;
    expression: string;
    setExpression: (val: string) => void;
    lower: string;
    setLower: (val: string) => void;
    upper: string;
    setUpper: (val: string) => void;
    xMin: string;
    setXMin: (val: string) => void;
    xMax: string;
    setXMax: (val: string) => void;
    yMin: string;
    setYMin: (val: string) => void;
    yMax: string;
    setYMax: (val: string) => void;
    zMin: string;
    setZMin: (val: string) => void;
    zMax: string;
    setZMax: (val: string) => void;
    segments: string;
    setSegments: (val: string) => void;
    xResolution: string;
    setXResolution: (val: string) => void;
    yResolution: string;
    setYResolution: (val: string) => void;
    zResolution: string;
    setZResolution: (val: string) => void;
    requestAnalyticSolve: () => void;
    confirmNumericalSolve: () => void;
    solvePhase: string;
    activePresetDescription?: string;
    renderedProblemContent: string;
    analyticStatusTitle: string;
    analyticStatusBody: string;
    analyticStatusBadge: string;
    analyticStatusToneClass: string;
    classification: IntegralClassification;
    isResultStale?: boolean;
    saveResult?: () => void | Promise<unknown>;
    saveState?: "idle" | "saving" | "saved" | "error";
}

const modeOptions: Array<{ id: IntegralMode; label: string }> = [
    { id: "single", label: "Single" },
    { id: "double", label: "Double" },
    { id: "triple", label: "Triple" },
];

export function SolverControl({
    mode,
    setMode,
    coordinates,
    setCoordinates,
    expression,
    setExpression,
    lower,
    setLower,
    upper,
    setUpper,
    xMin,
    setXMin,
    xMax,
    setXMax,
    yMin,
    setYMin,
    yMax,
    setYMax,
    zMin,
    setZMin,
    zMax,
    setZMax,
    segments,
    setSegments,
    xResolution,
    setXResolution,
    yResolution,
    setYResolution,
    zResolution,
    setZResolution,
    requestAnalyticSolve,
    confirmNumericalSolve,
    solvePhase,
    activePresetDescription,
    renderedProblemContent,
    classification,
    isResultStale,
    saveResult,
    saveState = "idle",
}: SolverControlProps) {
    const geometryLaneActive =
        classification.kind === "line_integral_candidate"
        || classification.kind === "surface_integral_candidate"
        || classification.kind === "contour_integral_candidate";
    const coordinateOptions: Array<{ id: IntegralCoordinateSystem; label: string }> = [
        { id: "cartesian", label: "Cartesian" },
        ...(geometryLaneActive ? [{ id: "parametric" as const, label: "Parametric" }] : []),
        ...(classification.kind === "contour_integral_candidate" ? [{ id: "complex_plane" as const, label: "Complex Plane" }] : []),
        ...(mode === "single" || mode === "double" ? [{ id: "polar" as const, label: "Polar" }] : []),
        ...(mode === "triple" ? [{ id: "cylindrical" as const, label: "Cylindrical" }] : []),
        ...(mode === "triple" ? [{ id: "spherical" as const, label: "Spherical" }] : []),
    ];

    const variableHint =
        geometryLaneActive
            ? classification.kind === "line_integral_candidate"
                ? coordinates === "parametric"
                    ? "t, x(t), y(t), z(t)"
                    : "x, y, z, t"
                : classification.kind === "surface_integral_candidate"
                    ? coordinates === "parametric"
                        ? "u, v, x(u,v), y(u,v), z(u,v)"
                        : "x, y, z, u, v"
                    : coordinates === "complex_plane"
                        ? "z, t, Re(z), Im(z)"
                        : "z, t"
            : mode === "single"
            ? coordinates === "polar"
                ? "r, theta, x, y"
                : "x"
            : mode === "double"
              ? coordinates === "polar"
                    ? "r, theta, x, y"
                    : "x, y"
              : coordinates === "cylindrical"
                ? "r, theta, z, x, y"
                : coordinates === "spherical"
                  ? "rho, theta, phi, x, y, z"
                  : "x, y, z";

    const solveStatusLabel =
        solvePhase === "analytic-loading"
            ? "Analyzing"
            : solvePhase === "exact-ready"
              ? "Exact ready"
              : solvePhase === "needs-numerical"
                ? "Need confirm"
                : solvePhase === "error"
                  ? "Attention"
                  : "Ready";
    const resultReady = !isResultStale && (solvePhase === "exact-ready" || solvePhase === "numerical-ready");
    const primarySolveLabel =
        solvePhase === "analytic-loading"
            ? "Analyzing..."
            : isResultStale
              ? "Update solution"
              : solvePhase === "needs-numerical"
                ? "Symbolic unavailable"
                : solvePhase === "exact-ready"
                  ? "Exact solution ready"
                  : solvePhase === "numerical-ready"
                    ? "Numerical result ready"
                    : solvePhase === "error"
                      ? "Retry analysis"
                      : "Analyze symbolic solution";
    const solveFlowHint =
        solvePhase === "analytic-loading"
            ? "SymPy symbolic lane ishlayapti. Natija exact bo'lsa avtomatik report, code va visualizationga ulanadi."
            : isResultStale
              ? "Input o'zgardi. Yangi expression yoki bounds uchun symbolic analysis qayta ishlatiladi."
              : solvePhase === "needs-numerical"
                ? "Analitik lane toza yechim bermadi. Numerical fallbackni user tasdiqlagandan keyin hisoblaymiz."
                : solvePhase === "exact-ready"
                  ? "Analitik natija tayyor. Numerical check mumkin bo'lsa orqa hisob sifatida compare/reportga ulanadi."
                  : solvePhase === "numerical-ready"
                    ? "Raqamli natija tayyor. Keyingi qadam: compare, visualization yoki report export."
                    : "Avval symbolic analysis ishlaydi; agar analytic yechim topilmasa numerical fallback taklif qilinadi.";

    const samplingLabel =
        mode === "single"
            ? `${segments || "--"} segments`
            : `${xResolution || "--"} x ${yResolution || "--"}${mode === "triple" ? ` x ${zResolution || "--"}` : ""}`;
    const insertSnippet = (snippet: string) => {
        if (snippet === "pi") {
            setExpression((expression ? `${expression} ` : "") + "pi");
            return;
        }

        setExpression(expression ? `${expression}${snippet}` : snippet);
    };

    const controlInputClassName =
        "h-11 w-full min-w-0 rounded-2xl border border-border/60 bg-background px-3 text-sm font-medium text-foreground outline-none transition-all placeholder:text-muted-foreground/65 focus:border-accent/30 focus:ring-4 focus:ring-[var(--accent-soft)]";
    const controlMonoInputClassName = `${controlInputClassName} font-mono`;
    const selectShellClassName =
        "relative flex h-11 items-center rounded-2xl border border-border/60 bg-background transition-all focus-within:border-accent/30 focus-within:ring-4 focus-within:ring-[var(--accent-soft)]";
    const axisGroups =
        mode === "single"
            ? [
                  { key: "x", label: "x-range", min: lower, max: upper, setMin: setLower, setMax: setUpper, minPlaceholder: "lower", maxPlaceholder: "upper" },
              ]
            : mode === "double"
              ? [
                    { key: "x", label: "x-range", min: xMin, max: xMax, setMin: setXMin, setMax: setXMax, minPlaceholder: "x min", maxPlaceholder: "x max" },
                    { key: "y", label: "y-range", min: yMin, max: yMax, setMin: setYMin, setMax: setYMax, minPlaceholder: "y min", maxPlaceholder: "y max" },
                ]
            : [
                    { 
                        key: "x", 
                        label: coordinates === "spherical" ? "ρ-range" : (coordinates === "polar" || coordinates === "cylindrical" ? "r-range" : "x-range"), 
                        min: xMin, max: xMax, setMin: setXMin, setMax: setXMax, 
                        minPlaceholder: coordinates === "spherical" ? "ρ min" : (coordinates === "polar" || coordinates === "cylindrical" ? "r min" : "x min"),
                        maxPlaceholder: coordinates === "spherical" ? "ρ max" : (coordinates === "polar" || coordinates === "cylindrical" ? "r max" : "x max")
                    },
                    { 
                        key: "y", 
                        label: coordinates === "spherical" || coordinates === "polar" || coordinates === "cylindrical" ? "θ-range" : "y-range", 
                        min: yMin, max: yMax, setMin: setYMin, setMax: setYMax, 
                        minPlaceholder: coordinates === "spherical" || coordinates === "polar" || coordinates === "cylindrical" ? "θ min" : "y min",
                        maxPlaceholder: coordinates === "spherical" || coordinates === "polar" || coordinates === "cylindrical" ? "θ max" : "y max"
                    },
                    { 
                        key: "z", 
                        label: coordinates === "spherical" ? "φ-range" : "z-range", 
                        min: zMin, max: zMax, setMin: setZMin, setMax: setZMax, 
                        minPlaceholder: coordinates === "spherical" ? "φ min" : "z min",
                        maxPlaceholder: coordinates === "spherical" ? "φ max" : "z max"
                    },
                ];
    return (
        <div className="site-panel">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 bg-background/80 px-5 py-4">
                <div className="flex items-center gap-2">
                    <div className="site-eyebrow text-accent">Problem Composer</div>
                    {activePresetDescription ? (
                        <div className="rounded-full border border-accent/20 bg-accent/5 px-3 py-1 text-[10px] font-bold text-muted-foreground">
                            {activePresetDescription}
                        </div>
                    ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={() => void saveResult?.()}
                        disabled={!saveResult || saveState === "saving"}
                        className="inline-flex h-8 items-center justify-center gap-1.5 rounded-full border border-accent/25 bg-accent/10 px-3 text-[10px] font-black uppercase tracking-[0.14em] text-accent transition hover:border-accent/45 disabled:cursor-not-allowed disabled:opacity-55"
                    >
                        <Save className="h-3.5 w-3.5" />
                        {saveState === "saving" ? "Saving" : saveState === "saved" ? "Saved" : "Save Bridge"}
                    </button>
                    <div className="rounded-full border border-border/60 bg-background px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">
                        {samplingLabel}
                    </div>
                    <div className="rounded-full border border-teal-500/25 bg-teal-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-teal-700 dark:text-teal-300">
                        <span className="inline-flex items-center gap-1.5">
                            <Activity className="h-3.5 w-3.5" />
                            {solveStatusLabel}
                        </span>
                    </div>
                </div>
            </div>

            <div className="grid gap-4 p-5 2xl:grid-cols-[minmax(0,1.15fr)_minmax(460px,0.85fr)]">
                <div className="space-y-4">
                    <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_160px]">
                        <div className="min-w-0 rounded-2xl border border-border/60 bg-background/70 p-1">
                            <div className="mb-2 px-2 pt-1 text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">
                                Analysis Mode
                            </div>
                            <div className="grid grid-cols-3 gap-1.5">
                            {modeOptions.map((option) => (
                                <button
                                    key={option.id}
                                    type="button"
                                    onClick={() => setMode(option.id)}
                                    className={`min-w-0 whitespace-nowrap rounded-xl border px-2 py-2.5 text-[10px] font-black uppercase tracking-[0.12em] transition-all sm:px-3 sm:text-[11px] sm:tracking-[0.16em] ${
                                        mode === option.id
                                            ? "border-foreground bg-foreground text-background shadow-sm"
                                            : "border-transparent bg-background text-muted-foreground hover:border-accent/20 hover:text-foreground"
                                    }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                            </div>
                        </div>

                        <div className="rounded-2xl border border-border/60 bg-background/70 px-3 py-3">
                            <label className="mb-2 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">
                                <Orbit className="h-3.5 w-3.5" />
                                Coordinates
                            </label>
                            <div className={selectShellClassName}>
                                <select
                                    value={coordinates}
                                    onChange={(e) => setCoordinates(e.target.value as IntegralCoordinateSystem)}
                                    className="h-full w-full cursor-pointer appearance-none bg-transparent px-3.5 pr-10 text-sm font-semibold text-foreground outline-none"
                                >
                                    {coordinateOptions.map((option) => (
                                        <option key={option.id} value={option.id}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="pointer-events-none absolute right-3 h-4 w-4 text-muted-foreground" />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                        <div className="text-[10px] font-black uppercase tracking-[0.16em] text-accent">Formula</div>
                        <FormulaQuickPalette
                            onInsert={insertSnippet}
                            currentMode={mode}
                            className="mt-2 mb-3"
                        />
                        <textarea
                            value={expression}
                            onChange={(e) => setExpression(e.target.value)}
                            placeholder="Example: sin(x) + x^2 / 4"
                            className="mt-3 min-h-24 w-full resize-y rounded-2xl border-2 border-border/70 bg-background px-4 py-3 font-mono text-base leading-6 text-foreground outline-none transition focus:border-accent/50 focus:ring-2 focus:ring-accent/15"
                        />
                        {geometryLaneActive ? (
                            <div className="mt-3">
                                <GeometryLaneBuilder expression={expression} setExpression={setExpression} classification={classification} />
                            </div>
                        ) : null}
                        <div className="mt-3">
                            <div className="min-w-0 overflow-hidden rounded-2xl border border-border/60 bg-background px-4 py-3 xl:col-span-2">
                                <div className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">Rendered Preview</div>
                                <div className="mt-2 overflow-x-auto text-sm">
                                    <div className="min-w-0 break-words">
                                        <LaboratoryInlineMathMarkdown content={renderedProblemContent} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                        <div className="text-[10px] font-black uppercase tracking-[0.16em] text-accent">{geometryLaneActive ? "Lane Inputs" : "Bounds"}</div>
                        {geometryLaneActive ? (
                            <div className="mt-3 rounded-2xl border border-dashed border-border/60 bg-muted/10 px-3 py-3 text-xs leading-5 text-muted-foreground">
                                Structured geometry lane active. Parametric interval va path/patch builder chap tomonda expressionni avtomatik yig‘adi.
                            </div>
                        ) : (
                            <>
                                <div className={`mt-3 grid gap-3 ${mode === "triple" ? "lg:grid-cols-3" : mode === "double" ? "sm:grid-cols-2" : "grid-cols-1"}`}>
                                    {axisGroups.map((axis) => (
                                        <div key={axis.key} className="rounded-2xl border border-border/60 bg-background p-3">
                                            <div className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">
                                                {axis.label}
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <input
                                                    value={axis.min}
                                                    onChange={(e) => axis.setMin(e.target.value)}
                                                    placeholder={axis.minPlaceholder}
                                                    className={controlMonoInputClassName}
                                                />
                                                <input
                                                    value={axis.max}
                                                    onChange={(e) => axis.setMax(e.target.value)}
                                                    placeholder={axis.maxPlaceholder}
                                                    className={controlMonoInputClassName}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {mode === "single" ? (
                                    <div className="mt-3 rounded-2xl border border-dashed border-border/60 bg-muted/10 px-3 py-2.5 text-xs leading-5 text-muted-foreground">
                                        {classification.kind === "indefinite_single"
                                            ? "Chegaralar bo'sh bo'lsa system buni aniqmas integral deb ko'radi va symbolic primitive lane orqali yechishga urinadi."
                                            : "Chegaralar kiritilgan bo'lsa system buni definite integral deb ko'radi va analytic yoki numerical audit lane tanlaydi."}
                                    </div>
                                ) : null}
                            </>
                        )}
                    </div>

                    <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                        <label className="mb-2 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-accent">
                            <SlidersHorizontal className="h-3.5 w-3.5" />
                            {geometryLaneActive ? "Lane Execution" : "Sampling"}
                        </label>
                        {!geometryLaneActive && mode === "single" ? (
                            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px]">
                                <input
                                    type="text"
                                    value={segments}
                                    onChange={(e) => setSegments(e.target.value)}
                                    className={controlMonoInputClassName}
                                />
                                <div className="rounded-2xl border border-border/60 bg-muted/10 px-3 py-2">
                                    <div className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">Variables</div>
                                    <div className="mt-1 truncate font-mono text-sm font-semibold text-foreground">{variableHint}</div>
                                </div>
                            </div>
                        ) : !geometryLaneActive ? (
                            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px]">
                                <div className={`grid gap-2 ${mode === "triple" ? "grid-cols-1 md:grid-cols-3" : "md:grid-cols-2"}`}>
                                    <input type="text" value={xResolution} onChange={(e) => setXResolution(e.target.value)} placeholder="x res" className={controlMonoInputClassName} />
                                    <input type="text" value={yResolution} onChange={(e) => setYResolution(e.target.value)} placeholder="y res" className={controlMonoInputClassName} />
                                    {mode === "triple" ? (
                                        <input type="text" value={zResolution} onChange={(e) => setZResolution(e.target.value)} placeholder="z res" className={controlMonoInputClassName} />
                                    ) : null}
                                </div>
                                <div className="rounded-2xl border border-border/60 bg-muted/10 px-3 py-2">
                                    <div className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">Variables</div>
                                    <div className="mt-1 truncate font-mono text-sm font-semibold text-foreground" title={variableHint}>{variableHint}</div>
                                </div>
                            </div>
                        ) : (
                            <div className="rounded-2xl border border-dashed border-border/60 bg-muted/10 px-3 py-3 text-xs leading-5 text-muted-foreground">
                                Geometry lane analytic solver ishlaydi. Bu oilalar uchun numerical grid sampling hozir ishlatilmaydi.
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col gap-2">
                        <button
                            type="button"
                            onClick={requestAnalyticSolve}
                            disabled={solvePhase === "analytic-loading" || resultReady || (!isResultStale && solvePhase === "needs-numerical")}
                            className={`flex h-11 w-full items-center justify-center gap-2 rounded-2xl text-sm font-bold transition-all ${
                                isResultStale
                                    ? "border border-accent/40 bg-accent text-white shadow-lg shadow-accent/20 hover:scale-[1.01] active:scale-[0.99]"
                                    : "site-btn-accent"
                            }`}
                        >
                            {solvePhase === "analytic-loading" ? "Analyzing..." : (
                                <>
                                    <Sparkles className="h-4 w-4" />
                                    {primarySolveLabel}
                                </>
                            )}
                        </button>
                        <div className="rounded-2xl border border-border/60 bg-muted/10 px-3 py-2 text-xs leading-5 text-muted-foreground">
                            {solveFlowHint}
                        </div>
                        {solvePhase === "needs-numerical" ? (
                            <>
                            <button
                                type="button"
                                onClick={confirmNumericalSolve}
                                className="w-full rounded-2xl border border-sky-500/40 bg-sky-500/10 py-3 text-xs font-black uppercase tracking-[0.14em] text-sky-700 transition-all hover:bg-sky-500/20 dark:text-sky-300"
                            >
                                Run numerical fallback
                            </button>
                            <div className="rounded-2xl border border-sky-500/20 bg-sky-500/5 px-3 py-2 text-xs leading-5 text-sky-700 dark:text-sky-300">
                                Symbolic yechim topilmadi yoki tasdiqlanmadi. Numerical fallback tez taxminiy qiymat beradi va compare/reportda alohida belgilanadi.
                            </div>
                            </>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
}
