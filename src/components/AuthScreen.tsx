import React, { useState } from 'react';
import { Loader2, Lock, UserRound, Sparkles } from 'lucide-react';

type AuthMode = 'login' | 'signup';

interface AuthScreenProps {
  onSignIn: (email: string, password: string) => Promise<void>;
  onSignUp: (displayName: string, email: string, password: string) => Promise<void>;
  onGuest: () => void;
}

export default function AuthScreen({ onSignIn, onSignUp, onGuest }: AuthScreenProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setLoading(true);
    setError(null);
    try {
      if (mode === 'signup') {
        await onSignUp(displayName, email, password);
      } else {
        await onSignIn(email, password);
      }
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-12rem)] grid lg:grid-cols-[1.1fr_0.9fr] gap-8 items-stretch animate-in fade-in slide-in-from-bottom-8 duration-700">
      <section className="rounded-[2.5rem] bg-theme-surface-container-low ambient-shadow p-10 lg:p-16 flex flex-col justify-between overflow-hidden relative group">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_left,_rgba(83,66,214,0.08),_transparent_50%)] pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-64 h-64 brand-gradient opacity-[0.03] rounded-full blur-[80px] pointer-events-none" />
        
        <div className="space-y-8 max-w-xl relative z-10">
          <div className="inline-flex items-center gap-2.5 rounded-full bg-theme-surface-container-lowest px-4 py-1.5 text-[10px] font-bold tracking-[0.2em] uppercase text-theme-primary shadow-sm border border-theme-border/10">
            <Sparkles size={14} className="animate-pulse" />
            Durable Skills Framework
          </div>
          <div className="space-y-6">
            <h1 className="display-md text-theme-text-main">
              Master the future of work <br />
              <span className="text-transparent bg-clip-text brand-gradient">with evidence-based insights.</span>
            </h1>
            <p className="text-lg text-theme-text-muted max-w-lg leading-relaxed">
              Your account synchronizes your assessment trajectory across devices, providing a unified view of your skill evolution and AI-generated development plans.
            </p>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-6 mt-16 relative z-10">
          <div className="rounded-[1.5rem] bg-theme-surface-container-lowest p-6 shadow-sm border border-theme-border/5 group-hover:translate-y-[-4px] transition-transform duration-300">
            <div className="w-8 h-8 rounded-lg bg-theme-primary/5 flex items-center justify-center mb-4 text-theme-primary">
              <Sparkles size={18} />
            </div>
            <div className="font-bold text-theme-text-main text-sm mb-1">Evidence Trajectory</div>
            <div className="text-theme-text-muted text-[13px] leading-relaxed">Longitudinal tracking of skill progression over multiple sessions.</div>
          </div>
          <div className="rounded-[1.5rem] bg-theme-surface-container-lowest p-6 shadow-sm border border-theme-border/5 group-hover:translate-y-[-4px] transition-transform duration-300 delay-75">
            <div className="w-8 h-8 rounded-lg bg-theme-secondary/5 flex items-center justify-center mb-4 text-theme-secondary">
              <Lock size={18} />
            </div>
            <div className="font-bold text-theme-text-main text-sm mb-1">Encrypted Identity</div>
            <div className="text-theme-text-muted text-[13px] leading-relaxed">Secure, enterprise-grade authentication for your assessment data.</div>
          </div>
          <div className="rounded-[1.5rem] bg-theme-surface-container-lowest p-6 shadow-sm border border-theme-border/5 group-hover:translate-y-[-4px] transition-transform duration-300 delay-150">
            <div className="w-8 h-8 rounded-lg bg-theme-accent-soft/5 flex items-center justify-center mb-4 text-theme-accent">
              <UserRound size={18} />
            </div>
            <div className="font-bold text-theme-text-main text-sm mb-1">Guest Exploration</div>
            <div className="text-theme-text-muted text-[13px] leading-relaxed">Experience our adaptive simulations before creating an account.</div>
          </div>
        </div>
      </section>

      <section className="flex flex-col justify-center">
        <div className="bg-theme-surface-container-lowest rounded-[2.5rem] p-8 lg:p-12 float-shadow border border-theme-border/5">
          <div className="max-w-md mx-auto w-full">
            <div className="bg-theme-surface-container-low rounded-2xl p-1.5 flex items-center gap-1 mb-10">
              <button
                onClick={() => setMode('login')}
                className={`flex-1 rounded-xl px-4 py-3 text-sm font-bold transition-all ${
                  mode === 'login' ? 'bg-theme-surface-container-lowest text-theme-text-main shadow-md' : 'text-theme-text-muted hover:text-theme-text-main'
                }`}
              >
                Sign in
              </button>
              <button
                onClick={() => setMode('signup')}
                className={`flex-1 rounded-xl px-4 py-3 text-sm font-bold transition-all ${
                  mode === 'signup' ? 'bg-theme-surface-container-lowest text-theme-text-main shadow-md' : 'text-theme-text-muted hover:text-theme-text-main'
                }`}
              >
                Join Now
              </button>
            </div>

            <div className="space-y-6">
              {mode === 'signup' && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="label-sm mb-2.5 block ml-1">Full Name</label>
                  <div className="flex items-center gap-3 rounded-[1.25rem] bg-theme-surface-container-low px-4 py-3.5 focus-within:ring-2 focus-within:ring-theme-accent/20 transition-all border border-transparent">
                    <UserRound size={18} className="text-theme-text-muted" />
                    <input
                      value={displayName}
                      onChange={(event) => setDisplayName(event.target.value)}
                      placeholder="e.g. Spandan"
                      className="w-full bg-transparent outline-none text-theme-text-main font-medium placeholder:text-theme-text-muted/60"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="label-sm mb-2.5 block ml-1">Email Address</label>
                <div className="flex items-center gap-3 rounded-[1.25rem] bg-theme-surface-container-low px-4 py-3.5 focus-within:ring-2 focus-within:ring-theme-accent/20 transition-all border border-transparent">
                  <UserRound size={18} className="text-theme-text-muted" />
                  <input
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@work.com"
                    type="email"
                    className="w-full bg-transparent outline-none text-theme-text-main font-medium placeholder:text-theme-text-muted/60"
                  />
                </div>
              </div>

              <div>
                <label className="label-sm mb-2.5 block ml-1">Security Key</label>
                <div className="flex items-center gap-3 rounded-[1.25rem] bg-theme-surface-container-low px-4 py-3.5 focus-within:ring-2 focus-within:ring-theme-accent/20 transition-all border border-transparent">
                  <Lock size={18} className="text-theme-text-muted" />
                  <input
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="••••••••"
                    type="password"
                    className="w-full bg-transparent outline-none text-theme-text-main font-medium placeholder:text-theme-text-muted/60"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="mt-8 rounded-xl bg-red-50/50 px-4 py-3 text-sm text-red-600 border border-red-100/50 animate-in fade-in zoom-in-95">
                {error}
              </div>
            )}

            <div className="mt-10 space-y-4">
              <button
                onClick={submit}
                disabled={loading}
                className="w-full rounded-[1.25rem] brand-gradient px-4 py-4 font-bold text-white shadow-[0_12px_30px_rgba(83,66,214,0.3)] transition-all hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 size={18} className="animate-spin" />
                    Processing...
                  </span>
                ) : mode === 'signup' ? (
                  'Create My Account'
                ) : (
                  'Authenticate Access'
                )}
              </button>
              <button
                onClick={onGuest}
                className="w-full rounded-[1.25rem] bg-theme-surface-container-low px-4 py-4 font-bold text-theme-text-main transition-all hover:bg-theme-surface-container-high active:scale-95"
              >
                Continue as Guest
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
  );
}
