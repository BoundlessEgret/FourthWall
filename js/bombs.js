'use strict';
// ============================================================
//  Bombs — 每位角色的符卡（全部打破第四面牆）
//  drawField(ctx)：遊戲區內；drawScreen(ctx)：整個畫面（含右側欄）；post(ctx, canvas)：最後合成
// ============================================================
(function () {
  const U = FW.U, Spr = FW.Sprites, Art = FW.Art, Input = FW.Input;
  const W = FW.PF.w, H = FW.PF.h, PF = FW.PF, F = () => FW.FONT;
  const B = FW.Bombs = {};
  function dmgAll(g, d, cond) { for (const e of g.enemies) { if (e.dead || (cond && !cond(e))) continue; g.damageEnemy(e, e.boss ? d * 0.6 : d); } }
  function bubble(ctx, x, y, text, col = '#fff', size = 15) {
    ctx.save(); ctx.font = `bold ${size}px ${F()}`;
    const w = ctx.measureText(text).width + 24;
    ctx.fillStyle = 'rgba(255,255,255,0.95)'; ctx.strokeStyle = col; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(x - w / 2, y - 18, w, 32, 10); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - 6, y + 14); ctx.lineTo(x, y + 24); ctx.lineTo(x + 6, y + 14); ctx.fill();
    ctx.fillStyle = '#2a2040'; ctx.textAlign = 'center'; ctx.fillText(text, x, y + 4); ctx.restore();
  }
  class Base {
    constructor(g, dur) {
      this.g = g; this.t = 0; this.dur = dur; this.done = false; this.ch = g.ch;
      g.cutin = { t: 0, char: g.charId, side: 'L', expr: 'shout', text: g.ch.bombName + ' ' };
      FW.Save.data.bombsByChar = FW.Save.data.bombsByChar || {};
      FW.Save.data.bombsByChar[g.charId] = (FW.Save.data.bombsByChar[g.charId] || 0) + 1;
    }
    update() { this.t++; this.step(this.t); if (this.t >= this.dur) { this.end(); this.done = true; } }
    step() { }
    end() { }
  }

  // ==================== 玲音：暫停．非暫停 ====================
  B.rinne = class extends Base {
    constructor(g) { super(g, 210); this.cursor = 0; this.extra = ''; this.erase = -1; this.walk = 0; this.sx = g.player.x; this.sy = g.player.y; }
    step(t) {
      const g = this.g;
      if (t < 120) g.freezeWorld = 2;
      if (t === 5) g.sfx('pause');
      if (t === 40 || t === 50 || t === 60) { this.cursor++; g.sfx('cursor'); }
      if (t > 64 && t < 100 && t % 3 === 0) { const s = '刪除所有子彈'; if (this.extra.length < s.length) { this.extra = s.slice(0, this.extra.length + 1); g.sfx('type'); } }
      if (t === 106) { g.sfx('select'); g.doFlash(0.5); }
      if (t >= 110 && t < 150) {
        this.erase = (t - 110) / 40 * H;
        g.clearBullets(true, b => b.y < this.erase);
        dmgAll(g, 3.2, e => e.y < this.erase + 40);
      }
      if (t === 150) { g.clearBullets(true); g.sfx('pause'); }
      this.walk = U.clamp((t - 10) / 40, 0, 1);
    }
    drawField(ctx) {
      const g = this.g, t = this.t;
      const a = t < 15 ? t / 15 : t > 170 ? (210 - t) / 40 : 1;
      ctx.save(); ctx.globalAlpha = a * 0.5; ctx.fillStyle = '#404058'; ctx.fillRect(0, 0, W, H); ctx.restore();
      if (this.erase >= 0 && t < 150) { ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillRect(0, this.erase - 3, W, 6); ctx.fillStyle = 'rgba(120,180,255,0.15)'; ctx.fillRect(0, 0, W, this.erase); }
      ctx.save(); ctx.globalAlpha = a;
      const mx = W / 2 - 130, my = 200;
      ctx.fillStyle = 'rgba(14,12,30,0.92)'; ctx.strokeStyle = '#9ab8ff'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.roundRect(mx, my, 260, 210, 12); ctx.fill(); ctx.stroke();
      ctx.font = `bold 26px ${F()}`; ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.fillText('— PAUSE —', W / 2, my + 40);
      const opts = ['繼續遊戲', '重新開始', '回到標題', this.extra];
      ctx.font = `18px ${F()}`;
      opts.forEach((o, i) => {
        if (!o) return;
        const y = my + 80 + i * 32, sel = i === Math.min(this.cursor, 3);
        ctx.fillStyle = i === 3 ? '#ffd36b' : sel ? '#fff' : '#8a8aa8'; ctx.fillText(o, W / 2, y);
        if (sel) { ctx.fillText('♪', W / 2 - 80, y); if (i === 3 && t > 100 && t % 6 < 3) { ctx.fillStyle = 'rgba(255,211,107,0.3)'; ctx.fillRect(mx + 10, y - 20, 240, 28); } }
      });
      if (this.extra) { ctx.font = `11px ${F()}`; ctx.fillStyle = '#ffd36b'; ctx.fillText('↑ 平常看不到的隱藏選項', W / 2, my + 200); }
      ctx.restore();
      // 玲音走出來
      if (t < 180) {
        const k = U.easeInOut(this.walk), x = U.lerp(this.sx, mx - 40, k), y = U.lerp(this.sy, my + 150, k);
        ctx.save(); ctx.globalAlpha = a; Art.chibi(ctx, this.ch.spec, x, y, 0.32, { t: g.t, lean: this.walk < 1 ? -0.6 : 0, expr: 'smile' }); ctx.restore();
        if (t > 20 && t < 140) bubble(ctx, U.clamp(x + 40, 150, W - 150), y - 60, t < 80 ? '你按暫停的時候……' : '我們其實，一直都醒著喔。', '#5a8cff', 14);
      }
      if (t < 160) { ctx.save(); ctx.globalAlpha = 0.6; ctx.font = `11px ${F()}`; ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.fillText('（操作中的空殼）', g.player.x, g.player.y + 34); ctx.restore(); }
    }
  };

  // ==================== 千代：※此對話無法跳過 ====================
  B.chiyo = class extends Base {
    constructor(g) {
      super(g, 250);
      this.text = '這是必殺技。按 Z 也跳不過喔。按 Ctrl 也一樣。'; this.shown = 0; this.by = H + 10; this.reacted = 0; this.launch = -1;
    }
    step(t) {
      const g = this.g;
      if (t < 20) this.by = U.lerp(H + 10, H - 170, U.easeBack(t / 20));
      if (t === 20) { g.shake(6); g.sfx('boom'); }
      if (t > 24 && t % 4 === 0 && this.shown < this.text.length) {
        this.shown++; g.sfx('type');
        const c = this.text[this.shown - 1];
        if (c.trim()) {
          const x = 40 + ((this.shown - 1) % 22) * 23, y = this.by + 50 + Math.floor((this.shown - 1) / 22) * 28;
          g.pshots.push({ x, y, vx: U.rnd(-2, 2), vy: -6, dmg: 22, sp: Spr.bullet('glyph', 'orange', c), r: 14, t: 0, homing: true, scale: 1.1 });
        }
      }
      if ((Input.hit('skip') || (Input.hit('confirm') && t > 40)) && this.reacted < 2 && t < 170) {
        this.reacted++;
        this.text += this.reacted === 1 ? '……就說了跳不過嘛！' : '……你很固執耶。';
        g.sfx('back');
      }
      if (t > 60 && t < 180) dmgAll(g, 0.8);
      if (t === 180) { this.launch = this.by; g.sfx('whoosh'); }
      if (this.launch >= 0) {
        this.by -= 14;
        const top = this.by, bot = this.by + 140;
        g.clearBullets(true, b => b.y > top - 20 && b.y < bot + 400);
        dmgAll(g, 6, e => e.y > top - 30 && e.y < bot);
      }
    }
    drawField(ctx) {
      const g = this.g, t = this.t, x = 16, y = this.by, w = W - 32, h = 140;
      ctx.save();
      ctx.fillStyle = 'rgba(20,12,24,0.92)'; ctx.strokeStyle = '#f2a03c'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.roundRect(x, y, w, h, 14); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#f2a03c'; ctx.beginPath(); ctx.roundRect(x + 16, y - 18, 130, 30, 8); ctx.fill();
      ctx.font = `bold 17px ${F()}`; ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.fillText('千代（必殺）', x + 81, y + 3);
      ctx.font = `bold 20px ${F()}`; ctx.textAlign = 'left'; ctx.fillStyle = '#fff';
      const s = this.text.slice(0, this.shown);
      for (let i = 0; i < s.length; i += 22) ctx.fillText(s.slice(i, i + 22), x + 22, y + 52 + (i / 22) * 28);
      ctx.font = `11px ${F()}`; ctx.fillStyle = '#ffcf8a'; ctx.textAlign = 'right'; ctx.fillText('※此對話無法跳過　[Z] 無效　[Ctrl] 無效', x + w - 14, y + h - 10);
      ctx.restore();
      if (t < 200) Art.portrait(ctx, this.ch.spec, W - 110, y - 150, 0.75, { t: g.t, expr: this.reacted ? 'angry' : 'smile', talking: this.shown < this.text.length, flip: true });
    }
  };

  // ==================== 茜：致命錯誤 ====================
  B.akane = class extends Base {
    constructor(g) { super(g, 240); this.pct = 0; this.cracks = []; this.shards = null; this.snap = null; this.hit = { x: FW.VW * 0.62, y: FW.VH * 0.45 }; }
    step(t) {
      const g = this.g;
      if (t === 1) { FW.Title.set('第四面牆 FourthWall (沒有回應)', 6000); FW.Audio.stutter(0.6); FW.Outside.say('akane', FW.touchMode ? '欸嘿，整個遊戲「沒有回應」了！……連你的瀏覽器網址列都變藍了喔，看上面！' : '欸嘿，整個遊戲「沒有回應」了！……看一下你的分頁標題？', { expr: 'smug', key: 'akbomb', cool: 90000 }); }
      if (t < 40) { g.freezeWorld = 2; g.freezePlayer = true; }
      if (t === 40) { g.freezePlayer = false; g.sfx('error'); g.clearBullets(true); FW.Title.set(':( 第四面牆 FourthWall'); FW.Outside.theme('#1366c6'); }
      if (t >= 40 && t < 150) { this.pct = Math.min(100, this.pct + 1.1); dmgAll(g, 2.4); g.clearBullets(false); }
      if (t >= 110 && t < 150 && t % 8 === 0) { g.sfx('crack'); g.shake(3); const a = U.rnd(TAU), r = U.rnd(40, 200); this.cracks.push({ a, len: r + (t - 110) * 6 }); }
      if (this.shards) for (const s of this.shards) { s.x += s.vx; s.y += s.vy; s.vy += 0.5; s.rot += s.vr; }
      if (t === 150) { g.sfx('glass'); g.shake(14); FW.Title.reset(); FW.Outside.theme(); FW.Outside.vibrate([180]); dmgAll(g, 60); g.doFlash(0.3, '#ffffff'); }
    }
    drawScreen(ctx) {
      const t = this.t;
      if (t < 40) {
        ctx.fillStyle = `rgba(255,255,255,${Math.min(0.55, t / 40)})`; ctx.fillRect(0, 0, FW.VW, FW.VH);
        ctx.save(); ctx.fillStyle = '#e8e8f0'; ctx.fillRect(0, 0, FW.VW, 26); ctx.font = `13px ${F()}`; ctx.fillStyle = '#222'; ctx.fillText('第四面牆 FourthWall（沒有回應）', 12, 18); ctx.restore();
        ctx.save(); ctx.translate(FW.VW / 2, FW.VH / 2); ctx.rotate(t * 0.2); ctx.strokeStyle = '#3a7cff'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(0, 0, 22, 0, Math.PI * 1.4); ctx.stroke(); ctx.restore();
        return;
      }
      if (t <= 150) {
        if (FW.portraitView) { const V = FW.view, k = V.w / FW.VW; ctx.fillStyle = '#1366c6'; ctx.fillRect(V.x, V.y, V.w, V.h); ctx.save(); ctx.translate(V.x, V.y + V.h * 0.12); ctx.scale(k, k); this.drawBSOD(ctx); ctx.restore(); }
        else this.drawBSOD(ctx);
      }
    }
    drawBSOD(ctx) {
      const t = Math.min(this.t, 150);
      {
        ctx.save();
        ctx.fillStyle = '#1366c6'; ctx.fillRect(0, 0, FW.VW, FW.VH);
        ctx.fillStyle = '#fff'; ctx.textAlign = 'left';
        ctx.font = `bold 120px ${F()}`; ctx.fillText(':(', 110, 220);
        ctx.font = `26px ${F()}`; ctx.fillText('你的遊戲遇到問題，需要重新啟動。', 110, 300);
        ctx.fillText('我們只是在收集某些錯誤資訊，然後就會把牆打破。', 110, 340);
        ctx.fillText(`${Math.floor(this.pct)}% 完成`, 110, 400);
        // 裝飾用方格碼（不是真的 QR）
        ctx.fillStyle = '#fff'; ctx.fillRect(110, 440, 100, 100); ctx.fillStyle = '#1366c6';
        for (let i = 0; i < 10; i++) for (let j = 0; j < 10; j++) if (((i * 7 + j * 13 + i * j) % 5) < 2) ctx.fillRect(110 + i * 10, 440 + j * 10, 10, 10);
        ctx.fillStyle = '#fff'; ctx.font = `15px ${F()}`;
        ctx.fillText('如需此問題的詳細資訊，請轉頭看看你的房間。', 230, 470);
        ctx.fillText('如果要撥打支援電話，請說：「茜又把遊戲弄壞了」', 230, 495);
        ctx.fillText('停止代碼：FOURTH_WALL_BROKEN', 230, 530);
        // 裂痕
        ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 2;
        for (const c of this.cracks) { ctx.beginPath(); ctx.moveTo(this.hit.x, this.hit.y); let x = this.hit.x, y = this.hit.y; for (let s = 1; s <= 6; s++) { x += Math.cos(c.a + Math.sin(s * 3 + c.a) * 0.25) * c.len / 6; y += Math.sin(c.a + Math.cos(s * 2 + c.a) * 0.25) * c.len / 6; ctx.lineTo(x, y); } ctx.stroke(); }
        if (t > 110) { ctx.beginPath(); ctx.arc(this.hit.x, this.hit.y, 18 + (t - 110) * 0.3, 0, TAU); ctx.stroke(); }
        if (t > 120) { Art.portrait(ctx, this.ch.spec, this.hit.x + 60, this.hit.y + 260 - (t - 120) * 2, 0.8, { t: this.g.t, expr: 'shout' }); ctx.globalAlpha = 1; ctx.font = `bold 30px ${F()}`; ctx.fillStyle = '#ffeb7a'; ctx.textAlign = 'center'; ctx.fillText('Ctrl＋Alt＋——拳頭！！', this.hit.x, this.hit.y - 60); }
        ctx.restore();
      }
    }
    post(ctx, canvas) {
      const t = this.t;
      if (t >= 150 && !this.snap) {
        this.snap = document.createElement('canvas'); this.snap.width = canvas.width; this.snap.height = canvas.height;
        const sx = this.snap.getContext('2d'); sx.setTransform(canvas.width / FW.VW, 0, 0, canvas.height / FW.VH, 0, 0); this.drawBSOD(sx);
        const cx = this.hit.x, cy = this.hit.y, angs = [], rads = [0, 70, 170, 320, 560, 1100];
        for (let i = 0; i < 14; i++) angs.push(i * TAU / 14 + U.rnd(-0.12, 0.12));
        this.shards = [];
        for (let i = 0; i < angs.length; i++) for (let j = 0; j < rads.length - 1; j++) {
          const a0 = angs[i], a1 = angs[(i + 1) % angs.length] + (i === angs.length - 1 ? TAU : 0), r0 = rads[j], r1 = rads[j + 1];
          const pts = [[cx + Math.cos(a0) * r0, cy + Math.sin(a0) * r0], [cx + Math.cos(a0) * r1, cy + Math.sin(a0) * r1], [cx + Math.cos(a1) * r1, cy + Math.sin(a1) * r1], [cx + Math.cos(a1) * r0, cy + Math.sin(a1) * r0]];
          const mx = pts.reduce((s, p) => s + p[0], 0) / 4, my = pts.reduce((s, p) => s + p[1], 0) / 4, am = (a0 + a1) / 2;
          const sp = 4 + Math.random() * 6 + (5 - j);
          this.shards.push({ pts, mx, my, vx: Math.cos(am) * sp, vy: Math.sin(am) * sp - 3, rot: 0, vr: U.rnd(-0.08, 0.08), x: 0, y: 0 });
        }
      }
      if (this.shards && t > 150) {
        const k = t - 150;
        ctx.save();
        if (FW.portraitView) { const V = FW.view, sc = V.w / FW.VW; ctx.translate(V.x, V.y + V.h * 0.12); ctx.scale(sc, sc); }
        for (const s of this.shards) {
          ctx.save(); ctx.translate(s.mx + s.x, s.my + s.y); ctx.rotate(s.rot); ctx.translate(-s.mx, -s.my);
          ctx.beginPath(); s.pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath();
          ctx.save(); ctx.clip(); ctx.globalAlpha = Math.max(0, 1 - k / 80); ctx.drawImage(this.snap, 0, 0, FW.VW, FW.VH); ctx.restore();
          ctx.strokeStyle = `rgba(255,255,255,${Math.max(0, 0.8 - k / 80)})`; ctx.lineWidth = 1.5; ctx.stroke();
          ctx.restore();
        }
        ctx.restore();
      }
    }
    end() { this.g.freezePlayer = false; FW.Title.reset(); FW.Outside.theme(); }
  };

  // ==================== 汐：借我一下你的滑鼠 ====================
  B.shio = class extends Base {
    constructor(g) {
      super(g, 230);
      const m = Input.mouse;
      this.start = m.inside ? { x: m.x, y: m.y } : { x: FW.VW - 40, y: FW.VH - 40 };
      this.cx = this.start.x; this.cy = this.start.y; this.sel = null; this.menu = null; this.count = 0;
      FW.canvas.style.cursor = 'none';
      if (!m.inside && FW.touchMode) FW.Outside.say('shio', '你沒有滑鼠呢……那就借一下你的手指吧♪', { expr: 'smile', key: 'shiofinger', cool: 90000 });
    }
    step(t) {
      const g = this.g, x0 = PF.x + 8, y0 = PF.y + 8, x1 = PF.x + W - 8, y1 = PF.y + H - 8;
      const go = (tx, ty, k) => { this.cx = U.lerp(this.cx, tx, k); this.cy = U.lerp(this.cy, ty, k); };
      if (t < 30) go(x0, y0, 0.15);
      else if (t < 90) { const k = U.easeInOut((t - 30) / 60); this.cx = U.lerp(x0, x1, k); this.cy = U.lerp(y0, y1, k); this.sel = { x0, y0, x1: this.cx, y1: this.cy }; if (t % 10 === 0) g.sfx('cursor'); }
      else if (t === 96) { this.menu = { x: PF.x + W / 2 - 60, y: PF.y + H / 2 - 80 }; g.sfx('click'); }
      else if (t > 96 && t < 128) go(this.menu.x + 60, this.menu.y + 18 + 3 * 28, 0.2);
      if (t >= 30 && t < 130) { g.freezeWorld = Math.max(g.freezeWorld, t > 90 ? 2 : 0); dmgAll(g, 0.6); }
      if (t === 132) {
        g.sfx('click'); g.sfx('cancel'); this.count = g.bullets.length; g.clearBullets(true); dmgAll(g, 90); g.doFlash(0.25, '#9ac0ff');
        this.menu = null; this.sel = null;
      }
      if (t > 132 && t < 200) { g.clearBullets(true); dmgAll(g, 0.8); }
      if (t > 160) go(this.start.x, this.start.y, 0.12);
    }
    drawScreen(ctx) {
      const t = this.t;
      if (this.sel) {
        const s = this.sel;
        ctx.save(); ctx.fillStyle = 'rgba(80,140,255,0.18)'; ctx.strokeStyle = '#7ab0ff'; ctx.lineWidth = 2; ctx.setLineDash([6, 4]); ctx.lineDashOffset = -t;
        ctx.fillRect(s.x0, s.y0, s.x1 - s.x0, s.y1 - s.y0); ctx.strokeRect(s.x0, s.y0, s.x1 - s.x0, s.y1 - s.y0); ctx.restore();
        ctx.save(); ctx.strokeStyle = 'rgba(160,200,255,0.8)'; ctx.lineWidth = 1;
        for (const b of this.g.bullets) { const x = b.x + PF.x, y = b.y + PF.y; if (x > s.x0 && x < s.x1 && y > s.y0 && y < s.y1) ctx.strokeRect(x - 7, y - 7, 14, 14); }
        ctx.restore();
        ctx.font = `13px ${F()}`; ctx.textAlign = 'left'; ctx.fillStyle = '#cfe0ff'; ctx.fillText(`已選取 ${this.g.bullets.length} 個項目`, s.x0 + 4, s.y0 - 4 + 20);
      }
      if (this.menu) {
        const m = this.menu, items = ['開啟(O)', '剪下(T)', '複製(C)', '刪除(D)', '內容(R)'];
        ctx.save(); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = '#f6f6fa'; ctx.strokeStyle = '#888'; ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowBlur = 10;
        ctx.fillRect(m.x, m.y, 140, items.length * 28 + 8); ctx.shadowBlur = 0; ctx.strokeRect(m.x, m.y, 140, items.length * 28 + 8);
        items.forEach((it, i) => { const hy = m.y + 4 + i * 28; const hov = i === 3 && t > 110; if (hov) { ctx.fillStyle = '#cfe0ff'; ctx.fillRect(m.x + 3, hy, 134, 26); } ctx.fillStyle = '#222'; ctx.font = `15px ${F()}`; ctx.fillText(it, m.x + 14, hy + 19); });
        ctx.restore();
      }
      if (t > 132 && t < 215) {
        const a = Math.min(1, (215 - t) / 20);
        ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = 'rgba(30,34,48,0.95)'; ctx.fillRect(FW.VW - 330, FW.VH - 90, 310, 70);
        ctx.textAlign = 'left'; ctx.fillStyle = '#fff'; ctx.font = `bold 15px ${F()}`; ctx.fillText('🗑 資源回收筒', FW.VW - 316, FW.VH - 64);
        ctx.font = `13px ${F()}`; ctx.fillStyle = '#cdd'; ctx.fillText(`已將 ${this.count} 個子彈移至資源回收筒。`, FW.VW - 316, FW.VH - 40); ctx.restore();
      }
      // 大游標
      ctx.save(); ctx.translate(this.cx, this.cy); ctx.scale(2.4, 2.4);
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 17); ctx.lineTo(4.5, 13); ctx.lineTo(7.5, 20); ctx.lineTo(10, 19); ctx.lineTo(7, 12); ctx.lineTo(12.5, 12); ctx.closePath();
      ctx.fillStyle = '#fff'; ctx.fill(); ctx.strokeStyle = '#000'; ctx.lineWidth = 1; ctx.stroke(); ctx.restore();
      if (t < 60) bubble(ctx, this.cx + 70, this.cy - 30, '借我一下你的滑鼠喔～', '#5a8aff', 14);
      if (t > 132 && t < 170) bubble(ctx, this.cx + 60, this.cy - 30, '刪除完畢。還給你♪', '#5a8aff', 14);
    }
    end() { FW.canvas.style.cursor = ''; }
  };

  // ==================== 棗：片尾名單（提前播放） ====================
  B.natsume = class extends Base {
    constructor(g) {
      super(g, 300);
      this.lines = ['第四面牆', '', '── 主演 ──', '棗', '', '── 彈幕設計 ──', '棗', '', '── 遊玩 ──', '你', '', '── 特別感謝 ──', '還沒關掉遊戲的你', '', '……片尾還沒結束喔'];
      FW.Audio.setDuck(0.35, 0.5);
    }
    lineY(i) { return H + 40 + i * 64 - (this.t - 20) * 4; }
    step(t) {
      const g = this.g;
      if (t < 20) return;
      g.ctxMeasure = g.ctxMeasure || document.createElement('canvas').getContext('2d');
      this.lines.forEach((s, i) => {
        if (!s) return;
        const y = this.lineY(i), half = Math.max(80, s.length * 16);
        if (y < -30 || y > H + 30) return;
        g.clearBullets(true, b => Math.abs(b.y - y) < 22 && Math.abs(b.x - W / 2) < half);
        dmgAll(g, 2.2, e => Math.abs(e.y - y) < 30 && Math.abs(e.x - W / 2) < half + e.r);
      });
      if (t === 250) { g.clearBullets(true); dmgAll(g, 40); }
    }
    drawField(ctx) {
      const t = this.t, a = Math.min(1, t / 20) * Math.min(1, (this.dur - t) / 30);
      ctx.save(); ctx.globalAlpha = a * 0.6; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); ctx.restore();
      ctx.save(); ctx.globalAlpha = a; ctx.textAlign = 'center';
      this.lines.forEach((s, i) => {
        const y = this.lineY(i); if (!s || y < -30 || y > H + 30) return;
        const big = !s.startsWith('──');
        ctx.font = big ? `bold 30px "Noto Serif TC","Songti TC",serif` : `16px "Noto Serif TC","Songti TC",serif`;
        ctx.fillStyle = s === '你' ? '#ffd36b' : '#f4eaff'; ctx.shadowColor = '#9a3ad0'; ctx.shadowBlur = 12;
        ctx.fillText(s, W / 2, y + 10);
      });
      if (t > 240) { ctx.font = `italic bold 28px "Noto Serif TC",serif`; ctx.fillStyle = '#ffffff'; ctx.fillText('To be continued…', W / 2, H / 2); }
      ctx.restore();
      // 黑邊
      const bar = Math.min(1, t / 20) * Math.min(1, (this.dur - t) / 20) * 56;
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, bar); ctx.fillRect(0, H - bar, W, bar);
      if (t > 20 && t < 120) { ctx.save(); ctx.globalAlpha = 0.9; Art.portrait(ctx, this.ch.spec, 90, H - 200, 0.6, { t: this.g.t, expr: 'closed' }); ctx.restore(); ctx.font = `italic 13px ${F()}`; ctx.fillStyle = '#e8d8ff'; ctx.textAlign = 'left'; ctx.fillText('旁白：片尾名單，提前開始播放了。', 16, H - 70); }
    }
    end() { FW.Audio.setDuck(1, 0.8); }
  };

  // ==================== 鈴：越界 ====================
  B.suzu = class extends Base {
    constructor(g) { super(g, 240); this.stretch = 1; this.wave = -1; this.knocks = []; }
    step(t) {
      const g = this.g;
      if (t === 30) g.sfx('stretch');
      if (t >= 30 && t < 90) { this.stretch = 1 + 0.33 * U.easeOut((t - 30) / 60); g.clearBullets(false, b => b.x > W * (1 - (this.stretch - 1))); }
      if (t === 90) { g.sfx('boing'); this.wave = W; }
      if (t >= 90 && t < 140) { const k = t - 90; this.stretch = 1 + 0.33 * Math.cos(k * 0.45) * Math.exp(-k * 0.09); }
      if (t >= 140) this.stretch = 1;
      if (this.wave >= 0) {
        this.wave -= 22;
        const wx = this.wave;
        g.clearBullets(true, b => b.x > wx);
        dmgAll(g, 4, e => Math.abs(e.x - wx) < 40);
        if (wx < -20) this.wave = -1;
      }
      if (t === 150 || t === 170 || t === 190) {
        const x = U.rnd(120, W - 120), y = U.rnd(100, H - 200);
        this.knocks.push({ x, y, t: 0 }); g.sfx('knock'); g.shake(8); FW.Outside.vibrate([40, 60, 40]);
        if (t === 150) FW.Outside.say('suzu', FW.Outside.canVibrate() ? '叩叩！你的手有感覺到嗎？是我喔！' : '叩叩！聽得到嗎？我在螢幕外面喔！', { expr: 'happy', key: 'knock', cool: 90000 });
        g.clearBullets(true, b => U.dist(b.x, b.y, x, y) < 200);
        dmgAll(g, 30, e => U.dist(e.x, e.y, x, y) < 220);
      }
      if (t > 90) dmgAll(g, 0.4);
      for (const k of this.knocks) k.t++;
      g.fieldStretch = this.stretch; g.hudSquash = 1 - (this.stretch - 1) * 1.45;
    }
    drawScreen(ctx) {
      const t = this.t, g = this.g;
      // 抓住邊框的手
      if (t < 140) {
        const rx = PF.x + W * this.stretch, a = Math.min(1, t / 15);
        ctx.save(); ctx.globalAlpha = a;
        for (const [x, s] of [[PF.x, -1], [rx, 1]]) {
          ctx.save(); ctx.translate(x, PF.y + H / 2 + Math.sin(t * 0.3) * (t > 30 && t < 90 ? 3 : 0)); ctx.scale(s, 1);
          ctx.fillStyle = '#ff9c40'; ctx.fillRect(4, -16, 34, 32);
          ctx.beginPath(); ctx.ellipse(2, 0, 16, 20, 0, 0, TAU); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.strokeStyle = '#333'; ctx.lineWidth = 2; ctx.stroke();
          for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(-8, i * 8); ctx.lineTo(-14, i * 8); ctx.stroke(); }
          ctx.restore();
        }
        ctx.restore();
        if (t > 20 && t < 100) bubble(ctx, PF.x + W * this.stretch * 0.5, PF.y + 120, t < 90 ? '這框框也太擠了吧——！' : '放手！', '#ff9a3c', 16);
      }
      if (this.wave >= 0) {
        const x = PF.x + this.wave * this.stretch;
        const lg = ctx.createLinearGradient(x - 60, 0, x + 20, 0); lg.addColorStop(0, 'rgba(255,154,60,0)'); lg.addColorStop(1, 'rgba(255,220,160,0.8)');
        ctx.fillStyle = lg; ctx.fillRect(x - 60, PF.y, 80, H);
      }
      // 敲螢幕：玻璃上的漣漪與手印
      for (const k of this.knocks) {
        const x = PF.x + k.x, y = PF.y + k.y, a = Math.max(0, 1 - k.t / 70);
        ctx.save(); ctx.globalAlpha = a;
        for (let r = 0; r < 3; r++) { ctx.beginPath(); ctx.arc(x, y, (k.t * 4 + r * 30) % 220, 0, TAU); ctx.strokeStyle = 'rgba(220,240,255,0.6)'; ctx.lineWidth = 3; ctx.stroke(); }
        ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.beginPath(); ctx.ellipse(x, y + 10, 22, 26, 0, 0, TAU); ctx.fill();
        for (let f = 0; f < 4; f++) { ctx.beginPath(); ctx.ellipse(x - 18 + f * 12, y - 26, 5, 12, 0, 0, TAU); ctx.fill(); }
        ctx.font = `bold 34px ${F()}`; ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.fillText('叩！', x, y - 48 - k.t * 0.3);
        ctx.restore();
      }
    }
    end() { this.g.fieldStretch = 1; this.g.hudSquash = 1; }
  };

  // ==================== 蒼：一劍．斬第四面牆 ====================
  // 把整個畫面（連分數欄一起）沿著一條斜線斬開，露出「畫面的背面」——也就是這個招式自己的程式碼。
  const CUT = 56, CLOSE0 = 132, CLOSE1 = 150;
  B.sou = class extends Base {
    constructor(g) {
      super(g, 210); this.d = 0; this.snap = null; this.seam = 0;
      g.cutin.t = 50; // 立繪早點退場，讓出「斬」的瞬間
      const lines = String(B.sou).split('\n').map(l => l.trim()).filter(Boolean);
      this.code = lines.map((l, i) => [l, lines[(i + 1) % lines.length], lines[(i + 2) % lines.length]].join('    '));
    }
    step(t) {
      const g = this.g;
      if (t < CUT + 14) { g.freezeWorld = 2; g.freezePlayer = true; }
      if (t === 1) g.sfx('charge');
      if (t === 30) g.sfx('sheathe');
      if (t === CUT) {
        g.sfx('slash'); g.sfx('impact'); g.doFlash(0.8, '#ffffff'); g.shake(12);
        g.clearBullets(true); g.lasers.length = 0; dmgAll(g, 45);
        FW.Title.set('第四面牆 ／ FourthWall', 5000); FW.Outside.vibrate([40, 30, 220]);
        FW.Outside.say('sou', '……抱歉，把你的螢幕斬開了。放心，在下會縫回去的。', { expr: 'closed', key: 'soubomb', cool: 90000 });
      }
      if (t === CUT + 14) g.freezePlayer = false;
      if (t > CUT && t < CLOSE1) { g.clearBullets(false); if (t % 4 === 0) dmgAll(g, 3); }
      // 裂口的寬度
      if (t > CUT && t <= CUT + 18) this.d = U.easeOut((t - CUT) / 18) * 46;
      else if (t > CLOSE0 && t <= CLOSE1) { this.d = 46 * (1 - U.easeIn((t - CLOSE0) / (CLOSE1 - CLOSE0))); if (t === CLOSE1) { this.d = 0; this.seam = 1; g.sfx('sheathe'); g.shake(4); } }
      if (this.seam > 0 && t > CLOSE1) this.seam = Math.max(0, 1 - (t - CLOSE1) / 55);
    }
    drawField(ctx) {
      const g = this.g, t = this.t, p = g.player;
      if (t < CUT) {
        const a = Math.min(1, t / 20);
        ctx.save(); ctx.globalAlpha = a * 0.55; ctx.fillStyle = '#05080e'; ctx.fillRect(0, 0, W, H); ctx.restore();
        // 居合：劍光在鞘口一閃
        const k = U.clamp((t - 30) / 20, 0, 1);
        ctx.save(); ctx.translate(p.x, p.y); ctx.globalAlpha = a;
        ctx.strokeStyle = U.rgba('#5ae0d4', 0.6); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, 40 + Math.sin(t * 0.3) * 3, 0, TAU); ctx.stroke();
        if (k > 0) { ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(200,255,250,${k * 0.8})`; ctx.beginPath(); ctx.ellipse(0, -8, 4 + k * 60, 2 + k * 2, -0.22, 0, TAU); ctx.fill(); }
        ctx.restore();
        if (t > 8) bubble(ctx, U.clamp(p.x, 160, W - 160), p.y - 70, t < 32 ? '……在下，借這一劍。' : '斬。', '#3cc8c0', t < 32 ? 15 : 22);
      }
    }
    // 切線：通過畫面（目前顯示範圍）的中心，略微傾斜
    line() { const V = FW.view; return { cx: V.x + V.w / 2, cy: V.y + V.h / 2, a: -0.22, L: Math.hypot(V.w, V.h) }; }
    drawScreen(ctx) {
      const t = this.t, { cx, cy, a, L } = this.line();
      if (t >= 36 && t < CUT + 6) { // 預兆：一條細細的光
        const k = U.clamp((t - 36) / 18, 0, 1), w = t >= CUT ? 10 * (1 - (t - CUT) / 6) + 2 : 1 + k * 1.5;
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(a); ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = `rgba(190,255,250,${0.35 + k * 0.6})`; ctx.fillRect(-L / 2 * (t >= CUT ? 1 : k), -w / 2, L * (t >= CUT ? 1 : k), w);
        ctx.restore();
      }
      if (this.seam > 0) { // 縫合的痕跡
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(a); ctx.globalAlpha = this.seam;
        ctx.strokeStyle = '#bffff8'; ctx.lineWidth = 1.5; ctx.setLineDash([10, 6]); ctx.beginPath(); ctx.moveTo(-L / 2, 0); ctx.lineTo(L / 2, 0); ctx.stroke(); ctx.setLineDash([]);
        ctx.font = `13px ${F()}`; ctx.fillStyle = '#dffffb'; ctx.textAlign = 'center'; ctx.fillText('（已縫合。如有接縫，屬正常現象。）', 0, -10);
        ctx.restore();
      }
    }
    post(ctx, canvas) {
      if (this.d <= 0.5) return;
      const cw = canvas.width, ch = canvas.height, k = cw / FW.view.w;
      if (!this.snap || this.snap.width !== cw || this.snap.height !== ch) { this.snap = document.createElement('canvas'); this.snap.width = cw; this.snap.height = ch; }
      const sx = this.snap.getContext('2d'); sx.setTransform(1, 0, 0, 1, 0, 0); sx.clearRect(0, 0, cw, ch); sx.drawImage(canvas, 0, 0);
      const a = -0.22, ca = Math.cos(a), sa = Math.sin(a), nx = -sa, ny = ca, d = this.d * k, R = Math.hypot(cw, ch);
      const cx = cw / 2, cy = ch / 2, t = this.t;
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
      // 畫面的背面
      ctx.fillStyle = '#030608'; ctx.fillRect(0, 0, cw, ch);
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(a);
      const fs = Math.max(9, 11 * k), lh = fs * 1.35, rows = Math.ceil((d * 2) / lh) + 2, scroll = (t - CUT) * 0.6;
      ctx.font = `${fs}px monospace`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.beginPath(); ctx.rect(-R, -d, R * 2, d * 2); ctx.clip();
      for (let r = 0; r < rows; r++) {
        const y = -d + r * lh + lh / 2, li = (Math.floor(scroll / lh) + r) % this.code.length;
        ctx.fillStyle = r % 7 === 3 ? '#ffd36b' : '#3cc8c0'; ctx.globalAlpha = 0.85;
        ctx.fillText(this.code[li] || '', -cw * 0.62 + ((r * 53) % 140), y);
      }
      ctx.globalAlpha = 1;
      if (this.d > 30) {
        const msg = '［ 畫面的背面 ］　你平常看不到的地方。這一招的原始碼，就寫在這裡。', fz = Math.max(11, 14 * k);
        ctx.font = `bold ${fz}px ${F()}`; ctx.textAlign = 'center'; const mw = ctx.measureText(msg).width + 24 * k;
        ctx.fillStyle = 'rgba(3,6,8,0.85)'; ctx.fillRect(-mw / 2, -fz, mw, fz * 2); ctx.fillStyle = '#ffffff'; ctx.fillText(msg, 0, 0);
      }
      ctx.restore();
      // 兩半的畫面，各自往外推開
      for (const sgn of [-1, 1]) {
        ctx.save();
        ctx.translate(nx * sgn * d, ny * sgn * d);
        // 以切線為界的半平面（大多邊形）
        const px = cx + nx * sgn * R, py = cy + ny * sgn * R;
        ctx.beginPath();
        ctx.moveTo(cx - ca * R, cy - sa * R); ctx.lineTo(cx + ca * R, cy + sa * R); ctx.lineTo(px + ca * R, py + sa * R); ctx.lineTo(px - ca * R, py - sa * R); ctx.closePath();
        ctx.clip();
        ctx.drawImage(this.snap, 0, 0);
        ctx.restore();
        // 切口的光
        ctx.save(); ctx.translate(cx + nx * sgn * d, cy + ny * sgn * d); ctx.rotate(a);
        ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(160,255,245,0.7)'; ctx.fillRect(-R, -1.5 * k, R * 2, 3 * k);
        ctx.restore();
      }
      ctx.restore();
    }
    end() { this.g.freezePlayer = false; }
  };
})();
