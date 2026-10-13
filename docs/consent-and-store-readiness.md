# IrriTrack consent and store readiness

Reviewed on 12 October 2026 against the mobile app, checked-in native projects, public IrriTrack notices, and the backend storage/authentication implementation. This is a code and policy comparison, not confirmation of acceptance by either store.

## Welcome and consent

The welcome view uses the website's “Smart Irrigation. Better Tomorrow.” branding and the app's navy/green palette. Both onboarding views use SVG icons rather than platform icon fonts.

Welcome → Privacy & Trust → manually tick “I have read the Privacy Policy and agree to the Terms & Conditions” → Agree & continue. The checkbox is available immediately. Opening or scrolling the documents is not required to enable it. Continue is disabled until the user ticks the checkbox; nothing is preselected or accepted automatically. Privacy Policy, Terms and Support are available in the in-app WebView before and after consent.

The WebView handles loading, network/HTTP failures and terminated processes with a retry state. Document content scrolls independently of the native header. Document loading or failure does not change the checkbox state. There is no scroll tracking or claimed proof that the policy was read.

Consent version 2 records the policy/terms URLs, acceptance time and terms acceptance in device-only SecureStore. Version 1 acceptance does not satisfy the new notice. This is a device-local acknowledgement, not a server-side consent audit log or evidence of reading. If the notice materially changes, increment `CONSENT_NOTICE_VERSION` and change the storage key in `consentStorage.js` together. Consent can be acknowledged offline; connectivity is needed to open the live policy, terms and support pages.

The root gate mounts authentication, foreground notification bootstrap and offline submission sync only after consent is saved. Consent does not grant OS permissions. Login and Profile expose Privacy Policy, Terms & Conditions and Support after onboarding as well.

Profile also exposes **Request account deletion** to every signed-in role. It opens the company contact page in the in-app WebView with account/personal-data deletion instructions and an **Email request** action addressed to `it@vensar.com`. That action opens an editable email draft; the user must supply their account identifier and send it. No account identifiers are automatically inserted, no email is sent by the app, and opening the contact page is not recorded as a submitted deletion request. Support must process requests received through this route. The action does not log out, delete local pending work, or invoke an unimplemented backend deletion API.

Public links, verified by direct HTTP requests on the review date:

