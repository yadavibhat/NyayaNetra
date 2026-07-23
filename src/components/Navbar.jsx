import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, MessageSquare, Share2, ShieldAlert, FileText, LogOut, CheckCircle2, BarChart2 } from 'lucide-react';

export function Navbar({ activeScreen, setActiveScreen }) {
  const { session, logout } = useAuth();
  const profile = session?.profile;

  return (
    <header className="bg-primary flex justify-between items-center h-16 px-6 w-full top-0 z-50 border-b border-primary-container shadow-sm shrink-0 text-on-primary">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setActiveScreen('chat')}
          className="flex items-center gap-3 group text-left"
        >
          <img
            alt="NyayaNetra Logo"
            className="h-9 w-auto object-contain transition-transform group-hover:scale-105"
            src="/assets/logo.svg"
            onError={(e) => { e.target.onerror = null; e.target.src = '/assets/logo.png'; }}
          />
          <span className="text-xl font-bold tracking-tight text-on-primary">NyayaNetra</span>
        </button>
      </div>

      <div className="flex items-center gap-4">
        {/* Navigation Links mapped 1:1 to Stitch pages */}
        <nav className="hidden md:flex items-center gap-1 mr-4">
          <button
            onClick={() => setActiveScreen('chat')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 ${
              activeScreen === 'chat'
                ? 'text-gold-accent bg-primary-container border border-gold-accent/30'
                : 'text-slate-300 hover:text-white hover:bg-primary-container/60'
            }`}
          >
            <MessageSquare className="w-4 h-4" /> Intelligence Chat
          </button>

          <button
            onClick={() => setActiveScreen('network')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 ${
              activeScreen === 'network'
                ? 'text-gold-accent bg-primary-container border border-gold-accent/30'
                : 'text-slate-300 hover:text-white hover:bg-primary-container/60'
            }`}
          >
            <Share2 className="w-4 h-4" /> Network Map
          </button>

          {profile?.role === 'admin' && (
            <button
              onClick={() => setActiveScreen('admin')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 ${
                activeScreen === 'admin'
                  ? 'text-gold-accent bg-primary-container border border-gold-accent/30'
                  : 'text-slate-300 hover:text-white hover:bg-primary-container/60'
              }`}
            >
              <ShieldAlert className="w-4 h-4" /> SCRB Console
            </button>
          )}

          <button
            onClick={() => setActiveScreen('pdf')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 ${
              activeScreen === 'pdf'
                ? 'text-gold-accent bg-primary-container border border-gold-accent/30'
                : 'text-slate-300 hover:text-white hover:bg-primary-container/60'
            }`}
          >
            <FileText className="w-4 h-4" /> PDF Report
          </button>

          <button
            onClick={() => setActiveScreen('insights')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 ${
              activeScreen === 'insights'
                ? 'text-gold-accent bg-primary-container border border-gold-accent/30'
                : 'text-slate-300 hover:text-white hover:bg-primary-container/60'
            }`}
          >
            <BarChart2 className="w-4 h-4" /> Data Insights
          </button>
        </nav>



        {/* Profile & Actions */}
        <div className="flex items-center gap-3 text-on-primary pl-2 border-l border-on-primary/20">
          <button
            onClick={() => setActiveScreen('audit')}
            className="hover:bg-primary-container transition-colors p-2 rounded-lg text-slate-300 hover:text-amber-300"
            title="Audit Log"
          >
            <CheckCircle2 className="w-5 h-5" />
          </button>

          {profile && (
            <div className="flex items-center gap-2 pl-2">
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
            className="hover:bg-primary-container transition-colors p-2 rounded-lg text-slate-300 hover:text-red-400"
            title="Sign Out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
