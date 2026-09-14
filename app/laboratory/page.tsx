import type { Metadata } from "next";

import { fetchLaboratoryModules } from "@/lib/laboratory";
import { EcosystemTransferIntake } from "@/components/laboratory/ecosystem-transfer-intake";
import { LaboratoryIndexContent } from "@/components/laboratory/laboratory-index-content";

export const metadata: Metadata = {
    title: "Mathematical studios",
    description: "Explore focused studios for symbolic computation, visualization, calculus, matrices, probability and limits.",
    alternates: { canonical: "/laboratory" },
};

export default async function LaboratoryPage() {
    const modules = await fetchLaboratoryModules();

    return (
        <div className="ax-workspace-root">
            <EcosystemTransferIntake />
            <LaboratoryIndexContent modules={modules} />
        </div>
    );
}
