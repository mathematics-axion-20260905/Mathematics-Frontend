import React from "react";
import { Trash2 } from "lucide-react";

import { StudioMetricCard } from "../presentation-types";

type StudioStatusBarProps = {
    cards: StudioMetricCard[];
    resetWorkspace: () => void;
};

export function StudioStatusBar({ cards, resetWorkspace }: StudioStatusBarProps) {
    return (
        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border/50 bg-background px-4 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] shadow-[0_-8px_30px_rgba(0,0,0,0.06)] transition-all">
            <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-8">
                <div className="scrollbar-hide flex flex-1 items-center gap-5 overflow-x-auto pr-4">
                    {cards.map((card) => (
                        <div key={`${card.eyebrow}-${card.value}`} title={card.detail} className="group flex max-w-[230px] shrink-0 items-center gap-2 transition-opacity hover:opacity-80">
                            <div className="flex flex-col">
                                <span className="mb-1 text-[8px] font-black uppercase leading-none tracking-[0.2em] text-muted-foreground/70">{card.eyebrow}</span>
                                <div className="flex items-center gap-1.5 leading-none">
                                    <div
                                        className={`h-1 w-1 rounded-full ${
                                            card.tone === "success"
                                                ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                                                : card.tone === "warn"
                                                  ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]"
                                                  : card.tone === "info"
                                                    ? "bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.5)]"
                                                    : "bg-muted-foreground/40"
                                        }`}
                                    />
                                    <span className="truncate text-[11px] font-black uppercase tracking-tight text-foreground/90">{card.value}</span>
                                </div>
                            </div>
                            <div className="h-4 w-px bg-border/40 last:hidden" />
                        </div>
                    ))}
                </div>

                <div className="flex items-center gap-3 border-l border-border/50 pl-4">
                    <button
                        onClick={resetWorkspace}
                        title="Reset Laboratory"
                        className="flex h-8 items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/5 px-3.5 text-[10px] font-black uppercase tracking-[0.15em] text-rose-600 transition-all hover:bg-rose-500/10 hover:shadow-lg active:scale-95"
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Reset</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
