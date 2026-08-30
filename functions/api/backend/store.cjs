const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { embedText } = require('./utils/embeddings.cjs');

function hashPassword(plain) {
  if (!plain) plain = 'password123';
  return crypto.createHash('sha256').update(plain).digest('hex');
}
const {
  Station,
  Profile,
  Case,
  Suspect,
  SuspectLink,
  EvidenceRecord,
  Conversation,
  Message,
  AuditLog
} = require('./models.cjs');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/nyayanetra';
const DB_FILE = process.env.DB_FILE_PATH || path.join(__dirname, '..', 'db_backend.json');

let isMongoConnected = false;

const KARNATAKA_DEFAULT_STATIONS = [
  { id: 'stn-blr-mll', name: 'Malleshwaram Police Station', district: 'Bengaluru City Police (West)' },
  { id: 'stn-blr-ind', name: 'Indiranagar Police Station', district: 'Bengaluru City Police (East)' },
  { id: 'stn-cid-hq', name: 'Cyber Crime PS (CID Headquarters)', district: 'CID Karnataka State HQ' },
  { id: 'stn-mys-ctl', name: 'Mysuru Central Police Station', district: 'Mysuru City Police' },
  { id: 'stn-hub-dwd', name: 'Hubballi-Dharwad Town PS', district: 'Hubballi-Dharwad Police' },
  { id: 'stn-mng-nth', name: 'Mangaluru North Police Station', district: 'Mangaluru City Police' }
];

const KARNATAKA_DEFAULT_PROFILES = [
  {
    id: 'usr-ka-08-2007',
    email: 'ka082007@nyayanetra.gov.in',
    full_name: 'Insp. B. Gowda',
    badge_id: 'ka-08-2007',
    role: 'investigator',
    station_id: 'stn-blr-mll',
    access_status: 'active',
    createdAt: '2026-08-01T00:00:00.000Z'
  },
  {
    id: 'usr-ka-04-9999',
    email: 'ka049999@nyayanetra.gov.in',
    full_name: 'Chief Officer Gowda',
    badge_id: 'KA-04-9999',
    role: 'admin',
    station_id: 'stn-cid-hq',
    access_status: 'active',
    createdAt: '2026-08-01T00:00:00.000Z'
  },
  {
    id: 'usr-ka-02-7777',
    email: 'ka027777@nyayanetra.gov.in',
    full_name: 'Inspector Gowda',
    badge_id: 'KA-02-7777',
    role: 'investigator',
    station_id: 'stn-blr-ind',
    access_status: 'active',
    createdAt: '2026-08-01T00:00:00.000Z'
  }
];

let localDb = {
  stations: [...KARNATAKA_DEFAULT_STATIONS],
  profiles: [...KARNATAKA_DEFAULT_PROFILES],
  cases: [],
  suspects: [],
  suspect_links: [],
  evidence_records: [],
  conversations: [],
  messages: [],
  audit_logs: []
};

// Load local JSON database if present
if (fs.existsSync(DB_FILE)) {
  try {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    localDb = JSON.parse(data);
    if (!localDb.stations || localDb.stations.length === 0) {
      localDb.stations = [...KARNATAKA_DEFAULT_STATIONS];
    }
    if (!localDb.profiles || localDb.profiles.length === 0) {
      localDb.profiles = [...KARNATAKA_DEFAULT_PROFILES];
    } else {
      // Ensure default demo badges exist
      for (const defP of KARNATAKA_DEFAULT_PROFILES) {
        if (!localDb.profiles.some(p => p.badge_id?.toLowerCase() === defP.badge_id.toLowerCase())) {
          localDb.profiles.push(defP);
        }
      }
    }
  } catch (e) {
    console.error('Failed to parse local JSON database file, starting clean with default profiles.', e);
  }
}

function saveLocalDB() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(localDb, null, 2));
  } catch (err) {
    console.warn('Notice: Local DB file write skipped or read-only environment:', err.message);
  }
}

// Ensure all profiles have hashed passwords
async function migrateProfilePasswords() {
  if (localDb.profiles && localDb.profiles.length > 0) {
    let modified = false;
    for (const p of localDb.profiles) {
      if (!p.password || p.password.startsWith('$2')) {
        const plain = 'password123';
        p.password = hashPassword(plain);
        modified = true;
      }
    }
    if (modified) {
      saveLocalDB();
    }
  }
}
migrateProfilePasswords().catch(err => console.error('Password migration error:', err));

