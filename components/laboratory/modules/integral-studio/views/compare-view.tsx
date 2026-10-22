import React from "react";

import { LaboratoryMetricCard } from "@/components/laboratory/laboratory-metric-card";
import { LaboratoryDataTable } from "@/components/laboratory/laboratory-data-table";
import { LaboratoryResultLevelsPanel } from "@/components/laboratory/laboratory-result-levels-panel";
import { MethodIntelligenceTable } from "@/components/laboratory/method-intelligence-table";
import { getLaboratoryMethodOptions } from "@/components/laboratory/method-selector/method-registry";
import { buildMethodIntelligenceRows } from "@/lib/method-intelligence";

import { ScenarioPanel } from "../components/scenario-panel";
import { TrustPanel } from "../components/trust-panel";
import { StudioMetricCard } from "../presentation-types";
import type { IntegralComputationSummary, SingleIntegralSummary } from "../types";

type CompareViewProps = {
    compareOverviewCards: StudioMetricCard[];
    trustPanelProps: React.ComponentProps<typeof TrustPanel>;
    resultLevelCards: React.ComponentProps<typeof LaboratoryResultLevelsPanel>["cards"];
    riskRegisterCards: StudioMetricCard[];
    methodAuditCards: StudioMetricCard[];
    scenarioPanelProps: React.ComponentProps<typeof ScenarioPanel>;
    summary: IntegralComputationSummary | null;
};

export function CompareView({
    compareOverviewCards,
    trustPanelProps,
    resultLevelCards,
    riskRegisterCards,
    methodAuditCards,
    scenarioPanelProps,
    summary,
}: CompareViewProps) {
    const comparisonRows = React.useMemo(() => {
        if (!summary) return [];
        if ("simpson" in summary) {
            const single = summary as SingleIntegralSummary;
            const values = [
                { method: "Simpson", value: single.simpson },
                { method: "Midpoint", value: single.midpoint },
                { method: "Trapezoid", value: single.trapezoid },
            ];
            const baseline = Math.abs(single.simpson) || 1;
            return values.map((item) => [
                item.method,
                item.value.toPrecision(12),
                `${Math.abs(item.value - single.simpson).toExponential(2)}`,
                `${((Math.abs(item.value - single.simpson) / baseline) * 100).toFixed(4)}%`,
            ]);
        }
        return [["Grid estimate", String(summary.value), "n/a", "n/a"]];
    }, [summary]);
    const methodIntelligenceRows = React.useMemo(
        () =>
            buildMethodIntelligenceRows({
                options: getLaboratoryMethodOptions("integral"),
                selectedMethod: "auto",
                exactResult: comparisonRows[0]?.[1],
                numericResult: comparisonRows[0]?.[1],
            }),
        [comparisonRows],
    );

    return (
        <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
                {compareOverviewCards.map((card) => (
                    <LaboratoryMetricCard key={`compare-summary-${card.eyebrow}-${card.value}`} {...card} />
                ))}
            </div>
            <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="space-y-6">
                    <LaboratoryDataTable
                        eyebrow="Real comparison"
                        title="Method-by-method numeric audit"
                        columns={["Method", "Value", "Abs. diff", "Rel. diff"]}
                        rows={comparisonRows}
                        emptyMessage="Solve natijasi kelgach compare jadvali real hisoblanadi."
                    />
                    <MethodIntelligenceTable rows={methodIntelligenceRows} />
                    <TrustPanel {...trustPanelProps} />
                    <LaboratoryResultLevelsPanel
                        cards={resultLevelCards}
                        eyebrow="Comparison Views"
                        description="Bir xil natijani tez, texnik va research darajada interpretatsiya qiling."
                    />
                </div>
                <div className="space-y-6">
                    <div className="site-panel space-y-4 p-5">
                        <div className="site-eyebrow text-amber-600">Risk Register</div>
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                            {riskRegisterCards.map((card) => (
                                <LaboratoryMetricCard key={`risk-${card.eyebrow}-${card.value}`} {...card} />
                            ))}
                        </div>
                    </div>
                    <div className="site-panel space-y-4 p-5">
                        <div className="site-eyebrow text-sky-600">Method Audit Snapshot</div>
                        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                            {methodAuditCards.map((card) => (
                                <LaboratoryMetricCard key={`compare-audit-${card.eyebrow}-${card.value}`} {...card} />
                            ))}
                        </div>
                    </div>
                    <ScenarioPanel {...scenarioPanelProps} />
                </div>
            </div>
        </div>
    );
}
