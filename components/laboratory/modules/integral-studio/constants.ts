import { IntegralBlockId, IntegralExperienceLevel, IntegralWorkspaceTab } from "./types";
import { INTEGRAL_PRESET_CATALOG, INTEGRAL_WORKFLOW_CATALOG } from "@/components/laboratory/laboratory-template-catalog";

export const exportGuides = {
    copy: {
        badge: "Integral export",
        title: "Integral natijasini nusxa olish",
        description: "Integral hisoboti markdown bo'lib clipboard'ga ko'chadi.",
        confirmLabel: "Nusxa olish",
        steps: [
            "Midpoint, trapezoid va Simpson natijalari bitta hisobotga yig'iladi.",
            "Function, interval va segment soni ham birga yoziladi.",
            "Mavjud maqolangning kerakli joyiga paste qilasan.",
        ],
        note: "Maqola ichidagi aynan kerakli bo'limni o'zing tanlamoqchi bo'lsang, shu variant to'g'ri.",
    },
    send: {
        badge: "Writer import",
        title: "Integral natijasini writer'ga yuborish",
        description: "Integral hisobotini yangi writer draft'iga import qiladi.",
        confirmLabel: "Writer'ni ochish",
        steps: [
            "Integral export local storage'ga yoziladi.",
            "Yangi writer draft ochiladi.",
            "Hisobot draft boshiga qo'shiladi.",
        ],
        note: "Agar mavjud writer ichidagi live block'ga yubormoqchi bo'lsang, pastdagi Live Writer Bridge ishlatiladi.",
    },
} as const;

export const integralNotebookBlocks: Array<{ id: IntegralBlockId; label: string; description: string }> = [
    { id: "controls", label: "Solver Control", description: "Integral input, domain, grid va solve tugmalari." },
    { id: "visualizer", label: "Visualizer", description: "2D/3D grafik va asosiy result metric'lar." },
    { id: "summary", label: "Result Summary", description: "Yakuniy natija, trust va keyingi action kartalari." },
    { id: "exact", label: "Derivation", description: "Parser, exact result va qadamma-qadam symbolic kartalar." },
    { id: "tables", label: "Tables & Samples", description: "Method compare, sample rows va preview jadvali." },
    { id: "sweep", label: "Sweep", description: "Segment yoki grid sensitivity tahlili." },
    { id: "insights", label: "Diagnostics", description: "Compare, explain va result levels." },
    { id: "report", label: "Report Builder", description: "Writer skeleton va ilmiy summary." },
    { id: "notes", label: "Annotations", description: "Annotation'lar va current anchor." },
    { id: "experiments", label: "Scenarios", description: "Saqlangan scenario'lar." },
    { id: "bridge", label: "Writer Bridge", description: "Copy, send va live push." },
];

export const experienceLevelBlocks: Record<IntegralExperienceLevel, readonly IntegralBlockId[]> = {
    beginner: ["controls", "summary", "visualizer", "exact", "report", "bridge"],
    advanced: ["controls", "visualizer", "summary", "exact", "tables", "sweep", "insights", "report", "bridge"],
    research: integralNotebookBlocks.map((block) => block.id),
};

export const workspaceTabs: Array<{ id: IntegralWorkspaceTab; label: string; description: string }> = [
    { id: "solve", label: "Solve", description: "Input, action bar, primary result va derivation." },
    { id: "code", label: "Code", description: "SymPy reproduce kodi, metod va numeric strategy." },
    { id: "visualize", label: "Visualize", description: "Grafik, tables, samples va sweep." },
    { id: "compare", label: "Compare", description: "Diagnostics, explain mode va scenario compare." },
    { id: "report", label: "Report", description: "Report builder, notes va export flow." },
];

export const levelTabs: Record<IntegralExperienceLevel, readonly IntegralWorkspaceTab[]> = {
    beginner: ["solve", "code", "visualize", "report"],
    advanced: ["solve", "code", "visualize", "compare", "report"],
    research: ["solve", "code", "visualize", "compare", "report"],
};

export const integralPresetDescriptions: Record<string, string> = Object.fromEntries(
    INTEGRAL_PRESET_CATALOG.map((preset) => [preset.label, preset.description]),
);

export const integralPresetDescriptionsUz: Record<string, string> = Object.fromEntries(
    INTEGRAL_PRESET_CATALOG.map((preset) => [preset.label, preset.descriptionUz]),
);

export const INTEGRAL_WORKFLOW_TEMPLATES = INTEGRAL_WORKFLOW_CATALOG;

export const INTEGRAL_PRESETS = INTEGRAL_PRESET_CATALOG;
