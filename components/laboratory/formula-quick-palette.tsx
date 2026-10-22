"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp, Sparkles, Terminal } from "lucide-react";

export type PaletteCategory = "all" | "calculus" | "functions" | "symbols" | "discrete" | "linear_algebra";

export interface FormulaQuickPaletteProps {
    onInsert: (snippet: string) => void;
    currentMode?: string;
    className?: string;
    defaultExpanded?: boolean;
}

interface SymbolItem {
    label: string;
    insert: string;
    hint: string;
    category: PaletteCategory;
}

const COMMON_SYMBOLS: SymbolItem[] = [
    // Core Functions
    { label: "sin()", insert: "sin()", hint: "Sine function", category: "functions" },
    { label: "cos()", insert: "cos()", hint: "Cosine function", category: "functions" },
    { label: "tan()", insert: "tan()", hint: "Tangent function", category: "functions" },
    { label: "exp()", insert: "exp()", hint: "Exponential function e^x", category: "functions" },
    { label: "ln()", insert: "log()", hint: "Natural logarithm ln(x)", category: "functions" },
    { label: "sqrt()", insert: "sqrt()", hint: "Square root √x", category: "functions" },
    { label: "abs()", insert: "abs()", hint: "Absolute value |x|", category: "functions" },
    { label: "x²", insert: "^2", hint: "Squared power", category: "functions" },

    // Calculus & Limits
    { label: "d/dx", insert: "d/dx ", hint: "Derivative operator", category: "calculus" },
    { label: "∂/∂x", insert: "∂/∂x ", hint: "Partial derivative", category: "calculus" },
    { label: "∫", insert: "int(", hint: "Integral operator", category: "calculus" },
    { label: "lim", insert: "lim(x->0, ", hint: "Limit towards point", category: "calculus" },
    { label: "→", insert: "->", hint: "Tends to arrow", category: "calculus" },
    { label: "∞", insert: "inf", hint: "Infinity", category: "calculus" },
    { label: "y'", insert: "y' = ", hint: "First order ODE derivative", category: "calculus" },
    { label: "y''", insert: "y'' = ", hint: "Second order ODE derivative", category: "calculus" },
    { label: "u_t", insert: "u_t = ", hint: "Time partial derivative in PDE", category: "calculus" },
    { label: "u_xx", insert: "u_xx", hint: "Second spatial derivative in PDE", category: "calculus" },

    // Symbols & Constants
    { label: "π", insert: "pi", hint: "Archimedes' constant pi", category: "symbols" },
    { label: "e", insert: "e", hint: "Euler's number e", category: "symbols" },
    { label: "θ", insert: "theta", hint: "Angle theta", category: "symbols" },
    { label: "φ", insert: "phi", hint: "Angle phi", category: "symbols" },
    { label: "λ", insert: "lambda", hint: "Eigenvalue / parameter lambda", category: "symbols" },
    { label: "μ", insert: "mu", hint: "Mean / drift parameter mu", category: "symbols" },
    { label: "σ", insert: "sigma", hint: "Standard deviation / diffusion sigma", category: "symbols" },
    { label: "α", insert: "alpha", hint: "Parameter alpha", category: "symbols" },

    // Discrete & Series
    { label: "∑", insert: "sum(n=1..inf, ", hint: "Infinite sum / series", category: "discrete" },
    { label: "∏", insert: "prod(n=1..k, ", hint: "Finite product", category: "discrete" },
    { label: "n!", insert: "factorial(n)", hint: "Factorial function", category: "discrete" },
    { label: "(-1)ⁿ", insert: "(-1)^n", hint: "Alternating sign term", category: "discrete" },
    { label: "1/n", insert: "1/n", hint: "Harmonic sequence term", category: "discrete" },

    // Linear Algebra & Matrices
    { label: "[[a,b],[c,d]]", insert: "1 0; 0 1", hint: "2x2 Identity Matrix", category: "linear_algebra" },
    { label: "diag()", insert: "diag(1, 2, 3)", hint: "Diagonal matrix", category: "linear_algebra" },
    { label: "det(A)", insert: "det(A)", hint: "Matrix determinant", category: "linear_algebra" },
    { label: "tr(A)", insert: "trace(A)", hint: "Matrix trace", category: "linear_algebra" },
];

