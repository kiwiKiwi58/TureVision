const tests = [
  { id: 'reaction', title: '반응속도', subtitle: '시각 자극에 반응하는 순발력', time: '약 45초', tag: 'MOTOR RESPONSE', icon: '<path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48 2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48 2.83-2.83"/><circle cx="12" cy="12" r="3"/>' },
  { id: 'cff', title: '임계융합주파수', subtitle: '깜빡임이 연속광으로 보이는 지점', time: '직접 조절', tag: 'FLICKER FUSION', icon: '<path d="M3 12h4l3-8 4 16 3-8h4"/>' },
  { id: 'color', title: '색채 인식', subtitle: '미세한 색상 차이를 구별하는 능력', time: '최대 20단계', tag: 'CHROMATIC SENSE', icon: '<circle cx="12" cy="12" r="9"/><path d="M12 3v18m9-9H3m15.36-6.36L5.64 18.36m12.72 0L5.64 5.64"/>' },
  { id: 'contrast', title: '대비 감도', subtitle: '낮은 대비 형상을 구분하는 민감도', time: '직접 조절', tag: 'CONTRAST SENSITIVITY', icon: '<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 0 0 18z"/>' },
];
const app = document.querySelector('#app');
const modalRoot = document.querySelector('#modal-root');
let activeTimer = null;
let frameRequest = null;
let currentCleanup = null;
let batteryQueue = null;
let toastTimer = null;
let modalKeyHandler = null;

