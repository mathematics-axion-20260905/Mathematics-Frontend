"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import { AlertTriangle, Download, Loader2, Maximize2, RefreshCw } from "lucide-react";
import type { Config, Data, Layout } from "plotly.js";
import type { PlotParams } from "react-plotly.js";

const Plot = dynamic<PlotParams>(
    async () => {
        const [{ default: createPlotlyComponent }, plotlyModule] = await Promise.all([
            import("react-plotly.js/factory"),
            import("plotly.js-dist-min"),
        ]);
        return createPlotlyComponent(plotlyModule.default ?? plotlyModule);
    },
    {
        ssr: false,
        loading: () => (
            <div className="flex h-[420px] items-center justify-center rounded-[10px] border border-[var(--ax-line)] bg-[var(--ax-surface)]">
                <div className="flex items-center gap-3 text-[11px] font-semibold text-[var(--ax-text-subtle)]">
                    <Loader2 className="h-4 w-4 animate-spin text-[var(--ax-accent)]" />
                    Initializing plot engine
                </div>
            </div>
        ),
    },
);

type UnifiedPlotProps = {
    data: Data[];
    layout?: Partial<Layout>;
    config?: Partial<Config>;
    title?: string;
    height?: number;
    className?: string;
    onRefresh?: () => void;
    insights?: string[];
    snapshotFileName?: string;
};

type PlotlyModuleLike = {
    relayout: (target: unknown, update: Record<string, unknown>) => Promise<unknown>;
    toImage: (target: unknown, options: Record<string, unknown>) => Promise<string>;
};

type PlotGraphDivLike = HTMLElement;

const THREE_D_TRACE_TYPES = new Set(["scatter3d", "surface", "mesh3d", "volume"]);

function isThreeDimensional(data: Data[]) {
    return data.some((trace) => typeof trace?.type === "string" && THREE_D_TRACE_TYPES.has(trace.type));
}

