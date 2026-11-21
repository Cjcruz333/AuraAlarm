# 📱 AuraAlarm | App Store & Google Play Store Launch Guide

This guide contains everything you need to build, sign, and publish **AuraAlarm** (`com.auraalarm.app`) to both the **Apple App Store** and the **Google Play Store**, as well as how to install and test it immediately on any iPhone or Android phone.

---

## ⚡ Option 1: Instant Mobile Installation (No Store Wait)

Your app is fully configured as a **Progressive Web App (PWA)** with service workers, native splash screens, and standalone display.

### On iPhone (iOS):
1. Open Safari and navigate to your deployed URL (or local network IP e.g. `http://YOUR_LOCAL_IP:5000`).
2. Tap the **Share** button (the square with an arrow pointing up at the bottom).
3. Scroll down and tap **"Add to Home Screen"**.
4. Tap **Add**. The AuraAlarm icon appears on your home screen and launches without the browser bar, with full native gestures!

### On Android:
1. Open Google Chrome and navigate to the app URL.
2. Tap the **"Install App"** banner at the top, or tap the three dots in the top-right corner.
3. Select **"Install app"** or **"Add to Home screen"**.
4. The app installs natively with offline support and biometric login.

---

## 🤖 Option 2: Launch on Google Play Store

### Prerequisites
1. **Google Play Console Developer Account**: Register at [play.google.com/console](https://play.google.com/console) ($25 one-time fee).
2. **Android Studio**: Download and install from [developer.android.com/studio](https://developer.android.com/studio).

### Step 1: Open the Native Android Project
In your project directory, run:
```bash
cd client
npx cap open android
```
This opens the complete native project (`client/android/`) directly in **Android Studio**.

### Step 2: Generate Release Keystore
Generate a signing key for the Google Play Store by running:
```bash
scripts\generate-keystore.bat
```
Or with `keytool`:
```bash
keytool -genkey -v -keystore client/android/app/auraalarm-release.keystore -alias auraalarm -keyalg RSA -keysize 2048 -validity 10000
```
> ⚠️ **Important**: Save your keystore file and passwords securely. You will need them for all future updates.

### Step 3: Build the Android App Bundle (.aab)
In Android Studio:
1. Click **Build** > **Generate Signed Bundle / APK**.
2. Select **Android App Bundle** and click **Next**.
3. Point to your `auraalarm-release.keystore` file and enter your password.
4. Select destination folder and build variant **release**.
5. Click **Finish**. Android Studio generates:
   ```
   client/android/app/build/outputs/bundle/release/app-release.aab
   ```

### Step 4: Upload to Google Play Console
1. Go to **Google Play Console** > **Create App**.
   - **App name**: AuraAlarm
   - **Default language**: English (US)
   - **App or game**: App
   - **Free or paid**: Free
2. Complete the **Set up your app** tasks:
   - **Privacy Policy URL**: Link to your deployed privacy page.
   - **App access**: All functionality is available without restrictions (or demo account: `demo` / `demo1234`).
   - **Ads**: No ads.
   - **Content rating**: Complete the questionnaire (Health & Utilities).
   - **Target audience**: 13+.
   - **Data safety**: E2EE encrypted personal data, user biometric authentication.
3. **Store Listing**:
   - Copy the pre-written metadata in Section 4 below.
   - Upload App Icon (`client/public/icons/icon-512.png`).
   - Upload at least 2 phone screenshots (1080x1920 or modern mobile aspect ratio).
4. Go to **Production** > **Create new release**.
   - Upload `app-release.aab`.
   - Enter Release notes: *"Initial launch of AuraAlarm smart alarm and circadian wellness suite."*
   - Click **Save** > **Review release** > **Start rollout to Production**!

---

## 🍏 Option 3: Launch on Apple App Store

### Prerequisites
1. **Apple Developer Account**: Enrolled at [developer.apple.com](https://developer.apple.com) ($99/year).
2. **Mac with Xcode**: Required for Apple code signing and notarization.

### Step 1: Open the Native iOS Project
Transfer the project folder or pull from git on your Mac, then run:
```bash
cd client
npx cap open ios
```
This opens `client/ios/App/App.xcworkspace` in **Xcode**.

### Step 2: Configure Code Signing
1. In Xcode, click on **App** in the left project navigator.
2. Select the **Signing & Capabilities** tab.
3. Under **Team**, select your Apple Developer Team.
4. Ensure Bundle Identifier is set to: `com.auraalarm.app`.

### Step 3: Archive and Upload to App Store Connect
1. In the top bar, set the build destination to **Any iOS Device (arm64)**.
2. Click **Product** > **Archive**.
3. Once the archive finishes, the **Organizer** window will pop up.
4. Click **Distribute App** > **App Store Connect** > **Upload** > **Next**.
5. Xcode automatically validates your build and uploads it directly to your App Store Connect account!

### Step 4: Submit for Review in App Store Connect
1. Log in to [appstoreconnect.apple.com](https://appstoreconnect.apple.com) > **My Apps** > **+** > **New App**.
   - **Name**: AuraAlarm
   - **Primary Language**: English (US)
   - **Bundle ID**: `com.auraalarm.app`
   - **SKU**: `auraalarm-001`
2. Fill in Store Listing:
   - Paste metadata from Section 4 below.
   - Upload screenshots for 6.7" iPhone (1290 x 2796) and 6.5" iPhone (1242 x 2688).
3. Under **Build**, select the uploaded build from Xcode.
4. Fill in the **App Review Information**:
   - Contact email: `okeke12347@gmail.com`
   - Demo login credentials: Username `demo`, Password `demo1234`.
5. Click **Add for Review** > **Submit to App Review**!

---

## 📝 Section 4: Store Listing Copy (Ready to Copy & Paste)

### App Title:
`AuraAlarm - Smart Sleep & Alarm`

### Subtitle (iOS - 30 chars):
`Loved One Alarms & Sleep Aid`

### Short Description (Google Play - 80 chars):
`Wake up to loved ones, soothing sleep sounds, circadian fitness, and E2EE alarms.`

### Full Description (App Store & Google Play):
```
Transform the way you fall asleep and wake up with AuraAlarm.

AuraAlarm is a minimalist, end-to-end encrypted alarm clock and circadian wellness suite crafted for peace of mind, restorative rest, and consistent morning routines.

🌟 KEY FEATURES:

❤️ PERSONALIZED LOVED ONE ALARM SCREEN
• Wake up looking at the person who matters most to you.
• Dynamic time-based greetings ("Good morning", "Good afternoon", or "Good evening").
• Natural spoken voice greeting delivers personal morning notes.
• Sync personal media library audio or choose soothing dawn chimes.

🌙 FALL ASLEEP SOUNDSCAPES & BREATHING
• Web Audio synthesized acoustic soundscapes: Rain on Skylight, Pacific Deep Tide, 6Hz Theta Brainwaves, Aura Brown Noise, and Zen Sanctuary Stream.
• Smart sleep timer with gentle auto-fade (15 to 90 minutes).
• Dr. Weil's 4-7-8 deep sleep breathing pacer for parasympathetic relaxation.

📍 LOCATION-BASED GEOFENCE REMINDERS
• Trigger alerts and notifications when arriving at or departing from destinations (gym, home, office).
• 1-click export of alarms and reminders to Google Calendar, Apple Calendar, and Outlook (.ics).

🏃 CIRCADIAN FITNESS & FUEL TRACKER
• Tailored morning mobility, HIIT, and evening decompression workout routines.
• Interactive exercise timer with form coaching cues.
• Daily hydration milestones with reminder alerts.

📊 CONSISTENCY DASHBOARD & STREAKS
• Track daily wake streaks, weekly variance, and sleep duration.
• Unlock milestone achievement badges (Dawn Chaser, Deep Rest Master, Vitality Champion).
• Share your morning streak to social media with 1 tap.

🔒 END-TO-END ENCRYPTED & BIOMETRIC SECURE
• Touch ID, Face ID, and Windows Hello biometric login.
• AES-256-GCM client-side encryption ensures personal notes stay private.

Direct Support & Inquiries: okeke12347@gmail.com
```

### Keywords (iOS - 100 chars):
`alarm,clock,sleep,white noise,binaural,fitness,habits,streak,wellness,geofence,reminder,calendar,wake`

### Support Contact:
`okeke12347@gmail.com`
