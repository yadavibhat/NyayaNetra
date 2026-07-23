import React, { useState } from 'react';
import { Navbar } from '../components/Navbar';
import { Key, Send, CheckCircle2, ArrowLeft } from 'lucide-react';

export function ResetTokenView({ setActiveScreen }) {
  const [badgeId, setBadgeId] = useState('KA-04-4892');
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-surface font-sans text-on-surface flex flex-col justify-between">
      <Navbar activeScreen="reset" setActiveScreen={setActiveScreen} />

      <main className="flex-1 flex items-center justify-center p-6 my-auto">
        <div className="w-full max-w-[480px] bg-white border border-outline-variant rounded-2xl shadow-xl p-8 space-y-6">
          <button
            type="button"
            onClick={() => setActiveScreen('login')}
            className="flex items-center gap-1.5 text-xs text-navy-deep font-bold hover:underline self-start"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Sign In
          </button>

          <div className="flex flex-col items-center text-center gap-2">
            <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-700">
              <Key className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-bold text-navy-deep">Security Access Token Reset</h1>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Request a passcode reset token via Supabase Auth & CCTNS SMS Gateway.
            </p>
          </div>

          {!sent ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase mb-1">Service Badge ID</label>
                <input
                  type="text"
                  value={badgeId}
                  onChange={(e) => setBadgeId(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-surface-container border border-outline-variant rounded-xl text-xs font-mono font-semibold text-navy-deep focus:ring-2 focus:ring-primary/20 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase mb-1">Registered Officer Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="officer@nyayanetra.gov.in"
                  required
                  className="w-full px-3.5 py-2.5 bg-surface-container border border-outline-variant rounded-xl text-xs font-semibold text-navy-deep focus:ring-2 focus:ring-primary/20 outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-navy-deep text-on-primary py-3.5 rounded-xl font-bold text-xs hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <Send className="w-4 h-4 text-gold-accent" /> Send Reset Instructions
              </button>
            </form>
          ) : (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-950 text-xs font-semibold text-center space-y-3">
              <CheckCircle2 className="w-8 h-8 text-emerald-700 mx-auto" />
              <p>Reset token instructions sent to {email || 'your registered email address'}.</p>
              <button
                onClick={() => setActiveScreen('login')}
                className="px-4 py-2 bg-emerald-700 text-white rounded-xl hover:bg-emerald-800 transition-colors inline-block"
              >
                Return & Login
              </button>
            </div>
          )}
        </div>
      </main>

      <footer className="p-4 text-center text-xs font-mono text-outline border-t border-outline-variant">
        NyayaNetra Security Gateway &mdash; Karnataka State Police
      </footer>
    </div>
  );
}
