import { LITERARY_STATIONS } from '../data/literaryMap';
import { Question } from '../types/game';

/**
 * Generates a 100% self-contained, zero-dependency single HTML file
 * that works completely offline on any projector, smartboard, desktop, or phone.
 */
export function buildSingleOfflineHtml(questions: Question[]): string {
  const safeJson = JSON.stringify(questions, null, 2).replace(/<\/script>/gi, '<\\/script>');
  const stationsJson = JSON.stringify(LITERARY_STATIONS).replace(/<\/script>/gi, '<\\/script>');

  return `<!DOCTYPE html>
<html lang="az">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Söz sənətimizin izi ilə — X sinif ədəbiyyatı üzrə interaktiv oyun</title>
<style>
  :root {
    --bg: #FAF8F4;
    --surface: #FFFFFF;
    --surface-alt: #F1EDE4;
    --border: #E2DDD3;
    --border-strong: #C9C3B6;
    --ink: #181A1F;
    --muted: #5B5E66;
    --accent: #0F5C4D;
    --accent-hover: #0B473B;
    --accent-soft: #EDF6F3;
    --amber: #B45309;
    --amber-soft: #FEF8EE;
    --ok: #15803D;
    --ok-soft: #ECFDF3;
    --err: #B91C1C;
    --err-soft: #FEF2F2;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    background: var(--bg);
    color: var(--ink);
    font-family: 'Segoe UI', system-ui, -apple-system, Roboto, Arial, sans-serif;
    line-height: 1.5;
  }
  .serif { font-family: 'Palatino Linotype', 'Book Antiqua', Georgia, serif; }
  .wrap { max-width: 1120px; margin: 0 auto; padding: 16px; }
  header {
    background: var(--surface);
    border-bottom: 1px solid var(--border);
    padding: 12px 16px;
    position: sticky;
    top: 0;
    z-index: 20;
  }
  .header-inner {
    max-width: 1120px;
    margin: 0 auto;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }
  .brand { font-size: 20px; font-weight: 700; color: var(--ink); }
  .row { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
  .grid-2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 16px; }
  .grid-5 { display: grid; grid-template-columns: repeat(auto-fit, minmax(175px, 1fr)); gap: 10px; }
  .card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 16px;
  }
  button {
    font-family: inherit;
    cursor: pointer;
    border-radius: 10px;
    border: 1px solid var(--border-strong);
    background: var(--surface);
    color: var(--ink);
    font-weight: 600;
    padding: 10px 16px;
    font-size: 15px;
    min-height: 44px;
    transition: background-color 0.15s, border-color 0.15s;
  }
  button:hover:not(:disabled) { border-color: var(--accent); background: var(--bg); }
  button:disabled { opacity: 0.45; cursor: default; }
  .btn-primary {
    background: var(--accent);
    border-color: var(--accent);
    color: #fff;
    font-weight: 700;
  }
  .btn-primary:hover:not(:disabled) { background: var(--accent-hover); border-color: var(--accent-hover); }
  .btn-amber { background: var(--amber); border-color: var(--amber); color: #fff; }
  .btn-amber:hover:not(:disabled) { background: #92400E; }
  .btn-active { background: var(--accent); border-color: var(--accent); color: #fff; }
  input, select, textarea {
    font-family: inherit;
    padding: 9px 12px;
    border: 1px solid var(--border-strong);
    border-radius: 8px;
    background: var(--bg);
    color: var(--ink);
    font-size: 14px;
    width: 100%;
  }
  .question-text { font-size: clamp(28px, 2.6vw, 34px); font-weight: 700; line-height: 1.3; margin: 14px 0 20px; }
  .opt-btn {
    width: 100%;
    text-align: left;
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 16px 18px;
    border: 2px solid var(--border-strong);
    font-size: 19px;
    min-height: 68px;
    background: var(--surface);
  }
  .opt-letter {
    width: 36px; height: 36px; border-radius: 8px;
    background: var(--surface-alt); display: inline-flex;
    align-items: center; justify-content: center; font-weight: 700; flex-shrink: 0;
  }
  .opt-correct { background: var(--ok-soft) !important; border-color: var(--ok) !important; color: #14532D !important; }
  .opt-wrong { background: var(--err-soft) !important; border-color: var(--err) !important; color: #7F1D1D !important; }
  .opt-eliminated { opacity: 0.25; text-decoration: line-through; }
  .station {
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 10px 12px;
    background: var(--bg);
    font-size: 13px;
  }
  .station.active { background: var(--accent-soft); border-color: var(--accent); border-width: 2px; }
  .station.visited { background: #F6FAF8; border-color: #84B8AC; }
  .score-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 10px; margin-bottom: 14px; }
  .score-box {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 12px 14px;
  }
  .score-box.turn { background: var(--accent-soft); border: 2px solid var(--accent); }
  .score-val { font-size: 28px; font-weight: 800; font-variant-numeric: tabular-nums; }
  .feedback {
    border: 2px solid var(--border);
    border-radius: 12px;
    padding: 18px;
    margin-top: 18px;
  }
  .feedback.ok { background: var(--ok-soft); border-color: var(--ok); color: #14532D; }
  .feedback.err { background: var(--err-soft); border-color: var(--err); color: #7F1D1D; }
  .muted { color: var(--muted); font-size: 13px; }
  .modal-bg {
    position: fixed; inset: 0; background: rgba(0,0,0,0.5);
    display: flex; align-items: center; justify-content: center; padding: 16px; z-index: 50;
  }
  .modal {
    background: var(--surface); border-radius: 14px; width: 100%; max-width: 980px;
    max-height: 90vh; display: flex; flex-direction: column; overflow: hidden;
  }
  .modal-body { padding: 18px; overflow-y: auto; flex: 1; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th, td { border-bottom: 1px solid var(--border); padding: 8px 10px; text-align: left; }
  th { background: var(--bg); }
  .hidden { display: none !important; }
  .diploma { display: none; }
  #confetti { position: fixed; inset: 0; pointer-events: none; z-index: 40; }
  @media print {
    header, .no-print { display: none !important; }
    body { background: #fff !important; }
    .diploma {
      display: block !important;
      border: 8px double #0F5C4D;
      padding: 48px;
      text-align: center;
      margin: 20px;
    }
    @page { size: landscape; margin: 10mm; }
  }
</style>
</head>
<body>
<canvas id="confetti" class="no-print"></canvas>
<header class="no-print">
  <div class="header-inner">
    <div class="brand serif">Söz sənətimizin izi ilə</div>
    <div class="row">
      <button id="btn-sound" type="button">Səsi bağla</button>
      <button id="btn-teacher" type="button">Müəllim üçün</button>
    </div>
  </div>
</header>

<main id="app" class="wrap no-print"></main>
<div id="diploma-root" class="diploma"></div>
<div id="teacher-modal" class="modal-bg hidden no-print"></div>

<script>
// ============================================================================
// SUAL BANKI (Müəllim bu JSON massivini rahatlıqla redaktə edə bilər)
// ============================================================================
const DEFAULT_QUESTION_BANK = ${safeJson};
const LITERARY_STATIONS = ${stationsJson};

(function() {
  const LS_CUSTOM = 'ss_offline_custom_v1';
  const LS_DISABLED = 'ss_offline_disabled_v1';
  const LS_SETTINGS = 'ss_offline_settings_v1';

  function lsGet(key, fallback) {
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : fallback;
    } catch (e) { return fallback; }
  }
  function lsSet(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
  }

  let settings = Object.assign({ timerEnabled: true, timerSeconds: 30, defaultQuestionCount: 10, soundEnabled: true }, lsGet(LS_SETTINGS, {}));
  let customQuestions = lsGet(LS_CUSTOM, []);
  let disabledIds = new Set(lsGet(LS_DISABLED, []));
  let questionBank = [];

  function rebuildBank() {
    const map = new Map();
    DEFAULT_QUESTION_BANK.forEach(q => map.set(q.id, Object.assign({}, q, { aktiv: !disabledIds.has(q.id) })));
    customQuestions.forEach(q => map.set(q.id, Object.assign({}, q, { aktiv: !disabledIds.has(q.id) && q.aktiv !== false })));
    questionBank = Array.from(map.values());
  }
  rebuildBank();

  // Web Audio
  let audioCtx = null;
  function playTone(freq, dur, type, vol, delay) {
    if (!settings.soundEnabled) return;
    try {
      if (!audioCtx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (AC) audioCtx = new AC();
      }
      if (!audioCtx) return;
      if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
      const now = audioCtx.currentTime + (delay || 0);
      const osc = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(freq, now);
      g.gain.setValueAtTime(0.001, now);
      g.gain.exponentialRampToValueAtTime(vol || 0.14, now + 0.015);
      g.gain.exponentialRampToValueAtTime(0.001, now + dur);
      osc.connect(g); g.connect(audioCtx.destination);
      osc.start(now); osc.stop(now + dur + 0.02);
    } catch (e) {}
  }
  const sfx = {
    click: () => playTone(540, 0.06, 'triangle', 0.08, 0),
    flip: () => { playTone(440, 0.08, 'sine', 0.1, 0); playTone(620, 0.09, 'sine', 0.09, 0.05); },
    correct: () => { playTone(523, 0.14, 'triangle', 0.14, 0); playTone(659, 0.14, 'triangle', 0.14, 0.09); playTone(784, 0.24, 'triangle', 0.15, 0.18); },
    wrong: () => { playTone(260, 0.18, 'sawtooth', 0.09, 0); playTone(210, 0.28, 'sawtooth', 0.09, 0.14); },
    tick: () => playTone(880, 0.04, 'sine', 0.05, 0),
    victory: () => [523, 659, 784, 1046].forEach((n, i) => playTone(n, 0.26, 'triangle', 0.15, i * 0.11))
  };

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  }

  function esc(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // App State
  let config = {
    mode: 'team',
    teamNames: ['Xəmsə', 'Qorqud'],
    direction: 'Qarışıq',
    periods: LITERARY_STATIONS.map(s => s.period),
    difficulty: 'qarisiq',
    questionCount: settings.defaultQuestionCount || 10
  };

  let screen = 'start'; // start | play | end
  let game = null;
  let timerId = null;

  function updateSoundBtn() {
    document.getElementById('btn-sound').textContent = settings.soundEnabled ? 'Səsi bağla' : 'Səsi aç';
  }
  updateSoundBtn();
  document.getElementById('btn-sound').onclick = function() {
    settings.soundEnabled = !settings.soundEnabled;
    lsSet(LS_SETTINGS, settings);
    updateSoundBtn();
  };
  document.getElementById('btn-teacher').onclick = openTeacherModal;

  function getFilteredQuestions(includeFinal) {
    return questionBank.filter(q => {
      if (q.aktiv === false) return false;
      if (!includeFinal && q.nov === 'final') return false;
      if (!config.periods.includes(q.dovr)) return false;
      if (config.direction !== 'Qarışıq' && q.istiqamet !== config.direction) return false;
      if (config.difficulty !== 'qarisiq' && q.cetinlik !== config.difficulty && !includeFinal) return false;
      return true;
    });
  }

  function startNewGame(retryQuestions) {
    stopTimer();
    const isRetry = Array.isArray(retryQuestions) && retryQuestions.length > 0;
    const pool = isRetry ? shuffle(retryQuestions) : shuffle(getFilteredQuestions(false));
    const finals = isRetry ? [] : shuffle(questionBank.filter(q => q.aktiv !== false && q.nov === 'final' && config.periods.includes(q.dovr)));
    const mainCount = isRetry ? pool.length : Math.min(pool.length, Math.max(1, config.questionCount - (finals.length > 0 ? 1 : 0)));
    const selectedMain = pool.slice(0, mainCount);

    // Ensure diverse round types appear cleanly
    const teams = config.mode === 'solo'
      ? [{ id: 't1', name: 'Fərdi oyunçu', score: 0, streak: 0, ok: 0, err: 0, j50: true, jHint: true, jTime: true }]
      : config.teamNames.map((n, i) => ({ id: 't' + i, name: n.trim() || ('Komanda ' + (i + 1)), score: 0, streak: 0, ok: 0, err: 0, j50: true, jHint: true, jTime: true }));

    game = {
      isRetry,
      questions: selectedMain,
      finals: finals.length ? finals : shuffle(questionBank.filter(q => q.aktiv !== false && q.nov === 'final')),
      teams,
      records: [],
      qIdx: 0,
      turnIdx: 0,
      inFinal: false,
      finalTeamIdx: 0,
      wagerPct: 20,
      wagerOk: false,
      timeLeft: settings.timerSeconds,
      paused: false,
      answered: false,
      lastRes: null,
      hintShown: false,
      eliminated: [],
      cluesOpen: 1,
      matches: {},
      selectedLeft: null,
      ordered: [],
      swapSel: null,
      choiceOrder: null,
      rightOrder: null,
      startedAt: Date.now()
    };
    screen = 'play';
    prepareQuestionState();
    render();
  }

  function currentQuestion() {
    if (!game) return null;
    if (game.inFinal) return game.finals[game.finalTeamIdx % Math.max(1, game.finals.length)];
    return game.questions[game.qIdx];
  }

  function currentTeamIdx() {
    return game.inFinal ? game.finalTeamIdx : (game.turnIdx % game.teams.length);
  }

  function prepareQuestionState() {
    stopTimer();
    const q = currentQuestion();
    if (!q) return;
    game.timeLeft = settings.timerSeconds;
    game.paused = false;
    game.answered = false;
    game.lastRes = null;
    game.hintShown = false;
    game.eliminated = [];
    game.cluesOpen = 1;
    game.matches = {};
    game.selectedLeft = null;
    game.swapSel = null;
    game.startedAt = Date.now();

    if (q.variantlar) {
      const idxArr = q.variantlar.map((t, i) => ({ text: t, isOk: i === (q.duzgun || 0) }));
      game.choiceOrder = shuffle(idxArr);
    } else {
      game.choiceOrder = null;
    }

    if (q.cutler) {
      let r = shuffle(q.cutler.map(c => c.right));
      if (r.length > 1 && r.every((v, i) => v === q.cutler[i].right)) r = r.slice(1).concat(r[0]);
      game.rightOrder = r;
    } else {
      game.rightOrder = null;
    }

    if (q.ardicilliq) {
      let o = shuffle(q.ardicilliq);
      if (o.length > 1 && o.every((v, i) => v === q.ardicilliq[i])) o = o.slice(1).concat(o[0]);
      game.ordered = o;
    } else {
      game.ordered = [];
    }

    startTimer();
  }

  function stopTimer() {
    if (timerId) { clearInterval(timerId); timerId = null; }
  }

  function startTimer() {
    stopTimer();
    if (!settings.timerEnabled || game.answered || game.paused || (game.inFinal && !game.wagerOk)) return;
    timerId = setInterval(() => {
      if (!game || game.answered || game.paused) return;
      game.timeLeft--;
      if (game.timeLeft <= 5 && game.timeLeft > 0) sfx.tick();
      if (game.timeLeft <= 0) {
        stopTimer();
        submitAnswer(false, 0, true);
      } else {
        const el = document.getElementById('timer-badge');
        if (el) el.textContent = game.timeLeft + ' s';
      }
    }, 1000);
  }

  function getCorrectAnswerDisplay(q) {
    if (q.variantlar && q.duzgun != null) return q.variantlar[q.duzgun];
    if (q.nov === 'dogru-yanlis') return q.dogruMu ? 'Doğru' : 'Yanlış';
    if (q.cutler) return q.cutler.map(c => c.left + ' → ' + c.right).join(' · ');
    if (q.ardicilliq) return q.ardicilliq.map((a, i) => (i + 1) + ') ' + a).join(' → ');
    return '';
  }

  function submitAnswer(isCorrect, customPts, timedOut) {
    if (game.answered) return;
    stopTimer();
    game.answered = true;
    const q = currentQuestion();
    const tIdx = currentTeamIdx();
    const team = game.teams[tIdx];
    const elapsed = Math.round((Date.now() - game.startedAt) / 1000);

    let pts = 0;
    const bonus = [];
    if (game.inFinal) {
      const stake = team.score > 0 ? Math.round(team.score * game.wagerPct / 100) : 100;
      pts = isCorrect ? stake : (team.score > 0 ? -stake : 0);
    } else if (isCorrect) {
      let base = customPts != null ? customPts : (q.cetinlik === 'cetin' ? 300 : q.cetinlik === 'orta' ? 200 : 100);
      if (game.hintShown) { base = Math.round(base * 0.5); bonus.push('İpucu (-50%)'); }
      pts += base;
      if (elapsed <= 10 && settings.timerEnabled) { pts += 50; bonus.push('Sürət +50'); }
      if ((team.streak + 1) % 3 === 0) { pts += 100; bonus.push('3 seriya +100'); }
    }

    if (isCorrect) { sfx.correct(); team.ok++; team.streak++; }
    else { sfx.wrong(); team.err++; team.streak = 0; }
    team.score = Math.max(0, team.score + pts);

    game.records.push({ q, teamName: team.name, isCorrect, pts });
    game.lastRes = { isCorrect, timedOut: !!timedOut, pts, bonus: bonus.join(' · '), correctText: getCorrectAnswerDisplay(q) };
    render();
  }

  function nextStep() {
    sfx.click();
    if (!game.inFinal) {
      if (game.qIdx + 1 < game.questions.length) {
        game.qIdx++; game.turnIdx++; prepareQuestionState(); render();
      } else if (!game.isRetry && game.finals.length > 0) {
        game.inFinal = true; game.finalTeamIdx = 0; game.wagerPct = 20; game.wagerOk = false;
        prepareQuestionState(); render();
      } else {
        sfx.victory(); screen = 'end'; render(); launchConfetti();
      }
    } else {
      if (game.finalTeamIdx + 1 < game.teams.length) {
        game.finalTeamIdx++; game.wagerPct = 20; game.wagerOk = false;
        prepareQuestionState(); render();
      } else {
        sfx.victory(); screen = 'end'; render(); launchConfetti();
      }
    }
  }

  // Keyboard shortcuts
  document.addEventListener('keydown', function(e) {
    if (screen !== 'play' || !game) return;
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target && e.target.tagName) || '')) return;
    if (e.code === 'Space' && !game.answered && settings.timerEnabled && (!game.inFinal || game.wagerOk)) {
      e.preventDefault();
      game.paused = !game.paused;
      if (game.paused) stopTimer(); else startTimer();
      render();
    } else if (e.key === 'Enter' && game.answered) {
      e.preventDefault();
      nextStep();
    } else if (['1','2','3','4'].includes(e.key) && !game.answered && (!game.inFinal || game.wagerOk)) {
      const q = currentQuestion();
      if (!q) return;
      if (q.nov === 'dogru-yanlis') {
        if (e.key === '1') submitAnswer(q.dogruMu === true);
        if (e.key === '2') submitAnswer(q.dogruMu === false);
      } else if (game.choiceOrder) {
        const idx = Number(e.key) - 1;
        if (idx < game.choiceOrder.length && !game.eliminated.includes(idx)) {
          const clueScores = [400, 300, 200, 100];
          const custom = q.nov === 'ipucu-kart' ? (game.choiceOrder[idx].isOk ? clueScores[Math.min(game.cluesOpen - 1, 3)] : 0) : null;
          submitAnswer(game.choiceOrder[idx].isOk, custom);
        }
      }
    }
  });

  function renderMapHtml(activePeriod, visitedSet) {
    return '<div class="card"><div class="row" style="justify-content:space-between;margin-bottom:10px;"><strong class="serif" style="font-size:17px;">Ədəbi xəritə</strong><span class="muted">Dövrlər üzrə səyahət</span></div><div class="grid-5">' +
      LITERARY_STATIONS.map((st, idx) => {
        const cls = activePeriod === st.period ? 'station active' : (visitedSet && visitedSet.has(st.period) ? 'station visited' : 'station');
        return '<div class="' + cls + '"><div style="font-weight:700;margin-bottom:4px;">' + (idx + 1) + '. ' + esc(st.shortTitle) + '</div><div class="muted">' + esc(st.writers.join(' · ')) + '</div></div>';
      }).join('') + '</div></div>';
  }

  function render() {
    const app = document.getElementById('app');
    if (screen === 'start') {
      const avail = getFilteredQuestions(false).length;
      app.innerHTML =
        '<div class="card"><div class="row" style="justify-content:space-between;"><div><div class="muted" style="color:var(--accent);font-weight:600;">X sinif Azərbaycan ədəbiyyatı · «Ədəbiyyat – 10»</div><h1 class="serif" style="margin:6px 0;font-size:34px;">Söz sənətimizin izi ilə</h1><p class="muted" style="font-size:15px;margin:0;">Sinifdə proyektor və ya ağıllı lövhədə komanda yarışı, evdə fərdi məşq üçün interaktiv oyun.</p></div><div><button id="go-start" class="btn-primary" style="font-size:18px;padding:14px 28px;" ' + (avail === 0 ? 'disabled' : '') + '>Oyuna başla</button><div class="muted" style="margin-top:6px;">Hazır sual sayı: <strong>' + avail + '</strong></div></div></div></div>' +
        '<div class="grid-2">' +
          '<div class="card"><h2 class="serif" style="margin-top:0;">1. Rejim və komandalar</h2>' +
            '<div class="row" style="margin-bottom:12px;">' +
              '<button id="m-team" class="' + (config.mode === 'team' ? 'btn-active' : '') + '">Komanda yarışı</button>' +
              '<button id="m-solo" class="' + (config.mode === 'solo' ? 'btn-active' : '') + '">Fərdi məşq</button>' +
            '</div>' +
            (config.mode === 'team' ? (
              '<div class="row" style="margin-bottom:10px;"><span class="muted">Komanda sayı:</span>' +
              [2,3,4].map(n => '<button data-tcount="' + n + '" class="' + (config.teamNames.length === n ? 'btn-active' : '') + '">' + n + '</button>').join('') +
              '</div><div style="display:grid;gap:8px;">' +
              config.teamNames.map((nm, i) => '<input data-tname="' + i + '" value="' + esc(nm) + '" placeholder="' + (i+1) + '-ci komanda">').join('') +
              '</div>'
            ) : '<p class="muted">Fərdi məşq rejimində sualları ardıcıl cavablayıb sonda səhvlərinizi təkrar edə bilərsiniz.</p>') +
            '<p class="muted" style="margin-top:14px;">Qısayollar: 1–4 variant · Enter növbəti · Space taymer</p>' +
          '</div>' +
          '<div class="card"><h2 class="serif" style="margin-top:0;">2. İstiqamət, dövr və çətinlik</h2>' +
            '<div class="muted" style="margin-bottom:6px;">İstiqamət</div><div class="row" style="margin-bottom:12px;">' +
            ['Qarışıq','Əsərlər','Sənətkarlar'].map(d => '<button data-dir="' + d + '" class="' + (config.direction === d ? 'btn-active' : '') + '">' + d + '</button>').join('') +
            '</div><div class="muted" style="margin-bottom:6px;">Dövrlər (bir neçəsi seçilə bilər)</div><div class="row" style="margin-bottom:12px;">' +
            LITERARY_STATIONS.map(s => '<button data-per="' + esc(s.period) + '" class="' + (config.periods.includes(s.period) ? 'btn-active' : '') + '" style="font-size:13px;padding:7px 11px;">' + esc(s.shortTitle) + '</button>').join('') +
            '</div><div class="row" style="gap:18px;"><div><div class="muted" style="margin-bottom:6px;">Çətinlik</div><div class="row">' +
            [['qarisiq','Qarışıq'],['asan','Asan'],['orta','Orta'],['cetin','Çətin']].map(x => '<button data-dif="' + x[0] + '" class="' + (config.difficulty === x[0] ? 'btn-active' : '') + '" style="padding:7px 11px;">' + x[1] + '</button>').join('') +
            '</div></div><div><div class="muted" style="margin-bottom:6px;">Sual sayı</div><div class="row">' +
            [10,20,30].map(c => '<button data-cnt="' + c + '" class="' + (config.questionCount === c ? 'btn-active' : '') + '" style="padding:7px 13px;">' + c + '</button>').join('') +
            '</div></div></div>' +
          '</div>' +
        '</div>' +
        renderMapHtml(null, null);

      document.getElementById('go-start').onclick = () => { sfx.click(); startNewGame(); };
      document.getElementById('m-team').onclick = () => { config.mode = 'team'; render(); };
      document.getElementById('m-solo').onclick = () => { config.mode = 'solo'; render(); };
      app.querySelectorAll('[data-tcount]').forEach(b => b.onclick = () => {
        const n = Number(b.getAttribute('data-tcount'));
        const defs = ['Xəmsə', 'Qorqud', 'Səbuhi', 'Vaqif'];
        config.teamNames = Array.from({ length: n }, (_, i) => config.teamNames[i] || defs[i]);
        render();
      });
      app.querySelectorAll('[data-tname]').forEach(inp => inp.oninput = () => {
        config.teamNames[Number(inp.getAttribute('data-tname'))] = inp.value;
      });
      app.querySelectorAll('[data-dir]').forEach(b => b.onclick = () => { config.direction = b.getAttribute('data-dir'); render(); });
      app.querySelectorAll('[data-per]').forEach(b => b.onclick = () => {
        const p = b.getAttribute('data-per');
        if (config.periods.includes(p)) { if (config.periods.length > 1) config.periods = config.periods.filter(x => x !== p); }
        else config.periods.push(p);
        render();
      });
      app.querySelectorAll('[data-dif]').forEach(b => b.onclick = () => { config.difficulty = b.getAttribute('data-dif'); render(); });
      app.querySelectorAll('[data-cnt]').forEach(b => b.onclick = () => { config.questionCount = Number(b.getAttribute('data-cnt')); render(); });
      return;
    }

    if (screen === 'play' && game) {
      const q = currentQuestion();
      const tIdx = currentTeamIdx();
      const team = game.teams[tIdx];
      const visited = new Set(game.records.map(r => r.q.dovr));
      if (q) visited.add(q.dovr);

      let html = '<div class="score-grid">' + game.teams.map((t, i) =>
        '<div class="score-box ' + (i === tIdx ? 'turn' : '') + '"><div class="row" style="justify-content:space-between;"><strong>' + esc(t.name) + '</strong>' + (i === tIdx ? '<span style="color:var(--accent);font-size:12px;font-weight:700;">Növbə</span>' : '') + '</div><div class="score-val">' + t.score + '</div><div class="muted">Doğru: ' + t.ok + ' · Seriya: ' + t.streak + '</div></div>'
      ).join('') + '</div>' + renderMapHtml(q ? q.dovr : null, visited);

      if (game.inFinal && !game.wagerOk) {
        html += '<div class="card" style="text-align:center;padding:32px;"><h2>Final mərc mərhələsi</h2><p style="font-size:20px;"><strong>' + esc(team.name) + '</strong>, xalınızın neçə faizini mərcə qoyursunuz? (Cari xal: ' + team.score + ')</p>' +
          (team.score > 0 ? '<div class="row" style="justify-content:center;margin:16px 0;">' + [10,20,30,40,50].map(p => '<button data-pct="' + p + '" class="' + (game.wagerPct === p ? 'btn-active' : '') + '">' + p + '%</button>').join('') + '</div>' : '<p class="muted">0 xal olduğundan 100 xallıq bonus sualı oynayacaqsınız.</p>') +
          '<button id="btn-open-final" class="btn-primary" style="font-size:18px;padding:14px 26px;">Final sualını aç</button></div>';
        app.innerHTML = html;
        app.querySelectorAll('[data-pct]').forEach(b => b.onclick = () => { game.wagerPct = Number(b.getAttribute('data-pct')); render(); });
        document.getElementById('btn-open-final').onclick = () => { sfx.flip(); game.wagerOk = true; prepareQuestionState(); render(); };
        return;
      }

      const roundTitle = { test:'Test', 'dogru-yanlis':'Doğru, yoxsa yanlış?', uygunlasdir:'Uyğunlaşdır', 'zaman-lenti':'Zaman lenti', 'sujet-zenciri':'Süjet zənciri', misra:'Misra kimindir?', 'ipucu-kart':'Kimdir bu sənətkar?', final:'Final sualı' }[q.nov] || q.nov;

      html += '<div class="card"><div class="row" style="justify-content:space-between;padding-bottom:12px;border-bottom:1px solid var(--border);">' +
        '<div class="muted"><strong style="color:var(--accent);">' + (game.inFinal ? 'Final mərhələsi' : 'Sual ' + (game.qIdx + 1) + '/' + game.questions.length) + '</strong> · ' + roundTitle + ' · ' + esc(q.dovr) + '</div>' +
        '<div class="row">' +
          (settings.timerEnabled ? '<strong id="timer-badge" style="padding:6px 12px;border:1px solid var(--border-strong);border-radius:8px;font-variant-numeric:tabular-nums;">' + game.timeLeft + ' s</strong><button id="btn-pause">' + (game.paused ? 'Davam' : 'Fasilə') + '</button>' : '') +
          '<button id="btn-quit">Çıx</button>' +
        '</div></div>';

      if (!game.inFinal) {
        const can50 = !game.answered && team.j50 && ['test','misra','ipucu-kart'].includes(q.nov);
        html += '<div class="row" style="margin-top:12px;"><span class="muted">Jokerlər:</span>' +
          '<button id="j-50" ' + (can50 ? '' : 'disabled') + '>50/50</button>' +
          '<button id="j-hint" ' + (!game.answered && team.jHint && !game.hintShown ? '' : 'disabled') + '>İpucu (-50% xal)</button>' +
          '<button id="j-time" ' + (!game.answered && settings.timerEnabled && team.jTime ? '' : 'disabled') + '>Əlavə vaxt (+15 s)</button>' +
          '</div>';
      }

      if (game.hintShown && !game.answered) {
        html += '<div style="margin-top:12px;padding:12px;border-radius:8px;background:var(--amber-soft);border:1px solid #EAB308;color:#78350F;"><strong>İpucu:</strong> ' + esc(q.jokerIpucu || (q.senetkar || q.eser || q.dovr)) + ' (Dərslik, s. ' + esc(q.sehife) + ')</div>';
      }

      html += '<div class="question-text ' + (q.nov === 'misra' ? 'serif' : '') + '">' + esc(q.sual) + '</div>';

      // Mini-game UI
      if (q.nov === 'ipucu-kart') {
        const cs = [400, 300, 200, 100];
        html += '<div class="grid-2" style="margin-bottom:14px;">' + (q.ipuclari || []).map((c, i) => {
          const open = i < game.cluesOpen || game.answered;
          return '<div style="padding:12px;border-radius:10px;border:1px solid var(--border);background:' + (open ? 'var(--bg)' : 'var(--surface-alt)') + ';"><div class="muted"><strong>' + (i+1) + '-ci ipucu · ' + cs[i] + ' xal</strong></div><div style="margin-top:4px;font-weight:600;">' + (open ? esc(c) : 'Bağlıdır') + '</div></div>';
        }).join('') + '</div>';
        if (!game.answered && game.cluesOpen < (q.ipuclari || []).length) {
          html += '<button id="btn-more-clue" class="btn-amber" style="margin-bottom:14px;">Növbəti ipucunu aç (' + cs[game.cluesOpen] + ' xal)</button>';
        }
      }

      if (q.nov === 'dogru-yanlis') {
        html += '<div class="grid-2">' +
          '<button data-bool="true" class="opt-btn ' + (game.answered ? (q.dogruMu ? 'opt-correct' : 'opt-wrong') : '') + '" ' + (game.answered ? 'disabled' : '') + '><span class="opt-letter">1</span><span>Doğru</span></button>' +
          '<button data-bool="false" class="opt-btn ' + (game.answered ? (!q.dogruMu ? 'opt-correct' : 'opt-wrong') : '') + '" ' + (game.answered ? 'disabled' : '') + '><span class="opt-letter">2</span><span>Yanlış</span></button>' +
          '</div>';
      } else if (q.nov === 'uygunlasdir' && q.cutler) {
        const usedR = new Set(Object.values(game.matches));
        const ready = q.cutler.every((_, i) => !!game.matches[i]);
        html += '<p class="muted">Soldan bənd seçib sağdan uyğun cavaba toxunun:</p><div class="grid-2"><div>' +
          q.cutler.map((c, i) => '<button data-mleft="' + i + '" class="opt-btn" style="margin-bottom:8px;min-height:52px;font-size:16px;' + (game.selectedLeft === i ? 'border-color:var(--accent);background:var(--accent-soft);' : '') + '"><span style="flex:1;">' + esc(c.left) + '</span><span class="muted">' + esc(game.matches[i] || 'Seçin') + '</span></button>').join('') +
          '</div><div>' +
          game.rightOrder.map((r, i) => '<button data-mright="' + i + '" class="opt-btn" style="margin-bottom:8px;min-height:52px;font-size:16px;' + (usedR.has(r) ? 'opacity:0.55;' : '') + '">' + esc(r) + '</button>').join('') +
          '</div></div>' +
          (!game.answered ? '<button id="btn-sub-match" class="btn-primary" style="margin-top:10px;" ' + (ready ? '' : 'disabled') + '>Cavabı yoxla</button>' : '');
      } else if ((q.nov === 'zaman-lenti' || q.nov === 'sujet-zenciri') && q.ardicilliq) {
        html += '<p class="muted">Ox düymələri ilə və ya iki karta ardıcıl toxunaraq düzün:</p><div style="display:grid;gap:8px;">' +
          game.ordered.map((it, i) => '<div class="row" style="justify-content:space-between;padding:10px 14px;border:2px solid ' + (game.answered ? (it === q.ardicilliq[i] ? 'var(--ok)' : 'var(--err)') : (game.swapSel === i ? 'var(--accent)' : 'var(--border-strong)')) + ';border-radius:10px;background:#fff;"><div data-swap="' + i + '" style="flex:1;cursor:pointer;font-size:17px;font-weight:600;">' + (i+1) + '. ' + esc(it) + '</div>' +
          (!game.answered ? '<div class="row"><button data-up="' + i + '" ' + (i === 0 ? 'disabled' : '') + '>↑</button><button data-dn="' + i + '" ' + (i === game.ordered.length - 1 ? 'disabled' : '') + '>↓</button></div>' : '') +
          '</div>').join('') +
          '</div>' + (!game.answered ? '<button id="btn-sub-ord" class="btn-primary" style="margin-top:12px;">Ardıcıllığı yoxla</button>' : '');
      } else if (game.choiceOrder) {
        const lets = ['A','B','C','D'];
        html += '<div class="grid-2">' + game.choiceOrder.map((o, i) => {
          const elim = game.eliminated.includes(i);
          let cls = 'opt-btn';
          if (elim) cls += ' opt-eliminated';
          else if (game.answered && o.isOk) cls += ' opt-correct';
          return '<button data-opt="' + i + '" class="' + cls + '" ' + (game.answered || elim ? 'disabled' : '') + '><span class="opt-letter">' + lets[i] + '</span><span>' + esc(o.text) + '</span></button>';
        }).join('') + '</div>';
      }

      if (game.answered && game.lastRes) {
        const r = game.lastRes;
        html += '<div class="feedback ' + (r.isCorrect ? 'ok' : 'err') + '">' +
          '<div class="row" style="justify-content:space-between;"><strong style="font-size:20px;">' + (r.timedOut ? 'Vaxt bitdi!' : (r.isCorrect ? 'Doğru cavab!' : 'Səhv cavab!')) + (r.pts ? ' (' + (r.pts > 0 ? '+' : '') + r.pts + ' xal)' : '') + '</strong><strong>Dərslik, s. ' + esc(q.sehife) + '</strong></div>' +
          (r.bonus ? '<div style="margin-top:6px;font-weight:700;">' + esc(r.bonus) + '</div>' : '') +
          (!r.isCorrect && r.correctText ? '<div style="margin-top:6px;font-weight:700;">Düzgün cavab: ' + esc(r.correctText) + '</div>' : '') +
          '<p style="margin:8px 0 14px;font-size:17px;">' + esc(q.izah) + '</p>' +
          '<button id="btn-next" class="btn-primary" style="background:#181A1F;border-color:#181A1F;">Növbəti (Enter)</button></div>';
      }
      html += '</div>';
      app.innerHTML = html;

      const pBtn = document.getElementById('btn-pause');
      if (pBtn) pBtn.onclick = () => { game.paused = !game.paused; if (game.paused) stopTimer(); else startTimer(); render(); };
      document.getElementById('btn-quit').onclick = () => { stopTimer(); screen = 'start'; render(); };
      const j50 = document.getElementById('j-50');
      if (j50) j50.onclick = () => {
        sfx.flip(); team.j50 = false;
        const wrongs = game.choiceOrder.map((o, i) => o.isOk ? -1 : i).filter(i => i !== -1);
        game.eliminated = shuffle(wrongs).slice(0, 2);
        render();
      };
      const jHint = document.getElementById('j-hint');
      if (jHint) jHint.onclick = () => { sfx.flip(); team.jHint = false; game.hintShown = true; render(); };
      const jTime = document.getElementById('j-time');
      if (jTime) jTime.onclick = () => { sfx.flip(); team.jTime = false; game.timeLeft += 15; render(); };
      const moreClue = document.getElementById('btn-more-clue');
      if (moreClue) moreClue.onclick = () => { sfx.flip(); game.cluesOpen++; render(); };

      app.querySelectorAll('[data-bool]').forEach(b => b.onclick = () => submitAnswer((b.getAttribute('data-bool') === 'true') === !!q.dogruMu));
      app.querySelectorAll('[data-opt]').forEach(b => b.onclick = () => {
        const idx = Number(b.getAttribute('data-opt'));
        const cs = [400, 300, 200, 100];
        const custom = q.nov === 'ipucu-kart' ? (game.choiceOrder[idx].isOk ? cs[Math.min(game.cluesOpen - 1, 3)] : 0) : null;
        submitAnswer(game.choiceOrder[idx].isOk, custom);
      });
      app.querySelectorAll('[data-mleft]').forEach(b => b.onclick = () => {
        const i = Number(b.getAttribute('data-mleft'));
        if (game.matches[i]) delete game.matches[i];
        game.selectedLeft = i; sfx.click(); render();
      });
      app.querySelectorAll('[data-mright]').forEach(b => b.onclick = () => {
        const r = game.rightOrder[Number(b.getAttribute('data-mright'))];
        let target = game.selectedLeft;
        if (target == null) target = q.cutler.findIndex((_, i) => !game.matches[i]);
        if (target != null && target >= 0) {
          Object.keys(game.matches).forEach(k => { if (game.matches[k] === r) delete game.matches[k]; });
          game.matches[target] = r; game.selectedLeft = null; sfx.click(); render();
        }
      });
      const subM = document.getElementById('btn-sub-match');
      if (subM) subM.onclick = () => submitAnswer(q.cutler.every((c, i) => game.matches[i] === c.right));
      app.querySelectorAll('[data-up]').forEach(b => b.onclick = () => {
        const i = Number(b.getAttribute('data-up'));
        const t = game.ordered[i]; game.ordered[i] = game.ordered[i-1]; game.ordered[i-1] = t; sfx.click(); render();
      });
      app.querySelectorAll('[data-dn]').forEach(b => b.onclick = () => {
        const i = Number(b.getAttribute('data-dn'));
        const t = game.ordered[i]; game.ordered[i] = game.ordered[i+1]; game.ordered[i+1] = t; sfx.click(); render();
      });
      app.querySelectorAll('[data-swap]').forEach(el => el.onclick = () => {
        if (game.answered) return;
        const i = Number(el.getAttribute('data-swap'));
        if (game.swapSel == null) game.swapSel = i;
        else { const t = game.ordered[game.swapSel]; game.ordered[game.swapSel] = game.ordered[i]; game.ordered[i] = t; game.swapSel = null; }
        sfx.click(); render();
      });
      const subO = document.getElementById('btn-sub-ord');
      if (subO) subO.onclick = () => submitAnswer(game.ordered.every((v, i) => v === q.ardicilliq[i]));
      const nxt = document.getElementById('btn-next');
      if (nxt) nxt.onclick = nextStep;
      return;
    }

    if (screen === 'end' && game) {
      const sorted = game.teams.slice().sort((a, b) => b.score - a.score);
      const win = sorted[0];
      const okCnt = game.records.filter(r => r.isCorrect).length;
      const errCnt = game.records.length - okCnt;
      const wrongMap = new Map();
      const perMiss = {}; const wrMiss = {};
      game.records.forEach(r => {
        if (!r.isCorrect) {
          wrongMap.set(r.q.id, r.q);
          perMiss[r.q.dovr] = (perMiss[r.q.dovr] || 0) + 1;
          const k = r.q.senetkar || r.q.eser || 'Ümumi';
          wrMiss[k] = (wrMiss[k] || 0) + 1;
        }
      });
      const topPer = Object.entries(perMiss).sort((a,b) => b[1]-a[1])[0];
      const topWr = Object.entries(wrMiss).sort((a,b) => b[1]-a[1])[0];
      const medals = ['🥇 Qızıl medal', '🥈 Gümüş medal', '🥉 Bürünc medal'];

      app.innerHTML = '<div class="card" style="text-align:center;"><h1 class="serif">Qalib: ' + esc(win.name) + ' (' + win.score + ' xal)</h1>' +
        '<div class="row" style="justify-content:center;margin-top:16px;">' +
          (wrongMap.size > 0 ? '<button id="btn-retry" class="btn-amber">Səhvlərimi təkrar et (' + wrongMap.size + ')</button>' : '') +
          '<button id="btn-print">Çap et (Diplom)</button>' +
          '<button id="btn-again" class="btn-primary">Yenidən oyna</button>' +
          '<button id="btn-home">Başlanğıc ekranı</button>' +
        '</div></div>' +
        '<div class="card"><h2 class="serif" style="margin-top:0;">Reytinq</h2>' +
        sorted.map((t, i) => '<div class="row" style="justify-content:space-between;padding:10px 14px;border:1px solid var(--border);border-radius:10px;margin-bottom:8px;"><div><strong>' + (medals[i] || (i+1)+'-ci yer') + '</strong> · ' + esc(t.name) + ' <span class="muted">(' + t.ok + ' doğru / ' + t.err + ' səhv)</span></div><strong style="font-size:22px;">' + t.score + ' xal</strong></div>').join('') +
        '</div>' +
        '<div class="card"><h2 class="serif" style="margin-top:0;">Statistika</h2><p>Doğru: <strong>' + okCnt + '</strong> · Səhv: <strong>' + errCnt + '</strong></p>' +
        (topPer ? '<p>Ən çox səhv edilən dövr: <strong>' + esc(topPer[0]) + '</strong> (' + topPer[1] + ')</p>' : '<p>Səhv cavab yoxdur!</p>') +
        (topWr ? '<p>Ən çox səhv edilən sənətkar/mövzu: <strong>' + esc(topWr[0]) + '</strong> (' + topWr[1] + ')</p>' : '') +
        '</div>';

      document.getElementById('diploma-root').innerHTML =
        '<div class="muted" style="text-transform:uppercase;letter-spacing:2px;">X sinif Azərbaycan ədəbiyyatı</div>' +
        '<h1 class="serif" style="font-size:48px;color:#0F5C4D;margin:16px 0;">DİPLOM</h1>' +
        '<p style="font-size:20px;">«Söz sənətimizin izi ilə» yarışmasında qalib gəldiyinə görə təltif edilir:</p>' +
        '<h2 class="serif" style="font-size:36px;border-bottom:2px solid #B45309;display:inline-block;padding:8px 36px;">' + esc(win.name) + '</h2>' +
        '<p style="font-size:22px;font-weight:700;">Toplanan xal: ' + win.score + '</p>' +
        '<p class="muted" style="margin-top:32px;">Tarix: ' + new Date().toLocaleDateString('az-Latn-AZ') + ' · Müəllim imzası: _______________</p>';

      const rBtn = document.getElementById('btn-retry');
      if (rBtn) rBtn.onclick = () => startNewGame(Array.from(wrongMap.values()));
      document.getElementById('btn-print').onclick = () => window.print();
      document.getElementById('btn-again').onclick = () => startNewGame();
      document.getElementById('btn-home').onclick = () => { screen = 'start'; render(); };
    }
  }

  function launchConfetti() {
    const c = document.getElementById('confetti');
    if (!c) return;
    const ctx = c.getContext('2d');
    c.width = window.innerWidth; c.height = window.innerHeight;
    const cols = ['#0F5C4D','#B45309','#15803D','#D97706'];
    const ps = Array.from({length: 80}, () => ({ x: Math.random()*c.width, y: -Math.random()*c.height, vy: 2+Math.random()*3, vx: (Math.random()-0.5)*2, col: cols[Math.floor(Math.random()*cols.length)] }));
    let f = 0;
    function step() {
      f++; ctx.clearRect(0,0,c.width,c.height);
      ps.forEach(p => { p.x += p.vx; p.y += p.vy; ctx.fillStyle = p.col; ctx.fillRect(p.x, p.y, 8, 6); });
      if (f < 200) requestAnimationFrame(step); else ctx.clearRect(0,0,c.width,c.height);
    }
    requestAnimationFrame(step);
  }

  function openTeacherModal() {
    const m = document.getElementById('teacher-modal');
    m.classList.remove('hidden');
    let tTab = 'bank';
    let qSearch = '';

    function drawModal() {
      const list = questionBank.filter(q => !qSearch || q.sual.toLowerCase().includes(qSearch) || (q.senetkar || '').toLowerCase().includes(qSearch));
      m.innerHTML = '<div class="modal"><div style="padding:14px 18px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;background:var(--bg);">' +
        '<div><strong class="serif" style="font-size:20px;">Müəllim paneli</strong> <span class="muted">(' + questionBank.length + ' sual)</span></div>' +
        '<div class="row"><button id="t-bank" class="' + (tTab==='bank'?'btn-active':'') + '">Sual bankı</button><button id="t-add" class="' + (tTab==='add'?'btn-active':'') + '">Yeni sual</button><button id="t-set" class="' + (tTab==='set'?'btn-active':'') + '">Parametrlər</button><button id="t-close">Bağla</button></div></div>' +
        '<div class="modal-body">' +
        (tTab === 'bank' ? (
          '<div class="row" style="justify-content:space-between;margin-bottom:12px;"><input id="t-search" value="' + esc(qSearch) + '" placeholder="Axtar..." style="max-width:280px;"><div class="row"><button id="t-exp">JSON ixrac et</button><button id="t-imp">JSON idxal et</button><input id="t-file" type="file" accept=".json" class="hidden"></div></div>' +
          '<table><thead><tr><th>ID</th><th>Dövr</th><th>Sənətkar/Əsər</th><th>Sual</th><th>Səh.</th><th>Status</th></tr></thead><tbody>' +
          list.map(q => '<tr><td>' + esc(q.id) + '</td><td>' + esc(q.dovr) + '</td><td>' + esc(q.senetkar || q.eser || 'Ümumi') + '</td><td>' + esc(q.sual) + '</td><td>' + esc(q.sehife) + '</td><td><button data-tog="' + esc(q.id) + '">' + (q.aktiv !== false ? 'Aktiv' : 'Sönülü') + '</button></td></tr>').join('') +
          '</tbody></table>'
        ) : tTab === 'add' ? (
          '<div style="display:grid;gap:10px;max-width:640px;">' +
            '<select id="n-per">' + LITERARY_STATIONS.map(s => '<option>' + esc(s.period) + '</option>').join('') + '</select>' +
            '<select id="n-dir"><option>Əsərlər</option><option>Sənətkarlar</option></select>' +
            '<input id="n-wr" placeholder="Sənətkar">' +
            '<input id="n-es" placeholder="Əsər">' +
            '<select id="n-dif"><option value="asan">Asan</option><option value="orta" selected>Orta</option><option value="cetin">Çətin</option></select>' +
            '<textarea id="n-q" rows="2" placeholder="Sual mətni"></textarea>' +
            '<input id="n-o0" placeholder="Düzgün cavab (Variant A)"><input id="n-o1" placeholder="Variant B"><input id="n-o2" placeholder="Variant C"><input id="n-o3" placeholder="Variant D">' +
            '<input id="n-iz" placeholder="İzah"><input id="n-pg" placeholder="Dərslik səhifəsi">' +
            '<button id="n-save" class="btn-primary">Əlavə et</button>' +
          '</div>'
        ) : (
          '<div style="display:grid;gap:12px;max-width:460px;">' +
            '<label><input id="s-tmr" type="checkbox" style="width:auto;margin-right:8px;" ' + (settings.timerEnabled ? 'checked' : '') + '>Taymer aktivdir</label>' +
            '<label>Vaxt (saniyə): <select id="s-sec"><option value="20">20</option><option value="30">30</option><option value="45">45</option><option value="60">60</option></select></label>' +
            '<label>Susmaya görə sual sayı: <select id="s-cnt"><option value="10">10</option><option value="20">20</option><option value="30">30</option></select></label>' +
          '</div>'
        )) + '</div></div>';

      document.getElementById('t-close').onclick = () => { m.classList.add('hidden'); render(); };
      document.getElementById('t-bank').onclick = () => { tTab = 'bank'; drawModal(); };
      document.getElementById('t-add').onclick = () => { tTab = 'add'; drawModal(); };
      document.getElementById('t-set').onclick = () => { tTab = 'set'; drawModal(); };

      if (tTab === 'bank') {
        const sr = document.getElementById('t-search');
        sr.oninput = () => { qSearch = sr.value.toLowerCase(); drawModal(); };
        m.querySelectorAll('[data-tog]').forEach(b => b.onclick = () => {
          const id = b.getAttribute('data-tog');
          if (disabledIds.has(id)) disabledIds.delete(id); else disabledIds.add(id);
          lsSet(LS_DISABLED, Array.from(disabledIds));
          rebuildBank(); drawModal();
        });
        document.getElementById('t-exp').onclick = () => {
          const blob = new Blob([JSON.stringify(questionBank, null, 2)], { type: 'application/json' });
          const u = URL.createObjectURL(blob);
          const a = document.createElement('a'); a.href = u; a.download = 'sual-banki.json'; a.click(); URL.revokeObjectURL(u);
        };
        document.getElementById('t-imp').onclick = () => document.getElementById('t-file').click();
        document.getElementById('t-file').onchange = (e) => {
          const f = e.target.files[0]; if (!f) return;
          const r = new FileReader();
          r.onload = () => {
            try {
              const arr = JSON.parse(r.result);
              if (Array.isArray(arr)) { customQuestions = customQuestions.concat(arr); lsSet(LS_CUSTOM, customQuestions); rebuildBank(); drawModal(); }
            } catch (err) {}
          };
          r.readAsText(f, 'utf-8');
        };
      } else if (tTab === 'add') {
        document.getElementById('n-save').onclick = () => {
          const qText = document.getElementById('n-q').value.trim();
          const a = document.getElementById('n-o0').value.trim();
          const b = document.getElementById('n-o1').value.trim();
          const c = document.getElementById('n-o2').value.trim();
          const d = document.getElementById('n-o3').value.trim();
          if (!qText || !a || !b || !c || !d) return;
          customQuestions.push({
            id: 'custom-' + Date.now(),
            dovr: document.getElementById('n-per').value,
            istiqamet: document.getElementById('n-dir').value,
            senetkar: document.getElementById('n-wr').value.trim() || null,
            eser: document.getElementById('n-es').value.trim() || null,
            nov: 'test',
            cetinlik: document.getElementById('n-dif').value,
            sual: qText,
            variantlar: [a, b, c, d],
            duzgun: 0,
            izah: document.getElementById('n-iz').value.trim() || 'Müəllim tərəfindən əlavə edilib.',
            sehife: document.getElementById('n-pg').value.trim() || '—',
            aktiv: true
          });
          lsSet(LS_CUSTOM, customQuestions);
          rebuildBank(); tTab = 'bank'; drawModal();
        };
      } else {
        document.getElementById('s-sec').value = String(settings.timerSeconds);
        document.getElementById('s-cnt').value = String(settings.defaultQuestionCount);
        document.getElementById('s-tmr').onchange = (e) => { settings.timerEnabled = e.target.checked; lsSet(LS_SETTINGS, settings); };
        document.getElementById('s-sec').onchange = (e) => { settings.timerSeconds = Number(e.target.value); lsSet(LS_SETTINGS, settings); };
        document.getElementById('s-cnt').onchange = (e) => { settings.defaultQuestionCount = Number(e.target.value); config.questionCount = settings.defaultQuestionCount; lsSet(LS_SETTINGS, settings); };
      }
    }
    drawModal();
  }

  render();
})();
</script>
</body>
</html>`;
}

export function downloadSingleOfflineHtml(questions: Question[]): void {
  const html = buildSingleOfflineHtml(questions);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'soz-senetimizin-izi-ile.html';
  a.click();
  URL.revokeObjectURL(url);
}
