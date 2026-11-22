import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Coins,
  Flame,
  Lightbulb,
  Pause,
  Play,
  Scissors,
  XCircle,
} from 'lucide-react';
import {
  AnswerRecord,
  PeriodName,
  Question,
  RoundType,
  Team,
  TeacherSettings,
} from '../types/game';
import { soundFX } from '../utils/sound';
import { LiteraryMap } from './LiteraryMap';
import { MiniGameRenderer } from './MiniGames';

interface GamePlayProps {
  questions: Question[];
  finalQuestions: Question[];
  initialTeams: Team[];
  selectedPeriods: PeriodName[];
  teacherSettings: TeacherSettings;
  isRetryMode?: boolean;
  onFinishGame: (finalTeams: Team[], records: AnswerRecord[]) => void;
  onExitGame: () => void;
}

const ROUND_LABELS: Record<RoundType, string> = {
  test: 'Test sualı',
  'dogru-yanlis': 'Doğru, yoxsa yanlış?',
  uygunlasdir: 'Uyğunlaşdır',
  'zaman-lenti': 'Zaman lenti',
  'sujet-zenciri': 'Süjet zənciri',
  misra: 'Misra kimindir?',
  'ipucu-kart': 'Kimdir bu sənətkar?',
  final: 'Final sualı',
};

const DIFF_LABELS: Record<string, { label: string; pts: number }> = {
  asan: { label: 'Asan', pts: 100 },
  orta: { label: 'Orta', pts: 200 },
  cetin: { label: 'Çətin', pts: 300 },
};

