"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, ChevronDown, LayoutTemplate, X } from "lucide-react";
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
        ? {
              back: "Laboratoriyaga qaytish",
              templates: "Shablonlar",
              chooseTemplate: "Jarayon yoki masala presetini tanlang.",
              close: "Yopish",
              recommended: "Tavsiya etiladi",
              beginner: "Boshlang‘ich",
              advanced: "Kengaytirilgan",
              research: "Tadqiqot",
              setup: "Sozlamalar",
          }
        : {
              back: "Back to Laboratory",
              templates: "Templates",
              chooseTemplate: "Choose a workflow or problem preset.",
              close: "Close",
              recommended: "Recommended",
              beginner: "Beginner",
              advanced: "Advanced",
              research: "Research",
              setup: "Setup",
          };

    const translateTemplateMeta = (value?: string) =>
        locale === "uz"
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

    const displayedTabs = tabs.map((tab) => ({
        ...tab,
        label:
            locale === "uz"
                ? ({
                      Problem: "Masala",
                      Visualize: "Vizualizatsiya",
                      Solve: "Yechish",
                      Compare: "Taqqoslash",
                      Code: "Kod",
                      Report: "Hisobot",
                      Notes: "Qaydlar",
                      Advanced: "Kengaytirilgan",
                  } as Record<string, string>)[tab.label] || tab.label
                : tab.label,
    }));

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
        <div
            ref={shellRef}
            className="relative z-20 flex shrink-0 flex-wrap items-center gap-2 border-b border-[var(--ax-line)] bg-[var(--ax-surface)] px-3 py-2 lg:px-4"
        >
            <Link
                href="/laboratory"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--ax-radius-control)] border border-[var(--ax-line)] bg-[var(--ax-surface-soft)] text-[var(--ax-text-soft)] transition-colors hover:border-[var(--ax-line-strong)] hover:text-[var(--ax-text)]"
                aria-label={copy.back}
            >
                <ArrowLeft className="h-4 w-4" />
            </Link>

            <div className="mr-1 rounded-[var(--ax-radius-control)] border border-[var(--ax-line)] bg-[var(--ax-surface-soft)] px-3 py-2 text-[10.5px] font-bold uppercase tracking-[0.14em] text-[var(--ax-text)]">
                {moduleLabel}
            </div>

            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1 rounded-[var(--ax-radius-control)] border border-[var(--ax-line)] bg-[var(--ax-surface-soft)] p-1 lg:flex-none">
                {displayedTabs.map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className={`rounded-[7px] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] transition-all ${
                            activeTab === tab.id
                                ? "bg-[var(--ax-accent-strong)] text-white shadow-xs"
                                : "text-[var(--ax-text-soft)] hover:bg-[var(--ax-surface)] hover:text-[var(--ax-text)]"
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}

                <button
                    type="button"
                    onClick={onToggleTemplates}
                    className={`inline-flex items-center gap-1.5 rounded-[7px] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] transition-all ${
                        templatesOpen
                            ? "bg-[var(--ax-accent-soft)] text-[var(--ax-accent)]"
                            : "text-[var(--ax-text-soft)] hover:bg-[var(--ax-surface)] hover:text-[var(--ax-text)]"
                    }`}
                >
                    <LayoutTemplate className="h-3.5 w-3.5" />
                    {copy.templates}
                    <span className="rounded-full bg-[var(--ax-line)] px-1.5 py-0.2 text-[8.5px] font-semibold text-[var(--ax-text-faint)]">
                        {totalTemplates}
                    </span>
                    <ChevronDown className={`h-3 w-3 transition-transform ${templatesOpen ? "rotate-180" : ""}`} />
                </button>
            </div>

            <select
                value={experienceLevel}
                onChange={(event) => setExperienceLevel(event.target.value)}
                className="ml-auto h-9 cursor-pointer rounded-[var(--ax-radius-control)] border border-[var(--ax-line)] bg-[var(--ax-surface)] px-3 text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--ax-text-soft)] outline-none transition-colors hover:border-[var(--ax-line-strong)] focus:border-[var(--ax-accent)]"
            >
                <option value="beginner">{copy.beginner}</option>
                <option value="advanced">{copy.advanced}</option>
                <option value="research">{copy.research}</option>
            </select>

            {templatesOpen ? (
                <div className="absolute right-3 top-[calc(100%+8px)] z-30 w-[min(760px,94vw)] rounded-[var(--ax-radius-panel)] border border-[var(--ax-line-strong)] bg-[var(--ax-surface)] p-4 shadow-[var(--ax-shadow-floating)] backdrop-blur-md lg:right-4 animate-in fade-in-50 duration-150">
                    <div className="mb-4 flex items-center justify-between gap-4 border-b border-[var(--ax-line)] pb-3">
                        <div>
                            <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--ax-accent)]">{copy.templates}</div>
                            <div className="mt-0.5 text-xs text-[var(--ax-text-soft)]">{copy.chooseTemplate}</div>
                        </div>
                        <button
                            type="button"
                            onClick={onCloseTemplates}
                            className="inline-flex items-center gap-1 rounded-lg border border-[var(--ax-line)] bg-[var(--ax-surface-soft)] px-2.5 py-1 text-[10px] font-bold text-[var(--ax-text-soft)] transition hover:text-[var(--ax-text)]"
                        >
                            <X className="h-3 w-3" />
                            <span>{copy.close}</span>
                        </button>
                    </div>

                    <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-1">
                        {templateSections.map((section) => (
                            <div key={section.id}>
                                <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--ax-text-faint)]">
                                    {translateTemplateMeta(section.title)}
                                </div>
                                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                                    {section.items.map((item) => (
                                        <button
                                            key={item.id}
                                            type="button"
                                            onClick={() => {
                                                item.onSelect();
                                                onCloseTemplates();
                                            }}
                                            className={`rounded-[var(--ax-radius-control)] border p-3 text-left transition-all ${
                                                item.active
                                                    ? "border-[var(--ax-accent)] bg-[var(--ax-accent-soft)] shadow-xs"
                                                    : "border-[var(--ax-line)] bg-[var(--ax-surface-soft)] hover:border-[var(--ax-line-strong)] hover:bg-[var(--ax-surface)]"
                                            }`}
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="text-xs font-bold text-[var(--ax-text)]">{item.title}</div>
                                                {item.badge ? (
                                                    <span className="rounded bg-[var(--ax-surface)] px-1.5 py-0.5 text-[8.5px] font-bold text-[var(--ax-accent)] border border-[var(--ax-line)]">
                                                        {translateTemplateMeta(item.badge)}
                                                    </span>
                                                ) : null}
                                            </div>
                                            <div className="mt-1 text-[11px] leading-5 text-[var(--ax-text-soft)]">{item.description}</div>
                                            {item.meta || item.recommended ? (
                                                <div className="mt-2 text-[9px] font-semibold uppercase tracking-[0.1em] text-[var(--ax-text-faint)]">
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
