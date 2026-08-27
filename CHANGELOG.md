# NyayaNetra Changelog

## [Batch 1] - 2026-08-27: Critical Credibility Fixes (Tier 1)

- **Secure Password Hashing**: Integrated `bcrypt` with cost factor 12 across officer signup, login, and officer management flows, including an automatic one-time migration for legacy/seeded accounts.
- **Honest Token Meter**: Replaced hardcoded token numbers with real prompt and completion length estimations based on active Groq/RAG model responses.
- **Forensic Anti-Tampering Hash**: Replaced static hash placeholder with a deterministic SHA-256 hash computed over the actual case dossier payload (case file, suspects, evidence, and network links).
- **Honest Keyword Search**: Enhanced semantic search placeholder to compute actual relevance matching percentages against case titles, FIR numbers, and case summaries.
- **Dead Code & Client Cleanup**: Removed unused `rag.js`, deleted standalone SQL schema, renamed `supabase.js` to `api.js`, and updated all client-side service imports cleanly.
