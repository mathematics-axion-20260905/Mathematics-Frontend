import React from "react";
import { Activity, Orbit, SlidersHorizontal, Sparkles } from "lucide-react";
import { LaboratoryInlineMathMarkdown } from "@/components/laboratory/laboratory-inline-math-markdown";
import { FormulaQuickPalette } from "@/components/laboratory/formula-quick-palette";
import { DifferentialClassification, DifferentialCoordinateSystem, DifferentialExtendedMode } from "../types";

interface SolverControlState {
    expression: string;
    variable: string;
    point: string;
    order: string;
    direction: string;
    coordinates: DifferentialCoordinateSystem;
    mode: DifferentialExtendedMode;
    solvePhase: string;
    isResultStale: boolean;
    classification: DifferentialClassification;
}

interface SolverControlActions {
    setExpression: (v: string) => void;
    setVariable: (v: string) => void;
    setPoint: (v: string) => void;
    setOrder: (v: string) => void;
    setDirection: (v: string) => void;
    setMode: (v: DifferentialExtendedMode) => void;
    requestSolve: () => void;
}

interface SolverControlProps {
    state: SolverControlState;
    actions: SolverControlActions;
}

const modeOptions: Array<{ id: DifferentialExtendedMode; label: string }> = [
    { id: "derivative", label: "Derivative" },
    { id: "partial", label: "Partial" },
    { id: "directional", label: "Directional" },
    { id: "jacobian", label: "Jacobian" },
    { id: "hessian", label: "Hessian" },
    { id: "ode", label: "ODE" },
    { id: "pde", label: "PDE" },
    { id: "sde", label: "SDE" },
];

const modeMeta: Record<
    DifferentialExtendedMode,
    {
        variableLabel: string;
        variablePlaceholder: string;
        pointPlaceholder: string;
        formulaPlaceholder: string;
        targetTitle: string;
        targetSummary: string;
        helperLabel: string;
    }
> = {
    derivative: {
        variableLabel: "Variable",
        variablePlaceholder: "x",
        pointPlaceholder: "Point (e.g. 1.0)",
        formulaPlaceholder: "Example: sin(x) * x^2",
        targetTitle: "Single-variable lane",
        targetSummary: "Ordinary derivative or higher-order derivative around one axis.",
        helperLabel: "Scalar function",
    },
    partial: {
        variableLabel: "Variables",
        variablePlaceholder: "x, y",
        pointPlaceholder: "Point (e.g. 1.0, 2.0)",
        formulaPlaceholder: "Example: x^2 + y*sin(x)",
        targetTitle: "Multi-variable scalar lane",
        targetSummary: "Partial derivative or gradient-style local sensitivity analysis.",
        helperLabel: "Scalar field",
    },
    jacobian: {
        variableLabel: "Variables",
        variablePlaceholder: "x, y",
        pointPlaceholder: "Point (e.g. 1.0, 2.0)",
        formulaPlaceholder: "Example: [sin(x*y), x+y]",
        targetTitle: "Vector transformation lane",
        targetSummary: "Vector-valued function mapped into a Jacobian matrix and determinant audit.",
        helperLabel: "Vector field",
    },
    hessian: {
        variableLabel: "Variables",
        variablePlaceholder: "x, y",
        pointPlaceholder: "Point (e.g. 0.0, 0.0)",
        formulaPlaceholder: "Example: (1 - x)^2 + 100*(y - x^2)^2",
        targetTitle: "Curvature lane",
        targetSummary: "Second-order local structure with diagonal and mixed partials.",
        helperLabel: "Scalar field",
    },
    directional: {
        variableLabel: "Variables",
        variablePlaceholder: "x, y",
        pointPlaceholder: "Point (e.g. 1.0, 1.0)",
        formulaPlaceholder: "Example: x^2 + y^2",
        targetTitle: "Directional derivative lane",
        targetSummary: "D_u f = ∇f · û. Provide a direction vector in the Direction field.",
        helperLabel: "Scalar field + direction",
    },
    ode: {
        variableLabel: "Independent Var",
        variablePlaceholder: "x",
        pointPlaceholder: "Conditions (e.g. y(0)=1)",
        formulaPlaceholder: "Example: y' = x + y; y(0)=1",
        targetTitle: "ODE lane",
        targetSummary: "Ordinary differential equation lane with symbolic dsolve when supported.",
        helperLabel: "Equation + IC",
    },
    pde: {
        variableLabel: "Independent Vars",
        variablePlaceholder: "x, t",
        pointPlaceholder: "Optional condition note",
        formulaPlaceholder: "Example: u_t = u_x",
        targetTitle: "PDE lane",
        targetSummary: "Partial differential equation lane with limited symbolic pdsolve support.",
        helperLabel: "PDE relation",
    },
    sde: {
        variableLabel: "Time Var",
        variablePlaceholder: "t",
        pointPlaceholder: "Grid (e.g. X(0)=1; t:[0,1]; n=200)",
        formulaPlaceholder: "Example: dX = 0.4*X*dt + 0.2*X*dW; X(0)=1; t:[0,1]; n=200",
        targetTitle: "SDE lane",
        targetSummary: "Stochastic differential equation lane with Euler-Maruyama simulation.",
        helperLabel: "Stochastic lane",
    },
};

