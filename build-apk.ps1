# build-apk.ps1 — Build a static APK for DS-Cali (Windows PowerShell)
# Usage: powershell -ExecutionPolicy Bypass -File build-apk.ps1
#
# Prerequisites:
#   - Node.js 18+ (https://nodejs.org)
#   - JDK 17 (https://adoptium.net)
#   - Android SDK Command-Line Tools (https://developer.android.com/studio#command-line-tools-only)
#   - Set environment variables:
#       set ANDROID_HOME=C:\Android\Sdk
#       set JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-17.x.x
#
# See ANDROID_BUILD.md for detailed setup instructions.

param(
    [string]$BuildType = "debug"
)

$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  DS-Cali APK Builder (Windows)" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# ==========================================
# STEP 0: Check prerequisites
# ==========================================
Write-Host "[0/8] Checking prerequisites..." -ForegroundColor Yellow

# Check Node.js
$nodeVersion = try { node --version } catch { $null }
if (-not $nodeVersion) {
    Write-Host "  ERROR: Node.js is not installed." -ForegroundColor Red
    Write-Host "  Download from: https://nodejs.org" -ForegroundColor Red
    exit 1
}
Write-Host "  Node.js: $nodeVersion" -ForegroundColor Green

# Check Java
$javaFound = $false
try {
    $javaOutput = & java -version 2>&1 | Out-String
    if ($javaOutput -match "version") {
        $javaFound = $true
        $javaVersionStr = ($javaOutput -split "`n")[0]
        Write-Host "  Java: $javaVersionStr" -ForegroundColor Green
    }
} catch {
    # java not in PATH, but JAVA_HOME might still work for Gradle
}
if (-not $javaFound) {
    # Check if JAVA_HOME is set — Gradle can use that even if java isn't in PATH
    if ($env:JAVA_HOME -and (Test-Path $env:JAVA_HOME)) {
        Write-Host "  Java: JAVA_HOME is set ($env:JAVA_HOME)" -ForegroundColor Green
    } else {
        # Try common locations
        $javaCandidates = @(
            "C:\Program Files\Eclipse Adoptium\jdk-21*",
            "C:\Program Files\Eclipse Adoptium\jdk-17*",
            "C:\Program Files\Java\jdk-21*",
            "C:\Program Files\Java\jdk-17*",
            "C:\Program Files\Microsoft\jdk-21*",
            "C:\Program Files\Microsoft\jdk-17*"
        )
        $foundJava = $null
        foreach ($pattern in $javaCandidates) {
            $found = Get-ChildItem -Path $pattern -ErrorAction SilentlyContinue | Select-Object -First 1
            if ($found) {
                $foundJava = $found.FullName
                $env:JAVA_HOME = $foundJava
                break
            }
        }
        if ($foundJava) {
            Write-Host "  Java: found at $foundJava (auto-detected)" -ForegroundColor Green
        } else {
            Write-Host "  WARNING: Java not found in PATH or common locations." -ForegroundColor Yellow
            Write-Host "  Gradle may still work if JAVA_HOME is set." -ForegroundColor Yellow
            Write-Host "  If the build fails, install JDK 17+ from: https://adoptium.net" -ForegroundColor Yellow
        }
    }
}

# Check ANDROID_HOME
$androidHome = $env:ANDROID_HOME
if (-not $androidHome) {
    $androidHome = $env:LOCALAPPDATA + "\Android\Sdk"
    $env:ANDROID_HOME = $androidHome
}
if (-not (Test-Path $androidHome)) {
    Write-Host "  ERROR: Android SDK not found at: $androidHome" -ForegroundColor Red
    Write-Host "  Set ANDROID_HOME environment variable to your SDK path" -ForegroundColor Red
    Write-Host "  Example: set ANDROID_HOME=C:\Android\Sdk" -ForegroundColor Red
    exit 1
}
Write-Host "  Android SDK: $androidHome" -ForegroundColor Green

# Check JAVA_HOME
if (-not $env:JAVA_HOME) {
    # Try to auto-detect
    $javaHomeCandidates = @(
        "C:\Program Files\Eclipse Adoptium\jdk-17.*",
        "C:\Program Files\Java\jdk-17*",
        "C:\Program Files\Microsoft\jdk-17*"
    )
    foreach ($pattern in $javaHomeCandidates) {
        $found = Get-ChildItem -Path $pattern -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($found) {
            $env:JAVA_HOME = $found.FullName
            break
        }
    }
}
if (-not $env:JAVA_HOME) {
    Write-Host "  ERROR: JAVA_HOME is not set." -ForegroundColor Red
    Write-Host "  Set it: set JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-17.x.x" -ForegroundColor Red
    exit 1
}
Write-Host "  JAVA_HOME: $env:JAVA_HOME" -ForegroundColor Green

