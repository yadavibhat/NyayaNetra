import React from 'react';
import { useAuth } from '../context/AuthContext';
import { MessageSquarePlus, Share2, ShieldAlert, FolderOpen, ShieldCheck, LogOut, Activity, Plus, BarChart2, Cpu } from 'lucide-react';

export function Sidebar({
  activeScreen,
  setActiveScreen,
  cases = [],
  selectedCaseId,
  setSelectedCaseId,
  onOpenAddCase,
  onOpenAddSuspect,
  onOpenAddEvidence
}) {
  const { session, logout } = useAuth();
  const profile = session?.profile;

  return (
    <aside className="bg-surface-container-lowest flex flex-col h-full w-sidebar-width shrink-0 border-r border-outline-variant">
      {/* Top Action Button */}
      <div className="p-4 space-y-2">
        <button
          onClick={onOpenAddCase}
          className="w-full bg-primary text-on-primary py-3 rounded-lg flex items-center justify-center gap-2 text-sm font-semibold hover:bg-primary-container transition-all active:scale-[0.98] shadow-sm"
        >
          <MessageSquarePlus className="w-5 h-5 text-gold-accent" />
          <span>New Case File (FIR)</span>
        </button>

        {selectedCaseId && (
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={onOpenAddSuspect}
              className="py-2 px-2 bg-surface-container hover:bg-surface-container-high border border-outline-variant rounded-lg text-xs font-bold text-navy-deep transition-colors flex items-center justify-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Suspect
            </button>
            <button
              onClick={onOpenAddEvidence}
              className="py-2 px-2 bg-surface-container hover:bg-surface-container-high border border-outline-variant rounded-lg text-xs font-bold text-navy-deep transition-colors flex items-center justify-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Evidence
            </button>
          </div>
        )}
      </div>

      {/* Nav Content */}
      <nav className="flex-1 overflow-y-auto scrolling-content px-3 space-y-4">
        <div>
          <p className="px-3 py-1.5 text-[11px] font-bold text-outline uppercase tracking-wider">
            Active Cases ({cases.length})
          </p>
          <div className="space-y-1 mt-1">
            {cases.length === 0 ? (
              <div className="p-4 bg-surface-container-low rounded-xl text-center border border-dashed border-outline-variant/60">
                <p className="text-xs text-outline font-medium">No cases added yet.</p>
                <button
                  onClick={onOpenAddCase}
                  className="mt-2 text-xs font-bold text-primary hover:text-gold-accent underline inline-flex items-center gap-1"
                >
                  + Create New Case
                </button>
              </div>
            ) : (
              cases.map(c => {
                const caseKey = c.id || c._id;
                return (
                  <div
                    key={caseKey}
                    onClick={() => setSelectedCaseId(caseKey)}
                    className={`rounded-lg p-3 cursor-pointer group transition-all ${
                      selectedCaseId === caseKey
                        ? 'bg-surface-container-high text-primary active-gold-indicator shadow-2xs'
                        : 'hover:bg-surface-container-high text-on-surface-variant'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-bold truncate">{c.fir_number}</span>
                      <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${
                        c.priority === 'high' ? 'bg-red-100 text-red-800' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {c.priority}
                      </span>
                    </div>
                    <span className="text-xs text-on-surface-variant block truncate mt-0.5">{c.title}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div>
          <p className="px-3 py-1.5 text-[11px] font-bold text-outline uppercase tracking-wider">
            Navigation
          </p>
          <div className="space-y-1 mt-1">
            <button
              onClick={() => setActiveScreen('network')}
              className={`w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-all ${
                activeScreen === 'network'
                  ? 'bg-primary text-on-primary font-bold'
                  : 'text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              <Share2 className="w-5 h-5 text-gold-accent" />
              <span className="text-xs font-semibold">Associate Connection Map</span>
            </button>

            {profile?.role === 'admin' && (
              <button
                onClick={() => setActiveScreen('admin')}
                className={`w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-all ${
                  activeScreen === 'admin'
                    ? 'bg-primary text-on-primary font-bold'
                    : 'text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                <ShieldAlert className="w-5 h-5 text-gold-accent" />
                <span className="text-xs font-semibold">Admin Console</span>
              </button>
            )}

            <button
              onClick={() => setActiveScreen('insights')}
              className={`w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-all ${
                activeScreen === 'insights'
                  ? 'bg-primary text-on-primary font-bold'
                  : 'text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              <BarChart2 className="w-5 h-5 text-gold-accent" />
              <span className="text-xs font-semibold">Data Insights</span>
            </button>

            <button
              onClick={() => setActiveScreen('pdf')}
              className={`w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-all ${
                activeScreen === 'pdf'
                  ? 'bg-primary text-on-primary font-bold'
                  : 'text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              <FolderOpen className="w-5 h-5 text-primary" />
              <span className="text-xs font-semibold">Reports & Print</span>
            </button>

            <button
              onClick={() => setActiveScreen('advanced')}
              className={`w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-all ${
                activeScreen === 'advanced'
                  ? 'bg-primary text-on-primary font-bold'
                  : 'text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              <Cpu className="w-5 h-5 text-gold-accent" />
              <span className="text-xs font-semibold">Intelligence Core</span>
            </button>

            <button
              onClick={() => setActiveScreen('audit')}
              className={`w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-all ${
                activeScreen === 'audit'
                  ? 'bg-primary text-on-primary font-bold'
                  : 'text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              <ShieldCheck className="w-5 h-5 text-primary" />
              <span className="text-xs font-semibold">Activity Log</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Footer Profile Card */}
      <div className="p-4 mt-auto border-t border-outline-variant bg-surface-container-low/50">
        <div className="flex items-center gap-3 p-2.5 bg-surface-container-lowest border border-outline-variant/60 rounded-xl mb-3">
          <div className="w-9 h-9 rounded-full bg-navy-deep flex items-center justify-center text-on-primary font-bold text-xs shrink-0">
            {profile?.full_name ? profile.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'KA'}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-bold truncate text-primary">{profile?.full_name || 'Authorized Officer'}</p>
            <span className="inline-block bg-primary-fixed text-primary text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold">
              {profile?.badge_id || 'ID: UNSET'}
            </span>
          </div>
        </div>
        <div className="flex justify-between items-center px-1 text-on-surface-variant">
          <button
            onClick={() => setActiveScreen('status')}
            className="hover:text-primary transition-colors flex items-center gap-1 text-xs font-medium"
            title="Telemetry Status"
          >
            <Activity className="w-4 h-4" /> Telemetry
          </button>
          <button
            onClick={logout}
            className="hover:text-error transition-colors flex items-center gap-1 text-xs font-medium"
            title="Logout"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </div>
    </aside>
  );
}
