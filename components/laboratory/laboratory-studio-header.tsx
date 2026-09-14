"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, ChevronDown, LayoutTemplate } from "lucide-react";
import { useLocale } from "@/components/locale-provider";

type HeaderTab = { id: string; label: string };
type TemplateItem = {
    id: string;
    title: string;
    description: string;
    badge?: string;
    meta?: string;
    recommended?: boolean;
    active?: boolean;
    onSelect: () => void;
};
type TemplateSection = { id: string; title: string; items: TemplateItem[] };

export function LaboratoryStudioHeader({
    moduleLabel,
    tabs,
    activeTab,
    setActiveTab,
    experienceLevel,
    setExperienceLevel,
    templatesOpen,
    onToggleTemplates,
    onCloseTemplates,
    templateSections,
}: {
    moduleLabel: string;
    tabs: readonly HeaderTab[];
    activeTab: string;
    setActiveTab: (tabId: string) => void;
    experienceLevel: string;
    setExperienceLevel: (level: string) => void;
    templatesOpen: boolean;
    onToggleTemplates: () => void;
    onCloseTemplates: () => void;
    templateSections: TemplateSection[];
}) {
    const { locale } = useLocale();
    const copy = locale === "uz"
        ? { back: "Laboratoriyaga qaytish", templates: "Shablonlar", chooseTemplate: "Jarayon yoki masala presetini tanlang.", close: "Yopish", recommended: "Tavsiya etiladi", beginner: "Boshlang‘ich", advanced: "Kengaytirilgan", research: "Tadqiqot", setup: "Sozlamalar" }
        : { back: "Back to Laboratory", templates: "Templates", chooseTemplate: "Choose a workflow or problem preset.", close: "Close", recommended: "Recommended", beginner: "Beginner", advanced: "Advanced", research: "Research", setup: "Setup" };
    const translateTemplateMeta = (value?: string) => locale === "uz"
        ? ({
              "Workflow Templates": "Jarayon shablonlari",
              "Problem Templates": "Masala shablonlari",
              "Problem Presets": "Masala presetlari",
              workflow: "jarayon",
              Active: "Faol",
              single: "bir karrali",
              double: "ikki karrali",
              triple: "uch karrali",
          } as Record<string, string>)[value || ""] || value
        : value;
    const displayedTabs = tabs.map((tab) => ({ ...tab, label: locale === "uz" ? ({ Problem: "Masala", Visualize: "Vizualizatsiya", Solve: "Yechish", Compare: "Taqqoslash", Code: "Kod", Report: "Hisobot", Notes: "Qaydlar", Advanced: "Kengaytirilgan" } as Record<string, string>)[tab.label] || tab.label : tab.label }));
    const shellRef = React.useRef<HTMLDivElement | null>(null);
    const totalTemplates = templateSections.reduce((sum, section) => sum + section.items.length, 0);

    React.useEffect(() => {
        if (!templatesOpen) return;

        function handlePointerDown(event: MouseEvent) {
            if (!shellRef.current?.contains(event.target as Node)) onCloseTemplates();
        }
        function handleEscape(event: KeyboardEvent) {
            if (event.key === "Escape") onCloseTemplates();
        }

        document.addEventListener("mousedown", handlePointerDown);
        document.addEventListener("keydown", handleEscape);
        return () => {
            document.removeEventListener("mousedown", handlePointerDown);
            document.removeEventListener("keydown", handleEscape);
        };
    }, [onCloseTemplates, templatesOpen]);

    return (
        <div ref={shellRef} className="relative z-20 flex shrink-0 flex-wrap items-center gap-2 border-b border-[#e3e7ed] bg-white px-3 py-2 lg:px-4">
            <Link
                href="/laboratory"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] border border-[#dfe4ea] bg-[#fbfcfe] text-[#67707b]"
                aria-label={copy.back}
            >
                <ArrowLeft className="h-4 w-4" />
            </Link>

            <div className="mr-1 rounded-[8px] border border-[#dfe4ea] bg-white px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#20242b]">
                {moduleLabel}
            </div>

            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1 rounded-[9px] border border-[#e2e6ec] bg-[#f8fafe] p-1 lg:flex-none">
                {displayedTabs.map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className={`rounded-[7px] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.1em] ${
                            activeTab === tab.id ? "bg-[#0b1f46] text-white" : "text-[#69727e] hover:bg-white"
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}

                <button
                    type="button"
                    onClick={onToggleTemplates}
                    className={`inline-flex items-center gap-1.5 rounded-[7px] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.1em] ${
                        templatesOpen ? "bg-[#eaf1ff] text-[#184eb8]" : "text-[#69727e] hover:bg-white"
                    }`}
                >
                    <LayoutTemplate className="h-3.5 w-3.5" />
                    {copy.templates}
                    <span className="text-[9px] text-[#8a929d]">{totalTemplates}</span>
                    <ChevronDown className={`h-3 w-3 ${templatesOpen ? "rotate-180" : ""}`} />
                </button>
            </div>

            <select
                value={experienceLevel}
                onChange={(event) => setExperienceLevel(event.target.value)}
                className="ml-auto h-9 rounded-[8px] border border-[#dfe4ea] bg-white px-3 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#68717d] outline-none focus:border-[#9db5dc]"
            >
                <option value="beginner">{copy.beginner}</option>
                <option value="advanced">{copy.advanced}</option>
                <option value="research">{copy.research}</option>
            </select>

            {templatesOpen ? (
                <div className="absolute right-3 top-[calc(100%+8px)] z-30 w-[min(760px,94vw)] rounded-[12px] border border-[#dfe4ea] bg-white p-4 shadow-[0_18px_45px_rgba(24,36,55,0.12)] lg:right-4">
                    <div className="mb-4 flex items-center justify-between gap-4">
                        <div>
                            <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#184eb8]">{copy.templates}</div>
                            <div className="mt-1 text-xs text-[#747d89]">{copy.chooseTemplate}</div>
                        </div>
                        <button type="button" onClick={onCloseTemplates} className="rounded-[7px] border border-[#dfe4ea] px-3 py-2 text-[10px] font-semibold text-[#68717d]">{copy.close}</button>
                    </div>

                    <div className="space-y-4">
                        {templateSections.map((section) => (
                            <div key={section.id}>
                                <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#68717d]">{translateTemplateMeta(section.title)}</div>
                                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                                    {section.items.map((item) => (
                                        <button
                                            key={item.id}
                                            type="button"
                                            onClick={() => {
                                                item.onSelect();
                                                onCloseTemplates();
                                            }}
                                            className={`rounded-[9px] border p-3 text-left ${item.active ? "border-[#9bb8e7] bg-[#f0f5ff]" : "border-[#e1e5eb] bg-[#fcfdff]"}`}
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="text-sm font-semibold text-[#20242b]">{item.title}</div>
                                                {item.badge ? <span className="text-[9px] font-semibold text-[#184eb8]">{translateTemplateMeta(item.badge)}</span> : null}
                                            </div>
                                            <div className="mt-1 text-[11px] leading-5 text-[#727b87]">{item.description}</div>
                                            {(item.meta || item.recommended) ? (
                                                <div className="mt-2 text-[9px] uppercase tracking-[0.1em] text-[#8a929d]">
                                                    {item.recommended ? copy.recommended : translateTemplateMeta(item.meta)}
                                                </div>
                                            ) : null}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : null}
        </div>
    );
}
