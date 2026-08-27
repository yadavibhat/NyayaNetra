import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../lib/api';
import { Navbar } from '../components/Navbar';
import { AddOfficerModal } from '../components/Modals/AddOfficerModal';
import { AddStationModal } from '../components/Modals/AddStationModal';
import { Users, FileText, AlertTriangle, Clock, UserPlus, Building2, CheckCircle2, XCircle, Database } from 'lucide-react';

export function AdminView({ setActiveScreen }) {
  const { session } = useAuth();
  const profile = session?.profile;
  const [officers, setOfficers] = useState([]);
  const [stations, setStations] = useState([]);
  const [stats, setStats] = useState({ activeOfficers: 0, firCount: 0, highPriorityCount: 0, pendingApprovals: 0 });
  const [isAddOfficerOpen, setIsAddOfficerOpen] = useState(false);
  const [isAddStationOpen, setIsAddStationOpen] = useState(false);
  const [seedNotice, setSeedNotice] = useState('');

  const reloadData = async () => {
    try {
      const [offs, stns, st] = await Promise.all([
        dbService.getOfficers(session),
        dbService.getStations(),
        dbService.getOverviewStats()
      ]);
      setOfficers(offs);
      setStations(stns);
      setStats(st);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    reloadData();
  }, [session]);

  const handleApprove = async (officerId) => {
    try {
      await dbService.approveOfficer(session, officerId);
      await reloadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRevoke = async (officerId) => {
    try {
      await dbService.revokeOfficer(session, officerId);
      await reloadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSeed = async () => {
    try {
      await dbService.seedSampleData(profile.id || profile._id);
      setSeedNotice('Loaded optional sample FIR & suspect data into the database.');
      await reloadData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-surface font-sans text-on-surface flex flex-col">
      <Navbar activeScreen="admin" setActiveScreen={setActiveScreen} />

      <main className="flex-1 max-w-[1100px] w-full mx-auto p-6 space-y-6">
        {/* Banner Card */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="bg-white border border-outline-variant p-6 rounded-2xl shadow-sm flex flex-wrap justify-between items-center gap-4"
        >
          <div>
            <h1 className="text-2xl font-bold text-navy-deep">Access Console</h1>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Manage investigator access clearances, station settings, and officer credentials.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setIsAddOfficerOpen(true)}
              className="px-3.5 py-2 bg-navy-deep text-on-primary rounded-xl text-xs font-bold hover:opacity-90 transition-all flex items-center gap-1.5 shadow-2xs"
            >
              <UserPlus className="w-4 h-4 text-gold-accent" /> Add Officer
            </button>
            <button
              onClick={() => setIsAddStationOpen(true)}
              className="px-3.5 py-2 bg-surface-container border border-outline-variant text-navy-deep rounded-xl text-xs font-bold hover:bg-surface-container-high transition-all flex items-center gap-1.5"
            >
              <Building2 className="w-4 h-4" /> Add Station
            </button>
            <button
              onClick={handleSeed}
              className="px-3.5 py-2 bg-amber-500/10 border border-amber-500/30 text-amber-900 rounded-xl text-xs font-bold hover:bg-amber-500/20 transition-all flex items-center gap-1.5"
              title="Load optional sample test data"
            >
              <Database className="w-4 h-4 text-amber-700" /> Optional Sample Seed
            </button>
          </div>
        </motion.div>

        {seedNotice && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold rounded-xl">
            {seedNotice}
          </div>
        )}

        {/* KPI Cards Grid with Count Up Animations */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white border border-outline-variant p-4 rounded-xl shadow-2xs">
            <span className="text-[10px] font-mono font-bold text-outline uppercase flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-navy-deep" /> Active Personnel
            </span>
            <p className="text-2xl font-bold text-navy-deep mt-1">{stats.activeOfficers}</p>
            <span className="text-[10px] text-emerald-700 font-bold">Approved Roster</span>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.05 }} className="bg-white border border-outline-variant p-4 rounded-xl shadow-2xs">
            <span className="text-[10px] font-mono font-bold text-outline uppercase flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-navy-deep" /> FIR Cases (BNSS 173)
            </span>
            <p className="text-2xl font-bold text-navy-deep mt-1">{stats.firCount}</p>
            <span className="text-[10px] text-emerald-700 font-bold">Registered FIR Files</span>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="bg-white border border-outline-variant p-4 rounded-xl shadow-2xs">
            <span className="text-[10px] font-mono font-bold text-outline uppercase flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> High Priority
            </span>
            <p className="text-2xl font-bold text-amber-600 mt-1">{stats.highPriorityCount}</p>
            <span className="text-[10px] text-amber-800 font-bold">Critical Clearance</span>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 }} className="bg-white border border-outline-variant p-4 rounded-xl shadow-2xs">
            <span className="text-[10px] font-mono font-bold text-outline uppercase flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-outline" /> Pending Approvals
            </span>
            <p className="text-2xl font-bold text-navy-deep mt-1">{stats.pendingApprovals}</p>
            <span className="text-[10px] text-outline font-bold">In SCRB Clearance Queue</span>
          </motion.div>
        </div>

        {/* Roster Table */}
        <div className="bg-white border border-outline-variant p-6 rounded-2xl shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-outline-variant">
            <div>
              <h3 className="text-sm font-bold text-navy-deep uppercase tracking-wider">
                Authorized Officer Roster & SCRB Access Clearances
              </h3>
              <p className="text-xs text-outline">Manage access status for registered personnel.</p>
            </div>
            <button
              onClick={() => setActiveScreen('audit')}
              className="text-xs font-bold text-primary hover:text-gold-accent flex items-center gap-1 underline"
            >
              <CheckCircle2 className="w-4 h-4" /> Inspect Audit Logs
            </button>
          </div>

          <div className="overflow-x-auto">
            {officers.length === 0 ? (
              <div className="p-8 text-center bg-surface-container-low rounded-xl border border-dashed border-outline-variant">
                <p className="text-xs text-outline font-medium">No officers added yet &mdash; Click "Add Officer" to populate the roster.</p>
                <button
                  onClick={() => setIsAddOfficerOpen(true)}
                  className="mt-3 px-4 py-2 bg-navy-deep text-on-primary rounded-xl text-xs font-bold inline-flex items-center gap-1.5"
                >
                  <UserPlus className="w-4 h-4 text-gold-accent" /> Add First Officer
                </button>
              </div>
            ) : (
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low text-navy-deep font-bold border-b border-outline-variant">
                    <th className="p-3">Officer Name</th>
                    <th className="p-3">Badge ID</th>
                    <th className="p-3">Station / Unit</th>
                    <th className="p-3">Role Level</th>
                    <th className="p-3">Access Status</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/60 font-medium">
                  {officers.map(off => {
                    const st = stations.find(s => s.id === off.station_id);
                    return (
                      <tr key={off.id} className="hover:bg-surface-container-low">
                        <td className="p-3 flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-navy-deep text-white flex items-center justify-center font-bold text-xs">
                            {off.full_name ? off.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'KA'}
                          </div>
                          <span className="font-bold text-navy-deep">{off.full_name}</span>
                        </td>
                        <td className="p-3 font-mono font-bold">{off.badge_id || 'N/A'}</td>
                        <td className="p-3">{st ? `${st.name}` : 'Unassigned'}</td>
                        <td className="p-3 font-bold text-navy-deep uppercase">{off.role}</td>
                        <td className="p-3">
                          {off.access_status === 'active' && (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded font-bold text-[10px]">
                              ACTIVE CLEARANCE
                            </span>
                          )}
                          {off.access_status === 'pending' && (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 rounded font-bold text-[10px]">
                              PENDING APPROVAL
                            </span>
                          )}
                          {off.access_status === 'revoked' && (
                            <span className="px-2 py-0.5 bg-red-100 text-red-900 border border-red-300 rounded font-bold text-[10px]">
                              ACCESS REVOKED
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right space-x-1">
                          {off.access_status === 'pending' && (
                            <button
                              onClick={() => handleApprove(off.id)}
                              className="px-2.5 py-1 bg-emerald-700 text-white rounded font-bold hover:bg-emerald-800 transition-colors inline-flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                            </button>
                          )}
                          {off.access_status === 'active' && (
                            <button
                              onClick={() => handleRevoke(off.id)}
                              className="px-2.5 py-1 bg-surface-container hover:bg-red-50 text-red-700 border border-outline-variant rounded font-semibold transition-colors inline-flex items-center gap-1"
                            >
                              <XCircle className="w-3.5 h-3.5" /> Revoke
                            </button>
                          )}
                          {off.access_status === 'revoked' && (
                            <button
                              onClick={() => handleApprove(off.id)}
                              className="px-2.5 py-1 bg-navy-deep text-white rounded font-bold hover:opacity-90 transition-colors inline-flex items-center gap-1"
                            >
                              Restore
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>

      <AddOfficerModal
        isOpen={isAddOfficerOpen}
        onClose={() => setIsAddOfficerOpen(false)}
        onAdded={reloadData}
        currentUser={session}
      />

      <AddStationModal
        isOpen={isAddStationOpen}
        onClose={() => setIsAddStationOpen(false)}
        onAdded={reloadData}
        currentUser={session}
      />
    </div>
  );
}
