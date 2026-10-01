# Pipe Network API Flow and Implementation Requirements

Updated: 1 October 2026

Audience: mobile, web and backend developers working on IrriTrack Pipe Network.

This document covers the dashboard, pipe list, daily work, daily reports, checklist submissions and review workflow. Daily Work CRUD and checklist submission/review endpoints are documented. Dashboard aggregates, detailed submission retrieval, resubmission and OMS-style reviewer routing still need backend contracts.

**Status disclaimer:** “Documented” means present in the supplied API guides, not tested against a live backend or confirmed implemented in the mobile app. “Contract needed” means the route, payload or behaviour must be confirmed; proposed requirements below are not existing API guarantees.

## Sources and scope

- User-supplied `MOBILE-OMS-ACTIONS-AND-DAILY-WORK.md`, sections A and B.
- User-supplied updated sections B.8 and C covering field mapping and the separate Pipe Laying Checklist contract.
- OMS is a reference for the desired review experience. No RMS API contract was supplied; RMS parity is not verified.

All routes below are relative to `{API_BASE}/v1` and require `Authorization: Bearer <accessToken>`. Do not append a second `/v1` when the configured base already includes it.

## End to end screen flow

```text
Project dashboard
  └─ Pipe Network overview
      ├─ Pipe list and segment selection
      ├─ Daily Reports → Add or edit Daily Work → Save work record
      └─ Checklist → Create or select package → Submit one process
          └─ Work Status queue → Review → Verify → Approve
                                   └─ Modification and resubmission
```

Verification followed by approval is the intended OMS-style path. Pipe Laying transition and permission rules need confirmation before implementing the same buttons.

Daily Work and checklist submissions are separate resources. Saving work does not save or submit checklist answers. A shared UI may coordinate both operations, but must show their outcomes separately and never claim both succeeded after only one request succeeds.

## Dashboard and pipe selection

| Function | Method and route | Contract status |
| --- | --- | --- |
| Current user and role | `GET /auth/me` | Documented |
| Pipe list and search | `GET /pipe-laying/segments?projectId={id}&q={search}` | Documented route; response details needed |
| Pipe dropdown | `GET /pipe-laying/segments/options?projectId={id}` | Documented |
| Work records and covered ranges | `GET /pipe-laying/works?projectId={id}` | Documented |
| Dashboard totals and progress | Dedicated aggregate endpoint to confirm | Contract needed |
| Map and geographic progress | Exact endpoint to confirm | Contract needed |

Recommended dashboard metrics are total pipe length, progress per material and per stage, remaining length, today's work and submission status counts. Keep recorded progress distinct from approved progress. Do not sum excavation, laying and backfilling lengths into one completed length: they may cover the same pipe.

Confirm aggregation rules, units, response schemas, pagination and project access before using raw work records to calculate dashboard totals.

## Daily Work and Daily Reports

### API inventory

| Function | Method and route | Notes |
| --- | --- | --- |
| Load pipes | `GET /pipe-laying/segments/options?projectId={id}` | Selected option supplies segment ID and metadata |
| Load contractors | `GET /contractors/manage?type=PIPE_NETWORK_LAYING` | Documented contractor type |
| Read work records | `GET /pipe-laying/works?projectId={id}` | Used for covered chainage and reports |
| Create work | `POST /pipe-laying/works` | JSON body |
| Update work | `PATCH /pipe-laying/works/{id}` | Route documented; edit payload and restrictions need confirmation |
| Delete work | `DELETE /pipe-laying/works/{id}` | Route documented; permissions and approval restrictions need confirmation |
| Upload work photos | `POST /pipe-laying/works/photos` | Multipart; exact fields, limits and response need confirmation |

### Form field mapping

| UI field | Source or payload field | Rule |
| --- | --- | --- |
| Date | Local date → `workDate` | `YYYY-MM-DD`, avoid UTC conversion shifting the day |
| Pipe | Selected option `id` → `segmentId` | Required |
| Location | Selected option `locationCode` | Display only |
| Material | Selected option `material` | `HDPE`, `MS` or `DI`; display only in work form |
| Actual diameter | Selected option `diameterMm` → `actualDiameterMm` | Editable and optional, in mm |
| Available chainage | Segment `lengthM` and existing works | Compute available ranges; stage semantics need confirmation |
| Chainage from and to | `chainageFromM`, `chainageToM` | Required numeric values in metres |
| Length laid | `lengthLaidM` | Required, positive and no greater than range length |
| Contractor | `contractorId` | Optional UUID; document allows `contractor` text for unassigned, exact convention to confirm |
| Work type | `workType` | Stage code, or omit for All |
| Remark | `remark` | Required when laid length is less than the selected range |
| Checklist | Checklist masters API | Reference only in Daily Work save |

