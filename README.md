# NyayaNetra | Karnataka Law Enforcement Portal

NyayaNetra is a state-of-the-art, AI-powered digital evidence and law enforcement analytics platform designed for the Karnataka State Police. It replaces siloed data inputs and manual reporting with an integrated, bilingual workspace for case management, suspect profiling, and telemetry matching.

## 🚀 Key Capabilities

### 1. Bilingual AI Copilot (English & Kannada)
* A local, sub-millisecond, grounded **Retrieval-Augmented Generation (RAG)** pipeline.
* Can synthesize case data and answer queries fluently in both **English** and **Kannada**.
* Enforces out-of-scope security filters, safely redirecting off-topic queries to active investigation records or general Indian law references.
* Features a collapsible **Layperson Glossary** to translate complex judicial terms (FIR, CDR, ANPR) instantly.

### 2. Advanced Crime Analytics Dashboard
* **District-Level Hotspot Drilldown**: Clickable geospatial selector mapping active cases, tower density logs, and risk levels across Bengaluru City, Mysuru, Mangaluru, Hubballi, and Belagavi.
* **Socio-Economic Crime Correlation**: Measures local case density against external district indicators (Unemployment Rate, Urban Population Density, and Digital Literacy).
* **Active Anomaly Alerts**: Signal processing cards that auto-detect:
  * *Signal Co-location*: Multiple suspect handsets matched on the same tower within 45 seconds.
  * *IMEI Spoofing*: Devices cycling through multiple IMEI hardware identifiers.
* **Repeat Offender & Recidivism Tracking**: Computes historic recidivism index scores directly from prior CCTNS case records.

### 3. Interactive Report Section Builder & Print Generator
* Allows investigating officers to select exactly which sections (Synopsis, Suspect List, or Evidence Logs) to include in their official printed dossiers.
* Renders a premium, clean print layout tailored for court filings, complete with digital officer signature certification blocks.

---

## 🛠️ Technology Stack
* **Frontend**: React (Vite), Tailwind CSS (Forms & Container Queries), Framer Motion.
* **Backend**: Node.js Express.
* **Database**: MongoDB (Mongoose Schema definition) with automatic local filesystem JSON database fallback (`db_backend.json`) if the MongoDB instance is offline.
* **Security & Grounding**: Pre-trained heuristics-based classical NLP classifier.

---

## 🏃 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Backend Express Server
The server runs on port **5001** (avoiding AirPlay port conflict on macOS).
```bash
node server.cjs
```

### 3. Start the Frontend Development Server
The Dev server runs on port **3000** with a configured proxy to forward API queries.
```bash
npm run dev
```

### 4. Build for Production
To compile and bundle assets into production-ready static files:
```bash
npm run build
```
