# How to Run the AI VLM Service on Your PC and Connect from Your Phone

This guide explains how to run the AI food recognition service on your computer and have the DS-Cali app on your phone connect to it over your local WiFi network.

---

## Overview

```
┌──────────────────┐         WiFi          ┌──────────────────┐
│  Your Phone      │  ──────────────────>  │  Your PC        │
│  (DS-Cali APK)   │   HTTP request        │  (AI VLM server)│
│                  │  <──────────────────  │  port 3031      │
│  Settings →       │   JSON response       │  z-ai-web-dev- │
│  Developer →     │                       │  sdk VLM        │
│  Remote URL      │                       │                 │
└──────────────────┘                       └──────────────────┘
```

Your phone and computer must be on the **same WiFi network**. The app sends the meal photo to your PC, your PC runs the Z-AI vision model, and sends the result back.

---

## Step 1: Install Bun on Your PC

If you don't have Bun installed:

### Windows (PowerShell)
```powershell
# Install Bun via PowerShell
irm bun.sh/install.ps1 | iex

# Or via npm
npm install -g bun

# Verify
bun --version
```

### macOS / Linux
```bash
curl -fsSL https://bun.sh/install | bash
bun --version
```

---

## Step 2: Start the AI VLM Service

Open a terminal/PowerShell on your PC:

```powershell
# Navigate to the service folder
cd C:\path\to\your\project\mini-services\ai-vlm-service

# Install dependencies (first time only)
bun install

# Start the server
bun run dev
```

You should see:
```
🚀 DS-Cali AI VLM service running on http://localhost:3031
   POST { "image": "<data-url>" } to analyze a meal.
   In the APK, set Remote service URL to: /api/analyze?XTransformPort=3031
```

**Keep this terminal open** — the service must keep running.

---

## Step 3: Find Your PC's IP Address

Your phone needs to reach your PC over WiFi, so you need your PC's local IP address.

### Windows (PowerShell)
```powershell
# Get your local IP address
ipconfig | findstr "IPv4"
```
Look for the line like `IPv4 Address. . . . . . . . . . . : 192.168.1.100`

Or:
```powershell
# Alternative
Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notmatch "Loopback" -and $_.PrefixOrigin -eq "Dhcp" } | Select-Object IPAddress
```

### macOS
```bash
ipconfig getifaddr en0   # WiFi
# or
ifconfig | grep "inet " | grep -v 127.0.0.1
```

### Linux
```bash
hostname -I
# or
ip addr show | grep "inet " | grep -v 127.0.0.1
```

**Write down this IP address** (e.g., `192.168.1.100`).

---

## Step 4: Test the Connection

On your PC, test that the service works:
```powershell
# Test with a simple health check
curl http://localhost:3031/
```

Then, on your phone's browser, try to access:
```
http://192.168.1.100:3031/
```
(Replace `192.168.1.100` with your PC's IP)

If you see a response, your phone can reach the service. If not:
- Make sure both devices are on the **same WiFi network**
- Make sure your PC's firewall allows connections on port 3031
- On Windows, you may need to allow the connection in the Windows Defender Firewall popup

---

## Step 5: Configure the App

1. Open **DS-Cali** on your phone
2. Go to **Settings → Developer → AI Engine**
3. Select **"Remote Z-AI service"**
4. In the **Remote Service URL** field, enter:
   ```
   http://192.168.1.100:3031
   ```
   (Replace `192.168.1.100` with your PC's actual IP address)
5. Tap **Save AI Settings**

---

## Step 6: Test Food Scanning

1. Go to the **+ button → Scan Meal**
2. Take a photo of your food
3. The app sends the photo to your PC over WiFi
4. Your PC runs the Z-AI VLM and returns the analysis
5. The result appears on your phone!

---

## Troubleshooting

### "Network request failed" or "Connection refused"

1. **Check the service is running**: Look at the terminal on your PC — you should see request logs when the app tries to connect.
2. **Check the IP address**: Make sure you entered the correct IP (e.g., `192.168.1.100`, not `localhost` or `127.0.0.1`).
3. **Check the port**: The service runs on port `3031` by default. Make sure your URL includes `:3031`.
4. **Check WiFi**: Both devices must be on the same WiFi network.
5. **Firewall**: On Windows, allow Bun/Node through the firewall:
   ```powershell
   # Open firewall for port 3031
   New-NetFirewallRule -DisplayName "DS-Cali AI VLM" -Direction Inbound -LocalPort 3031 -Protocol TCP -Action Allow
   ```

### The app falls back to "Mixed meal"

If the remote service fails, the app automatically falls back to the heuristic engine (which returns "Mixed meal" for unrecognized photos). Check:
- The terminal on your PC shows the request log
- The URL is correct
- The service is still running

### Slow response

The Z-AI VLM model takes 3-10 seconds to analyze an image. This is normal. The app shows a loading spinner during this time.

---

## Alternative: Deploy to a Public Server

If you don't want to keep your PC running, you can deploy the AI VLM service to a public server (Vercel, Railway, fly.io, etc.):

### Deploy to Vercel

1. Create a new Vercel project from the `mini-services/ai-vlm-service` folder
2. Set the entry point to `index.ts`
3. Deploy
4. You'll get a URL like `https://ds-cali-ai-vlm.vercel.app`
5. In the app, set Remote URL to `https://ds-cali-ai-vlm.vercel.app`

### Deploy to Railway/fly.io

1. Create an account on Railway.app or fly.io
2. Deploy the `mini-services/ai-vlm-service` folder
3. Set the port to 3031 (or the platform's default)
4. Use the provided URL in the app

**Advantage:** The service is always available, no need to keep your PC on.
**Cost:** Free tiers available on most platforms.

---

## Quick Reference

| What | Value |
|------|-------|
| Service folder | `mini-services/ai-vlm-service/` |
| Start command | `bun run dev` |
| Default port | `3031` |
| URL format | `http://YOUR_PC_IP:3031` |
| App setting | Settings → Developer → AI Engine → Remote Z-AI service |

---

## How It Works (Technical)

1. The app takes a photo → converts to base64 data URL
2. The app sends `POST { "image": "data:image/jpeg;base64,..." }` to your PC
3. The Bun server on your PC receives the request
4. It calls `z-ai-web-dev-sdk`'s VLM API (same as the sandbox)
5. The Z-AI cloud model analyzes the image and returns ingredients + macros
6. The server parses the response and calculates macros
7. The server sends the result back to the app as JSON
8. The app displays the analysis in the scanner sheet

This is the **exact same AI** that the sandbox uses — just running on your own computer instead of the dev server.
