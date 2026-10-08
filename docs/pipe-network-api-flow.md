# Pipe Network Mobile Integration Plan

Updated: 3 October 2026

> Historical integration plan. Its “Current mobile state” and “Required change” tables describe an earlier implementation and are not current. For the current app/API contract, role matrix, offline behavior, and resubmission flow, see [PIPE-NETWORK-CURRENT-FLOW.md](./PIPE-NETWORK-CURRENT-FLOW.md).

Backend baseline: `vensar-irritrack-apis` branch `role-permission-api`, commit `409beb5`.

This document defines the mobile flow from the Pipe Network dashboard through piping data, Daily Work, checklists, OMS-style Work Status, Daily Report, and offline synchronization. It also records the backend corrections required before stage progress can be considered reliable.

## Target flow

```text
Project modules
  -> Pipe Network dashboard
       -> Piping Data (segments, filters, progress)
       -> Add Daily Work
            -> Save work record
            -> Create/reuse segment package
            -> Submit one process checklist
       -> Work Status
            -> Queue -> Detail/history -> Verify/Modify/Approve
       -> Daily Report
            -> Server-side search/filter/pagination + local pending rows
```

Daily Work and checklist submission are separate backend resources. The mobile UI may guide the user through both, but it must persist and display each result independently. It must never report complete success if only one resource was saved.

## Current mobile state

| Area | Current behaviour | Required change |
| --- | --- | --- |
| Dashboard | Uses hardcoded `DEFAULT_PIPE_DATA` | Load project status from the API and cache the last successful snapshot |
| Add Entry | Pipe options, metadata, and checklist fields are hardcoded | Load segment options, contractors, processes, and checklist masters from APIs |
| Add Entry save | Saves a local JSON draft and copied photos only | Use a durable SQLite draft/outbox and sync real work/package/submission APIs |
| Daily Report | Loads works but filters search/location/label only inside the current page | Send all filters to the backend and use backend totals/pagination |
| Work Status | Dashboard callback/route is not connected for Pipe Network | Add a Pipe Work Status route and use Pipe Checklist APIs |
| Permissions | Pipe module visibility exists | Gate each screen and mutation using exact `pipe_laying.*` grants |

The existing OMS Work Status UI can supply reusable presentation components and interaction patterns, but Pipe Network must have its own API adapter and view model. OMS resources and Pipe Checklist resources must not be mixed in one service.

## Backend API map

All routes are relative to `{API_BASE}/v1` and require a bearer token.

### Dashboard and piping data

| Use | API |
| --- | --- |
| Project summary | `GET /pipe-laying/status?projectId={id}` |
| Paginated segments | `GET /pipe-laying/segments` |
| Segment filters | `GET /pipe-laying/segments/filter-options` |
| Segment selector | `GET /pipe-laying/segments/options?projectId={id}` |
| Map progress | `GET /pipe-laying/progress-geojson?projectId={id}` |

`/status` currently returns configuration plus overall and material-wise totals. It does not return stage-wise totals, today's work, checklist request counts, or an approved-progress view.

### Daily Work and report

| Use | API |
| --- | --- |
| Contractors | `GET /contractors/manage?type=PIPE_NETWORK_LAYING` |
| Work photo upload | `POST /pipe-laying/works/photos` |
| Create work | `POST /pipe-laying/works` |
| Update work | `PATCH /pipe-laying/works/{id}` |
| Delete work | `DELETE /pipe-laying/works/{id}` |
| Report/list | `GET /pipe-laying/works` |
| Report filter values | `GET /pipe-laying/works/filter-options` |

The works list supports `projectId`, `fromDate`, `toDate`, `segmentId`, `location`, `label`, `q`, `page`, and `limit`. It returns `items`, `totalCount`, `totalLaidLengthM`, `page`, and `limit`.

### Checklist and Work Status

| Use | API |
| --- | --- |
| Processes | `GET /pipe-laying-checklist/processes` |
| Dynamic checklist fields | `GET /pipe-laying-checklist/masters?material={material}&processCode={code}` |
| Create package | `POST /pipe-laying-checklist/packages` |
| List packages | `GET /pipe-laying-checklist/packages` |
| Package progress/unlocks | `GET /pipe-laying-checklist/packages/{packageId}` |
| Submit checklist | `POST /pipe-laying-checklist/submissions` |
| Work Status queue | `GET /pipe-laying-checklist/request-status` |
| Submission detail/history | `GET /pipe-laying-checklist/submissions/{submissionId}` |
| Review action | `PATCH /pipe-laying-checklist/submissions/{submissionId}/workflow-status` |

