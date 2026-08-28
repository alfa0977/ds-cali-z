# build-apk.ps1 — Build a static APK for DS-Cali (Windows PowerShell)
# Usage: powershell -ExecutionPolicy Bypass -File build-apk.ps1
#
# Prerequisites:
#   - Node.js 18+ (https://nodejs.org)
#   - JDK 17 (https://adoptium.net)
#   - Android SDK Command-Line Tools (https://developer.android.com/studio#command-line-tools-only)
#   - Set environment variables:
#       $env:ANDROID_HOME = "C:\Android\Sdk"
#       $env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-17.x.x"
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
Write-Host "[0/9] Checking prerequisites..." -ForegroundColor Yellow

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
} catch {}
if (-not $javaFound) {
    if ($env:JAVA_HOME -and (Test-Path $env:JAVA_HOME)) {
        Write-Host "  Java: JAVA_HOME is set ($env:JAVA_HOME)" -ForegroundColor Green
    } else {
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
            Write-Host "  WARNING: Java not found. Install JDK 17+ from: https://adoptium.net" -ForegroundColor Yellow
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
    Write-Host "  Set: `$env:ANDROID_HOME = 'C:\Android\Sdk'" -ForegroundColor Red
    exit 1
}
Write-Host "  Android SDK: $androidHome" -ForegroundColor Green

if (-not $env:JAVA_HOME) {
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
    Write-Host "  Set: `$env:JAVA_HOME = 'C:\Program Files\Eclipse Adoptium\jdk-17.x.x'" -ForegroundColor Red
    exit 1
}
Write-Host "  JAVA_HOME: $env:JAVA_HOME" -ForegroundColor Green
Write-Host ""

# ==========================================
# STEP 1: Install dependencies
# ==========================================
Write-Host "[1/9] Installing dependencies..." -ForegroundColor Yellow
bun install
if ($LASTEXITCODE -ne 0) {
    Write-Host "  bun install failed, trying npm..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  ERROR: Dependency install failed." -ForegroundColor Red
        exit 1
    }
}
Write-Host "  Done." -ForegroundColor Green
Write-Host ""

# ==========================================
# STEP 2: Install Capacitor + plugins
# ==========================================
Write-Host "[2/9] Installing Capacitor + plugins..." -ForegroundColor Yellow
bun add @capacitor/core @capacitor/cli @capacitor/android @capacitor/app @capacitor/camera @capacitor/local-notifications 2>$null
if ($LASTEXITCODE -ne 0) {
    npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/app @capacitor/camera @capacitor/local-notifications 2>$null
}
Write-Host "  Done." -ForegroundColor Green
Write-Host ""

# ==========================================
# STEP 3: Build static files
# ==========================================
Write-Host "[3/9] Building static files (this may take a few minutes)..." -ForegroundColor Yellow

# Move API routes out during static build (they don't work in static export)
$apiBackup = $null
if (Test-Path "src\app\api") {
    $apiBackup = "src\app\__api_backup"
    if (Test-Path $apiBackup) { Remove-Item $apiBackup -Recurse -Force }
    Move-Item "src\app\api" $apiBackup
    Write-Host "  Temporarily moved API routes (not needed for static build)" -ForegroundColor DarkGray
}

$env:BUILD_STATIC = "1"
bun run build
$buildResult = $LASTEXITCODE
if ($buildResult -ne 0) {
    Write-Host "  bun build failed, trying npx next build..." -ForegroundColor Yellow
    npx next build
    $buildResult = $LASTEXITCODE
}
Remove-Item Env:\BUILD_STATIC

# Restore API routes
if ($apiBackup -and (Test-Path $apiBackup)) {
    Move-Item $apiBackup "src\app\api"
    Write-Host "  Restored API routes" -ForegroundColor DarkGray
}

if ($buildResult -ne 0) {
    Write-Host "  ERROR: Next.js build failed." -ForegroundColor Red
    exit 1
}
Write-Host "  Static files built in .\out\" -ForegroundColor Green
Write-Host ""

# ==========================================
# STEP 4: Initialize Capacitor (if needed)
# ==========================================
Write-Host "[4/9] Setting up Capacitor..." -ForegroundColor Yellow
if (-not (Test-Path "capacitor.config.ts")) {
    npx cap init "DS-Cali" "app.dscali" --web-dir=out
}
Write-Host "  Done." -ForegroundColor Green
Write-Host ""

