'use strict';
// ============================================================
//  Touch — 手機觸控操作
//  遊戲中：在畫面任意處拖曳＝相對移動（自動射擊），按鈕：符卡／低速／暫停／快轉
//  選單中：虛擬方向鍵＋決定／返回，也可以直接點選單項目
// ============================================================
(function () {
  const U = FW.U, Input = FW.Input;
  const T = FW.Touch = { on: false };
  const SENS = 1.25;  // 手指移動 → 自機移動的倍率

  const css = `
  #tc { position: fixed; inset: 0; pointer-events: none; z-index: 10; display: none; font-family: "Noto Sans TC","PingFang TC",sans-serif; }
  body.touch #tc { display: block; }
  #tc .grp { position: absolute; display: flex; gap: 12px; align-items: center; pointer-events: none; }
  #tc .tb { pointer-events: auto; width: 62px; height: 62px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.45);
    background: rgba(30,20,50,0.55); color: #fff; font-size: 15px; font-weight: bold; display: flex; align-items: center; justify-content: center;
    user-select: none; -webkit-user-select: none; -webkit-touch-callout: none; touch-action: none; backdrop-filter: blur(2px); }
  #tc .tb.big { width: 78px; height: 78px; font-size: 17px; background: rgba(160,40,90,0.6); }
  #tc .tb.on, #tc .tb:active { background: rgba(255,154,214,0.7); border-color: #fff; }
  #tc .tb.small { width: 44px; height: 44px; font-size: 13px; }
  #tc .pad { display: grid; grid-template-columns: repeat(3, 58px); grid-template-rows: repeat(3, 58px); gap: 4px; }
  #tc .pad .tb { width: 58px; height: 58px; border-radius: 14px; }
  #tc .hide { display: none !important; }
  #tc .col { flex-direction: column; }
  body.touch { touch-action: none; -webkit-user-select: none; user-select: none; overscroll-behavior: none; }
  body.portrait #tc .pad { grid-template-columns: repeat(3, 52px); grid-template-rows: repeat(3, 52px); }
  body.portrait #tc .pad .tb { width: 52px; height: 52px; }
  body.touch.portrait { align-items: flex-start; padding-top: env(safe-area-inset-top); }
  `;
  function el(html) { const d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstChild; }

  function build() {
    const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    const root = el(`<div id="tc">
      <div class="grp g-game gl">
        <div class="tb big" data-act="bomb">符卡</div>
        <div class="tb" data-toggle="focus">低速</div>
      </div>
      <div class="grp g-game gr">
        <div class="tb" data-hold="skip">快轉</div>
        <div class="tb" data-act="pause">❚❚</div>
      </div>
      <div class="grp g-menu ml">
        <div class="pad">
          <span></span><div class="tb" data-act="up">▲</div><span></span>
          <div class="tb" data-act="left">◀</div><span></span><div class="tb" data-act="right">▶</div>
          <span></span><div class="tb" data-act="down">▼</div><span></span>
        </div>
      </div>
      <div class="grp g-menu mr">
        <div class="tb small" data-act="focus">Shift</div>
        <div class="tb" data-act="cancel">返回</div>
        <div class="tb big" data-act="confirm">決定</div>
      </div>
      <div class="grp gfs"><div class="tb small" data-fs="1">⛶</div></div>
    </div>`);
    document.body.appendChild(root);
    T.root = root;
    T.gGame = root.querySelectorAll('.g-game'); T.gMenu = root.querySelectorAll('.g-menu');
    T.focusBtn = root.querySelector('[data-toggle="focus"]');
    // 按鈕
    root.querySelectorAll('.tb').forEach(b => {
      const down = e => {
        e.preventDefault(); e.stopPropagation(); FW.Audio.unlock();
        const a = b.dataset.act, h = b.dataset.hold, tg = b.dataset.toggle;
        if (a) { Input.vheld[a] = true; Input.tapHit(a); b.classList.add('on'); }
        if (h) { Input.vheld[h] = true; b.classList.add('on'); }
        if (tg) { Input.vheld[tg] = !Input.vheld[tg]; b.classList.toggle('on', Input.vheld[tg]); }
        if (b.dataset.fs) { if (document.fullscreenElement) document.exitFullscreen(); else if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(() => { }); setTimeout(() => window.dispatchEvent(new Event('resize')), 300); }
      };
      const up = e => {
        e.preventDefault(); e.stopPropagation();
        const a = b.dataset.act || b.dataset.hold;
        if (a) { Input.vheld[a] = false; b.classList.remove('on'); }
      };
      b.addEventListener('touchstart', down, { passive: false });
      b.addEventListener('touchend', up, { passive: false });
      b.addEventListener('touchcancel', up, { passive: false });
    });
  }

  // ---------- 拖曳移動與點擊 ----------
  let drag = null;
  function enable() {
    if (T.on) return;
    T.on = true; FW.touchMode = true;
    document.body.classList.add('touch');
    layout();
    if (window.innerHeight > window.innerWidth) setTimeout(() => FW.toast && FW.toast('提示：橫向握持手機，畫面會更大喔', '#cfe0ff'), 600);
  }
  function onStart(e) {
    enable();
    if (e.target.closest && e.target.closest('.tb')) return;
    e.preventDefault();
    FW.Audio.unlock();
    if (drag) return;
    const t = e.changedTouches[0];
    drag = { id: t.identifier, x: t.clientX, y: t.clientY, sx: t.clientX, sy: t.clientY, t0: performance.now() };
  }
  function onMove(e) {
    if (!drag) return;
    e.preventDefault();
    for (const t of e.changedTouches) {
      if (t.identifier !== drag.id) continue;
      const k = FW.view.w / FW.canvas.getBoundingClientRect().width * SENS;
      Input.touchAcc.x += (t.clientX - drag.x) * k; Input.touchAcc.y += (t.clientY - drag.y) * k;
      drag.x = t.clientX; drag.y = t.clientY;
    }
  }
  function onEnd(e) {
    if (!drag) return;
    for (const t of e.changedTouches) {
      if (t.identifier !== drag.id) continue;
      const moved = Math.hypot(t.clientX - drag.sx, t.clientY - drag.sy), dt = performance.now() - drag.t0;
      if (moved < 14 && dt < 350) tap(t.clientX, t.clientY);
      drag = null;
    }
  }
  function tap(cx, cy) {
    const r = FW.canvas.getBoundingClientRect();
    const x = FW.view.x + (cx - r.left) / r.width * FW.view.w, y = FW.view.y + (cy - r.top) / r.height * FW.view.h;
    const rects = FW._menuRects || [];
    const hit = rects.find(m => x >= m.x && x <= m.x + m.w && y >= m.y && y <= m.y + m.h);
    if (hit) { FW._tapItemNext = hit.i; return; }
    const sc = FW.SM.cur;
    Input.keyLog.push('Tap');
    if (!(sc && sc.noTapConfirm)) Input.tapHit('confirm');
  }

  // ---------- 版面 ----------
  function layout() {
    if (!T.root) return;
    const port = window.innerHeight > window.innerWidth;
    document.body.classList.toggle('portrait', port);
    const q = s => T.root.querySelector(s);
    const set = (s, st) => Object.assign(q(s).style, { left: '', right: '', top: '', bottom: '', transform: '' }, st);
    const sb = 'calc(14px + env(safe-area-inset-bottom))';
    if (port) {
      set('.gl', { left: '16px', bottom: sb }); set('.gr', { right: '16px', bottom: sb });
      set('.ml', { left: '10px', bottom: sb }); set('.mr', { right: '12px', bottom: sb });
      q('.gl').classList.remove('col'); q('.gr').classList.remove('col'); q('.mr').classList.add('col');
    } else {
      set('.gl', { left: 'calc(12px + env(safe-area-inset-left))', bottom: '18px' }); set('.gr', { right: 'calc(12px + env(safe-area-inset-right))', bottom: '18px' });
      set('.ml', { left: 'calc(8px + env(safe-area-inset-left))', top: '50%', transform: 'translateY(-50%)' }); set('.mr', { right: 'calc(12px + env(safe-area-inset-right))', top: '50%', transform: 'translateY(-50%)' });
      q('.gl').classList.add('col'); q('.gr').classList.add('col'); q('.mr').classList.add('col');
    }
    T.port = port; T.placeFs();
    window.dispatchEvent(new Event('resize'));
  }
  T.placeFs = () => {
    const f = T.root.querySelector('.gfs').style;
    Object.assign(f, { left: '', right: '', top: '', bottom: '', transform: '' });
    if (T.port && lastMode === 'game') Object.assign(f, { left: '50%', bottom: 'calc(20px + env(safe-area-inset-bottom))', transform: 'translateX(-50%)' });
    else Object.assign(f, { right: '10px', top: 'calc(8px + env(safe-area-inset-top))' });
  };
  T.reserve = () => {
    // 回傳要留給按鈕的空間（css px）
    if (!T.on) return { w: 0, h: 0 };
    return window.innerHeight > window.innerWidth ? { w: 0, h: 175 } : { w: 2 * 150, h: 0 };
  };

  // 每幀：切換顯示「遊戲用」或「選單用」按鈕
  let lastMode = '';
  T.sync = () => {
    if (!T.on) return;
    const sc = FW.SM.cur, inGame = !!(sc && sc.g && !sc.paused && !sc.cont);
    const mode = inGame ? 'game' : 'menu';
    if (mode !== lastMode) {
      lastMode = mode;
      T.gGame.forEach(g => g.classList.toggle('hide', !inGame));
      T.gMenu.forEach(g => g.classList.toggle('hide', inGame));
      if (!inGame) { Input.vheld.focus = false; T.focusBtn.classList.remove('on'); }
      T.placeFs();
    }
  };

  build();
  document.addEventListener('touchstart', onStart, { passive: false });
  document.addEventListener('touchmove', onMove, { passive: false });
  document.addEventListener('touchend', onEnd, { passive: false });
  document.addEventListener('touchcancel', onEnd, { passive: false });
  window.addEventListener('orientationchange', () => setTimeout(layout, 250));
  window.addEventListener('resize', () => { if (T.on) { const p = window.innerHeight > window.innerWidth; if (p !== document.body.classList.contains('portrait')) layout(); } });
  // 雙指縮放、長按選單等全部關掉
  document.addEventListener('gesturestart', e => e.preventDefault());
  document.addEventListener('contextmenu', e => { if (T.on) e.preventDefault(); });
})();
