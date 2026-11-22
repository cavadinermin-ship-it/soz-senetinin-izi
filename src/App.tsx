import { useEffect, useMemo, useState } from 'react';
import {
  FileDown,
  GraduationCap,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { ALL_PERIODS } from './data/literaryMap';
import {
  BASE_QUESTION_BANK,
  loadQuestionBank,
  loadTeacherSettings,
  saveCustomQuestions,
  saveDisabledQuestionIds,
  saveTeacherSettings,
} from './data/questionBank';
import {
  AnswerRecord,
  GameConfig,
  Question,
  Team,
  TeacherSettings,
} from './types/game';
import { shuffleArray } from './components/MiniGames';
import { StartScreen } from './components/StartScreen';
import { GamePlay } from './components/GamePlay';
import { EndScreen } from './components/EndScreen';
import { TeacherPanel } from './components/TeacherPanel';
import { soundFX } from './utils/sound';
import { downloadSingleOfflineHtml } from './utils/exportSingleHtml';

export default function App() {
  const [questions, setQuestions] = useState<Question[]>(() =>
    loadQuestionBank()
  );
  const [teacherSettings, setTeacherSettings] = useState<TeacherSettings>(() =>
    loadTeacherSettings()
  );
  const [teacherOpen, setTeacherOpen] = useState(false);

  const [config, setConfig] = useState<GameConfig>(() => ({
    mode: 'team',
    teamNames: ['Xəmsə', 'Qorqud'],
    direction: 'Qarışıq',
    periods: [...ALL_PERIODS],
    difficulty: 'qarisiq',
    questionCount: loadTeacherSettings().defaultQuestionCount,
  }));

  const [screen, setScreen] = useState<'start' | 'play' | 'end'>('start');
  const [activeGameQuestions, setActiveGameQuestions] = useState<Question[]>(
    []
  );
  const [activeFinalQuestions, setActiveFinalQuestions] = useState<Question[]>(
    []
  );
  const [activeTeams, setActiveTeams] = useState<Team[]>([]);
  const [isRetryMode, setIsRetryMode] = useState(false);
  const [endTeams, setEndTeams] = useState<Team[]>([]);
  const [endRecords, setEndRecords] = useState<AnswerRecord[]>([]);

  useEffect(() => {
    soundFX.setMuted(!teacherSettings.soundEnabled);
  }, [teacherSettings.soundEnabled]);

  const totalActiveCount = useMemo(
    () => questions.filter((q) => q.aktiv !== false).length,
    [questions]
  );

  const filteredPool = useMemo(() => {
    return questions.filter((q) => {
      if (q.aktiv === false) return false;
      if (q.nov === 'final') return false;
      if (!config.periods.includes(q.dovr)) return false;
      if (config.direction !== 'Qarışıq' && q.istiqamet !== config.direction) {
        return false;
      }
      if (config.difficulty !== 'qarisiq' && q.cetinlik !== config.difficulty) {
        return false;
      }
      return true;
    });
  }, [questions, config]);

  const buildRoundSelection = (pool: Question[], count: number): Question[] => {
    // Prioritize diverse mini-game types so players experience all round types cleanly
    const shuffled = shuffleArray(pool);
    const priorityTypes = [
      'ipucu-kart',
      'test',
      'dogru-yanlis',
      'uygunlasdir',
      'zaman-lenti',
      'sujet-zenciri',
      'misra',
    ];
    const picked: Question[] = [];
    const usedIds = new Set<string>();

    // Pick at least 1 of each available type first
    for (const rType of priorityTypes) {
      if (picked.length >= count) break;
      const found = shuffled.find((q) => q.nov === rType && !usedIds.has(q.id));
      if (found) {
        picked.push(found);
        usedIds.add(found.id);
      }
    }

    // Fill the remainder randomly without duplicates
    for (const q of shuffled) {
      if (picked.length >= count) break;
      if (!usedIds.has(q.id)) {
        picked.push(q);
        usedIds.add(q.id);
      }
    }

    // Shuffle final order so round types alternate unpredictably
    return shuffleArray(picked);
  };

  const buildTeams = (): Team[] => {
    if (config.mode === 'solo') {
      return [
        {
          id: 'solo',
          name: 'Fərdi məşqçi',
          score: 0,
          streak: 0,
          correctCount: 0,
          wrongCount: 0,
          jokers: { fiftyFifty: true, hint: true, extraTime: true },
        },
      ];
    }
    return config.teamNames.map((name, idx) => ({
      id: `team-${idx}`,
      name: name.trim() || `Komanda ${idx + 1}`,
      score: 0,
      streak: 0,
      correctCount: 0,
      wrongCount: 0,
      jokers: { fiftyFifty: true, hint: true, extraTime: true },
    }));
  };

  const handleStartGame = () => {
    if (filteredPool.length === 0) return;
    soundFX.click();

    const finalsPool = shuffleArray(
      questions.filter(
        (q) =>
          q.aktiv !== false &&
          q.nov === 'final' &&
          config.periods.includes(q.dovr)
      )
    );
    const fallbackFinals =
      finalsPool.length > 0
        ? finalsPool
        : shuffleArray(
            questions.filter((q) => q.aktiv !== false && q.nov === 'final')
          );

    const hasFinal = fallbackFinals.length > 0;
    const mainCount = Math.min(
      filteredPool.length,
      Math.max(1, config.questionCount - (hasFinal ? 1 : 0))
    );

    setActiveGameQuestions(buildRoundSelection(filteredPool, mainCount));
    setActiveFinalQuestions(fallbackFinals);
    setActiveTeams(buildTeams());
    setIsRetryMode(false);
    setScreen('play');
  };

  const handleRetryMistakes = (mistakeQuestions: Question[]) => {
    soundFX.click();
    setActiveGameQuestions(shuffleArray(mistakeQuestions));
    setActiveFinalQuestions([]);
    setActiveTeams(buildTeams());
    setIsRetryMode(true);
    setScreen('play');
  };

  const handleFinishGame = (finalTeams: Team[], records: AnswerRecord[]) => {
    setEndTeams(finalTeams);
    setEndRecords(records);
    setScreen('end');
  };

  const handleToggleSound = () => {
    const next = {
      ...teacherSettings,
      soundEnabled: !teacherSettings.soundEnabled,
    };
    setTeacherSettings(next);
    saveTeacherSettings(next);
  };

  const handleUpdateSettings = (next: TeacherSettings) => {
    setTeacherSettings(next);
    saveTeacherSettings(next);
    setConfig((prev) => ({
      ...prev,
      questionCount: next.defaultQuestionCount,
    }));
  };

  const persistBankChanges = (nextQuestions: Question[]) => {
    const baseIds = new Set(BASE_QUESTION_BANK.map((q) => q.id));
    const custom = nextQuestions.filter((q) => !baseIds.has(q.id));
    const disabled = nextQuestions
      .filter((q) => q.aktiv === false)
      .map((q) => q.id);
    saveCustomQuestions(custom);
    saveDisabledQuestionIds(disabled);
    setQuestions(nextQuestions);
  };

  const handleToggleQuestion = (id: string) => {
    const next = questions.map((q) =>
      q.id === id ? { ...q, aktiv: q.aktiv === false } : q
    );
    persistBankChanges(next);
  };

  const handleAddQuestion = (newQ: Question) => {
    const next = [newQ, ...questions];
    persistBankChanges(next);
  };

  const handleImportQuestions = (imported: Question[]) => {
    const map = new Map(questions.map((q) => [q.id, q]));
    for (const iq of imported) {
      map.set(iq.id, { ...iq, aktiv: iq.aktiv !== false });
    }
    persistBankChanges(Array.from(map.values()));
  };

  const handleResetBank = () => {
    saveCustomQuestions([]);
    saveDisabledQuestionIds([]);
    setQuestions(BASE_QUESTION_BANK.map((q) => ({ ...q, aktiv: true })));
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F4] text-[#181A1F]">
      {/* Clean 3-Zone Top Navigation Bar */}
      <header className="bg-white border-b border-[#E2DDD3] sticky top-0 z-30 no-print">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4 sm:gap-8">
          <button
            type="button"
            onClick={() => setScreen('start')}
            className="font-literary font-bold text-lg sm:text-xl text-[#181A1F] whitespace-nowrap shrink-0 cursor-pointer"
          >
            Söz sənətimizin izi ilə
          </button>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[#5B5E66]">
            <button
              type="button"
              onClick={() => setScreen('start')}
              className="hover:text-[#181A1F] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Başlanğıc
            </button>
            <button
              type="button"
              onClick={() => downloadSingleOfflineHtml(questions)}
              className="inline-flex items-center gap-1.5 hover:text-[#0F5C4D] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <FileDown className="w-4 h-4" aria-hidden="true" />
              <span>Tək HTML yüklə (Oflayn)</span>
            </button>
            <button
              type="button"
              onClick={handleToggleSound}
              className="inline-flex items-center gap-1.5 hover:text-[#181A1F] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {teacherSettings.soundEnabled ? (
                <Volume2 className="w-4 h-4 text-[#0F5C4D]" aria-hidden="true" />
              ) : (
                <VolumeX className="w-4 h-4 text-[#B91C1C]" aria-hidden="true" />
              )}
              <span>
                {teacherSettings.soundEnabled ? 'Səsi bağla' : 'Səsi aç'}
              </span>
            </button>
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleToggleSound}
              aria-label={
                teacherSettings.soundEnabled ? 'Səsi bağla' : 'Səsi aç'
              }
              className="md:hidden p-2 rounded-lg border border-[#D6D0C4] bg-[#FAF8F4] text-[#181A1F] cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
            >
              {teacherSettings.soundEnabled ? (
                <Volume2 className="w-4 h-4 text-[#0F5C4D]" />
              ) : (
                <VolumeX className="w-4 h-4 text-[#B91C1C]" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setTeacherOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#181A1F] hover:bg-[#2D3038] text-white text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer min-h-[40px]"
            >
              <GraduationCap className="w-4 h-4" aria-hidden="true" />
              <span>Müəllim üçün</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {screen === 'start' && (
          <StartScreen
            config={config}
            onChangeConfig={setConfig}
            availableCount={filteredPool.length}
            totalActiveCount={totalActiveCount}
            onStartGame={handleStartGame}
            allQuestions={questions}
          />
        )}

        {screen === 'play' && (
          <GamePlay
            questions={activeGameQuestions}
            finalQuestions={activeFinalQuestions}
            initialTeams={activeTeams}
            selectedPeriods={config.periods}
            teacherSettings={teacherSettings}
            isRetryMode={isRetryMode}
            onFinishGame={handleFinishGame}
            onExitGame={() => setScreen('start')}
          />
        )}

        {screen === 'end' && (
          <EndScreen
            teams={endTeams}
            records={endRecords}
            onRetryMistakes={handleRetryMistakes}
            onPlayAgain={handleStartGame}
            onGoHome={() => setScreen('start')}
          />
        )}
      </main>

      {/* Teacher Panel Modal */}
      {teacherOpen && (
        <TeacherPanel
          questions={questions}
          settings={teacherSettings}
          onUpdateSettings={handleUpdateSettings}
          onToggleQuestion={handleToggleQuestion}
          onAddQuestion={handleAddQuestion}
          onImportQuestions={handleImportQuestions}
          onResetBank={handleResetBank}
          onClose={() => setTeacherOpen(false)}
        />
      )}
    </div>
  );
}
