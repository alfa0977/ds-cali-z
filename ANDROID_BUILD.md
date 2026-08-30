# Android APK Build Instructions

This guide explains how to package the DS-Cali web app into an Android APK installer. Multiple methods are provided, from fully free command-line approaches to Android Studio.

---

## Prerequisites

### Option A: Fully Free CLI (No Android Studio Required)

1. **Install Java JDK 17**:
   ```bash
   # Ubuntu/Debian
   sudo apt install openjdk-17-jdk
   # Mac (Homebrew)
   brew install openjdk@17
   # Windows (scoop)
   scoop install openjdk17
   ```

2. **Install Android SDK Command-Line Tools** (no Android Studio needed):
   ```bash
   # Download command-line tools only
   mkdir -p ~/Android/Sdk/cmdline-tools
   cd ~/Android/Sdk/cmdline-tools
   # Download from: https://developer.android.com/studio#command-line-tools-only
   # Extract and rename to "latest"
   ```

3. **Set environment variables**:
   ```bash
   # Linux/Mac — add to ~/.bashrc or ~/.zshrc
   export ANDROID_HOME=$HOME/Android/Sdk
   export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin
   export PATH=$PATH:$ANDROID_HOME/platform-tools
   export PATH=$PATH:$ANDROID_HOME/build-tools/34.0.0
   ```

4. **Accept SDK licenses and install components**:
   ```bash
   sdkmanager "platform-tools" "platforms;android-34" "build-tools;34.0.0"
   yes | sdkmanager --licenses
   ```

---

## Method 1: Capacitor + CLI (Recommended, Free, No Android Studio)

### Complete Chain — From Web App to APK

#### Step 1: Build the Web App

```bash
cd ds-cali
bun install
bun run db:push
bun run src/scripts/seed.ts
```

#### Step 2: Configure for Static Export

Add to `next.config.ts`:
```typescript
const nextConfig = {
  output: 'export',
  images: { unoptimized: true },
  trailingSlash: true,
};
```

#### Step 3: Install Capacitor

```bash
bun add @capacitor/core @capacitor/cli
bun add @capacitor/android
bunx cap init "DS-Cali" "app.dscali" --web-dir=out
```

#### Step 4: Build Static Files

```bash
bun run build
# Creates an `out/` folder with static HTML/JS/CSS
```

#### Step 5: Add Android Platform

```bash
bunx cap add android
bunx cap copy android
```

#### Step 6: Build the APK (CLI — No Android Studio)

```bash
cd android

# Build debug APK
./gradlew assembleDebug

# The APK is at:
# android/app/build/outputs/apk/debug/app-debug.apk
```

#### Step 7: Build Signed Release APK

1. **Generate a keystore**:
   ```bash
   keytool -genkey -v -keystore dscali.keystore -alias dscali -keyalg RSA -keysize 2048 -validity 10000
   ```

2. **Configure signing** in `android/app/build.gradle`:
   ```gradle
   android {
       signingConfigs {
           release {
               storeFile file('../../dscali.keystore')
               storePassword 'YOUR_PASSWORD'
               keyAlias 'dscali'
               keyPassword 'YOUR_PASSWORD'
           }
       }
       buildTypes {
           release {
               signingConfig signingConfigs.release
               minifyEnabled true
               proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
           }
       }
   }
   ```

3. **Build release APK**:
   ```bash
   cd android
   ./gradlew assembleRelease
   # APK at: android/app/build/outputs/apk/release/app-release.apk
   ```

#### Step 8: Install on Device

```bash
# Enable USB debugging on your phone, connect via USB
adb install app-debug.apk
# Or transfer the APK file to your phone and install manually
```

---

## Method 2: PWA Builder (Easiest, Free, Cloud-Based)

No local build tools needed — everything happens in the browser.

### Complete Chain

#### Step 1: Deploy the Web App

Deploy your Next.js app to any hosting:
- **Vercel** (free): `npx vercel`
- **Railway** (free tier): `railway up`
- **Netlify** (free): drag and drop the `out/` folder

Your app should be accessible at a URL like `https://ds-cali.vercel.app`

#### Step 2: Use PWA Builder