Process order is `excavation -> pipe_laying -> backfilling`. The next process remains locked until the previous process is approved.

## Backend alignment status

### 1. Scope covered chainage by stage — implemented

Create/update validation now calculates covered intervals using `segmentId + workType`. Excavation no longer blocks pipe-laying or backfilling coverage on the same chainage.

Required rule:

```text
unique coverage key = projectId + segmentId + normalized workType
```

Overlap must be prevented within the same stage, not across all stages. The meaning of a missing `workType` must also be explicit; the mobile app should not send an `all` stage.

### 2. Correct dashboard aggregation — implemented for recorded progress

`/pipe-laying/status` now treats overall `laidLengthM` as `work_type = 'pipe_laying'` and returns `byStage` plus material-wise stage totals. The existing endpoint is sufficient for the mobile dashboard; a second dashboard endpoint is not required.

Approved-progress and request-count aggregation remains a later extension. Its target response shape is:

```json
{
  "recorded": {
    "overall": {},
    "byMaterial": [],
    "byStage": []
  },
  "approved": {
    "overall": {},
    "byMaterial": [],
    "byStage": []
  },
  "requestCounts": {},
  "today": {}
}
```

At minimum, the existing `laidLengthM` must count only `work_type = 'pipe_laying'`. Stage cards must use independent stage totals. Recorded progress and approved checklist progress must never be combined under one number.

### 3. Duplicate-safe mutations — implemented for Daily Work

Daily Work accepts a client-generated `clientMutationId`, uniquely scoped to project and creator. A lost response can therefore be retried without creating another work row. Checklist sync reuses the latest segment package, persists partial work/package IDs in the outbox, and treats an already-created process submission as reconciled.

### 4. Add stable linkage

Package already links to a segment, but Daily Work does not have a stable relation to a package/submission. Add either:

- `workId` on the package/submission, or
- `packageId` and relevant `submissionId` values on the work record.

The relationship must support audit, report drill-down, partial retry, and offline reconciliation.

### 5. Extend report filters — implemented

Daily Report now supports server-side `material`, `workType`, and `contractorId` in addition to the earlier filters. Totals use the complete server-side filter rather than the loaded page.

## Screen design and data alignment

### 1. Pipe Network dashboard

On screen focus:

1. Render the cached snapshot immediately.
2. If online and the cache is stale, fetch `/pipe-laying/status` once.
3. Replace the cache only after a valid response.
4. Show a small “Updated at” or “Offline data” indicator.

Cards:

- overall planned vs pipe-laid length;
- material cards for MS, DI, and HDPE;
- stage cards for excavation, pipe laying, and backfilling;
- pending/verified/approved checklist request counts;
- shortcuts to Add Entry, Work Status, and Daily Report.

Until the backend aggregation correction is complete, do not display the current summed value as true overall completion.

### 2. Piping Data

Use paginated `/segments` for the list and `/segments/filter-options` for server-driven filters. Use `/segments/options` only for a compact form selector.

Cache segment pages by `userId + projectId + query signature`. Search is debounced, the previous request is cancelled on query change, and stale responses are ignored. Refresh only the affected segment after a successful work sync where possible.

### 3. Daily Work entry

Form source of truth:

| Field | Source |
| --- | --- |
| Segment, nodes, material, design diameter, length | `/segments/options` |
| Contractor | `/contractors/manage?type=PIPE_NETWORK_LAYING` |
| Process/stage | `/pipe-laying-checklist/processes` plus allowed work types |
| Existing coverage | `/works?segmentId={id}` after backend stage-scoping fix |
| Checklist fields | `/masters?material=...&processCode=...` |

Save has two explicit states:

- **Save Daily Work**: work record and optional work photos.
- **Submit Checklist**: package plus one process submission and checklist attachments.

If product wants one primary button, it may orchestrate both operations, but the result panel must show `Daily Work: synced/pending/failed` and `Checklist: synced/pending/failed` separately.

Validation remains identical online and offline: project/segment/contractor rules, chainage bounds, positive length, partial-length remark, required checklist fields, and photo requirements. Final overlap and workflow validation remains authoritative on the server.

### 4. Checklist package flow

