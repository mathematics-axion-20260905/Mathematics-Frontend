import React from "react";

import { LaboratoryMathPanel } from "@/components/laboratory/laboratory-math-panel";
import { LaboratoryMetricCard } from "@/components/laboratory/laboratory-metric-card";
import { AssumptionManagerPanel } from "@/components/laboratory/assumption-manager-panel";
import { PremiumFeatureBadge } from "@/components/premium-feature-badge";
import { type Assumption, assumptionsToStatements } from "@/lib/assumptions";
import {
    LAB_PUBLICATION_PROFILE_DESCRIPTIONS,
    LAB_PUBLICATION_PROFILE_LABELS,
} from "@/lib/laboratory-publication-profile";
import type { WriterBridgePublicationProfile } from "@/lib/live-writer-bridge";

type ReportMetricCard = React.ComponentProps<typeof LaboratoryMetricCard>;

type ReportLiveTarget = {
    id: string;
    title: string;
};

export type ReportGeneratorFormat =
    | "student-solution"
    | "teacher-explanation"
    | "scientific-report"
    | "lab-report"
    | "code-appendix"
    | "latex-paper-section";

export const REPORT_GENERATOR_FORMAT_LABELS: Record<ReportGeneratorFormat, string> = {
    "student-solution": "Student solution",
    "teacher-explanation": "Teacher explanation",
    "scientific-report": "Scientific report",
    "lab-report": "Lab report",
    "code-appendix": "Code appendix",
    "latex-paper-section": "LaTeX paper section",
};

const REPORT_GENERATOR_FORMAT_DESCRIPTIONS: Record<ReportGeneratorFormat, string> = {
    "student-solution": "Step-by-step yechim, tekshiruv va qisqa xulosa.",
    "teacher-explanation": "Darsga mos izoh, metod sababi va kengroq tushuntirish.",
    "scientific-report": "Research uslubidagi metod, verification, limitation va references.",
    "lab-report": "Objective, procedure, observation, result va interpretation.",
    "code-appendix": "Hisoblashni qayta ishlatish uchun kod va provenance markazda.",
    "latex-paper-section": "Paperga qo'shiladigan ixcham akademik section.",
};

const REPORT_REQUIRED_SECTIONS = [
    "Problem Statement",
    "Method",
    "Solution",
    "Verification",
    "Graph Interpretation",
    "Code Appendix",
    "Conclusion",
];

type ReportTone = "student" | "teacher" | "scientific" | "lab";
type ReportTemplate = "clean" | "branded" | "journal" | "teacher";

