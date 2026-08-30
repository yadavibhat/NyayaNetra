import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FilePlus, ShieldAlert, Sparkles, Building2, Calendar, Hash } from 'lucide-react';
import { dbService } from '../../lib/api';

export function AddCaseModal({ isOpen, onClose, onAdded, currentUser }) {
  const currentYear = new Date().getFullYear().toString();
  
  // FIR Structure Fields
  const [firType, setFirType] = useState('standard'); // 'standard' | 'zero'
  const [seqNumber, setSeqNumber] = useState('0045');
  const [year, setYear] = useState(currentYear);
  const [firNumber, setFirNumber] = useState('');
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [stationId, setStationId] = useState('');
  const [error, setError] = useState('');
  const [stations, setStations] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const fetchStations = async () => {
      try {
        const list = await dbService.getStations();
        setStations(list);
        if (list.length > 0 && !stationId) {
          setStationId(list[0].id || list[0]._id);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchStations();
  }, [isOpen]);

  // Compute standard Karnataka FIR Number string dynamically
  useEffect(() => {
    if (firType === 'zero') {
      const paddedSeq = seqNumber ? seqNumber.padStart(4, '0') : '0';
      setFirNumber(`Zero FIR 0/${year} (${paddedSeq})`);
    } else {
      const paddedSeq = seqNumber ? seqNumber.padStart(4, '0') : '0001';
      setFirNumber(`FIR No. ${paddedSeq}/${year}`);
    }
  }, [firType, seqNumber, year]);

  if (!isOpen) return null;

  const selectedStationObj = stations.find(s => (s.id || s._id) === stationId) || stations[0];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!firNumber || !title) {
      setError('Please provide both FIR Number and Case Title.');
      return;
    }

    setSubmitting(true);
    try {
      const caseItem = await dbService.addCase(currentUser, {
        fir_number: firNumber,
        title,
        description,
        priority,
        station_id: stationId || (selectedStationObj?.id || selectedStationObj?._id || null)
      });
      setSeqNumber('0046');
      setTitle('');
      setDescription('');
      setError('');
      if (onAdded) onAdded(caseItem);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create case.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-xl bg-white border border-outline-variant rounded-2xl shadow-xl overflow-hidden my-8"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-outline-variant bg-surface-container-low">
            <div className="flex items-center gap-2 text-navy-deep font-bold text-sm">
              <FilePlus className="w-5 h-5 text-gold-accent" />
              <span>Register Karnataka Judicial FIR Dossier</span>
            </div>
            <button onClick={onClose} className="p-1 text-outline hover:text-navy-deep rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-error text-xs font-semibold rounded-lg">
                {error}
              </div>
            )}

            {/* FIR Type Switcher (Standard vs Zero FIR) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-on-surface-variant uppercase">
                FIR Registration Classification
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFirType('standard')}
                  className={`p-3 rounded-xl border text-xs font-bold transition-all text-left flex items-center justify-between ${
                    firType === 'standard'
                      ? 'border-navy-deep bg-surface-container-low ring-2 ring-navy-deep/20 text-navy-deep'
                      : 'border-outline-variant text-outline hover:border-slate-300'
                  }`}
                >
                  <div>
                    <span className="block font-bold">Standard Station FIR</span>
                    <span className="text-[10px] font-normal text-outline">Sequential 0001-9999/YYYY</span>
                  </div>
                  {firType === 'standard' && <Sparkles className="w-4 h-4 text-gold-accent" />}
                </button>

                <button
                  type="button"
                  onClick={() => setFirType('zero')}
                  className={`p-3 rounded-xl border text-xs font-bold transition-all text-left flex items-center justify-between ${
                    firType === 'zero'
                      ? 'border-amber-600 bg-amber-50/50 ring-2 ring-amber-500/20 text-amber-900'
                      : 'border-outline-variant text-outline hover:border-slate-300'
                  }`}
                >
                  <div>
                    <span className="block font-bold text-amber-900 flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-600" /> Zero FIR (0/YYYY)
                    </span>
                    <span className="text-[10px] font-normal text-amber-700">Jurisdictional Transfer</span>
                  </div>
                  {firType === 'zero' && <Sparkles className="w-4 h-4 text-amber-600" />}
                </button>
              </div>
            </div>

            {/* FIR Formatter Builder Controls */}
            <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-navy-deep flex items-center gap-1">
                  <Hash className="w-3.5 h-3.5 text-gold-accent" /> CCTNS Standard Code Generator
                </span>
                <span className="text-[10px] font-mono text-outline font-bold">Resets annually on Jan 1st</span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-outline uppercase mb-1">
                    {firType === 'zero' ? 'Ref/Trans ID' : 'Sequential Serial (0001+)'}
                  </label>
                  <input
                    type="text"
                    value={seqNumber}
                    onChange={(e) => setSeqNumber(e.target.value)}
                    placeholder="0045"
                    className="w-full px-3 py-2 bg-white border border-outline-variant rounded-xl text-xs font-mono font-bold text-navy-deep outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-outline uppercase mb-1">Filing Year</label>
                  <select
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-outline-variant rounded-xl text-xs font-semibold text-navy-deep outline-none"
                  >
                    <option value="2026">2026</option>
                    <option value="2025">2025</option>
                    <option value="2024">2024</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-outline uppercase mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-outline-variant rounded-xl text-xs font-semibold text-navy-deep outline-none"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium</option>
                    <option value="high">Critical High</option>
                  </select>
                </div>
              </div>

              {/* Dynamic Live FIR Badge Preview */}
              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                <span className="text-[11px] font-bold text-outline">Generated FIR Identifier:</span>
                <span className="font-mono text-xs font-bold text-gold-accent bg-navy-deep px-3 py-1 rounded-lg shadow-2xs">
                  {firNumber}
                </span>
              </div>
            </div>

            {/* Title & Station */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase mb-1">Case Investigation Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Cyber Crime CDR & Financial Fraud"
                  className="w-full px-3.5 py-2.5 bg-surface-container border border-outline-variant rounded-xl text-xs font-semibold text-navy-deep focus:ring-2 focus:ring-primary/20 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase mb-1">Police Station & District</label>
                <select
                  value={stationId}
                  onChange={(e) => setStationId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-surface-container border border-outline-variant rounded-xl text-xs font-semibold text-navy-deep focus:ring-2 focus:ring-primary/20 outline-none"
                >
                  {stations.map(st => (
                    <option key={st.id || st._id} value={st.id || st._id}>
                      {st.name} ({st.district})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase mb-1">Case Synopsis & Briefing</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter incident location, suspect modus operandi, cell tower notes..."
                className="w-full px-3.5 py-2.5 bg-surface-container border border-outline-variant rounded-xl text-xs font-medium text-navy-deep focus:ring-2 focus:ring-primary/20 outline-none resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-outline-variant/60">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-outline hover:text-navy-deep rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className={`px-5 py-2.5 bg-navy-deep text-on-primary text-xs font-bold rounded-xl hover:opacity-90 transition-all shadow-2xs ${
                  submitting ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {submitting ? 'Registering FIR...' : 'Create Official FIR Dossier'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
