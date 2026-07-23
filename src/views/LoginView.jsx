import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Lock, BadgeCheck, User, Key, Server, Gavel, CheckCircle2, ArrowRight, UserPlus } from 'lucide-react';

export function LoginView({ setActiveScreen }) {
  const { login, signup, loading } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [role, setRole] = useState('investigator');
  const [badgeId, setBadgeId] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [unfoundBadge, setUnfoundBadge] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setUnfoundBadge('');

    try {
      if (mode === 'signup') {
        if (!fullName || !badgeId) {
          setError('Please provide Full Name and Service Badge ID to create account.');
          return;
        }
        const session = await signup({
          email: email || `${badgeId.toLowerCase().replace(/[^a-z0-9]/g, '')}@nyayanetra.gov.in`,
          password,
          full_name: fullName,
          badge_id: badgeId,
          role
        });

        setActiveScreen(session.profile.role === 'admin' ? 'admin' : 'chat');
      } else {
        const session = await login({
          email,
          badge_id: badgeId,
          password
        });
        setActiveScreen(session.profile.role === 'admin' ? 'admin' : 'chat');
      }
    } catch (err) {
      if (err.message?.startsWith('ACCOUNT_NOT_FOUND:')) {
        const missingBadge = err.message.split(':')[1];
        setUnfoundBadge(missingBadge);
        setError(`Officer account not found for Badge ID "${missingBadge}". Click the button below to register this account.`);
      } else {
        setError(err.message || 'Authentication failed. Please check credentials.');
      }
    }
  };

  const handleSwitchToSignup = () => {
    setMode('signup');
    setError('');
    if (unfoundBadge) {
      setBadgeId(unfoundBadge);
    }
  };

  return (
    <div className="min-h-screen bg-surface font-sans text-on-surface flex flex-col justify-between relative overflow-hidden">
      {/* Background Radial Grid */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#00152f 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>

      <div className="p-4 flex flex-wrap justify-between items-center text-xs text-outline font-mono gap-2 z-10">
        <span className="flex items-center gap-1.5 font-semibold text-navy-deep">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span> SECURE GATEWAY
        </span>
      </div>

      {/* Center Container */}
      <main className="flex-1 flex items-center justify-center p-6 z-10">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-[460px] flex flex-col gap-6"
        >
          {/* Brand Header */}
          <div className="flex flex-col items-center gap-3 text-center">
            <img
              alt="NyayaNetra Logo"
              className="h-20 w-auto object-contain transition-transform hover:scale-105"
              src="/assets/logo.svg"
              onError={(e) => { e.target.onerror = null; e.target.src = '/assets/logo.png'; }}
            />
            <div>
              <h1 className="text-3xl font-bold text-primary tracking-tight">NyayaNetra</h1>
              <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-widest mt-0.5">
                Karnataka Judicial Intelligence & Crime Portal
              </p>
            </div>
          </div>

          {/* Card Form */}
          <div className="bg-white border border-outline-variant p-8 rounded-2xl shadow-xl space-y-6">
            <div className="flex border-b border-outline-variant pb-2 gap-1">
              <button
                type="button"
                onClick={() => { setMode('login'); setError(''); setUnfoundBadge(''); }}
                className={`flex-1 py-2 text-xs font-bold text-center rounded-xl transition-all ${
                  mode === 'login' ? 'bg-navy-deep text-on-primary shadow-xs' : 'text-outline hover:text-navy-deep hover:bg-surface-container'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={handleSwitchToSignup}
                className={`flex-1 py-2 text-xs font-bold text-center rounded-xl transition-all flex items-center justify-center gap-1 ${
                  mode === 'signup' ? 'bg-navy-deep text-on-primary shadow-xs' : 'text-primary bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5 text-gold-accent" /> Sign Up / Create Account
              </button>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 text-error text-xs font-semibold rounded-xl space-y-2">
                <p>{error}</p>
                {unfoundBadge && (
                  <button
                    type="button"
                    onClick={handleSwitchToSignup}
                    className="w-full py-2 bg-navy-deep text-on-primary text-xs font-bold rounded-lg hover:opacity-90 transition-all flex items-center justify-center gap-1"
                  >
                    <UserPlus className="w-3.5 h-3.5 text-gold-accent" /> Create Account for "{unfoundBadge}" Now
                  </button>
                )}
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold rounded-xl leading-snug">
                {successMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Role Selection */}
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase mb-1.5">Select Clearance Role</label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="relative cursor-pointer">
                    <input
                      type="radio"
                      name="role"
                      value="investigator"
                      checked={role === 'investigator'}
                      onChange={() => setRole('investigator')}
                      className="sr-only"
                    />
                    <div className={`border rounded-xl p-3 flex flex-col items-center gap-1 transition-all ${
                      role === 'investigator' ? 'border-navy-deep bg-surface-container-low ring-2 ring-navy-deep/20' : 'border-outline-variant'
                    }`}>
                      <ShieldCheck className="w-5 h-5 text-primary" />
                      <span className="text-xs font-bold text-primary">Investigator</span>
                    </div>
                  </label>

                  <label className="relative cursor-pointer">
                    <input
                      type="radio"
                      name="role"
                      value="admin"
                      checked={role === 'admin'}
                      onChange={() => setRole('admin')}
                      className="sr-only"
                    />
                    <div className={`border rounded-xl p-3 flex flex-col items-center gap-1 transition-all ${
                      role === 'admin' ? 'border-navy-deep bg-surface-container-low ring-2 ring-navy-deep/20' : 'border-outline-variant'
                    }`}>
                      <BadgeCheck className="w-5 h-5 text-primary" />
                      <span className="text-xs font-bold text-primary">Chief Officer</span>
                    </div>
                  </label>
                </div>
              </div>

              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase mb-1">Full Name & Rank</label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-outline" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Insp. B. Gowda"
                      required
                      className="w-full pl-10 pr-3.5 py-2.5 bg-surface-container border border-outline-variant rounded-xl text-xs font-semibold text-navy-deep focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase mb-1">Service Badge ID</label>
                <div className="relative">
                  <BadgeCheck className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-outline" />
                  <input
                    type="text"
                    value={badgeId}
                    onChange={(e) => setBadgeId(e.target.value)}
                    placeholder="e.g. KA-04-4892"
                    required
                    className="w-full pl-10 pr-3.5 py-2.5 bg-surface-container border border-outline-variant rounded-xl text-xs font-mono font-semibold text-navy-deep focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-on-surface-variant uppercase">Encrypted Passcode</label>
                  <button
                    type="button"
                    onClick={() => setActiveScreen('reset')}
                    className="text-[11px] font-bold text-secondary hover:underline flex items-center gap-0.5"
                  >
                    <Key className="w-3 h-3" /> Token Reset
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-outline" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-10 pr-3.5 py-2.5 bg-surface-container border border-outline-variant rounded-xl text-xs font-semibold text-navy-deep focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
              </div>



              <button
                type="submit"
                disabled={loading}
                className="w-full bg-navy-deep text-on-primary py-3.5 rounded-xl font-bold text-xs hover:opacity-90 active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <span>{mode === 'signup' ? 'Create Officer Account & Enter' : 'Authenticate & Enter Portal'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          <div className="flex flex-col items-center gap-2 text-center text-xs font-mono">
            <button
              onClick={() => setActiveScreen('status')}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity text-on-surface-variant"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              <span>System Status: Operational</span>
            </button>
          </div>
        </motion.div>
      </main>

      <footer className="p-4 text-center text-xs font-mono text-outline border-t border-outline-variant">
        State Crime Analytics Portal
      </footer>
    </div>
  );
}
