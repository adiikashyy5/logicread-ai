import { useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Brain, Flag, ChevronRight, ChevronLeft, CheckCircle2, XCircle,
  Highlighter, AlertTriangle, Info, ArrowRight, Home, RotateCcw,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { READING_MODULES, type ReadingModule } from '../lib/sampleData';
import { classifyError, type VerificationResult, type ErrorType } from '../lib/errorClassifier';
import Timer from '../components/Timer';

interface AttemptState {
  selectedOptionId: string | null;
  highlightedText: string;
  result: VerificationResult | null;
  flagged: boolean;
}

const ERROR_COLORS: Record<NonNullable<ErrorType>, { bg: string; border: string; icon: string; badge: string }> = {
  overgeneralization: {
    bg: 'bg-warning-50',
    border: 'border-warning-500/30',
    icon: 'text-warning-600',
    badge: 'bg-warning-50 text-warning-600 border-warning-200',
  },
  ignoring_negatives: {
    bg: 'bg-error-50',
    border: 'border-error-500/30',
    icon: 'text-error-600',
    badge: 'bg-error-50 text-error-600 border-error-200',
  },
  misinterpreting_context: {
    bg: 'bg-accent-500/10',
    border: 'border-accent-500/30',
    icon: 'text-accent-600',
    badge: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  },
};

const ERROR_LABEL: Record<NonNullable<ErrorType>, string> = {
  overgeneralization: 'Overgeneralization',
  ignoring_negatives: 'Ignoring Negatives',
  misinterpreting_context: 'Misinterpreting Context',
};

export default function ReadingTest() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const navigate = useNavigate();
  const mod = READING_MODULES.find((m) => m.id === moduleId);

  if (!mod) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="text-slate-500 mb-4">Module not found.</p>
          <button onClick={() => navigate('/dashboard')} className="btn-primary">Back to Dashboard</button>
        </div>
      </div>
    );
  }

  return <ReadingTestInner mod={mod} />;
}