### Create payload

```json
{
  "projectId": "project-uuid",
  "segmentId": "segment-uuid",
  "workDate": "2026-10-01",
  "chainageFromM": 0,
  "chainageToM": 30,
  "lengthLaidM": 30,
  "contractorId": "contractor-uuid",
  "workType": "pipe_laying",
  "actualDiameterMm": 315,
  "remark": ""
}
```

IDs above are placeholders. Use actual backend UUIDs.

- Required: `projectId`, `segmentId`, `chainageFromM`, `chainageToM`, `lengthLaidM`.
- `chainageToM` must be greater than `chainageFromM`.
- `lengthLaidM` must be greater than zero and at most `chainageToM - chainageFromM`.
- A shorter laid length requires a non-empty gap explanation in `remark`.
- Work date defaults to today if omitted according to the supplied contract.
- Stage codes are `excavation`, `pipe_laying`, `backfilling`. For **All**, omit `workType`; do not send the string `all`.
- Do not send location, material, checklist responses or checklist photos in this payload.
- Optional work `photoUrls` come from the separate work-photo upload flow, not checklist uploads.

After success, refresh work records, available ranges and relevant report/dashboard/map data. Retain inputs on failure and prevent duplicate taps while saving.

### Daily Report contracts to confirm

The project-scoped works GET is documented. Do not assume support for additional query parameters until confirmed. Request contracts for date range, material, stage, contractor and segment filters; ordering; pagination and totals; record details; and PDF/Excel export if required.

## Checklist master data and submission

### API inventory

| Function | Method and route | Contract status |
| --- | --- | --- |
| Process list | `GET /pipe-laying-checklist/processes` | Documented |
| Checklist fields | `GET /pipe-laying-checklist/masters?material={material}&processCode={process}` | Documented |
| Create package | `POST /pipe-laying-checklist/packages` | Documented |
| Submit answers | `POST /pipe-laying-checklist/submissions` | Documented; supervisor only |
| List or retrieve existing packages | Exact endpoint needed | Contract needed |

Omit `processCode` to load all processes. The master response includes `checklistId`, `processId`, `processCode`, `process`, `material`, `seqNo`, `title`, `requirement`, `dataType`, `inputType`, `options`, `photoCount`, `isRequired` and `isActive`.

Render fields from masters rather than hardcoded IDs. Confirm supported option formats, input types and attachment rules. Required answers must be validated for actual checklist submission, not made mandatory for a display-only Daily Work save.

### Create package

```json
{
  "projectId": "project-uuid",
  "material": "HDPE",
  "title": "Zone A Lateral 12",
  "chainageFromM": 0,
  "chainageToM": 120,
  "locationLabel": "Near village X",
  "remark": ""
}
```

Store returned `data.packageId` for submission and retries. Confirm whether existing packages should be reused across stages. The supplied package example has no `workId` or `segmentId`; the relationship to a specific Daily Work record needs an explicit backend contract.

### Submit answers

```json
{
  "packageId": "package-uuid",
  "processCode": "excavation",
  "remark": "Ready for inspection",
  "checklist": [
    { "checklistId": 101, "value": true, "valueType": "boolean" },
    { "checklistId": 104, "value": "Soil", "valueType": "string" }
  ]
}
```

Each submission has exactly one process. An All-stage UI needs three separate submissions, not `processCode: "all"`. Track success per process so retrying a failed stage does not repeat successful stages.

`checklistId` is numeric. Documented optional `valueType` values are `string`, `number`, `boolean`, `object`, `array` and `file`; optional item `metadata` is an object.

For photos, use multipart with a `payload` field containing the JSON string and file fields named by checklist ID, such as `101` (backend also accepts `file_101`). Confirm file limits and multiple-photo conventions. Success returns submission details including `submissionId` and `workflowStatus: "submitted"`.

## Work Status and approval

### API inventory

| Function | Method and route | Contract status |
| --- | --- | --- |
| Work Status queue | `GET /pipe-laying-checklist/request-status?projectId={id}` | Documented |
| Perform review action | `PATCH /pipe-laying-checklist/submissions/{submissionId}/workflow-status` | Documented |
| Full submission answers and photos | Exact endpoint needed | Contract needed |
| Audit and review history | Exact endpoint needed | Contract needed |
| Edit and resubmit checklist | Exact endpoint and payload needed | Contract needed |

Queue pagination, filters, status counts and notification lookup by submission ID must be confirmed separately; OMS query parameters are not automatically supported by Pipe Laying.

### Review payload

```json
{
  "action": "verify",
  "remark": "Checked at site"
}
```

