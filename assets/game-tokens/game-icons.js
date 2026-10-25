/* game-icons.js — 扁平雙色 icon（24×24 網格）。
 * GameIcons.icon('star', {size:'lg'|24, color:'#xxxxxx', cls:'extra'}) → SVG 字串；顏色預設跟隨 CSS color。
 * 主形狀 = currentColor；次要形狀 = 同色 35% 透明；圓頭圓角，沒有輪廓線。 */
(function (g) {
  var A = g.GameArt || {}, T = g.GameTokens;
  var f = function (n) { return (+n.toFixed(2)); };
  function P(d, w, eo) { return '<path d="' + d + '" fill="currentColor" stroke="currentColor" stroke-width="' + (w || 0) + '" stroke-linejoin="round"' + (eo ? ' fill-rule="evenodd"' : '') + '/>'; }
  function L(d, w) { return '<path d="' + d + '" fill="none" stroke="currentColor" stroke-width="' + (w || 3.2) + '" stroke-linecap="round" stroke-linejoin="round"/>'; }
  function R(x, y, w, h, r, extra) { return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + r + '" fill="currentColor"' + (extra || '') + '/>'; }
  function C(x, y, r) { return '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="currentColor"/>'; }
  function S(inner) { return '<g opacity=".35">' + inner + '</g>'; }
  function starPath(cx, cy, Ro, Ri) { var p = [], i; for (i = 0; i < 10; i++) { var rr = i % 2 ? Ri : Ro, an = -Math.PI / 2 + i * Math.PI / 5; p.push(f(cx + rr * Math.cos(an)) + ' ' + f(cy + rr * Math.sin(an))); } return 'M' + p.join(' L') + ' Z'; }
  function rays(n, x, y, w, h, r, cx, cy) { var s = '', i; for (i = 0; i < n; i++) s += '<g transform="rotate(' + (i * 360 / n) + ' ' + cx + ' ' + cy + ')">' + R(x, y, w, h, r) + '</g>'; return s; }
  var SHIELD = 'M12 2.8 L19.5 5.5 V11.5 Q19.5 18 12 21.5 Q4.5 18 4.5 11.5 V5.5 Z';

  var I = {
    home: function () { return S(R(5, 11, 14, 10, 3)) + P('M3.5 12 L12 4 L20.5 12 Z', 2.6) + R(10, 14.5, 4, 6.5, 2); },
    back: function () { return L('M15 5 L8 12 L15 19'); },
    close: function () { return L('M6 6 L18 18 M18 6 L6 18'); },
    menu: function () { return R(4, 5, 16, 3, 1.5) + R(4, 10.5, 16, 3, 1.5) + R(4, 16, 16, 3, 1.5); },
    fullscreen: function () { return L('M4 9 V5 H8 M16 5 H20 V9 M20 15 V19 H16 M8 19 H4 V15', 2.8); },
    settings: function () { return rays(8, 10.2, 2.4, 3.6, 5, 1.6, 12, 12) + P('M12 5 a7 7 0 1 0 .01 0Z M12 9.4 a2.6 2.6 0 1 1 -.01 0Z', 0, true); },
    up: function () { return L('M6 15 L12 9 L18 15'); }, down: function () { return L('M6 9 L12 15 L18 9'); },
    left: function () { return L('M15 6 L9 12 L15 18'); }, right: function () { return L('M9 6 L15 12 L9 18'); },
    play: function () { return P('M8 5.5 L19 12 L8 18.5 Z', 3); },
    pause: function () { return R(6.5, 5, 4, 14, 2) + R(13.5, 5, 4, 14, 2); },
    restart: function () { return L('M19 12 A7 7 0 1 1 16 6.9', 3) + P('M12.6 3.6 L18.6 6.6 L13.8 10.6 Z', 1.4); },
    check: function () { return L('M5 12.5 L10 17.5 L19 7.5', 3.6); },
    plus: function () { return L('M12 5 V19 M5 12 H19', 3.4); },
    minus: function () { return L('M5 12 H19', 3.4); },
    sound: function () { return P('M4 9.5 H8 L13 5.5 V18.5 L8 14.5 H4 Z', 1.8) + S(L('M16.2 9 Q18.2 12 16.2 15', 2.4) + L('M19 6.5 Q22 12 19 17.5', 2.4)); },
    mute: function () { return P('M4 9.5 H8 L13 5.5 V18.5 L8 14.5 H4 Z', 1.8) + L('M16.5 9.5 L21 14.5 M21 9.5 L16.5 14.5', 2.6); },
    music: function () { return L('M10 17 V6 L19 4 V15', 2.6) + C(7.5, 17.5, 3) + C(16.5, 15.5, 3); },
    star: function () { return P(starPath(12, 12.6, 9.6, 4.6), 2.6); },
    heart: function () { return P('M12 20 C4 14.5 3 9.5 6 6.8 C8.5 4.6 11 6 12 8 C13 6 15.5 4.6 18 6.8 C21 9.5 20 14.5 12 20Z', 2); },
    coin: function () { return S(C(12, 12, 10)) + C(12, 12, 6.6); },
    gem: function () { return S(P('M7 4 H17 L21 10 L12 21 L3 10 Z', 2)) + P('M8.5 5.5 H15.5 L18.5 10 H5.5 Z', 1.6); },
    key: function () { return P('M8 6.5 a5.5 5.5 0 1 0 .01 0Z M8 9.7 a2.3 2.3 0 1 1 -.01 0Z', 0, true) + R(12, 10.6, 9, 3, 1.5) + R(17, 13, 3, 4, 1.5) + R(13.6, 13, 2.4, 3, 1.2); },
    lock: function () { return S(R(5, 10, 14, 11, 3.5)) + L('M8 10 V8 A4 4 0 0 1 16 8 V10', 2.8) + C(12, 15.5, 1.9); },
    unlock: function () { return S(R(5, 10, 14, 11, 3.5)) + L('M8 10 V8 A4 4 0 0 1 15.6 6.6', 2.8) + C(12, 15.5, 1.9); },
    gift: function () { return S(R(4, 10, 16, 11, 3)) + R(3, 7, 18, 5, 2) + R(10.5, 7, 3, 14, 1) + P('M12 7 Q7.5 1.5 6 4 Q5.2 6.6 12 7Z', 1.4) + P('M12 7 Q16.5 1.5 18 4 Q18.8 6.6 12 7Z', 1.4); },
    trophy: function () { return S(L('M7 6 H4 Q4 12 8 12 M17 6 H20 Q20 12 16 12', 2.4)) + P('M7 3.5 H17 V10 Q17 15 12 15 Q7 15 7 10 Z', 2) + R(10.8, 15, 2.4, 3.5, 1) + R(7, 18, 10, 3, 1.5); },
    sparkle: function () { return P('M12 3 Q13 11 21 12 Q13 13 12 21 Q11 13 3 12 Q11 11 12 3Z', 1.6) + S(C(19.5, 4.5, 1.8) + C(4.5, 19.5, 1.8)); },
    timer: function () { return S(C(12, 13.5, 8.5)) + L('M12 9.5 V13.5 L15 15.5', 2.6) + R(9.5, 2, 5, 2.6, 1.3); },
    bolt: function () { return P('M13.5 2.5 L5.5 13 H11 L10 21.5 L18.5 10.5 H13 Z', 2); },
    shield: function () { return S(P(SHIELD, 2)) + L('M8.5 12 L11 14.5 L15.8 9.5', 2.8); },
    info: function () { return S(C(12, 12, 10)) + C(12, 7.6, 1.7) + R(10.8, 10.5, 2.4, 7, 1.2); },
    help: function () { return S(C(12, 12, 10)) + L('M9.2 9.6 Q9.4 6.8 12 6.8 Q14.8 6.8 14.8 9.2 Q14.8 11 12.8 12 Q12 12.5 12 14', 2.4) + C(12, 17, 1.5); },
    bag: function () { return S(R(5, 7, 14, 14, 5)) + L('M9 7 V5.5 Q9 4 10.5 4 H13.5 Q15 4 15 5.5 V7', 2.4) + R(8, 13.5, 8, 5.5, 2.5); },
    map: function () { return S(P('M3 6 L9 4 L15 6 L21 4 V18 L15 20 L9 18 L3 20 Z', 1.8)) + P('M12 6.2 Q16.4 6.2 16.4 10.4 Q16.4 13.4 12 18 Q7.6 13.4 7.6 10.4 Q7.6 6.2 12 6.2Z M12 8.7 a1.8 1.8 0 1 0 .01 0Z', 1, true); },
    flag: function () { return S(R(3, 19.5, 11, 2.4, 1.2)) + R(5, 3, 2.8, 17, 1.4) + P('M8 4.5 H19 L16 8.8 L19 13 H8 Z', 2); },
    book: function () { return S(R(4, 3.5, 16, 17, 3.5)) + R(7, 3.5, 2.6, 17, 1.3) + R(12, 8, 5.5, 2, 1) + R(12, 12, 4, 2, 1); },
    bulb: function () { return S(C(12, 9.5, 7.5)) + C(12, 9.5, 3.8) + R(9, 17.5, 6, 3.5, 1.7); },
    leaf: function () { return S(P('M4.5 19.5 C4 9.5 10 4 20 4 C20.5 14 15 20 4.5 19.5Z', 2)) + L('M4.5 19.5 L13 11', 2.2); },
    sun: function () { return C(12, 12, 5) + S(rays(8, 11, 2, 2, 4, 1, 12, 12)); },
    rain: function () { return P('M6 13 A4 4 0 0 1 6.5 6.6 A6.5 6.5 0 0 1 18.5 8.5 A4.5 4.5 0 0 1 18 13 Z', 1.2) + S(L('M8 16.5 L7 20', 2.2) + L('M12 16.5 L11 20', 2.2) + L('M16 16.5 L15 20', 2.2)); },
    wind: function () { return L('M3 8.5 H15 A3 3 0 1 0 12 5.5', 2.4) + L('M3 13.5 H17.5 A2.8 2.8 0 1 1 14.8 16.5', 2.4) + S(L('M5 18 H11', 2)); },
    moon: function () { return P('M20 14.5 A8.5 8.5 0 1 1 9.5 4 A7 7 0 0 0 20 14.5Z', 1.5); },
    user: function () { return C(12, 8, 4.5) + S(P('M4 20.5 Q4 14 12 14 Q20 14 20 20.5 Z', 3)); },
    tap: function () { return S(C(12, 12, 10)) + C(12, 12, 4); },
    camera: function () { return S(R(3, 7, 18, 13, 4)) + R(8.5, 4, 7, 4.5, 1.8) + C(12, 13.6, 4); },
    undo: function () { return L('M9 7 L4.5 11.5 L9 16', 3) + L('M5 11.5 H14.5 A4.5 4.5 0 0 1 14.5 20.5 H11', 3); },
    redo: function () { return L('M15 7 L19.5 11.5 L15 16', 3) + L('M19 11.5 H9.5 A4.5 4.5 0 0 0 9.5 20.5 H13', 3); },
    save: function () { return S(R(4, 4, 16, 16, 3.5)) + R(7.5, 4, 9, 6, 1.5) + R(8, 13, 8, 7, 1.5); },
    download: function () { return L('M12 4 V14 M7.5 10 L12 14.5 L16.5 10', 3) + R(5, 18, 14, 3, 1.5); },
    image: function () { return S(R(3, 4, 18, 16, 4)) + C(8.5, 9.5, 2) + P('M4.5 18 L10 12 L13.5 16 L16 13.5 L20 18 Z', 1.6); },
    shirt: function () { return P('M8 4 L3 7.5 L5.5 11 L8 9.5 V20 H16 V9.5 L18.5 11 L21 7.5 L16 4 Q12 7 8 4Z', 1.6); },
    dice: function () { return S(R(4, 4, 16, 16, 4.5)) + C(8.5, 8.5, 1.7) + C(15.5, 8.5, 1.7) + C(12, 12, 1.7) + C(8.5, 15.5, 1.7) + C(15.5, 15.5, 1.7); },
    trash: function () { return R(5, 7, 14, 2.6, 1.3) + R(9.5, 4, 5, 3, 1.5) + S(R(6.5, 9.6, 11, 11, 3)) + R(10.8, 12, 2.4, 6, 1.2); },
    edit: function () { return P('M4 20 L5 15 L15.5 4.5 Q16.5 3.5 17.5 4.5 L19.5 6.5 Q20.5 7.5 19.5 8.5 L9 19 Z', 1.4); },
    face: function () { return S(C(12, 12, 10)) + C(8.5, 10, 1.6) + C(15.5, 10, 1.6) + L('M8 14.5 Q12 18 16 14.5', 2.4); }
  };

  function icon(id, o) {
    o = o || {}; if (!I[id]) throw new Error('未知 icon：' + id);
    var sz = typeof o.size === 'number' ? o.size : T.icons.size[o.size || 'md'];
    return '<svg xmlns="http://www.w3.org/2000/svg" class="g-icon' + (o.cls ? ' ' + o.cls : '') + '" viewBox="0 0 24 24" width="' + sz + '" height="' + sz + '" fill="currentColor"' + (o.color ? ' color="' + o.color + '" style="color:' + o.color + '"' : '') + ' aria-hidden="true">' + I[id]() + '</svg>';
  }
  var API = { icon: icon, list: T.icons.list, ids: Object.keys(I) };
  g.GameIcons = API; A.icon = icon; if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : globalThis);
