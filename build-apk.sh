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

# Step 2: Build static export
echo "2️⃣  Building static files..."
BUILD_STATIC=1 bun run build
# next.config.ts will use output: "export" when BUILD_STATIC=1

# Step 3: Install Capacitor (if not already)
echo "3️⃣  Setting up Capacitor..."
bun add @capacitor/core @capacitor/cli @capacitor/android 2>/dev/null || true

# Step 4: Add Android platform (if not already)
if [ ! -d "android" ]; then
  echo "4️⃣  Adding Android platform..."
  bunx cap add android
else
  echo "4️⃣  Android platform already exists"
fi

# Step 5: Copy web assets
echo "5️⃣  Copying web assets..."
bunx cap copy android

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