Documented action values are `verify`, `approve`, `reject`, `modify_request`, `modify_approved` and `modify_rejected`. These are action values, not a complete confirmed status-transition table. Confirm current-state restrictions, resulting states, remark requirements and role permissions for each action.

Do not copy the OMS mapping of “Comment” to `reject`, or “Need Modify” to `modify_approved`, into Pipe Laying without confirmation.

### Proposed OMS style permission model

This is a target requirement, not verified current Pipe Laying behaviour. The supplied guide says Pipe Laying does not fully share OMS assignee freezing.

| Actor | Proposed behaviour |
| --- | --- |
| Supervisor | Submit and view own requests; correct/resubmit when allowed; no review approval |
| Assigned engineer | Verify or return work according to allowed transitions; no final approval |
| Assigned manager | Review and approve according to allowed transitions |
| Other engineer or manager | Read within authorized project scope; no action solely because of role |
| Admin override | Explicit backend-authorized override with audit trail |
| View-only role | Read authorized data; no mutations |

Backend requirements for parity:

- Freeze reviewer assignments when submitting, with a defined policy for missing assignments and later reassignment.
- Return assigned engineer and manager IDs on queue/detail items, or preferably authoritative `allowedActions` alongside status.
- Enforce project scope, ownership and review permissions server-side.
- Return actor, timestamp and remark history for each action.
- Specify whether creator/self-review is prohibited and how admin override works.
- Define the complete modification and resubmission cycle, including retained answers and new attachments.

Use `/auth/me` for actor identity. Do not infer submission-level authorization solely from profile reporting lines. Refresh queue, detail and counts after review; handle stale-state conflicts by reloading rather than blindly retrying the action.

## Additional requirements and open decisions

| Requirement | Decision or contract needed |
| --- | --- |
| Work and checklist linkage | Stable relationship between work ID, segment ID, package ID and submission ID |
| Recorded versus approved progress | When lengths affect progress and how pending/rejected work is represented |
| Stage-specific coverage | Same range may need excavation, laying and backfilling; prevent duplicates within appropriate scope |
| All-stage work | Meaning of omitted `workType` for reporting, coverage and subsequent stage entries |
| Partial range work | How an unlocated gap affects future available chainage; a length alone may not locate the gap |
| Stage prerequisites | Whether laying requires excavation approval and backfilling requires laying approval |
| Approved data changes | Edit/delete restrictions and correction or revision workflow |
| Duplicate-safe requests | Idempotency or equivalent server safeguards for timeout retries and multiple-stage submissions |
| Concurrent updates | Conflict behaviour if another user records overlapping work or reviews the same submission |
| Draft recovery | Restore unsaved inputs and local photos after app interruption; define offline sync policy |
| Attachment lifecycle | File types, size/count limits, upload failures, access and orphan cleanup |
| Notifications | New requests and review outcomes with authorized submission deep links |
| Report export | Supported filters, formats, permissions and generation/download endpoints |
| Consistent API responses | List envelopes, pagination, success IDs, validation errors and permission errors |
| Server validation | Segment bounds, project access, units, overlap rules and workflow transitions |

## Suggested implementation order

1. Implement Daily Work loading, validation and create; verify response contracts and record refresh.
2. Add Daily Reports, documented edit/delete operations and permission handling.
3. Integrate checklist masters, package creation and single-process submission; clearly separate work and checklist save outcomes.
4. Add Work Status queue and detail once retrieval contracts are available.
5. Add review actions after the Pipe Laying transition and permission matrix is confirmed.
6. Complete resubmission, history, dashboard aggregates, map refresh, notifications and exports as their contracts become available.

## Verification checklist

- [ ] Real project and segment IDs reach every form and request.
- [ ] No mock contractor, pipe or checklist IDs are submitted.
- [ ] Loading, empty, failure and retry states are supported.
- [ ] All omits `workType`; individual stages send exact API codes.
- [ ] Numeric bounds and partial-length remarks are validated.
- [ ] Covered ranges respect confirmed stage and gap semantics.
- [ ] Daily Work save does not claim checklist answers were saved.
- [ ] Package IDs survive submission failures without unnecessary recreation.
- [ ] Multi-stage partial success is visible and retries target failed stages only.
- [ ] Required master fields and attachment rules are enforced for checklist submission.
- [ ] Review buttons follow confirmed Pipe Laying permissions and current state.
- [ ] Unauthorized and stale-state actions are handled without losing user input.
- [ ] Successful mutations refresh affected records, counts and progress.
- [ ] Date handling is correct in device local time.
- [ ] Live endpoint tests and role-based acceptance tests are completed before marking APIs verified.