export function FormulaQuickPalette({
    onInsert,
    currentMode,
    className = "",
    defaultExpanded = false,
}: FormulaQuickPaletteProps) {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);
    const [activeCategory, setActiveCategory] = useState<PaletteCategory>("all");

    // Filter quick pills based on studio mode
    const quickPills = React.useMemo(() => {
        if (currentMode === "ode" || currentMode === "pde" || currentMode === "derivative" || currentMode === "partial") {
            return ["sin()", "cos()", "exp()", "sqrt()", "d/dx", "∂/∂x", "pi", "inf"];
        }
        if (currentMode === "series" || currentMode === "limits" || currentMode === "convergence") {
            return ["(-1)^n", "1/n", "factorial(n)", "pi", "inf", "sin()", "exp()", "log()"];
        }
        if (currentMode === "algebra" || currentMode === "decomposition" || currentMode === "systems") {
            return ["1 0; 0 1", "diag(1, 2, 3)", "lambda", "pi", "sqrt()", "0"];
        }
        // Default laboratory quick pills
        return ["sin()", "cos()", "exp()", "sqrt()", "log()", "pi", "inf", "^2"];
    }, [currentMode]);

    const filteredSymbols = React.useMemo(() => {
        if (activeCategory === "all") return COMMON_SYMBOLS;
        return COMMON_SYMBOLS.filter((s) => s.category === activeCategory);
    }, [activeCategory]);

    return (
        <div className={`rounded-2xl border border-border/60 bg-muted/20 p-2.5 transition-all ${className}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-[0.16em] text-accent">
                        <Sparkles className="h-3 w-3" />
                        Palette
                    </span>
                    {quickPills.map((pill) => (
                        <button
                            key={pill}
                            type="button"
                            onClick={() => onInsert(pill)}
                            className="rounded-lg border border-border/50 bg-background/90 px-2 py-0.5 font-mono text-[11px] font-bold text-foreground/80 shadow-xs transition hover:border-accent/40 hover:bg-accent/10 hover:text-accent active:scale-95"
                            title={`Insert ${pill}`}
                        >
                            {pill}
                        </button>
                    ))}
                </div>

                <button
                    type="button"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="inline-flex items-center gap-1 rounded-lg border border-border/50 bg-background/70 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] text-muted-foreground transition hover:border-accent/30 hover:text-foreground"
                >
                    <Terminal className="h-3 w-3" />
                    <span>{isExpanded ? "Collapse" : "More Symbols"}</span>
                    {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </button>
            </div>

            {isExpanded && (
                <div className="mt-2.5 border-t border-border/40 pt-2.5 animate-in fade-in-50 duration-200">
                    <div className="mb-2 flex flex-wrap gap-1">
                        {(
                            [
                                { id: "all", label: "All" },
                                { id: "functions", label: "Functions" },
                                { id: "calculus", label: "Calculus" },
                                { id: "symbols", label: "Symbols & Greek" },
                                { id: "discrete", label: "Discrete / Series" },
                                { id: "linear_algebra", label: "Linear Algebra" },
                            ] as Array<{ id: PaletteCategory; label: string }>
                        ).map((cat) => (
                            <button
                                key={cat.id}
                                type="button"
                                onClick={() => setActiveCategory(cat.id)}
                                className={`rounded-md px-2 py-0.5 text-[10px] font-bold tracking-tight transition ${
                                    activeCategory === cat.id
                                        ? "bg-accent text-accent-foreground shadow-xs"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                }`}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-4 gap-1 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10">
                        {filteredSymbols.map((item, idx) => (
                            <button
                                key={`${item.label}-${idx}`}
                                type="button"
                                onClick={() => onInsert(item.insert)}
                                title={item.hint}
                                className="flex flex-col items-center justify-center rounded-lg border border-border/40 bg-background/80 p-1.5 transition hover:border-accent hover:bg-accent/10 hover:shadow-xs active:scale-95"
                            >
                                <span className="font-mono text-xs font-bold text-foreground">{item.label}</span>
                                <span className="max-w-full truncate text-[8px] text-muted-foreground/75">{item.hint}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
