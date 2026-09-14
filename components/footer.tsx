"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "@/components/locale-provider";

export default function Footer() {
    const pathname = usePathname();
    const { locale } = useLocale();
    const copy = locale === "uz"
        ? { description: "Axion Science ekotizimidagi ilmiy hisoblash va matematik vizualizatsiya.", product: "Mahsulot", workflow: "Jarayon", ecosystem: "Ekotizim", action: "Laboratoriyani ochish" }
        : { description: "Scientific computation and mathematical visualization inside the Axion Science ecosystem.", product: "Product", workflow: "Workflow", ecosystem: "Ecosystem", action: "Open Laboratory" };

    if (pathname.startsWith("/laboratory/")) return null;

    return (
        <footer className="border-t border-[var(--ax-line)] bg-white">
            <div className="ax-landing-container grid gap-8 py-10 md:grid-cols-[1fr_auto] md:items-end">
                <div>
                    <div className="font-serif text-[24px] tracking-[-0.035em] text-[var(--ax-text)]">MathSphere</div>
                    <p className="mt-2 max-w-md text-[11px] leading-5 text-[var(--ax-text-faint)]">{copy.description}</p>
                    <div className="mt-6 text-[10px] text-[var(--ax-text-faint)]">&copy; {new Date().getFullYear()} Axion Science</div>
                </div>
                <nav className="flex flex-wrap gap-x-6 gap-y-2 text-[11px] font-semibold text-[var(--ax-text-soft)]" aria-label="Footer">
                    <Link href="/#product" className="hover:text-[var(--ax-text)]">{copy.product}</Link>
                    <Link href="/#workflow" className="hover:text-[var(--ax-text)]">{copy.workflow}</Link>
                    <Link href="/#ecosystem" className="hover:text-[var(--ax-text)]">{copy.ecosystem}</Link>
                    <Link href="/laboratory" className="text-[var(--ax-accent)] hover:text-[var(--ax-accent-strong)]">{copy.action} →</Link>
                </nav>
            </div>
        </footer>
    );
}
