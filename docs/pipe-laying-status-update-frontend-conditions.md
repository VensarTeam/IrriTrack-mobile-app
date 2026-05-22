# Pipe Laying Status Update Frontend Conditions

This document lists the frontend validation conditions applied on the Unit Status Update screen for Inlet Pipe Laying and Outlet Pipe Laying.

Code reference: `src/viewmodels/useUnitStatusUpdateViewModel.js`

## Checklist ID Mapping

Frontend validation uses backend `checklist_id` values, not checklist description text.

| Field | Checklist ID |
| --- | --- |
| Inlet pipe size | `2` |
| Inlet pipe laid | `3` |
| Inlet connected | `4` |
| Numbers of Sub-Chak as per design | `7` |
| Outlet pipe laid | `8` |
| Outlet connected | `9` |

## Common Save Rule

- Validation runs before `submitChecklistOfflineFirst`.
- Because of that, the same frontend validation blocks both online sync submissions and offline local saves.
- Pipe laying subprocesses bypass the generic required-field/checklist/photo validation, but the custom inlet/outlet conditions below are still enforced.
- Empty pipe-laying submissions are blocked. At least one actual checklist tick/input/dropdown must be selected or filled.
- Remark alone does not count as checklist progress.
- The status dropdown alone does not count as checklist progress for pipe laying.
- Status is not validated by the generic status-required rule for Inlet Pipe Laying and Outlet Pipe Laying because these subprocesses use the custom pipe-laying validation path.
- These rules do not require internet. If the device is offline, valid data is saved locally first and synced later when connection returns.

## Submitted State

- Local/offline submitted state is shown when a saved local snapshot exists with filled payload data, or when the local snapshot status is `synced`.
- Server submitted state is shown only when server progress is available, the item is not commented, and the server data qualifies as submitted.
- For Inlet Pipe Laying and Outlet Pipe Laying specifically, server submitted state requires the server subprocess status key to be `completed`.
- For other subprocesses, server submitted state is based on whether the server subprocess contains filled checklist/detail/image data.
- Commented subprocesses are not treated as submitted, so they remain editable for rectification/resubmission.

## Inlet Pipe Laying

| Status              | Inlet Pipe laid | Connected    | Inlet Pipe Size | Remark     |
| ---                 |   ---           | ---          |      ---        |    ---     |
| Pending             | Not selected    | Not selected | Optional        | Optional, but submit is blocked because there is no checklist progress |
| Partially Completed | Selected        | Not selected | Compulsory      | Compulsory |
| Completed           | Selected        | Selected     | Compulsory      | Optional   |

Frontend conditions:

- At least one inlet checklist tick/input/dropdown must be selected or filled before submit.
- `Connected` cannot be selected unless `Inlet Pipe laid` is also selected.
- If `Inlet Pipe laid` is selected, `Inlet Pipe Size` is compulsory.
- If status is `Partially Completed`, remark is compulsory.
- If `Inlet Pipe laid` is selected but `Connected` is not selected, remark is compulsory.
- If `Inlet Pipe laid` and `Connected` are both selected, remark is optional.
- If `Inlet Pipe laid` is not selected, pipe-size and remark custom requirements are not applied, but the common "at least one checklist progress" rule still applies.

## Outlet Pipe Laying

| Status              | Outlet Pipe laid | Connected    | Design Qty / Actual Qty Value | Remark     |
| ---                 | ---              | ---          | ---                           | ---        |
| Pending             | Not selected     | Not selected | Optional                      | Optional, but submit is blocked because there is no checklist progress |
| Partially Completed | Selected         | Not selected | Required value only           | Compulsory |
| Partially Completed | Selected         | Selected     | Required value only           | Compulsory |
| Completed           | Selected         | Selected     | Required value only           | Optional when quantity matches design, compulsory when quantity differs |

Frontend conditions:

- At least one outlet checklist tick/input/dropdown must be selected or filled before submit.
- If `Outlet Pipe laid` is selected, `Sub Chak Quantity as per Design` / design outlet quantity field is compulsory.
- If status is `Partially Completed`, remark is compulsory.
- If `Outlet Pipe laid` is selected but `Connected` is not selected, remark is compulsory.
- If `Outlet Pipe laid` is selected and the entered outlet quantity differs from the unit design/sub-chak quantity available in the app, remark is compulsory.
- If `Outlet Pipe laid` and `Connected` are both selected in completed status and the quantity matches design, remark is optional.
- The current custom outlet validation does not block `Connected` without `Outlet Pipe laid`; it only applies the outlet required quantity and remark rules after `Outlet Pipe laid` is selected.

## Backend Cross-Check

- Frontend makes sure required input values are present before saving.
- Backend should still verify final business correctness.
- The frontend compares outlet quantity only when both numbers are available and can be parsed. If either value is missing or invalid, backend validation remains responsible for the final decision.
