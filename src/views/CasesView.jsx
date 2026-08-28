import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { dbService } from '../lib/api';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';
import { AddCaseModal } from '../components/Modals/AddCaseModal';
import { AddSuspectModal } from '../components/Modals/AddSuspectModal';
import { AddSuspectLinkModal } from '../components/Modals/AddSuspectLinkModal';
import { AddEvidenceModal } from '../components/Modals/AddEvidenceModal';
import { 
  FolderOpen, 
  Search, 
  Plus, 
  ShieldAlert, 
  Users, 
  FileSpreadsheet, 
  Link as LinkIcon, 
  Calendar, 
  Check, 
  ChevronRight, 
  Activity, 
  User, 
  Sparkles, 
  Clock,
  ArrowLeft,
  ChevronDown,
  PhoneCall,
  Car,
  Shield,
  FileText
} from 'lucide-react';

export function CasesView({ setActiveScreen, selectedCaseId, setSelectedCaseId, cases = [], reloadCases }) {
  const { session } = useAuth();
  const { language, t } = useLanguage();
  
  // Local state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('suspects'); // 'suspects', 'evidence', 'links'
  const [caseSuspects, setCaseSuspects] = useState([]);
  const [caseEvidence, setCaseEvidence] = useState([]);
  const [caseLinks, setCaseLinks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [isDetailView, setIsDetailView] = useState(false); // Controls master (grid) vs detail view

  // Modals state
  const [isAddCaseOpen, setIsAddCaseOpen] = useState(false);
  const [isAddSuspectOpen, setIsAddSuspectOpen] = useState(false);
  const [isAddEvidenceOpen, setIsAddEvidenceOpen] = useState(false);
  const [isAddLinkOpen, setIsAddLinkOpen] = useState(false);

  // MO Profile similarity modal state
  const [selectedSuspectForSimilarity, setSelectedSuspectForSimilarity] = useState(null);
  const [similarityData, setSimilarityData] = useState(null);
  const [loadingSimilarity, setLoadingSimilarity] = useState(false);

  // Load details for the selected case
  const loadCaseDetails = async () => {
    if (!selectedCaseId) return;
    setLoading(true);
    try {
      const [suspectsList, evidenceList, linksList] = await Promise.all([
        dbService.getSuspects(selectedCaseId),
        dbService.getEvidence(selectedCaseId),
        dbService.getSuspectLinks(selectedCaseId)
      ]);
      setCaseSuspects(suspectsList);
      setCaseEvidence(evidenceList);
      setCaseLinks(linksList);
    } catch (err) {
      console.error('Failed to load case details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCaseId) {
      loadCaseDetails();
    }
  }, [selectedCaseId, cases]);

  // Find the selected case
  const selectedCase = cases.find(c => c.id === selectedCaseId || c._id === selectedCaseId);

  // Handle case card click
  const handleSelectCase = (caseId) => {
    setSelectedCaseId(caseId);
    setIsDetailView(true);
  };

  // Filtered cases list based on search query
  const filteredCases = cases.filter(c => 
    c.fir_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Update case status via REST API
  const handleUpdateStatus = async (newStatus) => {
    if (!selectedCaseId) return;
    setStatusUpdating(true);
    try {
      const res = await fetch(`/api/cases/${selectedCaseId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          currentUser: session
        })
      });
      if (res.ok) {
        if (reloadCases) await reloadCases();
      } else {
        throw new Error(await res.text());
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setStatusUpdating(false);
    }
  };

  // Run profiling matcher API
  const handleFetchSimilarity = async (suspect) => {
    setSelectedSuspectForSimilarity(suspect);
    setLoadingSimilarity(true);
    setSimilarityData(null);
    try {
      const suspectId = suspect.id || suspect._id;
      const res = await fetch(`/api/profiling/similar-suspects?suspectId=${suspectId}`);
      if (res.ok) {
        const data = await res.json();
        setSimilarityData(data);
      } else {
        throw new Error(await res.text());
      }
    } catch (err) {
      console.error('Failed to fetch behavior similarity:', err);
    } finally {
      setLoadingSimilarity(false);
    }
  };

  return (
    <div className="flex flex-col h-screen antialiased text-on-surface bg-[#F6F7F9]">
      <Navbar activeScreen="cases" setActiveScreen={setActiveScreen} />

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar Navigation */}
        <Sidebar
          activeScreen="cases"
          setActiveScreen={setActiveScreen}
          cases={cases}
          selectedCaseId={selectedCaseId}
          setSelectedCaseId={(id) => {
            setSelectedCaseId(id);
            setIsDetailView(true);
          }}
          onOpenAddCase={() => setIsAddCaseOpen(true)}
          onOpenAddSuspect={() => setIsAddSuspectOpen(true)}
          onOpenAddEvidence={() => setIsAddEvidenceOpen(true)}
        />

        {/* Main Work Area */}
        <main className="flex-1 overflow-hidden relative flex flex-col">
          
          <AnimatePresence mode="wait">
            {!isDetailView || !selectedCase ? (
              
              // ================= MASTER DASHBOARD GRID VIEW =================
              <motion.div
                key="master"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.22 }}
                className="flex-1 overflow-y-auto scrolling-content p-8 md:p-12 space-y-8"
              >
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-1.5">
                    <h1 className="text-2xl font-bold tracking-tight text-navy-deep">Investigation Dossiers</h1>
                    <p className="text-xs text-outline font-medium">Browse active Case Files, manage suspect profiling, and configure electronic evidence.</p>
                  </div>
                  <button
                    onClick={() => setIsAddCaseOpen(true)}
                    className="px-5 py-3 bg-navy-deep hover:bg-primary-container text-on-primary rounded-xl text-xs font-bold shadow-sm transition-all active:scale-[0.98] flex items-center gap-2 self-start md:self-auto min-h-[44px]"
                  >
                    <Plus className="w-4 h-4 text-gold-accent" /> Register New FIR Case
                  </button>
                </div>

                {/* Search Bar Controls */}
                <div className="max-w-md relative bg-white rounded-2xl shadow-2xs border border-outline-variant/40">
                  <Search className="w-5 h-5 text-outline absolute left-4 top-3.5" />
                  <input
                    type="text"
                    placeholder="Search case title, description, or FIR number..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-transparent text-xs font-semibold focus:ring-0 outline-none text-on-surface"
                  />
                </div>

                {/* Grid of Case Cards */}
                {filteredCases.length === 0 ? (
                  <div className="p-12 bg-white/60 border border-dashed border-outline-variant rounded-2xl text-center space-y-2 max-w-lg">
                    <FolderOpen className="w-10 h-10 text-outline/50 mx-auto" />
                    <h3 className="text-xs font-bold text-navy-deep">No case files match your query</h3>
                    <p className="text-[11px] text-outline">Create a new case file or double-check the search parameters.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
                    {filteredCases.map(c => (
                      <motion.div
                        key={c.id || c._id}
                        whileHover={{ y: -4 }}
                        onClick={() => handleSelectCase(c.id || c._id)}
                        className="bg-white border border-outline-variant/40 rounded-2xl p-6 shadow-2xs hover:shadow-sm cursor-pointer transition-all flex flex-col justify-between space-y-4"
                      >
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-mono font-bold text-gold-accent px-2 py-0.5 bg-primary rounded">
                              {c.fir_number}
                            </span>
                            <span className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded-full border uppercase ${
                              c.priority === 'high'
                                ? 'bg-red-50 text-red-700 border-red-100'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}>
                              {c.priority === 'high' ? '⚠️ High' : 'Standard'}
                            </span>
                          </div>

                          <h3 className="text-sm font-bold text-navy-deep leading-snug line-clamp-1">
                            {c.title}
                          </h3>
                          <p className="text-xs text-on-surface-variant/80 font-medium line-clamp-2 leading-relaxed">
                            {c.description || 'No case synopsis has been registered. Select dossier to update incident telemetry.'}
                          </p>
                        </div>

                        <div className="pt-4 border-t border-slate-100 flex justify-between items-center text-[10px] font-bold text-outline">
                          <span className="capitalize px-2 py-1 bg-[#F1F3F6] rounded-lg text-primary">
                            {c.status === 'open' ? 'Active' : c.status === 'under_review' ? 'Under Review' : 'Closed'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(c.createdAt || c.created_at || Date.now()).toLocaleDateString()}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            ) : (
              
              // ================= DETAIL DOSSIER VIEW =================
              <motion.div
                key="detail"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.22 }}
                className="flex-1 flex flex-col overflow-hidden bg-white"
              >
                {/* Header Back controls */}
                <div className="px-8 py-5 border-b border-outline-variant bg-[#FDFDFD] flex items-center justify-between shrink-0">
                  <button
                    onClick={() => setIsDetailView(false)}
                    className="flex items-center gap-2 text-xs font-bold text-primary hover:text-gold-accent transition-colors min-h-[36px]"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Case Files</span>
                  </button>

                  <div className="flex items-center gap-2 bg-[#F1F3F6] p-1 rounded-xl border border-outline-variant/40 shrink-0">
                    <span className="text-[9px] font-bold text-outline uppercase pl-2 pr-1">Dossier Status:</span>
                    {['open', 'under_review', 'closed'].map(st => {
                      const isCurrent = selectedCase.status === st;
                      const label = st === 'open' ? 'Active' : st === 'under_review' ? 'Review' : 'Closed';
                      const colorClass = st === 'open' 
                        ? 'bg-emerald-600 text-white shadow-2xs' 
                        : st === 'under_review' 
                          ? 'bg-amber-600 text-white shadow-2xs' 
                          : 'bg-slate-600 text-white shadow-2xs';
                      return (
                        <button
                          key={st}
                          disabled={statusUpdating}
                          onClick={() => handleUpdateStatus(st)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all min-h-[32px] ${
                            isCurrent ? colorClass : 'text-on-surface-variant hover:bg-surface-container-high'
                          }`}
                        >
                          {isCurrent && statusUpdating ? '...' : label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Case File Details Content Panel */}
                <div className="flex-1 overflow-y-auto scrolling-content p-8 md:p-12 space-y-10">
                  
                  {/* Case Description Card & Info */}
                  <div className="space-y-4 max-w-4xl">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-gold-accent px-2 py-0.5 bg-primary rounded">
                          {selectedCase.fir_number}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          selectedCase.priority === 'high'
                            ? 'bg-red-50 text-red-600 border-red-200'
                            : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}>
                          {selectedCase.priority === 'high' ? 'High Criticality' : 'Standard Priority'}
                        </span>
                      </div>
                      <h1 className="text-xl font-bold text-navy-deep">{selectedCase.title}</h1>
                      <p className="text-xs text-outline font-medium flex items-center gap-1.5 pt-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Registered on {new Date(selectedCase.createdAt || selectedCase.created_at || Date.now()).toLocaleString()}</span>
                        <span>&bull; Investigator Badge:</span>
                        <code className="font-mono bg-surface-container px-1.5 py-0.5 rounded font-bold text-navy-deep">{selectedCase.created_by}</code>
                      </p>
                    </div>

                    <p className="text-xs text-on-surface-variant leading-relaxed font-medium bg-slate-50/50 p-5 rounded-2xl border border-slate-100 max-w-3xl">
                      {selectedCase.description || 'No detailed case synopsis registered.'}
                    </p>
                  </div>

                  {/* Tabs Header */}
                  <div className="flex border-b border-slate-100 max-w-3xl">
                    {[
                      { id: 'suspects', label: `Profiled Suspects (${caseSuspects.length})`, icon: Users },
                      { id: 'evidence', label: `Evidence Telemetry (${caseEvidence.length})`, icon: FileSpreadsheet },
                      { id: 'links', label: `Syndicate Links (${caseLinks.length})`, icon: LinkIcon }
                    ].map(tab => {
                      const Icon = tab.icon;
                      const isActive = activeTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`px-6 py-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-all min-h-[44px] ${
                            isActive
                              ? 'border-gold-accent text-primary'
                              : 'border-transparent text-outline hover:text-primary hover:border-slate-300'
                          }`}
                        >
                          <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-gold-accent' : 'text-outline'}`} />
                          <span>{tab.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Tab Panel Context */}
                  <div className="max-w-5xl">
                    {loading ? (
                      <div className="flex flex-col items-center justify-center py-12 space-y-2">
                        <div className="w-6 h-6 rounded-full border-4 border-gold-accent border-t-transparent animate-spin"></div>
                        <p className="text-xs text-outline font-bold">Querying case dossier...</p>
                      </div>
                    ) : (
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={activeTab}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          transition={{ duration: 0.12 }}
                        >
                          
                          {/* Tab 1: Suspects */}
                          {activeTab === 'suspects' && (
                            <div className="space-y-6">
                              <div className="flex justify-between items-center">
                                <h3 className="text-xs font-bold text-outline uppercase tracking-wider">Identified Suspect Roster</h3>
                                <button
                                  onClick={() => setIsAddSuspectOpen(true)}
                                  className="px-4 py-2.5 bg-navy-deep hover:bg-primary-container text-on-primary rounded-xl text-xs font-bold shadow-2xs transition-all active:scale-[0.98] flex items-center gap-1.5 min-h-[40px]"
                                >
                                  <Plus className="w-4 h-4 text-gold-accent" /> Add Suspect Profile
                                </button>
                              </div>

                              {caseSuspects.length === 0 ? (
                                <div className="p-12 text-center border border-dashed border-outline-variant/60 rounded-2xl bg-[#FAFAFA] space-y-2 max-w-md">
                                  <p className="text-xs text-outline font-semibold">No suspects profiled for this Case file yet</p>
                                  <button
                                    onClick={() => setIsAddSuspectOpen(true)}
                                    className="text-xs font-bold text-primary hover:underline hover:text-gold-accent min-h-[36px]"
                                  >
                                    + Create first suspect dossier
                                  </button>
                                </div>
                              ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  {caseSuspects.map(s => (
                                    <div
                                      key={s.id || s._id}
                                      className="bg-white border border-[#EBEBEB] rounded-2xl p-5 shadow-2xs hover:shadow-xs transition-shadow flex gap-5"
                                    >
                                      <div className="w-14 h-14 rounded-full border border-slate-200 overflow-hidden bg-slate-50 shrink-0 flex items-center justify-center">
                                        {s.image_url ? (
                                          <img src={s.image_url} alt={s.name} className="w-full h-full object-cover" />
                                        ) : (
                                          <User className="w-6 h-6 text-outline" />
                                        )}
                                      </div>

                                      <div className="flex-1 space-y-3">
                                        <div>
                                          <h4 className="text-sm font-bold text-navy-deep">{s.name}</h4>
                                          <p className="text-[10px] text-outline font-semibold mt-0.5">
                                            Aliases: {s.aliases?.join(', ') || 'None'}
                                          </p>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-1.5">
                                          <span className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded border uppercase ${
                                            s.risk_score >= 75
                                              ? 'bg-red-50 text-red-700 border-red-100'
                                              : s.risk_score >= 50
                                                ? 'bg-amber-50 text-amber-700 border-amber-100'
                                                : 'bg-slate-100 text-slate-600 border-slate-200'
                                          }`}>
                                            Threat: {s.risk_score !== null ? `${s.risk_score}%` : 'Unassessed'}
                                          </span>

                                          {s.mo_tags?.map(tag => (
                                            <span key={tag} className="text-[9px] font-bold bg-[#F1F3F6] text-navy-deep px-2 py-0.5 rounded-lg">
                                              {tag}
                                            </span>
                                          ))}
                                        </div>

                                        <div className="pt-2 flex justify-end">
                                          <button
                                            onClick={() => handleFetchSimilarity(s)}
                                            className="text-[11px] font-bold text-gold-accent hover:underline flex items-center gap-1 min-h-[36px]"
                                          >
                                            <Sparkles className="w-3.5 h-3.5" /> Modus Operandi Profiler
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Tab 2: Evidence Timeline (Clean structured cards with negative space instead of tight tables) */}
                          {activeTab === 'evidence' && (
                            <div className="space-y-6">
                              <div className="flex justify-between items-center">
                                <h3 className="text-xs font-bold text-outline uppercase tracking-wider">Judicial Evidence & Telemetry Logs</h3>
                                <button
                                  onClick={() => setIsAddEvidenceOpen(true)}
                                  className="px-4 py-2.5 bg-navy-deep hover:bg-primary-container text-on-primary rounded-xl text-xs font-bold shadow-2xs transition-all active:scale-[0.98] flex items-center gap-1.5 min-h-[40px]"
                                >
                                  <Plus className="w-4 h-4 text-gold-accent" /> Upload CDR / ANPR
                                </button>
                              </div>

                              {caseEvidence.length === 0 ? (
                                <div className="p-12 text-center border border-dashed border-outline-variant/60 rounded-2xl bg-[#FAFAFA] space-y-2 max-w-md">
                                  <p className="text-xs text-outline font-semibold">No cell tower CDR or ANPR logs have been uploaded</p>
                                  <button
                                    onClick={() => setIsAddEvidenceOpen(true)}
                                    className="text-xs font-bold text-primary hover:underline hover:text-gold-accent min-h-[36px]"
                                  >
                                    + Upload first log record
                                  </button>
                                </div>
                              ) : (
                                <div className="space-y-4 max-w-3xl">
                                  {caseEvidence.map(e => {
                                    const isCdr = e.type?.toLowerCase() === 'cdr';
                                    return (
                                      <div 
                                        key={e.id || e._id} 
                                        className="bg-white border border-[#EBEBEB] rounded-2xl p-5 shadow-2xs flex items-start gap-4 transition-all hover:border-slate-300"
                                      >
                                        <div className={`p-3 rounded-xl shrink-0 ${isCdr ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'}`}>
                                          {isCdr ? <PhoneCall className="w-5 h-5" /> : <Car className="w-5 h-5" />}
                                        </div>
                                        
                                        <div className="flex-1 space-y-2">
                                          <div className="flex flex-wrap justify-between items-center gap-2">
                                            <span className="font-mono text-xs font-bold text-navy-deep uppercase bg-slate-100 px-2 py-0.5 rounded">
                                              {e.type} Record
                                            </span>
                                            <span className="text-[10px] text-outline font-bold flex items-center gap-1">
                                              <Clock className="w-3.5 h-3.5" />
                                              {new Date(e.captured_at || Date.now()).toLocaleString()}
                                            </span>
                                          </div>

                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-semibold text-primary pt-1">
                                            <div>
                                              <span className="text-outline text-[10px] uppercase block">Target/Device:</span>
                                              <span className="font-mono">{e.phone_number || 'Tower Feed'}</span>
                                            </div>
                                            <div>
                                              <span className="text-outline text-[10px] uppercase block">Antenna Location:</span>
                                              <span>{e.cell_tower || 'N/A'}</span>
                                            </div>
                                          </div>

                                          {(e.details?.note || e.details?.notes) && (
                                            <div className="pt-2 text-[11px] text-on-surface-variant leading-relaxed border-t border-slate-100 mt-2 font-medium">
                                              {e.details?.note || e.details?.notes}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Tab 3: Suspect Associations */}
                          {activeTab === 'links' && (
                            <div className="space-y-6">
                              <div className="flex justify-between items-center">
                                <h3 className="text-xs font-bold text-outline uppercase tracking-wider">Geospatial & CDR Association Links</h3>
                                <button
                                  onClick={() => setIsAddLinkOpen(true)}
                                  className="px-4 py-2.5 bg-navy-deep hover:bg-primary-container text-on-primary rounded-xl text-xs font-bold shadow-2xs transition-all active:scale-[0.98] flex items-center gap-1.5 min-h-[40px]"
                                >
                                  <Plus className="w-4 h-4 text-gold-accent" /> Register Suspect Link
                                </button>
                              </div>

                              {caseLinks.length === 0 ? (
                                <div className="p-12 text-center border border-dashed border-outline-variant/60 rounded-2xl bg-[#FAFAFA] space-y-2 max-w-md">
                                  <p className="text-xs text-outline font-semibold">No suspect association links mapped yet</p>
                                  <button
                                    onClick={() => setIsAddLinkOpen(true)}
                                    className="text-xs font-bold text-primary hover:underline hover:text-gold-accent min-h-[36px]"
                                  >
                                    + Register link connection
                                  </button>
                                </div>
                              ) : (
                                <div className="space-y-4 max-w-3xl">
                                  {caseLinks.map(l => {
                                    const suspA = caseSuspects.find(s => (s.id || s._id) === l.suspect_a_id);
                                    const suspB = caseSuspects.find(s => (s.id || s._id) === l.suspect_b_id);
                                    const nameA = suspA ? suspA.name : 'Unknown Suspect';
                                    const nameB = suspB ? suspB.name : 'Unknown Suspect';
                                    return (
                                      <div
                                        key={l.id || l._id}
                                        className="p-5 bg-white border border-[#EBEBEB] rounded-2xl shadow-2xs hover:shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                                      >
                                        <div className="flex items-center gap-2">
                                          <span className="font-bold text-navy-deep text-xs">{nameA}</span>
                                          <ChevronRight className="w-3.5 h-3.5 text-gold-accent" />
                                          <span className="font-bold text-navy-deep text-xs">{nameB}</span>
                                        </div>
                                        
                                        <div className="flex items-center gap-4 text-xs font-semibold">
                                          <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[#F1F3F6] uppercase text-primary border border-outline-variant/40">
                                            {l.link_type?.replace('_', ' ')}
                                          </span>
                                          <p className="text-on-surface-variant font-medium max-w-sm truncate">{l.detail}</p>
                                        </div>
                                        
                                        <span className="text-[10px] text-outline font-bold">
                                          {new Date(l.createdAt || l.created_at || Date.now()).toLocaleDateString()}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          )}

                        </motion.div>
                      </AnimatePresence>
                    )}
                  </div>

                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Behavioral profiling similar suspect matcher sliding modal/sheet */}
      {selectedSuspectForSimilarity && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white h-screen shadow-2xl border-l border-outline-variant flex flex-col p-6 space-y-6 overflow-y-auto">
            <div className="flex justify-between items-start pb-4 border-b border-outline-variant">
              <div>
                <span className="text-[9px] font-mono font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded uppercase">Behavioral Modus Operandi (MO) Matcher</span>
                <h3 className="text-base font-bold text-navy-deep pt-1">Querying: {selectedSuspectForSimilarity.name}</h3>
                <p className="text-[11px] text-outline">Target MO Traits: {selectedSuspectForSimilarity.mo_tags?.join(', ') || 'None'}</p>
              </div>
              <button 
                onClick={() => {
                  setSelectedSuspectForSimilarity(null);
                  setSimilarityData(null);
                }} 
                className="p-1 text-outline hover:text-navy-deep font-bold border border-outline-variant rounded-lg"
              >
                Close Panel
              </button>
            </div>

            {loadingSimilarity ? (
              <div className="flex-1 flex flex-col items-center justify-center space-y-2">
                <div className="w-6 h-6 border-4 border-gold-accent border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs text-outline font-bold">Scanning Karnataka criminal database...</p>
              </div>
            ) : similarityData ? (
              <div className="flex-1 space-y-4">
                <div className="p-3 bg-surface-container-low border border-outline-variant/60 rounded-xl flex items-center justify-between text-xs font-semibold text-navy-deep">
                  <span>Total Matches Across District Files:</span>
                  <span className="font-mono font-bold bg-primary text-on-primary px-2 py-0.5 rounded">{similarityData.totalMatches || 0} matches</span>
                </div>

                <div className="space-y-3">
                  {similarityData.matches?.length === 0 ? (
                    <p className="text-xs text-outline italic text-center py-6">No matching criminal behavior or profiles found.</p>
                  ) : (
                    similarityData.matches.map(m => (
                      <div key={m.id} className="p-4 bg-white border border-outline-variant rounded-xl shadow-2xs space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-xs font-bold text-navy-deep">{m.name} {m.aliases?.length ? `(${m.aliases.join(', ')})` : ''}</h4>
                            <p className="text-[10px] text-outline font-bold">Linked to case: {m.case_fir} &bull; {m.case_title}</p>
                          </div>
                          
                          {/* Similarity Scores */}
                          <div className="flex flex-col items-end shrink-0">
                            <span className="text-[10px] font-bold font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              Match Index: {m.combined_score}%
                            </span>
                            <span className="text-[8px] text-outline font-mono pt-1">
                              Jaccard Set: {m.jaccard_similarity}% | Vector: {m.vector_similarity}%
                            </span>
                          </div>
                        </div>

                        {/* Shared Tags */}
                        <div className="flex flex-wrap gap-1">
                          {m.shared_tags?.map(tag => (
                            <span key={tag} className="text-[9px] font-bold bg-amber-50 border border-amber-200 text-amber-800 px-1.5 py-0.5 rounded flex items-center gap-1">
                              <Sparkles className="w-2.5 h-2.5 text-gold-accent" />
                              {tag}
                            </span>
                          ))}
                          {m.mo_tags?.filter(tag => !m.shared_tags.includes(tag)).map(tag => (
                            <span key={tag} className="text-[9px] font-medium bg-surface-container text-on-surface-variant px-1.5 py-0.5 rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <p className="text-xs text-outline italic text-center py-6">No data returned.</p>
            )}
          </div>
        </div>
      )}

      {/* Modals instantiation */}
      <AddCaseModal
        isOpen={isAddCaseOpen}
        onClose={() => setIsAddCaseOpen(false)}
        currentUser={session}
        onAdded={async (c) => {
          if (reloadCases) await reloadCases();
          setSelectedCaseId(c.id || c._id);
        }}
      />

      <AddSuspectModal
        isOpen={isAddSuspectOpen}
        onClose={() => setIsAddSuspectOpen(false)}
        caseId={selectedCaseId}
        currentUser={session}
        onAdded={loadCaseDetails}
      />

      <AddEvidenceModal
        isOpen={isAddEvidenceOpen}
        onClose={() => setIsAddEvidenceOpen(false)}
        caseId={selectedCaseId}
        currentUser={session}
        onAdded={loadCaseDetails}
      />

      <AddSuspectLinkModal
        isOpen={isAddLinkOpen}
        onClose={() => setIsAddLinkOpen(false)}
        caseId={selectedCaseId}
        currentUser={session}
        onAdded={loadCaseDetails}
      />
    </div>
  );
}
