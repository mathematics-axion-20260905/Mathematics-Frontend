"use client";

import React, { createContext, useContext, useMemo, useState, useCallback } from "react";

/**
 * LabEngine is the centralized heart of the laboratory modules.
 * It manages shared state, plotting configurations, and calculation pipelines.
 */

export type LabVisualizationType = "2d" | "3d" | "surface" | "scatter" | "volume";

export interface LabDataset {
    id: string;
    label: string;
    type: LabVisualizationType;
    data: unknown[];
    color?: string;
    visible?: boolean;
}

interface LabEngineState {
    datasets: LabDataset[];
    activeDatasetId: string | null;
    isCalculating: boolean;
    error: string | null;
}

interface LabEngineContextType extends LabEngineState {
    registerDataset: (dataset: LabDataset) => void;
    unregisterDataset: (id: string) => void;
    setActiveDataset: (id: string | null) => void;
    setCalculating: (busy: boolean) => void;
    setError: (msg: string | null) => void;
    clearDatasets: () => void;
}

const LabEngineContext = createContext<LabEngineContextType | undefined>(undefined);

export function LabEngineProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<LabEngineState>({
        datasets: [],
        activeDatasetId: null,
        isCalculating: false,
        error: null,
    });

    const registerDataset = useCallback((dataset: LabDataset) => {
        setState((prev) => ({
            ...prev,
            datasets: [...prev.datasets.filter((d) => d.id !== dataset.id), dataset],
        }));
    }, []);

    const unregisterDataset = useCallback((id: string) => {
        setState((prev) => ({
            ...prev,
            datasets: prev.datasets.filter((d) => d.id !== id),
        }));
    }, []);

    const setActiveDataset = useCallback((id: string | null) => {
        setState((prev) => ({ ...prev, activeDatasetId: id }));
    }, []);

    const setCalculating = useCallback((isCalculating: boolean) => {
        setState((prev) => ({ ...prev, isCalculating }));
    }, []);

    const setError = useCallback((error: string | null) => {
        setState((prev) => ({ ...prev, error }));
    }, []);

    const clearDatasets = useCallback(() => {
        setState((prev) => ({ ...prev, datasets: [], activeDatasetId: null }));
    }, []);

    const value = useMemo(
        () => ({
            ...state,
            registerDataset,
            unregisterDataset,
            setActiveDataset,
            setCalculating,
            setError,
            clearDatasets,
        }),
        [state, registerDataset, unregisterDataset, setActiveDataset, setCalculating, setError, clearDatasets]
    );

    return <LabEngineContext.Provider value={value}>{children}</LabEngineContext.Provider>;
}

export function useLabEngine() {
    const context = useContext(LabEngineContext);
    if (context === undefined) {
        throw new Error("useLabEngine must be used within a LabEngineProvider");
    }
    return context;
}

/**
 * Centralized Plotly configuration for a premium, stable feel.
 */
export const LAB_PLOT_THEME = {
    layout: {
        paper_bgcolor: "transparent",
        plot_bgcolor: "transparent",
        font: { family: "var(--font-serif), ui-serif, Georgia, serif", color: "#52525b" },
        margin: { l: 40, r: 20, t: 40, b: 40 },
        hovermode: "closest" as const,
        showlegend: true,
        legend: {
            orientation: "h" as const,
            x: 0,
            y: 1.15,
            font: { size: 10 },
        },
        scene: {
            xaxis: { gridcolor: "rgba(148, 163, 184, 0.1)", zerolinecolor: "rgba(148, 163, 184, 0.2)" },
            yaxis: { gridcolor: "rgba(148, 163, 184, 0.1)", zerolinecolor: "rgba(148, 163, 184, 0.2)" },
            zaxis: { gridcolor: "rgba(148, 163, 184, 0.1)", zerolinecolor: "rgba(148, 163, 184, 0.2)" },
            bgcolor: "rgba(0,0,0,0)",
        },
    },
    config: {
        displayModeBar: false,
        responsive: true,
        scrollZoom: false,
        doubleClick: "reset+autosize" as const,
    },
};
