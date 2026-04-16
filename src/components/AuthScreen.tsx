import React, { useState } from 'react';
import { Loader2, Lock, UserRound, Sparkles } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { cn } from '../lib/utils';

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
    <div className="min-h-[calc(100vh-4rem)] grid lg:grid-cols-[1.2fr_0.8fr] gap-6 items-stretch">
      <section className="rounded-3xl bg-[radial-gradient(circle_at_top_left,_rgba(43,108,176,0.18),_transparent_40%),linear-gradient(145deg,_#ffffff,_#eef4fb)] border border-theme-border shadow-sm p-8 lg:p-12 flex flex-col justify-between overflow-hidden">
        <div className="space-y-6 max-w-xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-theme-border bg-white/70 px-3 py-1 text-xs font-semibold tracking-widest uppercase text-theme-text-muted">
            <Sparkles size={14} className="text-theme-accent" />
            Durable skills assessment
          </div>
          <p className="text-sm text-theme-text-muted leading-relaxed max-w-xl">
            Most assessments measure what is easy to score. Durable skills are harder—they show up in conversation and judgment calls, not tidy tests. This app puts you in simulated tasks with AI teammates and scores you on rubrics so capability is easier to see and improve.
          </p>
          <div className="space-y-4">
            <h1 className="text-4xl lg:text-5xl font-black tracking-tight text-theme-primary">
              Sign in to keep your sessions, scores, and progression in one place.
            </h1>
            <p className="text-lg text-theme-text-muted max-w-lg">
              Your account stores assessment history server-side, so you can revisit prior sessions, compare trends, and
              continue where you left off across devices.
            </p>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-3 mt-10 text-sm">
          <div className="rounded-2xl border border-theme-border bg-white/80 p-4">
            <div className="font-semibold text-theme-text-main">Account-backed history</div>
            <div className="text-theme-text-muted mt-1">Sessions stay attached to your profile instead of local storage.</div>
          </div>
          <div className="rounded-2xl border border-theme-border bg-white/80 p-4">
            <div className="font-semibold text-theme-text-main">Private by default</div>
            <div className="text-theme-text-muted mt-1">Auth uses signed HTTP-only cookies for browser sessions.</div>
          </div>
          <div className="rounded-2xl border border-theme-border bg-white/80 p-4">
            <div className="font-semibold text-theme-text-main">Guest mode available</div>
            <div className="text-theme-text-muted mt-1">You can still try a scenario before creating an account.</div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl bg-theme-surface border border-theme-border shadow-sm p-6 lg:p-8 flex flex-col justify-center">
        <div className="max-w-md mx-auto w-full">
          <div className="flex items-center gap-2 mb-6">
            <Button
              onClick={() => setMode('login')}
              variant="ghost"
              className={cn(
                'flex-1 rounded-xl px-4 py-3 text-sm font-semibold h-auto',
                mode === 'login' ? 'bg-theme-accent text-white hover:bg-theme-accent' : 'bg-theme-bg text-theme-text-muted'
              )}
            >
              Sign in
            </Button>
            <Button
              onClick={() => setMode('signup')}
              variant="ghost"
              className={cn(
                'flex-1 rounded-xl px-4 py-3 text-sm font-semibold h-auto',
                mode === 'signup' ? 'bg-theme-accent text-white hover:bg-theme-accent' : 'bg-theme-bg text-theme-text-muted'
              )}
            >
              Create account
            </Button>
          </div>

          <div className="space-y-4">
            {mode === 'signup' && (
              <label className="block">
                <span className="text-sm font-medium text-theme-text-main">Display name</span>
                <div className="mt-2 flex items-center gap-2 rounded-xl border border-theme-border bg-theme-bg px-3 py-2">
                  <UserRound size={18} className="text-theme-text-muted" />
                  <Input
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                    placeholder="Spandan"
                    className="h-auto border-0 bg-transparent px-0 py-0 focus-visible:ring-0"
                  />
                </div>
              </label>
            )}

            <label className="block">
              <span className="text-sm font-medium text-theme-text-main">Email</span>
              <div className="mt-2 flex items-center gap-2 rounded-xl border border-theme-border bg-theme-bg px-3 py-2">
                <UserRound size={18} className="text-theme-text-muted" />
                <Input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  type="email"
                  className="h-auto border-0 bg-transparent px-0 py-0 focus-visible:ring-0"
                />
              </div>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-theme-text-main">Password</span>
              <div className="mt-2 flex items-center gap-2 rounded-xl border border-theme-border bg-theme-bg px-3 py-2">
                <Lock size={18} className="text-theme-text-muted" />
                <Input
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="At least 8 characters"
                  type="password"
                  className="h-auto border-0 bg-transparent px-0 py-0 focus-visible:ring-0"
                />
              </div>
            </label>
          </div>

          {error && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="mt-6 space-y-3">
            <Button
              onClick={submit}
              disabled={loading}
              className="h-auto w-full rounded-xl px-4 py-3"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  Working...
                </span>
              ) : mode === 'signup' ? (
                'Create account'
              ) : (
                'Sign in'
              )}
            </Button>
            <Button
              onClick={onGuest}
              variant="outline"
              className="h-auto w-full rounded-xl border-theme-border bg-theme-bg px-4 py-3 hover:border-theme-accent hover:text-theme-accent"
            >
              Continue as guest
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
