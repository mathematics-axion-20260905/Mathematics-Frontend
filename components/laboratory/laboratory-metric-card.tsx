import React from "react";
import { useLocale } from "@/components/locale-provider";
import { LaboratoryFormattingService } from "./services/formatting-service";

const UZ_LABELS: Record<string, string> = {
    Result: "Natija",
    "Primary result": "Asosiy natija",
    Confidence: "Ishonchlilik",
    "Next action": "Keyingi amal",
    Source: "Manba",
    Spread: "Tarqalish",
    Stable: "Barqaror",
    Status: "Holat",
    Engine: "Yechuvchi",
    Numeric: "Sonli",
    Interpretation: "Talqin",
    "Analytic derivation": "Analitik hosila",
    "Solver guidance": "Yechuvchi ko‘rsatmasi",
    "Method audit": "Usul auditi",
    Assumptions: "Farazlar",
    "Exact result": "Aniq natija",
    "Numerical result": "Sonli natija",
    "Live preview": "Jonli ko‘rish",
    Pending: "Kutilmoqda",
    "not saved": "saqlanmagan",
    saving: "saqlanmoqda",
    saved: "saqlandi",
};

export function LaboratoryMetricCard({
    eyebrow,
    value,
    detail,
    tone = "neutral",
}: {
    eyebrow: string;
    value: string;
    detail: string;
    tone?: "neutral" | "info" | "success" | "warn";
}) {
    const { locale } = useLocale();
    const tones = LaboratoryFormattingService.getStepToneClasses(tone);
    const displayEyebrow = locale === "uz" ? UZ_LABELS[eyebrow] || eyebrow : eyebrow;
    const displayValue = locale === "uz" ? UZ_LABELS[value] || value : value;
    const displayDetail = locale === "uz" ? UZ_LABELS[detail] || detail : detail;
    return (
        <div className={`site-lab-card px-5 py-4 ${tones.card}`}>
            <div className={`text-[9px] font-bold uppercase tracking-widest ${tones.badge}`}>
                {displayEyebrow}
            </div>
            <div className="mt-1 font-serif text-2xl font-black text-foreground">
                {displayValue}
            </div>
            <div className="mt-1 text-[10px] leading-5 text-muted-foreground/80 font-medium">
                {displayDetail}
            </div>
        </div>
    );
}