1. Go to [https://www.pwabuilder.com/](https://www.pwabuilder.com/)
2. Enter your deployed URL
3. Click **Build My PWA**
4. Download the **Android Package**
5. Unzip — it contains a full Android project

#### Step 3: Build the APK

```bash
cd downloaded-android-project
./gradlew assembleDebug
# APK at: app/build/outputs/apk/debug/app-debug.apk
```

Or upload to [GitHub Actions](https://github.com/features/actions) for cloud builds (no local tools at all).

---

## Method 3: Bubblewrap CLI (Google's Trusted Web Activity)

Google's official CLI for creating Android apps from PWAs. Free and command-line only.

### Complete Chain

#### Step 1: Deploy the Web App + Add PWA Manifest

Create `public/manifest.json`:
```json
{
  "name": "DS-Cali",
  "short_name": "DS-Cali",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#1C1C1E",
  "theme_color": "#FF9500",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

#### Step 2: Deploy and Get URL

Deploy your app (e.g., to Vercel): `npx vercel`

#### Step 3: Install Bubblewrap

```bash
npm install -g @bubblewrap/cli
```

#### Step 4: Initialize Project

```bash
bubblewrap init --manifest https://your-deployed-url.vercel.app/manifest.json
```

#### Step 5: Build APK

```bash
bubblewrap build
```

This generates a signed APK ready for the Play Store.

---

## Method 4: GitHub Actions (Fully Cloud, No Local Tools)

Create `.github/workflows/build-apk.yml`:

```yaml
name: Build Android APK
on: push

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - uses: actions/setup-java@v4
        with: { java-version: 17, distribution: temurin }
      - run: npm install
      - run: npm run build
      - uses: actions/setup-java@v4
        with: { java-version: 17, distribution: temurin }
      - run: npx cap add android
      - run: npx cap copy android
      - run: cd android && ./gradlew assembleDebug
      - uses: actions/upload-artifact@v4
        with:
          name: ds-cali-apk
          path: android/app/build/outputs/apk/debug/app-debug.apk
```

Push to GitHub → download the APK artifact from Actions tab.

---

## Method 5: Cordova (Alternative)

```bash
# Install Cordova globally
npm install -g cordova

# Create project
cordova create dscali-app app.dscali "DS-Cali"
cp -r out/* dscali-app/www/
cd dscali-app
cordova platform add android

# Build debug APK
cordova build android

# Build release APK
cordova build android --release

# APK at: platforms/android/app/build/outputs/apk/
```

---

## Important: API Routes in Static Export

Next.js API routes require a server. For a static APK, choose one:

### Option A: Remote Backend (Easiest)
Deploy the Next.js app to Vercel/Railway and have the APK load from that URL:
```typescript
// capacitor.config.ts
{
  server: {
    url: "https://your-app.vercel.app",
    cleartext: true
  }
}
```

### Option B: WebView Wrapper (Recommended)
Keep the full Next.js app on a server. The APK is just a native shell:
```bash
# Simple WebView app — no static export needed
# Just point the WebView to your deployed URL
```

---

## App Icons

### Generate Icons (Free, CLI)

```bash
# Install capacitor assets
npm install -D @capacitor/assets

# Create a resources/ folder with:
# - resources/icon.png (1024x1024)
# - resources/splash.png (2732x2732)

# Generate all platform icons
npx cap assets
```

Or use any image editor to create icons in these sizes:
- 48x48, 72x72, 96x96, 144x144, 192x192, 512x512 (PNG)

---

## Permissions

Add to `android/app/src/main/AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.VIBRATE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
```

---

## Publishing to Google Play

1. Create a [Google Play Developer account](https://play.google.com/console) ($25 one-time fee)
2. Generate a signed release APK (see Method 1, Step 7)
3. Upload to Google Play Console
4. Fill in:
   - App name: DS-Cali
   - Package name: app.dscali
   - Category: Health & Fitness
   - Screenshots (phone + tablet)
   - Privacy policy URL
5. Submit for review (usually 1-3 days)

---

## Quick Reference: The Entire Chain

```
1. bun install          → Install dependencies
2. bun run db:push      → Set up database
3. bun run src/scripts/seed.ts → Seed data
4. bun run build        → Build static files (out/)
5. npx cap add android  → Create Android project
6. npx cap copy android → Copy web assets
7. cd android && ./gradlew assembleDebug → Build APK
8. adb install app-debug.apk → Install on phone
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `sdkmanager: command not found` | Add cmdline-tools to PATH |
| Gradle build fails | Ensure JDK 17: `java -version` |
| `LICENSE NOT ACCEPTED` | Run `yes \| sdkmanager --licenses` |
| WebView shows blank | Check `webDir` = `out` in capacitor.config.ts |
| Camera doesn't work | Add CAMERA permission + use `@capacitor/camera` |
| API calls fail | Use remote server URL approach (Option A above) |
| Persian text not rendering | Vazirmatn font is bundled — ensure it loads |
| Build too slow | Use `./gradlew assembleDebug` (not release) for testing |
| `out/` folder missing | Ensure `output: 'export'` in next.config.ts |
