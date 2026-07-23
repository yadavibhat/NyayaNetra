const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/nyayanetra';

app.use(cors());
app.use(express.json());

// =========================================================
// MongoDB Mongoose Models
// =========================================================

const StationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  district: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});
const Station = mongoose.model('Station', StationSchema);

const ProfileSchema = new mongoose.Schema({
  email: { type: String, required: true },
  full_name: { type: String, required: true },
  badge_id: { type: String, required: true, unique: true },
  role: { type: String, enum: ['investigator', 'admin'], default: 'investigator' },
  station_id: { type: String, default: null },
  access_status: { type: String, enum: ['pending', 'active', 'revoked'], default: 'active' },
  createdAt: { type: Date, default: Date.now }
});
const Profile = mongoose.model('Profile', ProfileSchema);

const CaseSchema = new mongoose.Schema({
  fir_number: { type: String, required: true, unique: true },
  station_id: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  status: { type: String, enum: ['open', 'under_review', 'closed'], default: 'open' },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  created_by: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});
const Case = mongoose.model('Case', CaseSchema);

const SuspectSchema = new mongoose.Schema({
  case_id: { type: String, required: true },
  name: { type: String, required: true },
  aliases: { type: [String], default: [] },
  risk_score: { type: Number, min: 0, max: 100, default: null },
  image_url: { type: String, default: null },
  created_by: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});
const Suspect = mongoose.model('Suspect', SuspectSchema);

const SuspectLinkSchema = new mongoose.Schema({
  case_id: { type: String, required: true },
  suspect_a_id: { type: String, required: true },
  suspect_b_id: { type: String, required: true },
  link_type: { type: String, enum: ['cdr_call', 'anpr', 'secondary_associate'], required: true },
  detail: { type: String, default: '' },
  created_by: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});
const SuspectLink = mongoose.model('SuspectLink', SuspectLinkSchema);

const EvidenceRecordSchema = new mongoose.Schema({
  case_id: { type: String, required: true },
  suspect_id: { type: String, default: null },
  type: { type: String, enum: ['cdr', 'anpr', 'document', 'other'], default: 'cdr' },
  cell_tower: { type: String, default: '' },
  phone_number: { type: String, default: '' },
  captured_at: { type: Date, required: true },
  image_url: { type: String, default: null },
  details: { type: mongoose.Schema.Types.Mixed, default: {} },
  created_by: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});
const EvidenceRecord = mongoose.model('EvidenceRecord', EvidenceRecordSchema);

const ConversationSchema = new mongoose.Schema({
  case_id: { type: String, default: null },
  user_id: { type: String, required: true },
  title: { type: String, default: 'New Investigation' },
  createdAt: { type: Date, default: Date.now }
});
const Conversation = mongoose.model('Conversation', ConversationSchema);

const MessageSchema = new mongoose.Schema({
  conversation_id: { type: String, required: true },
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true },
  language: { type: String, enum: ['en', 'kn'], default: 'en' },
  cited_record_ids: { type: [String], default: [] },
  confidence_score: { type: Number, default: null },
  createdAt: { type: Date, default: Date.now }
});
const Message = mongoose.model('Message', MessageSchema);

const AuditLogSchema = new mongoose.Schema({
  user_id: { type: String, default: null },
  action: { type: String, required: true },
  target_table: { type: String, required: true },
  target_id: { type: String, default: null },
  details: { type: mongoose.Schema.Types.Mixed, default: {} },
  createdAt: { type: Date, default: Date.now }
});
const AuditLog = mongoose.model('AuditLog', AuditLogSchema);


// =========================================================
// Data Store Selection (MongoDB or Disk-based JSON Fallback)
// =========================================================

let isMongoConnected = false;
const DB_FILE = path.join(__dirname, 'db_backend.json');

const KARNATAKA_DEFAULT_STATIONS = [
  { id: 'stn-blr-mll', name: 'Malleshwaram Police Station', district: 'Bengaluru City Police (West)' },
  { id: 'stn-blr-ind', name: 'Indiranagar Police Station', district: 'Bengaluru City Police (East)' },
  { id: 'stn-cid-hq', name: 'Cyber Crime PS (CID Headquarters)', district: 'CID Karnataka State HQ' },
  { id: 'stn-mys-ctl', name: 'Mysuru Central Police Station', district: 'Mysuru City Police' },
  { id: 'stn-hub-dwd', name: 'Hubballi-Dharwad Town PS', district: 'Hubballi-Dharwad Police' },
  { id: 'stn-mng-nth', name: 'Mangaluru North Police Station', district: 'Mangaluru City Police' }
];

let localDb = {
  stations: [...KARNATAKA_DEFAULT_STATIONS],
  profiles: [],
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
  } catch (e) {
    console.error('Failed to parse local JSON database file, starting clean.', e);
  }
}

function saveLocalDB() {
  fs.writeFileSync(DB_FILE, JSON.stringify(localDb, null, 2));
}

