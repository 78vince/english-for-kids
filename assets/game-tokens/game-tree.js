/* game-tree.js — 「爬樹」遊戲素材（v2.0.0）：樹枝、障礙物、道具、降落傘、披風，以及依高度變化的巨樹背景。
 * 載入順序：tokens → art → props → race → tree → character → scene → export → icons（tree 只依賴 art）。
 * 規則同其他素材：扁平填色、圓角、無輪廓；顏色來自 token（hue／neutral／treeClimb.world.palette）。
 * 背景用「分塊」：GameArt.treeChunk(layer, index, w) 回傳一個高度 chunkH 的 SVG，層空間座標＝高度 alt（設計單位，往上為正）。
 * App 只需保留目前可見的 2–3 塊，依鏡頭捲動並套視差（見 treeClimb.world.parallax）。 */
(function (g) {
  var A = g.GameArt, H = A._h, T = H.T, C = T.color, N = C.neutral, P = A._P, hue = H.hue;
  var el = H.el, rect = H.rect, circ = H.circ, ell = H.ell, line = H.line, rpath = H.rpath, svg = H.svg;
  var tf = function (t, inner) { return '<g transform="' + t + '">' + inner + '</g>'; };
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function hash(n) { n = (n ^ 61) ^ (n >>> 16); n = n + (n << 3) | 0; n = n ^ (n >>> 4); n = Math.imul(n, 0x27d4eb2d); n = n ^ (n >>> 15); return (n >>> 0) / 4294967296; }
  var leaf = function (x, y, r, rot, dark) { return ell(x, y, r, r * .55, dark ? hue('leaf', 'ledge') : hue('leaf'), { transform: 'rotate(' + rot + ' ' + x + ' ' + y + ')' }); };

  /* ================= 樹枝 ================= */
  /* 樹幹端在左（x=0，較粗），葉端在右；左側樹枝由 App 水平翻轉。踩踏面＝上緣 y=14（collider 的 top）。 */
  function limbBody(w, thick) {
    var t = thick || 1, d = 'M0 14 L' + (w - 16) + ' 14 Q' + w + ' 15 ' + w + ' ' + (22 * t) + ' Q' + (w - 12) + ' ' + (28 * t) + ' ' + (w * .55) + ' ' + (29 * t) + ' Q' + (w * .2) + ' ' + (33 * t) + ' 0 ' + (40 * t) + ' Z';
    return rpath(d, hue('bark'), 8) + rect(0, 15, w - 18, 8, 4, hue('bark', 'ledge'), { opacity: .55 }) + rect(2, 13, w - 20, 5, 2.5, hue('wood', 'ledge'));
  }
  function twigs(w, v) {
    if (v === 'b') return el('path', { d: 'M' + (w * .3) + ' 14 Q' + (w * .3 - 4) + ' 2 ' + (w * .3 - 14) + ' -8', stroke: hue('bark'), 'stroke-width': 5, 'stroke-linecap': 'round' }) + leaf(w * .3 - 18, -10, 10, -40) + leaf(w * .3 - 8, -14, 9, 20, true)
      + el('path', { d: 'M' + (w * .74) + ' 14 Q' + (w * .74 + 4) + ' 6 ' + (w * .74 + 12) + ' 0', stroke: hue('bark'), 'stroke-width': 4, 'stroke-linecap': 'round' }) + leaf(w * .74 + 16, -2, 9, -20) + leaf(w * .74 + 20, 4, 8, 30, true);
    if (v === 'c') return el('path', { d: 'M' + (w * .6) + ' 28 Q' + (w * .6 + 4) + ' 38 ' + (w * .6 + 8) + ' 46', stroke: hue('bark'), 'stroke-width': 5, 'stroke-linecap': 'round' }) + leaf(w * .6 + 8, 50, 11, 80) + leaf(w * .6 - 2, 48, 9, 110, true)
      + leaf(w - 12, 6, 11, -30) + leaf(w - 4, 14, 9, 20, true);
    return el('path', { d: 'M' + (w * .55) + ' 14 Q' + (w * .55 + 6) + ' 0 ' + (w * .55 + 22) + ' -10', stroke: hue('bark'), 'stroke-width': 5, 'stroke-linecap': 'round' }) + leaf(w * .55 + 28, -12, 11, -30) + leaf(w * .55 + 20, -16, 9, 50, true) + leaf(w * .55 + 34, -4, 8, 10, true);
  }
  function limb(w) { return function (s) { return twigs(w, s) + limbBody(w); }; }
  P.limbS = limb(180); P.limbM = limb(240); P.limbL = limb(320);
  P.limbWrap = function (s) {   /* 環幹粗枝：橫過樹幹正面，兩端圓鈍 */
    var w = 480, body = rect(0, 14, w, 24, 12, hue('bark')) + rect(10, 14, w - 20, 9, 4.5, hue('bark', 'ledge'), { opacity: .55 }) + rect(10, 13, w - 20, 5, 2.5, hue('wood', 'ledge')) + circ(120, 28, 6, hue('bark', 'deep'), { opacity: .6 }) + circ(330, 30, 5, hue('bark', 'deep'), { opacity: .6 });
    var d = s === 'b' ? leaf(80, 8, 10, -30) + leaf(92, 12, 8, 30, true) + leaf(400, 6, 10, -20) : leaf(250, 6, 11, -30) + leaf(262, 10, 9, 30, true) + leaf(40, 40, 10, 100);
    return d + body;
  };
  P.limbBrittle = function (s) {   /* 脆枝：顏色較淡、有裂紋；cracked＝踩上去後裂開 */
    var w = 240, wood = hue('wood', 'deep'), body = rpath('M0 14 L' + (w - 16) + ' 14 Q' + w + ' 15 ' + w + ' 22 Q' + (w - 12) + ' 27 ' + (w * .55) + ' 28 Q' + (w * .2) + ' 31 0 36 Z', hue('wood'), 7) + rect(2, 13, w - 20, 5, 2.5, hue('wood', 'soft'));
    var cracks = el('path', { d: 'M70 14 L78 24 L70 30 M150 14 L144 22 L152 28', stroke: wood, 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
    if (s === 'cracked') return tf('translate(0 2)', body) + cracks + rect(104, 12, 8, 24, 3, N.ink, { opacity: .25 }) + el('path', { d: 'M110 6 L116 -2 M96 8 L90 0', stroke: hue('sun', 'deep'), 'stroke-width': 3, 'stroke-linecap': 'round' });
    return body + cracks;
  };
  P.limbTop = function () {   /* 樹頂粗枝（旗子由 App 另放 flag 道具在其上） */
    var w = 360;
    return rect(0, 14, w, 40, 20, hue('bark')) + rect(14, 14, w - 28, 12, 6, hue('bark', 'ledge'), { opacity: .5 }) + rect(14, 13, w - 28, 6, 3, hue('wood', 'ledge')) + leaf(60, 8, 12, -30) + leaf(300, 6, 12, -20) + leaf(310, 12, 10, 30, true);
  };
  P.springShroom = function (s) {   /* 彈跳蕈 */
    var sq = s === 'squash', cy = sq ? 22 : 12;
    return rect(22, 30, 20, 22, 8, hue('wood', 'soft')) + el('path', { d: 'M4 ' + (cy + 24) + ' Q4 ' + cy + ' 32 ' + cy + ' Q60 ' + cy + ' 60 ' + (cy + 24) + ' Q32 ' + (cy + 30) + ' 4 ' + (cy + 24) + ' Z', fill: hue('rose'), stroke: hue('rose'), 'stroke-width': 6, 'stroke-linejoin': 'round' })
      + circ(20, cy + 12, 5, hue('rose', 'soft')) + circ(40, cy + 8, 4, hue('rose', 'soft')) + circ(46, cy + 18, 3.5, hue('rose', 'soft'));
  };

  /* ================= 障礙物（兩格動畫：以 state 交替） ================= */
  P.caterpillar = function (s) {
    var a = s === 'a', out = '', i, ys = a ? [24, 18, 24, 30, 24] : [24, 30, 24, 18, 24];
    for (i = 0; i < 5; i++) out += circ(12 + i * 12, ys[i], 9, i % 2 ? hue('leaf') : hue('mint'));
    return out + circ(68, ys[4] - 2, 11, hue('peach')) + circ(72, ys[4] - 4, 2.6, N.ink) + circ(64, ys[4] - 4, 2.6, N.ink) + line(70, ys[4] - 12, 74, ys[4] - 20, N.ink, 2) + line(64, ys[4] - 12, 62, ys[4] - 20, N.ink, 2)
      + rect(8, ys[0] + 8, 5, 5, 2, hue('peach', 'deep')) + rect(44, ys[3] + 8, 5, 5, 2, hue('peach', 'deep'));
  };
  P.birdFoe = function (s) {
    var up = s === 'up', wing = up ? ell(40, 14, 8, 22, hue('peach', 'ledge'), { transform: 'rotate(-18 40 30)' }) : ell(40, 46, 8, 20, hue('peach', 'ledge'), { transform: 'rotate(14 40 30)' });
    return rpath('M8 30 L22 24 L22 38 Z', hue('rose'), 5) + wing + ell(44, 32, 24, 17, hue('peach')) + ell(46, 38, 16, 9, hue('peach', 'soft')) + circ(66, 24, 13, hue('peach')) + rpath('M76 22 L90 27 L76 32 Z', hue('sun'), 4) + circ(68, 22, 3, N.ink) + line(62, 15, 72, 18, N.ink, 3);
  };
  P.bee = function (s) {
    var up = s === 'up';
    return ell(18, up ? 10 : 22, 9, 6, hue('sky', 'soft'), { opacity: .9 }) + ell(30, up ? 8 : 20, 9, 6, hue('sky', 'soft'), { opacity: .9 }) + ell(24, 26, 14, 10, hue('sun')) + rect(19, 17, 4, 19, 2, N.ink, { opacity: .8 }) + rect(28, 17, 4, 19, 2, N.ink, { opacity: .8 })
      + circ(9, 26, 7, hue('sun', 'ledge')) + circ(7, 24, 1.8, N.ink) + rpath('M38 26 L44 28 L38 30 Z', N.ink, 2);
  };
  P.acorn = function () { return rect(14, 2, 4, 8, 2, hue('bark')) + ell(16, 28, 11, 13, hue('wood', 'deep')) + rpath('M5 20 Q16 4 27 20 Q16 24 5 20 Z', hue('bark'), 5) + rect(10, 16, 12, 3, 1.5, hue('bark', 'ledge'), { opacity: .7 }); };
  P.balloonCluster = function (s) {
    if (s === 'popped') return el('path', { d: 'M20 40 L28 30 L34 42 Z M52 36 L60 28 L66 40 Z M38 54 L44 46 L50 56 Z', fill: hue('rose'), stroke: hue('rose'), 'stroke-width': 4, 'stroke-linejoin': 'round' }) + line(42, 70, 42, 108, N['ink-faint'], 2);
    var b = function (x, y, c) { return ell(x, y, 17, 21, c) + rpath('M' + (x - 3) + ' ' + (y + 21) + ' L' + x + ' ' + (y + 27) + ' L' + (x + 3) + ' ' + (y + 21) + ' Z', c, 3) + ell(x - 6, y - 7, 4, 7, N['surface-raised'], { opacity: .35, transform: 'rotate(20 ' + (x - 6) + ' ' + (y - 7) + ')' }); };
    return line(24, 52, 42, 108, N['ink-faint'], 2) + line(60, 48, 42, 108, N['ink-faint'], 2) + line(42, 72, 42, 108, N['ink-faint'], 2) + b(24, 30, hue('rose')) + b(60, 26, hue('sky')) + b(42, 50, hue('sun'));
  };
  P.gust = function (s) {   /* 強風帶的視覺（區域） */
    var o = s === 'b' ? 18 : 0, st = { stroke: N['surface-raised'], 'stroke-width': 6, 'stroke-linecap': 'round', opacity: .75 };
    return el('path', Object.assign({ d: 'M' + (10 + o) + ' 20 Q60 4 100 20 T150 14' }, st)) + el('path', Object.assign({ d: 'M' + (30 - o) + ' 46 Q80 30 120 46 T156 40' }, st)) + el('path', Object.assign({ d: 'M' + (6 + o) + ' 72 Q50 58 90 72 T140 66' }, st));
  };
  P.meteor = function () { return rpath('M2 36 L48 22 L48 34 Z', hue('peach'), 6) + rpath('M18 40 L56 30 L52 40 Z', hue('rose'), 5) + circ(70, 28, 14, hue('sun')) + circ(70, 28, 8, hue('sun', 'soft')); };
  P.alertMark = function () { return circ(14, 14, 14, hue('sun')) + rect(12, 6, 4, 11, 2, N.ink) + circ(14, 22, 2.4, N.ink) + rpath('M9 28 L14 36 L19 28 Z', hue('sun'), 3); };

  /* ================= 道具／收集物 ================= */
  P.hourglassLeaf = function (s) {
    var o = s === 'collected' ? .25 : 1;
    return '<g opacity="' + o + '">' + ell(22, 26, 22, 17, hue('mint', 'ledge'), { transform: 'rotate(-20 22 26)', opacity: .8 }) + rpath('M13 8 H31 Q31 24 22 28 Q13 24 13 8 Z', hue('sky', 'soft'), 3) + rpath('M13 48 H31 Q31 32 22 28 Q13 32 13 48 Z', hue('sun'), 3) + rect(10, 4, 24, 5, 2.5, hue('wood', 'deep')) + rect(10, 47, 24, 5, 2.5, hue('wood', 'deep')) + '</g>';
  };
  P.capeItem = function (s) {
    var o = s === 'collected' ? .25 : 1;
    return '<g opacity="' + o + '">' + rpath('M10 14 Q26 4 42 14 L48 50 Q26 42 4 50 Z', hue('rose'), 6) + rect(12, 14, 28, 8, 4, hue('rose', 'ledge')) + circ(26, 18, 5, hue('sun')) + el('path', { d: 'M14 38 Q26 33 38 38', stroke: hue('rose', 'ledge'), 'stroke-width': 3, 'stroke-linecap': 'round' }) + '</g>';
  };
  P.acornPick = function (s) { var o = s === 'collected' ? .25 : 1; return '<g opacity="' + o + '">' + rect(14, 2, 4, 8, 2, hue('sun', 'deep')) + ell(16, 28, 11, 13, hue('sun')) + rpath('M5 20 Q16 4 27 20 Q16 24 5 20 Z', hue('sun', 'ledge'), 5) + '</g>'; };
  P.capeFx = function (s) {   /* 穿在身上的披風（畫在角色後面）；上緣對齊肩膀，往下飄 */
    var a = s === 'wave1', d = a ? 'M8 6 Q35 -2 62 6 L70 96 Q56 84 44 100 Q34 86 22 102 Q12 88 0 98 Z' : 'M8 6 Q35 -2 62 6 L64 100 Q54 90 42 104 Q30 88 20 98 Q10 90 4 104 Z';
    return rpath(d, hue('rose'), 6) + rect(6, 4, 58, 9, 4.5, hue('rose', 'ledge')) + el('path', { d: a ? 'M26 20 L24 80 M44 20 L48 84' : 'M26 20 L28 82 M44 20 L44 86', stroke: hue('rose', 'ledge'), 'stroke-width': 3, 'stroke-linecap': 'round', opacity: .8 });
  };
  P.parachute = function (s) {   /* 降落傘：open＝傘面＋傘繩，傘繩收在底部中央（75,140）＝角色雙手抓握處 */
    if (s === 'closed') return rpath('M70 4 Q75 -2 80 4 L82 40 Q75 46 68 40 Z', hue('rose'), 4) + line(75, 44, 75, 60, N['ink-soft'], 2);
    var id = 'gpc' + H.nextId(), d = 'M4 74 Q4 8 75 8 Q146 8 146 74 Q130 64 112 74 Q94 64 75 74 Q56 64 38 74 Q20 64 4 74 Z', cols = [hue('rose'), hue('sun'), hue('sky'), hue('sun'), hue('rose')], i, st = '';
    for (i = 0; i < 5; i++) st += rect(4 + i * 28.4, 0, 28.4, 90, 0, cols[i]);
    return '<defs><clipPath id="' + id + '"><path d="' + d + '"/></clipPath></defs>' + '<g clip-path="url(#' + id + ')">' + st + '</g>'
      + line(16, 72, 75, 140, N['ink-soft'], 2) + line(46, 72, 75, 140, N['ink-soft'], 2) + line(75, 72, 75, 140, N['ink-soft'], 2) + line(104, 72, 75, 140, N['ink-soft'], 2) + line(134, 72, 75, 140, N['ink-soft'], 2);
  };
  P.ambBird = function (s) { var up = s === 'up'; return el('path', { d: up ? 'M2 12 Q9 -2 18 10 Q27 -2 34 12' : 'M2 8 Q9 16 18 12 Q27 16 34 8', stroke: N['ink-soft'], 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: .75 }); };

  /* ================= 巨樹背景（依高度分塊） ================= */
  var W = function () { return T.treeClimb.world; };
  function lerp(a, b, t) { return a + (b - a) * t; }
  function sm(a, b, x) { var t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); }
  function mixc(h1, h2, t) { var p = function (h) { h = h.replace('#', ''); return [0, 2, 4].map(function (i) { return parseInt(h.substr(i, 2), 16); }); }, a = p(h1), b = p(h2); return '#' + a.map(function (v, i) { var q = Math.round(v + (b[i] - v) * t); return ('0' + q.toString(16)).slice(-2); }).join(''); }
  function zoneW(alt) {   /* 五區權重（過渡帶內平滑交叉） */
    var z = W().zones, b = W().blend, out = {}, i;
    for (i = 0; i < z.length; i++) {
      var lo = z[i].from, hi = z[i].to, k = 1;
      if (i > 0) k *= sm(lo - b / 2, lo + b / 2, alt);
      if (i < z.length - 1) k *= 1 - sm(hi - b / 2, hi + b / 2, alt);
      out[z[i].id] = k;
    }
    return out;
  }
  function zoneAt(alt) {
    var z = W().zones, i, w = zoneW(alt), best = z[0].id, bv = -1;
    for (i = 0; i < z.length; i++) if (w[z[i].id] > bv) { bv = w[z[i].id]; best = z[i].id; }
    for (i = 0; i < z.length; i++) if (z[i].id === best) return { id: best, index: i, label: z[i].label, weights: w, t: Math.max(0, Math.min(1, (alt - z[i].from) / (z[i].to - z[i].from))) };
  }
  function skyAt(alt) {
    var K = W().sky, i, a, b;
    if (alt <= K[0].alt) return { top: K[0].top, bottom: K[0].bottom, star: 0 };
    for (i = 1; i < K.length; i++) if (alt <= K[i].alt) { a = K[i - 1]; b = K[i]; var t = (alt - a.alt) / (b.alt - a.alt); return { top: mixc(a.top, b.top, t), bottom: mixc(a.bottom, b.bottom, t), star: lerp(a.star, b.star, t) }; }
    b = K[K.length - 1]; return { top: b.top, bottom: b.bottom, star: b.star };
  }
  function trunkHalf(alt) { var w = W(); return lerp(w.trunk.baseHalf, w.trunk.topHalf, Math.pow(Math.max(0, Math.min(1, alt / w.topAlt)), .85)); }

  function chunk(layer, idx, w) {
    var Wd = W(), P2 = Wd.palette, ch = Wd.chunkH, vw = w || Wd.viewW, a0 = idx * ch, a1 = a0 + ch, cx = vw / 2, s = '', r = rng(idx * 977 + (layer.length * 131) + 7), i, y;
    var pf = (Wd.parallax[layer] || 1), zw = function (la) { return zoneW(la / pf); };
    var Y = function (alt) { return +(ch - (alt - a0)).toFixed(1); };   /* alt → chunk 內 y */
    var inChunk = function (alt, m) { return alt > a0 - (m || 0) && alt < a1 + (m || 0); };

    if (layer === 'far') {
      /* 地面層：遠丘 */
      if (a0 < 300) { s += rpath('M0 ' + Y(0) + ' L0 ' + Y(120) + ' Q' + vw * .2 + ' ' + Y(190) + ' ' + vw * .42 + ' ' + Y(130) + ' T' + vw * .8 + ' ' + Y(150) + ' T' + vw + ' ' + Y(120) + ' L' + vw + ' ' + Y(0) + ' Z', P2.farHill, 0); s += rpath('M0 ' + Y(0) + ' L0 ' + Y(70) + ' Q' + vw * .3 + ' ' + Y(120) + ' ' + vw * .55 + ' ' + Y(80) + ' T' + vw + ' ' + Y(90) + ' L' + vw + ' ' + Y(0) + ' Z', P2.farHill2, 0); }
      /* 森林：遠處細樹幹（整條貫穿，全域固定位置；以 80 單位切片逐段決定透明度 → 分塊接縫無縫） */
      for (i = 0; i < 16; i++) {
        var fx = hash(i * 31 + 3) * vw, fw = 14 + hash(i * 17 + 5) * 16, k;
        for (k = 0; k < ch / 80; k++) { var zz = zw(a0 + k * 80 + 40), wt = zz.forest * .9 + zz.ground * .6; if (wt > .02) s += rect(fx - fw / 2, ch - (k + 1) * 80, fw, 80.4, 0, i % 2 ? P2.farTree : P2.farTree2, { opacity: wt.toFixed(2) }); }
      }
      /* 樹冠：成團的樹葉（依高度帶密度） */
      var nC = 26; for (i = 0; i < nC; i++) { var ca = a0 + r() * ch, cw = zw(ca).canopy; if (r() < cw) { var cr = 34 + r() * 56, cxx = r() * vw; s += circ(cxx, Y(ca), cr, i % 2 ? P2.farCanopy : P2.farCanopy2, { opacity: .85 }) + circ(cxx + cr * .7, Y(ca) + cr * .3, cr * .7, i % 2 ? P2.farCanopy2 : P2.farCanopy, { opacity: .85 }); } }
      /* 遠山：固定高度的山脈（只在 mountain 區底部） */
      var mb = (Wd.zones[3].from + 60) * pf; if (inChunk(mb, 200)) {
        var d = 'M0 ' + Y(mb - 20), xx; for (xx = 0; xx <= vw; xx += 60) d += ' L' + xx + ' ' + Y(mb + 20 + hash(Math.floor(xx / 60) * 13 + 9) * 110 + Math.sin(xx / 170) * 30);
        var gm = 'gtm' + H.nextId(), gm2 = 'gtm' + H.nextId();
        s += '<defs><linearGradient id="' + gm + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + P2.mountain + '"/><stop offset="1" stop-color="' + P2.mountain + '" stop-opacity="0"/></linearGradient><linearGradient id="' + gm2 + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + P2.mountain2 + '"/><stop offset="1" stop-color="' + P2.mountain2 + '" stop-opacity="0"/></linearGradient></defs>';
        s += el('path', { d: d + ' L' + vw + ' ' + Y(mb - 200) + ' L0 ' + Y(mb - 200) + ' Z', fill: 'url(#' + gm + ')' });
        s += el('path', { d: 'M0 ' + Y(mb - 20) + ' L' + vw * .25 + ' ' + Y(mb + 90) + ' L' + vw * .5 + ' ' + Y(mb + 10) + ' L' + vw * .78 + ' ' + Y(mb + 110) + ' L' + vw + ' ' + Y(mb + 20) + ' L' + vw + ' ' + Y(mb - 200) + ' L0 ' + Y(mb - 200) + ' Z', fill: 'url(#' + gm2 + ')' });
      }
      /* 大氣邊緣：弧形的大氣光暈 */
      var ea = (Wd.zones[4].from + 140) * pf; if (inChunk(ea, 300)) { s += el('ellipse', { cx: cx, cy: Y(ea - 600), rx: vw * 1.1, ry: 600, fill: 'none', stroke: P2.edgeGlow, 'stroke-width': 26, opacity: .35 }) + el('ellipse', { cx: cx, cy: Y(ea - 600), rx: vw * 1.1, ry: 600, fill: 'none', stroke: P2.edgeGlow, 'stroke-width': 8, opacity: .7 }); }
    }

    if (layer === 'mid') {
      /* 森林：較近的粗樹幹（同樣切片決定透明度） */
      for (i = 0; i < 7; i++) {
        var mx = hash(i * 53 + 11) * vw, mw = 40 + hash(i * 29 + 2) * 36, k2;
        for (k2 = 0; k2 < ch / 80; k2++) { var z2 = zw(a0 + k2 * 80 + 40), wm = z2.forest + z2.ground * .5; if (wm > .02) { var yy = ch - (k2 + 1) * 80; s += rect(mx - mw / 2, yy, mw, 80.4, 0, P2.midTrunk, { opacity: wm.toFixed(2) }) + rect(mx + mw * .12, yy, mw * .22, 80.4, 0, P2.midTrunkLedge, { opacity: (wm * .7).toFixed(2) }); } }
      }
      /* 樹冠：垂掛的葉團 */
      for (i = 0; i < 14; i++) { var la = a0 + r() * ch, lw = zw(la).canopy; if (r() < lw) { var lr = 30 + r() * 44, lx = r() * vw; s += circ(lx, Y(la), lr, P2.midCanopy) + circ(lx - lr * .7, Y(la) + lr * .35, lr * .65, P2.midCanopy2) + circ(lx + lr * .7, Y(la) + lr * .3, lr * .6, P2.midCanopy2); } }
      /* 雲：遠山雲層密集；其他高度零星 */
      for (i = 0; i < 9; i++) { var qa = a0 + r() * ch, zq = zw(qa), cq = zq.mountain * .95 + zq.edge * .35 + zq.canopy * .18; if (r() < cq) { var qx = r() * vw, qk = .8 + r() * 1.3; s += tf('translate(' + qx.toFixed(0) + ' ' + Y(qa) + ') scale(' + qk.toFixed(2) + ')', rect(0, 22, 120, 28, 14, P2.cloud) + circ(34, 26, 24, P2.cloud) + circ(70, 18, 30, P2.cloud) + circ(100, 32, 17, P2.cloud)); } }
      /* 氛圍小鳥（遠，靜態 V 字） */
      for (i = 0; i < 6; i++) { var ba = a0 + r() * ch, bz = zw(ba); if (r() < bz.canopy * .7 + bz.mountain * .9 + bz.edge * .2) { var bx = r() * vw, bk = .6 + r() * .6; s += tf('translate(' + bx.toFixed(0) + ' ' + Y(ba) + ') scale(' + bk.toFixed(2) + ')', el('path', { d: 'M0 10 Q8 -4 16 8 Q24 -4 32 10', stroke: N['ink-soft'], 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: .55 })); } }
      /* 大氣邊緣：流星（背景裝飾，靜態細線） */
      for (i = 0; i < 3; i++) { var sa = a0 + r() * ch; if (r() < zw(sa).edge * .8) { var sx = r() * vw; s += el('path', { d: 'M' + sx + ' ' + Y(sa) + ' L' + (sx - 60) + ' ' + (Y(sa) + 24), stroke: P2.star, 'stroke-width': 3, 'stroke-linecap': 'round', opacity: .6 }); } }
    }

    if (layer === 'trunk') {
      /* 巨大樹幹：沿高度取樣、左右邊緣略有起伏，向上逐漸變細 */
      var step = 40, L = [], R = [];
      for (y = a0 - step; y <= a1 + step; y += step) { var hw = trunkHalf(y), wob = Math.sin(y / 230) * 8 + Math.sin(y / 97) * 4; L.push([cx - hw + wob, Y(y)]); R.push([cx + hw + wob * .7, Y(y)]); }
      var dd = 'M' + L[0][0].toFixed(1) + ' ' + L[0][1]; for (i = 1; i < L.length; i++) dd += ' L' + L[i][0].toFixed(1) + ' ' + L[i][1];
      for (i = R.length - 1; i >= 0; i--) dd += ' L' + R[i][0].toFixed(1) + ' ' + R[i][1]; dd += ' Z';
      s += rpath(dd, P2.trunk, 10);
      /* 右側暗面與樹皮縱紋 */
      var dr = 'M' + (R[0][0] - 70) + ' ' + R[0][1]; for (i = 1; i < R.length; i++) dr += ' L' + (R[i][0] - 70 + Math.sin(R[i][1] / 60) * 6).toFixed(1) + ' ' + R[i][1];
      for (i = R.length - 1; i >= 0; i--) dr += ' L' + R[i][0].toFixed(1) + ' ' + R[i][1]; s += el('path', { d: dr + ' Z', fill: P2.trunkShade, opacity: .55 });
      for (i = 0; i < 9; i++) {
        var gx = hash(i * 41 + 17), gy0 = a0 + hash(idx * 9 + i * 7) * ch, gl = 120 + hash(i * 13 + idx) * 220, gmid = gy0 + gl / 2, ghw = trunkHalf(gmid), gxp = cx - ghw * .86 + gx * ghw * 1.7;
        s += el('path', { d: 'M' + gxp.toFixed(1) + ' ' + Y(gy0) + ' q' + (hash(i + idx) * 16 - 8).toFixed(1) + ' ' + (-gl / 2) + ' ' + (hash(i * 3 + idx) * 12 - 6).toFixed(1) + ' ' + (-gl), stroke: P2.trunkGroove, 'stroke-width': 5, 'stroke-linecap': 'round', opacity: .5 });
      }
      /* 節瘤與青苔（以全域種子，確保接縫） */
      for (i = 0; i < 3; i++) { var ka = a0 + hash(idx * 17 + i * 5 + 1) * ch, khw = trunkHalf(ka), kx = cx - khw * .6 + hash(idx * 5 + i * 11) * khw * 1.2; s += ell(kx, Y(ka), 22, 30, P2.trunkGroove, { opacity: .55 }) + ell(kx, Y(ka), 12, 18, P2.trunkShade, { opacity: .7 }); }
      for (i = 0; i < 2; i++) { var ma = a0 + hash(idx * 3 + i * 7 + 2) * ch, mw2 = zw(ma); if (mw2.ground + mw2.forest > .4) { var mhw = trunkHalf(ma); s += ell(cx - mhw + 30 + hash(idx + i) * 40, Y(ma), 44, 18, P2.moss, { opacity: .55 }); } }
      /* 樹皮上的小葉叢（樹冠層以上減少） */
      for (i = 0; i < 4; i++) { var ta = a0 + hash(idx * 23 + i * 3) * ch, th = trunkHalf(ta), side = hash(i + idx * 2) < .5 ? -1 : 1; if (zw(ta).edge < .6) s += leaf(cx + side * (th - 6), Y(ta), 16, side * -30) + leaf(cx + side * (th - 22), Y(ta) + 8, 13, side * 30, true); }
      /* 地面層：草地、樹根、灌木 */
      if (a0 < 40) {
        var gy = Y(0);
        s += rect(0, gy, vw, ch - gy + 40, 0, P2.groundBody) + rect(0, gy - 6, vw, 26, 0, P2.groundTop);
        for (i = 0; i * 26 < vw + 26; i++) s += circ(i * 26, gy + 2, 17, P2.groundTop);
        var rh = trunkHalf(0);
        s += rpath('M' + (cx - rh - 120) + ' ' + gy + ' Q' + (cx - rh - 20) + ' ' + (gy - 10) + ' ' + (cx - rh + 20) + ' ' + (gy - 120) + ' L' + (cx + rh - 20) + ' ' + (gy - 120) + ' Q' + (cx + rh + 20) + ' ' + (gy - 10) + ' ' + (cx + rh + 120) + ' ' + gy + ' Z', P2.trunk, 10);
        for (i = 0; i < 9; i++) { var bx2 = hash(i * 61 + 3) * vw, bs = 36 + hash(i * 19) * 40; s += circ(bx2, gy - 6, bs, i % 2 ? P2.bush : P2.bushLight) + circ(bx2 + bs * .8, gy, bs * .7, i % 2 ? P2.bushLight : P2.bush); }
        for (i = 0; i < 12; i++) { var fx2 = hash(i * 37 + 8) * vw; s += circ(fx2, gy - 14 - hash(i) * 10, 7, [P2.flowerA, P2.flowerB, P2.flowerC][i % 3]) + rect(fx2 - 1.5, gy - 12, 3, 14, 1.5, P2.bush); }
      }
    }

    if (layer === 'near') {   /* 前景：左右邊緣的葉叢（樹冠層以上才有，不遮玩法區） */
      for (i = 0; i < 6; i++) { var na = a0 + r() * ch, nw = zw(na).canopy; if (r() < nw * .9) { var side2 = r() < .5 ? 0 : vw, nr = 30 + r() * 30; s += circ(side2, Y(na), nr, P2.nearLeaf, { opacity: .95 }) + circ(side2 + (side2 ? -nr * .8 : nr * .8), Y(na) + nr * .4, nr * .6, P2.nearLeaf2, { opacity: .95 }); } }
    }
    return svg(vw, ch, s, 'g-tree-chunk g-tree-' + layer, { style: 'overflow:visible' });
  }

  function stars(w, h) {   /* 固定星空（App 依 treeSkyAt().star 調透明度） */
    var r = rng(5), s = '', i; for (i = 0; i < 46; i++) s += circ((r() * w).toFixed(0), (r() * h).toFixed(0), (.9 + r() * 1.8).toFixed(1), W().palette.star, { opacity: (.5 + r() * .5).toFixed(2) });
    return svg(w, h, s, 'g-tree-stars');
  }

  /* ---- 樹枝定位與地形生成（參考實作；App 可直接呼叫，tree-sim.js 也用它驗證可達性） ---- */
  function extent(side, ln, alt) {
    var L = T.treeClimb.layout, h = trunkHalf(alt), len = L.lens[ln] || L.lens.M;
    if (side === 'W') return { x0: L.cx - L.wrapLen / 2, x1: L.cx + L.wrapLen / 2 };
    if (side === 'L') { var r = L.cx - h + L.anchorOverlap; return { x0: r - len, x1: r }; }
    var l = L.cx + h - L.anchorOverlap; return { x0: l, x1: l + len };
  }
  /* 依難度與種子拼接樣板，回傳 [{side,len,style,alt,x0,x1,kind('normal'|'brittle'|'shroom'|'top'|'start'),id(prop id)}]，由下往上；alt＝踩踏面高度。 */
  function build(levelId, seed, maxAlt) {
    var TC = T.treeClimb, lv = TC.levels.filter(function (l) { return l.id === levelId; })[0], li = TC.levels.indexOf(lv) + 1, r = rng(seed || 1), pool = TC.patterns.filter(function (p) { return p.level === li; }), out = [], alt = 0, top = maxAlt || TC.world.topAlt;
    var propId = function (side, ln) { return side === 'W' ? 'limbWrap' : { S: 'limbS', M: 'limbM', L: 'limbL' }[ln]; };
    var push = function (b) { var e = extent(b.side, b.len, b.alt); b.x0 = e.x0; b.x1 = e.x1; b.id = b.id || propId(b.side, b.len); out.push(b); };
    push({ side: 'W', len: 'M', style: 'a', alt: 90, kind: 'start' }); alt = 90;
    while (alt < top - 760) {
      var p = pool[Math.floor(r() * pool.length)], a = alt, i;
      for (i = 0; i < p.branches.length; i++) {
        var b = p.branches[i]; a += b.dy;
        var sp = p.specials.filter(function (s) { return s.at === i; })[0], nb = { side: b.side, len: b.len, style: b.style, alt: a, kind: 'normal' };
        if (sp && sp.kind === 'brittle' && lv.brittle) { nb.kind = 'brittle'; nb.id = 'limbBrittle'; nb.len = 'M'; push(nb); var bk = sp.backup; push({ side: bk.side, len: bk.len, style: 'a', alt: a + bk.dyOffset, kind: 'normal' }); continue; }
        if (sp && sp.kind === 'shroom') nb.shroom = true;
        push(nb);
      }
      alt = a;
    }
    /* 樹頂：用環幹枝（休息枝）一層層接到頂，最後一層為樹頂粗枝（高度約等於 topAlt，誤差 < 100） */
    while (alt < top - 100) { alt += 90; push({ side: 'W', len: 'M', style: 'b', alt: alt, kind: 'normal' }); }
    alt += 90; out.push({ side: 'W', len: 'M', style: 'a', alt: alt, kind: 'top', id: 'limbTop', x0: T.treeClimb.layout.cx - 180, x1: T.treeClimb.layout.cx + 180 });
    out.forEach(function (b, i) { b.uid = 'b' + i; });   /* 每根樹枝唯一識別（id 是素材 prop id，會重複；DOM key／脆枝計時請用 uid） */
    return out;
  }
  /* 靜態合成（預覽／匯出用）：鏡頭底端高度 camAlt 的完整畫面；App 實際遊玩請自己分層捲動 */
  function compose(camAlt, w, h, o) {
    o = o || {}; var Wd = W(), ch = Wd.chunkH, vw = Wd.viewW, vh = Wd.viewH, sc = w / vw, sky = skyAt(camAlt + vh / 2), s = '', gid = 'gtc' + H.nextId(), li, l, idx;
    s += '<defs><linearGradient id="' + gid + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + sky.top + '"/><stop offset="1" stop-color="' + sky.bottom + '"/></linearGradient></defs>' + rect(0, 0, vw, vh, 0, 'url(#' + gid + ')');
    if (sky.star > .02) s += '<g opacity="' + sky.star.toFixed(2) + '">' + stars(vw, vh).replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '') + '</g>';
    var layers = ['far', 'mid', 'trunk'], px = Wd.parallax;
    var drawLayer = function (name) {
      var cam = camAlt * px[name], lo = Math.floor(cam / ch) - 0, hi = Math.floor((cam + vh) / ch), k;
      for (k = lo; k <= hi; k++) { if (k < 0) continue; var yTop = vh - ((k + 1) * ch - cam); s += '<g transform="translate(0 ' + yTop.toFixed(1) + ')">' + chunk(name, k).replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '') + '</g>'; }
    };
    layers.forEach(drawLayer);
    (o.branches || []).forEach(function (b) {
      if (b.alt < camAlt - 120 || b.alt > camAlt + vh + 120) return;
      var y = vh - (b.alt - camAlt) - 14, st = b.id === 'limbBrittle' ? 'idle' : (b.id === 'limbTop' ? undefined : b.style), svgp = A.prop(b.id, st ? { state: st } : {}), inner = svgp.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
      var flip = b.side === 'L' ? 'translate(' + b.x1 + ' ' + y.toFixed(1) + ') scale(-1 1)' : 'translate(' + b.x0 + ' ' + y.toFixed(1) + ')';
      s += '<g transform="' + flip + '">' + inner + '</g>';
      if (b.shroom) s += '<g transform="translate(' + ((b.x0 + b.x1) / 2 - 32) + ' ' + (y + 14 - 50).toFixed(1) + ')">' + A.prop('springShroom').replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '') + '</g>';
    });
    drawLayer('near');
    (o.sprites || []).forEach(function (p) { var y = vh - (p.alt - camAlt); s += '<g transform="translate(' + p.x + ' ' + (y - (p.h || 0)).toFixed(1) + ')' + (p.flip ? ' scale(-1 1)' : '') + '">' + A.prop(p.id, p.state ? { state: p.state } : {}).replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '') + '</g>'; });
    return svg(vw, vh, s, 'g-tree-compose', { width: w, height: h || Math.round(vh * sc), style: 'overflow:hidden' });
  }

  A.treeBuild = build; A.treeExtent = extent; A.treeCompose = compose;
  A.treeChunk = chunk; A.treeSkyAt = skyAt; A.treeZoneAt = zoneAt; A.treeStars = stars; A.treeTrunkHalf = trunkHalf;
  A.treeInfo = function () { return T.treeClimb; };
})(typeof window !== 'undefined' ? window : globalThis);
