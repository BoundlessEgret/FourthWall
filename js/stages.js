'use strict';
// ============================================================
//  Stages — 道中（雜魚波次）、關卡腳本、無盡模式
// ============================================================
(function () {
  const U = FW.U, W = FW.PF.w, H = FW.PF.h;

  // ---------- 雜魚的攻擊 ----------
  const FIRE = {
    aim(g, e, lv) { g.shot(e.x, e.y, g.aim(e.x, e.y), 2.2 + lv * 0.15, 'orb', e.color === 'red' ? 'red' : 'blue'); g.sfx('eshot'); },
    aim3(g, e, lv) { g.fan(e.x, e.y, g.aim(e.x, e.y), 3, 0.35, 2.3 + lv * 0.12, 'rice', e.color === 'green' ? 'green' : 'cyan'); g.sfx('eshot'); },
    ring(g, e, lv) { g.ring(e.x, e.y, g.n(6 + lv), 1.8 + lv * 0.08, 'small', e.color === 'purple' ? 'purple' : 'yellow', U.rnd(TAU)); g.sfx('eshot'); },
    kunai(g, e, lv) { g.fan(e.x, e.y, g.aim(e.x, e.y), g.n(2 + (lv >> 1)), 0.25, 3 + lv * 0.1, 'kunai', 'red'); g.sfx('eshot'); },
  };
  const COLS = ['blue', 'red', 'green', 'yellow', 'purple', 'pink'];

  // ---------- 波次 ----------
  const Wv = FW.Waves = {
    // 從側邊弧線飛過
    *swoop(g, lv, side = 1, n = 8, col = 'blue', fire = 'aim') {
      for (let i = 0; i < n; i++) {
        const y0 = 60 + U.rnd(0, 30);
        g.enemy({ x: side > 0 ? -20 : W + 20, y: y0, hp: 10 + lv * 2, color: col, drops: { power: i % 2, point: 1 - i % 2 } }, function* (e) {
          const vx = side * (2.6 + lv * 0.1);
          let fired = false;
          for (let t = 0; t < 400; t++) {
            e.x += vx; e.y = y0 + Math.sin(t * 0.02) * 120 + t * 0.25;
            if (!fired && t > 50 + i * 2) { fired = true; FIRE[fire](g, e, lv); }
            yield 1;
          }
        });
        yield 12;
      }
    },
    // 由上往下，停下射擊後離開
    *drop(g, lv, xs, col = 'red', fire = 'aim3', hp) {
      for (const x of xs) {
        g.enemy({ x, y: -20, hp: hp || 16 + lv * 3, color: col, drops: { power: 1, point: 1 } }, function* (e) {
          yield* g.moveTo(e, x, 80 + U.rnd(0, 80), 50, U.easeOut);
          for (let k = 0; k < 2 + (lv >> 2); k++) { FIRE[fire](g, e, lv); yield 40; }
          yield* g.moveTo(e, x + U.rnd(-80, 80), -60, 70, U.easeIn);
        });
        yield 10;
      }
    },
    // 大妖精
    *big(g, lv, x, col = 'purple', kind = 0) {
      g.enemy({ x, y: -30, hp: 110 + lv * 25, r: 22, big: true, color: col, drops: { power: 3, point: 5, bombpiece: lv >= 3 && Math.random() < 0.25 ? 1 : 0 } }, function* (e) {
        yield* g.moveTo(e, x, 140, 70, U.easeOut);
        for (let k = 0; k < 160 + lv * 10; k++) {
          if (kind === 0 && k % 6 === 0) for (let s = 0; s < 3; s++) g.shot(e.x, e.y, k * 0.11 + s * TAU / 3, 2.2, 'orb', col === 'purple' ? 'purple' : 'pink');
          if (kind === 1 && k % 40 === 0) { g.ring(e.x, e.y, g.n(14 + lv), 2, 'rice', 'green', U.rnd(TAU)); g.ring(e.x, e.y, g.n(14 + lv), 1.5, 'rice', 'yellow', U.rnd(TAU)); }
          if (kind === 2 && k % 8 === 0) g.fan(e.x, e.y, g.aim(e.x, e.y) + Math.sin(k * 0.05) * 0.6, 3, 0.5, 2.6, 'kunai', 'red');
          if (k % 30 === 0) g.sfx('eshot');
          yield 1;
        }
        yield* g.moveTo(e, x, -60, 60, U.easeIn);
      });
    },
    // 雨
    *rain(g, lv, frames = 240, col = 'green') {
      for (let f = 0; f < frames; f += 14) {
        const x = U.rnd(30, W - 30);
        g.enemy({ x, y: -20, hp: 8 + lv, color: col, drops: { power: Math.random() < 0.4 ? 1 : 0, point: 1 } }, function* (e) {
          const sp = U.rnd(1.6, 2.4); const ft = U.rint(40, 100);
          for (let t = 0; t < 500; t++) { e.y += sp; e.x += Math.sin(t * 0.05 + x) * 0.6; if (t === ft) FIRE.aim(g, e, lv); yield 1; }
        });
        yield 14;
      }
    },
    // 左右夾擊
    *pincer(g, lv, n = 6, col = 'yellow') {
      for (let i = 0; i < n; i++) {
        for (const side of [-1, 1]) {
          const y = 90 + i * 22;
          g.enemy({ x: side < 0 ? -20 : W + 20, y, hp: 12 + lv * 2, color: col, drops: { power: 1, point: 0 } }, function* (e) {
            for (let t = 0; t < 400; t++) { e.x -= side * 2.2; if (t === 60) FIRE.ring(g, e, lv); yield 1; }
          });
        }
        yield 16;
      }
    },
    // 圓陣
    *circle(g, lv, cx = W / 2, cy = 180, col = 'pink') {
      const n = 8;
      for (let i = 0; i < n; i++) {
        const a0 = i * TAU / n;
        g.enemy({ x: cx, y: -20, hp: 14 + lv * 2, color: col, drops: { power: 1, point: 1 } }, function* (e) {
          for (let t = 0; t < 60; t++) { const k = U.easeOut(t / 60); e.x = cx + Math.cos(a0) * 110 * k; e.y = -20 + (cy + 20) * k + Math.sin(a0) * 110 * k; yield 1; }
          for (let t = 0; t < 200; t++) { const a = a0 + t * 0.02; e.x = cx + Math.cos(a) * 110; e.y = cy + Math.sin(a) * 110; if (t % 60 === 30) g.shot(e.x, e.y, a, 2 + lv * 0.1, 'orb', 'pink'); yield 1; }
          const a = a0 + 4; for (let t = 0; t < 200; t++) { e.x += Math.cos(a) * 3; e.y += Math.sin(a) * 3; yield 1; }
        });
      }
      yield 60;
    },
    // 一排射擊（有縫）
    *wall(g, lv, col = 'blue') {
      const gap = U.rint(1, 6);
      for (let i = 0; i < 8; i++) {
        if (i === gap) continue;
        const x = 36 + i * 72;
        g.enemy({ x, y: -20, hp: 18 + lv * 2, color: col, drops: { power: 1, point: 1 } }, function* (e) {
          yield* g.moveTo(e, x, 70, 40, U.easeOut);
          for (let k = 0; k < 6; k++) { g.shot(e.x, e.y, Math.PI / 2, 2.6 + lv * 0.1, 'rice', 'blue'); yield 18; }
          yield* g.moveTo(e, x, -40, 50, U.easeIn);
        });
      }
      yield 30;
    },
    // 狙擊手
    *snipers(g, lv) {
      for (const x of [60, W - 60]) {
        g.enemy({ x, y: -20, hp: 40 + lv * 6, color: 'black', drops: { power: 2, point: 2 } }, function* (e) {
          yield* g.moveTo(e, x, 60, 40, U.easeOut);
          for (let k = 0; k < 6; k++) { FIRE.kunai(g, e, lv); yield 45; }
          yield* g.moveTo(e, x, -60, 60, U.easeIn);
        });
      }
      yield 30;
    },
  };
  const rx = (n, m = 50) => Array.from({ length: n }, () => U.rnd(m, W - m));

  // 等待場上雜魚清空（最多 maxF 幀）
  function* clearWait(g, maxF = 240) { for (let i = 0; i < maxF; i++) { if (!g.enemies.some(e => !e.boss)) return; yield 1; } }
  FW.clearWait = clearWait;

  // ---------- 頭目戰共用 ----------
  function* bossBattle(g, id, phases, o = {}) {
    yield* clearWait(g, 180);
    g.clearBullets(true);
    const b = new FW.Boss(g, id, phases, { lv: o.lv || g.lv, name: o.name });
    yield* b.enter();
    if (o.pre) yield* g.talk(o.pre, g.charId, id);
    FW.Audio.play(o.music || FW.BOSSES.MUSIC[id]);
    g.stageCard = { t: 120, label: '', name: '', sub: '', music: FW.SONGS[o.music || FW.BOSSES.MUSIC[id]].title };
    yield* b.run();
    yield 90;
    if (o.post) yield* g.talk(o.post, g.charId, id);
  }
  function* midboss(g, id, phases, quip) {
    yield* clearWait(g, 120);
    const m = new FW.Boss(g, id, phases, { mid: true, lv: g.lv });
    yield* m.enter();
    if (quip) FW.HUD.say(quip, 'surprised', 200);
    yield* m.run();
  }

  // ---------- 一般關卡 ----------
  function* heroStage(g, s, bossId, midId = bossId) {
    const lv = s, cA = COLS[s % COLS.length], cB = COLS[(s + 2) % COLS.length];
    yield 220;
    yield* Wv.swoop(g, lv, 1, 8, cA); yield 60;
    yield* Wv.swoop(g, lv, -1, 8, cB); yield 90;
    yield* Wv.drop(g, lv, rx(4), cA); yield 120;
    if (s >= 2) { yield* Wv.pincer(g, lv, 5); yield 100; }
    yield* Wv.big(g, lv, W / 2, 'purple', s % 3); yield 60;
    yield* Wv.rain(g, lv, 200, cB); yield 100;
    // 中頭目
    yield* midboss(g, midId, FW.BOSSES.mid(midId, lv), FW.STORY.midQuip(g.charId, midId));
    yield 60;
    yield* Wv.circle(g, lv); yield 80;
    if (s >= 3) { yield* Wv.wall(g, lv); yield 60; yield* Wv.snipers(g, lv); }
    yield* Wv.swoop(g, lv, 1, 10, cA, 'aim3'); yield* Wv.swoop(g, lv, -1, 10, cB, 'aim3'); yield 60;
    yield* Wv.big(g, lv, W * 0.3, 'pink', (s + 1) % 3); yield 40; yield* Wv.big(g, lv, W * 0.7, 'purple', (s + 2) % 3); yield 120;
    yield* Wv.drop(g, lv, rx(6), cB, 'ring'); yield 60;
    yield* Wv.rain(g, lv, 260, cA);
    yield* bossBattle(g, bossId, FW.BOSSES.heroine(bossId, lv), { pre: FW.STORY.pre(g.charId, bossId, s), post: FW.STORY.post(g.charId, bossId, s) });
  }

  // 無涯（隱藏角色）的路線：最後一關是「主角之爭」
  const SOU_ROUTE = ['suzu', 'chiyo', 'shio', 'natsume', 'rinne'], SOU_MID = ['suzu', 'chiyo', 'akane', 'natsume', 'rinne'];
  const order = id => id === 'sou' ? SOU_ROUTE : FW.PLAYABLE.filter(c => c !== id);
  FW.STAGES = {};
  for (let s = 1; s <= 5; s++) FW.STAGES[s] = function* (g) { yield* heroStage(g, s, order(g.charId)[s - 1], g.charId === 'sou' ? SOU_MID[s - 1] : undefined); };
  // 第六關：無名（中頭目）→ 幕
  FW.STAGES[6] = function* (g) {
    const lv = 6;
    yield 220;
    yield* Wv.swoop(g, lv, 1, 10, 'red', 'aim3'); yield* Wv.swoop(g, lv, -1, 10, 'red', 'aim3'); yield 80;
    yield* Wv.wall(g, lv, 'red'); yield 40; yield* Wv.snipers(g, lv); yield 80;
    yield* Wv.big(g, lv, W / 2, 'black', 0); yield 120;
    yield* clearWait(g, 180);
    // 無名
    const n = new FW.Boss(g, 'nanashi', FW.BOSSES.nanashi(lv, false), { mid: true, lv });
    yield* n.enter();
    yield* g.talk(FW.STORY.nanashi(g.charId, false), g.charId, 'nanashi');
    yield* n.run();
    yield 60;
    yield* Wv.circle(g, lv, W / 2, 160, 'red'); yield 60;
    yield* Wv.pincer(g, lv, 7, 'red'); yield 80;
    yield* Wv.big(g, lv, W * 0.25, 'red', 1); yield* Wv.big(g, lv, W * 0.75, 'red', 2); yield 160;
    yield* Wv.rain(g, lv, 260, 'black');
    yield* bossBattle(g, 'maku', FW.BOSSES.maku(lv), { pre: FW.STORY.makuPre(g.charId), post: FW.STORY.makuPost(g.charId) });
  };
  // Extra
  FW.STAGES[7] = function* (g) {
    const lv = 7;
    yield 220;
    yield* Wv.swoop(g, lv, 1, 12, 'black', 'kunai'); yield* Wv.swoop(g, lv, -1, 12, 'white', 'kunai'); yield 60;
    yield* Wv.big(g, lv, W / 2, 'purple', 0); yield 60; yield* Wv.circle(g, lv); yield 100;
    yield* Wv.wall(g, lv, 'black'); yield* Wv.snipers(g, lv); yield 80;
    yield* clearWait(g, 180);
    const n = new FW.Boss(g, 'nanashi', FW.BOSSES.nanashi(lv, true), { mid: true, lv });
    yield* n.enter();
    yield* g.talk(FW.STORY.nanashi(g.charId, true), g.charId, 'nanashi');
    yield* n.run();
    yield 80;
    yield* Wv.pincer(g, lv, 8, 'white'); yield 60;
    yield* Wv.big(g, lv, W * 0.3, 'black', 2); yield* Wv.big(g, lv, W * 0.7, 'white', 1); yield 160;
    yield* Wv.rain(g, lv, 300, 'white');
    yield* bossBattle(g, 'maku', FW.BOSSES.trueMaku(lv), { name: '幕・真', music: 'b_true', pre: FW.STORY.truePre(g.charId), post: FW.STORY.truePost(g.charId) });
  };

  // ---------- 無盡模式 ----------
  // 難度上限固定（lv 最高 6），只要人類有時間、有操作就能一直玩下去。
  FW.Endless = function* (g) {
    const stages = [1, 2, 3, 4, 5, 6, 7];
    let cycle = 0;
    g.lives = Math.max(g.lives, 3);
    yield* g.talk(FW.STORY.endlessIntro(g.charId), g.charId, null);
    while (true) {
      const lv = Math.min(5, 2 + Math.floor(cycle / 2));   // ← 難度天花板（固定上限，不會無限變難）
      g.lv = lv; g.endlessLoops = cycle;
      const st = stages[cycle % stages.length], info = FW.STAGE_INFO[st];
      FW.Flow.setBg(g, info.bg); FW.Audio.play(info.music);
      g.stageCard = { t: 0, label: '∞ 第 ' + (cycle + 1) + ' 輪', name: info.name, sub: '難度 ' + '★'.repeat(lv - 1) + '☆'.repeat(5 - lv) + (lv >= 5 ? '（已達上限）' : ''), music: FW.SONGS[info.music].title };
      g.stageT = 0;
      yield 200;
      // 道中：隨機組合
      const pool = [
        () => Wv.swoop(g, lv, U.pick([1, -1]), 8 + lv, U.pick(COLS), U.pick(['aim', 'aim3'])),
        () => Wv.drop(g, lv, rx(4 + (lv >> 1)), U.pick(COLS), U.pick(['aim3', 'ring'])),
        () => Wv.big(g, lv, U.rnd(120, W - 120), U.pick(['purple', 'pink', 'black']), U.rint(0, 2)),
        () => Wv.rain(g, lv, 220, U.pick(COLS)),
        () => Wv.pincer(g, lv, 5 + (lv >> 1), U.pick(COLS)),
        () => Wv.circle(g, lv),
        () => Wv.wall(g, lv),
        () => Wv.snipers(g, lv),
      ];
      for (let w = 0; w < 7; w++) { yield* U.pick(pool)(); yield 70; }
      yield* clearWait(g, 200);
      // 頭目：隨機選一位
      const others = FW.PLAYABLE.filter(c => c !== g.charId);
      let bid = U.pick(others), phases;
      if (cycle % 5 === 4) { bid = U.pick(['nanashi', 'maku']); }
      if (bid === 'nanashi') phases = FW.BOSSES.nanashi(lv, true);
      else if (bid === 'maku') { const m = FW.BOSSES.maku(lv); phases = [m[0], m[1], m[2], U.pick([m[3], m[4]])]; }
      else { const all = FW.BOSSES.heroine(bid, Math.max(3, lv)); phases = [all[0], U.pick([all[1], all[3], all[4]]), all[2], U.pick([all[1], all[3], all[4]])]; if (phases[1] === phases[3]) phases.splice(3, 1); }
      const b = new FW.Boss(g, bid, phases, { lv });
      yield* b.enter();
      FW.Audio.play(FW.BOSSES.MUSIC[bid]);
      FW.HUD.say(FW.fmt(FW.STORY.endlessTaunt(bid), g), 'normal', 220);
      yield* b.run();
      // 補給：保證能持續下去
      g.dropItems(W / 2, 150, { lifepiece: 1, bombpiece: 1, full: g.power < 4 ? 1 : 0 });
      if (cycle % 2 === 1) g.dropItems(W / 2, 120, { life: 1 });
      g.collectAll = 120;
      yield 120;
      cycle++;
      // 休息時間：跟你聊天
      if (cycle % 2 === 0) yield* g.talk(FW.STORY.endlessRest(g, cycle), g.charId, U.pick(others));
      FW.Meta && FW.Meta.endlessMilestone(g);
    }
  };
})();
