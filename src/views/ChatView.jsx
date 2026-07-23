import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../lib/supabase';
import { createSpeechRecognizer, speakText, stopSpeaking } from '../lib/speech';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';
import { AddCaseModal } from '../components/Modals/AddCaseModal';
import { AddSuspectModal } from '../components/Modals/AddSuspectModal';
import { AddSuspectLinkModal } from '../components/Modals/AddSuspectLinkModal';
import { AddEvidenceModal } from '../components/Modals/AddEvidenceModal';
import { Sparkles, Send, Mic, Volume2, VolumeX, Copy, CheckCircle2, FileText, Info, X, Plus, ChevronDown, User, Share2, FileSpreadsheet } from 'lucide-react';

export function ChatView({ setActiveScreen }) {
  const { session } = useAuth();
  const [cases, setCases] = useState([]);
  const [selectedCaseId, setSelectedCaseId] = useState(null);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [promptInput, setPromptInput] = useState('');
  const [language, setLanguage] = useState('en'); // 'en' | 'kn'
  const [isThinking, setIsThinking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [citationModalRecord, setCitationModalRecord] = useState(null);

  // Modals
  const [isAddCaseOpen, setIsAddCaseOpen] = useState(false);
  const [isAddSuspectOpen, setIsAddSuspectOpen] = useState(false);
  const [isAddLinkOpen, setIsAddLinkOpen] = useState(false);
  const [isAddEvidenceOpen, setIsAddEvidenceOpen] = useState(false);

  // Custom Menus / Toggles
  const [isActionsMenuOpen, setIsActionsMenuOpen] = useState(false);
  const [isGlossaryOpen, setIsGlossaryOpen] = useState(false);

  const chatEndRef = useRef(null);

  const [caseSuspects, setCaseSuspects] = useState([]);
  const [caseEvidence, setCaseEvidence] = useState([]);

  const reloadData = async () => {
    try {
      const loadedCases = await dbService.getCases(session);
      setCases(loadedCases);
      
      let activeId = selectedCaseId;
      if (!activeId && loadedCases.length > 0) {
        activeId = loadedCases[0].id || loadedCases[0]._id;
        setSelectedCaseId(activeId);
      }
      
      if (activeId) {
        const [loadedSuspects, loadedEvidence] = await Promise.all([
          dbService.getSuspects(activeId),
          dbService.getEvidence(activeId)
        ]);
        setCaseSuspects(loadedSuspects);
        setCaseEvidence(loadedEvidence);
      } else {
        setCaseSuspects([]);
        setCaseEvidence([]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    reloadData();
  }, [session, selectedCaseId]);

  // Load or create conversation session whenever selectedCaseId or session changes
  useEffect(() => {
    if (!session) return;
    const loadConversation = async () => {
      try {
        const userConvs = await dbService.getConversations(session);
        const existing = userConvs.find(c => c.case_id === selectedCaseId || !selectedCaseId);

        let convId = existing?.id || existing?._id;
        if (!convId) {
          const newConv = await dbService.createConversation(session, selectedCaseId, 'Investigation Session');
          convId = newConv.id || newConv._id;
        }

        setCurrentConversationId(convId);
        const msgs = await dbService.getMessages(convId);
        setMessages(msgs);
      } catch (err) {
        console.error(err);
      }
    };
    loadConversation();
  }, [session, selectedCaseId]);

  const handleNewInvestigation = async () => {
    if (!session) return;
    try {
      const newConv = await dbService.createConversation(session, selectedCaseId, `Investigation ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
      setCurrentConversationId(newConv.id || newConv._id);
      setMessages([]);
    } catch (err) {
      console.error(err);
    }
  };

  const selectedCase = cases.find(c => c.id === selectedCaseId || c._id === selectedCaseId);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking]);

  // STT Microphone Handler
  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      return;
    }

    setIsRecording(true);
    const recognizer = createSpeechRecognizer({
      lang: language,
      onResult: (text) => {
        setPromptInput(text);
      },
      onError: (err) => {
        console.error('Speech recognition error:', err);
        setIsRecording(false);
      },
      onEnd: () => {
        setIsRecording(false);
      }
    });

    if (recognizer) {
      recognizer.start();
    } else {
      setIsRecording(false);
      alert('Speech recognition is not supported in this browser environment.');
    }
  };

  // TTS Speaker Handler
  const handleSpeak = (text) => {
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
      return;
    }

    setIsSpeaking(true);
    speakText({
      text,
      lang: language,
      onEnd: () => setIsSpeaking(false)
    });
  };

  // Send Message Handler
  const handleSendMessage = async (e) => {
    e.preventDefault();
    const query = promptInput.trim();
    if (!query || !currentConversationId) return;

    setPromptInput('');
    setIsThinking(true);

    const tempUserMsg = {
      id: 'temp-' + Date.now(),
      conversation_id: currentConversationId,
      role: 'user',
      content: query,
      language,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversation_id: currentConversationId,
          role: 'user',
          content: query,
          language,
          caseId: selectedCaseId,
          userId: session?.profile?.id || session?.profile?._id
        })
      });
      if (!res.ok) throw new Error(await res.text());
      const { userMessage, assistantMessage } = await res.json();
      
      setIsThinking(false);
      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== tempUserMsg.id);
        return [...filtered, userMessage, assistantMessage];
      });

      speakText({ text: assistantMessage.content, lang: language });
    } catch (err) {
      setIsThinking(false);
      console.error('RAG Error:', err);
    }
  };

  // Citation Inspector Handler
  const handleInspectCitation = (recordId) => {
    const db = dbService.getDB();
    const suspect = db.suspects.find(s => s.id === recordId);
    if (suspect) {
      setCitationModalRecord({ type: 'Suspect Record', title: suspect.name, details: `Aliases: ${suspect.aliases?.join(', ') || 'None'} | Risk Score: ${suspect.risk_score || 'Unassessed'}%` });
      return;
    }
    const evidence = db.evidence_records.find(e => e.id === recordId);
    if (evidence) {
      setCitationModalRecord({ type: `Evidence Record (${evidence.type.toUpperCase()})`, title: evidence.cell_tower || evidence.phone_number || 'Evidence Log', details: `Target: ${evidence.phone_number || 'N/A'} | Captured: ${new Date(evidence.captured_at).toLocaleString()}` });
      return;
    }
    const link = db.suspect_links.find(l => l.id === recordId);
    if (link) {
      setCitationModalRecord({ type: 'Suspect Link Edge', title: `Link Type: ${link.link_type.toUpperCase()}`, details: link.detail || 'Documented link basis' });
      return;
    }
    const caseRec = db.cases.find(c => c.id === recordId);
    if (caseRec) {
      setCitationModalRecord({ type: 'FIR Case Record', title: caseRec.fir_number, details: `${caseRec.title} &mdash; ${caseRec.description}` });
      return;
    }
  };

  return (
    <div className="flex flex-col h-screen antialiased text-on-surface">
      <Navbar activeScreen="chat" setActiveScreen={setActiveScreen} />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Navigation */}
        <Sidebar
          activeScreen="chat"
          setActiveScreen={setActiveScreen}
          cases={cases}
          selectedCaseId={selectedCaseId}
          setSelectedCaseId={setSelectedCaseId}
          onOpenAddCase={() => setIsAddCaseOpen(true)}
          onOpenAddSuspect={() => setIsAddSuspectOpen(true)}
          onOpenAddEvidence={() => setIsAddEvidenceOpen(true)}
        />

        {/* Primary Chat Canvas */}
        <main className="flex-1 flex flex-col bg-white overflow-hidden relative">
          
          {/* Active Case Banner & Conversation Control */}
          <div className="p-3 px-6 bg-surface-container-low border-b border-outline-variant/60 flex flex-wrap justify-between items-center text-xs gap-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-navy-deep">Active FIR Scope:</span>
              {selectedCase ? (
                <span className="font-mono bg-white px-2 py-0.5 rounded border border-outline-variant text-navy-deep font-bold">
                  {selectedCase.fir_number} &mdash; {selectedCase.title}
                </span>
              ) : (
                <span className="text-outline italic">Searching Across All Station FIRs</span>
              )}
            </div>
            <div className="flex items-center gap-3 relative">
              <button
                onClick={handleNewInvestigation}
                className="px-3 py-1.5 bg-navy-deep text-on-primary rounded-lg text-[11px] font-bold hover:opacity-90 transition-all flex items-center gap-1 shadow-2xs"
              >
                <Sparkles className="w-3.5 h-3.5 text-gold-accent" /> {language === 'kn' ? 'ಹೊಸ ಚಾಟ್' : 'New Chat'}
              </button>
              <span className="text-outline">|</span>
              
              <div className="relative">
                <button
                  onClick={() => setIsActionsMenuOpen(!isActionsMenuOpen)}
                  className="px-3 py-1.5 bg-surface-container hover:bg-surface-container-high border border-outline-variant/60 text-primary text-[11px] font-bold rounded-lg transition-all flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5 text-gold-accent" />
                  <span>{language === 'kn' ? 'ದಾಖಲೆ ಸೇರಿಸಿ' : 'Add Record'}</span>
                  <ChevronDown className="w-3 h-3 text-outline" />
                </button>
                {isActionsMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-outline-variant rounded-xl shadow-lg py-1.5 z-30 font-semibold text-xs text-on-surface">
                    <button
                      onClick={() => { setIsAddCaseOpen(true); setIsActionsMenuOpen(false); }}
                      className="w-full text-left px-4 py-2 hover:bg-surface-container flex items-center gap-2"
                    >
                      <FileText className="w-3.5 h-3.5 text-primary" /> {language === 'kn' ? 'ಎಫ್‌ಐಆರ್ ದಾಖಲಿಸಿ' : 'Register Case (FIR)'}
                    </button>
                    {selectedCaseId && (
                      <>
                        <button
                          onClick={() => { setIsAddSuspectOpen(true); setIsActionsMenuOpen(false); }}
                          className="w-full text-left px-4 py-2 hover:bg-surface-container flex items-center gap-2"
                        >
                          <User className="w-3.5 h-3.5 text-primary" /> {language === 'kn' ? 'ಶಂಕಿತರನ್ನು ಸೇರಿಸಿ' : 'Add Suspect'}
                        </button>
                        <button
                          onClick={() => { setIsAddLinkOpen(true); setIsActionsMenuOpen(false); }}
                          className="w-full text-left px-4 py-2 hover:bg-surface-container flex items-center gap-2"
                        >
                          <Share2 className="w-3.5 h-3.5 text-primary" /> {language === 'kn' ? 'ಸಂಪರ್ಕ ಜೋಡಿಸಿ' : 'Link Suspects'}
                        </button>
                        <button
                          onClick={() => { setIsAddEvidenceOpen(true); setIsActionsMenuOpen(false); }}
                          className="w-full text-left px-4 py-2 hover:bg-surface-container flex items-center gap-2"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5 text-primary" /> {language === 'kn' ? 'ಸಾಕ್ಷ್ಯ ಅಪ್ಲೋಡ್' : 'Upload Evidence'}
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto scrolling-content px-6 py-6 space-y-6">
            <div className="max-w-[840px] mx-auto space-y-6">
              
              {/* Welcome space */}

              {/* Initial Welcome Card */}
              {messages.length === 0 && (
                <div className="bg-surface-container-low border border-outline-variant/60 p-6 rounded-2xl space-y-3 shadow-2xs">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-gold-accent" />
                    <h3 className="text-sm font-bold text-navy-deep">
                      {language === 'kn' ? 'ನ್ಯಾಯನೇತ್ರ ಕೃತಕ ಬುದ್ಧಿಮತ್ತೆ ತನಿಖಾ ಸಹಾಯಕ' : 'NyayaNetra Grounded Intelligence Assistant'}
                    </h3>
                  </div>
                  <p className="text-xs text-on-surface leading-relaxed">
                    {language === 'kn'
                      ? 'ಈ ವ್ಯವಸ್ಥೆಯು ನೀವು ದತ್ತಸಂಚಯದಲ್ಲಿ ಸೇರಿಸಿದ ಪ್ರಕಟಿತ ಎಫ್‌ಐಆರ್ ಪ್ರಕರಣಗಳು, ಸಿಡಿಆರ್ ಕರೆ ದಾಖಲೆಗಳು ಮತ್ತು ಶಂಕಿತರ ನೆಟ್‌ವರ್ಕ್ ಮಾಹಿತಿಯಿಂದ ನೈಜ ಉತ್ತರವನ್ನು ನೀಡುತ್ತದೆ.'
                      : 'This assistant queries user-entered FIR files, suspects, and CDR/ANPR evidence records stored in the database. Enter an inquiry below to analyze forensic evidence.'
                    }
                  </p>
                  <div className="pt-2 flex flex-wrap gap-2 text-xs font-semibold">
                    <button
                      onClick={() => setPromptInput(language === 'kn' ? 'ಪ್ರಕರಣದ ಶಂಕಿತರ ವಿವರಗಳನ್ನು ನೀಡಿ' : 'Summarize suspect details for active case')}
                      className="px-3 py-1.5 bg-white border border-outline-variant rounded-full text-navy-deep hover:bg-surface-container transition-colors shadow-2xs"
                    >
                      {language === 'kn' ? 'ಶಂಕಿತರ ವಿವರ' : 'Summarize suspect details'}
                    </button>
                    <button
                      onClick={() => setPromptInput(language === 'kn' ? 'ಸಿಡಿಆರ್ ಕರೆಯನ್ನು ಪರಿಶೀಲಿಸಿ' : 'Cross-reference CDR evidence records')}
                      className="px-3 py-1.5 bg-white border border-outline-variant rounded-full text-navy-deep hover:bg-surface-container transition-colors shadow-2xs"
                    >
                      {language === 'kn' ? 'ಸಿಡಿಆರ್ ಪರಿಶೀಲಿಸಿ' : 'Cross-reference CDR records'}
                    </button>
                  </div>
                </div>
              )}

              {/* Render Message Stream */}
              {messages.map(msg => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'user' ? (
                    <div className="max-w-[85%] bg-primary text-on-primary p-4 rounded-2xl rounded-tr-none shadow-sm">
                      <p className="text-sm leading-relaxed">{msg.content}</p>
                      <span className="text-[10px] opacity-70 font-mono mt-1.5 block text-right">
                        {new Date(msg.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ) : (
                    <div className="max-w-[88%] flex flex-col gap-2">
                      <div className="bg-white border border-outline-variant p-5 rounded-2xl rounded-tl-none shadow-sm">
                        <div className="flex items-center justify-between pb-3 mb-3 border-b border-outline-variant/60">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-gold-accent" />
                            <span className="text-xs font-bold text-primary uppercase tracking-wider">
                              AI Copilot Analysis
                            </span>
                          </div>
                          {msg.confidence_score !== null && (
                            <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold border ${
                              msg.confidence_score > 70
                                ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                                : 'bg-amber-100 text-amber-900 border-amber-300'
                            }`}>
                              CONFIDENCE: {msg.confidence_score}%
                            </span>
                          )}
                        </div>

                        <p className="text-sm text-on-surface leading-relaxed whitespace-pre-wrap">{msg.content}</p>

                        {/* Citations Footer */}
                        <div className="mt-4 pt-3 border-t border-outline-variant/60 flex flex-wrap justify-between items-center gap-2">
                          <div className="flex flex-wrap gap-1.5 items-center text-xs">
                            <span className="text-outline font-bold">Citations:</span>
                            {(!msg.cited_record_ids || msg.cited_record_ids.length === 0) ? (
                              <span className="text-outline text-[11px] italic">No record citations required</span>
                            ) : (
                              msg.cited_record_ids.map((id, idx) => (
                                <button
                                  key={id}
                                  onClick={() => handleInspectCitation(id)}
                                  className="px-2 py-0.5 bg-surface-container border border-outline-variant text-navy-deep font-mono text-[10px] font-bold rounded hover:bg-gold-accent/20 transition-colors flex items-center gap-1"
                                >
                                  <Info className="w-3 h-3 text-gold-accent" /> Record #{idx + 1}
                                </button>
                              ))
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleSpeak(msg.content)}
                              className="p-1.5 text-outline hover:text-navy-deep rounded-lg transition-colors"
                              title="Listen to text-to-speech audio"
                            >
                              {isSpeaking ? <VolumeX className="w-4 h-4 text-red-600" /> : <Volume2 className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => navigator.clipboard.writeText(msg.content)}
                              className="p-1.5 text-outline hover:text-navy-deep rounded-lg transition-colors"
                              title="Copy response text"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}

              {/* RAG Thinking Spinner */}
              {isThinking && (
                <div className="flex justify-start">
                  <div className="bg-white border border-outline-variant p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary animate-spin text-xl">sync</span>
                    <span className="text-xs font-semibold text-primary">
                      {language === 'kn'
                        ? 'ಮಾಹಿತಿಯನ್ನು ವಿಶ್ಲೇಷಿಸಲಾಗುತ್ತಿದೆ...'
                        : 'Analyzing records...'
                      }
                    </span>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>
          </div>

          {/* Prompt Input Controls Footer */}
          <div className="p-4 bg-white border-t border-outline-variant shrink-0">
            <div className="max-w-[840px] mx-auto space-y-3">
              
              {/* Quick Query Shortcuts */}
              {selectedCaseId && (
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="text-[11px] font-bold text-outline uppercase tracking-wider flex items-center">
                    {language === 'kn' ? 'ತ್ವರಿತ ಪ್ರಶ್ನೆಗಳು:' : 'Quick Queries:'}
                  </span>
                  <button
                    onClick={() => setPromptInput(language === 'kn' ? 'ಪ್ರಕರಣದ ವಿವರ ತಿಳಿಸಿ' : 'Give case summary')}
                    className="px-2.5 py-1 bg-surface-container hover:bg-surface-container-high border border-outline-variant rounded-full font-semibold transition-all text-navy-deep text-[11px]"
                  >
                    {language === 'kn' ? '📋 ಪ್ರಕರಣದ ಸಾರಾಂಶ' : '📋 Case Summary'}
                  </button>
                  <button
                    onClick={() => setPromptInput(language === 'kn' ? 'ಶಂಕಿತರು ಯಾರು?' : 'Who are the suspects')}
                    className="px-2.5 py-1 bg-surface-container hover:bg-surface-container-high border border-outline-variant rounded-full font-semibold transition-all text-navy-deep text-[11px]"
                  >
                    {language === 'kn' ? '👥 ಶಂಕಿತರ ಪಟ್ಟಿ' : '👥 Suspect List'}
                  </button>
                  <button
                    onClick={() => setPromptInput(language === 'kn' ? 'ಕರೆ ದಾಖಲೆಗಳು ವಿವರ ನೀಡಿ' : 'Show phone call records')}
                    className="px-2.5 py-1 bg-surface-container hover:bg-surface-container-high border border-outline-variant rounded-full font-semibold transition-all text-navy-deep text-[11px]"
                  >
                    {language === 'kn' ? '📞 ಕರೆ ದಾಖಲೆಗಳು (CDR)' : '📞 Phone Records'}
                  </button>
                  <button
                    onClick={() => setPromptInput(language === 'kn' ? 'ಸಂಪರ್ಕ ಜಾಲಬಂಧ ತೋರಿಸಿ' : 'Show connection links')}
                    className="px-2.5 py-1 bg-surface-container hover:bg-surface-container-high border border-outline-variant rounded-full font-semibold transition-all text-navy-deep text-[11px]"
                  >
                    {language === 'kn' ? '🔗 ಸಂಪರ್ಕಗಳು' : '🔗 Connections'}
                  </button>
                </div>
              )}

              <form onSubmit={handleSendMessage} className="relative group">
                <textarea
                  rows={1}
                  value={promptInput}
                  onChange={(e) => setPromptInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                  className="w-full pl-4 pr-44 py-3.5 bg-surface-container-lowest border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none text-sm font-medium text-on-surface"
                  placeholder={
                    language === 'kn'
                      ? 'ಮಲ್ಲೇಶ್ವರಂ ಪ್ರಕರಣ ಅಥವಾ ಸಿಡಿಆರ್ ಮಾಹಿತಿಯನ್ನು ಕನ್ನಡದಲ್ಲಿ ನಮೂದಿಸಿ...'
                      : 'Enter investigation query in English...'
                  }
                />
                
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  {/* Language Switcher Button */}
                  <div className="flex items-center border border-outline-variant rounded-lg overflow-hidden bg-white text-xs font-bold shadow-2xs">
                    <button
                      type="button"
                      onClick={() => setLanguage('en')}
                      className={`px-2.5 py-1 ${language === 'en' ? 'bg-primary text-on-primary' : 'text-outline hover:bg-surface-container'}`}
                    >
                      Eng
                    </button>
                    <button
                      type="button"
                      onClick={() => setLanguage('kn')}
                      className={`px-2.5 py-1 ${language === 'kn' ? 'bg-primary text-on-primary' : 'text-outline hover:bg-surface-container'}`}
                    >
                      Kan (ಕನ್ನಡ)
                    </button>
                  </div>

                  {/* STT Microphone Button */}
                  <button
                    type="button"
                    onClick={toggleRecording}
                    className={`p-2 rounded-full transition-all ${
                      isRecording ? 'bg-red-600 text-white animate-bounce' : 'text-primary hover:bg-surface-container-high'
                    }`}
                    title="Voice-to-Text STT (Bhashini API for Kannada)"
                  >
                    <Mic className="w-5 h-5" />
                  </button>

                  {/* Send Button */}
                  <button
                    type="submit"
                    className="p-2 bg-primary text-on-primary rounded-lg hover:bg-primary-container transition-all active:scale-95 shadow-sm"
                    title="Run RAG Query"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </form>
            </div>
          </div>
        </main>

        {/* Right Insights Sidebar */}
        <aside className="w-[340px] bg-surface-container-low border-l border-outline-variant flex flex-col h-full overflow-y-auto scrolling-content hidden lg:flex shrink-0">
          <div className="p-4 border-b border-outline-variant bg-white sticky top-0 z-10 flex justify-between items-center shadow-2xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-gold-accent" />
              <h3 className="text-xs font-bold text-primary uppercase tracking-wider">Contextual Insights</h3>
            </div>
            <span className="text-[10px] font-mono bg-primary-fixed text-primary px-2 py-0.5 rounded font-bold">LIVE DATABASE</span>
          </div>

          <div className="p-4 space-y-4">
            {/* Live Suspect Roster Card */}
            <div className="bg-white border border-outline-variant rounded-xl p-4 shadow-2xs space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-primary">Case Suspect Roster ({caseSuspects.length})</span>
                <button
                  onClick={() => setIsAddSuspectOpen(true)}
                  className="text-[11px] text-gold-accent font-bold hover:underline"
                >
                  + Add Suspect
                </button>
              </div>

              {caseSuspects.length === 0 ? (
                <p className="text-xs text-outline italic">No suspects added for this case yet.</p>
              ) : (
                <div className="space-y-2">
                  {caseSuspects.map(s => (
                    <div key={s.id} className="p-2.5 bg-surface-container-low border border-outline-variant/50 rounded-lg flex justify-between items-center text-xs">
                      <div>
                        <p className="font-bold text-navy-deep">{s.name}</p>
                        <p className="text-[10px] text-outline">{s.aliases?.join(', ') || 'No aliases'}</p>
                      </div>
                      <span className="font-mono text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">
                        Risk: {s.risk_score !== null ? `${s.risk_score}%` : 'Unassessed'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Live Evidence Records Card */}
            <div className="bg-white border border-outline-variant rounded-xl p-4 shadow-2xs space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-primary">Evidence Log ({caseEvidence.length})</span>
                <button
                  onClick={() => setIsAddEvidenceOpen(true)}
                  className="text-[11px] text-gold-accent font-bold hover:underline"
                >
                  + Upload CDR
                </button>
              </div>

              {caseEvidence.length === 0 ? (
                <p className="text-xs text-outline italic">No CDR/ANPR evidence uploaded yet.</p>
              ) : (
                <div className="space-y-2">
                  {caseEvidence.map(e => (
                    <div key={e.id} className="p-2.5 bg-surface-container-low border border-outline-variant/50 rounded-lg text-xs space-y-1">
                      <div className="flex justify-between items-center font-mono font-bold">
                        <span className="text-navy-deep">{e.type.toUpperCase()} Record</span>
                        <span className="text-emerald-700">{e.phone_number || 'Tower Feed'}</span>
                      </div>
                      <p className="text-[11px] text-outline">{e.cell_tower}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Collapsible Glossary Card */}
            <div className="bg-white border border-outline-variant rounded-xl p-4 shadow-2xs space-y-2 text-xs shrink-0">
              <button
                type="button"
                onClick={() => setIsGlossaryOpen(!isGlossaryOpen)}
                className="w-full flex justify-between items-center font-bold text-primary hover:underline outline-none"
              >
                <span className="flex items-center gap-1.5">
                  <span>💡</span>
                  <span>{language === 'kn' ? 'ತ್ವರಿತ ಸಹಾಯ: ಪದಗಳ ಅರ್ಥ' : 'Quick Glossary: Police Terms'}</span>
                </span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform text-outline ${isGlossaryOpen ? 'rotate-180' : ''}`} />
              </button>
              {isGlossaryOpen && (
                <div className="space-y-3.5 pt-2.5 border-t border-outline-variant/60 text-[11px] leading-relaxed text-on-surface-variant">
                  <div>
                    <p className="font-bold text-navy-deep">{language === 'kn' ? 'ಎಫ್‌ಐಆರ್ (FIR - Case File)' : 'Case File (FIR)'}</p>
                    <p>{language === 'kn' ? 'ದಾಖಲಾದ ಅಪರಾಧ ಪ್ರಕರಣದ ಪ್ರಾಥಮಿಕ ತನಿಖಾ ವರದಿ.' : 'First Information Report registering the crime & triggering the investigation.'}</p>
                  </div>
                  <div>
                    <p className="font-bold text-navy-deep">{language === 'kn' ? 'ಕರೆ ದಾಖಲೆಗಳು (CDR)' : 'Phone Records (CDR)'}</p>
                    <p>{language === 'kn' ? 'ಮೊಬೈಲ್ ಕರೆಗಳ ವಿವರ, ಸಂಭಾಷಣೆ ನಡೆದ ಸಮಯ ಮತ್ತು ಟವರ್ ಲೊಕೇಶನ್.' : 'Call Detail Records showing call timelines and cell tower locations.'}</p>
                  </div>
                  <div>
                    <p className="font-bold text-navy-deep">{language === 'kn' ? 'ಕ್ಯಾಮೆರಾ ದಾಖಲೆಗಳು (ANPR)' : 'Vehicle Cameras (ANPR)'}</p>
                    <p>{language === 'kn' ? 'ವಾಹನಗಳ ಚಲನವಲನ ಮತ್ತು ನಂಬರ್ ಪ್ಲೇಟ್ ಪತ್ತೆಮಾಡುವ ಆಟೋಮ್ಯಾಟಿಕ್ ಕ್ಯಾಮೆರಾಗಳು.' : 'Automatic Number Plate Recognition cameras logging vehicle plates.'}</p>
                  </div>
                  <div>
                    <p className="font-bold text-navy-deep">{language === 'kn' ? 'ಸಂಪರ್ಕ ಜಾಲಬಂಧ (Connection Map)' : 'Connection Map'}</p>
                    <p>{language === 'kn' ? 'ಶಂಕಿತರು ಒಬ್ಬರಿಗೊಬ್ಬರು ಹೇಗೆ ಸಂಪರ್ಕ ಹೊಂದಿದ್ದಾರೆ ಎಂಬುದನ್ನು ತೋರಿಸುವ ಚಿತ್ರ.' : 'Visual chart mapping links (calls/meetings) between suspects.'}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Context Insights */}
          </div>
        </aside>
      </div>

      {/* Citation Record Inspector Modal */}
      {citationModalRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white border border-outline-variant rounded-2xl shadow-xl p-6 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-outline-variant">
              <div>
                <span className="text-[10px] font-mono font-bold text-amber-800 uppercase">{citationModalRecord.type}</span>
                <h3 className="text-base font-bold text-navy-deep">{citationModalRecord.title}</h3>
              </div>
              <button onClick={() => setCitationModalRecord(null)} className="p-1 text-outline hover:text-navy-deep">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-on-surface leading-relaxed">{citationModalRecord.details}</p>
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setCitationModalRecord(null)}
                className="px-4 py-2 bg-navy-deep text-white rounded-lg text-xs font-bold"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      <AddCaseModal
        isOpen={isAddCaseOpen}
        onClose={() => setIsAddCaseOpen(false)}
        onAdded={reloadData}
        currentUser={session}
      />

      <AddSuspectModal
        isOpen={isAddSuspectOpen}
        onClose={() => setIsAddSuspectOpen(false)}
        onAdded={reloadData}
        caseId={selectedCaseId}
        currentUser={session}
      />

      <AddSuspectLinkModal
        isOpen={isAddLinkOpen}
        onClose={() => setIsAddLinkOpen(false)}
        onAdded={reloadData}
        caseId={selectedCaseId}
        currentUser={session}
      />

      <AddEvidenceModal
        isOpen={isAddEvidenceOpen}
        onClose={() => setIsAddEvidenceOpen(false)}
        onAdded={reloadData}
        caseId={selectedCaseId}
        currentUser={session}
      />
    </div>
  );
}
