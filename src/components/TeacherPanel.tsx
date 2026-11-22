import React, { useMemo, useRef, useState } from 'react';
import {
  Download,
  Plus,
  RotateCcw,
  Search,
  Upload,
  X,
} from 'lucide-react';
import { ALL_PERIODS } from '../data/literaryMap';
import {
  DifficultyLevel,
  DirectionName,
  PeriodName,
  Question,
  RoundType,
  TeacherSettings,
} from '../types/game';

interface TeacherPanelProps {
  questions: Question[];
  settings: TeacherSettings;
  onUpdateSettings: (next: TeacherSettings) => void;
  onToggleQuestion: (id: string) => void;
  onAddQuestion: (q: Question) => void;
  onImportQuestions: (imported: Question[]) => void;
  onResetBank: () => void;
  onClose: () => void;
}

export const TeacherPanel: React.FC<TeacherPanelProps> = ({
  questions,
  settings,
  onUpdateSettings,
  onToggleQuestion,
  onAddQuestion,
  onImportQuestions,
  onResetBank,
  onClose,
}) => {
  const [tab, setTab] = useState<'bank' | 'add' | 'settings'>('bank');
  const [search, setSearch] = useState('');
  const [periodFilter, setPeriodFilter] = useState<string>('hamisi');
  const [typeFilter, setTypeFilter] = useState<string>('hamisi');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Add Question form state
  const [newPeriod, setNewPeriod] = useState<PeriodName>(ALL_PERIODS[0]);
  const [newDirection, setNewDirection] = useState<DirectionName>('Əsərlər');
  const [newWriter, setNewWriter] = useState('');
  const [newWork, setNewWork] = useState('');
  const [newType, setNewType] = useState<RoundType>('test');
  const [newDifficulty, setNewDifficulty] = useState<DifficultyLevel>('orta');
  const [newPrompt, setNewPrompt] = useState('');
  const [optA, setOptA] = useState('');
  const [optB, setOptB] = useState('');
  const [optC, setOptC] = useState('');
  const [optD, setOptD] = useState('');
  const [correctIdx, setCorrectIdx] = useState<number>(0);
  const [boolAnswer, setBoolAnswer] = useState<boolean>(true);
  const [listLines, setListLines] = useState('');
  const [newExplain, setNewExplain] = useState('');
  const [newPage, setNewPage] = useState('');

  const filteredQuestions = useMemo(() => {
    const q = search.trim().toLowerCase();
    return questions.filter((item) => {
      if (periodFilter !== 'hamisi' && item.dovr !== periodFilter) return false;
      if (typeFilter !== 'hamisi' && item.nov !== typeFilter) return false;
      if (!q) return true;
      return (
        item.sual.toLowerCase().includes(q) ||
        (item.senetkar || '').toLowerCase().includes(q) ||
        (item.eser || '').toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q)
      );
    });
  }, [questions, search, periodFilter, typeFilter]);

  const activeCount = useMemo(
    () => questions.filter((q) => q.aktiv !== false).length,
    [questions]
  );

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(questions, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'soz-senetimizin-izi-ile-sual-banki.json';
    a.click();
    URL.revokeObjectURL(url);
    setStatusMessage('Sual bankı JSON faylı kimi ixrac edildi.');
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (!Array.isArray(parsed)) {
          setStatusMessage('Xəta: JSON faylı sual massivi şəklində olmalıdır.');
          return;
        }
        const valid = parsed.filter(
          (item) =>
            item &&
            typeof item.id === 'string' &&
            typeof item.sual === 'string' &&
            typeof item.dovr === 'string'
        ) as Question[];
        if (valid.length === 0) {
          setStatusMessage('Xəta: Faylda düzgün formatlı sual tapılmadı.');
          return;
        }
        onImportQuestions(valid);
        setStatusMessage(`${valid.length} sual uğurla idxal edildi.`);
      } catch {
        setStatusMessage('Xəta: JSON faylını oxumaq mümkün olmadı.');
      }
    };
    reader.readAsText(file, 'utf-8');
    e.target.value = '';
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPrompt.trim() || !newExplain.trim()) {
      setStatusMessage('Zəhmət olmasa sual mətnini və izahını doldurun.');
      return;
    }

    const id = `custom-${Date.now()}`;
    const base: Question = {
      id,
      dovr: newPeriod,
      istiqamet: newDirection,
      senetkar: newWriter.trim() || null,
      eser: newWork.trim() || null,
      nov: newType,
      cetinlik: newDifficulty,
      sual: newPrompt.trim(),
      izah: newExplain.trim(),
      sehife: newPage.trim() || '—',
      aktiv: true,
    };

    if (newType === 'dogru-yanlis') {
      base.dogruMu = boolAnswer;
    } else if (newType === 'zaman-lenti' || newType === 'sujet-zenciri') {
      const items = listLines
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);
      if (items.length < 3) {
        setStatusMessage('Ardıcıllıq üçün ən azı 3 sətir daxil edin.');
        return;
      }
      base.ardicilliq = items;
    } else if (newType === 'uygunlasdir') {
      const pairs = listLines
        .split('\n')
        .map((l) => l.split('=').map((s) => s.trim()))
        .filter((parts) => parts.length >= 2 && parts[0] && parts[1])
        .map(([left, right]) => ({ left, right }));
      if (pairs.length < 3) {
        setStatusMessage('Uyğunlaşdırma üçün ən azı 3 sətir ("Sol = Sağ") yazın.');
        return;
      }
      base.cutler = pairs;
    } else if (newType === 'ipucu-kart') {
      const clues = listLines
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);
      if (clues.length < 2) {
        setStatusMessage('İpucu kartı üçün ən azı 2 ipucu sətri yazın.');
        return;
      }
      base.ipuclari = clues;
      base.variantlar = [optA.trim(), optB.trim(), optC.trim(), optD.trim()];
      base.duzgun = correctIdx;
    } else {
      if (!optA.trim() || !optB.trim() || !optC.trim() || !optD.trim()) {
        setStatusMessage('Bütün 4 variantı (A, B, C, D) doldurun.');
        return;
      }
      base.variantlar = [optA.trim(), optB.trim(), optC.trim(), optD.trim()];
      base.duzgun = correctIdx;
    }

    onAddQuestion(base);
    setNewPrompt('');
    setOptA('');
    setOptB('');
    setOptC('');
    setOptD('');
    setListLines('');
    setNewExplain('');
    setNewPage('');
    setStatusMessage('Yeni sual bankaya əlavə olundu.');
    setTab('bank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-3 sm:p-6">
      <div className="bg-white border border-[#E2DDD3] rounded-xl w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden shadow-xl">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#E2DDD3] flex flex-wrap items-center justify-between gap-3 bg-[#FAF8F4]">
          <div>
            <h2 className="font-literary font-bold text-xl text-[#181A1F]">
              Müəllim paneli
            </h2>
            <p className="text-xs text-[#5B5E66] tabular-nums">
              Cəmi {questions.length} sual · Aktiv: {activeCount}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 p-1 bg-[#F1EDE4] rounded-lg">
              {(
                [
                  { id: 'bank', label: 'Sual bankı' },
                  { id: 'add', label: 'Yeni sual' },
                  { id: 'settings', label: 'Parametrlər' },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-semibold cursor-pointer ${
                    tab === t.id
                      ? 'bg-white text-[#181A1F] shadow-sm'
                      : 'text-[#5B5E66] hover:text-[#181A1F]'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Bağla"
              className="p-2 rounded-lg border border-[#D6D0C4] bg-white hover:bg-[#F1EDE4] text-[#181A1F] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {statusMessage && (
          <div className="px-5 py-2.5 bg-[#EDF6F3] border-b border-[#84B8AC] text-xs sm:text-sm font-semibold text-[#0F5C4D] flex items-center justify-between">
            <span>{statusMessage}</span>
            <button
              type="button"
              onClick={() => setStatusMessage(null)}
              className="underline cursor-pointer"
            >
              Gizlət
            </button>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {tab === 'bank' && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2 flex-1">
                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="w-4 h-4 text-[#5B5E66] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Sual, sənətkar və ya əsər axtar..."
                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#D6D0C4] bg-[#FAF8F4] text-sm focus:outline-none focus:border-[#0F5C4D]"
                    />
                  </div>
                  <select
                    value={periodFilter}
                    onChange={(e) => setPeriodFilter(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-[#D6D0C4] bg-[#FAF8F4] text-sm"
                  >
                    <option value="hamisi">Bütün dövrlər</option>
                    {ALL_PERIODS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-[#D6D0C4] bg-[#FAF8F4] text-sm"
                  >
                    <option value="hamisi">Bütün növlər</option>
                    <option value="test">Test</option>
                    <option value="dogru-yanlis">Doğru/Yanlış</option>
                    <option value="misra">Misra kimindir?</option>
                    <option value="ipucu-kart">Kimdir bu sənətkar?</option>
                    <option value="uygunlasdir">Uyğunlaşdır</option>
                    <option value="zaman-lenti">Zaman lenti</option>
                    <option value="sujet-zenciri">Süjet zənciri</option>
                    <option value="final">Final sualı</option>
                  </select>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleExportJson}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#D6D0C4] bg-white hover:bg-[#FAF8F4] text-xs sm:text-sm font-semibold cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-[#0F5C4D]" />
                    <span>JSON ixrac et</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#D6D0C4] bg-white hover:bg-[#FAF8F4] text-xs sm:text-sm font-semibold cursor-pointer"
                  >
                    <Upload className="w-4 h-4 text-[#0F5C4D]" />
                    <span>JSON idxal et</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,application/json"
                    onChange={handleImportJson}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={onResetBank}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#D6D0C4] bg-[#FAF8F4] hover:bg-[#F1EDE4] text-xs font-semibold text-[#5B5E66] cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Sıfırla</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto border border-[#E2DDD3] rounded-xl">
                <table className="w-full text-left border-collapse text-sm">
                  <thead className="bg-[#FAF8F4] border-b border-[#E2DDD3] text-xs text-[#5B5E66]">
                    <tr>
                      <th className="py-2.5 px-3 font-semibold">ID</th>
                      <th className="py-2.5 px-3 font-semibold">Dövr / Mövzu</th>
                      <th className="py-2.5 px-3 font-semibold">Növ</th>
                      <th className="py-2.5 px-3 font-semibold">Sual</th>
                      <th className="py-2.5 px-3 font-semibold">Səh.</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#ECE7DD]">
                    {filteredQuestions.map((q) => {
                      const isActive = q.aktiv !== false;
                      return (
                        <tr
                          key={q.id}
                          className={isActive ? 'bg-white' : 'bg-[#F5F3EE] opacity-65'}
                        >
                          <td className="py-2.5 px-3 font-mono text-xs tabular-nums whitespace-nowrap">
                            {q.id}
                          </td>
                          <td className="py-2.5 px-3 text-xs">
                            <div className="font-semibold text-[#181A1F]">
                              {q.senetkar || q.eser || 'Ümumi'}
                            </div>
                            <div className="text-[#5B5E66]">{q.dovr}</div>
                          </td>
                          <td className="py-2.5 px-3 text-xs whitespace-nowrap">
                            {q.nov} · {q.cetinlik}
                          </td>
                          <td className="py-2.5 px-3 text-xs sm:text-sm max-w-md">
                            {q.sual}
                          </td>
                          <td className="py-2.5 px-3 text-xs tabular-nums whitespace-nowrap">
                            {q.sehife}
                          </td>
                          <td className="py-2.5 px-3 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => onToggleQuestion(q.id)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold border cursor-pointer ${
                                isActive
                                  ? 'bg-[#ECFDF3] border-[#15803D] text-[#15803D]'
                                  : 'bg-white border-[#C9C3B6] text-[#5B5E66]'
                              }`}
                            >
                              {isActive ? 'Aktivdir' : 'Sönülüdür'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {tab === 'add' && (
            <form onSubmit={handleCreateSubmit} className="space-y-4 max-w-3xl">
              <h3 className="font-literary font-bold text-lg text-[#181A1F]">
                Sual bankına yeni sual əlavə et
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#3B3E45] mb-1">
                    Dövr
                  </label>
                  <select
                    value={newPeriod}
                    onChange={(e) => setNewPeriod(e.target.value as PeriodName)}
                    className="w-full px-3 py-2 rounded-lg border border-[#D6D0C4] bg-[#FAF8F4] text-sm"
                  >
                    {ALL_PERIODS.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#3B3E45] mb-1">
                    İstiqamət
                  </label>
                  <select
                    value={newDirection}
                    onChange={(e) =>
                      setNewDirection(e.target.value as DirectionName)
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[#D6D0C4] bg-[#FAF8F4] text-sm"
                  >
                    <option value="Əsərlər">Əsərlər</option>
                    <option value="Sənətkarlar">Sənətkarlar</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#3B3E45] mb-1">
                    Raund növü
                  </label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as RoundType)}
                    className="w-full px-3 py-2 rounded-lg border border-[#D6D0C4] bg-[#FAF8F4] text-sm"
                  >
                    <option value="test">Test (4 variant)</option>
                    <option value="dogru-yanlis">Doğru / Yanlış</option>
                    <option value="misra">Misra kimindir?</option>
                    <option value="ipucu-kart">Kimdir bu sənətkar?</option>
                    <option value="uygunlasdir">Uyğunlaşdır</option>
                    <option value="zaman-lenti">Zaman lenti</option>
                    <option value="sujet-zenciri">Süjet zənciri</option>
                    <option value="final">Final sualı</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#3B3E45] mb-1">
                    Çətinlik
                  </label>
                  <select
                    value={newDifficulty}
                    onChange={(e) =>
                      setNewDifficulty(e.target.value as DifficultyLevel)
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[#D6D0C4] bg-[#FAF8F4] text-sm"
                  >
                    <option value="asan">Asan (100 xal)</option>
                    <option value="orta">Orta (200 xal)</option>
                    <option value="cetin">Çətin (300 xal)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#3B3E45] mb-1">
                    Sənətkar (istəyə bağlı)
                  </label>
                  <input
                    type="text"
                    value={newWriter}
                    onChange={(e) => setNewWriter(e.target.value)}
                    placeholder="Məs: Məhəmməd Füzuli"
                    className="w-full px-3 py-2 rounded-lg border border-[#D6D0C4] bg-[#FAF8F4] text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#3B3E45] mb-1">
                    Əsər (istəyə bağlı)
                  </label>
                  <input
                    type="text"
                    value={newWork}
                    onChange={(e) => setNewWork(e.target.value)}
                    placeholder="Məs: «Leyli və Məcnun»"
                    className="w-full px-3 py-2 rounded-lg border border-[#D6D0C4] bg-[#FAF8F4] text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#3B3E45] mb-1">
                  Sual mətni
                </label>
                <textarea
                  rows={2}
                  value={newPrompt}
                  onChange={(e) => setNewPrompt(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[#D6D0C4] bg-[#FAF8F4] text-sm"
                />
              </div>

              {newType === 'dogru-yanlis' && (
                <div>
                  <label className="block text-xs font-semibold text-[#3B3E45] mb-1">
                    Düzgün cavab
                  </label>
                  <select
                    value={boolAnswer ? 'true' : 'false'}
                    onChange={(e) => setBoolAnswer(e.target.value === 'true')}
                    className="px-3 py-2 rounded-lg border border-[#D6D0C4] bg-[#FAF8F4] text-sm"
                  >
                    <option value="true">Doğru</option>
                    <option value="false">Yanlış</option>
                  </select>
                </div>
              )}

              {(newType === 'zaman-lenti' ||
                newType === 'sujet-zenciri' ||
                newType === 'uygunlasdir' ||
                newType === 'ipucu-kart') && (
                <div>
                  <label className="block text-xs font-semibold text-[#3B3E45] mb-1">
                    {newType === 'uygunlasdir'
                      ? 'Cütlər (hər sətirdə: Sol = Sağ)'
                      : newType === 'ipucu-kart'
                      ? 'İpucları (4 sətir, çətindən asana)'
                      : 'Ardıcıllıq elementləri (hər sətirdə 1 element, düzgün sıra ilə)'}
                  </label>
                  <textarea
                    rows={4}
                    value={listLines}
                    onChange={(e) => setListLines(e.target.value)}
                    placeholder={
                      newType === 'uygunlasdir'
                        ? 'Burla xatun = «Kitabi-Dədə Qorqud»\nNüşabə = «İskəndərnamə»'
                        : '1-ci element\n2-ci element\n3-cü element'
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[#D6D0C4] bg-[#FAF8F4] text-sm"
                  />
                </div>
              )}

              {(newType === 'test' ||
                newType === 'misra' ||
                newType === 'ipucu-kart' ||
                newType === 'final') && (
                <div className="space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      value={optA}
                      onChange={(e) => setOptA(e.target.value)}
                      placeholder="Variant A"
                      className="px-3 py-2 rounded-lg border border-[#D6D0C4] bg-[#FAF8F4] text-sm"
                    />
                    <input
                      type="text"
                      value={optB}
                      onChange={(e) => setOptB(e.target.value)}
                      placeholder="Variant B"
                      className="px-3 py-2 rounded-lg border border-[#D6D0C4] bg-[#FAF8F4] text-sm"
                    />
                    <input
                      type="text"
                      value={optC}
                      onChange={(e) => setOptC(e.target.value)}
                      placeholder="Variant C"
                      className="px-3 py-2 rounded-lg border border-[#D6D0C4] bg-[#FAF8F4] text-sm"
                    />
                    <input
                      type="text"
                      value={optD}
                      onChange={(e) => setOptD(e.target.value)}
                      placeholder="Variant D"
                      className="px-3 py-2 rounded-lg border border-[#D6D0C4] bg-[#FAF8F4] text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#3B3E45] mr-2">
                      Düzgün variant:
                    </label>
                    <select
                      value={correctIdx}
                      onChange={(e) => setCorrectIdx(Number(e.target.value))}
                      className="px-3 py-1.5 rounded-lg border border-[#D6D0C4] bg-[#FAF8F4] text-sm"
                    >
                      <option value={0}>A</option>
                      <option value={1}>B</option>
                      <option value={2}>C</option>
                      <option value={3}>D</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-3">
                  <label className="block text-xs font-semibold text-[#3B3E45] mb-1">
                    İzah (1–2 cümlə)
                  </label>
                  <input
                    type="text"
                    value={newExplain}
                    onChange={(e) => setNewExplain(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-[#D6D0C4] bg-[#FAF8F4] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#3B3E45] mb-1">
                    Dərslik səhifəsi
                  </label>
                  <input
                    type="text"
                    value={newPage}
                    onChange={(e) => setNewPage(e.target.value)}
                    placeholder="Məs: 80"
                    className="w-full px-3 py-2 rounded-lg border border-[#D6D0C4] bg-[#FAF8F4] text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0F5C4D] hover:bg-[#0B473B] text-white font-bold text-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Sualı əlavə et</span>
              </button>
            </form>
          )}

          {tab === 'settings' && (
            <div className="space-y-6 max-w-xl">
              <h3 className="font-literary font-bold text-lg text-[#181A1F]">
                Oyun parametrləri
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl border border-[#E2DDD3] bg-[#FAF8F4]">
                  <div>
                    <div className="font-semibold text-sm text-[#181A1F]">
                      Taymer (vaxt məhdudiyyəti)
                    </div>
                    <div className="text-xs text-[#5B5E66]">
                      Söndürüldükdə şagirdlər vaxt təzyiqi olmadan cavab verir
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateSettings({
                        ...settings,
                        timerEnabled: !settings.timerEnabled,
                      })
                    }
                    className={`px-4 py-2 rounded-lg font-bold text-xs cursor-pointer ${
                      settings.timerEnabled
                        ? 'bg-[#0F5C4D] text-white'
                        : 'bg-white border border-[#D6D0C4] text-[#5B5E66]'
                    }`}
                  >
                    {settings.timerEnabled ? 'Açıqdır' : 'Sönülüdür'}
                  </button>
                </div>

                {settings.timerEnabled && (
                  <div className="p-4 rounded-xl border border-[#E2DDD3] bg-[#FAF8F4] space-y-2">
                    <div className="font-semibold text-sm text-[#181A1F]">
                      Hər sual üçün vaxt
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {([20, 30, 45, 60] as const).map((sec) => (
                        <button
                          key={sec}
                          type="button"
                          onClick={() =>
                            onUpdateSettings({ ...settings, timerSeconds: sec })
                          }
                          className={`px-4 py-2 rounded-lg font-bold text-sm tabular-nums cursor-pointer ${
                            settings.timerSeconds === sec
                              ? 'bg-[#0F5C4D] text-white'
                              : 'bg-white border border-[#D6D0C4] text-[#181A1F]'
                          }`}
                        >
                          {sec} saniyə
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="p-4 rounded-xl border border-[#E2DDD3] bg-[#FAF8F4] space-y-2">
                  <div className="font-semibold text-sm text-[#181A1F]">
                    Susmaya görə sual sayı
                  </div>
                  <div className="flex gap-2">
                    {([10, 20, 30] as const).map((cnt) => (
                      <button
                        key={cnt}
                        type="button"
                        onClick={() =>
                          onUpdateSettings({
                            ...settings,
                            defaultQuestionCount: cnt,
                          })
                        }
                        className={`px-4 py-2 rounded-lg font-bold text-sm tabular-nums cursor-pointer ${
                          settings.defaultQuestionCount === cnt
                            ? 'bg-[#0F5C4D] text-white'
                            : 'bg-white border border-[#D6D0C4] text-[#181A1F]'
                        }`}
                      >
                        {cnt} sual
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl border border-[#E2DDD3] bg-[#FAF8F4]">
                  <div>
                    <div className="font-semibold text-sm text-[#181A1F]">
                      Səs effektləri (Web Audio)
                    </div>
                    <div className="text-xs text-[#5B5E66]">
                      Doğru/səhv cavab və taymer səsləri
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateSettings({
                        ...settings,
                        soundEnabled: !settings.soundEnabled,
                      })
                    }
                    className={`px-4 py-2 rounded-lg font-bold text-xs cursor-pointer ${
                      settings.soundEnabled
                        ? 'bg-[#0F5C4D] text-white'
                        : 'bg-white border border-[#D6D0C4] text-[#5B5E66]'
                    }`}
                  >
                    {settings.soundEnabled ? 'Açıqdır' : 'Səssiz'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