// Unified Store Methods
const Store = {
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


// =========================================================
// Smart Classical NLP RAG Pipeline
// =========================================================

const IndianPoliceCrimeKB = [
  {
    keywords: /bns|ipc|law|bhartiya|bhara|sanhita/i,
    title: "Bharatiya Nyaya Sanhita (BNS) & IPC Reference",
    en: "The Bharatiya Nyaya Sanhita (BNS) replaced the Indian Penal Code (IPC) on July 1, 2024. Key sections include:\n- Section 103 (Murder, formerly IPC 302)\n- Section 303 (Theft, formerly IPC 378/379)\n- Section 318 (Cheating, formerly IPC 420)\n- Section 74 (Assault on woman, formerly IPC 354). All case files register offences under these new acts.",
    kn: "ಭಾರತೀಯ ನ್ಯಾಯ ಸಂಹಿತೆ (BNS) ಭಾರತೀಯ ದಂಡ ಸಂಹಿತೆಯನ್ನು (IPC) ಜುಲೈ 1, 2024 ರಿಂದ ಬದಲಾಯಿಸಿದೆ. ಪ್ರಮುಖ ಸೆಕ್ಷನ್‌ಗಳು:\n- ಸೆಕ್ಷನ್ 103 (ಕೊಲೆ, ಹಳೆಯ IPC 302)\n- ಸೆಕ್ಷನ್ 303 (ಕಳ್ಳತನ, ಹಳೆಯ IPC 378/379)\n- ಸೆಕ್ಷನ್ 318 (ವಂಚನೆ, ಹಳೆಯ IPC 420)\n- ಸೆಕ್ಷನ್ 74 (ಮಹಿಳೆಯ ಮೇಲಿನ ದೌರ್ಜನ್ಯ, ಹಳೆಯ IPC 354)."
  },
  {
    keywords: /bnss|crpc|arrest|bail|warrant|rights/i,
    title: "Police Arrest, Bail & Investigation Procedures (BNSS/CrPC)",
    en: "Under the Bharatiya Nagarik Suraksha Sanhita (BNSS, formerly CrPC), key guidelines specify:\n- Section 35 (Arrest procedure & rights of the arrested person)\n- Section 438/482 (Anticipatory bail applications)\n- Section 173 (Compulsory registration of FIR, including e-FIR option). Investigators must log all digitised audit data securely.",
    kn: "ಭಾರತೀಯ ನಾಗರಿಕ ಸುರಕ್ಷಾ ಸಂಹಿತೆ (BNSS) ಅಡಿಯಲ್ಲಿ ತನಿಖಾ ನಿಯಮಗಳು:\n- ಸೆಕ್ಷನ್ 35 (ಬಂಧನದ ಪ್ರಕ್ರಿಯೆ ಮತ್ತು ಹಕ್ಕುಗಳು)\n- ಸೆಕ್ಷನ್ 438/482 (ಮುಂಗಡ ಜಾಮೀನು ಅರ್ಜಿಗಳು)\n- ಸೆಕ್ಷನ್ 173 (ಎಫ್‌ಐಆರ್ ಕಡ್ಡಾಯ ದಾಖಲಾತಿ, ಇ-ಎಫ್‌ಐಆರ್ ಸೌಲಭ್ಯ)."
  },
  {
    keywords: /bsa|evidence|admissibility|65b|section 63/i,
    title: "Digital Evidence Admissibility (BSA & Indian Evidence Act)",
    en: "The Bharatiya Sakshya Adhiniyam (BSA, formerly Indian Evidence Act) defines digital evidence rules:\n- Section 63 (Admissibility of electronic records, replacing IPC Section 65B)\n- Requires a signed digital certificate from the officer in charge to authenticate phone records (CDR), ANPR logs, or server logs in court.",
    kn: "ಭಾರತೀಯ ಸಾಕ್ಷ್ಯ ಅಧಿನಿಯಮ (BSA) ಅಡಿಯಲ್ಲಿ ಡಿಜಿಟಲ್ ಸಾಕ್ಷ್ಯಗಳ ನಿಯಮಗಳು:\n- ಸೆಕ್ಷನ್ 63 (ಎಲೆಕ್ಟ್ರಾನಿಕ್ ದಾಖಲೆಗಳ ಸ್ವೀಕಾರಾರ್ಹತೆ, ಹಳೆಯ 65B ಬದಲಿಗೆ)\n- ಕರೆ ದಾಖಲೆಗಳು (CDR), ಕ್ಯಾಮೆರಾ ದಾಖಲೆಗಳನ್ನು ನ್ಯಾಯಾಲಯದಲ್ಲಿ ಸಾಬೀತುಪಡಿಸಲು ಅಧಿಕಾರಿಯ ಸಹಿ ಇರುವ ಡಿಜಿಟಲ್ ಪ್ರಮಾಣಪತ್ರ ಅಗತ್ಯವಿದೆ."
  },
  {
    keywords: /cyber|phishing|scam|fraud|jamtara|online/i,
    title: "Cyber Crime Trends in India",
    en: "Common cyber crimes in India include:\n- Phishing and financial OTP frauds\n- Aadhaar Enabled Payment System (AePS) scams\n- Part-time job task frauds. Karnataka State Police runs the 1930 Cyber helpline for instant banking freezes.",
    kn: "ಭಾರತದಲ್ಲಿನ ಸೈಬರ್ ಅಪರಾಧದ ಪ್ರಮುಖ ಪ್ರವೃತ್ತಿಗಳು:\n- ಫಿಶಿಂಗ್ ಮತ್ತು ಒಟಿಪಿ (OTP) ಬ್ಯಾಂಕಿಂಗ್ ವಂಚನೆಗಳು\n- ಆಧಾರ ಪಾವತಿ ವ್ಯವಸ್ಥೆ (AePS) ವಂಚನೆಗಳು\n- ಪಾರ್ಟ್-ಟೈಮ್ ಕೆಲಸದ ಆಮಿಷದ ವಂಚನೆಗಳು. ಕರ್ನಾಟಕ ಪೊಲೀಸ್ ತಕ್ಷಣದ ಹಣ ತಡೆಹಿಡಿಯಲು 1930 ಸಹಾಯವಾಣಿ ನಡೆಸುತ್ತಿದೆ."
  },
  {
    keywords: /karnataka|police|scrb|dgp|bangalore|commissioner/i,
    title: "Karnataka State Police Administration",
    en: "Karnataka State Police is governed by the Police Act and led by the DGP & IGP. Major units include:\n- SCRB (State Crime Records Bureau) managing CCTNS data\n- CID (Criminal Investigation Department) for complex financial/homicide crimes\n- Cyber Police wings in major Commissionerates.",
    kn: "ಕರ್ನಾಟಕ ರಾಜ್ಯ ಪೊಲೀಸ್ ಆಡಳಿತ ವ್ಯವಸ್ಥೆ:\n- ಕರ್ನಾಟಕ ರಾಜ್ಯ ಪೊಲೀಸ್ ಮುಖ್ಯಸ್ಥರು ಡಿಜಿಪಿ ಮತ್ತು ಐಜಿಪಿ ಆಗಿರುತ್ತಾರೆ.\n- ಎಸ್‌ಸಿಆರ್‌ಬಿ (SCRB) ರಾಜ್ಯದ ಅಪರಾಧ ದಾಖಲೆಗಳನ್ನು ನಿರ್ವಹಿಸುತ್ತದೆ.\n- ಸಿಐಡಿ (CID) ಸಂಕೀರ್ಣ ಅಪರಾಧಗಳ ತನಿಖೆ ನಡೆಸುತ್ತದೆ."
  }
];

async function generateLocalAIResponse(query, caseId, language = 'en') {
  const cases = await Store.getCases();
  const allSuspects = await Store.getSuspects(caseId);
  const allEvidence = await Store.getEvidence(caseId);
  const allLinks = await Store.getLinks(caseId);

  const queryLower = query.toLowerCase();

  // 1. Check Indian Law & Police Knowledge Base first
  let kbMatch = null;
  for (const entry of IndianPoliceCrimeKB) {
    if (entry.keywords.test(queryLower)) {
      kbMatch = entry;
      break;
    }
  }

  const isGeneralIndiaPoliceCrimeQuery = /india|crime|police|procedure|law|court|criminal|lawyer|bns|bnss|bsa|ipc|crpc|ಸಾಕ್ಷ್ಯ|ಕಾನೂನು|ಅಪರಾಧ/i.test(queryLower);

  // 2. Keyword Intents classification (supporting both English and Kannada keywords)
  const isSuspectQuery = /suspect|who|person|people|offender|risk|aliases|ಶಂಕಿತರು|ಯಾರು|ವ್ಯಕ್ತಿ|ಹೆಸರು|ರೋಸ್ಟರ್/i.test(queryLower);
  const isCdrQuery = /cdr|call|phone|mobile|number|tower|signal|ಮೊಬೈಲ್|ಫೋನ್|ಕರೆ|ಕನೆಕ್ಷನ್|ಟವರ್|ಕಾಲ್|ನಂಬರ್/i.test(queryLower);
  const isNetworkQuery = /network|link|connection|relationship|associate|ಲಿಂಕ್|ಸಂಬಂಧ|ಸಂಪರ್ಕ|ನೆಟ್‌ವರ್ಕ್/i.test(queryLower);
  const isSummaryQuery = /summary|overview|details|fir|briefing|ಸಾರಾಂಶ|ಮಾಹಿತಿ|ಪ್ರಕರಣ/i.test(queryLower);
  const isGenericCaseQuery = /case|file|fir|record|data|info|pratishtha|ವರದಿ|ದಾಖಲೆ|ಪ್ರಕರಣ|ಸಹಾಯ/i.test(queryLower);

  // 2. Entity Extraction
  const matchedSuspects = allSuspects.filter(s => 
    queryLower.includes(s.name.toLowerCase()) || 
    s.aliases.some(a => queryLower.includes(a.toLowerCase()))
  );

  const matchedEvidence = allEvidence.filter(e => 
    (e.phone_number && queryLower.includes(e.phone_number)) ||
    (e.cell_tower && queryLower.includes(e.cell_tower.toLowerCase()))
  );

  // 3. Check for out-of-scope queries
  const isOutOfScope = !isSuspectQuery && !isCdrQuery && !isNetworkQuery && !isSummaryQuery && !isGenericCaseQuery && matchedSuspects.length === 0 && matchedEvidence.length === 0;

  // 4. Document Retrieval
  let citations = [];
  let answer = "";
  let confidenceScore = 85;

  const targetCase = cases.find(c => c.id === caseId || c._id?.toString() === caseId) || cases[0];
  if (!targetCase) {
    return {
      answer: language === 'kn' 
        ? "ದತ್ತಸಂಚಯದಲ್ಲಿ ಯಾವುದೇ ಸಕ್ರಿಯ ಪ್ರಕರಣ ಸಿಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಹೊಸ ಪ್ರಕರಣವನ್ನು ದಾಖಲಿಸಿ." 
        : "No active case found in the database. Please register a case file to run queries.",
      confidenceScore: 0,
      citedRecordIds: []
    };
  }

  citations.push(targetCase.id || targetCase._id.toString());

  // NLP synthesis block
  if (language === 'kn') {
    if (kbMatch) {
      confidenceScore = 98;
      answer = `ಉಲ್ಲೇಖ: ${kbMatch.title}\n\n${kbMatch.kn}`;
    } else if (isGeneralIndiaPoliceCrimeQuery) {
      confidenceScore = 90;
      answer = "ಭಾರತೀಯ ಕಾನೂನು ಜಾರಿ ಮತ್ತು ಅಪರಾಧ ತನಿಖಾ ಉಲ್ಲೇಖ:\n- ಭಾರತದಲ್ಲಿ ಜುಲೈ 2024 ರಿಂದ ಹೊಸ ಕಾನೂನುಗಳು (BNS, BNSS, BSA) ಜಾರಿಗೆ ಬಂದಿವೆ.\n- ಡಿಜಿಟಲ್ ಸಾಕ್ಷ್ಯಗಳನ್ನು (ಕರೆ ದಾಖಲೆಗಳು ಮತ್ತು ವಾಹನ ಪ್ಲೇಟ್ ಸ್ಕ್ಯಾನ್) ಬಿಎಸ್ಎ ಸೆಕ್ಷನ್ 63 ಅಡಿಯಲ್ಲಿ ನ್ಯಾಯಾಲಯದಲ್ಲಿ ಸಲ್ಲಿಸಬಹುದು.\n- ಹೆಚ್ಚಿನ ಮಾಹಿತಿಗೆ 'BNS', 'BNSS', 'BSA', ಅಥವಾ 'ಸೈಬರ್ ಅಪರಾಧ' ಎಂದು ಪ್ರಶ್ನಿಸಿ.";
    } else if (isOutOfScope) {
      confidenceScore = 100;
      answer = "ನಾನು ಸುರಕ್ಷಿತ ತನಿಖಾ ಸಹಾಯಕರಾಗಿದ್ದೇನೆ. ಸಕ್ರಿಯ ಪ್ರಕರಣದ ಮಾಹಿತಿ (FIR), ಶಂಕಿತರ ವಿವರಗಳು, ಫೋನ್ ಕರೆ ದಾಖಲೆಗಳು (CDR) ಅಥವಾ ವಾಹನ ಕ್ಯಾಮೆರಾ (ANPR) ಸಾಕ್ಷ್ಯಗಳಿಗೆ ಸಂಬಂಧಿಸಿದ ಪ್ರಶ್ನೆಗಳಿಗೆ ಮಾತ್ರ ನಾನು ಉತ್ತರಿಸಬಲ್ಲೆ. ದಯವಿಟ್ಟು ನಿಮ್ಮ ತನಿಖೆಗೆ ಸಂಬಂಧಿಸಿದ ಪ್ರಶ್ನೆಯನ್ನು ಕೇಳಿ.";
    } else if (isSuspectQuery) {
      if (matchedSuspects.length > 0) {
        confidenceScore = 95;
        answer = `ಪ್ರಕರಣದಲ್ಲಿ ಪತ್ತೆಯಾದ ಶಂಕಿತರ ವಿವರಗಳು ಹೀಗಿವೆ:\n`;
        matchedSuspects.forEach(s => {
          const idStr = s.id || s._id.toString();
          citations.push(idStr);
          const relatedLinks = allLinks.filter(l => l.suspect_a_id === idStr || l.suspect_b_id === idStr);
          answer += `• ${s.name} (ಇತರ ಹೆಸರುಗಳು: ${s.aliases?.join(', ') || 'ಯಾವುದೂ ಇಲ್ಲ'}) ಅವರ ಅಪಾಯದ ಪ್ರಮಾಣ ${s.risk_score || 'ಮಾಪನ ಮಾಡಲಾಗಿಲ್ಲ'}% ಆಗಿದೆ.\n`;
          if (relatedLinks.length > 0) {
            answer += `  └─ ಸಂಪರ್ಕಗಳು: ಈ ಪ್ರಕರಣದಲ್ಲಿ ಇತರ ಶಂಕಿತರೊಂದಿಗೆ ${relatedLinks.length} ಸಂಪರ್ಕಗಳನ್ನು ಹೊಂದಿದ್ದಾರೆ.\n`;
          }
        });
      } else {
        confidenceScore = 80;
        if (allSuspects.length > 0) {
          answer = `ಪ್ರಕರಣ ${targetCase.fir_number} ಗೆ ಸಂಬಂಧಿಸಿದ ಶಂಕಿತರ ವಿವರಗಳು:\n`;
          allSuspects.forEach(s => {
            citations.push(s.id || s._id.toString());
            answer += `• ${s.name} (ಅಪಾಯದ ಶ್ರೇಣಿ: ${s.risk_score || 'ಮಾಪನ ಮಾಡಲಾಗಿಲ್ಲ'}%) - ಇತರ ಹೆಸರುಗಳು: ${s.aliases?.join(', ') || 'ಯಾವುದೂ ಇಲ್ಲ'}\n`;
          });
        } else {
          answer = `ಪ್ರಕರಣ ${targetCase.fir_number} ಗೆ ಯಾವುದೇ ಶಂಕಿತರ ವಿವರಗಳನ್ನು ನಮೂದಿಸಿಲ್ಲ.`;
        }
      }
    } else if (isCdrQuery) {
      if (matchedEvidence.length > 0) {
        confidenceScore = 95;
        answer = `ಕರೆ ದಾಖಲೆಗಳು (CDR) ವಿವರಗಳು:\n`;
        matchedEvidence.forEach(e => {
          citations.push(e.id || e._id.toString());
          answer += `• [${e.type.toUpperCase()}] ನಂಬರ್ ${e.phone_number || 'ಲಭ್ಯವಿಲ್ಲ'} ಟವರ್ ${e.cell_tower || 'ಲಭ್ಯವಿಲ್ಲ'} ವ್ಯಾಪ್ತಿಯಲ್ಲಿ ಪತ್ತೆಯಾಗಿದೆ. ಸಮಯ: ${new Date(e.captured_at).toLocaleString('kn-IN')}.\n`;
        });
      } else {
        confidenceScore = 75;
        if (allEvidence.length > 0) {
          answer = `ಪ್ರಕರಣ ${targetCase.fir_number} ர ಕರೆ ಮತ್ತು ಫೋನ್ ದಾಖಲೆಗಳು:\n`;
          allEvidence.slice(0, 5).forEach(e => {
            citations.push(e.id || e._id.toString());
            answer += `• ಫೋನ್ ನಂಬರ್: ${e.phone_number || 'ಲಭ್ಯವಿಲ್ಲ'} ಟವರ್ ${e.cell_tower || 'ಟವರ್ ವ್ಯಾಪ್ತಿ'} (${e.type.toUpperCase()})\n`;
          });
          if (allEvidence.length > 5) {
            answer += `ಮತ್ತು ಇತರ ${allEvidence.length - 5} ದಾಖಲೆಗಳು ಲಭ್ಯವಿವೆ.`;
          }
        } else {
          answer = `ಪ್ರಕರಣ ${targetCase.fir_number} ಗೆ ಯಾವುದೇ ಕರೆ ಅಥವಾ ಫೋನ್ ದಾಖಲೆಗಳನ್ನು ಸೇರಿಸಲಾಗಿಲ್ಲ.`;
        }
      }
    } else if (isNetworkQuery) {
      if (allLinks.length > 0) {
        confidenceScore = 90;
        answer = `ಶಂಕಿತರ ನಡುವಿನ ಸಂಪರ್ಕಗಳು ಮತ್ತು ಜಾಲಬಂಧ:\n`;
        allLinks.forEach(l => {
          citations.push(l.id || l._id.toString());
          const suspA = allSuspects.find(s => (s.id || s._id.toString()) === l.suspect_a_id);
          const suspB = allSuspects.find(s => (s.id || s._id.toString()) === l.suspect_b_id);
          const nameA = suspA ? suspA.name : 'ಅಪರಿಚಿತ';
          const nameB = suspB ? suspB.name : 'ಅಪರಿಚಿತ';
          answer += `• ಸಂಪರ್ಕ: ${nameA} <-> ${nameB} ಅವರ ನಡುವೆ ${l.link_type === 'cdr_call' ? 'ಫೋನ್ ಕರೆ' : 'ಸಹವರ್ತಿ ಜಾಲಬಂಧ'} ಸಂಪರ್ಕ ಕಂಡುಬಂದಿದೆ (${l.detail || 'ಹೆಚ್ಚಿನ ವಿವರಗಳಿಲ್ಲ'}).\n`;
        });
      } else {
        answer = `ಪ್ರಕರಣ ${targetCase.fir_number} ರ ಶಂಕಿತರ ನಡುವೆ ಯಾವುದೇ ಸಂಬಂಧಗಳನ್ನು ಮ್ಯಾಪ್ ಮಾಡಲಾಗಿಲ್ಲ.`;
      }
    } else {
      confidenceScore = 88;
      const suspRoster = allSuspects.map(s => s.name).join(', ') || 'ಯಾವುದೂ ಇಲ್ಲ';
      answer = `ಪ್ರಕರಣದ ಕಾರ್ಯಾಂಗ ಸಾರಾಂಶ (FIR ${targetCase.fir_number}):\n`;
      answer += `• ಶೀರ್ಷಿಕೆ: ${targetCase.title}\n`;
      answer += `• ಸ್ಥಿತಿ: ${targetCase.status === 'open' ? 'ಮುಕ್ತವಾಗಿದೆ' : 'ಪರಿಶೀಲನೆಯಲ್ಲಿದೆ'} | ಆದ್ಯತೆ: ${targetCase.priority === 'high' ? 'ಹೆಚ್ಚು' : 'ಸಾಧಾರಣ'}\n`;
      answer += `• ವಿವರಣೆ: ${targetCase.description || 'ಪ್ರಕರಣದ ವಿವರಣೆಯನ್ನು ನಮೂದಿಸಲಾಗಿಲ್ಲ.'}\n`;
      answer += `• ಶಂಕಿತರ ಪಟ್ಟಿ: ${allSuspects.length} ಶಂಕಿತರನ್ನು ಗುರುತಿಸಲಾಗಿದೆ (${suspRoster}).\n`;
      answer += `• ದಾಖಲೆಗಳು: ${allEvidence.length} ಫೋನ್/ಕ್ಯಾಮೆರಾ ದಾಖಲೆಗಳನ್ನು ಸೇರಿಸಲಾಗಿದೆ.`;
    }
  } else {
    // English Synthesis
    if (kbMatch) {
      confidenceScore = 98;
      answer = `Reference: ${kbMatch.title}\n\n${kbMatch.en}`;
    } else if (isGeneralIndiaPoliceCrimeQuery) {
      confidenceScore = 90;
      answer = "Indian Law Enforcement and Crime Reference:\n- The newly enacted laws (BNS, BNSS, BSA) govern all police investigations in India since July 2024.\n- Digital evidence (like CDR call records and ANPR camera logs) is admissible in court under BSA Section 63.\n- For general inquiries, you can query specific topics such as 'BNS', 'BNSS', 'BSA', 'Karnataka Police', or 'Cyber Crime'.";
    } else if (isOutOfScope) {
      confidenceScore = 100;
      answer = "I am a secure, grounded police intelligence assistant. I can only answer queries related to the active case file records (FIR), suspect roster profiles, phone call records (CDR), or vehicle license plate cameras (ANPR). Please ask a question related to your active investigation.";
    } else if (isSuspectQuery) {
      if (matchedSuspects.length > 0) {
        confidenceScore = 95;
        answer = `Suspect Details for ${matchedSuspects.map(s => s.name).join(', ')}:\n`;
        matchedSuspects.forEach(s => {
          const idStr = s.id || s._id.toString();
          citations.push(idStr);
          const relatedLinks = allLinks.filter(l => l.suspect_a_id === idStr || l.suspect_b_id === idStr);
          answer += `• ${s.name} (Aliases: ${s.aliases?.join(', ') || 'None'}) has a calculated risk score of ${s.risk_score || 'Unassessed'}%.\n`;
          if (relatedLinks.length > 0) {
            answer += `  └─ Connections: Linked to ${relatedLinks.length} other individuals in this case via ${relatedLinks.map(l => l.link_type.replace('_', ' ')).join(', ')} links.\n`;
          }
        });
      } else {
        confidenceScore = 80;
        if (allSuspects.length > 0) {
          answer = `Suspect roster for Case ${targetCase.fir_number}:\n`;
          allSuspects.forEach(s => {
            citations.push(s.id || s._id.toString());
            answer += `• ${s.name} (Risk: ${s.risk_score || 'Unassessed'}%) - Aliases: ${s.aliases?.join(', ') || 'None'}\n`;
          });
        } else {
          answer = `No suspect profiles have been registered yet for Case folder ${targetCase.fir_number}.`;
        }
      }
    } else if (isCdrQuery) {
      if (matchedEvidence.length > 0) {
        confidenceScore = 95;
        answer = `Telemetry & CDR Log matches:\n`;
        matchedEvidence.forEach(e => {
          citations.push(e.id || e._id.toString());
          answer += `• [${e.type.toUpperCase()}] Record for Phone ${e.phone_number || 'N/A'} at Location ${e.cell_tower || 'N/A'}. Timestamp: ${new Date(e.captured_at).toLocaleString()}.\n`;
        });
      } else {
        confidenceScore = 75;
        if (allEvidence.length > 0) {
          answer = `CDR logs for Case ${targetCase.fir_number}:\n`;
          allEvidence.slice(0, 5).forEach(e => {
            citations.push(e.id || e._id.toString());
            answer += `• Phone: ${e.phone_number || 'Unlinked'} detected at ${e.cell_tower || 'Tower'} (${e.type.toUpperCase()})\n`;
          });
          if (allEvidence.length > 5) {
            answer += `and ${allEvidence.length - 5} other evidence record(s).`;
          }
        } else {
          answer = `No telemetry, ANPR, or cell tower records have been uploaded for Case ${targetCase.fir_number}.`;
        }
      }
    } else if (isNetworkQuery) {
      if (allLinks.length > 0) {
        confidenceScore = 90;
        answer = `Geospatial & CDR Association Network Links:\n`;
        allLinks.forEach(l => {
          citations.push(l.id || l._id.toString());
          const suspA = allSuspects.find(s => (s.id || s._id.toString()) === l.suspect_a_id);
          const suspB = allSuspects.find(s => (s.id || s._id.toString()) === l.suspect_b_id);
          const nameA = suspA ? suspA.name : 'Unknown';
          const nameB = suspB ? suspB.name : 'Unknown';
          answer += `• Link: ${nameA} <-> ${nameB} via ${l.link_type.replace('_', ' ')} (${l.detail || 'No additional details'}).\n`;
        });
      } else {
        answer = `No network graph associations have been mapped for Case ${targetCase.fir_number}.`;
      }
    } else {
      // Default: Executive Case Summary
      confidenceScore = 88;
      const suspRoster = allSuspects.map(s => s.name).join(', ') || 'None';
      answer = `Case Dossier Executive Summary for FIR ${targetCase.fir_number}:\n`;
      answer += `• Title: ${targetCase.title}\n`;
      answer += `• Status: ${targetCase.status.toUpperCase()} | Priority: ${targetCase.priority.toUpperCase()}\n`;
      answer += `• Briefing: ${targetCase.description || 'No case synopsis registered.'}\n`;
      answer += `• Roster: ${allSuspects.length} suspect(s) identified (${suspRoster}).\n`;
      answer += `• Evidence: ${allEvidence.length} telecommunication / signal record(s) indexed.`;
    }
  }

  return {
    answer,
    confidenceScore,
    citedRecordIds: [...new Set(citations)]
  };
}


// =========================================================
// API Controller Routes
// =========================================================

// Auth & Signup
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, full_name, badge_id, role, station_id } = req.body;
    let existing = await Store.findProfileByBadge(badge_id);
    if (existing) {
      const session = { user: { id: existing.id || existing._id.toString(), email: existing.email }, profile: existing };
      return res.json(session);
    }
    const defaultRole = role || 'investigator';
    const profile = await Store.addProfile({
      email: email || `${badge_id.toLowerCase().replace(/[^a-z0-9]/g, '')}@nyayanetra.gov.in`,
      full_name,
      badge_id,
      role: defaultRole,
      station_id: station_id || null,
      access_status: 'active'
    });

    const session = {
      user: { id: profile.id || profile._id.toString(), email: profile.email },
      profile
    };
    await Store.addAuditLog(profile.id || profile._id.toString(), 'AUTH_SIGNUP', 'profiles', profile.id || profile._id.toString(), { role: defaultRole });
    res.json(session);
  } catch (err) {
    res.status(500).send(err.message || 'Signup failed');
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, badge_id } = req.body;
    let profile = null;
    if (badge_id) {
      profile = await Store.findProfileByBadge(badge_id);
    } else if (email) {
      profile = await Store.findProfileByEmail(email);
    }

    if (!profile) {
      return res.status(404).send(`ACCOUNT_NOT_FOUND:${badge_id || email}`);
    }

    if (profile.access_status === 'revoked') {
      return res.status(403).send('Account clearance has been revoked by SCRB Access Console.');
    }

    const session = {
      user: { id: profile.id || profile._id.toString(), email: profile.email },
      profile
    };
    await Store.addAuditLog(profile.id || profile._id.toString(), 'AUTH_LOGIN', 'profiles', profile.id || profile._id.toString(), { role: profile.role });
    res.json(session);
  } catch (err) {
    res.status(500).send(err.message || 'Login failed');
  }
});

