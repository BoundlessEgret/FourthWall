'use strict';
// ============================================================
//  背景 — 各關卡的程序繪製背景（繪製於遊戲區內，576×672）
// ============================================================
(function () {
  const U = FW.U;
  const W = 576, H = 672;
  const BG = FW.BG = {};
  const rngTable = []; for (let i = 0; i < 512; i++) rngTable.push(Math.random());
  const R = i => rngTable[((i % 512) + 512) % 512];
  const FONT = '"Noto Sans TC","PingFang TC","Microsoft JhengHei",sans-serif';

  function perspGrid(ctx, t, col, horizon, speed, alpha) {
    ctx.save(); ctx.strokeStyle = col; ctx.globalAlpha = alpha; ctx.lineWidth = 1.2;
    const cx = W / 2;
    for (let i = -12; i <= 12; i++) { ctx.beginPath(); ctx.moveTo(cx + i * 8, horizon); ctx.lineTo(cx + i * 120, H); ctx.stroke(); }
    const off = (t * speed) % 1;
    for (let k = 0; k < 14; k++) { const z = k + off, y = horizon + (H - horizon) * Math.pow(z / 14, 2.2); ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    ctx.restore();
  }

  BG.hill = function (ctx, t) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#2b3f8c'); g.addColorStop(0.5, '#8a7ad8'); g.addColorStop(0.8, '#ffb0b8'); g.addColorStop(1, '#ffe2c0');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // 星星
    for (let i = 0; i < 60; i++) { const a = 0.4 + 0.4 * Math.sin(t * 0.05 + i); ctx.fillStyle = `rgba(255,255,255,${a * (1 - R(i * 3) * 0.5)})`; ctx.fillRect(R(i) * W, R(i + 99) * H * 0.5, 2, 2); }
    // 大字 PRESS START
    ctx.save(); ctx.globalAlpha = 0.08 + 0.04 * Math.sin(t * 0.04); ctx.fillStyle = '#fff'; ctx.font = `bold 80px ${FONT}`; ctx.textAlign = 'center';
    ctx.fillText('PRESS', W / 2, 200 + ((t * 0.2) % 900) - 300); ctx.fillText('START', W / 2, 290 + ((t * 0.2) % 900) - 300); ctx.restore();
    // 山丘層
    const layers = [['#6a5ab0', 0.15, 420, 50], ['#4c4a96', 0.3, 480, 70], ['#2e3a6a', 0.6, 560, 90]];
    for (const [col, sp, base, amp] of layers) {
      ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, H);
      for (let x = 0; x <= W; x += 16) ctx.lineTo(x, base + Math.sin(x * 0.01 + t * sp * 0.01) * amp * 0.5 + Math.sin(x * 0.023 + 2) * amp * 0.3);
      ctx.lineTo(W, H); ctx.fill();
    }
    // 雲朵往下流動
    for (let i = 0; i < 9; i++) {
      const y = ((R(i) * H + t * (0.6 + R(i + 20))) % (H + 200)) - 100, x = R(i + 40) * W;
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.ellipse(x + k * 26 - 40, y + Math.sin(k) * 8, 40, 18, 0, 0, TAU); ctx.fill(); }
    }
  };

  BG.sea = function (ctx, t) {
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#061a3a'); g.addColorStop(1, '#0d5a8a');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // 光柱
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 5; i++) { const x = W * (i + 0.5) / 5 + Math.sin(t * 0.01 + i) * 40; const lg = ctx.createLinearGradient(x, 0, x + 80, H); lg.addColorStop(0, 'rgba(120,200,255,0.12)'); lg.addColorStop(1, 'rgba(120,200,255,0)'); ctx.fillStyle = lg; ctx.beginPath(); ctx.moveTo(x - 20, 0); ctx.lineTo(x + 30, 0); ctx.lineTo(x + 140, H); ctx.lineTo(x + 40, H); ctx.fill(); }
    ctx.restore();
    // 波紋線
    ctx.strokeStyle = 'rgba(150,220,255,0.15)'; ctx.lineWidth = 2;
    for (let k = 0; k < 18; k++) { const y = ((k * 50 + t * 0.8) % (H + 50)) - 25; ctx.beginPath(); for (let x = 0; x <= W; x += 12) ctx.lineTo(x, y + Math.sin(x * 0.03 + t * 0.03 + k) * 6); ctx.stroke(); }
    // 漂浮的對話框
    const lines = ['……', '那個，', '其實我', '一直想說', '（沉默）', '再見？', '還沒完喔', '你好'];
    for (let i = 0; i < 7; i++) {
      const y = ((R(i + 5) * H + t * (0.5 + R(i) * 0.6)) % (H + 160)) - 80, x = 40 + R(i + 11) * (W - 200);
      const w = 140 + R(i + 3) * 60, h = 56;
      ctx.save(); ctx.globalAlpha = 0.25; ctx.translate(x, y); ctx.rotate(Math.sin(t * 0.01 + i) * 0.05);
      ctx.fillStyle = 'rgba(10,20,50,0.8)'; ctx.strokeStyle = '#bfe8ff'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.roundRect(0, 0, w, h, 10); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#e8f6ff'; ctx.font = `20px ${FONT}`; ctx.fillText(lines[i], 16, 35);
      ctx.restore();
    }
    // 泡泡
    for (let i = 0; i < 30; i++) { const y = H - ((R(i) * H + t * (0.6 + R(i + 7))) % H), x = R(i + 30) * W + Math.sin(t * 0.03 + i) * 8; ctx.beginPath(); ctx.arc(x, y, 2 + R(i + 60) * 4, 0, TAU); ctx.strokeStyle = 'rgba(200,240,255,0.35)'; ctx.lineWidth = 1; ctx.stroke(); }
  };

  BG.city = function (ctx, t) {
    ctx.fillStyle = '#07040f'; ctx.fillRect(0, 0, W, H);
    const g = ctx.createLinearGradient(0, 0, 0, 260); g.addColorStop(0, '#1a0830'); g.addColorStop(1, '#3a0a3a'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, 260);
    // 遠景大樓
    for (let i = 0; i < 16; i++) {
      const bw = 30 + R(i) * 40, bh = 60 + R(i + 9) * 140, x = i * 38 - 10;
      ctx.fillStyle = '#120a22'; ctx.fillRect(x, 260 - bh, bw, bh);
      for (let wy = 260 - bh + 8; wy < 255; wy += 12) for (let wx = x + 5; wx < x + bw - 6; wx += 9) { if (R(wx * 3 + wy) > 0.6) { ctx.fillStyle = R(wx + wy * 7) > 0.5 ? 'rgba(80,220,255,0.5)' : 'rgba(255,80,160,0.4)'; ctx.fillRect(wx, wy, 4, 5); } }
    }
    perspGrid(ctx, t, '#ff3a8a', 260, 0.02, 0.5);
    // 故障橫條
    if (Math.floor(t / 8) % 11 === 0 || (t % 97) < 4) {
      for (let k = 0; k < 4; k++) { ctx.fillStyle = `rgba(${R(t + k) > 0.5 ? '0,255,255' : '255,0,128'},0.15)`; ctx.fillRect(0, R(t * 7 + k) * H, W, 4 + R(t + k * 3) * 20); }
    }
    // 錯誤視窗
    for (let i = 0; i < 4; i++) {
      const y = ((R(i + 50) * H + t * 0.7) % (H + 200)) - 100, x = 30 + R(i + 51) * (W - 220);
      ctx.save(); ctx.globalAlpha = 0.22; ctx.fillStyle = '#d8d8e0'; ctx.fillRect(x, y, 180, 80); ctx.fillStyle = '#2050c0'; ctx.fillRect(x, y, 180, 18);
      ctx.fillStyle = '#fff'; ctx.font = `bold 12px ${FONT}`; ctx.fillText('錯誤', x + 6, y + 13);
      ctx.fillStyle = '#c00'; ctx.beginPath(); ctx.arc(x + 24, y + 46, 12, 0, TAU); ctx.fill(); ctx.fillStyle = '#fff'; ctx.fillText('×', x + 20, y + 51);
      ctx.fillStyle = '#111'; ctx.font = `12px ${FONT}`; ctx.fillText('現實.dll 遺失', x + 46, y + 50); ctx.restore();
    }
  };

  BG.desktop = function (ctx, t) {
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#3a8ce8'); g.addColorStop(0.55, '#9ad4ff'); g.addColorStop(0.56, '#6ac85a'); g.addColorStop(1, '#2e8a3a');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#58b84a'; ctx.beginPath(); ctx.moveTo(0, 400); ctx.quadraticCurveTo(W * 0.4, 300, W, 390); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    for (let i = 0; i < 5; i++) { const x = ((R(i) * W + t * 0.2 * (1 + R(i + 1))) % (W + 200)) - 100, y = 60 + R(i + 4) * 200; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.ellipse(x + k * 22, y + (k % 2) * 6, 30, 14, 0, 0, TAU); ctx.fill(); } }
    // 桌面圖示格狀，往下流動
    const names = ['我的遊戲', '存檔', '回收筒', '新資料夾', '說明.txt', '不要打開', '片尾.mp4', 'untitled_07'];
    for (let i = 0; i < 10; i++) {
      const y = ((i * 110 + t * 0.9) % (H + 120)) - 60, x = 40 + (i % 3) * 200 + R(i) * 50;
      ctx.save(); ctx.globalAlpha = 0.75; ctx.translate(x, y);
      if (i % 3 === 2) { ctx.fillStyle = '#eef'; ctx.fillRect(-16, -22, 32, 40); ctx.strokeStyle = '#88a'; ctx.strokeRect(-16, -22, 32, 40); ctx.fillStyle = '#88a'; for (let k = 0; k < 4; k++) ctx.fillRect(-10, -14 + k * 8, 20, 2); }
      else { ctx.fillStyle = '#f4c64a'; ctx.beginPath(); ctx.moveTo(-22, -14); ctx.lineTo(-6, -14); ctx.lineTo(-2, -10); ctx.lineTo(22, -10); ctx.lineTo(22, 16); ctx.lineTo(-22, 16); ctx.closePath(); ctx.fill(); ctx.strokeStyle = '#a07a10'; ctx.stroke(); }
      ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(-36, 22, 72, 16); ctx.fillStyle = '#fff'; ctx.font = `12px ${FONT}`; ctx.textAlign = 'center'; ctx.fillText(names[i % names.length], 0, 34);
      ctx.restore();
    }
  };

  BG.tower = function (ctx, t) {
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0e0620'); g.addColorStop(1, '#3a1650'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 90; i++) { const a = 0.3 + 0.5 * Math.abs(Math.sin(t * 0.03 + i)); ctx.fillStyle = `rgba(255,240,255,${a})`; const y = (R(i + 7) * H + t * 0.3 * R(i)) % H; ctx.fillRect(R(i) * W, y, 1.6, 1.6); }
    // 塔的剪影
    ctx.fillStyle = 'rgba(20,8,40,0.8)'; ctx.beginPath(); ctx.moveTo(W / 2 - 110, H); ctx.lineTo(W / 2 - 40, 0); ctx.lineTo(W / 2 + 40, 0); ctx.lineTo(W / 2 + 110, H); ctx.fill();
    ctx.strokeStyle = 'rgba(200,150,255,0.25)'; ctx.lineWidth = 1;
    for (let k = 0; k < 20; k++) { const y = ((k * 40 + t * 1.2) % H); const w = 40 + 70 * y / H; ctx.beginPath(); ctx.moveTo(W / 2 - w, y); ctx.lineTo(W / 2 + w, y); ctx.stroke(); }
    // 滾動的名單
    const credits = ['企劃 —— 玲音', '腳本 —— 棗', '程式 —— 茜', '介面 —— 汐', '音效 —— 鈴', '台詞 —— 千代', '舞台 —— 幕', '???? —— ????', '遊玩 —— 你', '特別感謝 —— 還在玩的你'];
    ctx.save(); ctx.globalAlpha = 0.2; ctx.fillStyle = '#e8d8ff'; ctx.font = `18px ${FONT}`; ctx.textAlign = 'center';
    for (let i = 0; i < credits.length * 2; i++) { const y = H - ((i * 70 + t * 0.6) % (credits.length * 140)); ctx.fillText(credits[i % credits.length], i % 2 ? 110 : W - 110, y); }
    ctx.restore();
  };

  BG.stage = function (ctx, t) {
    ctx.fillStyle = '#100508'; ctx.fillRect(0, 0, W, H);
    // 地板
    const hz = 240;
    const fg = ctx.createLinearGradient(0, hz, 0, H); fg.addColorStop(0, '#2a1208'); fg.addColorStop(1, '#6a3a1a'); ctx.fillStyle = fg; ctx.fillRect(0, hz, W, H - hz);
    ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 1.5;
    for (let i = -10; i <= 10; i++) { ctx.beginPath(); ctx.moveTo(W / 2 + i * 14, hz); ctx.lineTo(W / 2 + i * 90, H); ctx.stroke(); }
    const off = (t * 0.015) % 1;
    for (let k = 0; k < 12; k++) { const y = hz + (H - hz) * Math.pow((k + off) / 12, 2); ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    // 聚光燈
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 3; i++) { const x = W / 2 + Math.sin(t * 0.012 + i * 2.1) * 200; const lg = ctx.createRadialGradient(x, H - 160, 10, x, H - 160, 180); lg.addColorStop(0, 'rgba(255,230,180,0.22)'); lg.addColorStop(1, 'rgba(255,230,180,0)'); ctx.fillStyle = lg; ctx.beginPath(); ctx.moveTo(W / 2 + (i - 1) * 120, -10); ctx.lineTo(x - 140, H - 120); ctx.lineTo(x + 140, H - 120); ctx.fill(); ctx.beginPath(); ctx.ellipse(x, H - 160, 160, 50, 0, 0, TAU); ctx.fill(); }
    ctx.restore();
    // 布幕
    for (const s of [0, 1]) {
      ctx.save(); if (s) { ctx.translate(W, 0); ctx.scale(-1, 1); }
      const cw = 110;
      const cg = ctx.createLinearGradient(0, 0, cw, 0); cg.addColorStop(0, '#5a0810'); cg.addColorStop(1, '#a01828');
      ctx.fillStyle = cg; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(cw + 20, 0);
      for (let y = 0; y <= H; y += 24) ctx.lineTo(cw + Math.sin(y * 0.02 + t * 0.03) * 10 - y * 0.05, y);
      ctx.lineTo(0, H); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 3;
      for (let k = 1; k < 5; k++) { ctx.beginPath(); ctx.moveTo(k * 24, 0); for (let y = 0; y <= H; y += 24) ctx.lineTo(k * 24 + Math.sin(y * 0.02 + t * 0.03 + k) * 4, y); ctx.stroke(); }
      ctx.restore();
    }
    const tg = ctx.createLinearGradient(0, 0, 0, 70); tg.addColorStop(0, '#5a0810'); tg.addColorStop(1, 'rgba(160,24,40,0.9)'); ctx.fillStyle = tg;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(W, 0); ctx.lineTo(W, 50); for (let x = W; x >= 0; x -= 48) ctx.quadraticCurveTo(x - 24, 84, x - 48, 50); ctx.fill();
    ctx.strokeStyle = '#f4c64a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 46); ctx.lineTo(W, 46); ctx.stroke();
  };

  BG.glass = function (ctx, t) {
    const g = ctx.createRadialGradient(W / 2, H * 0.4, 50, W / 2, H / 2, 600); g.addColorStop(0, '#16203a'); g.addColorStop(1, '#020308');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // 螢幕反光裡的「你」
    ctx.save(); ctx.globalAlpha = 0.07 + 0.02 * Math.sin(t * 0.01);
    ctx.fillStyle = '#c8d8ff';
    ctx.beginPath(); ctx.ellipse(W / 2, H * 0.55, 80, 100, 0, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.moveTo(W / 2 - 220, H); ctx.quadraticCurveTo(W / 2 - 200, H * 0.72, W / 2, H * 0.72); ctx.quadraticCurveTo(W / 2 + 200, H * 0.72, W / 2 + 220, H); ctx.fill();
    ctx.restore();
    // 斜向反射光
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 3; i++) { const x = ((t * 0.8 + i * 300) % (W + 600)) - 300; const lg = ctx.createLinearGradient(x, 0, x + 120, 0); lg.addColorStop(0, 'rgba(180,200,255,0)'); lg.addColorStop(0.5, 'rgba(180,200,255,0.07)'); lg.addColorStop(1, 'rgba(180,200,255,0)'); ctx.fillStyle = lg; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 120, 0); ctx.lineTo(x - 80, H); ctx.lineTo(x - 200, H); ctx.fill(); }
    ctx.restore();
    // 掃描線與灰塵
    ctx.fillStyle = 'rgba(255,255,255,0.025)'; for (let y = (t % 4); y < H; y += 4) ctx.fillRect(0, y, W, 1);
    for (let i = 0; i < 40; i++) { ctx.fillStyle = `rgba(220,230,255,${0.1 + R(i) * 0.2})`; ctx.beginPath(); ctx.arc(R(i) * W + Math.sin(t * 0.005 + i) * 20, (R(i + 3) * H + t * 0.1 * R(i + 8)) % H, R(i + 9) * 2 + 0.5, 0, TAU); ctx.fill(); }
    // 像素格紋（是 LCD 的子像素，不是像素畫）
    ctx.fillStyle = 'rgba(120,140,200,0.03)'; for (let x = 0; x < W; x += 3) ctx.fillRect(x, 0, 1, H);
  };

  // 符卡背景
  BG.spell = function (ctx, t, col, alpha, style) {
    if (alpha <= 0) return;
    ctx.save(); ctx.globalAlpha = alpha;
    const g = ctx.createRadialGradient(W / 2, H * 0.3, 20, W / 2, H / 2, 520); g.addColorStop(0, U.shade(col, -0.45)); g.addColorStop(1, U.shade(col, -0.88));
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = U.rgba(col, 0.25); ctx.lineWidth = 2;
    ctx.translate(W / 2, H * 0.32);
    if (style === 'grid') {
      ctx.rotate(t * 0.002); for (let i = -12; i <= 12; i++) { ctx.beginPath(); ctx.moveTo(i * 50, -700); ctx.lineTo(i * 50, 700); ctx.moveTo(-700, i * 50); ctx.lineTo(700, i * 50); ctx.stroke(); }
    } else if (style === 'text') {
      ctx.fillStyle = U.rgba(col, 0.06); ctx.font = `bold 30px ${FONT}`; ctx.textAlign = 'center';
      const s = '……按Z也跳不過……'; for (let k = 0; k < 14; k++) ctx.fillText(s, Math.sin(k) * 60, -300 + ((k * 60 + t * 0.6) % 840));
    } else {
      for (let k = 0; k < 6; k++) { ctx.save(); ctx.rotate(t * 0.004 * (k % 2 ? 1 : -1) + k); ctx.beginPath(); const r = 60 + k * 70; for (let i = 0; i <= 6; i++) { const a = i * TAU / 6; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.stroke(); ctx.restore(); }
      for (let k = 0; k < 24; k++) { const a = k * TAU / 24 + t * 0.003; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 40, Math.sin(a) * 40); ctx.lineTo(Math.cos(a) * 800, Math.sin(a) * 800); ctx.stroke(); }
    }
    ctx.restore();
  };
  BG.list = { st1: 'hill', st2: 'sea', st3: 'city', st4: 'desktop', st5: 'tower', st6: 'stage', st7: 'glass' };
})();
