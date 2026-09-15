import { afterEach, describe, expect, it, vi } from "vitest";

import { fetchLaboratoryModule, fetchLaboratoryModules, fallbackLaboratoryModules } from "./laboratory";

const { fetchPublicMock } = vi.hoisted(() => ({
    fetchPublicMock: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
    fetchPublic: fetchPublicMock,
}));

afterEach(() => {
    fetchPublicMock.mockReset();
});

describe("laboratory data fetchers", () => {
    it("falls back to integral studio when the backend returns no modules", async () => {
        fetchPublicMock.mockResolvedValue({
            ok: true,
            json: async () => [],
        });

        await expect(fetchLaboratoryModules()).resolves.toEqual(fallbackLaboratoryModules);
        expect(fetchPublicMock).toHaveBeenCalledWith("/api/laboratory/modules/?project=quantum-uz", { next: { revalidate: 60 }, timeoutMs: 1200 });
    });

    it("falls back to local metadata when module fetch fails", async () => {
        fetchPublicMock.mockResolvedValue({
            ok: false,
        });

        await expect(fetchLaboratoryModule("integral-studio")).resolves.toEqual(fallbackLaboratoryModules[0]);
        expect(fetchPublicMock).toHaveBeenCalledWith("/api/laboratory/modules/integral-studio/?project=quantum-uz", { next: { revalidate: 60 }, timeoutMs: 1200 });
    });
});
