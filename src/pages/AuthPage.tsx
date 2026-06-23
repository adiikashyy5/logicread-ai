import { useState, FormEvent } from 'react';
import { BookOpen, Brain, ChevronRight, Eye, EyeOff, GraduationCap, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

type Mode = 'login' | 'signup';
type Role = 'student' | 'parent';

export default function AuthPage() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [role, setRole] = useState<Role>('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (mode === 'login') {
      const { error } = await signIn(email, password);
      if (error) setError(error);
    } else {
      if (!fullName.trim()) {
        setError('Please enter your full name.');
        setLoading(false);
        return;
      }
      const { error } = await signUp(email, password, fullName.trim(), role);
      if (error) setError(error);
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-brand-950 to-slate-900 flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-brand-400 blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-brand-600 blur-3xl" />
        </div>

        <div className="relative">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center shadow-lg">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <span className="text-white font-bold text-xl tracking-tight">LogicRead AI</span>
          </div>

          <div className="space-y-6">
            <h1 className="text-4xl font-bold text-white leading-tight">
              Stop guessing.<br />
              <span className="text-brand-300">Start proving.</span>
            </h1>
            <p className="text-slate-300 text-lg leading-relaxed max-w-md">
              The only NSW Selective test prep platform that forces evidence-based reasoning — and tells you
              exactly <em>why</em> your logic was wrong.
            </p>
          </div>
        </div>

        <div className="relative space-y-4">
          {[
            { icon: BookOpen, title: 'Janison-Style Interface', desc: 'Mirrors the official NSW test portal layout exactly.' },
            { icon: Brain, title: 'AI Error Diagnosis', desc: 'Three-layer NLI engine classifies your logical mistake.' },
            { icon: GraduationCap, title: 'Cognitive Error Profiles', desc: 'Parents see which error type costs the most marks.' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="w-9 h-9 bg-brand-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-brand-300" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">{title}</p>
                <p className="text-slate-400 text-sm mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right auth panel */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md animate-slide-up">
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center shadow-lg">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <span className="text-white font-bold text-xl tracking-tight">LogicRead AI</span>
          </div>

          <div className="card bg-white p-8 shadow-2xl">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-900">
                {mode === 'login' ? 'Welcome back' : 'Create account'}
              </h2>
              <p className="text-slate-500 mt-1 text-sm">
                {mode === 'login'
                  ? 'Sign in to continue your practice.'
                  : 'Join LogicRead AI to start training.'}
              </p>
            </div>

            {mode === 'signup' && (
              <div className="mb-5">
                <p className="label">I am a…</p>
                <div className="grid grid-cols-2 gap-3">
                  {(['student', 'parent'] as Role[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`flex items-center gap-2.5 p-3.5 rounded-lg border-2 transition-all duration-150 text-left ${
                        role === r
                          ? 'border-brand-500 bg-brand-50 text-brand-700'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {r === 'student' ? (
                        <GraduationCap className="w-5 h-5 flex-shrink-0" />
                      ) : (
                        <Users className="w-5 h-5 flex-shrink-0" />
                      )}
                      <span className="font-semibold capitalize text-sm">{r}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div>
                  <label className="label">Full name</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g. Aditya Sharma"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
              )}

              <div>
                <label className="label">Email address</label>
                <input
                  type="email"
                  className="input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="input pr-11"
                    placeholder="Min. 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-error-50 border border-error-500/20 text-error-600 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full mt-2"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    {mode === 'login' ? 'Sign in' : 'Create account'}
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-100 text-center">
              <p className="text-slate-500 text-sm">
                {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
                <button
                  type="button"
                  onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }}
                  className="text-brand-600 font-semibold hover:text-brand-700 transition-colors"
                >
                  {mode === 'login' ? 'Sign up' : 'Sign in'}
                </button>
              </p>
            </div>
          </div>

          <p className="text-slate-400 text-xs text-center mt-4">
            NSW Selective High School Test Preparation Platform — Years 4–6
          </p>
        </div>
      </div>
    </div>
  );
}
