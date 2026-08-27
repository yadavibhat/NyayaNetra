import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { ShieldCheck, MessageSquare, Share2, ShieldAlert, FileText, LogOut, CheckCircle2, BarChart2, Cpu, Globe } from 'lucide-react';

export function Navbar({ activeScreen, setActiveScreen }) {
  const { session, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const profile = session?.profile;

  return (
    <header className="bg-primary flex justify-between items-center h-16 px-6 w-full top-0 z-50 border-b border-primary-container shadow-sm shrink-0 text-on-primary">
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
          <span className="text-xl font-bold tracking-tight text-on-primary">NyayaNetra</span>
        </button>
      </div>

      <div className="flex items-center gap-3">
        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 mr-2">
          <button
            onClick={() => setActiveScreen('chat')}
            className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 min-h-[44px] ${
              activeScreen === 'chat'
                ? 'text-gold-accent bg-primary-container border border-gold-accent/30'
                : 'text-slate-300 hover:text-white hover:bg-primary-container/60'
            }`}
          >
            <MessageSquare className="w-4 h-4" /> {t('nav_chat')}
          </button>

          <button
            onClick={() => setActiveScreen('network')}
            className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 min-h-[44px] ${
              activeScreen === 'network'
                ? 'text-gold-accent bg-primary-container border border-gold-accent/30'
                : 'text-slate-300 hover:text-white hover:bg-primary-container/60'
            }`}
          >
            <Share2 className="w-4 h-4" /> {t('nav_network')}
          </button>

          {profile?.role === 'admin' && (
            <button
              onClick={() => setActiveScreen('admin')}
              className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 min-h-[44px] ${
                activeScreen === 'admin'
                  ? 'text-gold-accent bg-primary-container border border-gold-accent/30'
                  : 'text-slate-300 hover:text-white hover:bg-primary-container/60'
              }`}
            >
              <ShieldAlert className="w-4 h-4" /> {t('nav_admin')}
            </button>
          )}

          <button
            onClick={() => setActiveScreen('pdf')}
            className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 min-h-[44px] ${
              activeScreen === 'pdf'
                ? 'text-gold-accent bg-primary-container border border-gold-accent/30'
                : 'text-slate-300 hover:text-white hover:bg-primary-container/60'
            }`}
          >
            <FileText className="w-4 h-4" /> {t('nav_pdf')}
          </button>

          <button
            onClick={() => setActiveScreen('insights')}
            className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 min-h-[44px] ${
              activeScreen === 'insights'
                ? 'text-gold-accent bg-primary-container border border-gold-accent/30'
                : 'text-slate-300 hover:text-white hover:bg-primary-container/60'
            }`}
          >
            <BarChart2 className="w-4 h-4" /> {t('nav_insights')}
          </button>

          <button
            onClick={() => setActiveScreen('advanced')}
            className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 min-h-[44px] ${
              activeScreen === 'advanced'
                ? 'text-gold-accent bg-primary-container border border-gold-accent/30'
                : 'text-slate-300 hover:text-white hover:bg-primary-container/60'
            }`}
          >
            <Cpu className="w-4 h-4 text-gold-accent" /> {t('nav_advanced')}
          </button>
        </nav>

        {/* Global UI Language Toggle */}
        <div className="flex items-center bg-primary-container/80 p-1 rounded-xl border border-outline-variant/30">
          <button
            onClick={() => setLanguage('en')}
            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all min-h-[36px] ${
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
            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all min-h-[36px] ${
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
        <div className="flex items-center gap-2 text-on-primary pl-2 border-l border-on-primary/20">
          <button
            onClick={() => setActiveScreen('audit')}
            className="hover:bg-primary-container transition-colors p-2.5 rounded-lg text-slate-300 hover:text-amber-300 min-h-[44px] min-w-[44px] flex items-center justify-center"
            title="Audit Log"
            aria-label="Open Audit Log"
          >
            <CheckCircle2 className="w-5 h-5" />
          </button>

          {profile && (
            <div className="flex items-center gap-2 pl-1">
              <div className="w-8 h-8 rounded-full bg-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center">
                {profile.full_name ? profile.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'KA'}
              </div>
              <div className="hidden lg:flex flex-col text-left">
                <span className="text-xs font-semibold leading-tight">{profile.full_name || 'Officer'}</span>
                <span className="text-[10px] text-slate-400 font-mono">{profile.badge_id || 'ID: UNSET'}</span>
              </div>
            </div>
          )}

          <button
            onClick={logout}
            className="hover:bg-primary-container transition-colors p-2.5 rounded-lg text-slate-300 hover:text-red-400 min-h-[44px] min-w-[44px] flex items-center justify-center"
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
