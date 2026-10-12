'use strict';
// ============================================================
//  Bosses — 所有頭目的彈幕與符卡
//  gen(b, g, lv)：b=頭目, g=遊戲, lv=關卡強度(1..7)
// ============================================================
(function () {
  const U = FW.U, Spr = FW.Sprites, Input = FW.Input;
  const W = FW.PF.w, H = FW.PF.h, F = () => FW.FONT;

  // ---- 覆蓋物（符卡用的畫面元素） ----
  function overlay(g, o) {
    o.t = 0; o.alive = true;
    o.kill = () => { o.alive = false; const i = g.overlayTexts.indexOf(o); if (i >= 0) g.overlayTexts.splice(i, 1); };
    o.draw = (ctx) => o.render(ctx, o);
    o.update = () => { o.t++; if (o.tick) o.tick(o); };
    g.overlayTexts.push(o);
    return o;
  }
  const killOverlays = (b) => () => { (b._ov || []).forEach(o => o.kill()); b._ov = []; };
  function ov(b, g, o) { (b._ov = b._ov || []).push(overlay(g, o)); return o; }
  function bigText(ctx, s, x, y, size, col, a = 1) {
    ctx.save(); ctx.globalAlpha = a; ctx.textAlign = 'center'; ctx.font = `bold ${size}px ${F()}`;
    ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.strokeText(s, x, y); ctx.fillStyle = col; ctx.fillText(s, x, y); ctx.restore();
  }

  // 點陣字（用子彈排出文字）
  const GLYPH5 = {
    T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'], H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
    E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'], N: ['10001', '11001', '10101', '10101', '10011', '10001', '10001'],
    D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'], F: ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
    I: ['11111', '00100', '00100', '00100', '00100', '00100', '11111'], ' ': ['00000', '00000', '00000', '00000', '00000', '00000', '00000'],
  };
  function textPoints(str, cx, cy, cell) {
    const pts = [], w = str.length * 6 * cell;
    [...str].forEach((c, i) => { const gl = GLYPH5[c] || GLYPH5[' ']; gl.forEach((row, ry) => [...row].forEach((v, rx) => { if (v === '1') pts.push([cx - w / 2 + (i * 6 + rx) * cell, cy + (ry - 3) * cell]); })); });
    return pts;
  }

  const P = {};   // 所有招式
  // ======================= 玲音 =======================
  P.rinne_non = { hp: 900, time: 30, *gen(b, g, lv) {
    let k = 0;
    while (true) {
      g.ring(b.x, b.y, g.n(14 + lv * 2), 2.3, 'orb', 'blue', k * 0.13);
      if (k % 2) g.fan(b.x, b.y, g.aim(b.x, b.y), 3, 0.3, 3.4, 'rice', 'red');
      g.sfx('eshot'); k++;
      yield 36 - lv * 2;
      if (k % 5 === 0) yield* b.wander(50);
    }
  } };
  P.rinne_non2 = { hp: 1000, time: 30, *gen(b, g, lv) {
    let k = 0;
    while (true) {
      for (let s = -1; s <= 1; s += 2) for (let i = 0; i < g.n(5); i++) g.shot(b.x, b.y, k * 0.21 * s + i * TAU / g.n(5), 2.8, 'star', s > 0 ? 'cyan' : 'white', { acc: -0.03, minSpeed: 1.6 });
      k++; if (k % 3 === 0) g.sfx('eshot');
      yield 6;
      if (k % 60 === 0) { g.fan(b.x, b.y, g.aim(b.x, b.y), g.n(7), 0.8, 3.5, 'kunai', 'red'); yield* b.wander(40); }
    }
  } };
  P.rinne_s1 = { spell: true, id: 'save', name: '存檔「重來一次的權利」', hp: 1300, time: 40, *gen(b, g, lv) {
    let k = 0;
    while (true) {
      const n = g.n(16 + lv * 2), dir = k % 2 ? 1 : -1;
      g.text(b.x, b.y - 44, 'SAVE', '#9ad0ff', 16, 40);
      for (let i = 0; i < n; i++) g.shot(b.x, b.y, i * TAU / n + k * 0.2, 3, 'star', 'cyan', { task: function* (bb) {
        yield 40; const s = bb.speed;
        for (let j = 1; j <= 20; j++) { bb.speed = s * (1 - j / 10); yield 1; }
        bb.sp = Spr.bullet('star', 'yellow');
        yield 22; bb.speed = 0; yield 10;
        bb.angle += 0.7 * dir; bb.acc = 0.04; bb.maxSpeed = 2.4; bb.sp = Spr.bullet('star', 'blue');
      } });
      g.sfx('eshot');
      yield 40; g.text(b.x, b.y - 44, 'LOAD...', '#ffe080', 16, 40);
      yield 40 - lv * 2; k++;
      if (k % 3 === 0) { g.fan(b.x, b.y, g.aim(b.x, b.y), g.n(5), 0.5, 3.2, 'orb', 'red'); yield* b.wander(40); }
    }
  } };
  P.rinne_s2 = { spell: true, id: 'pause', name: '暫停「不會停下的世界」', hp: 1400, time: 45, *gen(b, g, lv) {
    let paused = false;
    ov(b, g, { render(ctx) { if (!paused) return; ctx.fillStyle = 'rgba(80,80,100,0.25)'; ctx.fillRect(0, 0, W, H); bigText(ctx, 'PAUSE', W / 2, 300, 54, '#ffffff', 0.7 + 0.3 * Math.sin(g.t * 0.2)); bigText(ctx, '……你可以動，我們也可以。', W / 2, 340, 16, '#dde', 0.8); } });
    while (true) {
      const mine = [];
      for (let f = 0; f < 70; f++) {
        if (f % 3 === 0) for (let i = 0; i < g.n(3); i++) mine.push(g.shot(b.x, b.y, U.rnd(TAU), U.rnd(1.5, 3.5), 'orb', U.pick(['blue', 'cyan', 'white']), { acc: -0.02, minSpeed: 0.6 }));
        if (f % 20 === 0) g.sfx('eshot');
        yield 1;
      }
      paused = true; g.sfx('pause');
      for (const m of mine) { m.saved = m.speed; m.speed = 0; m.acc = 0; m.sp = Spr.bullet('orb', 'gray'); }
      yield 60;
      paused = false; g.sfx('pause');
      let i = 0;
      for (const m of mine) { if (m.dead) continue; i++; m.sp = Spr.bullet('orb', i % 3 === 0 ? 'red' : 'blue'); m.angle = i % 3 === 0 ? g.aim(m.x, m.y) : m.angle + U.rnd(-1, 1); m.speed = 0.5; m.acc = 0.03; m.maxSpeed = i % 3 === 0 ? 2.4 : 2; m.minSpeed = undefined; }
      yield 50;
      yield* b.wander(40);
    }
  }, onEnd: (b, g) => killOverlays(b)() };
  P.rinne_s3 = { spell: true, id: 'title', name: '標題畫面「請按任意鍵」', hp: 1500, time: 45, *gen(b, g, lv) {
    const text = 'PRESS ANY KEY', y = 260, letters = [...text].map((c, i) => ({ c, x: W / 2 + (i - (text.length - 1) / 2) * 34, y }));
    let pressed = 0, msg = 0;
    ov(b, g, { tick() { if (msg > 0) msg--; }, render(ctx) { const a = 0.55 + 0.45 * Math.sin(g.t * 0.1); for (const L of letters) bigText(ctx, L.c, L.x, L.y + Math.sin(g.t * 0.05 + L.x) * 4, 30, '#fff', a); if (msg > 0) { bigText(ctx, '……你按了。', W / 2, y + 40, 16, '#ffd0e0', Math.min(1, msg / 20)); } } });
    let k = 0, cd = 0;
    while (true) {
      if (k % Math.max(8, 16 - lv) === 0) { const L = U.pick(letters); if (L.c !== ' ') g.shot(L.x, L.y, Math.PI / 2 + U.rnd(-0.3, 0.3), 1.8, 'small', 'white', { acc: 0.01, maxSpeed: 2.6 }); }
      if (k % 90 === 0) g.fan(b.x, b.y, g.aim(b.x, b.y), g.n(5), 0.6, 3, 'rice', 'cyan');
      if (cd > 0) cd--;
      if (Input.anyKeyFrame && cd === 0) {
        cd = 22; pressed++; msg = 50;
        const L = U.pick(letters.filter(l => l.c !== ' '));
        g.ring(L.x, L.y, g.n(10), 1.6, 'orb', U.pick(['pink', 'cyan', 'yellow']), U.rnd(TAU), { acc: 0.015, maxSpeed: 2.6 });
        g.sfx('click');
      }
      k++; yield 1;
    }
  }, onEnd: (b, g) => killOverlays(b)() };

  // ======================= 千代 =======================
  const GL = '啊哦嗯欸？！…喔呀';
  P.chiyo_non = { hp: 900, time: 30, *gen(b, g, lv) {
    let k = 0;
    while (true) {
      const c = g.aim(b.x, b.y) + Math.sin(k * 0.7) * 0.5;
      g.fan(b.x, b.y, c, g.n(6 + lv), 1.5, 2.6, 'glyph', k % 2 ? 'orange' : 'red', { glyph: GL[k % GL.length] });
      g.sfx('eshot'); k++;
      yield 28 - lv;
      if (k % 4 === 0) yield* b.wander(50);
    }
  } };
  P.chiyo_non2 = { hp: 1000, time: 30, *gen(b, g, lv) {
    let k = 0;
    while (true) {
      for (let i = 0; i < g.n(4); i++) g.shot(b.x, b.y, k * 0.31 + i * TAU / g.n(4), 2.4, 'glyph', 'yellow', { glyph: '…' });
      if (k % 12 === 0) g.ring(b.x, b.y, g.n(16), 1.8, 'orb', 'red', 0, { acc: 0.01, maxSpeed: 3 });
      k++; yield 5;
    }
  } };
  const LINES = ['我還有話要說', '按Z是沒用的', '請聽我說完', '這句台詞很重要', '其實我……', '對話還沒結束', '你有在看嗎'];
  P.chiyo_s1 = { spell: true, id: 'unskip', name: '對話框「無法跳過的台詞」', hp: 1300, time: 40, bg: 'text', *gen(b, g, lv) {
    const box = () => {
      const text = U.pick(LINES), w = text.length * 26 + 40, x = U.rnd(20, W - w - 20), y = U.rnd(60, 300);
      let typed = 0, tick = 0, life = 0;
      const o = ov(b, g, { tick() {
        life++; tick++;
        if (tick >= 7 && typed < text.length) { tick = 0; typed++; const cx = x + 20 + (typed - 0.5) * 26, cy = y + 34; g.shot(cx, cy, g.aim(cx, cy) + U.rnd(-0.15, 0.15), 0.8, 'glyph', 'orange', { glyph: text[typed - 1], acc: 0.03, maxSpeed: 2.6 }); g.sfx('type'); }
        if (typed >= text.length && life > text.length * 7 + 40) { g.ring(x + w / 2, y + 28, g.n(10), 1.6, 'orb', 'yellow', U.rnd(TAU)); o.kill(); }
      }, render(ctx) {
        ctx.save(); ctx.globalAlpha = Math.min(1, life / 10);
        ctx.fillStyle = 'rgba(20,14,30,0.85)'; ctx.strokeStyle = '#f2a03c'; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(x, y, w, 52, 8); ctx.fill(); ctx.stroke();
        ctx.font = `bold 22px ${F()}`; ctx.fillStyle = '#fff'; ctx.textAlign = 'left'; ctx.fillText(text.slice(0, typed), x + 20 - 2, y + 35);
        ctx.font = `10px ${F()}`; ctx.fillStyle = '#f2a03c'; ctx.fillText('千代', x + 6, y - 3);
        ctx.restore();
      } });
    };
    let k = 0;
    while (true) {
      box(); k++;
      if (lv >= 3 && k % 2 === 0) box();
      for (let i = 0; i < 4; i++) { yield 25; if (Input.hit('confirm')) g.text(g.player.x, g.player.y - 30, '跳不過喔', '#f2a03c', 13); }
      if (k % 2 === 0) { g.fan(b.x, b.y, g.aim(b.x, b.y), g.n(5), 0.7, 3, 'glyph', 'red', { glyph: '！' }); yield* b.wander(40); }
    }
  }, onEnd: (b, g) => killOverlays(b)() };
  P.chiyo_s2 = { spell: true, id: 'yesyes', name: '選項「是／是」', hp: 1400, time: 40, *gen(b, g, lv) {
    const boxes = [{ x: 140, y: 230 }, { x: W - 140, y: 230 }];
    let sel = 0;
    ov(b, g, { render(ctx) {
      boxes.forEach((bx, i) => {
        ctx.save(); ctx.fillStyle = i === sel ? 'rgba(242,160,60,0.4)' : 'rgba(20,14,30,0.75)'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.roundRect(bx.x - 50, bx.y - 22, 100, 44, 8); ctx.fill(); ctx.stroke();
        ctx.font = `bold 24px ${F()}`; ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.fillText('是', bx.x, bx.y + 8);
        if (i === sel) { ctx.fillText('▶', bx.x - 70 + Math.sin(g.t * 0.2) * 4, bx.y + 8); }
        ctx.restore();
      });
      bigText(ctx, '（沒有「否」這個選項）', W / 2, 290, 13, '#ffd8a8', 0.6);
    } });
    let k = 0;
    while (true) {
      const bx = boxes[sel];
      for (let f = 0; f < 120; f++) {
        if (f % Math.max(4, 8 - lv) === 0) g.shot(bx.x, bx.y, g.aim(bx.x, bx.y) + Math.sin(f * 0.15) * 0.6, 2.8, 'rice', 'orange');
        if (f % 40 === 0) g.ring(bx.x, bx.y, g.n(14), 1.7, 'glyph', 'yellow', f * 0.1, { glyph: '是' });
        if (f % 60 === 30) g.ring(b.x, b.y, g.n(10), 2.2, 'orb', 'red', U.rnd(TAU));
        yield 1;
      }
      sel = 1 - sel; g.sfx('cursor'); k++;
    }
  }, onEnd: (b, g) => killOverlays(b)() };
  P.chiyo_s3 = { spell: true, id: 'typewriter', name: '打字機「字數超過上限」', hp: 1500, time: 45, *gen(b, g, lv) {
    let k = 0, gap = W / 2;
    const gapW = g.diff === 'easy' ? 130 : g.diff === 'hard' ? 80 : 100;
    while (true) {
      gap = U.clamp(gap + U.rnd(-140, 140), 80, W - 80);
      const row = 'aaaaaaaaaaaaaaaaaaaaa';
      let col = 0;
      for (let x = 14; x < W; x += 28) {
        if (Math.abs(x - gap) > gapW / 2) g.shot(x, 30, Math.PI / 2, 1.5, 'glyph', k % 2 ? 'orange' : 'yellow', { glyph: LINES[k % LINES.length][col % LINES[k % LINES.length].length] });
        col++;
        if (col % 2 === 0) { g.sfx('type'); yield 1; }
      }
      g.sfx('select'); g.text(W - 40, 40, '叮！', '#ffe080', 14, 30);
      if (k % 2 === 0) g.fan(b.x, b.y, g.aim(b.x, b.y), g.n(3), 0.3, 3, 'orb', 'red');
      k++; yield Math.max(36, 62 - lv * 3);
    }
  } };

  // ======================= 茜 =======================
  P.akane_non = { hp: 950, time: 30, *gen(b, g, lv) {
    let k = 0;
    while (true) {
      const base = g.aim(b.x, b.y), n = Math.min(5, 2 + Math.floor(lv / 2));
      for (let i = 0; i < n; i++) g.laser(b.x, b.y, base + (i - (n - 1) / 2) * 0.32, 800, 18, 45, 30, 'green');
      g.sfx('charge'); yield 45; g.sfx('laser');
      for (let i = 0; i < 3; i++) { g.ring(b.x, b.y, g.n(12), 2.6 + i * 0.4, 'shard', 'cyan', U.rnd(TAU)); yield 8; }
      yield 50; k++;
      yield* b.wander(40);
    }
  } };
  P.akane_non2 = { hp: 1050, time: 30, *gen(b, g, lv) {
    let k = 0;
    while (true) {
      g.shot(b.x, b.y, k * 0.37, 3, 'shard', 'red'); g.shot(b.x, b.y, -k * 0.37 + Math.PI, 3, 'shard', 'cyan');
      if (lv >= 4) g.shot(b.x, b.y, k * 0.37 + Math.PI / 2, 2.4, 'shard', 'white');
      if (k % 50 === 0) g.fan(b.x, b.y, g.aim(b.x, b.y), g.n(5), 0.5, 4, 'kunai', 'green');
      k++; yield 3;
    }
  } };
  P.akane_s1 = { spell: true, id: 'bsod', name: '藍屏「:( 你的彈幕遇到問題」', hp: 1400, time: 40, bg: 'grid', *gen(b, g, lv) {
    let pct = 0;
    ov(b, g, { under: true, render(ctx) { ctx.fillStyle = 'rgba(0,90,200,0.35)'; ctx.fillRect(0, 0, W, H); bigText(ctx, ':(', 90, 120, 80, '#ffffff', 0.35); ctx.save(); ctx.globalAlpha = 0.5; ctx.textAlign = 'left'; ctx.font = `16px ${F()}`; ctx.fillStyle = '#fff'; ctx.fillText(`你的彈幕遇到問題，需要重新啟動。`, 40, 180); ctx.fillText(`我們只是在收集某些錯誤資訊…… ${Math.floor(pct)}% 完成`, 40, 204); ctx.restore(); } });
    let k = 0, phase = 0;
    const gapW = g.diff === 'easy' ? 150 : g.diff === 'hard' ? 104 : 124;
    while (true) {
      const gx = W / 2 + Math.sin(k * 0.012) * 190 + Math.sin(k * 0.031) * 40;
      if (k % 10 === 0) for (let x = 12; x < W; x += 30) if (Math.abs(x - gx) > gapW / 2) g.shot(x, -6, Math.PI / 2, 2.4, 'square', 'blue');
      if (k % 70 === 0) g.fan(b.x, b.y, g.aim(b.x, b.y), g.n(3), 0.25, 2.8, 'orb', 'white');
      pct += 0.12 + lv * 0.01;
      if (pct >= 100) { pct = 0; g.doFlash(0.4, '#3a7cff'); g.sfx('error'); g.clearBullets(true, bb => bb.color === 'blue' && bb.y > g.player.y + 30); }
      k++; yield 1;
    }
  }, onEnd: (b, g) => killOverlays(b)() };
  P.akane_s2 = { spell: true, id: 'overflow', name: '記憶體溢位「Stack Overflow」', hp: 1500, time: 45, *gen(b, g, lv) {
    let k = 0;
    while (true) {
      const n = g.n(6 + Math.floor(lv / 2));
      for (let i = 0; i < n; i++) g.shot(b.x, b.y, i * TAU / n + k * 0.3, 2.2, 'big', 'red', { acc: -0.03, minSpeed: 0, task: function* (bb) {
        yield 60; bb.dead = true; g.sfx('eshot');
        const m = g.n(5);
        for (let j = 0; j < m; j++) g.shot(bb.x, bb.y, j * TAU / m + bb.angle, 1.8, 'orb', 'cyan', { acc: -0.025, minSpeed: 0, task: function* (b2) {
          yield 50; b2.dead = true;
          for (let q = 0; q < 3; q++) g.shot(b2.x, b2.y, b2.angle + (q - 1) * 0.5, 1.2, 'small', 'white', { acc: 0.02, maxSpeed: 2.6 });
        } });
      } });
      g.text(b.x, b.y - 40, 'push()', '#aaffcc', 13, 40);
      k++; yield Math.max(90, 140 - lv * 6);
      yield* b.wander(40);
    }
  } };
  P.akane_s3 = { spell: true, id: 'hang', name: '當機「本程式沒有回應」', hp: 1500, time: 45, *gen(b, g, lv) {
    let lag = 0;
    ov(b, g, { render(ctx) { ctx.save(); ctx.font = `bold 13px monospace`; ctx.textAlign = 'left'; ctx.fillStyle = lag > 0 ? '#ff4060' : '#7aff9a'; ctx.fillText('FPS: ' + (lag > 0 ? 3 : 60), 8, H - 20); if (lag > 0) { ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(0, 0, W, H); bigText(ctx, '（沒有回應）', W / 2, 330, 26, '#fff', 0.85); } ctx.restore(); } });
    let k = 0;
    while (true) {
      for (let f = 0; f < (g.diff === 'hard' ? 60 : 40); f++) {
        for (let s = 0; s < 2; s++) g.shot(b.x, b.y, k * (g.diff === 'hard' ? 0.15 : 0.22) + s * Math.PI, 2.6, 'shard', s ? 'red' : 'cyan');
        if (f % 20 === 0) g.fan(b.x, b.y, g.aim(b.x, b.y), g.n(5), 0.6, 3, 'orb', 'green');
        k++; yield g.diff === 'hard' ? 2 : 3;
      }
      lag = 22; g.freezeWorld = 22; g.sfx('error'); FW.Outside.say('akane', '（沒有回應）……騙你的啦，遊戲還活著！', { expr: 'smug', key: 'hang', cool: 60000 }); FW.Audio.stutter(0.36); FW.Title.set('第四面牆 FourthWall (沒有回應)', 900);
      yield 1;
      while (lag > 0) { lag--; yield 1; }
      yield* b.wander(30);
    }
  }, onEnd: (b, g) => { killOverlays(b)(); FW.Title.reset(); } };

  // ======================= 汐 =======================
  P.shio_non = { hp: 950, time: 30, *gen(b, g, lv) {
    let k = 0;
    while (true) {
      for (let i = 0; i < 3; i++) { g.fan(b.x, b.y, g.aim(b.x, b.y), g.n(5 + lv / 2 | 0), 0.9, 3 + i * 0.4, 'cursor', 'blue'); g.sfx('click'); yield 8; }
      g.ring(b.x, b.y, g.n(18), 1.8, 'orb', 'cyan', U.rnd(TAU));
      yield 40; k++;
      yield* b.wander(40);
    }
  } };
  P.shio_non2 = { hp: 1050, time: 30, *gen(b, g, lv) {
    let k = 0;
    while (true) {
      const a = k * 0.12;
      for (let i = 0; i < 3; i++) g.shot(b.x, b.y, a + i * TAU / 3, 2.6, 'cursor', 'purple', { w: 0.006 });
      for (let i = 0; i < 3; i++) g.shot(b.x, b.y, -a + i * TAU / 3, 2.6, 'cursor', 'blue', { w: -0.006 });
      k++; yield 4;
      if (k % 80 === 0) { g.ring(b.x, b.y, g.n(24), 2, 'small', 'white'); }
    }
  } };
  P.shio_s1 = { spell: true, id: 'marquee', name: '拖曳選取「框選刪除」', hp: 1400, time: 40, *gen(b, g, lv) {
    while (true) {
      const p = g.player, w = 170, h = 150, cx = U.clamp(p.x, w / 2, W - w / 2), cy = U.clamp(p.y, h / 2 + 100, H - h / 2);
      const x0 = cx - w / 2, y0 = cy - h / 2;
      let grow = 0;
      const o = ov(b, g, { tick() { grow = Math.min(1, grow + 0.04); }, render(ctx) {
        ctx.save(); ctx.strokeStyle = '#7ab0ff'; ctx.lineWidth = 2; ctx.setLineDash([6, 4]); ctx.lineDashOffset = -g.t;
        ctx.fillStyle = 'rgba(80,140,255,0.15)'; ctx.fillRect(x0, y0, w * grow, h * grow); ctx.strokeRect(x0, y0, w * grow, h * grow);
        ctx.setLineDash([]); ctx.font = `12px ${F()}`; ctx.fillStyle = '#cfe0ff'; ctx.fillText('已選取 1 個項目（你）', x0, y0 - 6);
        ctx.restore();
      } });
      g.sfx('click');
      for (let f = 0; f < 80; f++) {
        if (f % 25 === 0) g.fan(b.x, b.y, g.aim(b.x, b.y), g.n(3), 0.4, 2.6, 'cursor', 'blue');
        if (f % 26 === 2) g.text(cx, y0 - 22, f < 26 ? (g.diff === 'hard' ? '快離開選取框！' : '離開選取框，或待在正中央！') : 'Delete 倒數 ' + (3 - Math.floor(f / 26)), '#ffd0d8', 14, 24);
        yield 1;
      }
      o.kill(); g.sfx('cancel'); g.text(cx, cy, 'Delete', '#ff6080', 18, 40);
      const step = g.diff === 'easy' ? 36 : g.diff === 'normal' ? 30 : 23;
      const safeR = g.diff === 'easy' ? 56 : g.diff === 'normal' ? 44 : 0;
      const edge = (x, y) => { const a = U.ang(x, y, cx, cy), d = U.dist(x, y, cx, cy); g.shot(x, y, a, 1.6, 'small', 'red', { life: Math.max(1, Math.floor((d - safeR) / (1.6 * g.D.spd))) }); };
      for (let x = x0; x <= x0 + w; x += step) { edge(x, y0); edge(x, y0 + h); }
      for (let y = y0 + step; y < y0 + h; y += step) { edge(x0, y); edge(x0 + w, y); }
      g.ring(b.x, b.y, g.n(16), 2, 'orb', 'cyan', U.rnd(TAU));
      yield Math.max(50, 80 - lv * 4);
      yield* b.wander(30);
    }
  }, onEnd: (b, g) => killOverlays(b)() };
  P.shio_s2 = { spell: true, id: 'dblclick', name: '雙擊「開啟檔案」', hp: 1500, time: 40, *gen(b, g, lv) {
    const cur = { x: b.x, y: b.y, clk: 0 };
    ov(b, g, { tick() { if (cur.clk > 0) cur.clk--; }, render(ctx) { ctx.save(); ctx.translate(cur.x, cur.y); ctx.scale(2.2, 2.2); const sp = Spr.pshot('cursor', '#5a8aff'); ctx.drawImage(sp.c, -4, -9, 20, 20); ctx.restore(); if (cur.clk > 0) { ctx.beginPath(); ctx.arc(cur.x, cur.y, 30 - cur.clk, 0, TAU); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke(); } } });
    while (true) {
      const p = g.player; let tx, ty, tries = 0;
      do { tx = U.rnd(60, W - 60); ty = U.rnd(80, H - 160); tries++; } while (U.dist(tx, ty, p.x, p.y) < 160 && tries < 20);
      const sx = cur.x, sy = cur.y;
      for (let f = 1; f <= 30; f++) { const k = U.easeInOut(f / 30); cur.x = U.lerp(sx, tx, k); cur.y = U.lerp(sy, ty, k); yield 1; }
      for (let c = 0; c < 2; c++) { g.sfx('click'); cur.clk = 12; const off = U.rnd(TAU); g.ring(cur.x, cur.y, g.n(14 + lv), c ? 2.6 : 2, c ? 'orb' : 'cursor', c ? 'purple' : 'blue', off + c * 0.2); yield 8; }
      yield Math.max(18, 36 - lv * 2);
      if (Math.random() < 0.3) g.fan(b.x, b.y, g.aim(b.x, b.y), g.n(5), 0.5, 3, 'kunai', 'cyan');
    }
  }, onEnd: (b, g) => killOverlays(b)() };
  P.shio_s3 = { spell: true, id: 'yourmouse', name: '游標漂移「這隻滑鼠不是你的」', hp: 1600, time: 45, *gen(b, g, lv) {
    const cur = { x: W / 2, y: 200 }; let hint = 0, usingMouse = false;
    ov(b, g, { render(ctx) {
      ctx.save(); ctx.translate(cur.x, cur.y); ctx.scale(2, 2); ctx.drawImage(Spr.pshot('cursor', usingMouse ? '#ff4060' : '#5a8aff').c, -4, -9, 20, 20); ctx.restore();
      if (usingMouse) bigText(ctx, '借用中：你的滑鼠', cur.x, cur.y - 24, 11, '#ffb0c0', 0.8);
      if (hint > 0) bigText(ctx, '（小聲：把滑鼠移到遊戲畫面外面，它就抓不到了喔）', W / 2, H - 30, 12, '#cfe0ff', Math.min(1, hint / 30));
    } });
    let k = 0;
    while (true) {
      const m = Input.mouse, mx = m.x - FW.PF.x, my = m.y - FW.PF.y;
      usingMouse = m.inside && FW.frame - m.lastMove < 300 && mx > 0 && mx < W && my > 0 && my < H;
      let tx, ty;
      if (usingMouse) { tx = mx; ty = my; }
      else { tx = U.clamp(g.player.x + Math.sin(k * 0.02) * 160, 40, W - 40); ty = 140 + Math.sin(k * 0.013) * 60; }
      // 不讓游標太靠近自機
      if (U.dist(tx, ty, g.player.x, g.player.y) < 110) { const a = U.ang(g.player.x, g.player.y, tx, ty); tx = g.player.x + Math.cos(a) * 110; ty = g.player.y + Math.sin(a) * 110; }
      cur.x = U.lerp(cur.x, tx, 0.04); cur.y = U.lerp(cur.y, ty, 0.04);
      if (k % 5 === 0) g.shot(cur.x, cur.y, k * 0.1, 2.2, 'cursor', usingMouse ? 'red' : 'blue');
      if (k % 50 === 0) { g.ring(cur.x, cur.y, g.n(12), 1.8, 'orb', 'purple', U.rnd(TAU)); g.sfx('click'); }
      if (k % 70 === 0) g.fan(b.x, b.y, g.aim(b.x, b.y), g.n(5), 0.6, 2.8, 'kunai', 'cyan');
      if (k === 480) hint = 400; if (hint > 0) hint--;
      k++; yield 1;
    }
  }, onEnd: (b, g) => killOverlays(b)() };

  // ======================= 棗 =======================
  P.natsume_non = { hp: 1000, time: 30, *gen(b, g, lv) {
    let k = 0;
    while (true) {
      for (let s = 0; s < 4; s++) g.shot(b.x, b.y, k * 0.18 + s * TAU / 4, 2.3, 'page', 'purple');
      if (k % 16 === 0) g.fan(b.x, b.y, g.aim(b.x, b.y), g.n(5), 0.6, 3, 'orb', 'yellow');
      k++; yield 5;
      if (k % 90 === 0) yield* b.wander(40);
    }
  } };
  P.natsume_non2 = { hp: 1100, time: 30, *gen(b, g, lv) {
    let k = 0;
    while (true) {
      const n = g.n(20);
      g.ring(b.x, b.y, n, 2.2, 'page', 'purple', k * 0.1, { w: 0.008 });
      g.ring(b.x, b.y, n, 2.2, 'page', 'pink', -k * 0.1, { w: -0.008 });
      k++; yield 34 - lv;
      if (k % 4 === 0) yield* b.wander(40);
    }
  } };
  const CREDIT_WORDS = ['主演', '彈幕設計', '腳本', '玩家', '特別感謝', '你', '音樂', '舞台', '燈光', '劇本'];
  P.natsume_s1 = { spell: true, id: 'credits', name: '片尾名單「提前謝幕」', hp: 1400, time: 42, *gen(b, g, lv) {
    let k = 0;
    const minGap = g.diff === 'easy' ? 120 : g.diff === 'normal' ? 96 : 80;
    while (true) {
      // 一行字從下方往上捲
      let x = U.rnd(-40, 20), gapDone = false;
      const gapAt = U.rnd(80, W - 160);
      while (x < W + 10) {
        const word = U.pick(CREDIT_WORDS);
        if (!gapDone && x + word.length * 26 > gapAt) { x = gapAt + minGap; gapDone = true; continue; }
        for (const c of word) { g.shot(x, H + 16, -Math.PI / 2, 1.1 + lv * 0.04, 'glyph', 'purple', { glyph: c, keep: true }); x += 26; }
        x += 30 + U.rnd(0, 30);
      }
      if (k % 2 === 0) g.fan(b.x, b.y, g.aim(b.x, b.y), g.n(3), 0.3, 2.2, 'page', 'yellow');
      k++; yield Math.max(70, 110 - lv * 4);
    }
  } };
  P.natsume_s2 = { spell: true, id: 'foreshadow', name: '伏筆「第三章的回收」', hp: 1500, time: 42, *gen(b, g, lv) {
    while (true) {
      const mine = [];
      for (let i = 0; i < 6; i++) {
        const n = g.n(12);
        for (let j = 0; j < n; j++) mine.push(g.shot(b.x, b.y, j * TAU / n + i * 0.25, 1.5 + i * 0.5, 'orb', 'purple', { acc: -0.04, minSpeed: 0, alpha: 0.6 }));
        g.sfx('eshot'); yield 10;
      }
      yield 70;
      g.text(b.x, b.y - 40, '伏筆回收！', '#ffd36b', 18, 50); g.sfx('charge');
      for (const m of mine) { if (m.dead) continue; m.alpha = 1; m.sp = Spr.bullet('orb', 'yellow'); m.angle = g.aim(m.x, m.y) + U.rnd(-0.08, 0.08); m.minSpeed = undefined; m.speed = 0.2; m.acc = 0.035; m.maxSpeed = 2.8; }
      yield 90;
      yield* b.wander(40);
    }
  } };
  P.natsume_s3 = { spell: true, id: 'script', name: '劇本「你的下一步」', hp: 1600, time: 45, *gen(b, g, lv) {
    let say = '', sayT = 0;
    ov(b, g, { tick() { if (sayT > 0) sayT--; }, render(ctx) { if (sayT > 0) { ctx.save(); ctx.globalAlpha = Math.min(1, sayT / 20); ctx.fillStyle = 'rgba(30,20,40,0.8)'; ctx.fillRect(W / 2 - 150, 300, 300, 34); ctx.font = `italic 17px ${F()}`; ctx.fillStyle = '#e8d8ff'; ctx.textAlign = 'center'; ctx.fillText('旁白：「' + say + '」', W / 2, 323); ctx.restore(); } } });
    while (true) {
      const p = g.player, h = p.hist;
      let sx = 0, sy = 0; for (let i = 0; i < h.length; i += 2) { sx += h[i]; sy += h[i + 1]; }
      const n = h.length / 2 || 1, vx = sx / n, vy = sy / n;
      const dir = Math.abs(vx) < 0.2 && Math.abs(vy) < 0.2 ? '你會停在原地。' : Math.abs(vx) > Math.abs(vy) ? (vx < 0 ? '你會往左邊躲。' : '你會往右邊躲。') : (vy < 0 ? '你會往上衝。' : '你會往下退。');
      say = dir; sayT = 70; g.sfx('text', { pitch: 520 });
      yield 25;
      const tx = U.clamp(p.x + vx * 90, 10, W - 10), ty = U.clamp(p.y + vy * 90, 10, H - 10);
      const a = U.ang(b.x, b.y, tx, ty);
      for (let i = 0; i < 3; i++) { g.fan(b.x, b.y, a, g.n(5), 0.5, 3 + i * 0.5, 'page', 'yellow'); yield 5; }
      g.ring(b.x, b.y, g.n(18), 1.6, 'orb', 'purple', U.rnd(TAU));
      yield Math.max(24, 40 - lv * 2);
      if (Math.random() < 0.4) yield* b.wander(30);
    }
  }, onEnd: (b, g) => killOverlays(b)() };

  // ======================= 鈴 =======================
  P.suzu_non = { hp: 950, time: 30, *gen(b, g, lv) {
    let k = 0;
    while (true) {
      g.fan(b.x, b.y, g.aim(b.x, b.y) + U.rnd(-0.3, 0.3), g.n(7), 2.2, 2.6, 'note', 'orange', { bounceWalls: 1 });
      g.sfx('eshot'); k++;
      yield 26 - lv;
      if (k % 4 === 0) yield* b.wander(40);
    }
  } };
  P.suzu_non2 = { hp: 1050, time: 30, *gen(b, g, lv) {
    let k = 0;
    while (true) {
      g.ring(b.x, b.y, g.n(14), 2.4, 'orb', k % 2 ? 'orange' : 'cyan', k * 0.2, { bounceWalls: 1 });
      k++; yield 22;
      if (k % 6 === 0) yield* b.wander(40);
    }
  } };
  P.suzu_s1 = { spell: true, id: 'outside', name: '越界「從框外飛來的子彈」', hp: 1400, time: 40, *gen(b, g, lv) {
    let k = 0;
    while (true) {
      const side = k % 2 ? 1 : -1;
      for (let i = 0; i < g.n(6 + lv / 2 | 0); i++) {
        const y = U.rnd(40, H * 0.7), x = side > 0 ? W + 20 : -20;
        g.shot(x, y, side > 0 ? Math.PI + U.rnd(-0.2, 0.3) : U.rnd(-0.3, 0.2), U.rnd(1.6, 2.6), 'note', side > 0 ? 'cyan' : 'orange', { keep: true });
        if (side > 0) g.hudPing = 20;
        yield 6;
      }
      g.fan(b.x, b.y, g.aim(b.x, b.y), g.n(5), 0.8, 2.8, 'orb', 'yellow');
      k++; yield Math.max(20, 40 - lv * 3);
    }
  } };
  P.suzu_s2 = { spell: true, id: 'squeeze', name: '縮框「4:3 → 1:1」', hp: 1500, time: 42, *gen(b, g, lv) {
    let k = 0;
    const target = g.diff === 'easy' ? 60 : g.diff === 'normal' ? 80 : 96, bnc = g.diff === 'hard' ? 2 : 1;
    while (true) {
      g.wallL = g.wallR = U.lerp(g.wallL, target * (0.6 + 0.4 * Math.sin(k * 0.01)), 0.03);
      if (k % 18 === 0) g.fan(b.x, b.y, Math.PI / 2 + Math.sin(k * 0.05) * 0.8, g.n(5), 1.2, 2.6, 'orb', 'orange', { bounceWalls: bnc });
      if (k % 70 === 0) g.fan(b.x, b.y, g.aim(b.x, b.y), g.n(3), 0.3, 3, 'note', 'cyan');
      if (k % 120 === 0) g.sfx('stretch');
      k++; yield 1;
    }
  }, onEnd: (b, g) => { g.wallL = g.wallR = 0; } };
  P.suzu_s3 = { spell: true, id: 'knock', name: '敲螢幕「叩、叩、叩」', hp: 1600, time: 45, *gen(b, g, lv) {
    const cracks = [];
    ov(b, g, { render(ctx) {
      for (const c of cracks) {
        ctx.save(); ctx.translate(c.x, c.y); ctx.globalAlpha = Math.min(1, c.life / 30); ctx.strokeStyle = 'rgba(220,240,255,0.85)'; ctx.lineWidth = 1.5;
        for (const r of c.rays) { ctx.beginPath(); ctx.moveTo(0, 0); let x = 0, y = 0; for (let s = 1; s <= 4; s++) { x += Math.cos(r + U.rnd(-0.3, 0.3) * 0) * 12 * s * 0.5; y += Math.sin(r) * 12 * s * 0.5; ctx.lineTo(x + Math.sin(s * 3 + r) * 4, y + Math.cos(s * 2 + r) * 4); } ctx.stroke(); }
        ctx.beginPath(); ctx.arc(0, 0, 10, 0, TAU); ctx.stroke(); ctx.restore();
      }
    }, tick() { for (let i = cracks.length - 1; i >= 0; i--) if (--cracks[i].life <= 0) cracks.splice(i, 1); } });
    while (true) {
      for (let n = 0; n < 3; n++) {
        let x, y, tries = 0;
        do { x = U.rnd(50, W - 50); y = U.rnd(60, H - 120); tries++; } while (U.dist(x, y, g.player.x, g.player.y) < 170 && tries < 30);
        g.sfx('knock'); g.shake(5); FW.Outside.vibrate([30, 50, 30]);
        cracks.push({ x, y, life: 200, rays: Array.from({ length: 7 }, () => U.rnd(TAU)) });
        g.text(x, y - 20, '叩', '#fff', 20, 30);
        g.ring(x, y, g.n(12 + lv), 1.9, 'shard', 'cyan', U.rnd(TAU), { acc: 0.01, maxSpeed: 2.8 });
        yield 18;
      }
      g.fan(b.x, b.y, g.aim(b.x, b.y), g.n(7), 1.0, 2.6, 'note', 'orange', { bounceWalls: 1 });
      yield Math.max(40, 70 - lv * 3);
    }
  }, onEnd: (b, g) => killOverlays(b)() };

  // ======================= 無名 =======================
  P.nanashi_non = { hp: 1000, time: 30, *gen(b, g, lv) {
    let k = 0;
    while (true) {
      g.ring(b.x, b.y, g.n(12), 2, 'square', 'magenta', k * 0.2, { spin: true });
      g.ring(b.x, b.y, g.n(12), 2.6, 'orb', 'gray', k * 0.2 + 0.26);
      k++; yield 30;
      if (k % 4 === 0) yield* b.wander(40);
    }
  } };
  P.nanashi_s1 = { spell: true, id: 'missing', name: '未使用素材「Missing Texture」', hp: 1400, time: 40, expr: 'blank', *gen(b, g, lv) {
    let k = 0;
    const cell = g.diff === 'easy' ? 72 : 58;
    while (true) {
      const ox = U.rnd(cell), oy = U.rnd(30) + 20;
      for (let x = ox; x < W; x += cell) for (let y = oy; y < 300; y += cell) {
        if (Math.random() < 0.35) continue;
        g.shot(x, y, Math.PI / 2 + U.rnd(-0.1, 0.1), 0, 'square', 'magenta', { spawn: 40, flicker: true, acc: 0.012, maxSpeed: 1.7 });
      }
      g.sfx('error');
      yield 80;
      g.fan(b.x, b.y, g.aim(b.x, b.y), g.n(5), 0.6, 2.6, 'orb', 'gray');
      yield Math.max(60, 110 - lv * 6); k++;
    }
  } };
  P.nanashi_s2 = { spell: true, id: 'nosave', name: '已刪除的角色「存檔裡沒有我的名字」', hp: 1500, time: 45, expr: 'sad', *gen(b, g, lv) {
    const d = FW.Save.data, arms = 3 + (d.deaths % 4);
    ov(b, g, { render(ctx) { ctx.save(); ctx.font = `13px monospace`; ctx.fillStyle = 'rgba(255,0,220,0.7)'; ctx.textAlign = 'left'; ctx.fillText(`> load save.dat ... OK`, 10, H - 64); ctx.fillText(`> playtime = ${U.fmtTime(d.playTime)}   deaths = ${d.deaths}`, 10, H - 46); ctx.fillText(`> character_07.name = ${g.t % 60 < 30 ? '???' : 'null'}`, 10, H - 28); ctx.restore(); } });
    let k = 0;
    while (true) {
      for (let i = 0; i < arms; i++) g.shot(b.x, b.y, k * 0.09 + i * TAU / arms, 2.3, k % 20 < 10 ? 'square' : 'orb', k % 20 < 10 ? 'magenta' : 'gray');
      if (k % 45 === 0) g.fan(b.x, b.y, g.aim(b.x, b.y), g.n(3), 0.3, 3, 'kunai', 'white');
      k++; yield Math.max(3, 6 - (lv >> 1));
    }
  }, onEnd: (b, g) => killOverlays(b)() };

  // ======================= 幕 =======================
  P.maku_non = { hp: 1200, time: 35, *gen(b, g, lv) {
    let k = 0;
    while (true) {
      for (let c = 0; c < 9; c++) { const x = 32 + c * 64 + Math.sin(k * 0.05 + c) * 22; if ((k + c * 3) % 9 < 6) g.shot(x, -6, Math.PI / 2, 2.2, 'rice', 'red'); }
      if (k % 25 === 0) g.fan(b.x, b.y, g.aim(b.x, b.y), g.n(5), 0.5, 3.2, 'orb', 'yellow');
      k++; yield 6;
      if (k % 80 === 0) yield* b.wander(40);
    }
  } };
  P.maku_non2 = { hp: 1300, time: 35, *gen(b, g, lv) {
    let k = 0;
    while (true) {
      g.ring(b.x, b.y, g.n(20), 2.2, 'orb', 'red', k * 0.17);
      g.ring(b.x, b.y, g.n(20), 1.6, 'rice', 'yellow', -k * 0.17);
      if (k % 3 === 0) { const a = g.aim(b.x, b.y); g.laser(b.x, b.y, a + 0.5, 800, 16, 40, 30, 'red'); g.laser(b.x, b.y, a - 0.5, 800, 16, 40, 30, 'red'); }
      k++; yield 40;
      if (k % 3 === 0) yield* b.wander(40);
    }
  } };
  P.maku_s1 = { spell: true, id: 'theend', name: '謝幕「The End」', hp: 1600, time: 45, *gen(b, g, lv) {
    const words = ['THE END', 'FIN', 'END'];
    let k = 0;
    while (true) {
      const pts = textPoints(words[k % words.length], W / 2, 120, k % words.length === 0 ? 11 : 16);
      const mine = pts.map(([x, y]) => g.shot(x, y, 0, 0, 'orb', 'red', { spawn: 30 }));
      g.sfx('spell');
      yield 70;
      for (const m of mine) { m.angle = U.rnd(TAU); m.speed = 0; m.acc = 0.02; m.maxSpeed = U.rnd(1.2, 2.2); m.sp = Spr.bullet('orb', 'yellow'); }
      g.fan(b.x, b.y, g.aim(b.x, b.y), g.n(5), 0.5, 3, 'kunai', 'red');
      yield 110; k++;
    }
  } };
  P.maku_s2 = { spell: true, id: 'spotlight', name: '舞台燈「聚光燈下的你」', hp: 1700, time: 45, *gen(b, g, lv) {
    const origins = [[0, 0], [W, 0], [W / 2, -20]];
    let k = 0;
    while (true) {
      const ls = origins.map(([x, y], i) => g.laser(x, y, U.ang(x, y, g.player.x, g.player.y) + (i - 1) * 0.3, 900, 26, 60, 140, 'yellow', { fn(l, gg) { if (l.t > l.warn) l.angle += (i - 1) * (g.diff === 'easy' ? 0.002 : 0.003); } }));
      g.sfx('charge');
      for (let f = 0; f < 200; f++) { if (f % 30 === 0) g.ring(b.x, b.y, g.n(14), 1.8, 'rice', 'red', U.rnd(TAU)); yield 1; }
      k++; yield* b.wander(30);
    }
  } };
  P.maku_s3 = { spell: true, id: 'yourside', name: '第四面牆「從你那一側」', hp: 1800, time: 48, *gen(b, g, lv) {
    const warns = [];
    ov(b, g, { tick() { for (const w of warns) w.t--; }, render(ctx) { for (const w of warns) { if (w.t <= 0) continue; ctx.fillStyle = `rgba(255,80,100,${0.3 + 0.3 * Math.sin(w.t)})`; ctx.beginPath(); ctx.moveTo(w.x - 10, H); ctx.lineTo(w.x + 10, H); ctx.lineTo(w.x, H - 16); ctx.fill(); } bigText(ctx, '（子彈從畫面的這一側進來）', W / 2, H - 30, 12, '#ffb0b8', 0.5); } });
    let k = 0;
    while (true) {
      let x; do { x = U.rnd(20, W - 20); } while (Math.abs(x - g.player.x) < 50);
      const w = { x, t: 40 }; warns.push(w); if (warns.length > 40) warns.shift();
      const xx = x;
      g.tasks.add((function* () { yield 40; for (let i = 0; i < 3; i++) { g.shot(xx, H + 10, -Math.PI / 2 + (i - 1) * 0.12, 1.7, 'heart', 'red'); } })());
      if (k % 50 === 0) g.ring(b.x, b.y, g.n(16), 1.7, 'orb', 'pink', U.rnd(TAU));
      k++; yield Math.max(8, 16 - lv);
    }
  }, onEnd: (b, g) => killOverlays(b)() };
  P.maku_last = { spell: true, id: 'dontclose', name: '幕引「請不要關掉遊戲」', survival: true, time: 40, expr: 'sad', onDeclare: () => FW.Outside.say('maku', '……你那邊，現在是 {time} 吧。這一段結束之後，就去休息喔。', { expr: 'sad', key: 'makulast', cool: 600000 }), *gen(b, g, lv) {
    const roll = ['第四面牆', '', '—— 主演 ——', '玲音　千代　茜', '汐　棗　鈴', '', '—— 舞台 ——', '幕', '', '—— 遊玩 ——', '你', '', '謝謝你', '一路陪我們到這裡', '', '所以……', '你可以去睡了', '', 'THE END'];
    let scroll = 0;
    ov(b, g, { under: true, tick() { scroll += 0.9; g.bgDim = Math.min(0.75, scroll / 900); }, render(ctx) {
      ctx.save(); ctx.textAlign = 'center'; ctx.font = `bold 22px ${F()}`;
      roll.forEach((s, i) => { const y = H + 40 + i * 70 - scroll; if (y > -30 && y < H + 30) { ctx.fillStyle = 'rgba(255,240,240,0.75)'; ctx.fillText(s, W / 2, y); } });
      ctx.restore();
    } });
    let k = 0;
    while (true) {
      if (k % 16 === 0) { const s = U.pick(roll.filter(Boolean)); const c = s[k % s.length]; g.shot(U.rnd(40, W - 40), -10, Math.PI / 2 + U.rnd(-0.2, 0.2), 1.4, 'glyph', 'red', { glyph: c }); }
      if (k % 60 === 0) g.ring(b.x, b.y, g.n(18 + (k / 120 | 0)), 1.6, 'heart', 'pink', U.rnd(TAU));
      k++; yield 1;
    }
  }, onEnd: (b, g) => { killOverlays(b)(); g.bgDim = 0; } };

  // ======================= 幕・真（Extra） =======================
  P.true_non = { hp: 1400, time: 35, *gen(b, g, lv) {
    let k = 0;
    while (true) {
      for (let i = 0; i < 2; i++) g.ring(b.x, b.y, g.n(6), 2.6, 'heart', i ? 'red' : 'pink', k * 0.11 * (i ? 1 : -1));
      if (k % 20 === 0) g.fan(b.x, b.y, g.aim(b.x, b.y), g.n(5), 0.5, 3.5, 'kunai', 'white');
      k++; yield 5;
      if (k % 100 === 0) yield* b.wander(40);
    }
  } };
  P.true_hud = { spell: true, id: 'hud', name: 'HUD「連分數都是子彈」', hp: 1800, time: 45, *gen(b, g, lv) {
    let k = 0;
    while (true) {
      const s = String(Math.floor(g.score)), row = [[156, s], [204, '★'.repeat(Math.max(1, g.lives))], [300, g.power.toFixed(2)], [358, String(g.graze)]][k % 4];
      g.hudPing = 25;
      for (let i = 0; i < row[1].length; i++) { const c = row[1][i]; g.shot(W + 14 + i * 4, row[0] + i * 3, Math.PI + U.rnd(-0.35, 0.35), U.rnd(1.6, 2.6), 'digit', k % 2 ? 'yellow' : 'cyan', { glyph: c, keep: true }); }
      if (k % 2 === 0) g.fan(b.x, b.y, g.aim(b.x, b.y), g.n(5), 0.7, 3, 'heart', 'red');
      k++; yield Math.max(22, 34 - lv);
    }
  } };
  P.true_clock = { spell: true, id: 'clock', name: '現實時間「現在是幾點？」', hp: 2000, time: 50, *gen(b, g, lv) {
    const hands = [
      { len: 220, w: 22, col: 'red', ang: () => { const d = new Date(); return ((d.getHours() % 12) + d.getMinutes() / 60) / 12 * TAU - Math.PI / 2; } },
      { len: 300, w: 16, col: 'yellow', ang: () => { const d = new Date(); return (d.getMinutes() + d.getSeconds() / 60) / 60 * TAU - Math.PI / 2; } },
      { len: 420, w: 10, col: 'cyan', ang: () => (Date.now() / 1000 * 0.35) % TAU },
    ];
    yield* b.move(W / 2, 220, 40);
    for (const h of hands) g.laser(b.x, b.y, h.ang(), h.len, h.w, 60, 1e9, h.col, { noOrigin: true, fn(l) { l.x = b.x; l.y = b.y; l.angle = h.ang(); } });
    ov(b, g, { under: true, render(ctx) { ctx.save(); ctx.translate(b.x, b.y); ctx.strokeStyle = 'rgba(255,220,200,0.35)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, 180, 0, TAU); ctx.stroke(); ctx.font = `bold 16px ${F()}`; ctx.fillStyle = 'rgba(255,230,210,0.7)'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; for (let i = 1; i <= 12; i++) { const a = i / 12 * TAU - Math.PI / 2; ctx.fillText(i, Math.cos(a) * 196, Math.sin(a) * 196); } ctx.restore(); bigText(ctx, '現在時間 ' + FW.Real.hhmm() + (FW.Real.isLate() ? '　…這麼晚了耶。' : '　…今天過得好嗎？'), W / 2, H - 24, 13, '#ffe0d0', 0.7); } });
    let k = 0;
    while (true) {
      if (k % 40 === 0) { const i = (k / 40 | 0) % 12 + 1, a = i / 12 * TAU - Math.PI / 2, x = b.x + Math.cos(a) * 196, y = b.y + Math.sin(a) * 196; g.ring(x, y, g.n(8), 1.6, 'digit', 'yellow', U.rnd(TAU), { glyph: String(i % 10) }); }
      if (k % 90 === 45) g.fan(b.x, b.y, g.aim(b.x, b.y), g.n(3), 0.4, 2.6, 'orb', 'white');
      k++; yield 1;
    }
  }, onDeclare: (b, g) => { g.banner.name = '現實時間「現在是 ' + FW.Real.hhmm() + '」'; }, onEnd: (b, g) => killOverlays(b)() };
  P.true_deaths = { spell: true, id: 'deaths', name: '存檔「你一共倒下了幾次」', hp: 1900, time: 45, *gen(b, g, lv) {
    const d = FW.Save.data.deaths, arms = 2 + (d % 5);
    ov(b, g, { render() { } });
    g.text(W / 2, 300, `你一共倒下了 ${d} 次。`, '#ffb0c0', 22, 160);
    g.text(W / 2, 330, `……但每一次你都按了「繼續」。`, '#ffe0e8', 16, 160);
    let k = 0;
    while (true) {
      for (let i = 0; i < arms; i++) { g.shot(b.x, b.y, k * 0.07 + i * TAU / arms, 2.4, 'heart', 'pink'); g.shot(b.x, b.y, -k * 0.07 + i * TAU / arms, 1.8, 'orb', 'red'); }
      k++; yield Math.max(4, 7 - (lv >> 1));
    }
  }, onEnd: (b, g) => killOverlays(b)() };
  P.true_ng = { spell: true, id: 'newgame', name: '重新開始「New Game +」', hp: 2600, time: 60, *gen(b, g, lv) {
    const seq = U.shuffle(['rinne_s1', 'chiyo_s3', 'akane_s2', 'shio_s2', 'natsume_s2', 'suzu_s3']).slice(0, 5);
    while (true) {
      for (const key of seq) {
        const ph = P[key];
        g.text(W / 2, 260, '♪ ' + FW.CHARS[key.split('_')[0]].name + '：' + ph.name, '#ffe9a8', 16, 100);
        const sub = new FW.TaskList(); sub.add(ph.gen(b, g, Math.max(3, lv - 2)));
        for (let f = 0; f < 420; f++) { sub.step(); yield 1; }
        if (ph.onEnd) ph.onEnd(b, g);
        g.clearBullets(true); g.wallL = g.wallR = 0;
        yield 30;
      }
    }
  }, onEnd: (b, g) => { killOverlays(b)(); g.wallL = g.wallR = 0; } };
  P.true_last = { spell: true, id: 'infinite', name: '∞「無限幕間」', survival: true, time: 50, expr: 'smile', *gen(b, g, lv) {
    let k = 0;
    while (true) {
      const ramp = Math.min(1, k / 1800);
      if (k % 6 === 0) for (let i = 0; i < 3; i++) g.shot(b.x, b.y, k * 0.05 + i * TAU / 3, 2, 'heart', 'pink');
      if (k % 6 === 3) for (let i = 0; i < 3; i++) g.shot(b.x, b.y, -k * 0.05 + i * TAU / 3, 2, 'heart', 'red');
      if (k % Math.round(70 - ramp * 30) === 0) g.ring(b.x, b.y, g.n(16 + ramp * 10), 1.5, 'orb', 'white', U.rnd(TAU));
      k++; yield 1;
    }
  } };

  for (const k in P) { P[k].key = k; }
  FW.PATTERNS = P;

  // ---------- 組裝 ----------
  const MUSIC = { rinne: 'b_rinne', chiyo: 'b_chiyo', akane: 'b_akane', shio: 'b_shio', natsume: 'b_natsume', suzu: 'b_suzu', nanashi: 'b_nanashi', maku: 'b_maku', maku_true: 'b_true' };
  const mk = (key, hpScale = 1) => Object.assign({}, P[key], { hp: (P[key].hp || 1) * hpScale });
  FW.BOSSES = {
    MUSIC,
    // 關卡頭目（女主角們）
    heroine(id, lv) {
      const hs = 0.8 + lv * 0.08;
      const ph = [mk(id + '_non', hs), mk(id + '_s1', hs), mk(id + '_non2', hs), mk(id + '_s2', hs)];
      if (lv >= 3) ph.push(mk(id + '_s3', hs));
      return ph;
    },
    mid(id, lv) { return [Object.assign(mk(id + '_non', 0.6 + lv * 0.05), { time: 20 })]; },
    nanashi(lv, extra) { const hs = extra ? 0.9 : 0.85 + lv * 0.06; return extra ? [mk('nanashi_non', hs), mk('nanashi_s1', hs), mk('nanashi_s2', hs)] : [mk('nanashi_non', hs), mk('nanashi_s1', hs)]; },
    maku(lv) { const hs = 1.0 + lv * 0.05; return [mk('maku_non', hs), mk('maku_s1', hs), mk('maku_non2', hs), mk('maku_s2', hs), mk('maku_s3', hs), mk('maku_last')]; },
    trueMaku(lv) { const hs = 0.95; return [mk('true_non', hs), mk('true_hud', hs), mk('true_non', hs), mk('true_clock', hs), mk('true_deaths', hs), mk('true_ng', hs), mk('true_last')]; },
    // 練習清單
    all() {
      const out = [];
      const add = (char, key, music, stage, lv) => out.push({ key, char, phase: P[key], music, stage, lv, name: P[key].name });
      FW.PLAYABLE.forEach((id, i) => ['s1', 's2', 's3'].forEach(s => add(id, id + '_' + s, MUSIC[id], i % 5 + 1, s === 's3' ? 4 : 3)));
      ['nanashi_s1', 'nanashi_s2'].forEach(k => add('nanashi', k, MUSIC.nanashi, 6, 6));
      ['maku_s1', 'maku_s2', 'maku_s3', 'maku_last'].forEach(k => add('maku', k, MUSIC.maku, 6, 6));
      ['true_hud', 'true_clock', 'true_deaths', 'true_ng', 'true_last'].forEach(k => add('maku', k, MUSIC.maku_true, 7, 7));
      return out;
    },
    find(key) { return this.all().find(x => x.key === key); },
  };
})();