const snippetMap: Record<DifferentialExtendedMode, string[]> = {
    derivative: ["sin()", "cos()", "exp()", "sqrt()", "log()", "pi"],
    partial: ["sin()", "cos()", "exp()", "sqrt()", "log()", "x*y"],
    directional: ["sin()", "cos()", "exp()", "x^2+y^2", "x*y", "pi"],
    jacobian: ["[f1, f2]", "sin()", "cos()", "exp()", "x*y", "pi"],
    hessian: ["sin()", "cos()", "exp()", "sqrt()", "x^2", "y^2"],
    ode: ["y' =", "y''", "exp()", "sin()", "y(0)=1", "pi"],
    pde: ["u_t =", "u_x", "u_xx", "u_y", "u_yy", "u(x,0)=sin(x)"],
    sde: ["dX =", "dt", "dW", "X(0)=1", "t:[0,1]", "n=200"],
};

function parseODEDraft(expression: string, point: string) {
    const equation = expression.split(";")[0]?.trim() || "y' = y";
    const condition = (expression.split(";").slice(1).find((item) => item.trim()) || point || "y(0)=1").trim();
    return { equation, condition };
}

function parsePDEDraft(expression: string, variable: string, point: string) {
    const equation = expression.split(";")[0]?.trim() || "u_t = u_x";
    const initial = ((expression.split(";").slice(1).find((item) => /u\(x,0\)/i.test(item)) || point) || "u(x,0)=sin(x)").trim();
    const vars = variable.trim() || "x, t";
    return { equation, initial, vars };
}

function parseSDEDraft(expression: string, point: string) {
    const compact = `${expression};${point}`;
    const match = expression.match(/dX\s*=\s*(.+?)\*dt\s*\+\s*(.+?)\*dW/i);
    const drift = match?.[1]?.trim() || "0.4*X";
    const diffusion = match?.[2]?.trim() || "0.2*X";
    const x0 = compact.match(/X\(0\)\s*=\s*([^;]+)/i)?.[1]?.trim() || "1";
    const range = compact.match(/t:\s*\[([^\]]+)\]/i)?.[1]?.trim() || "0,1";
    const steps = compact.match(/n\s*=\s*([0-9]+)/i)?.[1]?.trim() || "200";
    return { drift, diffusion, x0, range, steps };
}

