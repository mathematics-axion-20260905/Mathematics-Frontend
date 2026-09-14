import React from "react";
import { useLocale } from "@/components/locale-provider";
import { LaboratoryInlineMathMarkdown } from "./laboratory-inline-math-markdown";
import { LaboratoryFormattingService } from "./services/formatting-service";

export function LaboratorySolveDetailCard({
    id,
    action,
    result,
    formula,
    tone = "neutral",
}: {
    id: string;
    action: string;
    result: string;
    formula?: string;
    tone?: "neutral" | "info" | "success" | "warn";
}) {
    const { locale } = useLocale();
    const tones = LaboratoryFormattingService.getStepToneClasses(tone);
    return (
        <div className={`site-lab-card space-y-3 p-5 ${tones.card}`}>
            <div className="flex items-center justify-between gap-4">
                <div className={`text-[10px] font-black uppercase tracking-[0.2em] ${tones.badge}`}>
                    {locale === "uz" ? "Bosqich" : "Step"} {id}
                </div>
                <div className="site-status-pill px-2 py-1 text-[9px] tracking-widening text-muted-foreground/60">
                    {locale === "uz" ? "Amal izi" : "Operation trace"}
                </div>
            </div>
            <div className="site-eyebrow text-foreground">{action}</div>
            <div className="text-sm leading-7 text-muted-foreground/90">
                {result}
            </div>
            {formula ? (
                <div className="mt-3 rounded-2xl border border-divider/40 bg-background/60 px-4 py-3 shadow-inner">
                    <LaboratoryInlineMathMarkdown content={formula} />
                </div>
            ) : null}
        </div>
    );
}
