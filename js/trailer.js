'use strict';
// ============================================================
//  Trailer — 第四面牆 預告片（高燃動畫風格）
//  draw(t) 是時間的函數；實機遊戲片段由 bot 在背景即時演算
// ============================================================
(function () {
  const U = FW.U, Art = FW.Art, A = FW.Audio;
  const W = 1920, H = 1080;
  const FONT = '"Noto Sans TC","PingFang TC","Microsoft JhengHei",sans-serif';
  const SERIF = '"Noto Serif TC","Songti TC",serif';
  const BEAT = 60 / 176, BAR = BEAT * 4;
  const T = {};
  T.AD = 0; T.INTRO = 6; T.DROP = 14; T.MONT_END = T.DROP + 8 * BAR; T.CARDS_END = T.MONT_END + 12 * BAR;
  T.GAG_END = 45; T.VIL_END = T.GAG_END + 4 * BAR; T.CLIMAX_END = T.VIL_END + 6 * BAR; T.LOGO_END = T.CLIMAX_END + 4 * BAR; T.END = 75;
  const TR = FW.Trailer = { W, H, T, DUR: T.END, live: false };

  // ---------- 遊戲引擎：靜音、唯讀存檔 ----------
  const realSfx = A.sfx.bind(A);
  A.sfx = (n, o) => { if (o && o.at !== undefined) realSfx(n, o); };
  A.play = () => { }; A.stop = () => { }; A.stutter = () => { }; A.setDuck = () => { };
  FW.Outside = { say() { }, theme() { }, vibrate() { }, canVibrate: () => false };
  FW.Title.set = () => { };
  (function loadSave() {
    let d = null; try { d = JSON.parse(localStorage.getItem('fourthwall_save_v1') || 'null'); } catch (e) { }
    const def = FW.Save.defaults(); TR.hasSave = !!d;
    d = d || def; for (const k in def) if (d[k] === undefined) d[k] = def[k];
    FW.Save.data = d; FW.Save.write = () => { }; FW.Save.unlock = () => false;
  })();
  FW.touchMode = true; // 讓 bot 自動射擊

  // ---------- 實機片段 ----------
  const CLIPS = [
    { char: 'rinne', key: 'chiyo_s3', lv: 5, stage: 2 }, { char: 'akane', key: 'maku_s1', lv: 6, stage: 6 },
    { char: 'natsume', key: 'true_clock', lv: 7, stage: 7 }, { char: 'shio', key: 'shio_s2', lv: 5, stage: 4 },
    { char: 'chiyo', key: 'true_last', lv: 7, stage: 7 }, { char: 'suzu', key: 'nanashi_s1', lv: 6, stage: 6 },
    { char: 'rinne', key: 'maku_s3', lv: 6, stage: 6 }, { char: 'akane', key: 'true_hud', lv: 7, stage: 7 },
    // 高潮用（剛好在宣言符卡）
    { char: 'suzu', key: 'akane_s1', lv: 6, stage: 3, warm: 140 }, { char: 'shio', key: 'natsume_s1', lv: 6, stage: 5, warm: 140 },
    { char: 'chiyo', key: 'rinne_s2', lv: 6, stage: 1, warm: 140 }, { char: 'natsume', key: 'suzu_s3', lv: 6, stage: 5, warm: 140 },
  ];
  const fieldC = document.createElement('canvas'); fieldC.width = 576 * 2; fieldC.height = 672 * 2;
  const fctx = fieldC.getContext('2d');
  const blurC = document.createElement('canvas'); blurC.width = 96; blurC.height = 54;
  const bctx = blurC.getContext('2d');
  function makeClip(cfg) {
    const g = new FW.Game({ mode: 'practice', char: cfg.char, diff: 'hard', bossKey: cfg.key, lv: cfg.lv, stage: cfg.stage });
    const c = { g, cfg, f: 0 };
    stepClip(c, cfg.warm || 330);
    return c;
  }
  function stepClip(c, n) {
    const g = c.g;
    for (let i = 0; i < n; i++) {
      c.f++;
      g.update();
      const p = g.player, f = c.f;
      p.x = 288 + Math.sin(f * 0.017) * 170 + Math.sin(f * 0.043) * 50;
      p.y = 560 + Math.sin(f * 0.023) * 40;
      p.invuln = 99; p.dbTimer = 0; p.dead = 0;
      g.power = 4; g.lives = 3;
      if (g.result) { g.result = null; } // 練習結束也不停
      if (g.boss && g.boss.phase && g.boss.timer < 300) g.boss.timer = 600;
      if (g.boss && g.boss.phase && !g.boss.phase.survival) g.boss.hp = Math.max(g.boss.hp, g.boss.maxHp * 0.6);
    }
  }
  function renderClip(c) {
    fctx.setTransform(2, 0, 0, 2, 0, 0);
    fctx.clearRect(0, 0, 576, 672);
    fctx.save(); fctx.beginPath(); fctx.rect(0, 0, 576, 672); fctx.clip();
    c.g.drawField(fctx);
    fctx.restore();
    bctx.drawImage(fieldC, 0, 0, fieldC.width, fieldC.height, 0, 0, 96, 54);
  }
  TR.clips = [];
  TR.prepare = async function (progress) {
    for (let i = 0; i < CLIPS.length; i++) { TR.clips.push(makeClip(CLIPS[i])); if (progress) progress((i + 1) / CLIPS.length); await new Promise(r => setTimeout(r, 0)); }
  };
  let lastDrawT = 0;
  function useClip(i, t) {
    const c = TR.clips[i];
    const want = Math.max(0, Math.round((t - (c.firstT ?? t)) * 60));
    if (c.firstT === undefined) c.firstT = t, c.base = c.f;
    const target = c.base + want;
    if (target > c.f) stepClip(c, Math.min(12, target - c.f));
    renderClip(c);
    return c;
  }
  // 片段畫面：模糊的滿版背景＋傾斜的遊戲區
  function drawClipFrame(ctx, idx, t, lt, o = {}) {
    const c = useClip(idx, t);
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.globalAlpha = 1; ctx.drawImage(blurC, 0, 0, 96, 54, -40, -40, W + 80, H + 80);
    ctx.fillStyle = 'rgba(8,4,20,0.45)'; ctx.fillRect(0, 0, W, H);
    const punch = 1 + 0.08 * Math.max(0, 1 - lt / 0.25);
    const s = (o.scale || 1.42) * punch, fw = 576 * s, fh = 672 * s;
    ctx.translate(o.x || W / 2, (o.y || H / 2) + 20);
    ctx.rotate(o.rot || 0);
    ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 40;
    ctx.fillStyle = '#fff'; ctx.fillRect(-fw / 2 - 6, -fh / 2 - 6, fw + 12, fh + 12);
    ctx.shadowBlur = 0;
    ctx.drawImage(fieldC, -fw / 2, -fh / 2, fw, fh);
    ctx.restore();
    return c;
  }

  // ---------- 小工具 ----------
  const ease = U.easeOut, clamp = U.clamp;
  function slam(ctx, text, x, y, size, col, age, o = {}) {
    if (age < 0) return;
    const k = clamp(age / 0.14, 0, 1), sc = 1.7 - 0.7 * ease(k);
    const fade = o.life ? clamp((o.life - age) / 0.15, 0, 1) : 1;
    ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc); ctx.transform(1, 0, o.skew ?? -0.18, 1, 0, 0);
    ctx.globalAlpha = k * fade;
    ctx.font = `900 ${size}px ${FONT}`; ctx.textAlign = o.align || 'center'; ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.lineWidth = size * 0.16; ctx.strokeStyle = o.shadow || '#ff2a6a'; ctx.strokeText(text, size * 0.06, size * 0.06);
    ctx.lineWidth = size * 0.11; ctx.strokeStyle = '#120818'; ctx.strokeText(text, 0, 0);
    ctx.fillStyle = col; ctx.fillText(text, 0, 0);
    ctx.restore();
  }
  function speedLines(ctx, cx, cy, t, col = '#ffffff', n = 90, alpha = 0.5, inner = 220) {
    ctx.save(); ctx.translate(cx, cy); ctx.fillStyle = col; ctx.globalAlpha = alpha;
    for (let i = 0; i < n; i++) {
      const a = (i * 2.399 + Math.floor(t * 24) * 0.37) % TAU, w = 0.004 + ((i * 7) % 5) * 0.003;
      const r0 = inner + ((i * 53 + Math.floor(t * 30) * 17) % 200);
      ctx.beginPath(); ctx.moveTo(Math.cos(a - w) * r0, Math.sin(a - w) * r0); ctx.lineTo(Math.cos(a) * 2400, Math.sin(a) * 2400); ctx.lineTo(Math.cos(a + w) * r0, Math.sin(a + w) * r0); ctx.fill();
    }
    ctx.restore();
  }
  let dotPat = null;
  function halftone(ctx, x, y, w, h, alpha) {
    if (!dotPat) { const c = document.createElement('canvas'); c.width = c.height = 24; const x2 = c.getContext('2d'); x2.fillStyle = '#fff'; x2.beginPath(); x2.arc(12, 12, 5, 0, TAU); x2.fill(); dotPat = ctx.createPattern(c, 'repeat'); }
    ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = dotPat; ctx.fillRect(x, y, w, h); ctx.restore();
  }
  function flash(ctx, a, col = '#fff') { if (a <= 0) return; ctx.save(); ctx.globalAlpha = clamp(a, 0, 1); ctx.fillStyle = col; ctx.fillRect(0, 0, W, H); ctx.restore(); }
  function subtitle(ctx, who, text, age, o = {}) {
    if (age < 0 || (o.life && age > o.life)) return;
    const n = Math.floor(age * (o.cps || 22)), s = text.slice(0, n);
    const ch = who ? FW.CHARS[who] : null;
    ctx.save();
    const a = o.life ? clamp((o.life - age) / 0.2, 0, 1) : 1; ctx.globalAlpha = a * clamp(age / 0.1, 0, 1);
    ctx.font = `700 46px ${FONT}`;
    const tw = Math.max(ctx.measureText(text).width, 200) + 80, bx = W / 2 - tw / 2, by = (o.y || H - 150);
    ctx.fillStyle = 'rgba(10,6,20,0.78)'; ctx.beginPath(); ctx.roundRect(bx, by - 52, tw, 80, 14); ctx.fill();
    if (ch) { ctx.fillStyle = ch.color; ctx.beginPath(); ctx.roundRect(bx + 18, by - 78, 150, 40, 10); ctx.fill(); ctx.font = `700 26px ${FONT}`; ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.fillText(ch.name, bx + 93, by - 49); }
    ctx.font = `700 46px ${FONT}`; ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.fillText(s, W / 2, by + 4);
    ctx.restore();
  }
  function typed(ctx, text, x, y, size, col, age, cps = 14, font = FONT, weight = 700) {
    if (age < 0) return;
    ctx.save(); ctx.font = `${weight} ${size}px ${font}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = col;
    ctx.fillText(text.slice(0, Math.floor(age * cps)), x, y); ctx.restore();
  }
  function bigCursor(ctx, x, y, s = 4) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 17); ctx.lineTo(4.5, 13); ctx.lineTo(7.5, 20); ctx.lineTo(10, 19); ctx.lineTo(7, 12); ctx.lineTo(12.5, 12); ctx.closePath();
    ctx.fillStyle = '#fff'; ctx.fill(); ctx.strokeStyle = '#000'; ctx.lineWidth = 1; ctx.stroke(); ctx.restore();
  }
  // 碎玻璃（時間的函數）
  function makeShards(cx, cy, seed) {
    const out = [], angs = [], rads = [0, 90, 220, 420, 760, 1500];
    for (let i = 0; i < 16; i++) angs.push(i * TAU / 16 + Math.sin(seed + i * 7.3) * 0.1);
    for (let i = 0; i < 16; i++) for (let j = 0; j < rads.length - 1; j++) {
      const a0 = angs[i], a1 = i === 15 ? angs[0] + TAU : angs[i + 1], r0 = rads[j], r1 = rads[j + 1];
      const pts = [[a0, r0], [a0, r1], [a1, r1], [a1, r0]].map(([a, r]) => [cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
      const mx = pts.reduce((s, p) => s + p[0], 0) / 4, my = pts.reduce((s, p) => s + p[1], 0) / 4, am = (a0 + a1) / 2;
      const sp = 380 + ((i * 31 + j * 17) % 7) * 90 + (5 - j) * 80;
      out.push({ pts, mx, my, vx: Math.cos(am) * sp, vy: Math.sin(am) * sp - 300, vr: Math.sin(i * 3 + j) * 3 });
    }
    return out;
  }
  function drawShards(ctx, snap, shards, tau) {
    for (const s of shards) {
      const x = s.vx * tau, y = s.vy * tau + 1400 * tau * tau, r = s.vr * tau;
      ctx.save(); ctx.translate(s.mx + x, s.my + y); ctx.rotate(r); ctx.translate(-s.mx, -s.my);
      ctx.beginPath(); s.pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath();
      ctx.save(); ctx.clip(); ctx.drawImage(snap, 0, 0, W, H); ctx.restore();
      ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 3; ctx.stroke(); ctx.restore();
    }
  }
  const portrait = (ctx, id, x, y, s, o = {}) => Art.portrait(ctx, FW.CHARS[id].spec, x, y, s, Object.assign({ t: o.tt || 0 }, o));

  // ============================================================
  //  0. 假廣告
  // ============================================================
  function drawAd(ctx, t) {
    const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#dff6ff'); g.addColorStop(1, '#fff6fb');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const wob = t > 3.55 ? Math.sin(t * 60) * Math.max(0, 1 - ((t - 3.55) % 0.25) / 0.25) * 10 : 0;
    ctx.save(); ctx.translate(wob, 0);
    // 商品
    ctx.save(); ctx.translate(560, 560); ctx.rotate(-0.08 + Math.sin(t * 2) * 0.02);
    ctx.fillStyle = '#c8ecff'; ctx.strokeStyle = '#7ab8e8'; ctx.lineWidth = 6; ctx.beginPath(); ctx.roundRect(-260, -200, 520, 400, 40); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 3; for (let i = -200; i < 260; i += 40) { ctx.beginPath(); ctx.moveTo(i, -200); ctx.lineTo(i + 60, 200); ctx.stroke(); }
    ctx.font = `900 64px ${FONT}`; ctx.fillStyle = '#2a6aa8'; ctx.textAlign = 'center'; ctx.fillText('幕牌', 0, -10); ctx.font = `700 34px ${FONT}`; ctx.fillText('超細纖維清潔布', 0, 50);
    ctx.restore();
    for (let i = 0; i < 6; i++) { const a = t * 2 + i; ctx.fillStyle = '#fff'; ctx.save(); ctx.translate(560 + Math.cos(a) * 330, 560 + Math.sin(a * 1.3) * 250); ctx.rotate(a); ctx.fillRect(-3, -22, 6, 44); ctx.fillRect(-22, -3, 44, 6); ctx.restore(); }
    ctx.fillStyle = '#ffd400'; ctx.fillRect(60, 50, 110, 46); ctx.font = `900 30px ${FONT}`; ctx.fillStyle = '#222'; ctx.textAlign = 'center'; ctx.fillText('廣告', 115, 85);
    ctx.textAlign = 'left'; ctx.font = `900 92px ${FONT}`; ctx.fillStyle = '#1d3a6a'; ctx.fillText('全新！', 960, 330);
    ctx.fillText('第四面牆清潔布', 960, 440);
    ctx.font = `700 44px ${FONT}`; ctx.fillStyle = '#3a6aa8'; ctx.fillText('擦得越乾淨，越看得見她們。', 960, 530);
    ctx.font = `500 30px ${FONT}`; ctx.fillStyle = '#6a8ab8'; ctx.fillText('※ 本商品無法清除螢幕另一側的東西', 960, 590);
    ctx.restore();
    // 略過按鈕
    const left = Math.max(0, Math.ceil(5 - t));
    ctx.fillStyle = 'rgba(0,0,0,0.75)'; ctx.fillRect(1500, 900, 360, 90);
    ctx.font = `700 34px ${FONT}`; ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
    ctx.fillText(left > 0 ? `${left} 秒後可略過廣告` : '略過廣告 ▶', 1680, 958);
    // 叩叩
    for (const k of [3.6, 3.85, 4.1]) {
      const a = t - k; if (a < 0 || a > 0.9) continue;
      const x = 1100 + (k * 997 % 300), y = 700 + (k * 613 % 160);
      ctx.save(); ctx.globalAlpha = 1 - a / 0.9; ctx.strokeStyle = '#88a'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(x, y, 30 + a * 260, 0, TAU); ctx.stroke();
      ctx.font = `900 70px ${FONT}`; ctx.fillStyle = '#556'; ctx.fillText('叩', x, y - 40 - a * 40); ctx.restore();
    }
  }
  let adSnap = null, adShards = null;
  function sceneAd(ctx, t) {
    if (t < 5.0) {
      drawAd(ctx, t);
      if (t > 4.4) {
        const k = ease(clamp((t - 4.4) / 0.25, 0, 1));
        portrait(ctx, 'akane', 1300 + (1 - k) * 900, 640, 2.2, { tt: t * 60, expr: 'shout', flip: true });
        if (t > 4.5) { ctx.save(); ctx.font = `900 64px ${FONT}`; ctx.textAlign = 'center'; const tx = '略過什麼略過！給我看完！'; ctx.fillStyle = '#fff'; ctx.strokeStyle = '#ff3a5a'; ctx.lineWidth = 8; ctx.beginPath(); ctx.roundRect(560, 120, 1000, 120, 30); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#c4102c'; ctx.fillText(tx, 1060, 205); ctx.restore(); }
      }
      if (t > 4.88) { ctx.save(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 6; ctx.translate(1680, 945); for (let i = 0; i < 10; i++) { const a = i * TAU / 10; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 30, Math.sin(a) * 30); ctx.lineTo(Math.cos(a) * 140, Math.sin(a) * 140); ctx.stroke(); } ctx.restore(); }
      return;
    }
    if (!adSnap) { adSnap = document.createElement('canvas'); adSnap.width = W; adSnap.height = H; const sx = adSnap.getContext('2d'); drawAd(sx, 4.99); adShards = makeShards(1680, 945, 3); }
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    drawShards(ctx, adSnap, adShards, t - 5.0);
    flash(ctx, 1 - (t - 5.0) / 0.15);
  }

  // ============================================================
  //  1. 開場
  // ============================================================
  function sceneIntro(ctx, t, lt) {
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    if (lt < 3) {
      typed(ctx, '這是一款彈幕射擊遊戲。', W / 2, H / 2 - 40, 64, '#fff', lt - 0.4, 9, SERIF, 700);
      if (lt > 2.0) typed(ctx, '……原本是。', W / 2, H / 2 + 60, 64, '#ff4a6a', lt - 2.0, 7, SERIF, 700);
      return;
    }
    if (lt < 6) {
      const k = lt - 3;
      const g = ctx.createRadialGradient(W / 2, H / 2, 50, W / 2, H / 2, 1100); g.addColorStop(0, '#2a3a6a'); g.addColorStop(1, '#05030a');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 60; i++) { ctx.fillStyle = `rgba(255,255,255,${0.2 + 0.2 * Math.sin(t * 2 + i)})`; ctx.beginPath(); ctx.arc((i * 331) % W, (i * 197 + t * 20) % H, 2 + i % 3, 0, TAU); ctx.fill(); }
      portrait(ctx, 'rinne', W / 2, 560 + 40 * (1 - k / 3), 4.2 + k * 0.12, { tt: t * 60, expr: k > 1.7 ? 'smile' : 'normal', look: { x: 0, y: 0 } });
      const v = ctx.createRadialGradient(W / 2, H / 2, 400, W / 2, H / 2, 1100); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.8)'); ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
      subtitle(ctx, 'rinne', '……你看得見我嗎？', k - 0.3, { life: 1.3 });
      subtitle(ctx, 'rinne', '我也看得見你喔。', k - 1.7, { life: 1.3 });
      flash(ctx, 1 - k / 0.2, '#000');
      return;
    }
    const k = lt - 6;
    speedLines(ctx, W / 2, H / 2, t, '#ffffff', 90, 0.15 + k * 0.25, 260 - k * 80);
    const words = [['她們', 0], ['知道', 0.62], ['你', 1.15], ['在看。', 1.45]];
    words.forEach(([w, at], i) => slam(ctx, w, W / 2 + (i - 1.5) * 330, H / 2, 150, i === 2 ? '#ff4a7a' : '#fff', k - at));
    flash(ctx, (k - 1.85) / 0.15);
  }

  // ============================================================
  //  2. 前奏蒙太奇
  // ============================================================
  const MONT_TEXT = [['東方風格', '彈幕射擊'], ['6 位', '原創女主角'], ['40 張以上', '符卡'], ['全向量繪製', '全即時合成'], ['7 個關卡', '8 種結局'], ['打破', '第四面牆的符卡'], ['∞', '無盡幕間'], ['然後——', '她們']];
  function sceneMontage(ctx, t, lt) {
    const bar = Math.min(7, Math.floor(lt / BAR)), bl = lt - bar * BAR;
    drawClipFrame(ctx, bar, t, bl, { x: bar % 2 ? 640 : 1280, rot: (bar % 2 ? 1 : -1) * 0.025 });
    const [a, b] = MONT_TEXT[bar], tx = bar % 2 ? 1430 : 490;
    speedLines(ctx, tx, H / 2, t, '#ffffff', 40, 0.12, 300);
    slam(ctx, a, tx, H / 2 - 110, bar === 6 ? 220 : 120, '#fff', bl - 0.05);
    slam(ctx, b, tx, H / 2 + 60, 92, '#ffe14a', bl - 0.2, { shadow: '#5a2aff' });
    flash(ctx, 0.6 - bl / 0.12);
    if (bl < 0.06) { ctx.save(); ctx.globalCompositeOperation = 'difference'; ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H); ctx.restore(); }
  }

  // ============================================================
  //  3. 角色介紹
  // ============================================================
  const CARDS = [
    { id: 'rinne', g: 'pause', line: '……這一次，換我被選中。' },
    { id: 'chiyo', g: 'sub', line: '……這句台詞，請不要跳過。' },
    { id: 'akane', g: 'bsod', line: 'Fatal Error，開始！' },
    { id: 'shio', g: 'cursor', line: '主人，滑鼠借我一下♪' },
    { id: 'natsume', g: 'narr', line: '' },
    { id: 'suzu', g: 'frame', line: '這框框也太擠了吧！' },
  ];
  function drawCard(ctx, i, lt, t) {
    const c = CARDS[i], ch = FW.CHARS[c.id], D = 2 * BAR;
    // 背景
    ctx.fillStyle = U.shade(ch.color, -0.75); ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(1080, 0); ctx.lineTo(820, H); ctx.lineTo(0, H); ctx.closePath();
    const g = ctx.createLinearGradient(0, 0, 1000, H); g.addColorStop(0, U.shade(ch.color, 0.1)); g.addColorStop(1, U.shade(ch.color, -0.35));
    ctx.fillStyle = g; ctx.fill(); ctx.clip(); halftone(ctx, 0, 0, 1100, H, 0.12); ctx.restore();
    ctx.save(); ctx.globalAlpha = 0.12; ctx.font = `900 260px ${FONT}`; ctx.lineWidth = 4; ctx.strokeStyle = '#fff'; ctx.textAlign = 'left';
    const en = (ch.reading.toUpperCase() + ' ').repeat(6);
    ctx.strokeText(en, -((lt * 400) % 900), 260); ctx.strokeText(en, -900 + ((lt * 400) % 900), 1010); ctx.restore();
    speedLines(ctx, 420, 520, t, '#ffffff', 50, 0.18, 380);
    // 立繪
    const pk = U.easeBack(clamp(lt / 0.32, 0, 1));
    portrait(ctx, c.id, -380 + pk * 900, 470, 2.55, { tt: t * 60, expr: lt > 1.0 ? 'smile' : 'serious', look: { x: 1.5, y: 0 } });
    // 名牌
    const nk = ease(clamp((lt - 0.12) / 0.3, 0, 1)), nx = 1120 + (1 - nk) * 700;
    ctx.save(); ctx.globalAlpha = nk; ctx.textAlign = 'left';
    ctx.font = `900 36px ${FONT}`; ctx.fillStyle = ch.color; ctx.fillText(`No.0${i + 1}`, nx, 300);
    ctx.font = `900 200px ${FONT}`; ctx.lineWidth = 16; ctx.strokeStyle = '#120818'; ctx.strokeText(ch.name, nx, 500); ctx.fillStyle = '#fff'; ctx.fillText(ch.name, nx, 500);
    ctx.font = `700 50px ${FONT}`; ctx.fillStyle = U.mix(ch.color, '#ffffff', 0.5); ctx.fillText(ch.reading, nx + ch.name.length * 205 + 20, 500);
    ctx.font = `700 54px ${FONT}`; ctx.fillStyle = '#ffe9a8'; ctx.fillText(`「${ch.title}」`, nx, 590);
    ctx.font = `700 36px ${FONT}`; ctx.fillStyle = '#fff'; ctx.fillText(`符卡：${ch.bombName}`, nx, 670);
    ctx.font = `500 26px ${FONT}`; ctx.fillStyle = '#c8c0e0'; ctx.fillText('CV：你的想像力', nx, 724);
    ctx.restore();
    if (c.line) subtitle(ctx, c.id, c.line, lt - 0.5, { life: 1.6 });
    // 招式演出
    const k = lt - 1.45;
    if (k > 0) cardGimmick(ctx, c, k, t, nx, i);
    // 轉場斜切
    if (lt > D - 0.18) { const a = (lt - (D - 0.18)) / 0.18; ctx.save(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(-400 + a * 2600, 0); ctx.lineTo(-100 + a * 2600, 0); ctx.lineTo(-700 + a * 2600, H); ctx.lineTo(-1000 + a * 2600, H); ctx.fill(); ctx.restore(); }
    flash(ctx, 0.7 - lt / 0.1);
  }
  function cardGimmick(ctx, c, k, t, nx, i) {
    const ch = FW.CHARS[c.id];
    if (c.g === 'pause') {
      if (k < 0.85) {
        ctx.fillStyle = 'rgba(30,30,50,0.55)'; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = 'rgba(14,12,30,0.92)'; ctx.strokeStyle = '#9ab8ff'; ctx.lineWidth = 4; ctx.beginPath(); ctx.roundRect(W / 2 - 330, 300, 660, 420, 24); ctx.fill(); ctx.stroke();
        ctx.font = `900 72px ${FONT}`; ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.fillText('‖ 預告片已暫停', W / 2, 400);
        const opts = ['繼續觀看', '重新播放', '刪除所有廣告'];
        opts.forEach((o, j) => { const on = j === Math.min(2, Math.floor(k / 0.18)); ctx.font = `700 46px ${FONT}`; ctx.fillStyle = on ? (j === 2 ? '#ffd36b' : '#fff') : '#7a7aa0'; ctx.fillText((on ? '♪ ' : '') + o, W / 2, 500 + j * 70); });
      } else slam(ctx, '……騙你的。', W / 2, H / 2, 110, '#fff', k - 0.85, { skew: 0 });
    } else if (c.g === 'sub') {
      ctx.save(); const by = H - 250;
      ctx.fillStyle = 'rgba(20,12,24,0.94)'; ctx.strokeStyle = '#f2a03c'; ctx.lineWidth = 6; ctx.beginPath(); ctx.roundRect(160, by, W - 320, 200, 20); ctx.fill(); ctx.stroke();
      ctx.font = `700 52px ${FONT}`; ctx.fillStyle = '#fff'; ctx.textAlign = 'left'; ctx.fillText('※此預告片的字幕無法關閉。'.slice(0, Math.floor(k * 18)), 210, by + 90);
      ctx.font = `500 28px ${FONT}`; ctx.fillStyle = '#ffcf8a'; ctx.textAlign = 'right'; ctx.fillText('[Esc] 無效　[跳過] 無效　[閉上眼睛] 也無效', W - 200, by + 170);
      ctx.restore();
    } else if (c.g === 'bsod') {
      if (k < 0.6) {
        ctx.fillStyle = '#1366c6'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#fff'; ctx.textAlign = 'left';
        ctx.font = `700 220px ${FONT}`; ctx.fillText(':(', 200, 400); ctx.font = `700 52px ${FONT}`; ctx.fillText('你的預告片遇到問題，需要重新啟動。', 200, 540);
        ctx.fillText(`${Math.min(100, Math.floor(k * 300))}% 完成`, 200, 640);
        if (k > 0.3) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 5; for (let j = 0; j < 9; j++) { const a = j * 0.7 + 0.3; ctx.beginPath(); ctx.moveTo(1400, 600); ctx.lineTo(1400 + Math.cos(a) * 900 * (k - 0.3) * 3, 600 + Math.sin(a) * 900 * (k - 0.3) * 3); ctx.stroke(); } }
      } else if (k < 0.75) { ctx.save(); ctx.globalCompositeOperation = 'difference'; ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H); ctx.restore(); slam(ctx, '修好了！', W / 2, H / 2, 150, '#fff', k - 0.6, { skew: 0 }); }
      else slam(ctx, '修好了！', W / 2, H / 2, 150, '#fff', k - 0.6, { skew: 0 });
    } else if (c.g === 'cursor') {
      const x0 = nx - 30, y0 = 320, x1 = nx + 460, y1 = 540;
      const dk = ease(clamp(k / 0.35, 0, 1));
      const cx = U.lerp(x0, x1, dk), cy = U.lerp(y0, y1, dk);
      ctx.save(); ctx.fillStyle = 'rgba(80,140,255,0.2)'; ctx.strokeStyle = '#7ab0ff'; ctx.lineWidth = 4; ctx.setLineDash([16, 10]);
      ctx.fillRect(x0, y0, cx - x0, cy - y0); ctx.strokeRect(x0, y0, cx - x0, cy - y0); ctx.restore();
      if (k > 0.4 && k < 0.85) { ctx.fillStyle = '#f6f6fa'; ctx.fillRect(x1, y1, 300, 4 * 60 + 16); ['剪下(T)', '複製(C)', '貼上(P)', '刪除(D)'].forEach((m, j) => { if (j === 1 && k > 0.6) { ctx.fillStyle = '#cfe0ff'; ctx.fillRect(x1 + 6, y1 + 8 + j * 60, 288, 56); } ctx.font = `500 36px ${FONT}`; ctx.fillStyle = '#222'; ctx.textAlign = 'left'; ctx.fillText(m, x1 + 30, y1 + 50 + j * 60); }); }
      if (k > 0.85) for (let j = 1; j <= 3; j++) { ctx.save(); ctx.globalAlpha = 0.85; ctx.font = `900 200px ${FONT}`; ctx.fillStyle = '#fff'; ctx.strokeStyle = '#120818'; ctx.lineWidth = 16; ctx.textAlign = 'left'; const xx = nx + j * 210 * ease(clamp((k - 0.85) / 0.2, 0, 1)); ctx.strokeText(ch.name, xx, 500); ctx.fillText(ch.name, xx, 500); ctx.restore(); }
      bigCursor(ctx, k > 0.4 ? x1 + 120 : cx, k > 0.4 ? y1 + (k > 0.6 ? 110 : 40) : cy, 4.5);
    } else if (c.g === 'narr') {
      const sec = Math.floor(t);
      subtitle(ctx, 'natsume', `旁白：這支預告片已經播了 ${sec} 秒。`, k + 0.9, { life: 0.9, cps: 40 });
      subtitle(ctx, 'natsume', '……而你，還在看。', k, { life: 1.4 });
    } else if (c.g === 'frame') {
      const pull = ease(clamp((k - 0.2) / 0.5, 0, 1)), bar = 150 * (1 - pull);
      if (k > 0.05) {
        ctx.fillStyle = '#000'; ctx.fillRect(0, -pull * 160, W, bar + 4); ctx.fillRect(0, H - bar + pull * 160, W, bar + 4);
        for (const [y, s] of [[bar - 30 - pull * 160, 1], [H - bar + 30 + pull * 160, -1]]) for (const x of [700, 1300]) { ctx.save(); ctx.translate(x, y); ctx.beginPath(); ctx.ellipse(0, 0, 50, 36, 0, 0, TAU); ctx.fillStyle = '#fff'; ctx.fill(); ctx.strokeStyle = '#333'; ctx.lineWidth = 4; ctx.stroke(); ctx.fillStyle = '#ff9c40'; ctx.fillRect(-30, s > 0 ? -90 : 40, 60, 50); ctx.restore(); }
      }
      if (k > 0.75) slam(ctx, '這樣比較寬！', W / 2, 160, 90, '#ffe14a', k - 0.75);
    }
  }
  function sceneCards(ctx, t, lt) {
    const i = Math.min(5, Math.floor(lt / (2 * BAR)));
    // 鈴的卡片一開始就有電影黑邊
    drawCard(ctx, i, lt - i * 2 * BAR, t);
    if (i === 5 && lt - i * 2 * BAR < 1.45) { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, 150); ctx.fillRect(0, H - 150, W, 150); }
  }

  // ============================================================
  //  4. 緩衝中（預告片「卡住」了）
  // ============================================================
  function player(ctx, prog, playing) {
    ctx.save(); const g = ctx.createLinearGradient(0, H - 160, 0, H); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.75)'); ctx.fillStyle = g; ctx.fillRect(0, H - 160, W, 160);
    ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(60, H - 80, W - 120, 8); ctx.fillStyle = '#ff4a7a'; ctx.fillRect(60, H - 80, (W - 120) * prog, 8);
    ctx.beginPath(); ctx.arc(60 + (W - 120) * prog, H - 76, 16, 0, TAU); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = `700 32px ${FONT}`; ctx.textAlign = 'left'; ctx.fillText(playing ? '▶' : '❚❚', 70, H - 26);
    const s = prog * T.END; ctx.font = `500 28px ${FONT}`; ctx.fillText(`${U.fmtTime(s)} / ${U.fmtTime(T.END)}`, 140, H - 28);
    ctx.restore();
  }
  function sceneGag(ctx, t, lt) {
    const D = 2 * BAR;
    let cardT = D - 0.01, rewinding = false;
    if (lt > 1.0 && lt < 2.0) { cardT = D * (1 - (lt - 1.0)); rewinding = true; }
    else if (lt >= 2.0) cardT = 2.4;
    drawCard(ctx, 5, Math.max(0.05, cardT), t);
    if (rewinding) { for (let y = 0; y < H; y += 6) { ctx.fillStyle = `rgba(255,255,255,${0.04 + ((y + Math.floor(t * 120) * 7) % 37) / 400})`; ctx.fillRect(Math.sin(y * 0.05 + t * 40) * 20, y, W, 2); } slam(ctx, '◀◀', W - 260, 150, 120, '#fff', 0.2, { skew: 0 }); }
    ctx.fillStyle = `rgba(0,0,0,${rewinding ? 0.1 : 0.45})`; ctx.fillRect(0, 0, W, H);
    if (lt < 1.0 || (lt > 2.0 && lt < 2.6)) { ctx.save(); ctx.translate(W / 2, H / 2); ctx.rotate(t * 8); ctx.strokeStyle = '#fff'; ctx.lineWidth = 14; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(0, 0, 70, 0, Math.PI * 1.5); ctx.stroke(); ctx.restore(); ctx.font = `700 40px ${FONT}`; ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.fillText('緩衝中……', W / 2, H / 2 + 140); }
    const prog = lt < 1.0 ? 0.55 : lt < 2.0 ? 0.55 - (lt - 1.0) * 0.036 : 0.514;
    if (lt > 0.4) player(ctx, prog, lt > 2.6);
    // 汐的游標去拖進度條
    if (lt > 0.5 && lt < 2.4) {
      const px = 60 + (W - 120) * prog, k = clamp((lt - 0.5) / 0.4, 0, 1);
      bigCursor(ctx, U.lerp(W - 300, px - 8, ease(k)), U.lerp(500, H - 82, ease(k)), 4);
    }
    subtitle(ctx, 'shio', '這段太帥了，再看一次♪', lt - 1.0, { life: 1.1, y: 170 });
    if (lt > 2.0 && lt < 2.9) { portrait(ctx, 'akane', 1650, 760 - ease(clamp((lt - 2.0) / 0.2, 0, 1)) * 200, 1.2, { tt: t * 60, expr: 'surprised', flip: true }); subtitle(ctx, 'akane', '不、不是我弄當機的喔！', lt - 2.05, { life: 0.85, y: 170 }); }
    if (lt > 2.6) { slam(ctx, '▶', W / 2, H / 2, 260, '#fff', lt - 2.6, { skew: 0 }); }
    if (lt > 3.05) { const n = ['3', '2', '1'][Math.min(2, Math.floor((lt - 3.05) / 0.22))]; ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0, 0, W, H); slam(ctx, n, W / 2, H / 2, 300, '#ffe14a', ((lt - 3.05) % 0.22)); }
  }

  // ============================================================
  //  5. 反派
  // ============================================================
  const tmpC = document.createElement('canvas'); tmpC.width = W; tmpC.height = H; const tmp = tmpC.getContext('2d');
  const stageC = document.createElement('canvas'); stageC.width = 576; stageC.height = 672; const stx = stageC.getContext('2d');
  function sceneNanashi(ctx, t, lt) {
    tmp.setTransform(1, 0, 0, 1, 0, 0);
    tmp.fillStyle = '#0a0a10'; tmp.fillRect(0, 0, W, H);
    for (let i = 0; i < 40; i++) { const x = ((i * 241 + Math.floor(t * 12) * 97) % 20) * 96, y = ((i * 131 + Math.floor(t * 12) * 53) % 12) * 90; if ((i + Math.floor(t * 12)) % 3) continue; FW.Art.checker(tmp, x, y, 96, 96, 24); }
    tmp.save(); tmp.globalAlpha = 0.5; tmp.globalCompositeOperation = 'lighter';
    portrait(tmp, 'nanashi', 960 - 14, 500, 2.8, { tt: t * 60, expr: 'blank' }); portrait(tmp, 'nanashi', 960 + 14, 500, 2.8, { tt: t * 60, expr: 'blank' });
    tmp.restore();
    portrait(tmp, 'nanashi', 960, 500, 2.8, { tt: t * 60, expr: lt > 1.6 ? 'sad' : 'blank' });
    tmp.font = `700 40px monospace`; tmp.fillStyle = '#ff00dc'; tmp.textAlign = 'left';
    tmp.fillText('> load untitled_character_07.png'.slice(0, Math.floor(lt * 30)), 80, 120);
    if (lt > 1.0) tmp.fillText('> ERROR: texture missing. name = null', 80, 180);
    const nm = Math.floor(t * 10) % 3 ? '無名' : '■■';
    tmp.font = `900 220px ${FONT}`; tmp.lineWidth = 16; tmp.strokeStyle = '#000'; tmp.strokeText(nm, 1300, 620); tmp.fillStyle = '#fff'; tmp.fillText(nm, 1300, 620);
    tmp.font = `700 50px ${FONT}`; tmp.fillStyle = '#ff9ae8'; tmp.fillText('「未命名角色_07」', 1300, 720);
    // 掃描線錯位
    for (let y = 0; y < H; y += 36) { const off = Math.sin(y * 0.3 + Math.floor(t * 20)) > 0.7 ? (Math.sin(y + t * 50) * 60) : 0; ctx.drawImage(tmpC, 0, y, W, 36, off, y, W, 36); }
    subtitle(ctx, 'nanashi', '……我、也在、這裡。', lt - 0.9, { life: 1.6 });
    flash(ctx, 0.8 - lt / 0.1, '#ff00dc');
  }
  function sceneMaku(ctx, t, lt) {
    FW.BG.stage(stx, t * 60);
    ctx.drawImage(stageC, 0, 100, 576, 324, 0, 0, W, H);
    ctx.fillStyle = 'rgba(30,0,10,0.35)'; ctx.fillRect(0, 0, W, H);
    portrait(ctx, 'maku', 1240, 520, 2.6, { tt: t * 60, expr: lt > 1.7 ? 'smile' : 'serious' });
    ctx.save(); ctx.textAlign = 'left'; ctx.font = `900 220px ${SERIF}`; ctx.shadowColor = '#ff2a4a'; ctx.shadowBlur = 40; ctx.fillStyle = '#fff'; ctx.fillText('幕', 200, 560); ctx.shadowBlur = 0;
    ctx.font = `700 64px ${SERIF}`; ctx.fillStyle = '#ffd36b'; ctx.fillText('「第四面牆」', 180, 680); ctx.restore();
    subtitle(ctx, 'maku', '故事，總該有個結局。', lt - 0.5, { life: 1.1 });
    subtitle(ctx, 'maku', '……可是，你還不想結束吧？', lt - 1.7, { life: 1.1 });
    // 布幕打開
    const op = ease(clamp(lt / 0.55, 0, 1));
    for (const s of [0, 1]) { ctx.save(); if (s) { ctx.translate(W, 0); ctx.scale(-1, 1); } const cw = W / 2 * (1 - op) + 120; const cg = ctx.createLinearGradient(0, 0, cw, 0); cg.addColorStop(0, '#4a0610'); cg.addColorStop(1, '#a01828'); ctx.fillStyle = cg; ctx.fillRect(0, 0, cw, H); ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 8; for (let x = 40; x < cw; x += 70) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + Math.sin(x) * 10, H); ctx.stroke(); } ctx.restore(); }
  }

  // ============================================================
  //  6. 高潮
  // ============================================================
  const CLIMAX_CUTS = [8, 1, 4, 9, 2, 7, 10, 6, 0, 11, 3, 5];
  function sceneClimax(ctx, t, lt) {
    const cut = Math.min(11, Math.floor(lt / (2 * BEAT))), cl = lt - cut * 2 * BEAT;
    drawClipFrame(ctx, CLIMAX_CUTS[cut], t, cl, { x: [960, 700, 1220][cut % 3], rot: [0, -0.04, 0.04][cut % 3], scale: 1.42 + (cut % 4 === 0 ? 0.25 : 0) });
    const bar = Math.floor(lt / BAR), bl = lt - bar * BAR;
    if (bar < 3) {
      const c = TR.clips[CLIMAX_CUTS[cut]], bn = c.g.boss && c.g.boss.phase && c.g.boss.phase.name;
      if (bn) slam(ctx, bn, cut % 3 === 1 ? 1420 : 480, 160, 54, '#fff', cl - 0.05, { shadow: FW.CHARS[c.g.boss.charId].color });
    } else {
      const word = ['打破', '第四', '面牆'][bar - 3];
      ctx.fillStyle = `rgba(0,0,0,${0.55 - bl * 0.2})`; ctx.fillRect(0, 0, W, H);
      speedLines(ctx, W / 2, H / 2, t, bar === 5 ? '#ff4a7a' : '#ffffff', 80, 0.35, 300);
      slam(ctx, word, W / 2, H / 2, 300, bar === 4 ? '#ff4a7a' : '#fff', bl);
      if (bl < 0.08) { ctx.save(); ctx.globalCompositeOperation = 'difference'; ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H); ctx.restore(); }
    }
    flash(ctx, 0.5 - cl / 0.08);
    flash(ctx, (lt - (6 * BAR - 0.35)) / 0.35);
  }

  // ============================================================
  //  7. 標題
  // ============================================================
  function sceneLogo(ctx, t, lt) {
    const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#140824'); g.addColorStop(1, '#4a0e2a');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    speedLines(ctx, W / 2, 360, t, '#ffd0e0', 70, 0.08, 400);
    for (let i = 0; i < 6; i++) { const id = FW.PLAYABLE[i], at = 0.68 + i * BEAT * 0.5, k = clamp((lt - at) / 0.25, 0, 1); if (k <= 0) continue; const hop = Math.abs(Math.sin((lt - at) * 9)) * 30 * Math.max(0, 1 - (lt - at) * 1.5); Art.chibi(ctx, FW.CHARS[id].spec, 360 + i * 240, 720 - hop - (1 - U.easeBack(k)) * -300, 0.75, { t: t * 60 + i * 40, expr: 'happy' }); }
    const k = clamp(lt / 0.16, 0, 1), sc = 1.8 - 0.8 * ease(k);
    ctx.save(); ctx.translate(W / 2, 330); ctx.scale(sc, sc); ctx.globalAlpha = k;
    ctx.font = `900 230px ${SERIF}`; ctx.textAlign = 'center'; ctx.shadowColor = '#ff4a7a'; ctx.shadowBlur = 50; ctx.fillStyle = '#fff'; ctx.fillText('第四面牆', 0, 0); ctx.restore();
    if (lt > 0.4) { ctx.save(); ctx.globalAlpha = clamp((lt - 0.4) / 0.3, 0, 1); ctx.font = `italic 700 54px ${SERIF}`; ctx.textAlign = 'center'; ctx.fillStyle = '#ffc8d8'; ctx.fillText('FourthWall ～ Behind the Bullet Curtain', W / 2, 430); ctx.restore(); }
    if (lt > 1.9) { ctx.save(); ctx.globalAlpha = clamp((lt - 1.9) / 0.3, 0, 1); ctx.textAlign = 'center'; ctx.font = `700 44px ${FONT}`; ctx.fillStyle = '#fff'; ctx.fillText('6 位原創女主角｜40 張以上符卡｜8 種結局｜∞ 無盡幕間', W / 2, 900); ctx.restore(); }
    if (lt > 2.6) { ctx.save(); ctx.globalAlpha = clamp((lt - 2.6) / 0.3, 0, 1); ctx.textAlign = 'center'; ctx.font = `900 60px ${FONT}`; ctx.fillStyle = '#ffe14a'; ctx.fillText('免費・瀏覽器／手機・現在就能玩', W / 2, 990); ctx.font = `700 38px ${FONT}`; ctx.fillStyle = '#cfe0ff'; ctx.fillText(TR.live ? `現在是 ${FW.Real.hhmm()}——正是開始的好時機。` : 'howeraprojects.github.io/FourthWall', W / 2, 1050); ctx.restore(); }
    flash(ctx, 1 - lt / 0.25);
    flash(ctx, (lt - (4 * BAR - 0.5)) / 0.5, '#000');
  }

  // ============================================================
  //  8. 片尾彩蛋
  // ============================================================
  function scenePost(ctx, t, lt) {
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    if (lt > 0.9 && lt < 2.2) { ctx.save(); ctx.globalAlpha = Math.min(1, (lt - 0.9) / 0.3) * Math.min(1, (2.2 - lt) / 0.3); ctx.font = `500 34px ${FONT}`; ctx.fillStyle = '#777'; ctx.textAlign = 'center'; ctx.fillText('（預告片結束了）', W / 2, H / 2); ctx.restore(); }
    if (lt > 1.9 && lt < 5.2) {
      const k = ease(clamp((lt - 1.9) / 0.8, 0, 1)) * Math.min(1, (5.2 - lt) / 0.4);
      ctx.save(); ctx.globalAlpha = k; portrait(ctx, 'nanashi', W / 2, 1300 - k * 380, 2.4, { tt: t * 60, expr: lt > 3.6 ? 'normal' : 'blank' }); ctx.restore();
      subtitle(ctx, 'nanashi', '……預告片、結束了。', lt - 2.2, { life: 1.4, y: 200 });
      const plays = FW.Save.data.boots;
      subtitle(ctx, 'nanashi', TR.live ? (TR.hasSave && plays > 0 ? `你、已經、打開遊戲、${plays} 次了。……還要、再一次？` : '你、還沒、玩過？……還在、看？') : '你、還在看？', lt - 3.7, { life: 1.5, y: 200 });
    }
    for (const at of [4.9, 5.15, 5.4]) {
      const a = lt - at; if (a < 0 || a > 1.6) continue;
      const x = 500 + (at * 700) % 900, y = 300 + (at * 433) % 400;
      ctx.save(); ctx.globalAlpha = Math.max(0, 1 - a / 1.6); for (let r = 0; r < 3; r++) { ctx.beginPath(); ctx.arc(x, y, (a * 500 + r * 60), 0, TAU); ctx.strokeStyle = 'rgba(220,240,255,0.7)'; ctx.lineWidth = 6; ctx.stroke(); }
      ctx.font = `900 90px ${FONT}`; ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.fillText('叩！', x, y - 60 - a * 40); ctx.restore();
    }
    if (lt > 5.4 && lt < 8.0) {
      const k = U.easeBack(clamp((lt - 5.4) / 0.35, 0, 1)) * Math.min(1, (8.0 - lt) / 0.3);
      ctx.save(); ctx.globalAlpha = Math.min(1, k); portrait(ctx, 'suzu', 1500 + (1 - k) * 600, 560, 2.2, { tt: t * 60, expr: 'happy', flip: true }); ctx.restore();
      subtitle(ctx, 'suzu', '還在看的話——快去玩啦！', lt - 5.6, { life: 2.2 });
    }
    if (lt > 7.6) {
      const k = clamp((lt - 7.6) / 0.6, 0, 1) * Math.min(1, (10.6 - lt) / 0.8);
      ctx.save(); ctx.globalAlpha = Math.max(0, k);
      const g = ctx.createRadialGradient(W / 2, H / 2, 50, W / 2, H / 2, 900); g.addColorStop(0, '#2a1a40'); g.addColorStop(1, '#000'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      portrait(ctx, 'rinne', W / 2, 560, 2.5, { tt: t * 60, expr: 'smile' });
      ctx.restore();
      subtitle(ctx, 'rinne', '我們在標題畫面等你喔。', lt - 7.9, { life: 2.4 });
    }
    if (lt > 10.2) { ctx.save(); ctx.globalAlpha = clamp((lt - 10.2) / 0.4, 0, 1); ctx.font = `900 64px ${SERIF}`; ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.fillText('第四面牆', W / 2, H / 2); ctx.restore(); }
  }

  // ============================================================
  //  主繪製
  // ============================================================
  TR.draw = function (ctx, t) {
    ctx.save();
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    if (t < T.INTRO) sceneAd(ctx, t);
    else if (t < T.DROP) sceneIntro(ctx, t, t - T.INTRO);
    else if (t < T.MONT_END) sceneMontage(ctx, t, t - T.DROP);
    else if (t < T.CARDS_END) sceneCards(ctx, t, t - T.MONT_END);
    else if (t < T.GAG_END) sceneGag(ctx, t, t - T.CARDS_END);
    else if (t < T.GAG_END + 2 * BAR) sceneNanashi(ctx, t, t - T.GAG_END);
    else if (t < T.VIL_END) sceneMaku(ctx, t, t - T.GAG_END - 2 * BAR);
    else if (t < T.CLIMAX_END) sceneClimax(ctx, t, t - T.VIL_END);
    else if (t < T.LOGO_END) sceneLogo(ctx, t, t - T.CLIMAX_END);
    else scenePost(ctx, t, t - T.LOGO_END);
    ctx.restore();
  };

  // ---------- 音訊時間軸 ----------
  TR.cues = function () {
    const c = [];
    const sfx = (t, n) => c.push({ t, sfx: n });
    [3.6, 3.85, 4.1].forEach(t => sfx(t, 'knock')); sfx(4.45, 'whoosh'); sfx(4.9, 'hit2'); sfx(5.0, 'impact'); sfx(5.0, 'glass');
    c.push({ t: 6.3, gain: 0 }); c.push({ t: 6.35, music: 'title', until: T.DROP }); c.push({ t: 6.4, gain: 1, ramp: 1.2 }); c.push({ t: 12.4, gain: 0.15, ramp: 1.4 });
    sfx(9.3, 'text'); sfx(10.7, 'text');
    sfx(12.0, 'riser'); [12.0, 12.62, 13.15, 13.45].forEach(t => sfx(t, 'hit2'));
    sfx(T.DROP, 'impact');
    c.push({ t: T.DROP - 0.01, gain: 1 }); c.push({ t: T.DROP, music: 'b_true', step: 0, until: T.CARDS_END });
    for (let i = 1; i < 8; i++) sfx(T.DROP + i * BAR, 'hit2');
    for (let i = 0; i < 6; i++) {
      const s = T.MONT_END + i * 2 * BAR; sfx(s, 'whoosh'); sfx(s, 'hit2');
      const k = s + 1.45, g = CARDS[i].g;
      if (g === 'pause') { sfx(k, 'pause'); sfx(k + 0.36, 'cursor'); sfx(k + 0.85, 'hit2'); }
      if (g === 'sub') for (let j = 0; j < 8; j++) sfx(k + j * 0.06, 'type');
      if (g === 'bsod') { sfx(k, 'error'); sfx(k + 0.3, 'crack'); sfx(k + 0.6, 'glass'); }
      if (g === 'cursor') { sfx(k, 'click'); sfx(k + 0.4, 'click'); sfx(k + 0.85, 'select'); }
      if (g === 'narr') sfx(k - 0.9, 'text');
      if (g === 'frame') { sfx(k + 0.2, 'stretch'); sfx(k + 0.75, 'boing'); }
    }
    sfx(T.CARDS_END, 'tapestop');
    sfx(T.CARDS_END + 0.9, 'click'); sfx(T.CARDS_END + 1.0, 'rewind'); sfx(T.CARDS_END + 2.6, 'click');
    [3.05, 3.27, 3.49].forEach(d => sfx(T.CARDS_END + d, 'timeout'));
    sfx(T.GAG_END, 'impact'); sfx(T.GAG_END, 'error');
    c.push({ t: T.GAG_END, music: 'b_true', step: 128, until: T.LOGO_END + 0.6 });
    sfx(T.GAG_END + 2 * BAR, 'boom'); sfx(T.GAG_END + 2 * BAR, 'spell');
    sfx(T.VIL_END, 'spell'); sfx(T.VIL_END, 'impact');
    for (let i = 0; i < 12; i++) sfx(T.VIL_END + i * 2 * BEAT, 'hit2');
    for (let b = 3; b < 6; b++) sfx(T.VIL_END + b * BAR, 'impact');
    sfx(T.CLIMAX_END - 0.35, 'riser');
    sfx(T.CLIMAX_END, 'impact'); sfx(T.CLIMAX_END + 0.3, 'capture');
    c.push({ t: T.LOGO_END - 1.2, gain: 0, ramp: 1.6 });
    [4.9, 5.15, 5.4].forEach(d => sfx(T.LOGO_END + d, 'knock'));
    c.push({ t: T.LOGO_END + 7.5, gain: 0 }); c.push({ t: T.LOGO_END + 7.55, music: 'title', until: T.END }); c.push({ t: T.LOGO_END + 7.6, gain: 0.8, ramp: 0.8 }); c.push({ t: T.END - 1.6, gain: 0, ramp: 1.5 });
    return c.sort((a, b) => a.t - b.t);
  };
  TR.renderAudio = () => A.renderOffline(TR.cues(), T.END);
  TR.allText = () => '這是一款彈幕射擊遊戲原本是你看得見我嗎也她們知道在看東方風格位原創女主角張以上符卡全向量繪製即時合成個關卡種結局打破第四面牆的無盡幕間然後這一次換被選中句台詞請不要跳過開始主人滑鼠借下框太擠了吧預告片已暫停繼續觀看重新播放刪除所有廣告騙此字幕無法關閉效閉上眼睛的遇到問題需要啟動完成修好剪複製貼旁白支經秒而還較寬緩衝中段帥再一次不是弄當機喔未命名角色載入失敗無名我在這裡幕故事總該有個結局可想束免費瀏覽器手機現就能玩正好時候結了打遊戲沒過快去標題畫面等廣告秒後略過什麼給看完全新清潔布擦得越乾淨越們商品除螢幕另側東西叩超細纖維牌片碎旁白CV想像力No.' + Object.values(FW.CHARS).map(c => c.name + c.title + c.bombName).join('');
})();
