import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileSpreadsheet, Save, PlusCircle } from 'lucide-react';
import { dbService } from '../../lib/supabase';

const compressImage = (base64Str, maxWidth = 400, maxHeight = 400) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.7));
    };
    img.onerror = () => {
      resolve(base64Str);
    };
  });
};

export function AddEvidenceModal({ isOpen, onClose, onAdded, caseId, currentUser }) {
  const [cases, setCases] = useState([]);
  const [selectedCaseId, setSelectedCaseId] = useState(caseId || '');
  const [suspects, setSuspects] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Quick Inline Creation states
  const [showQuickCaseForm, setShowQuickCaseForm] = useState(false);
  const [quickFirNumber, setQuickFirNumber] = useState('');
  const [quickTitle, setQuickTitle] = useState('');

  // Evidence fields
  const [suspectId, setSuspectId] = useState('');
  const [type, setType] = useState('cdr');
  const [cellTower, setCellTower] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [capturedAt, setCapturedAt] = useState('');
  const [details, setDetails] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const compressed = await compressImage(reader.result);
        setImageUrl(compressed);
      };
      reader.readAsDataURL(file);
    }
  };

  const reloadData = async () => {
    try {
      const loadedCases = await dbService.getCases(currentUser);
      setCases(loadedCases);

      const activeId = selectedCaseId || caseId || (loadedCases[0]?.id || loadedCases[0]?._id || null);
      if (!selectedCaseId && loadedCases.length > 0) {
        setSelectedCaseId(loadedCases[0].id || loadedCases[0]._id);
      } else if (loadedCases.length === 0) {
        setShowQuickCaseForm(true);
      }

      if (activeId) {
        const loadedSuspects = await dbService.getSuspects(activeId);
        setSuspects(loadedSuspects);
        const ids = loadedSuspects.map(s => s.id || s._id);
        if (suspectId && !ids.includes(suspectId)) {
          setSuspectId('');
        }
      } else {
        setSuspects([]);
        setSuspectId('');
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

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    let activeCaseId = selectedCaseId;

    setSubmitting(true);
    try {
      if (showQuickCaseForm || !activeCaseId) {
        if (!quickFirNumber || !quickTitle) {
          setError('Please provide an FIR Number and Title for the new case.');
          setSubmitting(false);
          return;
        }
        const createdCase = await dbService.addCase(currentUser, {
          fir_number: quickFirNumber,
          title: quickTitle,
          priority: 'high'
        });
        activeCaseId = createdCase.id || createdCase._id;
      }

      if (!capturedAt) {
        setError('Date & Time Captured is required.');
        setSubmitting(false);
        return;
      }

      const evidence = await dbService.addEvidence(currentUser, {
        case_id: activeCaseId,
        suspect_id: suspectId || null,
        type,
        cell_tower: cellTower.trim() || null,
        phone_number: phoneNumber.trim() || null,
        captured_at: capturedAt,
        image_url: imageUrl || null,
        details: { notes: details.trim() }
      });

      setSuspectId('');
      setCellTower('');
      setPhoneNumber('');
      setCapturedAt('');
      setDetails('');
      setImageUrl('');
      setError('');
      if (onAdded) onAdded(evidence);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to add evidence record.');
    } finally {
      setSubmitting(false);
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
              <FileSpreadsheet className="w-5 h-5 text-navy-deep" />
              <h2 className="text-base font-bold text-navy-deep">Add Evidence / CDR Record</h2>
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
                      <option key={c.id} value={c.id}>{c.fir_number} &mdash; {c.title}</option>
                    ))
                  )}
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1.5" htmlFor="suspect_id">
                Linked Suspect <span className="text-outline font-normal">(optional)</span>
              </label>
              <select
                id="suspect_id"
                value={suspectId}
                onChange={(e) => setSuspectId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm text-on-surface"
              >
                <option value="">None yet / Unlinked</option>
                {suspects.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">Record Type <span className="text-error">*</span></label>
              <div className="grid grid-cols-4 gap-2">
                <label className={`flex items-center justify-center px-2 py-2.5 border rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                  type === 'cdr' ? 'bg-primary-container text-white border-primary-container' : 'border-outline-variant text-on-surface-variant hover:bg-surface-container'
                }`}>
                  <input type="radio" name="type" value="cdr" checked={type === 'cdr'} onChange={() => setType('cdr')} className="hidden" required />
                  CDR
                </label>

                <label className={`flex items-center justify-center px-2 py-2.5 border rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                  type === 'anpr' ? 'bg-primary-container text-white border-primary-container' : 'border-outline-variant text-on-surface-variant hover:bg-surface-container'
                }`}>
                  <input type="radio" name="type" value="anpr" checked={type === 'anpr'} onChange={() => setType('anpr')} className="hidden" />
                  ANPR
                </label>

                <label className={`flex items-center justify-center px-2 py-2.5 border rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                  type === 'document' ? 'bg-primary-container text-white border-primary-container' : 'border-outline-variant text-on-surface-variant hover:bg-surface-container'
                }`}>
                  <input type="radio" name="type" value="document" checked={type === 'document'} onChange={() => setType('document')} className="hidden" />
                  Document
                </label>

                <label className={`flex items-center justify-center px-2 py-2.5 border rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                  type === 'other' ? 'bg-primary-container text-white border-primary-container' : 'border-outline-variant text-on-surface-variant hover:bg-surface-container'
                }`}>
                  <input type="radio" name="type" value="other" checked={type === 'other'} onChange={() => setType('other')} className="hidden" />
                  Other
                </label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1.5" htmlFor="cell_tower">
                  Cell Tower / Location ID
                </label>
                <input
                  type="text"
                  id="cell_tower"
                  value={cellTower}
                  onChange={(e) => setCellTower(e.target.value)}
                  placeholder="e.g. KA-BLR-N4"
                  className="w-full px-3.5 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm text-on-surface"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1.5" htmlFor="phone_number">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone_number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+91..."
                  className="w-full px-3.5 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm text-on-surface"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1.5" htmlFor="captured_at">
                Date &amp; Time Captured <span className="text-error">*</span>
              </label>
              <input
                type="datetime-local"
                id="captured_at"
                value={capturedAt}
                onChange={(e) => setCapturedAt(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm text-on-surface"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1.5" htmlFor="details">
                Additional Details
              </label>
              <textarea
                id="details"
                rows="2"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Any further context an investigator should see when this record is cited in chat"
                className="w-full px-3.5 py-2.5 bg-surface-container-lowest border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm text-on-surface resize-none mb-4"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1.5">
                Upload Evidence Document / Scene Photo <span className="text-outline font-normal">(optional)</span>
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="evidence-photo-upload"
                />
                <label
                  htmlFor="evidence-photo-upload"
                  className="cursor-pointer px-4 py-2.5 border border-outline-variant hover:bg-surface-container rounded-lg text-xs font-bold text-navy-deep transition-all bg-surface-container-low"
                >
                  Choose Photo File
                </label>
                {imageUrl ? (
                  <div className="relative w-11 h-11 rounded border border-outline-variant overflow-hidden bg-slate-100 shadow-sm shrink-0">
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
                disabled={submitting}
                className={`flex-1 bg-primary text-on-primary py-3 rounded-lg text-sm font-semibold hover:bg-primary-container transition-all active:scale-[0.98] shadow-sm flex items-center justify-center gap-2 ${
                  submitting ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {!submitting && <Save className="w-4 h-4" />}
                <span>{submitting ? 'Adding...' : 'Add Record'}</span>
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