export function SolverControl({ state, actions }: SolverControlProps) {
    const { expression, variable, point, order, direction, mode, solvePhase, isResultStale, classification } = state;
    const { setExpression, setVariable, setPoint, setOrder, setDirection, setMode, requestSolve } = actions;
    const activeMode = mode as DifferentialExtendedMode;

    // Keep fast local drafts so the whole studio does not rerender on every keypress.
    const [localExpression, setLocalExpression] = React.useState(expression);
    const [localVariable, setLocalVariable] = React.useState(variable);
    const [localOrder, setLocalOrder] = React.useState(order);
    const [localPoint, setLocalPoint] = React.useState(point);
    const [localDirection, setLocalDirection] = React.useState(direction);
    const [odeEquation, setOdeEquation] = React.useState("y' = y");
    const [odeCondition, setOdeCondition] = React.useState("y(0)=1");
    const [pdeEquation, setPdeEquation] = React.useState("u_t = u_x");
    const [pdeInitial, setPdeInitial] = React.useState("u(x,0)=sin(x)");
    const [pdeVariables, setPdeVariables] = React.useState("x, t");
    const [sdeDrift, setSdeDrift] = React.useState("0.4*X");
    const [sdeDiffusion, setSdeDiffusion] = React.useState("0.2*X");
    const [sdeX0, setSdeX0] = React.useState("1");
    const [sdeRange, setSdeRange] = React.useState("0,1");
    const [sdeSteps, setSdeSteps] = React.useState("200");

    const deferredExpression = React.useDeferredValue(localExpression);
    const deferredVariable = React.useDeferredValue(localVariable);

    React.useEffect(() => {
        setLocalExpression(expression);
    }, [expression]);
    React.useEffect(() => {
        setLocalVariable(variable);
    }, [variable]);
    React.useEffect(() => {
        setLocalOrder(order);
    }, [order]);
    React.useEffect(() => {
        setLocalPoint(point);
    }, [point]);
    React.useEffect(() => {
        setLocalDirection(direction);
    }, [direction]);
    React.useEffect(() => {
        if (activeMode === "ode") {
            const parsed = parseODEDraft(localExpression, localPoint);
            setOdeEquation(parsed.equation);
            setOdeCondition(parsed.condition);
        }
        if (activeMode === "pde") {
            const parsed = parsePDEDraft(localExpression, localVariable, localPoint);
            setPdeEquation(parsed.equation);
            setPdeInitial(parsed.initial);
            setPdeVariables(parsed.vars);
        }
        if (activeMode === "sde") {
            const parsed = parseSDEDraft(localExpression, localPoint);
            setSdeDrift(parsed.drift);
            setSdeDiffusion(parsed.diffusion);
            setSdeX0(parsed.x0);
            setSdeRange(parsed.range);
            setSdeSteps(parsed.steps);
        }
    }, [activeMode, localExpression, localPoint, localVariable]);

    // Draft-to-global sync is intentionally delayed so charts/cards do not rerender on every keypress.
    React.useEffect(() => {
        const timeout = window.setTimeout(() => {
            if (expression !== localExpression) setExpression(localExpression);
            if (variable !== localVariable) setVariable(localVariable);
            if (order !== localOrder) setOrder(localOrder);
            if (point !== localPoint) setPoint(localPoint);
            if (direction !== localDirection) setDirection(localDirection);
        }, 320);
        return () => window.clearTimeout(timeout);
    }, [direction, expression, localDirection, localExpression, localOrder, localPoint, localVariable, order, point, setDirection, setExpression, setOrder, setPoint, setVariable, variable]);

    const flushDraftState = () => {
        setExpression(localExpression);
        setVariable(localVariable);
        setOrder(localOrder);
        setPoint(localPoint);
        setDirection(localDirection);
    };

    const classif = classification as DifferentialClassification;
    const currentModeMeta = modeMeta[activeMode];
    const modeSnippets = snippetMap[activeMode];
    const showOrderInput = activeMode === "derivative";
    const showDirectionInput = activeMode === "directional";
    const showGuidedAdvancedForm = activeMode === "ode" || activeMode === "pde" || activeMode === "sde";
    const variableHint =
        activeMode === "ode"
            ? "Use one independent variable and write equation in the formula field."
            : activeMode === "pde"
                ? "Use independent vars like x, t and PDE shorthand such as u_t = u_x."
                : activeMode === "sde"
                    ? "Use stochastic shorthand: dX = mu*dt + sigma*dW."
        : activeMode === "jacobian"
            ? "Vector function expects variables like x, y or r, theta."
            : activeMode === "hessian"
              ? "Hessian works on scalar fields across 2 or more variables."
              : activeMode === "partial"
                ? "Use comma-separated variables for local multi-axis analysis."
                : "Single-variable differentiation is the default fast lane.";

    const pointFieldLabel =
        activeMode === "ode"
            ? "Initial / Boundary Data"
            : activeMode === "pde"
                ? "Condition Note"
                : activeMode === "sde"
                    ? "Grid / Horizon"
                    : "Evaluation Point";

    const solveStatusLabel =
        solvePhase === "analytic-loading"
            ? "Analyzing"
            : solvePhase === "exact-ready"
              ? "Exact ready"
              : solvePhase === "numerical-ready"
                ? "Numerical ready"
                : solvePhase === "error"
                  ? "Attention"
                  : "Ready";

    const classificationToneClass =
        classif?.support === "supported"
            ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
            : classif?.support === "partial"
              ? "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300"
              : "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300";

    const analyticStatusToneClass =
        solvePhase === "error"
            ? "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300"
            : solvePhase === "exact-ready"
              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
              : solvePhase === "analytic-loading"
                ? "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300"
                : "border-border/60 bg-muted/10 text-muted-foreground";

    const renderedPreviewContent =
        activeMode === "derivative"
            ? `$$\\frac{d}{d${deferredVariable || "x"}}\\left(${deferredExpression || "f(x)"}\\right)$$`
            : activeMode === "partial"
              ? `$$\\nabla\\left(${deferredExpression || "f(x,y)"}\\right)$$`
              : activeMode === "directional"
                ? `$$D_{u}\\left(${deferredExpression || "f(x,y)"}\\right)\\quad u=${localDirection || "(1,0)"}$$`
                : activeMode === "jacobian"
                  ? `$$J_F(${deferredVariable || "x, y"})\\quad F=${deferredExpression || "[f_1, f_2]"}$$`
                  : activeMode === "ode"
                    ? `$$${odeEquation || "y' = y"}$$`
                    : activeMode === "pde"
                      ? `$$${pdeEquation || "u_t = u_x"}$$`
                      : activeMode === "sde"
                        ? `$$dX = (${sdeDrift || "0.4X"})dt + (${sdeDiffusion || "0.2X"})dW$$`
                        : `$$H_f(${deferredVariable || "x, y"})\\quad f=${deferredExpression || "f(x,y)"}$$`;

    const insertSnippet = (snippet: string) => {
        let next = snippet;
        if (snippet === "pi") {
            next = "pi";
        } else if (snippet === "[f1, f2]") {
            next = "[sin(x), cos(y)]";
        }

        setLocalExpression((current: string) => (current ? `${current}${next}` : next));
    };

    const applyODEDraft = (nextEquation: string, nextCondition: string) => {
        setOdeEquation(nextEquation);
        setOdeCondition(nextCondition);
        setLocalExpression(nextCondition ? `${nextEquation}; ${nextCondition}` : nextEquation);
        setLocalPoint(nextCondition);
        setLocalVariable(localVariable || "x");
    };

    const applyPDEDraft = (nextEquation: string, nextInitial: string, nextVariables: string) => {
        setPdeEquation(nextEquation);
        setPdeInitial(nextInitial);
        setPdeVariables(nextVariables);
        setLocalExpression(nextInitial ? `${nextEquation}; ${nextInitial}` : nextEquation);
        setLocalPoint(nextInitial);
        setLocalVariable(nextVariables);
    };

    const applySDEDraft = (nextDrift: string, nextDiffusion: string, nextX0: string, nextRange: string, nextSteps: string) => {
        setSdeDrift(nextDrift);
        setSdeDiffusion(nextDiffusion);
        setSdeX0(nextX0);
        setSdeRange(nextRange);
        setSdeSteps(nextSteps);
        setLocalExpression(`dX = ${nextDrift}*dt + ${nextDiffusion}*dW`);
        setLocalPoint(`X(0)=${nextX0}; t:[${nextRange}]; n=${nextSteps}`);
        setLocalVariable("t");
    };

    const handleModeChange = (nextMode: DifferentialExtendedMode) => {
        React.startTransition(() => {
            setMode(nextMode);
            if (nextMode === "jacobian" && !localExpression.includes("[")) {
                setLocalExpression("[sin(x*y), x+y]");
            }
            if ((nextMode === "jacobian" || nextMode === "hessian" || nextMode === "partial") && !localVariable.includes(",")) {
                setLocalVariable("x, y");
            }
            if ((nextMode === "jacobian" || nextMode === "hessian" || nextMode === "partial") && !localPoint.includes(",")) {
                setLocalPoint("1, 1");
            }
            if (nextMode === "directional") {
                if (!localVariable.includes(",")) setLocalVariable("x, y");
                if (!localPoint.includes(",")) setLocalPoint("1, 1");
                if (!localDirection.includes(",")) setLocalDirection("1, 0");
            }
            if (nextMode === "derivative" && localVariable.includes(",")) {
                setLocalVariable("x");
                setLocalPoint("1");
            }
        });
    };

    const controlInputClassName =
        "h-11 w-full rounded-2xl border border-border/60 bg-background px-3.5 text-sm font-medium text-foreground outline-none transition-all placeholder:text-muted-foreground/65 focus:border-accent/30 focus:ring-4 focus:ring-[var(--accent-soft)]";
    const controlMonoInputClassName = `${controlInputClassName} font-mono`;

    return (
        <div className="site-panel">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 bg-background/80 px-5 py-4">
                <div className="flex items-center gap-2">
                    <div className="site-eyebrow text-accent">Problem Composer</div>
                    <div className="rounded-full border border-border/60 bg-background px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">
                        {currentModeMeta.helperLabel}
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <div className="rounded-full border border-border/60 bg-background px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">
                        {localVariable.split(",").map((item: string) => item.trim()).filter(Boolean).length || 1} vars
                    </div>
                    <div
                        className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] transition-colors ${
                            solvePhase === "error"
                                ? "border-rose-500/25 bg-rose-500/10 text-rose-700 dark:text-rose-300"
                                : "border-teal-500/25 bg-teal-500/10 text-teal-700 dark:text-teal-300"
                        }`}
                    >
                        <span className="inline-flex items-center gap-1.5">
                            <Activity className="h-3.5 w-3.5" />
                            {solveStatusLabel}
                        </span>
                    </div>
                </div>
            </div>

            <div className="grid gap-4 p-5 xl:grid-cols-[minmax(0,1.18fr)_minmax(320px,0.82fr)] 2xl:grid-cols-[minmax(0,1.32fr)_minmax(340px,0.68fr)]">
                <div className="space-y-4">
                    <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-[minmax(0,1.35fr)_240px_190px]">
                        <div className="min-w-0 rounded-2xl border border-border/60 bg-background/70 px-3 py-3 md:col-span-1 2xl:col-span-1">
                            <div className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">
                                Analysis Mode
                            </div>
                            <div className="relative">
                                <select
                                    data-testid="diff-mode-select"
                                    value={activeMode}
                                    onChange={(e) => handleModeChange(e.target.value as DifferentialExtendedMode)}
                                    className={`${controlInputClassName} min-w-0 appearance-none pr-10 font-semibold md:min-w-[220px]`}
                                >
                                    {modeOptions.map((option) => (
                                        <option key={option.id} value={option.id}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground">
                                    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                                        <path
                                            fillRule="evenodd"
                                            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-border/60 bg-background/70 px-3 py-3 md:col-span-1 2xl:col-span-1">
                            <label className="mb-2 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">
                                <Orbit className="h-3.5 w-3.5" />
                                Mode Scope
                            </label>
                            <div className="flex min-h-[44px] items-center rounded-xl border border-border/50 bg-muted/10 px-3 text-sm font-medium text-foreground">
                                {currentModeMeta.targetTitle}
                            </div>
                        </div>

                        <div className="rounded-2xl border border-border/60 bg-background/70 px-2.5 py-3 md:col-span-2 2xl:col-span-1">
                            <div className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">Variables</div>
                            <div className="mt-2 flex min-h-[44px] items-center rounded-xl border border-border/50 bg-muted/10 px-2.5 text-sm font-medium text-foreground">
                                {variableHint}
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                        <div className="text-[10px] font-black uppercase tracking-[0.16em] text-accent">Formula</div>
                        <FormulaQuickPalette
                            onInsert={insertSnippet}
                            currentMode={activeMode}
                            className="mt-2 mb-3"
                        />
                        <textarea
                            data-testid="diff-expression-input"
                            value={localExpression}
                            onChange={(e) => setLocalExpression(e.target.value)}
                            onBlur={flushDraftState}
                            placeholder={currentModeMeta.formulaPlaceholder}
                            className="mt-3 min-h-24 w-full resize-y rounded-2xl border-2 border-border/70 bg-background px-4 py-3 font-mono text-base leading-6 text-foreground outline-none transition focus:border-accent/50 focus:ring-2 focus:ring-accent/15"
                            spellCheck={false}
                        />
                        {showGuidedAdvancedForm ? (
                            <div className="mt-3 rounded-2xl border border-border/60 bg-muted/10 p-4" data-testid={`diff-guided-${activeMode}`}>
                                <div className="mb-3 text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">
                                    Guided Lane Form
                                </div>
                                {activeMode === "ode" ? (
                                    <div className="grid gap-3 md:grid-cols-2">
                                        <input
                                            data-testid="diff-ode-equation"
                                            value={odeEquation}
                                            onChange={(e) => applyODEDraft(e.target.value, odeCondition)}
                                            placeholder="y' = x + y"
                                            className={controlMonoInputClassName}
                                            spellCheck={false}
                                        />
                                        <input
                                            data-testid="diff-ode-condition"
                                            value={odeCondition}
                                            onChange={(e) => applyODEDraft(odeEquation, e.target.value)}
                                            placeholder="y(0)=1"
                                            className={controlMonoInputClassName}
                                            spellCheck={false}
                                        />
                                    </div>
                                ) : null}
                                {activeMode === "pde" ? (
                                    <div className="grid gap-3 md:grid-cols-3">
                                        <input
                                            data-testid="diff-pde-equation"
                                            value={pdeEquation}
                                            onChange={(e) => applyPDEDraft(e.target.value, pdeInitial, pdeVariables)}
                                            placeholder="u_t = k*u_xx"
                                            className={controlMonoInputClassName}
                                            spellCheck={false}
                                        />
                                        <input
                                            data-testid="diff-pde-initial"
                                            value={pdeInitial}
                                            onChange={(e) => applyPDEDraft(pdeEquation, e.target.value, pdeVariables)}
                                            placeholder="u(x,0)=sin(x)"
                                            className={controlMonoInputClassName}
                                            spellCheck={false}
                                        />
                                        <input
                                            data-testid="diff-pde-variables"
                                            value={pdeVariables}
                                            onChange={(e) => applyPDEDraft(pdeEquation, pdeInitial, e.target.value)}
                                            placeholder="x, t"
                                            className={controlMonoInputClassName}
                                            spellCheck={false}
                                        />
                                    </div>
                                ) : null}
                                {activeMode === "sde" ? (
                                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                                        <input
                                            data-testid="diff-sde-drift"
                                            value={sdeDrift}
                                            onChange={(e) => applySDEDraft(e.target.value, sdeDiffusion, sdeX0, sdeRange, sdeSteps)}
                                            placeholder="0.4*X"
                                            className={controlMonoInputClassName}
                                            spellCheck={false}
                                        />
                                        <input
                                            data-testid="diff-sde-diffusion"
                                            value={sdeDiffusion}
                                            onChange={(e) => applySDEDraft(sdeDrift, e.target.value, sdeX0, sdeRange, sdeSteps)}
                                            placeholder="0.2*X"
                                            className={controlMonoInputClassName}
                                            spellCheck={false}
                                        />
                                        <input
                                            data-testid="diff-sde-x0"
                                            value={sdeX0}
                                            onChange={(e) => applySDEDraft(sdeDrift, sdeDiffusion, e.target.value, sdeRange, sdeSteps)}
                                            placeholder="1"
                                            className={controlMonoInputClassName}
                                            spellCheck={false}
                                        />
                                        <input
                                            data-testid="diff-sde-range"
                                            value={sdeRange}
                                            onChange={(e) => applySDEDraft(sdeDrift, sdeDiffusion, sdeX0, e.target.value, sdeSteps)}
                                            placeholder="0,1"
                                            className={controlMonoInputClassName}
                                            spellCheck={false}
                                        />
                                        <input
                                            data-testid="diff-sde-steps"
                                            value={sdeSteps}
                                            onChange={(e) => applySDEDraft(sdeDrift, sdeDiffusion, sdeX0, sdeRange, e.target.value)}
                                            placeholder="200"
                                            className={controlMonoInputClassName}
                                            spellCheck={false}
                                        />
                                    </div>
                                ) : null}
                                <div className="mt-3 text-xs leading-5 text-muted-foreground">
                                    Guided form generic formula maydonini avtomatik yig&apos;adi va solver contract’ni user-proof qiladi.
                                </div>
                            </div>
                        ) : null}
                        <div className="mt-3 grid gap-3 xl:grid-cols-[0.9fr_1.1fr]">
                            <div className="rounded-2xl border border-border/60 bg-background px-4 py-3">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">Detected Type</div>
                                    <div className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${classificationToneClass}`}>
                                        {classif?.support || "unknown"}
                                    </div>
                                </div>
                                <div className="mt-2 text-sm font-black text-foreground">{classif?.label || "Unknown"}</div>
                                <div className="mt-1 text-xs leading-5 text-muted-foreground line-clamp-3">{classif?.summary || "..."}</div>
                            </div>

                            <div className="min-w-0 overflow-hidden rounded-2xl border border-border/60 bg-background px-4 py-3">
                                <div className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">Rendered Preview</div>
                                <div className="mt-2 overflow-x-auto text-sm">
                                    <div className="min-w-0 break-words">
                                        <LaboratoryInlineMathMarkdown content={renderedPreviewContent} />
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-2xl border border-border/60 bg-background px-4 py-3 xl:col-span-2">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <div className="text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">Analytic Status</div>
                                    <div className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${analyticStatusToneClass}`}>
                                        {solveStatusLabel}
                                    </div>
                                </div>
                                <div className="mt-2 text-sm font-black text-foreground">{currentModeMeta.targetTitle}</div>
                                <div className="mt-1 text-xs leading-5 text-muted-foreground">
                                    {currentModeMeta.targetSummary}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                        <div className="text-[10px] font-black uppercase tracking-[0.16em] text-accent">Differentiation Target</div>
                        <div className={`mt-3 grid gap-3 ${showOrderInput || showDirectionInput ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"}`}>
                            <div className="rounded-2xl border border-border/60 bg-background p-3">
                                <div className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">
                                    {currentModeMeta.variableLabel}
                                </div>
                                <input
                                    data-testid="diff-variable-input"
                                    value={localVariable}
                                    onChange={(e) => setLocalVariable(e.target.value)}
                                    onBlur={flushDraftState}
                                    placeholder={currentModeMeta.variablePlaceholder}
                                    className={`${controlMonoInputClassName} text-center`}
                                    spellCheck={false}
                                />
                            </div>

                            {showOrderInput ? (
                                <div className="rounded-2xl border border-border/60 bg-background p-3">
                                    <div className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">Order (n)</div>
                                    <input
                                        data-testid="diff-order-input"
                                        value={localOrder}
                                        onChange={(e) => setLocalOrder(e.target.value)}
                                        onBlur={flushDraftState}
                                        placeholder="1"
                                        className={`${controlMonoInputClassName} text-center`}
                                        spellCheck={false}
                                    />
                                </div>
                            ) : null}

                            {showDirectionInput ? (
                                <div className="rounded-2xl border border-border/60 bg-background p-3">
                                    <div className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">Direction u</div>
                                    <input
                                        data-testid="diff-direction-input"
                                        value={localDirection}
                                        onChange={(e) => setLocalDirection(e.target.value)}
                                        onBlur={flushDraftState}
                                        placeholder="1, 0"
                                        className={`${controlMonoInputClassName} text-center`}
                                        spellCheck={false}
                                    />
                                </div>
                            ) : null}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                        <label className="mb-2 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-accent">
                            <SlidersHorizontal className="h-3.5 w-3.5" />
                            {pointFieldLabel}
                        </label>
                        <div className="relative">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm text-muted-foreground">@</div>
                            <input
                                data-testid="diff-point-input"
                                type="text"
                                value={localPoint}
                                onChange={(e) => setLocalPoint(e.target.value)}
                                onBlur={flushDraftState}
                                placeholder={currentModeMeta.pointPlaceholder}
                                className={`${controlMonoInputClassName} pl-8`}
                                spellCheck={false}
                            />
                        </div>
                    </div>

                    <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                        <div className="text-[10px] font-black uppercase tracking-[0.16em] text-accent">Operation Scope</div>
                        <div className="mt-3 space-y-3">
                            <div className="rounded-2xl border border-border/60 bg-background px-3 py-3 text-sm font-semibold text-foreground">
                                {currentModeMeta.helperLabel}
                            </div>
                            <div className="rounded-2xl border border-dashed border-border/60 bg-muted/10 px-3 py-3 text-xs leading-5 text-muted-foreground">
                                {activeMode === "jacobian"
                                    ? "Vector-valued functionsni [f1, f2, ...] ko'rinishida yozing. Variables va point bir xil tartibda berilishi kerak."
                                    : activeMode === "hessian"
                                      ? "Scalar field kiriting. System diagonal va mixed partial second derivative strukturasini tahlil qiladi."
                                      : activeMode === "partial"
                                        ? "Ko'p o'zgaruvchili scalar field kiriting. Point vergul bilan ajratiladi."
                                        : activeMode === "ode"
                                          ? "Equation ko'rinishida yozing: y' = f(x, y); y(0)=1."
                                          : activeMode === "pde"
                                            ? "PDE shorthand kiriting: u_t = u_x yoki u_t = k*u_xx."
                                            : activeMode === "sde"
                                              ? "Stochastic syntax kiriting: dX = mu*dt + sigma*dW; X(0)=1; t:[0,1]; n=200."
                                        : "Single-variable lane uchun scalar function kiriting va evaluation point tanlang."}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <button
                            data-testid="diff-solve-button"
                            type="button"
                            onClick={() => {
                                flushDraftState();
                                window.setTimeout(requestSolve, 0);
                            }}
                            disabled={solvePhase === "analytic-loading"}
                            className={`flex h-11 w-full items-center justify-center gap-2 rounded-2xl text-[13px] font-bold uppercase tracking-[0.12em] transition-all ${
                                isResultStale && solvePhase !== "analytic-loading"
                                    ? "border border-accent/40 bg-accent text-white shadow-lg shadow-accent/20 hover:scale-[1.01] active:scale-[0.99]"
                                    : solvePhase === "analytic-loading"
                                      ? "cursor-not-allowed bg-muted text-muted-foreground"
                                      : "site-btn-accent"
                            }`}
                        >
                            {solvePhase === "analytic-loading" ? (
                                "Analyzing..."
                            ) : (
                                <>
                                    <Sparkles className="h-4 w-4" />
                                    Analyze And Solve
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
