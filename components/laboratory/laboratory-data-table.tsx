"use client";

import React from "react";
import { useLocale } from "@/components/locale-provider";

const UZ_LABELS: Record<string, string> = {
    Metrics: "Metrikalar",
    Metric: "Metrika",
    Value: "Qiymat",
    Notes: "Izohlar",
    "Computation Audit": "Hisoblash auditi",
    Samples: "Namunalar",
    "Rendered Data Points": "Qurilgan ma’lumot nuqtalari",
    "No metrics": "Metrikalar mavjud emas",
    "No samples": "Namunalar mavjud emas",
    "Visual Audit": "Vizual audit",
    "Runtime Signals": "Bajarilish signallari",
    "Visualization validation": "Vizualizatsiya validatsiyasi",
    "Computation comparison": "Hisoblash taqqoslanishi",
    "Method intelligence": "Usullar tahlili",
    "No data": "Ma’lumot mavjud emas",
};

export function LaboratoryDataTable({
    eyebrow,
    title,
    columns,
    rows,
    emptyMessage,
}: {
    eyebrow: string;
    title: string;
    columns: string[];
    rows: string[][];
    emptyMessage: string;
}) {
    const { locale } = useLocale();
    const translate = (value: string) => locale === "uz" ? UZ_LABELS[value] || value : value;
    return (
        <div className="site-panel p-6">
            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">{translate(eyebrow)}</div>
            <div className="mt-2 text-lg font-black tracking-tight text-foreground">{translate(title)}</div>
            {rows.length ? (
                <div className="mt-4 overflow-x-auto rounded-2xl border border-border/60 bg-background/80">
                    <table className="min-w-full border-collapse text-left text-sm">
                        <thead className="bg-muted/20 text-[10px] font-black uppercase tracking-[0.16em] text-muted-foreground">
                            <tr>
                                {columns.map((column) => (
                                    <th key={column} className="border-b border-border/60 px-4 py-3">
                                        {translate(column)}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row, rowIndex) => (
                                <tr key={`${title}-${rowIndex}`} className="border-b border-border/40 last:border-b-0">
                                    {row.map((cell, cellIndex) => (
                                        <td
                                            key={`${title}-${rowIndex}-${cellIndex}`}
                                            className="px-4 py-3 font-mono text-xs text-foreground"
                                        >
                                            {cell}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="mt-4 rounded-2xl border border-dashed border-border/60 bg-background/45 px-4 py-5 text-sm leading-7 text-muted-foreground">
                    {translate(emptyMessage)}
                </div>
            )}
        </div>
    );
}
