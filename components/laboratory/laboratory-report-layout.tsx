import React from "react";
import { ArrowUpRight } from "lucide-react";

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
import { useLocale } from "@/components/locale-provider";
import {
    buildJupyterNotebookFromReport,
    createLaboratoryReportContract,
    LABORATORY_REPORT_REQUIRED_SECTIONS,
    type LaboratoryTransferLink,
    type LaboratoryTransferState,
} from "@/lib/laboratory-report-contract";

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

const REPORT_REQUIRED_SECTIONS: string[] = [...LABORATORY_REPORT_REQUIRED_SECTIONS];

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

function downloadJupyterReport(title: string, markdown: string, moduleSlug: string, mode: string, publicationProfile: WriterBridgePublicationProfile) {
    const notebook = buildJupyterNotebookFromReport({
        title,
        markdown,
        contract: createLaboratoryReportContract({ moduleSlug, mode, publicationProfile }),
    });
    downloadText(
        `${title.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "mathsphere-report"}.ipynb`,
        JSON.stringify(notebook, null, 2),
        "application/x-ipynb+json;charset=utf-8",
    );
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
    lastTransfer,
    transferState = "idle",
    transferError = null,
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
    lastTransfer?: LaboratoryTransferLink | null;
    transferState?: LaboratoryTransferState;
    transferError?: string | null;
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
    const { locale } = useLocale();
    const copy = locale === "uz"
        ? { center: "Hisobot markazi", pro: "Professional chiqish", reportVerification: "hisobot + tekshiruv", on: "yoqilgan", off: "o‘chirilgan", scientific: "Ilmiy ohang", student: "Talaba ohangi", teacher: "O‘qituvchi ohangi", lab: "Laboratoriya ohangi", reverse: "Bo‘limlar tartibini teskari qilish", graph: "Grafik", certificate: "Sertifikat", codeAppendix: "Kod ilovasi", saveSnapshot: "Hisobot nusxasini saqlash", reportBuilder: "Hisobot yaratgich", saving: "Saqlanmoqda…", saved: "Saqlangan", saveResult: "Natijani saqlash", copyReport: "Hisobotni nusxalash", exportPdf: "PDF eksporti", exportLatex: "LaTeX eksporti", exportDocx: "DOCX eksporti", exportJupyter: "Jupyter (.ipynb)", sendWriter: "Writerga yuborish", sendNotebook: "Notebookka yuborish", sending: "Yuborilmoqda…", sent: "Yuborildi", openWriter: "Writerda ochish", openNotebook: "Notebookda ochish", transferContract: "Uzatish shartnomasi", sourceOfTruth: "Asosiy manba", sentContent: "Yuboriladigan tarkib", presentation: "Ko‘rinish profili", revisions: "Revisionlar va hash", fullPacket: "To‘liq Scientific Object snapshot’i saqlanadi; profil faqat ko‘rinishni boshqaradi.", profile: "Faol nashr profili", asset: "Saqlangan obyekt", exportPacket: "Eksport to‘plami", exportPreview: "Eksport ko‘rinishi", template: "Shablon", brand: "Brend", sections: "Bo‘limlar", attachments: "Ilovalar", readiness: "Hisobot tayyorligi", history: "Hisobot tarixi", chars: "belgi", noSnapshots: "Hozircha mahalliy hisobot nusxalari yo‘q.", bridge: "Bridge", pushLive: "Jonli natijani yuborish", noWriter: "Writer hujjati topilmadi", transferFailed: "Uzatish amalga oshmadi." }
        : { center: "Report Center", pro: "Pro output", reportVerification: "report + verification", on: "on", off: "off", scientific: "Scientific tone", student: "Student tone", teacher: "Teacher tone", lab: "Lab tone", reverse: "Reverse section order", graph: "Graph", certificate: "Certificate", codeAppendix: "Code appendix", saveSnapshot: "Save report snapshot", reportBuilder: "Report Builder", saving: "Saving...", saved: "Saved", saveResult: "Save Result", copyReport: "Copy Report", exportPdf: "Export PDF", exportLatex: "Export LaTeX", exportDocx: "Export DOCX", exportJupyter: "Jupyter (.ipynb)", sendWriter: "Send to Writer", sendNotebook: "Send to Notebook", sending: "Sending...", sent: "Sent", openWriter: "Open in Writer", openNotebook: "Open in Notebook", transferContract: "Transfer contract", sourceOfTruth: "Source of truth", sentContent: "Sent content", presentation: "Presentation profile", revisions: "Revisions and hashes", fullPacket: "The complete Scientific Object snapshot is retained; the profile only controls presentation.", profile: "Active publication profile", asset: "Saved asset", exportPacket: "Export packet", exportPreview: "Export preview", template: "Template", brand: "Brand", sections: "Sections", attachments: "Attachments", readiness: "Report readiness", history: "Report history", chars: "chars", noSnapshots: "No local report snapshots yet.", bridge: "Bridge", pushLive: "Push Live", noWriter: "Writer document not found", transferFailed: "Transfer failed." };
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
                                    <div className="site-eyebrow text-accent">{copy.center}</div>
                                    <div className="mt-1 text-sm font-black text-foreground">
                                        {REPORT_GENERATOR_FORMAT_LABELS[reportFormat]}
                                    </div>
                                </div>
                                <PremiumFeatureBadge label={copy.pro} detail={copy.reportVerification} />
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
                                    <option value="scientific">{copy.scientific}</option>
                                    <option value="student">{copy.student}</option>
                                    <option value="teacher">{copy.teacher}</option>
                                    <option value="lab">{copy.lab}</option>
                                </select>
                                <button type="button" onClick={() => setEnabledSections((current) => [...current].reverse())} className="site-btn px-3 text-xs">{copy.reverse}</button>
                                <button type="button" onClick={() => setAttachments((current) => ({ ...current, graph: !current.graph }))} className="site-btn px-3 text-xs">{copy.graph} {attachments.graph ? copy.on : copy.off}</button>
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
                                <button type="button" onClick={() => setAttachments((current) => ({ ...current, verification: !current.verification }))} className="site-btn px-3 text-xs">{copy.certificate} {attachments.verification ? copy.on : copy.off}</button>
                                <button type="button" onClick={() => setAttachments((current) => ({ ...current, code: !current.code }))} className="site-btn px-3 text-xs">{copy.codeAppendix} {attachments.code ? copy.on : copy.off}</button>
                                <button type="button" onClick={copyDisplayedReport} className="site-btn-accent px-3 text-xs">{copy.saveSnapshot}</button>
                            </div>
                        </div>
                    ) : null}

                    <LaboratoryMathPanel
                        eyebrow={copy.reportBuilder}
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
                            {saveState === "saving" ? copy.saving : saveState === "saved" ? copy.saved : copy.saveResult}
                        </button>
                        <button onClick={copyDisplayedReport} className="site-btn px-6">
                            {copy.copyReport}
                        </button>
                        <button onClick={() => window.print()} className="site-btn px-6">
                            {copy.exportPdf}
                        </button>
                        <button onClick={() => downloadText("mathsphere-report.tex", markdownToLatex(displayedReportMarkdown), "application/x-tex;charset=utf-8")} className="site-btn px-6">
                            {copy.exportLatex}
                        </button>
                        <button onClick={() => void downloadDocxReport(displayedReportMarkdown)} className="site-btn px-6">
                            {copy.exportDocx}
                        </button>
                        <button onClick={() => downloadJupyterReport(reportTitle, displayedReportMarkdown, reportTitle.toLowerCase().replace(/\s+/g, "-"), reportFormat || "scientific-report", publicationProfile)} className="site-btn px-6">
                            {copy.exportJupyter}
                        </button>
                        <button onClick={sendToWriter} className="site-btn-accent px-6" disabled={transferState === "sending"}>
                            {transferState === "sending" ? copy.sending : copy.sendWriter}
                        </button>
                        <button onClick={sendToNotebook} className="site-btn px-6" disabled={transferState === "sending"}>
                            {transferState === "sending" ? copy.sending : copy.sendNotebook}
                        </button>
                    </div>
                    <div className="text-sm text-muted-foreground">
                        {copy.profile}: <span className="font-semibold text-foreground">{LAB_PUBLICATION_PROFILE_LABELS[publicationProfile]}</span>.
                    </div>
                    {saveState === "saved" && lastSavedResultTitle ? (
                        <div className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                            {copy.asset}: {lastSavedResultTitle}
                        </div>
                    ) : null}
                    {saveState === "error" && saveError ? (
                        <div className="text-sm font-medium text-rose-700 dark:text-rose-300">{saveError}</div>
                    ) : null}
                    {lastTransfer ? (
                        <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-4 text-sm">
                            <div className="font-black text-emerald-800 dark:text-emerald-200">{copy.sent} · {lastTransfer.targetApp === "writer" ? "Writer" : "Notebook"}</div>
                            <div className="mt-1 text-xs text-emerald-800/75 dark:text-emerald-200/75">Scientific Object v1.0 · {lastTransfer.objectId ? `object ${lastTransfer.objectId.slice(0, 14)}…` : "transfer snapshot"}</div>
                            <a href={lastTransfer.href} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-emerald-700 px-3 py-2 text-xs font-black text-white transition-colors hover:bg-emerald-800 dark:bg-emerald-500 dark:text-emerald-950 dark:hover:bg-emerald-400">
                                {lastTransfer.targetApp === "writer" ? copy.openWriter : copy.openNotebook}
                                <ArrowUpRight className="h-3.5 w-3.5" />
                            </a>
                        </div>
                    ) : null}
                    {transferState === "error" && transferError ? (
                        <div className="text-sm font-medium text-rose-700 dark:text-rose-300">{copy.transferFailed} {transferError}</div>
                    ) : null}
                </div>

                <div className="space-y-4">
                    <details className="site-panel p-4" open={false}>
                        <summary className="cursor-pointer text-sm font-black">{copy.exportPacket}</summary>
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
                        <summary className="cursor-pointer text-sm font-black">{copy.transferContract}</summary>
                        <div className="mt-3 space-y-2 text-xs leading-5 text-muted-foreground">
                            <div className="rounded-xl border border-border/70 bg-background px-3 py-2"><span className="font-black text-foreground">{copy.sourceOfTruth}:</span> Scientific Object v1.0, current revision + complete revision history.</div>
                            <div className="rounded-xl border border-border/70 bg-background px-3 py-2"><span className="font-black text-foreground">{copy.sentContent}:</span> input snapshot, structured result, report Markdown, verification/integrity metadata, provenance, code and visual data.</div>
                            <div className="rounded-xl border border-border/70 bg-background px-3 py-2"><span className="font-black text-foreground">{copy.presentation}:</span> {LAB_PUBLICATION_PROFILE_LABELS[publicationProfile]}. {copy.fullPacket}</div>
                            <div className="rounded-xl border border-border/70 bg-background px-3 py-2"><span className="font-black text-foreground">{copy.revisions}:</span> destination imports a pinned revision; the source object is not flattened or replaced.</div>
                        </div>
                    </details>

                    <details className="site-panel p-4" open>
                        <summary className="cursor-pointer text-sm font-black">{copy.exportPreview}</summary>
                        <div className="mt-3 space-y-2 text-xs leading-5 text-muted-foreground">
                            <div className="rounded-xl border border-border/70 bg-background px-3 py-2">{copy.template}: <span className="font-black text-foreground">{reportTemplate}</span></div>
                            <div className="rounded-xl border border-border/70 bg-background px-3 py-2">{copy.brand}: <span className="font-black text-foreground">{brandLabel || "MathSphere"}</span></div>
                            <div className="rounded-xl border border-border/70 bg-background px-3 py-2">{copy.sections}: <span className="font-black text-foreground">{enabledSections.length}/{REPORT_REQUIRED_SECTIONS.length}</span></div>
                            <div className="rounded-xl border border-border/70 bg-background px-3 py-2">{copy.attachments}: {copy.graph.toLowerCase()} {attachments.graph ? copy.on : copy.off}, {copy.certificate.toLowerCase()} {attachments.verification ? copy.on : copy.off}, {copy.codeAppendix.toLowerCase()} {attachments.code ? copy.on : copy.off}</div>
                        </div>
                    </details>

                    <details className="site-panel p-4">
                        <summary className="cursor-pointer text-sm font-black">{copy.readiness}</summary>
                        <div className="mt-3 grid gap-3">
                            {[...executiveCards, ...readinessCards, ...supportCards].map((card) => (
                                <LaboratoryMetricCard key={`${card.eyebrow}-${card.value}-${card.detail}`} {...card} />
                            ))}
                        </div>
                    </details>

                    <details className="site-panel p-4">
                        <summary className="cursor-pointer text-sm font-black">{copy.history}</summary>
                        <div className="mt-3 space-y-2">
                            {reportHistory.length ? reportHistory.map((item) => (
                                <div key={item.id} className="rounded-xl border border-border/70 bg-background px-3 py-2 text-xs">
                                    <div className="font-black">{item.title}</div>
                                    <div className="mt-1 text-muted-foreground">{item.length} chars</div>
                                </div>
                            )) : (
                                <div className="rounded-xl border border-dashed border-border/70 px-3 py-2 text-xs text-muted-foreground">{copy.noSnapshots}</div>
                            )}
                        </div>
                    </details>

                    {annotationNode}

                    <AssumptionManagerPanel fallbackText={reportMarkdown} onChange={setAssumptions} />

                    <div className="site-panel space-y-3 p-4">
                        <div className="site-eyebrow text-accent">{copy.bridge}</div>
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
                                    {copy.noWriter}
                                </div>
                            )}

                            <button onClick={pushLiveResult} className="site-btn flex items-center gap-2" disabled={!liveTargets.length}>
                                {copy.pushLive}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
