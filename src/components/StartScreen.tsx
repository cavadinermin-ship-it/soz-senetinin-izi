import React from 'react';
import { BookOpen, FileDown, Play, Users, User } from 'lucide-react';
import { ALL_PERIODS, LITERARY_STATIONS } from '../data/literaryMap';
import {
  DifficultyLevel,
  GameConfig,
  PeriodName,
  Question,
} from '../types/game';
import { downloadSingleOfflineHtml } from '../utils/exportSingleHtml';
import { LiteraryMap } from './LiteraryMap';

interface StartScreenProps {
  config: GameConfig;
  onChangeConfig: (next: GameConfig) => void;
  availableCount: number;
  totalActiveCount: number;
  onStartGame: () => void;
  allQuestions: Question[];
}

export const StartScreen: React.FC<StartScreenProps> = ({
  config,
  onChangeConfig,
  availableCount,
  totalActiveCount,
  onStartGame,
  allQuestions,
}) => {
  const teamCount = config.teamNames.length;

  const setTeamCount = (count: number) => {
    const defaults = ['Xəmsə', 'Qorqud', 'Səbuhi', 'Vaqif'];
    const nextNames = Array.from({ length: count }, (_, idx) => {
      return config.teamNames[idx]?.trim() || defaults[idx] || `Komanda ${idx + 1}`;
    });
    onChangeConfig({ ...config, mode: 'team', teamNames: nextNames });
  };

  const updateTeamName = (idx: number, val: string) => {
    const next = [...config.teamNames];
    next[idx] = val;
    onChangeConfig({ ...config, teamNames: next });
  };

  const togglePeriod = (period: PeriodName) => {
    const exists = config.periods.includes(period);
    if (exists && config.periods.length === 1) return; // At least 1 must stay selected
    const next = exists
      ? config.periods.filter((p) => p !== period)
      : [...config.periods, period];
    onChangeConfig({ ...config, periods: next });
  };

  const selectAllPeriods = () => {
    onChangeConfig({ ...config, periods: [...ALL_PERIODS] });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 md:py-8 space-y-6">
      {/* Hero Header Card */}
      <section className="bg-white border border-[#E2DDD3] rounded-xl p-6 md:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="max-w-3xl space-y-2">
            <div className="flex items-center gap-2 text-xs md:text-sm font-medium text-[#0F5C4D]">
              <BookOpen className="w-4 h-4" aria-hidden="true" />
              <span>X sinif Azərbaycan ədəbiyyatı · «Ədəbiyyat – 10» dərsliyi</span>
            </div>
            <h1
              className="font-literary font-bold text-3xl sm:text-4xl md:text-5xl text-[#181A1F] tracking-tight"
              style={{ textWrap: 'balance' }}
            >
              Söz sənətimizin izi ilə
            </h1>
            <p className="text-base md:text-lg text-[#4A4D54] leading-relaxed">
              Sinifdə proyektor və ya ağıllı lövhədə komanda yarışı, evdə isə fərdi məşq üçün 8 fərqli
              mini-oyundan ibarət interaktiv ədəbiyyat səyahəti.
            </p>
          </div>

          <div className="flex flex-col items-start lg:items-end gap-2 shrink-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={onStartGame}
                disabled={availableCount === 0}
                className="inline-flex items-center justify-center gap-2.5 px-7 py-4 rounded-xl bg-[#0F5C4D] hover:bg-[#0B473B] disabled:opacity-50 text-white font-bold text-lg shadow-sm transition-colors cursor-pointer whitespace-nowrap min-h-[56px]"
              >
                <Play className="w-5 h-5 fill-current" aria-hidden="true" />
                <span>Oyuna başla</span>
              </button>
              <button
                type="button"
                onClick={() => downloadSingleOfflineHtml(allQuestions)}
                className="inline-flex items-center justify-center gap-2 px-4 py-4 rounded-xl border border-[#D6D0C4] bg-[#FAF8F4] hover:bg-[#F1EDE4] text-[#181A1F] font-semibold text-sm transition-colors cursor-pointer whitespace-nowrap min-h-[56px]"
              >
                <FileDown className="w-4 h-4 text-[#0F5C4D]" aria-hidden="true" />
                <span>Tək HTML yüklə</span>
              </button>
            </div>
            <p className="text-xs text-[#5B5E66] tabular-nums">
              Seçilən parametrlər üzrə hazır sual: <strong className="text-[#181A1F]">{availableCount}</strong> / {totalActiveCount}
            </p>
          </div>
        </div>
      </section>

      {/* Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left: Mode & Teams */}
        <section className="lg:col-span-5 bg-white border border-[#E2DDD3] rounded-xl p-5 md:p-6 flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <h2 className="font-literary font-bold text-xl text-[#181A1F]">
              1. Oyun rejimi və komandalar
            </h2>

            <div className="grid grid-cols-2 gap-2 p-1 bg-[#F1EDE4] rounded-lg">
              <button
                type="button"
                onClick={() => onChangeConfig({ ...config, mode: 'team' })}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-md text-sm font-semibold transition-colors cursor-pointer min-h-[44px] ${
                  config.mode === 'team'
                    ? 'bg-white text-[#181A1F] shadow-sm'
                    : 'text-[#5B5E66] hover:text-[#181A1F]'
                }`}
              >
                <Users className="w-4 h-4" aria-hidden="true" />
                <span>Komanda yarışı</span>
              </button>
              <button
                type="button"
                onClick={() => onChangeConfig({ ...config, mode: 'solo' })}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-md text-sm font-semibold transition-colors cursor-pointer min-h-[44px] ${
                  config.mode === 'solo'
                    ? 'bg-white text-[#181A1F] shadow-sm'
                    : 'text-[#5B5E66] hover:text-[#181A1F]'
                }`}
              >
                <User className="w-4 h-4" aria-hidden="true" />
                <span>Fərdi məşq</span>
              </button>
            </div>

            {config.mode === 'team' ? (
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[#3B3E45]">
                    Komanda sayı
                  </span>
                  <div className="flex items-center gap-1.5">
                    {[2, 3, 4].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setTeamCount(num)}
                        className={`w-10 h-10 rounded-lg font-bold text-sm tabular-nums border transition-colors cursor-pointer ${
                          teamCount === num
                            ? 'bg-[#0F5C4D] text-white border-[#0F5C4D]'
                            : 'bg-[#FAF8F4] text-[#3B3E45] border-[#E2DDD3] hover:border-[#0F5C4D]'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  {config.teamNames.map((tName, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-md bg-[#F1EDE4] text-[#3B3E45] text-xs font-bold flex items-center justify-center tabular-nums shrink-0">
                        {idx + 1}
                      </span>
                      <input
                        type="text"
                        value={tName}
                        maxLength={24}
                        onChange={(e) => updateTeamName(idx, e.target.value)}
                        aria-label={`${idx + 1}-ci komandanın adı`}
                        placeholder={`${idx + 1}-ci komandanın adı`}
                        className="w-full px-3 py-2 rounded-lg border border-[#D6D0C4] bg-[#FAF8F4] text-sm font-medium text-[#181A1F] focus:outline-none focus:border-[#0F5C4D]"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-[#FAF8F4] border border-[#E2DDD3] text-sm text-[#4A4D54] leading-relaxed">
                Fərdi məşq rejimində suallara ardıcıl cavab verir, hər sualdan sonra izah və dərslik
                səhifəsini görür, yekunda isə səhvlərinizi təkrar edə bilirsiniz.
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-[#ECE7DD] text-xs text-[#5B5E66] leading-relaxed">
            Klaviatura qısayolları: <strong>1–4</strong> variant seçimi · <strong>Enter</strong>{' '}
            növbəti sual · <strong>Space</strong> taymeri dayandırır.
          </div>
        </section>

        {/* Right: Direction, Periods, Difficulty, Count */}
        <section className="lg:col-span-7 bg-white border border-[#E2DDD3] rounded-xl p-5 md:p-6 space-y-5">
          <h2 className="font-literary font-bold text-xl text-[#181A1F]">
            2. Mövzu, dövr və çətinlik seçimi
          </h2>

          {/* İstiqamət */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-[#3B3E45]">
              İstiqamət
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['Qarışıq', 'Əsərlər', 'Sənətkarlar'] as const).map((dir) => (
                <button
                  key={dir}
                  type="button"
                  onClick={() => onChangeConfig({ ...config, direction: dir })}
                  className={`py-2.5 px-3 rounded-lg border text-sm font-semibold transition-colors cursor-pointer min-h-[44px] ${
                    config.direction === dir
                      ? 'bg-[#0F5C4D] text-white border-[#0F5C4D]'
                      : 'bg-[#FAF8F4] text-[#3B3E45] border-[#E2DDD3] hover:border-[#0F5C4D]'
                  }`}
                >
                  {dir}
                </button>
              ))}
            </div>
          </div>

          {/* Dövr seçimi */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <label className="block text-sm font-semibold text-[#3B3E45]">
                Dövr seçimi (bir neçəsi seçilə bilər)
              </label>
              <button
                type="button"
                onClick={selectAllPeriods}
                className="text-xs font-semibold text-[#0F5C4D] hover:underline cursor-pointer"
              >
                Hamısını seç
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {LITERARY_STATIONS.map((st) => {
                const selected = config.periods.includes(st.period);
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => togglePeriod(st.period)}
                    aria-pressed={selected}
                    className={`text-left px-3.5 py-2.5 rounded-lg border text-sm font-medium transition-colors cursor-pointer flex items-center justify-between gap-2 min-h-[44px] ${
                      selected
                        ? 'bg-[#EDF6F3] border-[#0F5C4D] text-[#181A1F]'
                        : 'bg-[#FAF8F4] border-[#E2DDD3] text-[#5B5E66] hover:border-[#B8B2A6]'
                    }`}
                  >
                    <span className="truncate">{st.period}</span>
                    <span
                      className={`w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold shrink-0 ${
                        selected
                          ? 'bg-[#0F5C4D] text-white'
                          : 'border border-[#C9C3B6] bg-white'
                      }`}
                    >
                      {selected ? '✓' : ''}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Çətinlik və Sual sayı */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-[#3B3E45]">
                Çətinlik səviyyəsi
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    { id: 'qarisiq', label: 'Qarışıq' },
                    { id: 'asan', label: 'Asan' },
                    { id: 'orta', label: 'Orta' },
                    { id: 'cetin', label: 'Çətin' },
                  ] as { id: DifficultyLevel | 'qarisiq'; label: string }[]
                ).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() =>
                      onChangeConfig({ ...config, difficulty: item.id })
                    }
                    className={`py-2 px-3 rounded-lg border text-sm font-semibold transition-colors cursor-pointer min-h-[42px] ${
                      config.difficulty === item.id
                        ? 'bg-[#0F5C4D] text-white border-[#0F5C4D]'
                        : 'bg-[#FAF8F4] text-[#3B3E45] border-[#E2DDD3] hover:border-[#0F5C4D]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-[#3B3E45]">
                Sual sayı
              </label>
              <div className="grid grid-cols-3 gap-2">
                {([10, 20, 30] as const).map((cnt) => (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() =>
                      onChangeConfig({ ...config, questionCount: cnt })
                    }
                    className={`py-2 px-3 rounded-lg border text-sm font-bold tabular-nums transition-colors cursor-pointer min-h-[42px] ${
                      config.questionCount === cnt
                        ? 'bg-[#0F5C4D] text-white border-[#0F5C4D]'
                        : 'bg-[#FAF8F4] text-[#3B3E45] border-[#E2DDD3] hover:border-[#0F5C4D]'
                    }`}
                  >
                    {cnt}
                  </button>
                ))}
              </div>
              <p className="text-xs text-[#5B5E66]">
                Sonuncu sual final mərc raundu kimi təqdim olunur.
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* Literary Map Preview */}
      <LiteraryMap selectedPeriods={config.periods} />
    </div>
  );
};