- [Privacy Policy](https://irritrack.vensar.com/privacy-policy) — HTTP 200; dated 12 October 2026.
- [Terms & Conditions](https://irritrack.vensar.com/terms-and-conditions) — HTTP 200; dated 12 October 2026.
- [Support](https://www.vensar.com/contact.html).

## Permission and disclosure comparison

| Access | Actual app use | Current treatment |
| --- | --- | --- |
| Camera | Server-side face sign-in verification and site photos | Native camera purpose string identifies both. Face sheet explains photo/template storage before “Agree & scan my face”. Camera permission is requested when capture starts. |
| Selected photos | Checklist/gallery uploads | System image picker; no broad library-read prompt on Android or iOS. Android broad image/video/audio/library-read permissions are explicitly removed from the merged manifest. |
| Save photos | OMS checklist copies after submission | iOS add-only permission and accurate purpose string. Android 13+ saves app-created images without a library-read prompt. Android 12L and earlier retain write-only permission capped at API 32 because the installed SDK 54 MediaLibrary implementation checks it. No broad read permission is requested. |
| Foreground location | Site/node coordinates and photo location details | When-in-use purpose string; no background-location request found in mobile source. |
| Notifications | Work alerts through Firebase Cloud Messaging/Notifee | Existing runtime permission prompt and skip option. Device/token usage is disclosed in the policy. |
| Device biometrics | Unlock an existing saved session | iOS Face ID purpose string. Device authentication is distinct from the server's facial-verification template. |
| Microphone / embedded photo GPS | No corresponding photo-only workflow found | Microphone and `ACCESS_MEDIA_LOCATION` removed; site coordinates come from foreground Location instead. |
| Android overlay | Developer tooling | `SYSTEM_ALERT_WINDOW` remains in debug manifests and is removed for release. |
| Exact alarms / Do Not Disturb | No corresponding app workflow found | Transitive Notifee exact-alarm and notification-policy permissions removed; immediate work alerts remain supported. |

The new policy covers account data, photos, coordinates, facial verification, offline storage, technical/device records and Firebase. These categories broadly match the reviewed app. OS permission declarations alone do not complete either store's privacy disclosures.

## Concrete release issues still requiring attention

1. **Sensitive image access remains a backend issue.** `B3StorageService.uploadBuffer` uses `ACL: 'public-read'`; `uploadFaceProfileImage` uses this same upload method. The published policy acknowledges access through direct image URLs. Disclosure does not provide access protection. The backend/storage owner should protect face/profile images and other sensitive uploads using authorization and expiring access before release. This mobile change does not alter storage ACLs.
2. **Android release currently uses the debug signing configuration.** `android/app/build.gradle` sets `release.signingConfig = signingConfigs.debug`. Configure the actual upload signing key/Play App Signing for the store bundle. No new key has been generated or substituted in this task.
3. **Store declarations need to match real processing.** Complete Play Data safety and App Store App Privacy for linked name/contact/user/device identifiers, precise location, uploaded photos, facial-verification data and other work content, including SDK processing. The existing iOS privacy manifest lists these collection categories, but the final archive's aggregated privacy report and actual console answers still need verification.
4. **Reviewer login must work.** Sign-in uses a company account followed by server face verification. Supply a working reviewer account and an approved, fully usable review access method; a password alone may not let a reviewer through the face check. Explain account provisioning and face verification in review notes. No authentication bypass was introduced.
5. **Deletion/withdrawal must work operationally.** Profile now provides the contact/email request route described above. The reviewed mobile navigation has no public self-sign-up screen, although the backend has a registration endpoint as well as administrator-managed user creation. If account creation is offered in the app or through an in-app-linked flow, both stores' account-deletion requirements must be implemented, not replaced by logout. Confirm that the privacy team can process the requests described by the policy, including eligible face images/templates and stored photos. The generic company contact page is not, by itself, verified as a prominently labelled public IrriTrack deletion resource for the Play Console URL field; when required, use a suitable deletion page or a prominent, functional deletion section of the IrriTrack policy.

Sources: [Apple App Review Guidelines, 5.1](https://developer.apple.com/app-store/review/guidelines/#privacy), [Google Play User Data policy](https://support.google.com/googleplay/android-developer/answer/10144311), [Google Play Photo & Video permission requirements](https://support.google.com/googleplay/android-developer/answer/15800983), [Google Play account deletion](https://support.google.com/googleplay/android-developer/answer/13327111), [Expo SDK 54 ImagePicker](https://docs.expo.dev/versions/v54.0.0/sdk/imagepicker/), [Expo SDK 54 MediaLibrary](https://docs.expo.dev/versions/v54.0.0/sdk/media-library/).

## Verification and build notes

Verified in this task: consent storage checks passed, Android/iOS JavaScript exports passed, Android release manifest merge passed with broad media/microphone/overlay/exact-alarm/DND permissions absent, and an unsigned iOS device Release build completed successfully. iOS simulator visual testing was blocked by ML Kit's inherited `arm64` simulator exclusion; no dependency-source patch was applied. These checks do not include signed store archives, store-console declarations or physical-device photo/permission testing.

Run `node scripts/check-consent.cjs` for direct acknowledgement without a read event, notice-version/URL validation, and failed storage writes. The app's native directories are checked in; config edits alone do not update an already-installed binary. WebView and native permission changes require fresh Android and iOS builds. `pod install` links the added iOS WebView module.

Before submission, use the actual release binaries to verify the merged Android permissions and iOS purpose strings; on physical devices verify direct checkbox selection, disabled Continue before acknowledgement, failed page/retry, relaunch offline after acceptance, selected-photo upload, add-only gallery saves, and camera denial. These are the relevant acceptance checks for this change, not a claim that a store has reviewed the app.