- Create or find a package using the stable segment/work linkage.
- Fetch package detail to render process status and unlock flags.
- Fetch masters dynamically; never persist hardcoded checklist IDs in UI code.
- Submit exactly one process per submission.
- Cache masters with a backend version/hash so schema changes invalidate old drafts safely.
- Preserve answers and local attachments when a submission fails.

### 5. Pipe Work Status aligned with OMS

Build a dedicated Pipe Work Status view model using the same reusable list, status-pill, bottom-sheet, history, and action components as OMS.

List row:

```text
Start node -> Stop node | Segment label | Process | Material | Status
```

Queue filters/counts come from `/request-status`; detail and history come from `/submissions/{id}`. After an action, invalidate queue, counts, selected detail, package progress, and dashboard status.

Role/action matrix enforced by both UI and backend:

| Actor | Visibility | Actions |
| --- | --- | --- |
| Supervisor | Own submissions | Submit; `modify_request` on eligible own requests; no review approval |
| Assigned Engineer | Project queue | Verify, reject/comment, modification actions allowed by current state; no final approve |
| Assigned Manager | Project queue | Engineer actions plus approve |
| Admin | Project queue | View only |
| Super Admin | Project queue | Same as Admin: view only |
| Developer | Project queue | View only |

An engineer or manager role alone is not enough. The signed-in `userId` must match the frozen assigned engineer/manager ID. Missing reporting-line assignment must show a configuration error; the app must not reveal action buttons.

Workflow actions remain online-only in the first production release. The queue and details may be viewed from cache offline, but verify/approve/reject must be disabled because the server state may have changed.

### 6. Daily Report

- Send search, date, location, label, segment, and supported advanced filters to the server.
- Use `totalCount` for pagination and `totalLaidLengthM` for the filtered total.
- Do not calculate totals from the current page.
- Merge local pending rows into the view without pretending they are server records.
- Mark rows as `Pending sync`, `Sync failed`, or `Synced`.
- When a local row gets a server ID, replace it atomically rather than showing a duplicate.
- Provide a drill-down to linked checklist/package once the linkage contract is added.

## Mobile code structure

Keep the existing application structure and extract the Pipe Network domain cleanly instead of restructuring the entire app.

```text
src/
  services/pipeNetwork/
    pipeNetworkApi.js
    pipeChecklistApi.js
    pipeNetworkRepository.js
    pipeNetworkOfflineStore.js
    pipeNetworkSyncEngine.js
    pipeNetworkMappers.js
  viewmodels/
    usePipeDashboardViewModel.js
    usePipeDataViewModel.js
    usePipeDailyWorkViewModel.js
    usePipeChecklistViewModel.js
    usePipeWorkStatusViewModel.js
    usePipeDailyReportViewModel.js
  screens/
    PipeNetworkDashboard/
    PipeData/
    PipeDailyWork/
    PipeChecklist/
    PipeWorkStatus/
    PipeDailyReport/
  components/Workflow/
    WorkflowStatusPill.js
    WorkflowHistory.js
    WorkflowActionFooter.js
```

Rules:

- API services only perform transport and response validation.
- Repositories decide cache-first/network-first behaviour.
- View models own screen state and user actions.
- Screens remain presentational.
- Mappers convert backend DTOs to stable mobile models.
- One shared workflow capability helper accepts actor, assignees, status, and allowed transitions for OMS and Pipe UI; resource-specific API calls remain separate.

## Offline model

Use SQLite for structured data and an app-owned document directory for photos. A JSON file per draft is insufficient for dependencies, retries, querying, and atomic reconciliation.

Recommended tables:

| Table | Purpose |
| --- | --- |
| `pl_status_snapshots` | Last dashboard snapshot |
| `pl_segments` | Segment/options cache |
| `pl_contractors` | Contractor cache |
| `pl_checklist_masters` | Versioned dynamic checklist schema |
| `pl_packages` | Server and local package identities |
| `pl_submissions` | Draft/pending/server checklist submissions |
| `pl_daily_works` | Draft/pending/server work rows |
| `pl_work_status_cache` | Queue pages, counts, and details |
| `pl_local_files` | Durable local photo metadata and upload state |
| `pl_sync_queue` | Dependency-aware mutation outbox |

Every row must include `ownerUserId`, `projectId`, timestamps, local/server IDs, sync state, and permission/session revision. Never expose cached data belonging to another signed-in user.

