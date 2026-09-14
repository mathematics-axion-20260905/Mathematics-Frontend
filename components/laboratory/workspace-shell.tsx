"use client";

import Link from "next/link";
import { ArrowRight, Info } from "lucide-react";

import { LabEngineProvider } from "@/components/laboratory/lab-engine";
import { laboratoryModuleRegistry } from "@/components/laboratory/module-registry";
import { type LaboratoryModuleMeta } from "@/lib/laboratory";
import { useLocale } from "@/components/locale-provider";

export function LaboratoryWorkspaceShell({ module }: { module: LaboratoryModuleMeta }) {
    const { locale } = useLocale();
    const copy = locale === "uz"
        ? { title: "Ish maydoni hali ulanmagan.", lead: "Reyestr {module} modulini taniydi, ammo uning maxsus interfeysi hali mavjud emas.", back: "Laboratoriyaga qaytish" }
        : { title: "Workspace is not connected yet.", lead: "Registry recognizes {module}, but its dedicated interface is not available yet.", back: "Back to Laboratory" };
    const definition = laboratoryModuleRegistry[module.slug];
    const ModuleComponent = definition?.component;

    return (
        <LabEngineProvider>
            <main className="min-w-0">
                {ModuleComponent ? (
                    <div className="lab-workspace-stage overflow-hidden rounded-[var(--ax-work-panel-radius)] border border-[var(--ax-work-line)] bg-[var(--ax-surface)] shadow-[var(--ax-work-shadow)]">
                        <ModuleComponent module={module} />
                    </div>
                ) : (
                    <div className="flex min-h-[460px] flex-col items-center justify-center rounded-[var(--ax-work-panel-radius)] border border-[var(--ax-work-line)] bg-[var(--ax-surface)] p-10 text-center shadow-[var(--ax-work-shadow)]">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--ax-work-line)] bg-[var(--ax-surface-soft)] text-[var(--ax-warning)]">
                            <Info className="h-5 w-5" />
                        </div>
                        <h2 className="mt-6 font-serif text-3xl tracking-[-0.04em] text-[var(--ax-text)]">{copy.title}</h2>
                        <p className="mt-3 max-w-md text-sm leading-6 text-[var(--ax-text-soft)]">
                            {copy.lead.split("{module}")[0]}<span className="font-semibold text-[var(--ax-text)]">{module.title}</span>{copy.lead.split("{module}")[1]}
                        </p>
                        <Link href="/laboratory" className="mt-7 inline-flex h-10 items-center gap-2 rounded-[var(--ax-work-control-radius)] bg-[var(--ax-accent-strong)] px-5 text-xs font-semibold text-white hover:bg-[var(--ax-accent)]">
                            {copy.back}
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>
                )}
            </main>
        </LabEngineProvider>
    );
}
