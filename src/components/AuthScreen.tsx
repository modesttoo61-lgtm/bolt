import { useState } from 'react';
import { TrendingUp, Mail, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export function AuthScreen() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'signup') {
        const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) throw signUpError;
        if (data.user && !data.session) {
          setError('Account created! Please sign in.');
          setMode('signin');
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      setError(msg === 'Invalid login credentials' ? 'Incorrect email or password' : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 ring-1 ring-emerald-500/20">
            <TrendingUp className="h-7 w-7 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">CryptoSim EDU</h1>
          <p className="mt-2 text-sm text-slate-400">
            Practice crypto trading with $100,000 in demo credits — risk-free learning with real market prices.
          </p>
        </div>

        <div className="card p-6 sm:p-8">
          <div className="mb-6 flex rounded-xl bg-slate-800/50 p-1">
            <button
              onClick={() => { setMode('signup'); setError(null); }}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
                mode === 'signup' ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign Up
            </button>
            <button
              onClick={() => { setMode('signin'); setError(null); }}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
                mode === 'signin' ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign In
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label-text mb-1.5 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-10"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label className="label-text mb-1.5 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-10"
                  placeholder="Min. 6 characters"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : mode === 'signup' ? (
                'Create Account'
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-500">
            Educational simulator only. All credits are fictitious — no real money is involved.
          </p>
        </div>
      </div>
    </div>
  );
}
