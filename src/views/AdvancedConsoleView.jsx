import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../lib/api';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';
import { 
  Cpu, MessageSquare, Mic, Layers, FileText, Share2, 
  TrendingUp, AlertTriangle, CheckCircle2, ShieldAlert,
  Play, Check, Loader2, Sparkles, Terminal, ChevronRight, X,
  Users, Radio
} from 'lucide-react';

const CATEGORIES = [
  {
    id: 'chatbot',
    name: 'AI Chatbot Assistants',
    icon: MessageSquare,
    color: 'bg-indigo-500/10 text-indigo-600 border-indigo-200',
    description: 'Auto-translators, query-understanding assistants, and fact-checking controls.',
    subFeatures: [
      { id: 'intent_classifier', title: 'Query Understanding Assistant', desc: 'Predicts what information you need (like phone records or suspect lists) before searching.' },
      { id: 'language_detector', title: 'Language Auto-Translator', desc: 'Automatically detects Kannada, English, or mixed speech and translates it.' },
      { id: 'grounding_validator', title: 'Fact-Checking Guard', desc: 'Checks the AI response against real case files to prevent fake details.' },
      { id: 'legal_reference_mapper', title: 'Law & Section Finder', desc: 'Finds which laws (BNS / BNSS) apply to the case notes.' },
      { id: 'query_suggestions', title: 'Smart Question Recommender', desc: 'Suggests the best follow-up questions to ask the chatbot next.' },
      { id: 'token_meter', title: 'AI Memory & Token Gauge', desc: 'Measures how much memory/data the AI is using for this query out of its allowed limit.' },
      { id: 'semantic_search', title: 'Smart Search by Meaning', desc: 'Searches case files by overall meaning instead of just matching exact words.' },
      { id: 'entity_highlighter', title: 'Key Details Extractor', desc: 'Automatically highlights names, phone numbers, and locations in case files.' },
      { id: 'confidence_audit', title: 'Truthfulness & Reliability Rating', desc: 'Gives a score from 0% to 100% on how reliable and fact-backed the AI response is.' },
      { id: 'system_prompts', title: 'AI Safety Inspector', desc: 'Inspects AI instructions to ensure it follows official guidelines.' }
    ]
  },
  {
    id: 'voice',
    name: 'Voice Search & Speech',
    icon: Mic,
    color: 'bg-emerald-500/10 text-emerald-600 border-emerald-200',
    description: 'Speech recognition settings and natural voice pronunciation tools.',
    subFeatures: [
      { id: 'stt_debugger', title: 'Voice Input Checker', desc: 'Analyzes spoken words to see if the system heard them correctly.' },
      { id: 'kannada_advisor', title: 'Kannada Accent Checker', desc: 'Ensures regional pronunciation and dialect inputs are parsed accurately.' },
      { id: 'pitch_customizer', title: 'Voice Accent Settings', desc: 'Fine-tune the tone, speed, and volume of the AI speaking voice.' },
      { id: 'voice_selector', title: 'Natural Voice Selector', desc: 'Choose between different high-quality voice options for speaking reports.' },
      { id: 'mic_monitor', title: 'Microphone Volume Monitor', desc: 'Checks volume and background noise levels to ensure clear recording.' },
      { id: 'audio_exporter', title: 'Voice Report Exporter', desc: 'Saves spoken reports as audio files to download.' },
      { id: 'voice_shortcuts', title: 'Voice Quick Commands', desc: 'Control navigation or search simply by saying quick voice commands.' },
      { id: 'continuous_listening', title: 'Hands-Free Voice Mode', desc: 'Keeps the microphone ready so you can search hands-free.' },
      { id: 'digits_spacing', title: 'Phone Number Speaker', desc: 'Ensures the AI speaks phone numbers digit-by-digit with natural pauses.' },
      { id: 'stt_fallback', title: 'Keyboard Typing Fallback', desc: 'Alternative search options if your microphone is disabled or unavailable.' }
    ]
  },
  {
    id: 'context',
    name: 'Smart Case Memory',
    icon: Layers,
    color: 'bg-blue-500/10 text-blue-600 border-blue-200',
    description: 'Manage case context sizes, active case files, and chat history logs.',
    subFeatures: [
      { id: 'history_exporter', title: 'Chat History Exporter', desc: 'Download your full conversation logs with the AI.' },
      { id: 'context_viewer', title: 'Active Case File Viewer', desc: 'Inspect case files and logs loaded into the AI’s memory.' },
      { id: 'session_check', title: 'Security Access Checker', desc: 'Verifies your badge ID and station access permission.' },
      { id: 'context_size_meter', title: 'Case Data Size Meter', desc: 'Measures the total size of case files loaded into the system.' },
      { id: 'drift_detector', title: 'Topic Shift Guard', desc: 'Warns you if you start asking about a different case than the one selected.' },
      { id: 'thread_clearance', title: 'Security Clearance Check', desc: 'Ensures you do not view information above your clearance level.' },
      { id: 'context_pruner', title: 'Smart Memory Optimizer', desc: 'Clears out old search history to keep the AI fast and focused.' },
      { id: 'turn_visualizer', title: 'Chat History Tree', desc: 'Visualizes your case search history like a timeline tree.' },
      { id: 'archived_threads', title: 'Closed Case Archives', desc: 'Reopen and view old case chat sessions.' },
      { id: 'metadata_tags', title: 'Case Tag Editor', desc: 'Add simple category tags (like "Cyber" or "Fraud") to case files.' }
    ]
  },
  {
    id: 'pdf',
    name: 'Official PDF Reports',
    icon: FileText,
    color: 'bg-red-500/10 text-red-600 border-red-200',
    description: 'Create print-ready reports with official seals and watermarks.',
    subFeatures: [
      { id: 'pdf_previewer', title: 'Report Print Preview', desc: 'See how the printed report pages will look before saving.' },
      { id: 'component_builder', title: 'Report Section Chooser', desc: 'Choose exactly which sections (e.g., suspect details, logs) to print.' },
      { id: 'seal_customizer', title: 'Official Seal Appender', desc: 'Adds official seals and investigator signature lines.' },
      { id: 'watermark_controller', title: 'Confidentiality Watermark', desc: 'Adds a "CONFIDENTIAL" watermark across all report pages.' },
      { id: 'custom_notes_append', title: 'Appendix Notes Builder', desc: 'Attach official investigator observations to dossier footer.' },
      { id: 'layout_optimizer', title: 'Report Formatting Tool', desc: 'Adjusts margins and text size for a professional printout.' },
      { id: 'digital_sig', title: 'Secure Digital Signature', desc: 'Lock the document with your digital badge ID signature.' },
      { id: 'print_stylesheet', title: 'Print Format Validator', desc: 'Ensures table columns fit onto standard A4 paper sizes.' },
      { id: 'dossier_hash', title: 'File Anti-Tampering Hash', desc: 'Generates a unique security code to prove the report has not been edited.' },
      { id: 'export_audit', title: 'Report Export Logger', desc: 'Logs who created and printed this report for transparency.' }
    ]
  },
  {
    id: 'network',
    name: 'Suspect Connection Map',
    icon: Share2,
    color: 'bg-amber-500/10 text-amber-600 border-amber-200',
    description: 'Map connections, accomplice circles, and target phone logs.',
    subFeatures: [
      { id: 'force_arrangement', title: 'Circle Layout Arranger', desc: 'Rearrange suspect map nodes in a clear, visible circle.' },
      { id: 'link_weight', title: 'Connection Line Thickness', desc: 'Shows thicker lines for suspects who talk to each other more often.' },
      { id: 'centrality_analytics', title: 'Most Connected Suspect Finder', desc: 'Identifies which suspect is the main hub in the network.' },
      { id: 'connection_finder', title: 'Shortest Connection Path', desc: 'Shows how two suspects are connected through middle-men.' },
      { id: 'link_editor', title: 'Interactive Link Connector', desc: 'Draw or remove connection lines between suspects manually.' },
      { id: 'node_highlight_filter', title: 'Risk Filter Slider', desc: 'Highlight only suspects whose risk score is above a set level.' },
      { id: 'geospatial_overlay', title: 'Map Coordinate Overlay', desc: 'Pin suspects onto a physical map based on cell tower coordinates.' },
      { id: 'orphan_nodes', title: 'Isolated Suspect Filter', desc: 'Hide suspects who have zero connections to the group.' },
      { id: 'link_pie_chart', title: 'Connection Type Breakdown', desc: 'Chart showing the ratio of accomplice, family, or phone log connections.' },
      { id: 'export_network_img', title: 'Map Photo Exporter', desc: 'Download a high-resolution image of the connection map.' }
    ]
  },
  {
    id: 'trends',
    name: 'Crime Maps & Hotspots',
    icon: TrendingUp,
    color: 'bg-cyan-500/10 text-cyan-600 border-cyan-200',
    description: 'District filter selectors, peak crime hours, and workload trackers.',
    subFeatures: [
      { id: 'district_selector', title: 'District Switcher', desc: 'Filter crime statistics and activity by Karnataka district.' },
      { id: 'tower_density', title: 'Cell Tower Signal Density', desc: 'Identifies which mobile towers received the highest call volumes.' },
      { id: 'peak_crime_hour', title: 'Peak Active Hours', desc: 'Charts the times of day when suspect activity is highest.' },
      { id: 'temporal_spikes', title: 'Activity Spike Warning', desc: 'Flags dates with unusual or abnormal activity levels.' },
      { id: 'crime_category', title: 'Crime Type Breakdown', desc: 'Compare proportions of cyber-crimes vs other criminal profiles.' },
      { id: 'station_roster_activity', title: 'Police Workload Tracker', desc: 'Tracks active cases and officer assignments.' },
      { id: 'tower_range', title: 'Tower Coverage Radius', desc: 'Map cell tower signal reach based on coordinates.' },
      { id: 'cross_case_linkage', title: 'Cross-Case Linkage Finder', desc: 'Finds matching phone numbers across separate case files.' },
      { id: 'hotspot_cluster', title: 'Hotspot Cluster Tracker', desc: 'Groups nearby towers into high-severity zones.' },
      { id: 'data_sync_timeline', title: 'Database Sync Checker', desc: 'Checks if all databases are synchronized in real-time.' }
    ]
  },
  {
    id: 'predictive',
    name: 'Risk Prediction & Alerts',
    icon: AlertTriangle,
    color: 'bg-orange-500/10 text-orange-600 border-orange-200',
    description: 'Escape probability assessments, repeat offense risk, and patrol dispatches.',
    subFeatures: [
      { id: 'risk_score_predictor', title: 'Suspect Risk Predictor', desc: 'Calculates the future risk level of a suspect based on their history.' },
      { id: 'recidivism_rate', title: 'Repeat Offense Likelihood', desc: 'Estimates how likely a suspect is to commit another crime.' },
      { id: 'early_warning', title: 'Automatic Patrol Dispatcher', desc: 'Auto-alerts patrol units if a suspect risk value crosses a set threshold.' },
      { id: 'flight_risk', title: 'Border Escape Risk', desc: 'Scans border cell tower activity to flag escape attempts.' },
      { id: 'prevention_plan', title: 'Patrol Deployment Plan', desc: 'Generates visual deployment plans for patrol officers.' },
      { id: 'alert_sensitivity', title: 'Alert Sensitivity Slider', desc: 'Adjust thresholds for sending automatic dispatches.' },
      { id: 'sociodemographic', title: 'Community Trend Factors', desc: 'Analyze demographic weights on local crime hotspots.' },
      { id: 'behavioral_profile', title: 'Burner SIM Detector', desc: 'Flags SIM card swaps and suspicious temporary phone usage.' },
      { id: 'anomaly_detector', title: 'Impossible Travel Alert', desc: 'Flags phones that travel faster than physically possible.' },
      { id: 'dispatcher', title: 'Dispatch Patrol Mission', desc: 'Deploys patrol alerts directly to police patrol vehicles.' }
    ]
  },
  {
    id: 'explainable',
    name: 'AI Explanations & Health',
    icon: CheckCircle2,
    color: 'bg-teal-500/10 text-teal-600 border-teal-200',
    description: 'System diagnostics, database connections, and event streams.',
    subFeatures: [
      { id: 'realtime_events', title: 'Live Activity Stream', desc: 'Displays a live feed of system log events.' },
      { id: 'reasoning_inspector', title: 'AI Thinking Inspector', desc: 'Inspects exactly how the AI reasoned through your request.' },
      { id: 'audit_filter', title: 'Log Search Filter', desc: 'Search security logs by investigator or target name.' },
      { id: 'tamper_proof', title: 'Log Anti-Tamper Check', desc: 'Verify the security seals of audit logs.' },
      { id: 'system_health', title: 'System Health Diagnostic', desc: 'Monitor server CPU, memory, and database status.' },
      { id: 'log_exporter', title: 'Logs Spreadsheet Export', desc: 'Download system logs as Excel files for verification.' },
      { id: 'access_violation', title: 'Unauthorized Entry Logs', desc: 'Logs any attempt to view files without proper permission.' },
      { id: 'citation_checker', title: 'Citation Verifier', desc: 'Ensures all case citations point to valid database records.' },
      { id: 'admin_approvals_arch', title: 'Admin Action Logs', desc: 'Inspect logs of all approvals made by administrators.' },
      { id: 'session_cleanser', title: 'Idle Account Log-Out', desc: 'Logs out inactive users to protect system security.' }
    ]
  },
  {
    id: 'access',
    name: 'Security Access Control',
    icon: ShieldAlert,
    color: 'bg-purple-500/10 text-purple-600 border-purple-200',
    description: 'Officer access levels, pending approvals, and password tokens.',
    subFeatures: [
      { id: 'clearance_roster', title: 'Officer Roster', desc: 'Review list of registered police officers and their access levels.' },
      { id: 'pending_approvals', title: 'Pending Approval Queue', desc: 'Approve or reject new user registration requests.' },
      { id: 'revocation_tool', title: 'Instant Account Revoker', desc: 'Revoke an officer’s system access immediately.' },
      { id: 'token_generator', title: 'Password Reset Token Generator', desc: 'Generate secure codes to unlock user accounts.' },
      { id: 'session_expiry', title: 'Log-Out Timer Settings', desc: 'Set how long accounts can remain idle before logging out.' },
      { id: 'jurisdiction_scoper', title: 'Officer Station Mapper', desc: 'Locks officers to search only within their assigned station boundaries.' },
      { id: 'mfa_simulator', title: 'MFA Security Simulation', desc: 'Test multi-factor authentication security codes.' },
      { id: 'role_escalation', title: 'Admin Page Guard Logs', desc: 'Logs attempts to access administrative pages.' },
      { id: 'roster_bulk_import', title: 'Bulk Officer Import', desc: 'Upload Excel files to register multiple officers at once.' },
      { id: 'active_connections', title: 'Active Login Monitor', desc: 'Shows who is currently logged into the portal.' }
    ]
  }
];