Outbox entry fields:

```text
id, entityType, operation, localEntityId, serverEntityId,
payload, idempotencyKey, dependsOn[], attempts, nextAttemptAt,
state, lastErrorCode, lastErrorMessage, ownerUserId, projectId
```

Sync order:

```text
permission/profile refresh
  -> upload required photos
  -> create/reconcile Daily Work
  -> create/reconcile package
  -> submit checklist process
  -> refresh package, report, Work Status, and dashboard caches
```

If backend linkage requires package before work, dependency order can change without changing the screen because the outbox is dependency-driven.

Sync triggers:

- once after authenticated app startup;
- network reconnect;
- app foreground;
- manual Retry/Sync button;
- after a new local mutation when online.

Use one global sync mutex. Coalesce triggers and never start one sync engine per mounted screen. Do not poll permissions or sync continuously in the background. Refresh permissions at session restore, foreground with a sensible stale interval, explicit refresh, and before flushing privileged pending mutations.

Retry policy:

- network/timeout/5xx: exponential backoff with jitter;
- 401: refresh session once, then pause if authentication fails;
- 403: mark blocked by permission change and retain the draft;
- 409: fetch current server state, preserve the local draft, and request user resolution where necessary;
- validation 4xx: permanent failure until the user edits the draft;
- success with lost response: idempotency key reconciles the original server record.

Logout clears tokens and in-memory queries immediately. User-owned cached business data should either be encrypted and retained under that user ID or explicitly cleared according to product policy; it must never be reused under the next account.

## Permission mapping

- Module entry requires `pipe_laying.view` or an authorized Pipe screen grant returned by `/permissions/menu`.
- Dashboard requires `pipe_laying.screen.overview`.
- Piping Data requires `pipe_laying.screen.piping_data`.
- Daily Report requires `pipe_laying.screen.daily_report`.
- Checklist entry requires `pipe_laying.screen.checklist` plus backend mutation permission.
- Work Status requires `pipe_laying.screen.checklist_requests`.
- Create/update/delete controls also require their corresponding granular mutation grants.

Role names are not a substitute for permission keys. Super Admin receives the same Pipe Work Status visibility as Admin, but remains view-only for assigned review actions according to the current backend contract.

## Delivery phases

### Phase 0 - Backend correctness

- Scope coverage by stage.
- Fix `/status` aggregation and add stage/approved/request metrics.
- Add idempotency keys.
- Add work/package/submission linkage.
- Add missing report filters if required by product.

### Phase 1 - Read-only online/cache foundation

- Real dashboard status.
- Piping Data list and server filters.
- Correct server-driven Daily Report.
- SQLite read caches and explicit offline indicators.

### Phase 2 - Daily Work online and offline

- Dynamic segment/contractor loading.
- Create/update/delete work.
- Durable photos and outbox.
- Pending rows in Daily Report and deterministic reconciliation.

### Phase 3 - Checklist

- Dynamic masters.
- Package create/list/detail.
- Process gates and submission.
- Offline drafts and queued submission with dependencies.

### Phase 4 - OMS-aligned Pipe Work Status

- Queue, counts, filters, detail, history.
- Assignee-aware actions.
- Cached offline read; online-only workflow mutations.

### Phase 5 - Completion and hardening

- Approved vs recorded dashboard metrics.
- Map refresh and deep links.
- Notifications.
- Conflict UX, performance, migration, and role/offline test matrix.

## Acceptance criteria

- No hardcoded pipe, contractor, checklist, or dashboard production data remains.
- Dashboard never sums three stages as one laid length.
- The same chainage can progress independently through excavation, pipe laying, and backfilling.
- Daily Work and checklist outcomes are independently visible and retryable.
- Daily Report filters and totals represent the complete server result, not one loaded page.
- Work Status matches the Pipe backend role, assignee, and transition rules.
- Admin and Super Admin can view the project queue but cannot perform assigned reviewer actions.
- Offline-created data and photos survive app restart and network loss.
- Reconnect does not create duplicate work, packages, or submissions.
- A role/permission change is reflected on foreground or before sync without requiring relogin.
- A 403 after a role change retains the local draft and clearly explains why sync is blocked.
- Only one sync flush runs at a time, regardless of screen mounting.
- Automated tests cover mapping, validation, outbox ordering, retry classification, identity isolation, pagination, permission changes, and workflow capabilities.
