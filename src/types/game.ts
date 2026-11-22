export type PeriodName =
  | 'Şifahi xalq ədəbiyyatı və qədim dövr'
  | 'İntibah dövrü'
  | 'Orta əsrlər'
  | 'Erkən yeni dövr'
  | 'Maarifçi-realizm dövrü';

export type DirectionName = 'Əsərlər' | 'Sənətkarlar';

export type RoundType =
  | 'test'
  | 'dogru-yanlis'
  | 'uygunlasdir'
  | 'zaman-lenti'
  | 'sujet-zenciri'
  | 'misra'
  | 'ipucu-kart'
  | 'final';

export type DifficultyLevel = 'asan' | 'orta' | 'cetin';

export interface MatchPair {
  left: string;
  right: string;
}

export interface Question {
  id: string;
  dovr: PeriodName;
  istiqamet: DirectionName;
  senetkar: string | null;
  eser: string | null;
  nov: RoundType;
  cetinlik: DifficultyLevel;
  sual: string;
  // For test, misra, ipucu-kart, final
  variantlar?: string[];
  duzgun?: number;
  // For dogru-yanlis
  dogruMu?: boolean;
  // For ipucu-kart (4 clues, hardest to easiest)
  ipuclari?: string[];
  // For uygunlasdir
  cutler?: MatchPair[];
  // For zaman-lenti and sujet-zenciri (items in correct chronological order)
  ardicilliq?: string[];
  // Optional short hint for the "İpucu" joker
  jokerIpucu?: string;
  izah: string;
  sehife: string | number;
  aktiv?: boolean;
}

export interface Team {
  id: string;
  name: string;
  score: number;
  streak: number;
  correctCount: number;
  wrongCount: number;
  jokers: {
    fiftyFifty: boolean;
    hint: boolean;
    extraTime: boolean;
  };
}

export interface GameConfig {
  mode: 'team' | 'solo';
  teamNames: string[];
  direction: 'Əsərlər' | 'Sənətkarlar' | 'Qarışıq';
  periods: PeriodName[];
  difficulty: DifficultyLevel | 'qarisiq';
  questionCount: 10 | 20 | 30;
}

export interface TeacherSettings {
  timerEnabled: boolean;
  timerSeconds: 20 | 30 | 45 | 60;
  defaultQuestionCount: 10 | 20 | 30;
  soundEnabled: boolean;
}

export interface AnswerRecord {
  question: Question;
  teamId: string;
  teamName: string;
  isCorrect: boolean;
  pointsEarned: number;
  timeSpent: number;
}
