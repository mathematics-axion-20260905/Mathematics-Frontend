"use client";

import Link from "next/link";
import { ArrowLeft, Compass, Sigma } from "lucide-react";
import { useLocale } from "@/components/locale-provider";

export default function NotFound() {
    const { locale } = useLocale();
    const copy = locale === "uz"
        ? {
              badge: "404 · Sahifa topilmadi",
              title: "Singulyarlik nuqtasi: Sahifa mavjud emas",
              description: "Siz qidirayotgan matematik yo‘nalish yoki studiya koordinatasi aniqlanmadi. Manzil noto‘g‘ri kiritilgan yoki boshqa joyga ko‘chirilgan bo‘lishi mumkin.",
              labAction: "Laboratoriyaga o‘tish",
              homeAction: "Bosh sahifaga qaytish",
              formula: "lim_{x \\to x_0} f(x) = \\text{undefined}",
          }
        : {
              badge: "404 · Page Not Found",
              title: "Point of Singularity: Page Does Not Exist",
              description: "The mathematical coordinate or studio path you are seeking could not be resolved. The route may have moved or was mistyped.",
              labAction: "Go to Laboratory",
              homeAction: "Return Home",
              formula: "lim_{x \\to x_0} f(x) = \\text{undefined}",
          };

    return (
        <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 py-16 text-center">
            <div className="mx-auto max-w-lg">
                <div className="inline-flex items-center gap-2 rounded-full border border-[var(--ax-line)] bg-[var(--ax-surface)] px-3.5 py-1 text-xs font-bold uppercase tracking-[0.14em] text-[var(--ax-accent)] shadow-xs">
                    <Compass className="h-3.5 w-3.5 animate-spin duration-3000" />
                    <span>{copy.badge}</span>
                </div>

                <h1 className="mt-6 font-serif text-3xl font-medium tracking-tight text-[var(--ax-text)] sm:text-4xl">
                    {copy.title}
                </h1>

                <div className="my-5 inline-block rounded-xl border border-[var(--ax-line)] bg-[var(--ax-surface-soft)] px-4 py-2 font-mono text-xs text-[var(--ax-accent)]">
                    {copy.formula}
                </div>

                <p className="text-sm leading-relaxed text-[var(--ax-text-soft)]">
                    {copy.description}
                </p>

                <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                    <Link
                        href="/laboratory"
                        className="inline-flex h-10 items-center gap-2 rounded-xl bg-[var(--ax-accent-strong)] px-5 text-xs font-bold text-white shadow-xs transition hover:bg-[var(--ax-accent)]"
                    >
                        <Sigma className="h-4 w-4" />
                        <span>{copy.labAction}</span>
                    </Link>
                    <Link
                        href="/"
                        className="inline-flex h-10 items-center gap-2 rounded-xl border border-[var(--ax-line-strong)] bg-[var(--ax-surface)] px-5 text-xs font-bold text-[var(--ax-text)] shadow-xs transition hover:bg-[var(--ax-surface-soft)]"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        <span>{copy.homeAction}</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
