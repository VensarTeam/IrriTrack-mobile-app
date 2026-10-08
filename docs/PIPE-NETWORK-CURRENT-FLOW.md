# Pipe Network checklist: current API, role, and offline flow

This is the current mobile-side reference for Pipe Network checklist behavior. For a non-technical overview, start with `PIPE-NETWORK-SIMPLE-GUIDE.md`. It supersedes the “target/current state” claims in `pipe-network-api-flow.md`; that file is retained as an integration-history/planning note. Backend routes and workflow rules are documented in the API repository at `docs/PIPE-LAYING-CHECKLIST-API.md` and `docs/PIPE-LAYING-WORK-STATUS.md`.

## Data path

The app uses dedicated Pipe Network resources; it does not submit these checklists to OMS APIs.

| Purpose | API |
| --- | --- |
| Segment selector | `GET /v1/pipe-laying/segments/options?projectId=...&material=...` |
| Contractor selector | `GET /v1/contractors?type=PIPE_NETWORK_LAYING` |
| Checklist process/master | `GET /v1/pipe-laying-checklist/processes`, `GET /v1/pipe-laying-checklist/masters?material=...&processCode=...` |
| Daily work record | `POST /v1/pipe-laying/works` |
| Package create/list | `POST /v1/pipe-laying-checklist/packages`, `GET /v1/pipe-laying-checklist/packages` |
| Checklist submit | `POST /v1/pipe-laying-checklist/submissions` |
| Work Status | `GET /v1/pipe-laying-checklist/request-status` |
| Submission detail/history | `GET /v1/pipe-laying-checklist/submissions/:submissionId` |
| Review/modify action | `PATCH /v1/pipe-laying-checklist/submissions/:submissionId/workflow-status` |
| Rejected correction resubmit | `PATCH /v1/pipe-laying-checklist/submissions/:submissionId/resubmit` |

Create-entry data is hydrated from the per-user/project SQLite cache where available. The root `OfflineChecklistSyncGate` refreshes profile/permissions and, after a usable connection is detected, flushes pending OMS and Pipe queues. It also retries pending Pipe entries while the app remains active, and on foreground activation. The entry header provides a Pipe-only manual sync affordance. Profile separates **Master Data** from **Pending Work**; Pending Work attempts all currently registered offline mutation queues (OMS checklists and Pipe Network work/checklists) for the signed-in user. When a new module adds an offline queue, it must be registered in both the root gate and Profile Pending Work action. Syncing is app-background work after interactions; it is not guaranteed to run after the operating system terminates the app.

Each queued Pipe mutation is scoped to the owner user and project, carries its files in app storage, and is deleted with those files only after success or an explicitly reconciled duplicate. Failures remain queued with retry metadata. It is a client outbox—not a server “sync” endpoint. Online validation and server workflow state remain authoritative.

## Who submits and who reviews

The submitter is a `supervisor`. At first submission the backend requires the supervisor’s `pipe_laying` reporting line and stores the assigned engineer and manager IDs on the submission. Those IDs are the reviewer route for the submission; later reporting-line changes should not silently reroute an already-assigned submission.

The reporting line is managed through `GET /v1/users/:userId/reporting` and `PUT /v1/users/:userId/reporting` (reporting-management authorization required). Each line must identify the project, module `pipe_laying`, engineer, and manager. The backend validates the selected users’ roles; a missing line blocks checklist submission with `400`.

| Actor | Work Status visibility | Checklist actions |
| --- | --- | --- |
| Supervisor | Own submissions | Submit; request modification on own `verified`/`approved` item; edit/resubmit after `modify_approved` or `rejected` |
| Assigned Engineer | Project-scoped queue | Verify, reject/comment, Need Modification; can review a pending modify request |
| Assigned Manager | Project-scoped queue | Same review actions; only assigned manager can approve a `verified` submission |
| Admin / Super Admin / Developer | Project-scoped queue | View only |

The backend also permits a manager to verify/reject/handle modification if they are assigned. Therefore the actual rule is “assigned engineer or manager may perform non-approval review actions; only assigned manager may approve,” not a strict engineer-must-verify-then-manager-only sequence. The normal path is supervisor submit → engineer verify → assigned manager approve.

## Status and actions

