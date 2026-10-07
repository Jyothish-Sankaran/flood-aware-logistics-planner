# Logistic Decision Support System (LDSS)
### AI-Powered Flood-Aware & Cargo-Aware Logistics Decision Support for Kerala

[![KeralAI Grand Challenge 2026](https://img.shields.io/badge/KeralAI%20Grand%20Challenge-2026%20Challenge%205-blue.svg)](https://keralai.gov.in)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Vitest](https://img.shields.io/badge/Tests-42%20Passed-brightgreen?logo=vitest)](https://vitest.dev/)
[![IBM watsonx.ai](https://img.shields.io/badge/IBM%20watsonx.ai-Granite%203.3-054ADA?logo=ibm)](https://www.ibm.com/products/watsonx-ai)

---

## 📌 Executive Overview

During monsoon seasons, Kerala experiences heavy rainfall, sudden flash floods, waterlogging, landslides, and road closures. Small commercial fleet operators, FMCG distributors, and agricultural transport drivers often discover disruptions only after entering hazardous or impassable corridors.

**LDSS is NOT a generic navigation app.** Instead of merely seeking the geometrically shortest route, LDSS evaluates the specific **CARGO** (perishability, shelf-life, value) and **VEHICLE** (ground clearance, payload weight) alongside dynamic flood risks, weather forecasts, and real-time crowdsourced/authority incident intelligence. It proactively detects hazards, evaluates trip-specific impact, and suggests optimal reroutes before vehicles reach gridlock or damage zones.

---

## 🎯 Key Features

- **🧠 Cargo & Vehicle Aware Route Intelligence:**
  - Categorizes cargo into Perishable, Medical, High Value, Heavy Machinery, or General Freight.
  - Matches vehicle ground clearance against water depth and road gradient risk factors.
  - Calculates 4 penalty factors: Precipitation Intensity, Historical Flood Inundation, Vehicle Suitability, and Cargo Disruption Sensitivity.

- **🚨 Multi-Source Incident Intelligence & Corroboration:**
  - Ingests reports from KSDMA / Police Feeds, Driver Crowdsourcing, and IoT Sensors.
  - Transparent corroboration engine: spatial clustering (<1.5 km), temporal window (<30 min), reporter reputation, and confidence decay.
  - Rate-limiting and anti-abuse safeguards (max 3 reports per driver per 10 mins with GPS proximity validation).

- **⚡ Trip Impact Engine & Automated Rerouting:**
  - Evaluates whether an incident intersects the active trip's remaining polyline (<500 m).
  - Deterministically computes **Distance-to-Hazard** and **Time-to-Impact** countdown.
  - Suppresses irrelevant alerts for vehicles on unaffected corridors (zero false alerts).

- **📱 Driver Mobile App with Zero-Data Offline Mode:**
  - High-contrast, driver-friendly UI with large buttons and turn-by-turn guidance.
  - Malayalam audio speech synthesis for hands-free driver notifications (*"ശ്രദ്ധിക്കുക: അങ്കമാലിയിൽ വെള്ളക്കെട്ട്"*).
  - Emergency SOS workflow with one-tap dispatch to Kerala Emergency Response Support (112).
  - Offline local incident queue (`localStorage`) with automatic background sync when connectivity resumes in Ghat sections.

- **📊 Macroeconomic Impact & Cost Analytics:**
  - Quantifies saved fuel, avoided spoilage risk (₹), driver idle hours, and carbon emission reductions.
  - Transparent calculations with *"Estimate based on stated assumptions"* badges.

- **🛡️ Responsible AI, Auditability & Transparency:**
  - **Deterministic Safety Core**: All routing math, geometry checks, and risk scores are 100% deterministic rules.
  - **GenAI Role (IBM watsonx.ai Granite)**: Strictly restricted to NLP free-text manifest extraction and multilingual hazard report parsing.
  - **Provenance Badges**: Every AI output displays its source (`watsonx.ai Granite` vs `Rule-based template`).
  - **Immutable Audit Drawer**: Global slide-out drawer providing a tamper-evident, exportable JSON audit log of all system decisions.

---

## 🏗️ System Architecture

```mermaid
flowchart TB
    subgraph Data Layer
        OSRM[OSRM Routing Engine + Snapshot Fallback]
        Meteo[Open-Meteo IMD/ECMWF API + Snapshot Fallback]
        GeoJSON[8 Curated Historical Flood Hotspots (Static)]
    end

    subgraph Core Deterministic Engines
        CC[Cargo Classifier: Perishable / Fragile / Hazardous / General]
        RE[Route & Flood Risk Engine: 4 Penalty Factors]
        IE[Incident Engine: Multi-Source Corroboration & Decay]
        IM[Impact Engine: Spatial Buffer <500m & Time-to-Impact]
        Metrics[Impact Analytics: Fuel, Spoilage & Downtime]
    end

    subgraph AI & Provenance Layer
        WatsonProxy[Express Proxy: IBM watsonx.ai Granite 3.3]
        FallbackNLP[Deterministic Keyword & Template Engine]
        ProvBadge[Provenance Badge: watsonx.ai Granite vs Rule-Based]
    end

    subgraph User & Dispatcher Interface
        TripWizard[1. Trip Planner & Cargo Wizard]
        RouteIntel[2. Route Intelligence & Scoring]
        ActiveMon[3. Active Monitoring & Demo Controls]
        IncCenter[4. Incident Center & Feed]
        DriverApp[5. Mobile Driver App & Offline Queue]
        ImpactPage[6. Macro Impact & Cost Analytics]
        GovPages[7. Responsible AI, Readiness & Limitations]
        AuditDrawer[8. Global Immutable Audit Log Drawer]
    end

    Data Layer --> Core Deterministic Engines
    Core Deterministic Engines --> User & Dispatcher Interface
    WatsonProxy --> ProvBadge --> User & Dispatcher Interface
    FallbackNLP --> ProvBadge
```

---

## 🎬 Canonical Demo Scenario (`TRIP-104`)

| Parameter | Value |
|---|---|
| **Trip ID** | `TRIP-104` (Palakkad $\rightarrow$ Kochi) |
| **Driver & Vehicle** | Arun \| **VH-104** (Ashok Leyland Dost, Clearance 190 mm) |
| **Cargo** | 500 kg Fresh Organic Vegetables (**PERISHABLE**, Value: ₹60,000) |
| **Departure Time** | 09:00 AM |
| **Disruption Incident** | `INC-1042`: Tree Fall / Flood near **Angamaly (NH 544)** at 10:10 AM |
| **Detection at 10:17 AM** | Vehicle at Chalakudy (**24.0 km** from Angamaly), **Time-to-Impact: 23 min** |
| **Proactive Reroute** | Diverts via **R2 (SH 22 / MC Road)** $\rightarrow$ **+17 min delay** vs avoiding **90 min gridlock** and **₹60,000 spoilage** |
| **Secondary Vehicle** | **VH-208** (Rahul, Medical cargo, Thrissur $\rightarrow$ Kochi) $\rightarrow$ Alert correctly suppressed |

---

## 💻 Tech Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Zustand (state), React Router, Lucide Icons
- **Mapping:** Leaflet, React-Leaflet, OpenStreetMap Carto tiles
- **Routing & Geocoding:** OSRM (`router.project-osrm.org`) with cached snapshot fallback
- **Weather Service:** Open-Meteo (IMD / ECMWF high-resolution rainfall) with snapshot fallback
- **Backend Proxy:** Node.js, Express, CORS (proxies IBM watsonx.ai Granite 3.3)
- **Testing:** Vitest, React Testing Library, JSDOM (42 automated tests)

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **npm**: v9.0.0 or higher

### 1. Installation

Clone the repository and install dependencies for both the frontend and backend proxy:

```bash
# Clone the repository
git clone https://github.com/Jyothish-Sankaran/flood-aware-logistics-planner.git
cd flood-aware-logistics-planner

# Install frontend dependencies
npm install

# Install backend proxy dependencies
cd server
npm install
cd ..
```

### 2. Environment Configuration (Optional)

The application is **100% functional offline with zero API keys**. All routing, weather, and AI services gracefully fall back to local snapshots and deterministic template models.

To enable live IBM watsonx.ai Granite model inference:
1. Copy the sample environment file:
   ```bash
   cp .env.example .env
   ```
2. Update `.env` with your IBM Cloud credentials:
   ```env
   WATSONX_APIKEY=your_ibm_cloud_api_key_here
   WATSONX_PROJECT_ID=your_watsonx_project_id_here
   WATSONX_URL=https://us-south.ml.cloud.ibm.com
   PORT=3001
   ```

### 3. Running the Application

#### Start the Frontend Application:
```bash
npm run dev
```
Open **[http://localhost:5173](http://localhost:5173)** in your browser.

#### Start the IBM watsonx.ai Backend Proxy (Optional):
In a separate terminal window:
```bash
cd server
npm start
```
The proxy server will run on **[http://localhost:3001](http://localhost:3001)**.

---

## 🧪 Testing & Verification

Run the full suite of automated unit, integration, and end-to-end journey tests:

```bash
# Run all 42 acceptance tests across Phases 0–5
npm test

# Run TypeScript compilation check
npm run type-check

# Run production build
npm run build
```

### Test Suite Breakdown

| Suite | Focus Area | Tests Passed |
|---|---|:---:|
| `phase0.test.ts` | Base scenario, flood polygons, OSRM/Weather fallback | **5 / 5** |
| `phase1.test.ts` | Cargo classifier, vehicle ground clearance, route scoring | **10 / 10** |
| `phase2.test.ts` | Multi-source corroboration, spatial impact, rerouting | **12 / 12** |
| `phase3.test.ts` | Driver app, offline queue sync, SOS, audio synthesis | **5 / 5** |
| `phase4_e2e.test.ts` | Macro impact metrics, watsonx.ai proxy, 5x Canonical E2E | **7 / 7** |
| `phase5.test.ts` | Hackathon readiness, Responsible AI governance, audit logs | **3 / 3** |
| **Total** | **All Phase Acceptance Criteria** | **42 / 42** |

---

## 🧭 Navigation & Page Guide

- **`/trip-wizard`** — Cargo manifest entry, cargo type detection, vehicle parameter configuration.
- **`/route-intelligence`** — Multi-candidate route comparison, risk heatmaps, flood intersection analysis.
- **`/active-monitoring`** — Live dispatcher command center with simulation controls, incident injection, and reroute trigger.
- **`/incident-center`** — Real-time hazard feed, verification badges, source confidence breakdown.
- **`/driver`** — Mobile-optimized driver view with turn-by-turn guidance, offline hazard reporter, and SOS.
- **`/impact`** — Macroeconomic impact metrics (saved fuel, avoided loss, driver hours).
- **`/architecture`** — Interactive system pipeline and architectural components.
- **`/readiness`** — System health, API latencies, zero-key fallback validation, and demo script.
- **`/responsible-ai`** — Ethical charter, human-in-the-loop safeguards, anti-abuse rules, and data privacy.
- **`/limitations`** — Transparent disclosure of static flood data assumptions and future enhancements.

---

## 🛡️ Responsible AI & Ethical Principles

1. **Human-in-the-Loop:** Automated systems only recommend; fleet managers and drivers retain complete authority over route decisions.
2. **Transparent Provenance:** All AI-generated text explicitly identifies whether it was synthesized by IBM watsonx.ai Granite or deterministic rules.
3. **Anti-Abuse Safeguards:** Crowdsourced hazard submissions enforce driver reputation weighting, rate limits, and GPS proximity verification.
4. **Data Privacy:** Driver location coordinates are processed strictly for route impact calculations and never shared with third parties.

---

## 📄 License

Developed for the **KeralAI Grand Challenge 2026** (Challenge 5). Released under the [MIT License](LICENSE).
