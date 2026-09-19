# TravelG — Native launch checklist

This checklist separates what is already prepared in the repository from the steps that require a local native toolchain or store credentials.

## Repository readiness

- Web production build remains the source for Capacitor (`webDir: dist`).
- Native application identity is reserved as `com.travelg.app` and app name is `TravelG`.
- Cloud data is shared through Supabase for trips, members, Roadbook, map points, expenses, preferences, visits, ratings and Memory Story.
- Memory photos are stored privately and rendered through signed URLs.
- Roadbook completion and GPS visit detection feed the shared Memory Story.

## iOS — requires macOS + Xcode

1. Install Capacitor packages and the iOS platform using the versions selected for the project.
2. Generate/sync the native project only after a successful web build.
3. Set the Apple Development Team and confirm the final bundle identifier before signing.
4. Add usage descriptions for location while in use, background location (only if the background/geofence implementation is enabled), camera/photo library when native capture is enabled, and notifications when push/local notifications are enabled.
5. Enable only the Background Modes actually used by the final implementation. Do not enable continuous location merely as a placeholder.
6. Test authentication, deep links, photo upload, GPS visit detection, offline/reconnect behavior and notification permission on a physical iPhone.
7. Archive with Xcode and distribute to TestFlight before App Store submission.

## Android — requires Android Studio + SDK

1. Install Capacitor packages and the Android platform using the versions selected for the project.
2. Generate/sync the native project only after a successful web build.
3. Confirm the final application ID before signing.
4. Add foreground location permissions; request background location only if the final geofence/background implementation genuinely requires it.
5. Configure Android 13+ notification permission when notifications are enabled.
6. Test authentication, photo upload, GPS visit detection, offline/reconnect behavior, battery restrictions and notification permission on a physical Android device.
7. Create the release signing key securely outside the repository and produce an Android App Bundle for Play Console internal testing.

## Background GPS / geofencing gate

Background location is intentionally **not declared complete** by the web implementation. Before store submission the native layer must provide and test the chosen geofencing/background-location plugin on both platforms. The implementation must use the minimum permission scope necessary and provide a clear in-app explanation before the operating-system permission prompt.

Acceptance criteria:

- foreground visit detection works reliably;
- geofence registrations are restored after app/device restart where supported;
- duplicate visit/memory creation remains idempotent;
- battery impact is acceptable;
- denial of background permission does not break normal app use;
- privacy/store declarations match the actual behavior.

## Store launch gate

Do not submit publicly until all of these pass on real devices:

- sign in / sign out and session restoration;
- create/join a trip and realtime group updates;
- Roadbook create/edit/move/complete flow;
- map synchronization;
- expense creation and group/family split;
- TravelG AI preference sync;
- visit detection → rating → shared Memory Story;
- private photo upload and signed-photo rendering;
- airplane-mode/reconnect smoke test;
- permission denial/recovery for location, photos and notifications;
- no secrets, signing keys or service-role credentials committed to Git.

## Credentials and store work

The following must remain user-controlled and outside source control: Apple Developer membership/team selection, distribution certificates/profiles, Google Play Console account, Android release keystore, store signing credentials, production store metadata and privacy declarations.