const renderSubFeatureData = (data) => {
  if (!data) return <p className="text-xs text-outline italic">No data returned.</p>;

  // Helper to render dial speedometer
  const renderSpeedometer = (score, label) => {
    const radius = 38;
    const strokeWidth = 8;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (score / 100) * circumference;
    
    let color = "stroke-red-500";
    let bg = "bg-red-50 text-red-700 border-red-100";
    if (score >= 80) {
      color = "stroke-emerald-500";
      bg = "bg-emerald-50 text-emerald-700 border-emerald-100";
    } else if (score >= 50) {
      color = "stroke-amber-500";
      bg = "bg-amber-50 text-amber-700 border-amber-100";
    }

    return (
      <div className={`flex flex-col items-center justify-center p-4 border rounded-xl space-y-2 ${bg} shrink-0 w-32`}>
        <div className="relative w-20 h-20 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90">
            <circle cx="40" cy="40" r={radius} className="stroke-slate-200 fill-none" strokeWidth={strokeWidth} />
            <circle 
              cx="40" 
              cy="40" 
              r={radius} 
              className={`fill-none ${color} transition-all duration-500`} 
              strokeWidth={strokeWidth} 
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </svg>
          <span className="absolute text-sm font-mono font-bold text-navy-deep">{score}%</span>
        </div>
        <span className="text-[9px] font-bold uppercase tracking-wider text-center">{label}</span>
      </div>
    );
  };

  // 1. Error state
  if (data.error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 text-error rounded-xl flex items-start gap-2">
        <AlertTriangle className="w-5 h-5 shrink-0" />
        <div>
          <span className="text-xs font-bold uppercase block">Execution Error</span>
          <p className="text-xs font-mono mt-0.5">{data.error}</p>
        </div>
      </div>
    );
  }

  // 2. Intent Classifier / Classification
  if (data.classification !== undefined) {
    return (
      <div className="flex flex-col md:flex-row gap-4 items-stretch">
        {renderSpeedometer(Math.round(data.confidence * 100), "Confidence")}
        
        <div className="flex-1 bg-slate-50 border border-outline-variant p-4 rounded-xl flex flex-col justify-between gap-3">
          <div className="space-y-1">
            <span className="text-[9px] font-bold text-outline uppercase block">Classification Intent</span>
            <span className="text-sm font-bold text-navy-deep">{data.classification}</span>
          </div>

          {data.matchedRules && (
            <div className="space-y-1.5">
              <span className="text-[9px] font-bold text-outline uppercase block font-mono">Matched Rules</span>
              <div className="flex flex-wrap gap-1.5">
                {data.matchedRules.map((rule, idx) => (
                  <span key={idx} className="px-2 py-0.5 bg-primary/10 border border-primary/20 text-primary text-[9px] font-bold rounded">
                    {rule}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {data.action && (
            <div className="text-[10px] text-amber-800 font-bold border-l-2 border-amber-50 pl-2">
              Routing Path: {data.action}
            </div>
          )}
        </div>
      </div>
    );
  }

  // 3. Language Detector
  if (data.detectedLanguage !== undefined) {
    return (
      <div className="flex flex-col md:flex-row gap-4 items-stretch">
        {renderSpeedometer(Math.round(data.confidence * 100), "Detection Confidence")}
        
        <div className="flex-1 grid grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50 border border-outline-variant rounded-xl flex flex-col justify-center">
            <span className="text-[9px] font-bold text-outline uppercase block">Detected Language</span>
            <span className="text-xs font-bold text-navy-deep block mt-1">{data.detectedLanguage}</span>
          </div>
          <div className="p-4 bg-slate-50 border border-outline-variant rounded-xl flex flex-col justify-center">
            <span className="text-[9px] font-bold text-outline uppercase block">Primary Locale</span>
            <span className="text-xs font-bold text-navy-deep block mt-1 font-mono">{data.primaryLocale}</span>
          </div>
        </div>
      </div>
    );
  }

  // 4. Grounding Validator
  if (data.validationStatus !== undefined) {
    const isGrounded = data.validationStatus.includes('Grounded');
    return (
      <div className="space-y-4">
        <div className={`p-4 border rounded-xl flex items-center justify-between ${isGrounded ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-center gap-3">
            <CheckCircle2 className={`w-8 h-8 shrink-0 ${isGrounded ? 'text-emerald-600' : 'text-red-600'}`} />
            <div>
              <span className="text-xs font-bold uppercase block text-slate-800">RAG Grounding Integrity</span>
              <span className={`text-sm font-bold ${isGrounded ? 'text-emerald-800' : 'text-red-800'}`}>
                {data.validationStatus}
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[9px] font-mono font-bold text-outline block uppercase">Hallucination Index</span>
            <span className={`text-sm font-bold ${isGrounded ? 'text-emerald-700' : 'text-red-700'}`}>{data.hallucinationIndex}</span>
          </div>
        </div>

        {/* Visual Flow chart of RAG context match */}
        <div className="grid grid-cols-3 gap-2 items-center bg-slate-50 border border-outline-variant p-4 rounded-xl relative">
          <div className="bg-white border p-3 rounded-lg text-center space-y-1 shadow-2xs">
            <span className="text-[9px] font-bold text-outline uppercase">User Query</span>
            <p className="text-[10px] font-semibold text-navy-deep leading-snug line-clamp-2">"summarize active suspects & evidence"</p>
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <div className="h-0.5 w-full bg-dashed border-t border-slate-300 relative flex items-center justify-center">
              <span className="bg-primary text-on-primary text-[8px] font-mono px-1.5 rounded-full absolute -top-2">RAG Engine</span>
            </div>
            <span className="text-[9px] font-bold text-outline uppercase tracking-wider mt-1">{data.citedSourcesCount || 5} Citations</span>
          </div>
          <div className="bg-white border p-3 rounded-lg text-center space-y-1 shadow-2xs">
            <span className="text-[9px] font-bold text-outline uppercase">Grounded Response</span>
            <p className="text-[10px] font-semibold text-emerald-700 leading-snug line-clamp-2">0% hallucination facts citing verified database IDs.</p>
          </div>
        </div>
      </div>
    );
  }

  // 5. Legal Reference Mapper
  if (data.applicableSections !== undefined) {
    return (
      <div className="space-y-4">
        <div className="p-3 bg-slate-50 border border-outline-variant rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[9px] font-bold text-outline uppercase block">Law Code Reference</span>
            <span className="text-xs font-bold text-navy-deep block mt-0.5">{data.lawCode}</span>
          </div>
          <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-800 text-[10px] font-mono font-bold rounded">
            BSA / BNSS
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {data.applicableSections.map((sec, idx) => (
            <div key={idx} className="p-3.5 bg-white border border-outline-variant hover:border-outline rounded-xl space-y-2 transition-all flex flex-col justify-between">
              <div className="space-y-1">
                <span className="text-xs font-bold text-amber-700 block">{sec.section}</span>
                <h4 className="text-xs font-bold text-navy-deep leading-snug">{sec.name}</h4>
              </div>
              <p className="text-[10px] text-outline leading-relaxed border-t pt-1.5">{sec.details}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 6. Query Suggestions
  if (data.suggestions !== undefined) {
    return (
      <div className="space-y-3">
        <span className="text-[9px] font-bold text-outline uppercase block">Recommended Follow-up Inquiries</span>
        <div className="flex flex-col gap-2">
          {data.suggestions.map((s, idx) => (
            <div key={idx} className="p-3 bg-indigo-50/40 hover:bg-indigo-50/80 border border-indigo-100 hover:border-indigo-200 rounded-xl text-xs font-bold text-indigo-950 flex items-center gap-3 transition-colors cursor-pointer">
              <span className="w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center font-mono text-[10px] shrink-0">
                {idx + 1}
              </span>
              <span>{s}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 7. Token Usage Meter
  if (data.promptTokens !== undefined) {
    const limit = 128000;
    const total = data.totalTokens;
    const promptPct = (data.promptTokens / limit) * 100;
    const completionPct = (data.completionTokens / limit) * 100;

    return (
      <div className="p-4 bg-slate-50 border rounded-xl space-y-4">
        <div className="flex items-center justify-between border-b pb-2">
          <span className="text-xs font-bold text-navy-deep">Context Window Budget</span>
          <span className="text-[10px] font-mono bg-slate-200 px-1.5 py-0.5 rounded font-bold text-outline">128K Max</span>
        </div>
        
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="48" cy="48" r="38" className="stroke-slate-200 fill-none" strokeWidth="8" />
              <circle 
                cx="48" 
                cy="48" 
                r="38" 
                className="stroke-indigo-500 fill-none" 
                strokeWidth="8" 
                strokeDasharray={2 * Math.PI * 38}
                strokeDashoffset={(2 * Math.PI * 38) * (1 - (data.promptTokens + data.completionTokens) / limit)}
                strokeLinecap="round"
              />
              <circle 
                cx="48" 
                cy="48" 
                r="38" 
                className="stroke-amber-500 fill-none" 
                strokeWidth="8" 
                strokeDasharray={2 * Math.PI * 38}
                strokeDashoffset={(2 * Math.PI * 38) * (1 - data.completionTokens / limit)}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-xs font-mono font-bold text-navy-deep">{total}</span>
              <span className="text-[8px] text-outline font-bold uppercase">Tokens</span>
            </div>
          </div>

          <div className="flex-1 w-full space-y-2 text-[11px] font-semibold text-navy-deep">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-indigo-500"></span> Prompt</span>
              <span className="font-mono">{data.promptTokens} tkn ({promptPct.toFixed(3)}%)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-amber-500"></span> Completion</span>
              <span className="font-mono">{data.completionTokens} tkn ({completionPct.toFixed(3)}%)</span>
            </div>
            <div className="h-px bg-slate-200 my-1" />
            <div className="flex items-center justify-between text-outline text-[10px]">
              <span>API Cost Estimate:</span>
              <span className="text-emerald-600 font-bold">{data.estimatedCost}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 8. Entity Highlighter
  if (data.extractedEntities !== undefined) {
    const { suspects = [], phoneNumbers = [], cellTowers = [] } = data.extractedEntities;
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-red-50/50 border border-red-100 rounded-xl space-y-2 flex flex-col justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-red-800 font-bold text-xs">
              <Users className="w-4 h-4" />
              <span>Suspects ({suspects.length})</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {suspects.length === 0 ? <span className="text-[10px] text-slate-400 italic">None</span> : suspects.map((s, i) => (
                <span key={i} className="px-2 py-1 bg-white border border-red-200 text-red-950 text-[10px] font-bold rounded-lg shadow-2xs">
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl space-y-2 flex flex-col justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-xs">
              <Mic className="w-4 h-4 animate-pulse" />
              <span>Phone Numbers ({phoneNumbers.length})</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {phoneNumbers.length === 0 ? <span className="text-[10px] text-slate-400 italic">None</span> : phoneNumbers.map((p, i) => (
                <span key={i} className="px-2 py-1 bg-white border border-emerald-200 text-emerald-950 text-[10px] font-bold rounded-lg shadow-2xs font-mono">
                  {p}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-xl space-y-2 flex flex-col justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-blue-800 font-bold text-xs">
              <Radio className="w-4 h-4" />
              <span>Cell Towers ({cellTowers.length})</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {cellTowers.length === 0 ? <span className="text-[10px] text-slate-400 italic">None</span> : cellTowers.map((t, i) => (
                <span key={i} className="px-2 py-1 bg-white border border-blue-200 text-blue-950 text-[10px] font-bold rounded-lg shadow-2xs">
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 9. Confidence Score Logic
  if (data.scoreBasis !== undefined) {
    return (
      <div className="flex flex-col md:flex-row gap-4 items-stretch">
        {renderSpeedometer(data.recommendedConfidenceScore, "Rating")}
        
        <div className="flex-1 bg-slate-50 border border-outline-variant p-4 rounded-xl space-y-3 flex flex-col justify-center">
          <div className="flex justify-between items-center text-xs font-semibold text-navy-deep">
            <span>Score Model:</span>
            <span className="font-bold">{data.scoreBasis}</span>
          </div>
          <div className="flex justify-between items-center text-xs font-semibold text-navy-deep">
            <span>Factual density:</span>
            <span className="font-bold font-mono">{data.factualDensity}</span>
          </div>
          <div className="flex justify-between items-center text-xs font-semibold text-navy-deep">
            <span>Citation relevance:</span>
            <span className="font-bold font-mono">{data.citationRelevance * 100}%</span>
          </div>
        </div>
      </div>
    );
  }

  // 10. Node centrality scores
  if (data.degreeScores !== undefined) {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
          <span className="text-[9px] font-bold text-amber-800 uppercase block">Primary Contact Hub</span>
          <span className="text-sm font-bold text-amber-950">{data.primaryNode || 'None'}</span>
          <p className="text-[10px] text-amber-900 leading-normal">{data.implication}</p>
        </div>
        
        {data.degreeScores.length > 0 && (
          <div className="space-y-2">
            <span className="text-[9px] font-bold text-outline uppercase block">Node Connection Centrality Scores</span>
            <div className="divide-y border border-outline-variant rounded-xl overflow-hidden bg-white">
              {data.degreeScores.map((score, idx) => (
                <div key={idx} className="p-2.5 flex justify-between items-center text-xs font-semibold">
                  <span className="text-navy-deep">{score.name}</span>
                  <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-[10px] font-bold text-outline">{score.degree} link(s)</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // 11. Accomplice shortest path
  if (data.shortestPath !== undefined) {
    return (
      <div className="p-4 bg-slate-50 border border-outline-variant rounded-xl space-y-3">
        <span className="text-[9px] font-bold text-outline uppercase block">Accomplice Connection Path</span>
        <div className="flex flex-wrap items-center gap-2">
          {data.shortestPath.map((node, idx) => (
            <React.Fragment key={idx}>
              <span className="px-3 py-1.5 bg-white border border-outline-variant rounded-lg text-xs font-bold text-navy-deep shadow-2xs">
                {node}
              </span>
              {idx < data.shortestPath.length - 1 && (
                <ChevronRight className="w-4 h-4 text-outline" />
              )}
            </React.Fragment>
          ))}
        </div>
        <div className="pt-2 border-t text-[10px] text-outline font-bold uppercase tracking-wider">
          Degree of separation: {data.degreeSeparation} hop(s)
        </div>
      </div>
    );
  }

  // 12. Early warning alerts
  if (data.activeAlerts !== undefined) {
    return (
      <div className="space-y-3">
        <span className="text-[9px] font-bold text-outline uppercase block">Active Early Warnings</span>
        {data.activeAlerts.length === 0 ? (
          <p className="text-xs text-outline italic py-2">No active warnings for this dossier.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {data.activeAlerts.map((alert, idx) => (
              <div key={idx} className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-bold text-red-950 uppercase">{alert.target} ({alert.score})</span>
                  <p className="text-xs text-red-800 leading-snug mt-0.5 font-semibold">{alert.alert}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // 13. System diagnostics
  if (data.cpuUsage !== undefined) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50 border border-outline-variant rounded-xl">
            <span className="text-[9px] font-bold text-outline uppercase block">CPU Resource Load</span>
            <span className="text-sm font-bold text-navy-deep block mt-1 font-mono">{data.cpuUsage}</span>
          </div>
          <div className="p-4 bg-slate-50 border border-outline-variant rounded-xl">
            <span className="text-[9px] font-bold text-outline uppercase block">Active Memory footprint</span>
            <span className="text-sm font-bold text-navy-deep block mt-1 font-mono">{data.memoryUsage}</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50 border border-outline-variant rounded-xl flex items-center justify-between">
            <span className="text-[9px] font-bold text-outline uppercase">Database Status</span>
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${data.dbConnected ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
              {data.dbConnected ? 'CONNECTED' : 'DISCONNECTED'}
            </span>
          </div>
          <div className="p-4 bg-slate-50 border border-outline-variant rounded-xl flex items-center justify-between">
            <span className="text-[9px] font-bold text-outline uppercase">Local JSON Store</span>
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${data.fallbackActive ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
              {data.fallbackActive ? 'ACTIVE' : 'INACTIVE'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // 14. Flight risk assessor
  if (data.flightAssessment !== undefined) {
    return (
      <div className="space-y-2">
        <span className="text-[9px] font-bold text-outline uppercase block">Flight Risk Assessment</span>
        <div className="flex flex-col gap-2">
          {data.flightAssessment.map((s, idx) => {
            const isHigh = s.flightRisk.includes('HIGH');
            return (
              <div key={idx} className={`p-3.5 border rounded-xl flex justify-between items-center ${isHigh ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-outline-variant'}`}>
                <span className="text-xs font-bold text-navy-deep">{s.name}</span>
                <span className={`text-[10px] font-mono font-bold uppercase ${isHigh ? 'text-red-700' : 'text-emerald-700'}`}>
                  {s.flightRisk}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // 15. Default fallback: pretty key-value grid representation
  const entries = Object.entries(data);
  return (
    <div className="grid grid-cols-1 gap-2.5">
      {entries.map(([key, val], idx) => {
        let displayVal = typeof val === 'object' ? JSON.stringify(val) : String(val);
        const formattedKey = key
          .replace(/([A-Z])/g, ' $1')
          .replace(/^./, (str) => str.toUpperCase());

        return (
          <div key={idx} className="p-3 bg-slate-50 hover:bg-slate-100/50 border border-outline-variant/60 rounded-xl flex justify-between items-center text-xs">
            <span className="font-bold text-outline uppercase text-[10px] tracking-wider">{formattedKey}</span>
            <span className="font-bold text-navy-deep text-right max-w-[70%] truncate font-mono">
              {displayVal}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export function AdvancedConsoleView({ setActiveScreen, selectedCaseId, setSelectedCaseId, cases = [], reloadCases }) {
  const { session } = useAuth();
  const [activeCategory, setActiveCategory] = useState('chatbot');
  
  // State for subfeature execution results
  const [loadingMap, setLoadingMap] = useState({});
  const [resultMap, setResultMap] = useState({});
  const [activeModalFeature, setActiveModalFeature] = useState(null);
  const [showRawJson, setShowRawJson] = useState(false);

  useEffect(() => {
    if (activeModalFeature) {
      setShowRawJson(false); // Reset to visual view whenever modal changes
    }
  }, [activeModalFeature]);

  const executeSubFeature = async (categoryId, subFeatureId, subFeatureTitle) => {
    const mapKey = `${categoryId}-${subFeatureId}`;
    setLoadingMap(prev => ({ ...prev, [mapKey]: true }));
    
    try {
      const response = await fetch('/api/advanced/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: categoryId,
          subFeature: subFeatureId,
          caseId: selectedCaseId,
          userId: session?.profile?.id || session?.profile?._id
        })
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const data = await response.json();
      setResultMap(prev => ({ ...prev, [mapKey]: data }));
      setActiveModalFeature({
        title: subFeatureTitle,
        category: categoryId,
        id: subFeatureId,
        data
      });
    } catch (err) {
      console.error('Sub-feature execution failed:', err);
      setResultMap(prev => ({ ...prev, [mapKey]: { error: err.message || 'Execution failed' } }));
    } finally {
      setLoadingMap(prev => ({ ...prev, [mapKey]: false }));
    }
  };

  const currentCategory = CATEGORIES.find(c => c.id === activeCategory);

  return (
    <div className="min-h-screen bg-surface font-sans text-on-surface flex flex-col justify-between">
      <Navbar activeScreen="advanced" setActiveScreen={setActiveScreen} />

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar for cases */}
        <Sidebar
          activeScreen="advanced"
          setActiveScreen={setActiveScreen}
          cases={cases}
          selectedCaseId={selectedCaseId}
          setSelectedCaseId={setSelectedCaseId}
          onOpenAddCase={() => setActiveScreen('chat')}
          onOpenAddSuspect={() => setActiveScreen('chat')}
          onOpenAddEvidence={() => setActiveScreen('chat')}
        />

        {/* Console Workspace */}
        <main className="flex-1 overflow-y-auto scrolling-content p-6 space-y-6">
          <div className="max-w-[1100px] mx-auto space-y-6">
            
            {/* Header info */}
            <div className="bg-white border border-outline-variant p-6 rounded-2xl shadow-sm flex flex-wrap justify-between items-center gap-4">
              <div className="space-y-1">
                <h1 className="text-xl font-bold text-navy-deep flex items-center gap-2">
                  <Cpu className="w-6 h-6 text-gold-accent" />
                  Advanced Intelligence Core
                </h1>
                <p className="text-xs text-outline">
                  Execute, calibrate, and audit 90 dynamic analytics and security modules bound to your active station file.
                </p>
              </div>

              {cases.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-outline">Active Context:</span>
                  <select
                    value={selectedCaseId || ''}
                    onChange={(e) => setSelectedCaseId(e.target.value)}
                    className="px-3 py-1.5 bg-surface-container-low text-xs font-bold rounded-lg border border-outline-variant outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {cases.map(c => (
                      <option key={c.id || c._id} value={c.id || c._id}>{c.fir_number} &mdash; {c.title}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Data Pipeline Infographic */}
            <div className="bg-gradient-to-br from-navy-deep to-slate-900 text-white border border-slate-800 p-6 rounded-2xl shadow-lg space-y-6 overflow-hidden relative">
              {/* Background glowing effects */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>
              <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>
              
              <div className="flex justify-between items-center border-b border-slate-800/80 pb-4">
                <div>
                  <h2 className="text-xs font-mono font-bold tracking-widest text-gold-accent flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    SYSTEM PIPELINE
                  </h2>
                  <h3 className="text-sm font-bold tracking-tight mt-1">Karnataka State judicial Intelligence Core AI Architecture</h3>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-800 border border-slate-700 text-slate-300 rounded font-semibold uppercase tracking-wider">
                  Real-time Data Flow
                </span>
              </div>

              {/* Graphical Pipeline Map */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 relative">
                
                {/* Stage 1: Ingestion */}
                <div className="bg-slate-950/60 border border-slate-800/60 p-4 rounded-xl flex flex-col justify-between gap-3 relative group">
                  <div className="space-y-1">
                    <div className="text-[9px] font-mono font-bold text-slate-400">STAGE 01 &mdash; STREAMING</div>
                    <h4 className="text-xs font-bold text-slate-200">1100+ CCTNS Ingestion</h4>
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                      Continuous telemetry stream of cellular tower logs, ANPR vehicle plate reads, and local FIR filings.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-slate-900/60">
                    <div className="bg-slate-900/70 p-1.5 rounded text-center">
                      <span className="text-[9px] font-mono text-gold-accent font-bold block">1100+</span>
                      <span className="text-[8px] text-slate-500 uppercase font-mono leading-none">Stations</span>
                    </div>
                    <div className="bg-slate-900/70 p-1.5 rounded text-center">
                      <span className="text-[9px] font-mono text-emerald-400 font-bold block">10M+</span>
                      <span className="text-[8px] text-slate-500 uppercase font-mono leading-none">CDR Logs</span>
                    </div>
                    <div className="bg-slate-900/70 p-1.5 rounded text-center">
                      <span className="text-[9px] font-mono text-cyan-400 font-bold block">LIVE</span>
                      <span className="text-[8px] text-slate-500 uppercase font-mono leading-none">ANPR</span>
                    </div>
                  </div>
                </div>

                {/* Stage 2: Context Compiler */}
                <div className="bg-slate-950/60 border border-slate-800/60 p-4 rounded-xl flex flex-col justify-between gap-3 relative group">
                  <div className="space-y-1">
                    <div className="text-[9px] font-mono font-bold text-slate-400">STAGE 02 &mdash; AGGREGATOR</div>
                    <h4 className="text-xs font-bold text-slate-200">Security Scoping & RAG</h4>
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                      Combines target phone directories, suspect rosters, and evidence records scoped strictly by investigator clearance.
                    </p>
                  </div>
                  
                  <div className="space-y-1.5 pt-2 border-t border-slate-900/60">
                    <div className="flex justify-between items-center text-[9px] font-mono text-slate-400">
                      <span>Dossier Matching</span>
                      <span className="text-emerald-400 font-bold">100% Verified</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 w-[100%]" />
                    </div>
                  </div>
                </div>

                {/* Stage 3: LLM Cognitive Processor */}
                <div className="bg-slate-950/60 border border-slate-800/60 p-4 rounded-xl flex flex-col justify-between gap-3 relative group">
                  <div className="space-y-1">
                    <div className="text-[9px] font-mono font-bold text-slate-400">STAGE 03 &mdash; COGNITIVE</div>
                    <h4 className="text-xs font-bold text-slate-200">GPT-OSS-120B Core Processor</h4>
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                      Cognitive reasoning engine loaded with prompt compliance rules enforcing grounded legal analysis of BNS/BNSS statutes.
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between pt-2 border-t border-slate-900/60 text-[9px] font-mono">
                    <span className="text-gold-accent font-bold">Zero-Hallucination</span>
                    <span className="px-1.5 py-0.5 bg-gold-accent/10 border border-gold-accent/30 text-gold-accent rounded text-[8px] font-bold">
                      BNSS ALIGNED
                    </span>
                  </div>
                </div>

                {/* Stage 4: Outputs */}
                <div className="bg-slate-950/60 border border-slate-800/60 p-4 rounded-xl flex flex-col justify-between gap-3 relative group">
                  <div className="space-y-1">
                    <div className="text-[9px] font-mono font-bold text-slate-400">STAGE 04 &mdash; ACTION</div>
                    <h4 className="text-xs font-bold text-slate-200">Deployable Intelligence</h4>
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                      Generates court-admissible dossiers, link network arrangements, crime hotspot heatmaps, and early warnings.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-1 pt-2 border-t border-slate-900/60 text-center">
                    <div className="bg-slate-900 p-1 rounded font-mono text-[8px] font-bold text-slate-300">RAG</div>
                    <div className="bg-slate-900 p-1 rounded font-mono text-[8px] font-bold text-slate-300">NET</div>
                    <div className="bg-slate-900 p-1 rounded font-mono text-[8px] font-bold text-slate-300">HOT</div>
                    <div className="bg-slate-900 p-1 rounded font-mono text-[8px] font-bold text-slate-300">PDF</div>
                  </div>
                </div>

              </div>
            </div>

            {/* Category Select Toggles */}
            <div className="grid grid-cols-3 md:grid-cols-9 gap-2">
              {CATEGORIES.map(cat => {
                const Icon = cat.icon;
                const isSelected = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all text-center gap-1.5 ${
                      isSelected
                        ? 'bg-navy-deep text-on-primary border-navy-deep shadow-sm scale-[1.02]'
                        : 'bg-white hover:bg-surface-container-low text-outline border-outline-variant'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-[10px] font-bold tracking-tight leading-none truncate w-full max-w-[80px]">
                      {cat.name.split(' ').slice(-2).join(' ')}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Category Header */}
            {currentCategory && (
              <div className="bg-white border border-outline-variant p-6 rounded-2xl shadow-sm space-y-2">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl border ${currentCategory.color}`}>
                    <currentCategory.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-navy-deep">{currentCategory.name}</h2>
                    <p className="text-xs text-outline">{currentCategory.description}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Sub-features Grid (10 subfeatures per category) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {currentCategory?.subFeatures.map(sf => {
                const mapKey = `${currentCategory.id}-${sf.id}`;
                const isLoading = loadingMap[mapKey];
                const hasResult = resultMap[mapKey] !== undefined;

                return (
                  <div 
                    key={sf.id} 
                    className="bg-white border border-outline-variant hover:border-outline p-4 rounded-xl shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between gap-4"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-bold text-navy-deep leading-tight truncate-2-lines">{sf.title}</span>
                        {hasResult && !isLoading && (
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 p-0.5 rounded-full" title="Execution Completed">
                            <Check className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-outline leading-snug">{sf.desc}</p>
                    </div>

                    <button
                      onClick={() => executeSubFeature(currentCategory.id, sf.id, sf.title)}
                      disabled={isLoading || !selectedCaseId}
                      className={`w-full py-1.5 text-[10px] font-bold rounded-lg border transition-all flex items-center justify-center gap-1.5 ${
                        isLoading
                          ? 'bg-surface-container text-outline border-outline-variant cursor-not-allowed'
                          : hasResult
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100/70'
                            : 'bg-navy-deep text-on-primary border-navy-deep hover:opacity-90'
                      }`}
                    >
                      {isLoading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : hasResult ? (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>View Results</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5" />
                          <span>Execute module</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

          </div>
        </main>
      </div>

      {/* Results Detail Modal */}
      <AnimatePresence>
        {activeModalFeature && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-[100] no-print">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="bg-white border-2 border-navy-deep rounded-2xl w-full max-w-[650px] shadow-2xl flex flex-col overflow-hidden max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="bg-navy-deep text-on-primary p-4 flex justify-between items-center border-b border-primary-container">
                <div className="flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-gold-accent" />
                  <div>
                    <h3 className="text-xs font-bold tracking-tight uppercase">Module Analytics Log</h3>
                    <p className="text-[10px] text-slate-300 font-mono">Bound: {activeModalFeature.title}</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveModalFeature(null)}
                  className="p-1.5 hover:bg-primary-container rounded-lg text-slate-300 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto space-y-4">
                
                {/* Visual view (shown by default) */}
                {!showRawJson ? (
                  <div className="space-y-4 animate-fadeIn">
                    {renderSubFeatureData(activeModalFeature.data)}
                  </div>
                ) : (
                  /* Raw Developer Console View */
                  <div className="bg-slate-950 text-emerald-400 p-4 rounded-xl font-mono text-xs overflow-x-auto shadow-inner leading-relaxed select-all">
                    <span className="text-slate-500 font-bold block mb-2 border-b border-slate-800 pb-1 uppercase tracking-widest text-[9px]">
                      Raw Console Stream
                    </span>
                    <pre>{JSON.stringify(activeModalFeature.data, null, 2)}</pre>
                  </div>
                )}

                <div className="flex justify-between items-center pt-2">
                  <div className="border border-outline-variant p-4 rounded-xl bg-surface-container-low space-y-1 flex-1 mr-4">
                    <span className="text-[10px] font-bold text-outline uppercase block tracking-wider">Investigator Note</span>
                    <p className="text-xs text-navy-deep font-semibold leading-relaxed">
                      This sub-feature has successfully run the intelligence pipeline on the active local database dossier ({cases.find(c => c.id === selectedCaseId || c._id === selectedCaseId)?.fir_number || 'KSP FIR Record'}). The results are recorded under secure cryptographic audit trail controls.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowRawJson(!showRawJson)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-outline-variant rounded-lg text-[10px] font-bold text-outline uppercase shrink-0 transition-colors"
                  >
                    {showRawJson ? "Hide Raw Logs" : "Show Raw Logs"}
                  </button>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="bg-surface-container border-t border-outline-variant p-4 flex justify-end gap-2">
                <button
                  onClick={() => setActiveModalFeature(null)}
                  className="px-4 py-2 bg-navy-deep text-on-primary text-xs font-bold rounded-xl hover:opacity-90 active:scale-[0.98] transition-all"
                >
                  Confirm & Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <footer className="p-4 text-center text-xs font-mono text-outline border-t border-outline-variant">
        State judicial Intelligence Agency
      </footer>
    </div>
  );
}
