import type { MatrixExperienceLevel, MatrixMode } from "../types";
import { getMatrixDimensionOptions } from "../matrix-dimension-options";
import { FormulaQuickPalette } from "@/components/laboratory/formula-quick-palette";

type Props = {
    mode: MatrixMode;
    setMode: (value: MatrixMode) => void;
    matrixExpression: string;
    setMatrixExpression: (value: string) => void;
    rhsExpression: string;
    setRhsExpression: (value: string) => void;
    dimension: string;
    setDimension: (value: string) => void;
    experienceLevel: MatrixExperienceLevel;
    activePresetLabel?: string;
};

const modeCopy: Record<MatrixMode, { label: string; helper: string; placeholder: string }> = {
    algebra: {
        label: "Matrix Algebra",
        helper: "Determinant, inverse, trace va rank auditlari uchun square matrix kiriting.",
        placeholder: "2 1; 1 3",
    },
    decomposition: {
        label: "Spectral / Decomposition",
        helper: "Eigenvalue, eigenvector, LU/QR/SVD oilalari uchun simmetrik yoki square matrix bilan boshlang.",
        placeholder: "4 1; 1 3",
    },
    systems: {
        label: "Linear Systems",
        helper: "A*x=b tipidagi sistema, elimination trace va least-squares audit uchun RHS vector qo'shing.",
        placeholder: "2 -1 0; -1 2 -1; 0 -1 2",
    },
    transform: {
        label: "Linear Transform",
        helper: "2D transform, basis distortion va geometry preview uchun transform matrix kiriting.",
        placeholder: "1.2 0.4; -0.3 0.9",
    },
    tensor: {
        label: "Tensor Analysis",
        helper: "Rank-3 tensor slice'larini `||` bilan, higher-order bloklarni `###` bilan ajrating. Unfolding, contraction, Tucker/CP va sparse audit shu lane'da ishlaydi.",
        placeholder: "1 0 2; 0 1 1 || 2 1 0; 1 0 1 || 0 2 1; 1 1 0 ### 0 1 0; 1 0 0 || 1 1 0; 0 0 1 || 0 0 1; 1 0 1",
    },
};

