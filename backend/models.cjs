const mongoose = require('mongoose');

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
  embedding: { type: [Number], default: [] },
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
  mo_tags: { type: [String], default: [] },
  embedding: { type: [Number], default: [] },
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
  embedding: { type: [Number], default: [] },
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
  embedding: { type: [Number], default: [] },
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
  retrieved_records: { type: [mongoose.Schema.Types.Mixed], default: [] },
  explainability: { type: mongoose.Schema.Types.Mixed, default: null },
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

module.exports = {
  Station,
  Profile,
  Case,
  Suspect,
  SuspectLink,
  EvidenceRecord,
  Conversation,
  Message,
  AuditLog
};
