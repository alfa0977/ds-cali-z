#!/bin/bash
# build-apk.sh — Build a static APK for DS-Cali
# Usage: bash build-apk.sh
#
# Prerequisites: Node.js, JDK 17, Android SDK (command-line tools)
# See ANDROID_BUILD.md for setup instructions

set -e

echo "📦 Building DS-Cali APK..."
echo ""

# Step 1: Install dependencies
echo "1️⃣  Installing dependencies..."
bun install

# Step 1b: Install Capacitor plugins (idempotent)
echo "1️⃣b  Installing Capacitor plugins..."
bun add @capacitor/core @capacitor/cli @capacitor/android @capacitor/app @capacitor/camera @capacitor/local-notifications 2>/dev/null || true

# Step 2: Build static export
echo "2️⃣  Building static files..."
BUILD_STATIC=1 bun run build
# next.config.ts will use output: "export" when BUILD_STATIC=1

# Step 3: Add Android platform (if not already)
if [ ! -d "android" ]; then
  echo "3️⃣  Adding Android platform..."
  bunx cap add android
else
  echo "3️⃣  Android platform already exists"
fi

# Step 3b: Patch AndroidManifest.xml with required permissions
echo "3️⃣b  Patching AndroidManifest.xml with permissions..."
MANIFEST="android/app/src/main/AndroidManifest.xml"
if [ -f "$MANIFEST" ]; then
  # Add permissions if not already present
  for PERM in CAMERA POST_NOTIFICATIONS READ_EXTERNAL_STORAGE WRITE_EXTERNAL_STORAGE; do
    if ! grep -q "android.permission.$PERM" "$MANIFEST"; then
      sed -i "s|</manifest>|    <uses-permission android:name=\"android.permission.$PERM\" />\n</manifest>|" "$MANIFEST"
      echo "   ✓ Added $PERM"
    else
      echo "   • $PERM already present"
    fi
  done
  # Add camera hardware feature (not required, but helps Play Store filtering)
  if ! grep -q "android.hardware.camera" "$MANIFEST"; then
    sed -i "s|</manifest>|    <uses-feature android:name=\"android.hardware.camera\" android:required=\"false\" />\n</manifest>|" "$MANIFEST"
    echo "   ✓ Added camera hardware feature"
  fi
else
  echo "   ⚠ AndroidManifest.xml not found at $MANIFEST — skipping patch"
fi

# Step 4: Copy web assets
echo "4️⃣  Copying web assets..."
bunx cap copy android

# Step 5: Sync Capacitor plugins
echo "5️⃣  Syncing Capacitor plugins..."
bunx cap sync android

# Step 6: Build APK
echo "6️⃣  Building APK..."
cd android
./gradlew assembleDebug

# Step 7: Show result
APK_PATH="app/build/outputs/apk/debug/app-debug.apk"
if [ -f "$APK_PATH" ]; then
  echo ""
  echo "✅ APK built successfully!"
  echo "📱 Location: $(pwd)/$APK_PATH"
  echo ""
  echo "To install on your phone:"
  echo "  adb install $APK_PATH"
  echo ""
  echo "Or transfer the file to your phone and install manually."
else
  echo "❌ APK build failed. Check the Gradle output above."
  exit 1
fi
