import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../lib/supabase';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';
import { AddSuspectModal } from '../components/Modals/AddSuspectModal';
import { AddSuspectLinkModal } from '../components/Modals/AddSuspectLinkModal';
import { AddCaseModal } from '../components/Modals/AddCaseModal';
import { Share2, Plus, UserPlus, Network, X, FileText } from 'lucide-react';

export function NetworkView({ setActiveScreen }) {
  const { session } = useAuth();
  const [cases, setCases] = useState([]);
  const [selectedCaseId, setSelectedCaseId] = useState(null);
  const [suspects, setSuspects] = useState([]);
  const [links, setLinks] = useState([]);
  const [selectedSuspect, setSelectedSuspect] = useState(null);

  // Modals
  const [isAddCaseOpen, setIsAddCaseOpen] = useState(false);
  const [isAddSuspectOpen, setIsAddSuspectOpen] = useState(false);
  const [isAddLinkOpen, setIsAddLinkOpen] = useState(false);

  const reloadData = async () => {
    try {
      const loadedCases = await dbService.getCases(session);
      setCases(loadedCases);
      const activeId = selectedCaseId || (loadedCases[0]?.id || loadedCases[0]?._id || null);
      if (!selectedCaseId && loadedCases.length > 0) {
        setSelectedCaseId(loadedCases[0].id || loadedCases[0]._id);
      }

      if (activeId) {
        const [sList, lList] = await Promise.all([
          dbService.getSuspects(activeId),
          dbService.getSuspectLinks(activeId)
        ]);
        setSuspects(sList);
        setLinks(lList);
      } else {
        setSuspects([]);
        setLinks([]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    reloadData();
  }, [session, selectedCaseId]);

  const selectedCase = cases.find(c => c.id === selectedCaseId);

  // Calculate Force Layout Positions dynamically
  const nodePositions = suspects.map((s, index) => {
    const total = suspects.length;
    const angle = (index / (total || 1)) * 2 * Math.PI;
    const radius = total === 1 ? 0 : 200;
    const cx = 500 + radius * Math.cos(angle);
    const cy = 400 + radius * Math.sin(angle);
    return { ...s, cx, cy };
  });

  return (
    <div className="h-screen w-screen flex flex-col antialiased text-on-surface bg-surface overflow-hidden">
      <Navbar activeScreen="network" setActiveScreen={setActiveScreen} />

      <main className="flex-1 relative flex overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar
          activeScreen="network"
          setActiveScreen={setActiveScreen}
          cases={cases}
          selectedCaseId={selectedCaseId}
          setSelectedCaseId={setSelectedCaseId}
          onOpenAddCase={() => setIsAddCaseOpen(true)}
          onOpenAddSuspect={() => setIsAddSuspectOpen(true)}
          onOpenAddEvidence={() => {}}
        />

        {/* Network Canvas */}
        <section id="networkContainer" className="flex-1 bg-white relative overflow-hidden network-canvas">
          
          {/* Top Overlay Controls */}
          <div className="absolute top-6 left-6 z-10 flex flex-col gap-3">
            <div className="bg-white/95 backdrop-blur-md border border-outline-variant p-4 rounded-xl shadow-md max-w-xs space-y-1">
              <h2 className="text-xs font-bold text-navy-deep flex items-center gap-2">
                <Share2 className="w-4 h-4 text-gold-accent" />
                Network Scope: {selectedCase ? selectedCase.fir_number : 'All Cases'}
              </h2>
              <p className="text-xs text-on-surface-variant leading-snug">
                {suspects.length} suspect node(s) and {links.length} edge link(s) loaded live from database.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setIsAddSuspectOpen(true)}
                className="bg-navy-deep text-on-primary px-3 py-2 rounded-lg hover:opacity-90 transition-colors shadow-2xs flex items-center gap-1.5 text-xs font-bold"
              >
                <UserPlus className="w-4 h-4 text-gold-accent" /> Add Suspect
              </button>

              <button
                onClick={() => setIsAddLinkOpen(true)}
                className="bg-white border border-outline-variant px-3 py-2 rounded-lg hover:bg-surface-container transition-colors shadow-2xs flex items-center gap-1.5 text-xs font-bold text-navy-deep"
              >
                <Network className="w-4 h-4 text-navy-deep" /> Connect Link
              </button>
            </div>
          </div>

          {/* Empty State when no suspects exist */}
          {suspects.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center p-8">
              <div className="max-w-md text-center p-8 bg-surface-container-low border border-dashed border-outline-variant rounded-2xl shadow-sm space-y-3">
                <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-700 mx-auto">
                  <Share2 className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-navy-deep">No Linked Entities in Database</h3>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  No suspect nodes or association edges have been created for this FIR case yet. Add suspects and link edges to render the matrix graph.
                </p>
                <div className="pt-2 flex justify-center gap-2">
                  <button
                    onClick={() => setIsAddSuspectOpen(true)}
                    className="px-4 py-2 bg-navy-deep text-on-primary text-xs font-bold rounded-xl hover:opacity-90 transition-all inline-flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4 text-gold-accent" /> Add Suspect
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <svg id="networkSvg" className="w-full h-full" viewBox="0 0 1000 800">
              <g id="edges">
                {links.map(link => {
                  const s = nodePositions.find(n => n.id === link.suspect_a_id);
                  const t = nodePositions.find(n => n.id === link.suspect_b_id);
                  if (!s || !t) return null;
                  return (
                    <line
                      key={link.id}
                      x1={s.cx}
                      y1={s.cy}
                      x2={t.cx}
                      y2={t.cy}
                      stroke={link.link_type === 'cdr_call' ? '#D9A441' : '#0F2A4A'}
                      strokeWidth={link.link_type === 'cdr_call' ? 3 : 2}
                      strokeDasharray={link.link_type === 'cdr_call' ? '6' : 'none'}
                      className={link.link_type === 'cdr_call' ? 'connection-dash' : ''}
                    />
                  );
                })}
              </g>

              <g id="nodes">
                {nodePositions.map(node => (
                  <g
                    key={node.id}
                    className="node cursor-pointer"
                    onClick={() => setSelectedSuspect(node)}
                  >
                    <circle
                      cx={node.cx}
                      cy={node.cy}
                      r={node.risk_score > 80 ? 48 : 38}
                      fill={node.risk_score > 80 ? '#D9A441' : '#0F2A4A'}
                      stroke="#FFFFFF"
                      strokeWidth="3"
                    />
                    <text
                      x={node.cx}
                      y={node.cy + 6}
                      textAnchor="middle"
                      fill="#FFFFFF"
                      className="font-bold text-sm select-none pointer-events-none"
                    >
                      {node.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </text>
                    <text
                      x={node.cx}
                      y={node.cy + (node.risk_score > 80 ? 68 : 58)}
                      textAnchor="middle"
                      fill="#0F2A4A"
                      className="font-bold text-xs select-none pointer-events-none"
                    >
                      {node.name}
                    </text>
                  </g>
                ))}
              </g>
            </svg>
          )}

          {/* Bottom Legend Bar */}
          <div className="absolute bottom-6 right-6 flex items-center gap-4 bg-white/95 backdrop-blur-md border border-outline-variant px-4 py-2.5 rounded-full shadow-md">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gold-accent"></div>
              <span className="text-xs text-navy-deep font-bold">High Priority Suspect</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-navy-deep"></div>
              <span className="text-xs text-navy-deep font-bold">Associate Entity</span>
            </div>
          </div>

          {/* Slide-out Entity Details Panel */}
          <AnimatePresence>
            {selectedSuspect && (
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ duration: 0.3 }}
                className="entity-panel absolute top-0 right-0 h-full w-88 bg-white border-l border-outline-variant z-20 overflow-y-auto shadow-2xl p-6"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                      DOSSIER
                    </span>
                    <h3 className="text-xl font-bold text-navy-deep mt-1">{selectedSuspect.name}</h3>
                  </div>
                  <button
                    onClick={() => setSelectedSuspect(null)}
                    className="p-1 text-outline hover:text-navy-deep rounded-full transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Avatar Badge */}
                <div className="aspect-square w-full rounded-2xl mb-5 bg-gradient-to-br from-navy-deep to-slate-900 border border-outline-variant flex flex-col items-center justify-center text-white relative shadow-inner p-6">
                  <div className="w-24 h-24 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-amber-300 font-extrabold text-3xl mb-2 shadow-md">
                    {selectedSuspect.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <span className="text-xs font-mono text-amber-300 bg-black/50 px-2.5 py-1 rounded border border-amber-500/30">
                    ID: {selectedSuspect.id.slice(0, 8)}
                  </span>
                </div>

                <div className="space-y-4 text-xs">
                  <div>
                    <label className="text-[11px] font-bold text-outline uppercase tracking-wider block">Threat Risk Score</label>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 font-bold border border-amber-300">
                        {selectedSuspect.risk_score}% Calculated Risk Metric
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-outline uppercase tracking-wider block">Known Aliases</label>
                    <p className="font-mono font-bold text-navy-deep mt-0.5">
                      {selectedSuspect.aliases?.join(', ') || 'None recorded'}
                    </p>
                  </div>

                  <div>
                    <button
                      onClick={() => setActiveScreen('pdf')}
                      className="w-full py-3 bg-navy-deep text-on-primary font-bold text-xs rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-sm"
                    >
                      <FileText className="w-4 h-4 text-gold-accent" /> Generate Judicial PDF Report
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </main>

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
    </div>
  );
}
