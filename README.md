# NyayaNetra | Karnataka Police AI Copilot & Crime Intelligence Portal

NyayaNetra (ನ್ಯಾಯನೇತ್ರ) is a state-of-the-art, bilingual AI copilot and digital evidence analytics platform engineered for the Karnataka State Police. It integrates case management, suspect behavioral profiling, force-directed network entity resolution, and telemetry matching into a unified, accessible workspace.

---

## 🚀 Key Capabilities

### 1. Bilingual AI Copilot (English & Kannada)
* **Local Multilingual Vector Search (RAG)**: Uses `@xenova/transformers` with `Xenova/multilingual-e5-small` to generate 384-dimensional dense vector embeddings in Node.js memory for semantic matching across Kannada and English case files.
* **Top-K Vector Retrieval**: Extracts and ranks the top-8 most relevant suspect profiles, CDR cell tower records, and ANPR telemetry logs before querying the LLM.
* **Multi-Turn Dialogue Memory**: Maintains a sliding 6-turn conversation history (capped at 3,000 characters) for natural follow-up questions and anaphoric pronoun resolution (*e.g., "What is his risk score?"*).
* **Transparent Grounding & Security**: Strict zero-hallucination guardrails enforce answers derived exclusively from verified case context. Includes clickable citation chips and a "View prompt sent to model" inspector drawer.
* **Full-UI Localization**: Instant navbar toggle (`EN` / `ಕನ್ನಡ`) dynamically translates all navigation chrome, sidebar controls, buttons, and analytical metrics via `src/i18n/strings.js`.

### 2. Advanced Crime Analytics & Behavioral Profiling
* **Predictive Hotspot Index (BNSS Heuristic)**: Server-side explainable heuristic formula:
  $$\text{Score} = \text{clamp}(0.5 \times \text{CaseDensity} + 0.3 \times \text{RepeatOffenderRate} + 0.2 \times \text{RecentTrend}, 0, 100)$$
* **5 Populated Karnataka Districts**: Distinct, traceable intelligence baselines across **Bengaluru City** (71% High), **Mysuru** (37% Low), **Mangaluru** (72% High), **Hubballi-Dharwad** (49% Med), and **Belagavi** (57% Med).
* **Behavioral Profiling Match Engine**: Rule-based Modus Operandi (MO) similarity using deterministic Jaccard set intersection ($|A \cap B| / |A \cup B|$) over discrete criminal operating traits.
* **Cross-Case Network Graph**: Force-directed D3.js entity visualization with real-time cross-case entity resolution linking suspects across police stations using vector cosine similarity ($\ge 0.85$).

### 3. Judicial Reports & Evidence Integrity
* **Interactive Section Builder**: Allows officers to select synopsis, suspect rosters, and evidence logs for official printed dossiers.
* **SHA-256 Case Dossier Fingerprint**: Generates a deterministic SHA-256 cryptographic hash for each case file to ensure chain-of-custody verification in court filings.
* **Full Audit Trail**: Immutable logging of all authentication events (`AUTH_LOGIN`, `AUTH_SIGNUP`), entity mutations (`CASE_CREATE`, `SUSPECT_ADD`, `EVIDENCE_ADD`), and AI queries (`RAG_QUERY`).

---

## 🛠️ Technology Stack

| Layer | Technologies Used |
|---|---|
| **Frontend** | React 18 (Vite), Tailwind CSS, Framer Motion, D3.js Force Directed Graph, Lucide Icons |
| **Backend** | Node.js Express (CommonJS architecture) |
| **LLM Engine** | Groq Cloud API (`openai/gpt-oss-120b`, temperature `0.1`) with classical NLP fallback templates |
| **Vector Embeddings** | `@xenova/transformers` (`Xenova/multilingual-e5-small`, 384-dimensional dense vectors in-memory) |
| **Authentication & RBAC** | `bcrypt` password hashing (cost factor 12) + Role-Based Access Control (Admin / Officer) |
| **Integrity & Hashing** | Cryptographic SHA-256 dossier fingerprinting |
| **Database** | MongoDB (Mongoose Schema definition) with automatic fallback to local JSON database (`db_backend.json`) |
| **Voice & Audio** | Bhashini API integration with Web Speech STT/TTS fallback |

---

## 👮 Demo Login Credentials

| Role | Badge ID | Password | Scope & Access Permissions |
|---|---|---|---|
| **Station Inspector** *(Malleshwaram PS)* | `KA-02-7777` | `password123` | Active cases, AI Intelligence Chat, Network Map, Data Insights, PDF Reports |
| **State Admin** *(CID / SCRB HQ)* | `KA-CID-9999` | `password123` | Station governance, Officer approval/revocation, District Analytics |

---

## ⚠️ Known Limitations & Operational Scope

1. **Cell Tower & ANPR Telemetry**: Telemetry logs are simulated/seeded based on real Karnataka Police CDR/tower naming schemas (*e.g. `KA-BLR-N4`*); production deployments integrate with state telecom SFTP drops and CCTNS gateways.
2. **Audio Transcription & TTS**: Integrated with Bhashini API contracts; when external government API keys are offline or rate-limited, the system seamlessly falls back to standard Web Speech STT/TTS.
3. **Database Failover**: Runs on local JSON storage (`db_backend.json`) by default if `MONGODB_URI` is not configured, ensuring zero-configuration local evaluation.

---

## 🏃 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Backend Express Server
The server runs on port **5001** (avoiding AirPlay port conflict on macOS):
```bash
node server.cjs
```

### 3. Start the Frontend Development Server
The Dev server runs on port **3000** with a configured proxy to forward API queries:
```bash
npm run dev
```

### 4. Run Automated Smoke Test Suite
```bash
node scripts/smoke-test.mjs
```

### 5. Build for Production
To compile and bundle assets into production-ready static files:
```bash
npm run build
```

---

## 📄 Documentation Links

- **[System Self-Audit Report](docs/AUDIT-REPORT.md)**: Ground-truth scorecard across all 7 core claims with exact file:line citations.
- **[Changelog](CHANGELOG.md)**: Technical release notes and version history.
