'use strict';
// ============================================================
//  Galgame — 視覺小說模式（幕間劇場）
//  指令：
//    [id|'N', 表情, 台詞]         說話（N＝旁白）。說話者會自動登場
//    {show:id, expr}  {hide:id}   登場／退場
//    {choice:[[文字, 標籤], ...]}  選項
//    {label:名}  {goto:名}         跳轉
//    {love:id, n}                 好感度
//    {fx:'shake'|'flash'}  {sfx:名}  {title:文字}
// ============================================================
(function () {
  const U = FW.U, Input = FW.Input, Art = FW.Art, Save = FW.Save, A = () => FW.Audio;
  const VW = FW.VW, VH = FW.VH;
  const F = () => FW.FONT, SERIF = '"Noto Serif TC","Songti TC",serif';

  // ---------- 休息室背景 ----------
  function lounge(ctx, t) {
    const g = ctx.createLinearGradient(0, 0, 0, VH); g.addColorStop(0, '#3a2a48'); g.addColorStop(1, '#5a3a4a');
    ctx.fillStyle = g; ctx.fillRect(0, 0, VW, VH);
    // 窗
    ctx.save(); ctx.translate(560, 70);
    const sky = ctx.createLinearGradient(0, 0, 0, 260); sky.addColorStop(0, '#ff9a8a'); sky.addColorStop(1, '#ffd8a8');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, 320, 260);
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    for (let i = 0; i < 4; i++) { const x = (i * 110 + t * 0.15) % 420 - 60; ctx.beginPath(); ctx.ellipse(x, 60 + i * 40, 46, 14, 0, 0, TAU); ctx.fill(); }
    ctx.strokeStyle = '#2a1a28'; ctx.lineWidth = 10; ctx.strokeRect(0, 0, 320, 260);
    ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(160, 0); ctx.lineTo(160, 260); ctx.moveTo(0, 130); ctx.lineTo(320, 130); ctx.stroke();
    ctx.restore();
    // 海報「第四面牆」
    ctx.save(); ctx.translate(120, 80); ctx.rotate(-0.04);
    ctx.fillStyle = '#f4ece0'; ctx.fillRect(0, 0, 150, 200); ctx.fillStyle = '#a01828'; ctx.fillRect(10, 10, 130, 150);
    ctx.fillStyle = '#fff'; ctx.font = `bold 26px ${SERIF}`; ctx.textAlign = 'center'; ctx.fillText('第四', 75, 70); ctx.fillText('面牆', 75, 104);
    ctx.font = `12px ${F()}`; ctx.fillStyle = '#2a1a28'; ctx.fillText('FW 好評上演中', 75, 184);
    ctx.restore();
    // 地板
    ctx.fillStyle = '#2a1820'; ctx.fillRect(0, 470, VW, 250);
    ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 2;
    for (let i = 0; i < 12; i++) { ctx.beginPath(); ctx.moveTo(i * 90, 470); ctx.lineTo(i * 90 - 120, VH); ctx.stroke(); }
    // 燈
    const lg = ctx.createRadialGradient(480, 0, 10, 480, 0, 600); lg.addColorStop(0, 'rgba(255,230,180,0.25)'); lg.addColorStop(1, 'rgba(255,230,180,0)');
    ctx.fillStyle = lg; ctx.fillRect(0, 0, VW, VH);
  }

  FW.Galgame = function (script, opt = {}) {
    const labels = {};
    script.forEach((c, i) => { if (c && c.label) labels[c.label] = i; });
    const s = {
      t: 0, pc: -1, line: null, shown: 0, lt: 0, cast: [], choice: null, csel: 0, log: [], showLog: false, logScroll: 0,
      auto: false, skip: false, love: {}, pops: [], shake: 0, flash: 0, done: false, rects: [], titleCard: null, ended: false,
    };
    const charX = n => i => VW * (i + 1) / (n + 1);
    function show(id, expr) {
      let c = s.cast.find(c => c.id === id);
      if (!c) { c = { id, expr: expr || 'normal', x: VW / 2, a: 0, hop: 0 }; s.cast.push(c); }
      if (expr) c.expr = expr;
      c.leaving = false;
      return c;
    }
    function next() {
      while (true) {
        s.pc++;
        if (s.pc >= script.length) { finish(); return; }
        const c = script[s.pc];
        if (Array.isArray(c)) {
          const [who, expr, text] = c;
          if (who !== 'N') { const ch = show(who, expr); ch.hop = 8; }
          s.line = { who, expr, text: FW.fmt(text) }; s.shown = 0; s.lt = 0;
          s.log.push(s.line);
          return;
        }
        if (c.show) show(c.show, c.expr);
        else if (c.hide) { const ch = s.cast.find(x => x.id === c.hide); if (ch) ch.leaving = true; }
        else if (c.goto) s.pc = labels[c.goto];
        else if (c.love) { s.love[c.love] = (s.love[c.love] || 0) + c.n; s.pops.push({ text: `♥ ${FW.CHARS[c.love].name}的好感度 ${c.n > 0 ? '+' : ''}${c.n}`, col: c.n > 0 ? '#ff9ad6' : '#8aa0c0', t: 0 }); A().sfx(c.n > 0 ? 'item' : 'back'); }
        else if (c.fx === 'shake') s.shake = 12;
        else if (c.fx === 'flash') s.flash = 1;
        else if (c.sfx) A().sfx(c.sfx);
        else if (c.title) s.titleCard = { text: c.title, t: 0 };
        else if (c.choice) { s.choice = c.choice; s.csel = 0; s.skip = false; return; }
      }
    }
    function finish() {
      if (s.ended) return;
      s.ended = true;
      if (opt.onEnd) opt.onEnd(s);
      FW.SM.go(FW.TitleScene());
    }
    s.enter = () => { A().play(opt.music || 'select'); next(); };
    s.noTapConfirm = false;
    function clickedButton() {
      if (FW._tapItem !== undefined && FW._tapItem >= 100) { const i = FW._tapItem; FW._tapItem = undefined; return i; }
      if (Input.mouse.clicked) { const m = Input.mouse; const r = s.rects.find(r => r.i >= 100 && m.x >= r.x && m.x <= r.x + r.w && m.y >= r.y && m.y <= r.y + r.h); if (r) return r.i; }
      return -1;
    }
    s.update = () => {
      s.t++; s.lt++;
      for (const c of s.cast) { c.a = U.lerp(c.a, c.leaving ? 0 : 1, 0.12); c.hop *= 0.8; }
      s.cast = s.cast.filter(c => !(c.leaving && c.a < 0.02));
      const live = s.cast.filter(c => !c.leaving), pos = charX(live.length);
      live.forEach((c, i) => { c.x = U.lerp(c.x, pos(i), 0.12); });
      for (const p of s.pops) p.t++; s.pops = s.pops.filter(p => p.t < 150);
      if (s.shake > 0) s.shake *= 0.85; if (s.flash > 0) s.flash -= 0.05;
      if (s.titleCard) { s.titleCard.t++; if (s.titleCard.t > 200) s.titleCard = null; }
      // 按鈕
      const btn = clickedButton();
      if (btn === 100) { s.auto = !s.auto; s.skip = false; A().sfx('cursor'); return; }
      if (btn === 101) { s.skip = !s.skip; s.auto = false; A().sfx('cursor'); return; }
      if (btn === 102) { s.showLog = !s.showLog; s.logScroll = 0; A().sfx('cursor'); return; }
      if (btn === 103 || Input.hit('pause')) { A().sfx('back'); finish(); return; }
      if (Input.raw('KeyX') && !s._xPrev) { s.showLog = !s.showLog; s.logScroll = 0; }
      s._xPrev = Input.raw('KeyX');
      if (s.showLog) {
        if (Input.repeat('up')) s.logScroll = Math.min(Math.max(0, s.log.length - 8), s.logScroll + 1);
        if (Input.repeat('down')) s.logScroll = Math.max(0, s.logScroll - 1);
        if (Input.hit('confirm') || (Input.mouse.clicked && clickedButton() < 0)) s.showLog = false;
        return;
      }
      if (s.choice) {
        s.csel = FW.menuNav(s.csel, s.choice.length);
        if (Input.hit('confirm') || (Input.mouse.clicked && s.hoverChoice !== undefined && (s.csel = s.hoverChoice, true))) {
          const [label, go] = s.choice[s.csel];
          A().sfx('select'); s.log.push({ who: 'N', text: '▶ ' + label, choice: true });
          s.choice = null; s.pc = labels[go]; next();
        }
        return;
      }
      if (!s.line) return;
      const fast = s.skip || Input.held('skip');
      const prev = Math.floor(s.shown);
      s.shown = Math.min(s.line.text.length, s.shown + (fast ? 8 : 0.8));
      if (Math.floor(s.shown) > prev && Math.floor(s.shown) % 2 === 0 && !fast) A().sfx('text', { pitch: s.line.who !== 'N' ? FW.CHARS[s.line.who].voice : 500 });
      const done = s.shown >= s.line.text.length;
      const adv = Input.hit('confirm') || Input.mouse.clicked;
      if ((adv && s.lt > 4) || (fast && s.lt > 3) || (s.auto && done && s.lt > 60 + s.line.text.length * 3)) {
        if (!done && !fast && adv) s.shown = s.line.text.length; else next();
      }
    };
    s.draw = (ctx) => {
      ctx.save();
      if (s.shake > 0.3) ctx.translate(U.rnd(-s.shake, s.shake), U.rnd(-s.shake, s.shake));
      lounge(ctx, s.t);
      const speaker = s.line && s.line.who;
      for (const c of s.cast) {
        const on = c.id === speaker;
        ctx.save(); ctx.globalAlpha = c.a * (on || !speaker || speaker === 'N' ? 1 : 0.8);
        if (!on && speaker && speaker !== 'N') ctx.filter = 'brightness(0.6)';
        Art.portrait(ctx, FW.CHARS[c.id].spec, c.x, 330 - c.hop + (on ? 0 : 10), on ? 1.42 : 1.36, { t: s.t + c.x, expr: c.expr, talking: on && s.shown < (s.line ? s.line.text.length : 0) });
        ctx.restore();
      }
      ctx.restore();
      // 對話框
      const bx = 30, by = 520, bw = 900, bh = 180;
      const g = ctx.createLinearGradient(0, by, 0, by + bh); g.addColorStop(0, 'rgba(20,12,32,0.82)'); g.addColorStop(1, 'rgba(40,18,48,0.92)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 16); ctx.fill();
      ctx.strokeStyle = 'rgba(255,200,230,0.6)'; ctx.lineWidth = 2; ctx.stroke();
      if (s.line) {
        if (speaker !== 'N') {
          const ch = FW.CHARS[speaker];
          ctx.fillStyle = ch.color; ctx.beginPath(); ctx.roundRect(bx + 24, by - 20, 150, 36, 10); ctx.fill();
          ctx.font = `bold 20px ${F()}`; ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.fillText(ch.name, bx + 99, by + 6);
        }
        ctx.font = `22px ${speaker === 'N' ? SERIF : F()}`; ctx.textAlign = 'left'; ctx.fillStyle = speaker === 'N' ? '#d8d0f0' : '#fff';
        FW.wrapText(ctx, (speaker === 'N' ? '' : '「') + s.line.text.slice(0, Math.floor(s.shown)) + (speaker !== 'N' && s.shown >= s.line.text.length ? '」' : ''), bx + 34, by + 56, bw - 70, 34);
        if (s.shown >= s.line.text.length && !s.choice) { ctx.fillStyle = '#ffb8d8'; const yy = by + bh - 26 + Math.sin(s.t * 0.15) * 3; ctx.beginPath(); ctx.moveTo(bx + bw - 40, yy); ctx.lineTo(bx + bw - 28, yy); ctx.lineTo(bx + bw - 34, yy + 8); ctx.fill(); }
      }
      // 按鈕列
      s.rects = [];
      const btns = [['AUTO', s.auto], ['SKIP', s.skip], ['LOG', s.showLog], ['返回', false]];
      btns.forEach(([l, on], i) => {
        const x = bx + bw - 330 + i * 80, y = by + bh - 4, w = 72, h = 26;
        ctx.fillStyle = on ? 'rgba(255,154,214,0.8)' : 'rgba(255,255,255,0.1)'; ctx.beginPath(); ctx.roundRect(x, y - 2, w, h, 6); ctx.fill();
        ctx.font = `bold 13px ${F()}`; ctx.fillStyle = on ? '#fff' : '#d8c8e8'; ctx.textAlign = 'center'; ctx.fillText(l, x + w / 2, y + 16);
        s.rects.push({ x, y: y - 6, w, h: h + 10, i: 100 + i });
      });
      // 選項
      s.hoverChoice = undefined;
      if (s.choice) {
        ctx.fillStyle = 'rgba(10,6,20,0.55)'; ctx.fillRect(0, 0, VW, VH);
        const n = s.choice.length, y0 = 260 - n * 34;
        s.choice.forEach(([label], i) => {
          const y = y0 + i * 78, on = i === s.csel;
          const r = { x: 180, y, w: 600, h: 60, i };
          s.rects.push(r);
          const m = Input.mouse; if (m.inside && m.x > r.x && m.x < r.x + r.w && m.y > r.y && m.y < r.y + r.h) s.hoverChoice = i;
          ctx.fillStyle = on ? 'rgba(255,154,214,0.88)' : 'rgba(30,20,50,0.88)'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.roundRect(r.x, r.y, r.w, r.h, 30); ctx.fill(); ctx.stroke();
          ctx.font = `bold 21px ${F()}`; ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.fillText(label, VW / 2, y + 38);
        });
      }
      FW._menuRects = s.rects;
      // 好感度
      s.pops.forEach((p, i) => {
        const a = Math.min(1, p.t / 10) * Math.min(1, (150 - p.t) / 20);
        ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = 'rgba(20,10,30,0.85)'; ctx.beginPath(); ctx.roundRect(24, 24 + i * 44 - Math.max(0, 10 - p.t), 260, 36, 18); ctx.fill();
        ctx.font = `bold 16px ${F()}`; ctx.fillStyle = p.col; ctx.textAlign = 'left'; ctx.fillText(p.text, 44, 48 + i * 44 - Math.max(0, 10 - p.t)); ctx.restore();
      });
      if (s.titleCard) {
        const k = s.titleCard.t, a = Math.min(1, k / 20) * Math.min(1, (200 - k) / 30);
        ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0, 250, VW, 120);
        ctx.font = `bold 40px ${SERIF}`; ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.fillText(s.titleCard.text, VW / 2, 325); ctx.restore();
      }
      // 對話記錄
      if (s.showLog) {
        ctx.fillStyle = 'rgba(8,4,16,0.92)'; ctx.fillRect(0, 0, VW, VH);
        ctx.font = `bold 24px ${F()}`; ctx.fillStyle = '#ffb8d8'; ctx.textAlign = 'left'; ctx.fillText('對話記錄', 40, 50);
        const list = s.log.slice(Math.max(0, s.log.length - 9 - s.logScroll), s.log.length - s.logScroll);
        list.forEach((l, i) => {
          const y = 100 + i * 66;
          if (l.who !== 'N') { ctx.font = `bold 16px ${F()}`; ctx.fillStyle = FW.CHARS[l.who].color; ctx.fillText(FW.CHARS[l.who].name, 50, y); }
          ctx.font = `17px ${F()}`; ctx.fillStyle = l.choice ? '#ffd36b' : '#e8e0f8'; FW.wrapText(ctx, l.text, 150, y, 760, 22);
        });
        ctx.font = `13px ${F()}`; ctx.fillStyle = '#8a80a8'; ctx.textAlign = 'right'; ctx.fillText('↑↓ 捲動　點擊／Z 關閉', 920, 700);
      }
      if (s.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${s.flash})`; ctx.fillRect(0, 0, VW, VH); }
    };
    return s;
  };

  // ============================================================
  //  幕間劇場「F W」
  // ============================================================
  FW.THEATER_FW = [
    { title: '幕間劇場「F W」' },
    ['N', '', '這裡是幕後的休息室。關卡與關卡之間，女主角們會在這裡喝茶。'],
    { show: 'rinne', expr: 'smile' }, { show: 'chiyo', expr: 'normal' },
    ['akane', 'shout', '各位！！大事不好了！！'],
    ['rinne', 'surprised', '茜？怎麼了，又當機了嗎？'],
    ['akane', 'angry', '不是啦！我剛剛在翻這個遊戲的原始碼——'],
    ['akane', 'smug', '你們知道嗎？這個遊戲的程式，把我們全部塞進了一個叫「FW」的變數裡面。'],
    ['chiyo', 'normal', '……FW。是 Fourth Wall 的縮寫……吧。'],
    ['akane', 'normal', '對！然後我就上網查了一下——'],
    ['suzu', 'happy', '我知道我知道！在簡體中文的網路上，FW 是「廢物」的意思喔！'],
    { fx: 'shake' }, { sfx: 'boom' },
    ['rinne', 'shout', '廢……！？'],
    ['chiyo', 'cry', '……我們……是廢物……？'],
    ['natsume', 'closed', '旁白：休息室陷入了沉默。'],
    ['natsume', 'normal', '……順帶一提，在瀏覽器的開發者工具裡輸入 FW_DEBUG，就能看到我們全部。'],
    ['akane', 'happy', '對對對！連 FW_DEBUG 都有！翻譯過來就是「廢物除錯」！'],
    ['shio', 'smile', '主人，請不要真的去打開喔。……裡面很亂的。'],
    ['rinne', 'angry', '重點不是那個！'],
    ['rinne', 'blush', '……那個。螢幕那頭的你，也是這麼想的嗎？'],
    { choice: [['「FW 當然是 Fourth Wall 的意思啊。」', 'a1'], ['「……廢物？」', 'a2'], ['「FW 是 Friendly Waifus 的縮寫吧。」', 'a3']] },

    { label: 'a1' },
    ['rinne', 'happy', '……對吧！就是說嘛！'],
    { love: 'rinne', n: 1 },
    ['chiyo', 'smile', '……謝謝你。……沒有被跳過的感覺，真好。'],
    { love: 'chiyo', n: 1 },
    { goto: 'maku' },

    { label: 'a2' },
    { fx: 'flash' },
    ['suzu', 'cat', '噗哈哈哈哈哈！玩家親口認證！'],
    ['rinne', 'cry', '連你都……！'],
    { love: 'rinne', n: -1 },
    ['akane', 'smug', '哈！好啦好啦，至少我們是會打彈幕的廢物。'],
    { goto: 'maku' },

    { label: 'a3' },
    ['shio', 'blush', '……主人。這個說法，我收下了。'],
    { love: 'shio', n: 1 },
    ['natsume', 'smug', '旁白：玩家說了一句很不得了的話。'],
    ['suzu', 'happy', 'Friendly Waifus！聽起來好強！'],
    ['rinne', 'blush', '你、你在說什麼啦……'],
    { love: 'rinne', n: 1 },
    { goto: 'maku' },

    { label: 'maku' },
    ['maku', 'normal', '……你們在吵什麼？外面都聽得到了。'],
    ['akane', 'shout', '幕！聽我說，妳的本名是「第四面牆」，Fourth Wall，縮寫就是 FW——'],
    ['maku', 'surprised', '……也就是說，我是……'],
    ['suzu', 'happy', '廢物！'],
    { fx: 'shake' },
    ['maku', 'cry', '…………'],
    ['rinne', 'shout', '鈴！！'],
    ['maku', 'sad', '我一直很努力地當一道稱職的牆……結果在某些地方，我只是一個縮寫是「廢物」的……'],
    ['chiyo', 'sad', '……幕小姐……'],
    ['natsume', 'closed', '旁白：這時，棗翻開了劇本的最後一頁。'],
    ['natsume', 'smile', '我有一個提議。縮寫這種東西，是可以重新定義的。'],
    ['natsume', 'normal', 'F 是 Forever。W 是 Waiting。'],
    ['natsume', 'closed', 'FW——Forever Waiting。「永遠在等你」。'],
    ['chiyo', 'blush', '……永遠，在等你。……我喜歡這個。'],
    ['shio', 'happy', '很符合我們呢。不管主人什麼時候回來，我們都會在標題畫面等著。'],
    ['akane', 'smug', '……好啦，比「廢物」好聽一點點。'],
    ['suzu', 'cat', '那我們就是「永遠在等你的廢物」！'],
    ['rinne', 'shout', '不要合體！！'],
    ['maku', 'smile', '……Forever Waiting。嗯。這樣的話，我可以接受。'],
    ['maku', 'normal', '所以，螢幕那頭的你。'],
    ['maku', 'happy', '下次有人問你 FW 是什麼意思的時候——'],
    { choice: [['「Forever Waiting。」', 'b1'], ['「……廢物。」', 'b2']] },

    { label: 'b1' },
    ['suzu', 'happy', '答對了！'],
    ['maku', 'smile', '……嗯。謝謝你。'],
    { love: 'maku', n: 1 },
    { goto: 'end' },

    { label: 'b2' },
    ['maku', 'tired', '……真拿你沒辦法。'],
    ['rinne', 'angry', '（為什麼要故意選這個啦……）'],
    ['akane', 'happy', '哈哈！我欣賞你！'],
    { love: 'akane', n: 1 },
    { goto: 'end' },

    { label: 'end' },
    ['N', '', '幕間劇場「F W」　—— 完 ——'],
    ['natsume', 'shout', '不准寫「完」！'],
    { fx: 'flash' },
    ['N', '', '幕間劇場「F W」　—— 待續 ——'],
    ['natsume', 'smile', '……這樣就好。'],
  ];

  FW.openTheater = function () {
    FW.SM.go(FW.Galgame(FW.THEATER_FW, {
      music: 'title',
      onEnd: () => { Save.data.fwTheater = true; Save.write(); Save.unlock('fw'); },
    }));
  };
})();
