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
})(typeof window !== 'undefined' ? window : globalThis);
