# IrriTrack Privacy Policy — Draft

> **Not ready to publish.** This IrriTrack-specific draft uses the company and grievance-contact details currently listed on [Vensar's privacy page](https://www.vensar.com/privacypolicy.html), together with the mobile app and backend as reviewed on 9 October 2026. Confirm the remaining `[placeholders]`, retention and deletion process, and image-access issue before publishing. The current website's mobile-app section describes an attendance app; this text should be an IrriTrack section, not an unreviewed replacement for that other product's policy.

**Effective date:** [Day Month Year]  
**Operator:** Vensar Constructions Company Limited [verify exact registered spelling]  
**Grievance Officer:** Ravi Kumar Gubbala [confirm current appointment]  
**Privacy contact:** it@vensar.com · +91 97017 87444 [confirm current contact details]  
**Postal address:** 8-2-12/76/1/B, 3rd Floor, Ashoka Hitech Chambers, Road No. 2, Banjara Hills, Hyderabad 500034, India [confirm current address]

IrriTrack is a field-work application for authorized employees, contractors, and other personnel working on irrigation projects. This policy explains how Vensar handles information when you use the IrriTrack Android or iOS app, including when you work offline and sync later. It supplements, rather than changes, any applicable employment or contractor policies.

## Information we handle

- **Account and work identity:** your name, mobile number, email address if provided, role, assigned projects, reporting relationships, and permissions. We use these to sign you in and show the work you are authorized to access.
- **Sign-in and security information:** password hashes, one-time verification codes, session information, login and audit events, and a face image and derived face template used for mobile face verification. On first successful face verification, the backend saves a face-profile image and a face template for later sign-ins. Subsequent verification images are processed to compare with the saved template. This is separate from optional device-level Face ID or biometrics used to unlock an existing app session: the device's biometric credential is handled by its operating system and is not the server-side face template. Audit records may include your account identity, IP address, device or browser information, action, time, and result.
- **Project and field-work information:** projects, sites, units or pipe segments, selected contractors, checklists and answers, measurements, remarks, submissions, approvals, rejections, and related timestamps. These records may identify who created, reviewed, or changed an entry.
- **Photos and location:** photos you capture or select for checklists, their capture time, and location coordinates when a workflow uses location. Some checklist photos display the time and coordinates as a visible watermark. Location may also be used to update a project or node position or open directions in a map app.
- **Device and notification information:** a push-notification token, platform, and device identifier used to deliver work and approval notifications. The app and backend may also receive technical request information needed to operate and secure the service.

## Why we use this information

We use information to authenticate users, verify identity, assign access, record and review field work, show project progress, support offline work and synchronization, send relevant notifications, troubleshoot failures, protect the service, and maintain an audit trail. IrriTrack's location and checklist-photo workflows document site work; they are not described here as attendance, payroll, or leave-management features. [Confirm and add any other actual business purposes before publication.]

## Permissions and your choices

The app requests camera access for face verification and work photos; photo-library access when you choose an existing image or save one to your device; location access for location-based field records; and notification permission for work alerts. If you enable device biometrics, the operating system may ask for Face ID or a comparable device-unlock method. You can change permissions in your device settings. Some features will not work without the permission they require. Granting a permission does not by itself submit a checklist; submission occurs through the relevant app workflow. [Confirm whether QR/barcode scanning is enabled in the production IrriTrack build before listing it as a camera purpose.]

## Offline data and synchronization

IrriTrack stores certain project references, drafts, checklist answers, photos, pending submissions, and work-status information on your device so you can continue working without a connection. Pending records may remain on the device and be sent to the backend when connectivity returns or when you start a manual sync. A failed or rejected sync may require your attention. [Confirm the exact local-data deletion behavior on sign-out, account removal, and app uninstall before publication.]

## Who receives information

Authorized users in your organization, such as supervisors, engineers, managers, and administrators, may see records according to their roles and project access. We do not sell or rent personal data. We use service providers to run the backend, database, and object storage; Firebase Cloud Messaging to deliver push notifications; and a configured email provider to send verification emails. Information may also be disclosed when required by law. Opening directions may pass a destination coordinate to Google Maps or another map app you choose. [Identify the actual legal entities, hosting locations, and any additional processors before publication.]

Uploaded checklist and face-profile images are currently stored in object storage and delivered through direct file URLs. **The current storage configuration marks uploaded files `public-read`; someone who obtains a file URL may be able to view that file without signing in.**

## Security

The app stores authentication session data using the device's secure-storage facility. The backend uses account authentication and role-based permissions for its APIs. The production remote API is configured to use HTTPS. No system is completely secure, and direct file URLs described above are a current access limitation. [Confirm hosting, backup, encryption-at-rest, access-review, and incident-response practices before making further security claims.]

## Retention and deletion

We retain account, project, checklist, image, notification, and audit information for [specific periods or objective criteria for each category]. Offline pending data may remain on a device until it is synchronized or otherwise removed. To request access to, correction of, or deletion of information associated with your account, contact it@vensar.com. We will handle the request according to [verified company process and applicable obligations]. [Confirm whether accounts are created in the app or only by administrators, the deletion-request route, backup deletion schedule, and any records that must be retained. The current attendance-app policy's three-month post-employment period and unresolved location-retention placeholder cannot be assumed to apply to IrriTrack.]

## Children

IrriTrack is intended for authorized project personnel, not children. [Confirm the minimum age or eligibility rule used by your organization.]

## Changes to this policy

We may update this policy when the app or our data practices change. The current version and effective date will be available at [final public IrriTrack privacy-policy URL]. For material changes, [describe how users will be notified].

## Contact

For privacy questions or requests, contact it@vensar.com or write to Vensar Constructions Company Limited at 8-2-12/76/1/B, 3rd Floor, Ashoka Hitech Chambers, Road No. 2, Banjara Hills, Hyderabad 500034, India. You may also call +91 97017 87444. [Confirm these details before publication.]

---

## Internal release checks — remove this section from the published policy

1. Confirm the Operator's exact registered name (the existing site uses both “Construction” and “Constructions”), grievance officer, contact details, effective date, and final public IrriTrack URL.
2. Fix or explicitly approve the backend's `public-read` object-storage setting for **both face-profile images and checklist photos**. Re-review image URLs after the change; do not claim photos are private while this setting remains.
3. Set real retention periods and implement/verify deletion across PostgreSQL records, object storage, backups, and offline device data. There is no verified account-deletion flow in the reviewed IrriTrack code. Do not copy the attendance-app policy's face-deletion screen or three-month retention claim into this policy unless those functions and periods truly apply.
4. Confirm the production storage provider, SMTP provider, database host, regions, and any other processors. Check their contracts and actual data locations.
5. Validate the policy against the final Android Data safety form and Apple App Privacy answers, including third-party SDK behavior; add a link inside the app and a publicly accessible HTML URL for both stores.
6. Confirm whether additional modules, web access, or future SDKs collect data not listed above before publishing.
7. Keep the existing website privacy section separate. Its attendance, payroll, leave, encrypted-on-own-servers, and face-deletion-in-app descriptions do not match the reviewed IrriTrack behavior.
