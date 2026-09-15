# Math → Writer / Notebook transfer contract

Version: `1.0`

## Source of truth

The calculation is stored as a Scientific Object, not as a screenshot or a flattened paragraph.
The object uses Scientific Object schema `1.0` and is transferred inside a transfer envelope `1.0`.
Each save or send represents a revision. A destination receives a pinned revision and cannot silently
change the source calculation.

## What a saved result contains

- the original input snapshot and active mode;
- the structured module result, metrics, tables and plot series;
- the complete report in Markdown;
- method, engine, runtime, warnings and computation status;
- assumptions, verification certificate and numerical-trust information;
- provenance, source/result/report hashes and revision metadata;
- code and visualization metadata when the module produced them;
- a `report_contract` describing the format, required sections and export targets.

## What is sent to each destination

`Writer` and `Notebook` receive the same Scientific Object package. The destination may show the
selected publication profile as `presentation_markdown`, but the complete `report_markdown`, structured
payload and revision history remain in the object. This means changing the Writer layout or choosing
another profile does not alter the mathematical result.

`Notebook` is the Jupyter-oriented workspace in the ecosystem. The report action also provides a
portable `.ipynb` projection. It contains the report as Markdown cells, fenced code as code cells,
and the Axion contract in notebook metadata. It is an editable projection; the Scientific Object is
still the canonical record.

## Send and save rules

1. A result must be ready and free of a blocking solver error before Save or Send is enabled.
2. Save creates a project-bound Scientific Object when a project is active. Saving again appends a new
   revision to that object.
3. Send snapshots the current state. If inputs changed after the last save, the current state is
   appended as a new revision before transfer, so an older result is never sent accidentally.
4. If no project is selected, the object is kept under `unassigned-transfer`; the transfer remains
   usable, but project binding should be added before long-term collaboration.
5. The post-send action shows the exact destination link and object identifier. Opening the link is
   explicit; the Math page stays available for another destination or export.

## Report standard

The canonical report format is Markdown with these sections, in this order where available:

`Problem Statement → Method → Solution → Verification → Graph Interpretation → Code Appendix → Conclusion`

The Report Center can add assumptions, report tone, attachment status and an export contract. PDF,
LaTeX and DOCX are presentation exports of this report; they are not the canonical data model.

Publication profiles (`summary`, `full`, `appendix`, `figures`) change only the destination presentation.
For reproducible handoff, use `full` or `appendix`; for a concise manuscript insert, use `summary`.
