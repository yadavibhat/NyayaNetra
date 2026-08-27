# NyayaNetra Changelog

## [Batch 3] - 2026-08-27: Cross-Case Network & AI Explainability (Tier 3)

- **Cross-Case Association Engine**: Created `/api/network/cross-case` using vector cosine similarity ($\ge 0.85$) over suspect profiles to reveal hidden multi-case criminal networks.
- **Dynamic Network Link Visualization**: Added a "Show cross-case links" toggle in Network View that dynamically merges cross-case entities using visually distinct dashed edges.
- **Collapsible Evidence Sources**: Surfaced top-k retrieved evidence chips with similarity match percentages under every AI Copilot response.
- **Inspect Model Prompt Drawer**: Added transparent model disclosure showing exact system prompts and database context fed into the LLM.
- **Preserved Default Visuals**: Ensured single-case network graph and chat interface render cleanly with explainability tools collapsed by default.

## [Batch 2] - 2026-08-27: Real Semantic Search & Local Vector RAG (Tier 2)

- **Local Multilingual Embeddings**: Integrated `@xenova/transformers` with `Xenova/multilingual-e5-small` running directly in Node.js for cross-lingual (English/Kannada) semantic matching.
- **Top-K Vector Retrieval**: Replaced full-context prompt dumping with top-8 cosine similarity ranking over suspects, evidence records, and network links.
- **Cross-Case Retrieval Scoping**: Added multi-case retrieval capability (`scope: 'all_my_cases'`) enabling cross-station criminal pattern discovery.
- **Automated Embedding Pipeline & Backfill**: Added real-time auto-embedding for case/suspect/evidence CRUD and ran initial backfill over all active records.
- **Live Semantic Search Binding**: Bound Advanced Console semantic search directly to vector similarity calculations across case files.

## [Batch 1] - 2026-08-27: Critical Credibility Fixes (Tier 1)

- **Secure Password Hashing**: Integrated `bcrypt` with cost factor 12 across officer signup, login, and officer management flows, including an automatic one-time migration for legacy/seeded accounts.
- **Honest Token Meter**: Replaced hardcoded token numbers with real prompt and completion length estimations based on active Groq/RAG model responses.
- **Forensic Anti-Tampering Hash**: Replaced static hash placeholder with a deterministic SHA-256 hash computed over the actual case dossier payload (case file, suspects, evidence, and network links).
- **Honest Keyword Search**: Enhanced semantic search placeholder to compute actual relevance matching percentages against case titles, FIR numbers, and case summaries.
- **Dead Code & Client Cleanup**: Removed unused `rag.js`, deleted standalone SQL schema, renamed `supabase.js` to `api.js`, and updated all client-side service imports cleanly.
