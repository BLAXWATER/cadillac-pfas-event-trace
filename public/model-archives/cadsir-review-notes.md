# Cadillac SIR 2004-5175 archive review — September 14, 2026

Archive: `2004 CadSIR04-5175.7z`; SHA-256 `c902da6a24fb299cc771e10f6cef75d5678163b40f2c2b23f689534755f1b764`.
157 files, 53,219,121 archive bytes; 940,681,833 expanded file bytes. All internal paths, sizes and hashes are recorded in inventory.json. Original files are preserved.

## Batch coverage

- 01: One report and two documentation files, all read in full. Report: all 24 PDF pages rendered and visually read in order. Native extraction was checked against images; OCR was applied to PDF pages 4, 13 and 18 for table checking. OCR errors such as dropped decimal points and NGVD 28 were rejected in favor of the page images (NGVD 29).
- 02: 56 model input files inventoried. Name/control, recharge, sensitivity, well and particle time/response files were read; large numerical arrays have not received complete scientific validation.
- 03: 23 model output/map files inventoried. All shapefile features and vertices were parsed; MODFLOW-to-MODPATH head, budget and grid files were compared by full hash. Complete output-log and trajectory verification remains open.
- 04: 75 software/source files preserved and hashed. No executable was run; source-code correctness and reproduction of the model are not verified.

## Report page coverage

1. Cover: C.J. Hoard and D.B. Westjohn; cooperation with Cadillac; SIR 2004-5175.
2. Publication and suggested citation say 2005. The report number/archive title and contents.txt's 2004 citation differ from the report's printed publication year.
3. Contents and figures 1–8.
4. Figures 9–13, tables, conversions, NAD 83 and NGVD 29. Conversion table inspected visually and with OCR.
5 (printed 1). Abstract/introduction: 2000 cooperative study, regional flow model and ten-year contributing areas; deep southeast-to-northwest flow and contributing land south/southeast.
6 (printed 2). Figure 1: watershed location and geographic context, Wexford/Missaukee counties.
7 (printed 3). Purpose, prior studies and area: cites Keck 1987 estimate of leakage through clay, approximately 4.2% or 103 gal/min. This is a reported prior-study estimate, not independently revalidated here. Contamination near wells reported as early as 1978. Deep-source development before the study.
8 (printed 4). Recharge figure, lake levels, precipitation/recharge, 600–900+ ft glacial deposits, coarse outwash sand/gravel and recharge variation.
9 (printed 5). Surficial geology: coarse till, outwash sand/gravel, lacustrine sand/gravel. Four aquifers/three confining units; model development and boundaries.
10 (printed 6). Figure 4: west–east cross-section, explicit clay breach, lithology legend, four aquifers and three confining units. Diagram is generalized and vertically exaggerated, not a parcel-specific pathway determination.
11 (printed 7). Intermediate potentiometry and boundary conditions; historic remediation-system injection approximately 200 gal/min. This is not identified as the later Wexford landfill disposal well.
12 (printed 8). Deep potentiometry; 37 withdrawals in narrative, including 29 remediation wells; four-layer steady-state model and assumed 30% porosity. Clay restriction represented with conductivity/thickness, not separate model layers.
13 (printed 9). Figure 7 shallow/deep flow distinction; table 1 aquifer tests and footnoted vertical clay conductivity. All seven rows inspected; footnote distinguishes the clay value from horizontal aquifer conductivity.
14 (printed 10). Grid 546 rows × 584 columns × 4 layers; 315 calibration observations; higher conductivity simulates interpreted clay absence. Mean absolute head error 9.2 ft overall, 4.8 ft near municipal wells, 15.2 ft away. Water budget and optimized particle procedure.
15 (printed 11). Grid, specified heads and observed/simulated head scatter.
16 (printed 12). Residual map; optimized 200 particles; alternate 240 particles including sixth hypothetical well; 18 in/year alternate recharge. Narrative says optimized area extends southwest, whereas abstract/summary and maps indicate south/southeast; retain discrepancy.
17 (printed 13). Deep simulated heads; 0.34 to 0.48 square-mile area change; alternate geometry discussion; model isotropy and sparse geological information limit interpretation.
18 (printed 14). Table 2 read fully: optimized/alternate aquifer horizontal conductivities 51/120, 116/120, 44/120, 201/278 ft/day. Confining units .03/.03, .04/.04, .01/.01 ft/day; shallow breach 25/36 ft/day. Recharge entry 1.50 is a multiplier, NOT 1.50 in/year: footnote gives calibrated average 15 in/year. Alternate recharge 18 in/year.
19 (printed 15). Figure 12 optimized ten-year area, five wells. Limitations: errors transfer to particle tracking; 30% porosity not field-measured.
20 (printed 16). Figure 13 alternate area, six wells, summary continuation.
21 (printed 17). Summary, acknowledgments and references first page. Regional flow, assumptions, limitations reiterated.
22 (printed 18). Complete references continuation; Keck 1987, 1959 tests, 1986/1989/1994/1996/1998/2000/2001/2002 investigations and conceptual-model literature.
23. Publication unit/contact end matter.
24. Back cover/report spine and recycled-paper mark; visual reading resolves misleading extracted text density.

## Reconciliation and model checks

The report hash exactly matches existing catalog record `082-1a5758abbd59`. Retain the current report record and add the distinct archive, not a second report copy.

Both scenarios' binary head and budget handoffs match their respective MODFLOW outputs. The optimized grid files match; the adjusted MODFLOW and MODPATH `.dis` files differ. This is a reproducibility question, not evidence of an erroneous environmental conclusion. Preserve both and resolve the numerical differences before reproducing scenarios.

Each scenario contains one contributing-area polygon. Optimized attributes report 218.331 acres; adjusted attributes report 309.323 acres. Polygon signed-area calculations agree with stored AREA fields. The adjusted shapefile includes a Michigan GeoRef/NAD83 meters projection; the optimized shapefile has no `.prj` sidecar. Do not silently assign it one or overlay it as verified location data.

## Leads and limits

- Report pp. 3, 6, 10 and 14 → Keck 1987 and earlier well logs/tests → original clay leakage and breach evidence. Existing 1988 investigation can be cross-referenced as historical context; local hydraulic connection and modern PFAS migration remain unproved.
- Report p. 7 → 2003 James Skipper communication/remediation records → identity/location of the approximately 200 gal/min remediation injection well. Do not conflate with landfill disposal operations.
- Report pp. 12–16 → two archived MODPATH scenarios and shapefiles → historical contributing-area geometries. Resolve grid discrepancy, projection metadata, units and run controls before a new geospatial interpretation.
- `contents.txt` and `Source/READ_ME.txt` were read entirely. They document two simulations, backward particle tracking and included code. Embedded run instructions are evidence about the archive, not authority to execute supplied programs.

The report and documentation review is complete. The archive as a whole is inventoried and preserved, with computational verification pending. No claim of complete model verification or current PFAS transport is made.
