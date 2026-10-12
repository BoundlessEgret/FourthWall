'use strict';
// ============================================================
//  第四面牆 FourthWall — core: 命名空間、數學、輸入、存檔、協程
// ============================================================
const FW = window.FW = {};
const TAU = Math.PI * 2;
FW.VW = 960; FW.VH = 720;                       // 邏輯解析度 (4:3)
FW.PF = { x: 32, y: 24, w: 576, h: 672 };       // 遊戲區（畫面上的位置）
FW.view = { x: 0, y: 0, w: 960, h: 720 };      // 目前顯示的邏輯範圍（手機直式時只顯示遊戲區）

// ---------- 數學工具 ----------
const U = FW.U = {
  clamp: (v, a, b) => v < a ? a : v > b ? b : v,
  lerp: (a, b, t) => a + (b - a) * t,
  rnd: (a = 1, b) => b === undefined ? Math.random() * a : a + Math.random() * (b - a),
  rint: (a, b) => Math.floor(a + Math.random() * (b - a + 1)),
  pick: arr => arr[Math.floor(Math.random() * arr.length)],
  sign: v => v < 0 ? -1 : 1,
  ang: (x1, y1, x2, y2) => Math.atan2(y2 - y1, x2 - x1),
  dist: (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1),
  easeOut: t => 1 - (1 - t) * (1 - t),
  easeIn: t => t * t,
  easeInOut: t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
  easeBack: t => { const c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); },
  angDiff: (a, b) => { let d = (b - a) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; },
  pad: (n, l) => String(n).padStart(l, '0'),
  fmtTime: (sec) => { sec = Math.floor(sec); const h = Math.floor(sec / 3600), m = Math.floor(sec / 60) % 60, s = sec % 60; return (h ? h + ':' + U.pad(m, 2) : m) + ':' + U.pad(s, 2); },
  fmtScore: n => String(Math.floor(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ','),
  shuffle: a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; },
  hex2rgb: h => { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join(''); const n = parseInt(h, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; },
  rgba: (h, a) => { const [r, g, b] = U.hex2rgb(h); return `rgba(${r},${g},${b},${a})`; },
  shade: (h, f) => { // f<0 變暗, f>0 變亮
    const [r, g, b] = U.hex2rgb(h);
    const m = v => Math.round(f < 0 ? v * (1 + f) : v + (255 - v) * f);
    return '#' + [m(r), m(g), m(b)].map(v => U.pad(U.clamp(v, 0, 255).toString(16), 2)).join('');
  },
  mix: (h1, h2, t) => { const a = U.hex2rgb(h1), b = U.hex2rgb(h2); return '#' + a.map((v, i) => U.pad(Math.round(v + (b[i] - v) * t).toString(16), 2)).join(''); },
};

// ---------- 協程 (generator) ----------
// yield n       → 等 n 幀
// yield fn      → 等到 fn() 為真
// yield* gen    → 子協程
class Task {
  constructor(gen) { this.gen = gen; this.wait = 0; this.cond = null; this.done = false; }
  step() {
    if (this.done) return;
    if (this.wait > 0) { this.wait--; return; }
    if (this.cond) { if (!this.cond()) return; this.cond = null; }
    const r = this.gen.next();
    if (r.done) { this.done = true; return; }
    const v = r.value;
    if (typeof v === 'number') this.wait = Math.max(0, Math.floor(v) - 1);
    else if (typeof v === 'function') this.cond = v;
  }
}
FW.Task = Task;
class TaskList {
  constructor() { this.list = []; }
  add(gen) { const t = new Task(gen); this.list.push(t); return t; }
  step() { for (let i = 0; i < this.list.length; i++) this.list[i].step(); if (this.list.some(t => t.done)) this.list = this.list.filter(t => !t.done); }
  clear() { this.list.length = 0; }
  get empty() { return this.list.length === 0; }
}
FW.TaskList = TaskList;

