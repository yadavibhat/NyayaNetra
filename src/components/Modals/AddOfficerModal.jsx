import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserPlus } from 'lucide-react';
import { dbService } from '../../lib/supabase';

export function AddOfficerModal({ isOpen, onClose, onAdded, currentUser }) {
  const [fullName, setFullName] = useState('');
  const [badgeId, setBadgeId] = useState('');
  const [role, setRole] = useState('investigator');
  const [stationId, setStationId] = useState('');
  const [error, setError] = useState('');
  const [stations, setStations] = useState([]);

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
    if (!fullName || !badgeId) {
      setError('Please provide Officer Full Name and Badge ID.');
      return;
    }

    try {
      const officer = await dbService.addOfficer(currentUser, {
        full_name: fullName,
        badge_id: badgeId,
        role,
        station_id: stationId || (stations[0]?.id || stations[0]?._id || null)
      });
      setFullName('');
      setBadgeId('');
      setError('');
      if (onAdded) onAdded(officer);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to add officer.');
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
              <UserPlus className="w-5 h-5 text-gold-accent" />
              <span>Add Officer to Roster</span>
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
              <label className="block text-xs font-bold text-on-surface-variant uppercase mb-1">Full Name & Rank</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Insp. Suresh Gowda"
                className="w-full px-3.5 py-2.5 bg-surface-container border border-outline-variant rounded-xl text-xs font-semibold text-navy-deep focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase mb-1">Service Badge ID</label>
              <input
                type="text"
                value={badgeId}
                onChange={(e) => setBadgeId(e.target.value)}
                placeholder="e.g. KA-04-9842"
                className="w-full px-3.5 py-2.5 bg-surface-container border border-outline-variant rounded-xl text-xs font-mono font-semibold text-navy-deep focus:ring-2 focus:ring-primary/20 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase mb-1">Clearance Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-surface-container border border-outline-variant rounded-xl text-xs font-semibold text-navy-deep focus:ring-2 focus:ring-primary/20 outline-none"
              >
                <option value="investigator">Investigator</option>
                <option value="admin">Chief Officer / Admin</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase mb-1">Assigned Police Station</label>
              <select
                value={stationId}
                onChange={(e) => setStationId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-surface-container border border-outline-variant rounded-xl text-xs font-semibold text-navy-deep focus:ring-2 focus:ring-primary/20 outline-none"
              >
                <option value="">Select Station...</option>
                {stations.map(st => (
                  <option key={st.id} value={st.id}>{st.name} ({st.district})</option>
                ))}
              </select>
              {stations.length === 0 && (
                <p className="text-[10px] text-amber-700 mt-1 font-semibold">No stations registered yet. Create a station first if needed.</p>
              )}
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
                Add Officer
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
