'use strict';
// ============================================================
//  Game — 遊戲本體
// ============================================================
(function () {
  const U = FW.U, Input = FW.Input, Save = FW.Save, Art = FW.Art, Spr = FW.Sprites, A = () => FW.Audio;
  const W = FW.PF.w, H = FW.PF.h;
  const FONT = '"Noto Sans TC","PingFang TC","Microsoft JhengHei",sans-serif';
  FW.FONT = FONT;
  const DIFF = FW.DIFF = {
    easy: { name: 'Easy', label: '簡單', dens: 0.6, spd: 0.82, lives: 4, dbWin: 16, col: '#7ae08a' },
    normal: { name: 'Normal', label: '普通', dens: 0.92, spd: 0.95, lives: 3, dbWin: 10, col: '#7ab8ff' },
    hard: { name: 'Hard', label: '困難', dens: 1.3, spd: 1.1, lives: 3, dbWin: 8, col: '#ff8a6a' },
  };
  const EXTENDS = [5e6, 15e6, 30e6, 50e6, 80e6];

  // ---------------- 自機 ----------------
  class Player {
    constructor(g, ch) {
      this.g = g; this.ch = ch; this.x = W / 2; this.y = H - 80; this.r = 2.6; this.grazeR = 22;
      this.invuln = 120; this.dead = 0; this.dbTimer = 0; this.t = 0; this.lean = 0; this.focus = false;
      this.cache = Art.cacheChibi(ch.spec, 0.2);
      this.opts = []; for (let i = 0; i < 4; i++) this.opts.push({ x: this.x, y: this.y });
      this.cool = 0; this.visible = true; this.focusAnim = 0; this.lastDX = 0; this.hist = [];
    }
    get L() { return Math.floor(this.g.power); }
    update() {
      const g = this.g; this.t++;
      if (this.dead > 0) {
        this.dead--;
        if (this.dead === 0) { this.x = W / 2; this.y = H + 30; this.invuln = 200; this.respawn = 30; }
        return;
      }
      if (this.respawn > 0) { this.respawn--; this.y = U.lerp(this.y, H - 80, 0.15); return; }
      if (this.dbTimer > 0) {
        this.dbTimer--;
        if (Input.hit('bomb') && g.bombs > 0 && !g.bombFx) { this.dbTimer = 0; g.useBomb(true); }
        else if (this.dbTimer === 0) g.killPlayer();
        return;
      }
      if (this.invuln > 0) this.invuln--;
      const canMove = !g.freezePlayer;
      this.focus = Input.held('focus');
      this.focusAnim = U.lerp(this.focusAnim, this.focus ? 1 : 0, 0.2);
      let dx = 0, dy = 0;
      if (canMove) {
        if (Input.held('left')) dx--; if (Input.held('right')) dx++; if (Input.held('up')) dy--; if (Input.held('down')) dy++;
      }
      const sp = this.focus ? this.ch.focusSpeed : this.ch.speed;
      const n = dx && dy ? Math.SQRT1_2 : 1;
      let tx = 0, ty = 0;
      if (canMove && FW.touchMode) { const tm = Input.touchMove, cap = 14; tx = U.clamp(tm.x, -cap, cap); ty = U.clamp(tm.y, -cap, cap); if (Math.abs(tx) > 0.5) dx = U.sign(tx); }
      this.x = U.clamp(this.x + dx * sp * n * (tx ? 0 : 1) + tx, 10 + g.wallL, W - 10 - g.wallR); this.y = U.clamp(this.y + dy * sp * n * (ty ? 0 : 1) + ty, 18, H - 18);
      this.lean = U.lerp(this.lean, dx, 0.2); this.lastDX = dx;
      this.hist.push(dx, dy); if (this.hist.length > 120) this.hist.splice(0, 2);
      // 選項位置
      const L = this.L, F = this.focus;
      for (let i = 0; i < 4; i++) {
        const o = this.opts[i]; let tx, ty;
        const idx = i - (L - 1) / 2;
        if (this.ch.id === 'shio' && !F && Input.mouse.inside && FW.frame - Input.mouse.lastMove < 240) {
          const mx = Input.mouse.x - FW.PF.x, my = Input.mouse.y - FW.PF.y;
          tx = U.clamp(mx + Math.cos(this.t * 0.08 + i * TAU / L) * 26, 0, W); ty = U.clamp(my + Math.sin(this.t * 0.08 + i * TAU / L) * 26, 0, H);
          o.mouse = true;
        } else {
          o.mouse = false;
          if (F) { tx = this.x + idx * 14; ty = this.y - 28 - Math.abs(idx) * 4; }
          else { tx = this.x + idx * 30; ty = this.y + 10 - Math.abs(idx) * 8; }
        }
        const k = o.mouse ? 0.12 : 0.35;
        o.x = U.lerp(o.x, tx, k); o.y = U.lerp(o.y, ty, k);
      }
      // 射擊
      if (this.cool > 0) this.cool--;
      if ((Input.held('shoot') || FW.touchMode) && !g.dialog && !g.noShoot) { this.fire(); }
      else this.beam = null;
    }
    fire() {
      const g = this.g, L = this.L, F = this.focus, id = this.ch.id, t = this.t;
      const P = (x, y, vx, vy, dmg, sp, opts = {}) => g.pshots.push(Object.assign({ x, y, vx, vy, dmg, sp, r: 8, t: 0 }, opts));
      if (id === 'akane') { this.beam = true; if (t % 4 === 0) A().sfx('shoot'); return; }
      this.beam = null;
      if (t % 4 === 0 && id !== 'natsume' && id !== 'chiyo') {
        const nd = Spr.pshot('needle', this.ch.color);
        P(this.x - 6, this.y - 10, 0, -22, id === 'suzu' ? 2.2 : 2.6, nd); P(this.x + 6, this.y - 10, 0, -22, id === 'suzu' ? 2.2 : 2.6, nd);
        A().sfx('shoot');
      }
      if (id === 'rinne' && t % 8 === 0) {
        const s = Spr.pshot('star', '#9ac0ff');
        for (let i = 0; i < L; i++) { const o = this.opts[i]; P(o.x, o.y, (i - (L - 1) / 2) * (F ? 0.5 : 2), -10, 3.2, s, { homing: true, spin: true }); }
      } else if (id === 'chiyo' && t % 6 === 0) {
        const n = 1 + L * 2, spread = F ? 0.22 : 0.85, gl = '言靈啊哦！？…ゞ嗯欸';
        for (let i = 0; i < n; i++) { const a = -Math.PI / 2 + (n > 1 ? (i / (n - 1) - 0.5) * spread : 0); P(this.x, this.y - 12, Math.cos(a) * 15, Math.sin(a) * 15, 2.4, Spr.bullet('glyph', 'orange', gl[(t / 6 + i) % gl.length | 0]), { scale: 0.75 }); }
        A().sfx('shoot');
      } else if (id === 'shio' && t % 6 === 0) {
        const s = Spr.pshot('cursor', '#5a8aff');
        for (let i = 0; i < L; i++) { const o = this.opts[i]; let ang = -Math.PI / 2; const tg = g.nearestEnemy(o.x, o.y); if (tg && o.mouse) ang = U.ang(o.x, o.y, tg.x, tg.y); P(o.x, o.y, Math.cos(ang) * 16, Math.sin(ang) * 16, 2.6, s, { rot: ang + Math.PI / 2 }); }
      } else if (id === 'natsume' && t % 10 === 0) {
        const n = 1 + L, s = Spr.pshot('page', '#9a3ad0');
        for (let i = 0; i < n; i++) { const off = (i - (n - 1) / 2); P(this.x + off * (F ? 8 : 20), this.y - 8, off * (F ? 0.2 : 1.2), F ? -12 : -9, 6.2, s, { pierce: new Set(), r: 12 }); }
        A().sfx('shoot');
      } else if (id === 'suzu' && t % 6 === 0) {
        const n = L + 2, s = Spr.bullet('note', 'orange');
        for (let i = 0; i < n; i++) { const a = -Math.PI / 2 + (i / (n - 1) - 0.5) * (F ? 0.3 : 1.4); P(this.x, this.y - 8, Math.cos(a) * 12, Math.sin(a) * 12, 2.4, s, { bounce: 2, scale: 0.8 }); }
      }
    }
    beamTargets() { // 茜的雷射
      const L = this.L, F = this.focus, arr = [{ x: this.x, w: F ? 9 : 6, dmg: F ? 1.3 : 0.9 }];
      for (let i = 0; i < L - 1; i++) { const o = this.opts[i]; arr.push({ x: o.x, w: F ? 5 : 4, dmg: F ? 0.6 : 0.5, oy: o.y }); }
      return arr;
    }
    draw(ctx) {
      const g = this.g;
      if (this.dead > 0) return;
      if (this.ch.id === 'akane' && this.beam) this.drawBeams(ctx);
      // 選項
      const L = this.L;
      for (let i = 0; i < L; i++) {
        const o = this.opts[i];
        ctx.save(); ctx.translate(o.x, o.y); ctx.rotate(this.t * 0.08);
        ctx.fillStyle = U.rgba(this.ch.color, 0.35); ctx.beginPath(); ctx.arc(0, 0, 9, 0, TAU); ctx.fill();
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.strokeRect(-4.5, -4.5, 9, 9);
        if (this.ch.id === 'shio' && o.mouse) { ctx.rotate(-this.t * 0.08); ctx.drawImage(Spr.pshot('cursor', '#5a8aff').c, -10, -10, 20, 20); }
        ctx.restore();
      }
      const blink = this.invuln > 0 && Math.floor(this.t / 3) % 2 === 0;
      if (blink) ctx.globalAlpha = 0.45;
      Art.drawCached(ctx, this.cache, this.x, this.y - 2, this.t, this.lean);
      ctx.globalAlpha = 1;
      if (this.focusAnim > 0.02) {
        const a = this.focusAnim;
        ctx.save(); ctx.translate(this.x, this.y);
        ctx.globalAlpha = a;
        ctx.rotate(this.t * 0.04); ctx.strokeStyle = U.rgba(this.ch.color, 0.8); ctx.lineWidth = 1.5; ctx.setLineDash([6, 6]);
        ctx.beginPath(); ctx.arc(0, 0, 30 - (1 - a) * 10, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
        ctx.rotate(-this.t * 0.08); ctx.beginPath(); ctx.arc(0, 0, 24, 0, TAU); ctx.strokeStyle = U.rgba('#ffffff', 0.4); ctx.stroke();
        ctx.restore();
        ctx.beginPath(); ctx.arc(this.x, this.y, 4.5, 0, TAU); ctx.fillStyle = '#fff'; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = '#ff2040'; ctx.stroke();
      }
      if (this.dbTimer > 0) { ctx.beginPath(); ctx.arc(this.x, this.y, 30 - this.dbTimer, 0, TAU); ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.stroke(); }
    }
    drawBeams(ctx) {
      const g = this.g;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (const b of (this._beams || [])) {
        const top = b.hitY !== undefined ? b.hitY : -10, y0 = (b.oy || this.y) - 12;
        const w = b.w * (1 + Math.sin(this.t * 0.5) * 0.15);
        const lg = ctx.createLinearGradient(b.x - w * 2, 0, b.x + w * 2, 0);
        lg.addColorStop(0, 'rgba(255,60,90,0)'); lg.addColorStop(0.35, 'rgba(255,80,110,0.55)'); lg.addColorStop(0.5, 'rgba(255,255,255,0.95)'); lg.addColorStop(0.65, 'rgba(255,80,110,0.55)'); lg.addColorStop(1, 'rgba(255,60,90,0)');
        ctx.fillStyle = lg; ctx.fillRect(b.x - w * 2, top, w * 4, y0 - top);
        if (b.hitY !== undefined) { ctx.fillStyle = 'rgba(255,200,220,0.6)'; ctx.beginPath(); ctx.arc(b.x, top, w * 2 + Math.random() * 4, 0, TAU); ctx.fill(); }
      }
      ctx.restore();
    }
  }

  // ---------------- Game ----------------
  class Game {
    constructor(opt) {
      this.opt = opt; this.mode = opt.mode; this.charId = opt.char; this.ch = FW.CHARS[opt.char];
      this.diff = opt.diff || 'normal'; this.D = DIFF[this.diff];
      this.t = 0; this.stageT = 0;
      this.bullets = []; this.lasers = []; this.pshots = []; this.enemies = []; this.items = []; this.fx = []; this.popups = [];
      this.boss = null; this.dialog = null; this.bombFx = null; this.banner = null; this.cutin = null; this.spellBg = 0;
      this.score = 0; this.lives = this.D.lives; this.bombs = 3; this.power = opt.mode === 'practice' ? 4 : 1; this.graze = 0;
      this.lifePieces = 0; this.bombPieces = 0; this.pointValue = 10000; this.extendIdx = 0;
      this.continues = 0; this.deaths = 0; this.bombsUsed = 0; this.spellCaps = 0; this.spellTries = 0;
      this.wallL = 0; this.wallR = 0; this.frameStretch = 0; this.shakeAmt = 0; this.flash = 0; this.flashCol = '#fff';
      this.freezeWorld = 0; this.freezePlayer = false; this.noShoot = false; this.collectAll = 0;
      this.bgKey = 'hill'; this.bgPrev = null; this.bgFade = 1; this.bgSpeed = 1;
      this.player = new Player(this, this.ch);
      this.tasks = new FW.TaskList();
      this.hiKey = this.mode + ':' + this.charId + ':' + this.diff;
      this.hi = Save.data.hi[this.hiKey] || 0;
      this.stage = opt.stage || 1; this.lv = 1;
      this.endlessTime = 0; this.endlessLoops = 0; this.noContTime = 0;
      this.result = null; this.overlayTexts = [];
      this.over = false;
      this.tasks.add(FW.Flow.main(this));
    }
    // ---------- 工具 ----------
    n(base) { return Math.max(1, Math.round(base * this.D.dens)); }
    get P() { return this.player; }
    aim(x, y) { return Math.atan2(this.player.y - y, this.player.x - x); }
    shot(x, y, ang, speed, type = 'orb', color = 'red', o) {
      const sp = Spr.bullet(type, color, o && o.glyph);
      const b = { x, y, angle: ang, speed: speed * this.D.spd, type, color, sp, r: sp.hit, t: 0, spawn: 8, acc: 0, w: 0, grazed: false, dead: false, alpha: 1 };
      if (o) Object.assign(b, o);
      if (b.maxSpeed !== undefined) b.maxSpeed *= this.D.spd;
      if (b.task) b.task = new FW.Task(typeof b.task === 'function' ? b.task(b, this) : b.task);
      this.bullets.push(b);
      return b;
    }
    ring(x, y, n, speed, type, color, off = 0, o) { const out = []; for (let i = 0; i < n; i++) out.push(this.shot(x, y, off + i * TAU / n, speed, type, color, o)); return out; }
    fan(x, y, center, n, spread, speed, type, color, o) { const out = []; for (let i = 0; i < n; i++) out.push(this.shot(x, y, center + (n > 1 ? (i / (n - 1) - 0.5) * spread : 0), speed, type, color, o)); return out; }
    laser(x, y, angle, len, w, warn, dur, color = 'red', o) {
      const l = Object.assign({ x, y, angle, len, w, warn, dur, color, t: 0, dead: false }, o || {});
      this.lasers.push(l); return l;
    }
    sfx(n, o) { A().sfx(n, o); }
    shake(a) { if (Save.data.settings.shake) this.shakeAmt = Math.max(this.shakeAmt, a); }
    doFlash(a, col = '#fff') { this.flash = a; this.flashCol = col; }
    nearestEnemy(x, y) {
      let best = null, bd = 1e9;
      for (const e of this.enemies) { if (e.dead || e.y < -10 || e.invisible) continue; const d = (e.x - x) ** 2 + (e.y - y) ** 2; if (d < bd) { bd = d; best = e; } }
      return best;
    }
    text(x, y, s, col = '#fff', size = 14, life = 50) { this.popups.push({ x, y, s, col, size, life, max: life }); }
    spark(x, y, col, n = 8, sp = 3) { for (let i = 0; i < n; i++) { const a = Math.random() * TAU, v = Math.random() * sp + 1; this.fx.push({ type: 'spark', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 20 + Math.random() * 15, max: 35, col }); } }
    ringFx(x, y, col, r = 60, life = 30) { this.fx.push({ type: 'ring', x, y, r, life, max: life, col }); }
    clearBullets(toItems = true, cond) {
      let n = 0;
      for (const b of this.bullets) {
        if (b.dead || (cond && !cond(b))) continue;
        b.dead = true; n++;
        if (toItems && this.items.length < 600 && n % 2 === 0) this.items.push({ type: 'star', x: b.x, y: b.y, vy: -1, vx: 0, auto: true, t: 0 });
        if (n < 160) this.fx.push({ type: 'pop', x: b.x, y: b.y, life: 14, max: 14, col: Spr.COL[b.color] || '#fff' });
      }
      for (const l of this.lasers) if (!cond) l.dead = true;
      if (n > 0 && toItems) this.sfx('cancel');
      return n;
    }
    // ---------- 敵人 ----------
    enemy(o, gen) {
      const e = Object.assign({ x: 0, y: -30, hp: 20, r: 14, color: 'blue', big: false, t: 0, dead: false, drops: { power: 1, point: 1 }, tasks: new FW.TaskList(), hitFlash: 0, lean: 0, px: 0 }, o);
      e.maxHp = e.hp; e.px = e.x;
      e.cache = e.boss ? e.cache : Art.getFairy(e.color, e.big);
      if (gen) e.tasks.add(gen(e));
      this.enemies.push(e);
      return e;
    }
    *moveTo(e, x, y, frames, ease = U.easeInOut) {
      const x0 = e.x, y0 = e.y;
      for (let i = 1; i <= frames; i++) { const k = ease(i / frames); e.x = x0 + (x - x0) * k; e.y = y0 + (y - y0) * k; yield 1; }
    }
    damageEnemy(e, d) {
      if (e.dead || e.invuln) return;
      if (e.boss) { if (e.invulnNow || e.mid && e.idx >= e.phases.length) return; d *= e.armor || 1; }
      e.hp -= d; e.hitFlash = 3;
      if (this.t % 6 === 0) this.sfx('hit');
      this.score += Math.ceil(d * 2);
      if (e.hp <= 0 && !e.boss) this.killEnemy(e);
    }
    killEnemy(e) {
      e.dead = true;
      this.sfx(e.big ? 'bigkill' : 'kill');
      this.spark(e.x, e.y, Spr.COL[e.color] || '#fff', e.big ? 24 : 10, e.big ? 5 : 3);
      this.ringFx(e.x, e.y, Spr.COL[e.color] || '#fff', e.big ? 80 : 40);
      this.score += e.big ? 3000 : 300;
      this.dropItems(e.x, e.y, e.drops);
      if (e.onDeath) e.onDeath(e);
    }
    dropItems(x, y, d) {
      const add = (type, n) => { for (let i = 0; i < n; i++) this.items.push({ type, x: x + U.rnd(-1, 1) * (8 + n * 3), y: y + U.rnd(-1, 1) * (8 + n * 3), vy: -2.6 - Math.random(), vx: 0, t: 0 }); };
      if (d.power) add(this.power >= 4 ? 'point' : 'power', d.power);
      if (d.point) add('point', d.point);
      if (d.bigpower) add('bigpower', d.bigpower);
      if (d.lifepiece) add('lifepiece', d.lifepiece);
      if (d.bombpiece) add('bombpiece', d.bombpiece);
      if (d.life) add('life', d.life);
      if (d.bomb) add('bomb', d.bomb);
      if (d.full) add('full', d.full);
    }
    // ---------- 自機死亡 / 炸彈 ----------
    hitPlayer() {
      const p = this.player;
      if (p.invuln > 0 || p.dead > 0 || p.dbTimer > 0 || this.bombFx || p.respawn > 0) return;
      if (Save.data.settings.autoBomb && this.bombs > 0) { this.useBomb(true); return; }
      p.dbTimer = this.D.dbWin;
      this.sfx('death');
    }
    killPlayer() {
      const p = this.player;
      this.deaths++; Save.data.deaths++; FW.Outside.vibrate(70);
      if (this.boss && this.boss.phase && this.boss.phase.spell) this.boss.captured = false;
      this.spark(p.x, p.y, '#ffffff', 40, 7); this.ringFx(p.x, p.y, this.ch.color, 140, 40);
      this.shake(8); this.doFlash(0.5, '#ffffff');
      this.clearBullets(false, b => U.dist(b.x, b.y, p.x, p.y) < 200);
      // 掉落火力
      const loss = Math.min(this.power - 1, 0.5);
      this.power = Math.max(1, this.power - 0.5);
      for (let i = 0; i < Math.round(loss / 0.05 * 0.6); i++) this.items.push({ type: 'power', x: p.x + U.rnd(-60, 60), y: p.y - U.rnd(40, 120), vy: -3, vx: 0, t: 0 });
      p.dead = 50;
      this.lives--;
      if (this.lives < 0) { this.lives = 0; this.gameOverPending = 60; }
      else { this.bombs = Math.max(this.bombs, 3); }
      if (FW.Meta) FW.Meta.onDeath(this);
    }
    useBomb(deathbomb) {
      if (this.bombs <= 0 || this.bombFx) return;
      this.bombs--; this.bombsUsed++; Save.data.bombs++;
      if (this.boss && this.boss.phase && this.boss.phase.spell) this.boss.captured = false;
      const B = FW.Bombs[this.charId];
      this.bombFx = new B(this);
      this.player.invuln = Math.max(this.player.invuln, this.bombFx.dur + 60);
      this.collectAll = 60;
      this.sfx('bomb'); FW.Outside.vibrate(25);
      if (deathbomb) this.text(this.player.x, this.player.y - 30, '決死！', '#ffd36b', 18);
    }
    addScore(n) {
      this.score += n;
      while (this.extendIdx < EXTENDS.length && this.score >= EXTENDS[this.extendIdx]) { this.extendIdx++; this.extend(); }
      if (this.mode === 'endless' && this.score >= (this.nextEndlessExtend || 110e6)) { this.nextEndlessExtend = (this.nextEndlessExtend || 110e6) + 40e6; this.extend(); }
    }
    extend() { if (this.lives < 8) { this.lives++; this.sfx('extend'); this.text(this.player.x, this.player.y - 40, 'Extend!!', '#ff9ad6', 22, 80); } else { this.bombs = Math.min(8, this.bombs + 1); } }
    // ---------- 對話 ----------
    *talk(lines, L, R) {
      this.dialog = new FW.Dialog(this, lines, L || this.charId, R);
      this.noShoot = true;
      yield () => this.dialog.done;
      this.dialog = null; this.noShoot = false;
    }
    // ---------- 更新 ----------
    update() {
      this.t++;
      if (this.gameOverPending) { this.gameOverPending--; if (this.gameOverPending === 0) { this.over = true; return; } }
      if (this.dialog) this.dialog.update();
      if (this.hitstop > 0) { this.hitstop--; return; }
      const frozen = this.freezeWorld > 0;
      if (this.freezeWorld > 0) this.freezeWorld--;
      this.player.update();
      if (!frozen) this.tasks.step();
      if (Input.hit('bomb') && !this.dialog && this.player.dead === 0 && !this.player.dbTimer && !this.player.respawn) this.useBomb(false);
      if (this.bombFx) { this.bombFx.update(); if (this.bombFx.done) this.bombFx = null; }
      if (this.boss && !frozen) this.boss.update();
      if (!frozen) {
        for (const e of this.enemies) { if (!e.boss) { e.t++; e.tasks.step(); } if (e.hitFlash > 0) e.hitFlash--; e.lean = U.lerp(e.lean, U.clamp((e.x - e.px) * 0.6, -1, 1), 0.2); e.px = e.x; }
        this.updateBullets();
        this.updateLasers();
      }
      for (const o of this.overlayTexts.slice()) if (o.update) o.update();
      if (FW.HUD.whisper) FW.HUD.whisperT++;
      this.updatePShots();
      this.updateItems();
      this.collide();
      // 清理
      this.enemies = this.enemies.filter(e => !e.dead && !(e.t > 60 && !e.boss && (e.x < -80 || e.x > W + 80 || e.y < -100 || e.y > H + 80)));
      if (this.bullets.length > 0) this.bullets = this.bullets.filter(b => !b.dead);
      this.lasers = this.lasers.filter(l => !l.dead);
      this.pshots = this.pshots.filter(s => !s.dead);
      this.items = this.items.filter(i => !i.dead);
      for (const f of this.fx) { f.life--; if (f.type === 'spark') { f.x += f.vx; f.y += f.vy; f.vx *= 0.94; f.vy *= 0.94; } }
      this.fx = this.fx.filter(f => f.life > 0);
      for (const p of this.popups) { p.life--; p.y -= 0.6; }
      this.popups = this.popups.filter(p => p.life > 0);
      if (this.shakeAmt > 0) this.shakeAmt *= 0.88; if (this.shakeAmt < 0.3) this.shakeAmt = 0;
      if (this.flash > 0) this.flash -= 0.04;
      if (this.collectAll > 0) this.collectAll--;
      if (this.bgFade < 1) this.bgFade = Math.min(1, this.bgFade + 0.01);
      const wantSpell = this.boss && this.boss.phase && this.boss.phase.spell && !this.boss.phaseWait ? 1 : 0;
      this.spellBg = U.lerp(this.spellBg, wantSpell, 0.05);
      if (this.cutin) { this.cutin.t++; if (this.cutin.t > 110) this.cutin = null; }
      if (this.banner) this.banner.t++;
      if (this.stageCard) { this.stageCard.t++; if (this.stageCard.t > 300) this.stageCard = null; }
      if (this.score > this.hi) this.hi = this.score;
      if (this.mode === 'endless' && !this.dialog) { this.endlessTime++; this.noContTime++; }
      this.stageT++;
      Save.data.playTime += 1 / 60;
    }
    updateBullets() {
      const p = this.player;
      for (const b of this.bullets) {
        if (b.dead) continue;
        b.t++; if (b.spawn > 0) b.spawn--;
        if (b.task) b.task.step();
        if (b.fn) b.fn(b, this);
        if (b.free) { b.vx += b.ax || 0; b.vy += b.ay || 0; b.x += b.vx; b.y += b.vy; if (b.orientFree) b.angle = Math.atan2(b.vy, b.vx); }
        else {
          b.speed += b.acc;
          if (b.maxSpeed !== undefined && b.speed > b.maxSpeed) b.speed = b.maxSpeed;
          if (b.minSpeed !== undefined && b.speed < b.minSpeed) b.speed = b.minSpeed;
          b.angle += b.w;
          b.x += Math.cos(b.angle) * b.speed; b.y += Math.sin(b.angle) * b.speed;
        }
        if (b.bounceWalls && b.bounceWalls > 0) {
          if (b.x < this.wallL || b.x > W - this.wallR) { b.angle = Math.PI - b.angle; b.x = U.clamp(b.x, this.wallL, W - this.wallR); b.bounceWalls--; if (b.free) b.vx = -b.vx; }
          else if (b.y < 0 && b.t > 5) { b.angle = -b.angle; b.y = 0; b.bounceWalls--; if (b.free) b.vy = -b.vy; }
        }
        const m = b.keep ? 400 : 40;
        if (b.x < -m || b.x > W + m || b.y < -m || b.y > H + m) { if (b.t > 10) b.dead = true; }
        if (b.life && b.t > b.life) b.dead = true;
      }
    }
    updateLasers() {
      for (const l of this.lasers) {
        l.t++;
        if (l.fn) l.fn(l, this);
        if (l.t > l.warn + l.dur) l.dead = true;
      }
    }
    updatePShots() {
      const p = this.player;
      for (const s of this.pshots) {
        s.t++;
        if (s.homing) {
          const e = this.nearestEnemy(s.x, s.y);
          if (e) { const a = U.ang(s.x, s.y, e.x, e.y), sp = 11; const ca = Math.atan2(s.vy, s.vx); const na = ca + U.clamp(U.angDiff(ca, a), -0.18, 0.18); s.vx = Math.cos(na) * sp; s.vy = Math.sin(na) * sp; }
        }
        s.x += s.vx; s.y += s.vy;
        if (s.bounce > 0 && (s.x < this.wallL || s.x > W - this.wallR)) { s.vx = -s.vx; s.bounce--; s.x = U.clamp(s.x, this.wallL, W - this.wallR); }
        if (s.x < -30 || s.x > W + 30 || s.y < -30 || s.y > H + 30 || s.t > 200) s.dead = true;
      }
      // 雷射（茜）
      p._beams = null;
      if (p.beam) {
        const beams = p.beamTargets();
        for (const b of beams) {
          let best = null, by = -1e9; const y0 = b.oy || p.y;
          for (const e of this.enemies) { if (e.dead || e.invisible || e.y > y0 || e.y < -20) continue; if (Math.abs(e.x - b.x) < e.r + b.w && e.y > by) { by = e.y; best = e; } }
          if (best) { b.hitY = best.y + 6; this.damageEnemy(best, b.dmg); if (this.t % 4 === 0) this.spark(b.x, best.y + 10, '#ff8090', 1, 2); }
        }
        p._beams = beams;
      }
    }
    updateItems() {
      const p = this.player, alive = p.dead === 0;
      for (const it of this.items) {
        it.t++;
        const d = U.dist(it.x, it.y, p.x, p.y);
        const auto = alive && (it.auto || this.collectAll > 0 || p.y < 150 || (it.magnet));
        if (auto || (alive && d < (p.focus ? 70 : 45))) {
          if (auto && !it.magnet) it.magnet = true;
          const a = U.ang(it.x, it.y, p.x, p.y), sp = it.type === 'star' ? 12 : 10;
          it.x += Math.cos(a) * sp; it.y += Math.sin(a) * sp;
        } else {
          it.vy = Math.min(it.vy + 0.08, 2.6); it.y += it.vy; it.x += it.vx;
          if (it.y > H + 20) it.dead = true;
        }
        if (alive && d < 18) { it.dead = true; this.collect(it); }
      }
    }
    collect(it) {
      const p = this.player;
      switch (it.type) {
        case 'power': { const before = Math.floor(this.power); this.power = Math.min(4, this.power + 0.05); if (Math.floor(this.power) > before) { this.sfx('powerup'); this.text(p.x, p.y - 30, this.power >= 4 ? 'MAX POWER!' : 'Power Up', '#ff8a8a', 14); if (this.power >= 4) this.collectAll = 50; } else this.sfx('item'); this.addScore(this.power >= 4 ? 1000 : 10); break; }
        case 'bigpower': { this.power = Math.min(4, this.power + 1); this.sfx('powerup'); break; }
        case 'full': { this.power = 4; this.sfx('powerup'); this.collectAll = 50; break; }
        case 'point': { const v = it.magnet && it.y < 200 ? this.pointValue : Math.floor(this.pointValue * U.clamp(1 - (it.y - 150) / 900, 0.3, 1)); this.addScore(v); this.sfx('item'); if (v >= this.pointValue) this.text(it.x, it.y, v, '#ffe680', 11, 30); else this.text(it.x, it.y, v, '#ffffff', 10, 25); break; }
        case 'star': this.addScore(100 + Math.floor(this.graze / 10) * 10); this.pointValue = Math.min(1e6, this.pointValue + 10); break;
        case 'lifepiece': this.lifePieces++; this.sfx('item'); this.text(p.x, p.y - 30, '殘機碎片 ' + this.lifePieces + '/3', '#ff9ad6', 14); if (this.lifePieces >= 3) { this.lifePieces = 0; this.extend(); } break;
        case 'bombpiece': this.bombPieces++; this.sfx('item'); this.text(p.x, p.y - 30, '符卡碎片 ' + this.bombPieces + '/3', '#9af0b0', 14); if (this.bombPieces >= 3) { this.bombPieces = 0; this.bombs = Math.min(8, this.bombs + 1); this.sfx('extend'); } break;
        case 'life': this.extend(); break;
        case 'bomb': this.bombs = Math.min(8, this.bombs + 1); this.sfx('extend'); this.text(p.x, p.y - 30, 'Spell Card Get!', '#9af0b0', 16); break;
      }
    }
    collide() {
      const p = this.player;
      // 自機彈 vs 敵
      for (const s of this.pshots) {
        if (s.dead) continue;
        for (const e of this.enemies) {
          if (e.dead || e.invisible) continue;
          const rr = e.r + s.r;
          if ((e.x - s.x) ** 2 + (e.y - s.y) ** 2 < rr * rr) {
            if (s.pierce) { if (s.pierce.has(e)) continue; s.pierce.add(e); this.damageEnemy(e, s.dmg); this.spark(s.x, s.y, '#d0a0ff', 2, 2); continue; }
            this.damageEnemy(e, s.dmg); s.dead = true;
            if (Math.random() < 0.3) this.fx.push({ type: 'pop', x: s.x, y: s.y, life: 8, max: 8, col: this.ch.color });
            break;
          }
        }
      }
      if (p.dead > 0 || p.respawn > 0) return;
      const hb = p.r, gr = p.grazeR;
      for (const b of this.bullets) {
        if (b.dead || b.spawn > 2 || b.harmless) continue;
        const dx = b.x - p.x, dy = b.y - p.y, d2 = dx * dx + dy * dy;
        const hr = b.r * (b.scale || 1) * 0.75 + hb;
        if (d2 < gr * gr) {
          if (!b.grazed) { b.grazed = true; this.graze++; Save.data.grazeTotal++; this.addScore(500); this.sfx('graze'); this.fx.push({ type: 'spark', x: p.x + dx * 0.5, y: p.y + dy * 0.5, vx: U.rnd(-2, 2), vy: U.rnd(-2, 2), life: 12, max: 12, col: '#ffffff' }); }
          if (d2 < hr * hr) { if (p.invuln <= 0) { this.hitPlayer(); if (!this.bombFx) b.dead = true; } }
        }
      }
      for (const l of this.lasers) {
        if (l.t < l.warn || l.harmless) continue;
        const k = l.t - l.warn, wNow = l.w * Math.min(1, k / 8) * (k > l.dur - 10 ? Math.max(0, (l.dur - k) / 10) : 1);
        if (wNow < 3) continue;
        const ex = l.x + Math.cos(l.angle) * l.len, ey = l.y + Math.sin(l.angle) * l.len;
        const d = segDist(p.x, p.y, l.x, l.y, ex, ey);
        if (d < wNow * 0.33 + hb && p.invuln <= 0) this.hitPlayer();
        else if (d < wNow * 0.5 + 20 && this.t % 6 === 0) { this.graze++; this.addScore(300); this.sfx('graze'); }
      }
      for (const e of this.enemies) {
        if (e.dead || e.invisible || e.noBody) continue;
        const rr = e.r * 0.6 + hb;
        if ((e.x - p.x) ** 2 + (e.y - p.y) ** 2 < rr * rr && p.invuln <= 0) this.hitPlayer();
      }
    }
    // ---------- 繪製 ----------
    drawField(ctx) {
      // 背景
      const bgf = FW.BG[this.bgKey];
      ctx.save();
      if (this.bgPrev && this.bgFade < 1) { FW.BG[this.bgPrev](ctx, this.t * this.bgSpeed); ctx.globalAlpha = this.bgFade; }
      bgf(ctx, this.t * this.bgSpeed);
      ctx.restore();
      if (this.spellBg > 0.01 && this.boss) FW.BG.spell(ctx, this.t, this.boss.ch.color, this.spellBg * 0.9, this.boss.phase && this.boss.phase.bg);
      if (this.bgDim) { ctx.fillStyle = `rgba(0,0,0,${this.bgDim})`; ctx.fillRect(0, 0, W, H); }
      if (this.bombFx && this.bombFx.drawUnder) this.bombFx.drawUnder(ctx);
      for (const o of this.overlayTexts.slice()) if (o.under) o.draw(ctx, this);
      // 牆（鈴的縮框）
      if (this.wallL > 0 || this.wallR > 0) {
        ctx.fillStyle = 'rgba(10,10,20,0.85)'; ctx.fillRect(0, 0, this.wallL, H); ctx.fillRect(W - this.wallR, 0, this.wallR, H);
        ctx.fillStyle = '#ff9a3c'; ctx.fillRect(this.wallL - 3, 0, 3, H); ctx.fillRect(W - this.wallR, 0, 3, H);
      }
      // 道具
      for (const it of this.items) { const sp = Spr.item(it.type); ctx.drawImage(sp.c, it.x - sp.w / 2, it.y - sp.h / 2, sp.w, sp.h); }
      // 敵人
      for (const e of this.enemies) {
        if (e.boss || e.invisible) continue;
        if (e.hitFlash > 0) ctx.globalAlpha = 0.7;
        Art.drawCached(ctx, e.cache, e.x, e.y, e.t + (e.seed || 0), e.lean);
        ctx.globalAlpha = 1;
      }
      if (this.boss) this.boss.draw(ctx);
      this.player.draw(ctx);
      // 自機彈
      ctx.globalAlpha = 0.85;
      for (const s of this.pshots) { const sp = s.sp, sc = s.scale || 1; if (s.spin || s.rot) { ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(s.rot || s.t * 0.2); ctx.drawImage(sp.c, -sp.w / 2 * sc, -sp.h / 2 * sc, sp.w * sc, sp.h * sc); ctx.restore(); } else ctx.drawImage(sp.c, s.x - sp.w / 2 * sc, s.y - sp.h / 2 * sc, sp.w * sc, sp.h * sc); }
      ctx.globalAlpha = 1;
      // 雷射
      for (const l of this.lasers) this.drawLaser(ctx, l);
      // 子彈
      this.drawBullets(ctx);
      // 特效
      for (const f of this.fx) {
        const k = f.life / f.max;
        if (f.type === 'spark') { ctx.fillStyle = f.col; ctx.globalAlpha = k; ctx.fillRect(f.x - 1.5, f.y - 1.5, 3, 3); }
        else if (f.type === 'ring') { ctx.globalAlpha = k; ctx.strokeStyle = f.col; ctx.lineWidth = 3 * k; ctx.beginPath(); ctx.arc(f.x, f.y, f.r * (1 - k * k), 0, TAU); ctx.stroke(); }
        else if (f.type === 'pop') { ctx.globalAlpha = k * 0.8; ctx.strokeStyle = f.col; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(f.x, f.y, 10 * (1.5 - k), 0, TAU); ctx.stroke(); }
      }
      ctx.globalAlpha = 1;
      for (const p of this.popups) { ctx.globalAlpha = Math.min(1, p.life / 15); ctx.font = `bold ${p.size}px ${FONT}`; ctx.textAlign = 'center'; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.strokeText(p.s, p.x, p.y); ctx.fillStyle = p.col; ctx.fillText(p.s, p.x, p.y); }
      ctx.globalAlpha = 1;
      // 撿取線提示
      if (this.t < 300 && this.stageT < 300) { ctx.globalAlpha = Math.max(0, 1 - this.stageT / 300) * 0.6; ctx.setLineDash([8, 6]); ctx.strokeStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(0, 150); ctx.lineTo(W, 150); ctx.stroke(); ctx.setLineDash([]); ctx.font = `13px ${FONT}`; ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.fillText('— 道具自動回收線 —', W / 2, 143); ctx.globalAlpha = 1; }
      if (this.bombFx && this.bombFx.drawField) this.bombFx.drawField(ctx);
      if (this.boss) this.boss.drawUI(ctx);
      if (this.cutin) this.drawCutin(ctx);
      if (this.stageCard) this.drawStageCard(ctx);
      for (const o of this.overlayTexts.slice()) if (!o.under) o.draw(ctx, this);
      if (this.dialog) this.dialog.draw(ctx);
      if (this.flash > 0) { ctx.fillStyle = this.flashCol; ctx.globalAlpha = Math.min(1, this.flash); ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
    }
    drawBullets(ctx) {
      for (const b of this.bullets) {
        if (b.dead || b.invisible) continue;
        const sp = b.sp; let sc = b.scale || 1, a = b.alpha;
        if (b.spawn > 0) { sc *= 1 + b.spawn / 8 * 1.2; a *= 1 - b.spawn / 10; }
        if (b.flicker && b.t % 6 < 2) a *= 0.4;
        const rot = sp.orient ? b.angle : sp.spin ? b.t * 0.1 : 0;
        if (rot || sc !== 1 || a !== 1) {
          ctx.save(); ctx.translate(b.x, b.y); if (rot) ctx.rotate(rot); ctx.globalAlpha = Math.max(0, a);
          ctx.drawImage(sp.c, -sp.w / 2 * sc, -sp.h / 2 * sc, sp.w * sc, sp.h * sc); ctx.restore();
        } else ctx.drawImage(sp.c, b.x - sp.w / 2, b.y - sp.h / 2, sp.w, sp.h);
      }
    }
    drawLaser(ctx, l) {
      const col = Spr.COL[l.color] || l.color;
      ctx.save(); ctx.translate(l.x, l.y); ctx.rotate(l.angle);
      if (l.t < l.warn) {
        ctx.globalAlpha = 0.35 + 0.25 * Math.sin(l.t * 0.5);
        ctx.fillStyle = col; ctx.fillRect(0, -1, l.len, 2);
      } else {
        const k = l.t - l.warn, w = l.w * Math.min(1, k / 8) * (k > l.dur - 10 ? Math.max(0, (l.dur - k) / 10) : 1);
        const g = ctx.createLinearGradient(0, -w / 2, 0, w / 2);
        g.addColorStop(0, U.rgba(col, 0)); g.addColorStop(0.3, U.rgba(col, 0.8)); g.addColorStop(0.5, '#ffffff'); g.addColorStop(0.7, U.rgba(col, 0.8)); g.addColorStop(1, U.rgba(col, 0));
        ctx.fillStyle = g; ctx.fillRect(0, -w / 2, l.len, w);
        if (!l.noOrigin) { ctx.beginPath(); ctx.arc(0, 0, w * 0.6, 0, TAU); ctx.fillStyle = U.rgba('#ffffff', 0.8); ctx.fill(); }
      }
      ctx.restore();
    }
    drawCutin(ctx) {
      const c = this.cutin, t = c.t, ch = FW.CHARS[c.char];
      const k = t < 20 ? U.easeOut(t / 20) : t > 90 ? 1 - (t - 90) / 20 : 1;
      ctx.save();
      ctx.globalAlpha = Math.max(0, k) * 0.9;
      const x = c.side === 'L' ? -80 + U.easeOut(Math.min(1, t / 25)) * 230 + t * 0.4 : W + 80 - U.easeOut(Math.min(1, t / 25)) * 230 - t * 0.4;
      // 斜帶
      ctx.fillStyle = U.rgba(ch.color, 0.35); ctx.beginPath(); ctx.moveTo(0, H * 0.25); ctx.lineTo(W, H * 0.12); ctx.lineTo(W, H * 0.55); ctx.lineTo(0, H * 0.68); ctx.fill();
      ctx.font = `bold 34px ${FONT}`; ctx.fillStyle = U.rgba('#ffffff', 0.15); ctx.textAlign = 'left';
      for (let i = 0; i < 6; i++) ctx.fillText((c.text || 'SPELL CARD ATTACK ') .repeat(3), -300 + ((t * (i % 2 ? 4 : -4)) % 300), H * 0.2 + i * 50);
      Art.portrait(ctx, ch.spec, x, H * 0.33, 1.25, { t: this.t, expr: c.expr || 'serious', flip: c.side === 'L' });
      ctx.restore();
    }
    drawStageCard(ctx) {
      const s = this.stageCard;
      if (s.t > 300) return;
      const a = s.t < 30 ? s.t / 30 : s.t > 240 ? (300 - s.t) / 60 : 1;
      if (s.name) { ctx.save(); ctx.globalAlpha = a; ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(0, 210, W, 140);
      ctx.font = `italic bold 22px ${FONT}`; ctx.fillStyle = '#ffe9a8'; ctx.fillText(s.label, W / 2, 245);
      ctx.font = `bold 40px ${FONT}`; ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.strokeText(s.name, W / 2, 295); ctx.fillStyle = '#fff'; ctx.fillText(s.name, W / 2, 295);
      ctx.font = `15px ${FONT}`; ctx.fillStyle = '#d8e4ff'; ctx.fillText(s.sub, W / 2, 330);
      ctx.restore(); }
      if (s.music && s.t > 60 && s.t < 280) {
        const ma = Math.min(1, (s.t - 60) / 20) * Math.min(1, (280 - s.t) / 20);
        ctx.save(); ctx.globalAlpha = ma; ctx.textAlign = 'right'; ctx.font = `14px ${FONT}`; ctx.fillStyle = '#fff'; ctx.fillText('♪ ' + s.music, W - 12, H - 14); ctx.restore();
      }
    }
    nowPlaying(id) { const s = FW.SONGS[id]; if (s) this.musicNote = { text: '♪ ' + s.title, t: 0 }; }
  }
  function segDist(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1, dy = y2 - y1, l2 = dx * dx + dy * dy;
    let t = l2 ? ((px - x1) * dx + (py - y1) * dy) / l2 : 0; t = U.clamp(t, 0, 1);
    return Math.hypot(px - (x1 + dx * t), py - (y1 + dy * t));
  }
  FW.segDist = segDist;
  FW.Game = Game; FW.Player = Player;
})();
