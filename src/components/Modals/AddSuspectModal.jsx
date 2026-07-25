import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserPlus, Save, PlusCircle } from 'lucide-react';
import { dbService } from '../../lib/supabase';

export function AddSuspectModal({ isOpen, onClose, onAdded, caseId, currentUser }) {
  const [cases, setCases] = useState([]);
  const [selectedCaseId, setSelectedCaseId] = useState(caseId || '');
  const [showQuickCaseForm, setShowQuickCaseForm] = useState(false);

  // Quick FIR fields
  const [quickFirNumber, setQuickFirNumber] = useState('');
  const [quickTitle, setQuickTitle] = useState('');

  // Suspect fields
  const [name, setName] = useState('');
  const [aliases, setAliases] = useState('');
  const [riskScore, setRiskScore] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const reloadCases = async () => {
    try {
      const loadedCases = await dbService.getCases(currentUser);
      setCases(loadedCases);
      if (caseId) {
        setSelectedCaseId(caseId);
      } else if (loadedCases.length > 0 && !selectedCaseId) {
        setSelectedCaseId(loadedCases[0].id || loadedCases[0]._id);
      } else if (loadedCases.length === 0) {
        setShowQuickCaseForm(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      reloadCases();
    }
  }, [isOpen, caseId, currentUser]);

  if (!isOpen) return null;

  const handleCreateQuickCase = async (e) => {
    e.preventDefault();
    if (!quickFirNumber || !quickTitle) {
      setError('Please enter both FIR Number and Case Title.');
      return;
    }
    try {
      const newCase = await dbService.addCase(currentUser, {
        fir_number: quickFirNumber,
        title: quickTitle,
        description: 'Case registered via Add Suspect Portal.',
        priority: 'high'
      });
      setQuickFirNumber('');
      setQuickTitle('');
      setShowQuickCaseForm(false);
      setError('');
      const updatedCases = await dbService.getCases(currentUser);
      setCases(updatedCases);
      setSelectedCaseId(newCase.id || newCase._id);
    } catch (err) {
      setError(err.message || 'Failed to create FIR case.');
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please provide the Suspect Name.');
      return;
    }

    try {
      let activeCaseId = selectedCaseId;

      // If quick case form was active, create case first
      if (showQuickCaseForm || !activeCaseId) {
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

      const aliasArray = aliases ? aliases.split(',').map(s => s.trim()).filter(Boolean) : [];
      const scoreVal = riskScore !== '' ? Number(riskScore) : null;

      const suspect = await dbService.addSuspect(currentUser, {
        case_id: activeCaseId,
        name: name.trim(),
        aliases: aliasArray,
        risk_score: scoreVal,
        image_url: imageUrl || null
      });

      setName('');
      setAliases('');
      setRiskScore('');
      setImageUrl('');
      setQuickFirNumber('');
      setQuickTitle('');
      setShowQuickCaseForm(false);
      setError('');
      if (onAdded) onAdded(suspect);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to add suspect.');
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
          className="w-full max-w-lg bg-white border border-outline-variant rounded-2xl shadow-xl overflow-hidden"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant">
            <div className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-navy-deep" />
              <h2 className="text-base font-bold text-navy-deep">Add Suspect</h2>
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

            {/* Case Selection & Quick Creation */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-semibold text-on-surface-variant" htmlFor="case_id">
                  Linked Case (FIR) <span className="text-error">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowQuickCaseForm(!showQuickCaseForm)}
                  className="text-xs font-bold text-primary hover:text-gold-accent flex items-center gap-1"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  {showQuickCaseForm ? 'Select Existing Case' : '+ Create New FIR Case (BNSS 173)'}
                </button>
              </div>

              {showQuickCaseForm ? (
                <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl space-y-3">
                  <span className="text-[11px] font-mono font-bold text-amber-900 block">
                    REGISTER NEW KARNATAKA POLICE FIR (BNSS SECTION 173)
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={quickFirNumber}
                      onChange={(e) => setQuickFirNumber(e.target.value)}
                      placeholder="e.g. FIR #0184/2026"
                      className="px-3 py-2 bg-white border border-outline-variant rounded-lg text-xs font-bold text-navy-deep outline-none"
                    />
                    <input
                      type="text"
                      value={quickTitle}
                      onChange={(e) => setQuickTitle(e.target.value)}
                      placeholder="e.g. Malleshwaram Investigation"
                      className="px-3 py-2 bg-white border border-outline-variant rounded-lg text-xs font-semibold text-navy-deep outline-none"
                    />
                  </div>
                </div>
              ) : (
                <select
                  id="case_id"
                  value={selectedCaseId}
                  onChange={(e) => {
                    if (e.target.value === '__NEW__') {
                      setShowQuickCaseForm(true);
                    } else {
                      setSelectedCaseId(e.target.value);
                    }
                  }}
                  required
                  className="w-full px-3.5 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm text-on-surface"
                >
                  {cases.length === 0 ? (
                    <option value="" disabled>No FIR cases yet &mdash; Click "+ Create New FIR Case" above</option>
                  ) : (
                    cases.map(c => (
                      <option key={c.id} value={c.id}>{c.fir_number} &mdash; {c.title}</option>
                    ))
                  )}
                  <option value="__NEW__">+ Register New FIR Case (BNSS 173)...</option>
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1.5" htmlFor="name">
                Full Name <span className="text-error">*</span>
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Enter suspect's full name"
                className="w-full px-3.5 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm text-on-surface"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1.5" htmlFor="aliases">
                Known Aliases <span className="text-outline font-normal">(optional, comma-separated)</span>
              </label>
              <input
                type="text"
                id="aliases"
                value={aliases}
                onChange={(e) => setAliases(e.target.value)}
                placeholder="e.g. Chikka, Bittu"
                className="w-full px-3.5 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm text-on-surface"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1.5" htmlFor="risk_score">
                Risk Score <span className="text-outline font-normal">(0&ndash;100, optional &mdash; leave blank if unassessed)</span>
              </label>
              <input
                type="number"
                id="risk_score"
                min="0"
                max="100"
                value={riskScore}
                onChange={(e) => setRiskScore(e.target.value)}
                placeholder="Unassessed"
                className="w-full px-3.5 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm text-on-surface"
              />
              <p className="text-[11px] text-outline mt-1">This should reflect a documented reason (repeat-offender pattern, active links, etc.) &mdash; not a guess. Leave blank rather than estimate.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                Suspect Photo / Mugshot <span className="text-outline font-normal">(optional)</span>
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="suspect-photo-upload"
                />
                <label
                  htmlFor="suspect-photo-upload"
                  className="cursor-pointer px-4 py-2.5 border border-outline-variant hover:bg-surface-container rounded-lg text-xs font-bold text-navy-deep transition-all bg-surface-container-low"
                >
                  Choose Image File
                </label>
                {imageUrl ? (
                  <div className="relative w-11 h-11 rounded-full border border-outline-variant overflow-hidden bg-slate-100 shadow-sm shrink-0">
                    <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setImageUrl('')}
                      className="absolute inset-0 bg-black/40 text-white flex items-center justify-center font-bold text-[8px] hover:bg-black/60 opacity-0 hover:opacity-100 transition-opacity"
                      title="Clear photo"
                    >
                      Clear
                    </button>
                  </div>
                ) : (
                  <span className="text-[10px] text-outline italic">No file selected</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                className="flex-1 bg-primary text-on-primary py-3 rounded-lg text-sm font-semibold hover:bg-primary-container transition-all active:scale-[0.98] shadow-sm flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" /> Add Suspect
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-3 rounded-lg text-sm font-semibold text-on-surface-variant border border-outline-variant hover:bg-surface-container transition-all"
              >
                Cancel
              </button>
            </div>
            <p className="text-[11px] text-outline text-center pt-1">Every submission here is written to <code className="font-mono">audit_logs</code> under Section 63, BSA 2023.</p>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
