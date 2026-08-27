# NyayaNetra Changelog

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
