# Pedestal & Enclosure Status Update Frontend Conditions

This document lists the frontend validation conditions applied on the Unit Status Update screen for `Pedestal & Enclosure`.

Code references:

- `src/viewmodels/unitStatusUpdate/pedestalEnclosure.js`
- `src/viewmodels/useUnitStatusUpdateViewModel.js`

## Checklist ID Mapping

Frontend validation uses backend `checklist_id` values, not checklist description text.

| UI Stage | Field | Checklist ID |
| --- | --- | --- |
| Stage 1 | Check excavation Pit (2.5m X 2m X 0.9m depth) | `13` |
| Stage 2 | Check outlet pipe identification and marking | `22` |
| Stage 2 | Check proper placement of RCC precast block | `14` |
| Stage 2 | Check tightening of RCC Block-Pedestal Jointing Bolts | `15` |
| Stage 2 | Check 110 mm inlet pipe properly installed & tightened with U-Clamps | `17` |
| Stage 2 | Check 63 mm Outlet pipe properly installed & tightened with U-Clamps | `18` |
| Stage 2 | Check 100mm MS companion flange and Stub-end provided at inlet pipe | `19` |
| Stage 2 | Check horizontal and vertical alignment of enclosure cabinet | `21` |
| Stage 2 | Check all butt fusion joints are properly welded | `20` |
| Stage 3 | Backfill soil, up to Ground Level properly | `23` |
| Stage 3 | Check OMS box locks and latches are functioning properly | `97` |

## Photo Checklist Mapping

| Field | Checklist ID |
| --- | --- |
| Full photo of inlet and outlet pipeline connections | `99` |
| Full photo of OMS installation after backfilling with open door | `100` |
| Full photo of OMS after backfilling with a closed door | `25` |
| Duly signed checklist copy photo | `26` |

## Validation Rules

- This validation applies only to the `Pedestal & Enclosure` subprocess.
- The pedestal photo-ID dependency validation applies to new/partial submissions opened from Unit List, not to commented resubmissions.
- Commented pedestal resubmissions are editable only when opened from Work Status with a matching work item/submission ID; the Unit List path remains read-only.
- A commented resubmit uses only the rectification-photo flow and does not require photos `99`, `100`, `25`, or `26` again.
- Checklist `24` is the remark field. It is required only while a mandatory pedestal checklist item is incomplete; missing photos alone do not make the remark mandatory.
- The Unit Status Update UI splits the subprocess into three on-screen stages so supervisors can see which checklist items have photo dependencies.
- Contractor selection is common for the subprocess and remains outside the stage sections.
- The process stays `Partially Completed` until all mandatory checklist items are ticked and the required photo rules are satisfied.
- The process can become `Completed` only when all mandatory checklist items are ticked and photos `99`, `100`, `25`, and `26` are available after merging current values with the latest local DB snapshot.
- Checklist `13` does not require any photo and may be saved in partial state.
- If checklist `20` is ticked, photo `99` must be present in the current request payload.
- Checklist `22` (`Outlet Pipe Identification and Marking`) is required only when checklist `20` is ticked.
- Photo `99` is submitted with linked size metadata from checklist `22` (`Outlet Pipe Identification and Marking`).
- If checklist `23` is ticked, photo `100` must be present in the current request payload or already exist in the local/server snapshot for the same submission/process/OMS.
- If checklist `97` is ticked, photo `25` must be present in the current request payload or already exist in the local/server snapshot for the same submission/process/OMS.
- Photo `26` is required only when the process is going to `Completed`.
- On every submit/update request, the screen merges current checklist/photo values with the latest local DB snapshot before validating.

## UI Stage Layout

| UI Stage | Content |
| --- | --- |
| Stage 1 | Checklist `13` |
| Stage 2 | Dynamic checklist `22`, checklists `14`, `15`, `17`, `18`, `19`, `21`, `20`; checklist `20` opens photo `99` from its camera icon |
| Stage 3 | Checklists `23`, `97`; their camera icons open photos `100` and `25` respectively |

Photo upload cards remain in the normal bottom photo section. Camera icons on checklist rows are shortcuts to open camera/gallery for the linked photo slot.

## Validation Errors

- `Full photo of inlet and outlet pipeline connections is required because checklist 20 is completed.`
- `Photo 100 is required because checklist 23 is completed.`
- `Photo 25 is required because checklist 97 is completed.`
- `Signed checklist photo 26 is required to complete Pedestal & Enclosure.`
