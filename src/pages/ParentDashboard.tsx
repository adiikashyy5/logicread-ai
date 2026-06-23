import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { Brain, LogOut, TrendingUp, AlertTriangle, BookOpen, Target, Users, ChevronRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface ErrorRecord {
  error_type: string;
  count: number;
  created_at: string;
}

interface SessionRecord {
  module_id: string;
  module_title: string;
  score: number;
  total: number;
  completed_at: string;
}

const ERROR_COLORS_MAP: Record<string, { color: string; label: string; desc: string }> = {
  overgeneralization: { color: '#f59e0b', label: 'Overgeneralization', desc: 'Applying a specific detail too broadly as a universal rule.' },
  ignoring_negatives: { color: '#ef4444', label: 'Ignoring Negatives', desc: 'Missing words like "not", "never", "rarely", "unless", "except".' },
  misinterpreting_context: { color: '#06b6d4', label: 'Misinterpreting Context', desc: 'Anchoring on an isolated phrase while ignoring paragraph tone.' },
};

const PIE_COLORS = ['#f59e0b', '#ef4444', '#06b6d4'];

export default function ParentDashboard() {
  const { profile, signOut } = useAuth();
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [errorRecords, setErrorRecords] = useState<ErrorRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [sessRes, errRes] = await Promise.all([
        supabase.from('quiz_sessions').select('module_id, module_title, score, total, completed_at').order('completed_at', { ascending: false }),
        supabase.from('error_records').select('error_type, count, created_at'),
      ]);
      if (sessRes.data) setSessions(sessRes.data as SessionRecord[]);
      if (errRes.data) setErrorRecords(errRes.data as ErrorRecord[]);
      setLoading(false);
    }
    load();
  }, []);

  const totalSessions = sessions.length;
  const avgScore = totalSessions > 0
    ? Math.round(sessions.reduce((s, r) => s + (r.score / r.total) * 100, 0) / totalSessions)
    : null;
  const totalErrors = errorRecords.reduce((s, r) => s + r.count, 0);

  const errorTotals: Record<string, number> = {};
  errorRecords.forEach((r) => {
    errorTotals[r.error_type] = (errorTotals[r.error_type] ?? 0) + r.count;
  });

  const topError = Object.entries(errorTotals).sort((a, b) => b[1] - a[1])[0];
  const topErrorPct = topError && totalErrors > 0 ? Math.round((topError[1] / totalErrors) * 100) : 0;

  const pieData = Object.entries(errorTotals)
    .filter(([, v]) => v > 0)
    .map(([type, count]) => ({
      name: ERROR_COLORS_MAP[type]?.label ?? type,
      value: count,
    }));

  const barData = sessions.slice(0, 8).reverse().map((s, i) => ({
    name: `S${i + 1}`,
    title: s.module_title,
    score: Math.round((s.score / s.total) * 100),
  }));

  const recommendations = topError
    ? getRecommendations(topError[0])
    : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-7 h-7 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500">Loading dashboard…</p>
        </div>
      </div>
    );
  }

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
              <span className="hidden sm:inline text-slate-400 text-sm ml-2">Parent Dashboard</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full">
              <Users className="w-4 h-4 text-slate-500" />
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
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Cognitive Error Profile</h1>
          <p className="text-slate-500 mt-1 text-sm">
            Evidence-based diagnostic report — beyond raw scores.
          </p>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={BookOpen}
            label="Sessions Completed"
            value={totalSessions.toString()}
            color="blue"
          />
          <StatCard
            icon={Target}
            label="Average Accuracy"
            value={avgScore !== null ? `${avgScore}%` : '—'}
            color={avgScore !== null && avgScore >= 70 ? 'green' : 'orange'}
          />
          <StatCard
            icon={AlertTriangle}
            label="Total Errors Logged"
            value={totalErrors.toString()}
            color="red"
          />
          <StatCard
            icon={TrendingUp}
            label="Primary Error Type"
            value={topError ? topErrorPct + '%' : '—'}
            sublabel={topError ? ERROR_COLORS_MAP[topError[0]]?.label : 'None yet'}
            color="orange"
          />
        </div>

        {/* AI Insight card */}
        {topError && totalErrors > 0 ? (
          <div className="card p-6 bg-gradient-to-r from-brand-50 to-slate-50 border-brand-100">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Brain className="w-5 h-5 text-brand-600" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900">AI Cognitive Error Profile Report</h2>
                <p className="text-slate-500 text-sm">Generated from {totalSessions} session{totalSessions !== 1 ? 's' : ''} of practice data</p>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-brand-100 text-sm text-slate-700 leading-relaxed">
              {avgScore !== null && (
                <span className="font-semibold text-slate-900">
                  Strong vocabulary recognition detected — {avgScore}% overall accuracy across {totalSessions} session{totalSessions !== 1 ? 's' : ''}.{' '}
                </span>
              )}
              Core logical growth area:{' '}
              <span className="font-semibold text-brand-700">"{ERROR_COLORS_MAP[topError[0]]?.label}"</span>.{' '}
              {ERROR_COLORS_MAP[topError[0]]?.desc}{' '}
              This error pattern accounted for{' '}
              <span className="font-semibold">{topError[1]} out of {totalErrors} incorrect mark{totalErrors !== 1 ? 's' : ''}</span>{' '}
              ({topErrorPct}%) recorded across all sessions.{' '}
              {recommendations.length > 0 && (
                <>
                  Recommended home target drill: practice text sentences containing the keywords:{' '}
                  <span className="font-mono text-xs bg-slate-100 px-1 py-0.5 rounded">
                    {recommendations.join(', ')}
                  </span>.
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="card p-6 text-center text-slate-400">
            <Brain className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="font-medium text-slate-500">No session data yet</p>
            <p className="text-sm mt-1">Have your child complete a reading module to generate their Cognitive Error Profile.</p>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Error type breakdown pie */}
          <div className="card p-6">
            <h3 className="font-bold text-slate-900 mb-4">Error Type Breakdown</h3>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((_, idx) => (
                      <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => [`${v} error${Number(v) !== 1 ? 's' : ''}`, '']} />
                  <Legend iconType="circle" iconSize={8} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-slate-300 text-sm">
                No error data yet
              </div>
            )}
          </div>

          {/* Session accuracy bar chart */}
          <div className="card p-6">
            <h3 className="font-bold text-slate-900 mb-4">Session Accuracy History</h3>
            {barData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={barData} barSize={28}>
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} unit="%" />
                  <Tooltip
                    formatter={(v) => [`${v}%`, 'Score']}
                    labelFormatter={(_, payload) => payload?.[0]?.payload?.title ?? ''}
                  />
                  <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                    {barData.map((d, i) => (
                      <Cell key={i} fill={d.score >= 70 ? '#22c55e' : d.score >= 50 ? '#f59e0b' : '#ef4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-slate-300 text-sm">
                No sessions recorded yet
              </div>
            )}
          </div>
        </div>

        {/* Error type guide */}
        <div className="card p-6">
          <h3 className="font-bold text-slate-900 mb-4">Cognitive Error Reference Guide</h3>
          <div className="space-y-4">
            {Object.entries(ERROR_COLORS_MAP).map(([key, { color, label, desc }]) => {
              const count = errorTotals[key] ?? 0;
              const pct = totalErrors > 0 ? Math.round((count / totalErrors) * 100) : 0;
              return (
                <div key={key} className="flex items-start gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="w-3 h-3 rounded-full flex-shrink-0 mt-1.5" style={{ backgroundColor: color }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-semibold text-slate-800 text-sm">{label}</span>
                      <span className="text-slate-500 text-xs font-medium">{count} error{count !== 1 ? 's' : ''} ({pct}%)</span>
                    </div>
                    <p className="text-slate-500 text-xs leading-relaxed">{desc}</p>
                    <div className="mt-2 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-1.5 rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, backgroundColor: color }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent sessions */}
        {sessions.length > 0 && (
          <div className="card p-6">
            <h3 className="font-bold text-slate-900 mb-4">Recent Sessions</h3>
            <div className="space-y-2">
              {sessions.slice(0, 5).map((s, i) => {
                const pct = Math.round((s.score / s.total) * 100);
                return (
                  <div key={i} className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-bold ${
                      pct >= 70 ? 'bg-success-50 text-success-600' : 'bg-warning-50 text-warning-600'
                    }`}>
                      {pct}%
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-800 text-sm truncate">{s.module_title}</p>
                      <p className="text-slate-400 text-xs">{s.score}/{s.total} correct · {new Date(s.completed_at).toLocaleDateString('en-AU')}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sublabel,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sublabel?: string;
  color: 'blue' | 'green' | 'orange' | 'red';
}) {
  const colorMap = {
    blue: 'bg-brand-50 text-brand-600',
    green: 'bg-success-50 text-success-600',
    orange: 'bg-warning-50 text-warning-600',
    red: 'bg-error-50 text-error-600',
  };
  return (
    <div className="card p-4">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${colorMap[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      {sublabel && <p className="text-xs font-medium text-slate-600 mt-0.5">{sublabel}</p>}
      <p className="text-slate-400 text-xs mt-0.5">{label}</p>
    </div>
  );
}

function getRecommendations(errorType: string): string[] {
  switch (errorType) {
    case 'ignoring_negatives':
      return ["'unless'", "'except'", "'rarely'", "'never'", "'not'", "'however'"];
    case 'overgeneralization':
      return ["'sometimes'", "'often'", "'certain'", "'specific'", "'limited'"];
    case 'misinterpreting_context':
      return ["'however'", "'despite'", "'although'", "'yet'", "'while'"];
    default:
      return [];
  }
}
