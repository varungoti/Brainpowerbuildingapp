# Google Play Store deployment — NeuroSpark

NeuroSpark package: `com.neurospark.app`  
Current release track version: **1.0.1** (versionCode **2**)

Google Play requires an **Android App Bundle (`.aab`)**, not only an APK. Build both with the scripts below.

## 1. One-time setup

### Google Play Console

1. Create a [Google Play Console](https://play.google.com/console) developer account ($25 one-time fee).
2. Create app **NeuroSpark** with package name `com.neurospark.app` (must match exactly).
3. Enable **Play App Signing** (recommended). Google holds the app signing key; you upload with an **upload key**.

### Upload keystore (signing)

From repo root, generate once (replace passwords and answers):

```powershell
keytool -genkey -v -keystore android/neurospark-upload.keystore -alias neurospark -keyalg RSA -keysize 2048 -validity 10000
```

Copy the example file and fill in real values:

```powershell
copy android\keystore.properties.example android\keystore.properties
```

Edit `android/keystore.properties`:

```properties
storeFile=neurospark-upload.keystore
storePassword=...
keyAlias=neurospark
keyPassword=...
```

**Back up** `neurospark-upload.keystore` and passwords in a password manager. Losing the upload key complicates future updates.

### Production API keys in the web build

Before store submission, set production values in `.env` (or CI secrets) so the embedded Vite build talks to prod:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_EDGE_BASE_URL` (Supabase Edge Functions base, e.g. `https://<project>.supabase.co/functions/v1/server`)
- Razorpay **live** keys on the server (Edge Function secrets), not test keys

Run `pnpm run supabase:sync-env` if you use `.env.supabase` for Supabase project linkage.

## 2. Build release artifacts

```powershell
pnpm run verify
pnpm run android:release
```

Or individually:

```powershell
pnpm run aab:release
pnpm run apk:release
```

### Output paths

| Artifact | Path |
|----------|------|
| **AAB (upload to Play)** | `android/app/build/outputs/bundle/release/app-release.aab` |
| Signed APK (if keystore configured) | `android/app/build/outputs/apk/release/app-release.apk` |
| Unsigned APK (no keystore) | `android/app/build/outputs/apk/release/app-release-unsigned.apk` |

If `keystore.properties` is missing, the AAB/APK are **unsigned**. Play Console will reject unsigned bundles — configure the keystore first.

## 3. Bump version for each new upload

Edit **both**:

- `capacitor.config.ts` → `android.versionName` and `android.versionCode`
- `android/app/build.gradle` → `versionName` and `versionCode`

Rules:

- `versionCode` must increase by at least 1 every upload (integer).
- `versionName` is user-visible (e.g. `1.0.2`).

Then rebuild: `pnpm run android:release`.

## 4. Upload to Play Console

1. Open **Release** → **Production** (or **Internal testing** for first smoke).
2. **Create new release** → Upload `app-release.aab`.
3. Complete required sections (first time only):
   - **App content**: Privacy policy URL, ads declaration, target audience, data safety (align with in-app Legal & Trust and COPPA posture).
   - **Store listing**: Short/long description, screenshots (phone 1080×1920+), feature graphic 1024×500, app icon 512×512.
   - **Content rating** questionnaire (IARC).
   - **Pricing & distribution** countries.
4. Add **release notes** for 1.0.1.
5. Review and **Start rollout**.

Internal testing track is recommended for the first install on a real device before production.

## 5. Checklist before submission

- [ ] Counsel-reviewed Terms, Privacy, Refunds (`docs/OWNER_ACTION_CHECKLIST.md`)
- [ ] Data safety form matches actual analytics and child data practices
- [ ] Production Supabase + Edge Functions deployed (`/growth/lead`, payments, auth)
- [ ] Razorpay live mode tested on a real device
- [ ] Tested onboarding, first activity, paywall on Android 12+
- [ ] `RECORD_AUDIO` permission justified in listing (voice features)
- [ ] No test keys or debug endpoints in production build

## 6. After approval

- Monitor **Android vitals** (crashes, ANRs) in Play Console.
- Use **staged rollout** (e.g. 10% → 50% → 100%).
- For updates, repeat section 3–4 with a higher `versionCode`.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Upload rejected: version code already used | Increment `versionCode` in both version files |
| Bundle not signed | Add `android/keystore.properties` and rebuild |
| Gradle / JDK errors | Install Android Studio or JDK 17; set `JAVA_HOME` |
| White screen on launch | Confirm `pnpm run build:mobile` ran and `dist/` is synced |
| Payments fail in prod | Set Razorpay live secrets on Supabase Edge Function |
