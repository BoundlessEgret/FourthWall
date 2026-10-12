'use strict';
// ============================================================
//  Scenes — 標題、選單、遊戲外殼、結局、名單、設定、圖鑑、紀錄……
// ============================================================
(function () {
  const U = FW.U, Input = FW.Input, Save = FW.Save, Art = FW.Art, A = () => FW.Audio;
  const VW = FW.VW, VH = FW.VH, PF = FW.PF;
  const F = () => FW.FONT;
  const SERIF = '"Noto Serif TC","Songti TC","PMingLiU",serif';

  // ---------- 共用繪圖 ----------
  function bgGrad(ctx, t, c1 = '#120a24', c2 = '#3a1030') {
    const g = ctx.createLinearGradient(0, 0, VW, VH); g.addColorStop(0, c1); g.addColorStop(1, c2);
    ctx.fillStyle = g; ctx.fillRect(0, 0, VW, VH);
    ctx.save(); ctx.globalAlpha = 0.07; ctx.strokeStyle = '#fff'; ctx.lineWidth = 1;
    for (let i = -10; i < 30; i++) { const x = i * 60 + (t * 0.3) % 60; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x - 300, VH); ctx.stroke(); }
    ctx.restore();
    for (let i = 0; i < 40; i++) { const x = (i * 97 + t * (0.2 + (i % 5) * 0.05)) % VW, y = (i * 53 + Math.sin(t * 0.01 + i) * 30 + VH) % VH; ctx.fillStyle = `rgba(255,230,255,${0.15 + 0.15 * Math.sin(t * 0.03 + i)})`; ctx.beginPath(); ctx.arc(x, y, 1.5 + (i % 3), 0, TAU); ctx.fill(); }
  }
  FW.bgGrad = bgGrad;
  function title(ctx, s, x, y, size = 34, col = '#fff', align = 'left') { ctx.save(); ctx.font = `bold ${size}px ${F()}`; ctx.textAlign = align; ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.strokeText(s, x, y); ctx.fillStyle = col; ctx.fillText(s, x, y); ctx.restore(); }
  function text(ctx, s, x, y, size = 16, col = '#fff', align = 'left', font) { ctx.font = `${size}px ${font || F()}`; ctx.textAlign = align; ctx.fillStyle = col; ctx.fillText(s, x, y); }
  function wrapText(ctx, s, x, y, w, lh) { let line = '', yy = y; for (const c of s) { if (c === '\n' || ctx.measureText(line + c).width > w) { ctx.fillText(line, x, yy); yy += lh; line = c === '\n' ? '' : c; } else line += c; } ctx.fillText(line, x, yy); return yy; }
  FW.wrapText = wrapText;
  function panel(ctx, x, y, w, h, col = '#9a8aff', a = 0.8) { ctx.save(); ctx.fillStyle = `rgba(14,10,28,${a})`; ctx.strokeStyle = U.rgba(col, 0.8); ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(x, y, w, h, 12); ctx.fill(); ctx.stroke(); ctx.restore(); }
  function menuList(ctx, items, sel, x, y, lh = 40, size = 22, align = 'left', t = 0) {
    FW._menuRects = items.map((it, i) => ({ x: align === 'left' ? x - 20 : x - 180, y: y + i * lh - size - 4, w: 340, h: lh, i }));
    items.forEach((it, i) => {
      const on = i === sel, dis = it.disabled;
      ctx.save(); ctx.font = `${on ? 'bold ' : ''}${size}px ${F()}`; ctx.textAlign = align;
      const xx = x + (on ? 14 + Math.sin(t * 0.15) * 2 : 0);
      if (on) { ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(align === 'left' ? x - 10 : x - 160, y + i * lh - size, 330, size + 12); ctx.fillStyle = '#ff9ad6'; ctx.fillText('❯', xx - 22, y + i * lh); }
      ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.strokeText(it.label, xx, y + i * lh);
      ctx.fillStyle = dis ? '#6a6a80' : on ? '#ffffff' : '#c8c0e8'; ctx.fillText(it.label, xx, y + i * lh);
      if (on && it.desc) { ctx.font = `13px ${F()}`; ctx.fillStyle = '#b8b0d8'; }
      ctx.restore();
    });
  }
  function menuNav(sel, n, opt = {}) {
    if (FW._tapItem !== undefined && FW._tapItem < n) { const i = FW._tapItem; FW._tapItem = undefined; if (i === sel) Input.vhit.confirm = true; else { sel = i; A().sfx('cursor'); } return sel; }
    if (Input.repeat(opt.h ? 'left' : 'up')) { sel = (sel + n - 1) % n; A().sfx('cursor'); }
    if (Input.repeat(opt.h ? 'right' : 'down')) { sel = (sel + 1) % n; A().sfx('cursor'); }
    return sel;
  }
  FW.menuNav = menuNav;
  const look = (px, py) => { const m = Input.mouse; if (!m.inside) return { x: 0, y: 0 }; return { x: U.clamp((m.x - px) / 160, -3, 3), y: U.clamp((m.y - py) / 200, -2, 2.5) }; };

  // ---------- 場景管理 ----------
  const SM = FW.SM = {
    cur: null, next: null, fade: 0, fadeDir: 0,
    go(scene, instant) { if (instant) { this.cur = scene; scene.enter && scene.enter(); return; } this.next = scene; this.fadeDir = 1; },
    update() {
      if (this.fadeDir === 1) { this.fade += 0.08; if (this.fade >= 1) { this.fade = 1; this.cur = this.next; this.next = null; this.cur.enter && this.cur.enter(); this.fadeDir = -1; } return; }
      if (this.fadeDir === -1) { this.fade -= 0.08; if (this.fade <= 0) { this.fade = 0; this.fadeDir = 0; } }
      this.cur && this.cur.update();
    },
    draw(ctx) { this.cur && this.cur.draw(ctx); if (this.fade > 0) { ctx.fillStyle = `rgba(0,0,0,${this.fade})`; ctx.fillRect(-100, -100, VW + 200, VH + 200); } },
  };

  // ---------- 成就 ----------
  FW.ACHIEVEMENTS = [
    { id: 'boot', name: '按下開始', desc: '第一次打開這款遊戲。' },
    { id: 'firstspell', name: '收取！', desc: '第一次收取符卡。' },
    { id: 'clear', name: '謝幕', desc: '以任意角色通關。' },
    { id: 'nocont', name: '一次也沒有按「繼續」', desc: '不接關通關。' },
    { id: 'hard', name: '真的不難嗎？', desc: '以困難難度通關。' },
    { id: 'allclear', name: '全員主角', desc: '六位角色全部通關。' },
    { id: 'extra', name: '螢幕之外', desc: '通過 Extra 關卡，看見真結局。' },
    { id: 'endless10', name: '幕間休息', desc: '在無盡幕間存活 10 分鐘。' },
    { id: 'endless30', name: '長篇連載', desc: '在無盡幕間存活 30 分鐘。' },
    { id: 'endless60', name: '真的無限', desc: '在無盡幕間存活 1 小時。……記得喝水。' },
    { id: 'allbombs', name: '第四面牆已損毀', desc: '看過全部六種符卡演出。' },
    { id: 'pausetalk', name: '我們都醒著', desc: '暫停超過一分鐘。' },
    { id: 'tabaway', name: '你剛剛去哪了？', desc: '在遊戲中切換到別的分頁再回來。' },
    { id: 'latenight', name: '夜貓子', desc: '在凌晨 1 點到 5 點之間遊玩。' },
    { id: 'quit', name: '晚安', desc: '從選單選擇「離開」。' },
    { id: 'poke', name: '請不要戳了', desc: '在角色圖鑑裡戳同一個人很多次。' },
    { id: 'deaths50', name: '沒關係的', desc: '累計倒下 50 次。她們都在等你。' },
    { id: 'graze', name: '擦肩而過', desc: '累計擦彈 5000 次。' },
    { id: 'boots10', name: '常客', desc: '打開遊戲 10 次。' },
    { id: 'wipe', name: '……你好？', desc: '刪除存檔後重新開始。' },
    { id: 'fw', name: 'Forever Waiting', desc: '看完幕間劇場「F W」。' },
  ];

  // ---------- Meta（第四面牆的小動作） ----------
  const Meta = FW.Meta = {
    onDeath(g) {
      const d = Save.data.deaths, n = g.ch.name;
      const lines = ['沒關係，再來一次。', '剛剛那個……真的很難躲。', '我還在，你也還在。', '深呼吸。我們不趕時間。'];
      let s = U.pick(lines);
      if (d % 25 === 0 && d > 0) s = `你已經倒下 ${d} 次了。……但你每次都回來了。`;
      if (FW.Real.isLate() && Math.random() < 0.3) s = `現在是 ${FW.Real.hhmm()}……累的話，明天再來也可以喔。`;
      FW.HUD.say(s, 'sad', 220);
      if (d >= 50) Save.unlock('deaths50');
    },
    endlessMilestone(g) {
      const m = g.endlessTime / 3600;
      if (m >= 10) Save.unlock('endless10'); if (m >= 30) Save.unlock('endless30'); if (m >= 60) Save.unlock('endless60');
    },
    check() {
      if (FW.Real.isLate()) Save.unlock('latenight');
      if (Save.data.boots >= 10) Save.unlock('boots10');
      if (Save.data.grazeTotal >= 5000) Save.unlock('graze');
      const bb = Save.data.bombsByChar || {};
      if (FW.PLAYABLE.every(c => bb[c])) Save.unlock('allbombs');
    },
  };

  // ---------- 標題 ----------
  const TitleScene = FW.TitleScene = function () {
    const s = { sel: 0, t: 0, idle: 0, greet: null, noTapConfirm: true };
    const items = () => {
      const ex = Save.anyClear();
      return [
        { label: '開始遊戲', act: () => SM.go(CharSelect('story')) },
        { label: ex ? 'Extra 開始' : 'Extra（未解鎖）', disabled: !ex, act: () => SM.go(CharSelect('extra')) },
        { label: '無盡幕間 ∞', act: () => SM.go(CharSelect('endless')) },
        { label: '符卡練習', act: () => SM.go(Practice()) },
        { label: '角色圖鑑', act: () => SM.go(Gallery()) },
        { label: '音樂室', act: () => SM.go(MusicRoom()) },
        { label: Save.data.fwTheater ? '幕間劇場「F W」' : '幕間劇場「？？」', act: () => FW.openTheater() },
        { label: '紀錄與成就', act: () => SM.go(Records()) },
        { label: '設定', act: () => SM.go(Options()) },
        { label: '離開', act: () => SM.go(Quit()) },
      ];
    };
    s.enter = () => {
      A().play('title'); FW.Title.reset();
      const d = Save.data;
      const since = FW.Real.sinceText(Save.prevQuit || Save.prevBoot);
      let g;
      if (Save.isFirst && d.boots <= 1) g = ['normal', '……啊。初次見面。我是玲音，這款遊戲的主角。……大概。'];
      else if (FW.Real.isLate()) g = ['tired', `現在是 ${FW.Real.hhmm()}……這麼晚了，還來找我們嗎？`];
      else if (d.lastStageReached && !Save.anyClear() && Save.isReturn) g = ['smile', `歡迎回來。上次你在 ${d.lastStageReached.stage >= 7 ? 'Extra' : 'Stage ' + d.lastStageReached.stage} 停下來了呢。`];
      else if (since && Save.isReturn) g = ['happy', `歡迎回來！上次見面是${since}。這是你第 ${d.boots} 次打開遊戲喔。`];
      else if (d.trueEnd) g = ['smile', '窗戶開著喔。想進來的時候，隨時都可以。'];
      else g = ['smile', `${FW.Real.partOfDay()}好。今天也請多指教。`];
      s.greet = { expr: g[0], text: g[1], t: 0 };
      Save.isReturn = false;
      Save.unlock('boot'); Meta.check();
    };
    s.update = () => {
      s.t++; s.idle++;
      const it = items();
      const ns = menuNav(s.sel, it.length);
      if (ns !== s.sel) { s.sel = ns; s.idle = 0; }
      if (Input.anyKeyFrame || Input.mouse.clicked) s.idle = 0;
      if (Input.hit('confirm')) { const i = it[s.sel]; if (i.disabled) { A().sfx('back'); s.greet = { expr: 'smug', text: '那個……要先通關一次才行喔。', t: 0 }; } else { A().sfx('select'); i.act(); } }
      if (Input.hit('cancel')) { s.sel = it.length - 1; A().sfx('cursor'); }
      // 彩蛋：在標題畫面打 F、W
      for (const k of Input.frameKeys || []) {
        if (k === 'KeyF') s.fKey = s.t;
        else if (k === 'KeyW' && s.fKey && s.t - s.fKey < 60) { s.fKey = 0; s.greet = { expr: 'surprised', text: '……你剛剛是不是打了「F」「W」？等等，那個縮寫……', t: 0 }; A().sfx('select'); s.fwGo = 90; }
      }
      if (s.fwGo > 0 && --s.fwGo === 0) FW.openTheater();
      if (s.idle === 60 * 40) s.greet = { expr: 'surprised', text: '……你還在嗎？畫面一直停在這裡耶。', t: 0 };
      if (s.idle === 60 * 90) s.greet = { expr: 'smile', text: '沒關係，我們等你。慢慢來。', t: 0 };
      if (s.greet) s.greet.t++;
    };
    s.draw = (ctx) => {
      const t = s.t;
      bgGrad(ctx, t, '#100820', '#40102a');
      // 牆的格紋
      ctx.save(); ctx.globalAlpha = 0.08; ctx.strokeStyle = '#ffd0e0';
      for (let i = 0; i < 12; i++) { ctx.beginPath(); ctx.moveTo(0, 60 * i + (t * 0.2) % 60); ctx.lineTo(VW, 60 * i + (t * 0.2) % 60); ctx.stroke(); }
      ctx.restore();
      // 角色們
      const order = ['natsume', 'akane', 'chiyo', 'shio', 'suzu', 'rinne'];
      const pos = { natsume: [120, 470, 0.66], akane: [225, 450, 0.7], chiyo: [440, 470, 0.66], shio: [540, 455, 0.7], suzu: [640, 480, 0.64], rinne: [330, 430, 0.82] };
      for (const id of order) {
        const [x, y, sc] = pos[id];
        const bob = Math.sin(t * 0.02 + x) * 4;
        Art.portrait(ctx, FW.CHARS[id].spec, x, y + bob, sc, { t: t + x, expr: id === 'rinne' && s.greet && s.greet.t < 400 ? s.greet.expr : 'normal', look: look(x, y), talking: id === 'rinne' && s.greet && s.greet.t < s.greet.text.length * 2 });
      }
      const fg = ctx.createLinearGradient(0, 520, 0, VH); fg.addColorStop(0, 'rgba(16,8,32,0)'); fg.addColorStop(1, 'rgba(16,8,32,0.95)');
      ctx.fillStyle = fg; ctx.fillRect(0, 520, VW, 200);
      // 布幕
      for (const sd of [0, 1]) { ctx.save(); if (sd) { ctx.translate(VW, 0); ctx.scale(-1, 1); } const cg = ctx.createLinearGradient(0, 0, 70, 0); cg.addColorStop(0, '#3a0610'); cg.addColorStop(1, 'rgba(140,20,40,0.6)'); ctx.fillStyle = cg; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(90, 0); for (let y = 0; y <= VH; y += 30) ctx.lineTo(60 + Math.sin(y * 0.02 + t * 0.02) * 10 - y * 0.03, y); ctx.lineTo(0, VH); ctx.fill(); ctx.restore(); }
      // 標誌
      ctx.save();
      ctx.font = `bold 84px ${SERIF}`; ctx.textAlign = 'center';
      ctx.shadowColor = '#ff4a7a'; ctx.shadowBlur = 24; ctx.fillStyle = '#fff'; ctx.fillText('第四面牆', 360, 128);
      ctx.shadowBlur = 0; ctx.font = `italic 20px ${SERIF}`; ctx.fillStyle = '#ffc8d8'; ctx.fillText(Save.data.fwTheater && Math.floor(t / 600) % 3 === 2 ? 'FW ～ Forever Waiting' : 'FourthWall ～ Behind the Bullet Curtain', 360, 164);
      ctx.restore();
      // 選單
      panel(ctx, 708, 190, 236, 430, '#ff9ad6', 0.65);
      menuList(ctx, items(), s.sel, 738, 230, 39, 20, 'left', t);
      // 招呼
      if (s.greet) {
        panel(ctx, 40, 640, 640, 60, '#5a8cff', 0.85);
        ctx.fillStyle = '#5a8cff'; ctx.beginPath(); ctx.roundRect(54, 628, 74, 24, 6); ctx.fill(); text(ctx, '玲音', 91, 646, 14, '#fff', 'center');
        text(ctx, s.greet.text.slice(0, Math.floor(s.greet.t * 0.6)), 60, 678, 17, '#fff');
      }
      text(ctx, FW.touchMode ? '點選項目，再點一次決定' : 'Z 決定　X 取消　方向鍵 移動', 940, 700, 12, '#8a80a8', 'right');
      text(ctx, 'ver 1.0　' + FW.Real.hhmm(), 940, 24, 12, '#8a80a8', 'right');
    };
    return s;
  };

  // ---------- 角色選擇 ----------
  const CharSelect = FW.CharSelect = function (mode) {
    const s = { t: 0, idx: FW.PLAYABLE.indexOf(Save.data.lastChar || 'rinne'), step: 0, diff: ['easy', 'normal', 'hard'].indexOf(Save.data.lastDiff || 'normal'), anim: 0 };
    if (s.idx < 0) s.idx = 0; if (s.diff < 0) s.diff = 1;
    s.enter = () => A().play('select');
    s.update = () => {
      s.t++; s.anim = Math.min(1, s.anim + 0.08);
      if (s.step === 0) {
        if (FW._tapItem !== undefined) { const i = FW._tapItem; FW._tapItem = undefined; if (i === s.idx) Input.vhit.confirm = true; else { s.idx = i; s.anim = 0; A().sfx('cursor'); } }
        if (Input.repeat('left')) { s.idx = (s.idx + 5) % 6; s.anim = 0; A().sfx('cursor'); }
        if (Input.repeat('right')) { s.idx = (s.idx + 1) % 6; s.anim = 0; A().sfx('cursor'); }
        if (Input.hit('confirm')) { A().sfx('select'); if (mode === 'extra') start(); else s.step = 1; }
        if (Input.hit('cancel')) { A().sfx('back'); SM.go(TitleScene()); }
      } else {
        s.diff = menuNav(s.diff, 3, { h: false });
        if (Input.hit('confirm')) { A().sfx('select'); start(); }
        if (Input.hit('cancel')) { A().sfx('back'); s.step = 0; }
      }
    };
    function start() {
      const id = FW.PLAYABLE[s.idx], diff = mode === 'extra' ? 'normal' : ['easy', 'normal', 'hard'][s.diff];
      Save.data.lastChar = id; Save.data.lastDiff = diff; Save.data.seenChars[id] = true; Save.write();
      SM.go(GameScene({ mode, char: id, diff }));
    }
    s.draw = (ctx) => {
      const ch = FW.CHARS[FW.PLAYABLE[s.idx]], t = s.t;
      bgGrad(ctx, t, U.shade(ch.color, -0.85), U.shade(ch.color, -0.6));
      ctx.save(); ctx.globalAlpha = 0.08; ctx.font = `bold 160px ${F()}`; ctx.fillStyle = '#fff'; ctx.fillText(ch.reading.toUpperCase(), -40 + (t * 0.5) % 200 - 100, 700); ctx.restore();
      const k = U.easeOut(s.anim);
      Art.portrait(ctx, ch.spec, 230 + (1 - k) * -60, 300, 1.55, { t, expr: s.step === 1 ? 'happy' : 'smile', look: look(230, 300) });
      ctx.save(); ctx.globalAlpha = 1; title(ctx, { story: '開始遊戲', extra: 'Extra Stage', endless: '無盡幕間 ∞' }[mode], 470, 60, 26, '#ffd8e8'); ctx.restore();
      panel(ctx, 460, 80, 470, 470, ch.color, 0.8);
      title(ctx, ch.name, 490, 140, 44, '#fff'); text(ctx, ch.reading, 490 + ch.name.length * 46 + 10, 140, 18, U.mix(ch.color, '#ffffff', 0.5));
      text(ctx, '「' + ch.title + '」', 490, 175, 18, '#ffd8a8');
      ctx.fillStyle = U.rgba(ch.color, 0.25); ctx.fillRect(480, 192, 430, 2);
      text(ctx, '射擊：' + ch.shotName, 490, 222, 17, '#fff'); ctx.font = `14px ${F()}`; ctx.fillStyle = '#d0c8e8'; wrapText(ctx, ch.shotDesc, 490, 246, 420, 20);
      text(ctx, '符卡：' + ch.bombName, 490, 300, 17, '#fff'); ctx.font = `14px ${F()}`; ctx.fillStyle = '#d0c8e8'; wrapText(ctx, ch.bombDesc, 490, 324, 420, 20);
      ctx.font = `14px ${F()}`; ctx.fillStyle = '#b8b0d0'; wrapText(ctx, ch.profile[0] + ch.profile[1], 490, 380, 420, 21);
      const spd = ch.speed; text(ctx, '移動速度 ' + '■'.repeat(Math.round((spd - 3.8) * 5)) + '□'.repeat(Math.max(0, 6 - Math.round((spd - 3.8) * 5))), 490, 520, 14, '#ffe9a8');
      const c = Save.data.clears[ch.id];
      if (c && c.story) text(ctx, '通關：' + ['easy', 'normal', 'hard'].filter(d => c.story[d]).map(d => FW.DIFF[d].label).join('／'), 700, 520, 14, '#9af0b0');
      // 角色列
      FW.PLAYABLE.forEach((id, i) => {
        const x = 520 + i * 70, y = 640, on = i === s.idx;
        ctx.save(); ctx.globalAlpha = on ? 1 : 0.5;
        ctx.beginPath(); ctx.arc(x, y - 20, on ? 34 : 28, 0, TAU); ctx.fillStyle = U.rgba(FW.CHARS[id].color, on ? 0.5 : 0.2); ctx.fill();
        Art.chibi(ctx, FW.CHARS[id].spec, x, y - 30, on ? 0.2 : 0.17, { t: t + i * 30, lean: 0 });
        ctx.restore();
      });
      text(ctx, FW.touchMode ? '點頭像選擇角色，再點一次決定' : '◀ ▶ 選擇角色', 520, 700, 13, '#b8b0d8');
      if (s.step === 0) FW._menuRects = FW.PLAYABLE.map((id, i) => ({ x: 485 + i * 70, y: 590, w: 70, h: 90, i }));
      if (s.step === 1) {
        ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(0, 0, VW, VH);
        panel(ctx, 330, 220, 300, 250, '#fff', 0.92);
        title(ctx, '難度選擇', 480, 266, 26, '#fff', 'center');
        ['easy', 'normal', 'hard'].forEach((d, i) => {
          const D = FW.DIFF[d], on = i === s.diff, y = 316 + i * 52;
          ctx.fillStyle = on ? U.rgba(D.col, 0.35) : 'rgba(255,255,255,0.05)'; ctx.fillRect(350, y - 28, 260, 42);
          title(ctx, D.name, 370, y, 24, on ? D.col : '#8a8aa0'); text(ctx, D.label + (d === 'easy' ? '・殘機 4' : ''), 590, y, 15, '#ddd', 'right');
        });
        FW._menuRects = [0, 1, 2].map(i => ({ x: 350, y: 316 + i * 52 - 28, w: 260, h: 44, i }));
        text(ctx, mode === 'endless' ? '無盡模式的難度上限也會依此調整' : '即使是困難，也比你想像中溫柔一點', 480, 456, 12, '#b8b0d8', 'center');
      }
    };
    return s;
  };

  // ---------- 遊戲外殼 ----------
  const GameScene = FW.GameScene = function (opt) {
    const s = { g: new FW.Game(opt), paused: false, psel: 0, pauseT: 0, cont: false, csel: 0, opt };
    s.enter = () => { FW.HUD.whisper = null; };
    s.update = () => {
      const g = s.g;
      if (FW.tabReturn) { FW.tabReturn = false; if (!s.paused && !s.cont) { s.paused = true; s.pauseT = 0; } FW.HUD.say('……你剛剛去哪了？我們一直在等你喔。', 'surprised', 300); Save.unlock('tabaway'); }
      if (s.cont) return contUpdate();
      if (s.paused) return pauseUpdate();
      if (Input.hit('pause') && !g.over) { s.paused = true; s.psel = 0; s.pauseT = 0; A().sfx('pause'); A().setDuck(0.3); return; }
      g.update();
      if (g.over) { s.cont = true; s.csel = 0; s.contT = 0; A().play('gameover'); }
      if (g.result) finish();
    };
    function pauseUpdate() {
      s.pauseT++;
      s.g.player.t++;
      if (s.pauseT === 60 * 20) FW.HUD.say('……暫停中。不過我們還醒著喔。', 'normal', 300);
      if (s.pauseT === 60 * 60) { FW.HUD.say('一分鐘了。你在泡茶嗎？我也想喝。', 'smile', 300); Save.unlock('pausetalk'); }
      if (s.pauseT === 60 * 180) FW.HUD.say('……要不要乾脆休息一下？存檔不會跑掉的。', 'tired', 400);
      const items = 4;
      s.psel = menuNav(s.psel, items);
      if ((Input.hit('pause') || Input.hit('cancel')) && s.pauseT > 2) { s.paused = false; A().setDuck(1); return; }
      if (Input.hit('confirm')) {
        A().sfx('select');
        if (s.psel === 0) { s.paused = false; A().setDuck(1); }
        else if (s.psel === 1) { A().setDuck(1); SM.go(GameScene(s.opt)); }
        else if (s.psel === 2) { A().setDuck(1); Save.write(); SM.go(TitleScene()); }
        else if (s.psel === 3) { Save.data.settings.shake = !Save.data.settings.shake; }
      }
    }
    function contUpdate() {
      s.contT++;
      s.csel = menuNav(s.csel, 2, { h: false });
      if (Input.hit('confirm') && s.contT > 30) {
        A().sfx('select');
        const g = s.g;
        if (s.csel === 0) {
          s.cont = false; g.over = false; g.continues++; Save.data.continues++;
          g.lives = g.D.lives - 1; g.bombs = 3; g.score = g.continues; g.player.invuln = 180; g.player.dead = 0;
          g.noContTime = 0; g.clearBullets(false); g.lasers.length = 0;
          const mus = g.boss ? FW.BOSSES.MUSIC[g.boss.charId] : (FW.STAGE_INFO[g.stage] || {}).music;
          if (g.boss && g.boss.name === '幕・真') A().play('b_true'); else if (mus) A().play(mus);
          FW.HUD.say(g.mode === 'endless' ? '繼續！時間不會歸零，但分數會喔。' : '……歡迎回來。我們繼續吧。', 'smile', 240);
        } else { recordScore(); SM.go(TitleScene()); }
      }
    }
    function recordScore() {
      const g = s.g, d = Save.data;
      if (g.score > (d.hi[g.hiKey] || 0)) d.hi[g.hiKey] = Math.floor(g.score);
      if (g.mode === 'endless') {
        const b = d.endlessBest[g.charId] || { time: 0, loops: 0, score: 0, nocont: 0 };
        b.time = Math.max(b.time, g.endlessTime / 60); b.loops = Math.max(b.loops, g.endlessLoops); b.score = Math.max(b.score, g.score); b.nocont = Math.max(b.nocont || 0, g.noContTime / 60);
        d.endlessBest[g.charId] = b;
      }
      Save.write();
    }
    function finish() {
      const g = s.g, r = g.result;
      recordScore();
      if (r.kind === 'practice') { SM.go(Practice()); return; }
      const d = Save.data, c = d.clears[g.charId] = d.clears[g.charId] || { story: {}, extra: false };
      let kind;
      if (r.kind === 'story') {
        if (g.continues === 0) { c.story[g.diff] = true; c.anyClear = true; Save.unlock('clear'); Save.unlock('nocont'); if (g.diff === 'hard') Save.unlock('hard'); kind = 'good'; d.endings[g.charId] = true; }
        else { kind = 'bad'; d.endings['bad'] = true; c.story[g.diff] = c.story[g.diff] || false; Save.unlock('clear'); c.anyClear = true; }
        if (FW.PLAYABLE.every(id => d.clears[id] && Object.values(d.clears[id].story || {}).some(Boolean))) Save.unlock('allclear');
      } else { c.extra = true; d.trueEnd = true; d.endings['true'] = true; Save.unlock('extra'); kind = 'true'; }
      Save.write();
      SM.go(EndingScene(g.charId, kind));
    }
    s.draw = (ctx) => {
      const g = s.g;
      drawGame(ctx, g);
      if (s.paused) {
        ctx.fillStyle = 'rgba(10,8,20,0.55)'; ctx.fillRect(PF.x, PF.y, PF.w, PF.h);
        panel(ctx, PF.x + 150, 230, 276, 250, g.ch.color, 0.9);
        title(ctx, '— PAUSE —', PF.x + 288, 276, 28, '#fff', 'center');
        menuList(ctx, [{ label: '繼續遊戲' }, { label: '重新開始' }, { label: '回到標題' }, { label: '畫面震動：' + (Save.data.settings.shake ? '開' : '關') }], s.psel, PF.x + 190, 330, 38, 19, 'left', g.t + s.pauseT);
        text(ctx, '暫停時間 ' + U.fmtTime(s.pauseT / 60), PF.x + 288, 470, 12, '#9a90b8', 'center');
      }
      if (s.cont) {
        ctx.fillStyle = 'rgba(0,0,0,0.65)'; ctx.fillRect(PF.x, PF.y, PF.w, PF.h);
        Art.portrait(ctx, g.ch.spec, PF.x + 105, 380, 0.85, { t: g.t + s.contT, expr: s.csel === 0 ? 'sad' : 'cry' });
        title(ctx, '還要繼續嗎？', PF.x + 380, 250, 30, '#fff', 'center');
        text(ctx, `剩餘接關次數：∞（已使用 ${g.continues} 次）`, PF.x + 380, 285, 13, '#c8c0e0', 'center');
        menuList(ctx, [{ label: '是' }, { label: '否' }], s.csel, PF.x + 350, 350, 44, 24, 'left', s.contT);
        ctx.font = `14px ${F()}`; ctx.fillStyle = '#ffd8e0'; ctx.textAlign = 'center';
        const msg = s.csel === 0 ? '「……我就知道你會按『是』。」' : '「……要走了嗎？那，下次見。」';
        ctx.fillText(msg, PF.x + 380, 470);
        if (g.mode === 'story') { ctx.font = `12px ${F()}`; ctx.fillStyle = '#9a90b8'; ctx.fillText('※ 接關後通關，會看到不一樣的結局', PF.x + 380, 500); }
      }
    };
    return s;
  };

  // 遊戲畫面的合成
  function drawGame(ctx, g) {
    const sh = g.shakeAmt, sx = sh ? U.rnd(-sh, sh) : 0, sy = sh ? U.rnd(-sh, sh) : 0;
    ctx.save(); ctx.translate(sx, sy);
    // 外框背景
    const bg = ctx.createLinearGradient(0, 0, 0, VH); bg.addColorStop(0, '#191530'); bg.addColorStop(1, '#2a1838');
    ctx.fillStyle = bg; ctx.fillRect(-20, -20, VW + 40, VH + 40);
    if (FW.portraitView) miniHUD(ctx, g); else FW.HUD.draw(ctx, g);
    if (g.hudPing > 0) { g.hudPing--; ctx.fillStyle = `rgba(255,154,60,${g.hudPing / 40})`; ctx.fillRect(PF.x + PF.w, PF.y, 20, PF.h); }
    // 遊戲區
    const fc = FW.fieldCanvas, fx = FW.fieldCtx, k = FW.fieldScale;
    fx.setTransform(k, 0, 0, k, 0, 0);
    fx.clearRect(0, 0, PF.w, PF.h);
    fx.save(); fx.beginPath(); fx.rect(0, 0, PF.w, PF.h); fx.clip();
    g.drawField(fx);
    fx.restore();
    const st = g.fieldStretch || 1;
    ctx.drawImage(fc, 0, 0, fc.width, fc.height, PF.x, PF.y, PF.w * st, PF.h);
    ctx.strokeStyle = st > 1.01 ? '#ff9a3c' : 'rgba(200,180,255,0.6)'; ctx.lineWidth = st > 1.01 ? 4 : 2; ctx.strokeRect(PF.x - 1, PF.y - 1, PF.w * st + 2, PF.h + 2);
    if (g.bombFx && g.bombFx.drawScreen) g.bombFx.drawScreen(ctx);
    ctx.restore();
    if (g.bombFx && g.bombFx.post) g.bombFx.post(ctx, FW.canvas);
  }

  // 手機直式用的精簡 HUD（畫在遊戲區上方）
  function miniHUD(ctx, g) {
    const x0 = PF.x, y0 = PF.y - 80, w = PF.w;
    ctx.save();
    ctx.fillStyle = 'rgba(20,14,40,0.95)'; ctx.fillRect(x0 - 4, y0 - 4, w + 8, 80);
    ctx.textAlign = 'left'; ctx.font = `bold 26px ${F()}`; ctx.fillStyle = '#fff'; ctx.fillText(U.fmtScore(g.score), x0 + 6, y0 + 30);
    ctx.font = `15px ${F()}`; ctx.fillStyle = '#a8a0c8'; ctx.fillText('HI ' + U.fmtScore(g.hi), x0 + 6, y0 + 52);
    const lifeSp = FW.Sprites.item('life'), bombSp = FW.Sprites.item('bomb');
    for (let i = 0; i < Math.min(8, g.lives); i++) ctx.drawImage(lifeSp.c, x0 + w - 26 - i * 24, y0 + 8, 24, 24);
    for (let i = 0; i < Math.min(8, g.bombs); i++) ctx.drawImage(bombSp.c, x0 + w - 26 - i * 24, y0 + 36, 24, 24);
    ctx.font = `15px ${F()}`; ctx.fillStyle = '#ff9a9a'; ctx.fillText('P ' + g.power.toFixed(2), x0 + 230, y0 + 30);
    ctx.fillStyle = '#e0e0f0'; ctx.fillText('擦彈 ' + g.graze, x0 + 230, y0 + 52);
    ctx.fillStyle = '#ffe9a8'; ctx.fillText(g.mode === 'endless' ? '∞ ' + U.fmtTime(g.endlessTime / 60) : g.stage >= 7 ? 'Extra' : 'St.' + g.stage, x0 + 230 - 2, y0 + 72);
    ctx.font = `11px ${F()}`; ctx.fillStyle = '#b8b0d8'; ctx.fillText(FW.DIFF[g.diff].name, x0 + 6, y0 + 72);
    if (FW.HUD.whisper) {
      const wsp = FW.HUD.whisper, a = Math.min(1, FW.HUD.whisperT / 10) * Math.min(1, (wsp.dur - FW.HUD.whisperT) / 15);
      if (FW.HUD.whisperT > wsp.dur) FW.HUD.whisper = null;
      else { ctx.globalAlpha = Math.max(0, a); ctx.fillStyle = 'rgba(255,255,255,0.95)'; ctx.beginPath(); ctx.roundRect(x0 + 4, PF.y + PF.h - 52, w - 8, 40, 10); ctx.fill(); ctx.fillStyle = '#2a2040'; ctx.font = `15px ${F()}`; ctx.fillText(g.ch.name + '：' + wsp.text.slice(0, Math.floor(FW.HUD.whisperT * 0.8)), x0 + 16, PF.y + PF.h - 26); }
    }
    ctx.restore();
  }

  // ---------- 結局 ----------
  const EndingScene = FW.EndingScene = function (charId, kind) {
    const fake = { ch: FW.CHARS[charId], t: 0 };
    const pages = kind === 'good' ? FW.STORY.ENDINGS[charId] : kind === 'bad' ? FW.STORY.BAD(charId) : FW.STORY.TRUE(charId);
    const s = { i: 0, t: 0, shown: 0 };
    const label = { good: `Ending No.${FW.PLAYABLE.indexOf(charId) + 1}　${FW.CHARS[charId].name}・Good Ending`, bad: `Ending No.${FW.PLAYABLE.indexOf(charId) + 7}　${FW.CHARS[charId].name}・Bad Ending`, true: 'True Ending　第四面牆的這一側' }[kind];
    s.enter = () => { A().play('ending'); };
    s.update = () => {
      s.t++;
      const p = pages[s.i], txt = FW.fmt(p[2], fake);
      s.shown = Math.min(txt.length, s.shown + (Input.held('skip') ? 4 : 0.5));
      if (Input.hit('confirm') || (Input.held('skip') && s.t % 8 === 0)) {
        if (s.shown < txt.length) s.shown = txt.length;
        else { s.i++; s.shown = 0; if (s.i >= pages.length) SM.go(Credits(kind, charId)); }
      }
    };
    s.draw = (ctx) => {
      const p = pages[Math.min(s.i, pages.length - 1)], ch = p[0] ? FW.CHARS[p[0]] : FW.CHARS[charId];
      bgGrad(ctx, s.t, kind === 'bad' ? '#0a0a12' : '#1a1030', kind === 'bad' ? '#1a1a2a' : U.shade(ch.color, -0.7));
      if (kind !== 'bad') { ctx.save(); ctx.globalAlpha = 0.25 + 0.1 * Math.sin(s.t * 0.02); const lg = ctx.createRadialGradient(480, 200, 10, 480, 200, 500); lg.addColorStop(0, '#fff8e0'); lg.addColorStop(1, 'rgba(255,248,224,0)'); ctx.fillStyle = lg; ctx.fillRect(0, 0, VW, VH); ctx.restore(); }
      Art.portrait(ctx, ch.spec, 480, 300, 1.45, { t: s.t, expr: p[1], talking: s.shown < FW.fmt(p[2], fake).length });
      const fg = ctx.createLinearGradient(0, 430, 0, VH); fg.addColorStop(0, 'rgba(0,0,0,0)'); fg.addColorStop(1, 'rgba(0,0,0,0.85)'); ctx.fillStyle = fg; ctx.fillRect(0, 430, VW, 290);
      panel(ctx, 80, 540, 800, 140, ch.color, 0.85);
      ctx.font = `20px ${SERIF}`; ctx.fillStyle = '#fff'; ctx.textAlign = 'left';
      wrapText(ctx, FW.fmt(p[2], fake).slice(0, Math.floor(s.shown)), 110, 584, 740, 32);
      text(ctx, label, 940, 30, 14, '#ffe9a8', 'right');
      text(ctx, (s.i + 1) + ' / ' + pages.length, 860, 668, 12, '#a8a0c8', 'right');
    };
    return s;
  };

  // ---------- 片尾名單 ----------
  const Credits = FW.Credits = function (kind, charId) {
    const lines = [
      ['big', '第四面牆'], ['sub', 'FourthWall ～ Behind the Bullet Curtain'], ['', ''], ['', ''],
      ['h', '主演'], ['', '玲音　千代　茜'], ['', '汐　棗　鈴'], ['', ''],
      ['h', '友情演出'], ['', '無名（untitled_character_07）'], ['', '幕'], ['', ''],
      ['h', '企劃・程式・美術・音樂・劇本'], ['', 'Claude'], ['', ''],
      ['h', '所有角色皆為原創角色'], ['', '所有圖像皆以向量即時繪製，所有音樂皆即時合成'], ['', ''],
      ['h', '測試遊玩'], ['', '你'], ['', ''],
      ['h', '本次遊玩'], ['', '總遊玩時間　' + U.fmtTime(Save.data.playTime)], ['', '倒下次數　' + Save.data.deaths], ['', '使用符卡　' + Save.data.bombs + ' 次'], ['', '擦彈　' + Save.data.grazeTotal + ' 次'], ['', ''],
      ['h', '特別感謝'], ['', '還沒關掉遊戲的你'], ['', ''], ['', ''],
      ['big', kind === 'true' ? '「無盡幕間」已開放' : kind === 'good' ? 'Extra Stage 已解鎖' : 'Extra Stage 已解鎖（下次試著不接關吧）'],
      ['', ''], ['', ''], ['sub', '……片尾結束了。'], ['sub', '但是，故事還沒有。'],
    ];
    const s = { y: VH + 40, t: 0 };
    s.enter = () => A().play('credits');
    s.update = () => {
      s.t++; s.y -= Input.held('confirm') || Input.held('skip') ? 4 : 0.9;
      const end = s.y + lines.length * 46;
      if (end < VH / 2 - 40 && (Input.hit('confirm') || s.t > 60 * 90)) SM.go(TitleScene());
    };
    s.draw = (ctx) => {
      bgGrad(ctx, s.t, '#080512', '#20102a');
      const order = FW.PLAYABLE;
      order.forEach((id, i) => { const x = i % 2 ? 840 : 120, y = ((i * 260 + s.t * 0.5) % 1560) - 200; Art.chibi(ctx, FW.CHARS[id].spec, x, VH - y, 0.4, { t: s.t + i * 40, lean: Math.sin(s.t * 0.02 + i) * 0.5, expr: 'happy' }); });
      ctx.textAlign = 'center';
      lines.forEach(([k, l], i) => {
        const y = s.y + i * 46; if (y < -40 || y > VH + 40) return;
        if (k === 'big') { ctx.font = `bold 40px ${SERIF}`; ctx.fillStyle = '#fff'; }
        else if (k === 'h') { ctx.font = `15px ${SERIF}`; ctx.fillStyle = '#ffb8d0'; }
        else if (k === 'sub') { ctx.font = `italic 18px ${SERIF}`; ctx.fillStyle = '#d8c8ff'; }
        else { ctx.font = `22px ${SERIF}`; ctx.fillStyle = l === '你' || l === '還沒關掉遊戲的你' ? '#ffd36b' : '#f0e8ff'; }
        ctx.fillText(l, VW / 2, y);
      });
    };
    return s;
  };

  // ---------- 設定 ----------
  const Options = FW.Options = function () {
    const s = { sel: 0, t: 0, wipe: 0, react: null, noTapConfirm: true };
    const st = () => Save.data.settings;
    const items = () => [
      { label: `背景音樂　${'█'.repeat(Math.round(st().bgm * 10))}${'░'.repeat(10 - Math.round(st().bgm * 10))}`, lr: d => { st().bgm = U.clamp(Math.round((st().bgm + d * 0.1) * 10) / 10, 0, 1); A().applyVolume(); } },
      { label: `音效　　　${'█'.repeat(Math.round(st().se * 10))}${'░'.repeat(10 - Math.round(st().se * 10))}`, lr: d => { st().se = U.clamp(Math.round((st().se + d * 0.1) * 10) / 10, 0, 1); A().applyVolume(); A().sfx('item'); } },
      { label: `畫面震動　${st().shake ? '開' : '關'}`, act: () => st().shake = !st().shake, lr: () => st().shake = !st().shake },
      { label: `視窗標題特效　${st().fourthWallTitle ? '開' : '關'}`, act: () => st().fourthWallTitle = !st().fourthWallTitle, lr: () => st().fourthWallTitle = !st().fourthWallTitle },
      { label: `自動符卡（輔助）　${st().autoBomb ? '開' : '關'}`, act: () => st().autoBomb = !st().autoBomb, lr: () => st().autoBomb = !st().autoBomb },
      { label: '全螢幕切換', act: () => { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen && document.documentElement.requestFullscreen(); } },
      { label: s.wipe === 0 ? '刪除存檔' : s.wipe === 1 ? '刪除存檔（真的？）' : '刪除存檔（真的真的？）', act: () => wipe() },
      { label: '返回', act: () => { Save.write(); SM.go(TitleScene()); } },
    ];
    const DESC = ['', '', '受傷或炸彈時畫面會震動。', '允許角色們修改瀏覽器分頁的標題。', '被擊中時，如果還有符卡就會自動施放。（無法收取符卡）', '', '所有紀錄都會消失。她們也會忘記你。', ''];
    function wipe() {
      s.wipe++;
      if (s.wipe === 1) s.react = ['rinne', 'surprised', '欸……你要刪掉存檔？'];
      else if (s.wipe === 2) s.react = ['chiyo', 'sad', '……那樣的話，我們就不記得你了喔。'];
      else { Save.wipe(); Save.unlock('wipe'); s.react = ['nanashi', 'blank', '……■■。初次、見面。'], s.wipe = 0; }
    }
    s.update = () => {
      s.t++;
      const it = items();
      s.sel = menuNav(s.sel, it.length);
      if (s.sel !== 6) s.wipe = 0;
      if (Input.repeat('left') && it[s.sel].lr) { it[s.sel].lr(-1); A().sfx('cursor'); }
      if (Input.repeat('right') && it[s.sel].lr) { it[s.sel].lr(1); A().sfx('cursor'); }
      if (Input.hit('confirm') && it[s.sel].act) { A().sfx('select'); it[s.sel].act(); }
      if (Input.hit('cancel')) { A().sfx('back'); Save.write(); SM.go(TitleScene()); }
    };
    s.draw = (ctx) => {
      bgGrad(ctx, s.t);
      title(ctx, '設定', 80, 90, 40);
      panel(ctx, 60, 120, 560, 470);
      menuList(ctx, items(), s.sel, 100, 175, 52, 20, 'left', s.t);
      text(ctx, DESC[s.sel] || '', 80, 630, 15, '#c8c0e0');
      text(ctx, FW.touchMode ? '觸控：在畫面任意處拖曳移動（自動射擊）　按鈕：符卡／低速／暫停／快轉' : '操作：方向鍵／WASD 移動　Z 射擊　X 符卡　Shift 低速　Esc 暫停　Ctrl 快轉對話（也支援手把）', 80, 680, 13, '#9a90b8');
      if (s.react) { const [id, ex, tx] = s.react; Art.portrait(ctx, FW.CHARS[id].spec, 790, 330, 1.1, { t: s.t, expr: ex }); panel(ctx, 650, 520, 280, 70, FW.CHARS[id].color); ctx.font = `15px ${F()}`; ctx.fillStyle = '#fff'; ctx.textAlign = 'left'; wrapText(ctx, tx, 666, 550, 250, 20); }
      else Art.portrait(ctx, FW.CHARS.shio.spec, 790, 330, 1.1, { t: s.t, expr: 'smile', look: look(790, 330) });
    };
    return s;
  };

  // ---------- 音樂室 ----------
  const MusicRoom = FW.MusicRoom = function () {
    const ids = Object.keys(FW.SONGS);
    const s = { sel: 0, t: 0, top: 0 };
    s.enter = () => { };
    s.update = () => {
      s.t++; s.sel = menuNav(s.sel, ids.length);
      if (s.sel < s.top) s.top = s.sel; if (s.sel >= s.top + 12) s.top = s.sel - 11;
      if (Input.hit('confirm')) { const id = ids[s.sel]; if (Save.data.musicHeard[id] || id === 'title') { A().play(id, true); A().sfx('select'); } else A().sfx('back'); }
      if (Input.hit('cancel')) { A().sfx('back'); SM.go(TitleScene()); }
    };
    s.draw = (ctx) => {
      bgGrad(ctx, s.t, '#0c1028', '#1a2048');
      title(ctx, '音樂室', 60, 80, 38);
      panel(ctx, 40, 100, 560, 560, '#7ab8ff');
      ids.slice(s.top, s.top + 12).forEach((id, j) => {
        const i = s.top + j, heard = Save.data.musicHeard[id] || id === 'title', on = i === s.sel, y = 140 + j * 42;
        if (on) { ctx.fillStyle = 'rgba(122,184,255,0.2)'; ctx.fillRect(50, y - 24, 540, 36); }
        text(ctx, String(i + 1).padStart(2, '0') + '. ' + (heard ? FW.SONGS[id].title : '？？？？？'), 70, y, 18, on ? '#fff' : heard ? '#c8d8f0' : '#5a6a88');
        if (A().curId === id) text(ctx, '♪', 580, y, 18, '#ffd36b', 'right');
      });
      FW._menuRects = ids.slice(s.top, s.top + 12).map((_, j) => ({ x: 50, y: 140 + j * 42 - 26, w: 540, h: 40, i: s.top + j }));
      const id = ids[s.sel], heard = Save.data.musicHeard[id] || id === 'title';
      panel(ctx, 620, 100, 310, 560, '#7ab8ff');
      ctx.font = `16px ${F()}`; ctx.fillStyle = '#e0e8ff'; ctx.textAlign = 'left';
      wrapText(ctx, heard ? FW.SONGS[id].note + `\n\n♩ = ${FW.SONGS[id].bpm}` : '還沒聽過這首曲子。', 640, 140, 270, 26);
      // 頻譜裝飾
      for (let i = 0; i < 24; i++) { const h = 10 + Math.abs(Math.sin(s.t * 0.1 + i * 0.7) * Math.sin(s.t * 0.03 + i)) * (A().curId ? 120 : 6); ctx.fillStyle = U.rgba('#7ab8ff', 0.6); ctx.fillRect(640 + i * 11.5, 640 - h, 8, h); }
      text(ctx, 'Z 播放　X 返回', 940, 700, 12, '#8a90b0', 'right');
    };
    return s;
  };

  // ---------- 角色圖鑑 ----------
  const Gallery = FW.Gallery = function () {
    const ids = [...FW.PLAYABLE, 'nanashi', 'maku'];
    const exprs = ['normal', 'smile', 'happy', 'surprised', 'smug', 'blush', 'angry', 'sad', 'cat', 'tired'];
    const s = { sel: 0, t: 0, ex: 0, pokes: 0, react: '' };
    const unlocked = id => FW.PLAYABLE.includes(id) || Save.data.seenChars[id];
    s.update = () => {
      s.t++;
      const n = menuNav(s.sel, ids.length, { h: true }); if (n !== s.sel) { s.sel = n; s.ex = 0; s.pokes = 0; s.react = ''; }
      if (Input.hit('confirm') && unlocked(ids[s.sel])) {
        s.pokes++; s.ex = (s.ex + 1) % exprs.length; A().sfx('text', { pitch: FW.CHARS[ids[s.sel]].voice });
        const R = ['……嗯？', '有什麼事嗎？', '你一直戳我耶。', '……再戳我就要生氣了喔。', '好啦好啦，我知道你在。', '（已讀不回）'];
        s.react = R[Math.min(R.length - 1, Math.floor(s.pokes / 3))];
        if (s.pokes >= 18) Save.unlock('poke');
      }
      if (Input.hit('cancel')) { A().sfx('back'); SM.go(TitleScene()); }
    };
    s.draw = (ctx) => {
      const id = ids[s.sel], ch = FW.CHARS[id], ok = unlocked(id);
      bgGrad(ctx, s.t, U.shade(ch.color, -0.85), U.shade(ch.color, -0.65));
      title(ctx, '角色圖鑑', 40, 60, 30);
      if (ok) Art.portrait(ctx, ch.spec, 270, 320, 1.6, { t: s.t, expr: exprs[s.ex], look: look(270, 320) });
      else { ctx.save(); ctx.globalAlpha = 0.9; ctx.filter = 'brightness(0)'; Art.portrait(ctx, ch.spec, 270, 320, 1.6, { t: s.t }); ctx.restore(); title(ctx, '？', 270, 300, 120, '#fff', 'center'); }
      panel(ctx, 520, 90, 410, 540, ch.color);
      if (ok) {
        title(ctx, ch.name, 548, 150, 40); text(ctx, ch.reading, 548 + ch.name.length * 42 + 8, 150, 16, '#ddd');
        text(ctx, '「' + ch.title + '」', 548, 184, 17, '#ffd8a8');
        ctx.font = `15px ${F()}`; ctx.fillStyle = '#e8e0f8'; ctx.textAlign = 'left';
        let y = 220; for (const p of ch.profile) { y = wrapText(ctx, p, 548, y, 360, 23) + 34; }
        if (s.react) { panel(ctx, 140, 560, 280, 50, ch.color, 0.9); text(ctx, s.react, 280, 592, 16, '#fff', 'center'); }
      } else { title(ctx, '？？？', 548, 150, 40); text(ctx, '還沒有遇見她。', 548, 200, 16, '#ccc'); }
      ids.forEach((cid, i) => { const x = 560 + i * 44, on = i === s.sel; ctx.beginPath(); ctx.arc(x, 670, on ? 16 : 12, 0, TAU); ctx.fillStyle = unlocked(cid) ? FW.CHARS[cid].color : '#444'; ctx.globalAlpha = on ? 1 : 0.5; ctx.fill(); ctx.globalAlpha = 1; });
      text(ctx, '◀ ▶ 切換　Z 戳一下（換表情）　X 返回', 40, 700, 13, '#b8b0d8');
    };
    return s;
  };

  // ---------- 紀錄與成就 ----------
  const Records = FW.Records = function () {
    const s = { tab: 0, t: 0, scroll: 0, noTapConfirm: true };
    s.update = () => {
      s.t++;
      if (Input.repeat('left')) { s.tab = (s.tab + 2) % 3; s.scroll = 0; A().sfx('cursor'); }
      if (Input.repeat('right')) { s.tab = (s.tab + 1) % 3; s.scroll = 0; A().sfx('cursor'); }
      if (Input.repeat('down')) s.scroll++; if (Input.repeat('up')) s.scroll = Math.max(0, s.scroll - 1);
      if (Input.hit('cancel') || Input.hit('confirm')) { A().sfx('back'); SM.go(TitleScene()); }
    };
    s.draw = (ctx) => {
      const d = Save.data;
      bgGrad(ctx, s.t, '#101828', '#281838');
      ['紀錄', '符卡履歷', '成就'].forEach((n, i) => { ctx.fillStyle = i === s.tab ? 'rgba(255,154,214,0.35)' : 'rgba(255,255,255,0.06)'; ctx.fillRect(40 + i * 160, 30, 150, 40); text(ctx, n, 115 + i * 160, 58, 18, i === s.tab ? '#fff' : '#a8a0c0', 'center'); });
      panel(ctx, 30, 84, 900, 590);
      ctx.save(); ctx.beginPath(); ctx.rect(30, 84, 900, 590); ctx.clip();
      if (s.tab === 0) {
        text(ctx, '角色', 60, 124, 15, '#ffb8d0'); ['Easy', 'Normal', 'Hard'].forEach((n, i) => text(ctx, n, 260 + i * 150, 124, 15, '#ffb8d0'));
        text(ctx, 'Extra', 720, 124, 15, '#ffb8d0'); text(ctx, '∞ 最長存活', 800, 124, 15, '#ffb8d0');
        FW.PLAYABLE.forEach((id, i) => {
          const y = 164 + i * 44, c = d.clears[id] || { story: {} };
          text(ctx, FW.CHARS[id].name, 60, y, 18, FW.CHARS[id].color);
          ['easy', 'normal', 'hard'].forEach((df, j) => { const h = d.hi['story:' + id + ':' + df] || 0; text(ctx, (c.story && c.story[df] ? '★ ' : '') + U.fmtScore(h), 260 + j * 150, y, 16, c.story && c.story[df] ? '#ffe9a8' : '#ddd'); });
          text(ctx, c.extra ? '★ ' + U.fmtScore(d.hi['extra:' + id + ':normal'] || 0) : U.fmtScore(d.hi['extra:' + id + ':normal'] || 0), 700, y, 14, c.extra ? '#ffe9a8' : '#aaa');
          const eb = d.endlessBest[id]; text(ctx, eb ? U.fmtTime(eb.time) : '--:--', 820, y, 16, '#cfe0ff');
        });
        const st = [['總遊玩時間', U.fmtTime(d.playTime)], ['開啟遊戲次數', d.boots], ['倒下次數', d.deaths], ['接關次數', d.continues], ['使用符卡', d.bombs], ['累計擦彈', d.grazeTotal], ['看過的結局', Object.keys(d.endings).length + ' / 8'], ['第一次見面', new Date(d.firstBoot).toLocaleDateString()]];
        st.forEach(([k, v], i) => { const x = 60 + (i % 2) * 430, y = 470 + Math.floor(i / 2) * 40; text(ctx, k, x, y, 16, '#b8b0d8'); text(ctx, String(v), x + 380, y, 18, '#fff', 'right'); });
      } else if (s.tab === 1) {
        const all = FW.BOSSES.all();
        all.slice(s.scroll, s.scroll + 13).forEach((sp, i) => {
          const y = 124 + i * 42; let tries = 0, caps = 0;
          ['easy', 'normal', 'hard'].forEach(df => { const r = d.spells[sp.char + ':' + sp.phase.id + ':' + df]; if (r) { tries += r.tries; caps += r.caps; } });
          text(ctx, String(s.scroll + i + 1).padStart(2, '0'), 60, y, 14, '#8a80a8');
          text(ctx, tries ? sp.name : '？？？？？？', 100, y, 17, tries ? '#fff' : '#666');
          text(ctx, FW.CHARS[sp.char].name, 680, y, 14, FW.CHARS[sp.char].color);
          text(ctx, `${caps} / ${tries}`, 900, y, 16, caps ? '#ffe9a8' : '#aaa', 'right');
        });
        text(ctx, '↑↓ 捲動', 900, 660, 12, '#8a80a8', 'right');
      } else {
        const A2 = FW.ACHIEVEMENTS;
        A2.slice(s.scroll, s.scroll + 12).forEach((a, i) => {
          const y = 128 + i * 45, got = d.achievements[a.id];
          text(ctx, got ? '🏆' : '🔒', 60, y, 18, '#fff');
          text(ctx, got ? a.name : '？？？', 100, y, 18, got ? '#ffd36b' : '#777');
          text(ctx, got || a.id === 'latenight' || a.id === 'quit' ? a.desc : '（尚未解鎖）', 360, y, 14, got ? '#ddd' : '#666');
        });
        text(ctx, `已解鎖 ${A2.filter(a => d.achievements[a.id]).length} / ${A2.length}`, 900, 660, 14, '#ffe9a8', 'right');
      }
      ctx.restore();
      text(ctx, '◀ ▶ 切換分頁　X 返回', 40, 702, 13, '#b8b0d8');
    };
    return s;
  };

  // ---------- 符卡練習 ----------
  const Practice = FW.Practice = function () {
    const all = FW.BOSSES.all(), d = Save.data;
    const seen = sp => ['easy', 'normal', 'hard'].some(df => d.spells[sp.char + ':' + sp.phase.id + ':' + df]);
    const s = { sel: 0, t: 0, top: 0, ch: FW.PLAYABLE.indexOf(d.lastChar || 'rinne'), df: ['easy', 'normal', 'hard'].indexOf(d.lastDiff || 'normal') };
    if (s.ch < 0) s.ch = 0; if (s.df < 0) s.df = 1;
    s.enter = () => A().play('select');
    s.update = () => {
      s.t++; s.sel = menuNav(s.sel, all.length);
      if (s.sel < s.top) s.top = s.sel; if (s.sel >= s.top + 11) s.top = s.sel - 10;
      if (Input.repeat('left')) { s.ch = (s.ch + 5) % 6; A().sfx('cursor'); }
      if (Input.repeat('right')) { s.ch = (s.ch + 1) % 6; A().sfx('cursor'); }
      if (Input.hit('focus')) { s.df = (s.df + 1) % 3; A().sfx('cursor'); }
      if (Input.hit('confirm')) {
        const sp = all[s.sel];
        if (!seen(sp)) { A().sfx('back'); return; }
        A().sfx('select');
        SM.go(GameScene({ mode: 'practice', char: FW.PLAYABLE[s.ch], diff: ['easy', 'normal', 'hard'][s.df], bossKey: sp.key, lv: sp.lv, stage: sp.stage }));
      }
      if (Input.hit('cancel')) { A().sfx('back'); SM.go(TitleScene()); }
    };
    s.draw = (ctx) => {
      bgGrad(ctx, s.t, '#140a20', '#2a1030');
      title(ctx, '符卡練習', 50, 70, 34);
      panel(ctx, 30, 90, 600, 520);
      all.slice(s.top, s.top + 11).forEach((sp, j) => {
        const i = s.top + j, y = 130 + j * 44, on = i === s.sel, ok = seen(sp);
        if (on) { ctx.fillStyle = 'rgba(255,154,214,0.2)'; ctx.fillRect(40, y - 26, 580, 38); }
        text(ctx, ok ? sp.name : '？？？？？？（尚未遭遇）', 60, y, 17, ok ? (on ? '#fff' : '#d8d0f0') : '#666');
        text(ctx, FW.CHARS[sp.char].name, 610, y, 13, FW.CHARS[sp.char].color, 'right');
      });
      FW._menuRects = all.slice(s.top, s.top + 11).map((_, j) => ({ x: 40, y: 130 + j * 44 - 28, w: 580, h: 42, i: s.top + j }));
      const ch = FW.CHARS[FW.PLAYABLE[s.ch]];
      panel(ctx, 650, 90, 280, 520, ch.color);
      Art.portrait(ctx, ch.spec, 790, 280, 0.95, { t: s.t, expr: 'serious' });
      title(ctx, ch.name, 790, 470, 28, '#fff', 'center');
      text(ctx, '難度：' + FW.DIFF[['easy', 'normal', 'hard'][s.df]].name, 790, 510, 18, FW.DIFF[['easy', 'normal', 'hard'][s.df]].col, 'center');
      text(ctx, '◀ ▶ 換角色　Shift 換難度', 790, 580, 13, '#b8b0d8', 'center');
      text(ctx, FW.touchMode ? '在正式遊戲中遇過的符卡才能練習。點兩下開始，◀ ▶ 換角色，Shift 換難度' : '在正式遊戲中遇過的符卡才能練習。　Z 開始　X 返回', 40, 650, 14, '#b8b0d8');
    };
    return s;
  };

  // ---------- 離開 ----------
  const Quit = FW.Quit = function () {
    const s = { t: 0, sel: 1, phase: 0 };
    s.update = () => {
      s.t++;
      if (s.phase === 0) {
        s.sel = menuNav(s.sel, 2);
        if (Input.hit('confirm')) { A().sfx('select'); if (s.sel === 0) { s.phase = 1; s.t = 0; Save.data.quitFromMenu++; Save.data.lastQuit = Date.now(); Save.write(); Save.unlock('quit'); A().stop(2); } else SM.go(TitleScene()); }
        if (Input.hit('cancel')) SM.go(TitleScene());
      } else if (s.t > 200) {
        if (s.t === 201) { try { window.close(); } catch (e) { } }
        if (Input.anyKeyFrame && s.t > 260) SM.go(TitleScene());
      }
    };
    s.draw = (ctx) => {
      if (s.phase === 0) {
        bgGrad(ctx, s.t);
        Art.portrait(ctx, FW.CHARS.rinne.spec, 300, 330, 1.5, { t: s.t, expr: s.sel === 0 ? 'sad' : 'happy', look: look(300, 330) });
        panel(ctx, 520, 200, 380, 260, '#5a8cff');
        title(ctx, '要走了嗎？', 710, 260, 30, '#fff', 'center');
        menuList(ctx, [{ label: '嗯，晚點見' }, { label: '不，我再玩一下' }], s.sel, 590, 340, 50, 22, 'left', s.t);
        text(ctx, s.sel === 0 ? '「……嗯。」' : '「太好了！」', 710, 440, 15, '#cfe0ff', 'center');
      } else {
        const a = Math.min(1, s.t / 120);
        ctx.fillStyle = '#000'; ctx.fillRect(0, 0, VW, VH);
        ctx.save(); ctx.globalAlpha = 1 - a * 0.7;
        Art.portrait(ctx, FW.CHARS.rinne.spec, 480, 330, 1.3, { t: s.t, expr: 'smile', tilt: Math.sin(s.t * 0.15) * 0.05 });
        ctx.restore();
        if (s.t > 40) text(ctx, '那就……晚安。', 480, 560, 22, `rgba(255,255,255,${Math.min(1, (s.t - 40) / 40)})`, 'center');
        if (s.t > 120) text(ctx, '記得喝水，記得睡覺。我們會在這裡等你。', 480, 600, 16, `rgba(220,220,255,${Math.min(1, (s.t - 120) / 40)})`, 'center');
        if (s.t > 220) text(ctx, '（你可以關掉這個分頁了。按任意鍵回到標題。）', 480, 680, 13, '#666', 'center');
      }
    };
    return s;
  };

  // ---------- 開機畫面（需要一次點擊才能播放聲音） ----------
  FW.BootScene = function () {
    const s = { t: 0 };
    s.update = () => { s.t++; if ((Input.anyKeyFrame || Input.mouse.clicked) && s.t > 20) { A().unlock(); SM.go(TitleScene()); } };
    s.draw = (ctx) => {
      ctx.fillStyle = '#05030a'; ctx.fillRect(0, 0, VW, VH);
      const a = Math.min(1, s.t / 60);
      ctx.save(); ctx.globalAlpha = a; ctx.textAlign = 'center';
      ctx.font = `bold 46px ${SERIF}`; ctx.fillStyle = '#fff'; ctx.fillText('第四面牆', VW / 2, 300);
      ctx.font = `16px ${F()}`; ctx.fillStyle = '#b8a8d8'; ctx.fillText('本作品包含會「打破第四面牆」的演出：', VW / 2, 360);
      ctx.fillText('假當機畫面、借用你的滑鼠游標、修改分頁標題、讀取現在時間與遊玩紀錄等。', VW / 2, 386);
      ctx.fillText('這些都只是演出，不會對你的電腦做任何事。（可在設定中關閉分頁標題特效）', VW / 2, 412);
      ctx.globalAlpha = a * (0.5 + 0.5 * Math.sin(s.t * 0.08));
      ctx.font = `bold 20px ${F()}`; ctx.fillStyle = '#ffd8e8'; ctx.fillText('— 按任意鍵或點擊畫面 —', VW / 2, 500);
      ctx.restore();
    };
    return s;
  };
})();
