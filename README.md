# AgroIntelX 🌾

AgroIntelX is a high-performance, full-stack, AI-powered agricultural intelligence platform designed to empower modern farmers, agricultural researchers, and administrators. Built with a pristine **Forest Mint theme** supporting dynamic light/dark modes, a secure **hybrid Cloud/local backend**, and real-time smart diagnostics.

This repository contains two **fully independent** projects — each has its own `package.json`, its own `package-lock.json`, and its own `node_modules` (nothing is hoisted to the repo root). This is intentional: it lets you deploy `frontend/` to Vercel and `backend/` to Render (or any other host) as two separate deployments, each only ever touching its own folder.

```
AgrointelX/
├── frontend/   # React 19 + Vite + Tailwind CSS client — deploy this folder to Vercel
├── backend/    # Express 5 API server — deploy this folder to Render
└── package.json  # Optional dev-only convenience scripts (NOT a workspaces root, not part of either deployment)
```

---

## 🌟 Key Features

### 🛡️ Secure Hybrid-Cloud Backend
* **Dual-Engine Persistence:** Automatic detection and integration of MongoDB Atlas with a graceful local JSON fallback when offline.
* **Google OAuth & Manual Auth Support:** Robust Google Authentication powered by Firebase alongside standard email/password registration.
* **Auto-Seeding Engines:** Automatic schema bootstrapping and initial seeding of default agricultural data (farmer profiles, calendar events, equipment catalogs, and Indian government schemes such as PM-KISAN, KCC, SHC, and PMKSY).
* **Express.js API:** High-speed, CORS-enabled REST API that protects Gemini and database credentials from client exposure.

### 🌐 Multilanguage Support (English, Hindi, Marathi)
* The entire UI — navigation, forms, dashboards, and the AI chat widget — is available in **English**, **हिन्दी (Hindi)**, and **मराठी (Marathi)**.
* Switch languages anytime from the sidebar, the auth pages, or Settings → Language Preferences. The choice is remembered on the device (`localStorage`) via `i18next-browser-languagedetector`.
* Voice input (speech-to-text) in the AI Assistant and dashboard chat widget automatically follows the selected language (`en-IN` / `hi-IN` / `mr-IN`).
* Translation strings live in `frontend/src/i18n/locales/{hi,mr}.json`; English text is supplied inline as the i18next default value at each call site, so no separate `en.json` is needed. To add a new language, duplicate one of these files, translate the values, and register it in `frontend/src/i18n/index.ts`.

### 🧪 Smart Agricultural Modules
* **Disease Detection:** Interactive plant leaf scanning and disease diagnosis powered by Gemini Vision APIs with offline logs.
* **Crop Recommendation:** Fast soil-nutrient and geographical suitability assessments matching crops to optimal regional environments.
* **Yield Prediction:** Micro-prediction modeling estimating crop yield per acre based on historical rain, fertilizer, and soil quality inputs.
* **Government Schemes Portal:** Real-time eligibility checking with direct links to official government application portals.
* **Equipment Hiring Hub:** Dynamic booking catalog for tractors, rotavators, and irrigation pumps with integrated expense logging.
* **Livestock Tracker:** Medical, vaccination, and tailored feed plans for cows, buffaloes, and poultry.
* **Smart Notification Dispatcher:** Real-time alerts for local pest outbreaks, extreme weather risks, and low soil moisture.

---

## 🚀 Getting Started

Requires **Node.js v20.19+ or v22.12+** and npm.

### 1. Install dependencies (each project separately)
```bash
cd backend && npm install
cd ../frontend && npm install
```
(Or from the repo root: `npm run install:all`, which just runs the two commands above for you — it does not create a root `node_modules`.)

### 2. Configure environment variables

**Backend** — copy `backend/.env.example` to `backend/.env`:
```env
PORT=3001
APP_URL=http://localhost:5173
MONGODB_URI=your_mongodb_connection_string   # optional, falls back to local JSON
GEMINI_API_KEY=your_gemini_api_key            # optional, falls back to offline simulation
```

**Frontend** — copy `frontend/.env.example` to `frontend/.env`:
```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_API_URL=                       # leave blank in dev (uses the proxy below)
VITE_DEV_API_PROXY_TARGET=http://localhost:3001
```

### 3. Run both dev servers together (optional convenience)
The root `package.json` is just a script runner for local development — install it once if you want a single command to start both apps:
```bash
npm install        # installs only "concurrently" into a root node_modules — not used in either deployment
npm run dev
```
This starts the backend API on **http://localhost:3001** and the frontend on **http://localhost:5173**, with Vite proxying `/api/*` requests to the backend so the client code can keep using relative paths.

You can just as easily skip the root install entirely and run each app in its own terminal:
```bash
cd backend && npm run dev
cd frontend && npm run dev
```

### 4. Build for production
```bash
cd backend && npm run build     # -> backend/dist/server.cjs
cd frontend && npm run build    # -> frontend/dist (static assets)
```

### 5. Deploy — frontend on Vercel, backend on Render
Because `frontend/` and `backend/` are fully independent projects (separate `package.json`, `package-lock.json`, `node_modules`), each platform only ever needs to look inside its own folder.

**Backend → Render**
1. New Web Service → connect this repo.
2. **Root Directory:** `backend`
3. **Build Command:** `npm install && npm run build`
4. **Start Command:** `npm run start`
5. Environment variables: `PORT` (Render sets this automatically — you can omit it), `APP_URL` (set to your Vercel frontend URL, e.g. `https://your-app.vercel.app`), `MONGODB_URI`, `GEMINI_API_KEY`.

**Frontend → Vercel**
1. New Project → import this repo.
2. **Root Directory:** `frontend`
3. Vercel auto-detects Vite: **Build Command:** `npm run build`, **Output Directory:** `dist`.
4. Environment variables: `VITE_API_URL` set to your Render backend URL (e.g. `https://your-api.onrender.com`), plus the `VITE_FIREBASE_*` keys.
5. Redeploy after setting env vars so Vite bakes `VITE_API_URL` into the build.

Once both are deployed, update the backend's `APP_URL` env var (CORS allow-list) to match your final Vercel domain, and redeploy the backend.

---

## 🛠️ Tech Stack & Dependencies

* **Frontend:** React 19, Vite 8 (Rolldown), Tailwind CSS 4, Lucide Icons, Recharts, Motion (Framer Motion), React Router 7, Firebase Auth, i18next / react-i18next (English, Hindi, Marathi).
* **Backend:** Node.js, Express 5, MongoDB driver, `@google/genai` (Gemini AI SDK), CORS, dotenv.
* **Tooling:** TypeScript 7, tsx, esbuild — two fully independent npm projects, no workspaces.

---

## 📈 Database Schema Structure

The backend stores data across these core collections/records (MongoDB Atlas, or `backend/data/db.json` when running locally without Mongo):
* `users` - Secure profile settings, farm coordinates, soil-type data, and access credentials.
* `expenses` - Ledger registry mapping financial records, seeding costs, and operator bills.
* `tasks` - Interactive checklist tracker logs crop routines, sowing dates, and priority filters.
* `equipment` - Inventory status logs for shared farming rigs and hiring availability.
* `livestock` - Veterinary vaccine tags, age progress logs, and diet instructions.
* `notifications` - Broadcast warning channels for extreme climate and pest risk alerts.
* `predictions` - Archive logs capturing AI crop recommendations and leaf disease reports.

---
*Crafted with precision for AgroIntelX.*
