import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FilePlus } from 'lucide-react';
import { dbService } from '../../lib/supabase';

export function AddCaseModal({ isOpen, onClose, onAdded, currentUser }) {
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

  if (!isOpen) return null;

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
        station_id: stationId || (stations[0]?.id || stations[0]?._id || null)
      });
      setFirNumber('');
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-lg bg-white border border-outline-variant rounded-2xl shadow-xl overflow-hidden"
        >
          <div className="flex items-center justify-between p-4 border-b border-outline-variant bg-surface-container-low">
            <div className="flex items-center gap-2 text-navy-deep font-bold text-sm">
              <FilePlus className="w-5 h-5 text-gold-accent" />
              <span>Create New Investigation FIR</span>
            </div>
            <button onClick={onClose} className="p-1 text-outline hover:text-navy-deep rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-error text-xs font-semibold rounded-lg">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase mb-1">FIR Number</label>
                <input
                  type="text"
                  value={firNumber}
                  onChange={(e) => setFirNumber(e.target.value)}
                  placeholder="e.g. FIR #0184/2026"
                  className="w-full px-3.5 py-2.5 bg-surface-container border border-outline-variant rounded-xl text-xs font-mono font-bold text-navy-deep focus:ring-2 focus:ring-primary/20 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase mb-1">Priority Clearance</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-surface-container border border-outline-variant rounded-xl text-xs font-semibold text-navy-deep focus:ring-2 focus:ring-primary/20 outline-none"
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority Critical</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase mb-1">Investigation Subject Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Cell Tower CDR & ANPR Vehicle Mapping"
                className="w-full px-3.5 py-2.5 bg-surface-container border border-outline-variant rounded-xl text-xs font-semibold text-navy-deep focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase mb-1">Police Station</label>
              <select
                value={stationId}
                onChange={(e) => setStationId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-surface-container border border-outline-variant rounded-xl text-xs font-semibold text-navy-deep focus:ring-2 focus:ring-primary/20 outline-none"
              >
                <option value="">Default Station...</option>
                {stations.map(st => (
                  <option key={st.id} value={st.id}>{st.name} ({st.district})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase mb-1">Case Synopsis & Briefing</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter briefing details, incident location, cell towers..."
                className="w-full px-3.5 py-2.5 bg-surface-container border border-outline-variant rounded-xl text-xs font-medium text-navy-deep focus:ring-2 focus:ring-primary/20 outline-none resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-outline-variant/60">
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
                className={`px-4 py-2 bg-navy-deep text-on-primary text-xs font-bold rounded-lg hover:opacity-90 transition-all shadow-2xs ${
                  submitting ? 'opacity-70 cursor-not-allowed' : ''
                }`}
              >
                {submitting ? 'Creating...' : 'Create FIR File'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
