'use strict';
// ============================================================
//  Sprites — 子彈、道具、自機彈的向量預渲染快取
// ============================================================
(function () {
  const U = FW.U;
  const S = FW.Sprites = {};
  const COL = S.COL = {
    red: '#ff3048', orange: '#ff8a20', yellow: '#ffd820', green: '#30e070', cyan: '#20d8ff', blue: '#3a6cff',
    purple: '#a848ff', pink: '#ff60c8', white: '#f4f4ff', gray: '#9a9ab0', black: '#383848', magenta: '#ff00dc',
  };
  S.COLORS = Object.keys(COL);
  // 子彈定義：size = 繪製半徑, hit = 判定半徑, orient = 是否依方向旋轉
  const DEF = S.DEF = {
    orb: { size: 9, hit: 4.5 }, small: { size: 6, hit: 3 }, big: { size: 18, hit: 11 }, huge: { size: 30, hit: 20 },
    rice: { size: 10, hit: 3, orient: true }, kunai: { size: 11, hit: 3, orient: true }, star: { size: 10, hit: 4, spin: true },
    heart: { size: 10, hit: 5, orient: true }, square: { size: 9, hit: 4.5, spin: true }, cursor: { size: 12, hit: 3.5, orient: true },
    shard: { size: 10, hit: 3.5, spin: true }, page: { size: 11, hit: 4.5, orient: true }, ring: { size: 10, hit: 5 },
    glyph: { size: 13, hit: 6 }, note: { size: 11, hit: 4.5 }, digit: { size: 12, hit: 5.5 },
  };
  const cache = new Map();
  const RES = 2;
  function mk(w, h) { const c = document.createElement('canvas'); c.width = Math.ceil(w * RES); c.height = Math.ceil(h * RES); const x = c.getContext('2d'); x.scale(RES, RES); return [c, x]; }

  S.bullet = function (type, color, glyph) {
    const key = type + '|' + color + '|' + (glyph || '');
    let sp = cache.get(key);
    if (sp) return sp;
    const d = DEF[type] || DEF.orb, col = COL[color] || color, R = d.size + 6, W = R * 2;
    const [c, x] = mk(W, W);
    x.translate(R, R);
    const dark = U.shade(col, -0.45), light = U.mix(col, '#ffffff', 0.7);
    x.lineJoin = 'round';
    switch (type) {
      case 'orb': case 'small': case 'big': case 'huge': {
        const r = d.size;
        const glow = x.createRadialGradient(0, 0, r * 0.5, 0, 0, r + 6); glow.addColorStop(0, U.rgba(col, 0.6)); glow.addColorStop(1, U.rgba(col, 0));
        x.fillStyle = glow; x.beginPath(); x.arc(0, 0, r + 6, 0, TAU); x.fill();
        const g = x.createRadialGradient(0, 0, 0, 0, 0, r);
        g.addColorStop(0, '#ffffff'); g.addColorStop(0.45, '#ffffff'); g.addColorStop(0.62, light); g.addColorStop(0.85, col); g.addColorStop(1, dark);
        x.fillStyle = g; x.beginPath(); x.arc(0, 0, r, 0, TAU); x.fill();
        break;
      }
      case 'ring': {
        x.beginPath(); x.arc(0, 0, d.size - 2, 0, TAU); x.lineWidth = 4; x.strokeStyle = col; x.shadowColor = col; x.shadowBlur = 8; x.stroke();
        x.shadowBlur = 0; x.lineWidth = 1.5; x.strokeStyle = '#fff'; x.stroke(); break;
      }
      case 'rice': {
        x.shadowColor = col; x.shadowBlur = 6;
        x.beginPath(); x.ellipse(0, 0, 10, 4.6, 0, 0, TAU); x.fillStyle = col; x.fill(); x.shadowBlur = 0;
        x.beginPath(); x.ellipse(0, 0, 7, 2.4, 0, 0, TAU); x.fillStyle = '#fff'; x.fill(); break;
      }
      case 'kunai': {
        x.shadowColor = col; x.shadowBlur = 6;
        x.beginPath(); x.moveTo(11, 0); x.lineTo(-2, -5); x.lineTo(-10, -3); x.lineTo(-10, 3); x.lineTo(-2, 5); x.closePath(); x.fillStyle = col; x.fill(); x.shadowBlur = 0;
        x.beginPath(); x.moveTo(8, 0); x.lineTo(-1, -2.4); x.lineTo(-6, 0); x.lineTo(-1, 2.4); x.closePath(); x.fillStyle = '#fff'; x.fill(); break;
      }
      case 'star': {
        x.shadowColor = col; x.shadowBlur = 8; x.beginPath();
        for (let i = 0; i < 10; i++) { const r = i % 2 ? 4.2 : 10, a = i * Math.PI / 5 - Math.PI / 2; x.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
        x.closePath(); x.fillStyle = col; x.fill(); x.shadowBlur = 0; x.lineWidth = 1.2; x.strokeStyle = '#fff'; x.stroke();
        x.beginPath(); x.arc(0, 0, 2.6, 0, TAU); x.fillStyle = '#fff'; x.fill(); break;
      }
      case 'heart': {
        x.rotate(Math.PI / 2); x.shadowColor = col; x.shadowBlur = 8;
        x.beginPath(); x.moveTo(0, 8); x.bezierCurveTo(-12, 0, -9, -11, 0, -5); x.bezierCurveTo(9, -11, 12, 0, 0, 8);
        x.fillStyle = col; x.fill(); x.shadowBlur = 0; x.lineWidth = 1.5; x.strokeStyle = '#fff'; x.stroke(); break;
      }
      case 'square': {
        x.shadowColor = '#ff00dc'; x.shadowBlur = 6;
        x.fillStyle = color === 'magenta' ? '#111' : col; x.fillRect(-8, -8, 16, 16); x.shadowBlur = 0;
        x.fillStyle = color === 'magenta' ? '#ff00dc' : '#fff'; x.fillRect(-8, -8, 8, 8); x.fillRect(0, 0, 8, 8);
        x.strokeStyle = '#fff'; x.lineWidth = 1; x.strokeRect(-8, -8, 16, 16); break;
      }
      case 'cursor': {
        x.rotate(Math.PI * 0.75); x.shadowColor = col; x.shadowBlur = 6;
        x.beginPath(); x.moveTo(0, -11); x.lineTo(0, 7); x.lineTo(4, 3); x.lineTo(7, 10); x.lineTo(9, 9); x.lineTo(6, 2); x.lineTo(11, 2); x.closePath();
        x.translate(-4, 0); x.fillStyle = '#fff'; x.fill(); x.shadowBlur = 0; x.lineWidth = 1.6; x.strokeStyle = col; x.stroke(); break;
      }
      case 'shard': {
        x.shadowColor = col; x.shadowBlur = 6; x.beginPath(); x.moveTo(0, -10); x.lineTo(7, 6); x.lineTo(-5, 8); x.closePath();
        x.fillStyle = U.rgba(light, 0.85); x.fill(); x.shadowBlur = 0; x.strokeStyle = col; x.lineWidth = 1.5; x.stroke();
        x.beginPath(); x.moveTo(-1, -5); x.lineTo(2, 4); x.strokeStyle = '#fff'; x.stroke(); break;
      }
      case 'page': {
        x.shadowColor = col; x.shadowBlur = 6; x.fillStyle = '#fbf8ef'; x.fillRect(-10, -7, 20, 14); x.shadowBlur = 0;
        x.strokeStyle = col; x.lineWidth = 1.6; x.strokeRect(-10, -7, 20, 14);
        x.strokeStyle = U.rgba(dark, 0.6); x.lineWidth = 1; for (let i = -3; i <= 3; i += 3) { x.beginPath(); x.moveTo(-6, i); x.lineTo(6, i); x.stroke(); } break;
      }
      case 'note': {
        x.shadowColor = col; x.shadowBlur = 6; x.beginPath(); x.ellipse(-3, 5, 5, 3.6, -0.4, 0, TAU); x.fillStyle = col; x.fill();
        x.fillRect(1, -9, 2.4, 14); x.beginPath(); x.moveTo(3, -9); x.quadraticCurveTo(9, -6, 8, 0); x.lineWidth = 2.4; x.strokeStyle = col; x.stroke();
        x.shadowBlur = 0; x.beginPath(); x.ellipse(-3, 5, 2.5, 1.6, -0.4, 0, TAU); x.fillStyle = '#fff'; x.fill(); break;
      }
      case 'glyph': case 'digit': {
        x.font = `bold ${type === 'digit' ? 20 : 22}px "Noto Sans TC","PingFang TC","Microsoft JhengHei",sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle';
        x.shadowColor = col; x.shadowBlur = 8; x.lineWidth = 4; x.strokeStyle = col; x.strokeText(glyph || '字', 0, 1);
        x.shadowBlur = 0; x.fillStyle = '#fff'; x.fillText(glyph || '字', 0, 1); break;
      }
    }
    sp = { c, w: W, h: W, hit: d.hit, orient: !!d.orient, spin: !!d.spin };
    cache.set(key, sp);
    return sp;
  };

  // 自機彈
  S.pshot = function (type, color) {
    const key = 'P|' + type + '|' + color;
    let sp = cache.get(key); if (sp) return sp;
    const col = color || '#ffffff', W = 40;
    const [c, x] = mk(W, W); x.translate(W / 2, W / 2);
    x.globalAlpha = 0.85;
    switch (type) {
      case 'needle': { const g = x.createLinearGradient(0, -18, 0, 18); g.addColorStop(0, '#fff'); g.addColorStop(1, U.rgba(col, 0)); x.fillStyle = g; x.fillRect(-2.5, -18, 5, 36); x.fillStyle = '#fff'; x.fillRect(-1, -18, 2, 26); break; }
      case 'star': { x.shadowColor = col; x.shadowBlur = 8; x.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? 3.5 : 8, a = i * Math.PI / 5 - Math.PI / 2; x.lineTo(Math.cos(a) * r, Math.sin(a) * r); } x.closePath(); x.fillStyle = col; x.fill(); x.shadowBlur = 0; x.fillStyle = '#fff'; x.beginPath(); x.arc(0, 0, 2.5, 0, TAU); x.fill(); break; }
      case 'ball': { const g = x.createRadialGradient(0, 0, 0, 0, 0, 9); g.addColorStop(0, '#fff'); g.addColorStop(0.5, col); g.addColorStop(1, U.rgba(col, 0)); x.fillStyle = g; x.beginPath(); x.arc(0, 0, 9, 0, TAU); x.fill(); break; }
      case 'page': { x.rotate(0.1); x.fillStyle = '#fffaf0'; x.fillRect(-7, -10, 14, 20); x.strokeStyle = col; x.lineWidth = 1.5; x.strokeRect(-7, -10, 14, 20); x.fillStyle = U.rgba(col, 0.6); for (let i = -6; i <= 6; i += 4) x.fillRect(-4, i, 8, 1.2); break; }
      case 'cursor': { x.beginPath(); x.moveTo(0, -9); x.lineTo(0, 6); x.lineTo(3.5, 2.5); x.lineTo(6, 8); x.lineTo(8, 7); x.lineTo(5.5, 1.5); x.lineTo(9.5, 1.5); x.closePath(); x.fillStyle = '#fff'; x.fill(); x.strokeStyle = col; x.lineWidth = 1.4; x.stroke(); break; }
    }
    sp = { c, w: W, h: W }; cache.set(key, sp); return sp;
  };

  // 道具
  S.item = function (type) {
    const key = 'I|' + type;
    let sp = cache.get(key); if (sp) return sp;
    const W = 28;
    const [c, x] = mk(W, W); x.translate(W / 2, W / 2);
    const box = (col, txt, s = 7) => {
      x.shadowColor = col; x.shadowBlur = 6; x.fillStyle = U.mix(col, '#ffffff', 0.3); x.beginPath(); x.roundRect(-s, -s, s * 2, s * 2, 3); x.fill();
      x.shadowBlur = 0; x.strokeStyle = U.shade(col, -0.4); x.lineWidth = 1.5; x.stroke();
      x.fillStyle = '#fff'; x.font = `bold ${s * 1.6}px sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(txt, 0, 1);
    };
    const starI = (col, inner) => { x.shadowColor = col; x.shadowBlur = 8; x.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? 4.5 : 10, a = i * Math.PI / 5 - Math.PI / 2; x.lineTo(Math.cos(a) * r, Math.sin(a) * r); } x.closePath(); x.fillStyle = col; x.fill(); x.shadowBlur = 0; x.strokeStyle = '#fff'; x.lineWidth = 1.5; x.stroke(); if (inner) { x.fillStyle = '#fff'; x.font = 'bold 8px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(inner, 0, 1); } };
    switch (type) {
      case 'power': box('#ff3a50', 'P'); break;
      case 'bigpower': box('#ff3a50', 'P', 10); break;
      case 'point': box('#3a7cff', '點'); break;
      case 'full': box('#ffcc20', 'F', 10); break;
      case 'life': starI('#ff5ab4'); break;
      case 'lifepiece': starI('#ff9ad6', '¼'); break;
      case 'bomb': starI('#40e070'); break;
      case 'bombpiece': starI('#9af0b0', '¼'); break;
      case 'star': { x.fillStyle = '#d8f0ff'; x.shadowColor = '#7ad0ff'; x.shadowBlur = 6; x.beginPath(); for (let i = 0; i < 8; i++) { const r = i % 2 ? 1.8 : 5, a = i * Math.PI / 4; x.lineTo(Math.cos(a) * r, Math.sin(a) * r); } x.fill(); break; }
    }
    sp = { c, w: W, h: W }; cache.set(key, sp); return sp;
  };

  S.draw = function (ctx, sp, x, y, rot, alpha, scale = 1) {
    if (rot) { ctx.save(); ctx.translate(x, y); ctx.rotate(rot); if (alpha !== undefined && alpha < 1) ctx.globalAlpha = alpha; ctx.drawImage(sp.c, -sp.w / 2 * scale, -sp.h / 2 * scale, sp.w * scale, sp.h * scale); ctx.restore(); }
    else { if (alpha !== undefined && alpha < 1) { const a = ctx.globalAlpha; ctx.globalAlpha = alpha; ctx.drawImage(sp.c, x - sp.w / 2 * scale, y - sp.h / 2 * scale, sp.w * scale, sp.h * scale); ctx.globalAlpha = a; } else ctx.drawImage(sp.c, x - sp.w / 2 * scale, y - sp.h / 2 * scale, sp.w * scale, sp.h * scale); }
  };

  // 魔法陣
  S.magicCircle = function (ctx, x, y, r, t, col, alpha = 0.6) {
    ctx.save(); ctx.translate(x, y); ctx.globalAlpha = alpha;
    ctx.strokeStyle = col; ctx.lineWidth = 2;
    ctx.save(); ctx.rotate(t * 0.02);
    ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, r * 0.82, 0, TAU); ctx.lineWidth = 1; ctx.stroke();
    ctx.beginPath(); for (let i = 0; i <= 6; i++) { const a = i * TAU / 6 * 2 + 0; ctx.lineTo(Math.cos(a) * r * 0.82, Math.sin(a) * r * 0.82); } ctx.stroke();
    ctx.font = `${Math.max(8, r * 0.13)}px monospace`; ctx.fillStyle = col; ctx.textAlign = 'center';
    const txt = 'FOURTH WALL · NO SIGNAL · PRESS START · '; for (let i = 0; i < txt.length; i++) { ctx.save(); ctx.rotate(i * TAU / txt.length); ctx.fillText(txt[i], 0, -r * 0.88); ctx.restore(); }
    ctx.restore();
    ctx.save(); ctx.rotate(-t * 0.03); ctx.beginPath(); for (let i = 0; i <= 4; i++) { const a = i * TAU / 4; ctx.lineTo(Math.cos(a) * r * 0.55, Math.sin(a) * r * 0.55); } ctx.lineWidth = 1.5; ctx.stroke(); ctx.restore();
    ctx.restore();
  };
})();
