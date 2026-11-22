import { Question, TeacherSettings } from '../types/game';
import { QUESTIONS_PART_1 } from './questionsPart1';
import { QUESTIONS_PART_2 } from './questionsPart2';

export const BASE_QUESTION_BANK: Question[] = [
  ...QUESTIONS_PART_1,
  ...QUESTIONS_PART_2,
].map((q) => ({ ...q, aktiv: q.aktiv !== false }));

const STORAGE_CUSTOM_KEY = 'soz_senet_custom_questions_v1';
const STORAGE_DISABLED_KEY = 'soz_senet_disabled_ids_v1';
const STORAGE_SETTINGS_KEY = 'soz_senet_teacher_settings_v1';

export const DEFAULT_TEACHER_SETTINGS: TeacherSettings = {
  timerEnabled: true,
  timerSeconds: 30,
  defaultQuestionCount: 10,
  soundEnabled: true,
};

export function safeStorageGet<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function safeStorageSet<T>(key: string, value: T): boolean {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function loadQuestionBank(): Question[] {
  const custom = safeStorageGet<Question[]>(STORAGE_CUSTOM_KEY, []);
  const disabledIds = new Set(safeStorageGet<string[]>(STORAGE_DISABLED_KEY, []));

  const merged = new Map<string, Question>();
  for (const q of BASE_QUESTION_BANK) {
    merged.set(q.id, { ...q, aktiv: !disabledIds.has(q.id) });
  }
  for (const cq of custom) {
    merged.set(cq.id, { ...cq, aktiv: !disabledIds.has(cq.id) && cq.aktiv !== false });
  }
  return Array.from(merged.values());
}

export function saveCustomQuestions(customQuestions: Question[]): void {
  safeStorageSet(STORAGE_CUSTOM_KEY, customQuestions);
}

export function saveDisabledQuestionIds(disabledIds: string[]): void {
  safeStorageSet(STORAGE_DISABLED_KEY, disabledIds);
}

export function loadTeacherSettings(): TeacherSettings {
  return {
    ...DEFAULT_TEACHER_SETTINGS,
    ...safeStorageGet<Partial<TeacherSettings>>(STORAGE_SETTINGS_KEY, {}),
  };
}

export function saveTeacherSettings(settings: TeacherSettings): void {
  safeStorageSet(STORAGE_SETTINGS_KEY, settings);
}
