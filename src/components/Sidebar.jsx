import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
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
  const { t } = useLanguage();
  const profile = session?.profile;

  return (
    <aside className="bg-surface-container-lowest flex flex-col h-full w-sidebar-width shrink-0 border-r border-outline-variant">
      {/* Top Action Button */}
      <div className="p-4 space-y-2">
        <button
          onClick={onOpenAddCase}
          className="w-full bg-primary text-on-primary min-h-[44px] py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold hover:bg-primary-container transition-all active:scale-[0.98] shadow-sm"
          aria-label={t('sidebar_add_case')}
        >
          <MessageSquarePlus className="w-5 h-5 text-gold-accent" />
          <span>{t('sidebar_add_case')}</span>
        </button>

        {selectedCaseId && (
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={onOpenAddSuspect}
              className="min-h-[44px] py-2 px-2 bg-surface-container hover:bg-surface-container-high border border-outline-variant rounded-lg text-xs font-bold text-navy-deep transition-colors flex items-center justify-center gap-1"
              aria-label={t('sidebar_add_suspect')}
            >
              <Plus className="w-3.5 h-3.5" /> {t('sidebar_add_suspect')}
            </button>
            <button
              onClick={onOpenAddEvidence}
              className="min-h-[44px] py-2 px-2 bg-surface-container hover:bg-surface-container-high border border-outline-variant rounded-lg text-xs font-bold text-navy-deep transition-colors flex items-center justify-center gap-1"
              aria-label={t('sidebar_add_evidence')}
            >
              <Plus className="w-3.5 h-3.5" /> {t('sidebar_add_evidence')}
            </button>
          </div>
        )}
      </div>

      {/* Nav Content */}
      <nav className="flex-1 overflow-y-auto scrolling-content px-3 space-y-4">
        <div>
          <p className="px-3 py-1.5 text-[11px] font-bold text-outline uppercase tracking-wider">
            {t('sidebar_cases_title')} ({cases.length})
          </p>
          <div className="space-y-1 mt-1">
            {cases.length === 0 ? (
              <div className="p-4 bg-surface-container-low rounded-xl text-center border border-dashed border-outline-variant/60">
                <p className="text-xs text-outline font-medium">{t('sidebar_no_cases')}</p>
                <button
                  onClick={onOpenAddCase}
                  className="mt-2 text-xs font-bold text-primary hover:text-gold-accent underline inline-flex items-center gap-1 min-h-[44px]"
                >
                  {t('sidebar_add_case')}
                </button>
              </div>
            ) : (
              cases.map(c => {
                const caseKey = c.id || c._id;
                return (
                  <div
                    key={caseKey}
                    onClick={() => setSelectedCaseId(caseKey)}
                    className={`rounded-lg p-3 cursor-pointer group transition-all min-h-[44px] ${
                      selectedCaseId === caseKey
                        ? 'bg-surface-container-high text-primary active-gold-indicator shadow-2xs'
                        : 'hover:bg-surface-container-high text-on-surface-variant'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-bold truncate">{c.fir_number}</span>
                      <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase border ${
                        c.priority === 'high'
                          ? 'bg-red-100 text-red-800 border-red-200'
                          : 'bg-slate-200 text-slate-700 border-slate-300'
                      }`}>
                        {c.priority === 'high' ? '⚠️ High' : 'Standard'}
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
              className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all min-h-[44px] ${
                activeScreen === 'network'
                  ? 'bg-primary text-on-primary font-bold'
                  : 'text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              <Share2 className="w-5 h-5 text-gold-accent" />
              <span className="text-xs font-semibold">{t('nav_network')}</span>
            </button>

            {profile?.role === 'admin' && (
              <button
                onClick={() => setActiveScreen('admin')}
                className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all min-h-[44px] ${
                  activeScreen === 'admin'
                    ? 'bg-primary text-on-primary font-bold'
                    : 'text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                <ShieldAlert className="w-5 h-5 text-gold-accent" />
                <span className="text-xs font-semibold">{t('nav_admin')}</span>
              </button>
            )}

            <button
              onClick={() => setActiveScreen('insights')}
              className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all min-h-[44px] ${
                activeScreen === 'insights'
                  ? 'bg-primary text-on-primary font-bold'
                  : 'text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              <BarChart2 className="w-5 h-5 text-gold-accent" />
              <span className="text-xs font-semibold">{t('nav_insights')}</span>
            </button>

            <button
              onClick={() => setActiveScreen('pdf')}
              className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all min-h-[44px] ${
                activeScreen === 'pdf'
                  ? 'bg-primary text-on-primary font-bold'
                  : 'text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              <FolderOpen className="w-5 h-5 text-primary" />
              <span className="text-xs font-semibold">{t('nav_pdf')}</span>
            </button>

            <button
              onClick={() => setActiveScreen('advanced')}
              className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all min-h-[44px] ${
                activeScreen === 'advanced'
                  ? 'bg-primary text-on-primary font-bold'
                  : 'text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              <Cpu className="w-5 h-5 text-gold-accent" />
              <span className="text-xs font-semibold">{t('nav_advanced')}</span>
            </button>

            <button
              onClick={() => setActiveScreen('audit')}
              className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all min-h-[44px] ${
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
