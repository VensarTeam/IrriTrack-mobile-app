# Pedestal & Enclosure Status Update Frontend Conditions

This document lists the frontend validation conditions applied on the Unit Status Update screen for `Pedestal & Enclosure`.

Code references:

- `src/viewmodels/unitStatusUpdate/pedestalEnclosure.js`
- `src/viewmodels/useUnitStatusUpdateViewModel.js`

## Checklist ID Mapping

Frontend validation uses backend `checklist_id` values, not checklist description text.

| Field | Checklist ID |
| --- | --- |
| Check excavation Pit (2.5m X 2m X 0.9m depth) | `13` |
| Check proper placement of RCC precast block | `14` |
| Check tightening of RCC Block-Pedestal Jointing Bolts | `15` |
| Check 110 mm inlet pipe properly installed & tightened with U-Clamps | `17` |
| Check 63 mm Outlet pipe properly installed & tightened with U-Clamps | `18` |
| Check 100mm MS companion flange and Stub-end provided at inlet pipe | `19` |
| Check all butt fusion joints are properly welded | `20` |
| Check horizontal and vertical alignment of enclosure cabinet | `21` |
| Outlet pipe identification and marking | `22` |
| Backfill soil, up to Ground Level properly | `23` |
| Check OMS box locks and latches are functioning properly | `97` |

## Photo Checklist Mapping

| Field | Checklist ID |
| --- | --- |
| Full photo of inlet and outlet pipeline connections | `99` |
| Full photo of OMS installation after backfilling with open door | `100` |
| Full photo of OMS after backfilling with a closed door | `25` |
| Duly signed checklist copy photo | `26` |

## Validation Rules

- This validation applies only to the `Pedestal & Enclosure` subprocess.
- The process stays `Partially Completed` until all mandatory checklist items are ticked and the required photo rules are satisfied.
- The process can become `Completed` only when all mandatory checklist items are ticked and photos `99`, `100`, `25`, and `26` are available after merging current values with the latest local DB snapshot.
- Checklist `13` does not require any photo and may be saved in partial state.
- If checklist `20` is ticked, photo `99` must be present in the current request payload.
- Checklist `22` (`Outlet Pipe Identification and Marking`) is required only when checklist `20` is ticked.
- Photo `99` is submitted with linked size metadata from checklist `22` (`Outlet Pipe Identification and Marking`).
- If checklist `23` is ticked, photo `100` must be present in the current request payload or photo `99` must already exist in the local DB snapshot for the same submission/process/OMS.
- If checklist `97` is ticked, photo `25` must be present in the current request payload or photos `99` and `100` must already exist in the local DB snapshot for the same submission/process/OMS.
- Photo `26` is required only when the process is going to `Completed`.
- On every submit/update request, the screen merges current checklist/photo values with the latest local DB snapshot before validating.

## Validation Errors

- `Photo 99 is required because checklist 20 is completed.`
- `Photo 100 is required because checklist 23 is completed.`
- `Photo 25 is required because checklist 97 is completed.`
- `Signed checklist photo 26 is required to complete Pedestal & Enclosure.`
