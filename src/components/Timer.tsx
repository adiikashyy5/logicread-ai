import { useEffect, useRef, useState } from 'react';
import { Clock } from 'lucide-react';

interface TimerProps {
  initialSeconds: number;
}

export default function Timer({ initialSeconds }: TimerProps) {
  const [remaining, setRemaining] = useState(initialSeconds);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const isLow = remaining < 120;

  return (
    <div className={`flex items-center gap-1.5 font-mono text-sm font-semibold px-3 py-1.5 rounded-lg transition-colors ${
      isLow ? 'bg-error-500/20 text-red-300 animate-pulse-soft' : 'bg-white/10 text-white'
    }`}>
      <Clock className="w-3.5 h-3.5" />
      {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
    </div>
  );
}
