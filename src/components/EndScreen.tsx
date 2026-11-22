import React, { useEffect, useMemo, useRef } from 'react';
import { Award, Printer, RotateCcw, RefreshCw, Home } from 'lucide-react';
import { AnswerRecord, Question, Team } from '../types/game';

interface EndScreenProps {
  teams: Team[];
  records: AnswerRecord[];
  onRetryMistakes: (mistakeQuestions: Question[]) => void;
  onPlayAgain: () => void;
  onGoHome: () => void;
}

export const EndScreen: React.FC<EndScreenProps> = ({
  teams,
  records,
  onRetryMistakes,
  onPlayAgain,
  onGoHome,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const sortedTeams = useMemo(() => {
    return [...teams].sort((a, b) => b.score - a.score);
  }, [teams]);

  const winner = sortedTeams[0];

  const stats = useMemo(() => {
    const total = records.length;
    const correct = records.filter((r) => r.isCorrect).length;
    const wrong = total - correct;
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

    const periodMisses: Record<string, number> = {};
    const writerMisses: Record<string, number> = {};
    const wrongQuestionsMap = new Map<string, Question>();

    records.forEach((r) => {
      if (!r.isCorrect) {
        wrongQuestionsMap.set(r.question.id, r.question);
        periodMisses[r.question.dovr] =
          (periodMisses[r.question.dovr] || 0) + 1;
        const key =
          r.question.senetkar || r.question.eser || 'Ümumi ədəbiyyat';
        writerMisses[key] = (writerMisses[key] || 0) + 1;
      }
    });

    const topMissedPeriod = Object.entries(periodMisses).sort(
      (a, b) => b[1] - a[1]
    )[0];
    const topMissedWriter = Object.entries(writerMisses).sort(
      (a, b) => b[1] - a[1]
    )[0];

    return {
      total,
      correct,
      wrong,
      accuracy,
      topMissedPeriod,
      topMissedWriter,
      mistakeQuestions: Array.from(wrongQuestionsMap.values()),
    };
  }, [records]);

  // Confetti effect (respects prefers-reduced-motion)
  useEffect(() => {
    const prefersReduced =
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#0F5C4D', '#B45309', '#15803D', '#D97706', '#1D4ED8'];
    const particles = Array.from({ length: 90 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * -canvas.height,
      w: 7 + Math.random() * 6,
      h: 4 + Math.random() * 5,
      vy: 2 + Math.random() * 3.5,
      vx: (Math.random() - 0.5) * 2,
      rot: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 0.12,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));

    let animId = 0;
    let frames = 0;

    const draw = () => {
      frames++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.max(0, 1 - frames / 240);
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      });

      if (frames < 240) {
        animId = window.requestAnimationFrame(draw);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    animId = window.requestAnimationFrame(draw);
    return () => window.cancelAnimationFrame(animId);
  }, []);

  const formattedDate = new Date().toLocaleDateString('az-Latn-AZ', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const medalForRank = (rank: number) => {
    if (rank === 0) return { label: 'Qızıl medal', symbol: '🥇', color: 'text-[#B45309]' };
    if (rank === 1) return { label: 'Gümüş medal', symbol: '🥈', color: 'text-[#475569]' };
    if (rank === 2) return { label: 'Bürünc medal', symbol: '🥉', color: 'text-[#9A3412]' };
    return { label: `${rank + 1}-ci yer`, symbol: '•', color: 'text-[#5B5E66]' };
  };

  return (
    <>
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-40 no-print"
        aria-hidden="true"
      />

      {/* Interactive End Screen (hidden during print) */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6 no-print">
        <section className="bg-white border border-[#E2DDD3] rounded-xl p-6 md:p-8 text-center space-y-3">
          <div className="inline-flex items-center gap-2 text-sm font-bold text-[#0F5C4D]">
            <Award className="w-5 h-5" aria-hidden="true" />
            <span>Oyun başa çatdı</span>
          </div>
          <h1 className="font-literary font-bold text-3xl md:text-4xl text-[#181A1F]">
            {teams.length > 1
              ? `Qalib: ${winner?.name}`
              : `Nəticəniz: ${winner?.score ?? 0} xal`}
          </h1>
          <p className="text-base text-[#4A4D54]">
            «Söz sənətimizin izi ilə» — X sinif Azərbaycan ədəbiyyatı yarışı
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            {stats.mistakeQuestions.length > 0 && (
              <button
                type="button"
                onClick={() => onRetryMistakes(stats.mistakeQuestions)}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#B45309] hover:bg-[#92400E] text-white font-bold text-base cursor-pointer min-h-[48px]"
              >
                <RotateCcw className="w-4 h-4" aria-hidden="true" />
                <span>
                  Səhvlərimi təkrar et ({stats.mistakeQuestions.length})
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border-2 border-[#0F5C4D] bg-white hover:bg-[#EDF6F3] text-[#0F5C4D] font-bold text-base cursor-pointer min-h-[48px]"
            >
              <Printer className="w-4 h-4" aria-hidden="true" />
              <span>Diplom çap et</span>
            </button>

            <button
              type="button"
              onClick={onPlayAgain}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#0F5C4D] hover:bg-[#0B473B] text-white font-bold text-base cursor-pointer min-h-[48px]"
            >
              <RefreshCw className="w-4 h-4" aria-hidden="true" />
              <span>Yenidən oyna</span>
            </button>

            <button
              type="button"
              onClick={onGoHome}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-[#D6D0C4] bg-[#FAF8F4] hover:bg-[#F1EDE4] text-[#181A1F] font-semibold text-base cursor-pointer min-h-[48px]"
            >
              <Home className="w-4 h-4" aria-hidden="true" />
              <span>Başlanğıc ekranı</span>
            </button>
          </div>
        </section>

        {/* Rankings */}
        <section className="bg-white border border-[#E2DDD3] rounded-xl p-6 space-y-4">
          <h2 className="font-literary font-bold text-xl text-[#181A1F]">
            Yekun reytinq cədvəli
          </h2>
          <div className="space-y-2.5">
            {sortedTeams.map((t, idx) => {
              const medal = medalForRank(idx);
              return (
                <div
                  key={t.id}
                  className={`rounded-xl border p-4 flex flex-wrap items-center justify-between gap-4 ${
                    idx === 0
                      ? 'bg-[#FEF8EE] border-[#EAB308]/60'
                      : 'bg-[#FAF8F4] border-[#E2DDD3]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl" aria-hidden="true">
                      {medal.symbol}
                    </span>
                    <div>
                      <div className="font-bold text-lg text-[#181A1F]">
                        {t.name}
                      </div>
                      <div className={`text-xs font-semibold ${medal.color}`}>
                        {medal.label} · {t.correctCount} doğru / {t.wrongCount} səhv
                      </div>
                    </div>
                  </div>
                  <div className="text-2xl md:text-3xl font-extrabold text-[#181A1F] tabular-nums">
                    {t.score} xal
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Statistics */}
        <section className="bg-white border border-[#E2DDD3] rounded-xl p-6 space-y-4">
          <h2 className="font-literary font-bold text-xl text-[#181A1F]">
            Oyun statistikası
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-[#FAF8F4] border border-[#E2DDD3]">
              <div className="text-xs text-[#5B5E66]">Cəmi sual</div>
              <div className="text-2xl font-extrabold text-[#181A1F] tabular-nums mt-1">
                {stats.total}
              </div>
            </div>
            <div className="p-4 rounded-lg bg-[#ECFDF3] border border-[#BBF7D0]">
              <div className="text-xs text-[#14532D]">Doğru cavab</div>
              <div className="text-2xl font-extrabold text-[#15803D] tabular-nums mt-1">
                {stats.correct} ({stats.accuracy}%)
              </div>
            </div>
            <div className="p-4 rounded-lg bg-[#FEF2F2] border border-[#FECACA]">
              <div className="text-xs text-[#7F1D1D]">Səhv cavab</div>
              <div className="text-2xl font-extrabold text-[#B91C1C] tabular-nums mt-1">
                {stats.wrong}
              </div>
            </div>
            <div className="p-4 rounded-lg bg-[#FAF8F4] border border-[#E2DDD3]">
              <div className="text-xs text-[#5B5E66]">Ən çox səhv edilən dövr</div>
              <div className="text-sm font-bold text-[#181A1F] mt-1 leading-snug">
                {stats.topMissedPeriod
                  ? `${stats.topMissedPeriod[0]} (${stats.topMissedPeriod[1]})`
                  : 'Səhv yoxdur'}
              </div>
            </div>
          </div>

          {stats.topMissedWriter && (
            <p className="text-sm text-[#4A4D54]">
              Ən çox təkrar tələb edən mövzu/sənətkar:{' '}
              <strong className="text-[#181A1F]">
                {stats.topMissedWriter[0]}
              </strong>{' '}
              ({stats.topMissedWriter[1]} səhv)
            </p>
          )}
        </section>
      </div>

      {/* Print-Ready White-Background Diploma */}
      <div className="hidden print-only bg-white text-black p-10">
        <div className="border-8 border-double border-[#0F5C4D] p-12 text-center space-y-6">
          <div className="text-sm uppercase tracking-widest text-[#5B5E66] font-semibold">
            X sinif Azərbaycan ədəbiyyatı · «Ədəbiyyat – 10»
          </div>
          <h1 className="font-literary text-5xl font-bold text-[#0F5C4D]">
            DİPLOM
          </h1>
          <p className="text-xl text-[#3B3E45]">
            «Söz sənətimizin izi ilə» interaktiv ədəbiyyat yarışmasında yüksək bilik və fəallıq göstərdiyinə görə təltif edilir:
          </p>
          <div className="font-literary text-4xl font-bold text-[#181A1F] py-4 border-b-2 border-[#B45309] max-w-xl mx-auto">
            {winner?.name}
          </div>
          <div className="text-2xl font-bold text-[#181A1F] tabular-nums">
            Toplanan xal: {winner?.score ?? 0} xal · Düzgün cavab: {winner?.correctCount ?? 0}
          </div>
          <div className="pt-8 flex items-center justify-between max-w-2xl mx-auto text-sm text-[#4A4D54]">
            <span>Tarix: {formattedDate}</span>
            <span>Müəllim imzası: _____________________</span>
          </div>
        </div>
      </div>
    </>
  );
};
