# NyayaNetra Technical Changelog & Release Notes

All notable changes to the NyayaNetra platform are documented in this file following strict semantic versioning standards.

---

## [v1.5.0] - Multi-Turn Context Memory, Dual-Language UI & Accessibility

### Added
- **Sliding Multi-Turn Conversation Memory**: Integrated conversational history tracking in `server.cjs` that passes recent dialogue turns (`user`/`assistant`) to the LLM ahead of grounded case context, enabling anaphoric pronoun resolution and multi-turn analytical drilldowns.
- **Full Kannada UI Localization Engine**: Built centralized dictionary (`src/i18n/strings.js`) and `LanguageContext` provider enabling real-time UI chrome translation across navigation bars, sidebars, forms, and analytical widgets.
- **Multi-Modal Risk Severity Indicators**: Paired all color-based threat indicators with descriptive text badges and visual status icons (`⚠️ High Threat`, `⚡ Moderate Threat`, `🛡️ Standard Threat`) across investigation views.
- **Accessibility & Motor Standards Compliance**: Enforced 44x44px minimum tap targets across all interactive controls and added explicit `aria-label` attributes to all icon-only buttons.

---

## [v1.4.0] - Modus Operandi Behavioral Profiling & Predictive Hotspot Index

### Added
- **Modus Operandi (MO) Trait Classification**: Implemented standardized MO behavioral tagging across suspect schemas and frontend registration modals using a fixed domain vocabulary.
- **Rule-Based Behavioral Profiling Match Engine**: Implemented `GET /api/profiling/similar-suspects` calculating deterministic Jaccard set similarity ($|A \cap B| / |A \cup B|$) over suspect operating traits.
- **Predictive Hotspot Index (BNSS Heuristic Formula)**: Deployed server-side scoring endpoint `GET /api/insights/hotspot-score` implementing the transparent formula:
  $$\text{Score} = \text{clamp}(0.5 \times \text{CaseDensity} + 0.3 \times \text{RepeatOffenderRate} + 0.2 \times \text{RecentTrend}, 0, 100)$$
- **Multi-District Intelligence Baseline**: Populated distinct, verifiable case, suspect, and radio mast telemetry across 5 Karnataka districts (Bengaluru City, Mysuru, Mangaluru, Hubballi-Dharwad, Belagavi).

---

## [v1.3.0] - Cross-Case Network Entity Resolution & Prompt Grounding Explainability

### Added
- **Cross-Case Entity Resolution Engine**: Built `GET /api/network/cross-case` using vector cosine similarity ($\ge 0.85$) over suspect profiles to identify shared aliases and multi-jurisdiction criminal networks.
- **Force-Directed Graph Visualization**: Implemented dynamic D3.js force simulation with toggleable dashed links for cross-case entity relationships.
- **Evidence Sources & Grounding Transparency**: Surfaced top-k retrieved evidence chips with similarity match percentages under every AI response alongside a raw system prompt inspection drawer.

---

## [v1.2.0] - Dense Vector Embeddings & Top-K Vector Retrieval (RAG)

### Added
- **In-Memory Multilingual Dense Vector Embeddings**: Integrated `@xenova/transformers` with `Xenova/multilingual-e5-small` to compute 384-dimensional dense vectors locally in Node.js memory.
- **Top-K Vector Retrieval Pipeline**: Replaced static context insertion with top-8 cosine similarity ranking over suspects, evidence records, and network links.
- **Cross-Case Retrieval Scoping**: Added multi-case retrieval capability (`scope: 'all_my_cases'`) enabling cross-station criminal pattern discovery.
- **Automated Embedding Pipeline**: Added real-time automated vector generation on case, suspect, and evidence record creation.

---

## [v1.1.0] - Bcrypt Authentication, Cryptographic Dossier Integrity & Token Meter

### Added
- **Bcrypt Password Encryption**: Implemented password hashing with `bcrypt` (cost factor 12) for officer registration and login authentication.
- **SHA-256 Case Dossier Cryptographic Hash**: Added deterministic SHA-256 fingerprint generation for case dossier verification and judicial chain of custody.
- **Execution Token & Latency Meter**: Added real-time token tracking and latency measurement for model inference and vector operations.
- **Role-Based Access Control (RBAC)**: Separated State Admin (SCRB Console) privileges from Station Officer operational workflows.
