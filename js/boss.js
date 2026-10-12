'use strict';
// ============================================================
//  Boss / Dialog / HUD / Flow
// ============================================================
(function () {
  const U = FW.U, Input = FW.Input, Save = FW.Save, Art = FW.Art, Spr = FW.Sprites;
  const W = FW.PF.w, H = FW.PF.h, FONT = () => FW.FONT;

  // ---------- 文字代換（第四面牆用的現實資訊） ----------
  FW.fmt = function (s, g) {
    const d = Save.data;
    return String(s)
      .replace(/\{time\}/g, FW.Real.hhmm())
      .replace(/\{pod\}/g, FW.Real.partOfDay())
      .replace(/\{deaths\}/g, d.deaths)
      .replace(/\{boots\}/g, d.boots)
      .replace(/\{play\}/g, U.fmtTime(d.playTime))
      .replace(/\{playh\}/g, (d.playTime / 3600).toFixed(1))
      .replace(/\{cont\}/g, d.continues)
      .replace(/\{os\}/g, FW.Real.platform())
      .replace(/\{name\}/g, g ? g.ch.name : '')
      .replace(/\{ni\}/g, g && g.ch.male ? '你' : '妳')
      .replace(/\{bombs\}/g, d.bombs)
      .replace(/\{graze\}/g, d.grazeTotal)
      .replace(/\{session\}/g, U.fmtTime(FW.sessionFrames / 60 || 0))
      .replace(/\{etime\}/g, g ? U.fmtTime(g.endlessTime / 60) : '');
  };

  // ---------------- Boss ----------------
  class Boss {
    constructor(g, charId, phases, o = {}) {
      this.g = g; this.charId = charId; this.ch = FW.CHARS[charId]; this.phases = phases;
      this.cache = Art.cacheChibi(this.ch.spec, o.scale || 0.26);
      this.x = o.x !== undefined ? o.x : W / 2; this.y = o.y !== undefined ? o.y : -60; this.r = 26; this.boss = true;
      this.hp = 1; this.maxHp = 1; this.dead = false; this.t = 0; this.lean = 0; this.px = this.x; this.hitFlash = 0;
      this.tasks = new FW.TaskList(); this.idx = -1; this.phase = null; this.timer = 0; this.phaseWait = 0;
      this.entering = true; this.lv = o.lv || g.lv; this.mid = !!o.mid; this.name = o.name || this.ch.name; this.hpMul = o.hpMul || 1;
      this.home = { x: W / 2, y: 150 }; this.armor = 1; this.visible = true; this.onDefeat = o.onDefeat;
      g.enemies.push(this); g.boss = this;
      FW.Save.data.seenChars[charId] = true;
    }
    *enter() {
      this.entering = true;
      yield* this.g.moveTo(this, this.home.x, this.home.y, 70, U.easeOut);
      this.entering = false;
    }
    *move(x, y, f = 50) { yield* this.g.moveTo(this, x, y, f); }
    *wander(f = 50, rx = 120, ry = 40) {
      const g = this.g, tx = U.clamp(g.player.x + U.rnd(-rx, rx), 80, W - 80), ty = U.clamp(this.home.y + U.rnd(-ry, ry), 70, 220);
      yield* g.moveTo(this, tx, ty, f);
    }
    *run() {
      if (this.entering) yield* this.enter();
      for (let i = 0; i < this.phases.length; i++) {
        this.startPhase(i);
        yield () => this.hp <= 0 || this.timer <= 0 || this.forceEnd;
        this.endPhase(this.hp <= 0 ? 'kill' : 'time');
        if (i < this.phases.length - 1) yield 40;
      }
      yield* this.die();
    }
    startPhase(i) {
      const g = this.g, ph = this.phases[i];
      this.idx = i; this.phase = ph; this.forceEnd = false;
      g.clearBullets(true);
      this.maxHp = this.hp = ph.survival ? 1e9 : ph.hp * this.hpMul * (g.mode === 'endless' ? 0.9 : 1);
      this.timer = this.maxTimer = (ph.time || 40) * 60;
      this.tasks.clear(); this.armor = 1;
      this.phaseWait = ph.spell ? 70 : 40;
      if (ph.spell) {
        this.captured = true; g.spellTries++;
        this.spellId = this.charId + ':' + (ph.id || ph.name) + ':' + g.diff;
        if (g.mode !== 'endless') { const r = Save.spell(this.spellId); r.tries++; }
        this.bonusBase = Math.round((1e6 + this.lv * 4e5) / 10) * 10;
        g.cutin = { t: 0, char: this.charId, side: 'R', expr: ph.expr || 'serious' };
        g.banner = { t: 0, name: ph.name, id: this.spellId };
        g.sfx('spell');
        FW.Outside.theme(U.shade(this.ch.color, -0.7));
        if (ph.onDeclare) ph.onDeclare(this, g);
      } else g.banner = null;
      const self = this;
      this.tasks.add((function* () {
        // 回到原位
        if (U.dist(self.x, self.y, ph.home ? ph.home.x : self.home.x, ph.home ? ph.home.y : self.home.y) > 4) yield* g.moveTo(self, ph.home ? ph.home.x : self.home.x, ph.home ? ph.home.y : self.home.y, 40);
        yield () => self.phaseWait <= 0;
        yield* ph.gen(self, g, self.lv);
      })());
    }
    endPhase(how) {
      const g = this.g, ph = this.phase;
      this.tasks.clear();
      g.clearBullets(true);
      g.lasers.length = 0;
      FW.Outside.theme();
      if (ph.onEnd) ph.onEnd(this, g);
      if (ph.spell) {
        const ok = this.captured && (how === 'kill' || ph.survival);
        if (ok) {
          const bonus = Math.round(this.bonusBase * (ph.survival ? 1 : 0.5 + 0.5 * this.timer / this.maxTimer) / 10) * 10;
          g.addScore(bonus); g.spellCaps++;
          if (g.mode !== 'endless') { const r = Save.spell(this.spellId); r.caps++; }
          g.overlayTexts.push(bonusText('Get Spell Card Bonus!!', U.fmtScore(bonus), g));
          g.sfx('capture');
          FW.Save.unlock('firstspell');
        } else {
          g.overlayTexts.push(bonusText('Bonus Failed', '', g));
        }
        g.banner = null;
      }
      const big = how === 'kill';
      if (!this.mid || big) g.dropItems(this.x, this.y, { power: big ? 8 : 4, point: big ? 12 : 6, lifepiece: (ph.spell && this.captured && big && g.mode !== 'practice') ? 1 : 0, bombpiece: (!ph.spell && big && g.mode !== 'practice') ? 1 : 0 });
      g.ringFx(this.x, this.y, this.ch.color, 160, 40);
      g.sfx('kill'); g.shake(4);
    }
    *die() {
      const g = this.g;
      if (this.mid) {
        // 中頭目：撤退
        this.invuln = true; g.sfx('whoosh');
        yield* g.moveTo(this, this.x, -100, 50, U.easeIn);
      } else {
        g.sfx('bigkill'); g.shake(14); g.doFlash(0.8, '#ffffff');
        for (let i = 0; i < 4; i++) g.ringFx(this.x, this.y, i % 2 ? '#ffffff' : this.ch.color, 120 + i * 80, 40 + i * 10);
        g.spark(this.x, this.y, this.ch.color, 60, 8);
        g.collectAll = 90;
        g.dropItems(this.x, this.y, { point: 20, power: 10 });
        this.visible = false;
      }
      this.dead = true; this.invisible = true;
      if (g.boss === this) g.boss = null;
      g.enemies = g.enemies.filter(e => e !== this);
      if (this.onDefeat) this.onDefeat(this, g);
      yield 1;
    }
    update() {
      this.t++;
      if (this.phaseWait > 0) this.phaseWait--;
      this.tasks.step();
      if (this.phase && this.phaseWait <= 0 && !this.entering) {
        this.timer--;
        const g = this.g;
        if (this.timer <= 600 && this.timer > 0 && this.timer % 60 === 0) g.sfx('timeout');
      }
      if (this.hitFlash > 0) this.hitFlash--;
      this.lean = U.lerp(this.lean, U.clamp((this.x - this.px) * 0.5, -1, 1), 0.2); this.px = this.x;
    }
    get invulnNow() { return this.entering || this.phaseWait > 0 || (this.phase && this.phase.survival); }
    draw(ctx) {
      if (!this.visible) return;
      const g = this.g, c = this.ch.color;
      Spr.magicCircle(ctx, this.x, this.y + 10, 52 + Math.sin(this.t * 0.05) * 4, this.t, c, 0.5);
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const ag = ctx.createRadialGradient(this.x, this.y, 5, this.x, this.y, 60);
      ag.addColorStop(0, U.rgba(c, 0.35)); ag.addColorStop(1, U.rgba(c, 0));
      ctx.fillStyle = ag; ctx.beginPath(); ctx.arc(this.x, this.y, 60, 0, TAU); ctx.fill();
      ctx.restore();
      if (this.hitFlash > 0 && this.t % 2) ctx.globalAlpha = 0.75;
      Art.drawCached(ctx, this.cache, this.x, this.y - 4 + Math.sin(this.t * 0.05) * 3, this.t, this.lean);
      ctx.globalAlpha = 1;
    }
    drawUI(ctx) {
      if (!this.visible || this.dead) return;
      const g = this.g, f = FONT();
      // HP 條
      if (this.phase && !this.entering) {
        const k = this.phase.survival ? this.timer / this.maxTimer : U.clamp(this.hp / this.maxHp, 0, 1);
        const fill = this.phaseWait > 0 ? 1 - this.phaseWait / 70 : 1;
        ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(60, 6, W - 130, 6);
        const hg = ctx.createLinearGradient(60, 0, W - 70, 0); hg.addColorStop(0, '#ffffff'); hg.addColorStop(1, this.ch.color);
        ctx.fillStyle = hg; ctx.fillRect(60, 6, (W - 130) * k * fill, 6);
        ctx.font = `bold 12px ${f}`; ctx.textAlign = 'left'; ctx.fillStyle = '#fff'; ctx.fillText(this.name, 8, 14);
        // 剩餘符卡
        const rest = this.phases.slice(this.idx + 1).filter(p => p.spell).length;
        for (let i = 0; i < rest; i++) { const sp = Spr.item('life'); ctx.drawImage(sp.c, 8 + i * 13, 18, 14, 14); }
        // 時間
        const sec = Math.max(0, this.timer / 60);
        ctx.textAlign = 'right'; ctx.font = `bold 18px ${f}`; ctx.fillStyle = sec < 10 ? '#ff7080' : '#fff';
        ctx.fillText(sec < 10 ? sec.toFixed(2) : Math.floor(sec), W - 8, 18);
      }
      // 符卡名
      if (g.banner && this.phase && this.phase.spell) {
        const b = g.banner, k = U.easeInOut(U.clamp((b.t - 30) / 40, 0, 1));
        const y = U.lerp(H - 140, 44, k), a = Math.min(1, b.t / 15);
        ctx.save(); ctx.globalAlpha = a; ctx.textAlign = 'right';
        const tw = Math.min(W - 40, 30 + b.name.length * 17);
        const bg = ctx.createLinearGradient(W - tw, 0, W, 0); bg.addColorStop(0, 'rgba(0,0,0,0)'); bg.addColorStop(0.3, U.rgba(this.ch.color, 0.5)); bg.addColorStop(1, U.rgba(this.ch.color, 0.7));
        ctx.fillStyle = bg; ctx.fillRect(W - tw, y - 18, tw, 26);
        ctx.font = `bold 17px ${f}`; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,0.7)'; ctx.strokeText(b.name, W - 8, y); ctx.fillStyle = '#fff'; ctx.fillText(b.name, W - 8, y);
        if (k > 0.99) {
          const r = g.mode === 'endless' ? null : Save.spell(b.id);
          const bonus = this.captured ? U.fmtScore(Math.round(this.bonusBase * (this.phase.survival ? 1 : 0.5 + 0.5 * this.timer / this.maxTimer) / 10) * 10) : 'Failed';
          ctx.font = `12px ${f}`; ctx.fillStyle = '#ffe9a8';
          ctx.fillText(`Bonus  ${bonus}` + (r ? `    History  ${r.caps}/${r.tries}` : ''), W - 8, y + 18);
        }
        ctx.restore();
      }
      // 底部敵人位置標記
      ctx.fillStyle = U.rgba(this.ch.color, 0.9); ctx.font = `bold 10px ${f}`; ctx.textAlign = 'center';
      ctx.fillRect(this.x - 18, H - 12, 36, 12); ctx.fillStyle = '#fff'; ctx.fillText('ENEMY', this.x, H - 2);
    }
  }
  FW.Boss = Boss;
  function bonusText(a, b, g) {
    return { g,
      t: 0, update() { this.t++; if (this.t > 150) { const i = this.g.overlayTexts.indexOf(this); if (i >= 0) this.g.overlayTexts.splice(i, 1); } },
      draw(ctx, g) {
        if (this.t > 150) return;
        const al = Math.min(1, this.t / 10) * Math.min(1, (150 - this.t) / 20);
        ctx.save(); ctx.globalAlpha = al; ctx.textAlign = 'center';
        ctx.font = `bold 26px ${FONT()}`; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,0.6)';
        ctx.strokeText(a, W / 2, 180); ctx.fillStyle = a.startsWith('Bonus F') ? '#a8b8d8' : '#ffe14a'; ctx.fillText(a, W / 2, 180);
        if (b) { ctx.font = `bold 22px ${FONT()}`; ctx.strokeText(b, W / 2, 212); ctx.fillStyle = '#fff'; ctx.fillText(b, W / 2, 212); }
        ctx.restore();
      }
    };
  }
  FW.bonusText = bonusText;

  // ---------------- Dialog ----------------
  class Dialog {
    constructor(g, lines, L, R) {
      this.g = g; this.lines = lines; this.L = L; this.R = R; this.i = -1; this.done = false; this.t = 0;
      this.next();
    }
    next() {
      this.i++;
      while (this.i < this.lines.length && typeof this.lines[this.i] === 'function') { this.lines[this.i](this.g, this); this.i++; }
      if (this.i >= this.lines.length) { this.done = true; return; }
      let [who, expr, text] = this.lines[this.i];
      this.who = who; this.expr = expr; this.text = FW.fmt(text, this.g); this.shown = 0; this.wrapped = null; this.lt = 0;
      if (who === 'L' || who === 'R') this.lastExpr = Object.assign(this.lastExpr || {}, { [who]: expr });
    }
    speakerChar() { return this.who === 'L' ? this.L : this.who === 'R' ? this.R : (FW.CHARS[this.who] ? this.who : null); }
    update() {
      if (this.done) return;
      this.t++; this.lt++;
      const skip = Input.held('skip');
      const prevShown = Math.floor(this.shown);
      this.shown = Math.min(this.text.length, this.shown + (skip ? 6 : 0.75));
      const c = this.speakerChar();
      if (Math.floor(this.shown) > prevShown && Math.floor(this.shown) % 2 === 0 && !skip) FW.Audio.sfx('text', { pitch: c ? FW.CHARS[c].voice : 600 });
      if ((Input.hit('confirm') && this.lt > 6) || (skip && this.lt > 4)) {
        if (this.shown < this.text.length && !skip) this.shown = this.text.length;
        else this.next();
      }
    }
    wrap(ctx, w) {
      if (this.wrapped) return this.wrapped;
      const out = []; let line = '';
      for (const ch of this.text) {
        if (ch === '\n') { out.push(line); line = ''; continue; }
        if (ctx.measureText(line + ch).width > w) { out.push(line); line = ''; }
        line += ch;
      }
      out.push(line); this.wrapped = out; return out;
    }
    draw(ctx) {
      if (this.done) return;
      const g = this.g, f = FONT();
      const sc = this.speakerChar();
      const drawP = (id, side) => {
        if (!id) return;
        const active = sc === id;
        const ex = (this.lastExpr && this.lastExpr[side]) || 'normal';
        ctx.save(); ctx.globalAlpha = active ? 1 : 0.55;
        const x = side === 'L' ? 130 + (active ? 10 : 0) : W - 130 - (active ? 10 : 0);
        Art.portrait(ctx, FW.CHARS[id].spec, x, H - 330 + (active ? 0 : 12), 1.05, { t: g.t, expr: ex, talking: active && this.shown < this.text.length, flip: side === 'R' });
        ctx.restore();
      };
      drawP(this.L, 'L'); if (this.R) drawP(this.R, 'R');
      // 對話框
      const bx = 16, by = H - 150, bw = W - 32, bh = 134;
      const col = sc ? FW.CHARS[sc].color : '#9aa8c8';
      ctx.save();
      ctx.fillStyle = 'rgba(12,10,26,0.86)'; ctx.strokeStyle = U.rgba(col, 0.9); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 12); ctx.fill(); ctx.stroke();
      if (sc) {
        ctx.fillStyle = col; ctx.beginPath(); ctx.roundRect(bx + 14, by - 16, 120, 28, 8); ctx.fill();
        ctx.font = `bold 16px ${f}`; ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.fillText(FW.CHARS[sc].name, bx + 74, by + 4);
      }
      ctx.font = `18px ${f}`; ctx.textAlign = 'left'; ctx.fillStyle = this.who === 'N' ? '#c8d4f0' : '#ffffff';
      const lines = this.wrap(ctx, bw - 40);
      let left = Math.floor(this.shown);
      lines.forEach((ln, k) => { const s = ln.slice(0, Math.max(0, left)); left -= ln.length; ctx.fillText(s, bx + 20, by + 40 + k * 27); });
      if (this.shown >= this.text.length && Math.floor(this.t / 20) % 2) { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(bx + bw - 26, by + bh - 22); ctx.lineTo(bx + bw - 16, by + bh - 22); ctx.lineTo(bx + bw - 21, by + bh - 14); ctx.fill(); }
      ctx.restore();
    }
  }
  FW.Dialog = Dialog;

  // ---------------- HUD（右側欄） ----------------
  const HUD = FW.HUD = {
    whisper: null, whisperT: 0,
    draw(ctx, g) {
      const f = FONT(), x0 = 640, y0 = 24;
      const sx = g.hudSquash || 1;
      ctx.save();
      ctx.translate(x0 + (1 - sx) * 300, 0); ctx.scale(sx, 1); ctx.translate(-x0, 0);
      // 背景
      const bg = ctx.createLinearGradient(x0, 0, 960, 720); bg.addColorStop(0, '#191530'); bg.addColorStop(1, '#2a1838');
      ctx.fillStyle = bg; ctx.fillRect(x0 - 8, 0, 340, 720);
      ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 1;
      for (let i = 0; i < 30; i++) { ctx.beginPath(); ctx.moveTo(x0 - 8 + i * 24, 0); ctx.lineTo(x0 - 8 + i * 24 - 200, 720); ctx.stroke(); }
      // 標誌
      ctx.textAlign = 'left';
      ctx.font = `bold 30px ${f}`; ctx.fillStyle = '#ffffff'; ctx.fillText('第四面牆', x0 + 14, 62);
      ctx.font = `italic 13px ${f}`; ctx.fillStyle = '#c8b8ff'; ctx.fillText('FourthWall  ～ Behind the Bullet Curtain', x0 + 14, 82);
      const D = FW.DIFF[g.diff];
      ctx.fillStyle = D.col; ctx.beginPath(); ctx.roundRect(x0 + 200, 96, 82, 22, 6); ctx.fill();
      ctx.fillStyle = '#111'; ctx.font = `bold 13px ${f}`; ctx.textAlign = 'center'; ctx.fillText(g.mode === 'endless' ? '∞ ' + D.name : g.mode === 'extra' ? 'Extra' : D.name, x0 + 241, 112);
      ctx.textAlign = 'left';
      const row = (y, label, val, col = '#fff') => {
        ctx.font = `15px ${f}`; ctx.fillStyle = '#b8b0d8'; ctx.fillText(label, x0 + 14, y);
        ctx.font = `bold 20px ${f}`; ctx.fillStyle = col; ctx.textAlign = 'right'; ctx.fillText(val, x0 + 290, y); ctx.textAlign = 'left';
      };
      row(150, '最高分', U.fmtScore(g.hi), '#c8c8d8');
      row(180, '分數', U.fmtScore(g.score));
      // 殘機
      ctx.font = `15px ${f}`; ctx.fillStyle = '#b8b0d8'; ctx.fillText('殘機', x0 + 14, 226);
      for (let i = 0; i < 8; i++) { const sp = Spr.item('life'); ctx.globalAlpha = i < g.lives ? 1 : 0.15; ctx.drawImage(sp.c, x0 + 80 + i * 26, 208, 24, 24); }
      ctx.globalAlpha = 1; ctx.font = `11px ${f}`; ctx.fillStyle = '#ff9ad6'; ctx.fillText(`碎片 ${g.lifePieces}/3`, x0 + 80, 246);
      ctx.font = `15px ${f}`; ctx.fillStyle = '#b8b0d8'; ctx.fillText('符卡', x0 + 14, 274);
      for (let i = 0; i < 8; i++) { const sp = Spr.item('bomb'); ctx.globalAlpha = i < g.bombs ? 1 : 0.15; ctx.drawImage(sp.c, x0 + 80 + i * 26, 256, 24, 24); }
      ctx.globalAlpha = 1; ctx.font = `11px ${f}`; ctx.fillStyle = '#9af0b0'; ctx.fillText(`碎片 ${g.bombPieces}/3`, x0 + 80, 294);
      row(326, '靈力', g.power.toFixed(2) + ' / 4.00', '#ff8a8a');
      row(354, '最大得點', U.fmtScore(g.pointValue), '#8ab4ff');
      row(382, '擦彈', String(g.graze), '#e0e0f0');
      if (g.mode === 'endless') {
        row(418, '存活時間', U.fmtTime(g.endlessTime / 60), '#ffe9a8');
        row(446, '循環', '第 ' + (g.endlessLoops + 1) + ' 輪', '#ffe9a8');
      } else {
        row(418, '關卡', g.stage >= 7 ? 'Extra' : 'Stage ' + g.stage, '#ffe9a8');
      }
      // 角色
      const ch = g.ch;
      ctx.save();
      ctx.beginPath(); ctx.rect(x0, 470, 300, 230); ctx.clip();
      const sad = g.lives === 0 ? 'sad' : g.bombFx ? 'shout' : g.player.focus ? 'serious' : 'normal';
      Art.portrait(ctx, ch.spec, x0 + 150, 560, 0.95, { t: g.t, expr: HUD.whisper ? HUD.whisper.expr || 'smile' : sad, talking: !!HUD.whisper && HUD.whisperT < 60, look: { x: -2, y: 0 } });
      ctx.restore();
      ctx.strokeStyle = U.rgba(ch.color, 0.6); ctx.lineWidth = 2; ctx.strokeRect(x0 + 1, 470, 298, 230);
      // 角色碎碎念
      if (HUD.whisper) {
        const w = HUD.whisper, a = Math.min(1, HUD.whisperT / 10) * Math.min(1, (w.dur - HUD.whisperT) / 15);
        if (HUD.whisperT > w.dur) HUD.whisper = null;
        else {
          ctx.save(); ctx.globalAlpha = Math.max(0, a);
          ctx.fillStyle = 'rgba(255,255,255,0.95)'; ctx.beginPath(); ctx.roundRect(x0 + 10, 478, 280, 58, 10); ctx.fill();
          ctx.beginPath(); ctx.moveTo(x0 + 150, 536); ctx.lineTo(x0 + 160, 548); ctx.lineTo(x0 + 168, 536); ctx.fill();
          ctx.fillStyle = '#2a2040'; ctx.font = `14px ${f}`;
          const s = w.text; let line = '', ly = 500;
          for (const c of s.slice(0, Math.floor(HUD.whisperT * 0.8))) { if (ctx.measureText(line + c).width > 260) { ctx.fillText(line, x0 + 20, ly); line = ''; ly += 19; } line += c; }
          ctx.fillText(line, x0 + 20, ly);
          ctx.restore();
        }
      }
      ctx.restore();
    },
    say(text, expr, dur = 260) { this.whisper = { text, expr, dur }; this.whisperT = 0; },
  };

  // ---------------- 遊戲流程 ----------------
  const STAGE_INFO = FW.STAGE_INFO = {
    1: { name: '初始畫面之丘', sub: '～ 按下開始鍵之前，世界一片寂靜 ～', bg: 'hill', music: 'st1' },
    2: { name: '對話框之海', sub: '～ 沒說完的台詞，全都沉在這裡 ～', bg: 'sea', music: 'st2' },
    3: { name: '錯誤之城', sub: '～ 本程式已停止回應（但還在動） ～', bg: 'city', music: 'st3' },
    4: { name: '桌面之原', sub: '～ 預設桌布的草原上，游標在吃草 ～', bg: 'desktop', music: 'st4' },
    5: { name: '片尾之塔', sub: '～ 每一層都刻著名字，頂樓是空白的 ～', bg: 'tower', music: 'st5' },
    6: { name: '幕後', sub: '～ 觀眾看不見的地方，才是真正的舞台 ～', bg: 'stage', music: 'st6' },
    7: { name: '螢幕之外', sub: '～ 這一側，是你那一側 ～', bg: 'glass', music: 'st7' },
  };
  const Flow = FW.Flow = {
    *main(g) {
      if (g.mode === 'story') {
        for (let s = g.stage; s <= 6; s++) { yield* Flow.stage(g, s); }
        Flow.finish(g, 'story');
      } else if (g.mode === 'extra') {
        yield* Flow.stage(g, 7);
        Flow.finish(g, 'extra');
      } else if (g.mode === 'endless') {
        yield* FW.Endless(g);
      } else if (g.mode === 'practice') {
        yield* Flow.practice(g);
      }
    },
    setBg(g, key) { if (g.bgKey !== key) { g.bgPrev = g.bgKey; g.bgKey = key; g.bgFade = 0; } },
    music(g, id) { FW.Audio.play(id); },
    *stage(g, s) {
      const info = STAGE_INFO[s];
      g.stage = s; g.lv = s; g.stageT = 0;
      Save.data.lastStageReached = { char: g.charId, stage: s, at: Date.now() };
      Flow.setBg(g, info.bg); Flow.music(g, info.music);
      g.stageCard = { t: 0, label: s === 7 ? 'Extra Stage' : 'Stage ' + s, name: info.name, sub: info.sub, music: FW.SONGS[info.music].title };
      yield* FW.STAGES[s](g);
      // 過關
      if (s < 7) {
        const bonus = s * 1e6 + g.graze * 100 + Math.floor(g.power * 100) * 1000;
        g.addScore(bonus);
        g.overlayTexts.push(FW.bonusText('Stage Clear!!', 'Clear Bonus  ' + U.fmtScore(bonus), g));
        g.sfx('capture');
        yield 180;
      }
    },
    *practice(g) {
      const o = g.opt;
      const def = FW.BOSSES.find(o.bossKey);
      g.lv = o.lv || 4; g.stage = o.stage || 1;
      const info = STAGE_INFO[g.stage] || STAGE_INFO[1];
      Flow.setBg(g, info.bg); FW.Audio.play(def.music);
      const boss = new FW.Boss(g, def.char, [def.phase], { lv: g.lv });
      yield* boss.run();
      yield 120;
      Flow.finish(g, 'practice');
    },
    finish(g, kind) { g.result = { kind, score: g.score, continues: g.continues }; },
  };
})();