# ==========================================
# STEP 5: Add Android platform (if needed)
# ==========================================
Write-Host "[5/9] Checking Android platform..." -ForegroundColor Yellow
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
# STEP 6: Patch AndroidManifest.xml with permissions
# ==========================================
Write-Host "[6/9] Patching AndroidManifest.xml with permissions..." -ForegroundColor Yellow
$manifestPath = "android\app\src\main\AndroidManifest.xml"
$templatePath = "instructions\AndroidManifest.template.xml"

if (-not (Test-Path $manifestPath)) {
    if (Test-Path $templatePath) {
        Copy-Item $templatePath $manifestPath
        Write-Host "  Copied manifest from template" -ForegroundColor Green
    } else {
        Write-Host "  WARNING: No manifest found and no template available" -ForegroundColor Yellow
    }
} else {
    $manifest = Get-Content $manifestPath -Raw
    $permissionsToAdd = @(
        "android.permission.INTERNET",
        "android.permission.CAMERA",
        "android.permission.POST_NOTIFICATIONS",
        "android.permission.READ_EXTERNAL_STORAGE",
        "android.permission.WRITE_EXTERNAL_STORAGE"
    )
    foreach ($perm in $permissionsToAdd) {
        if ($manifest -notmatch [regex]::Escape($perm)) {
            $permLine = "    <uses-permission android:name=`"$perm`" />`r`n</manifest>"
            $manifest = $manifest -replace "</manifest>", $permLine
            Write-Host "  Added: $perm" -ForegroundColor Green
        }
    }
    # Add camera hardware feature
    if ($manifest -notmatch "android\.hardware\.camera") {
        $featureLine = "    <uses-feature android:name=`"android.hardware.camera`" android:required=`"false`" />`r`n</manifest>"
        $manifest = $manifest -replace "</manifest>", $featureLine
        Write-Host "  Added: camera hardware feature" -ForegroundColor Green
    }
    Set-Content -Path $manifestPath -Value $manifest -NoNewline
}
Write-Host ""

# ==========================================
# STEP 7: Ensure strings.xml has app name
# ==========================================
Write-Host "[7/9] Ensuring strings.xml..." -ForegroundColor Yellow
$stringsPath = "android\app\src\main\res\values\strings.xml"
if (-not (Test-Path $stringsPath)) {
    $stringsDir = Split-Path $stringsPath -Parent
    if (-not (Test-Path $stringsDir)) {
        New-Item -ItemType Directory -Path $stringsDir -Force | Out-Null
    }
    $stringsContent = @"
<?xml version='1.0' encoding='utf-8'?>
<resources>
    <string name="app_name">DS-Cali</string>
    <string name="title_activity_main">DS-Cali</string>
    <string name="package_name">app.dscali</string>
    <string name="custom_url_scheme">app.dscali</string>
</resources>
"@
    Set-Content -Path $stringsPath -Value $stringsContent
    Write-Host "  Created strings.xml" -ForegroundColor Green
} else {
    Write-Host "  strings.xml already exists" -ForegroundColor Green
}
Write-Host ""

# ==========================================
# STEP 8: Copy + sync Capacitor
# ==========================================
Write-Host "[8/9] Copying web assets + syncing plugins..." -ForegroundColor Yellow
npx cap copy android
npx cap sync android
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ERROR: cap sync failed." -ForegroundColor Red
    exit 1
}
Write-Host "  Done." -ForegroundColor Green
Write-Host ""

# ==========================================
# STEP 9: Build APK with Gradle
# ==========================================
Write-Host "[9/9] Building APK with Gradle..." -ForegroundColor Yellow
Push-Location android

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
    Write-Host "  IMPORTANT: Uninstall the old APK first!" -ForegroundColor Yellow
    Write-Host "  Android caches permissions from the first install." -ForegroundColor Yellow
    Write-Host ""
} else {
    Pop-Location
    Write-Host "  ERROR: APK file not found at expected location." -ForegroundColor Red
    Write-Host "  Check: android\$apkPath" -ForegroundColor Red
    exit 1
}
