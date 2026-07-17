# Pedestal & Enclosure End-to-End Workflow

This document explains the full frontend flow for the `Pedestal & Enclosure` subprocess, from the first checklist update through completion and approval.

Code references:

- `src/viewmodels/unitStatusUpdate/pedestalEnclosure.js`
- `src/viewmodels/useUnitStatusUpdateViewModel.js`
- `src/screens/unit/UnitStatusUpdate/ChecklistSection.js`

## Scope

- Applies only to the `Pedestal & Enclosure` subprocess.
- Validation uses checklist IDs and photo checklist IDs, not description text.
- The screen merges current form state with the latest saved snapshot before validating or building the submit payload.
- Photos that already exist from the server are shown in the UI, but they are not re-sent in the payload.

## Checklist IDs

| UI Stage | Checklist | ID |
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

## Photo Checklist IDs

| Photo | ID |
| --- | --- |
| Full photo of inlet and outlet pipeline connections | `99` |
| Full photo of OMS installation after backfilling with open door | `100` |
| Full photo of OMS after backfilling with a closed door | `25` |
| Duly signed checklist copy photo | `26` |

## Photo Dependency Rules

- Checklist `20` requires photo `99`.
- Checklist `20` is also linked with checklist `22`.
- Checklist `22` provides the size/details used with photo `99`.
- Checklist `23` requires photo `100`.
- Checklist `97` requires photo `25`.
- Photo `26` is required only when the process is going to `Completed`.

## UI Stage Layout

| UI Stage | Content |
| --- | --- |
| Stage 1 | Checklist `13` |
| Stage 2 | Dynamic checklist `22`, checklists `14`, `15`, `17`, `18`, `19`, `21`, `20`; checklist `20` opens photo `99` from its camera icon |
| Stage 3 | Checklists `23`, `97`; their camera icons open photos `100` and `25` respectively |

Contractor selection is common for the full subprocess and is shown outside these stage sections. Photo upload cards remain in the normal bottom photo section, while checklist camera icons provide direct camera/gallery shortcuts for linked photo slots.

## Submission Flow

1. User opens `Pedestal & Enclosure`.
2. The screen hydrates current values from the latest available server data, local submission snapshot, or draft values.
3. If a photo already exists from the server, it is displayed as prefilled.
4. Server-prefilled photos are treated as already submitted and are not sent again in the submit payload.
5. On every submit/update, the form merges:
   - current checklist/photo selections
   - the latest local DB submission snapshot
   - server progress data when available
6. Validation then runs on the merged state.
7. The process remains `Partially Completed` until all mandatory checklist items and required photo rules are satisfied.
8. The process becomes `Completed` only when all mandatory checklist items are ticked and photo `99`, `100`, `25`, and `26` are available in the merged submission state.
9. After submission, if the server marks the workflow as approved or submitted, the screen becomes read-only unless the current status allows a specific resubmit/edit path.

## Edit Flows

### Modify Approved Flow

- Used when a submission is reopened for a modify-approved update.
- Checklist values can be updated.
- Photo changes are disabled for this request.
- The payload sends checklist updates without re-sending photos.
- The existing submitted photo state is still used for validation and display.

### Commented Flow

- Used when a submission comes back with a commented/rejected update path.
- A commented submission can be opened for resubmit only from Work Status, which supplies the exact work item and submission ID. Opening the same OMS/process from Unit List remains read-only and cannot resubmit it.
- The normal pedestal photo-ID rules (`99`, `100`, `25`, and `26`) apply only to a new/partial submit from Unit List; they are not revalidated during a commented resubmit.
- The commented screen exposes only the rectification photo upload when the user chooses to add the requested fresh image. Normal pedestal photo cards are not shown.
- Existing server photos are not required or re-sent in the commented resubmit payload.

### Approved / Read-Only Flow

- Once the submission is fully approved or otherwise locked by workflow rules, the screen becomes read-only.
- In read-only state, checklist and photo inputs are not editable.
- Server photos can still be previewed, but they are not re-uploaded.

## Mandatory Completion Set

The following checklist items must be completed before the process can be completed:

- `13`
- `14`
- `15`
- `17`
- `18`
- `19`
- `20`
- `21`
- `23`
- `97`

The following photos must also be available for completion:

- `99`
- `100`
- `25`
- `26`

## Partial Submission Rules

- Checklist `13` can be submitted in partial state without any photo.
- The process can be saved as partial when some required checklists are completed and the remaining required items are not yet finished.
- If checklist `20` is completed, photo `99` must be present in the current payload or already available in the merged saved state.
- If checklist `23` is completed, photo `100` must be present in the current payload or already available in the merged saved state.
- If checklist `97` is completed, photo `25` must be present in the current payload or already available in the merged saved state.

## UI Hints

- Checklist `20` shows a photo dependency badge for `Photo 99`.
- Checklist `23` shows a photo dependency badge for `Photo 100`.
- Checklist `97` shows a photo dependency badge for `Photo 25`.
- The photo upload cards themselves are highlighted when a required photo is missing.

## Validation Messages

- `Full photo of inlet and outlet pipeline connections is required because checklist 20 is completed.`
- `Photo 100 is required because checklist 23 is completed.`
- `Photo 25 is required because checklist 97 is completed.`
- `Signed checklist photo 26 is required to complete Pedestal & Enclosure.`

## Practical Examples

- If the user ticks checklist `20` and uploads photo `99`, the submission can stay partial until the remaining mandatory items are finished.
- If the user comes back later and photo `99` is already present from the server, the photo is shown as prefilled and is not uploaded again.
- If checklist `23` is ticked later, the screen can still complete the submission as long as photo `100` already exists in the merged saved state or is uploaded now.
- When all mandatory checklist items are completed and all required photos exist, the submission moves to `Completed`.
- If a modify-approved request comes back, the user can correct checklist values without changing the existing pedestal photos.
- If a commented request comes back, the user can add the requested rectification photo flow while keeping the pedestal validation rules intact.