export function UnifiedPlotRenderer({
    data,
    layout: layoutOverrides,
    config: configOverrides,
    title,
    height = 500,
    className,
    onRefresh,
    insights,
    snapshotFileName,
}: UnifiedPlotProps) {
    const graphRef = useRef<PlotGraphDivLike | null>(null);
    const [revision, setRevision] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [isExportingSnapshot, setIsExportingSnapshot] = useState(false);
    const hasData = data.length > 0;
    const is3D = useMemo(() => isThreeDimensional(data), [data]);

    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";

    const defaultCamera = useMemo(
        () => ({
            eye: { x: 1.55, y: 1.3, z: 1.2 },
            center: { x: 0, y: 0, z: 0 },
            up: { x: 0, y: 0, z: 1 },
        }),
        [],
    );

    const finalizedLayout = useMemo(() => {
        const axisStyle = {
            gridcolor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(148, 163, 184, 0.16)",
            zerolinecolor: isDark ? "rgba(255, 255, 255, 0.22)" : "rgba(100, 116, 139, 0.24)",
            tickfont: { size: 10, color: isDark ? "#94a3b8" : "#66707d" },
            titlefont: { size: 11, color: isDark ? "#e2e8f0" : "#303740" },
            showbackground: false,
            showspikes: false,
        };

        const baseLayout: Partial<Layout> = {
            title: title
                ? {
                      text: title,
                      font: { family: "var(--font-playfair)", size: 14, color: isDark ? "#f8fafc" : "#171a20" },
                      x: 0.025,
                      xanchor: "left",
                  }
                : undefined,
            autosize: true,
            height,
            paper_bgcolor: "transparent",
            plot_bgcolor: "transparent",
            margin: { l: 24, r: 20, b: 34, t: title ? 52 : 22 },
            font: { family: "var(--font-inter)", color: isDark ? "#cbd5e1" : "#4f5965" },
            showlegend: data.some((trace) => typeof trace?.name === "string" && trace.name.trim().length > 0),
            legend: {
                orientation: "h",
                x: 0,
                y: -0.12,
                bgcolor: "rgba(255,255,255,0)",
                font: { size: 10, color: isDark ? "#94a3b8" : "#606a76" },
            },
            hovermode: is3D ? false : "closest",
            uirevision: is3D ? "mathsphere-3d" : "mathsphere-2d",
        };

        const merged = { ...baseLayout, ...layoutOverrides } as Partial<Layout>;

        if (is3D) {
            merged.scene = {
                xaxis: { ...axisStyle, title: { text: "x" }, ...(layoutOverrides?.scene?.xaxis || {}) },
                yaxis: { ...axisStyle, title: { text: "y" }, ...(layoutOverrides?.scene?.yaxis || {}) },
                zaxis: { ...axisStyle, title: { text: "z" }, ...(layoutOverrides?.scene?.zaxis || {}) },
                dragmode: "orbit",
                aspectmode: "data",
                camera: layoutOverrides?.scene?.camera || defaultCamera,
                bgcolor: "rgba(255,255,255,0)",
                ...(layoutOverrides?.scene || {}),
            };
            delete merged.xaxis;
            delete merged.yaxis;
        } else {
            merged.xaxis = { ...axisStyle, ...(layoutOverrides?.xaxis || {}) };
            merged.yaxis = { ...axisStyle, ...(layoutOverrides?.yaxis || {}) };
            delete merged.scene;
        }

        return merged;
    }, [data, defaultCamera, height, is3D, isDark, layoutOverrides, title]);

    const finalizedConfig = useMemo(
        () =>
            ({
                displayModeBar: false,
                displaylogo: false,
                responsive: true,
                scrollZoom: false,
                doubleClick: "reset+autosize" as const,
                ...configOverrides,
            }) satisfies Partial<Config>,
        [configOverrides],
    );

    const handleHardRefresh = useCallback(() => {
        setError(null);
        setRevision((current) => current + 1);
        onRefresh?.();
    }, [onRefresh]);

    const applyCamera = useCallback(async (camera: { eye: { x: number; y: number; z: number }; center: { x: number; y: number; z: number }; up: { x: number; y: number; z: number } }) => {
        if (!graphRef.current) return;
        try {
            const plotlyModule = await import("plotly.js-dist-min");
            const plotly = ((plotlyModule as unknown as { default?: PlotlyModuleLike }).default ?? (plotlyModule as unknown as PlotlyModuleLike));
            await plotly.relayout(graphRef.current, { "scene.camera": camera });
        } catch (nextError) {
            setError(nextError instanceof Error ? nextError.message : "Camera update failed.");
        }
    }, []);

    const handleSnapshotExport = useCallback(async () => {
        if (!graphRef.current) return;
        setIsExportingSnapshot(true);
        setError(null);
        try {
            const plotlyModule = await import("plotly.js-dist-min");
            const plotly = ((plotlyModule as unknown as { default?: PlotlyModuleLike }).default ?? (plotlyModule as unknown as PlotlyModuleLike));
            const imageUrl = await plotly.toImage(graphRef.current, {
                format: "png",
                width: 1400,
                height: Math.max(800, Math.round(height * 1.7)),
                scale: 1.5,
            });
            const anchor = document.createElement("a");
            anchor.href = imageUrl;
            anchor.download = `${snapshotFileName || (title ? title.toLowerCase().replace(/[^a-z0-9]+/g, "-") : "laboratory-plot")}.png`;
            anchor.click();
        } catch (nextError) {
            setError(nextError instanceof Error ? nextError.message : "Snapshot export failed.");
        } finally {
            setIsExportingSnapshot(false);
        }
    }, [height, snapshotFileName, title]);

    const cameraPresets = useMemo(
        () => [
            { id: "iso", label: "Iso", camera: defaultCamera },
            { id: "top", label: "Top", camera: { eye: { x: 0.01, y: 0.01, z: 2.3 }, center: { x: 0, y: 0, z: 0 }, up: { x: 0, y: 1, z: 0 } } },
            { id: "front", label: "Front", camera: { eye: { x: 0, y: -2.35, z: 0.55 }, center: { x: 0, y: 0, z: 0 }, up: { x: 0, y: 0, z: 1 } } },
            { id: "side", label: "Side", camera: { eye: { x: 2.35, y: 0, z: 0.55 }, center: { x: 0, y: 0, z: 0 }, up: { x: 0, y: 0, z: 1 } } },
        ],
        [defaultCamera],
    );

    if (!hasData) {
        return (
            <div className={`flex flex-col items-center justify-center rounded-[10px] border border-dashed border-[var(--ax-line)] bg-[var(--ax-surface)] p-10 ${className || ""}`} style={{ height }}>
                <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--ax-text-faint)]">No plot data</div>
                <p className="mt-2 max-w-md text-center text-sm leading-6 text-[var(--ax-text-subtle)]">Visualization data is not ready yet.</p>
            </div>
        );
    }

    return (
        <div
            className={`group relative overflow-hidden rounded-[10px] border border-[var(--ax-line)] bg-[var(--ax-surface)] ${className || ""}`}
            style={{ contain: "layout paint" }}
        >
            <div className="absolute right-3 top-3 z-40 flex gap-1.5 opacity-60 md:opacity-30 md:group-hover:opacity-100 transition-opacity">
                <button type="button" onClick={handleHardRefresh} className="flex h-8 w-8 items-center justify-center rounded-[7px] border border-[var(--ax-line)] bg-[var(--ax-surface)]/90 backdrop-blur-sm text-[var(--ax-text-subtle)] hover:text-[var(--ax-text)] hover:bg-[var(--ax-surface-soft)] shadow-sm transition-colors" title="Refresh plot">
                    <RefreshCw className="h-3.5 w-3.5" />
                </button>
                <button type="button" onClick={handleSnapshotExport} className="flex h-8 w-8 items-center justify-center rounded-[7px] border border-[var(--ax-line)] bg-[var(--ax-surface)]/90 backdrop-blur-sm text-[var(--ax-text-subtle)] hover:text-[var(--ax-text)] hover:bg-[var(--ax-surface-soft)] shadow-sm transition-colors" title="Export PNG" disabled={isExportingSnapshot}>
                    {isExportingSnapshot ? <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--ax-accent)]" /> : <Download className="h-3.5 w-3.5" />}
                </button>
                {is3D ? (
                    <button type="button" onClick={() => applyCamera(defaultCamera)} className="flex h-8 w-8 items-center justify-center rounded-[7px] border border-[var(--ax-line)] bg-[var(--ax-surface)]/90 backdrop-blur-sm text-[var(--ax-text-subtle)] hover:text-[var(--ax-text)] hover:bg-[var(--ax-surface-soft)] shadow-sm transition-colors" title="Reset camera">
                        <Maximize2 className="h-3.5 w-3.5" />
                    </button>
                ) : null}
            </div>

            {is3D ? (
                <div className="absolute left-3 top-3 z-30 flex gap-1.5">
                    {cameraPresets.map((preset) => (
                        <button key={preset.id} type="button" onClick={() => applyCamera(preset.camera)} className="rounded-[6px] border border-[var(--ax-line)] bg-[var(--ax-surface)]/90 backdrop-blur-sm px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.08em] text-[var(--ax-text-subtle)] hover:text-[var(--ax-text)] hover:bg-[var(--ax-surface-soft)] shadow-sm transition-colors">
                            {preset.label}
                        </button>
                    ))}
                </div>
            ) : null}

            {insights?.length ? (
                <div className="absolute inset-x-3 top-12 z-30 flex flex-wrap gap-1.5">
                    {insights.map((insight) => (
                        <div key={insight} className="rounded-[6px] border border-[var(--ax-accent)]/30 bg-[var(--ax-accent-soft)] px-2.5 py-1 text-[9px] font-semibold text-[var(--ax-accent)] backdrop-blur-sm shadow-xs">{insight}</div>
                    ))}
                </div>
            ) : null}

            {error ? (
                <div className="absolute inset-x-3 bottom-3 z-40 rounded-[8px] border border-amber-500/30 bg-amber-500/10 backdrop-blur-md px-3 py-2 text-xs text-amber-600 dark:text-amber-400">
                    <div className="flex items-center gap-2 font-semibold"><AlertTriangle className="h-3.5 w-3.5" />Plot notice</div>
                    <div className="mt-1">{error}</div>
                </div>
            ) : null}

            <Plot
                key={revision}
                revision={revision}
                data={data}
                layout={finalizedLayout}
                config={finalizedConfig}
                useResizeHandler={true}
                style={{ width: "100%", height: `${height}px` }}
                className="h-full w-full"
                onInitialized={(_, graphDiv) => {
                    graphRef.current = graphDiv as unknown as HTMLElement;
                }}
                onUpdate={(_, graphDiv) => {
                    graphRef.current = graphDiv as unknown as HTMLElement;
                }}
                onError={(nextError) => {
                    setError(nextError instanceof Error ? nextError.message : "Plot rendering failed.");
                }}
            />
        </div>
    );
}