// Logout
app.post('/api/auth/logout', async (req, res) => {
  try {
    const { userId } = req.body;
    if (userId) {
      await Store.addAuditLog(userId, 'AUTH_LOGOUT', 'profiles', userId);
    }
    res.send('Logged out');
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Stats
app.get('/api/stats', async (req, res) => {
  try {
    const profiles = await Store.getProfiles();
    const cases = await Store.getCases();
    const activeOfficers = profiles.filter(p => p.access_status === 'active').length;
    const firCount = cases.length;
    const highPriorityCount = cases.filter(c => c.priority === 'high' && c.status === 'open').length;
    const pendingApprovals = profiles.filter(p => p.access_status === 'pending').length;
    res.json({ activeOfficers, firCount, highPriorityCount, pendingApprovals });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Officers Roster
app.get('/api/officers', async (req, res) => {
  try {
    const list = await Store.getProfiles();
    res.json(list);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.post('/api/officers', async (req, res) => {
  try {
    const { currentUser, officerData } = req.body;
    const newOfficer = await Store.addProfile({
      email: `${officerData.badge_id.toLowerCase().replace(/[^a-z0-9]/g, '')}@nyayanetra.gov.in`,
      full_name: officerData.full_name,
      badge_id: officerData.badge_id,
      role: officerData.role || 'investigator',
      station_id: officerData.station_id || null,
      access_status: 'active'
    });
    const cUserId = currentUser?.profile?.id || currentUser?.profile?._id?.toString() || 'sys';
    await Store.addAuditLog(cUserId, 'OFFICER_ADD', 'profiles', newOfficer.id || newOfficer._id.toString(), { badge_id: newOfficer.badge_id });
    res.json(newOfficer);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.post('/api/officers/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const { currentUser } = req.body;
    const profile = await Store.updateProfileStatus(id, 'active');
    const cUserId = currentUser?.profile?.id || currentUser?.profile?._id?.toString() || 'sys';
    await Store.addAuditLog(cUserId, 'OFFICER_APPROVE_ACCESS', 'profiles', id);
    res.json(profile);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.post('/api/officers/:id/revoke', async (req, res) => {
  try {
    const { id } = req.params;
    const { currentUser } = req.body;
    const profile = await Store.updateProfileStatus(id, 'revoked');
    const cUserId = currentUser?.profile?.id || currentUser?.profile?._id?.toString() || 'sys';
    await Store.addAuditLog(cUserId, 'OFFICER_REVOKE_ACCESS', 'profiles', id);
    res.json(profile);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Stations
app.get('/api/stations', async (req, res) => {
  try {
    const stations = await Store.getStations();
    res.json(stations);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.post('/api/stations', async (req, res) => {
  try {
    const { name, district, currentUser } = req.body;
    const station = await Store.addStation({ name, district });
    if (currentUser) {
      const cUserId = currentUser?.profile?.id || currentUser?.profile?._id?.toString() || 'sys';
      await Store.addAuditLog(cUserId, 'STATION_ADD', 'stations', station.id || station._id.toString(), { name });
    }
    res.json(station);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Cases
app.get('/api/cases', async (req, res) => {
  try {
    const cases = await Store.getCases();
    res.json(cases);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.post('/api/cases', async (req, res) => {
  try {
    const { fir_number, station_id, title, description, status, priority, created_by, currentUser } = req.body;
    const newCase = await Store.addCase({
      fir_number,
      station_id,
      title,
      description,
      status,
      priority,
      created_by
    });
    const cUserId = currentUser?.profile?.id || currentUser?.profile?._id?.toString() || 'sys';
    await Store.addAuditLog(cUserId, 'CASE_CREATE', 'cases', newCase.id || newCase._id.toString(), { fir_number });
    res.json(newCase);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.post('/api/cases/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, currentUser } = req.body;
    const c = await Store.updateCaseStatus(id, status);
    const cUserId = currentUser?.profile?.id || currentUser?.profile?._id?.toString() || 'sys';
    await Store.addAuditLog(cUserId, 'CASE_UPDATE_STATUS', 'cases', id, { status });
    res.json(c);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Suspects
app.get('/api/suspects', async (req, res) => {
  try {
    const { caseId } = req.query;
    const suspects = await Store.getSuspects(caseId);
    res.json(suspects);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.post('/api/suspects', async (req, res) => {
  try {
    const { case_id, name, aliases, risk_score, image_url, created_by, currentUser } = req.body;
    const suspect = await Store.addSuspect({
      case_id,
      name,
      aliases: aliases || [],
      risk_score: risk_score !== null ? Number(risk_score) : null,
      image_url: image_url || null,
      created_by
    });
    const cUserId = currentUser?.profile?.id || currentUser?.profile?._id?.toString() || 'sys';
    await Store.addAuditLog(cUserId, 'SUSPECT_ADD', 'suspects', suspect.id || suspect._id.toString(), { name });
    res.json(suspect);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Suspect Links
app.get('/api/links', async (req, res) => {
  try {
    const { caseId } = req.query;
    const links = await Store.getLinks(caseId);
    res.json(links);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.post('/api/links', async (req, res) => {
  try {
    const { case_id, suspect_a_id, suspect_b_id, link_type, detail, created_by, currentUser } = req.body;
    const link = await Store.addLink({
      case_id,
      suspect_a_id,
      suspect_b_id,
      link_type,
      detail,
      created_by
    });
    const cUserId = currentUser?.profile?.id || currentUser?.profile?._id?.toString() || 'sys';
    await Store.addAuditLog(cUserId, 'SUSPECT_LINK_ADD', 'suspect_links', link.id || link._id.toString(), { link_type });
    res.json(link);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Evidence
app.get('/api/evidence', async (req, res) => {
  try {
    const { caseId } = req.query;
    const evidence = await Store.getEvidence(caseId);
    res.json(evidence);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.post('/api/evidence', async (req, res) => {
  try {
    const { case_id, suspect_id, type, cell_tower, phone_number, captured_at, image_url, details, created_by, currentUser } = req.body;
    const e = await Store.addEvidence({
      case_id,
      suspect_id: suspect_id || null,
      type,
      cell_tower: cell_tower || '',
      phone_number: phone_number || '',
      captured_at: captured_at || new Date().toISOString(),
      image_url: image_url || null,
      details: details || {},
      created_by
    });
    const cUserId = currentUser?.profile?.id || currentUser?.profile?._id?.toString() || 'sys';
    await Store.addAuditLog(cUserId, 'EVIDENCE_ADD', 'evidence_records', e.id || e._id.toString(), { type });
    res.json(e);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Conversations & Messages
app.get('/api/conversations', async (req, res) => {
  try {
    const { userId } = req.query;
    const convs = await Store.getConversations(userId);
    res.json(convs);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.post('/api/conversations', async (req, res) => {
  try {
    const { case_id, user_id, title } = req.body;
    const conv = await Store.addConversation({ case_id, user_id, title });
    await Store.addAuditLog(user_id, 'CONVERSATION_CREATE', 'conversations', conv.id || conv._id.toString(), { title });
    res.json(conv);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.get('/api/messages', async (req, res) => {
  try {
    const { conversationId } = req.query;
    const msgs = await Store.getMessages(conversationId);
    res.json(msgs);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.post('/api/messages', async (req, res) => {
  try {
    const { conversation_id, role, content, language, caseId, userId } = req.body;

    // 1. Save user message
    const userMsg = await Store.addMessage({
      conversation_id,
      role: 'user',
      content,
      language: language || 'en'
    });

    // 2. Generate grounded classical NLP answer
    const ragResult = await generateLocalAIResponse(content, caseId, language);

    // 3. Save assistant response
    const assistantMsg = await Store.addMessage({
      conversation_id,
      role: 'assistant',
      content: ragResult.answer,
      language: language || 'en',
      cited_record_ids: ragResult.citedRecordIds,
      confidence_score: ragResult.confidenceScore
    });

    // 4. Log audit event
    if (userId) {
      await Store.addAuditLog(userId, 'RAG_QUERY', 'conversations', caseId || null, {
        query: content,
        language,
        confidenceScore: ragResult.confidenceScore,
        citedRecordsCount: ragResult.citedRecordIds.length
      });
    }

    res.json({
      userMessage: userMsg,
      assistantMessage: assistantMsg
    });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Audit Logs
app.get('/api/audit-logs', async (req, res) => {
  try {
    const { userId, role } = req.query;
    const isAdmin = role === 'admin';
    const logs = await Store.getAuditLogs(userId, isAdmin);
    res.json(logs);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Optional Seed Sample Dataset
app.post('/api/seed', async (req, res) => {
  try {
    const { adminUserId } = req.body;
    const stationId = 'stn-blr-mll';
    const caseId = 'case-seeded';
    const suspect1Id = 'susp-seeded-1';
    const suspect2Id = 'susp-seeded-2';

    const newCase = await Store.addCase({
      fir_number: 'FIR #0184/2026',
      station_id: stationId,
      title: 'Malleshwaram CDR & Telemetry Investigation',
      description: 'Investigation into unauthorized cell tower activity near 18th Cross.',
      status: 'open',
      priority: 'high',
      created_by: adminUserId
    });

    const suspect1 = await Store.addSuspect({
      case_id: newCase.id || newCase._id.toString(),
      name: 'Basavaraju H',
      aliases: ['Basa', 'BH-402'],
      risk_score: 88,
      created_by: adminUserId
    });

    const suspect2 = await Store.addSuspect({
      case_id: newCase.id || newCase._id.toString(),
      name: 'Shivanna K',
      aliases: ['Shiva'],
      risk_score: 72,
      created_by: adminUserId
    });

    const link = await Store.addLink({
      case_id: newCase.id || newCase._id.toString(),
      suspect_a_id: suspect1.id || suspect1._id.toString(),
      suspect_b_id: suspect2.id || suspect2._id.toString(),
      link_type: 'cdr_call',
      detail: '14 calls recorded between 02:00 AM and 05:00 AM at Tower KA-BLR-N4',
      created_by: adminUserId
    });

    const evidence = await Store.addEvidence({
      case_id: newCase.id || newCase._id.toString(),
      suspect_id: suspect1.id || suspect1._id.toString(),
      type: 'cdr',
      cell_tower: 'Tower KA-BLR-N4 (Malleshwaram 18th Cross)',
      phone_number: '+91 94808-99402',
      captured_at: new Date().toISOString(),
      details: { note: 'ANPR camera matched vehicle KA-04-MB-4020' },
      created_by: adminUserId
    });

    res.json({ success: true, caseId: newCase.id || newCase._id.toString() });
  } catch (err) {
    res.status(500).send(err.message);
  }
});


// Serve React app static files in production
app.use(express.static(path.join(__dirname, 'dist')));

// SPA Router Fallback Middleware (path-to-regexp v10 safe)
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api')) {
    if (fs.existsSync(path.join(__dirname, 'dist', 'index.html'))) {
      return res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    } else {
      return res.send('NyayaNetra Server Backend Operational. Start Vite Client on port 3000.');
    }
  }
  next();
});

app.listen(PORT, () => {
  console.log(`Backend Express server running on port ${PORT}`);
});
