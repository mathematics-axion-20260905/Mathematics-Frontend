import { describe, expect, it } from "vitest";

import {
    buildJupyterNotebookFromReport,
    createLaboratoryReportContract,
    LABORATORY_REPORT_REQUIRED_SECTIONS,
} from "@/lib/laboratory-report-contract";

describe("laboratory report contract", () => {
    it("creates a versioned contract with the canonical section order", () => {
        const contract = createLaboratoryReportContract({ moduleSlug: "integral-studio", mode: "single", publicationProfile: "full" });

        expect(contract.schema_version).toBe("1.0");
        expect(contract.source_of_truth).toBe("scientific_object");
        expect(contract.required_sections).toEqual(LABORATORY_REPORT_REQUIRED_SECTIONS);
        expect(contract.export_formats).toContain("Jupyter .ipynb");
    });

    it("keeps report text and turns fenced code into executable notebook cells", () => {
        const notebook = buildJupyterNotebookFromReport({
            title: "Integral report",
            markdown: "# Result\n\nThe value is exact.\n\n```python\nprint(1 + 1)\n```",
            contract: createLaboratoryReportContract({ moduleSlug: "integral-studio", mode: "single" }),
        });

        expect(notebook.nbformat).toBe(4);
        expect(notebook.cells).toHaveLength(2);
        expect(notebook.cells[0]).toMatchObject({ cell_type: "markdown" });
        expect(notebook.cells[1]).toMatchObject({ cell_type: "code", source: ["print(1 + 1)\n"] });
    });
});
