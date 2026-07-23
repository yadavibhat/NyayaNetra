import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Share2, Save, PlusCircle, Zap } from 'lucide-react';
import { dbService } from '../../lib/supabase';

export function AddSuspectLinkModal({ isOpen, onClose, onAdded, caseId, currentUser }) {
  const [cases, setCases] = useState([]);
  const [selectedCaseId, setSelectedCaseId] = useState(caseId || '');
  const [suspects, setSuspects] = useState([]);

  // Quick Inline Creation states
  const [showQuickCaseForm, setShowQuickCaseForm] = useState(false);
  const [quickFirNumber, setQuickFirNumber] = useState('');
  const [quickTitle, setQuickTitle] = useState('');

  const [showQuickSuspectForm, setShowQuickSuspectForm] = useState(false);
  const [quickSuspectName, setQuickSuspectName] = useState('');

  // Link fields
  const [suspectAId, setSuspectAId] = useState('');
  const [suspectBId, setSuspectBId] = useState('');
  const [linkType, setLinkType] = useState('cdr_call');
  const [detail, setDetail] = useState('');
  const [error, setError] = useState('');

  const reloadData = async () => {
    try {
      const loadedCases = await dbService.getCases(currentUser);
      setCases(loadedCases);

      let activeId = selectedCaseId || caseId;
      if (!activeId && loadedCases.length > 0) {
        activeId = loadedCases[0].id || loadedCases[0]._id;
        setSelectedCaseId(activeId);
      } else if (loadedCases.length === 0) {
        setShowQuickCaseForm(true);
      }

      if (activeId) {
        const loadedSuspects = await dbService.getSuspects(activeId);
        setSuspects(loadedSuspects);
        
        let nextA = suspectAId;
        let nextB = suspectBId;

        const ids = loadedSuspects.map(s => s.id || s._id);

        if (!ids.includes(nextA)) {
          nextA = ids[0] || '';
        }
        
        if (!ids.includes(nextB) || nextA === nextB) {
          const remaining = ids.filter(id => id !== nextA);
          nextB = remaining[0] || '';
        }

        setSuspectAId(nextA);
        setSuspectBId(nextB);
      } else {
        setSuspects([]);
        setSuspectAId('');
        setSuspectBId('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      reloadData();
    }
  }, [isOpen, caseId, selectedCaseId, currentUser]);

  useEffect(() => {
    if (suspectAId && suspectAId === suspectBId) {
      const remaining = suspects.filter(s => (s.id || s._id) !== suspectAId);
      if (remaining.length > 0) {
        setSuspectBId(remaining[0].id || remaining[0]._id);
      } else {
        setSuspectBId('');
      }
    }
  }, [suspectAId, suspectBId, suspects]);

  if (!isOpen) return null;

  // 1-Click Auto Generate Suspect Pair for active case
  const handleAutoSeedSuspects = async () => {
    try {
      let activeCaseId = selectedCaseId;

      if (!activeCaseId) {
        const newCase = await dbService.addCase(currentUser, {
          fir_number: 'FIR #0184/2026',
          title: 'Malleshwaram Investigation',
          priority: 'high'
        });
        activeCaseId = newCase.id || newCase._id;
        setSelectedCaseId(activeCaseId);
        const list = await dbService.getCases(currentUser);
        setCases(list);
        setShowQuickCaseForm(false);
      }

      const s1 = await dbService.addSuspect(currentUser, {
        case_id: activeCaseId,
        name: 'Basavaraju H',
        aliases: ['Basa', 'BH-402'],
        risk_score: 88
      });

      const s2 = await dbService.addSuspect(currentUser, {
        case_id: activeCaseId,
        name: 'Shivanna K',
        aliases: ['Shiva'],
        risk_score: 72
      });

      const updatedSuspects = await dbService.getSuspects(activeCaseId);
      setSuspects(updatedSuspects);
      setSuspectAId(s1.id || s1._id);
      setSuspectBId(s2.id || s2._id);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to auto seed suspects.');
    }
  };

  const handleQuickAddSuspect = async (e) => {
    e.preventDefault();
    if (!quickSuspectName.trim()) {
      setError('Please enter a suspect name.');
      return;
    }
    let activeCaseId = selectedCaseId;
    try {
      if (!activeCaseId) {
        const newCase = await dbService.addCase(currentUser, {
          fir_number: 'FIR #0184/2026',
          title: 'Malleshwaram Investigation',
          priority: 'high'
        });
        activeCaseId = newCase.id || newCase._id;
        setSelectedCaseId(activeCaseId);
      }

      const newSuspect = await dbService.addSuspect(currentUser, {
        case_id: activeCaseId,
        name: quickSuspectName.trim(),
        risk_score: 75
      });
      setQuickSuspectName('');
      setShowQuickSuspectForm(false);
      setError('');
      const updated = await dbService.getSuspects(activeCaseId);
      setSuspects(updated);
      const newId = newSuspect.id || newSuspect._id;
      if (!suspectAId) setSuspectAId(newId);
      else if (!suspectBId) setSuspectBId(newId);
    } catch (err) {
      setError(err.message || 'Failed to quick add suspect.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let activeCaseId = selectedCaseId || (cases.length > 0 ? (cases[0].id || cases[0]._id) : null);

    try {
      if (showQuickCaseForm) {
        if (!quickFirNumber || !quickTitle) {
          setError('Please provide an FIR Number and Title for the new case.');
          return;
        }
        const createdCase = await dbService.addCase(currentUser, {
          fir_number: quickFirNumber,
          title: quickTitle,
          priority: 'high'
        });
        activeCaseId = createdCase.id || createdCase._id;
      }

      if (!activeCaseId) {
        setError('No active case selected. Please create or select a case.');
        return;
      }

      if (!suspectAId || !suspectBId) {
        setError('Please select both Suspect A and Suspect B. Use "Auto-Generate Suspects" if needed.');
        return;
      }
      if (suspectAId === suspectBId) {
        setError('Suspect A and Suspect B must be different individuals.');
        return;
      }

      const link = await dbService.addSuspectLink(currentUser, {
        case_id: activeCaseId,
        suspect_a_id: suspectAId,
        suspect_b_id: suspectBId,
        link_type: linkType,
        detail: detail.trim() || '14 calls recorded between 02:00 AM and 05:00 AM at Tower KA-BLR-N4'
      });

      setSuspectAId('');
      setSuspectBId('');
      setDetail('');
      setError('');
      if (onAdded) onAdded(link);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to add suspect link.');
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 8 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-lg bg-white border border-outline-variant rounded-2xl shadow-xl overflow-hidden max-h-[90vh] overflow-y-auto"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant">
            <div className="flex items-center gap-2">
              <Share2 className="w-5 h-5 text-navy-deep" />
              <h2 className="text-base font-bold text-navy-deep">Add Suspect Link</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-outline hover:text-navy-deep rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-error text-xs font-semibold rounded-lg">
                {error}
              </div>
            )}

            {/* Case Selection */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-semibold text-on-surface-variant" htmlFor="case_id">
                  Case (FIR) <span className="text-error">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowQuickCaseForm(!showQuickCaseForm)}
                  className="text-xs font-bold text-primary hover:text-gold-accent flex items-center gap-1"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  {showQuickCaseForm ? 'Select Existing Case' : '+ Create New FIR Case'}
                </button>
              </div>

              {showQuickCaseForm ? (
                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2">
                  <span className="text-[11px] font-mono font-bold text-amber-900 block">REGISTER NEW FIR CASE</span>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={quickFirNumber}
                      onChange={(e) => setQuickFirNumber(e.target.value)}
                      placeholder="FIR #0184/2026"
                      className="px-3 py-1.5 bg-white border border-outline-variant rounded-lg text-xs font-bold text-navy-deep outline-none"
                    />
                    <input
                      type="text"
                      value={quickTitle}
                      onChange={(e) => setQuickTitle(e.target.value)}
                      placeholder="Malleshwaram Case"
                      className="px-3 py-1.5 bg-white border border-outline-variant rounded-lg text-xs font-semibold text-navy-deep outline-none"
                    />
                  </div>
                </div>
              ) : (
                <select
                  id="case_id"
                  value={selectedCaseId}
                  onChange={(e) => setSelectedCaseId(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm text-on-surface"
                >
                  {cases.length === 0 ? (
                    <option value="" disabled>No cases available &mdash; Create one above</option>
                  ) : (
                    cases.map(c => (
                      <option key={c.id || c._id} value={c.id || c._id}>{c.fir_number} &mdash; {c.title}</option>
                    ))
                  )}
                </select>
              )}
            </div>

            {/* Suspect Selection with Quick Add & Auto Seed Button */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-on-surface-variant">Linked Suspects <span className="text-error">*</span></label>
                <div className="flex gap-2">
                  {suspects.length < 2 && (
                    <button
                      type="button"
                      onClick={handleAutoSeedSuspects}
                      className="text-xs font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 px-2 py-0.5 rounded border border-amber-300 flex items-center gap-1"
                      title="Instantly create Basavaraju H & Shivanna K for testing"
                    >
                      <Zap className="w-3 h-3 text-amber-600" /> Auto-Generate Pair
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowQuickSuspectForm(!showQuickSuspectForm)}
                    className="text-xs font-bold text-primary hover:text-gold-accent flex items-center gap-1"
                  >
                    <PlusCircle className="w-3.5 h-3.5" /> + Quick Add Suspect
                  </button>
                </div>
              </div>

              {showQuickSuspectForm && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <span className="text-[11px] font-mono font-bold text-navy-deep block">ADD SUSPECT TO THIS CASE</span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={quickSuspectName}
                      onChange={(e) => setQuickSuspectName(e.target.value)}
                      placeholder="Suspect Full Name"
                      className="flex-1 px-3 py-1.5 bg-white border border-outline-variant rounded-lg text-xs font-semibold text-navy-deep outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleQuickAddSuspect}
                      className="px-3 py-1.5 bg-navy-deep text-white text-xs font-bold rounded-lg hover:opacity-90"
                    >
                      Save
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-outline mb-1" htmlFor="suspect_a">Suspect A</label>
                  <select
                    id="suspect_a"
                    value={suspectAId}
                    onChange={(e) => setSuspectAId(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg text-xs font-semibold text-on-surface"
                  >
                    {suspects.length === 0 ? (
                      <option value="" disabled>Click "Auto-Generate Pair" above</option>
                    ) : (
                      suspects.map(s => (
                        <option key={s.id || s._id} value={s.id || s._id}>{s.name}</option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-outline mb-1" htmlFor="suspect_b">Suspect B</label>
                  <select
                    id="suspect_b"
                    value={suspectBId}
                    onChange={(e) => setSuspectBId(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg text-xs font-semibold text-on-surface"
                  >
                    {suspects.length === 0 ? (
                      <option value="" disabled>Click "Auto-Generate Pair" above</option>
                    ) : (
                      suspects
                        .filter(s => (s.id || s._id) !== suspectAId)
                        .map(s => (
                          <option key={s.id || s._id} value={s.id || s._id}>{s.name}</option>
                        ))
                    )}
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Link Type <span className="text-error">*</span></label>
              <div className="grid grid-cols-3 gap-2">
                <label className={`flex items-center justify-center gap-1.5 px-2 py-2.5 border rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                  linkType === 'cdr_call' ? 'bg-primary-container text-white border-primary-container' : 'border-outline-variant text-on-surface-variant hover:bg-surface-container'
                }`}>
                  <input
                    type="radio"
                    name="link_type"
                    value="cdr_call"
                    checked={linkType === 'cdr_call'}
                    onChange={() => setLinkType('cdr_call')}
                    className="hidden"
                    required
                  />
                  CDR Call
                </label>

                <label className={`flex items-center justify-center gap-1.5 px-2 py-2.5 border rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                  linkType === 'anpr' ? 'bg-primary-container text-white border-primary-container' : 'border-outline-variant text-on-surface-variant hover:bg-surface-container'
                }`}>
                  <input
                    type="radio"
                    name="link_type"
                    value="anpr"
                    checked={linkType === 'anpr'}
                    onChange={() => setLinkType('anpr')}
                    className="hidden"
                  />
                  ANPR
                </label>

                <label className={`flex items-center justify-center gap-1.5 px-2 py-2.5 border rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                  linkType === 'secondary_associate' ? 'bg-primary-container text-white border-primary-container' : 'border-outline-variant text-on-surface-variant hover:bg-surface-container'
                }`}>
                  <input
                    type="radio"
                    name="link_type"
                    value="secondary_associate"
                    checked={linkType === 'secondary_associate'}
                    onChange={() => setLinkType('secondary_associate')}
                    className="hidden"
                  />
                  Associate
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1.5" htmlFor="detail">
                Basis for this link <span className="text-outline font-normal">(shown in graph explanation)</span>
              </label>
              <textarea
                id="detail"
                rows="2"
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
                placeholder="e.g. 14 calls recorded between 02:00 AM and 05:00 AM at Tower KA-BLR-N4"
                className="w-full px-3.5 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm text-on-surface resize-none"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                className="flex-1 bg-primary text-on-primary py-3 rounded-lg text-sm font-semibold hover:bg-primary-container transition-all active:scale-[0.98] shadow-sm flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" /> Add Link Edge
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-3 rounded-lg text-sm font-semibold text-on-surface-variant border border-outline-variant hover:bg-surface-container transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
