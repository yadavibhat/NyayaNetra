import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../lib/api';
import { ArrowLeft, Printer, ShieldAlert } from 'lucide-react';

export function PdfExportView({ setActiveScreen, selectedCaseId, setSelectedCaseId, cases = [], reloadCases }) {
  const { session } = useAuth();
  const profile = session?.profile;
  const [suspects, setSuspects] = useState([]);
  const [evidence, setEvidence] = useState([]);
  const [station, setStation] = useState(null);
  const [loading, setLoading] = useState(true);

  // Feature 5: Interactive Report Section Builder
  const [includeSynopsis, setIncludeSynopsis] = useState(true);
  const [includeSuspects, setIncludeSuspects] = useState(true);
  const [includeEvidence, setIncludeEvidence] = useState(true);

  const activeCase = cases.find(c => c.id === selectedCaseId || c._id === selectedCaseId) || cases[0];

  useEffect(() => {
    if (!activeCase) return;
    const loadDetails = async () => {
      setLoading(true);
      try {
        const targetId = activeCase.id || activeCase._id;
        const [susp, ev, stns] = await Promise.all([
          dbService.getSuspects(targetId),
          dbService.getEvidence(targetId),
          dbService.getStations()
        ]);
        setSuspects(susp);
        setEvidence(ev);
        const st = stns.find(s => s.id === activeCase.station_id || s._id === activeCase.station_id);
        setStation(st || null);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadDetails();
  }, [activeCase]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#e3e2e5] text-on-surface flex flex-col items-center py-6 px-4 font-sans justify-between">
      
      {/* Top Bar (Screen Only) */}
      <header className="no-print w-full max-w-[850px] bg-primary text-on-primary p-4 rounded-xl shadow-md flex flex-wrap justify-between items-center mb-6 gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveScreen('chat')}
            className="p-2 hover:bg-primary-container rounded-lg transition-colors text-slate-300 hover:text-white"
            title="Return to Chat"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-sm font-bold tracking-tight">Investigation Dossier Report</h1>
            <p className="text-[11px] text-slate-300 font-mono">
              FIR Reference: {activeCase ? activeCase.fir_number : 'No Active Case Selected'}
            </p>
          </div>
        </div>

        {/* Section Toggles */}
        {activeCase && (
          <div className="flex items-center gap-4 text-xs font-semibold text-slate-200">
            <span className="text-[10px] uppercase text-slate-400">Include:</span>
            <label className="flex items-center gap-1.5 cursor-pointer hover:text-white select-none">
              <input 
                type="checkbox" 
                checked={includeSynopsis} 
                onChange={(e) => setIncludeSynopsis(e.target.checked)} 
                className="rounded border-outline-variant text-amber-500 focus:ring-0 bg-transparent" 
              />
              <span>Synopsis</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer hover:text-white select-none">
              <input 
                type="checkbox" 
                checked={includeSuspects} 
                onChange={(e) => setIncludeSuspects(e.target.checked)} 
                className="rounded border-outline-variant text-amber-500 focus:ring-0 bg-transparent" 
              />
              <span>Suspects</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer hover:text-white select-none">
              <input 
                type="checkbox" 
                checked={includeEvidence} 
                onChange={(e) => setIncludeEvidence(e.target.checked)} 
                className="rounded border-outline-variant text-amber-500 focus:ring-0 bg-transparent" 
              />
              <span>Evidence</span>
            </label>
          </div>
        )}

        <div className="flex items-center gap-3">
          {cases.length > 1 && (
            <select
              value={selectedCaseId || ''}
              onChange={(e) => setSelectedCaseId(e.target.value)}
              className="px-3 py-1.5 bg-primary-container text-white text-xs font-semibold rounded-lg border border-outline/30 outline-none"
            >
              {cases.map(c => (
                <option key={c.id || c._id} value={c.id || c._id}>{c.fir_number} &mdash; {c.title}</option>
              ))}
            </select>
          )}

          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Printer className="w-4 h-4" /> Print / Export PDF
          </button>
        </div>
      </header>

      {/* Printable Report Paper Document */}
      {!activeCase ? (
        <div className="w-full max-w-[850px] bg-white border border-outline-variant rounded-xl p-12 text-center space-y-4 shadow-xl">
          <ShieldAlert className="w-12 h-12 text-amber-600 mx-auto" />
          <h2 className="text-lg font-bold text-navy-deep">No Active Case Data to Export</h2>
          <p className="text-xs text-outline max-w-md mx-auto leading-relaxed">
            The database contains no FIR cases. Create a case and add suspects to generate a report.
          </p>
          <button
            onClick={() => setActiveScreen('chat')}
            className="px-4 py-2 bg-navy-deep text-on-primary text-xs font-bold rounded-xl hover:opacity-90 inline-flex items-center gap-1"
          >
            Go to Portal
          </button>
        </div>
      ) : (
        <main className="print-container w-full max-w-[850px] bg-white border border-outline-variant/80 rounded-xl shadow-xl p-10 relative overflow-hidden space-y-8">
          
          {/* Official Report Header */}
          <div className="flex justify-between items-start pb-6 border-b-2 border-navy-deep">
            <div className="flex gap-4 items-center">
              <img
                alt="Emblem Logo"
                className="h-16 w-auto object-contain"
                src="./assets/logo.svg"
                onError={(e) => { e.target.onerror = null; e.target.src = './assets/logo.png'; }}
              />
              <div>
                <h2 className="text-xl font-bold text-navy-deep uppercase tracking-wider">State Judicial Intelligence Record</h2>
                <p className="text-xs text-navy-deep font-mono mt-0.5">Case Reference: {activeCase.fir_number}</p>
              </div>
            </div>
            <div className="text-right font-mono text-xs text-on-surface">
              <p className="font-bold text-navy-deep">CASE SUMMARY</p>
              <p className="text-outline">Date: {new Date(activeCase.createdAt || activeCase.created_at || Date.now()).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-surface-container-low p-4 rounded-xl border border-outline-variant/60 text-xs">
            <div>
              <span className="text-outline font-bold uppercase block text-[10px]">Lead Officer</span>
              <span className="font-bold text-navy-deep">{profile?.full_name || 'Authorized Officer'}</span>
            </div>
            <div>
              <span className="text-outline font-bold uppercase block text-[10px]">Badge Number</span>
              <span className="font-mono font-bold text-navy-deep">{profile?.badge_id || 'N/A'}</span>
            </div>
            <div>
              <span className="text-outline font-bold uppercase block text-[10px]">Station Unit</span>
              <span className="font-bold text-navy-deep">{station ? station.name : 'State Police Wing'}</span>
            </div>
            <div>
              <span className="text-outline font-bold uppercase block text-[10px]">Case Priority</span>
              <span className="font-bold text-amber-800 uppercase">{activeCase.priority}</span>
            </div>
          </div>

          {/* Section 1: Executive Summary */}
          {includeSynopsis && (
            <section className="space-y-2">
              <h3 className="text-sm font-bold text-navy-deep uppercase tracking-wider pb-1 border-b border-outline-variant">
                1. Case Synopsis
              </h3>
              <p className="text-xs text-on-surface leading-relaxed">
                {activeCase.description || 'No description entered for this case file.'}
              </p>
            </section>
          )}

          {/* Section 2: Suspects Roster */}
          {includeSuspects && (
            <section className="space-y-2">
              <h3 className="text-sm font-bold text-navy-deep uppercase tracking-wider pb-1 border-b border-outline-variant">
                2. Identified Suspect Roster ({suspects.length})
              </h3>
              {suspects.length === 0 ? (
                <p className="text-xs text-outline italic">No suspects entered for this FIR case.</p>
              ) : (
                <div className="grid grid-cols-2 gap-3 text-xs">
                  {suspects.map(s => (
                    <div key={s.id || s._id} className="p-3 bg-surface-container-low border border-outline-variant/50 rounded-lg flex justify-between items-center">
                      <div>
                        <p className="font-bold text-navy-deep">{s.name}</p>
                        <p className="text-[10px] text-outline">Aliases: {s.aliases?.join(', ') || 'None'}</p>
                      </div>
                      <span className="font-mono text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                        Risk: {s.risk_score !== null ? `${s.risk_score}%` : 'Unassessed'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Section 3: Evidentiary Audit Log */}
          {includeEvidence && (
            <section className="space-y-3">
              <h3 className="text-sm font-bold text-navy-deep uppercase tracking-wider pb-1 border-b border-outline-variant">
                3. Evidence Log ({evidence.length})
              </h3>
              {evidence.length === 0 ? (
                <p className="text-xs text-outline italic">No CDR/ANPR evidence uploaded for this FIR case.</p>
              ) : (
                <table className="w-full text-xs text-left border-collapse border border-outline-variant">
                  <thead>
                    <tr className="bg-navy-deep text-on-primary font-bold">
                      <th className="p-2.5 border border-outline-variant">Type</th>
                      <th className="p-2.5 border border-outline-variant">Cell Tower</th>
                      <th className="p-2.5 border border-outline-variant">Phone / Target</th>
                      <th className="p-2.5 border border-outline-variant">Captured Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant font-mono">
                    {evidence.map(ev => (
                      <tr key={ev.id || ev._id} className="hover:bg-surface-container-low">
                        <td className="p-2.5 border border-outline-variant font-bold uppercase">{ev.type}</td>
                        <td className="p-2.5 border border-outline-variant">{ev.cell_tower || 'N/A'}</td>
                        <td className="p-2.5 border border-outline-variant text-navy-deep font-bold">{ev.phone_number || 'N/A'}</td>
                        <td className="p-2.5 border border-outline-variant">{new Date(ev.captured_at).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          )}

          {/* Signature Block */}
          <section className="bg-surface p-5 rounded-xl border border-outline-variant/60 space-y-3">
            <div className="flex justify-between items-end font-mono text-[10px]">
              <div>
                <p>Officer Badge: {profile?.badge_id || 'N/A'}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-xs uppercase font-sans text-navy-deep">Investigating Officer Signature</p>
                <p className="mt-4 text-xs font-bold text-navy-deep underline">{profile?.full_name || 'Officer Signature'}</p>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="pt-4 border-t border-outline-variant flex justify-between items-center text-[10px] text-outline font-mono">
            <span>NYAYANETRA PORTAL</span>
            <span>CONFIDENTIAL CASE SUMMARY</span>
          </footer>

        </main>
      )}

      <footer className="no-print mt-6 text-xs font-mono text-outline">
        State Police Digital Evidence Division
      </footer>
    </div>
  );
}