`submitted → verified → approved` is the normal path. `reject` sets `rejected` and requires a remark. `modify_approved` is the reviewer’s “Need modification” action from submitted/verified, or approval of a supervisor’s `modify_request`; the supervisor may edit and submit again. `modify_request` is requested by the submitting supervisor from verified/approved. `modify_rejected` rejects that request and returns the workflow to approved. Review actions require network connectivity. Cached Work Status detail is viewable offline, and a supervisor can edit and queue a resubmission offline when its detail and checklist masters are already cached.

The intended process order is excavation → pipe laying → backfilling. The backend's `assertProcessGate` is currently a temporary no-op for Work Status testing, so prior-stage approval is **not enforced at submission time** until that gate is restored.

## Permissions: two layers, do not conflate them

`GET /v1/auth/me` supplies the user identity/role and `GET /v1/permissions/menu` supplies the role-bound feature/effective-permission snapshot used by the app to show screens and controls. In Project Details, Supervisor sees Add Entry and Work Status but not Daily Reports; Developer sees all three. Other roles never see Add Entry, while their Daily Reports and Work Status buttons follow their screen permissions. The Add Entry button is therefore role-gated in this view even if another role has a `pipe_laying.create` permission key.

The checklist controller uses bearer authentication, project access checks, role allow-lists, reporting-line assignment, and assignee checks. It does not currently decorate each checklist route with a per-permission-key server guard. Consequently, a UI permission toggle is not equivalent to endpoint-level authorization; do not describe it as such. Keep the server-side role/project/assignment checks as the security boundary and treat per-screen permission enforcement on these routes as a known backend hardening gap.

## Rejected and modification resubmission

For a `rejected` submission, Work Status opens the existing checklist for the submitting supervisor. The screen keeps the old checklist photos attached, allows answers to be corrected, and requires one **new correction photo**. It uses the same compression and date/time watermark as entry photos, copies the image into durable app storage, and queues the payload with a stable `clientMutationId`. The queue calls multipart `PATCH .../resubmit` with `payload` and exactly one `resubmitFiles` image. The backend records that ID in workflow history, so a retry after a lost response returns the already applied submission rather than creating another resubmission. The local queue and image are removed after a confirmed response. Work Status labels the request as pending sync while the queued mutation exists and prevents a second resubmission of the same request.

After `modify_approved`, editing uses the ordinary `POST .../submissions` path; a correction photo is not required. Review actions such as Verify and Approve still require a live connection, while a supervisor can fill and save a resubmission offline if the checklist detail and masters were cached on the device.

Older app versions could have queued a rejected `resubmit_pipe_entry` without a correction image. Those legacy items are retained with an actionable error; they cannot be submitted under the backend contract until the supervisor opens the rejected request and saves it with a new photo.

The backend normal submit path currently creates Daily Work, package, and checklist submission as separate requests. The outbox persists IDs after each completed step so partial retries can resume; the backend does not provide one atomic endpoint spanning all three resources. Validate duplicate reconciliation against package/process uniqueness before assuming a retry is harmless.

## Profile sync

Profile has two distinct controls: **Master Data** refreshes reference data only; **Pending Work** retries the signed-in user’s queued OMS checklist and Pipe Network mutations and reports combined synced/remaining counts. Automatic reconnect/foreground sync remains enabled independently of Profile. This shared action is extensible, but each future module queue must be explicitly wired into it; it is not a generic scan of every SQLite database.

## Verification checklist

1. As a supervisor with a configured `pipe_laying` reporting line, submit online and confirm assigned engineer/manager IDs are returned and visible in Work Status.
2. Confirm assigned engineer can verify, but cannot approve; confirm only the assigned manager can approve.
3. Confirm an unassigned engineer/manager and admin/super-admin/developer cannot perform workflow mutations, even if calling the API directly.
4. Go offline, save a checklist with photos, reconnect, and confirm one server submission; verify the local queue/files are removed only after success.
5. Confirm background retries preserve a failed submission and later retry it; Profile’s shared Pending Work action can force a retry across module queues.
6. Reject a submission, open Work Status offline, correct it with one new photo, save, reconnect, and confirm the same submission returns to `submitted`, one new `resubmitImages[]` item appears, and the queue/photo clear.
7. Retry the same saved mutation after a simulated lost server response; the backend must return the existing result using `clientMutationId` without adding another resubmit image or history event.