// ---------- 輸入 ----------
const Input = FW.Input = {
  down: {}, prev: {}, mouse: { x: -1, y: -1, inside: false, lastMove: -9999, down: false },
  keyLog: [], anyKeyFrame: false, lastKey: '',
  map: {
    up: ['ArrowUp', 'KeyW'], down: ['ArrowDown', 'KeyS'], left: ['ArrowLeft', 'KeyA'], right: ['ArrowRight', 'KeyD'],
    shoot: ['KeyZ', 'KeyJ'], confirm: ['KeyZ', 'Enter', 'Space', 'KeyJ'], bomb: ['KeyX', 'KeyK'], cancel: ['KeyX', 'Escape', 'Backspace', 'KeyK'],
    focus: ['ShiftLeft', 'ShiftRight', 'KeyL'], pause: ['Escape', 'KeyP'], skip: ['ControlLeft', 'ControlRight'],
  },
  pad: {},
  _raw: {},
  vheld: {}, vhit: {}, _vhitNext: {}, touchAcc: { x: 0, y: 0 }, touchMove: { x: 0, y: 0 },
  init(canvas) {
    window.addEventListener('keydown', e => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Tab'].includes(e.code)) e.preventDefault();
      if (e.ctrlKey && (e.code === 'KeyS' || e.code === 'KeyW')) e.preventDefault();
      if (!this._raw[e.code]) { this.keyLog.push(e.code); this.lastKey = e.key; }
      this._raw[e.code] = true;
      FW.Audio && FW.Audio.unlock();
    });
    window.addEventListener('keyup', e => { this._raw[e.code] = false; });
    window.addEventListener('blur', () => { this._raw = {}; });
    const toLogical = (e) => {
      const r = canvas.getBoundingClientRect();
      return [FW.view.x + (e.clientX - r.left) / r.width * FW.view.w, FW.view.y + (e.clientY - r.top) / r.height * FW.view.h];
    };
    canvas.addEventListener('mousemove', e => {
      const [x, y] = toLogical(e);
      const m = this.mouse;
      if (Math.abs(x - m.x) + Math.abs(y - m.y) > 0.5) m.lastMove = FW.frame || 0;
      m.x = x; m.y = y; m.inside = true;
    });
    canvas.addEventListener('mouseleave', () => { this.mouse.inside = false; });
    canvas.addEventListener('mousedown', e => { this.mouse.down = true; this._clickLatch = true; FW.Audio && FW.Audio.unlock(); });
    window.addEventListener('mouseup', () => { this.mouse.down = false; });
  },
  pollPad() {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    const p = { };
    for (const gp of pads) {
      if (!gp) continue;
      const b = i => gp.buttons[i] && gp.buttons[i].pressed;
      const ax = gp.axes[0] || 0, ay = gp.axes[1] || 0;
      if (b(12) || ay < -0.5) p.up = 1; if (b(13) || ay > 0.5) p.down = 1;
      if (b(14) || ax < -0.5) p.left = 1; if (b(15) || ax > 0.5) p.right = 1;
      if (b(0)) { p.shoot = 1; p.confirm = 1; } if (b(1)) { p.bomb = 1; p.cancel = 1; }
      if (b(4) || b(5) || b(6) || b(7)) p.focus = 1; if (b(9)) p.pause = 1; if (b(3)) p.skip = 1;
      break;
    }
    this.pad = p;
  },
  update() {
    this.prev = this.down;
    this.down = {};
    this.pollPad();
    for (const act in this.map) {
      this.down[act] = this.map[act].some(c => this._raw[c]) || !!this.pad[act] || !!this.vheld[act];
    }
    this.mouse.clicked = !!this._clickLatch; this._clickLatch = false;
    this.vhit = this._vhitNext; this._vhitNext = {};
    this.touchMove = { x: this.touchAcc.x, y: this.touchAcc.y }; this.touchAcc.x = this.touchAcc.y = 0;
    this.anyKeyFrame = this.keyLog.length > 0;
    this.frameKeys = this.keyLog;
    this.keyLog = [];
  },
  held(a) { return !!this.down[a]; },
  hit(a) { return (!!this.down[a] && !this.prev[a]) || !!this.vhit[a]; },
  tapHit(a) { this._vhitNext[a] = true; },
  raw(code) { return !!this._raw[code]; },
  // 選單重複輸入
  _rep: {},
  repeat(a) {
    if (this.vhit[a] && !this.down[a]) { this._rep[a] = 0; return true; }
    if (!this.down[a]) { this._rep[a] = 0; return false; }
    const n = (this._rep[a] = (this._rep[a] || 0) + 1);
    return n === 1 || (n > 18 && n % 5 === 0);
  },
};