export const GamePlay: React.FC<GamePlayProps> = ({
  questions,
  finalQuestions,
  initialTeams,
  selectedPeriods,
  teacherSettings,
  isRetryMode = false,
  onFinishGame,
  onExitGame,
}) => {
  const [teams, setTeams] = useState<Team[]>(initialTeams);
  const [records, setRecords] = useState<AnswerRecord[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [turnIndex, setTurnIndex] = useState(0);

  // Final wager round state
  const [inFinalPhase, setInFinalPhase] = useState(false);
  const [finalTeamIndex, setFinalTeamIndex] = useState(0);
  const [wagerPercent, setWagerPercent] = useState<number>(20);
  const [wagerConfirmed, setWagerConfirmed] = useState(false);

  // Current question interaction state
  const [timeLeft, setTimeLeft] = useState<number>(teacherSettings.timerSeconds);
  const [timerPaused, setTimerPaused] = useState(false);
  const [joker5050Seq, setJoker5050Seq] = useState<number>(0);
  const [hintShown, setHintShown] = useState(false);
  const [answered, setAnswered] = useState(false);
  const [lastResult, setLastResult] = useState<{
    isCorrect: boolean;
    timedOut?: boolean;
    pointsEarned: number;
    bonusText: string;
    correctText?: string;
  } | null>(null);
  const [keyboardTrigger, setKeyboardTrigger] = useState<{
    key: string;
    seq: number;
  } | null>(null);
  const questionStartRef = useRef<number>(Date.now());

  const currentTeam = inFinalPhase
    ? teams[finalTeamIndex]
    : teams[turnIndex % teams.length];

  const currentQuestion: Question | undefined = useMemo(() => {
    if (inFinalPhase) {
      return finalQuestions[finalTeamIndex % Math.max(finalQuestions.length, 1)];
    }
    return questions[qIndex];
  }, [inFinalPhase, finalQuestions, finalTeamIndex, questions, qIndex]);

  const visitedPeriods = useMemo(() => {
    const set = new Set<PeriodName>();
    records.forEach((r) => set.add(r.question.dovr));
    if (currentQuestion) set.add(currentQuestion.dovr);
    return Array.from(set);
  }, [records, currentQuestion]);

  // Reset per-question states whenever question changes
  useEffect(() => {
    setTimeLeft(teacherSettings.timerSeconds);
    setTimerPaused(false);
    setJoker5050Seq(0);
    setHintShown(false);
    setAnswered(false);
    setLastResult(null);
    questionStartRef.current = Date.now();
  }, [qIndex, inFinalPhase, finalTeamIndex, wagerConfirmed, teacherSettings.timerSeconds]);

  // Timer countdown
  useEffect(() => {
    if (
      !teacherSettings.timerEnabled ||
      timerPaused ||
      answered ||
      (inFinalPhase && !wagerConfirmed)
    ) {
      return;
    }

    const interval = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(interval);
          handleTimeout();
          return 0;
        }
        if (prev <= 6) {
          soundFX.tick();
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    teacherSettings.timerEnabled,
    timerPaused,
    answered,
    inFinalPhase,
    wagerConfirmed,
    qIndex,
    finalTeamIndex,
  ]);

  // Keyboard shortcuts (1-4, Space, Enter)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT')
      ) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        if (!answered && teacherSettings.timerEnabled && (!inFinalPhase || wagerConfirmed)) {
          setTimerPaused((p) => !p);
          soundFX.click();
        }
      } else if (e.key === 'Enter') {
        if (answered) {
          e.preventDefault();
          handleNext();
        }
      } else if (['1', '2', '3', '4'].includes(e.key) && !answered) {
        if (!inFinalPhase || wagerConfirmed) {
          setKeyboardTrigger((prev) => ({
            key: e.key,
            seq: (prev?.seq ?? 0) + 1,
          }));
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answered, teacherSettings.timerEnabled, inFinalPhase, wagerConfirmed, qIndex, finalTeamIndex]);

  const handleTimeout = () => {
    if (answered || !currentQuestion) return;
    soundFX.wrong();
    setAnswered(true);

    let penalty = 0;
    if (inFinalPhase) {
      const baseStake =
        currentTeam.score > 0
          ? Math.round((currentTeam.score * wagerPercent) / 100)
          : 100;
      penalty = currentTeam.score > 0 ? -baseStake : 0;
    }

    setTeams((prev) =>
      prev.map((t, i) => {
        const activeIdx = inFinalPhase ? finalTeamIndex : turnIndex % prev.length;
        if (i !== activeIdx) return t;
        return {
          ...t,
          score: Math.max(0, t.score + penalty),
          streak: 0,
          wrongCount: t.wrongCount + 1,
        };
      })
    );

    setRecords((prev) => [
      ...prev,
      {
        question: currentQuestion,
        teamId: currentTeam.id,
        teamName: currentTeam.name,
        isCorrect: false,
        pointsEarned: penalty,
        timeSpent: teacherSettings.timerSeconds,
      },
    ]);

    let correctText = '';
    if (currentQuestion.variantlar && currentQuestion.duzgun !== undefined) {
      correctText = currentQuestion.variantlar[currentQuestion.duzgun] || '';
    } else if (currentQuestion.nov === 'dogru-yanlis') {
      correctText = currentQuestion.dogruMu ? 'Doğru' : 'Yanlış';
    } else if (currentQuestion.cutler) {
      correctText = currentQuestion.cutler.map((c) => `${c.left} → ${c.right}`).join(' · ');
    } else if (currentQuestion.ardicilliq) {
      correctText = currentQuestion.ardicilliq.map((a, i) => `${i + 1}) ${a}`).join(' → ');
    }

    setLastResult({
      isCorrect: false,
      timedOut: true,
      pointsEarned: penalty,
      bonusText: '',
      correctText,
    });
  };

  const handleSubmitAnswer = (
    isCorrect: boolean,
    customPoints?: number,
    revealedText?: string
  ) => {
    if (answered || !currentQuestion) return;
    const elapsedSec = Math.round((Date.now() - questionStartRef.current) / 1000);
    setAnswered(true);

    let earned = 0;
    const bonusParts: string[] = [];

    if (inFinalPhase) {
      const stake =
        currentTeam.score > 0
          ? Math.round((currentTeam.score * wagerPercent) / 100)
          : 100;
      earned = isCorrect ? stake : currentTeam.score > 0 ? -stake : 0;
      if (isCorrect) {
        bonusParts.push(`Mərc qazanıldı (+${stake} xal)`);
      } else if (stake > 0 && currentTeam.score > 0) {
        bonusParts.push(`Mərc itirildi (-${stake} xal)`);
      }
    } else if (isCorrect) {
      let base =
        customPoints ?? DIFF_LABELS[currentQuestion.cetinlik]?.pts ?? 100;
      if (hintShown) {
        base = Math.round(base * 0.5);
        bonusParts.push('İpucu jokeri (-50% baza xal)');
      }
      earned += base;

      if (elapsedSec <= 10 && teacherSettings.timerEnabled) {
        earned += 50;
        bonusParts.push('Sürət bonusu +50');
      }

      const nextStreak = currentTeam.streak + 1;
      if (nextStreak > 0 && nextStreak % 3 === 0) {
        earned += 100;
        bonusParts.push('3 ardıcıl düzgün cavab +100');
      }
    }

    if (isCorrect) {
      soundFX.correct();
    } else {
      soundFX.wrong();
    }

    const activeIdx = inFinalPhase ? finalTeamIndex : turnIndex % teams.length;
    setTeams((prev) =>
      prev.map((t, i) => {
        if (i !== activeIdx) return t;
        return {
          ...t,
          score: Math.max(0, t.score + earned),
          streak: isCorrect ? t.streak + 1 : 0,
          correctCount: t.correctCount + (isCorrect ? 1 : 0),
          wrongCount: t.wrongCount + (isCorrect ? 0 : 1),
        };
      })
    );

    const newRecord: AnswerRecord = {
      question: currentQuestion,
      teamId: currentTeam.id,
      teamName: currentTeam.name,
      isCorrect,
      pointsEarned: earned,
      timeSpent: elapsedSec,
    };
    setRecords((prev) => [...prev, newRecord]);

    setLastResult({
      isCorrect,
      pointsEarned: earned,
      bonusText: bonusParts.join(' · '),
      correctText: revealedText,
    });
  };

  const handleNext = () => {
    soundFX.click();
    if (!inFinalPhase) {
      if (qIndex + 1 < questions.length) {
        setQIndex(qIndex + 1);
        setTurnIndex((t) => t + 1);
      } else if (!isRetryMode && finalQuestions.length > 0) {
        // Enter Final Wager Round!
        setInFinalPhase(true);
        setFinalTeamIndex(0);
        setWagerPercent(20);
        setWagerConfirmed(false);
      } else {
        soundFX.victory();
        onFinishGame(teams, records);
      }
    } else {
      if (finalTeamIndex + 1 < teams.length) {
        setFinalTeamIndex((i) => i + 1);
        setWagerPercent(20);
        setWagerConfirmed(false);
      } else {
        soundFX.victory();
        onFinishGame(teams, records);
      }
    }
  };

  // JOKERS
  const activeTeamIdx = inFinalPhase ? finalTeamIndex : turnIndex % teams.length;

  const canFiftyFifty =
    !answered &&
    !inFinalPhase &&
    currentTeam.jokers.fiftyFifty &&
    currentQuestion &&
    ['test', 'misra', 'ipucu-kart'].includes(currentQuestion.nov);

  const useFiftyFifty = () => {
    if (!canFiftyFifty || !currentQuestion) return;
    soundFX.flip();
    setJoker5050Seq((s) => s + 1);
    setTeams((prev) =>
      prev.map((t, i) =>
        i === activeTeamIdx
          ? { ...t, jokers: { ...t.jokers, fiftyFifty: false } }
          : t
      )
    );
  };

  const canHint = !answered && currentTeam.jokers.hint && !hintShown;
  const useHint = () => {
    if (!canHint) return;
    soundFX.flip();
    setHintShown(true);
    setTeams((prev) =>
      prev.map((t, i) =>
        i === activeTeamIdx ? { ...t, jokers: { ...t.jokers, hint: false } } : t
      )
    );
  };

  const canExtraTime =
    !answered &&
    teacherSettings.timerEnabled &&
    currentTeam.jokers.extraTime &&
    (!inFinalPhase || wagerConfirmed);
  const useExtraTime = () => {
    if (!canExtraTime) return;
    soundFX.flip();
    setTimeLeft((t) => t + 15);
    setTeams((prev) =>
      prev.map((t, i) =>
        i === activeTeamIdx
          ? { ...t, jokers: { ...t.jokers, extraTime: false } }
          : t
      )
    );
  };

  if (!currentQuestion) {
    return null;
  }

  const totalSteps = questions.length + (!isRetryMode && finalQuestions.length > 0 ? 1 : 0);
  const currentStep = inFinalPhase ? totalSteps : qIndex + 1;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 space-y-5">
      {/* Live Scoreboard */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {teams.map((team, idx) => {
          const isActive = idx === activeTeamIdx;
          return (
            <div
              key={team.id}
              className={`rounded-xl border p-3.5 transition-colors ${
                isActive
                  ? 'bg-[#EDF6F3] border-2 border-[#0F5C4D]'
                  : 'bg-white border-[#E2DDD3]'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="font-bold text-sm md:text-base text-[#181A1F] truncate">
                  {team.name}
                </span>
                {isActive && (
                  <span className="text-[11px] font-bold text-[#0F5C4D] shrink-0">
                    Növbə
                  </span>
                )}
              </div>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-2xl md:text-3xl font-extrabold text-[#181A1F] tabular-nums">
                  {team.score}
                </span>
                <span className="text-xs text-[#5B5E66] flex items-center gap-1 tabular-nums">
                  {team.streak >= 2 && (
                    <>
                      <Flame className="w-3.5 h-3.5 text-[#B45309]" aria-hidden="true" />
                      <span>{team.streak}</span>
                    </>
                  )}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Literary Map Compact Bar */}
      <LiteraryMap
        activePeriod={currentQuestion.dovr}
        visitedPeriods={visitedPeriods}
        selectedPeriods={selectedPeriods}
        compact
      />

      {/* Main Question Stage */}
      <section className="bg-white border border-[#E2DDD3] rounded-xl p-5 md:p-8 space-y-6">
        {/* Question Header Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#ECE7DD]">
          <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-[#5B5E66]">
            <span className="font-bold text-[#0F5C4D] tabular-nums">
              {inFinalPhase
                ? `Final mərhələsi · ${currentTeam.name}`
                : `Sual ${currentStep} / ${totalSteps}`}
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-semibold text-[#181A1F]">
              {ROUND_LABELS[currentQuestion.nov]}
            </span>
            <span aria-hidden="true">·</span>
            <span>{currentQuestion.dovr}</span>
            <span aria-hidden="true">·</span>
            <span>
              {DIFF_LABELS[currentQuestion.cetinlik]?.label || 'Orta'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {teacherSettings.timerEnabled && (!inFinalPhase || wagerConfirmed) && (
              <div className="flex items-center gap-2">
                <div
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-bold text-base tabular-nums ${
                    timeLeft <= 7 && !answered
                      ? 'bg-[#FEF2F2] border-[#B91C1C] text-[#B91C1C]'
                      : 'bg-[#FAF8F4] border-[#D6D0C4] text-[#181A1F]'
                  }`}
                >
                  <Clock className="w-4 h-4" aria-hidden="true" />
                  <span>{timeLeft} s</span>
                </div>
                {!answered && (
                  <button
                    type="button"
                    onClick={() => setTimerPaused((p) => !p)}
                    title="Taymeri dayandır / davam et (Space)"
                    className="p-2 rounded-lg border border-[#D6D0C4] bg-[#FAF8F4] hover:bg-[#F1EDE4] text-[#181A1F] cursor-pointer min-w-[40px] min-h-[40px] flex items-center justify-center"
                  >
                    {timerPaused ? (
                      <Play className="w-4 h-4" />
                    ) : (
                      <Pause className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>
            )}
            <button
              type="button"
              onClick={onExitGame}
              className="text-xs font-semibold text-[#5B5E66] hover:text-[#181A1F] px-2.5 py-2 cursor-pointer"
            >
              Oyundan çıx
            </button>
          </div>
        </div>

        {/* Final Wager Selection Step */}
        {inFinalPhase && !wagerConfirmed ? (
          <div className="py-4 space-y-6 max-w-2xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 text-sm font-bold text-[#92400E]">
              <Coins className="w-5 h-5" aria-hidden="true" />
              <span>Final mərc mərhələsi</span>
            </div>
            <h2 className="font-literary font-bold text-2xl sm:text-3xl text-[#181A1F]">
              {currentTeam.name}, xalınızın neçə faizini mərcə qoyursunuz?
            </h2>
            <p className="text-base text-[#4A4D54] tabular-nums">
              Cari xalınız: <strong>{currentTeam.score}</strong>{' '}
              {currentTeam.score > 0
                ? `(Seçilən mərc: ${Math.round(
                    (currentTeam.score * wagerPercent) / 100
                  )} xal)`
                : '(Xalınız 0 olduğundan 100 xallıq bonus sualı oynayacaqsınız)'}
            </p>

            {currentTeam.score > 0 && (
              <div className="flex flex-wrap justify-center gap-2.5">
                {[10, 20, 30, 40, 50].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setWagerPercent(pct)}
                    className={`px-5 py-3 rounded-xl border-2 font-bold text-lg tabular-nums cursor-pointer min-h-[52px] ${
                      wagerPercent === pct
                        ? 'bg-[#0F5C4D] text-white border-[#0F5C4D]'
                        : 'bg-[#FAF8F4] text-[#181A1F] border-[#D6D0C4] hover:border-[#0F5C4D]'
                    }`}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            )}

            <div>
              <button
                type="button"
                onClick={() => {
                  soundFX.flip();
                  setWagerConfirmed(true);
                }}
                className="px-7 py-4 rounded-xl bg-[#0F5C4D] hover:bg-[#0B473B] text-white font-bold text-lg cursor-pointer min-h-[56px]"
              >
                Final sualını aç
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Jokers Bar */}
            {!inFinalPhase && (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-[#5B5E66] mr-1">
                    Jokerlər ({currentTeam.name}):
                  </span>
                  <button
                    type="button"
                    disabled={!canFiftyFifty}
                    onClick={useFiftyFifty}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#D6D0C4] bg-[#FAF8F4] hover:bg-[#F1EDE4] disabled:opacity-40 text-xs sm:text-sm font-semibold text-[#181A1F] cursor-pointer disabled:cursor-default min-h-[40px]"
                  >
                    <Scissors className="w-4 h-4 text-[#0F5C4D]" aria-hidden="true" />
                    <span>50/50</span>
                  </button>

                  <button
                    type="button"
                    disabled={!canHint}
                    onClick={useHint}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#D6D0C4] bg-[#FAF8F4] hover:bg-[#F1EDE4] disabled:opacity-40 text-xs sm:text-sm font-semibold text-[#181A1F] cursor-pointer disabled:cursor-default min-h-[40px]"
                  >
                    <Lightbulb className="w-4 h-4 text-[#B45309]" aria-hidden="true" />
                    <span>İpucu (-50% xal)</span>
                  </button>

                  <button
                    type="button"
                    disabled={!canExtraTime}
                    onClick={useExtraTime}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#D6D0C4] bg-[#FAF8F4] hover:bg-[#F1EDE4] disabled:opacity-40 text-xs sm:text-sm font-semibold text-[#181A1F] cursor-pointer disabled:cursor-default min-h-[40px]"
                  >
                    <Clock className="w-4 h-4 text-[#0F5C4D]" aria-hidden="true" />
                    <span>Əlavə vaxt (+15 s)</span>
                  </button>
                </div>

                {currentQuestion.senetkar && (
                  <span className="text-xs sm:text-sm text-[#5B5E66]">
                    {currentQuestion.senetkar}
                    {currentQuestion.eser ? ` · ${currentQuestion.eser}` : ''}
                  </span>
                )}
              </div>
            )}

            {/* Hint callout if joker used */}
            {hintShown && !answered && (
              <div className="p-4 rounded-xl bg-[#FEF8EE] border border-[#EAB308]/50 text-[#78350F] text-sm md:text-base">
                <strong>İpucu:</strong>{' '}
                {currentQuestion.jokerIpucu ||
                  `Bu sual ${
                    currentQuestion.senetkar || currentQuestion.eser || currentQuestion.dovr
                  } mövzusuna aiddir.`}{' '}
                <span className="font-bold">
                  (Dərslik, s. {currentQuestion.sehife})
                </span>
              </div>
            )}

            {/* Large Projector-Friendly Question Text (>= 28px) */}
            <h2
              className={`${
                currentQuestion.nov === 'misra' ? 'font-literary' : ''
              } font-bold text-[28px] md:text-[32px] leading-[1.3] text-[#181A1F]`}
              style={{ textWrap: 'balance' }}
            >
              {currentQuestion.sual}
            </h2>

            {/* Mini-game body */}
            <MiniGameRenderer
              question={currentQuestion}
              joker5050Seq={joker5050Seq}
              answered={answered}
              onSubmitAnswer={handleSubmitAnswer}
              keyboardTrigger={keyboardTrigger}
            />

            {/* Post-answer Feedback Banner */}
            {answered && lastResult && (
              <div
                className={`rounded-xl border-2 p-5 space-y-3 ${
                  lastResult.isCorrect
                    ? 'bg-[#ECFDF3] border-[#15803D] text-[#14532D]'
                    : 'bg-[#FEF2F2] border-[#B91C1C] text-[#7F1D1D]'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    {lastResult.isCorrect ? (
                      <CheckCircle2 className="w-6 h-6 text-[#15803D] shrink-0" />
                    ) : (
                      <XCircle className="w-6 h-6 text-[#B91C1C] shrink-0" />
                    )}
                    <span className="text-xl font-extrabold">
                      {lastResult.timedOut
                        ? 'Vaxt bitdi!'
                        : lastResult.isCorrect
                        ? 'Doğru cavab!'
                        : 'Səhv cavab!'}
                    </span>
                    {lastResult.pointsEarned !== 0 && (
                      <span className="text-base font-bold tabular-nums">
                        ({lastResult.pointsEarned > 0 ? '+' : ''}
                        {lastResult.pointsEarned} xal)
                      </span>
                    )}
                  </div>

                  <span className="text-sm font-bold">
                    Dərslik, s. {currentQuestion.sehife}
                  </span>
                </div>

                {lastResult.bonusText && (
                  <p className="text-sm font-semibold">{lastResult.bonusText}</p>
                )}

                {!lastResult.isCorrect && lastResult.correctText && (
                  <p className="text-base font-bold">
                    Düzgün cavab: {lastResult.correctText}
                  </p>
                )}

                <p className="text-base md:text-lg leading-relaxed">
                  {currentQuestion.izah}
                </p>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleNext}
                    className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#181A1F] hover:bg-[#2E3138] text-white font-bold text-base cursor-pointer min-h-[48px]"
                  >
                    <span>
                      {!inFinalPhase &&
                      qIndex + 1 >= questions.length &&
                      !isRetryMode &&
                      finalQuestions.length > 0
                        ? 'Final mərhələsinə keç'
                        : inFinalPhase && finalTeamIndex + 1 < teams.length
                        ? 'Növbəti komandanın final sualı'
                        : (!inFinalPhase && qIndex + 1 >= questions.length) ||
                          (inFinalPhase && finalTeamIndex + 1 >= teams.length)
                        ? 'Nəticələrə bax'
                        : 'Növbəti sual (Enter)'}
                    </span>
                    <ArrowRight className="w-5 h-5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
};