function applyReportCenterControls(markdown: string, enabledSections: string[], tone: ReportTone, attachments: Record<string, boolean>, assumptions: Assumption[], template: ReportTemplate, brandLabel: string) {
    const lines = markdown.split("\n");
    const intro: string[] = [];
    const sections = new Map<string, string[]>();
    let currentSection = "";
    let currentBuffer: string[] | null = null;
    for (const line of lines) {
        const heading = line.match(/^##\s+(.+)$/);
        if (heading) {
            currentSection = heading[1].trim();
            currentBuffer = REPORT_REQUIRED_SECTIONS.includes(currentSection) ? [line] : null;
            if (currentBuffer) {
                sections.set(currentSection, currentBuffer);
                continue;
            }
        }
        if (REPORT_REQUIRED_SECTIONS.includes(currentSection)) {
            currentBuffer?.push(line);
            continue;
        }
        intro.push(line);
    }
    const tonePrefix = `\n\n## Report Tone\n${tone === "student" ? "Student-friendly step-by-step explanation." : tone === "teacher" ? "Teacher explanation with instructional notes." : tone === "lab" ? "Lab report style with objective, procedure, observation, and conclusion." : "Scientific report style with method, verification, limitations, and reproducibility."}`;
    const attachmentLines = [
        attachments.graph ? "- Graph screenshot attachment: enabled." : "- Graph screenshot attachment: pending.",
        attachments.verification ? "- Verification certificate attachment: enabled." : "- Verification certificate attachment: pending.",
        attachments.code ? "- Code appendix attachment: enabled." : "- Code appendix attachment: pending.",
    ];
    const assumptionLines = assumptionsToStatements(assumptions);
    const assumptionSection = `\n\n## Assumptions\n${assumptionLines.length ? assumptionLines.map((item) => `- ${item}`).join("\n") : "- No explicit assumptions were provided. Treat domain and parameter constraints as review items."}`;
    const exportSection = `\n\n## Export Contract\n- Template: ${template}\n- Brand label: ${brandLabel || "MathSphere"}\n- PDF/DOCX/LaTeX exports use this section order and attachment contract.\n- Verification certificate and code appendix must be refreshed before final delivery.`;
    const orderedSections = enabledSections
        .map((section) => sections.get(section)?.join("\n"))
        .filter((section): section is string => Boolean(section));
    return `${intro.join("\n")}\n${orderedSections.join("\n")}${assumptionSection}${tonePrefix}\n\n## Attachments\n${attachmentLines.join("\n")}${exportSection}`;
}

function downloadText(filename: string, content: string, type = "text/plain;charset=utf-8") {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
}

function markdownToLatex(markdown: string) {
    return `\\documentclass[11pt]{article}
\\usepackage{amsmath,amssymb,geometry,hyperref,listings}
\\geometry{margin=1in}
\\title{MathSphere Laboratory Report}
\\begin{document}
\\maketitle
\\begin{verbatim}
${markdown}
\\end{verbatim}
\\end{document}
`;
}

async function downloadDocxReport(markdown: string) {
    const { Document, Packer, Paragraph, TextRun } = await import("docx");
    const children = markdown.split("\n").map((line) => {
        if (line.startsWith("# ")) {
            return new Paragraph({
                spacing: { after: 180 },
                children: [new TextRun({ text: line.replace(/^#\s+/, ""), bold: true, size: 32 })],
            });
        }
        if (line.startsWith("## ")) {
            return new Paragraph({
                spacing: { before: 180, after: 100 },
                children: [new TextRun({ text: line.replace(/^##\s+/, ""), bold: true, size: 24 })],
            });
        }
        return new Paragraph({
            spacing: { after: 80 },
            children: [new TextRun({ text: line || " " })],
        });
    });
    const doc = new Document({ sections: [{ properties: {}, children }] });
    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "mathsphere-report.docx";
    link.click();
    URL.revokeObjectURL(url);
}

export function LaboratoryReportLayout({
    executiveCards,
    supportCards,
    readinessCards,
    reportMarkdown,
    publicationProfile,
    setPublicationProfile,
    copyMarkdownExport,
    saveResult,
    saveState = "idle",
    saveError = null,
    lastSavedResultTitle,
    sendToWriter,
    sendToNotebook,
    pushLiveResult,
    liveTargets,
    selectedLiveTargetId,
    setSelectedLiveTargetId,
    annotationNode,
    summaryNode,
    reportTitle = "Research Markdown Skeleton",
    reportFormat,
    setReportFormat,
}: {
    executiveCards: ReportMetricCard[];
    supportCards: ReportMetricCard[];
    readinessCards: ReportMetricCard[];
    reportMarkdown: string;
    publicationProfile: WriterBridgePublicationProfile;
    setPublicationProfile: (profile: WriterBridgePublicationProfile) => void;
    copyMarkdownExport: () => void;
    saveResult?: () => void | Promise<unknown>;
    saveState?: "idle" | "saving" | "saved" | "error";
    saveError?: string | null;
    lastSavedResultTitle?: string | null;
    sendToWriter: () => void;
    sendToNotebook: () => void;
    pushLiveResult: () => void;
    liveTargets: ReportLiveTarget[];
    selectedLiveTargetId: string | null;
    setSelectedLiveTargetId: (id: string) => void;
    annotationNode?: React.ReactNode;
    summaryNode?: React.ReactNode;
    reportTitle?: string;
    reportFormat?: ReportGeneratorFormat;
    setReportFormat?: (format: ReportGeneratorFormat) => void;
}) {
    const [enabledSections, setEnabledSections] = React.useState<string[]>(REPORT_REQUIRED_SECTIONS);
    const [reportTone, setReportTone] = React.useState<ReportTone>("scientific");
    const [reportTemplate, setReportTemplate] = React.useState<ReportTemplate>("branded");
    const [brandLabel, setBrandLabel] = React.useState("MathSphere Research");
    const [attachments, setAttachments] = React.useState({ graph: true, verification: true, code: true });
    const [assumptions, setAssumptions] = React.useState<Assumption[]>([]);
    const [reportHistory, setReportHistory] = React.useState<Array<{ id: string; title: string; length: number }>>([]);
    const displayedReportMarkdown = React.useMemo(
        () => applyReportCenterControls(reportMarkdown, enabledSections, reportTone, attachments, assumptions, reportTemplate, brandLabel),
        [assumptions, attachments, brandLabel, enabledSections, reportMarkdown, reportTemplate, reportTone],
    );

    const copyDisplayedReport = async () => {
        await navigator.clipboard.writeText(displayedReportMarkdown);
        setReportHistory((current) => [
            { id: `${Date.now()}`, title: `${REPORT_GENERATOR_FORMAT_LABELS[reportFormat || "scientific-report"]} export`, length: displayedReportMarkdown.length },
            ...current.slice(0, 4),
        ]);
    };

    return (
        <div className="space-y-6">
            {summaryNode}

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_360px]">
                <div className="space-y-5">
                    {reportFormat && setReportFormat ? (
                        <div className="site-panel space-y-4 p-4">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <div className="site-eyebrow text-accent">Report Center</div>
                                    <div className="mt-1 text-sm font-black text-foreground">
                                        {REPORT_GENERATOR_FORMAT_LABELS[reportFormat]}
                                    </div>
                                </div>
                                <PremiumFeatureBadge label="Pro output" detail="report + verification" />
                            </div>
                            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                                {(Object.keys(REPORT_GENERATOR_FORMAT_LABELS) as ReportGeneratorFormat[]).map((format) => (
                                    <button
                                        key={format}
                                        type="button"
                                        onClick={() => setReportFormat(format)}
                                        className={`rounded-2xl border px-3 py-2 text-left transition-colors ${
                                            reportFormat === format
                                                ? "border-accent/40 bg-[var(--accent-soft)] text-foreground"
                                                : "border-border/60 bg-background hover:border-accent/25"
                                        }`}
                                    >
                                        <div className="text-xs font-black">{REPORT_GENERATOR_FORMAT_LABELS[format]}</div>
                                        <div className="mt-1 text-[11px] leading-4 text-muted-foreground">{REPORT_GENERATOR_FORMAT_DESCRIPTIONS[format]}</div>
                                    </button>
                                ))}
                            </div>
                            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                                {REPORT_REQUIRED_SECTIONS.map((section) => {
                                    const included = displayedReportMarkdown.toLowerCase().includes(section.toLowerCase());
                                    return (
                                        <button
                                            key={section}
                                            type="button"
                                            onClick={() => setEnabledSections((current) => current.includes(section) ? current.filter((item) => item !== section) : [...current, section])}
                                            className={`rounded-xl border px-3 py-2 text-left text-xs font-bold ${included ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300"}`}
                                        >
                                            {included ? "On" : "Off"} · {section}
                                        </button>
                                    );
                                })}
                            </div>
                            <div className="grid gap-2 md:grid-cols-[1fr_1fr_1fr]">
                                <select value={reportTone} onChange={(event) => setReportTone(event.target.value as ReportTone)} className="h-10 rounded-xl border border-border/70 bg-background px-3 text-sm font-semibold">
                                    <option value="scientific">Scientific tone</option>
                                    <option value="student">Student tone</option>
                                    <option value="teacher">Teacher tone</option>
                                    <option value="lab">Lab tone</option>
                                </select>
                                <button type="button" onClick={() => setEnabledSections((current) => [...current].reverse())} className="site-btn px-3 text-xs">Reverse section order</button>
                                <button type="button" onClick={() => setAttachments((current) => ({ ...current, graph: !current.graph }))} className="site-btn px-3 text-xs">Graph {attachments.graph ? "on" : "off"}</button>
                            </div>
                            <div className="grid gap-2 md:grid-cols-[1fr_1fr]">
                                <select value={reportTemplate} onChange={(event) => setReportTemplate(event.target.value as ReportTemplate)} className="h-10 rounded-xl border border-border/70 bg-background px-3 text-sm font-semibold">
                                    <option value="branded">Branded PDF/DOCX</option>
                                    <option value="clean">Clean academic</option>
                                    <option value="journal">Journal section</option>
                                    <option value="teacher">Teacher handout</option>
                                </select>
                                <input value={brandLabel} onChange={(event) => setBrandLabel(event.target.value)} className="h-10 rounded-xl border border-border/70 bg-background px-3 text-sm font-semibold" placeholder="Brand / course label" />
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <button type="button" onClick={() => setAttachments((current) => ({ ...current, verification: !current.verification }))} className="site-btn px-3 text-xs">Certificate {attachments.verification ? "on" : "off"}</button>
                                <button type="button" onClick={() => setAttachments((current) => ({ ...current, code: !current.code }))} className="site-btn px-3 text-xs">Code appendix {attachments.code ? "on" : "off"}</button>
                                <button type="button" onClick={copyDisplayedReport} className="site-btn-accent px-3 text-xs">Save report snapshot</button>
                            </div>
                        </div>
                    ) : null}

                    <LaboratoryMathPanel
                        eyebrow="Report Builder"
                        title={reportTitle}
                        content={displayedReportMarkdown}
                        accentClassName="text-amber-600"
                    />

                    <div className="flex flex-wrap gap-4">
                        <button
                            onClick={() => void saveResult?.()}
                            className="site-btn-accent px-6"
                            disabled={!saveResult || saveState === "saving"}
                        >
                            {saveState === "saving" ? "Saving..." : saveState === "saved" ? "Saved to Laboratory" : "Save Result"}
                        </button>
                        <button onClick={copyDisplayedReport} className="site-btn px-6">
                            Copy Report
                        </button>
                        <button onClick={() => window.print()} className="site-btn px-6">
                            Export PDF
                        </button>
                        <button onClick={() => downloadText("mathsphere-report.tex", markdownToLatex(displayedReportMarkdown), "application/x-tex;charset=utf-8")} className="site-btn px-6">
                            Export LaTeX
                        </button>
                        <button onClick={() => void downloadDocxReport(displayedReportMarkdown)} className="site-btn px-6">
                            Export DOCX
                        </button>
                        <button onClick={sendToWriter} className="site-btn-accent px-6">
                            Send to Writer
                        </button>
                        <button onClick={sendToNotebook} className="site-btn px-6">
                            Send to Notebook
                        </button>
                    </div>
                    <div className="text-sm text-muted-foreground">
                        Active publication profile: <span className="font-semibold text-foreground">{LAB_PUBLICATION_PROFILE_LABELS[publicationProfile]}</span>.
                    </div>
                    {saveState === "saved" && lastSavedResultTitle ? (
                        <div className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                            Saved asset: {lastSavedResultTitle}
                        </div>
                    ) : null}
                    {saveState === "error" && saveError ? (
                        <div className="text-sm font-medium text-rose-700 dark:text-rose-300">{saveError}</div>
                    ) : null}
                </div>

                <div className="space-y-4">
                    <details className="site-panel p-4" open={false}>
                        <summary className="cursor-pointer text-sm font-black">Export packet</summary>
                        <div className="mt-3 grid gap-2">
                            {(Object.keys(LAB_PUBLICATION_PROFILE_LABELS) as WriterBridgePublicationProfile[]).map((profile) => (
                                <button key={profile} type="button" onClick={() => setPublicationProfile(profile)} className={`rounded-xl border px-3 py-2 text-left transition-colors ${publicationProfile === profile ? "border-accent/35 bg-[var(--accent-soft)]" : "border-border/60 bg-background hover:border-accent/20"}`}>
                                    <div className="text-xs font-black uppercase tracking-[0.14em] text-foreground">{LAB_PUBLICATION_PROFILE_LABELS[profile]}</div>
                                    <div className="mt-1 text-xs leading-5 text-muted-foreground">{LAB_PUBLICATION_PROFILE_DESCRIPTIONS[profile]}</div>
                                </button>
                            ))}
                        </div>
                    </details>

                    <details className="site-panel p-4" open>
                        <summary className="cursor-pointer text-sm font-black">Export preview</summary>
                        <div className="mt-3 space-y-2 text-xs leading-5 text-muted-foreground">
                            <div className="rounded-xl border border-border/70 bg-background px-3 py-2">Template: <span className="font-black text-foreground">{reportTemplate}</span></div>
                            <div className="rounded-xl border border-border/70 bg-background px-3 py-2">Brand: <span className="font-black text-foreground">{brandLabel || "MathSphere"}</span></div>
                            <div className="rounded-xl border border-border/70 bg-background px-3 py-2">Sections: <span className="font-black text-foreground">{enabledSections.length}/{REPORT_REQUIRED_SECTIONS.length}</span></div>
                            <div className="rounded-xl border border-border/70 bg-background px-3 py-2">Attachments: graph {attachments.graph ? "on" : "off"}, certificate {attachments.verification ? "on" : "off"}, code {attachments.code ? "on" : "off"}</div>
                        </div>
                    </details>

                    <details className="site-panel p-4">
                        <summary className="cursor-pointer text-sm font-black">Report readiness</summary>
                        <div className="mt-3 grid gap-3">
                            {[...executiveCards, ...readinessCards, ...supportCards].map((card) => (
                                <LaboratoryMetricCard key={`${card.eyebrow}-${card.value}-${card.detail}`} {...card} />
                            ))}
                        </div>
                    </details>

                    <details className="site-panel p-4">
                        <summary className="cursor-pointer text-sm font-black">Report history</summary>
                        <div className="mt-3 space-y-2">
                            {reportHistory.length ? reportHistory.map((item) => (
                                <div key={item.id} className="rounded-xl border border-border/70 bg-background px-3 py-2 text-xs">
                                    <div className="font-black">{item.title}</div>
                                    <div className="mt-1 text-muted-foreground">{item.length} chars</div>
                                </div>
                            )) : (
                                <div className="rounded-xl border border-dashed border-border/70 px-3 py-2 text-xs text-muted-foreground">No local report snapshots yet.</div>
                            )}
                        </div>
                    </details>

                    {annotationNode}

                    <AssumptionManagerPanel fallbackText={reportMarkdown} onChange={setAssumptions} />

                    <div className="site-panel space-y-3 p-4">
                        <div className="site-eyebrow text-accent">Bridge</div>
                        <div className="flex flex-wrap gap-3">
                            {liveTargets.length ? (
                                liveTargets.map((target) => (
                                    <button
                                        key={target.id}
                                        onClick={() => setSelectedLiveTargetId(target.id)}
                                        className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                                            selectedLiveTargetId === target.id ? "bg-accent text-white" : "bg-muted text-muted-foreground"
                                        }`}
                                    >
                                        {target.title}
                                    </button>
                                ))
                            ) : (
                                <div className="rounded-xl border border-border/60 bg-muted/10 px-4 py-2 text-xs font-semibold text-muted-foreground">
                                    Writer document topilmadi
                                </div>
                            )}

                            <button onClick={pushLiveResult} className="site-btn flex items-center gap-2" disabled={!liveTargets.length}>
                                Push Live
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
