# NyayaNetra | Karnataka Law Enforcement Portal

NyayaNetra is a state-of-the-art, AI-powered digital evidence and law enforcement analytics platform designed for the Karnataka State Police. It replaces siloed data inputs and manual reporting with an integrated, bilingual workspace for case management, suspect profiling, and telemetry matching.

## 🚀 Key Capabilities

### 1. Bilingual AI Copilot (English & Kannada)
* A local, sub-millisecond, grounded **Retrieval-Augmented Generation (RAG)** pipeline.
* Can synthesize case data and answer queries fluently in both **English** and **Kannada**.
* Enforces out-of-scope security filters, safely redirecting off-topic queries to active investigation records or general Indian law references.
* Features a collapsible **Layperson Glossary** to translate complex judicial terms (FIR, CDR, ANPR) instantly.

### 2. Advanced Crime Analytics Dashboard
* **District-Level Hotspot Drilldown**: Clickable geospatial selector mapping active cases, tower density logs, and risk levels across Bengaluru City, Mysuru, Mangaluru, Hubballi-Dharwad, and Belagavi.
* **Predictive Hotspot Index (BNSS Heuristic)**: Deterministic, explainable scoring index calculated server-side:
  $$\text{Score} = \text{clamp}(0.5 \times \text{CaseDensity} + 0.3 \times \text{RepeatOffenderRate} + 0.2 \times \text{RecentTrend}, 0, 100)$$
* **Behavioral Profiling Engine**: Explainable Modus Operandi (MO) similarity using deterministic Jaccard set intersection over discrete crime execution traits.
* **Cross-Case Network Graph**: Real-time multi-case entity resolution linking suspects across police stations using vector cosine similarity ($\ge 0.85$).

### 3. Interactive Report Section Builder & Print Generator
* Allows investigating officers to select exactly which sections (Synopsis, Suspect List, or Evidence Logs) to include in their official printed dossiers.
* Renders a premium, clean print layout tailored for court filings, complete with SHA-256 digital dossier integrity verification blocks.

---

## 🛠️ Technology Stack
* **Frontend**: React 18 (Vite), Tailwind CSS, Framer Motion, D3.js Force Directed Graph, Lucide Icons.
* **Backend**: Node.js Express (CommonJS architecture).
* **LLM Engine**: Groq Cloud API (`openai/gpt-oss-120b`, temperature `0.1`) with local fallback templates.
* **Vector Embeddings**: Local `@xenova/transformers` running `Xenova/multilingual-e5-small` generating 384-dimensional dense vectors in-memory (0 external API reliance for embeddings).
* **Multi-Turn Context**: 6-turn sliding conversation memory capped at 3,000 characters.
* **Database**: MongoDB (Mongoose Schema definition) with automatic local filesystem JSON database fallback (`db_backend.json`) when offline.
* **Security & Auth**: `bcrypt` password hashing (cost factor 12) and Role-Based Access Control (RBAC) separating State Admin (SCRB) from Station Officers.

---

## ⚠️ Known Limitations & Operational Scope
1. **Cell Tower & ANPR Telemetry**: Telemetry logs are simulated/seeded based on real Karnataka Police CDR/tower naming schemas (e.g. `KA-BLR-N4`); real-world deployment requires integration with state telecom/CCTNS gateways.
2. **Audio Transcription & TTS**: Integrated with Bhashini API contracts; when external government API keys are offline or rate-limited, the system seamlessly falls back to standard Web Speech STT/TTS.
3. **Database Architecture**: Runs on local JSON storage (`db_backend.json`) by default if `MONGODB_URI` is not configured, ensuring zero-configuration local evaluation.

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
