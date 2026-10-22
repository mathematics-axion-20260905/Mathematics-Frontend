"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AxionMark } from "@/components/axion";
import { useLocale } from "@/components/locale-provider";
import { Menu, X, ArrowRight, Compass, Sparkles } from "lucide-react";

const STUDIOS = [
    { slug: "integral-studio", titleUz: "Integral & Analiz", titleEn: "Integral & Analysis" },
    { slug: "linear-algebra-studio", titleUz: "Chiziqli algebra", titleEn: "Linear Algebra" },
    { slug: "differential-studio", titleUz: "Differensial tenglamalar", titleEn: "Differential Equations" },
    { slug: "probability-studio", titleUz: "Ehtimollar nazariyasi", titleEn: "Probability & Statistics" },
    { slug: "tensor-studio", titleUz: "Tensor & Maydonlar", titleEn: "Tensor & Fields" },
];

export default function Navbar() {
    const pathname = usePathname();
    const { locale } = useLocale();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const [prevPathname, setPrevPathname] = useState(pathname);
    if (prevPathname !== pathname) {
        setPrevPathname(pathname);
        setMobileMenuOpen(false);
    }

    const copy = locale === "uz"
        ? {
            home: "Matematika laboratoriyasi bosh sahifasi",
            product: "Mahsulot",
            workflow: "Jarayon",
            ecosystem: "Ekotizim",
            workspace: "Ilmiy ish maydoni",
            homeLink: "Bosh sahifa",
            openIntegral: "Integralni ochish",
            allStudios: "Barcha studiyalar",
            studios: "Studiyalar",
            openLaboratory: "Laboratoriyani ochish",
            menu: "Menyu",
            quickStudios: "Laboratoriya studiyalari",
            explore: "Tadqiqot markazi"
        }
        : {
            home: "MathSphere Laboratory home",
            product: "Product",
            workflow: "Workflow",
            ecosystem: "Ecosystem",
            workspace: "Scientific workspace",
            homeLink: "Home",
            openIntegral: "Open Integral",
            allStudios: "All studios",
            studios: "Studios",
            openLaboratory: "Open Laboratory",
            menu: "Menu",
            quickStudios: "Laboratory Studios",
            explore: "Research Center"
        };

    const inLaboratory = pathname.startsWith("/laboratory");
    const laboratoryIndex = pathname === "/laboratory";

    return (
        <header className="ax-premium-nav relative">
            <div className="ax-landing-container ax-premium-nav-inner" style={{ minHeight: inLaboratory ? 64 : 72 }}>
                <Link href="/" className="flex min-w-0 items-center gap-3.5 outline-none focus-visible:shadow-[var(--ax-focus-ring)]" aria-label={copy.home}>
                    <AxionMark className="h-9 w-9 text-[var(--ax-accent)] shrink-0" />
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

                <div className="flex items-center gap-2">
                    {inLaboratory ? (
                        <>
                            <Link href="/" className="ax-premium-secondary hidden sm:inline-flex">{copy.homeLink}</Link>
                            <Link href={laboratoryIndex ? "/laboratory/integral-studio" : "/laboratory"} className="ax-premium-primary hidden xs:inline-flex">
                                {laboratoryIndex ? copy.openIntegral : copy.allStudios} <span aria-hidden="true">→</span>
                            </Link>
                        </>
                    ) : (
                        <>
                            <Link href="/laboratory" className="ax-premium-secondary hidden sm:inline-flex">{copy.studios}</Link>
                            <Link href="/laboratory" className="ax-premium-primary hidden xs:inline-flex">{copy.openLaboratory} <span aria-hidden="true">→</span></Link>
                        </>
                    )}

                    <button
                        type="button"
                        onClick={() => setMobileMenuOpen((open) => !open)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-[8px] border border-[var(--ax-line)] bg-[var(--ax-surface)] text-[var(--ax-text-soft)] hover:text-[var(--ax-text)] hover:bg-[var(--ax-surface-soft)] xl:hidden transition-colors"
                        aria-expanded={mobileMenuOpen}
                        aria-label={copy.menu}
                    >
                        {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
                    </button>
                </div>
            </div>

            {/* Mobile Navigation Drawer */}
            {mobileMenuOpen ? (
                <div className="border-b border-[var(--ax-line)] bg-[var(--ax-surface)] px-6 py-5 shadow-xl xl:hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="space-y-4">
                        {!inLaboratory ? (
                            <div className="flex flex-col gap-1 border-b border-[var(--ax-line)] pb-4">
                                <Link
                                    href="/#product"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="flex items-center justify-between rounded-lg px-3 py-2 text-sm font-semibold text-[var(--ax-text)] hover:bg-[var(--ax-surface-soft)]"
                                >
                                    <span>{copy.product}</span>
                                    <ArrowRight className="h-3.5 w-3.5 text-[var(--ax-text-faint)]" />
                                </Link>
                                <Link
                                    href="/#workflow"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="flex items-center justify-between rounded-lg px-3 py-2 text-sm font-semibold text-[var(--ax-text)] hover:bg-[var(--ax-surface-soft)]"
                                >
                                    <span>{copy.workflow}</span>
                                    <ArrowRight className="h-3.5 w-3.5 text-[var(--ax-text-faint)]" />
                                </Link>
                                <Link
                                    href="/#ecosystem"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="flex items-center justify-between rounded-lg px-3 py-2 text-sm font-semibold text-[var(--ax-text)] hover:bg-[var(--ax-surface-soft)]"
                                >
                                    <span>{copy.ecosystem}</span>
                                    <ArrowRight className="h-3.5 w-3.5 text-[var(--ax-text-faint)]" />
                                </Link>
                            </div>
                        ) : null}

                        <div>
                            <div className="flex items-center gap-2 px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-[var(--ax-text-faint)]">
                                <Compass className="h-3.5 w-3.5 text-[var(--ax-accent)]" />
                                <span>{copy.quickStudios}</span>
                            </div>
                            <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                                {STUDIOS.map((s) => (
                                    <Link
                                        key={s.slug}
                                        href={`/laboratory/${s.slug}`}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="flex items-center justify-between rounded-lg border border-transparent px-3 py-2 text-xs font-medium text-[var(--ax-text-soft)] hover:border-[var(--ax-line)] hover:bg-[var(--ax-surface-soft)] hover:text-[var(--ax-text)] transition-colors"
                                    >
                                        <span>{locale === "uz" ? s.titleUz : s.titleEn}</span>
                                        <ArrowRight className="h-3 w-3 opacity-40" />
                                    </Link>
                                ))}
                            </div>
                        </div>

                        <div className="pt-2">
                            <Link
                                href="/laboratory"
                                onClick={() => setMobileMenuOpen(false)}
                                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--ax-accent)] py-2.5 text-center text-xs font-semibold text-white shadow-sm hover:opacity-90 transition-opacity"
                            >
                                <Sparkles className="h-3.5 w-3.5" />
                                <span>{copy.openLaboratory}</span>
                            </Link>
                        </div>
                    </div>
                </div>
            ) : null}
        </header>
    );
}
