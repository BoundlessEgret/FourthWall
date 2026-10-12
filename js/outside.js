'use strict';
// ============================================================
//  Outside — 「螢幕外」的第四面牆（手機也看得到）
//  · 角色在遊戲畫面「外面」的空白處探頭說話
//  · 震動（叩叩）、瀏覽器網址列顏色、電量、轉手機
// ============================================================
(function () {
  const U = FW.U, Art = FW.Art;
  const O = FW.Outside = { queue: [], busy: false, cool: {} };

  const css = `
  #outside { position: fixed; inset: 0; pointer-events: none; z-index: 9; font-family: "Noto Sans TC","PingFang TC",sans-serif; }
  #outside .ob { position: absolute; display: flex; align-items: center; gap: 10px; max-width: min(86vw, 440px);
    background: rgba(255,255,255,0.96); color: #2a2040; border-radius: 16px; padding: 10px 16px 10px 10px; box-shadow: 0 6px 24px rgba(0,0,0,0.45);
    border: 3px solid var(--c); opacity: 0; transition: opacity .25s, transform .35s cubic-bezier(.2,1.4,.4,1); font-size: 15px; line-height: 1.45; }
  #outside .ob.show { opacity: 1; transform: translate(-50%, 0) scale(1) !important; }
  #outside .ob canvas { width: 56px; height: 56px; border-radius: 50%; background: var(--c); flex: none; }
  #outside .ob b { color: var(--c); display: block; font-size: 13px; }
  #outside .ob .tail { position: absolute; width: 14px; height: 14px; background: rgba(255,255,255,0.96); border: 3px solid var(--c); transform: rotate(45deg); }
  #outside .ob.inside { opacity: 0; }
  #outside .ob.inside.show { opacity: 0.95; }
  `;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  const root = document.createElement('div'); root.id = 'outside'; document.body.appendChild(root);

  const avCache = {};
  function avatar(id, expr) {
    const k = id + expr;
    if (avCache[k]) return avCache[k];
    const c = document.createElement('canvas'); c.width = c.height = 112;
    const x = c.getContext('2d');
    x.beginPath(); x.arc(56, 56, 56, 0, TAU); x.clip();
    Art.portrait(x, FW.CHARS[id].spec, 56, 62, 0.62, { t: 0, expr, blink: false });
    return (avCache[k] = c.toDataURL());
  }

  // 找出遊戲畫面外最大的空白
  function place(el, tail) {
    const r = FW.canvas.getBoundingClientRect(), vw = window.innerWidth, vh = window.innerHeight;
    const m = { bottom: vh - r.bottom, top: r.top, right: vw - r.right, left: r.left };
    const bw = Math.min(vw * 0.86, 440);
    let side = null;
    if (m.bottom >= 90) side = 'bottom'; else if (m.top >= 90) side = 'top'; else if (m.right >= 200) side = 'right'; else if (m.left >= 200) side = 'left';
    el.classList.toggle('inside', !side);
    const s = el.style; s.left = s.top = s.bottom = s.right = '';
    const tl = tail.style; tl.left = tl.top = tl.bottom = tl.right = '';
    s.width = (side === 'bottom' || side === 'top' || !side) ? Math.min(vw * 0.9, 420) + 'px' : '';
    if (side === 'bottom') { s.left = (r.left + r.width / 2) + 'px'; s.top = (r.bottom + 14) + 'px'; s.transform = 'translate(-50%, -20px) scale(.9)'; tl.top = '-10px'; tl.left = '50%'; }
    else if (side === 'top') { s.left = (r.left + r.width / 2) + 'px'; s.top = Math.max(6, r.top - 96) + 'px'; s.transform = 'translate(-50%, 20px) scale(.9)'; tl.bottom = '-10px'; tl.left = '50%'; }
    else if (side === 'right') { const w = Math.min(m.right - 24, bw); s.maxWidth = w + 'px'; s.left = (r.right + 12 + w / 2) + 'px'; s.top = (r.top + 20) + 'px'; s.transform = 'translate(-50%, 0) scale(.9)'; tl.left = '-10px'; tl.top = '30px'; }
    else if (side === 'left') { const w = Math.min(m.left - 24, bw); s.maxWidth = w + 'px'; s.left = (r.left - 12 - w / 2) + 'px'; s.top = (r.top + 20) + 'px'; s.transform = 'translate(-50%, 0) scale(.9)'; tl.right = '-10px'; tl.top = '30px'; }
    else { s.left = (r.left + r.width / 2) + 'px'; s.top = (r.top + 8) + 'px'; s.transform = 'translate(-50%, -10px) scale(.9)'; tail.style.display = 'none'; }
  }

  // id：角色、text：台詞、o：{expr, dur, key(冷卻用), cool(ms)}
  O.say = function (id, text, o = {}) {
    if (o.key) { const now = Date.now(); if (O.cool[o.key] && now - O.cool[o.key] < (o.cool || 20000)) return; O.cool[o.key] = now; }
    O.queue.push({ id, text: FW.fmt ? FW.fmt(text) : text, expr: o.expr || 'normal', dur: o.dur || Math.max(3200, text.length * 140) });
    if (!O.busy) O.next();
  };
  O.next = function () {
    const q = O.queue.shift();
    if (!q) { O.busy = false; return; }
    O.busy = true;
    const ch = FW.CHARS[q.id];
    const el = document.createElement('div'); el.className = 'ob'; el.style.setProperty('--c', ch.color);
    el.innerHTML = `<div class="tail"></div><img alt="" style="width:56px;height:56px;border-radius:50%;flex:none;background:${ch.color}" src="${avatar(q.id, q.expr)}"><div><b>${ch.name}</b><span></span></div>`;
    root.appendChild(el);
    place(el, el.querySelector('.tail'));
    requestAnimationFrame(() => el.classList.add('show'));
    const span = el.querySelector('span'); let i = 0;
    const typer = setInterval(() => { i++; span.textContent = q.text.slice(0, i); if (i >= q.text.length) clearInterval(typer); }, 35);
    setTimeout(() => { el.classList.remove('show'); setTimeout(() => { el.remove(); clearInterval(typer); O.next(); }, 350); }, q.dur);
  };

  // ---------- 震動 ----------
  O.vibrate = function (pattern) {
    try { if (FW.Save.data.settings.vibrate !== false && navigator.vibrate) navigator.vibrate(pattern); } catch (e) { }
  };
  O.canVibrate = () => !!navigator.vibrate && FW.touchMode;

  // ---------- 瀏覽器網址列顏色 ----------
  const meta = document.querySelector('meta[name="theme-color"]');
  O.theme = function (col) { if (meta) meta.setAttribute('content', col || '#05030a'); };

  // ---------- 電量 ----------
  O.battery = null;
  if (navigator.getBattery) navigator.getBattery().then(b => {
    O.battery = b;
    b.addEventListener('levelchange', () => {
      if (!b.charging && b.level <= 0.15) {
        const sc = FW.SM && FW.SM.cur, id = sc && sc.g ? sc.g.charId : 'rinne';
        O.say(id, `等等，你的電量只剩 ${Math.round(b.level * 100)}% 了！先去充電啦，存檔我會幫你顧著。`, { expr: 'surprised', key: 'bat', cool: 600000 });
      }
    });
    b.addEventListener('chargingchange', () => { if (b.charging) O.say('suzu', '有電了！插上電的聲音我聽到囉～', { expr: 'happy', key: 'chg', cool: 600000 }); });
  }).catch(() => { });
  O.batteryGreeting = function () {
    const b = O.battery; if (!b) return;
    const p = Math.round(b.level * 100);
    if (!b.charging && p <= 20) O.say('rinne', `……你的電量只剩 ${p}% 了。要不要先去充個電？我們會等你的。`, { expr: 'sad', key: 'batg', cool: 3600000 });
    else if (b.charging && FW.touchMode) O.say('shio', `正在充電中呢（${p}%）。那今天可以陪我們久一點了吧？`, { expr: 'smile', key: 'batg', cool: 3600000 });
  };

  // ---------- 轉手機 ----------
  let lastPort = window.innerHeight > window.innerWidth;
  window.addEventListener('resize', () => {
    const p = window.innerHeight > window.innerWidth;
    if (p === lastPort || !FW.touchMode) { lastPort = p; return; }
    lastPort = p;
    setTimeout(() => O.say('suzu', p ? '欸欸，世界又立起來了！' : '哇，世界轉過來了！這樣看得好清楚～', { expr: p ? 'surprised' : 'happy', key: 'rot', cool: 15000 }), 400);
  });
})();
