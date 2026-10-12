'use strict';
// ============================================================
//  Main — 畫布、主迴圈、通知、分頁切換偵測
// ============================================================
(function () {
  const U = FW.U, PF = FW.PF;
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  FW.canvas = canvas;
  FW.fieldCanvas = document.createElement('canvas');
  FW.fieldCtx = FW.fieldCanvas.getContext('2d');
  FW.frame = 0; FW.sessionFrames = 0;

  let lastW = 0;
  function resize() {
    const rv = FW.Touch ? FW.Touch.reserve() : { w: 0, h: 0 };
    const ww = Math.max(200, window.innerWidth - rv.w), wh = Math.max(150, window.innerHeight - rv.h);
    const V = FW.view;
    const s = Math.min(ww / V.w, wh / V.h);
    const cw = Math.floor(V.w * s), ch = Math.floor(V.h * s);
    canvas.style.width = cw + 'px'; canvas.style.height = ch + 'px';
    const dpr = Math.min(FW.touchMode ? 1.75 : 2, window.devicePixelRatio || 1);
    canvas.width = Math.round(cw * dpr); canvas.height = Math.round(ch * dpr);
    FW.scale = canvas.width / V.w;
    FW.fieldScale = Math.min(2, Math.max(1, FW.scale));
    FW.fieldCanvas.width = Math.ceil(PF.w * FW.fieldScale); FW.fieldCanvas.height = Math.ceil(PF.h * FW.fieldScale);
    // 視窗被縮小時，角色會抱怨（第四面牆）
    if (lastW && cw < lastW * 0.7 && FW.HUD) FW.HUD.say('欸、別把我們擠扁啦！', 'surprised', 200);
    else if (lastW && cw > lastW * 1.3 && FW.HUD) FW.HUD.say('哇，變大了！看得好清楚～', 'happy', 200);
    lastW = cw;
  }
  window.addEventListener('resize', resize);
  // 手機直式＋遊戲中：鏡頭只框住遊戲區（上方加一條精簡 HUD）
  let viewKey = 'f';
  function applyView() {
    const sc = FW.SM.cur;
    const k = FW.touchMode && window.innerHeight > window.innerWidth && sc && sc.g ? 'p' : 'f';
    if (k === viewKey) return;
    viewKey = k;
    FW.view = k === 'p' ? { x: PF.x - 4, y: PF.y - 84, w: PF.w + 8, h: PF.h + 92 } : { x: 0, y: 0, w: FW.VW, h: FW.VH };
    FW.portraitView = k === 'p';
    resize();
  }
  function setT() { const V = FW.view; ctx.setTransform(FW.scale, 0, 0, FW.scale, -V.x * FW.scale, -V.y * FW.scale); }

  // ---------- 通知 ----------
  const toasts = [];
  FW.toast = (text, col = '#fff') => { toasts.push({ text, col, t: 0 }); FW.Audio && FW.Audio.sfx('extend'); };
  function drawToasts() {
    let y = 40;
    for (const t of toasts) {
      t.t++;
      const a = Math.min(1, t.t / 15) * Math.min(1, (240 - t.t) / 20);
      ctx.save(); ctx.globalAlpha = Math.max(0, a);
      ctx.font = `bold 15px ${FW.FONT}`;
      const w = ctx.measureText(t.text).width + 36;
      ctx.fillStyle = 'rgba(16,12,30,0.92)'; ctx.strokeStyle = t.col; ctx.lineWidth = 2;
      const cx = FW.view.x + FW.view.w / 2, yy = FW.view.y + y;
      ctx.beginPath(); ctx.roundRect(cx - w / 2, yy - 22, w, 34, 10); ctx.fill(); ctx.stroke();
      ctx.fillStyle = t.col; ctx.textAlign = 'center'; ctx.fillText(t.text, cx, yy);
      ctx.restore();
      y += 42;
    }
    for (let i = toasts.length - 1; i >= 0; i--) if (toasts[i].t > 240) toasts.splice(i, 1);
  }

  // ---------- 分頁切換（第四面牆） ----------
  let hiddenAt = 0;
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      hiddenAt = Date.now();
      FW.Save.data.tabAways++;
      FW.Title.set('……你去哪了？ ｜ 第四面牆');
    } else {
      FW.Title.reset();
      if (Date.now() - hiddenAt > 1500 && FW.SM.cur && FW.SM.cur.g) FW.tabReturn = true;
    }
  });

  // ---------- 主迴圈 ----------
  const STEP = 1000 / 60;
  let acc = 0, last = performance.now();
  function frame(now) {
    acc += now - last; last = now;
    if (acc > STEP * 6) acc = STEP;
    while (acc >= STEP) {
      FW.Input.update();
      FW._tapItem = FW._tapItemNext; FW._tapItemNext = undefined;
      FW.SM.update();
      FW._tapItem = undefined;
      FW.frame++; FW.sessionFrames++;
      if (FW.frame % 600 === 0) FW.Meta.check();
      acc -= STEP;
    }
    applyView();
    setT();
    ctx.imageSmoothingQuality = 'high';
    FW._menuRects = null;
    FW.SM.draw(ctx);
    if (FW.Touch) FW.Touch.sync();
    drawToasts();
    requestAnimationFrame(frame);
  }

  // ---------- 啟動 ----------
  FW.Save.load();
  FW.Save.isReturn = !FW.Save.isFirst;
  FW.Input.init(canvas);
  resize();
  FW.Title.reset();
  FW.SM.go(FW.BootScene(), true);
  requestAnimationFrame(frame);
  // 測試用：手動推進 n 幀
  FW.debugStep = (n = 1, keys) => {
    for (let i = 0; i < n; i++) {
      if (keys) for (const k in keys) FW.Input._raw[k] = typeof keys[k] === 'function' ? keys[k](i) : keys[k];
      FW.Input.update(); FW._tapItem = FW._tapItemNext; FW._tapItemNext = undefined; FW.SM.update(); FW._tapItem = undefined; FW.frame++; FW.sessionFrames++;
    }
    applyView(); setT(); FW._menuRects = null; FW.SM.draw(ctx); drawToasts(); if (FW.Touch) FW.Touch.sync();
  };
  FW.press = (code, hold = 2) => { FW.Input.keyLog.push(code); FW.debugStep(hold, { [code]: true }); FW.debugStep(1, { [code]: false }); };
  window.FW_DEBUG = FW;
})();
