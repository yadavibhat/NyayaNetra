import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../lib/supabase';
import { Navbar } from '../components/Navbar';
import { ArrowLeft } from 'lucide-react';

export function AuditLogView({ setActiveScreen }) {
  const { session } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const loadedLogs = await dbService.getAuditLogs(session);
        setLogs(loadedLogs);
      } catch (err) {
        console.error('Failed to load audit logs:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, [session]);

  return (
    <div className="min-h-screen bg-surface font-sans text-on-surface flex flex-col justify-between">
      <Navbar activeScreen="audit" setActiveScreen={setActiveScreen} />

      <main className="flex-1 max-w-[900px] w-full mx-auto p-6 space-y-6">
        <div className="bg-white border-2 border-navy-deep p-8 rounded-2xl shadow-xl space-y-6">
          <div className="flex justify-between items-start border-b pb-4 border-outline-variant">
            <div>
              <h1 className="text-xl font-bold text-navy-deep mt-1">Portal Activity Log</h1>
              <p className="text-xs text-on-surface-variant font-mono">
                Showing {logs.length} audit entry(s) logged by the portal.
              </p>
            </div>
            <button
              onClick={() => setActiveScreen('chat')}
              className="px-3.5 py-2 bg-navy-deep text-on-primary text-xs font-bold rounded-xl hover:opacity-90 transition-all flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" /> Return to Portal
            </button>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-outline italic">Loading logs...</div>
          ) : logs.length === 0 ? (
            <div className="p-8 bg-surface-container-low rounded-xl text-center border border-dashed border-outline-variant">
              <p className="text-xs text-outline font-medium">No audit logs recorded yet in database.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse border border-outline-variant">
                <thead>
                  <tr className="bg-navy-deep text-on-primary font-bold">
                    <th className="p-2.5 border border-outline-variant">Timestamp</th>
                    <th className="p-2.5 border border-outline-variant">Action</th>
                    <th className="p-2.5 border border-outline-variant">Target Table</th>
                    <th className="p-2.5 border border-outline-variant">Target ID</th>
                    <th className="p-2.5 border border-outline-variant">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant font-mono">
                  {logs.map(log => (
                    <tr key={log.id || log._id} className="hover:bg-surface-container-low">
                      <td className="p-2.5 border border-outline-variant text-outline">
                        {new Date(log.createdAt || log.created_at || Date.now()).toLocaleString()}
                      </td>
                      <td className="p-2.5 border border-outline-variant font-bold text-navy-deep">{log.action}</td>
                      <td className="p-2.5 border border-outline-variant text-amber-800">{log.target_table}</td>
                      <td className="p-2.5 border border-outline-variant">{log.target_id || 'N/A'}</td>
                      <td className="p-2.5 border border-outline-variant text-[11px] text-slate-700">
                        {JSON.stringify(log.details || {})}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      <footer className="p-4 text-center text-xs font-mono text-outline border-t border-outline-variant">
        State Police Digital Evidence Division
      </footer>
    </div>
  );
}
