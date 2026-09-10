import type { Metadata, Viewport } from "next";
import { Manrope, Playfair_Display } from "next/font/google";
import "./globals.css";
import "@/styles/axion-science-tokens.css";
import "@/styles/axion-ecosystem-shell.css";
import "@/styles/axion-premium-landing.css";
import "@/styles/axion-math-chrome.css";
import "@/styles/axion-premium-workspace.css";
import { EcosystemBar } from "@/components/ecosystem/ecosystem-bar";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

const manrope = Manrope({
    subsets: ["latin"],
    variable: "--font-inter",
    display: "swap",
});

const playfair = Playfair_Display({
    subsets: ["latin"],
    variable: "--font-playfair",
    display: "swap",
});

export const metadata: Metadata = {
    title: "MathSphere Laboratory | Axion Science",
    description: "Scientific computation, symbolic analysis and interactive mathematical visualization workspace.",
};

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    colorScheme: "light",
    themeColor: "#f7f9fc",
};

export default function MainLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="uz">
            <body className={`${manrope.variable} ${playfair.variable} min-h-screen`}>
                <div className="flex min-h-screen flex-col">
                    <EcosystemBar currentApp="math" />
                    <Navbar />
                    <main className="relative flex min-h-0 w-full flex-1 flex-col">{children}</main>
                    <Footer />
                </div>
            </body>
        </html>
    );
}
