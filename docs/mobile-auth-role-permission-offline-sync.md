# Mobile Auth, Role Permission, and Offline Sync

This document describes the mobile contract aligned with the API branch
`role-permission-api`.

## Source of truth

- `GET /auth/me` is the source of truth for the current user and role.
- `GET /permissions/menu` is the source of truth for feature flags, effective
  permissions, service/project scope, and the allowed OMS tree.
- `GET /oms/request-status` provides the frozen/fallback reviewer assignment on
  every submission through `assignedEngineerId` and `assignedManagerId`.
- The backend remains authoritative for every mutation. UI checks prevent
  invalid actions, but they do not replace API authorization.

The persisted SecureStore session contains tokens, the normalized user, and a
compact role-bound authorization snapshot (feature flags, effective permissions,
and allowed service/project ids). Large OMS/checklist trees stay in their
dedicated offline stores instead of SecureStore. The snapshot is usable offline
only when its user and role still match the current cached user.

## Role refresh and token rotation

The app synchronizes the profile and permissions:

- after restoring an authenticated session while the app is active;
- whenever the app returns to the foreground;
- when Work Status receives focus;
- before reconnect/master/queue synchronization; and
- every five minutes while the app is active.

Concurrent triggers share one in-flight promise. If `/auth/me` returns a role
different from the cached role, the app immediately calls the refresh-token API
before requesting `/permissions/menu`. This is required because OMS workflow
authorization reads the role in the access token. The user does not need to log
out and log in after a web-side role change.

Background reconnect events reuse a successful profile/permission result for
five minutes and failed checks have a 30-second retry backoff. Work Status uses
a 30-second freshness window, while foreground activation and manual profile
refresh can force one check. Permission timestamps are not sync-gate dependency
keys, so saving an unchanged permission response cannot create a request loop.
Repeated NetInfo callbacks while already online are ignored; synchronization
runs only for the initial resolved state or an offline-to-online transition.

On a transient network failure, the last matching authorization snapshot is
kept. After a role change, permissions belonging to the old role are discarded
if the new menu cannot be downloaded. Unknown roles are fail-closed. A final
401 clears the local session.

Reviewer mutation buttons remain disabled until a role-matching permission
snapshot has synchronized. Queue and detail viewing can still use cached data.

## Developer mobile Role Manager

The Profile screen shows **Role & Permissions** only when the normalized current
role is `developer`. The destination screen repeats the Developer check, and all
read/write APIs remain server-authorized; navigating directly to the route does
not bypass access control.

The mobile manager uses:

- `GET /developer/configuration/users` for searchable users.
- `GET /roles` for role options.
- `GET /developer/configuration/users/{userId}/permissions` for effective access.
- `PATCH /developer/configuration/users/{userId}/role` for the dedicated,
  Developer-only role change.
- `PATCH /developer/configuration/users/{userId}/permissions` for audited
  permission overrides.

Developer accounts and the signed-in Developer's own account are locked in the
mobile UI and backend role endpoint. Role and permission writes are online-only;
they are never placed in an offline mutation queue. The affected user's app picks
up the new role and permissions through the normal foreground/profile refresh,
without requiring logout and login.

## OMS Work Status matrix

| Role | Queue visibility | Workflow actions |
| --- | --- | --- |
| Supervisor | Own submissions | No reviewer footer; can handle its field/modify flow |
| Assigned Engineer | Project queue | Verify, Need Modification, Comment, Modify Reject |
| Assigned Manager | Project queue | Engineer actions plus Approve |
| Admin | Project queue | View only |
| Super Admin | Same mobile visibility as Admin | View only |
| Developer / HO / audit view | Allowed queue | View only |

When assignment fields exist, reviewer buttons require the signed-in user id to
match the assigned engineer or manager. When both fields are absent, the legacy
fallback allows engineer/manager roles. Approve is manager-only and, when routed,
requires the assigned manager.

Status/action mapping:

| Status | Available actions |
| --- | --- |
| `submitted` | Verify, Need Modification (`modify_approved`), Comment (`reject`) |
| `verified` | Need Modification, Comment, and Approve for the assigned manager |
| `modify_request` | Need Modification (`modify_approved`) or Reject (`modify_rejected`) |
| `approved`, `rejected`, `modify_approved`, partial | No reviewer actions |

A direct `modify_approved` action requires a remark when the item is not already
in `modify_request`. `reject` and `modify_rejected` require remarks.

## Offline and reconnect behavior

`OfflineChecklistSyncGate` is mounted once at the app root. It has separate
locks for master-data sync and queued checklist sync, so reconnect events cannot
start duplicate work.

Reconnect order is:

1. Refresh profile, rotate tokens if the role changed, and refresh permissions.
2. Refresh OMS master data once per authenticated user session.
3. Count and flush that user's queued checklist submissions.

Only a current `supervisor` can flush the checklist submission queue. If a role
was revoked while offline, queued data stays stored locally and is not silently
submitted with stale access. If the role becomes eligible again, the next
reconnect retries it. API failures remain recorded in the existing queue rather
than deleting the draft or its photos.

## Implementation ownership

- `src/context/AuthContext.js`: session restore, token refresh, profile and
  permission synchronization.
- `src/services/authPermissions.js`: normalized, role-bound offline snapshot.
- `src/services/roleAccess.js`: role normalization, fail-closed defaults, and
  OMS assignee-aware capabilities.
- `src/components/OfflineChecklistSyncGate.js`: reconnect orchestration and
  duplicate-work locks.
- `src/viewmodels/useWorkStatusViewModel.js`: preserves API assignment fields
  and exposes capabilities for the selected submission.
- `src/screens/WorkStatus/index.js`: status-specific buttons and remark rules.

## Regression checklist

1. Login as supervisor, go offline, create a checklist draft, reconnect, and
   confirm one submission is sent.
2. Change supervisor to engineer on web. Foreground/focus the app and confirm
   the role changes without relogin and queued supervisor drafts do not flush.
3. Confirm an engineer sees actions only on rows assigned to that engineer.
4. Confirm a manager can review assigned engineer/manager rows but can approve
   only rows assigned to that manager.
5. Confirm admin and super-admin see the same Work Status data and no mutation
   buttons.
6. Confirm direct Need Modification requires a remark and sends
   `modify_approved`, not `modify_request`.
7. Confirm one `OfflineChecklistSyncGate` exists in the rendered app tree.
8. Confirm only Developer sees Role & Permissions in Profile.
9. Change another user's role/permission, foreground that user's app, and confirm
   the access change is applied without relogin.