app.innerHTML = `
  <header class="topbar shell">
    <a class="brand" href="#top" aria-label="TureVision 홈">
      <svg class="brand-mark" viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M3 16c3.8-6.2 8.1-9.3 13-9.3S25.2 9.8 29 16c-3.8 6.2-8.1 9.3-13 9.3S6.8 22.2 3 16Z" stroke="currentColor" stroke-width="1.5"/><circle cx="16" cy="16" r="4.5" fill="currentColor"/><circle cx="16" cy="16" r="1.5" fill="#07100C"/></svg>
      <span class="brand-name">TureVision</span>
    </a>
    <nav class="topnav"><a href="#tests">테스트</a><a href="#how">측정 안내</a><a href="#results">내 기록</a></nav>
    <div class="top-right"><span class="session-label"><i class="live-dot"></i>LOCAL SESSION</span></div>
  </header>
  <main id="top" class="shell">
    <section class="hero">
      <div class="hero-content">
        <p class="eyebrow">VISUAL PERFORMANCE / 01</p>
        <h1>시각 기능 테스트</h1>
        <p class="hero-copy">반응속도, 임계융합주파수, 색채 인식, 대비 감도를 간단히 확인해보세요.</p>
        <div class="hero-actions"><button class="button button-primary" id="start-all"><span class="button-face">전체 테스트 시작 <span class="arrow">↗</span></span></button><a class="button button-quiet" href="#tests"><span class="button-face">테스트 둘러보기 <span class="arrow">↓</span></span></a></div>
        <p class="hero-note">NO SIGN-UP &nbsp;·&nbsp; 100% BROWSER-BASED &nbsp;·&nbsp; 약 2분</p>
      </div>
    </section>
    <section class="metrics" aria-label="측정 정보"><div class="metric"><strong>04 <span style="color:var(--mint)">/</span> TESTS</strong><span>시각 퍼포먼스 지표</span></div><div class="metric"><strong>~02 <span style="color:var(--mint)">MIN</span></strong><span>전체 측정 시간</span></div><div class="metric"><strong>100<span style="color:var(--mint)">%</span></strong><span>기기 내에서만 측정</span></div></section>
    <section id="tests" class="tests-section">
      <div class="section-head"><div><p class="eyebrow">THE PROTOCOL / 04 MEASURES</p><h2>시각 퍼포먼스 테스트</h2></div><p class="section-caption">원하는 항목부터 가볍게 시작하세요.</p></div>
      <div class="tests-grid">${tests.map((test, index) => `<article class="test-card"><div class="card-top"><span class="test-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${test.icon}</svg></span><span class="test-index">0${index + 1} / 04</span></div><h3>${test.title}</h3><p>${test.subtitle}</p><div class="card-bottom"><span class="card-meta">${test.tag} &nbsp;·&nbsp; ${test.time}</span><button class="card-start" data-test="${test.id}">측정하기 ↗</button></div></article>`).join('')}</div>
    </section>
    <section id="results" class="results-strip"><div class="results-info"><span class="results-icon">⌁</span><div><h3>나의 측정 기록</h3><p id="record-copy">테스트 결과는 이 브라우저에만 저장됩니다.</p></div></div><div class="result-summary"><div class="result-stat"><strong id="record-score">—</strong><span>최근 종합 점수</span></div><div class="result-stat"><strong id="record-count">0 / 4</strong><span>완료한 테스트</span></div><button class="outline-button" id="clear-record">기록 초기화</button></div></section>
    <section id="how" class="section-head" style="margin-bottom:48px"><div><p class="eyebrow">A NOTE ON MEASUREMENT</p><h2>결과는 참고 지표로 활용하세요.</h2></div><p class="section-caption" style="max-width:380px;line-height:1.8">기기 화면, 주변 조명, 입력 지연은 측정값에 영향을 줍니다.<br>의학적 진단이나 임상 검사를 대체하지 않습니다.</p></section>
  </main>
  <footer class="foot shell"><span><strong>TureVision</strong> &nbsp; 시각 기능 테스트</span><span>TureVision &nbsp;·&nbsp; © 2026</span></footer>`;

function loadRecords() { try { return JSON.parse(localStorage.getItem('optik-records') || '{}'); } catch { return {}; } }
function saveRecord(id, score, value, label) { const records = loadRecords(); records[id] = { score: Math.round(score), value, label, date: Date.now() }; localStorage.setItem('optik-records', JSON.stringify(records)); updateDashboard(); }
function updateDashboard() {
  const records = loadRecords(); const entries = tests.map(test => records[test.id]).filter(Boolean); const score = entries.length ? Math.round(entries.reduce((sum, entry) => sum + entry.score, 0) / entries.length) : null;
  document.querySelector('#record-score').textContent = score === null ? '—' : `${score}`;
  document.querySelector('#record-count').textContent = `${entries.length} / ${tests.length}`;
  document.querySelector('#record-copy').textContent = entries.length ? `마지막 측정 · ${new Date(Math.max(...entries.map(item => item.date))).toLocaleDateString('ko-KR')}` : '테스트 결과는 이 브라우저에만 저장됩니다.';
}
updateDashboard();
document.querySelectorAll('[data-test]').forEach(button => button.addEventListener('click', () => startTest(button.dataset.test)));
document.querySelector('#start-all').addEventListener('click', () => { batteryQueue = tests.map(item => item.id); startTest(batteryQueue.shift(), true); });
document.querySelector('#clear-record').addEventListener('click', () => { localStorage.removeItem('optik-records'); updateDashboard(); showToast('측정 기록을 초기화했어요.'); });

function showToast(message) { const toast = document.querySelector('#toast'); toast.textContent = message; toast.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('show'), 2300); }
function stopActive() { clearTimeout(activeTimer); activeTimer = null; if (frameRequest) cancelAnimationFrame(frameRequest); frameRequest = null; if (currentCleanup) currentCleanup(); currentCleanup = null; }
function closeModal() { stopActive(); modalRoot.innerHTML = ''; if (modalKeyHandler) document.removeEventListener('keydown', modalKeyHandler); modalKeyHandler = null; if (batteryQueue && batteryQueue.length) batteryQueue = null; }
function startTest(id, battery = false) {
  stopActive();
  const test = tests.find(item => item.id === id);
  modalRoot.innerHTML = `<div class="modal-backdrop"><section class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><button class="modal-close" aria-label="닫기">×</button><div class="modal-kicker">${test.tag} &nbsp; / &nbsp; ${tests.findIndex(item => item.id === id) + 1} OF 04</div><h2 id="modal-title">${test.title}</h2><p class="modal-intro">${test.subtitle}${id === 'cff' ? '<br><span style="color:#c3a886">※ 화면 주사율·브라우저 환경에 따라 결과가 달라질 수 있는 참고 측정입니다.</span>' : ''}</p><div class="test-area" id="test-area"></div><div class="progress-row" id="progress-row">${Array.from({ length: id === 'reaction' ? 5 : id === 'color' ? 20 : 0 }, (_, i) => `<i class="progress-tick" data-tick="${i}"></i>`).join('')}</div><p class="fine-print">결과는 참고용이며, 의료적 진단을 위한 검사가 아닙니다. 입력 지연은 기기와 환경의 영향을 받습니다.</p></section></div>`;
  modalRoot.querySelector('.modal-close').addEventListener('click', closeModal);
  modalRoot.querySelector('.modal-backdrop').addEventListener('click', event => { if (event.target.classList.contains('modal-backdrop')) closeModal(); });
  modalKeyHandler = event => { if (event.key === 'Escape' && modalRoot.innerHTML) closeModal(); };
  document.addEventListener('keydown', modalKeyHandler);
  const area = document.querySelector('#test-area');
  const ticks = [...document.querySelectorAll('.progress-tick')];
  const progress = index => ticks.forEach((tick, i) => tick.classList.toggle('active', i <= index));
  const finish = (score, value, label, detail, note = '') => {
    stopActive(); saveRecord(id, score, value, label);
    const hasNext = battery && batteryQueue && batteryQueue.length;
    const isLast = battery && batteryQueue && !batteryQueue.length;
    area.innerHTML = `<div><span class="phase-pill">${isLast ? 'BATTERY COMPLETE' : 'TEST COMPLETE'}</span><h3>측정이 끝났어요.</h3><div class="score-big">${value}</div><p>${label}</p><div class="result-details">${detail}</div><button class="button button-primary" id="result-action"><span class="button-face">${hasNext ? '다음 테스트' : isLast ? '전체 결과 확인' : '완료'} <span class="arrow">${hasNext || isLast ? '↗' : '✓'}</span></span></button>${note ? `<p class="fine-print">${note}</p>` : ''}</div>`;
    document.querySelector('#result-action').addEventListener('click', () => {
      if (hasNext) startTest(batteryQueue.shift(), true);
      else if (isLast) showBatteryResult();
      else closeModal();
    });
  };
  const detailCell = (name, value) => `<div class="result-detail"><span>${name}</span><strong>${value}</strong></div>`;

  if (id === 'reaction') {
    let times = [], trial = 0, readyAt = 0, phase = 'intro';
    const intro = () => { phase = 'intro'; area.innerHTML = `<div><span class="phase-pill">5 VALID TRIALS</span><h3>빨간색에서 초록색으로 바뀌면 누르세요.</h3><p>초록색이 되기 전에 누르거나, 전환 후 100ms 안에 누르면 점프스타트로 무효 처리됩니다.</p><button class="button button-primary" id="reaction-start"><span class="button-face">준비하기 ↗</span></button></div>`; document.querySelector('#reaction-start').onclick = nextTrial; };
    const nextTrial = () => { phase = 'wait'; area.innerHTML = `<div class="reaction-pad wait"><p>빨간색 — 기다리세요</p></div>`; const pad = area.querySelector('.reaction-pad'); pad.onclick = () => { if (phase === 'ready') { const elapsed = performance.now() - readyAt; if (elapsed <= 100) { phase = 'jumpstart'; pad.className = 'reaction-pad wait'; pad.innerHTML = '<p>점프스타트 — 100ms 이하, 라운드 무효</p>'; activeTimer = setTimeout(nextTrial, 900); return; } times.push(elapsed); trial++; progress(trial - 1); if (trial >= 5) { const average = Math.round(times.reduce((a,b) => a+b,0) / times.length); const sorted = [...times].sort((a,b)=>a-b); const median = Math.round(sorted[2]); finish(Math.max(0, Math.min(100, (620 - median) / 4.2)), `${median}<small style="font-size:20px"> ms</small>`, '중앙값 반응속도', detailCell('평균', `${average} ms`) + detailCell('최고', `${Math.min(...times).toFixed(0)} ms`) + detailCell('유효 라운드', '5 회')); } else nextTrial(); } else if (phase === 'wait') { clearTimeout(activeTimer); phase = 'false-start'; pad.className = 'reaction-pad wait'; pad.innerHTML = '<p>초록색 전 입력 — 라운드 무효</p>'; activeTimer = setTimeout(nextTrial, 900); } }; activeTimer = setTimeout(() => { if (phase !== 'wait') return; phase = 'ready'; readyAt = performance.now(); pad.className = 'reaction-pad ready'; pad.innerHTML = '<p>초록색 — 지금 누르세요!</p>'; }, 1300 + Math.random() * 2200); };
    intro();
  }
  if (id === 'color') {
    let round = 0, correct = 0, misses = 0; const maxRounds = 20;
    const run = () => { if (round >= maxRounds || misses >= 3) { const accuracy = round ? Math.round(correct / round * 100) : 0; finish(accuracy, `${accuracy}<small style="font-size:20px">%</small>`, misses >= 3 ? '오답 3회로 테스트 종료' : '색상 차이 정답률', detailCell('정답', `${correct} / ${round}`) + detailCell('오답', `${misses} / 3`) + detailCell('진행 라운드', `${round} / ${maxRounds}`)); return; }
      progress(round); const hue = Math.floor(Math.random()*360), sat = 57 + Math.floor(Math.random()*17), light = 48 + Math.floor(Math.random()*10); const delta = Math.max(3, 23 - correct * 1.05); const odd = Math.floor(Math.random()*25); area.innerHTML = `<div><span class="phase-pill">LEVEL ${round + 1} / ${maxRounds} &nbsp; · &nbsp; ${misses} MISSES</span><h3>색이 다른 타일을 찾아보세요.</h3><p>정답을 맞힐수록 색상 차이가 작아집니다. 오답 3회면 종료됩니다.</p><div class="color-board">${Array.from({length:25}, (_, i) => `<button class="color-tile" data-index="${i}" aria-label="색상 타일" style="background:hsl(${hue + (i === odd ? delta : 0)} ${sat}% ${light}%);border-color:hsl(${hue + (i === odd ? delta : 0)} ${sat}% ${light - 8}%)"></button>`).join('')}</div></div>`;
      area.querySelectorAll('.color-tile').forEach(tile => tile.addEventListener('click', () => { if (Number(tile.dataset.index) === odd) correct++; else misses++; round++; run(); }));
    }; run();
  }
  if (id === 'cff') {
    area.innerHTML = `<div class="tuning-panel"><span class="phase-pill">CONTINUOUS TUNING</span><div class="flicker-disc" id="flicker-disc"></div><h3>깜빡임이 사라지는 지점을 직접 찾아보세요.</h3><p>슬라이더나 숫자를 조절해 원이 안정적으로 보이는 주파수를 맞추세요.</p><p class="cff-refresh" id="cff-refresh">화면 주사율 감지 중…</p><div class="measure-controls"><input id="cff-range" type="range" min="1" max="30" step="1" value="20" aria-label="주파수 조절" disabled><label class="measure-input"><input id="cff-value" type="number" min="1" max="30" step="1" value="20" aria-label="주파수 입력" disabled><span>Hz</span></label></div><button class="button button-primary" id="cff-save" disabled><span class="button-face">이 값으로 기록 <span class="arrow">↗</span></span></button></div>`;
    const disc = document.querySelector('#flicker-disc'), range = document.querySelector('#cff-range'), input = document.querySelector('#cff-value'), refreshLabel = document.querySelector('#cff-refresh'), saveButton = document.querySelector('#cff-save');
    let then = performance.now(), visible = true, refreshHz = 60, maxHz = 30;
    const syncCff = source => { const raw = Number(source.value); if (!Number.isFinite(raw)) return; const value = Math.max(1, Math.min(maxHz, Math.round(raw))); range.value = value; input.value = value; };
    range.addEventListener('input', () => syncCff(range)); input.addEventListener('input', () => syncCff(input)); input.addEventListener('change', () => syncCff(input));
    const enableControls = () => { range.disabled = false; input.disabled = false; saveButton.disabled = false; then = performance.now(); frameRequest = requestAnimationFrame(animate); };
    let lastFrame = null, frames = 0; const frameIntervals = [];
    const detectRefreshRate = now => {
      if (lastFrame !== null) { const interval = now - lastFrame; if (frames > 8 && interval >= 3 && interval <= 100) frameIntervals.push(interval); }
      lastFrame = now; frames++;
      if (frameIntervals.length < 50) { frameRequest = requestAnimationFrame(detectRefreshRate); return; }
      const sortedIntervals = [...frameIntervals].sort((a, b) => a - b);
      const medianInterval = sortedIntervals[Math.floor(sortedIntervals.length / 2)];
      refreshHz = Math.max(1, Math.round(1000 / medianInterval)); maxHz = Math.max(1, Math.floor(refreshHz / 2));
      const initialHz = Math.min(20, maxHz);
      range.max = maxHz; input.max = maxHz; range.value = initialHz; input.value = initialHz;
      refreshLabel.textContent = `감지 주사율 약 ${refreshHz}Hz · 측정 상한 ${maxHz}Hz (주사율의 절반)`;
      if (refreshHz <= 120) {
        const warning = document.createElement('div');
        warning.className = 'cff-warning'; warning.setAttribute('role', 'alertdialog'); warning.setAttribute('aria-modal', 'true'); warning.setAttribute('aria-labelledby', 'cff-warning-title');
        warning.innerHTML = `<section class="cff-warning-card"><span class="phase-pill">DISPLAY LIMIT WARNING</span><h2 id="cff-warning-title">모니터 주사율이 낮아 측정 정확도가 떨어질 수 있어요.</h2><p>감지된 주사율은 약 <strong>${refreshHz}Hz</strong>입니다. 일반적인 CFF는 약 60Hz 전후인데, 이 화면은 주사율의 절반인 <strong>${maxHz}Hz</strong>까지만 깜빡임을 표현할 수 있어 평균적인 임계점 근처를 정확히 측정하지 못할 수 있습니다.</p><p class="cff-warning-note">참고용 경고이며 테스트는 계속 진행할 수 있습니다.</p><button class="button button-primary" id="cff-warning-continue"><span class="button-face">확인하고 계속하기 <span class="arrow">↗</span></span></button></section>`;
        modalRoot.querySelector('.modal').append(warning);
        warning.querySelector('#cff-warning-continue').addEventListener('click', () => { warning.remove(); enableControls(); });
        warning.querySelector('#cff-warning-continue').focus();
      } else enableControls();
    };
    const animate = now => { const hz = Number(range.value); if (now - then >= 500 / hz) { visible = !visible; disc.style.opacity = visible ? '1' : '.06'; then = now; } frameRequest = requestAnimationFrame(animate); };
    frameRequest = requestAnimationFrame(detectRefreshRate);
    saveButton.addEventListener('click', () => { const hz = Number(input.value); const score = Math.round(hz / maxHz * 100); finish(score, `${hz}<small style="font-size:20px"> Hz</small>`, '직접 조절한 융합 지점', detailCell('입력 주파수', `${hz} Hz`) + detailCell('감지 주사율', `약 ${refreshHz} Hz`) + detailCell('허용 상한', `${maxHz} Hz`), '브라우저가 감지한 화면 갱신 주기를 기준으로 상한을 제한했습니다. 실제 모니터 주사율과 깜빡임 표현은 환경에 따라 다를 수 있습니다.'); });
  }
  if (id === 'contrast') {
    area.innerHTML = `<div class="tuning-panel"><span class="phase-pill">CONTINUOUS TUNING</span><div class="contrast-target" id="contrast-target"></div><h3>원이 간신히 보이는 대비를 찾아보세요.</h3><p>슬라이더나 숫자를 조절해 원이 보이기 시작하는 최소 대비값을 맞추세요.</p><div class="measure-controls"><input id="contrast-range" type="range" min="0" max="50" step="0.1" value="25" aria-label="대비 조절"><label class="measure-input"><input id="contrast-value" type="number" min="0" max="50" step="0.1" value="25" aria-label="대비 입력"><span>%</span></label></div><button class="button button-primary" id="contrast-save"><span class="button-face">이 값으로 기록 <span class="arrow">↗</span></span></button></div>`;
    const target = document.querySelector('#contrast-target'), range = document.querySelector('#contrast-range'), input = document.querySelector('#contrast-value');
    const syncContrast = source => { const raw = Number(source.value); if (!Number.isFinite(raw)) return; const value = Math.max(0, Math.min(50, Math.round(raw * 10) / 10)); range.value = value; input.value = value.toFixed(1); target.style.background = `rgba(205,233,218,${value / 100})`; target.style.borderColor = `rgba(205,233,218,${value / 100})`; };
    syncContrast(range); range.addEventListener('input', () => syncContrast(range)); input.addEventListener('input', () => syncContrast(input)); input.addEventListener('change', () => syncContrast(input));
    document.querySelector('#contrast-save').addEventListener('click', () => { const value = Number(input.value); const score = Math.round((50 - value) * 2); finish(score, `${value.toFixed(1)}<small style="font-size:20px">%</small>`, '직접 조절한 최소 대비값', detailCell('입력 대비', `${value.toFixed(1)}%`) + detailCell('낮은 대비 감도', `${score} 점`) + detailCell('측정 방식', '직접 조절'), '화면 밝기와 주변 조명에 따라 체감 대비가 달라질 수 있습니다.'); });
  }
}

function showBatteryResult() {
  const records = loadRecords(), entries = tests.map(test => records[test.id]).filter(Boolean), score = entries.length ? Math.round(entries.reduce((sum, entry) => sum + entry.score, 0) / entries.length) : 0;
  const breakdown = tests.map(test => { const record = records[test.id]; return `<div class="result-detail"><span>${test.title}</span><strong>${record ? record.value : '—'}</strong></div>`; }).join('');
  const area = document.querySelector('#test-area');
  area.innerHTML = `<div><span class="phase-pill">VISUAL PERFORMANCE</span><h3>오늘의 시각 퍼포먼스</h3><div class="score-big">${score}<small style="font-size:20px"> / 100</small></div><p>완료한 4개 항목의 단순 평균 점수입니다.</p><div class="result-details" style="grid-template-columns:repeat(2,1fr)">${breakdown}</div><button class="button button-primary" id="battery-done"><span class="button-face">확인 <span class="arrow">✓</span></span></button><p class="fine-print">이 점수는 TureVision 테스트의 상대적 참고값이며, 인구 집단 기준 백분위나 의학적 평가가 아닙니다.</p></div>`;
  document.querySelector('#battery-done').onclick = closeModal;
}
