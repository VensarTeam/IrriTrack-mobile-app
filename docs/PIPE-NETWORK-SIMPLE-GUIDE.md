# Pipe Network module — simple working guide

This guide describes the **current app behaviour** in simple terms. It covers Project Details, Add Entry, Daily Reports, Work Status, online/offline saving, and who can do what. For API-level details, see [PIPE-NETWORK-CURRENT-FLOW.md](./PIPE-NETWORK-CURRENT-FLOW.md).

## One-minute picture

```text
Project Details → choose MS / DI / HDPE → Add Entry
       → choose Excavation / Pipe Laying / Backfilling
       → select pipe + contractor → fill checklist + photos → Save
       → saved on phone → synced to server → Work Status review
       → Verified → Approved
```

**Save** and **server submission** are different. Save first puts the completed entry in the phone's pending-work queue, even when internet is available. Sync then sends it to the server. Until sync succeeds, the work is **pending on this device**, not a confirmed server submission.

## What each screen does

| Screen | Simple purpose |
| --- | --- |
| **Project Details** | Shows overall pipe length, material-wise MS/DI/HDPE figures, and separate Excavation, Pipe Laying, and Backfilling progress. This comes from saved **Daily Work** records and pipe segments, not from checklist approval status. Recently loaded dashboard data can be shown from device cache. |
| **Add Entry** | Choose material, stage, start–end pipe segment, contractor, work details, and stage checklist. Required answers and photos must be completed before Save. Photos are compressed and marked with date/time before being kept for upload. |
| **Daily Reports** | Shows the Daily Work records with search/filters and more records as the list is scrolled. Previously loaded report data can be shown from cache; fresh results need internet. |
| **Work Status** | Shows checklist submissions, their status, answers/photos, and review actions. Previously opened details can be viewed offline if cached. |
| **Profile → Master Data** | Refreshes reference data; it does **not** submit pending work. |
| **Profile → Pending Work** | Manually retries the signed-in user's pending OMS and Pipe Network work. Add Entry also has a Pipe-only sync icon. |

The web and mobile Pipe Network legend uses the same accents: **MS red** `#DD524C`, **DI green** `#5AC561`, **HDPE blue** `#2A4DD0`; **Excavation orange** `#E87B35`, **Pipe Laying yellow** `#F3CE49`, and **Backfilling green** `#5EC269`. Mobile uses darker text on the pale colour surfaces for readability. Add Entry's stage-selection tabs keep one consistent selected-button colour; the stage colour appears in progress and checklist indicators.

| Task | Online | Offline |
| --- | --- | --- |
| View Project Details / Daily Reports | Fetches fresh server data | Shows previously cached data where available |
| Fill a new checklist or correction | Saves locally, then attempts sync | Saves locally; waits for reconnect (cached options/details required) |
| Review/approve someone else's checklist | Available to the assigned reviewer | Not available; no offline approval queue |
| Upload pending work | Automatic or manual | Waits safely on the phone |

## Online and offline Add Entry

1. The app loads pipe options, contractors, and the selected checklist from the server and keeps a device cache. Cached choices can appear first while fresh data loads.
2. A supervisor fills the entry and taps **Save**. The app keeps the entry and its photo files in local storage, then attempts upload without blocking the form UI.
3. For a new entry, sync sends **Daily Work → checklist package → checklist submission**. Successful step IDs are retained so a later retry can continue. These are separate requests, not one all-or-nothing server operation.
4. On success, the pending item and its local upload copies are removed. On network/server failure, the item stays pending and can retry.

Offline use needs preparation: this device must have loaded the relevant project, pipe/contractor options, and checklist masters while online at least once. If a required list was never cached, reconnect to load it before completing that entry. A locally saved entry will not appear as a server-reviewed request until it has synced.

Sync is attempted after reconnect, when the app becomes active, periodically while the app is open, or from a manual sync button. “Background” here means it does not block the visible form; it does **not** mean the phone can upload after the operating system has fully closed the app. Sync also requires the same signed-in owner account and a usable connection.

## Who does what

Before the first checklist submission, the supervisor needs a project-specific **Pipe Laying reporting line** with an assigned engineer and manager. A user with reporting-management permission configures that line. The server records those reviewers on the submission. Without that assignment, submission is rejected by the server and the saved item remains pending for retry after setup is fixed.

| Role | What they can do in Work Status |
| --- | --- |
| **Supervisor** | Submit their own checklist; see their own requests; request modification of their verified/approved work; edit and resubmit their own rejected or modification-approved request. |
| **Assigned engineer** | Verify, ask for modification, or reject/comment on the assigned request. Can decide a pending modification request. Cannot give final approval. |
| **Assigned manager** | Can do those review actions on their assigned request and is the **only** role that can give final approval after verification. |
| **Unassigned engineer/manager** | Can see project-scoped requests but cannot act on a request not assigned to them. |
| **Admin / Super Admin / Developer** | Can view project-scoped Work Status; no checklist review/approval action. |

On Pipe Network Project Details, **Supervisor** sees Add Entry and Work Status but not Daily Reports. **Developer** sees all three buttons. Other roles never see Add Entry; their Daily Reports and Work Status buttons follow their screen permissions. **The server makes the final decision** using role, project access, submission owner, and assigned reviewer. Seeing a button does not by itself grant permission to submit or approve: Developer can see Add Entry, but the server still accepts checklist submission only from a supervisor.

## Checklist review and correction

Normal path: **Submitted → Verified → Approved**. An assigned manager is allowed to verify as well, though the usual team flow is engineer verifies and manager approves.

- **Rejected / Commented:** the reviewer must give a reason. The supervisor opens that request, corrects the checklist, and adds **one new correction photo**. Old checklist photos remain attached. The resubmission returns the same request to **Submitted** after sync.
- **Need modification:** the reviewer allows an edit; the supervisor changes the checklist and resubmits. This path does not require the extra rejection-correction photo.
- **Supervisor modification request:** for verified/approved work, the supervisor can request permission to edit. The assigned reviewer allows or rejects that request.

A supervisor can fill and save a correction **offline** when that request's details and checklist masters were previously cached. Work Status marks a queued resubmission as waiting for sync and prevents saving another copy. Reviewer actions—Verify, Approve, Reject, Need Modification—require internet and are **not** queued offline.

## Important current boundaries

- The stage tabs show Excavation, Pipe Laying, and Backfilling. The backend's strict “previous stage must be approved first” submission gate is **temporarily disabled** at present; do not treat the UI stage order as an enforced approval rule.
- Work Status list/detail and Daily Reports can only show what was previously cached while offline. A request never opened online may not have its full detail available offline.
- Failed uploads stay pending; a local “saved” message is not proof that the server received them. Check **Profile → Pending Work** or Work Status after reconnect.
- This document describes implemented behaviour, not a claim that every device/network combination has passed field testing.