Write-Host ""

# ==========================================
# STEP 1: Install dependencies
# ==========================================
Write-Host "[1/8] Installing dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ERROR: npm install failed." -ForegroundColor Red
    exit 1
}
Write-Host "  Done." -ForegroundColor Green
Write-Host ""

# ==========================================
# STEP 2: Install Capacitor
# ==========================================
Write-Host "[2/8] Installing Capacitor..." -ForegroundColor Yellow
npm install @capacitor/core @capacitor/cli @capacitor/android 2>$null
if ($LASTEXITCODE -ne 0) {
    # Already installed, that's fine
    Write-Host "  Already installed." -ForegroundColor Green
} else {
    Write-Host "  Done." -ForegroundColor Green
}
Write-Host ""

# ==========================================
# STEP 3: Build static files
# ==========================================
Write-Host "[3/8] Building static files (this may take a few minutes)..." -ForegroundColor Yellow
$env:BUILD_STATIC = "1"
npx next build
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ERROR: Next.js build failed." -ForegroundColor Red
    exit 1
}
Remove-Item Env:\BUILD_STATIC
Write-Host "  Static files built in .\out\" -ForegroundColor Green
Write-Host ""

# ==========================================
# STEP 4: Initialize Capacitor (if needed)
# ==========================================
Write-Host "[4/8] Setting up Capacitor..." -ForegroundColor Yellow
if (-not (Test-Path "capacitor.config.ts")) {
    npx cap init "DS-Cali" "app.dscali" --web-dir=out
}
Write-Host "  Done." -ForegroundColor Green
Write-Host ""

# ==========================================
# STEP 5: Add Android platform (if needed)
# ==========================================
Write-Host "[5/8] Checking Android platform..." -ForegroundColor Yellow
if (-not (Test-Path "android")) {
    npx cap add android
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  ERROR: Failed to add Android platform." -ForegroundColor Red
        exit 1
    }
    Write-Host "  Android platform added." -ForegroundColor Green
} else {
    Write-Host "  Android platform already exists." -ForegroundColor Green
}
Write-Host ""

# ==========================================
# STEP 6: Copy web assets
# ==========================================
Write-Host "[6/8] Copying web assets to Android..." -ForegroundColor Yellow
npx cap copy android
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ERROR: Failed to copy assets." -ForegroundColor Red
    exit 1
}
Write-Host "  Done." -ForegroundColor Green
Write-Host ""

# ==========================================
# STEP 7: Build APK with Gradle
# ==========================================
Write-Host "[7/8] Building APK with Gradle..." -ForegroundColor Yellow
Push-Location android

# Build debug or release
if ($BuildType -eq "release") {
    .\gradlew assembleRelease
} else {
    .\gradlew assembleDebug
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "  ERROR: Gradle build failed." -ForegroundColor Red
    Pop-Location
    exit 1
}

# Find the APK
if ($BuildType -eq "release") {
    $apkPath = "app\build\outputs\apk\release\app-release.apk"
} else {
    $apkPath = "app\build\outputs\apk\debug\app-debug.apk"
}

if (Test-Path $apkPath) {
    $fullPath = (Get-Item $apkPath).FullName
    Pop-Location
    
    Write-Host ""
    Write-Host "==========================================" -ForegroundColor Green
    Write-Host "  APK BUILT SUCCESSFULLY!" -ForegroundColor Green
    Write-Host "==========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "  File: $fullPath" -ForegroundColor Cyan
    Write-Host "  Size: $([math]::Round((Get-Item $apkPath).Length / 1MB, 2)) MB" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  To install on your phone:" -ForegroundColor Yellow
    Write-Host "    1. Connect phone via USB (enable USB debugging)" -ForegroundColor White
    Write-Host "    2. Run: adb install `"$fullPath`"" -ForegroundColor White
    Write-Host "    OR" -ForegroundColor White
    Write-Host "    Copy the .apk file to your phone and tap to install" -ForegroundColor White
    Write-Host ""
} else {
    Pop-Location
    Write-Host "  ERROR: APK file not found at expected location." -ForegroundColor Red
    Write-Host "  Check: android\$apkPath" -ForegroundColor Red
    exit 1
}

# ==========================================
# STEP 8: Done
# ==========================================
Write-Host "[8/8] Done!" -ForegroundColor Green
Write-Host ""
Write-Host "  The app works fully offline." -ForegroundColor Cyan
Write-Host "  All data is stored locally on the device (IndexedDB)." -ForegroundColor Cyan
Write-Host "  Only AI meal scanning and barcode lookup require internet." -ForegroundColor Cyan
Write-Host ""
