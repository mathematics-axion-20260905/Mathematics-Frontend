"use client";

import { useLocale } from "@/components/locale-provider";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

const UZ_LABELS: Record<string, string> = {
    "Exact solution": "Aniq yechim",
    "Solver guidance": "Yechuvchi ko‘rsatmasi",
    "Derivation strategy": "Hosil qilish strategiyasi",
    "Analytic derivation": "Analitik hosila",
};

export function LaboratoryMathPanel({
    eyebrow,
    title,
    content,
    accentClassName = "text-accent",
}: {
    eyebrow: string;
    title: string;
    content: string;
    accentClassName?: string;
}) {
    const { locale } = useLocale();
    const displayTitle = locale === "uz" ? UZ_LABELS[title] || title : title;
    return (
        <div className="site-lab-card px-5 py-4">
            <div className={`text-[10px] font-black uppercase tracking-[0.18em] ${accentClassName}`}>{eyebrow}</div>
            <div className="mt-2 text-lg font-black tracking-tight text-foreground">{displayTitle}</div>
            <div className="mt-3 prose prose-sm max-w-none text-foreground prose-p:my-3 prose-p:leading-7 prose-li:my-1 prose-li:leading-7 prose-strong:text-foreground prose-code:text-foreground">
                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                    {content}
                </ReactMarkdown>
            </div>
        </div>
    );
}
