import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { LogOut, CheckCircle2 } from 'lucide-react';

export function Navbar({ activeScreen, setActiveScreen }) {
  const { session, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const profile = session?.profile;

  return (
    <header className="bg-navy-deep flex justify-between items-center h-16 px-6 w-full top-0 z-50 border-b border-gold-accent/20 shadow-md shrink-0 text-white">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setActiveScreen('chat')}
          className="flex items-center gap-3 group text-left min-h-[44px] min-w-[44px]"
          aria-label="NyayaNetra Home"
        >
          <img
            alt="NyayaNetra Logo"
            className="h-9 w-auto object-contain transition-transform group-hover:scale-105"
            src="./assets/logo.svg"
            onError={(e) => { e.target.onerror = null; e.target.src = './assets/logo.png'; }}
          />
          <span className="text-xl font-bold tracking-tight text-white">
            NyayaNetra
          </span>
        </button>
      </div>

      {/* Guided Investigation Workflow Stepper Bar */}
      <nav aria-label="Investigation Workflow Stepper" className="hidden xl:flex items-center gap-1.5 bg-slate-900/80 p-1.5 rounded-2xl border border-gold-accent/20 shadow-inner">
        <button
          onClick={() => setActiveScreen('cases')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            activeScreen === 'cases'
              ? 'bg-gold-accent text-navy-deep shadow-md font-extrabold scale-[1.02]'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-mono font-bold ${
            activeScreen === 'cases' ? 'bg-navy-deep text-gold-accent' : 'bg-slate-800 text-gold-accent'
          }`}>1</span>
          <span>FIR Scope</span>
        </button>

        <span className="text-slate-600 text-xs font-bold">➔</span>

        <button
          onClick={() => setActiveScreen('chat')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            activeScreen === 'chat'
              ? 'bg-gold-accent text-navy-deep shadow-md font-extrabold scale-[1.02]'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-mono font-bold ${
            activeScreen === 'chat' ? 'bg-navy-deep text-gold-accent' : 'bg-slate-800 text-gold-accent'
          }`}>2</span>
          <span>AI Copilot</span>
        </button>

        <span className="text-slate-600 text-xs font-bold">➔</span>

        <button
          onClick={() => setActiveScreen('network')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            activeScreen === 'network'
              ? 'bg-gold-accent text-navy-deep shadow-md font-extrabold scale-[1.02]'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-mono font-bold ${
            activeScreen === 'network' ? 'bg-navy-deep text-gold-accent' : 'bg-slate-800 text-gold-accent'
          }`}>3</span>
          <span>Network Graph</span>
        </button>

        <span className="text-slate-600 text-xs font-bold">➔</span>

        <button
          onClick={() => setActiveScreen('pdf')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
            activeScreen === 'pdf'
              ? 'bg-gold-accent text-navy-deep shadow-md font-extrabold scale-[1.02]'
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-mono font-bold ${
            activeScreen === 'pdf' ? 'bg-navy-deep text-gold-accent' : 'bg-slate-800 text-gold-accent'
          }`}>4</span>
          <span>BSA Court Dossier</span>
        </button>
      </nav>

      <div className="flex items-center gap-3 font-semibold text-xs text-white">

        {/* Global UI Language Toggle */}
        <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-gold-accent/20">
          <button
            onClick={() => setLanguage('en')}
            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all min-h-[32px] ${
              language === 'en'
                ? 'bg-gold-accent text-navy-deep shadow-xs'
                : 'text-slate-300 hover:text-white'
            }`}
            aria-label="Switch to English"
          >
            EN
          </button>
          <button
            onClick={() => setLanguage('kn')}
            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all min-h-[32px] ${
              language === 'kn'
                ? 'bg-gold-accent text-navy-deep shadow-xs'
                : 'text-slate-300 hover:text-white'
            }`}
            aria-label="Switch to Kannada (ಕನ್ನಡ)"
          >
            ಕನ್ನಡ
          </button>
        </div>

        {/* Profile & Actions */}
        <div className="flex items-center gap-2 text-white pl-2 border-l border-slate-700">
          <button
            onClick={() => setActiveScreen('audit')}
            className="hover:bg-slate-800 transition-colors p-2 rounded-lg text-slate-300 hover:text-amber-300 min-h-[40px] min-w-[40px] flex items-center justify-center"
            title="Audit Log"
            aria-label="Open Audit Log"
          >
            <CheckCircle2 className="w-5 h-5 text-gold-accent" />
          </button>

          {profile && (
            <div className="flex items-center gap-2 pl-1">
              <div className="w-8 h-8 rounded-full bg-gold-accent text-navy-deep font-black text-xs flex items-center justify-center shadow-xs">
                {profile.full_name ? profile.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'KA'}
              </div>
              <div className="hidden lg:flex flex-col text-left">
                <span className="text-xs font-bold leading-tight text-white">{profile.full_name || 'Officer'}</span>
                <span className="text-[10px] text-amber-300/80 font-mono">{profile.badge_id || 'ID: UNSET'}</span>
              </div>
            </div>
          )}

          <button
            onClick={logout}
            className="hover:bg-slate-800 transition-colors p-2 rounded-lg text-slate-300 hover:text-red-400 min-h-[40px] min-w-[40px] flex items-center justify-center"
            title="Sign Out"
            aria-label="Sign Out of Session"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
