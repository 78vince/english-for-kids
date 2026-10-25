/* game-art.js — 遊戲美術渲染器（純 JS，無依賴）。顏色/造型全部來自 game-tokens.json。
 * GameArt.prop(id)：道具；共用繪圖工具放在 GameArt._h，供 game-character.js / game-scene.js / game-icons.js 使用。載入順序：tokens → art → character → scene → icons。 */
(function (g) {
  var T = g.GameTokens || (typeof require !== 'undefined' ? require('./game-tokens.js') : null);
  if (!T) throw new Error('game-tokens.js 必須先載入');
  var C = T.color, N = C.neutral;
  var hue = function (n, s) { return C.hue[n][s || 'base']; };
  var uid = 0;

  /* ---------- 小工具 ---------- */
  function a(o) { var s = ''; for (var k in o) if (o[k] != null) s += ' ' + k + '="' + o[k] + '"'; return s; }
  function el(tag, o, inner) { if (o && o.stroke && o.fill == null && tag !== 'line') o = Object.assign({ fill: 'none' }, o); return '<' + tag + a(o) + (inner == null ? '/>' : '>' + inner + '</' + tag + '>'); }
  function rect(x, y, w, h, r, fill, extra) { return el('rect', Object.assign({ x: x, y: y, width: w, height: h, rx: r, fill: fill }, extra)); }
  function circ(x, y, r, fill, extra) { return el('circle', Object.assign({ cx: x, cy: y, r: r, fill: fill }, extra)); }
  function ell(x, y, rx, ry, fill, extra) { return el('ellipse', Object.assign({ cx: x, cy: y, rx: rx, ry: ry, fill: fill }, extra)); }
  function line(x1, y1, x2, y2, stroke, w, extra) { return el('line', Object.assign({ x1: x1, y1: y1, x2: x2, y2: y2, stroke: stroke, 'stroke-width': w, 'stroke-linecap': 'round' }, extra)); }
  /* 圓角多邊形：用同色描邊把轉角磨圓（設計規則：沒有銳角） */
  function rpath(d, fill, w) { return el('path', { d: d, fill: fill, stroke: fill, 'stroke-width': w || 8, 'stroke-linejoin': 'round' }); }
  function star(cx, cy, R, r, n) {
    var p = [], i; n = n || 5;
    for (i = 0; i < n * 2; i++) { var rr = i % 2 ? r : R, an = -Math.PI / 2 + i * Math.PI / n; p.push((cx + rr * Math.cos(an)).toFixed(1) + ',' + (cy + rr * Math.sin(an)).toFixed(1)); }
    return 'M' + p.join(' L') + ' Z';
  }
  function svg(w, h, inner, cls, extra) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h + '"' + (cls ? ' class="' + cls + '"' : '') + a(extra) + ' fill="none">' + inner + '</svg>';
  }

  /* ---------- 道具 ---------- */
  var P = {};

  var PROP_SIZES = {}, PROP_DEF = {}; T.props.list.forEach(function (p) { PROP_SIZES[p.id] = p.size; PROP_DEF[p.id] = p; });
  /* 道具實作在 game-props.js（P[id](state)）；state 預設為該道具 states 的第一個 */
  var LIFT = { flag: 3, cherry: 4, palm: 4, bush: 2, door: 1, 'chest:open': -3, cloud: -2 };
  function prop(id, o) {
    o = o || {}; var s = PROP_SIZES[id], d = PROP_DEF[id]; if (!s || !P[id]) throw new Error('未知道具：' + id);
    var st = o.state || (d.states && d.states[0].id) || 'idle';
    var inner = P[id](st), lift = LIFT[id + ':' + st] != null ? LIFT[id + ':' + st] : (LIFT[id] || 0);
    if (lift) inner = '<g transform="translate(0 ' + (-lift) + ')">' + inner + '</g>';   /* 把超出 viewBox 的筆畫收回框內（v0.7） */
    if (o.shadow) inner = ell(s[0] / 2, s[1] - 1, s[0] * .36, 3.2, T.depth.shadow.ground) + inner;
    return svg(s[0], s[1], inner, 'g-prop g-prop-' + id + ' g-state-' + st, { width: o.size ? o.size : null, style: 'overflow:visible' });
  }
  function propStates(id) { var d = PROP_DEF[id]; return d && d.states ? d.states : null; }

  var API = g.GameArt || {};
  API.prop = prop; API.propStates = propStates; API.props = T.props.list; API._P = P;
  API._h = { a: a, el: el, rect: rect, circ: circ, ell: ell, line: line, rpath: rpath, star: star, svg: svg, hue: hue, T: T, nextId: function () { return ++uid; } };
  g.GameArt = API; if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : globalThis);
