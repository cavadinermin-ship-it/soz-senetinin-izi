import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Eye,
  HelpCircle,
  Link2,
  XCircle,
} from 'lucide-react';
import { Question } from '../types/game';
import { soundFX } from '../utils/sound';

export function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

interface MiniGameProps {
  question: Question;
  joker5050Seq: number;
  answered: boolean;
  onSubmitAnswer: (isCorrect: boolean, customPoints?: number, revealedText?: string) => void;
  keyboardTrigger?: { key: string; seq: number } | null;
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D'];

export const MiniGameRenderer: React.FC<MiniGameProps> = ({
  question,
  joker5050Seq,
  answered,
  onSubmitAnswer,
  keyboardTrigger,
}) => {
  // Shuffle options for choice-based questions once per question instance
  const choiceData = useMemo(() => {
    const vars = question.variantlar || [];
    const correctIdx = question.duzgun ?? 0;
    const indexed = vars.map((text, idx) => ({
      text,
      isCorrect: idx === correctIdx,
    }));
    const shuffled = shuffleArray(indexed);
    return {
      options: shuffled,
      correctIndex: shuffled.findIndex((o) => o.isCorrect),
    };
  }, [question.id, question.variantlar, question.duzgun]);

  // State for "Kimdir bu sənətkar?" (ipucu-kart)
  const [revealedClues, setRevealedClues] = useState<number>(1);
  const [selectedChoiceIdx, setSelectedChoiceIdx] = useState<number | null>(null);
  const [selectedBool, setSelectedBool] = useState<boolean | null>(null);
  const [eliminatedIndices, setEliminatedIndices] = useState<number[]>([]);

  // State for "Uyğunlaşdır"
  const shuffledRight = useMemo(() => {
    if (!question.cutler) return [];
    let items = shuffleArray(question.cutler.map((c) => c.right));
    if (
      items.length > 1 &&
      items.every((val, i) => val === question.cutler![i].right)
    ) {
      items = [...items.slice(1), items[0]];
    }
    return items;
  }, [question.id, question.cutler]);

  const [selectedLeftIdx, setSelectedLeftIdx] = useState<number | null>(null);
  const [matches, setMatches] = useState<Record<number, string>>({});
  const [dragRightVal, setDragRightVal] = useState<string | null>(null);

  // State for "Zaman lenti" & "Süjet zənciri"
  const [orderedItems, setOrderedItems] = useState<string[]>([]);
  const [swapSelectedIdx, setSwapSelectedIdx] = useState<number | null>(null);
  const [dragOrderIdx, setDragOrderIdx] = useState<number | null>(null);

  useEffect(() => {
    setRevealedClues(1);
    setSelectedChoiceIdx(null);
    setSelectedBool(null);
    setSelectedLeftIdx(null);
    setMatches({});
    setSwapSelectedIdx(null);
    setDragOrderIdx(null);
    setDragRightVal(null);
    setEliminatedIndices([]);

    if (question.ardicilliq && question.ardicilliq.length > 0) {
      let shuffled = shuffleArray(question.ardicilliq);
      if (
        shuffled.length > 1 &&
        shuffled.every((v, idx) => v === question.ardicilliq![idx])
      ) {
        shuffled = [...shuffled.slice(1), shuffled[0]];
      }
      setOrderedItems(shuffled);
    } else {
      setOrderedItems([]);
    }
  }, [question.id, question.ardicilliq]);

  // Trigger 50/50 joker cleanly on shuffled options
  useEffect(() => {
    if (joker5050Seq === 0) return;
    const wrongIndices = choiceData.options
      .map((opt, idx) => (opt.isCorrect ? -1 : idx))
      .filter((idx) => idx !== -1);
    const toEliminate = shuffleArray(wrongIndices).slice(0, 2);
    setEliminatedIndices(toEliminate);
  }, [joker5050Seq, choiceData]);

  // Handle keyboard shortcuts 1-4 from parent
  useEffect(() => {
    if (!keyboardTrigger || answered) return;
    const k = keyboardTrigger.key;
    if (
      question.nov === 'test' ||
      question.nov === 'misra' ||
      question.nov === 'ipucu-kart' ||
      question.nov === 'final'
    ) {
      const idx = ['1', '2', '3', '4'].indexOf(k);
      if (
        idx >= 0 &&
        idx < choiceData.options.length &&
        !eliminatedIndices.includes(idx)
      ) {
        handleChoiceClick(idx);
      }
    } else if (question.nov === 'dogru-yanlis') {
      if (k === '1') handleBoolClick(true);
      if (k === '2') handleBoolClick(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyboardTrigger]);

  const handleChoiceClick = (idx: number) => {
    if (answered || eliminatedIndices.includes(idx)) return;
    setSelectedChoiceIdx(idx);
    const chosen = choiceData.options[idx];
    const correctOption = choiceData.options[choiceData.correctIndex]?.text || '';
    if (question.nov === 'ipucu-kart') {
      const clueScores = [400, 300, 200, 100];
      const pts = clueScores[Math.min(revealedClues - 1, 3)];
      onSubmitAnswer(chosen.isCorrect, chosen.isCorrect ? pts : 0, correctOption);
    } else {
      onSubmitAnswer(chosen.isCorrect, undefined, correctOption);
    }
  };

  const handleBoolClick = (val: boolean) => {
    if (answered) return;
    setSelectedBool(val);
    const correctAnswerText = question.dogruMu ? 'Doğru' : 'Yanlış';
    onSubmitAnswer(val === Boolean(question.dogruMu), undefined, correctAnswerText);
  };

  // Matching handlers (drag & drop + two-click)
  const assignMatch = (leftIdx: number, rightVal: string) => {
    if (answered) return;
    soundFX.click();
    setMatches((prev) => {
      const next = { ...prev };
      // Remove rightVal if it was already assigned elsewhere
      for (const key of Object.keys(next)) {
        if (next[Number(key)] === rightVal) {
          delete next[Number(key)];
        }
      }
      next[leftIdx] = rightVal;
      return next;
    });
    setSelectedLeftIdx(null);
  };

  const handleLeftClick = (leftIdx: number) => {
    if (answered) return;
    if (matches[leftIdx]) {
      // Unmatch on click if already matched and no new selection
      setMatches((prev) => {
        const next = { ...prev };
        delete next[leftIdx];
        return next;
      });
      setSelectedLeftIdx(leftIdx);
      soundFX.click();
      return;
    }
    setSelectedLeftIdx(leftIdx === selectedLeftIdx ? null : leftIdx);
    soundFX.click();
  };

  const handleRightClick = (rightVal: string) => {
    if (answered) return;
    if (selectedLeftIdx !== null) {
      assignMatch(selectedLeftIdx, rightVal);
    } else if (question.cutler) {
      // Auto-select first unmatched left slot if user taps right first
      const firstEmpty = question.cutler.findIndex((_, i) => !matches[i]);
      if (firstEmpty !== -1) {
        assignMatch(firstEmpty, rightVal);
      }
    }
  };

  const submitMatching = () => {
    if (answered || !question.cutler) return;
    const allMatched = question.cutler.every((_, idx) => Boolean(matches[idx]));
    if (!allMatched) return;
    const isAllCorrect = question.cutler.every(
      (pair, idx) => matches[idx] === pair.right
    );
    const summary = question.cutler.map((c) => `${c.left} → ${c.right}`).join(' · ');
    onSubmitAnswer(isAllCorrect, undefined, summary);
  };

  // Ordering handlers (up/down buttons + tap-to-swap + drag-and-drop)
  const moveOrderItem = (idx: number, dir: -1 | 1) => {
    if (answered) return;
    const target = idx + dir;
    if (target < 0 || target >= orderedItems.length) return;
    soundFX.click();
    setOrderedItems((prev) => {
      const next = [...prev];
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
    setSwapSelectedIdx(null);
  };

  const handleOrderCardTap = (idx: number) => {
    if (answered) return;
    if (swapSelectedIdx === null) {
      setSwapSelectedIdx(idx);
      soundFX.click();
    } else if (swapSelectedIdx === idx) {
      setSwapSelectedIdx(null);
    } else {
      soundFX.click();
      setOrderedItems((prev) => {
        const next = [...prev];
        [next[swapSelectedIdx], next[idx]] = [next[idx], next[swapSelectedIdx]];
        return next;
      });
      setSwapSelectedIdx(null);
    }
  };

  const handleOrderDrop = (dropIdx: number) => {
    if (answered || dragOrderIdx === null || dragOrderIdx === dropIdx) return;
    soundFX.click();
    setOrderedItems((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragOrderIdx, 1);
      next.splice(dropIdx, 0, moved);
      return next;
    });
    setDragOrderIdx(null);
  };

  const submitOrdering = () => {
    if (answered || !question.ardicilliq) return;
    const isAllCorrect = orderedItems.every(
      (item, idx) => item === question.ardicilliq![idx]
    );
    const summary = question.ardicilliq.map((it, i) => `${i + 1}) ${it}`).join(' → ');
    onSubmitAnswer(isAllCorrect, undefined, summary);
  };

  // -------------------------------------------------------------------------
  // RENDER BY ROUND TYPE
  // -------------------------------------------------------------------------

  // 1) "Kimdir bu sənətkar?" (ipucu-kart)
  if (question.nov === 'ipucu-kart') {
    const clues = question.ipuclari || [];
    const clueScores = [400, 300, 200, 100];
    const currentPotential = clueScores[Math.min(revealedClues - 1, 3)];

    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-medium text-[#5B5E66]">
            İpucları çətindən asana doğru açılır. Nə qədər tez tapsanız, bir o qədər çox xal qazanırsınız.
          </p>
          <span className="text-sm font-bold text-[#0F5C4D] tabular-nums">
            Cari mümkün xal: {currentPotential} xal
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {clues.map((clue, idx) => {
            const isOpen = idx < revealedClues || answered;
            return (
              <div
                key={idx}
                className={`rounded-xl border p-4 transition-colors ${
                  isOpen
                    ? 'bg-[#FAF8F4] border-[#0F5C4D]/40 text-[#181A1F]'
                    : 'bg-[#F1EDE4] border-[#E2DDD3] text-[#7A7D85]'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold mb-1.5 tabular-nums">
                  <span>{idx + 1}-ci ipucu</span>
                  <span>{clueScores[idx]} xal</span>
                </div>
                {isOpen ? (
                  <p className="text-base md:text-lg font-medium leading-snug">
                    {clue}
                  </p>
                ) : (
                  <p className="text-sm italic">Bağlıdır — açmaq üçün aşağıdakı düyməni sıxın</p>
                )}
              </div>
            );
          })}
        </div>

        {!answered && revealedClues < clues.length && (
          <div>
            <button
              type="button"
              onClick={() => {
                soundFX.flip();
                setRevealedClues((c) => Math.min(clues.length, c + 1));
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#B45309] bg-[#FEF8EE] hover:bg-[#FDEFD6] text-[#92400E] font-semibold text-sm cursor-pointer min-h-[44px]"
            >
              <Eye className="w-4 h-4" aria-hidden="true" />
              <span>
                Növbəti ipucunu aç ({clueScores[revealedClues]} xal olacaq)
              </span>
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {choiceData.options.map((opt, idx) => {
            const eliminated = eliminatedIndices.includes(idx);
            const isSelected = selectedChoiceIdx === idx;
            const showCorrect = answered && opt.isCorrect;
            const showWrong = answered && isSelected && !opt.isCorrect;

            return (
              <button
                key={idx}
                type="button"
                disabled={answered || eliminated}
                onClick={() => handleChoiceClick(idx)}
                className={`text-left p-4 md:p-5 rounded-xl border-2 transition-colors flex items-center gap-3.5 min-h-[64px] cursor-pointer disabled:cursor-default ${
                  eliminated
                    ? 'opacity-30 bg-[#F5F3EE] border-[#E2DDD3] line-through'
                    : showCorrect
                    ? 'bg-[#ECFDF3] border-[#15803D] text-[#14532D]'
                    : showWrong
                    ? 'bg-[#FEF2F2] border-[#B91C1C] text-[#7F1D1D]'
                    : 'bg-white border-[#D6D0C4] hover:border-[#0F5C4D] hover:bg-[#FAF8F4] text-[#181A1F]'
                }`}
              >
                <span className="w-9 h-9 rounded-lg bg-[#F1EDE4] text-[#181A1F] font-bold text-base flex items-center justify-center shrink-0 tabular-nums">
                  {OPTION_LETTERS[idx]}
                </span>
                <span className="text-lg md:text-xl font-semibold leading-snug flex-1">
                  {opt.text}
                </span>
                {showCorrect && <CheckCircle2 className="w-6 h-6 text-[#15803D] shrink-0" />}
                {showWrong && <XCircle className="w-6 h-6 text-[#B91C1C] shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // 2) "Doğru, yoxsa yanlış?"
  if (question.nov === 'dogru-yanlis') {
    const buttons: { val: boolean; label: string; keyHint: string }[] = [
      { val: true, label: 'Doğru', keyHint: '1' },
      { val: false, label: 'Yanlış', keyHint: '2' },
    ];
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
        {buttons.map((b) => {
          const isCorrectChoice = Boolean(question.dogruMu) === b.val;
          const isSelected = selectedBool === b.val;
          const showCorrect = answered && isCorrectChoice;
          const showWrong = answered && isSelected && !isCorrectChoice;

          return (
            <button
              key={b.label}
              type="button"
              disabled={answered}
              onClick={() => handleBoolClick(b.val)}
              className={`p-6 rounded-xl border-2 transition-colors flex items-center justify-between gap-4 min-h-[84px] cursor-pointer disabled:cursor-default ${
                showCorrect
                  ? 'bg-[#ECFDF3] border-[#15803D] text-[#14532D]'
                  : showWrong
                  ? 'bg-[#FEF2F2] border-[#B91C1C] text-[#7F1D1D]'
                  : 'bg-white border-[#D6D0C4] hover:border-[#0F5C4D] hover:bg-[#FAF8F4] text-[#181A1F]'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-lg bg-[#F1EDE4] text-[#181A1F] font-bold text-base flex items-center justify-center tabular-nums">
                  {b.keyHint}
                </span>
                <span className="text-2xl font-bold">{b.label}</span>
              </div>
              {showCorrect && <CheckCircle2 className="w-7 h-7 text-[#15803D]" />}
              {showWrong && <XCircle className="w-7 h-7 text-[#B91C1C]" />}
            </button>
          );
        })}
      </div>
    );
  }

  // 3) "Uyğunlaşdır"
  if (question.nov === 'uygunlasdir' && question.cutler) {
    const usedRights = new Set(Object.values(matches));
    const allMatched = question.cutler.every((_, i) => Boolean(matches[i]));

    return (
      <div className="space-y-5">
        <p className="text-sm text-[#5B5E66] flex items-center gap-2">
          <Link2 className="w-4 h-4 text-[#0F5C4D] shrink-0" aria-hidden="true" />
          <span>
            Soldan bir bəndi seçib sağdan uyğun cavaba klikləyin və ya sağdakı kartı soldakı xananın üzərinə sürüşdürün.
          </span>
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left column */}
          <div className="space-y-2.5">
            {question.cutler.map((pair, idx) => {
              const matchedVal = matches[idx];
              const isSelected = selectedLeftIdx === idx;
              const isCorrectPair = answered && matchedVal === pair.right;
              const isWrongPair = answered && matchedVal !== pair.right;

              return (
                <div
                  key={idx}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    if (dragRightVal) {
                      assignMatch(idx, dragRightVal);
                      setDragRightVal(null);
                    }
                  }}
                >
                  <button
                    type="button"
                    disabled={answered}
                    onClick={() => handleLeftClick(idx)}
                    className={`w-full text-left p-3.5 rounded-xl border-2 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2 min-h-[60px] cursor-pointer disabled:cursor-default ${
                      isCorrectPair
                        ? 'bg-[#ECFDF3] border-[#15803D] text-[#14532D]'
                        : isWrongPair
                        ? 'bg-[#FEF2F2] border-[#B91C1C] text-[#7F1D1D]'
                        : isSelected
                        ? 'bg-[#EDF6F3] border-[#0F5C4D] text-[#181A1F]'
                        : 'bg-white border-[#D6D0C4] hover:border-[#0F5C4D] text-[#181A1F]'
                    }`}
                  >
                    <span className="font-bold text-base md:text-lg">{pair.left}</span>
                    <span
                      className={`text-sm font-semibold px-2.5 py-1 rounded-md border ${
                        matchedVal
                          ? 'bg-[#FAF8F4] border-[#C9C3B6] text-[#181A1F]'
                          : 'bg-[#F5F3EE] border-dashed border-[#C9C3B6] text-[#7A7D85]'
                      }`}
                    >
                      {matchedVal || 'Cavab seçin'}
                    </span>
                  </button>
                  {answered && isWrongPair && (
                    <div className="text-xs font-semibold text-[#15803D] mt-1 pl-1">
                      Düzgün qarşılıq: {pair.right}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Right column */}
          <div className="space-y-2.5">
            {shuffledRight.map((rightVal, idx) => {
              const isUsed = usedRights.has(rightVal);
              return (
                <button
                  key={idx}
                  type="button"
                  draggable={!answered}
                  onDragStart={() => setDragRightVal(rightVal)}
                  onDragEnd={() => setDragRightVal(null)}
                  disabled={answered}
                  onClick={() => handleRightClick(rightVal)}
                  className={`w-full text-left p-3.5 rounded-xl border-2 transition-colors min-h-[60px] flex items-center justify-between gap-2 cursor-pointer disabled:cursor-default ${
                    isUsed
                      ? 'bg-[#F1EDE4] border-[#D6D0C4] text-[#6E717A] opacity-65'
                      : 'bg-[#FAF8F4] border-[#D6D0C4] hover:border-[#0F5C4D] hover:bg-white text-[#181A1F]'
                  }`}
                >
                  <span className="text-base md:text-lg font-semibold">
                    {rightVal}
                  </span>
                  <span className="text-xs font-medium text-[#5B5E66]">
                    {isUsed ? 'Seçilib' : 'Uyğunlaşdır'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {!answered && (
          <div className="pt-2">
            <button
              type="button"
              disabled={!allMatched}
              onClick={submitMatching}
              className="px-6 py-3.5 rounded-xl bg-[#0F5C4D] hover:bg-[#0B473B] disabled:opacity-45 text-white font-bold text-base transition-colors cursor-pointer min-h-[48px]"
            >
              Cavabı yoxla
            </button>
          </div>
        )}
      </div>
    );
  }

  // 4) "Zaman lenti" & "Süjet zənciri"
  if (
    (question.nov === 'zaman-lenti' || question.nov === 'sujet-zenciri') &&
    question.ardicilliq
  ) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-[#5B5E66]">
          Kartları düzgün xronoloji ardıcıllığa gətirin (yuxarı/aşağı düymələri ilə, sürüşdürərək və ya iki kartın üzərinə ardıcıl toxunaraq yerini dəyişin).
        </p>

        <div className="space-y-2.5">
          {orderedItems.map((item, idx) => {
            const isCorrectPos = answered && item === question.ardicilliq![idx];
            const isWrongPos = answered && item !== question.ardicilliq![idx];
            const isSwapSelected = swapSelectedIdx === idx;

            return (
              <div
                key={item}
                draggable={!answered}
                onDragStart={() => setDragOrderIdx(idx)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleOrderDrop(idx)}
                className={`rounded-xl border-2 p-3.5 flex items-center justify-between gap-3 transition-colors ${
                  isCorrectPos
                    ? 'bg-[#ECFDF3] border-[#15803D] text-[#14532D]'
                    : isWrongPos
                    ? 'bg-[#FEF2F2] border-[#B91C1C] text-[#7F1D1D]'
                    : isSwapSelected
                    ? 'bg-[#EDF6F3] border-[#0F5C4D] text-[#181A1F]'
                    : 'bg-white border-[#D6D0C4] text-[#181A1F]'
                }`}
              >
                <button
                  type="button"
                  disabled={answered}
                  onClick={() => handleOrderCardTap(idx)}
                  className="flex items-center gap-3 text-left flex-1 cursor-pointer disabled:cursor-default min-h-[44px]"
                >
                  <span className="w-8 h-8 rounded-lg bg-[#F1EDE4] text-[#181A1F] font-bold text-sm flex items-center justify-center shrink-0 tabular-nums">
                    {idx + 1}
                  </span>
                  <span className="text-base md:text-lg font-semibold leading-snug">
                    {item}
                  </span>
                </button>

                {!answered && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => moveOrderItem(idx, -1)}
                      aria-label="Yuxarı qaldır"
                      className="w-10 h-10 rounded-lg border border-[#D6D0C4] bg-[#FAF8F4] hover:bg-[#F1EDE4] disabled:opacity-35 flex items-center justify-center cursor-pointer"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === orderedItems.length - 1}
                      onClick={() => moveOrderItem(idx, 1)}
                      aria-label="Aşağı endir"
                      className="w-10 h-10 rounded-lg border border-[#D6D0C4] bg-[#FAF8F4] hover:bg-[#F1EDE4] disabled:opacity-35 flex items-center justify-center cursor-pointer"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {!answered && (
          <div className="pt-2">
            <button
              type="button"
              onClick={submitOrdering}
              className="px-6 py-3.5 rounded-xl bg-[#0F5C4D] hover:bg-[#0B473B] text-white font-bold text-base transition-colors cursor-pointer min-h-[48px]"
            >
              Ardıcıllığı yoxla
            </button>
          </div>
        )}
      </div>
    );
  }

  // 5) "Test", "Misra kimindir?", and "Final sualı" (4 options)
  return (
    <div className="space-y-4">
      {question.nov === 'misra' && (
        <div className="flex items-center gap-2 text-xs font-semibold text-[#92400E]">
          <HelpCircle className="w-4 h-4" aria-hidden="true" />
          <span>Misra və ya sitat dərslikdən olduğu kimi təqdim edilir</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {choiceData.options.map((opt, idx) => {
          const eliminated = eliminatedIndices.includes(idx);
          const isSelected = selectedChoiceIdx === idx;
          const showCorrect = answered && opt.isCorrect;
          const showWrong = answered && isSelected && !opt.isCorrect;

          return (
            <button
              key={idx}
              type="button"
              disabled={answered || eliminated}
              onClick={() => handleChoiceClick(idx)}
              className={`text-left p-4 md:p-5 rounded-xl border-2 transition-colors flex items-center gap-3.5 min-h-[70px] cursor-pointer disabled:cursor-default ${
                eliminated
                  ? 'opacity-30 bg-[#F5F3EE] border-[#E2DDD3] line-through'
                  : showCorrect
                  ? 'bg-[#ECFDF3] border-[#15803D] text-[#14532D]'
                  : showWrong
                  ? 'bg-[#FEF2F2] border-[#B91C1C] text-[#7F1D1D]'
                  : 'bg-white border-[#D6D0C4] hover:border-[#0F5C4D] hover:bg-[#FAF8F4] text-[#181A1F]'
              }`}
            >
              <span className="w-10 h-10 rounded-lg bg-[#F1EDE4] text-[#181A1F] font-bold text-base flex items-center justify-center shrink-0 tabular-nums">
                {OPTION_LETTERS[idx]}
              </span>
              <span className="text-lg md:text-xl font-semibold leading-snug flex-1">
                {opt.text}
              </span>
              {showCorrect && <CheckCircle2 className="w-6 h-6 text-[#15803D] shrink-0" />}
              {showWrong && <XCircle className="w-6 h-6 text-[#B91C1C] shrink-0" />}
            </button>
          );
        })}
      </div>
    </div>
  );
};