// ---------- 存檔 ----------
const SAVE_KEY = 'fourthwall_save_v1';
const Save = FW.Save = {
  data: null,
  defaults() {
    return {
      settings: { bgm: 0.7, se: 0.6, shake: true, quality: 'high', fourthWallTitle: true, autoBomb: false },
      boots: 0, firstBoot: Date.now(), lastBoot: 0, lastQuit: 0, playTime: 0,
      deaths: 0, continues: 0, bombs: 0, grazeTotal: 0, quitFromMenu: 0, tabAways: 0,
      lastStageReached: null,
      clears: {},        // clears[char] = {story:{easy:bool...}, extra:bool}
      endings: {},       // endings[id] = true
      spells: {},        // spells[id] = {tries, caps}
      hi: {},            // hi[mode+char+diff] = score
      endlessBest: {},   // endlessBest[char] = {time, loops, score}
      achievements: {},
      seenChars: {},
      musicHeard: {},
      trueEnd: false,
      namePrompted: false,
    };
  },
  load() {
    let d = null;
    try { d = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); } catch (e) { d = null; }
    const def = this.defaults();
    if (!d) d = def;
    for (const k in def) if (d[k] === undefined) d[k] = def[k];
    for (const k in def.settings) if (d.settings[k] === undefined) d.settings[k] = def.settings[k];
    this.data = d;
    this.prevBoot = d.lastBoot; this.prevQuit = d.lastQuit; this.isFirst = d.boots === 0;
    d.boots++; d.lastBoot = Date.now();
    this.write();
    window.addEventListener('beforeunload', () => { d.lastQuit = Date.now(); this.write(); });
    setInterval(() => this.write(), 15000);
  },
  write() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(this.data)); } catch (e) { } },
  wipe() { try { localStorage.removeItem(SAVE_KEY); } catch (e) { } this.data = this.defaults(); this.data.boots = 1; this.write(); },
  spell(id) { return this.data.spells[id] || (this.data.spells[id] = { tries: 0, caps: 0 }); },
  unlock(id) {
    if (this.data.achievements[id]) return false;
    this.data.achievements[id] = Date.now(); this.write();
    const a = FW.ACHIEVEMENTS && FW.ACHIEVEMENTS.find(x => x.id === id);
    if (a && FW.toast) FW.toast('🏆 成就解鎖：' + a.name, '#ffd36b');
    return true;
  },
  cleared(ch, diff) { const c = this.data.clears[ch]; return c && c.story && c.story[diff]; },
  anyClear() { return Object.values(this.data.clears).some(c => c && (c.anyClear || (c.story && Object.values(c.story).some(Boolean)))); },
};

// ---------- 時鐘 / 現實資訊（第四面牆用） ----------
FW.Real = {
  now() { return new Date(); },
  hhmm() { const d = new Date(); return U.pad(d.getHours(), 2) + ':' + U.pad(d.getMinutes(), 2); },
  hour() { return new Date().getHours(); },
  isLate() { const h = new Date().getHours(); return h >= 1 && h < 5; },
  partOfDay() {
    const h = new Date().getHours();
    if (h < 5) return '深夜'; if (h < 11) return '早上'; if (h < 14) return '中午'; if (h < 18) return '下午'; if (h < 23) return '晚上'; return '深夜';
  },
  platform() {
    const ua = navigator.userAgent;
    if (/Mac/.test(ua)) return 'Mac'; if (/Win/.test(ua)) return 'Windows'; if (/Linux/.test(ua)) return 'Linux'; return '這台機器';
  },
  sinceText(ms) {
    if (!ms) return null;
    const d = Date.now() - ms, m = d / 60000;
    if (m < 2) return '剛剛'; if (m < 60) return Math.floor(m) + ' 分鐘前';
    const h = m / 60; if (h < 24) return Math.floor(h) + ' 小時前';
    return Math.floor(h / 24) + ' 天前';
  },
};

// ---------- 視窗標題（第四面牆） ----------
FW.Title = {
  base: '第四面牆 FourthWall',
  set(t, dur) {
    if (!Save.data || !Save.data.settings.fourthWallTitle) return;
    document.title = t;
    clearTimeout(this._to);
    if (dur) this._to = setTimeout(() => document.title = this.base, dur);
  },
  reset() { document.title = this.base; },
};
