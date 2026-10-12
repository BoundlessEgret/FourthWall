'use strict';
// ============================================================
//  Art — 向量角色繪製（立繪 + Q版遊戲角色 + 妖精）
//  座標：頭部中心為 (0,0)，頭寬約 110
// ============================================================
(function () {
  const U = FW.U;
  const Art = FW.Art = {};
  const LASH = '#2a1a26';

  // ---------- 小工具 ----------
  function hairGrad(ctx, spec, y0, y1) {
    const g = ctx.createLinearGradient(0, y0, 0, y1);
    g.addColorStop(0, U.shade(spec.hair, 0.18));
    g.addColorStop(0.45, spec.hair);
    g.addColorStop(1, U.shade(spec.hair, -0.28));
    return g;
  }
  function fillStroke(ctx, fill, stroke, lw = 1.5) {
    ctx.fillStyle = fill; ctx.fill();
    if (stroke) { ctx.lineWidth = lw; ctx.strokeStyle = stroke; ctx.lineJoin = 'round'; ctx.stroke(); }
  }
  const hairLine = spec => U.shade(spec.hair, -0.5);
  Art.hairLine = hairLine;

  // ---------- 後髮 ----------
  function backHair(ctx, spec, t, L = 1) {
    const st = spec.style.back, sw = Math.sin(t * 0.05) * 4;
    const line = hairLine(spec);
    ctx.save();
    // 頭頂後側
    ctx.beginPath(); ctx.ellipse(0, -8, 61, 62, 0, 0, TAU);
    fillStroke(ctx, hairGrad(ctx, spec, -70, 60), line);
    const tail = (s, y0) => { // 雙馬尾/側馬尾單邊
      ctx.beginPath();
      ctx.moveTo(s * 46, -46);
      ctx.bezierCurveTo(s * 104, -44, s * 122, 50 * L, s * (98 + sw * s * 0.5), 150 * L);
      ctx.bezierCurveTo(s * 90, 190 * L, s * (104 + sw), 222 * L, s * (114 + sw), 246 * L);
      ctx.bezierCurveTo(s * 78, 222 * L, s * 68, 175 * L, s * 70, 122 * L);
      ctx.bezierCurveTo(s * 72, 60 * L, s * 70, -6, s * 40, -26);
      ctx.closePath();
      fillStroke(ctx, hairGrad(ctx, spec, -40, 240 * L), line);
      // 髮絲線
      ctx.beginPath(); ctx.moveTo(s * 70, -20); ctx.bezierCurveTo(s * 100, 40 * L, s * 96, 120 * L, s * 92, 190 * L);
      ctx.strokeStyle = U.rgba(U.shade(spec.hair, -0.4), 0.35); ctx.lineWidth = 1.2; ctx.stroke();
    };
    if (st === 'long' || st === 'hime') {
      const flat = st === 'hime';
      ctx.beginPath();
      ctx.moveTo(-60, -24);
      ctx.bezierCurveTo(flat ? -70 : -74, 60 * L, flat ? -74 : -84, 150 * L, -86 + sw, 250 * L);
      if (flat) { ctx.lineTo(86 + sw, 250 * L); }
      else {
        const tips = [[-62, 236], [-44, 262], [-18, 240], [6, 266], [30, 242], [54, 262], [86, 250]];
        for (const [x, y] of tips) ctx.lineTo(x + sw, y * L);
      }
      ctx.bezierCurveTo(flat ? 74 : 84, 150 * L, flat ? 70 : 74, 60 * L, 60, -24);
      ctx.closePath();
      fillStroke(ctx, hairGrad(ctx, spec, -40, 250 * L), line);
      ctx.strokeStyle = U.rgba(U.shade(spec.hair, -0.4), 0.3); ctx.lineWidth = 1.2;
      for (const x of [-50, -22, 20, 48]) { ctx.beginPath(); ctx.moveTo(x * 0.8, 40); ctx.quadraticCurveTo(x * 1.1, 140 * L, x * 1.15 + sw, 230 * L); ctx.stroke(); }
    } else if (st === 'bob' || st === 'short') {
      const by = st === 'bob' ? 78 : 50;
      ctx.beginPath(); ctx.moveTo(-60, -24);
      ctx.bezierCurveTo(-72, 20, -70, by - 20, -62 + sw * 0.3, by);
      for (const [x, y] of [[-46, by - 10], [-30, by + 4], [30, by + 4], [46, by - 10], [62, by]]) ctx.lineTo(x + sw * 0.3, y);
      ctx.bezierCurveTo(70, by - 20, 72, 20, 60, -24); ctx.closePath();
      fillStroke(ctx, hairGrad(ctx, spec, -40, by), line);
    } else if (st === 'twintail') {
      tail(-1); tail(1);
    } else if (st === 'sidetail') {
      tail(-1);
      ctx.beginPath(); ctx.moveTo(-60, -24); ctx.bezierCurveTo(-70, 30, -64, 60, -56, 72); ctx.lineTo(56, 72); ctx.bezierCurveTo(64, 60, 70, 30, 60, -24); ctx.closePath();
      fillStroke(ctx, hairGrad(ctx, spec, -40, 80), line);
    } else if (st === 'ponytail') {
      ctx.beginPath();
      ctx.moveTo(14, -64);
      ctx.bezierCurveTo(96, -86, 126, 14, 104 + sw, 112 * L);
      ctx.bezierCurveTo(94, 160 * L, 110 + sw, 200 * L, 102 + sw * 1.5, 236 * L);
      ctx.bezierCurveTo(74, 196 * L, 76, 132 * L, 82, 84 * L);
      ctx.bezierCurveTo(88, 24, 62, -28, 8, -48);
      ctx.closePath();
      fillStroke(ctx, hairGrad(ctx, spec, -80, 230 * L), line);
      ctx.beginPath(); ctx.moveTo(-60, -24); ctx.bezierCurveTo(-68, 30, -62, 50, -54, 62); ctx.lineTo(54, 62); ctx.bezierCurveTo(62, 50, 68, 30, 60, -24); ctx.closePath();
      fillStroke(ctx, hairGrad(ctx, spec, -40, 70), line);
    }
    ctx.restore();
  }

  // ---------- 瀏海 ----------
  const BANGS = {
    straight: { tips: [[-50, 22], [-36, 8], [-22, 12], [-8, 6], [6, 11], [20, 5], [34, 10], [48, 22]], rec: -14 },
    parted: { tips: [[-52, 34], [-40, 14], [-27, 2], [-12, -6], [12, -6], [27, 2], [40, 14], [52, 34]], rec: -20, part: true },
    swept: { tips: [[-50, 28], [-34, 14], [-16, 10], [2, 6], [18, 0], [32, -4], [46, 8], [54, 26]], rec: -16, lean: 8 },
    hime: { tips: [[-48, 4], [-34, 1], [-20, 3], [-6, 0], [8, 3], [22, 0], [36, 2], [48, 4]], rec: -8 },
    messy: { tips: [[-52, 28], [-38, 6], [-26, 14], [-10, 2], [4, 12], [18, 0], [32, 12], [46, 6], [54, 26]], rec: -16, lean: 4 },
    sword: { tips: [[-56, 34], [-44, 8], [-32, 18], [-20, -2], [-9, 10], [-3, 42], [7, 4], [20, 14], [32, -4], [44, 12], [56, 32]], rec: -18, lean: 3 },
  };
  function bangsPath(ctx, kind) {
    const B = BANGS[kind] || BANGS.straight, tips = B.tips, lean = B.lean || 0;
    ctx.beginPath();
    ctx.moveTo(-60, 14);
    ctx.bezierCurveTo(-66, -50, -32, -73, 0, -73);
    ctx.bezierCurveTo(32, -73, 66, -50, 60, 14);
    let px = 60, py = 14;
    for (let i = tips.length - 1; i >= 0; i--) {
      const [tx, ty] = tips[i];
      const nx = i > 0 ? (tips[i][0] + tips[i - 1][0]) / 2 : -60;
      const ny = i > 0 ? (B.part && Math.abs(nx) < 4 ? -34 : B.rec + Math.abs(nx) * 0.12) : 14;
      ctx.quadraticCurveTo((px + tx) / 2 + lean * 0.3, (py + ty) / 2 - 4, tx + lean * 0.4, ty);
      ctx.quadraticCurveTo((tx + nx) / 2 - lean * 0.1, (ty + ny) / 2 - 6, nx, ny);
      px = nx; py = ny;
    }
    ctx.closePath();
  }
  function sideLocks(ctx, spec, t) {
    const len = spec.style.lock || 110, sw = Math.sin(t * 0.05 + 1) * 2;
    const flat = spec.style.bangs === 'hime';
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(s * 40, -24);
      ctx.bezierCurveTo(s * 62, 10, s * 64, len * 0.6, s * (56 + sw), len);
      if (flat) ctx.lineTo(s * 40, len);
      ctx.bezierCurveTo(s * 48, len * 0.6, s * 44, 20, s * 32, -6);
      ctx.closePath();
      fillStroke(ctx, hairGrad(ctx, spec, -20, len), hairLine(spec), 1.3);
    }
  }

  // ---------- 臉 ----------
  function facePath(ctx, male) {
    ctx.beginPath();
    if (male) { // 稜角分明的下顎
      ctx.moveTo(-50, -8); ctx.lineTo(-48, 22); ctx.quadraticCurveTo(-44, 40, -28, 52); ctx.lineTo(-10, 63); ctx.quadraticCurveTo(0, 67, 10, 63); ctx.lineTo(28, 52); ctx.quadraticCurveTo(44, 40, 48, 22); ctx.lineTo(50, -8);
      ctx.ellipse(0, -8, 50, 52, 0, 0, Math.PI, true); ctx.closePath(); return;
    }
    ctx.moveTo(-51, -8);
    ctx.bezierCurveTo(-52, 22, -42, 44, -18, 58);
    ctx.quadraticCurveTo(0, 68, 18, 58);
    ctx.bezierCurveTo(42, 44, 52, 22, 51, -8);
    ctx.ellipse(0, -8, 51, 52, 0, 0, Math.PI, true);
    ctx.closePath();
  }
  function drawEye(ctx, side, spec, eyeMode, look) {
    const col = side > 0 ? spec.eye : (spec.eye2 || spec.eye);
    ctx.save();
    ctx.translate(side * 23, 14); ctx.scale(side, 1);
    if (spec.male) { ctx.translate(0, 3); ctx.scale(1.02, 0.72); ctx.rotate(-0.06); }
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (eyeMode === 'happy') {
      ctx.beginPath(); ctx.moveTo(-12, 5); ctx.quadraticCurveTo(1, -10, 15, 4);
      ctx.lineWidth = 3.2; ctx.strokeStyle = LASH; ctx.stroke(); ctx.restore(); return;
    }
    if (eyeMode === 'closed') {
      ctx.beginPath(); ctx.moveTo(-12, 3); ctx.quadraticCurveTo(1, 9, 15, 2);
      ctx.lineWidth = 2.8; ctx.strokeStyle = LASH; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(13, 3); ctx.lineTo(18, 0); ctx.stroke();
      ctx.restore(); return;
    }
    const lx = (look ? look.x : 0) * side, ly = look ? look.y : 0;
    const wide = eyeMode === 'wide', half = eyeMode === 'half';
    // 眼白
    ctx.beginPath();
    ctx.moveTo(-12, 2); ctx.bezierCurveTo(-10, -10, 8, -15, 15, -5);
    ctx.bezierCurveTo(15, 4, 10, 12, 1, 12.5); ctx.bezierCurveTo(-6, 12.5, -11, 8, -12, 2);
    ctx.closePath();
    ctx.fillStyle = '#fffafa'; ctx.fill();
    ctx.save(); ctx.clip();
    if (half) { ctx.beginPath(); ctx.rect(-20, -3, 40, 30); ctx.clip(); }
    // 虹膜
    const irx = wide ? 8.5 : 10.5, iry = wide ? 10 : 12.5;
    const g = ctx.createLinearGradient(0, -11, 0, 14);
    g.addColorStop(0, U.shade(col, -0.6)); g.addColorStop(0.45, col); g.addColorStop(1, U.shade(col, 0.5));
    ctx.beginPath(); ctx.ellipse(1 + lx, 1.5 + ly, irx, iry, 0, 0, TAU); ctx.fillStyle = g; ctx.fill();
    ctx.lineWidth = 1.2; ctx.strokeStyle = U.shade(col, -0.65); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(1 + lx, 2.5 + ly, irx * 0.7, iry * 0.72, 0, 0.2, Math.PI - 0.2); ctx.strokeStyle = U.rgba(U.shade(col, 0.6), 0.55); ctx.lineWidth = 1.4; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(1 + lx, 2 + ly, wide ? 2.6 : 4.4, wide ? 3.6 : 6.6, 0, 0, TAU); ctx.fillStyle = U.rgba(U.shade(col, -0.75), 0.9); ctx.fill();
    // 上眼瞼陰影
    const sg = ctx.createLinearGradient(0, -14, 0, 0); sg.addColorStop(0, 'rgba(40,20,40,0.35)'); sg.addColorStop(1, 'rgba(40,20,40,0)');
    ctx.fillStyle = sg; ctx.fillRect(-16, -16, 34, 16);
    // 高光
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.ellipse(-3 + lx, -4 + ly, wide ? 2.6 : 3.6, wide ? 3.4 : 4.6, -0.3, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(5 + lx, 7 + ly, 1.7, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(6 + lx, -6 + ly, 0.9, 0, TAU); ctx.fill();
    ctx.restore();
    // 睫毛
    ctx.strokeStyle = LASH;
    if (half) {
      ctx.beginPath(); ctx.moveTo(-13, 3); ctx.quadraticCurveTo(0, -6, 16, -3); ctx.lineWidth = 3.2; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(14, -3); ctx.lineTo(19, -6); ctx.lineWidth = 2.2; ctx.stroke();
    } else {
      ctx.beginPath(); ctx.moveTo(-13, 3); ctx.bezierCurveTo(-10, -11, 8, -16, 16, -6); ctx.lineWidth = 3; ctx.stroke();
      if (!spec.male) { ctx.beginPath(); ctx.moveTo(4, -13.5); ctx.quadraticCurveTo(12, -11, 16, -6); ctx.lineTo(20, -9); ctx.lineWidth = 3.8; ctx.stroke(); }
      ctx.beginPath(); ctx.moveTo(-6, -17); ctx.quadraticCurveTo(4, -20, 13, -13); ctx.lineWidth = 0.9; ctx.strokeStyle = U.rgba(LASH, 0.45); ctx.stroke();
    }
    ctx.beginPath(); ctx.moveTo(5, 12.5); ctx.quadraticCurveTo(11, 11, 13.5, 7.5); ctx.lineWidth = 1.2; ctx.strokeStyle = U.rgba(LASH, 0.7); ctx.stroke();
    ctx.restore();
  }
  function drawBrows(ctx, spec, mode) {
    const c = U.shade(spec.hair, -0.45);
    for (const s of [-1, 1]) {
      ctx.save(); ctx.translate(s * 23, 14); ctx.scale(s, 1);
      let inD = 0, outD = 0, up = 0;
      if (mode === 'angry') { inD = 5; outD = -2; }
      else if (mode === 'sad') { inD = -4; outD = 3; }
      else if (mode === 'up') { up = -4; }
      if (spec.male) { // 劍眉：粗、直、往外上揚
        ctx.beginPath(); ctx.moveTo(-12, -18 + inD + up); ctx.lineTo(2, -21 + up + (inD + outD) / 2); ctx.lineTo(17, -25 + outD + up); ctx.lineTo(16, -21 + outD + up); ctx.lineTo(2, -18 + up + (inD + outD) / 2); ctx.lineTo(-12, -16 + inD + up); ctx.closePath();
        ctx.fillStyle = c; ctx.fill();
      } else {
      ctx.beginPath(); ctx.moveTo(-11, -24 + inD + up); ctx.quadraticCurveTo(2, -29 + up + (inD + outD) / 2, 15, -23 + outD + up);
      ctx.lineWidth = 2.2; ctx.lineCap = 'round'; ctx.strokeStyle = c; ctx.stroke();
      }
      ctx.restore();
    }
  }
  function drawMouth(ctx, mode) {
    const lc = '#9c4a55';
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = lc; ctx.lineWidth = 1.8;
    ctx.beginPath();
    switch (mode) {
      case 'open': case 'grin':
        ctx.moveTo(-8, 39); ctx.quadraticCurveTo(0, 41, 8, 39); ctx.quadraticCurveTo(6, 51, 0, 51.5); ctx.quadraticCurveTo(-6, 51, -8, 39);
        ctx.fillStyle = '#8a3040'; ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.ellipse(0, 48, 4.2, 2.6, 0, 0, TAU); ctx.fillStyle = '#ec7d8e'; ctx.fill();
        if (mode === 'grin') { ctx.beginPath(); ctx.moveTo(-6, 40.5); ctx.lineTo(6, 40.5); ctx.lineWidth = 2; ctx.strokeStyle = '#fff'; ctx.stroke(); }
        break;
      case 'small':
        ctx.moveTo(-4, 41); ctx.quadraticCurveTo(0, 46, 4, 41); ctx.quadraticCurveTo(0, 43, -4, 41); ctx.fillStyle = '#8a3040'; ctx.fill(); ctx.stroke(); break;
      case 'o': ctx.ellipse(0, 43, 3.4, 4.4, 0, 0, TAU); ctx.fillStyle = '#8a3040'; ctx.fill(); ctx.stroke(); break;
      case 'flat': ctx.moveTo(-5, 42); ctx.lineTo(5, 42); ctx.stroke(); break;
      case 'frown': ctx.moveTo(-6, 44); ctx.quadraticCurveTo(0, 39, 6, 44); ctx.stroke(); break;
      case 'cat': ctx.moveTo(-7, 40); ctx.quadraticCurveTo(-3.5, 45, 0, 41); ctx.quadraticCurveTo(3.5, 45, 7, 40); ctx.stroke(); break;
      case 'smirk': ctx.moveTo(-5, 42); ctx.quadraticCurveTo(2, 44.5, 7, 38.5); ctx.stroke(); break;
      case 'clench':
        ctx.beginPath(); ctx.roundRect(-10, 38, 20, 8, 3); ctx.fillStyle = '#fff'; ctx.fill(); ctx.strokeStyle = lc; ctx.lineWidth = 1.6; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-9, 42); ctx.lineTo(9, 42); for (let x = -6; x <= 6; x += 4) { ctx.moveTo(x, 38.5); ctx.lineTo(x, 45.5); } ctx.lineWidth = 0.8; ctx.stroke(); break;
      case 'yell':
        ctx.moveTo(-10, 37); ctx.quadraticCurveTo(0, 35, 10, 37); ctx.quadraticCurveTo(8, 55, 0, 56); ctx.quadraticCurveTo(-8, 55, -10, 37);
        ctx.fillStyle = '#7a2434'; ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.ellipse(0, 51, 5, 3, 0, 0, TAU); ctx.fillStyle = '#ec7d8e'; ctx.fill();
        ctx.beginPath(); ctx.moveTo(-8, 38.5); ctx.lineTo(8, 38.5); ctx.lineWidth = 2.4; ctx.strokeStyle = '#fff'; ctx.stroke(); break;
      case 'wavy': ctx.moveTo(-7, 42); ctx.quadraticCurveTo(-3.5, 39, 0, 42); ctx.quadraticCurveTo(3.5, 45, 7, 42); ctx.stroke(); break;
      default: ctx.moveTo(-6, 40); ctx.quadraticCurveTo(0, 45, 6, 40); ctx.stroke();
    }
  }
  // 表情表
  const EXPR = {
    normal: { eye: 'normal', brow: 'normal', mouth: 'smile' },
    happy: { eye: 'happy', brow: 'up', mouth: 'open' },
    smile: { eye: 'normal', brow: 'normal', mouth: 'open' },
    surprised: { eye: 'wide', brow: 'up', mouth: 'o' },
    angry: { eye: 'normal', brow: 'angry', mouth: 'frown' },
    shout: { eye: 'normal', brow: 'angry', mouth: 'grin' },
    sad: { eye: 'normal', brow: 'sad', mouth: 'frown' },
    smug: { eye: 'half', brow: 'normal', mouth: 'smirk' },
    tired: { eye: 'half', brow: 'sad', mouth: 'flat' },
    blush: { eye: 'normal', brow: 'sad', mouth: 'wavy', blush: 2 },
    cat: { eye: 'happy', brow: 'up', mouth: 'cat' },
    closed: { eye: 'closed', brow: 'normal', mouth: 'smile' },
    serious: { eye: 'normal', brow: 'angry', mouth: 'flat' },
    cry: { eye: 'closed', brow: 'sad', mouth: 'wavy', tears: true, blush: 1 },
    blank: { eye: 'wide', brow: 'normal', mouth: 'flat' },
    strain: { eye: 'normal', brow: 'angry', mouth: 'clench', sweat: true },
    yell: { eye: 'normal', brow: 'angry', mouth: 'yell' },
  };
  Art.EXPR = EXPR;

  // ---------- 服裝 ----------
  function torsoPath(ctx, wide = 1) {
    ctx.beginPath();
    ctx.moveTo(-15, 84);
    ctx.bezierCurveTo(-40, 88, -70 * wide, 92, -82 * wide, 118);
    ctx.bezierCurveTo(-92 * wide, 150, -94 * wide, 220, -96 * wide, 320);
    ctx.lineTo(96 * wide, 320);
    ctx.bezierCurveTo(94 * wide, 220, 92 * wide, 150, 82 * wide, 118);
    ctx.bezierCurveTo(70 * wide, 92, 40, 88, 15, 84);
    ctx.closePath();
  }
  function bow(ctx, x, y, s, col, rot = 0) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
    const line = U.shade(col, -0.45);
    for (const d of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(0, 0);
      ctx.bezierCurveTo(d * 10, -16, d * 30, -18, d * 30, -4);
      ctx.bezierCurveTo(d * 30, 8, d * 12, 8, 0, 0);
      fillStroke(ctx, col, line, 1.4);
      ctx.beginPath(); ctx.moveTo(d * 3, 3); ctx.lineTo(d * 14, 28); ctx.lineTo(d * 7, 26); ctx.lineTo(d * 2, 30); ctx.lineTo(d * 1, 4);
      fillStroke(ctx, U.shade(col, -0.1), line, 1.2);
    }
    ctx.beginPath(); ctx.ellipse(0, 0, 5, 6, 0, 0, TAU); fillStroke(ctx, U.shade(col, 0.1), line, 1.4);
    ctx.restore();
  }
  Art.bow = bow;
  function checker(ctx, x, y, w, h, s) {
    for (let i = 0; i < w / s; i++) for (let j = 0; j < h / s; j++) {
      ctx.fillStyle = (i + j) % 2 ? '#ff00dc' : '#111';
      ctx.fillRect(x + i * s, y + j * s, s, s);
    }
  }
  Art.checker = checker;
  function outfit(ctx, spec) {
    const o = spec.outfit, main = o.main, sub = o.sub, acc = o.accent, line = U.shade(main, -0.55);
    const skin = spec.skin;
    // 脖子
    const nk = spec.male ? 3 : 0;
    ctx.beginPath(); ctx.moveTo(-13 - nk, 40); ctx.lineTo(13 + nk, 40); ctx.lineTo(15 + nk, 96); ctx.lineTo(-15 - nk, 96); ctx.closePath();
    fillStroke(ctx, skin, U.shade(skin, -0.3), 1);
    ctx.beginPath(); ctx.ellipse(0, 60, 16, 10, 0, 0, TAU); ctx.fillStyle = U.rgba(U.shade(skin, -0.25), 0.6); ctx.fill();
    if (o.type === 'hoodie') { // 帽兜在後
      ctx.beginPath(); ctx.moveTo(-60, 100); ctx.bezierCurveTo(-70, 60, -40, 70, 0, 74); ctx.bezierCurveTo(40, 70, 70, 60, 60, 100); ctx.closePath();
      fillStroke(ctx, U.shade(main, -0.25), line);
    }
    if (o.type === 'dress') {
      // 露肩禮服
      ctx.beginPath(); ctx.moveTo(-15, 84); ctx.bezierCurveTo(-40, 88, -70, 92, -82, 118); ctx.lineTo(-84, 140); ctx.lineTo(84, 140); ctx.lineTo(82, 118); ctx.bezierCurveTo(70, 92, 40, 88, 15, 84); ctx.closePath();
      fillStroke(ctx, skin, U.shade(skin, -0.3), 1);
      ctx.strokeStyle = U.rgba(U.shade(skin, -0.3), 0.6); ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(-40, 106); ctx.quadraticCurveTo(-20, 100, -6, 108); ctx.moveTo(40, 106); ctx.quadraticCurveTo(20, 100, 6, 108); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-90, 132);
      for (let i = 0; i <= 12; i++) ctx.quadraticCurveTo(-90 + i * 15 - 7.5, 122 + (i % 2) * 4, -90 + i * 15, 132);
      ctx.lineTo(96, 320); ctx.lineTo(-96, 320); ctx.closePath();
      const g = ctx.createLinearGradient(0, 130, 0, 320); g.addColorStop(0, U.shade(main, 0.15)); g.addColorStop(1, U.shade(main, -0.35));
      fillStroke(ctx, g, line);
      ctx.beginPath(); ctx.moveTo(-90, 134); for (let i = 0; i <= 12; i++) ctx.quadraticCurveTo(-90 + i * 15 - 7.5, 124 + (i % 2) * 4, -90 + i * 15, 134);
      ctx.strokeStyle = acc; ctx.lineWidth = 3; ctx.stroke();
      // 頸飾
      ctx.beginPath(); ctx.moveTo(-13, 72); ctx.quadraticCurveTo(0, 78, 13, 72); ctx.lineWidth = 5; ctx.strokeStyle = sub; ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 80, 4.5, 0, TAU); fillStroke(ctx, acc, U.shade(acc, -0.5), 1);
      for (let i = -1; i <= 1; i += 2) { ctx.beginPath(); ctx.moveTo(i * 30, 200); ctx.quadraticCurveTo(i * 40, 260, i * 36, 320); ctx.strokeStyle = U.rgba(U.shade(main, -0.6), 0.4); ctx.lineWidth = 2; ctx.stroke(); }
      return;
    }
    torsoPath(ctx, o.type === 'kimono' ? 1.08 : o.type === 'hanfu' ? 1.14 : 1);
    const g = ctx.createLinearGradient(-90, 90, 90, 320); g.addColorStop(0, U.shade(main, 0.15)); g.addColorStop(1, U.shade(main, -0.2));
    fillStroke(ctx, g, line);
    // 衣褶
    ctx.strokeStyle = U.rgba(line, 0.3); ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(-60, 180); ctx.quadraticCurveTo(-55, 240, -62, 310); ctx.moveTo(60, 180); ctx.quadraticCurveTo(55, 240, 62, 310); ctx.stroke();
    switch (o.type) {
      case 'sailor': {
        ctx.beginPath(); ctx.moveTo(-15, 84); ctx.lineTo(0, 150); ctx.lineTo(15, 84); ctx.closePath(); fillStroke(ctx, '#ffffff', U.shade('#ffffff', -0.3), 1);
        ctx.beginPath(); ctx.moveTo(-16, 84); ctx.lineTo(-76, 108); ctx.lineTo(-64, 150); ctx.lineTo(0, 182); ctx.lineTo(64, 150); ctx.lineTo(76, 108); ctx.lineTo(16, 84); ctx.lineTo(0, 150); ctx.closePath();
        fillStroke(ctx, sub, U.shade(sub, -0.5));
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(-70, 114); ctx.lineTo(-60, 146); ctx.lineTo(-6, 172); ctx.moveTo(70, 114); ctx.lineTo(60, 146); ctx.lineTo(6, 172); ctx.stroke();
        bow(ctx, 0, 162, 1.1, acc);
        break;
      }
      case 'kimono': {
        ctx.beginPath(); ctx.moveTo(-18, 84); ctx.lineTo(16, 200); ctx.lineWidth = 12; ctx.strokeStyle = '#fbf6ef'; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(18, 84); ctx.lineTo(-10, 170); ctx.lineWidth = 12; ctx.strokeStyle = sub; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-26, 86); ctx.lineTo(12, 210); ctx.lineWidth = 6; ctx.strokeStyle = sub; ctx.stroke();
        ctx.fillStyle = acc; ctx.fillRect(-96, 228, 192, 30);
        ctx.strokeStyle = U.shade(acc, -0.4); ctx.lineWidth = 1.5; ctx.strokeRect(-96, 228, 192, 30);
        ctx.beginPath(); ctx.moveTo(-96, 243); ctx.lineTo(96, 243); ctx.strokeStyle = U.rgba('#ffffff', 0.5); ctx.stroke();
        // 小花紋
        ctx.fillStyle = U.rgba(sub, 0.5);
        for (const [x, y] of [[-60, 150], [50, 190], [-40, 290], [70, 280], [-75, 210]]) { for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.arc(x + Math.cos(k * TAU / 5) * 5, y + Math.sin(k * TAU / 5) * 5, 3.5, 0, TAU); ctx.fill(); } }
        break;
      }
      case 'hoodie': {
        ctx.beginPath(); ctx.moveTo(0, 96); ctx.lineTo(0, 320); ctx.strokeStyle = U.shade(main, -0.4); ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = '#ddd'; for (let y = 104; y < 320; y += 8) ctx.fillRect(-2, y, 4, 3);
        ctx.strokeStyle = sub; ctx.lineWidth = 3; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(-14, 98); ctx.quadraticCurveTo(-18, 130, -14, 160); ctx.moveTo(14, 98); ctx.quadraticCurveTo(18, 130, 12, 150); ctx.stroke();
        ctx.fillStyle = acc; ctx.beginPath(); ctx.arc(-14, 162, 4, 0, TAU); ctx.arc(12, 152, 4, 0, TAU); ctx.fill();
        // 胸前圖案
        if (o.logo) { ctx.font = 'bold 26px sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = acc; ctx.fillText(o.logo, -48, 210); }
        break;
      }
      case 'maid': {
        ctx.beginPath(); ctx.moveTo(-38, 140); ctx.quadraticCurveTo(0, 128, 38, 140); ctx.lineTo(44, 320); ctx.lineTo(-44, 320); ctx.closePath(); fillStroke(ctx, '#fdfdff', '#9aa');
        ctx.beginPath(); for (let i = -38; i <= 38; i += 9.5) { ctx.moveTo(i, 140); ctx.arc(i + 4.75, 140, 4.75, Math.PI, 0); } ctx.fillStyle = '#fff'; ctx.fill(); ctx.strokeStyle = '#aab'; ctx.lineWidth = 1; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-22, 88); ctx.lineTo(0, 106); ctx.lineTo(22, 88); ctx.lineTo(28, 100); ctx.lineTo(0, 118); ctx.lineTo(-28, 100); ctx.closePath(); fillStroke(ctx, '#fff', '#99a', 1);
        bow(ctx, 0, 112, 0.8, acc);
        break;
      }
      case 'gothic': {
        ctx.beginPath();
        for (let i = 0; i < 9; i++) { const a = Math.PI * (0.05 + i * 0.1125); ctx.moveTo(0, 84); ctx.arc(Math.cos(a) * 34, 88 + Math.sin(a) * 18, 9, 0, TAU); }
        ctx.fillStyle = '#f4f0f8'; ctx.fill();
        ctx.beginPath(); ctx.ellipse(0, 92, 32, 14, 0, 0, Math.PI); ctx.fillStyle = '#f4f0f8'; ctx.fill();
        bow(ctx, 0, 112, 0.9, acc);
        ctx.strokeStyle = U.rgba(acc, 0.8); ctx.lineWidth = 2;
        for (let y = 150; y < 320; y += 22) { ctx.beginPath(); ctx.moveTo(-10, y); ctx.lineTo(10, y + 10); ctx.moveTo(10, y); ctx.lineTo(-10, y + 10); ctx.stroke(); }
        ctx.beginPath(); ctx.moveTo(-82, 118); ctx.bezierCurveTo(-100, 100, -110, 140, -92, 160); ctx.closePath(); fillStroke(ctx, U.shade(main, 0.1), line);
        ctx.beginPath(); ctx.moveTo(82, 118); ctx.bezierCurveTo(100, 100, 110, 140, 92, 160); ctx.closePath(); fillStroke(ctx, U.shade(main, 0.1), line);
        break;
      }
      case 'hanfu': { // 無涯：交領長袍
        // 內襯（交領）
        ctx.beginPath(); ctx.moveTo(-20, 84); ctx.lineTo(24, 168); ctx.lineTo(34, 160); ctx.lineTo(-2, 84); ctx.closePath(); ctx.fillStyle = '#ffffff'; ctx.fill();
        ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(-24, 84); ctx.lineTo(26, 186); ctx.lineWidth = 11; ctx.strokeStyle = sub; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(24, 84); ctx.lineTo(4, 128); ctx.lineWidth = 9; ctx.strokeStyle = sub; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-24, 84); ctx.lineTo(26, 186); ctx.lineWidth = 2; ctx.strokeStyle = acc; ctx.stroke();
        // 外袍的雲紋
        ctx.strokeStyle = U.rgba(sub, 0.35); ctx.lineWidth = 2;
        for (const [x, y, k] of [[-62, 170, 1], [64, 262, -1], [-48, 290, 1]]) { ctx.beginPath(); ctx.arc(x, y, 9, Math.PI * 0.2, Math.PI * 1.6); ctx.arc(x + k * 14, y - 4, 6, Math.PI, Math.PI * 2.3); ctx.stroke(); }
        // 腰帶
        const sash = o.sash || '#182030';
        ctx.fillStyle = sash; ctx.fillRect(-104, 226, 208, 26); ctx.strokeStyle = U.shade(sash, 0.4); ctx.lineWidth = 1.5; ctx.strokeRect(-104, 226, 208, 26);
        ctx.fillStyle = acc; ctx.fillRect(-104, 237, 208, 3);
        // 玉珮
        ctx.beginPath(); ctx.moveTo(-40, 252); ctx.lineTo(-40, 276); ctx.strokeStyle = acc; ctx.lineWidth = 2; ctx.stroke();
        ctx.beginPath(); ctx.arc(-40, 288, 11, 0, TAU); fillStroke(ctx, U.mix(acc, '#ffffff', 0.25), U.shade(acc, -0.45), 1.5);
        ctx.beginPath(); ctx.arc(-40, 288, 4, 0, TAU); ctx.fillStyle = U.shade(acc, -0.3); ctx.fill();
        for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(-40 + i * 2, 298); ctx.lineTo(-40 + i * 4, 318); ctx.strokeStyle = U.shade(acc, -0.2); ctx.lineWidth = 1.5; ctx.stroke(); }
        // 寬肩的披風邊
        ctx.strokeStyle = sub; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(-93, 124); ctx.bezierCurveTo(-104, 170, -106, 250, -108, 320); ctx.moveTo(93, 124); ctx.bezierCurveTo(104, 170, 106, 250, 108, 320); ctx.stroke();
        break;
      }
      case 'shift': { // 無名：未完成的貼圖
        checker(ctx, -70, 170, 50, 50, 10); checker(ctx, 30, 230, 40, 60, 10);
        ctx.font = 'bold 14px monospace'; ctx.fillStyle = '#ff00dc'; ctx.textAlign = 'center'; ctx.fillText('#MISSING', 10, 160);
        ctx.beginPath(); ctx.moveTo(-15, 84); ctx.quadraticCurveTo(0, 104, 15, 84); ctx.strokeStyle = sub; ctx.lineWidth = 3; ctx.stroke();
        break;
      }
    }
  }

  // ---------- 配件 ----------
  function accFront(ctx, spec, t) {
    for (const a of spec.acc || []) {
      if (a === 'ribbon') bow(ctx, 40, -58, 1.15, spec.ribbon || '#e8344c', 0.35);
      else if (a === 'ribbon2') { bow(ctx, -52, -44, 0.75, spec.ribbon, -0.5); bow(ctx, 52, -44, 0.75, spec.ribbon, 0.5); }
      else if (a === 'hairpin') {
        ctx.save(); ctx.translate(-32, -26); ctx.rotate(-0.6);
        ctx.fillStyle = spec.pin || '#ffd24a'; ctx.strokeStyle = U.shade(spec.pin || '#ffd24a', -0.5); ctx.lineWidth = 1;
        ctx.fillRect(-14, -2.5, 28, 5); ctx.strokeRect(-14, -2.5, 28, 5);
        ctx.rotate(0.5); ctx.fillRect(-14, -2.5, 28, 5); ctx.strokeRect(-14, -2.5, 28, 5);
        ctx.restore();
      } else if (a === 'goggles') {
        ctx.beginPath(); ctx.ellipse(0, -24, 61, 40, 0, Math.PI * 1.08, Math.PI * 1.92); ctx.lineWidth = 7; ctx.strokeStyle = '#2b2b38'; ctx.stroke();
        for (const s of [-1, 1]) {
          ctx.beginPath(); ctx.ellipse(s * 22, -56, 15, 12, s * 0.15, 0, TAU);
          const lg = ctx.createLinearGradient(s * 22 - 12, -68, s * 22 + 12, -44); lg.addColorStop(0, '#9ff9d6'); lg.addColorStop(0.5, '#1fae86'); lg.addColorStop(1, '#0a3f3a');
          ctx.fillStyle = lg; ctx.fill(); ctx.lineWidth = 3.5; ctx.strokeStyle = '#3a3a4a'; ctx.stroke();
          ctx.beginPath(); ctx.ellipse(s * 22 - 5, -60, 4, 2.5, -0.5, 0, TAU); ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fill();
        }
      } else if (a === 'headphones') {
        ctx.beginPath(); ctx.ellipse(0, -6, 66, 70, 0, Math.PI * 1.05, Math.PI * 1.95); ctx.lineWidth = 9; ctx.strokeStyle = '#2a2d3a'; ctx.stroke();
        ctx.lineWidth = 3; ctx.strokeStyle = spec.ribbon || '#ff9a3c'; ctx.stroke();
        for (const s of [-1, 1]) {
          ctx.beginPath(); ctx.moveTo(s * 30, -64); ctx.lineTo(s * 50, -96); ctx.lineTo(s * 58, -56); ctx.closePath(); fillStroke(ctx, '#2a2d3a', '#111', 1.5);
          ctx.beginPath(); ctx.moveTo(s * 37, -66); ctx.lineTo(s * 49, -86); ctx.lineTo(s * 53, -62); ctx.closePath(); ctx.fillStyle = '#ffb3c4'; ctx.fill();
          ctx.beginPath(); ctx.ellipse(s * 62, 4, 13, 22, 0, 0, TAU); fillStroke(ctx, '#2a2d3a', '#111', 1.5);
          ctx.beginPath(); ctx.ellipse(s * 64, 4, 6, 12, 0, 0, TAU); ctx.fillStyle = spec.ribbon || '#ff9a3c'; ctx.fill();
          const on = (Math.floor(t / 20) % 2) ? 1 : 0.4; ctx.beginPath(); ctx.arc(s * 64, 4, 2.5, 0, TAU); ctx.fillStyle = `rgba(160,255,240,${on})`; ctx.fill();
        }
      } else if (a === 'glasses') {
        ctx.lineWidth = 1.8; ctx.strokeStyle = '#4a3a50';
        for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(s * 23, 15, 17, 14, 0, 0, TAU); ctx.stroke(); }
        ctx.beginPath(); ctx.moveTo(-6, 13); ctx.quadraticCurveTo(0, 9, 6, 13); ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.18)'; for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(s * 23 - 6, 9, 5, 3, -0.6, 0, TAU); ctx.fill(); }
      } else if (a === 'tassel') {
        ctx.save(); ctx.translate(-46, -40);
        ctx.beginPath(); ctx.arc(0, 0, 9, 0, TAU); fillStroke(ctx, '#f4c64a', '#8a6410', 1.5);
        ctx.beginPath(); ctx.arc(0, 0, 4, 0, TAU); ctx.fillStyle = '#c4202c'; ctx.fill();
        for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(i * 2, 8); ctx.quadraticCurveTo(i * 4 + Math.sin(t * 0.06 + i) * 3, 40, i * 3 - 4, 70); ctx.strokeStyle = '#c4202c'; ctx.lineWidth = 2.5; ctx.stroke(); }
        ctx.restore();
        bow(ctx, 44, -60, 0.8, '#8c1020', 0.4);
      } else if (a === 'nulltag') {
        ctx.save(); ctx.translate(36, -70 + Math.sin(t * 0.07) * 3); ctx.rotate(0.2);
        ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#333'; ctx.lineWidth = 1.5;
        ctx.fillRect(-24, -10, 48, 20); ctx.strokeRect(-24, -10, 48, 20);
        ctx.font = 'bold 12px monospace'; ctx.fillStyle = '#ff00dc'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('NULL', 0, 1);
        ctx.restore();
      } else if (a === 'crown') { // 髮冠＋簪
        ctx.save(); ctx.translate(0, -70);
        const cg = ctx.createLinearGradient(0, -26, 0, 0); cg.addColorStop(0, '#f4f8ff'); cg.addColorStop(1, '#8a9ab0');
        ctx.beginPath(); ctx.moveTo(-15, 2); ctx.lineTo(-12, -16); ctx.quadraticCurveTo(0, -27, 12, -16); ctx.lineTo(15, 2); ctx.closePath(); fillStroke(ctx, cg, '#4a5a70', 1.4);
        ctx.beginPath(); ctx.moveTo(-20, 0); ctx.lineTo(28, -24); ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.strokeStyle = '#d4dce8'; ctx.stroke();
        ctx.beginPath(); ctx.arc(29, -25, 3.5, 0, TAU); ctx.fillStyle = spec.outfit.accent; ctx.fill();
        ctx.beginPath(); ctx.arc(0, -10, 3.6, 0, TAU); ctx.fillStyle = spec.outfit.accent; ctx.fill();
        ctx.restore();
      } else if (a === 'halo') { // 主角光環（關不掉）
        ctx.save(); ctx.translate(0, -112 + Math.sin(t * 0.05) * 3);
        ctx.shadowColor = '#ffe27a'; ctx.shadowBlur = 14;
        ctx.beginPath(); ctx.ellipse(0, 0, 42, 10, 0, 0, TAU); ctx.lineWidth = 5; ctx.strokeStyle = '#ffe27a'; ctx.stroke();
        ctx.shadowBlur = 0; ctx.lineWidth = 1.5; ctx.strokeStyle = '#fffbe0'; ctx.stroke();
        ctx.restore();
      } else if (a === 'flower') {
        ctx.save(); ctx.translate(-44, -48);
        for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.ellipse(Math.cos(k * TAU / 5) * 7, Math.sin(k * TAU / 5) * 7, 6, 4, k * TAU / 5, 0, TAU); fillStroke(ctx, spec.pin || '#ffd0e0', U.shade(spec.pin || '#ffd0e0', -0.4), 1); }
        ctx.beginPath(); ctx.arc(0, 0, 4, 0, TAU); ctx.fillStyle = '#ffd24a'; ctx.fill(); ctx.restore();
      }
    }
    if (spec.style.ahoge) {
      ctx.beginPath(); ctx.moveTo(-4, -70);
      ctx.bezierCurveTo(-14, -104, 22, -112, 16, -90 + Math.sin(t * 0.08) * 2);
      ctx.bezierCurveTo(12, -100, 2, -98, 6, -70); ctx.closePath();
      fillStroke(ctx, hairGrad(ctx, spec, -110, -70), hairLine(spec), 1.3);
    }
  }

  // ---------- 頭部（共用） ----------
  function drawHead(ctx, spec, opt) {
    const t = opt.t || 0, ex = EXPR[opt.expr] || EXPR.normal;
    const skin = spec.skin;
    // 臉
    const male = !!spec.male;
    facePath(ctx, male);
    const fg = ctx.createRadialGradient(-10, 10, 10, 0, 10, 70);
    fg.addColorStop(0, U.shade(skin, 0.25)); fg.addColorStop(0.7, skin); fg.addColorStop(1, U.shade(skin, -0.12));
    fillStroke(ctx, fg, U.shade(skin, -0.35), 1.2);
    // 腮紅
    const bl = ex.blush || spec.blush || (male ? 0.22 : 0.6);
    for (const s of [-1, 1]) {
      const rg = ctx.createRadialGradient(s * 30, 33, 1, s * 30, 33, 14);
      rg.addColorStop(0, `rgba(255,110,140,${0.28 * bl})`); rg.addColorStop(1, 'rgba(255,110,140,0)');
      ctx.fillStyle = rg; ctx.beginPath(); ctx.ellipse(s * 30, 33, 15, 8, 0, 0, TAU); ctx.fill();
      if (bl >= 2) { ctx.strokeStyle = 'rgba(230,80,110,0.6)'; ctx.lineWidth = 1.2; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(s * 24 + k * 5 - 4, 36); ctx.lineTo(s * 24 + k * 5, 30); ctx.stroke(); } }
    }
    // 眼睛
    let eyeMode = ex.eye;
    const blink = opt.blink !== undefined ? opt.blink : ((t + (spec.seed || 0) * 37) % 220) < 7;
    if (blink && (eyeMode === 'normal' || eyeMode === 'half' || eyeMode === 'wide')) eyeMode = 'closed';
    drawBrows(ctx, spec, ex.brow);
    drawEye(ctx, -1, spec, eyeMode, opt.look); drawEye(ctx, 1, spec, eyeMode, opt.look);
    if (ex.sweat) { ctx.save(); ctx.translate(-44, -6); ctx.beginPath(); ctx.moveTo(0, -10); ctx.quadraticCurveTo(7, 2, 0, 8); ctx.quadraticCurveTo(-7, 2, 0, -10); ctx.fillStyle = 'rgba(170,220,255,0.9)'; ctx.fill(); ctx.strokeStyle = 'rgba(80,140,200,0.8)'; ctx.lineWidth = 1; ctx.stroke(); ctx.restore(); }
    if (ex.tears) { ctx.fillStyle = 'rgba(140,200,255,0.8)'; for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(s * 30, 26 + (t % 30) * 0.4, 2.5, 4, 0, 0, TAU); ctx.fill(); } }
    // 鼻 口
    ctx.beginPath(); ctx.moveTo(1, 29); ctx.lineTo(-0.5, 31.5); ctx.strokeStyle = U.shade(skin, -0.35); ctx.lineWidth = 1.2; ctx.stroke();
    let mouth = ex.mouth;
    if (opt.talking && Math.floor(t / 5) % 2 === 0) mouth = mouth === 'o' ? 'small' : (mouth === 'open' || mouth === 'grin' ? 'small' : 'small');
    if (male) { ctx.save(); ctx.translate(0, 41); ctx.scale(0.82, 0.82); ctx.translate(0, -41); drawMouth(ctx, mouth); ctx.restore(); }
    else drawMouth(ctx, mouth);
    // 瀏海陰影
    ctx.save(); facePath(ctx, male); ctx.clip();
    ctx.translate(0, 6); bangsPath(ctx, spec.style.bangs); ctx.fillStyle = U.rgba(U.shade(skin, -0.35), 0.45); ctx.fill();
    ctx.restore();
    // 側髮
    sideLocks(ctx, spec, t);
    // 瀏海
    bangsPath(ctx, spec.style.bangs);
    fillStroke(ctx, hairGrad(ctx, spec, -74, 40), hairLine(spec), 1.4);
    ctx.save(); bangsPath(ctx, spec.style.bangs); ctx.clip();
    // 天使環
    ctx.beginPath(); ctx.ellipse(0, -34, 44, 17, 0, Math.PI * 1.08, Math.PI * 1.92);
    ctx.strokeStyle = U.rgba(spec.hairHi || '#ffffff', 0.55); ctx.lineWidth = 6; ctx.setLineDash([12, 5]); ctx.stroke(); ctx.setLineDash([]);
    // 髮絲
    ctx.strokeStyle = U.rgba(U.shade(spec.hair, -0.45), 0.3); ctx.lineWidth = 1;
    const tips = (BANGS[spec.style.bangs] || BANGS.straight).tips;
    for (const [x, y] of tips) { ctx.beginPath(); ctx.moveTo(x * 0.5, -60); ctx.quadraticCurveTo(x * 0.9, -20, x, y - 4); ctx.stroke(); }
    if (spec.nullHair) { ctx.globalAlpha = 0.85; checker(ctx, 10, -40, 40, 40, 8); ctx.globalAlpha = 1; }
    ctx.restore();
    accFront(ctx, spec, t);
  }

  // 背上的劍（劍鞘）：沿著局部 x 軸，劍柄朝 +x
  function swordBack(ctx, spec, x, y, rot, k) {
    const acc = spec.outfit.accent;
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(k, k);
    ctx.lineCap = 'butt';
    ctx.fillStyle = '#1a2636'; ctx.fillRect(-140, -6, 254, 12); ctx.strokeStyle = '#0a0e16'; ctx.lineWidth = 1.5; ctx.strokeRect(-140, -6, 254, 12);
    ctx.fillStyle = '#c8d4e0'; for (const sx of [-136, -40, 96]) ctx.fillRect(sx, -6.5, 8, 13);
    ctx.fillStyle = '#e8c860'; ctx.beginPath(); ctx.roundRect(112, -15, 7, 30, 2); ctx.fill(); ctx.strokeStyle = '#7a5a10'; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = '#20283a'; ctx.fillRect(119, -4.5, 46, 9);
    ctx.strokeStyle = '#4a5a74'; ctx.lineWidth = 1.2; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(121 + i * 7.5, -4.5); ctx.lineTo(126 + i * 7.5, 4.5); ctx.stroke(); }
    ctx.beginPath(); ctx.arc(169, 0, 6, 0, TAU); ctx.fillStyle = '#e8c860'; ctx.fill(); ctx.strokeStyle = '#7a5a10'; ctx.stroke();
    ctx.strokeStyle = acc; ctx.lineWidth = 2.2;
    for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(172, 0); ctx.quadraticCurveTo(190, 10 + i * 4, 186 + i * 3, 34); ctx.stroke(); }
    ctx.restore();
  }
  Art.swordBack = swordBack;

  // ---------- 立繪 ----------
  // opt: {t, expr, talking, look, alpha, dim}
  Art.portrait = function (ctx, spec, x, y, scale, opt = {}) {
    ctx.save();
    ctx.translate(x, y);
    if (opt.flip) ctx.scale(-1, 1);
    const br = Math.sin((opt.t || 0) * 0.04) * 1.2;
    ctx.scale(scale, scale);
    ctx.translate(0, br);
    backHair(ctx, spec, opt.t || 0, 1);
    if ((spec.acc || []).includes('sword')) swordBack(ctx, spec, 0, 140, -2.35, 1);
    outfit(ctx, spec);
    ctx.translate(0, -br * 0.5);
    ctx.rotate(Math.sin((opt.t || 0) * 0.02) * 0.015 + (opt.tilt || 0));
    drawHead(ctx, spec, opt);
    ctx.restore();
  };

  // ---------- Q 版（遊戲中） ----------
  function chibiBody(ctx, spec, t, lean, wings) {
    const o = spec.outfit, main = o.main, sub = o.sub, line = U.shade(main, -0.55);
    const skin = spec.skin;
    if (wings) {
      const f = Math.sin(t * 0.4) * 0.3;
      for (const s of [-1, 1]) {
        ctx.save(); ctx.translate(s * 14, 70); ctx.rotate(s * (0.5 + f));
        ctx.beginPath(); ctx.ellipse(s * 34, -16, 38, 18, s * -0.4, 0, TAU);
        ctx.fillStyle = U.rgba(wings, 0.45); ctx.fill(); ctx.strokeStyle = U.rgba('#ffffff', 0.8); ctx.lineWidth = 2; ctx.stroke();
        ctx.beginPath(); ctx.ellipse(s * 26, 14, 24, 11, s * 0.4, 0, TAU); ctx.fillStyle = U.rgba(wings, 0.35); ctx.fill(); ctx.stroke();
        ctx.restore();
      }
    }
    if (o.type === 'hanfu') return chibiHanfu(ctx, spec, t, lean);
    // 腿
    const kick = Math.sin(t * 0.15) * 3;
    for (const s of [-1, 1]) {
      ctx.beginPath(); ctx.roundRect(s * 10 - 6, 124, 12, 44 + (s > 0 ? kick : -kick), 5);
      ctx.fillStyle = spec.sock || '#fafafa'; ctx.fill(); ctx.strokeStyle = '#7a7a8a'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(s * 10, 168 + (s > 0 ? kick : -kick), 9, 6, 0, 0, TAU); ctx.fillStyle = spec.shoe || '#3a2a30'; ctx.fill();
    }
    // 裙
    ctx.beginPath(); ctx.moveTo(-22, 96); ctx.lineTo(22, 96); ctx.lineTo(44 + lean * 4, 140); ctx.quadraticCurveTo(0, 150, -44 + lean * 4, 140); ctx.closePath();
    const sk = ctx.createLinearGradient(0, 96, 0, 146); sk.addColorStop(0, o.skirt || main); sk.addColorStop(1, U.shade(o.skirt || main, -0.25));
    fillStroke(ctx, sk, line, 1.8);
    ctx.strokeStyle = U.rgba(line, 0.5); ctx.lineWidth = 1.2;
    for (const x of [-20, 0, 20]) { ctx.beginPath(); ctx.moveTo(x * 0.5, 100); ctx.lineTo(x * 1.1 + lean * 3, 142); ctx.stroke(); }
    if (o.type === 'maid' || o.type === 'sailor') { ctx.beginPath(); ctx.moveTo(-42 + lean * 4, 138); ctx.quadraticCurveTo(0, 148, 42 + lean * 4, 138); ctx.strokeStyle = o.type === 'maid' ? '#fff' : sub; ctx.lineWidth = 3; ctx.stroke(); }
    // 軀幹
    ctx.beginPath(); ctx.moveTo(-14, 52); ctx.quadraticCurveTo(-26, 56, -26, 66); ctx.lineTo(-20, 100); ctx.lineTo(20, 100); ctx.lineTo(26, 66); ctx.quadraticCurveTo(26, 56, 14, 52); ctx.closePath();
    fillStroke(ctx, o.type === 'dress' ? main : main, line, 1.8);
    if (o.type === 'sailor') { ctx.beginPath(); ctx.moveTo(-14, 54); ctx.lineTo(-28, 64); ctx.lineTo(0, 82); ctx.lineTo(28, 64); ctx.lineTo(14, 54); ctx.lineTo(0, 70); ctx.closePath(); fillStroke(ctx, sub, U.shade(sub, -0.4), 1.2); bow(ctx, 0, 78, 0.5, o.accent); }
    else if (o.type === 'maid') { ctx.fillStyle = '#fff'; ctx.fillRect(-12, 70, 24, 30); bow(ctx, 0, 60, 0.45, o.accent); }
    else if (o.type === 'gothic') { ctx.beginPath(); ctx.ellipse(0, 56, 16, 7, 0, 0, Math.PI); ctx.fillStyle = '#f4f0f8'; ctx.fill(); bow(ctx, 0, 64, 0.45, o.accent); }
    else if (o.type === 'kimono') { ctx.beginPath(); ctx.moveTo(-10, 52); ctx.lineTo(8, 96); ctx.strokeStyle = '#fff'; ctx.lineWidth = 4; ctx.stroke(); ctx.fillStyle = o.accent; ctx.fillRect(-21, 86, 42, 12); }
    else if (o.type === 'hoodie') { ctx.beginPath(); ctx.moveTo(0, 56); ctx.lineTo(0, 100); ctx.strokeStyle = '#ddd'; ctx.lineWidth = 2; ctx.stroke(); }
    else if (o.type === 'dress') { ctx.fillStyle = skin; ctx.fillRect(-14, 52, 28, 10); ctx.strokeStyle = o.accent; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(-24, 63); ctx.lineTo(24, 63); ctx.stroke(); }
    else if (o.type === 'shift') { checker(ctx, -16, 74, 16, 16, 8); }
    // 手臂
    const sw = Math.sin(t * 0.12) * 4;
    for (const s of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(s * 22, 58); ctx.quadraticCurveTo(s * 40, 74 + (s * lean * 4), s * 38, 96 + sw * s);
      ctx.lineWidth = 13; ctx.lineCap = 'round'; ctx.strokeStyle = line; ctx.stroke(); ctx.lineWidth = 10; ctx.strokeStyle = o.sleeve || main; ctx.stroke();
      ctx.beginPath(); ctx.arc(s * 38, 100 + sw * s, 6, 0, TAU); fillStroke(ctx, skin, U.shade(skin, -0.35), 1.2);
    }
  }
  function chibiHanfu(ctx, spec, t, lean) {
    const o = spec.outfit, main = o.main, sub = o.sub, acc = o.accent, line = U.shade(sub, -0.4), skin = spec.skin;
    const kick = Math.sin(t * 0.15) * 3;
    // 褲＋靴
    for (const s of [-1, 1]) {
      ctx.beginPath(); ctx.roundRect(s * 10 - 7, 130, 14, 34 + (s > 0 ? kick : -kick), 5); ctx.fillStyle = spec.sock; ctx.fill();
      ctx.beginPath(); ctx.roundRect(s * 10 - 8, 156 + (s > 0 ? kick : -kick), 16, 14, 4); ctx.fillStyle = spec.shoe; ctx.fill();
    }
    // 長袍下襬（前開衩）
    ctx.beginPath(); ctx.moveTo(-24, 94); ctx.lineTo(24, 94); ctx.lineTo(34 + lean * 5, 156); ctx.lineTo(4 + lean * 5, 152); ctx.lineTo(0, 120); ctx.lineTo(-4 + lean * 5, 152); ctx.lineTo(-34 + lean * 5, 156); ctx.closePath();
    const rg = ctx.createLinearGradient(0, 94, 0, 156); rg.addColorStop(0, main); rg.addColorStop(1, U.shade(main, -0.15));
    fillStroke(ctx, rg, line, 1.6);
    ctx.beginPath(); ctx.moveTo(-33 + lean * 5, 153); ctx.lineTo(-4 + lean * 5, 150); ctx.moveTo(4 + lean * 5, 150); ctx.lineTo(33 + lean * 5, 153); ctx.strokeStyle = sub; ctx.lineWidth = 3; ctx.stroke();
    // 軀幹（寬肩）
    ctx.beginPath(); ctx.moveTo(-15, 52); ctx.quadraticCurveTo(-31, 54, -30, 66); ctx.lineTo(-23, 100); ctx.lineTo(23, 100); ctx.lineTo(30, 66); ctx.quadraticCurveTo(31, 54, 15, 52); ctx.closePath();
    fillStroke(ctx, main, line, 1.6);
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-12, 53); ctx.lineTo(10, 88); ctx.lineWidth = 5; ctx.strokeStyle = sub; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(12, 53); ctx.lineTo(2, 70); ctx.lineWidth = 4; ctx.stroke();
    // 腰帶＋玉珮
    ctx.fillStyle = o.sash || '#182030'; ctx.fillRect(-24, 86, 48, 10); ctx.fillStyle = acc; ctx.fillRect(-24, 90, 48, 2);
    ctx.beginPath(); ctx.moveTo(-12, 96); ctx.lineTo(-12, 106 + Math.sin(t * 0.1) * 1.5); ctx.strokeStyle = acc; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.beginPath(); ctx.arc(-12, 110 + Math.sin(t * 0.1) * 1.5, 4.5, 0, TAU); ctx.fillStyle = U.mix(acc, '#ffffff', 0.3); ctx.fill();
    // 寬袖
    const sw = Math.sin(t * 0.12) * 4;
    for (const s of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(s * 24, 56); ctx.quadraticCurveTo(s * 44, 70 + s * lean * 4, s * 42, 92 + sw * s);
      ctx.lineWidth = 17; ctx.lineCap = 'round'; ctx.strokeStyle = line; ctx.stroke(); ctx.lineWidth = 14; ctx.strokeStyle = main; ctx.stroke();
      ctx.beginPath(); ctx.ellipse(s * 42, 100 + sw * s, 11, 7, s * 0.3, 0, TAU); fillStroke(ctx, main, line, 1.4);
      ctx.beginPath(); ctx.ellipse(s * 42, 101 + sw * s, 9, 4, s * 0.3, 0, TAU); ctx.strokeStyle = sub; ctx.lineWidth = 2; ctx.stroke();
      ctx.beginPath(); ctx.arc(s * 42, 106 + sw * s, 5, 0, TAU); fillStroke(ctx, skin, U.shade(skin, -0.35), 1.1);
    }
  }
  Art.chibi = function (ctx, spec, x, y, scale, opt = {}) {
    const t = opt.t || 0, lean = opt.lean || 0;
    ctx.save();
    ctx.translate(x, y); ctx.scale(scale, scale);
    ctx.rotate(lean * 0.12);
    ctx.save(); ctx.translate(-lean * 4, 0);
    backHair(ctx, spec, t + lean * 20, 0.55);
    ctx.restore();
    if ((spec.acc || []).includes('sword')) swordBack(ctx, spec, -4, 80, -2.2, 0.42);
    chibiBody(ctx, spec, t, lean, opt.wings);
    ctx.save(); ctx.rotate(-lean * 0.05);
    drawHead(ctx, spec, { t, expr: opt.expr || 'normal', blink: opt.blink, look: { x: lean * 2, y: 1 } });
    ctx.restore();
    ctx.restore();
  };

  // 預渲染 Q 版動畫幀
  Art.cacheChibi = function (spec, scale, opts = {}) {
    const S = 2, W = Math.ceil(260 * scale * S), H = Math.ceil(366 * scale * S), TOP = 136; // TOP：頭頂的留白（光環）
    const frames = {};
    for (const lean of [-1, 0, 1]) for (let ph = 0; ph < 6; ph++) for (const bl of [0, 1]) {
      const c = document.createElement('canvas'); c.width = W; c.height = H;
      const x = c.getContext('2d'); x.scale(S, S);
      Art.chibi(x, spec, W / S / 2, TOP * scale, scale, { t: ph * 21, lean, blink: !!bl, wings: opts.wings, expr: opts.expr });
      frames[lean + ',' + ph + ',' + bl] = c;
    }
    return { frames, W: W / S, H: H / S, oy: TOP * scale, scale };
  };
  Art.drawCached = function (ctx, cache, x, y, t, lean, extraScale = 1) {
    const ph = Math.floor(t / 7) % 6, bl = (t % 200) < 7 ? 1 : 0;
    const L = lean < -0.3 ? -1 : lean > 0.3 ? 1 : 0;
    const c = cache.frames[L + ',' + ph + ',' + bl];
    ctx.drawImage(c, x - cache.W / 2 * extraScale, y - cache.oy * extraScale, cache.W * extraScale, cache.H * extraScale);
  };

  // ---------- 妖精 ----------
  const FAIRY_COLORS = { red: '#ff6a7a', blue: '#6aa8ff', green: '#6ae08a', yellow: '#ffd76a', purple: '#c08aff', pink: '#ff9ad6', white: '#e8eef8', black: '#5a5a70' };
  Art.fairySpec = function (col) {
    const c = FAIRY_COLORS[col] || col;
    return {
      hair: U.mix(c, '#fff4d0', 0.3), hairHi: '#ffffff', eye: U.shade(c, -0.3), skin: '#ffeae0', seed: Math.random() * 10,
      style: { back: 'bob', bangs: 'straight', lock: 60 },
      outfit: { type: 'sailor', main: U.mix(c, '#ffffff', 0.55), sub: U.shade(c, -0.2), accent: c, skirt: U.shade(c, -0.1) },
      acc: ['ribbon'], ribbon: U.shade(c, -0.15),
    };
  };
  Art.fairyCache = {};
  Art.getFairy = function (col, big) {
    const k = col + (big ? 'B' : '');
    if (!Art.fairyCache[k]) {
      const sp = Art.fairySpec(col);
      if (big) { sp.style.back = 'long'; sp.style.lock = 90; sp.acc = ['ribbon2']; }
      Art.fairyCache[k] = Art.cacheChibi(sp, big ? 0.24 : 0.17, { wings: FAIRY_COLORS[col] || col });
    }
    return Art.fairyCache[k];
  };
})();