export function SolverControl({
    mode,
    setMode,
    matrixExpression,
    setMatrixExpression,
    rhsExpression,
    setRhsExpression,
    dimension,
    setDimension,
    experienceLevel,
    activePresetLabel,
}: Props) {
    const copy = modeCopy[mode];
    const dimensionOptions = getMatrixDimensionOptions(mode);
    const activeDimension = dimensionOptions.find((option) => option.value === dimension) ?? dimensionOptions[0];
    const matrixPreview =
        mode === "tensor"
            ? matrixExpression
                  .split("###")[0]
                  .split("||")
                  .map((slice) =>
                      slice
                          .split(";")
                          .map((row) => row.trim())
                          .filter(Boolean)
                          .map((row) => row.split(/[\s,]+/).filter(Boolean)),
                  )
                  .filter((slice) => slice.length)
            : [
                  matrixExpression
                      .split(";")
                      .map((row) => row.trim())
                      .filter(Boolean)
                      .map((row) => row.split(/[\s,]+/).filter(Boolean)),
              ];
    const rhsPreview = rhsExpression.split(";").map((row) => row.trim()).filter(Boolean);

    return (
        <div className="site-lab-card p-5">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">Problem Composer</div>
                    <div className="mt-2 text-xl font-black tracking-tight text-foreground">{copy.label}</div>
                    <div className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{copy.helper}</div>
                </div>
                <div className="rounded-2xl border border-border/60 bg-muted/30 px-3 py-2 text-right">
                    <div className="text-[9px] font-black uppercase tracking-[0.18em] text-muted-foreground">Preset</div>
                    <div className="mt-1 text-sm font-bold text-foreground">{activePresetLabel ?? "Custom"}</div>
                </div>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-[0.8fr_1.2fr_0.8fr]">
                <label className="space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">Analysis Mode</span>
                    <select
                        value={mode}
                        onChange={(e) => setMode(e.target.value as MatrixMode)}
                        className="h-11 w-full rounded-2xl border border-border/60 bg-background px-4 text-sm font-semibold text-foreground outline-none transition focus:border-accent"
                    >
                        <option value="algebra">Matrix Algebra</option>
                        <option value="decomposition">Decomposition</option>
                        <option value="systems">Linear Systems</option>
                        <option value="transform">Linear Transform</option>
                        <option value="tensor">Tensor</option>
                    </select>
                </label>

                <label className="space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">Dimension Scope</span>
                    <select
                        value={activeDimension?.value ?? dimension}
                        onChange={(e) => setDimension(e.target.value)}
                        className="h-11 w-full rounded-2xl border border-border/60 bg-background px-4 text-sm font-semibold text-foreground outline-none transition focus:border-accent"
                    >
                        {dimensionOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                    <div className="text-xs leading-5 text-muted-foreground">{activeDimension?.description}</div>
                </label>

                <div className="rounded-2xl border border-border/60 bg-muted/20 px-4 py-3">
                    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">Experience</div>
                    <div className="mt-1 text-sm font-bold text-foreground">{experienceLevel}</div>
                    <div className="mt-1 text-xs leading-5 text-muted-foreground">Matrix oilalari, transform va tensor lane&apos;lar shu shell ichida ishlaydi.</div>
                </div>
            </div>

            <div className="mt-5 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
                <div className="space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">Matrix / Tensor Input</span>
                    <FormulaQuickPalette
                        onInsert={(snippet) => setMatrixExpression(matrixExpression ? `${matrixExpression}; ${snippet}` : snippet)}
                        currentMode={mode}
                        className="mb-2"
                    />
                    <textarea
                        value={matrixExpression}
                        onChange={(e) => setMatrixExpression(e.target.value)}
                        rows={6}
                        placeholder={copy.placeholder}
                        spellCheck={false}
                        className="min-h-[160px] w-full resize-none rounded-3xl border border-border/60 bg-background px-4 py-4 font-mono text-sm leading-7 text-foreground outline-none transition focus:border-accent"
                    />
                </div>

                <div className="space-y-4">
                    <label className="block space-y-2">
                        <span className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">RHS / Probe Vector</span>
                        <textarea
                            value={rhsExpression}
                            onChange={(e) => setRhsExpression(e.target.value)}
                            rows={5}
                            placeholder="1; 0"
                            spellCheck={false}
                            className="w-full resize-none rounded-3xl border border-border/60 bg-background px-4 py-4 font-mono text-sm leading-7 text-foreground outline-none transition focus:border-accent"
                        />
                    </label>

                    <div className="rounded-3xl border border-border/60 bg-muted/20 p-4">
                        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">Input Rules</div>
                        <ul className="mt-3 space-y-2 text-xs leading-5 text-muted-foreground">
                            <li>Rows `;` bilan ajratiladi.</li>
                            <li>Bir qatordagi elementlar bo&apos;sh joy yoki `,` bilan ajratiladi.</li>
                            <li>Tensor slice&apos;lari `||` bilan ajratiladi.</li>
                            <li>Higher-order tensor bloklari `###` bilan ajratiladi.</li>
                            <li>RHS vector optional, `systems`, `transform` va `tensor contraction` lane&apos;da foydali.</li>
                        </ul>
                    </div>
                </div>
            </div>

            <div className="mt-4 rounded-3xl border border-border/60 bg-muted/10 p-4">
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-accent">Rendered Preview</div>
                <div className="mt-3 space-y-3">
                    {matrixPreview.map((slice, sliceIndex) => (
                        <div key={`preview-${sliceIndex}`} className="overflow-x-auto rounded-2xl border border-border/60 bg-background p-4">
                            {mode === "tensor" ? (
                                <div className="mb-3 flex items-center justify-between">
                                    <div className="site-status-pill">Slice {sliceIndex + 1}</div>
                                    <div className="text-xs text-muted-foreground">{activeDimension?.label}</div>
                                </div>
                            ) : null}
                            <div
                                className="grid gap-2"
                                style={{ gridTemplateColumns: `repeat(${Math.max(slice[0]?.length ?? 1, 1)}, minmax(56px, 1fr))` }}
                            >
                                {slice.flatMap((row, rowIndex) =>
                                    row.map((cell, columnIndex) => (
                                        <div
                                            key={`${sliceIndex}-${rowIndex}-${columnIndex}`}
                                            className="rounded-2xl border border-border/60 bg-muted/10 px-3 py-3 text-center font-mono text-sm font-semibold text-foreground"
                                        >
                                            {cell}
                                        </div>
                                    )),
                                )}
                            </div>
                        </div>
                    ))}
                    {!matrixPreview.some((slice) => slice.length) ? (
                        <div className="rounded-2xl border border-border/60 bg-background p-4 font-mono text-sm leading-7 text-muted-foreground">
                            {copy.placeholder}
                        </div>
                    ) : null}
                </div>
                {rhsPreview.length ? (
                    <div className="mt-3 rounded-2xl border border-border/60 bg-background p-4">
                        <div className="mb-3 flex items-center justify-between">
                            <div className="site-status-pill">Probe / RHS</div>
                            <div className="text-xs text-muted-foreground">{mode === "systems" ? "solve vector" : "probe vector"}</div>
                        </div>
                        <div
                            className="grid gap-2"
                            style={{ gridTemplateColumns: `repeat(${Math.max(rhsPreview.length, 1)}, minmax(56px, 84px))` }}
                        >
                            {rhsPreview.map((cell, index) => (
                                <div key={`${cell}-${index}`} className="rounded-2xl border border-border/60 bg-muted/10 px-3 py-3 text-center font-mono text-sm font-semibold text-foreground">
                                    {cell}
                                </div>
                            ))}
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    );
}
