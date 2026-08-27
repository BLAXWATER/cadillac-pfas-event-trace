#!/usr/bin/env bash
set -euo pipefail

source_dir="/workspace/scratch/ce420440ead8/source-docs"
docs_dir="/workspace/sites/cadillac-pfas-event-trace/public/docs"
preview_dir="/workspace/sites/cadillac-pfas-event-trace/public/previews"

mkdir -p "$docs_dir" "$preview_dir"

cp -a "$source_dir/2014-10-10_Cadillac_Pre-Inspection_Report_56545.pdf" "$docs_dir/2014-preinspection.pdf"
cp -a "$source_dir/2015-2016_Wexford County Landfill_Leachate Request.pdf" "$docs_dir/2015-2016-leachate-request.pdf"
cp -a "$source_dir/2017-04-03_Cadillac_WWTP_NPDES_Application.pdf" "$docs_dir/2017-npdes-application.pdf"
cp -a "$source_dir/MI0020257 PFAS-IPP Letter 2-20-2018.pdf" "$docs_dir/2018-02-20-pfas-ipp-letter.pdf"
cp -a "$source_dir/Cadillac WWTP_PFAS Extension Approval FINAL.pdf" "$docs_dir/2018-05-24-extension-approval.pdf"
cp -a "$source_dir/2018 IPP Screening - Monitoring Plan.180627modif.pdf" "$docs_dir/2018-06-27-monitoring-plan.pdf"
cp -a "$source_dir/J17646-1 UDS Level 2 Report Final Report (Leachate).pdf" "$docs_dir/2018-10-03-j17646-leachate.pdf"
cp -a "$source_dir/J17993-1 UDS Level 2 Report Final Report.pdf" "$docs_dir/2018-11-05-j17993-effluent.pdf"
cp -a "$source_dir/2018 IPP Screening - Monitoring Plan.Update181130.pdf" "$docs_dir/2018-11-30-monitoring-plan-update.pdf"
cp -a "$source_dir/Cadillac WWTP PFAS Interim and Summary Rpt Approval Letter.pdf" "$docs_dir/2019-03-04-report-approval.pdf"
cp -a "$source_dir/J19915-1 UDS Level 2 Report Final Report.pdf" "$docs_dir/2019-06-04-j19915-effluent.pdf"
cp -a "$source_dir/HNQ-VZP8-TWNRX V1.pdf" "$docs_dir/2019-06-28-source-status.pdf"
cp -a "$source_dir/Cadillac WWTP MI0020257 IPP PFAS Dec 2019 Status.pdf" "$docs_dir/2019-12-pfas-status.pdf"
cp -a "$source_dir/2020-10-22 VN-011108 Cadillac WWTP (1).pdf" "$docs_dir/2020-10-22-vn-011108.pdf"
cp -a "$source_dir/2024-01-22%20Follow-up%20to%20VN-012230%20IPP%20Procedures%20Manual%20Mod%20-%20City%20of%20Cadillac.pdf" "$docs_dir/2024-01-22-vn-012230-followup.pdf"
cp -a "$source_dir/TEST #1 - 3-4-2025 CYCLOPURE - SELF TESTING.pdf" "$docs_dir/2025-03-cyclopure-property.pdf"
cp -a "$source_dir/09102025_Analyte Original Cyclopure Test Kit Results (collected .pdf" "$docs_dir/2025-09-cyclopure-property.pdf"
cp -a "$source_dir/All MyTapScore Tests 2026.pdf" "$docs_dir/2026-04-mytapscore-property.pdf"
cp -a "$source_dir/EGLE-TEST-2509147-LAB-WORK-ORDER.png" "$docs_dir/2025-egle-work-order-2509147-page.png"

for pdf in "$docs_dir"/*.pdf; do
  stem="$(basename "$pdf" .pdf)"
  pdftoppm -f 1 -singlefile -jpeg -jpegopt quality=78 -r 105 "$pdf" "$preview_dir/$stem" >/dev/null 2>&1
done
