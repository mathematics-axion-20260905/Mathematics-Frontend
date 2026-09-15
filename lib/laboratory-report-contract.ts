export const LABORATORY_REPORT_CONTRACT_VERSION = "1.0" as const;

export const LABORATORY_REPORT_REQUIRED_SECTIONS = [
    "Problem Statement",
    "Method",
    "Solution",
    "Verification",
    "Graph Interpretation",
    "Code Appendix",
    "Conclusion",
] as const;

export const LABORATORY_REPORT_EXPORT_FORMATS = [
    "Markdown",
    "PDF",
    "LaTeX",
    "DOCX",
    "Scientific Object",
    "Jupyter .ipynb",
    "Writer",
    "Notebook",
] as const;

export type LaboratoryReportContract = {
    schema_version: typeof LABORATORY_REPORT_CONTRACT_VERSION;
    source_of_truth: "scientific_object";
    report_format: "markdown";
    required_sections: readonly string[];
    export_formats: readonly string[];
    publication_profile: string;
    module_slug: string;
    mode: string;
};

export type LaboratoryTransferTarget = "writer" | "notebook";
export type LaboratoryTransferState = "idle" | "sending" | "sent" | "error";
export type LaboratoryTransferLink = {
    targetApp: LaboratoryTransferTarget;
    href: string;
    transferId?: string;
    objectId?: string;
    sentAt: string;
};

export function createLaboratoryReportContract(input: {
    moduleSlug: string;
    mode: string;
    publicationProfile?: string;
}): LaboratoryReportContract {
    return {
        schema_version: LABORATORY_REPORT_CONTRACT_VERSION,
        source_of_truth: "scientific_object",
        report_format: "markdown",
        required_sections: LABORATORY_REPORT_REQUIRED_SECTIONS,
        export_formats: LABORATORY_REPORT_EXPORT_FORMATS,
        publication_profile: input.publicationProfile || "full",
        module_slug: input.moduleSlug,
        mode: input.mode,
    };
}

function splitCellSource(source: string) {
    return source.split("\n").map((line) => `${line}\n`);
}

/**
 * Creates a portable Jupyter projection without changing the canonical
 * Scientific Object. The full report is retained as Markdown and fenced code
 * blocks become executable cells; users can continue editing the notebook.
 */
export function buildJupyterNotebookFromReport(input: {
    title: string;
    markdown: string;
    contract: LaboratoryReportContract;
}) {
    const cells: Array<Record<string, unknown>> = [];
    const codeBlockPattern = /```([^\n]*)\n([\s\S]*?)```/g;
    let cursor = 0;
    let match: RegExpExecArray | null;

    const pushMarkdown = (source: string) => {
        if (source.trim()) {
            cells.push({ cell_type: "markdown", metadata: {}, source: splitCellSource(source) });
        }
    };

    while ((match = codeBlockPattern.exec(input.markdown))) {
        pushMarkdown(input.markdown.slice(cursor, match.index));
        const language = match[1].trim().toLowerCase();
        cells.push({
            cell_type: "code",
            execution_count: null,
            metadata: { language: language || "python" },
            outputs: [],
            source: splitCellSource(match[2].replace(/\n$/, "")),
        });
        cursor = match.index + match[0].length;
    }
    pushMarkdown(input.markdown.slice(cursor));

    return {
        cells,
        metadata: {
            kernelspec: { display_name: "Python 3", language: "python", name: "python3" },
            language_info: { name: "python", version: "3" },
            axion: {
                report_contract: input.contract,
                projection: "report-to-jupyter",
                generated_at: new Date().toISOString(),
            },
        },
        nbformat: 4,
        nbformat_minor: 5,
        title: input.title,
    };
}