function ReadingTestInner({ mod }: { mod: ReadingModule }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [currentQ, setCurrentQ] = useState(0);
  const [attempts, setAttempts] = useState<AttemptState[]>(() =>
    mod.questions.map(() => ({
      selectedOptionId: null,
      highlightedText: '',
      result: null,
      flagged: false,
    }))
  );
  const [phase, setPhase] = useState<'answer' | 'highlight' | 'feedback' | 'complete'>('answer');
  const [verifying, setVerifying] = useState(false);
  const [sessionSaved, setSessionSaved] = useState(false);

  const passageRef = useRef<HTMLDivElement>(null);

  const question = mod.questions[currentQ];
  const attempt = attempts[currentQ];
  const totalQ = mod.questions.length;

  function updateAttempt(idx: number, patch: Partial<AttemptState>) {
    setAttempts((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], ...patch };
      return next;
    });
  }

  function handleSelectOption(optionId: string) {
    if (phase !== 'answer') return;
    updateAttempt(currentQ, { selectedOptionId: optionId });
  }

  function handleProceedToHighlight() {
    if (!attempt.selectedOptionId) return;
    setPhase('highlight');
  }

  function handleTextSelection() {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) return;
    const range = sel.getRangeAt(0);
    if (!passageRef.current?.contains(range.commonAncestorContainer)) return;
    const text = sel.toString().trim();
    if (text.length > 10) {
      updateAttempt(currentQ, { highlightedText: text });
    }
  }

  function handleVerify() {
    if (!attempt.selectedOptionId || !attempt.highlightedText) return;
    setVerifying(true);

    const chosenOption = question.options.find((o) => o.id === attempt.selectedOptionId)!;
    const correctOption = question.options.find((o) => o.id === question.correctOptionId)!;
    const isCorrect = attempt.selectedOptionId === question.correctOptionId;
    const capturedHighlight = attempt.highlightedText;

    setTimeout(() => {
      const result = classifyError(
        mod.passage,
        capturedHighlight,
        chosenOption.text,
        correctOption.text,
        question.idealEvidenceSentence,
        isCorrect,
      );
      updateAttempt(currentQ, { result });
      setPhase('feedback');
      setVerifying(false);
    }, 900);
  }

  function handleNext() {
    if (currentQ < totalQ - 1) {
      const nextIdx = currentQ + 1;
      setCurrentQ(nextIdx);
      const nextAttempt = attempts[nextIdx];
      if (nextAttempt.result) {
        setPhase('feedback');
      } else if (nextAttempt.selectedOptionId) {
        setPhase('highlight');
      } else {
        setPhase('answer');
      }
    } else {
      finishSession();
    }
  }

  function handlePrev() {
    if (currentQ > 0) {
      const prevIdx = currentQ - 1;
      setCurrentQ(prevIdx);
      const prev = attempts[prevIdx];
      if (prev.result) setPhase('feedback');
      else if (prev.selectedOptionId) setPhase('highlight');
      else setPhase('answer');
    }
  }

  async function finishSession() {
    if (sessionSaved) { setPhase('complete'); return; }
    setPhase('complete');

    const score = attempts.filter((a) => a.result?.isCorrect).length;
    const errorCounts: Record<string, number> = {};
    attempts.forEach((a) => {
      if (a.result?.errorType) {
        errorCounts[a.result.errorType] = (errorCounts[a.result.errorType] ?? 0) + 1;
      }
    });

    const { data: session } = await supabase
      .from('quiz_sessions')
      .insert({
        module_id: mod.id,
        module_title: mod.title,
        score,
        total: totalQ,
        user_id: user!.id,
      })
      .select('id')
      .maybeSingle();

    if (session) {
      const records = attempts.map((a, i) => ({
        session_id: session.id,
        module_id: mod.id,
        question_id: mod.questions[i].id,
        question_text: mod.questions[i].text,
        selected_option_id: a.selectedOptionId,
        highlighted_text: a.highlightedText,
        is_correct: a.result?.isCorrect ?? false,
        error_type: a.result?.errorType ?? null,
        nli_result: a.result?.nliResult ?? null,
        similarity_score: a.result?.similarityScore ?? null,
        user_id: user!.id,
      }));
      await supabase.from('question_attempts').insert(records);

      const errorEntries = Object.entries(errorCounts).filter(([, c]) => c > 0);
      if (errorEntries.length > 0) {
        await supabase.from('error_records').insert(
          errorEntries.map(([type, count]) => ({
            session_id: session.id,
            user_id: user!.id,
            error_type: type,
            count,
          }))
        );
      }
    }
    setSessionSaved(true);
  }

  const completedCount = attempts.filter((a) => a.result !== null).length;
  const correctCount = attempts.filter((a) => a.result?.isCorrect).length;

  if (phase === 'complete') {
    return (
      <CompletionScreen
        mod={mod}
        attempts={attempts}
        score={correctCount}
        total={totalQ}
        onRetry={() => {
          setCurrentQ(0);
          setAttempts(mod.questions.map(() => ({ selectedOptionId: null, highlightedText: '', result: null, flagged: false })));
          setPhase('answer');
          setSessionSaved(false);
        }}
        onHome={() => navigate('/dashboard')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Exam header bar */}
      <header className="bg-slate-800 text-white px-4 sm:px-6 py-3 flex items-center justify-between gap-4 sticky top-0 z-30 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
            <Brain className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-sm hidden sm:block text-white/90 truncate max-w-xs">{mod.title}</span>
        </div>

        <div className="flex items-center gap-3 sm:gap-6">
          <Timer initialSeconds={mod.estimatedMinutes * 60} />

          <div className="flex items-center gap-2 text-sm text-white/80">
            <span className="font-bold text-white">Q{currentQ + 1}</span>
            <span>of {totalQ}</span>
          </div>

          <button
            onClick={() => updateAttempt(currentQ, { flagged: !attempt.flagged })}
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg transition-all ${
              attempt.flagged
                ? 'bg-warning-500/20 text-warning-300 border border-warning-500/40'
                : 'text-white/60 hover:text-white/80 hover:bg-white/10'
            }`}
          >
            <Flag className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Flag</span>
          </button>
        </div>
      </header>

      {/* Progress bar */}
      <div className="h-1 bg-slate-200">
        <div
          className="h-1 bg-brand-500 transition-all duration-500"
          style={{ width: `${(completedCount / totalQ) * 100}%` }}
        />
      </div>

      {/* Phase instruction banner */}
      <PhaseIndicator phase={phase} />

      {/* Main split pane */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left pane — Passage */}
        <div className="lg:w-3/5 flex flex-col border-r border-slate-200 bg-white overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Reading Passage</span>
            {phase === 'highlight' && (
              <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                <Highlighter className="w-3.5 h-3.5" />
                Drag to highlight evidence
              </div>
            )}
          </div>

          <div
            ref={passageRef}
            onMouseUp={handleTextSelection}
            onTouchEnd={handleTextSelection}
            className={`flex-1 overflow-y-auto p-5 sm:p-7 leading-relaxed text-slate-800 text-sm sm:text-base passage-text select-text ${
              phase === 'highlight' ? 'cursor-text' : ''
            }`}
          >
            <PassageWithHighlight
              text={mod.passage}
              highlight={attempt.highlightedText}
              idealSentence={phase === 'feedback' && attempt.result && !attempt.result.isCorrect ? question.idealEvidenceSentence : ''}
              isCorrect={attempt.result?.isCorrect ?? null}
            />
          </div>
        </div>

        {/* Right pane — Question + Controls */}
        <div className="lg:w-2/5 flex flex-col bg-white overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Question {currentQ + 1}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
            <p className="font-semibold text-slate-900 leading-snug text-sm sm:text-base">
              {question.text}
            </p>

            {/* Answer options */}
            <div className="space-y-2">
              {question.options.map((opt) => {
                const isSelected = attempt.selectedOptionId === opt.id;
                const isCorrect = opt.id === question.correctOptionId;
                const showResult = phase === 'feedback';

                let optClass = 'border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50';
                if (showResult && isCorrect) {
                  optClass = 'border-success-500 bg-success-50 text-success-700';
                } else if (showResult && isSelected && !isCorrect) {
                  optClass = 'border-error-500 bg-error-50 text-error-700';
                } else if (isSelected && !showResult) {
                  optClass = 'border-brand-500 bg-brand-50 text-brand-700';
                }

                return (
                  <button
                    key={opt.id}
                    onClick={() => handleSelectOption(opt.id)}
                    disabled={phase !== 'answer'}
                    className={`w-full text-left px-4 py-3 rounded-lg border-2 text-sm transition-all duration-150 flex items-start gap-3 ${optClass} disabled:cursor-default`}
                  >
                    <span className="font-bold flex-shrink-0 mt-0.5 uppercase">{opt.id}.</span>
                    <span className="leading-snug">{opt.text}</span>
                    {showResult && isCorrect && (
                      <CheckCircle2 className="w-4 h-4 text-success-600 flex-shrink-0 ml-auto mt-0.5" />
                    )}
                    {showResult && isSelected && !isCorrect && (
                      <XCircle className="w-4 h-4 text-error-600 flex-shrink-0 ml-auto mt-0.5" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Highlight status */}
            {(phase === 'highlight' || phase === 'feedback') && attempt.highlightedText && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                <p className="text-xs font-semibold text-amber-700 mb-1 flex items-center gap-1.5">
                  <Highlighter className="w-3.5 h-3.5" />
                  Your selected evidence:
                </p>
                <p className="text-xs text-amber-800 italic leading-relaxed">
                  "{attempt.highlightedText.slice(0, 150)}{attempt.highlightedText.length > 150 ? '…' : ''}"
                </p>
              </div>
            )}

            {/* Feedback panel */}
            {phase === 'feedback' && attempt.result && (
              <FeedbackPanel result={attempt.result} />
            )}
          </div>

          {/* Controls footer */}
          <div className="px-5 sm:px-6 py-4 border-t border-slate-100 bg-slate-50 space-y-3">
            {phase === 'answer' && (
              <button
                onClick={handleProceedToHighlight}
                disabled={!attempt.selectedOptionId}
                className="btn-primary w-full"
              >
                Highlight Evidence
                <Highlighter className="w-4 h-4" />
              </button>
            )}

            {phase === 'highlight' && (
              <button
                onClick={handleVerify}
                disabled={!attempt.highlightedText || verifying}
                className="btn-primary w-full"
              >
                {verifying ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Verifying logic…
                  </>
                ) : (
                  <>
                    Verify My Logic
                    <Brain className="w-4 h-4" />
                  </>
                )}
              </button>
            )}

            {phase === 'feedback' && (
              <button onClick={handleNext} className="btn-primary w-full">
                {currentQ < totalQ - 1 ? 'Next Question' : 'Finish Test'}
                <ChevronRight className="w-4 h-4" />
              </button>
            )}

            <div className="flex gap-2">
              <button onClick={handlePrev} disabled={currentQ === 0} className="btn-secondary flex-1">
                <ChevronLeft className="w-4 h-4" />
                Prev
              </button>
              <button onClick={() => navigate('/dashboard')} className="btn-ghost flex-1 text-sm">
                <Home className="w-4 h-4" />
                Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PhaseIndicator({ phase }: { phase: string }) {
  const map: Record<string, { text: string; color: string; icon: React.ReactNode }> = {
    answer: {
      text: 'Step 1 — Select your answer from the options on the right',
      color: 'bg-brand-600',
      icon: <Info className="w-3.5 h-3.5" />,
    },
    highlight: {
      text: 'Step 2 — Highlight the exact sentence that proves your answer',
      color: 'bg-amber-600',
      icon: <Highlighter className="w-3.5 h-3.5" />,
    },
    feedback: {
      text: 'Step 3 — Review your AI feedback below, then proceed',
      color: 'bg-slate-600',
      icon: <Brain className="w-3.5 h-3.5" />,
    },
  };
  const info = map[phase];
  if (!info) return null;
  return (
    <div className={`${info.color} text-white text-xs px-5 py-2 flex items-center gap-2`}>
      {info.icon}
      <span className="font-medium">{info.text}</span>
    </div>
  );
}

type SegmentType = 'normal' | 'student' | 'ideal';
interface Segment { start: number; end: number; type: SegmentType }

function PassageWithHighlight({
  text,
  highlight,
  idealSentence,
  isCorrect,
}: {
  text: string;
  highlight: string;
  idealSentence: string;
  isCorrect: boolean | null;
}) {
  if (!highlight && !idealSentence) {
    return <p className="whitespace-pre-wrap">{text}</p>;
  }

  let segments: Segment[] = [{ start: 0, end: text.length, type: 'normal' }];

  const studentIdx = highlight ? text.indexOf(highlight) : -1;
  const idealIdx = idealSentence ? text.indexOf(idealSentence) : -1;

  if (studentIdx === -1 && idealIdx === -1) {
    return <p className="whitespace-pre-wrap">{text}</p>;
  }

  if (studentIdx !== -1) {
    segments = splitSegment(segments, studentIdx, studentIdx + highlight.length, 'student');
  }
  if (idealIdx !== -1 && isCorrect === false) {
    segments = splitSegment(segments, idealIdx, idealIdx + idealSentence.length, 'ideal');
  }

  return (
    <p className="whitespace-pre-wrap leading-relaxed">
      {segments.map((seg, i) => {
        const t = text.slice(seg.start, seg.end);
        if (seg.type === 'student') {
          return (
            <mark
              key={i}
              className={`rounded px-0.5 ${isCorrect === true ? 'bg-green-200' : isCorrect === false ? 'bg-red-200' : 'bg-yellow-200'}`}
            >
              {t}
            </mark>
          );
        }
        if (seg.type === 'ideal') {
          return (
            <mark key={i} className="bg-green-100 border-b-2 border-green-400 rounded px-0.5">
              {t}
            </mark>
          );
        }
        return <span key={i}>{t}</span>;
      })}
    </p>
  );
}

function splitSegment(
  segments: Segment[],
  from: number,
  to: number,
  type: SegmentType,
): Segment[] {
  const result: Segment[] = [];
  for (const seg of segments) {
    if (seg.type !== 'normal' || to <= seg.start || from >= seg.end) {
      result.push(seg);
      continue;
    }
    if (seg.start < from) result.push({ start: seg.start, end: from, type: 'normal' });
    result.push({ start: Math.max(seg.start, from), end: Math.min(seg.end, to), type });
    if (seg.end > to) result.push({ start: to, end: seg.end, type: 'normal' });
  }
  return result;
}

function FeedbackPanel({ result }: { result: VerificationResult }) {
  if (result.isCorrect) {
    return (
      <div className="rounded-xl border-2 border-success-500/40 bg-success-50 p-4 animate-slide-up">
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle2 className="w-5 h-5 text-success-600 flex-shrink-0" />
          <span className="font-bold text-success-700 text-sm">Logic Confirmed — NLI Entailment Detected</span>
        </div>
        <p className="text-success-700 text-xs leading-relaxed">{result.feedbackBody}</p>
        <div className="mt-3 space-y-1 border-t border-success-200 pt-3">
          <p className="text-xs text-success-600">{result.layer1Detail}</p>
          <p className="text-xs text-success-600">{result.layer2Detail}</p>
        </div>
      </div>
    );
  }

  if (!result.errorType) return null;
  const colors = ERROR_COLORS[result.errorType];

  return (
    <div className={`rounded-xl border-2 ${colors.border} ${colors.bg} p-4 animate-slide-up`}>
      <div className="flex items-start gap-2 mb-2">
        <AlertTriangle className={`w-5 h-5 ${colors.icon} flex-shrink-0 mt-0.5`} />
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`font-bold text-sm ${colors.icon}`}>{result.feedbackTitle}</span>
            <span className={`badge border text-xs ${colors.badge}`}>
              {ERROR_LABEL[result.errorType]}
            </span>
          </div>
        </div>
      </div>
      <p className="text-slate-700 text-xs leading-relaxed">{result.feedbackBody}</p>
      <div className="mt-3 pt-3 border-t border-slate-200/60 space-y-1">
        <p className="text-xs text-slate-500">{result.layer1Detail}</p>
        <p className="text-xs text-slate-500">{result.layer2Detail}</p>
      </div>
      <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-start gap-2">
        <div className="w-3 h-3 rounded bg-green-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-slate-600 italic">
          The ideal evidence sentence is highlighted in green in the passage.
        </p>
      </div>
    </div>
  );
}

function CompletionScreen({
  mod,
  attempts,
  score,
  total,
  onRetry,
  onHome,
}: {
  mod: ReadingModule;
  attempts: AttemptState[];
  score: number;
  total: number;
  onRetry: () => void;
  onHome: () => void;
}) {
  const pct = Math.round((score / total) * 100);
  const errorCounts: Record<string, number> = {};
  attempts.forEach((a) => {
    if (a.result?.errorType) {
      errorCounts[a.result.errorType] = (errorCounts[a.result.errorType] ?? 0) + 1;
    }
  });
  const topError = Object.entries(errorCounts).sort((a, b) => b[1] - a[1])[0];

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full space-y-5 animate-slide-up">
        <div className="card p-7 text-center">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${pct >= 70 ? 'bg-success-50' : 'bg-warning-50'}`}>
            <span className={`text-3xl font-bold ${pct >= 70 ? 'text-success-600' : 'text-warning-600'}`}>{pct}%</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-1">Module Complete</h2>
          <p className="text-slate-500 text-sm">{mod.title}</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-2xl font-bold text-slate-900">{score}/{total}</p>
              <p className="text-slate-500 text-xs">Correct answers</p>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <p className="text-2xl font-bold text-slate-900">{total - score}</p>
              <p className="text-slate-500 text-xs">Errors made</p>
            </div>
          </div>
        </div>

        {topError && (
          <div className={`card p-5 ${ERROR_COLORS[topError[0] as NonNullable<ErrorType>].bg} border-2 ${ERROR_COLORS[topError[0] as NonNullable<ErrorType>].border}`}>
            <div className="flex items-center gap-2 mb-2">
              <Brain className="w-5 h-5 text-slate-600" />
              <span className="font-bold text-slate-800 text-sm">Your Primary Error Pattern</span>
            </div>
            <p className="text-slate-700 text-sm font-semibold">
              {ERROR_LABEL[topError[0] as NonNullable<ErrorType>]}
            </p>
            <p className="text-slate-600 text-xs mt-1">
              This error type accounted for {topError[1]} out of {total - score} incorrect answer{total - score !== 1 ? 's' : ''} in this session.
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <button onClick={onRetry} className="btn-secondary">
            <RotateCcw className="w-4 h-4" />
            Retry Module
          </button>
          <button onClick={onHome} className="btn-primary">
            Dashboard
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
