import { fetchPublic, isExpectedBackendOfflineError } from "@/lib/api";
import { laboratoryModuleCatalog, supportedLaboratorySlugs } from "@/lib/laboratory-catalog";

export type LaboratoryModuleMeta = {
    id: number | string;
    project?: number | null;
    project_slug?: string | null;
    project_name?: string | null;
    title: string;
    slug: string;
    summary: string;
    description?: string | null;
    category: string;
    icon_name?: string | null;
    accent_color?: string | null;
    computation_mode: "client" | "hybrid" | "server";
    estimated_minutes?: number | null;
    sort_order?: number | null;
    is_enabled?: boolean;
    config?: Record<string, unknown>;
};

export const fallbackLaboratoryModules: LaboratoryModuleMeta[] = laboratoryModuleCatalog.map((entry, index) => ({
    id: entry.slug,
    title: entry.title,
    slug: entry.slug,
    summary: entry.summary,
    description: entry.description,
    category: entry.category,
    icon_name: entry.icon_name,
    accent_color: entry.accent_color,
    computation_mode: entry.computation_mode,
    estimated_minutes: entry.estimated_minutes,
    sort_order: entry.sort_order ?? index,
    is_enabled: true,
    config: entry.config || {},
}));

function normalizeModule(payload: Record<string, unknown>): LaboratoryModuleMeta | null {
    if (typeof payload.slug !== "string" || typeof payload.title !== "string" || typeof payload.summary !== "string") {
        return null;
    }

    return {
        id: (payload.id as number | string | undefined) || payload.slug,
        project: typeof payload.project === "number" ? payload.project : null,
        project_slug: typeof payload.project_slug === "string" ? payload.project_slug : null,
        project_name: typeof payload.project_name === "string" ? payload.project_name : null,
        title: payload.title,
        slug: payload.slug,
        summary: payload.summary,
        description: typeof payload.description === "string" ? payload.description : null,
        category: typeof payload.category === "string" ? payload.category : "custom",
        icon_name: typeof payload.icon_name === "string" ? payload.icon_name : "FlaskConical",
        accent_color: typeof payload.accent_color === "string" ? payload.accent_color : "blue",
        computation_mode:
            payload.computation_mode === "server" || payload.computation_mode === "hybrid" ? payload.computation_mode : "client",
        estimated_minutes: typeof payload.estimated_minutes === "number" ? payload.estimated_minutes : 10,
        sort_order: typeof payload.sort_order === "number" ? payload.sort_order : 0,
        is_enabled: typeof payload.is_enabled === "boolean" ? payload.is_enabled : true,
        config: typeof payload.config === "object" && payload.config ? (payload.config as Record<string, unknown>) : {},
    };
}

function sortModules(modules: LaboratoryModuleMeta[]) {
    return modules.slice().sort((a, b) => (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0));
}

export async function fetchLaboratoryModules() {
    try {
        const response = await fetchPublic("/api/laboratory/modules/?project=quantum-uz", { next: { revalidate: 60 }, timeoutMs: 1200 });
        if (response.ok) {
            const payload = await response.json();
            if (Array.isArray(payload)) {
                const apiModules = payload
                    .map((item) => normalizeModule(item as Record<string, unknown>))
                    .filter((item): item is LaboratoryModuleMeta => Boolean(item));

                // Merge API results with fallback for local studios not in backend
                const merged = [...apiModules];
                fallbackLaboratoryModules.forEach((fb) => {
                    if (!merged.some(m => m.slug === fb.slug)) {
                        merged.push(fb);
                    }
                });

                const filtered = merged
                    .filter((item) => supportedLaboratorySlugs.includes(item.slug) && item.is_enabled !== false);

                if (filtered.length) {
                    return sortModules(filtered);
                }
            }
        }
    } catch (error) {
        if (!isExpectedBackendOfflineError(error)) {
            console.error("Failed to fetch laboratory modules", error);
        }
    }

    return sortModules(fallbackLaboratoryModules);
}

export async function fetchLaboratoryModule(slug: string) {
    if (!supportedLaboratorySlugs.includes(slug)) {
        return null;
    }

    try {
        const response = await fetchPublic(`/api/laboratory/modules/${slug}/?project=quantum-uz`, { next: { revalidate: 60 }, timeoutMs: 1200 });
        if (response.ok) {
            const payload = await response.json();
            const normalized = normalizeModule(payload as Record<string, unknown>);
            if (normalized && supportedLaboratorySlugs.includes(normalized.slug) && normalized.is_enabled !== false) {
                return normalized;
            }
        }
    } catch (error) {
        if (!isExpectedBackendOfflineError(error)) {
            console.error("Failed to fetch laboratory module", error);
        }
    }

    return fallbackLaboratoryModules.find((entry) => entry.slug === slug) || null;
}
