# NyayaNetra — Endpoint Map
Every row ties a real UI element (from the Stitch pages) to a real backend action. Nothing on this list is decorative.

## Auth
| Endpoint | Method | Triggered by | Does |
|---|---|---|---|
| `/auth/login` | POST | Login form (index.html) | Supabase Auth sign-in |
| `/auth/logout` | POST | "Sign Out" / "Logout" | Ends session |
| `/auth/request-reset` | POST | reset-token.html form | Sends reset email via Supabase Auth |
| `/auth/confirm-reset` | POST | reset-token.html confirm | Sets new password |

## Officers & Access (admin.html)
| Endpoint | Method | Triggered by | Does |
|---|---|---|---|
| `/api/officers` | GET | Roster table load | Lists `profiles` for admin's jurisdiction |
| `/api/officers` | POST | "Add Officer" | Inserts a `profiles` row, status `pending` |
| `/api/officers/:id/approve` | PATCH | "Approve Access" | Sets `access_status = active`, writes `audit_logs` |
| `/api/officers/:id/revoke` | PATCH | Revoke action | Sets `access_status = revoked`, writes `audit_logs` |
| `/api/officers/:id/audit` | GET | "Inspect Audit" | Pulls that officer's `audit_logs` rows |
| `/api/stats/overview` | GET | Top KPI cards (Active Officers, FIR count, High Priority, Pending Approvals) | Live aggregate counts, not hardcoded numbers |

## Cases / FIRs
| Endpoint | Method | Triggered by | Does |
|---|---|---|---|
| `/api/cases` | GET | Sidebar "Karnataka FIR Files" list | Lists cases scoped to investigator's station |
| `/api/cases` | POST | "New Investigation" / "New Case Inquiry" | Creates a `cases` row, prompts for real FIR number |
| `/api/cases/:id` | GET | Selecting a case in sidebar | Loads case detail |
| `/api/cases/:id` | PATCH | Status change actions | Updates case status |

## Suspects & Network Graph (network.html)
| Endpoint | Method | Triggered by | Does |
|---|---|---|---|
| `/api/cases/:id/network` | GET | Network Map page load, "Recenter" | Returns real nodes (`suspects`) + edges (`suspect_links`) for that case |
| `/api/suspects` | POST | "Add Suspect" (new form, not in current mockup — needs adding) | Inserts a `suspects` row |
| `/api/suspects/:id` | GET | Clicking a node ("open forensic dossier") | Loads suspect detail + linked evidence |
| `/api/suspect-links` | POST | "Add Link" (new form) | Inserts a `suspect_links` row (cdr_call / anpr / secondary_associate) |
| `/api/network/filters` | GET (client-side filter) | "Filters" button | Filters rendered graph by link_type/date — no server call needed if data already loaded |

## Evidence / CDR
| Endpoint | Method | Triggered by | Does |
|---|---|---|---|
| `/api/evidence` | POST | "Add Evidence/CDR Entry" (new form) | Inserts `evidence_records` row |
| `/api/cases/:id/evidence` | GET | Case detail / chat context | Lists evidence for a case |

## Chat / RAG (chat.html)
| Endpoint | Method | Triggered by | Does |
|---|---|---|---|
| `/api/conversations` | POST | "New Investigation" (chat sidebar) | Creates a `conversations` row |
| `/api/conversations` | GET | Sidebar history list | Lists user's past conversations |
| `/api/conversations/:id/messages` | GET | Opening a conversation | Loads message history |
| `/api/conversations/:id/messages` | POST | Sending a chat message | Runs RAG: embed query → retrieve matching `cases`/`suspects`/`evidence_records` → call LLM with retrieved context → store + return grounded answer, real `confidence_score`, real `cited_record_ids` |
| `/api/voice/stt` | POST | Mic button | Speech-to-text (client Web Speech API preferred; server fallback for Kannada if browser support is weak) |
| `/api/voice/tts` | POST | Assistant reply rendered | Text-to-speech in the active language (en/kn), returns audio to play |

## PDF Export (pdf-export.html)
| Endpoint | Method | Triggered by | Does |
|---|---|---|---|
| `/api/cases/:id/export-pdf` | GET | "PDF Report" / export button | Server-renders the judicial dossier from the *current* case's real data — no fixed template values |

## Audit Log (audit-log.html)
| Endpoint | Method | Triggered by | Does |
|---|---|---|---|
| `/api/audit-logs` | GET | Page load (admin only, enforced by RLS) | Real chronological log of logins, queries, approvals, exports |

## System Status (system-status.html)
| Endpoint | Method | Triggered by | Does |
|---|---|---|---|
| `/api/system/status` | GET | Page load | Real health check: DB reachable, LLM reachable, last sync time — not a static "Active" badge |

---
### Gaps in the current Stitch mockup to close
The current pages don't yet have UI for **adding a suspect**, **adding a suspect link**, or **adding an evidence/CDR record** — those are the forms that make the app actually usable end-to-end. Add them as modals/forms in the same visual style (white card, navy/gold, thin borders) reachable from "New Case Inquiry" and the Network Map toolbar.
