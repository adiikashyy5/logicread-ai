import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, BookOpen, Clock, ChevronRight, Star, TrendingUp, LogOut, Award, Target } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { READING_MODULES } from '../lib/sampleData';

interface SessionSummary {
  module_id: string;
  score: number;
  total: number;
  completed_at: string;
}

export default function StudentDashboard() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('quiz_sessions')
        .select('module_id, score, total, completed_at')
        .order('completed_at', { ascending: false });
      if (data) setSessions(data as SessionSummary[]);
      setLoading(false);
    }
    load();
  }, []);

  const totalAttempts = sessions.length;
  const avgScore = totalAttempts > 0
    ? Math.round(sessions.reduce((sum, s) => sum + (s.score / s.total) * 100, 0) / totalAttempts)
    : null;

  function getModuleSession(moduleId: string) {
    return sessions.find((s) => s.module_id === moduleId);
  }

  const difficultyColor: Record<string, string> = {
    'Year 4': 'bg-success-50 text-success-700',
    'Year 5': 'bg-warning-50 text-warning-600',
    'Year 6': 'bg-error-50 text-error-600',
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center shadow-sm">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-slate-900 tracking-tight">LogicRead AI</span>
              <span className="hidden sm:inline text-slate-400 text-sm ml-2">NSW Selective Test Prep</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full">
              <div className="w-2 h-2 bg-success-500 rounded-full" />
              <span className="text-sm font-medium text-slate-700">{profile?.full_name}</span>
            </div>
            <button onClick={signOut} className="btn-ghost text-sm gap-1.5">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Welcome */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Good {getGreeting()}, {profile?.full_name?.split(' ')[0]} 👋
            </h1>
            <p className="text-slate-500 mt-1">
              Select a reading module below to practise evidence-based reasoning.
            </p>
          </div>
          {avgScore !== null && (
            <div className="flex items-center gap-2 px-4 py-2 bg-brand-50 border border-brand-100 rounded-xl">
              <TrendingUp className="w-4 h-4 text-brand-600" />
              <span className="text-brand-700 font-semibold text-sm">Overall: {avgScore}% accuracy</span>
            </div>
          )}
        </div>

        {/* Stats row */}
        {!loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <StatCard
              icon={BookOpen}
              label="Modules Attempted"
              value={totalAttempts.toString()}
              color="blue"
            />
            <StatCard
              icon={Target}
              label="Avg. Accuracy"
              value={avgScore !== null ? `${avgScore}%` : '—'}
              color="green"
            />
            <StatCard
              icon={Award}
              label="Modules Available"
              value={READING_MODULES.length.toString()}
              color="orange"
              className="col-span-2 sm:col-span-1"
            />
          </div>
        )}

        {/* Module grid */}
        <div>
          <h2 className="text-lg font-bold text-slate-900 mb-4">Reading Modules</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {READING_MODULES.map((mod) => {
              const session = getModuleSession(mod.id);
              const pct = session ? Math.round((session.score / session.total) * 100) : null;

              return (
                <div
                  key={mod.id}
                  onClick={() => navigate(`/test/${mod.id}`)}
                  className="card overflow-hidden cursor-pointer group hover:shadow-md hover:border-brand-200 transition-all duration-200"
                >
                  <div className="h-36 overflow-hidden bg-slate-100">
                    <img
                      src={mod.imageUrl}
                      alt={mod.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  <div className="p-5">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className={`badge ${difficultyColor[mod.difficulty]}`}>
                        {mod.difficulty}
                      </span>
                      {pct !== null && (
                        <span className={`badge ${pct >= 70 ? 'bg-success-50 text-success-700' : 'bg-warning-50 text-warning-600'}`}>
                          <Star className="w-3 h-3" />
                          {pct}%
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-slate-900 text-base leading-snug mb-1">
                      {mod.title}
                    </h3>
                    <p className="text-slate-500 text-xs mb-3">{mod.subject}</p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-slate-400 text-xs">
                        <Clock className="w-3.5 h-3.5" />
                        {mod.estimatedMinutes} min · {mod.questions.length} questions
                      </div>
                      <div className="flex items-center gap-1 text-brand-600 text-xs font-semibold group-hover:gap-2 transition-all">
                        {session ? 'Retry' : 'Start'}
                        <ChevronRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* How it works */}
        <div className="card p-6 bg-gradient-to-r from-brand-50 to-slate-50 border-brand-100">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Brain className="w-5 h-5 text-brand-600" />
            How LogicRead AI works
          </h3>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { step: '01', title: 'Select your answer', desc: 'Choose the multiple-choice option you believe is correct.' },
              { step: '02', title: 'Highlight your evidence', desc: 'Drag to highlight the sentence in the passage that proves your answer.' },
              { step: '03', title: 'AI verifies your logic', desc: 'Get instant feedback on whether your reasoning actually supports your choice.' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex items-start gap-3">
                <div className="w-8 h-8 bg-brand-600 text-white rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {step}
                </div>
                <div>
                  <p className="font-semibold text-slate-800 text-sm">{title}</p>
                  <p className="text-slate-500 text-xs mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  className = '',
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  color: 'blue' | 'green' | 'orange';
  className?: string;
}) {
  const colorMap = {
    blue: 'bg-brand-50 text-brand-600',
    green: 'bg-success-50 text-success-600',
    orange: 'bg-warning-50 text-warning-600',
  };
  return (
    <div className={`card p-4 ${className}`}>
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${colorMap[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-slate-500 text-xs mt-0.5">{label}</p>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
