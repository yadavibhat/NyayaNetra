// =========================================================
// MongoDB REST API client wrapper for NyayaNetra
// Connects dynamically to the Express server on port 5000 (via Vite proxy)
// =========================================================

const AUTH_KEY = 'nyayanetra_auth_session';

export function getStoredSession() {
  const session = localStorage.getItem(AUTH_KEY);
  return session ? JSON.parse(session) : null;
}

export function setStoredSession(session) {
  if (session) {
    localStorage.setItem(AUTH_KEY, JSON.stringify(session));
  } else {
    localStorage.removeItem(AUTH_KEY);
  }
}

export const dbService = {
  // Legacy getter compatibility
  getDB: () => ({
    stations: [],
    profiles: [],
    cases: [],
    suspects: [],
    suspect_links: [],
    evidence_records: [],
    conversations: [],
    messages: [],
    audit_logs: []
  }),

  // Auth & Profiles
  signup: async ({ email, password, full_name, badge_id, role, station_id }) => {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, full_name, badge_id, role, station_id })
    });
    if (!res.ok) throw new Error(await res.text());
    const session = await res.json();
    setStoredSession(session);
    return session;
  },

  login: async ({ email, badge_id, password }) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, badge_id, password })
    });
    if (!res.ok) throw new Error(await res.text());
    const session = await res.json();
    setStoredSession(session);
    return session;
  },

  logout: async (userId) => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
    } catch (e) {
      console.warn('Logout api failed', e);
    }
    setStoredSession(null);
  },

  // Officers Roster & Admin
  getOfficers: async (currentUser) => {
    const res = await fetch('/api/officers');
    if (!res.ok) throw new Error(await res.text());
    const officers = await res.json();
    if (!currentUser || currentUser.profile.role !== 'admin') {
      const currentUserId = currentUser?.profile?.id || currentUser?.profile?._id;
      return officers.filter(p => p.id === currentUserId || p._id === currentUserId);
    }
    return officers;
  },

  addOfficer: async (currentUser, officerData) => {
    const res = await fetch('/api/officers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentUser, officerData })
    });
    if (!res.ok) throw new Error(await res.text());
    return await res.json();
  },

  approveOfficer: async (currentUser, officerId) => {
    const res = await fetch(`/api/officers/${officerId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentUser })
    });
    if (!res.ok) throw new Error(await res.text());
    return await res.json();
  },

  revokeOfficer: async (currentUser, officerId) => {
    const res = await fetch(`/api/officers/${officerId}/revoke`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentUser })
    });
    if (!res.ok) throw new Error(await res.text());
    return await res.json();
  },

  // Stations
  getStations: async () => {
    const res = await fetch('/api/stations');
    if (!res.ok) throw new Error(await res.text());
    return await res.json();
  },

  addStation: async (currentUser, { name, district }) => {
    const res = await fetch('/api/stations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, district, currentUser })
    });
    if (!res.ok) throw new Error(await res.text());
    return await res.json();
  },

  // Cases / FIRs
  getCases: async (currentUser) => {
    const res = await fetch('/api/cases');
    if (!res.ok) throw new Error(await res.text());
    const cases = await res.json();
    return cases;
  },

  addCase: async (currentUser, caseData) => {
    const res = await fetch('/api/cases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fir_number: caseData.fir_number,
        station_id: caseData.station_id || currentUser?.profile?.station_id,
        title: caseData.title,
        description: caseData.description || '',
        status: caseData.status || 'open',
        priority: caseData.priority || 'medium',
        created_by: currentUser?.profile?.id || currentUser?.profile?._id || 'sys-admin',
        currentUser
      })
    });
    if (!res.ok) throw new Error(await res.text());
    return await res.json();
  },

  updateCaseStatus: async (currentUser, caseId, status) => {
    const res = await fetch(`/api/cases/${caseId}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, currentUser })
    });
    if (!res.ok) throw new Error(await res.text());
    return await res.json();
  },

  // Suspects & Links
  getSuspects: async (caseId) => {
    const url = caseId ? `/api/suspects?caseId=${caseId}` : '/api/suspects';
    const res = await fetch(url);
    if (!res.ok) throw new Error(await res.text());
    return await res.json();
  },

  addSuspect: async (currentUser, suspectData) => {
    const res = await fetch('/api/suspects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        case_id: suspectData.case_id,
        name: suspectData.name,
        aliases: suspectData.aliases || [],
        risk_score: suspectData.risk_score !== null && suspectData.risk_score !== undefined ? Number(suspectData.risk_score) : null,
        image_url: suspectData.image_url || null,
        created_by: currentUser?.profile?.id || currentUser?.profile?._id || 'sys-admin',
        currentUser
      })
    });
    if (!res.ok) throw new Error(await res.text());
    return await res.json();
  },

  getSuspectLinks: async (caseId) => {
    const url = caseId ? `/api/links?caseId=${caseId}` : '/api/links';
    const res = await fetch(url);
    if (!res.ok) throw new Error(await res.text());
    return await res.json();
  },

  addSuspectLink: async (currentUser, linkData) => {
    const res = await fetch('/api/links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        case_id: linkData.case_id,
        suspect_a_id: linkData.suspect_a_id,
        suspect_b_id: linkData.suspect_b_id,
        link_type: linkData.link_type,
        detail: linkData.detail || '',
        created_by: currentUser?.profile?.id || currentUser?.profile?._id || 'sys-admin',
        currentUser
      })
    });
    if (!res.ok) throw new Error(await res.text());
    return await res.json();
  },

  // Evidence Records
  getEvidence: async (caseId) => {
    const url = caseId ? `/api/evidence?caseId=${caseId}` : '/api/evidence';
    const res = await fetch(url);
    if (!res.ok) throw new Error(await res.text());
    return await res.json();
  },

  addEvidence: async (currentUser, evidenceData) => {
    const res = await fetch('/api/evidence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        case_id: evidenceData.case_id,
        suspect_id: evidenceData.suspect_id || null,
        type: evidenceData.type || 'cdr',
        cell_tower: evidenceData.cell_tower || '',
        phone_number: evidenceData.phone_number || '',
        captured_at: evidenceData.captured_at || new Date().toISOString(),
        image_url: evidenceData.image_url || null,
        details: evidenceData.details || {},
        created_by: currentUser?.profile?.id || currentUser?.profile?._id || 'sys-admin',
        currentUser
      })
    });
    if (!res.ok) throw new Error(await res.text());
    return await res.json();
  },

  // Conversations & Messages
  getConversations: async (currentUser) => {
    if (!currentUser) return [];
    const currentUserId = currentUser.profile.id || currentUser.profile._id;
    const res = await fetch(`/api/conversations?userId=${currentUserId}`);
    if (!res.ok) throw new Error(await res.text());
    return await res.json();
  },

  createConversation: async (currentUser, caseId = null, title = 'New Investigation') => {
    const currentUserId = currentUser.profile.id || currentUser.profile._id;
    const res = await fetch('/api/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ case_id: caseId, user_id: currentUserId, title })
    });
    if (!res.ok) throw new Error(await res.text());
    return await res.json();
  },

  getMessages: async (conversationId) => {
    const res = await fetch(`/api/messages?conversationId=${conversationId}`);
    if (!res.ok) throw new Error(await res.text());
    return await res.json();
  },

  // Audit Logs
  getAuditLogs: async (currentUser) => {
    if (!currentUser) return [];
    const currentUserId = currentUser.profile.id || currentUser.profile._id;
    const res = await fetch(`/api/audit-logs?userId=${currentUserId}&role=${currentUser.profile.role}`);
    if (!res.ok) throw new Error(await res.text());
    return await res.json();
  },

  // Overview Stats
  getOverviewStats: async () => {
    const res = await fetch('/api/stats');
    if (!res.ok) throw new Error(await res.text());
    return await res.json();
  },

  // Seeding
  seedSampleData: async (adminUserId) => {
    const res = await fetch('/api/seed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminUserId })
    });
    if (!res.ok) throw new Error(await res.text());
    return await res.json();
  }
};
