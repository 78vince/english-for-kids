/* game-props.js — 道具／物件（P[id](state)）。可互動的道具有 states，見 game-tokens.json props.list[].states。
 * 規則：扁平填色、圓角、無輪廓；非必要不加亮點。 */
(function (g) {
  var A = g.GameArt, H = A._h, T = H.T, C = T.color, N = C.neutral, P = A._P, hue = H.hue;
  var el = H.el, rect = H.rect, circ = H.circ, ell = H.ell, line = H.line, rpath = H.rpath, star = H.star;
  var ghost = function (f) { return function (s) { var r = f('idle'); return s === 'collected' ? '<g opacity=".25">' + r + '</g>' : r; }; };
  var tf = function (t, inner) { return '<g transform="' + t + '">' + inner + '</g>'; };

  /* ---------- 地形 ---------- */
  P.grassBlock = function () { return rect(2, 6, 60, 56, 14, hue('wood')) + circ(18, 46, 4, hue('wood', 'ledge')) + circ(44, 52, 3, hue('wood', 'ledge')) + rect(0, 2, 64, 24, 12, hue('leaf')); };
  P.stoneBlock = function () { return rect(2, 4, 60, 58, 14, hue('stone')) + circ(44, 44, 4, hue('stone', 'ledge')) + circ(20, 48, 3, hue('stone', 'ledge')); };
  P.giftBlock = function (s) {
    if (s === 'used') return rect(2, 4, 60, 58, 14, hue('stone')) + rect(27, 4, 10, 58, 3, hue('stone', 'ledge')) + rect(2, 27, 60, 10, 3, hue('stone', 'ledge'));
    var body = rect(2, 4, 60, 58, 14, hue('sun')) + rect(27, 4, 10, 58, 3, hue('rose')) + rect(2, 27, 60, 10, 3, hue('rose'));
    if (s === 'hit') return tf('translate(0 -6) translate(32 33) scale(1.04 .94) translate(-32 -33)', body + ell(18, 4, 9, 6, hue('rose', 'ledge'), { transform: 'rotate(-40 18 4)' }) + ell(46, 4, 9, 6, hue('rose', 'ledge'), { transform: 'rotate(40 46 4)' }) + circ(32, 6, 5, hue('rose')))
      + circ(14, -10, 3, hue('rose')) + circ(32, -16, 3, hue('sky')) + circ(50, -10, 3, hue('mint'));
    return body + ell(24, 6, 9, 6, hue('rose', 'ledge')) + ell(40, 6, 9, 6, hue('rose', 'ledge')) + circ(32, 8, 5, hue('rose'));
  };

  /* ---------- 機關 ---------- */
  P.spring = function (s) {
    var ty = s === 'compressed' ? 22 : s === 'launched' ? -10 : 2, y0 = ty + 14, y1 = 38, k = (y1 - y0) / 3, d = 'M12 ' + y1 + ' L36 ' + (y1 - k) + ' L12 ' + (y1 - 2 * k) + ' L36 ' + y0;
    return rect(6, 40, 36, 12, 6, hue('peach')) + el('path', { d: d, stroke: hue('stone', 'ledge'), 'stroke-width': 7, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }) + rect(4, ty, 40, 12, 6, hue('peach', 'ledge'));
  };
  P.door = function (s) {
    if (s === 'open') return rpath('M8 90 V38 Q8 8 32 8 Q56 8 56 38 V90 Z', hue('lilac'), 6) + rpath('M18 88 V40 Q18 20 32 20 Q46 20 46 40 V88 Z', hue('sun', 'soft'), 4) + rpath('M8 90 V38 Q8 12 24 9 L24 88 Z', hue('lilac', 'ledge'), 4);
    return rpath('M8 90 V38 Q8 8 32 8 Q56 8 56 38 V90 Z', hue('lilac'), 6) + rpath('M18 88 V40 Q18 20 32 20 Q46 20 46 40 V88 Z', hue('lilac', 'soft'), 4) + circ(40, 56, 3.5, hue('sun'));
  };
  P.portal = function (s) {
    var a = s === 'active';
    return (a ? ell(36, 46, 34, 48, hue('lilac'), { opacity: .35 }) : '') + ell(36, 46, 30, 44, hue('lilac')) + ell(36, 46, 21, 35, hue('lilac', 'soft')) + ell(36, 46, a ? 14 : 12, a ? 28 : 25, a ? hue('sun') : hue('sky'));
  };
  P.flag = function (s) {
    var on = s === 'active', cloth = on ? rpath('M18 12 L46 22 L18 34 Z', hue('rose'), 6) : rpath('M18 58 L44 67 L18 78 Z', hue('stone'), 6);
    return rect(10, 6, 6, 86, 3, hue('wood')) + circ(13, 92, 8, hue('wood', 'ledge')) + cloth + circ(13, 7, 5, on ? hue('sun') : hue('stone', 'ledge'));
  };

  /* ---------- 收集物 ---------- */
  P.coin = function (s) {
    if (s === 'spin') return ell(20, 20, 11, 18, hue('sun')) + ell(20, 20, 7, 12, hue('sun', 'ledge')) + ell(20, 20, 5, 9, hue('sun'));
    if (s === 'edge') return rect(17, 2, 6, 36, 3, hue('sun', 'ledge')) + rect(18.5, 4, 3, 32, 1.5, hue('sun'));
    var c = circ(20, 20, 18, hue('sun')) + circ(20, 20, 12, hue('sun', 'ledge')) + circ(20, 20, 9, hue('sun'));
    return s === 'collected' ? '<g opacity=".25">' + c + '</g>' : c;
  };
  P.star = ghost(function () { return rpath(star(22, 24, 17, 9), hue('sun'), 6) + circ(18, 25, 1.9, N.ink) + circ(26, 25, 1.9, N.ink) + circ(15, 29, 2, hue('rose'), { opacity: .7 }) + circ(29, 29, 2, hue('rose'), { opacity: .7 }); });
  P.gem = ghost(function () { return rpath('M12 8 L32 8 L40 20 L22 38 L4 20 Z', hue('sky'), 5) + rpath('M13 20 L31 20 L22 33 Z', hue('sky', 'ledge'), 2); });
  P.heart = ghost(function () { return el('path', { d: 'M22 36 C4 24 2 14 8 9 C14 4 20 8 22 13 C24 8 30 4 36 9 C42 14 40 24 22 36 Z', fill: hue('rose'), stroke: hue('rose'), 'stroke-width': 4, 'stroke-linejoin': 'round' }); });
  P.key = ghost(function () { return circ(14, 18, 12, hue('sun')) + circ(14, 18, 5, N['surface']) + rect(22, 14, 26, 8, 4, hue('sun')) + rect(38, 20, 6, 10, 3, hue('sun')) + rect(30, 20, 5, 7, 2.5, hue('sun')); });
  P.chest = function (s) {
    var body = rect(2, 20, 60, 30, 10, hue('wood')) + rect(26, 20, 12, 30, 4, hue('sun'));
    if (s === 'open') return rpath('M8 22 L12 2 Q32 -6 52 2 L56 22 Z', hue('wood', 'ledge'), 4) + body + ell(32, 21, 26, 6, hue('wood', 'deep')) + circ(20, 20, 6, hue('sun')) + circ(33, 17, 6, hue('sun', 'ledge')) + circ(44, 20, 6, hue('sun'));
    if (s === 'bite') {
      var openLid = rpath('M6 20 L10 -4 Q32 -16 54 -4 L58 20 Z', hue('wood', 'ledge'), 4)
                  + rect(26, -2, 12, 20, 4, hue('sun'))
                  + circ(22, 6, 2.5, hue('sun')) + circ(42, 6, 2.5, hue('sun'));
      var mouthBg = ell(32, 20, 26, 12, hue('rose', 'deep'));
      var teethTop = el('path', { d: 'M9.5 12 L13 19 L16.2 9.5 L19.5 20 L22.8 8.5 L26 21.5 L29.2 8 L32.5 20 L35.8 8 L39 21.5 L42.2 8.5 L45.5 20 L48.8 9.5 L52 19 L54.5 12 Q32 4 9.5 12 Z', fill: N['surface-raised'] });
      var teethBottom = el('path', { d: 'M9.5 28 L13 30.5 L16.2 21 L19.5 31.5 L22.8 20 L26 32 L29.2 18.5 L32.5 32 L35.8 18.5 L39 32 L42.2 20 L45.5 31.5 L48.8 21 L52 30.5 L54.5 28 Q32 36 9.5 28 Z', fill: N['surface-raised'] });
      return openLid + body + mouthBg + teethTop + teethBottom;
    }
    if (s === 'dizzy') {
      var dizzyStars = circ(20, 8, 3, hue('sun')) + circ(44, 8, 3, hue('sun')) + rpath(star(32, 4, 6, 3), hue('sun'), 1);
      return body + el('path', { d: 'M4 24 Q4 4 32 4 Q60 4 60 24 Z', fill: hue('wood', 'ledge'), stroke: hue('wood', 'ledge'), 'stroke-width': 4, 'stroke-linejoin': 'round' }) + rect(26, 4, 12, 22, 4, hue('sun')) + circ(32, 28, 5, hue('sun', 'ledge')) + dizzyStars;
    }
    return body + el('path', { d: 'M4 24 Q4 4 32 4 Q60 4 60 24 Z', fill: hue('wood', 'ledge'), stroke: hue('wood', 'ledge'), 'stroke-width': 4, 'stroke-linejoin': 'round' }) + rect(26, 4, 12, 22, 4, hue('sun')) + circ(32, 28, 5, hue('sun', 'ledge'));
  };
  P.balloon = function (s) {
    if (s === 'popped') return el('path', { d: 'M20 62 Q14 54 22 48 Q18 44 20 40', stroke: N['ink-faint'], 'stroke-width': 2.4, 'stroke-linecap': 'round' }) + rpath('M8 14 L20 8 L22 22 Z', hue('rose'), 3) + rpath('M24 22 L36 18 L32 30 Z', hue('rose', 'ledge'), 3) + rpath('M12 30 L22 28 L18 38 Z', hue('rose'), 3);
    return el('path', { d: 'M20 62 Q14 54 22 48 Q18 44 20 40', stroke: N['ink-faint'], 'stroke-width': 2.4, 'stroke-linecap': 'round' }) + ell(20, 22, 16, 20, hue('rose')) + rpath('M16 42 L24 42 L20 47 Z', hue('rose', 'ledge'), 3);
  };

  /* ---------- 場景物件 ---------- */
  P.signpost = function () { return rect(26, 36, 8, 46, 4, hue('bark', 'ledge')) + rect(4, 6, 52, 34, 12, hue('bark')) + rect(14, 17, 32, 4, 2, hue('wood', 'soft')) + rect(14, 26, 22, 4, 2, hue('wood', 'soft')); };
  P.tree = function () {
    var cl = function (dx, dy, k, c) { return circ(42 + dx, 42 + dy, 28 * k, c) + circ(20 + dx, 56 + dy, 17 * k, c) + circ(64 + dx, 56 + dy, 17 * k, c) + circ(32 + dx, 26 + dy, 17 * k, c) + circ(54 + dx, 26 + dy, 17 * k, c) + rect(14 + dx, 52 + dy, 56, 14, 7, c); };
    return rpath('M36 109 Q42 106 42 90 L42 60 L50 60 L50 90 Q50 106 56 109 Z', hue('bark'), 4) + rect(43.5, 62, 2.5, 38, 1.2, hue('bark', 'ledge'), { opacity: .8 }) + cl(0, 0, 1, hue('leaf', 'ledge')) + cl(-2, -4, .94, hue('leaf'));
  };
  P.pine = function () { return rect(37, 86, 10, 24, 4, hue('bark')) + rpath('M12 92 L42 48 L72 92 Z', hue('leaf', 'ledge'), 10) + rpath('M18 66 L42 24 L66 66 Z', hue('leaf'), 10) + rpath('M26 40 L42 10 L58 40 Z', hue('leaf', 'ledge'), 10); };
  P.cherry = function () {
    return line(48, 110, 48, 70, hue('bark'), 12) + line(48, 80, 32, 62, hue('bark'), 7) + line(48, 76, 66, 58, hue('bark'), 7)
      + circ(28, 60, 20, hue('rose', 'ledge')) + circ(68, 58, 20, hue('rose', 'ledge')) + circ(48, 38, 30, hue('rose')) + circ(28, 52, 20, hue('rose')) + circ(68, 50, 20, hue('rose'))
      + circ(12, 88, 3, hue('rose')) + circ(84, 96, 3, hue('rose')) + circ(22, 104, 2.5, hue('rose'));
  };
  P.palm = function () {
    var fr = function (a, col) { return '<g transform="translate(52 54) rotate(' + a + ')">' + el('path', { d: 'M0 0 Q20 -18 44 0 Q22 -6 0 6 Z', fill: col, stroke: col, 'stroke-width': 4, 'stroke-linejoin': 'round' }) + '</g>'; };
    return el('path', { d: 'M44 114 Q40 84 52 56', stroke: hue('bark'), 'stroke-width': 11, 'stroke-linecap': 'round' })
      + fr(-160, hue('leaf', 'ledge')) + fr(-20, hue('leaf', 'ledge')) + fr(155, hue('leaf', 'ledge')) + fr(25, hue('leaf', 'ledge')) + fr(-120, hue('leaf')) + fr(-60, hue('leaf'))
      + circ(48, 62, 5, hue('bark', 'ledge')) + circ(57, 63, 5, hue('bark'));
  };
  P.maple = function () { return rect(40, 70, 12, 40, 5, hue('bark')) + circ(24, 58, 20, hue('sun', 'ledge')) + circ(68, 56, 20, hue('peach', 'ledge')) + circ(46, 38, 28, hue('peach')) + circ(46, 58, 22, hue('sun')) + circ(14, 106, 3, hue('peach')) + circ(78, 108, 3, hue('sun', 'ledge')); };
  P.bush = function () { return circ(22, 30, 20, hue('leaf', 'ledge')) + circ(60, 30, 20, hue('leaf', 'ledge')) + circ(42, 24, 22, hue('leaf')) ; };
  P.flower = function (s) {
    if (s === 'bud') return line(18, 24, 18, 46, hue('leaf', 'ledge'), 5) + ell(18, 16, 6.5, 10, hue('rose')) + rpath('M10 26 Q18 20 26 26 Q18 32 10 26Z', hue('leaf'), 2);
    var i, ps = ''; for (i = 0; i < 5; i++) { var an = (i * 72 - 90) * Math.PI / 180; ps += circ(18 + 9 * Math.cos(an), 15 + 9 * Math.sin(an), 7, hue('rose')); }
    return line(18, 24, 18, 46, hue('leaf', 'ledge'), 5) + ps + circ(18, 15, 5.5, hue('sun'));
  };
  P.mushroom = function (s) {
    var q = s === 'squash';
    return rect(q ? 14 : 16, q ? 32 : 24, q ? 24 : 20, q ? 14 : 22, 9, hue('wood', 'soft')) + el('path', { d: q ? 'M0 36 Q0 18 26 18 Q52 18 52 36 Z' : 'M4 28 Q4 4 26 4 Q48 4 48 28 Z', fill: hue('peach'), stroke: hue('peach'), 'stroke-width': 4, 'stroke-linejoin': 'round' })
      + circ(q ? 14 : 16, q ? 28 : 16, 4, N['surface-raised']) + circ(q ? 30 : 32, q ? 25 : 12, 3.5, N['surface-raised']) + circ(q ? 40 : 37, q ? 32 : 22, 3, N['surface-raised']);
  };
  P.rock = function () { return el('path', { d: 'M8 38 Q4 18 22 12 Q44 6 56 22 Q62 38 52 40 Z', fill: hue('stone'), stroke: hue('stone'), 'stroke-width': 5, 'stroke-linejoin': 'round' }) + circ(46, 32, 3, hue('stone', 'ledge')); };
  P.bench = function () { return rect(10, 36, 8, 14, 4, hue('bark', 'ledge')) + rect(78, 36, 8, 14, 4, hue('bark', 'ledge')) + rect(4, 24, 88, 14, 7, hue('bark')) + rect(8, 4, 80, 12, 6, hue('bark')) + rect(14, 14, 6, 12, 3, hue('bark', 'ledge')) + rect(76, 14, 6, 12, 3, hue('bark', 'ledge')); };
  P.tent = function (s) {
    var b = rpath('M10 68 L48 10 L86 68 Z', hue('sky'), 10) + rpath('M48 24 L70 68 L26 68 Z', hue('sky', 'ledge'), 4) + circ(48, 8, 5, hue('rose'));
    if (s === 'open') return b + rpath('M48 40 L58 68 L38 68 Z', hue('sky', 'deep'), 3) + rpath('M48 36 L36 68 L26 68 Z', hue('sky', 'ledge'), 3) + rpath('M48 36 L60 68 L70 68 Z', hue('sky', 'ledge'), 3);
    return b + rpath('M48 40 L58 68 L38 68 Z', hue('sky'), 3) + line(48, 42, 48, 68, hue('sky', 'ledge'), 2.4);
  };
  P.campfire = function (s) {   /* 所有筆畫都在 64×60 的 viewBox 內（v0.7 修正：舊版柴堆與火焰超出邊界，被裁切） */
    var out = s === 'out', lg = out ? hue('bark', 'ledge') : hue('bark');
    var logs = rect(7, 42, 50, 10, 5, hue('bark', 'ledge'), { transform: 'rotate(10 32 47)' }) + rect(7, 42, 50, 10, 5, lg, { transform: 'rotate(-10 32 47)' });
    if (out) return logs + circ(30, 30, 7, hue('stone'), { opacity: .8 }) + circ(37, 19, 5.5, hue('stone'), { opacity: .6 }) + circ(32, 10, 4, hue('stone'), { opacity: .4 });
    return logs + el('path', { d: 'M32 8 Q46 22 43 35 Q41 42 32 42 Q23 42 21 35 Q19 24 32 8 Z', fill: hue('peach'), stroke: hue('peach'), 'stroke-width': 3, 'stroke-linejoin': 'round' }) + el('path', { d: 'M32 22 Q39 30 37 37 Q35 40 32 40 Q29 40 27 37 Q26 30 32 22 Z', fill: hue('sun') });
  };
  /* 可踩踏的木頭：橫躺原木（上緣 y=4 為站立面）、樹墩 */
  P.log = function () { return rect(2, 4, 92, 26, 13, hue('bark')) + rect(14, 12, 44, 3, 1.5, hue('bark', 'ledge')) + rect(22, 20, 34, 3, 1.5, hue('bark', 'ledge')) + ell(84, 17, 10, 13, hue('wood', 'soft')) + ell(84, 17, 5, 7, hue('bark', 'ledge'), { opacity: .6 }); };
  P.stump = function () { return rect(4, 12, 40, 36, 8, hue('bark')) + rect(12, 22, 3, 18, 1.5, hue('bark', 'ledge')) + rect(30, 26, 3, 14, 1.5, hue('bark', 'ledge')) + ell(24, 12, 20, 9, hue('wood', 'soft')) + ell(24, 12, 11, 4.6, hue('bark', 'ledge'), { opacity: .55 }); };

  /* ---------- 背景與天體 ---------- */
  P.cloud = function () { var f = N['surface-raised']; return rect(8, 28, 96, 24, 12, f) + circ(36, 28, 20, f) + circ(66, 22, 24, f) + circ(88, 34, 14, f); };
  P.stool = function () { return rect(2, 6, 68, 9, 4.5, hue('wood', 'soft')) + rect(7, 13, 58, 4, 2, hue('bark', 'ledge')) + rect(10, 16, 9, 18, 3, hue('bark')) + rect(53, 16, 9, 18, 3, hue('bark')); };   /* 座位高 28（以角色 170 高單位計），寬 72 */
  P.sun = function () { var c = function (r, op) { return circ(60, 60, r, hue('sun'), { opacity: op, style: 'fill:var(--sunc,' + hue('sun') + ')' }); }; return c(58, .2) + c(46, .3) + c(32, 1); };   /* 顏色由 CSS 變數 --sunc 決定（日升日落時變色） */
  P.moon = function (s) {
    var m = C.world.scene.forest.night;
    if (s === 'skull') {
      /* 骷髏頭月亮（墓園夜晚場景專屬）：光暈、骷髏頭顱輪廓、月球坑洞陰影、空洞眼窩、鼻腔與牙齒 */
      var halo1 = circ(60, 56, 56, m.halo, { opacity: .18 });
      var halo2 = circ(60, 56, 44, m.halo, { opacity: .24 });
      var skullPath = 'M60 22 C78 22 92 36 92 56 Q93 65 87 69 Q81 73 78 74 L77 82 Q76 90 60 90 Q44 90 43 82 L42 74 Q39 73 33 69 Q27 65 28 56 C28 36 42 22 60 22 Z';
      var skullBody = el('path', { d: skullPath, fill: m.celestial });
      var craters = circ(66, 33, 5, '#E4DDAE', { opacity: .7 })
                  + circ(78, 40, 3.5, '#E4DDAE', { opacity: .6 })
                  + circ(40, 36, 4, '#E4DDAE', { opacity: .65 })
                  + circ(48, 28, 2.5, '#E4DDAE', { opacity: .6 });
      var cheekShade = ell(34, 62, 4, 6, '#E4DDAE', { opacity: .5 })
                     + ell(86, 62, 4, 6, '#E4DDAE', { opacity: .5 });
      var ink = '#282548';
      var eyeL = el('ellipse', { cx: 46, cy: 55, rx: 8.5, ry: 10, fill: ink, transform: 'rotate(-5 46 55)' }) + circ(48, 53, 2.2, '#FFF6C9', { opacity: .9 });
      var eyeR = el('ellipse', { cx: 74, cy: 55, rx: 8.5, ry: 10, fill: ink, transform: 'rotate(5 74 55)' }) + circ(72, 53, 2.2, '#FFF6C9', { opacity: .9 });
      var nose = el('path', { d: 'M60 64 L63.5 70 Q60 71.5 56.5 70 Z', fill: ink });
      var teeth = el('path', { d: 'M49 81 L71 81', stroke: ink, 'stroke-width': 2, 'stroke-linecap': 'round' })
                + el('path', { d: 'M54 76 L54 86 M60 76 L60 86 M66 76 L66 86', stroke: ink, 'stroke-width': 1.8, 'stroke-linecap': 'round' });
      return halo1 + halo2 + skullBody + craters + cheekShade + eyeL + eyeR + nose + teeth;
    }
    /* 其餘場景依照原本樣式：圓形月體、光暈與三個隕石坑 */
    return circ(60, 60, 58, m.halo, { opacity: .2 }) + circ(60, 60, 46, m.halo, { opacity: .25 }) + circ(60, 60, 30, m.celestial) + circ(50, 52, 6, '#E4DDAE') + circ(70, 68, 4.5, '#E4DDAE') + circ(48, 70, 3.2, '#E4DDAE');
  };

  /* ---------- 太空（宇宙空間場景，2026-10-20） ---------- */
  /* 小行星：上緣比較平（站立面＝collider box 上緣），表面淺色、底部陰影、幾個坑洞 */
  var rock = function (body, top, shade, craters) {
    var b = hue('lilac', 'ledge'), dk = hue('lilac', 'deep');
    return el('path', { d: body, fill: b }) + el('path', { d: top, fill: hue('lilac') }) + el('path', { d: shade, fill: dk, opacity: .32 })
      + craters.map(function (c) { return ell(c[0], c[1], c[2], c[3], dk, { opacity: .28 }); }).join('');
  };
  P.asteroid = function () {
    return rock('M12 24 Q14 9 38 9 Q62 5 90 9 Q118 9 120 26 Q126 44 104 55 Q84 64 60 61 Q30 63 16 51 Q4 40 12 24 Z',
      'M14 22 Q18 10 38 11 Q62 7 90 11 Q114 11 118 24 Q100 19 64 20 Q30 19 14 22 Z',
      'M10 36 Q28 54 60 54 Q92 56 122 34 Q122 46 104 55 Q84 64 60 61 Q30 63 16 51 Q8 44 10 36 Z',
      [[40, 32, 9, 5], [84, 38, 12, 6], [62, 48, 6, 3.5], [102, 26, 5, 3]]);
  };
  P.asteroidSmall = function () {
    return rock('M10 22 Q14 8 36 9 Q60 6 68 20 Q74 34 62 46 Q46 56 28 52 Q8 48 7 34 Q6 28 10 22 Z',
      'M12 20 Q16 10 36 11 Q58 8 66 20 Q50 16 36 17 Q20 17 12 20 Z',
      'M7 32 Q20 46 38 46 Q58 46 71 30 Q72 38 62 46 Q46 56 28 52 Q8 48 7 32 Z',
      [[30, 30, 7, 4], [52, 37, 5, 3]]);
  };
  /* 黑洞：外圈光暈＋三條旋臂（.g-spin 繞中心慢慢轉）＋光環＋中心黑色事件視界（色票取宇宙空間夜晚的天空） */
  P.blackHole = function () {
    var dark = C.world.scene.space ? C.world.scene.space.night.skyTop : N.ink, cols = [hue('peach'), hue('sun'), hue('lilac', 'soft')], arms = '', k, q;
    for (k = 0; k < 3; k++) {
      var d = '';
      for (q = 0; q <= 16; q++) { var rr = 64 - q * 38 / 16, th = k * 2.0944 + (64 - rr) / 38 * 2.6; d += (q ? ' L' : 'M') + (70 + rr * Math.cos(th)).toFixed(1) + ' ' + (70 + rr * Math.sin(th)).toFixed(1); }
      arms += el('path', { d: d, stroke: cols[k], 'stroke-width': 6, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: .9 });
    }
    for (k = 0; k < 6; k++) arms += circ((70 + 50 * Math.cos(k * 1.05 + .4)).toFixed(1), (70 + 50 * Math.sin(k * 1.05 + .4)).toFixed(1), k % 2 ? 2.2 : 3, cols[k % 3]);
    return circ(70, 70, 68, hue('lilac'), { opacity: .16 }) + circ(70, 70, 52, hue('lilac'), { opacity: .2 })
      + el('g', { class: 'g-spin' }, arms)
      + circ(70, 70, 31, 'none', { stroke: hue('sun', 'soft'), 'stroke-width': 4, opacity: .9 }) + circ(70, 70, 27, dark);
  };
  /* 飛碟（96×56）：玻璃圓頂裡有一個小外星人，機身三色小燈 */
  P.ufo = function () {
    var lights = [hue('sun'), hue('rose'), hue('mint'), hue('sun')].map(function (c, i) { return circ(24 + i * 16, 37, 3.5, c); }).join('');
    return ell(48, 50, 18, 3, hue('lilac', 'soft'), { opacity: .5 })
      + el('path', { d: 'M28 30 Q28 8 48 8 Q68 8 68 30 Z', fill: hue('sky', 'soft'), opacity: .9 })
      + circ(48, 22, 7, hue('mint')) + circ(45.5, 21, 1.6, N.ink) + circ(50.5, 21, 1.6, N.ink) + line(48, 15, 48, 11, hue('mint'), 2) + circ(48, 10.5, 2, hue('mint'))
      + ell(48, 33, 44, 11, hue('stone')) + ell(48, 37, 40, 6, hue('stone', 'ledge')) + lights;
  };
  /* 太空隕石 spaceMeteor（48×48；爬樹的流星是另一個 meteor）：頭在中心（往右飛），尾巴往左拖到框外 */
  P.spaceMeteor = function () {
    return el('path', { d: 'M-52 22 Q-10 8 24 10 L24 38 Q-10 36 -52 26 Z', fill: hue('peach'), opacity: .45 })
      + el('path', { d: 'M-30 23 Q0 15 24 16 L24 32 Q0 31 -30 25 Z', fill: hue('sun'), opacity: .6 })
      + circ(24, 24, 18, hue('peach'), { opacity: .45 })
      + circ(24, 24, 14, hue('bark', 'ledge')) + circ(29, 19, 5, hue('bark')) + circ(19, 29, 3.5, hue('bark')) + circ(28, 30, 2.5, hue('bark'));
  };

  /* 地鼠土坑 moleHole（120×60）：草地上的泥土洞穴，支援 back / front / active / idle 狀態 */
  P.moleHole = function (s) {
    var back = ell(60, 24, 46, 16, hue('bark', 'deep')) + ell(60, 26, 42, 13, hue('bark', 'ledge'));
    var front = rpath('M12 24 Q60 18 108 24 Q116 52 60 56 Q4 52 12 24 Z', hue('wood'))
      + rpath('M14 38 Q60 32 106 38 Q110 52 60 56 Q10 52 14 38 Z', hue('wood', 'ledge'))
      + circ(28, 36, 4, hue('leaf')) + circ(34, 32, 3, hue('leaf')) + circ(86, 36, 4, hue('leaf', 'ledge')) + circ(92, 33, 3, hue('leaf'));
    var dust = circ(24, 20, 2.5, hue('wood', 'ledge')) + circ(96, 22, 2.5, hue('wood', 'ledge')) + circ(60, 14, 2, hue('wood'));
    if (s === 'back') return back;
    if (s === 'front') return front;
    if (s === 'active') return front + dust;
    return back + front;
  };

  /* 蝙蝠 bat（48×36）：夜晚飛行生物，展翅/振翅萌趣小精靈 */
  P.bat = function (s) {
    var up = s === 'up';
    var earL = rpath('M15 14 L17 4 L22 13 Z', hue('lilac', 'deep'), 3);
    var earR = rpath('M33 14 L31 4 L26 13 Z', hue('lilac', 'deep'), 3);
    var body = ell(24, 21, 9, 11, hue('lilac', 'deep'));
    var eyes = circ(21, 19, 2.2, N['surface-raised']) + circ(27, 19, 2.2, N['surface-raised'])
             + circ(21, 19, 1.1, N.ink) + circ(27, 19, 1.1, N.ink);
    var mouth = el('path', { d: 'M22 24 Q24 26 26 24', stroke: N['surface-raised'], 'stroke-width': 1.5, fill: 'none' });
    var wingL = up
      ? el('path', { d: 'M16 18 Q8 6 2 12 Q6 20 11 22 Q14 26 18 24 Z', fill: hue('lilac', 'deep'), stroke: hue('lilac', 'deep'), 'stroke-width': 3, 'stroke-linejoin': 'round' })
      : el('path', { d: 'M16 20 Q8 26 2 24 Q6 16 11 15 Q14 14 18 18 Z', fill: hue('lilac', 'deep'), stroke: hue('lilac', 'deep'), 'stroke-width': 3, 'stroke-linejoin': 'round' });
    var wingR = up
      ? el('path', { d: 'M32 18 Q40 6 46 12 Q42 20 37 22 Q34 26 30 24 Z', fill: hue('lilac', 'deep'), stroke: hue('lilac', 'deep'), 'stroke-width': 3, 'stroke-linejoin': 'round' })
      : el('path', { d: 'M32 20 Q40 26 46 24 Q42 16 37 15 Q34 14 30 18 Z', fill: hue('lilac', 'deep'), stroke: hue('lilac', 'deep'), 'stroke-width': 3, 'stroke-linejoin': 'round' });
    return earL + earR + wingL + wingR + body + eyes + mouth;
  };

  /* 萌萌小殭屍 zombie（56×72）：萬聖節Q版跳跳小夥伴，綠色皮膚、官帽愛心符咒、平舉雙手 */
  P.zombie = function (s) {
    var robe = rect(16, 32, 24, 30, 10, hue('stone', 'deep'));
    var head = circ(28, 22, 16, hue('mint'));
    var blush = circ(19, 27, 3.2, hue('rose'), { opacity: .75 }) + circ(37, 27, 3.2, hue('rose'), { opacity: .75 });
    var eyes = '';
    if (s === 'hug') {
      eyes = el('path', { d: 'M18 21 Q21 17 24 21', stroke: N.ink, 'stroke-width': 2, 'stroke-linecap': 'round', fill: 'none' })
           + el('path', { d: 'M32 21 Q35 17 38 21', stroke: N.ink, 'stroke-width': 2, 'stroke-linecap': 'round', fill: 'none' });
    } else if (s === 'dizzy') {
      eyes = line(18, 18, 24, 24, N.ink, 2) + line(18, 24, 24, 18, N.ink, 2)
           + line(32, 18, 38, 24, N.ink, 2) + line(32, 24, 38, 18, N.ink, 2);
    } else {
      eyes = circ(21, 21, 3.2, N['surface-raised']) + circ(35, 21, 3.2, N['surface-raised'])
           + circ(21, 21, 1.8, N.ink) + circ(35, 21, 1.8, N.ink);
    }
    var mouth = s === 'hug'
      ? el('path', { d: 'M25 27 Q28 31 31 27', stroke: N.ink, 'stroke-width': 1.8, 'stroke-linecap': 'round', fill: 'none' })
      : el('path', { d: 'M25 28 Q28 31 31 28', stroke: N.ink, 'stroke-width': 1.6, 'stroke-linecap': 'round', fill: 'none' });
    var cap = ell(28, 8, 14, 5, hue('stone', 'deep')) + circ(28, 5, 3.5, hue('rose', 'deep'));
    var talisman = rect(24, 9, 8, 16, 2, hue('sun')) + circ(28, 17, 2, hue('rose'));
    var feet = s === 'hop' || s === 'dizzy'
      ? rect(18, 59, 8, 8, 4, N.ink) + rect(30, 59, 8, 8, 4, N.ink)
      : rect(18, 62, 8, 9, 4, N.ink) + rect(30, 62, 8, 9, 4, N.ink);
    var arms = '';
    if (s === 'hug') {
      arms = line(16, 38, 28, 46, hue('mint'), 6) + circ(28, 46, 3.5, hue('mint'))
           + line(40, 38, 28, 46, hue('mint'), 6);
    } else if (s === 'wave') {
      arms = line(16, 38, 2, 38, hue('mint'), 6) + circ(2, 38, 3.5, hue('mint'))
           + line(40, 38, 50, 24, hue('mint'), 6) + circ(50, 24, 3.5, hue('mint'));
    } else if (s === 'dizzy') {
      arms = line(16, 38, 6, 22, hue('mint'), 6) + circ(6, 22, 3.5, hue('mint'))
           + line(40, 38, 50, 22, hue('mint'), 6) + circ(50, 22, 3.5, hue('mint'));
    } else {
      var dy = s === 'hop' ? 36 : 38;
      arms = line(16, dy, 2, dy, hue('mint'), 6) + circ(2, dy, 3.5, hue('mint'))
           + line(40, dy, 54, dy, hue('mint'), 6) + circ(54, dy, 3.5, hue('mint'));
    }
    var stars = s === 'dizzy' ? (circ(16, 4, 3, hue('sun')) + circ(40, 4, 3, hue('sun'))) : '';
    return robe + feet + arms + head + blush + eyes + mouth + cap + talisman + stars;
  };

  /* 南瓜墓碑 tombstone（60×64）：圓角厚石碑，頂端蹲著微笑發光小南瓜，可站立踩踏 */
  P.tombstone = function (s) {
    var glow = s === 'glow';
    var base = rect(6, 54, 48, 8, 4, hue('stone', 'ledge'));
    var stone = rpath('M10 54 L10 24 Q30 4 50 24 L50 54 Z', hue('stone'), 4)
              + rpath('M14 52 L14 26 Q30 10 46 26 L46 52 Z', hue('stone', 'soft'), 3)
              + rpath(star(30, 34, 6, 3), hue('stone', 'deep'), 1.5);
    var pAura = glow ? circ(42, 14, 16, hue('sun', 'soft'), { opacity: .65, 'class': 'g-glow' }) : '';
    var pkin = circ(42, 14, 10, hue('sun'))
             + rect(41, 2, 2.5, 4, 1.2, hue('leaf', 'deep'))
             + circ(39, 13, 1.4, N.ink) + circ(45, 13, 1.4, N.ink)
             + el('path', { d: 'M39 17 Q42 20 45 17', stroke: N.ink, 'stroke-width': 1.4, 'stroke-linecap': 'round', fill: 'none' });
    return base + stone + pAura + pkin;
  };

  /* 地底巨手 giantHand（72×88）：隱藏地底（看不出異樣）／破土抓攫角色／驚慌退回地底 */
  P.giantHand = function (s) {
    if (s === 'hidden') return '';
    var skin = hue('lilac'), shade = hue('lilac', 'ledge'), deep = hue('lilac', 'deep');
    var soil = hue('bark'), soilDk = hue('bark', 'ledge');

    // 地面破土土堆與碎石
    var dirt = ell(36, 82, 28, 6, '#282548')
             + el('path', { d: 'M8 84 Q18 74 28 82 Q38 72 48 83 Q58 74 66 84 Z', fill: soilDk })
             + ell(18, 80, 10, 5, soil) + ell(54, 80, 11, 5, soil)
             + circ(12, 73, 2.5, soil) + circ(60, 71, 2.5, soil) + circ(22, 69, 1.8, soilDk) + circ(50, 68, 1.8, soilDk);

    if (s === 'retreat') {
      // 縮回地底時：手腕下沉、手指驚慌張開並沉入土壤
      var rWrist = rpath('M26 84 L28 66 L44 66 L46 84 Z', shade, 3) + rpath('M29 82 L30 67 L42 67 L43 82 Z', skin, 2);
      var rPalm = ell(36, 62, 14, 8, skin);
      var rFingers = el('path', { d: 'M23 60 Q17 48 23 42 Q28 44 27 58 M29 57 Q27 38 33 34 Q38 38 34 57 M36 57 Q38 36 43 35 Q46 39 40 58 M43 59 Q48 42 54 44 Q53 52 46 61', stroke: skin, 'stroke-width': 5.5, 'stroke-linecap': 'round', fill: 'none' })
                   + el('path', { d: 'M23 42 L25 44 M33 34 L34 37 M43 35 L43 38 M54 44 L52 47', stroke: deep, 'stroke-width': 2.5, 'stroke-linecap': 'round' });
      return dirt + rWrist + rPalm + rFingers;
    }

    // grab 抓住狀態：巨大的手腕向上竄起，4 隻彎曲利爪手指＋大拇指向前合攏環抱抓攫
    var wrist = rpath('M22 84 L25 48 L47 48 L50 84 Z', shade, 4)
              + rpath('M25 82 L27 49 L45 49 L47 82 Z', skin, 3)
              + el('path', { d: 'M26 64 Q36 67 46 64 M27 73 Q36 76 45 73', stroke: shade, 'stroke-width': 2.4, 'stroke-linecap': 'round' });

    var palm = ell(36, 44, 18, 14, skin) + ell(36, 45, 12, 9, shade, { opacity: .45 });

    // 大拇指（左側向內環扣）
    var thumb = el('path', { d: 'M23 48 C12 45 10 32 18 28 C24 25 28 35 25 45 Z', fill: skin })
              + el('path', { d: 'M15 31 Q19 28 20 33', stroke: deep, 'stroke-width': 2.5, 'stroke-linecap': 'round', fill: 'none' });

    // 食指、中指、無名指、小指（向上彎曲抓取姿態）
    var f1 = el('path', { d: 'M23 37 C18 22 22 10 29 8 C35 7 35 18 31 34 Z', fill: skin })
           + el('path', { d: 'M26 12 Q30 9 32 14', stroke: deep, 'stroke-width': 2.5, 'stroke-linecap': 'round', fill: 'none' });
    var f2 = el('path', { d: 'M31 33 C30 16 34 4 41 4 C47 4 47 16 40 33 Z', fill: skin })
           + el('path', { d: 'M38 7 Q42 5 44 9', stroke: deep, 'stroke-width': 2.5, 'stroke-linecap': 'round', fill: 'none' });
    var f3 = el('path', { d: 'M40 34 C44 18 47 8 53 10 C58 12 55 22 48 36 Z', fill: skin })
           + el('path', { d: 'M50 12 Q54 11 55 16', stroke: deep, 'stroke-width': 2.5, 'stroke-linecap': 'round', fill: 'none' });
    var f4 = el('path', { d: 'M48 40 C55 28 61 20 66 23 C70 27 64 36 54 45 Z', fill: skin })
           + el('path', { d: 'M62 25 Q65 24 64 29', stroke: deep, 'stroke-width': 2.5, 'stroke-linecap': 'round', fill: 'none' });

    // 指節陰影褶皺
    var knuckles = el('path', { d: 'M25 24 Q28 26 31 24 M33 21 Q37 23 41 21 M43 23 Q47 25 50 23', stroke: shade, 'stroke-width': 2, 'stroke-linecap': 'round', fill: 'none' });

    return dirt + wrist + palm + thumb + f1 + f2 + f3 + f4 + knuckles;
  };

  /* 辟邪石燈籠 stoneLantern（52×80）：未點亮（暗淡青石）／點亮（暖金聖火光暈與綠色符文） */
  P.stoneLantern = function (s) {
    var lit = s === 'lit';
    var stoneLedge = hue('stone', 'ledge'), stone = hue('stone'), stoneSoft = hue('stone', 'soft'), stoneDeep = hue('stone', 'deep');
    // 石燈籠基座：梯形台階
    var base1 = rect(6, 70, 40, 10, 4, stoneLedge);
    var base2 = rect(10, 64, 32, 7, 3, stone);
    // 石柱中節
    var pillar = rpath('M20 64 L22 46 L30 46 L32 64 Z', stoneLedge, 3) + rpath('M22 62 L23 47 L29 47 L30 62 Z', stoneSoft, 2);
    // 燈座托盤
    var tray = rect(12, 42, 28, 5, 2.5, stoneLedge) + rect(14, 40, 24, 3, 1.5, stone);
    // 燈室與石窗
    var chamber = rect(16, 22, 20, 19, 4, stoneDeep);
    var fire = '', halo = '';
    if (lit) {
      // 1. 光暈：輻射漸層，外實內透明色（圓心處透明保持石燈細節清晰，外圍金光飽滿，最外緣柔和漸層淡出無硬邊）
      var gid = 'slg' + H.nextId();
      halo = '<defs><radialGradient id="' + gid + '" cx="50%" cy="50%" r="50%">'
           + '<stop offset="0%" stop-color="' + hue('sun') + '" stop-opacity="0"/>'
           + '<stop offset="28%" stop-color="' + hue('sun') + '" stop-opacity="0"/>'
           + '<stop offset="70%" stop-color="' + hue('sun') + '" stop-opacity=".75"/>'
           + '<stop offset="88%" stop-color="' + hue('sun', 'soft') + '" stop-opacity=".45"/>'
           + '<stop offset="100%" stop-color="' + hue('sun') + '" stop-opacity="0"/>'
           + '</radialGradient></defs>'
           + circ(26, 31, 46, 'url(#' + gid + ')', { 'class': 'g-glow' });

      // 2. 燈室內部：金黃背景 + 燈芯白色發光
      var windowBg = rect(17, 23, 18, 17, 3, hue('sun'));
      var wickGlow = circ(26, 31, 6.5, '#FFFFFF', { opacity: .8, 'class': 'g-glow' });
      var wick = el('path', {
        d: 'M26 22 Q29.5 27 28.5 31.5 Q27.5 35 26 35 Q24.5 35 23.5 31.5 Q22.5 27 26 22 Z',
        fill: '#FFFFFF'
      }) + circ(26, 31, 2.5, '#FFFDF0');
      var windowBar = line(26, 23, 26, 38, stoneLedge, 2);
      fire = windowBg + wickGlow + wick + windowBar;
    } else {
      // 未點亮：黑洞幽暗窗
      fire = rect(18, 24, 16, 15, 3, '#221F35')
           + line(26, 23, 26, 38, stoneLedge, 2);
    }
    // 燈頂屋簷（微翹四角）與寶珠頂
    var roofLedge = rpath('M4 23 Q26 18 48 23 L46 25 Q26 20 6 25 Z', stoneLedge, 1);
    var roof = rpath('M6 22 Q26 15 46 22 L41 14 Q26 9 11 14 Z', stone, 3)
             + rpath('M13 14 Q26 11 39 14 L36 10 Q26 7 16 10 Z', stoneSoft, 2);
    var finial = rect(25, 4, 2, 7, 1, stoneLedge)
               + circ(26, 9, 4.5, stoneSoft)
               + (lit ? (circ(26, 4, 4.5, hue('sun'), { 'class': 'g-twinkle' }) + rpath(star(26, 4, 6, 2.8), '#FFFDF0', 1.5)) : '');
    return halo + base1 + base2 + pillar + tray + chamber + fire + roof + roofLedge + finial;
  };

  /* 巨大南瓜怪 giantPumpkin（320×280）：比畫面還大、跳躍砸地的萬聖調皮Boss */
  P.giantPumpkin = function (s) {
    var pDeep = hue('peach', 'deep'), pLedge = '#D95B11', pBase = '#FF822E', pLight = '#FFA35C';
    var leafDeep = hue('leaf', 'deep'), leaf = hue('leaf');
    var sun = hue('sun'), sunSoft = hue('sun', 'soft');

    // 碎裂狀態 (shatter)：細緻密集散開的許多小碎片
    if (s === 'shatter') {
      var shards = '';
      // 密集散開的橘色南瓜小表皮碎塊（24+ 枚）
      var pe = [
        [40, 60, 16, 12, -25], [75, 45, 14, 10, 15], [115, 55, 18, 14, -40], [145, 35, 15, 10, 30],
        [185, 40, 17, 12, -15], [225, 55, 16, 11, 45], [260, 70, 14, 10, -30], [285, 95, 15, 12, 20],
        [30, 110, 18, 14, 35], [55, 135, 16, 12, -20], [80, 160, 20, 15, 40], [45, 200, 18, 13, -35],
        [85, 225, 16, 12, 15], [120, 245, 17, 13, -25], [160, 255, 19, 14, 10], [205, 245, 17, 12, -45],
        [245, 230, 18, 14, 25], [275, 195, 16, 12, -15], [265, 145, 19, 13, 30], [290, 130, 15, 11, -40],
        [110, 110, 14, 10, 12], [145, 130, 15, 11, -18], [175, 115, 16, 12, 22], [210, 125, 14, 10, -12]
      ];
      for (var i = 0; i < pe.length; i++) {
        var p = pe[i];
        var col = (i % 3 === 0) ? pBase : (i % 3 === 1) ? pLedge : pLight;
        shards += ell(p[0], p[1], p[2], p[3], col, { transform: 'rotate(' + p[4] + ' ' + p[0] + ' ' + p[1] + ')' });
      }
      // 綠色南瓜蒂頭碎屑
      shards += rpath('M150 20 L165 15 L160 30 Z', leafDeep, 2)
              + rpath('M170 25 L180 20 L175 35 Z', leaf, 2)
              + rpath('M140 35 L150 30 L146 42 Z', leafDeep, 2);
      // 金色星星與南瓜籽
      shards += rpath(star(90, 90, 14, 6), sun, 2)
              + rpath(star(230, 95, 15, 6), sun, 2)
              + rpath(star(160, 75, 18, 8), '#FFFDF0', 2)
              + rpath(star(160, 180, 16, 7), sun, 2)
              + rpath(star(125, 205, 12, 5), sun, 2)
              + rpath(star(195, 200, 13, 5.5), sun, 2);
      var seeds = [[70, 85], [105, 75], [140, 95], [180, 90], [215, 80], [245, 110], [95, 135], [130, 160], [190, 155], [225, 165], [105, 185], [150, 215], [175, 220], [215, 210]];
      for (var s = 0; s < seeds.length; s++) {
        shards += ell(seeds[s][0], seeds[s][1], 5, 3, sunSoft, { transform: 'rotate(' + (s * 37) + ' ' + seeds[s][0] + ' ' + seeds[s][1] + ')' });
      }
      return shards;
    }

    var isSquat = s === 'squat';
    var isSlam = s === 'slam';

    // 蒂頭 (stem) — 接近梯形的蒂頭，深綠色，無深色線框
    var stem = el('path', {
      d: 'M144 44 L152 14 Q153 10 157 10 L163 10 Q167 10 168 14 L176 44 Z',
      fill: leafDeep, stroke: leafDeep, 'stroke-width': 2.5, 'stroke-linejoin': 'round'
    });

    // 南瓜身軀五大弧形瓣 — 純扁平色塊層次，無外框線條
    var outerL = ell(64, 158, 48, 92, pLedge);
    var outerR = ell(256, 158, 48, 92, pLedge);
    var midL = ell(110, 153, 56, 100, '#EA6C1E');
    var midR = ell(210, 153, 56, 100, '#EA6C1E');
    var centerLobe = ell(160, 148, 66, 106, pBase)
                   + ell(160, 144, 48, 88, pLight, { opacity: .35 });

    // 發光大眼睛（外黃內白，漸層到透明光暈，無線框）
    var egId = 'eglow' + H.nextId();
    var egDefs = '<defs><radialGradient id="' + egId + '" cx="50%" cy="50%" r="50%">'
               + '<stop offset="0%" stop-color="' + (isSquat ? '#FF5533' : '#FFFDF0') + '" stop-opacity=".85"/>'
               + '<stop offset="30%" stop-color="' + sun + '" stop-opacity=".65"/>'
               + '<stop offset="65%" stop-color="' + sunSoft + '" stop-opacity=".3"/>'
               + '<stop offset="100%" stop-color="' + sunSoft + '" stop-opacity="0"/>'
               + '</radialGradient></defs>';
    var eyeGlow = egDefs
                + circ(116, 126, 30, 'url(#' + egId + ')', { 'class': 'g-glow' })
                + circ(204, 126, 30, 'url(#' + egId + ')', { 'class': 'g-glow' });
    var eyeOuterCol = isSquat ? '#FF5533' : sun;
    var eyeL = rpath('M96 138 L138 114 L126 148 Z', eyeOuterCol, 3);
    var eyeR = rpath('M224 138 L182 114 L194 148 Z', eyeOuterCol, 3);
    var eyeInner = rpath('M102 136 L134 118 L124 144 Z', '#FFFDF0', 1.5)
                 + rpath('M218 136 L186 118 L196 144 Z', '#FFFDF0', 1.5);

    // 發光鼻子（倒三角形）
    var nose = rpath('M153 146 L167 146 L160 134 Z', sun, 3)
             + rpath('M155 144 L165 144 L160 136 Z', '#FFFDF0', 1.5);

    // 鋸齒發光大嘴（典型南瓜嘴：外黃內白，無深色線框）
    var mouthGlow = el('path', {
      d: 'M76 166 Q160 236 244 166 Q232 186 216 180 L204 198 L188 184 L172 202 L150 184 L134 198 L118 180 Q96 186 76 166 Z',
      fill: sunSoft, opacity: .45, 'class': 'g-glow'
    });
    var mouth = el('path', {
      d: 'M80 168 Q160 232 240 168 Q228 184 214 178 L202 194 L186 182 L170 198 L150 182 L134 194 L120 178 Q98 184 80 168 Z',
      fill: sun, stroke: sun, 'stroke-width': 2, 'stroke-linejoin': 'round'
    }) + el('path', {
      d: 'M88 172 Q160 228 232 172 Q222 183 211 179 L200 192 L186 183 L170 196 L150 183 L134 192 L122 179 Q102 183 88 172 Z',
      fill: '#FFFDF0', stroke: '#FFFDF0', 'stroke-width': 1.5, 'stroke-linejoin': 'round'
    });

    // 砸地時的地面衝擊波與煙圈
    var slamFx = '';
    if (isSlam) {
      slamFx = ell(70, 264, 34, 10, '#352D4B', { opacity: .8 })
             + ell(250, 264, 34, 10, '#352D4B', { opacity: .8 })
             + circ(40, 256, 12, hue('stone'), { opacity: .6 })
             + circ(70, 252, 16, hue('stone', 'soft'), { opacity: .7 })
             + circ(250, 252, 16, hue('stone', 'soft'), { opacity: .7 })
             + circ(280, 256, 12, hue('stone'), { opacity: .6 });
    }

    return stem + outerL + outerR + midL + midR + centerLobe + eyeGlow + eyeL + eyeR + eyeInner + nose + mouthGlow + mouth + slamFx;
  };

  /* 萬聖勝利寶箱 victoryChest（64×52）：擊敗大南瓜後自天空降落的金色獎勵寶箱 */
  P.victoryChest = function (s) {
    var open = s === 'open';
    var gold = hue('sun'), goldLedge = hue('sun', 'ledge'), goldSoft = hue('sun', 'soft');
    var purple = hue('lilac', 'deep'), purpLedge = hue('lilac');

    // 寶箱底座本體
    var body = rect(8, 24, 48, 24, 6, purple)
             + rect(12, 26, 40, 20, 4, purpLedge)
             + rect(8, 24, 48, 4, 2, goldLedge);
    // 金色束帶與邊角
    var straps = rect(18, 24, 6, 24, 1, gold)
               + rect(40, 24, 6, 24, 1, gold)
               + circ(21, 36, 1.8, goldLedge) + circ(43, 36, 1.8, goldLedge);

    if (open) {
      // 寶箱開啟：金光沖天、符咒與金星閃爍
      var rays = circ(32, 16, 24, goldSoft, { opacity: .8, 'class': 'g-glow' })
               + rpath(star(32, 12, 10, 4), gold, 1.5)
               + circ(18, 8, 3, gold) + circ(46, 8, 3.5, gold);
      // 浮動在寶箱中央的變身符咒（黃紙朱砂紅色奇異符文造型）
      var prize = rpath('M26 8 L38 8 L38 28 L32 26 L26 28 Z', '#FFDF6D', 1.5)
                + circ(32, 12, 2.2, '#D82B2B')
                + line(32, 14, 32, 24, '#D82B2B', 1.4)
                + line(28, 16, 36, 16, '#D82B2B', 1.2)
                + line(29, 20, 35, 20, '#D82B2B', 1.2);
      // 掀開的頂蓋
      var lidBack = rpath('M6 24 L10 6 L54 6 L58 24 Z', purple, 3)
                  + rect(12, 8, 40, 5, 2, gold);
      return lidBack + body + straps + rays + prize;
    }

    // 寶箱閉合：圓弧寶箱蓋與金色大鎖
    var lid = rpath('M6 24 C6 10 58 10 58 24 Z', purple, 4)
            + rpath('M10 22 C10 12 54 12 54 22 Z', purpLedge, 3)
            + rect(18, 11, 6, 14, 1, gold)
            + rect(40, 11, 6, 14, 1, gold)
            + rect(28, 22, 8, 10, 2, gold)
            + circ(32, 26, 2, purple);
    return body + straps + lid;
  };

  /* 變身符咒 zombieTalisman（48×72）：黃紙朱砂紅色奇異符文造型 */
  P.zombieTalisman = function () {
    var paper = '#FFDF6D', paperLedge = '#E0B843', paperLight = '#FFF2A8';
    var cinnabar = '#D82B2B';
    // 黃紙本體（帶有道符底部凹形紙角）
    var sheet = rpath('M6 4 L42 4 Q44 4 44 7 L44 64 L24 60 L4 64 L4 7 Q4 4 6 4 Z', paperLedge, 2)
              + rpath('M7 5 L41 5 Q43 5 43 7 L43 62 L24 58 L5 62 L5 7 Q5 5 7 5 Z', paper, 2)
              + rect(8, 7, 32, 4, 1.5, paperLight, { opacity: .7 });
    // 頂部硃砂印首
    var seal = circ(24, 13, 4, cinnabar) + circ(24, 13, 2, '#FFF0F0');
    // 兩側護法符文線
    var sideRunes = line(10, 20, 10, 48, cinnabar, 1.5)
                  + line(38, 20, 38, 48, cinnabar, 1.5)
                  + circ(10, 24, 1.2, cinnabar) + circ(38, 24, 1.2, cinnabar)
                  + circ(10, 44, 1.2, cinnabar) + circ(38, 44, 1.2, cinnabar);
    // 中央神祕奇異紅符文（敕令頭、蛇行折線符膽、星紋封印）
    var rune = el('path', {
      d: 'M18 19 Q24 16 30 19 M24 18 L24 23 M17 23 L31 23 M20 26 L28 26 L19 32 L29 32 L19 38 L24 38 L29 42 L19 46 L29 46 L24 51 L24 55',
      fill: 'none', stroke: cinnabar, 'stroke-width': 2.2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round'
    }) + circ(24, 35, 2.2, cinnabar) + rpath(star(24, 51, 3.5, 1.8), cinnabar, 1);
    // 符紙四周微微散發的金色聖光
    var aura = circ(24, 36, 30, hue('sun', 'soft'), { opacity: .45, 'class': 'g-glow' });
    return aura + sheet + seal + sideRunes + rune;
  };

  /* 萬聖傳送門 halloweenPortal（96×136）：夜光墓園地底冒出的巨大拱門，門內旋轉翠綠漩渦光芒 */
  P.halloweenPortal = function (s) {
    var isErupt = s === 'erupt';
    var stone = hue('stone'), stoneLedge = hue('stone', 'ledge'), stoneSoft = hue('stone', 'soft'), stoneDeep = hue('stone', 'deep');
    var mint = hue('mint'), mintSoft = hue('mint', 'soft'), mintDeep = hue('mint', 'deep');
    var leaf = hue('leaf');

    // 1. 外圍翠綠靈光暈
    var gid = 'hpg' + H.nextId();
    var glowDefs = '<defs><radialGradient id="' + gid + '" cx="50%" cy="58%" r="50%">'
                 + '<stop offset="0%" stop-color="#E0FFF4" stop-opacity=".95"/>'
                 + '<stop offset="25%" stop-color="' + mint + '" stop-opacity=".85"/>'
                 + '<stop offset="55%" stop-color="' + leaf + '" stop-opacity=".65"/>'
                 + '<stop offset="82%" stop-color="' + mintDeep + '" stop-opacity=".35"/>'
                 + '<stop offset="100%" stop-color="' + mintDeep + '" stop-opacity="0"/>'
                 + '</radialGradient></defs>';
    var outerGlow = ell(48, 76, 44, 54, mintSoft, { opacity: .35, 'class': 'g-glow' });

    // 2. 傳送門深邃黑洞與翠綠旋渦（純淨發光核心，不帶多餘雜亂線條）
    var portalBg = el('path', {
      d: 'M22 44 Q48 20 74 44 L74 126 L22 126 Z',
      fill: '#150F26'
    });
    var vortexCore = glowDefs + ell(48, 80, 26, 44, 'url(#' + gid + ')', { 'class': 'g-glow' });

    // 浮動旋轉的綠星與光芒粒子
    var sparkles = rpath(star(48, 62, 5.5, 2.5, 4), '#FFFFFF', 1)
                 + circ(38, 94, 2.8, mint, { 'class': 'g-glow' })
                 + circ(58, 72, 2.4, '#FFFFFF')
                 + circ(42, 102, 2, mintSoft)
                 + circ(55, 96, 2.5, mint, { 'class': 'g-glow' });

    // 3. 古老石雕拱門主體（柱基、雙立柱、尖頂拱圈、拱頂寶石）
    var baseSoil = ell(48, 132, 44, 8, '#241D33')
                 + ell(48, 128, 38, 7, stoneDeep);
    var plinths = rect(8, 120, 24, 12, 4, stoneLedge)
                + rect(64, 120, 24, 12, 4, stoneLedge)
                + rect(10, 116, 20, 6, 2.5, stone)
                + rect(66, 116, 20, 6, 2.5, stone);

    var pillars = rect(12, 40, 16, 78, 4, stoneLedge)
                + rect(14, 42, 12, 74, 3, stone)
                + rect(68, 40, 16, 78, 4, stoneLedge)
                + rect(70, 42, 12, 74, 3, stone);

    // 立柱雕刻發光符文
    var pillarRunes = line(20, 56, 20, 78, mint, 2)
                    + circ(20, 88, 2.5, mint)
                    + line(76, 56, 76, 78, mint, 2)
                    + circ(76, 88, 2.5, mint);

    // 頂部圓弧石拱門與拱心石
    var archOuter = el('path', {
      d: 'M10 44 Q10 12 48 8 Q86 12 86 44 L72 46 Q72 24 48 20 Q24 24 24 46 Z',
      fill: stoneLedge, stroke: stoneLedge, 'stroke-width': 2, 'stroke-linejoin': 'round'
    });
    var archInner = el('path', {
      d: 'M14 44 Q14 16 48 12 Q82 16 82 44 L76 46 Q76 26 48 22 Q20 26 20 46 Z',
      fill: stone, stroke: stone, 'stroke-width': 1.5, 'stroke-linejoin': 'round'
    });
    var keystone = rpath('M41 4 L55 4 L53 24 L43 24 Z', stoneSoft, 2)
                 + circ(48, 14, 4, mint, { 'class': 'g-glow' })
                 + circ(48, 14, 2, '#FFFFFF');

    // 4. 破土而出動態額外特效（碎石與煙塵）
    var eruptFx = '';
    if (isErupt) {
      eruptFx = ell(48, 126, 42, 14, '#382F4E', { opacity: .9 })
              + circ(22, 118, 9, stoneSoft, { opacity: .85 })
              + circ(74, 120, 10, stoneSoft, { opacity: .85 })
              + circ(14, 126, 6, stoneLedge)
              + circ(82, 124, 7, stoneLedge)
              + rpath('M28 112 L35 106 L33 115 Z', stone, 2)
              + rpath('M63 110 L70 104 L67 113 Z', stone, 2);
    }

    return outerGlow + portalBg + vortexCore + sparkles + baseSoil + plinths + pillars + pillarRunes + archOuter + archInner + keystone + eruptFx;
  };

  /* ---------- 商店（角色小鎮店內，v2.16.0） ---------- */
  var stroke = function (d, c, w) { return el('path', { d: d, fill: 'none', stroke: c, 'stroke-width': w || 4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }); };
  /* 櫃檯：state＝店的色相（前板顏色） */
  P.shopCounter = function (s) {
    var h = s || 'rose';
    return rect(6, 14, 228, 84, 12, hue(h)) + rect(20, 32, 92, 54, 10, hue(h, 'soft')) + rect(128, 32, 92, 54, 10, hue(h, 'soft'))
      + rect(6, 14, 228, 8, 4, hue(h, 'ledge')) + rect(0, 2, 240, 18, 9, hue('wood'));
  };
  P.cashRegister = function () {
    return rect(56, 22, 6, 14, 3, hue('stone', 'deep')) + rect(44, 4, 26, 20, 6, hue('stone', 'deep')) + rect(48, 8, 18, 12, 4, hue('mint', 'soft'))
      + rpath('M6 34 L14 26 H58 L66 34 V52 H6 Z', hue('stone'), 8) + rect(10, 44, 52, 14, 5, hue('stone', 'ledge')) + circ(36, 51, 3, hue('sun'))
      + circ(18, 33, 3, hue('sky')) + circ(27, 33, 3, hue('sun')) + circ(36, 33, 3, hue('rose')) + circ(45, 33, 3, hue('mint'));
  };
  P.shoppingBag = function (s) {
    var h = s || 'peach';
    return stroke('M15 18 Q15 5 22 5 Q29 5 29 18', hue(h, 'deep'), 4) + rpath('M8 18 H36 L38 48 H6 Z', hue(h), 6) + circ(22, 33, 6, hue(h, 'soft'));
  };
  P.pottedPlant = function () {
    return ell(25, 30, 8, 22, hue('leaf')) + ell(14, 38, 7, 17, hue('leaf', 'ledge'), { transform: 'rotate(-32 14 38)' }) + ell(36, 38, 7, 17, hue('leaf', 'ledge'), { transform: 'rotate(32 36 38)' })
      + rect(12, 54, 26, 24, 8, hue('peach', 'deep')) + rect(8, 50, 34, 10, 5, hue('peach'));
  };
  /* 窗戶：state＝窗簾色相 */
  P.shopWindow = function (s) {
    var h = s || 'rose', f = N['surface-raised'];
    return rect(0, 0, 120, 100, 16, hue('wood', 'soft')) + rect(8, 8, 104, 84, 10, hue('sky', 'soft'))
      + circ(70, 34, 10, f) + circ(84, 30, 13, f) + circ(96, 36, 9, f) + rect(64, 34, 40, 10, 5, f)
      + rect(57, 8, 6, 84, 3, hue('wood', 'soft')) + rect(8, 47, 104, 6, 3, hue('wood', 'soft'))
      + rpath('M8 8 H32 Q24 50 32 92 H8 Z', hue(h, 'soft'), 6) + rpath('M112 8 H88 Q96 50 88 92 H112 Z', hue(h, 'soft'), 6) + rect(2, 2, 116, 10, 5, hue('wood'));
  };
  P.salonMirror = function () {
    return ell(45, 50, 35, 46, hue('rose')) + ell(45, 50, 27, 38, hue('sky', 'soft'))
      + rect(12, 116, 8, 24, 4, hue('wood', 'ledge')) + rect(70, 116, 8, 24, 4, hue('wood', 'ledge')) + rect(4, 104, 82, 14, 7, hue('wood'))
      + rect(14, 86, 11, 18, 4, hue('mint')) + rect(16, 82, 7, 6, 3, hue('mint', 'deep')) + rect(30, 92, 9, 12, 3, hue('lilac')) + rect(52, 96, 24, 7, 3.5, hue('stone'));
  };
  /* 衣架：一排衣服 */
  P.clothesRack = function () {
    var r = rect(10, 10, 8, 110, 4, hue('stone', 'deep')) + rect(162, 10, 8, 110, 4, hue('stone', 'deep')) + rect(2, 116, 26, 8, 4, hue('stone', 'deep')) + rect(152, 116, 26, 8, 4, hue('stone', 'deep'));
    var hs = ['sky', 'rose', 'sun', 'mint', 'lilac'];
    for (var i = 0; i < 5; i++) {
      var x = 34 + i * 28, h = hs[i], long = i % 2 === 1;
      r += stroke('M' + (x - 9) + ' 22 L' + x + ' 16 L' + (x + 9) + ' 22', hue('stone', 'deep'), 3);
      r += rpath('M' + (x - 11) + ' 23 L' + (x - 4) + ' 20 Q' + x + ' 24 ' + (x + 4) + ' 20 L' + (x + 11) + ' 23 L' + (x + 14) + ' 34 L' + (x + 8) + ' 36 L' + (x + (long ? 12 : 8)) + ' ' + (long ? 80 : 62) + ' L' + (x - (long ? 12 : 8)) + ' ' + (long ? 80 : 62) + ' L' + (x - 8) + ' 36 L' + (x - 14) + ' 34 Z', hue(h), 4);
    }
    return r + rect(6, 8, 168, 8, 4, hue('stone'));
  };
  var shelf = function () { return rect(0, 0, 160, 132, 14, hue('wood', 'soft')) + rect(6, 44, 148, 8, 4, hue('wood')) + rect(6, 88, 148, 8, 4, hue('wood')) + rect(6, 124, 148, 8, 4, hue('wood')); };
  /* 配件架：帽子、眼鏡、耳機、背包 */
  P.accShelf = function () {
    var r = shelf();
    r += ell(32, 40, 16, 13, hue('sky')) + rect(30, 38, 26, 6, 3, hue('sky', 'deep'));   /* 帽子 */
    r += rpath('M66 42 L80 10 L94 42 Z', hue('lilac'), 6) + rect(60, 38, 40, 6, 3, hue('lilac', 'deep'));   /* 巫師帽 */
    r += ell(128, 36, 18, 10, hue('leaf')) + ell(128, 33, 15, 6, hue('rose', 'soft'));   /* 西瓜帽 */
    r += circ(30, 74, 9, hue('sky', 'soft')) + circ(52, 74, 9, hue('sky', 'soft')) + stroke('M21 74 A9 9 0 0 1 39 74 M43 74 A9 9 0 0 1 61 74 M39 72 Q41 69 43 72', hue('stone', 'deep'), 3.5);   /* 眼鏡 */
    r += stroke('M98 82 Q98 60 116 60 Q134 60 134 82', hue('rose', 'deep'), 5) + rect(92, 72, 12, 16, 5, hue('rose')) + rect(128, 72, 12, 16, 5, hue('rose'));   /* 耳機 */
    r += rect(24, 98, 38, 26, 10, hue('sun')) + rect(30, 108, 26, 12, 5, hue('sun', 'deep')) + stroke('M34 99 Q43 90 52 99', hue('sun', 'deep'), 3.5);   /* 背包 */
    r += rpath('M86 120 Q96 98 112 104 Q100 112 104 120 Z', hue('mint'), 4) + rpath('M138 120 Q128 98 112 104 Q124 112 120 120 Z', hue('mint', 'ledge'), 4);   /* 翅膀 */
    return r;
  };
  /* 玩具架：球、積木、風車、棒棒糖、魔法棒 */
  P.toyShelf = function () {
    var r = shelf();
    r += circ(30, 30, 14, hue('rose')) + rect(16, 27, 28, 6, 3, hue('sun'));   /* 球 */
    r += rect(60, 26, 18, 18, 4, hue('sky')) + rect(80, 26, 18, 18, 4, hue('mint')) + rect(70, 8, 18, 18, 4, hue('sun'));   /* 積木 */
    r += rect(124, 24, 4, 20, 2, hue('wood', 'deep')) + rpath('M126 22 L126 8 L136 18 Z', hue('sky'), 3) + rpath('M126 22 L140 22 L130 32 Z', hue('rose'), 3) + rpath('M126 22 L126 36 L116 26 Z', hue('sun'), 3) + rpath('M126 22 L112 22 L122 12 Z', hue('mint'), 3);   /* 風車 */
    r += rect(31, 66, 4, 22, 2, hue('stone', 'soft')) + circ(33, 64, 11, hue('lilac')) + circ(33, 64, 5, hue('rose', 'soft'));   /* 棒棒糖 */
    r += rect(70, 62, 4, 26, 2, hue('wood', 'deep')) + rpath(star(72, 60, 10, 5), hue('sun'), 3);   /* 魔法棒 */
    r += rpath('M106 86 L106 66 Q114 54 122 66 L122 86 Z', hue('stone', 'soft'), 4) + rpath('M100 88 L106 74 L106 88 Z', hue('rose'), 3) + rpath('M128 88 L122 74 L122 88 Z', hue('rose'), 3) + circ(114, 70, 3, hue('sky'));   /* 小火箭 */
    r += rect(24, 104, 30, 20, 6, hue('peach')) + circ(30, 124, 6, hue('stone', 'deep')) + circ(48, 124, 6, hue('stone', 'deep')) + rect(30, 98, 16, 10, 4, hue('peach', 'deep'));   /* 小汽車 */
    r += circ(110, 112, 12, hue('wood')) + circ(101, 101, 5, hue('wood')) + circ(119, 101, 5, hue('wood')) + circ(110, 110, 3, hue('wood', 'ledge'));   /* 小熊玩偶 */
    return r;
  };

  /* ---------- 角色小鎮建築（v2.18.0）：state day／night（夜晚窗戶亮燈）；尺寸 180×230，門在正中下方（角色走到門口時對齊） ---------- */
  var win = function (st) { return st === 'night' ? hue('sun', 'soft') : hue('sky', 'soft'); };
  /* 共用：牆、地基、拱門、兩扇窗（招牌由 App 用文字疊在牆上方 34%） */
  var shopBody = function (st, h, o) {
    o = o || {};
    var r = rect(14, 70, 152, 158, 12, hue(h, 'soft')) + rect(10, 214, 160, 16, 8, hue(h, 'ledge'));
    r += rpath('M71 226 V184 Q71 162 90 162 Q109 162 109 184 V226 Z', hue(o.door || 'wood', 'deep'), 4) + circ(102, 198, 3, hue('sun'));
    if (!o.noWin) r += rect(26, 124, 34, 34, 9, win(st)) + rect(120, 124, 34, 34, 9, win(st)) + rect(41, 124, 4, 34, 2, hue(h, 'ledge')) + rect(135, 124, 4, 34, 2, hue(h, 'ledge'));
    return r;
  };
  var awning = function (y, h1, h2) {   /* 條紋遮陽棚：h1／h2 是顏色 */
    var r = '', i; for (i = 0; i < 8; i++) r += rect(14 + i * 19, y, 19, 18, 0, i % 2 ? h2 : h1);
    for (i = 0; i < 8; i++) r += circ(23.5 + i * 19, y + 18, 9.5, i % 2 ? h2 : h1);
    return r;
  };
  P.townStage = function (st) {
    var lit = st === 'night';
    return rect(20, 60, 180, 120, 14, hue('sun', 'soft')) + (lit ? ell(110, 170, 70, 14, hue('sun'), { opacity: .5 }) : '')
      + rpath('M20 56 Q24 120 20 182 L52 182 Q44 120 56 56 Z', hue('rose'), 8) + rpath('M200 56 Q196 120 200 182 L168 182 Q176 120 164 56 Z', hue('rose'), 8)
      + rect(12, 40, 196, 22, 11, hue('rose', 'deep')) + circ(40, 62, 8, hue('rose', 'deep')) + circ(80, 62, 8, hue('rose', 'deep')) + circ(120, 62, 8, hue('rose', 'deep')) + circ(160, 62, 8, hue('rose', 'deep'))
      + rpath(star(110, 22, 16, 8), hue('sun'), 4) + rect(4, 178, 212, 22, 10, hue('wood')) + rect(70, 198, 80, 12, 5, hue('wood', 'ledge')) + rect(84, 208, 52, 10, 5, hue('wood', 'ledge'));
  };
  /* 城門：forest（木頭＋樹葉）、lake（藍色＋波浪）、graveyard（鐵門＋南瓜燈）；200×230 */
  P.townGate = function (st) {
    if (st === 'portal') {   /* 回小鎮的發光傳送門（宇宙空間的出口） */
      var pd = function (x0, x1, top) { var rr = (x1 - x0) / 2; return 'M' + x0 + ' 228 V' + (top + rr) + ' A' + rr + ' ' + rr + ' 0 0 1 ' + x1 + ' ' + (top + rr) + ' V228 Z'; };
      return rpath(pd(30, 170, 30), hue('mint', 'soft'), 12).replace('<path', '<path opacity=".5"') + rpath(pd(42, 158, 44), hue('lilac', 'deep'), 6) + rpath(pd(56, 144, 58), hue('lilac'), 6) + rpath(pd(70, 130, 74), hue('mint'), 6) + rpath(pd(84, 116, 92), hue('mint', 'soft'), 4)
        + rect(20, 220, 160, 10, 5, hue('stone', 'ledge'));
    }
    if (st === 'lake') {
      var waves = ''; for (var i = 0; i < 5; i++) waves += el('path', { d: 'M' + (34 + i * 28) + ' 46 q7 -7 14 0 q7 7 14 0', fill: 'none', stroke: N['surface-raised'], 'stroke-width': 3.4, 'stroke-linecap': 'round' });
      return rect(18, 40, 22, 190, 10, hue('sky', 'deep')) + rect(160, 40, 22, 190, 10, hue('sky', 'deep')) + rect(8, 26, 184, 36, 18, hue('sky')) + waves
;
    }
    if (st === 'graveyard') {
      var bars = ''; for (var j = 0; j < 6; j++) bars += rect(52 + j * 18, 66, 6, 160, 3, hue('lilac', 'deep')) + rpath('M' + (51 + j * 18) + ' 66 L' + (55 + j * 18) + ' 56 L' + (59 + j * 18) + ' 66 Z', hue('lilac', 'deep'), 2);
      var jack = function (x) { return ell(x, 34, 16, 13, hue('peach', 'deep')) + rect(x - 2, 18, 4, 7, 2, hue('leaf', 'deep')) + rpath('M' + (x - 8) + ' 31 L' + (x - 4) + ' 27 L' + x + ' 31 Z', hue('sun'), 1) + rpath('M' + x + ' 31 L' + (x + 4) + ' 27 L' + (x + 8) + ' 31 Z', hue('sun'), 1) + rect(x - 7, 38, 14, 4, 2, hue('sun')); };
      return bars + rect(18, 50, 26, 180, 8, hue('stone', 'deep')) + rect(156, 50, 26, 180, 8, hue('stone', 'deep')) + rect(12, 44, 38, 12, 6, hue('stone')) + rect(150, 44, 38, 12, 6, hue('stone'))
        + el('path', { d: 'M44 74 Q100 30 156 74', fill: 'none', stroke: hue('lilac', 'deep'), 'stroke-width': 7, 'stroke-linecap': 'round' }) + jack(31) + jack(169);
    }
    /* 森林：木造拱門（中間是空的，看得到後面的樹林 townForestBack）；柱子、弧形橫樑、橫木、木釘、藤蔓小葉 */
    var arch = el('path', { d: 'M18 74 Q100 4 182 74', fill: 'none', stroke: hue('bark'), 'stroke-width': 22, 'stroke-linecap': 'round' })
      + el('path', { d: 'M24 70 Q100 12 176 70', fill: 'none', stroke: hue('bark', 'ledge'), 'stroke-width': 5, 'stroke-linecap': 'round', opacity: .6 });
    var vine = ''; [[34, 56], [56, 40], [82, 30], [118, 30], [144, 40], [166, 56]].forEach(function (v, k) { vine += ell(v[0], v[1] + 8, 7, 4.5, hue('leaf', k % 2 ? 'ledge' : 'base'), { transform: 'rotate(' + (k % 2 ? 30 : -30) + ' ' + v[0] + ' ' + (v[1] + 8) + ')' }); });
    return rect(16, 56, 26, 174, 10, hue('bark')) + rect(158, 56, 26, 174, 10, hue('bark')) + rect(24, 80, 5, 140, 2.5, hue('bark', 'ledge'), { opacity: .7 }) + rect(166, 80, 5, 140, 2.5, hue('bark', 'ledge'), { opacity: .7 })
      + rect(10, 88, 180, 14, 7, hue('bark', 'ledge')) + circ(29, 95, 3, hue('wood', 'soft')) + circ(171, 95, 3, hue('wood', 'soft'))
      + arch + vine + rect(10, 220, 40, 10, 5, hue('bark', 'ledge')) + rect(150, 220, 40, 10, 5, hue('bark', 'ledge'));
  };
  /* 路燈：40×160；夜晚燈亮 */
  P.streetLamp = function (st) {
    var on = st === 'night';
    return (on ? circ(20, 22, 22, hue('sun', 'soft'), { opacity: .55 }) : '') + rect(17, 30, 6, 124, 3, hue('stone', 'deep')) + rect(8, 150, 24, 10, 5, hue('stone', 'deep'))
      + rpath('M8 30 L32 30 L28 12 L12 12 Z', on ? hue('sun') : hue('sky', 'soft'), 4) + rect(6, 6, 28, 8, 4, hue('stone', 'deep'));
  };

  /* ---------- 小鎮入口後方的背景（v2.19.0）：放在城門後面、比城門寬，從拱門看得到 ---------- */
  /* 森林：深色樹林（後排 deep、前排 ledge），兩側樹叢；460×260 */
  P.townForestBack = function () {
    var r = '', i, x;
    for (i = 0; i < 10; i++) { x = 18 + i * 47; r += rect(x - 6, 120, 12, 140, 6, hue('bark', 'deep')) + circ(x, 92, 40, hue('leaf', 'deep')) + circ(x - 24, 128, 28, hue('leaf', 'deep')) + circ(x + 24, 128, 28, hue('leaf', 'deep')); }
    for (i = 0; i < 9; i++) { x = 40 + i * 47; r += rect(x - 5, 200, 10, 50, 5, hue('bark', 'deep')) + rpath('M' + (x - 30) + ' 214 L' + x + ' 150 L' + (x + 30) + ' 214 Z', hue('leaf', 'ledge'), 10) + rpath('M' + (x - 22) + ' 176 L' + x + ' 124 L' + (x + 22) + ' 176 Z', hue('leaf', 'ledge'), 10); }
    r += rect(0, 232, 460, 28, 12, hue('leaf', 'ledge'));
    [[20, 230, 34], [62, 238, 28], [100, 244, 22], [360, 244, 22], [398, 238, 28], [440, 230, 34]].forEach(function (b, k) { r += circ(b[0], b[1], b[2], hue('leaf', k % 2 ? 'base' : 'ledge')); });
    return r;
  };
  /* 湖：大片湖面＋沙岸、蘆葦、荷葉、小船；480×150 */
  P.townLakeBack = function () {
    var r = ell(240, 100, 238, 50, hue('wood', 'soft')) + ell(240, 96, 222, 42, hue('sky')) + ell(240, 98, 170, 26, hue('sky', 'soft'), { opacity: .55 });
    [[120, 92], [210, 108], [300, 86], [370, 104]].forEach(function (w) { r += el('path', { d: 'M' + (w[0] - 16) + ' ' + w[1] + ' q8 -6 16 0 q8 6 16 0', fill: 'none', stroke: N['surface-raised'], 'stroke-width': 3, 'stroke-linecap': 'round' }); });
    [[90, 112], [104, 118], [392, 116]].forEach(function (l) { r += ell(l[0], l[1], 11, 5, hue('leaf')); });
    r += circ(104, 113, 3.4, hue('rose'));
    r += rpath('M300 104 L356 104 L348 118 L308 118 Z', hue('wood'), 6) + rect(326, 74, 4, 32, 2, hue('wood', 'deep')) + rpath('M330 76 L350 100 L330 100 Z', N['surface-raised'], 3);
    var reed = function (x, hgt, k) { return rect(x - 2, 128 - hgt, 4, hgt, 2, hue('leaf', 'ledge')) + ell(x, 128 - hgt, 4, 10, hue('wood', 'deep')) + ell(x + 8 * k, 132 - hgt * .6, 10, 4, hue('leaf'), { transform: 'rotate(' + (k * 30) + ' ' + (x + 8 * k) + ' ' + (132 - hgt * .6) + ')' }); };
    [[14, 70, 1], [28, 54, -1], [40, 62, 1], [440, 62, -1], [452, 74, 1], [466, 52, -1]].forEach(function (q) { r += reed(q[0], q[1], q[2]); });
    return r;
  };
  /* 夜光墓園：小山丘上很多墓碑、枯樹、南瓜；460×200 */
  P.townGraveBack = function () {
    var r = rpath('M0 200 Q40 150 120 150 Q180 126 240 128 Q320 126 360 150 Q430 150 460 200 Z', hue('lilac', 'soft'), 6);
    r += el('path', { d: 'M392 186 L392 96 M392 126 L366 100 M392 112 L420 86 M366 100 L354 104 M420 86 L430 74', fill: 'none', stroke: hue('bark', 'deep'), 'stroke-width': 7, 'stroke-linecap': 'round' });
    var stone = function (x, y, k, kind) {
      var g = '';
      if (kind === 'cross') g = rect(-5, -46, 10, 46, 4, hue('stone')) + rect(-17, -36, 34, 10, 4, hue('stone'));
      else if (kind === 'flat') g = rect(-16, -30, 32, 30, 6, hue('stone')) + rect(-10, -22, 20, 4, 2, hue('stone', 'ledge')) + rect(-10, -14, 14, 4, 2, hue('stone', 'ledge'));
      else g = rpath('M-15 0 L-15 -30 Q0 -48 15 -30 L15 0 Z', hue('stone'), 4) + rect(-8, -26, 16, 4, 2, hue('stone', 'ledge')) + rect(-8, -18, 12, 4, 2, hue('stone', 'ledge'));
      return el('g', { transform: 'translate(' + x + ' ' + y + ') scale(' + k + ')' }, rect(-18, -4, 36, 8, 4, hue('stone', 'ledge')) + g);
    };
    [[60, 168, .8, 'round'], [118, 160, .75, 'cross'], [176, 154, .8, 'flat'], [236, 150, .85, 'round'], [296, 154, .75, 'cross'], [352, 160, .8, 'round'],
     [30, 196, 1, 'flat'], [92, 192, 1.05, 'round'], [158, 190, 1, 'cross'], [306, 190, 1, 'round'], [372, 192, 1.05, 'flat'], [434, 196, 1, 'cross']].forEach(function (t) { r += stone(t[0], t[1], t[2], t[3]); });
    [[214, 190], [256, 194]].forEach(function (pk) { r += ell(pk[0], pk[1] - 8, 11, 9, hue('peach', 'deep')) + rect(pk[0] - 1.5, pk[1] - 21, 3, 6, 1.5, hue('leaf', 'deep')); });
    return r;
  };

  /* ---------- 小鎮建築 v2（v2.20.0）：誇張、一眼認得出來的造型；不畫招牌（名稱由角色靠近時的提示泡泡顯示）。
   * 門一律在正中下方；所有筆畫都在 viewBox 內（提示泡泡貼在建築上緣）。state day／night（夜晚窗戶亮燈） */
  var HC = C.hair;
  /* 拱門：門後是亮著的室內（sun soft），門片在 .g-door 群組裡（App 進門時加 is-open 讓門往左打開） */
  var archDoor = function (cx, bottom, w, h, col) {
    var x0 = cx - w / 2, x1 = cx + w / 2, top = bottom - h, d = 'M' + x0 + ' ' + bottom + ' V' + (top + w / 2) + ' Q' + x0 + ' ' + top + ' ' + cx + ' ' + top + ' Q' + x1 + ' ' + top + ' ' + x1 + ' ' + (top + w / 2) + ' V' + bottom + ' Z';
    return rpath(d, hue('sun', 'soft'), 4) + el('g', { 'class': 'g-door' }, rpath(d, col, 4) + circ(x1 - 7, bottom - h * .42, 3, hue('sun')));
  };
  /* 我的家：大屋頂小木屋＋冒煙的煙囪、愛心窗、花台、信箱；200×270 */
  P.townHome = function (st) {
    var w = win(st), f = N['surface-raised'];
    return circ(150, 22, 9, f, { opacity: .8 }) + circ(162, 12, 7, f, { opacity: .7 }) + circ(140, 34, 6, f, { opacity: .85 })
      + rect(134, 40, 24, 60, 6, hue('stone')) + rect(130, 36, 32, 12, 6, hue('stone', 'ledge'))
      + rect(30, 120, 140, 146, 14, hue('peach', 'soft')) + rect(24, 254, 152, 16, 8, hue('peach', 'ledge'))
      + rpath('M4 132 L100 50 L196 132 Z', hue('wood', 'ledge'), 14) + rpath('M30 124 L100 66 L170 124 Z', hue('wood'), 8)
      + el('path', { d: 'M100 112 C86 100 82 88 92 84 C97 82 100 86 100 89 C100 86 103 82 108 84 C118 88 114 100 100 112 Z', fill: w, stroke: w, 'stroke-width': 3, 'stroke-linejoin': 'round' })
      + rect(40, 160, 36, 36, 9, w) + rect(124, 160, 36, 36, 9, w) + rect(56, 160, 4, 36, 2, hue('peach', 'ledge')) + rect(140, 160, 4, 36, 2, hue('peach', 'ledge'))
      + rect(36, 196, 44, 10, 5, hue('wood')) + circ(46, 194, 5, hue('rose')) + circ(58, 192, 5, hue('sun')) + circ(70, 194, 5, hue('lilac'))
      + rect(120, 196, 44, 10, 5, hue('wood')) + circ(130, 194, 5, hue('sun')) + circ(142, 192, 5, hue('rose')) + circ(154, 194, 5, hue('mint'))
      + archDoor(100, 266, 38, 62, hue('wood', 'deep'))
      + rect(180, 222, 6, 46, 3, hue('wood', 'deep')) + rect(170, 206, 26, 20, 8, hue('sky')) + rect(192, 196, 4, 14, 2, hue('rose'));
  };
  /* 造型店：屋頂是一頂巨大的捲捲假髮（兩側垂下的捲髮、蝴蝶結），門邊理髮旋轉燈、掛著大剪刀，沒有窗戶；200×280 */
  P.townSalon = function (st) {
    var w = win(st), hc = HC.caramel, hl = HC.chestnut, r = '';
    r += rect(34, 140, 132, 136, 14, hue('rose', 'soft')) + rect(28, 264, 144, 16, 8, hue('rose', 'ledge'));
    [[26, 150, 22], [20, 180, 20], [24, 208, 18], [174, 150, 22], [180, 180, 20], [176, 208, 18]].forEach(function (c, k) { r += circ(c[0], c[1], c[2], k % 2 ? hl : hc); });
    [[34, 118, 30], [62, 82, 32], [100, 66, 36], [138, 82, 32], [166, 118, 30], [80, 112, 30], [120, 112, 30], [100, 100, 30], [50, 140, 22], [150, 140, 22]].forEach(function (c, k) { r += circ(c[0], c[1], c[2], k % 3 === 2 ? hl : hc); });
    [[70, 76], [100, 54], [130, 76], [100, 92]].forEach(function (c) { r += el('path', { d: 'M' + (c[0] - 10) + ' ' + c[1] + ' q10 -12 20 0', fill: 'none', stroke: hl, 'stroke-width': 4, 'stroke-linecap': 'round' }); });
    r += rpath('M100 40 L80 26 L80 54 Z', hue('rose'), 6) + rpath('M100 40 L120 26 L120 54 Z', hue('rose'), 6) + circ(100, 40, 8, hue('rose', 'deep'));
    r += archDoor(100, 276, 36, 62, hue('rose', 'deep'));
    r += rect(160, 214, 12, 54, 6, N['surface-raised']) + rect(160, 222, 12, 6, 3, hue('rose')) + rect(160, 236, 12, 6, 3, hue('sky')) + rect(160, 250, 12, 6, 3, hue('rose')) + circ(166, 212, 7, hue('rose', 'deep'));
    r += el('g', { transform: 'translate(100 164) rotate(-20)' }, circ(-14, 6, 7, 'none', { stroke: hue('sky', 'deep'), 'stroke-width': 4 }) + circ(-14, -6, 7, 'none', { stroke: hue('sky', 'deep'), 'stroke-width': 4 }) + rpath('M-8 4 L22 -4 L-8 -2 Z', hue('stone'), 3) + rpath('M-8 -4 L22 4 L-8 2 Z', hue('stone'), 3));
    return r;
  };
  /* 服裝店：整棟是一件巨大的 T 恤（衣身往下展開成 A 字、袖子往外伸、胸前一道彩虹、口袋），沒有衣架、沒有窗戶；210×236 */
  P.townClothes = function (st) {
    var r = '', rb = ['rose', 'peach', 'sun', 'mint', 'sky', 'lilac'], i, f = N['surface-raised'];
    r += rpath('M62 20 L88 10 Q105 32 122 10 L148 20 L202 68 L174 102 L160 90 L180 232 L30 232 L50 90 L36 102 L8 68 Z', hue('sky'), 10);
    r += rpath('M88 12 Q105 38 122 12 Q105 26 88 12 Z', hue('sky', 'deep'), 4);
    r += rpath('M8 68 L36 102 L44 92 L16 60 Z', hue('sky', 'deep'), 4) + rpath('M202 68 L174 102 L166 92 L194 60 Z', hue('sky', 'deep'), 4);
    for (i = 0; i < rb.length; i++) { var rr = 40 - i * 5; r += el('path', { d: 'M' + (105 - rr) + ' 132 A' + rr + ' ' + rr + ' 0 0 1 ' + (105 + rr) + ' 132', fill: 'none', stroke: hue(rb[i]), 'stroke-width': 5.2, 'stroke-linecap': 'round' }); }
    r += circ(62, 132, 8, f) + circ(72, 134, 7, f) + rect(56, 132, 24, 7, 3.5, f) + circ(138, 132, 8, f) + circ(148, 134, 7, f) + rect(130, 132, 24, 7, 3.5, f);
    r += rect(120, 150, 22, 6, 3, hue('sky', 'deep'));
    r += rect(26, 222, 158, 12, 6, hue('sky', 'ledge'));
    r += archDoor(105, 226, 36, 62, hue('wood', 'deep'));
    return r;
  };
  /* 配件店：屋頂一頂超大歪歪的禮帽（插羽毛），牆上兩扇窗是一副巨大眼鏡；200×290 */
  P.townAcc = function (st) {
    var w = win(st), r = '';
    r += rect(28, 160, 144, 116, 14, hue('lilac', 'soft')) + rect(22, 266, 156, 16, 8, hue('lilac', 'ledge'));
    r += el('g', { transform: 'rotate(-7 100 150)' }, rpath('M50 146 L56 30 Q100 18 144 30 L150 146 Z', hue('lilac', 'deep'), 10) + rect(52, 118, 96, 20, 8, hue('sun')) + ell(100, 152, 98, 16, hue('lilac', 'deep'))
      + el('path', { d: 'M140 120 Q170 80 160 34', fill: 'none', stroke: hue('peach'), 'stroke-width': 12, 'stroke-linecap': 'round' }) + el('path', { d: 'M146 110 Q166 82 160 46', fill: 'none', stroke: hue('peach', 'soft'), 'stroke-width': 4, 'stroke-linecap': 'round' }));
    r += circ(68, 200, 27, w) + circ(132, 200, 27, w) + circ(68, 200, 27, 'none', { stroke: hue('stone', 'deep'), 'stroke-width': 7 }) + circ(132, 200, 27, 'none', { stroke: hue('stone', 'deep'), 'stroke-width': 7 })
      + el('path', { d: 'M95 196 Q100 188 105 196', fill: 'none', stroke: hue('stone', 'deep'), 'stroke-width': 7, 'stroke-linecap': 'round' }) + rect(28, 192, 14, 7, 3.5, hue('stone', 'deep')) + rect(158, 192, 14, 7, 3.5, hue('stone', 'deep'));
    r += archDoor(100, 276, 34, 46, hue('lilac', 'deep'));
    return r;
  };
  /* 照相館：屋頂是一台巨大的復古相機（皮革機身、銀色上蓋、大鏡頭、閃光燈泡、快門鈕），紅磚牆、棕色門；200×290 */
  P.townPhoto = function (st) {
    var w = win(st), r = '';
    /* 紅磚牆：灰縫底色＋一排排錯開的磚 */
    var bk = '', row, col; for (row = 0; row < 9; row++) for (col = -1; col < 6; col++) { var bx = 38 + col * 26 + (row % 2 ? 13 : 0); var x0 = Math.max(36, bx), x1 = Math.min(164, bx + 23); if (x1 - x0 > 4) bk += rect(x0, 174 + row * 11.5, x1 - x0, 9, 2.5, hue('peach', row % 3 === 1 ? 'deep' : 'ledge'), row % 3 === 1 ? { opacity: .55 } : null); }
    r += rect(34, 170, 132, 106, 14, hue('peach', 'soft')) + bk + rect(28, 266, 144, 16, 8, hue('stone', 'ledge'));
    r += rect(20, 46, 18, 34, 6, hue('stone')) + ell(29, 34, 14, 16, hue('sun', 'soft')) + circ(29, 34, 8, hue('sun'));
    r += rect(132, 46, 26, 14, 6, hue('peach')) + rect(64, 40, 52, 28, 10, hue('stone', 'soft'));
    r += rect(12, 62, 176, 112, 22, hue('stone', 'soft')) + rect(12, 88, 176, 70, 0, hue('stone', 'deep')) + rect(12, 150, 176, 24, 12, hue('stone', 'soft'));
    r += circ(100, 120, 50, hue('stone')) + circ(100, 120, 40, hue('stone', 'deep')) + circ(100, 120, 28, hue('sky', 'deep')) + circ(100, 120, 16, hue('sky')) + circ(108, 112, 5, w);
    r += archDoor(100, 276, 36, 62, hue('bark'));
    return r;
  };
  /* 道具店：整棟是一個巨大的玩具箱（蓋子掀開），頂上冒出很多玩具：火箭、小熊、彈簧小丑、球、風車、積木；200×300 */
  P.townToy = function (st) {
    var w = win(st), r = '';
    r += el('g', { transform: 'rotate(-28 24 150)' }, rect(-30, 132, 120, 20, 8, hue('sun', 'deep')) + rect(-30, 132, 120, 6, 3, hue('sun', 'ledge')));
    r += rpath('M92 120 L92 46 Q100 14 108 46 L108 120 Z', hue('stone', 'soft'), 6) + rpath('M92 104 L80 124 L92 120 Z', hue('rose'), 4) + rpath('M108 104 L120 124 L108 120 Z', hue('rose'), 4) + circ(100, 64, 6, hue('sky'));
    r += circ(52, 128, 22, hue('wood')) + circ(36, 108, 9, hue('wood')) + circ(68, 108, 9, hue('wood')) + ell(52, 136, 10, 8, hue('wood', 'soft')) + circ(45, 124, 2.6, N.ink) + circ(59, 124, 2.6, N.ink) + circ(52, 131, 3, hue('wood', 'deep'));
    r += el('path', { d: 'M150 146 L142 136 L158 128 L142 120 L158 112 L150 104', fill: 'none', stroke: hue('stone', 'deep'), 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }) + circ(150, 90, 15, hue('peach', 'soft')) + rpath('M136 82 L150 58 L164 82 Z', hue('lilac'), 5) + circ(150, 58, 4, hue('sun')) + circ(145, 89, 2.4, N.ink) + circ(155, 89, 2.4, N.ink) + circ(150, 96, 4, hue('rose'));
    r += circ(176, 128, 16, hue('rose')) + rect(160, 124, 32, 7, 3.5, hue('sun'));
    r += rect(118, 116, 4, 34, 2, hue('wood', 'deep')) + rpath('M120 114 L120 98 L132 110 Z', hue('sky'), 3) + rpath('M120 114 L136 114 L124 126 Z', hue('rose'), 3) + rpath('M120 114 L120 130 L108 118 Z', hue('sun'), 3) + rpath('M120 114 L104 114 L116 102 Z', hue('mint'), 3);
    r += rect(66, 132, 18, 18, 4, hue('mint')) + rect(76, 120, 16, 16, 4, hue('sky'));
    r += rect(20, 146, 160, 132, 12, hue('sun')) + rect(20, 146, 160, 14, 7, hue('sun', 'deep')) + rect(20, 196, 160, 10, 0, hue('peach')) + rect(20, 232, 160, 10, 0, hue('peach'));
    r += rect(14, 150, 14, 120, 6, hue('sun', 'deep')) + rect(172, 150, 14, 120, 6, hue('sun', 'deep')) + rect(14, 268, 172, 14, 7, hue('sun', 'ledge'));
    r += rpath(star(48, 178, 10, 5), hue('rose'), 3) + rpath(star(152, 178, 10, 5), hue('sky'), 3) + circ(48, 222, 13, w) + circ(152, 222, 13, w);
    r += archDoor(100, 276, 38, 66, hue('wood', 'deep'));
    return r;
  };
  /* 神秘的房間：造型奇怪的實驗室（歪塔、圓頂望遠鏡、冒泡玻璃槽、管線、天線電球、底部基座），門是發光的傳送門；240×300 */
  P.townLab = function (st) {
    var lit = st === 'night', w2 = lit ? hue('sun', 'soft') : hue('mint', 'soft');
    var r = '';
    r += el('path', { d: 'M160 60 L160 34 M160 34 L152 24 M160 34 L168 24', fill: 'none', stroke: hue('stone', 'deep'), 'stroke-width': 4, 'stroke-linecap': 'round' }) + circ(160, 20, 8, hue('sun')) + rpath('M156 8 L162 0 L160 6 L166 2 L160 12 Z', hue('sun'), 2);
    r += el('g', { transform: 'rotate(-7 70 190)' }, rect(40, 70, 60, 190, 14, hue('lilac')) + rpath('M34 76 L70 34 L106 76 Z', hue('lilac', 'deep'), 8) + circ(70, 112, 12, w2) + circ(70, 152, 10, w2) + circ(70, 188, 8, w2));
    r += rect(80, 140, 120, 120, 18, hue('lilac', 'soft')) + rpath('M120 142 Q160 78 200 142 Z', hue('mint', 'deep'), 6) + rect(156, 60, 8, 30, 3, hue('stone', 'deep'))
      + el('g', { transform: 'rotate(-30 160 104)' }, rect(150, 82, 44, 14, 7, hue('stone')) + circ(196, 89, 8, hue('sky', 'soft')));
    r += el('path', { d: 'M206 240 L206 180 Q206 160 220 160 L226 160', fill: 'none', stroke: hue('stone', 'deep'), 'stroke-width': 6, 'stroke-linecap': 'round' });
    r += ell(216, 222, 18, 34, hue('sky', 'soft')) + ell(216, 234, 16, 22, hue('mint')) + circ(210, 226, 3, N['surface-raised']) + circ(220, 216, 4, N['surface-raised']) + circ(214, 206, 2.5, N['surface-raised']) + rect(200, 252, 32, 10, 5, hue('stone', 'deep'));
    r += el('path', { d: 'M38 230 Q18 230 18 210 L18 170', fill: 'none', stroke: hue('mint', 'deep'), 'stroke-width': 6, 'stroke-linecap': 'round' }) + circ(18, 164, 8, hue('mint'));
    r += rect(98, 168, 24, 24, 8, w2) + rect(158, 168, 24, 24, 8, w2);
    /* 底部基座：整排寬平台＋台階 */
    r += rect(4, 270, 232, 18, 9, hue('stone')) + rect(0, 284, 240, 16, 8, hue('stone', 'ledge')) + rect(16, 274, 6, 8, 3, hue('stone', 'soft')) + rect(218, 274, 6, 8, 3, hue('stone', 'soft'));
    /* 發光的傳送門（取代原本的門）：外框＋三層光圈＋旋渦；.g-portal 會由 CSS 呼吸發光，進門時更亮 */
    var pd = function (x0, x1, top, bot) { var cx = (x0 + x1) / 2, rr = (x1 - x0) / 2; return 'M' + x0 + ' ' + bot + ' V' + (top + rr) + ' A' + rr + ' ' + rr + ' 0 0 1 ' + x1 + ' ' + (top + rr) + ' V' + bot + ' Z'; };
    r += el('g', { 'class': 'g-portal' }, rpath(pd(94, 146, 206, 272), hue('mint', 'soft'), 10).replace('<path', '<path class="g-portal-halo" opacity=".55"')
      + rpath(pd(100, 140, 214, 272), hue('lilac', 'deep'), 4) + rpath(pd(105, 135, 220, 272), hue('lilac'), 4) + rpath(pd(110, 130, 228, 272), hue('mint'), 4) + rpath(pd(115, 125, 238, 272), hue('mint', 'soft'), 3)
      + el('path', { d: 'M120 250 m-8 0 a8 8 0 1 1 8 8 a5 5 0 1 1 -4 -6', fill: 'none', stroke: N['surface-raised'], 'stroke-width': 2.4, 'stroke-linecap': 'round', opacity: .8 }));
    return r;
  };

  /* ---------- 我的家（室內，v2.23.0） ---------- */
  /* 床：木頭床頭、床墊、花被子、枕頭；200×110 */
  P.homeBed = function () {
    return rect(4, 10, 30, 96, 12, hue('wood')) + rect(10, 18, 18, 30, 8, hue('wood', 'soft')) + rect(26, 54, 170, 30, 12, N['surface-raised']) + rect(166, 56, 30, 50, 10, hue('wood', 'ledge'))
      + ell(54, 54, 24, 12, hue('sky', 'soft')) + rpath('M76 50 L190 50 Q196 50 196 58 L196 84 L76 84 Z', hue('peach'), 8)
      + circ(100, 66, 5, hue('peach', 'soft')) + circ(128, 72, 5, hue('peach', 'soft')) + circ(156, 64, 5, hue('peach', 'soft')) + circ(178, 76, 5, hue('peach', 'soft'))
      + rect(30, 84, 136, 10, 5, hue('wood', 'ledge')) + rect(30, 92, 10, 16, 4, hue('wood', 'deep')) + rect(156, 92, 10, 16, 4, hue('wood', 'deep'));
  };
  /* 衣櫃：兩扇門、門把，上面放著帽盒；120×190 */
  P.homeCloset = function (st) {
    if (st === 'capsule') {   /* 太空：太空艙衣櫃（圓頂、大圓窗門、指示燈、天線） */
      return rect(58, 0, 4, 14, 2, hue('stone', 'deep')) + circ(60, 2, 4, hue('rose')) + rpath('M8 60 Q8 12 60 12 Q112 12 112 60 V178 H8 Z', hue('stone', 'soft'), 10) + rect(8, 60, 104, 6, 3, hue('stone'))
        + circ(60, 106, 30, hue('stone')) + circ(60, 106, 24, hue('sky', 'ledge')) + circ(52, 98, 7, hue('sky', 'soft'), { opacity: .7 }) + rect(88, 102, 8, 14, 3, hue('stone', 'deep'))
        + circ(28, 40, 4, hue('mint')) + circ(42, 34, 4, hue('sun')) + circ(78, 34, 4, hue('rose')) + rect(20, 150, 80, 6, 3, hue('stone')) + rect(10, 178, 14, 12, 4, hue('stone', 'deep')) + rect(96, 178, 14, 12, 4, hue('stone', 'deep'));
    }
    if (st === 'white') {
      return rect(30, 2, 60, 22, 8, hue('sky', 'soft')) + rect(6, 22, 108, 160, 14, N['surface-raised']) + rect(14, 30, 44, 144, 10, hue('stone', 'soft')) + rect(62, 30, 44, 144, 10, hue('stone', 'soft'))
        + circ(52, 100, 4, hue('sun', 'deep')) + circ(68, 100, 4, hue('sun', 'deep')) + rect(10, 178, 14, 12, 4, hue('stone', 'deep')) + rect(96, 178, 14, 12, 4, hue('stone', 'deep'));
    }
    if (st === 'trunk') {   /* 森林：樹幹衣櫃（樹皮紋、樹洞門、頂上長葉子） */
      return ell(30, 18, 26, 16, hue('leaf')) + ell(88, 16, 28, 17, hue('leaf', 'ledge')) + ell(60, 10, 22, 14, hue('leaf'))
        + rect(8, 22, 104, 162, 30, hue('bark')) + rect(20, 40, 6, 120, 3, hue('bark', 'deep')).replace('<rect', '<rect opacity=".5"') + rect(94, 50, 6, 110, 3, hue('bark', 'deep')).replace('<rect', '<rect opacity=".5"')
        + rpath('M34 176 L34 70 Q60 40 86 70 L86 176 Z', hue('wood', 'soft'), 10) + rect(58, 70, 4, 106, 2, hue('wood')) + circ(52, 120, 4, hue('wood', 'deep')) + circ(68, 120, 4, hue('wood', 'deep'))
        + ell(26, 186, 18, 5, hue('bark', 'deep')) + ell(94, 186, 18, 5, hue('bark', 'deep'));
    }
    if (st === 'chest') {   /* 海洋：寶箱衣櫃（圓拱蓋、金屬條、鎖頭、貝殼） */
      return rpath('M8 74 Q8 24 60 24 Q112 24 112 74 Z', hue('wood'), 10) + rect(8, 70, 104, 112, 12, hue('wood', 'deep'))
        + rect(24, 26, 10, 156, 3, hue('sun', 'deep')) + rect(86, 26, 10, 156, 3, hue('sun', 'deep')) + rect(8, 70, 104, 10, 4, hue('sun', 'deep'))
        + rect(48, 80, 24, 28, 6, hue('sun')) + circ(60, 92, 4, hue('wood', 'deep')) + rect(58, 92, 4, 8, 2, hue('wood', 'deep'))
        + rpath('M48 140 Q60 124 72 140 Z', hue('peach', 'soft'), 4) + rect(10, 178, 14, 12, 4, hue('wood', 'ledge')) + rect(96, 178, 14, 12, 4, hue('wood', 'ledge'));
    }
    return rect(30, 2, 60, 22, 8, hue('lilac')) + rect(30, 10, 60, 5, 2.5, hue('lilac', 'ledge')) + rect(6, 22, 108, 160, 14, hue('wood')) + rect(14, 30, 44, 144, 10, hue('wood', 'soft')) + rect(62, 30, 44, 144, 10, hue('wood', 'soft'))
      + rect(50, 92, 5, 18, 2.5, hue('wood', 'deep')) + rect(65, 92, 5, 18, 2.5, hue('wood', 'deep')) + rect(10, 178, 14, 12, 4, hue('wood', 'deep')) + rect(96, 178, 14, 12, 4, hue('wood', 'deep'));
  };
  /* 地毯：220×40 */
  P.homeRug = function (st) {
    if (st === 'planet') return ring(110, 22, 106, 16, hue('sun', 'ledge'), 5) + ell(110, 21, 70, 14, hue('lilac')) + ell(86, 18, 12, 4, hue('lilac', 'ledge')) + ell(132, 25, 9, 3, hue('lilac', 'ledge')) + ell(112, 14, 6, 2, hue('lilac', 'soft')) + el('path', { d: 'M4 22 A106 16 0 0 0 216 22', fill: 'none', stroke: hue('sun'), 'stroke-width': 5 });
    if (st === 'donut') {
      var dn = '<path d="M2 22 A108 18 0 1 0 218 22 A108 18 0 1 0 2 22 Z M80 21 A30 6 0 1 0 140 21 A30 6 0 1 0 80 21 Z" fill="' + hue('wood') + '" fill-rule="evenodd"/>', q;
      dn += '<path d="M12 21 Q20 10 50 8 Q110 2 170 8 Q204 12 208 21 Q200 32 186 30 Q176 36 160 32 Q140 38 120 33 Q100 38 80 33 Q62 37 50 31 Q30 34 12 21 Z M80 21 A30 6 0 1 0 140 21 A30 6 0 1 0 80 21 Z" fill="' + hue('rose') + '" fill-rule="evenodd"/>';
      var cs = ['sky', 'sun', 'mint', 'lilac', 'peach'];
      for (q = 0; q < 16; q++) { var a = q * 0.392, sx = 110 + Math.cos(a) * (58 + (q % 3) * 12), sy = 21 + Math.sin(a) * (9 + (q % 2) * 2); dn += rect(sx - 3, sy - 1, 6, 2.2, 1.1, hue(cs[q % 5]), { transform: 'rotate(' + ((q * 47) % 180) + ' ' + sx.toFixed(1) + ' ' + sy.toFixed(1) + ')' }); }
      return dn;
    }
    if (st === 'checker') { var r = rect(6, 4, 208, 32, 10, hue('sky', 'soft')), i, j; for (i = 0; i < 13; i++) for (j = 0; j < 2; j++) if ((i + j) % 2) r += rect(10 + i * 15.4, 8 + j * 12, 15.4, 12, 2, hue('sky')); return r; }
    if (st === 'rainbow') return ell(110, 22, 108, 18, hue('rose', 'soft')) + ell(110, 22, 90, 15, hue('sun', 'soft')) + ell(110, 22, 72, 12, hue('mint', 'soft')) + ell(110, 22, 54, 9, hue('sky', 'soft')) + ell(110, 22, 36, 6, hue('lilac', 'soft'));
    if (st === 'grass') {   /* 草皮：一圈草邊＋三層深淺草葉（後排矮、前排高）＋小花 */
      var g = ell(110, 22, 108, 17, hue('leaf', 'ledge')) + ell(110, 22, 102, 14, hue('leaf')), seed = 7, k, row;
      var rnd = function () { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
      var blade = function (x, y, h, lean, c) { return '<path d="M' + (x - 2.2).toFixed(1) + ' ' + y + ' Q' + (x - .6).toFixed(1) + ' ' + (y - h * .6).toFixed(1) + ' ' + (x + lean).toFixed(1) + ' ' + (y - h).toFixed(1) + ' Q' + (x + 1).toFixed(1) + ' ' + (y - h * .5).toFixed(1) + ' ' + (x + 2.2).toFixed(1) + ' ' + y + ' Z" fill="' + c + '"/>'; };
      var tones = [hue('leaf', 'ledge'), hue('leaf', 'ledge'), hue('leaf', 'deep'), hue('mint', 'deep')];
      for (row = 0; row < 4; row++) {
        var y = 12 + row * 6.5, dy = (y - 22) / 17, half = 104 * Math.sqrt(Math.max(0, 1 - dy * dy)), step = 7.5 - row * .4;
        for (k = 110 - half + 4 + rnd() * 3; k < 110 + half - 4; k += step + rnd() * 2) g += blade(k, y + 2, 5 + row * 1.3 + rnd() * 3, (rnd() - .5) * 4, tones[Math.floor(rnd() * 4)]);
      }
      for (k = 0; k < 360; k += 12) { var a = k * Math.PI / 180; g += blade(110 + 106 * Math.cos(a), 22 + 16 * Math.sin(a) + 1, 4 + rnd() * 2, Math.cos(a) * 2, hue('leaf', 'ledge')); }
      var flower = function (x, y, c) { var f = '', t; for (t = 0; t < 5; t++) f += ell(x + 2.6 * Math.cos(t * 1.2566), y + 1.6 * Math.sin(t * 1.2566), 2, 1.4, c); return f + circ(x, y, 1.4, hue('sun', 'deep')); };
      return g + flower(52, 20, N['surface-raised']) + flower(92, 30, hue('rose', 'soft')) + flower(138, 15, hue('sun')) + flower(172, 26, N['surface-raised']) + flower(30, 27, hue('lilac', 'soft'));
    }
    if (st === 'starfish') {   /* 海星：整張地毯就是一顆五角海星，平放在地上（後面的腳較窄、較短） */
      var cx = 110, cy = 21, sx = 106, sy = 21, persp = .18;
      var pt = function (u, v) { var w = 1 + v * persp; return [(cx + u * sx * w), (cy + v * sy)]; };
      var shape = function (R, r, rot) { var pts = [], i; rot = rot || 0;
        for (i = 0; i < 10; i++) { var an = -Math.PI / 2 + rot + i * Math.PI / 5, rr = i % 2 ? r : R, q = pt(rr * Math.cos(an), rr * Math.sin(an)); pts.push(q[0].toFixed(1) + ' ' + q[1].toFixed(1)); }
        return 'M' + pts.join(' L') + ' Z'; };
      var f = '<path d="' + shape(.97, .47, 0) + '" fill="' + hue('peach', 'deep') + '" stroke="' + hue('peach', 'deep') + '" stroke-width="5" stroke-linejoin="round" transform="translate(0 1.8)"/>'
        + '<path d="' + shape(.97, .47, 0) + '" fill="' + hue('peach') + '" stroke="' + hue('peach') + '" stroke-width="5" stroke-linejoin="round"/>'
        + '<path d="' + shape(.58, .28, 0) + '" fill="' + hue('peach', 'soft') + '" opacity=".7"/>';
      var arm, t;
      for (arm = 0; arm < 5; arm++) { var an = -Math.PI / 2 + arm * 2 * Math.PI / 5;
        for (t = .22; t < .9; t += .17) { var q = pt(t * Math.cos(an), t * Math.sin(an)); f += ell(q[0], q[1], 2.6 - t * 1.4, (2.6 - t * 1.4) * .62, N['surface-raised'], { opacity: .85 }); } }
      var c0 = pt(0, 0); return f + ell(c0[0], c0[1], 7, 4.2, hue('peach', 'deep')) + ell(c0[0], c0[1] - .6, 4.5, 2.6, hue('sun', 'soft'));
    }
    return ell(110, 20, 108, 18, hue('lilac', 'soft')) + ell(110, 20, 86, 12, hue('lilac'), { opacity: .45 }) + ell(110, 20, 60, 7, hue('lilac', 'soft')); };
  /* 立燈：50×150 */
  P.homeLamp = function (st) {
    if (st === 'mushroom') return ell(25, 145, 16, 5, hue('wood', 'ledge')) + rect(18, 70, 14, 76, 7, hue('wood', 'soft')) + rpath('M2 74 Q2 34 25 34 Q48 34 48 74 Z', hue('rose'), 6) + rect(6, 70, 38, 7, 3.5, hue('rose', 'soft'))
      + circ(14, 56, 4, W3) + circ(27, 46, 5, W3) + circ(38, 60, 3.4, W3) + ell(25, 80, 8, 4, hue('sun', 'soft'));
    if (st === 'lighthouse') return rect(8, 138, 34, 10, 5, hue('stone')) + rpath('M14 140 L18 50 H32 L36 140 Z', W3, 3) + rpath('M15.4 112 L16.3 92 H33.7 L34.6 112 Z', hue('rose'), 1) + rpath('M16.9 76 L17.5 62 H32.5 L33.1 76 Z', hue('rose'), 1)
      + rect(12, 46, 26, 5, 2.5, hue('stone', 'deep')) + rect(16, 28, 18, 20, 4, hue('sun', 'soft')) + rect(22, 30, 6, 16, 2, hue('sun')) + rpath('M12 30 L25 14 L38 30 Z', hue('rose'), 4) + circ(25, 12, 3, hue('rose', 'deep')) + rect(21, 120, 8, 18, 3, hue('sky', 'ledge'));
    if (st === 'moon') return ell(25, 145, 16, 5, hue('stone', 'deep')) + rect(23, 74, 4, 72, 2, hue('stone', 'deep')) + rpath('M34 20 A28 28 0 1 0 34 76 A32 32 0 0 1 34 20 Z', hue('sun'), 3)
      + stroke('M14 46 Q16 48 18 46', hue('sun', 'deep'), 1.6) + ell(17, 54, 2.4, 1.4, hue('rose', 'soft')) + rect(39, 22, 1.4, 22, .7, hue('stone', 'deep')) + rpath(star(39.7, 48, 6, 2.6, 5), hue('sun', 'ledge'), 1.5);
    if (st === 'icecream') return ell(25, 147, 14, 3, hue('stone', 'soft')) + rpath('M8 70 L25 146 L42 70 Z', hue('wood'), 4) + stroke('M12 80 L36 104 M14 92 L32 110 M36 80 L14 102 M34 92 L18 110', hue('wood', 'ledge'), 2)
      + circ(25, 56, 18, hue('rose')) + rpath('M8 62 Q10 74 14 66 Q18 76 22 68 Q26 78 30 68 Q34 76 38 66 Q41 72 42 62 Z', hue('rose'), 2) + circ(25, 34, 14, hue('mint')) + circ(25, 16, 5, hue('rose', 'deep'))
      + stroke('M25 11 Q28 6 32 6', hue('leaf', 'deep'), 1.6) + ell(18, 50, 4, 6, W3, { opacity: .4 }) + rect(16, 30, 4, 1.8, .9, hue('sun')) + rect(30, 38, 4, 1.8, .9, hue('sky'));
    return rpath('M10 40 L40 40 L34 6 L16 6 Z', hue('sun', 'soft'), 6) + rect(23, 40, 4, 100, 2, hue('stone', 'deep')) + rect(10, 138, 30, 10, 5, hue('stone', 'deep'));
  };
  /* 掛畫（小房子與太陽）：70×60 */
  P.homePicture = function () {
    return rect(0, 0, 70, 60, 8, hue('wood')) + rect(6, 6, 58, 48, 5, hue('sky', 'soft')) + circ(50, 18, 7, hue('sun')) + rect(6, 40, 58, 14, 0, hue('leaf', 'soft'))
      + rect(18, 30, 22, 16, 2, hue('peach')) + rpath('M15 31 L29 20 L43 31 Z', hue('rose'), 3) + rect(26, 37, 6, 9, 2, hue('wood', 'deep'));
  };
  /* ---------- 我的家・佈置（v2.29.0，docs/plan-town-home-furniture.md） ---------- */
  function rrPath(x, y, w, h, r) { return 'M' + (x + r) + ' ' + y + ' H' + (x + w - r) + ' Q' + (x + w) + ' ' + y + ' ' + (x + w) + ' ' + (y + r) + ' V' + (y + h - r) + ' Q' + (x + w) + ' ' + (y + h) + ' ' + (x + w - r) + ' ' + (y + h) + ' H' + (x + r) + ' Q' + x + ' ' + (y + h) + ' ' + x + ' ' + (y + h - r) + ' V' + (y + r) + ' Q' + x + ' ' + y + ' ' + (x + r) + ' ' + y + ' Z'; }
  /* 窗框（玻璃透明，窗外景色另外畫在後面）：120×100，同 shopWindow 的尺寸 */
  P.homeWindowFrame = function (st) {
    var f = hue('wood', 'soft');
    var circ2 = function (cx, cy, r) { return 'M' + (cx - r) + ' ' + cy + ' A' + r + ' ' + r + ' 0 1 0 ' + (cx + r) + ' ' + cy + ' A' + r + ' ' + r + ' 0 1 0 ' + (cx - r) + ' ' + cy + ' Z'; };
    var glare = function (d) { return '<path d="' + d + '" fill="' + N['surface-raised'] + '" opacity=".35"/>'; };
    if (st === 'round') {   /* 圓窗：木頭圓框＋十字窗格（玻璃＝圓心 60,50、半徑 40） */
      return el('path', { d: circ2(60, 50, 48) + ' ' + circ2(60, 50, 40), fill: f, 'fill-rule': 'evenodd' }) + ring(60, 50, 47, 47, hue('wood'), 3)
        + rect(57, 10, 6, 80, 3, f) + rect(20, 47, 80, 6, 3, f) + rect(30, 92, 60, 7, 3.5, hue('wood')) + glare('M34 30 Q40 22 50 18 L44 32 Z');
    }
    if (st === 'arch') {   /* 拱形窗：上半圓、窗台、拱心石（玻璃＝x 22–98、y 10–92） */
      return el('path', { d: 'M14 98 V48 A46 46 0 0 1 106 48 V98 Z M22 92 V48 A38 38 0 0 1 98 48 V92 Z', fill: f, 'fill-rule': 'evenodd' })
        + rect(57, 10, 6, 82, 3, f) + rect(22, 56, 76, 5, 2.5, f) + stroke('M30 48 A30 30 0 0 1 90 48', f, 3) + rect(54, 0, 12, 10, 3, hue('wood')) + rect(6, 90, 108, 10, 5, hue('wood'))
        + glare('M28 50 Q30 30 44 20 L40 44 Z');
    }
    if (st === 'porthole') {   /* 海洋：船艙圓窗（黃銅圈、螺絲、鉸鍊；玻璃＝半徑 34） */
      var b = el('path', { d: circ2(60, 50, 46) + ' ' + circ2(60, 50, 34), fill: hue('sun', 'ledge'), 'fill-rule': 'evenodd' }) + ring(60, 50, 34.5, 34.5, hue('sun', 'deep'), 2) + ring(60, 50, 45, 45, hue('sun', 'deep'), 1.5), k;
      for (k = 0; k < 8; k++) { var a = k * Math.PI / 4 + Math.PI / 8; b += circ(60 + 40 * Math.cos(a), 50 + 40 * Math.sin(a), 2.6, hue('sun', 'deep')) + circ(59.4 + 40 * Math.cos(a), 49.4 + 40 * Math.sin(a), 1, hue('sun', 'soft')); }
      return b + rect(104, 42, 10, 16, 3, hue('stone', 'deep')) + glare('M38 32 Q44 24 54 20 L48 34 Z');
    }
    if (st === 'capsule') {   /* 太空：太空艙窗（膠囊形、指示燈、鉚釘；玻璃＝x 18–102、y 22–78） */
      var c = el('path', { d: 'M44 12 H76 A38 38 0 0 1 76 88 H44 A38 38 0 0 1 44 12 Z M46 22 H74 A28 28 0 0 1 74 78 H46 A28 28 0 0 1 46 22 Z', fill: hue('stone', 'soft'), 'fill-rule': 'evenodd' })
        + stroke('M44 12 H76 A38 38 0 0 1 76 88 H44 A38 38 0 0 1 44 12 Z', hue('stone'), 2), q;
      [[16, 50], [104, 50], [44, 15.5], [76, 15.5], [44, 84.5], [76, 84.5]].forEach(function (pt) { c += circ(pt[0], pt[1], 1.8, hue('stone', 'deep')); });
      for (q = 0; q < 3; q++) c += circ(48 + q * 12, 94, 3, [hue('mint'), hue('sun'), hue('rose')][q]);
      return c + rect(38, 90, 44, 8, 4, hue('stone')).replace('<rect', '<rect opacity=".001"') + glare('M30 36 Q36 28 46 26 L38 42 Z');
    }
    return el('path', { d: rrPath(0, 0, 120, 100, 16) + ' ' + rrPath(8, 8, 104, 84, 10), fill: f, 'fill-rule': 'evenodd' })
      + rect(57, 8, 6, 84, 3, f) + rect(8, 47, 104, 6, 3, f) + rect(2, 2, 116, 10, 5, hue('wood'))
      + rpath('M16 16 L34 16 L18 40 Z', N['surface-raised'], 3).replace('<path', '<path opacity=".35"');
  };
  /* 窗簾：桿子＋左右兩片布＋綁帶；state＝色相；136×110（蓋在窗戶外圍） */
  P.homeCurtains = function (s) {
    if (s === 'stars' || s === 'candy') {   /* 太空：星星窗簾；甜點：糖果條紋窗簾 */
      var sp = s === 'stars', sc = sp ? hue('lilac', 'ledge') : hue('rose', 'soft'), sd = sp ? hue('sun') : hue('rose'), so = rect(0, 4, 136, 8, 4, sp ? hue('lilac', 'deep') : hue('rose', 'ledge')) + circ(4, 8, 6, sd) + circ(132, 8, 6, sd);
      so += rpath('M8 10 H40 Q34 40 30 56 Q38 82 34 108 H8 Z', sc, 6) + rpath('M128 10 H96 Q102 40 106 56 Q98 82 102 108 H128 Z', sc, 6);
      if (sp) [[18, 26], [30, 44], [16, 70], [28, 94], [118, 28], [106, 46], [120, 72], [108, 96]].forEach(function (q, n) { so += rpath(star(q[0], q[1], n % 3 ? 4.5 : 6, n % 3 ? 2 : 2.6, 5), hue('sun'), 1.5); });
      else [14, 24, 112, 122].forEach(function (x0, n) { so += stroke('M' + x0 + ' 12 Q' + (x0 + (n < 2 ? 6 : -6)) + ' 56 ' + x0 + ' 106', W3, 4); });
      return so + rect(24, 52, 16, 8, 4, sd) + rect(96, 52, 16, 8, 4, sd);
    }
    if (s === 'lace') {
      var lw = N['surface-raised'], ld = hue('stone', 'soft'), lr = rect(0, 4, 136, 8, 4, hue('wood', 'deep')) + circ(4, 8, 6, hue('wood')) + circ(132, 8, 6, hue('wood')), q;
      lr += rpath('M8 10 H42 Q36 60 40 104 H8 Z', lw, 6).replace('<path', '<path opacity=".92"') + rpath('M128 10 H94 Q100 60 96 104 H128 Z', lw, 6).replace('<path', '<path opacity=".92"');
      for (q = 0; q < 5; q++) lr += circ(12 + q * 7, 106, 3.4, lw) + circ(100 + q * 7, 106, 3.4, lw) + circ(18, 24 + q * 18, 2, ld) + circ(32, 32 + q * 16, 2, ld) + circ(118, 24 + q * 18, 2, ld) + circ(104, 32 + q * 16, 2, ld);
      return lr;
    }
    if (s === 'vine') {   /* 森林：藤蔓簾（左右兩串藤＋葉子＋小花） */
      var vr = rect(0, 4, 136, 8, 4, hue('bark')) , vx, vy;
      [10, 24, 112, 126].forEach(function (x0, n) { vr += stroke('M' + x0 + ' 10 Q' + (x0 + 6) + ' 50 ' + x0 + ' 100', hue('leaf', 'deep'), 3); for (vy = 22; vy < 100; vy += 16) { vx = x0 + ((vy / 16) % 2 ? 5 : -5); vr += ell(vx, vy, 6, 3.6, (vy + n) % 32 ? hue('leaf') : hue('leaf', 'ledge'), { transform: 'rotate(' + ((vy / 16) % 2 ? 30 : -30) + ' ' + vx + ' ' + vy + ')' }); } });
      return vr + circ(18, 60, 3.4, hue('rose', 'soft')) + circ(120, 44, 3.4, hue('sun', 'soft')) + circ(28, 92, 3, hue('lilac', 'soft'));
    }
    if (s === 'seaweed') {   /* 海洋：海草簾（從下往上長的波浪海草＋泡泡） */
      var sr = rect(0, 4, 136, 8, 4, hue('wood', 'deep'));
      [8, 22, 36, 100, 114, 128].forEach(function (x0, n) { sr += stroke('M' + x0 + ' 108 Q' + (x0 - 7) + ' 84 ' + x0 + ' 62 Q' + (x0 + 7) + ' 40 ' + x0 + ' 14', n % 2 ? hue('mint', 'deep') : hue('leaf'), 7); });
      return sr + circ(48, 30, 3, hue('sky', 'soft')) + circ(52, 18, 2, hue('sky', 'soft')) + circ(90, 48, 3, hue('sky', 'soft'));
    }
    var h = s || 'sky', c = hue(h, 'soft'), d = hue(h);
    return rect(0, 4, 136, 8, 4, hue('wood', 'deep')) + circ(4, 8, 6, hue('wood')) + circ(132, 8, 6, hue('wood'))
      + rpath('M8 10 H40 Q34 40 30 56 Q38 82 34 108 H8 Z', c, 6) + stroke('M16 14 Q22 60 16 104', d, 3).replace('<path', '<path opacity=".45"')
      + rpath('M128 10 H96 Q102 40 106 56 Q98 82 102 108 H128 Z', c, 6) + stroke('M120 14 Q114 60 120 104', d, 3).replace('<path', '<path opacity=".45"')
      + rect(24, 52, 16, 8, 4, d) + rect(96, 52, 16, 8, 4, d);
  };
  /* 置物架（放擺飾）：200×26 */
  P.homeShelf = function (st) {
    if (st === 'planet') return rect(0, 0, 200, 10, 5, hue('lilac')) + rect(4, 8, 192, 4, 2, hue('lilac', 'deep')) + circ(30, 18, 7, hue('sun')) + ring(30, 18, 11, 3, hue('sun', 'ledge'), 2) + circ(170, 18, 6, hue('sky')) + rpath(star(100, 18, 6, 2.6, 5), hue('sun'), 1.5);
    if (st === 'cookie') return rect(0, 0, 200, 11, 5.5, hue('wood', 'ledge')) + circ(20, 4, 2, hue('bark')) + circ(60, 6, 2, hue('bark')) + circ(110, 4, 2.2, hue('bark')) + circ(150, 7, 1.8, hue('bark')) + circ(184, 4, 2, hue('bark'))
      + circ(30, 18, 8, hue('wood')) + circ(28, 16, 1.6, hue('bark')) + circ(33, 20, 1.6, hue('bark')) + circ(170, 18, 8, hue('wood')) + circ(168, 16, 1.6, hue('bark')) + circ(173, 20, 1.6, hue('bark'));
    if (st === 'white') return rect(0, 0, 200, 10, 5, N['surface-raised']) + rect(4, 8, 192, 4, 2, hue('stone', 'soft')) + rpath('M24 12 H38 L30 26 H24 Z', hue('stone'), 3) + rpath('M176 12 H162 L170 26 H176 Z', hue('stone'), 3);
    if (st === 'branch') return rpath('M0 6 Q100 -2 200 6 L200 12 Q100 6 0 12 Z', hue('bark'), 5) + ell(14, 2, 10, 5, hue('leaf')) + ell(186, 4, 9, 5, hue('leaf', 'ledge')) + ell(100, 10, 7, 4, hue('leaf'), { transform: 'rotate(20 100 10)' }) + stroke('M40 12 L36 24', hue('bark', 'deep'), 3) + stroke('M160 12 L164 24', hue('bark', 'deep'), 3);
    if (st === 'sea') return rect(0, 0, 200, 10, 5, hue('sky')) + rect(4, 8, 192, 4, 2, hue('sky', 'deep')) + rpath(star(30, 18, 7, 3, 5), hue('peach'), 2) + rpath(star(170, 18, 7, 3, 5), hue('peach'), 2) + rpath('M90 12 Q100 24 110 12 Z', hue('peach', 'soft'), 3);
    return rect(0, 0, 200, 10, 5, hue('wood')) + rect(4, 8, 192, 4, 2, hue('wood', 'ledge'))
      + rpath('M24 12 H38 L30 26 H24 Z', hue('wood', 'deep'), 3) + rpath('M176 12 H162 L170 26 H176 Z', hue('wood', 'deep'), 3);
  };
  /* 花圈（掛飾）：70×70 */
  P.homeWreath = function () {
    var r = '', i, a2;
    for (i = 0; i < 12; i++) { a2 = i * Math.PI / 6; r += ell(35 + 23 * Math.cos(a2), 37 + 23 * Math.sin(a2), 9, 6, i % 2 ? hue('leaf') : hue('leaf', 'ledge'), { transform: 'rotate(' + (i * 30 + 90) + ' ' + (35 + 23 * Math.cos(a2)).toFixed(1) + ' ' + (37 + 23 * Math.sin(a2)).toFixed(1) + ')' }); }
    r += circ(35 + 23 * Math.cos(.6), 37 + 23 * Math.sin(.6), 4, hue('rose')) + circ(35 + 23 * Math.cos(2.4), 37 + 23 * Math.sin(2.4), 4, hue('sun')) + circ(35 + 23 * Math.cos(4.2), 37 + 23 * Math.sin(4.2), 4, hue('lilac'));
    return r + rpath('M24 6 L35 14 L46 6 L44 18 L35 14 L26 18 Z', hue('rose'), 3) + circ(35, 13, 4, hue('rose', 'deep'));
  };
  /* 星星吊飾（掛飾）：橫桿＋三條線吊著星星與月亮；70×90 */
  P.homeStars = function () {
    return rect(4, 4, 62, 6, 3, hue('wood')) + circ(35, 3, 3, hue('wood', 'deep'))
      + rect(13, 10, 2, 34, 1, hue('stone', 'deep')) + rect(34, 10, 2, 54, 1, hue('stone', 'deep')) + rect(55, 10, 2, 26, 1, hue('stone', 'deep'))
      + '<path d="' + star(14, 52, 10, 4.5, 5) + '" fill="' + hue('sun') + '"/>' + '<path d="' + star(56, 44, 9, 4, 5) + '" fill="' + hue('sun', 'deep') + '"/>'
      + circ(35, 74, 11, hue('sun', 'soft')) + circ(40, 70, 9, hue('sky', 'soft'));
  };
  /* 大盆栽（大擺飾）：龜背芋風格的大葉子＋大花盆；70×150 */
  P.homeBigPlant = function () {
    return rect(34, 40, 3, 70, 1.5, hue('leaf', 'deep')) + rect(24, 56, 3, 52, 1.5, hue('leaf', 'deep'), { transform: 'rotate(-18 25 108)' }) + rect(44, 56, 3, 52, 1.5, hue('leaf', 'deep'), { transform: 'rotate(18 45 108)' })
      + ell(36, 26, 18, 24, hue('leaf')) + ell(14, 50, 14, 20, hue('leaf', 'ledge'), { transform: 'rotate(-35 14 50)' }) + ell(58, 50, 14, 20, hue('leaf', 'ledge'), { transform: 'rotate(35 58 50)' })
      + ell(22, 80, 12, 17, hue('leaf'), { transform: 'rotate(-50 22 80)' }) + ell(50, 78, 12, 17, hue('leaf'), { transform: 'rotate(50 50 78)' })
      + rect(35, 8, 2, 36, 1, hue('leaf', 'soft')).replace('<rect', '<rect opacity=".6"')
      + rpath('M12 104 H58 L52 148 H18 Z', hue('peach', 'deep'), 8) + rect(8, 98, 54, 12, 6, hue('peach'));
  };
  /* 雙層床：200×170 */
  P.homeBedBunk = function () {
    var w = hue('sky'), r = '', y;
    r += rect(4, 6, 14, 160, 6, w) + rect(182, 6, 14, 160, 6, w);
    r += rect(16, 48, 168, 12, 6, hue('sky', 'deep')) + rect(20, 30, 160, 20, 8, N['surface-raised']) + ell(46, 32, 18, 9, hue('sun', 'soft')) + rpath('M66 28 H176 V48 H66 Z', hue('sun'), 8);
    r += rect(16, 140, 168, 12, 6, hue('sky', 'deep')) + rect(20, 122, 160, 20, 8, N['surface-raised']) + ell(46, 124, 18, 9, hue('mint', 'soft')) + rpath('M66 120 H176 V140 H66 Z', hue('mint'), 8);
    /* 樓梯：兩根側桿從上鋪一路到地板，橫踏板等距排到最底 */
    for (y = 70; y <= 154; y += 21) r += rect(132, y, 36, 6, 3, hue('sky', 'deep')) + rect(132, y, 36, 3, 1.5, w);
    r += rect(128, 40, 7, 128, 3.5, w) + rect(165, 40, 7, 128, 3.5, w);
    r += rect(125, 162, 13, 6, 3, hue('sky', 'deep')) + rect(162, 162, 13, 6, 3, hue('sky', 'deep'));
    return r;
  };
  /* 樹屋床（森林）：木頭床架、上方樹葉屋頂、垂掛藤蔓；200×150 */
  P.homeBedTree = function () {
    var r = '', c = function (pts, fill) { return pts.map(function (q) { return circ(q[0], q[1], q[2], fill); }).join(''); };
    /* 樹葉屋頂：像雲朵一樣由很多小圓弧組成（後層深綠、前層綠、最上面幾顆亮綠） */
    r += c([[14, 34, 14], [30, 22, 16], [50, 14, 15], [72, 10, 15], [96, 8, 16], [120, 9, 15], [144, 12, 15], [164, 19, 15], [182, 30, 14], [188, 42, 10], [10, 46, 10]], hue('leaf', 'ledge'));
    r += c([[22, 40, 13], [40, 32, 14], [60, 26, 14], [82, 22, 15], [104, 21, 15], [126, 22, 15], [148, 26, 14], [168, 32, 14], [180, 42, 11], [30, 50, 10], [56, 44, 11], [84, 40, 12], [112, 40, 12], [140, 42, 11], [166, 48, 10]], hue('leaf'));
    [[40, 32, 14], [82, 22, 15], [126, 22, 15], [168, 32, 14], [56, 44, 11], [112, 40, 12]].forEach(function (q) { r += stroke('M' + (q[0] - q[2] * .62) + ' ' + (q[1] - q[2] * .1) + ' Q' + (q[0] - q[2] * .5) + ' ' + (q[1] - q[2] * .7) + ' ' + (q[0] + q[2] * .1) + ' ' + (q[1] - q[2] * .68), hue('leaf', 'soft'), 3); });
    r += rect(10, 40, 14, 106, 6, hue('bark')) + rect(176, 40, 14, 106, 6, hue('bark'));
    r += stroke('M42 52 Q46 66 42 80', hue('leaf', 'deep'), 3) + circ(42, 82, 3, hue('leaf')) + stroke('M158 52 Q154 68 158 84', hue('leaf', 'deep'), 3) + circ(158, 86, 3, hue('leaf'));
    r += rect(22, 96, 156, 24, 10, N['surface-raised']) + ell(52, 96, 22, 11, hue('sun', 'soft')) + rpath('M76 92 H176 V120 H76 Z', hue('leaf', 'soft'), 8)
      + circ(110, 106, 4, hue('leaf')) + circ(140, 100, 4, hue('leaf')) + rect(22, 118, 156, 12, 5, hue('wood')) + rect(30, 128, 10, 18, 4, hue('bark', 'deep')) + rect(160, 128, 10, 18, 4, hue('bark', 'deep'));
    return r;
  };
  /* 貝殼床（海洋）：扇形貝殼床頭、珍珠枕頭、海浪被子；200×120 */
  P.homeBedShell = function () {
    /* 床頭是一個置中的大扇貝：放射狀的肋條、扇形波浪邊、底部兩片小耳朵 */
    var r = '', i, hx = 100, hy = 84, R = 84, Ry = 80, n = 9, a0 = Math.PI * 1.06, a1 = Math.PI * 1.94;
    var P2 = function (a, k) { return [hx + R * k * Math.cos(a), hy + Ry * k * Math.sin(a)]; };
    for (i = 0; i < n; i++) {
      var aa = a0 + (a1 - a0) * i / n, ab = a0 + (a1 - a0) * (i + 1) / n, am = (aa + ab) / 2, p0 = P2(aa, 1), p1 = P2(ab, 1), cm = P2(am, 1.1);
      r += '<path d="M' + hx + ' ' + hy + ' L' + p0[0].toFixed(1) + ' ' + p0[1].toFixed(1) + ' Q' + cm[0].toFixed(1) + ' ' + cm[1].toFixed(1) + ' ' + p1[0].toFixed(1) + ' ' + p1[1].toFixed(1) + ' Z" fill="' + (i % 2 ? hue('peach', 'soft') : hue('rose', 'soft')) + '" stroke="' + hue('peach') + '" stroke-width="2.5" stroke-linejoin="round"/>';
      var h0 = P2(am, .55), h1 = P2(am, .92); r += stroke('M' + h0[0].toFixed(1) + ' ' + h0[1].toFixed(1) + ' L' + h1[0].toFixed(1) + ' ' + h1[1].toFixed(1), N['surface-raised'], 2.5).replace('<path', '<path opacity=".55"');
    }
    for (i = 1; i <= 3; i++) { var k = .3 * i, q0 = P2(a0 + .02, k), q1 = P2(a1 - .02, k), qm = P2(Math.PI * 1.5, k * 1.04); r += stroke('M' + q0[0].toFixed(1) + ' ' + q0[1].toFixed(1) + ' Q' + qm[0].toFixed(1) + ' ' + (qm[1] - 6 * k).toFixed(1) + ' ' + q1[0].toFixed(1) + ' ' + q1[1].toFixed(1), hue('peach'), 1.5).replace('<path', '<path opacity=".5"'); }
    r += circ(100, 18, 5, N['surface-raised']) + circ(98.5, 16.5, 1.6, hue('sky', 'soft'));
    r += rect(14, 62, 172, 30, 14, hue('sky', 'soft')) + circ(46, 60, 12, N['surface-raised']) + circ(43, 56, 3, hue('sky', 'soft')) + rpath('M70 58 H184 V92 H70 Z', hue('sky'), 10);
    r += stroke('M78 74 Q88 66 98 74 T118 74 T138 74 T158 74 T178 74', N['surface-raised'], 3);
    return r + rect(20, 90, 160, 12, 6, hue('peach')) + ell(40, 108, 10, 8, hue('peach', 'deep')) + ell(160, 108, 10, 8, hue('peach', 'deep'));
  };
  /* ---------- 我的家・第 3 階段家具（v2.32.0）：吊燈、燈飾、掛飾、小擺飾、大擺飾、玩具、太空與甜點主題 ---------- */
  var W3 = N['surface-raised'];
  var op = function (svgStr, o) { return svgStr.replace(/^<(\w+)/, '<$1 opacity="' + o + '"'); };
  var ring = function (cx, cy, rx, ry, c, w, extra) { return el('ellipse', Object.assign({ cx: cx, cy: cy, rx: rx, ry: ry, fill: 'none', stroke: c, 'stroke-width': w }, extra)); };
  var arcP = function (cx, cy, r, a0, a1) { var x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0), x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1); return 'M' + x0.toFixed(1) + ' ' + y0.toFixed(1) + ' A' + r + ' ' + r + ' 0 ' + (a1 - a0 > Math.PI ? 1 : 0) + ' 1 ' + x1.toFixed(1) + ' ' + y1.toFixed(1); };
  var wedge = function (cx, cy, r, a0, a1, c) { return '<path d="' + arcP(cx, cy, r, a0, a1) + ' L' + cx + ' ' + cy + ' Z" fill="' + c + '"/>'; };

  /* 吊燈：70×110，從天花板垂下來 */
  P.homeCeiling = function (st) {
    var cordTo = { round: 40, star: 44, jelly: 30, planet: 42, candy: 52 }[st] || 40;
    var r = rect(26, 0, 18, 5, 2.5, hue('stone', 'deep')) + rect(34, 0, 2, cordTo, 1, hue('stone', 'deep'));
    if (st === 'star') return r + rpath(star(35, 70, 27, 12, 5), hue('sun', 'ledge'), 6) + rpath(star(35, 70, 24, 10.5, 5), hue('sun'), 4) + rpath(star(35, 70, 11, 5, 5), hue('sun', 'soft'), 3);
    if (st === 'jelly') {   /* 海洋：水母燈（半透明鐘形傘＋波浪觸手） */
      var j = '', k;
      for (k = 0; k < 6; k++) { var x = 16 + k * 7.6; j += stroke('M' + x.toFixed(1) + ' 58 Q' + (x + 5).toFixed(1) + ' 70 ' + x.toFixed(1) + ' 82 Q' + (x - 5).toFixed(1) + ' 94 ' + x.toFixed(1) + ' 106', k % 2 ? hue('lilac', 'ledge') : hue('rose', 'ledge'), 3); }
      return r + j + rpath('M9 60 Q9 28 35 28 Q61 28 61 60 Q56 55 50 60 Q44 55 39 60 Q35 55 31 60 Q26 55 20 60 Q15 55 9 60 Z', hue('rose'), 4)
        + rpath('M16 50 Q18 36 35 34 Q52 36 54 50 Z', hue('rose', 'soft'), 4).replace('<path', '<path opacity=".7"') + circ(24, 46, 3, W3) + circ(31, 41, 2, W3) + circ(46, 47, 2.4, W3);
    }
    if (st === 'planet') {   /* 太空：行星吊燈（光環前後兩半） */
      return r + stroke('M3 66 A32 8 0 0 1 67 66', hue('sun', 'ledge'), 4) + circ(35, 63, 21, hue('lilac')) + circ(28, 55, 6, hue('lilac', 'ledge')) + circ(44, 72, 4, hue('lilac', 'ledge')) + circ(42, 52, 2.5, hue('lilac', 'soft'))
        + stroke('M3 66 A32 8 0 0 0 67 66', hue('sun'), 4.5);
    }
    if (st === 'candy') {   /* 甜點：糖果燈（包裝糖果＋兩端扭結） */
      return r + rpath('M14 72 L2 60 L4 86 Z', hue('sun'), 5) + rpath('M56 72 L68 60 L66 86 Z', hue('sun'), 5) + ell(35, 72, 22, 17, hue('rose'))
        + stroke('M22 58 Q30 72 22 86', W3, 4) + stroke('M35 55 Q43 72 35 89', W3, 4) + stroke('M48 58 Q56 72 48 86', W3, 4) + ell(28, 64, 5, 3, W3, { opacity: .6 });
    }
    /* round：圓燈罩 */
    return r + rpath('M10 70 Q10 40 35 40 Q60 40 60 70 Z', hue('sun'), 6) + rect(8, 66, 54, 7, 3.5, hue('sun', 'ledge')) + ell(35, 76, 9, 6, hue('sun', 'soft')) + stroke('M18 60 Q20 50 28 46', hue('sun', 'soft'), 3);
  };

  /* 掛畫（掛飾）：70×60，木框＋畫 */
  P.homePic = function (st) {
    var fr = { rocket: hue('lilac', 'ledge'), dolphin: hue('sky', 'ledge'), cake: hue('rose', 'ledge'), cat: hue('peach', 'ledge') }[st] || hue('wood');
    var bg = { rainbow: hue('sky', 'soft'), dino: hue('leaf', 'soft'), rocket: hue('lilac', 'deep'), cat: hue('peach', 'soft'), dolphin: hue('sky', 'soft'), cake: hue('rose', 'soft') }[st] || hue('sky', 'soft');
    var r = rect(0, 0, 70, 60, 8, fr) + rect(6, 6, 58, 48, 5, bg);
    if (st === 'rainbow') {
      [[hue('rose'), 22], [hue('sun'), 17], [hue('mint'), 12], [hue('sky', 'ledge'), 7]].forEach(function (q) { r += stroke('M' + (35 - q[1]) + ' 48 A' + q[1] + ' ' + q[1] + ' 0 0 1 ' + (35 + q[1]) + ' 48', q[0], 5); });
      return r + circ(12, 47, 5, W3) + circ(18, 47, 6, W3) + circ(52, 47, 6, W3) + circ(58, 47, 5, W3) + rect(8, 46, 54, 8, 0, W3);
    }
    if (st === 'dino') {
      return r + rect(6, 44, 58, 10, 0, hue('leaf')) + circ(54, 16, 5, hue('sun'))
        + rpath('M14 40 Q14 30 26 30 H38 Q44 30 46 24 L48 14 Q50 10 54 12 Q56 16 52 18 L50 28 Q48 38 40 40 Z', hue('mint', 'ledge'), 3)
        + rpath('M14 36 L4 40 L14 40 Z', hue('mint', 'ledge'), 3) + rect(20, 38, 5, 8, 2, hue('mint', 'deep')) + rect(34, 38, 5, 8, 2, hue('mint', 'deep'))
        + circ(24, 34, 2, hue('mint')) + circ(32, 33, 2, hue('mint')) + circ(53, 14, 1.2, hue('mint', 'deep'));
    }
    if (st === 'rocket') {
      r += circ(14, 14, 1.4, W3) + circ(56, 12, 1.2, W3) + circ(18, 44, 1.2, W3) + circ(50, 46, 1.6, hue('sun')) + circ(60, 30, 1, W3) + circ(10, 30, 1, hue('sun'));
      return r + '<g transform="rotate(35 35 30)">' + rpath('M30 46 L35 58 L40 46 Z', hue('sun'), 3) + rpath('M28 38 L22 48 L28 46 Z', hue('rose'), 3) + rpath('M42 38 L48 48 L42 46 Z', hue('rose'), 3)
        + rpath('M35 8 Q44 18 43 36 L42 46 H28 L27 36 Q26 18 35 8 Z', W3, 2) + rpath('M35 8 Q40 12 41 18 H29 Q30 12 35 8 Z', hue('rose'), 2) + circ(35, 28, 4.5, hue('sky')) + circ(34, 27, 1.5, W3) + '</g>';
    }
    if (st === 'cat') {
      return r + rpath('M20 24 L18 10 L29 18 Z', hue('sun', 'ledge'), 3) + rpath('M50 24 L52 10 L41 18 Z', hue('sun', 'ledge'), 3) + rpath('M21 20 L20 13 L26 18 Z', hue('rose', 'soft'), 2) + rpath('M49 20 L50 13 L44 18 Z', hue('rose', 'soft'), 2)
        + ell(35, 32, 18, 15, hue('sun', 'ledge')) + ell(35, 38, 8, 5.5, hue('sun', 'soft')) + circ(28, 29, 2.4, hue('bark', 'deep')) + circ(42, 29, 2.4, hue('bark', 'deep')) + rpath('M33 34 H37 L35 36.5 Z', hue('rose'), 1.5)
        + stroke('M14 34 H24 M14 38 L24 37 M56 34 H46 M56 38 L46 37', hue('bark', 'ledge'), 1.2) + stroke('M28 21 L30 25 M35 19 V24 M42 21 L40 25', hue('peach', 'ledge'), 2);
    }
    if (st === 'dolphin') {
      return r + stroke('M6 46 Q12 42 18 46 T30 46 T42 46 T54 46 T66 46', hue('sky', 'ledge'), 3) + rect(6, 47, 58, 7, 0, hue('sky'))
        + rpath('M12 42 Q18 18 42 16 Q52 16 58 22 L52 24 Q44 22 36 28 Q28 36 20 40 Z', hue('sky', 'deep'), 3) + rpath('M34 18 L38 10 L42 17 Z', hue('sky', 'deep'), 2)
        + rpath('M14 40 L6 34 L10 44 Z', hue('sky', 'deep'), 2) + rpath('M26 32 Q36 26 46 24 Q40 30 30 36 Z', hue('sky', 'soft'), 2) + circ(49, 20, 1.4, W3) + circ(22, 14, 2, W3) + circ(18, 9, 1.4, W3);
    }
    if (st === 'cake') {
      return r + ell(35, 48, 22, 4, W3) + rect(16, 32, 38, 15, 3, hue('wood', 'soft')) + rect(16, 38, 38, 3, 1.5, hue('rose', 'ledge'))
        + rpath('M16 34 V30 H54 V34 Q51 38 48 34 Q45 38 42 34 Q39 38 36 34 Q33 38 30 34 Q27 38 24 34 Q21 38 18 34 Z', hue('rose'), 2) + rect(33, 18, 4, 12, 2, hue('sky')) + rpath('M35 10 Q39 15 35 17 Q31 15 35 10 Z', hue('sun'), 2)
        + circ(22, 28, 3, hue('rose', 'deep')) + circ(48, 28, 3, hue('rose', 'deep'));
    }
    return r;
  };

  /* 掛飾：70×90（旗子串、捕夢網、掛鐘） */
  P.homeHang = function (st) {
    if (st === 'bunting') {
      var b = stroke('M2 8 Q35 22 68 8', hue('wood', 'deep'), 2), cs = [hue('rose'), hue('sun'), hue('sky'), hue('mint'), hue('lilac')], i;
      for (i = 0; i < 5; i++) { var x0 = 4 + i * 13, y0 = 8 + 14 * (1 - Math.pow((x0 + 6.5 - 35) / 33, 2)) * .62; b += rpath('M' + x0 + ' ' + (y0 - 1).toFixed(1) + ' L' + (x0 + 12) + ' ' + (y0 - 1).toFixed(1) + ' L' + (x0 + 6) + ' ' + (y0 + 16).toFixed(1) + ' Z', cs[i], 2.5); }
      b += stroke('M6 36 Q35 50 64 36', hue('wood', 'deep'), 2);
      for (i = 0; i < 4; i++) { var x1 = 10 + i * 13.5, y1 = 36 + 14 * (1 - Math.pow((x1 + 6 - 35) / 29, 2)) * .62; b += rpath('M' + x1 + ' ' + (y1 - 1).toFixed(1) + ' L' + (x1 + 12) + ' ' + (y1 - 1).toFixed(1) + ' L' + (x1 + 6) + ' ' + (y1 + 15).toFixed(1) + ' Z', cs[(i + 2) % 5], 2.5); }
      return b + circ(2, 8, 3, hue('wood', 'deep')) + circ(68, 8, 3, hue('wood', 'deep'));
    }
    if (st === 'dream') {   /* 捕夢網（森林） */
      var d = '', k;
      for (k = 0; k < 8; k++) { var a = k * Math.PI / 4; d += stroke('M35 30 L' + (35 + 19 * Math.cos(a)).toFixed(1) + ' ' + (30 + 19 * Math.sin(a)).toFixed(1), hue('wood', 'ledge'), 1.2); }
      d += ring(35, 30, 11, 11, hue('wood', 'ledge'), 1.2) + ring(35, 30, 20, 20, hue('bark'), 4) + circ(35, 30, 3, hue('sky')) + circ(35, 4, 3, hue('bark'));
      [[18, hue('lilac')], [35, hue('rose')], [52, hue('sky')]].forEach(function (q, n) { var top = n === 1 ? 50 : 46; d += rect(q[0] - .6, top, 1.2, 14, .6, hue('bark')) + circ(q[0], top + 12, 2.2, hue('sun')) + ell(q[0], top + 26, 5, 12, q[1]) + stroke('M' + q[0] + ' ' + (top + 16) + ' V' + (top + 37), W3, 1.2); });
      return d;
    }
    if (st === 'clock') {
      var c = circ(35, 44, 30, hue('wood')) + circ(35, 44, 24, W3), t;
      for (t = 0; t < 12; t++) { var an = t * Math.PI / 6; c += circ(35 + 19 * Math.cos(an), 44 + 19 * Math.sin(an), t % 3 ? 1.3 : 2.4, hue('stone', 'deep')); }
      return c + stroke('M35 44 L35 30', hue('bark', 'deep'), 3.2) + stroke('M35 44 L45 49', hue('bark', 'deep'), 3.2) + stroke('M35 44 L26 58', hue('rose'), 1.4) + circ(35, 44, 3, hue('rose')) + circ(35, 12, 3, hue('wood', 'deep'));
    }
    return '';
  };

  /* 小擺飾（放在置物架上）：50×56，底部貼齊 y=56 */
  P.homeSmall = function (st) {
    if (st === 'clock') return rpath('M16 52 L12 56 M34 52 L38 56', hue('stone', 'deep'), 3) + circ(14, 18, 6, hue('sun', 'ledge')) + circ(36, 18, 6, hue('sun', 'ledge')) + circ(25, 36, 17, hue('rose')) + circ(25, 36, 13, W3)
      + stroke('M25 36 V27 M25 36 L31 39', hue('bark', 'deep'), 2.4) + circ(25, 36, 2, hue('rose', 'deep')) + rect(22, 14, 6, 6, 2, hue('rose', 'ledge'));
    if (st === 'globe') return rect(14, 50, 22, 6, 3, hue('wood', 'deep')) + rect(23, 40, 4, 12, 2, hue('wood', 'deep')) + stroke('M10 34 A17 17 0 0 0 40 34', hue('sun', 'ledge'), 2.5) + circ(25, 22, 15, hue('sky'))
      + rpath('M16 14 Q22 10 26 16 Q22 22 18 22 Z', hue('leaf'), 2) + rpath('M28 24 Q34 20 36 28 Q32 34 28 32 Z', hue('leaf'), 2) + ell(20, 30, 4, 2.4, hue('leaf'));
    if (st === 'fish') return ell(25, 54, 16, 2.4, hue('stone', 'soft')) + rpath('M10 18 H40 Q48 30 44 44 Q40 54 25 54 Q10 54 6 44 Q2 30 10 18 Z', hue('sky', 'soft'), 2) + rpath('M7 30 H43 Q46 40 42 47 Q38 53 25 53 Q12 53 8 47 Q4 40 7 30 Z', hue('sky'), 1)
      + ell(25, 18, 15, 3, hue('sky', 'ledge')) + ell(22, 40, 6, 4, hue('peach')) + rpath('M28 40 L34 35 L34 45 Z', hue('peach'), 2) + circ(19.5, 39, 1.2, hue('bark', 'deep')) + circ(14, 50, 2.5, hue('stone')) + circ(20, 51, 2, hue('sun', 'ledge')) + circ(34, 50, 2.5, hue('stone'))
      + circ(30, 30, 1.8, W3) + circ(33, 24, 1.2, W3) + stroke('M38 52 Q34 44 38 36', hue('leaf', 'deep'), 2.4);
    if (st === 'snow') return rpath('M10 44 H40 L42 56 H8 Z', hue('wood'), 3) + circ(25, 26, 18, hue('sky', 'soft')) + ell(25, 40, 15, 5, W3) + circ(25, 34, 5, W3) + circ(25, 26, 4, W3) + circ(24, 25, .8, hue('bark', 'deep')) + circ(26.4, 25, .8, hue('bark', 'deep'))
      + rpath('M26 27 L29 28 L26 28.6 Z', hue('peach'), 1) + rpath('M14 38 L18 26 L22 38 Z', hue('leaf', 'deep'), 2) + circ(12, 16, 1.4, W3) + circ(34, 14, 1.4, W3) + circ(38, 26, 1.2, W3) + circ(20, 12, 1, W3) + ell(18, 16, 4, 6, W3, { opacity: .45 });
    if (st === 'hourglass') return rect(10, 6, 30, 6, 3, hue('wood', 'deep')) + rect(10, 50, 30, 6, 3, hue('wood', 'deep')) + rect(12, 10, 3, 42, 1.5, hue('wood')) + rect(35, 10, 3, 42, 1.5, hue('wood'))
      + rpath('M16 12 H34 Q34 26 26 31 Q34 36 34 50 H16 Q16 36 24 31 Q16 26 16 12 Z', hue('sky', 'soft'), 1.5) + rpath('M19 20 H31 Q30 26 25 30 Q20 26 19 20 Z', hue('sun', 'ledge'), 1) + rpath('M17 50 Q20 40 25 39 Q30 40 33 50 Z', hue('sun', 'ledge'), 1) + rect(24.5, 30, 1, 10, .5, hue('sun', 'ledge'));
    if (st === 'trophy') return rect(12, 48, 26, 8, 3, hue('wood', 'deep')) + rect(16, 44, 18, 6, 2, hue('sun', 'ledge')) + rect(22, 32, 6, 14, 2, hue('sun', 'ledge'))
      + stroke('M12 12 Q2 14 6 24 Q9 30 16 30', hue('sun', 'ledge'), 3) + stroke('M38 12 Q48 14 44 24 Q41 30 34 30', hue('sun', 'ledge'), 3) + rpath('M10 8 H40 Q40 32 25 34 Q10 32 10 8 Z', hue('sun'), 3) + rpath(star(25, 19, 6, 2.6, 5), hue('sun', 'soft'), 1.5);
    if (st === 'dino') return rect(8, 52, 34, 4, 2, hue('stone')) + rpath('M8 44 Q12 30 22 30 L30 30 L30 18 Q30 8 38 8 Q46 8 46 16 Q46 20 40 20 L38 22 L36 34 Q36 46 28 46 Z', hue('leaf', 'ledge'), 3)
      + rpath('M10 42 L2 50 L14 46 Z', hue('leaf', 'ledge'), 2) + rect(18, 44, 5, 9, 2, hue('leaf', 'deep')) + rect(28, 44, 5, 9, 2, hue('leaf', 'deep')) + stroke('M36 26 L40 28', hue('leaf', 'deep'), 2.4) + circ(40, 13, 1.4, hue('bark', 'deep'))
      + rpath('M16 30 L18 26 L21 30 M23 30 L25 26 L28 30', hue('sun', 'ledge'), 2) + stroke('M40 18 H45', hue('leaf', 'deep'), 1.4);
    if (st === 'cactus') return rpath('M12 40 H38 L35 56 H15 Z', hue('peach'), 3) + rect(10, 38, 30, 6, 3, hue('peach', 'ledge')) + rect(19, 10, 12, 30, 6, hue('leaf', 'ledge')) + stroke('M19 28 Q10 28 10 18', hue('leaf', 'ledge'), 6) + stroke('M31 24 Q40 24 40 14', hue('leaf', 'ledge'), 6)
      + stroke('M25 14 V36', hue('leaf', 'deep'), 1).replace('<path', '<path opacity=".5"') + circ(25, 9, 3.4, hue('rose')) + circ(25, 9, 1.4, hue('sun'));
    return '';
  };

  /* 大擺飾（放在地上）：70×150，底部貼齊 y=150 */
  P.homeBigDeco = function (st) {
    if (st === 'sunflower') {
      var s = rect(34, 40, 4, 76, 2, hue('leaf', 'deep')) + ell(22, 84, 13, 6, hue('leaf'), { transform: 'rotate(-30 22 84)' }) + ell(50, 70, 13, 6, hue('leaf', 'ledge'), { transform: 'rotate(30 50 70)' }), k;
      for (k = 0; k < 14; k++) { var a = k * Math.PI / 7; s += ell(36 + 18 * Math.cos(a), 30 + 18 * Math.sin(a), 8, 4.5, k % 2 ? hue('sun') : hue('sun', 'ledge'), { transform: 'rotate(' + (k * 180 / 7) + ' ' + (36 + 18 * Math.cos(a)).toFixed(1) + ' ' + (30 + 18 * Math.sin(a)).toFixed(1) + ')' }); }
      s += circ(36, 30, 12, hue('bark')) + circ(32, 27, 1.6, hue('bark', 'ledge')) + circ(38, 33, 1.6, hue('bark', 'ledge')) + circ(40, 25, 1.6, hue('bark', 'ledge'));
      return s + rpath('M14 112 H58 L52 148 H20 Z', hue('sky', 'ledge'), 6) + rect(10, 106, 52, 12, 6, hue('sky'));
    }
    if (st === 'coral') {   /* 海洋：珊瑚（分枝＋石頭底座＋小魚） */
      var c = rpath('M8 150 Q6 128 24 126 Q36 118 48 126 Q66 128 64 150 Z', hue('stone'), 4);
      c += stroke('M30 128 Q28 96 18 76 M24 104 Q10 98 8 80 M28 90 Q38 74 34 54 M18 76 Q16 60 22 46', hue('rose'), 7);
      c += stroke('M42 128 Q46 100 56 84 M50 108 Q62 104 64 90 M54 92 Q52 72 58 60', hue('peach', 'ledge'), 7);
      c += circ(22, 46, 5, hue('rose')) + circ(34, 54, 5, hue('rose')) + circ(8, 80, 5, hue('rose')) + circ(58, 60, 5, hue('peach', 'ledge')) + circ(64, 90, 5, hue('peach', 'ledge'));
      return c + ell(40, 34, 7, 4.5, hue('sun')) + rpath('M46 34 L52 30 L52 38 Z', hue('sun'), 2) + circ(37, 33, 1, hue('bark', 'deep')) + circ(14, 112, 2.4, hue('sky', 'soft')) + circ(18, 104, 1.6, hue('sky', 'soft'));
    }
    if (st === 'clock') {   /* 落地鐘 */
      return rpath('M14 22 Q14 4 35 4 Q56 4 56 22 Z', hue('wood', 'deep'), 4) + rect(12, 20, 46, 124, 6, hue('wood', 'deep')) + rect(10, 140, 50, 10, 4, hue('bark'))
        + circ(35, 36, 15, W3) + stroke('M35 36 V26 M35 36 L42 40', hue('bark', 'deep'), 2.6) + circ(35, 36, 2, hue('rose')) + rect(20, 58, 30, 76, 6, hue('wood', 'soft'))
        + rect(34, 60, 2, 50, 1, hue('sun', 'deep')) + circ(35, 112, 8, hue('sun', 'ledge')) + circ(33, 110, 2.5, hue('sun', 'soft'));
    }
    if (st === 'globe') {   /* 大地球儀（三腳架） */
      return stroke('M35 104 L16 148 M35 104 L54 148 M35 104 V148', hue('wood', 'deep'), 5) + rect(24, 98, 22, 8, 4, hue('wood', 'deep')) + stroke('M8 56 A28 28 0 0 0 62 56', hue('sun', 'ledge'), 4) + stroke('M35 18 V96', hue('sun', 'ledge'), 3)
        + circ(35, 54, 26, hue('sky')) + rpath('M18 40 Q28 30 36 38 Q34 50 24 52 Q16 50 18 40 Z', hue('leaf'), 3) + rpath('M40 56 Q50 50 56 58 Q54 72 44 74 Q38 66 40 56 Z', hue('leaf'), 3) + ell(28, 66, 5, 3, hue('leaf')) + ell(46, 36, 4, 2.4, hue('leaf'))
        + ell(26, 42, 6, 10, W3, { opacity: .35, transform: 'rotate(30 26 42)' });
    }
    if (st === 'dino') {   /* 稀有：恐龍模型（長脖子、斑點、底座） */
      return rect(4, 140, 62, 10, 5, hue('wood', 'deep')) + rect(8, 136, 54, 6, 3, hue('wood'))
        + rpath('M8 112 Q8 88 28 86 L40 86 Q44 86 46 80 L50 30 Q50 14 60 14 Q68 14 66 24 Q64 28 58 28 L56 84 Q56 112 44 114 Z', hue('mint', 'ledge'), 4)
        + rpath('M10 108 Q4 112 2 124 Q8 116 14 116 Z', hue('mint', 'ledge'), 3) + rect(14, 108, 9, 30, 4, hue('mint', 'deep')) + rect(40, 108, 9, 30, 4, hue('mint', 'deep'))
        + circ(22, 96, 4, hue('mint')) + circ(34, 92, 3, hue('mint')) + circ(30, 104, 3.4, hue('mint')) + circ(53, 54, 2.6, hue('mint')) + circ(52, 70, 2.6, hue('mint'))
        + circ(61, 19, 1.8, hue('bark', 'deep')) + stroke('M62 24 Q64 25 66 23', hue('mint', 'deep'), 1.4) + ell(56, 22, 2.6, 1.6, hue('rose', 'soft'));
    }
    return '';
  };

  /* 玩具（放在地上）：80×70，底部貼齊 y=70（v2.33.1：積木、機器人、玩具火車） */
  P.homeToy = function (st) {
    if (st === 'robot') {   /* 太空：鐵皮機器人（螢幕臉、天線、彈簧脖子、胸前儀表、關節、鉗子手、靴子） */
      var m = hue('stone'), ml = hue('stone', 'ledge'), md = hue('stone', 'deep'), ms = hue('stone', 'soft'), o = '';
      o += ell(40, 68.5, 22, 2.4, hue('stone', 'soft'));
      o += rect(24, 61, 14, 8, 3, md) + rect(42, 61, 14, 8, 3, md) + rect(27, 50, 8, 12, 2, ml) + rect(45, 50, 8, 12, 2, ml) + circ(31, 54, 2.4, md) + circ(49, 54, 2.4, md);
      o += stroke('M22 37 Q15 40 14 47', ml, 5) + stroke('M58 37 Q65 40 66 47', ml, 5) + circ(22, 37, 3.4, md) + circ(58, 37, 3.4, md) + circ(14, 47, 2.6, md) + circ(66, 47, 2.6, md);
      o += rpath('M10 49 L12 56 M18 49 L16 56', md, 2.6) + rpath('M62 49 L64 56 M70 49 L68 56', md, 2.6);
      o += rect(22, 31, 36, 21, 6, hue('sky')) + rect(50, 31, 8, 21, 4, hue('sky', 'ledge'), { opacity: .6 }) + rect(27, 35, 22, 12, 3, ms);
      o += circ(33, 41, 3.6, W3) + stroke('M33 41 L35 38.8', hue('rose'), 1.4) + rect(39, 37.5, 7, 2.4, 1.2, hue('mint', 'ledge')) + rect(39, 41, 7, 2.4, 1.2, hue('sun', 'ledge')) + rect(39, 44.5, 4, 2.4, 1.2, hue('rose'));
      [[24.5, 33.5], [55.5, 33.5], [24.5, 49.5], [55.5, 49.5]].forEach(function (q) { o += circ(q[0], q[1], 1, md); });
      o += rect(34, 27, 12, 5, 1.5, md) + stroke('M35 28.4 H45 M35 30.6 H45', ml, .9);
      o += rect(22, 6, 36, 22, 7, m) + rect(50, 6, 8, 22, 5, ml, { opacity: .55 }) + rect(26, 10, 28, 13, 5, hue('sky', 'deep'));
      o += ell(33, 16.5, 3.6, 3, hue('mint')) + ell(47, 16.5, 3.6, 3, hue('mint')) + ell(33, 16.5, 1.6, 1.4, W3) + ell(47, 16.5, 1.6, 1.4, W3) + stroke('M36 20.6 Q40 22.4 44 20.6', hue('mint'), 1.3);
      o += rect(18, 12, 5, 10, 2.5, hue('rose')) + rect(57, 12, 5, 10, 2.5, hue('rose')) + rect(38.5, 1.5, 3, 6, 1.5, md) + circ(40, 2.4, 3, hue('sun')) + circ(39, 1.6, .9, W3);
      return o;
    }
    if (st === 'blocks') {
      var cube = function (x, y, s, c, mark) { return rpath('M' + x + ' ' + (y + 5) + ' L' + (x + 5) + ' ' + y + ' H' + (x + s + 5) + ' L' + (x + s) + ' ' + (y + 5) + ' Z', hue(c, 'soft'), 1.5) + rpath('M' + (x + s) + ' ' + (y + 5) + ' L' + (x + s + 5) + ' ' + y + ' V' + (y + s) + ' L' + (x + s) + ' ' + (y + s + 5) + ' Z', hue(c, 'ledge'), 1.5) + rect(x, y + 5, s, s, 3, hue(c)) + mark; };
      return cube(6, 44, 21, 'sky', circ(16.5, 59.5, 5, W3)) + cube(32, 44, 21, 'rose', rpath(star(42.5, 59.5, 6, 2.6, 5), W3, 1.5)) + cube(19, 18, 21, 'sun', rpath('M24 39 L29.5 28 L35 39 Z', W3, 2))
        + cube(56, 50, 15, 'mint', rect(60, 59, 7, 7, 1.5, W3));
    }
    if (st === 'train') {
      return rect(4, 58, 74, 3, 1.5, hue('wood', 'ledge')) + rect(4, 36, 30, 20, 4, hue('sun')) + rect(8, 40, 22, 6, 2, hue('sun', 'soft'))
        + rect(38, 28, 22, 28, 4, hue('rose')) + rect(42, 32, 14, 10, 3, hue('sky', 'soft')) + rect(58, 40, 18, 16, 4, hue('rose', 'ledge')) + rect(64, 26, 7, 14, 2, hue('stone', 'deep')) + rect(36, 24, 26, 6, 3, hue('rose', 'deep'))
        + rect(32, 48, 8, 3, 1.5, hue('stone', 'deep')) + circ(12, 58, 6, hue('stone', 'deep')) + circ(26, 58, 6, hue('stone', 'deep')) + circ(46, 58, 7, hue('stone', 'deep')) + circ(66, 58, 6, hue('stone', 'deep'))
        + circ(12, 58, 2, hue('stone')) + circ(26, 58, 2, hue('stone')) + circ(46, 58, 2.4, hue('stone')) + circ(66, 58, 2, hue('stone')) + circ(70, 18, 5, W3) + circ(76, 10, 3.6, W3);
    }
    return '';
  };

  /* 寵物（放在地上，取代第 2 個玩具位置）：90×72，坐著、臉朝左（朝房間中間） */
  P.homePet = function (st) {
    var dog = st === 'blackdog' || st === 'whitedog', r = ell(48, 70, 30, 2.6, hue('stone', 'soft'));
    if (!dog) {
      var sia = st === 'siamese';
      var base = sia ? hue('sun', 'soft') : hue('peach', 'ledge'), shade = sia ? hue('wood', 'soft') : hue('peach', 'deep'), point = sia ? hue('bark', 'ledge') : base, light = sia ? W3 : hue('peach', 'soft');
      var eye = sia ? hue('sky') : hue('leaf', 'ledge');
      /* 尾巴（從右後方繞上來） */
      r += stroke('M66 64 Q84 64 84 48 Q84 38 77 36', sia ? point : base, 7.5);
      if (!sia) r += stroke('M80.5 58.5 L84.8 55 M83.8 47 L78.8 46.6', shade, 2.4).replace('<path', '<path opacity=".55"');
      /* 身體、胸口、後腿 */
      r += rpath('M30 70 Q26 46 40 37 Q50 32 60 37 Q74 46 70 70 Z', base, 3) + ell(64, 60, 10, 10, base) + ell(66, 61, 7, 7, shade, { opacity: .2 });
      r += rpath('M38 46 Q44 42 50 46 Q52 58 44 62 Q36 58 38 46 Z', light, 2).replace('<path', sia ? '<path opacity=".55"' : '<path');
      if (!sia) r += stroke('M56 42 Q61 46 60 52 M60 40 Q66 46 66 52 M52 44 Q56 48 55 54', shade, 2.2).replace('<path', '<path opacity=".55"');
      /* 前腳 */
      r += rect(36, 54, 8, 16, 4, base) + rect(47, 54, 8, 16, 4, base) + ell(40, 69, 5, 2.8, sia ? point : light) + ell(51, 69, 5, 2.8, sia ? point : light);
      r += stroke('M39 68 V70 M41.5 68 V70 M50 68 V70 M52.5 68 V70', shade, .8).replace('<path', '<path opacity=".6"');
      /* 頭 */
      r += rpath('M30 22 L28 4 L42 14 Z', sia ? point : base, 4) + rpath('M54 14 L64 3 L64 21 Z', sia ? point : base, 4) + rpath('M31.6 18 L31 8.6 L38.4 14 Z', hue('rose', 'soft'), 2) + rpath('M56.6 14 L61.4 8 L61.6 18 Z', hue('rose', 'soft'), 2);
      r += ell(46, 26, 18, 15, base) + ell(52, 28, 11, 10, shade, { opacity: .12 });
      if (sia) r += ell(44, 31, 10.5, 8.5, point, { opacity: .9 });
      else r += stroke('M42 12.6 L43 18 M46 12 V17.6 M50 12.6 L49 18', shade, 2) + stroke('M28.6 24 H33 M29 28 H33.6 M59 24 H63.6 M58.6 28 H63', shade, 1.8).replace('<path', '<path opacity=".6"');
      r += ell(44, 32, 7, 4.6, sia ? point : light);
      r += ell(38, 24.5, 3.6, 4, eye) + ell(52, 24.5, 3.6, 4, eye) + ell(38, 24.8, 1.2, 3.2, hue('bark', 'deep')) + ell(52, 24.8, 1.2, 3.2, hue('bark', 'deep')) + circ(37, 23.2, 1, W3) + circ(51, 23.2, 1, W3);
      r += rpath('M42.4 29.4 H47.6 L45 32.2 Z', hue('rose'), 1.4) + stroke('M45 32.2 V33.6 M45 33.6 Q43 35.6 41.4 34.2 M45 33.6 Q47 35.6 48.6 34.2', hue('bark', 'deep'), 1);
      r += stroke('M37 31.6 L24 30 M37 33.4 L25 35.4 M53 31.6 L66 30 M53 33.4 L65 35.4', sia ? hue('stone') : hue('peach', 'soft'), .9);
      if (!sia) r += ell(33, 31, 2.8, 1.6, hue('rose', 'soft')) + ell(57, 31, 2.8, 1.6, hue('rose', 'soft'));
      return r;
    }
    var blk = st === 'blackdog';
    var db = blk ? N.ink : W3, ds = blk ? N['ink-soft'] : hue('stone', 'soft'), dl = blk ? N['ink-faint'] : hue('stone'), ear = blk ? N.ink : hue('wood', 'ledge');
    var chest = blk ? W3 : hue('stone', 'soft'), nose = blk ? hue('bark', 'deep') : N.ink;
    /* 尾巴（往上翹） */
    r += stroke('M68 62 Q82 60 84 46 Q85 40 82 36', db, 6.5) + (blk ? '' : stroke('M68 62 Q82 60 84 46', dl, 1.4).replace('<path', '<path opacity=".5"'));
    /* 身體、後腿、胸口 */
    r += rpath('M28 70 Q26 46 40 38 H56 Q72 46 72 70 Z', db, 3) + ell(66, 60, 11, 10, db) + ell(66, 60, 8, 7, ds, { opacity: blk ? .5 : .55 });
    r += rpath('M38 44 Q46 40 54 44 Q54 58 46 64 Q38 58 38 44 Z', chest, 2);
    /* 前腳 */
    r += rect(34, 52, 9, 18, 4.5, db) + rect(48, 52, 9, 18, 4.5, db) + ell(38.5, 69, 5.6, 2.8, blk ? N['ink-soft'] : hue('stone', 'soft')) + ell(52.5, 69, 5.6, 2.8, blk ? N['ink-soft'] : hue('stone', 'soft'));
    r += stroke('M37 68 V70 M40 68 V70 M51 68 V70 M54 68 V70', blk ? N['ink-faint'] : hue('stone'), .8);
    /* 項圈 */
    r += rpath('M33 39 Q46 45 59 39 L59 43 Q46 49 33 43 Z', hue('rose'), 1.5) + circ(46, 48, 3.4, hue('sun')) + circ(46, 48, 1.4, hue('sun', 'ledge'));
    /* 頭 */
    r += ell(46, 24, 17, 15, db) + (blk ? '' : ell(52, 26, 10, 9, hue('stone', 'soft'), { opacity: .5 }));
    if (!blk) r += ell(53, 21, 6.5, 6, hue('wood', 'ledge'));
    r += ell(30, 26, 6, 11, ear, { transform: 'rotate(18 30 26)' }) + ell(62, 26, 6, 11, ear, { transform: 'rotate(-18 62 26)' });
    r += ell(44, 31, 10, 7.6, blk ? N['ink-soft'] : hue('stone', 'soft')) + ell(44, 32, 8, 6, blk ? N['ink-soft'] : W3);
    r += ell(44, 27.6, 4, 2.8, nose) + ell(43, 26.8, 1.3, .7, W3, { opacity: .7 });
    r += stroke('M44 30.4 V32.6 M44 32.6 Q41.6 35 39.6 33.4 M44 32.6 Q46.4 35 48.4 33.4', nose, 1.2) + rpath('M42.4 34.2 Q44 39 45.6 34.2 Z', hue('rose'), 1.2);
    r += circ(37.5, 21.5, 2.8, hue('bark', 'deep')) + circ(52.5, 21.5, 2.8, hue('bark', 'deep')) + circ(36.6, 20.6, 1, W3) + circ(51.6, 20.6, 1, W3);
    r += stroke('M34.5 17 Q37.5 15.6 40 17 M50 17 Q52.5 15.6 55.5 17', blk ? N['ink-faint'] : hue('stone', 'deep'), 1.2);
    if (!blk) r += ell(34, 29, 2.6, 1.6, hue('rose', 'soft')) + ell(54, 29, 2.6, 1.6, hue('rose', 'soft'));
    return r;
  };

  /* 火箭床（太空，稀有）：200×130 */
  P.homeBedRocket = function () {
    var r = rpath('M0 84 L14 76 L14 104 Z', hue('sun'), 5) + rpath('M4 88 L14 84 L14 96 Z', hue('peach'), 3)
      + rpath('M24 68 L8 44 L40 60 Z', hue('rose'), 5) + rpath('M24 112 L8 128 L40 112 Z', hue('rose'), 5)
      + rpath('M14 62 H150 Q194 62 196 90 Q194 118 150 118 H14 Z', W3, 6) + rpath('M150 62 Q194 62 196 90 Q194 118 150 118 Z', hue('rose'), 6)
      + rect(14, 98, 140, 6, 3, hue('stone')) + circ(60, 90, 8, hue('sky', 'ledge')) + circ(60, 90, 5, hue('sky', 'soft')) + circ(92, 90, 8, hue('sky', 'ledge')) + circ(92, 90, 5, hue('sky', 'soft')) + circ(124, 90, 8, hue('sky', 'ledge')) + circ(124, 90, 5, hue('sky', 'soft'));
    r += rect(22, 44, 140, 20, 9, hue('lilac', 'soft')) + ell(44, 44, 18, 9, W3) + rpath('M70 40 H158 V64 H70 Z', hue('lilac'), 8) + rpath(star(96, 52, 5, 2.2, 5), hue('sun'), 1.5) + rpath(star(130, 50, 4, 1.8, 5), hue('sun'), 1.5) + circ(146, 56, 1.6, W3) + circ(112, 58, 1.4, W3);
    return r + rect(36, 118, 12, 12, 4, hue('stone', 'deep')) + rect(140, 118, 12, 12, 4, hue('stone', 'deep'));
  };
  /* 蛋糕床（甜點，稀有）：200×120 */
  P.homeBedCake = function () {
    var r = rect(4, 10, 34, 100, 14, hue('rose')) + circ(21, 10, 7, hue('rose', 'deep')) + stroke('M21 4 Q24 1 28 2', hue('leaf', 'deep'), 2), k;
    for (k = 0; k < 4; k++) r += circ(12 + (k % 2) * 18, 30 + k * 18, 3.4, W3);
    r += rect(14, 78, 182, 30, 8, hue('wood', 'soft')) + rect(14, 92, 182, 5, 2.5, hue('rose', 'ledge'));
    r += rpath('M14 82 V70 H196 V82 Q190 90 184 82 Q178 90 172 82 Q166 90 160 82 Q154 90 148 82 Q142 90 136 82 Q130 90 124 82 Q118 90 112 82 Q106 90 100 82 Q94 90 88 82 Q82 90 76 82 Q70 90 64 82 Q58 90 52 82 Q46 90 40 82 Q34 90 28 82 Q22 90 14 82 Z', W3, 3);
    r += rect(40, 54, 154, 18, 8, hue('sun', 'soft')) + ell(62, 54, 16, 8, W3) + rpath('M86 50 H190 V72 H86 Z', hue('rose', 'soft'), 8);
    [[100, 'sky'], [116, 'sun'], [132, 'mint'], [150, 'lilac'], [168, 'rose']].forEach(function (q, n) { r += rect(q[0], 56 + (n % 2) * 6, 7, 3, 1.5, hue(q[1], q[1] === 'rose' ? 'ledge' : 'base'), { transform: 'rotate(' + (n % 2 ? 25 : -25) + ' ' + q[0] + ' 58)' }); });
    return r + circ(186, 46, 6, hue('rose', 'deep')) + rect(24, 106, 12, 14, 4, hue('wood', 'deep')) + rect(176, 106, 12, 14, 4, hue('wood', 'deep'));
  };
  /* 家具店：木頭店面（鋸齒屋頂、大櫥窗裡擺沙發與立燈、木招牌板、雙開門）；220×290 */
  P.townFurniture = function (st) {
    var w = win(st), r = '', i;
    for (i = 0; i < 5; i++) r += rpath('M' + (14 + i * 40) + ' 92 L' + (34 + i * 40) + ' 52 L' + (54 + i * 40) + ' 92 Z', i % 2 ? hue('wood', 'deep') : hue('wood'), 6);
    r += rect(8, 88, 204, 16, 6, hue('wood', 'ledge'));
    r += rect(16, 100, 188, 180, 12, hue('wood', 'soft'));
    for (i = 0; i < 8; i++) r += rect(16, 112 + i * 21, 188, 3, 1.5, hue('wood')).replace('<rect', '<rect opacity=".45"');
    r += rect(60, 104, 100, 22, 8, hue('wood', 'deep')) + rect(66, 109, 88, 12, 5, hue('wood'));
    r += rect(26, 136, 112, 82, 10, hue('wood', 'deep')) + rect(32, 142, 100, 70, 7, w);
    r += rect(46, 178, 60, 22, 9, hue('rose')) + rect(42, 170, 16, 30, 7, hue('rose', 'deep')) + rect(94, 170, 16, 30, 7, hue('rose', 'deep')) + rect(56, 172, 40, 12, 6, hue('rose', 'soft'));
    r += rpath('M114 156 L128 156 L124 146 L118 146 Z', hue('sun'), 3) + rect(120, 156, 3, 44, 1.5, hue('stone', 'deep')) + rect(114, 198, 15, 4, 2, hue('stone', 'deep'));
    r += rect(148, 150, 48, 128, 10, hue('wood', 'deep')) + rect(152, 156, 19, 118, 6, hue('wood')) + rect(173, 156, 19, 118, 6, hue('wood')) + circ(167, 216, 3, hue('sun', 'deep')) + circ(177, 216, 3, hue('sun', 'deep'));
    r += rect(26, 226, 112, 48, 10, hue('wood')) + rpath('M40 250 H70 V268 H40 Z', hue('sun', 'soft'), 4) + rpath('M82 244 H126 V268 H82 Z', hue('mint', 'soft'), 4);
    r += rect(10, 276, 200, 12, 6, hue('wood', 'ledge'));
    return r;
  };
  /* 自畫像的畫框（中間透明，角色頭像另外畫在後面）：70×70 */
  P.homeFrame = function () {
    return el('path', { d: rrPath(0, 0, 70, 70, 8) + ' ' + rrPath(7, 7, 56, 56, 5), fill: hue('sun', 'deep'), 'fill-rule': 'evenodd' })
      + circ(35, 3, 3, hue('sun'));
  };

  /* 美術館：白色古典建築（三角山牆裡掛一幅畫、四根柱子、寬台階、拱門、兩側掛展覽布條）；220×290 */
  P.townGallery = function (st) {
    var w = win(st), f = N['surface-raised'], r = '';
    r += rpath('M14 86 L110 22 L206 86 Z', hue('stone', 'soft'), 10) + rpath('M40 80 L110 36 L180 80 Z', f, 6);
    r += rect(86, 46, 48, 32, 4, hue('sun', 'deep')) + rect(90, 50, 40, 24, 3, hue('sky', 'soft')) + circ(120, 57, 4, hue('sun')) + rpath('M90 74 L104 60 L114 68 L122 62 L130 74 Z', hue('leaf'), 2);
    r += rect(10, 84, 200, 16, 6, hue('stone', 'ledge')) + rect(16, 96, 188, 10, 4, hue('stone', 'soft'));
    r += rect(22, 106, 176, 152, 0, f);
    [34, 70, 136, 172].forEach(function (x) { r += rect(x - 9, 106, 18, 150, 4, hue('stone', 'soft')) + rect(x - 2, 112, 4, 138, 2, hue('stone'), { opacity: .5 }) + rect(x - 12, 104, 24, 8, 3, hue('stone', 'ledge')) + rect(x - 12, 250, 24, 8, 3, hue('stone', 'ledge')); });
    r += rect(46, 120, 14, 72, 4, hue('rose')) + rpath('M46 190 L53 182 L60 190 Z', hue('rose', 'deep'), 2) + rect(160, 120, 14, 72, 4, hue('lilac')) + rpath('M160 190 L167 182 L174 190 Z', hue('lilac', 'deep'), 2);
    r += rect(84, 128, 16, 22, 4, w) + rect(120, 128, 16, 22, 4, w);
    r += rect(8, 256, 204, 10, 4, hue('stone', 'ledge')) + rect(0, 264, 220, 10, 4, hue('stone', 'soft')) + rect(-6, 272, 232, 12, 5, hue('stone', 'ledge'));
    r += archDoor(110, 256, 40, 74, hue('wood', 'deep'));
    return r;
  };
  /* 美術館展廳：出口的大木門（雙開、拱形、門上有綠色出口燈）；160×230 */
  P.galleryDoor = function () {
    var r = '', d = 'M20 230 V90 Q20 20 80 20 Q140 20 140 90 V230 Z';
    r += rpath('M8 230 V86 Q8 6 80 6 Q152 6 152 86 V230 Z', hue('stone', 'soft'), 8);
    r += rpath(d, hue('wood', 'deep'), 6) + rect(78, 26, 4, 204, 2, hue('wood', 'ledge'));
    r += rect(30, 100, 40, 54, 8, hue('wood'), { opacity: .7 }) + rect(90, 100, 40, 54, 8, hue('wood'), { opacity: .7 }) + rect(30, 166, 40, 52, 8, hue('wood'), { opacity: .7 }) + rect(90, 166, 40, 52, 8, hue('wood'), { opacity: .7 });
    r += circ(70, 160, 4.5, hue('sun')) + circ(90, 160, 4.5, hue('sun'));
    r += rect(54, 34, 52, 22, 8, hue('mint', 'deep')) + rpath('M64 45 L74 38 L74 52 Z', N['surface-raised'], 2) + rect(74, 43, 22, 4, 2, N['surface-raised']);
    return r;
  };
  /* 美術館展廳：長椅；200×60 */
  P.galleryBench = function () {
    return rect(0, 10, 200, 18, 9, hue('wood')) + rect(4, 10, 192, 6, 3, hue('wood', 'soft')) + rect(16, 26, 12, 34, 4, hue('stone', 'deep')) + rect(172, 26, 12, 34, 4, hue('stone', 'deep'));
  };
  /* 美術館展廳：紅龍柱圍欄（兩根金柱＋紅絨繩）；150×80 */
  P.galleryRope = function () {
    var g = hue('sun', 'deep');
    return el('path', { d: 'M18 22 Q75 50 132 22', fill: 'none', stroke: hue('rose', 'deep'), 'stroke-width': 7, 'stroke-linecap': 'round' })
      + rect(12, 14, 12, 58, 6, g) + circ(18, 12, 8, hue('sun')) + rect(4, 70, 28, 10, 5, g)
      + rect(126, 14, 12, 58, 6, g) + circ(132, 12, 8, hue('sun')) + rect(118, 70, 28, 10, 5, g);
  };
  /* 美術館展廳：畫作上方的銅色投射燈；60×30 */
  P.galleryLamp = function () {
    return rect(26, 0, 8, 10, 3, hue('sun', 'deep')) + rpath('M8 14 Q30 4 52 14 L48 24 Q30 18 12 24 Z', hue('sun', 'deep'), 4) + ell(30, 24, 18, 4, hue('sun', 'soft'));
  };
  /* 照相館：三腳架相機 80×150（鏡頭朝左，面向客人） */
  P.photoCamera = function () {
    var leg = hue('stone', 'deep');
    return stroke('M40 58 L12 146', leg, 6) + stroke('M40 58 L68 146', leg, 6) + stroke('M40 58 L40 146', leg, 6) + rect(30, 52, 20, 10, 4, leg)
      + rect(14, 14, 56, 40, 10, hue('stone')) + rect(22, 6, 22, 12, 5, hue('stone', 'deep')) + rect(56, 8, 10, 8, 3, hue('sun'))
      + circ(36, 34, 15, hue('stone', 'deep')) + circ(36, 34, 10, hue('sky', 'deep')) + circ(32, 30, 3.5, hue('sky', 'soft'))
      + rect(14, 24, 56, 5, 2.5, hue('mint'));
  };
  /* 照相館：柔光傘燈 90×160 */
  P.photoLight = function () {
    var pole = hue('stone', 'deep');
    return rpath('M8 52 Q45 -6 82 52 Q45 40 8 52 Z', N['surface-raised'], 6)
      + stroke('M8 52 Q45 40 82 52', hue('stone', 'soft'), 4) + stroke('M45 8 L45 50', hue('stone', 'soft'), 3)
      + circ(45, 54, 8, hue('sun', 'soft')) + stroke('M45 60 L45 150', pole, 5) + stroke('M45 150 L22 158', pole, 5) + stroke('M45 150 L68 158', pole, 5);
  };

  /* ---------- 蟑螂數獨道具 ---------- */
  /* 超神拖鞋 slipper（48×48）：可愛室內拖鞋，支援 idle / slap / lift 狀態 */
  P.slipper = function (s) {
    var sole = rpath('M15 10 C15 4 33 4 33 10 C33 22 35 30 32 40 C29 45 19 45 16 40 C13 30 15 22 15 10 Z', hue('sky', 'ledge'))
             + rpath('M16 11 C16 6 32 6 32 11 C32 22 34 29 31 39 C28 43 20 43 17 39 C14 29 16 22 16 11 Z', hue('sky', 'soft'))
             + ell(24, 34, 5, 4, hue('sky'));
    var vamp = rpath('M14 11 C14 5 34 5 34 11 C34 23 32 25 28 25 L20 25 C16 25 14 23 14 11 Z', hue('sky'))
             + stroke('M14 24 Q24 27 34 24', hue('sky', 'deep'), 3)
             + circ(24, 15, 3, hue('sun'));
    var content = sole + vamp;
    if (s === 'slap') {
      return tf('translate(24 24) rotate(-15) translate(-24 -24)', content)
        + stroke('M6 24 L2 24', hue('sun'), 3) + stroke('M42 24 L46 24', hue('sun'), 3);
    }
    if (s === 'lift') {
      return tf('translate(24 24) rotate(12) scale(1.08) translate(-24 -24)', content);
    }
    return content;
  };

  /* 呆萌小強 cockroach（48×48）：圓胖身軀、大眼、萌觸角，支援 idle / dizzy 狀態 */
  P.cockroach = function (s) {
    var legs = stroke('M10 20 Q16 22 20 23', hue('wood', 'deep'), 2.5)
             + stroke('M38 20 Q32 22 28 23', hue('wood', 'deep'), 2.5)
             + stroke('M8 28 Q15 28 20 28', hue('wood', 'deep'), 2.5)
             + stroke('M40 28 Q33 28 28 28', hue('wood', 'deep'), 2.5)
             + stroke('M10 36 Q16 34 20 33', hue('wood', 'deep'), 2.5)
             + stroke('M38 36 Q32 34 28 33', hue('wood', 'deep'), 2.5);
    var antennae = stroke('M22 13 Q14 4 10 7', hue('wood', 'deep'), 2)
                 + stroke('M26 13 Q34 4 38 7', hue('wood', 'deep'), 2);
    var body = ell(24, 28, 11, 14, hue('wood', 'deep'))
             + ell(24, 29, 8, 11, hue('wood'))
             + stroke('M24 18 L24 38', hue('wood', 'ledge'), 2);
    var head = ell(24, 15, 7, 5, hue('wood', 'deep'));
    var eyes = '';
    if (s === 'dizzy') {
      eyes = stroke('M19 14 L23 16 M23 14 L19 16', N['surface-raised'], 2)
           + stroke('M25 14 L29 16 M29 14 L25 16', N['surface-raised'], 2)
           + circ(24, 6, 2, hue('sun')) + circ(18, 5, 1.5, hue('sun')) + circ(30, 5, 1.5, hue('sun'));
    } else {
      eyes = circ(21, 14, 2.8, N['surface-raised']) + circ(21.5, 14, 1.4, N.ink)
           + circ(27, 14, 2.8, N['surface-raised']) + circ(26.5, 14, 1.4, N.ink)
           + circ(22, 13.3, 0.6, N['surface-raised']) + circ(27, 13.3, 0.6, N['surface-raised']);
    }
    return legs + antennae + body + head + eyes;
  };

  /* 拍打煙霧 slapFx（48×48）：拍打瞬間向四周散開的小煙霧與星塵 */
  P.slapFx = function () {
    return circ(24, 24, 14, hue('sun', 'soft'), { opacity: .7 })
         + circ(14, 16, 5, N['surface-raised'], { opacity: .8 })
         + circ(34, 16, 6, N['surface-raised'], { opacity: .8 })
         + circ(12, 32, 4, N['surface-raised'], { opacity: .8 })
         + circ(36, 32, 5, N['surface-raised'], { opacity: .8 })
         + rpath(star(24, 10, 5, 2.5), hue('sun'), 2)
         + rpath(star(38, 24, 4, 2), hue('sun'), 2)
         + rpath(star(10, 24, 4, 2), hue('sun'), 2);
  };

  /* 安全叉號 tileCross（48×48）：柔和圓角安全 X 標記 */
  P.tileCross = function () {
    return stroke('M14 14 L34 34', hue('stone'), 5)
         + stroke('M34 14 L14 34', hue('stone'), 5);
  };
})(typeof window !== 'undefined' ? window : globalThis);
