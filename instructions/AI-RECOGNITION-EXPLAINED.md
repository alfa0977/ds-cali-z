# AI Food Recognition — Why Sandbox Works but APK Uses Heuristic

## The Core Difference

| Environment | How AI works | Why |
|------------|-------------|-----|
| **Sandbox (web dev server)** | ✅ Real AI via z-ai-web-dev-sdk VLM | The dev server runs Node.js, so server-side API routes work |
| **APK (Capacitor static export)** | ⚠️ Heuristic fallback (unless you configure an engine) | Static export has NO server — API routes don't exist |

## Detailed Explanation

### In the Sandbox (localhost:3000)

1. You take a photo in the scanner
2. The `useAnalyzeMeal` hook checks `isStaticMode()` → returns `false` (it's a browser, not a Capacitor app)
3. The hook calls `fetch("/api/analyzeMeal", { method: "POST", body: { image } })`
4. The Next.js dev server receives this request at `src/app/api/analyzeMeal/route.ts`
5. That route imports `src/lib/ai-engine/index.ts` which uses `z-ai-web-dev-sdk`'s VLM
6. The SDK sends the image to the Z-AI cloud vision model
7. The model returns ingredients + macros
8. The result is displayed in the scanner sheet

**This works because the dev server is a real Node.js server that can run server-side code.**

### In the APK (on your phone)

1. You take a photo in the scanner
2. The `useAnalyzeMeal` hook checks `isStaticMode()` → returns `true` (it's a Capacitor WebView)
3. The hook calls `clientDB.analyzeMeal(image)` instead of `fetch("/api/analyzeMeal")`
4. `client-db.ts` delegates to `src/lib/ai-engines/index.ts` → `analyzeMealWithEngine(image)`
5. The engine is read from `localStorage` — default is `"heuristic"`
6. The heuristic engine:
   - Checks if the image URL contains "pancake", "salad", "burger", or "sushi"
   - If yes → returns the matching predefined meal
   - If no → returns a generic "Mixed meal" with hardcoded macros
7. The same generic result is returned every time

**This happens because a static APK has NO server. The `/api/analyzeMeal` route doesn't exist. There's nowhere for the z-ai VLM SDK to run.**

## How to Fix It — 3 Options

### Option 1: Use OpenAI Vision (recommended, easiest)

1. Get an API key from https://platform.openai.com
2. Open the app → Settings → Developer → AI Engine
3. Select "OpenAI Vision (GPT-4o)"
4. Enter your API key
5. Now when you scan a meal, it calls OpenAI's GPT-4o vision model with your photo
6. The result is real AI food recognition

**Cost:** ~$0.01-0.05 per scan (GPT-4o vision pricing)

### Option 2: Use Google Gemini

1. Get an API key from https://aistudio.google.com
2. Open the app → Settings → Developer → AI Engine
3. Select "Google Gemini"
4. Enter your API key
5. Now when you scan a meal, it calls Gemini 1.5 Flash

**Cost:** Free tier available (15 requests/minute), then paid

### Option 3: Run the Z-AI VLM mini-service (same as sandbox)

This is the most advanced option — it replicates the sandbox's exact AI on your own server.

1. Deploy `mini-services/ai-vlm-service/` to a public server (e.g., Vercel, Railway, fly.io, or your own VPS)
2. Open the app → Settings → Developer → AI Engine
3. Select "Remote Z-AI service"
4. Enter the URL of your deployed service (e.g., `https://your-app.vercel.app/api/analyze`)
5. Now when you scan a meal, the APK calls your server, which runs the z-ai VLM SDK

**To run locally for testing:**
```powershell
cd mini-services\ai-vlm-service
bun install
bun run dev
```
Then set URL to `/api/analyze?XTransformPort=3031` (the gateway forwards this to the local service).

**Cost:** Free (uses the same z-ai SDK as the sandbox)

## Architecture Diagram

```
SANDBOX (works):
  Browser → fetch("/api/analyzeMeal") → Next.js server → z-ai-web-dev-sdk → Z-AI cloud → result

APK with heuristic (default):
  APK → client-db.analyzeMeal() → heuristic engine → fixed result

APK with OpenAI engine:
  APK → ai-engines.analyzeOpenAI() → api.openai.com → GPT-4o → result

APK with Gemini engine:
  APK → ai-engines.analyzeGemini() → generativelanguage.googleapis.com → Gemini → result

APK with Remote engine:
  APK → ai-engines.analyzeRemote() → your-server.com → z-ai-web-dev-sdk → Z-AI cloud → result
```

## Summary

The sandbox works because it's a **real server**. The APK is a **static bundle** with no server. The multi-engine system I added lets you choose how to get real AI:
- Enter your own OpenAI/Gemini API key (easiest)
- Deploy the Z-AI mini-service (replicates the sandbox exactly)

**The heuristic engine is just a fallback** so the app doesn't crash if no API key is configured.
