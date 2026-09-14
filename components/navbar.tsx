"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AxionMark } from "@/components/axion";
import { useLocale } from "@/components/locale-provider";

export default function Navbar() {
    const pathname = usePathname();
    const { locale } = useLocale();
    const copy = locale === "uz"
        ? { home: "Matematika laboratoriyasi bosh sahifasi", product: "Mahsulot", workflow: "Jarayon", ecosystem: "Ekotizim", workspace: "Ilmiy ish maydoni", homeLink: "Bosh sahifa", openIntegral: "Integralni ochish", allStudios: "Barcha studiyalar", studios: "Studiyalar", openLaboratory: "Laboratoriyani ochish" }
        : { home: "MathSphere Laboratory home", product: "Product", workflow: "Workflow", ecosystem: "Ecosystem", workspace: "Scientific workspace", homeLink: "Home", openIntegral: "Open Integral", allStudios: "All studios", studios: "Studios", openLaboratory: "Open Laboratory" };
    const inLaboratory = pathname.startsWith("/laboratory");
    const laboratoryIndex = pathname === "/laboratory";

    return (
        <header className="ax-premium-nav">
            <div className="ax-landing-container ax-premium-nav-inner" style={{ minHeight: inLaboratory ? 64 : 72 }}>
                <Link href="/" className="flex min-w-0 items-center gap-3.5 outline-none focus-visible:shadow-[var(--ax-focus-ring)]" aria-label={copy.home}>
                    <AxionMark className="h-9 w-9 text-[var(--ax-accent)]" />
                    <span className="min-w-0 leading-none">
                        <span className="block truncate font-serif text-[22px] font-medium tracking-[-0.035em] text-[var(--ax-text)]">MathSphere</span>
                        <span className="mt-1 block text-[8px] font-semibold uppercase tracking-[0.25em] text-[var(--ax-text-faint)]">Mathematics Laboratory</span>
                    </span>
                </Link>

                {!inLaboratory ? (
                    <nav className="hidden items-center gap-1 xl:flex" aria-label="Mathematics product">
                        <Link href="/#product" className="ax-premium-nav-link">{copy.product}</Link>
                        <Link href="/#workflow" className="ax-premium-nav-link">{copy.workflow}</Link>
                        <Link href="/#ecosystem" className="ax-premium-nav-link">{copy.ecosystem}</Link>
                    </nav>
                ) : (
                    <div className="hidden text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--ax-text-faint)] xl:block">{copy.workspace}</div>
                )}

                <div className="flex items-center gap-1.5">
                    {inLaboratory ? (
                        <>
                            <Link href="/" className="ax-premium-secondary hidden sm:inline-flex">{copy.homeLink}</Link>
                            <Link href={laboratoryIndex ? "/laboratory/integral-studio" : "/laboratory"} className="ax-premium-primary">
                                {laboratoryIndex ? copy.openIntegral : copy.allStudios} <span aria-hidden="true">→</span>
                            </Link>
                        </>
                    ) : (
                        <>
                            <Link href="/laboratory" className="ax-premium-secondary hidden sm:inline-flex">{copy.studios}</Link>
                            <Link href="/laboratory" className="ax-premium-primary">{copy.openLaboratory} <span aria-hidden="true">→</span></Link>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}