// Unified Store Methods
const Store = {
  // Check if Mongo is connected (useful for status/diagnostics)
  getIsMongoConnected: () => isMongoConnected,

  // Save JSON fallback helper
  saveLocalDB,

  // Stations
  getStations: async () => {
    if (isMongoConnected) return await Station.find({});
    return localDb.stations;
  },
  addStation: async (data) => {
    if (isMongoConnected) {
      const station = new Station(data);
      return await station.save();
    }
    const newStation = { id: 'stn-' + Date.now(), ...data, createdAt: new Date() };
    localDb.stations.push(newStation);
    saveLocalDB();
    return newStation;
  },

  // Profiles
  findProfileByBadge: async (badge_id) => {
    if (isMongoConnected) return await Profile.findOne({ badge_id: new RegExp('^' + badge_id + '$', 'i') });
    return localDb.profiles.find(p => p.badge_id?.toLowerCase() === badge_id?.toLowerCase());
  },
  findProfileByEmail: async (email) => {
    if (isMongoConnected) return await Profile.findOne({ email });
    return localDb.profiles.find(p => p.email === email);
  },
  getProfiles: async () => {
    if (isMongoConnected) return await Profile.find({});
    return localDb.profiles;
  },
  addProfile: async (data) => {
    if (isMongoConnected) {
      const profile = new Profile(data);
      return await profile.save();
    }
    const newProfile = { id: 'usr-' + Date.now(), ...data, createdAt: new Date() };
    localDb.profiles.push(newProfile);
    saveLocalDB();
    return newProfile;
  },
  updateProfileStatus: async (id, status) => {
    if (isMongoConnected) {
      return await Profile.findByIdAndUpdate(id, { access_status: status }, { new: true });
    }
    const profile = localDb.profiles.find(p => p.id === id || p._id === id);
    if (profile) {
      profile.access_status = status;
      saveLocalDB();
    }
    return profile;
  },

  // Cases
  getCases: async () => {
    if (isMongoConnected) return await Case.find({});
    return localDb.cases;
  },
  addCase: async (data) => {
    if (!data.embedding || data.embedding.length === 0) {
      const summary = `FIR: ${data.fir_number} | Title: ${data.title} | Description: ${data.description || ''} | Status: ${data.status} | Priority: ${data.priority}`;
      data.embedding = await embedText(summary, false);
    }
    if (isMongoConnected) {
      const c = new Case(data);
      return await c.save();
    }
    const newCase = { id: 'case-' + Date.now(), ...data, createdAt: new Date() };
    localDb.cases.push(newCase);
    saveLocalDB();
    return newCase;
  },
  updateCaseStatus: async (id, status) => {
    if (isMongoConnected) {
      return await Case.findByIdAndUpdate(id, { status }, { new: true });
    }
    const c = localDb.cases.find(item => item.id === id || item._id === id);
    if (c) {
      c.status = status;
      saveLocalDB();
    }
    return c;
  },

  // Suspects
  getSuspects: async (caseId) => {
    if (isMongoConnected) {
      const query = caseId ? { case_id: caseId } : {};
      return await Suspect.find(query);
    }
    if (caseId) return localDb.suspects.filter(s => s.case_id === caseId);
    return localDb.suspects;
  },
  addSuspect: async (data) => {
    if (!data.embedding || data.embedding.length === 0) {
      const moStr = data.mo_tags?.length ? ` | Modus Operandi: ${data.mo_tags.join(', ')}` : '';
      const summary = `Suspect: ${data.name} | Aliases: ${data.aliases?.join(', ') || 'None'} | Risk Score: ${data.risk_score || 0}%${moStr}`;
      data.embedding = await embedText(summary, false);
    }
    if (isMongoConnected) {
      const s = new Suspect(data);
      return await s.save();
    }
    const s = { id: 'susp-' + Date.now(), ...data, createdAt: new Date() };
    localDb.suspects.push(s);
    saveLocalDB();
    return s;
  },

  // Suspect Links
  getLinks: async (caseId) => {
    if (isMongoConnected) {
      const query = caseId ? { case_id: caseId } : {};
      return await SuspectLink.find(query);
    }
    if (caseId) return localDb.suspect_links.filter(l => l.case_id === caseId);
    return localDb.suspect_links;
  },
  addLink: async (data) => {
    if (!data.embedding || data.embedding.length === 0) {
      const summary = `Suspect Association: ${data.link_type} | Detail: ${data.detail || 'None'}`;
      data.embedding = await embedText(summary, false);
    }
    if (isMongoConnected) {
      const l = new SuspectLink(data);
      return await l.save();
    }
    const l = { id: 'link-' + Date.now(), ...data, createdAt: new Date() };
    localDb.suspect_links.push(l);
    saveLocalDB();
    return l;
  },

  // Evidence Records
  getEvidence: async (caseId) => {
    if (isMongoConnected) {
      const query = caseId ? { case_id: caseId } : {};
      return await EvidenceRecord.find(query);
    }
    if (caseId) return localDb.evidence_records.filter(e => e.case_id === caseId);
    return localDb.evidence_records;
  },
  addEvidence: async (data) => {
    if (!data.embedding || data.embedding.length === 0) {
      const detailsStr = data.details?.notes || JSON.stringify(data.details || {});
      const summary = `Evidence Type: ${data.type} | Phone: ${data.phone_number || 'N/A'} | Cell Tower: ${data.cell_tower || 'N/A'} | Details: ${detailsStr}`;
      data.embedding = await embedText(summary, false);
    }
    if (isMongoConnected) {
      const e = new EvidenceRecord(data);
      return await e.save();
    }
    const e = { id: 'evid-' + Date.now(), ...data, createdAt: new Date() };
    localDb.evidence_records.push(e);
    saveLocalDB();
    return e;
  },

  // Conversations & Messages
  getConversations: async (userId) => {
    if (isMongoConnected) {
      const query = userId ? { user_id: userId } : {};
      return await Conversation.find(query);
    }
    if (userId) return localDb.conversations.filter(c => c.user_id === userId);
    return localDb.conversations;
  },
  addConversation: async (data) => {
    if (isMongoConnected) {
      const c = new Conversation(data);
      return await c.save();
    }
    const c = { id: 'conv-' + Date.now(), ...data, createdAt: new Date() };
    localDb.conversations.push(c);
    saveLocalDB();
    return c;
  },
  getMessages: async (conversationId) => {
    if (isMongoConnected) return await Message.find({ conversation_id: conversationId });
    return localDb.messages.filter(m => m.conversation_id === conversationId);
  },
  addMessage: async (data) => {
    if (isMongoConnected) {
      const m = new Message(data);
      return await m.save();
    }
    const m = { id: 'msg-' + Date.now(), ...data, createdAt: new Date() };
    localDb.messages.push(m);
    saveLocalDB();
    return m;
  },

  // Audit Logs
  getAuditLogs: async (userId, isAdmin) => {
    if (isMongoConnected) {
      const query = isAdmin ? {} : { user_id: userId };
      return await AuditLog.find(query).sort({ createdAt: -1 });
    }
    let logs = localDb.audit_logs;
    if (!isAdmin && userId) {
      logs = logs.filter(l => l.user_id === userId);
    }
    return logs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },
  addAuditLog: async (userId, action, targetTable, targetId = null, details = {}) => {
    const entry = {
      user_id: userId,
      action,
      target_table: targetTable,
      target_id: targetId,
      details,
      createdAt: new Date()
    };
    if (isMongoConnected) {
      const l = new AuditLog(entry);
      return await l.save();
    }
    entry.id = 'audit-' + Date.now();
    localDb.audit_logs.unshift(entry);
    saveLocalDB();
    return entry;
  }
};

// Seed default stations into MongoDB if empty
async function seedMongoDBStations() {
  const count = await Station.countDocuments();
  if (count === 0) {
    await Station.insertMany(KARNATAKA_DEFAULT_STATIONS);
    console.log('Seeded initial Karnataka police stations into MongoDB.');
  }
}

// Connect to MongoDB
mongoose.connect(MONGODB_URI, {
  serverSelectionTimeoutMS: 2000 // Quick timeout to fallback if mongod not running
}).then(async () => {
  isMongoConnected = true;
  console.log('MongoDB successfully connected at:', MONGODB_URI);
  await seedMongoDBStations();
}).catch(err => {
  console.warn('\nMongoDB connection refused. Falling back to local backend JSON database (db_backend.json).');
  console.warn('To use MongoDB, run a local database instance or set MONGODB_URI in your environment variables.\n');
  isMongoConnected = false;
});

module.exports = {
  Store,
  localDb
};
