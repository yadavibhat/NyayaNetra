import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Building2 } from 'lucide-react';
import { dbService } from '../../lib/api';

export function AddStationModal({ isOpen, onClose, onAdded, currentUser }) {
  const [name, setName] = useState('');
  const [district, setDistrict] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !district) {
      setError('Please fill in both Station Name and District.');
      return;
    }

    try {
      const station = dbService.addStation(currentUser, { name, district });
      setName('');
      setDistrict('');
      setError('');
      if (onAdded) onAdded(station);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to add station.');
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
          className="w-full max-w-md bg-white border border-outline-variant rounded-2xl shadow-xl overflow-hidden"
        >
          <div className="flex items-center justify-between p-4 border-b border-outline-variant bg-surface-container-low">
            <div className="flex items-center gap-2 text-navy-deep font-bold text-sm">
              <Building2 className="w-5 h-5 text-gold-accent" />
              <span>Add Police Station</span>
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

            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase mb-1">Police Station Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Malleshwaram Police Station"
                className="w-full px-3.5 py-2.5 bg-surface-container border border-outline-variant rounded-xl text-xs font-semibold text-navy-deep focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase mb-1">District / Jurisdiction</label>
              <input
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder="e.g. Bengaluru City"
                className="w-full px-3.5 py-2.5 bg-surface-container border border-outline-variant rounded-xl text-xs font-semibold text-navy-deep focus:ring-2 focus:ring-primary/20 outline-none"
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
                className="px-4 py-2 bg-navy-deep text-on-primary text-xs font-bold rounded-lg hover:opacity-90 transition-all shadow-2xs"
              >
                Save Station
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
