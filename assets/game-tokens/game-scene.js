/* game-scene.js — 森林場景：遠／中／近景＋地面＋樹冠前景，白天／夜晚。
 * GameArt.scene('forest', w, h, {time:'day'|'night', layers:[...]}) → 完整 SVG
 * GameArt.sceneLayers('forest', time, w, h) → {sky, far, mid, ground, near, canopy}（各為獨立 SVG，水平可無縫平鋪，供視差捲動）
 * 地面線在 h × groundLine（預設 0.8）。 */
(function (g) {
  var A = g.GameArt, H = A._h, T = H.T, C = T.color;
  var el = H.el, rect = H.rect, circ = H.circ, ell = H.ell, line = H.line, svg = H.svg;

  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  /* 物件靠近左右邊界時，另畫一份在對側，讓平鋪無縫 */
  function wrap(w, x, r, fn) { var s = '', d, ds = [-w, 0, w]; for (var i = 0; i < 3; i++) { d = ds[i]; if (x + d > -r && x + d < w + r) s += fn(x + d); } return s; }
  function wave(w, base, amp, k, ph, gy, step) {
    var d = 'M0 ' + gy + ' L0 ' + (base - amp * Math.sin(ph * 6.2832)).toFixed(1), x;
    for (x = step; x <= w + 0.1; x += step) d += ' L' + x + ' ' + (base - amp * Math.sin(6.2832 * (x / w * k + ph)) - amp * .35 * Math.sin(6.2832 * (x / w * (k * 2 + 1) + ph * 2))).toFixed(1);
    return d + ' L' + w + ' ' + gy + ' Z';
  }
  function rpath(d, fill, w) { return el('path', { d: d, fill: fill, stroke: fill, 'stroke-width': w, 'stroke-linejoin': 'round' }); }


  /* 攝影棚：柔和背景紙＋散景圓＋圓角舞台地板（專拍人物，製作最簡單） */
  function studioLayers(F, S, w, h, gy, u) {
    var out = {}, gid = 'gsky' + H.nextId(), r = rng(11), s = '', i;
    out.sky = '<defs><linearGradient id="' + gid + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + S.skyTop + '"/><stop offset="1" stop-color="' + S.skyBottom + '"/></linearGradient></defs>' + rect(0, 0, w, h, 0, 'url(#' + gid + ')');
    var cols = [S.bokehA, S.bokehB, S.bokehC];
    for (i = 0; i < 14; i++) { var bx = r() * w, by = h * (.08 + r() * .5), br = (22 + r() * 46) * u, bc = cols[i % 3]; s += wrap(w, bx, br, function (x) { return circ(x, by, br, bc, { opacity: (.35 + r() * .3).toFixed(2) }); }); }
    out.far = s;
    s = rect(0, gy, w, h - gy, 0, S.floor) + rect(0, gy, w, 10 * u, 0, S.floorEdge);
    for (i = 0; i < 3; i++) s += wrap(w, (i + .5) * w / 3, 220 * u, function (x) { return ell(x, gy + (h - gy) * .45, 200 * u, (h - gy) * .28, S.spot, { opacity: .35 }); });
    out.ground = s;
    var res = {}; F.layers.forEach(function (n) { res[n] = svg(w, h, out[n], 'g-layer g-layer-' + n); });
    res._inner = out; res._w = w; res._h = h; res._groundY = gy;
    return res;
  }

  /* 海底世界（商店場景，2026-10-20）：水色漸層＋光束、遠方礁岩、珊瑚與海草、沙地、前景海草、上方水面；
   * 夜晚：深藍水色＋發光浮游生物。沒有太陽月亮（celestial.hidden）。漂浮物理見 sceneInfo.physics。 */
  function oceanLayers(F, S, w, h, gy, u, night) {
    var out = {}, gid = 'gsky' + H.nextId(), r = rng(31), s = '', i;
    out.sky = '<defs><linearGradient id="' + gid + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + S.skyTop + '"/><stop offset="1" stop-color="' + S.skyBottom + '"/></linearGradient></defs>' + rect(0, 0, w, h, 0, 'url(#' + gid + ')');
    s = '';
    if (night) for (i = 0; i < 46; i++) s += circ((r() * w).toFixed(0), (r() * gy * .9 + 6).toFixed(0), (1 + r() * 2.2).toFixed(1), S.glow, { opacity: (.4 + r() * .5).toFixed(2) });
    out.stars = s;
    /* 光束（往下斜射，雲層的位置；會慢慢漂移） */
    s = '';
    [[.08, 70], [.3, 46], [.52, 84], [.78, 56]].forEach(function (b) { var bw = b[1] * u; s += wrap(w, w * b[0], 260 * u, function (x) { return el('path', { d: 'M' + (x - bw / 2) + ' 0 L' + (x + bw / 2) + ' 0 L' + (x + bw * 1.6 + 120 * u) + ' ' + gy + ' L' + (x + 120 * u - bw * .3) + ' ' + gy + ' Z', fill: S.ray, opacity: S.rayOpacity }); }); });
    out.clouds = s;
    /* 遠景：礁岩剪影與遠方海草 */
    r = rng(52); s = rpath(wave(w, gy - h * .16, h * .05, 2, .3, gy, 12), S.farRock, 0);
    for (i = 0; i < 12; i++) {
      var fx = (i + .3 + r() * .4) * w / 12, fh = (40 + r() * 50) * u;
      s += wrap(w, fx, 20 * u, function (x) { return el('path', { d: 'M' + x + ' ' + gy + ' Q' + (x - 10 * u) + ' ' + (gy - fh * .5) + ' ' + x + ' ' + (gy - fh) + ' Q' + (x + 10 * u) + ' ' + (gy - fh * .5) + ' ' + (x + 4 * u) + ' ' + gy + ' Z', fill: S.farWeed }); });
    }
    s += rpath(wave(w, gy - h * .06, h * .03, 3, .7, gy, 12), S.farRock2, 0);
    out.far = s;
    /* 中景：珊瑚（分枝珊瑚、圓腦珊瑚、扇形珊瑚）與高海草、幾條小魚 */
    r = rng(73); s = '';
    var corals = [S.coralA, S.coralB, S.coralC], M = 6, i2;
    for (i2 = 0; i2 < M; i2++) {
      var cx = (i2 + .25 + r() * .5) * w / M, k = (.85 + r() * .4) * u, col = corals[i2 % 3], kind = i2 % 3;
      s += wrap(w, cx, 90 * k, function (x) {
        if (kind === 0) return line(x, gy, x, gy - 70 * k, col, 12 * k) + line(x, gy - 40 * k, x - 26 * k, gy - 78 * k, col, 10 * k) + line(x, gy - 30 * k, x + 28 * k, gy - 66 * k, col, 10 * k) + line(x - 26 * k, gy - 78 * k, x - 30 * k, gy - 96 * k, col, 8 * k) + line(x + 28 * k, gy - 66 * k, x + 36 * k, gy - 86 * k, col, 8 * k) + line(x, gy - 70 * k, x + 4 * k, gy - 92 * k, col, 8 * k);
        if (kind === 1) return el('path', { d: 'M' + (x - 44 * k) + ' ' + gy + ' Q' + (x - 44 * k) + ' ' + (gy - 52 * k) + ' ' + x + ' ' + (gy - 52 * k) + ' Q' + (x + 44 * k) + ' ' + (gy - 52 * k) + ' ' + (x + 44 * k) + ' ' + gy + ' Z', fill: col }) + el('path', { d: 'M' + (x - 30 * k) + ' ' + (gy - 14 * k) + ' Q' + (x - 15 * k) + ' ' + (gy - 40 * k) + ' ' + x + ' ' + (gy - 18 * k) + ' Q' + (x + 15 * k) + ' ' + (gy - 40 * k) + ' ' + (x + 30 * k) + ' ' + (gy - 14 * k), stroke: S.coralLine, 'stroke-width': 4 * k, 'stroke-linecap': 'round', fill: 'none' });
        return el('path', { d: 'M' + x + ' ' + gy + ' L' + (x - 46 * k) + ' ' + (gy - 70 * k) + ' Q' + x + ' ' + (gy - 110 * k) + ' ' + (x + 46 * k) + ' ' + (gy - 70 * k) + ' Z', fill: col, stroke: col, 'stroke-width': 8 * k, 'stroke-linejoin': 'round' }) + line(x, gy, x - 26 * k, gy - 74 * k, S.coralLine, 3 * k) + line(x, gy, x, gy - 86 * k, S.coralLine, 3 * k) + line(x, gy, x + 26 * k, gy - 74 * k, S.coralLine, 3 * k);
      });
      var wx = cx + 70 * k, wh = (120 + r() * 60) * u;
      s += wrap(w, wx, 30 * u, function (x) { return el('path', { d: 'M' + x + ' ' + gy + ' C' + (x - 22 * u) + ' ' + (gy - wh * .3) + ' ' + (x + 22 * u) + ' ' + (gy - wh * .6) + ' ' + (x - 6 * u) + ' ' + (gy - wh), stroke: S.weed, 'stroke-width': 9 * u, 'stroke-linecap': 'round', fill: 'none' }); });
    }
    var fish = function (x, y, k, col) { return el('g', { transform: 'translate(' + x + ' ' + y + ') scale(' + k + ')' }, ell(0, 0, 16, 9, col) + el('path', { d: 'M12 0 L26 -9 L26 9 Z', fill: col, stroke: col, 'stroke-width': 3, 'stroke-linejoin': 'round' }) + circ(-8, -2, 2.4, S.fishEye)); };
    [[.18, .32, 1, S.fishA], [.46, .2, .8, S.fishB], [.7, .38, .9, S.fishA], [.9, .26, .7, S.fishB]].forEach(function (f) { s += wrap(w, w * f[0], 40 * u, function (x) { return fish(x, h * f[1], f[2] * u, f[3]); }); });
    out.mid = s;
    /* 地面：沙地、波紋、貝殼、海星 */
    r = rng(94); s = rect(0, gy, w, h - gy, 0, S.groundBody) + rect(0, gy - 4, w, 18, 0, S.groundTop);
    for (i2 = 0; i2 * 26 < w + 26; i2++) s += circ(i2 * 26, gy + 3, 14, S.groundTop);
    for (i2 = 0; i2 < 10; i2++) s += wrap(w, r() * w, 30, function (x) { var yy = gy + 30 * u + r() * (h - gy - 50 * u); return el('path', { d: 'M' + (x - 18 * u) + ' ' + yy + ' Q' + x + ' ' + (yy - 7 * u) + ' ' + (x + 18 * u) + ' ' + yy, stroke: S.ripple, 'stroke-width': 3 * u, 'stroke-linecap': 'round', fill: 'none' }); });
    for (i2 = 0; i2 < 4; i2++) s += wrap(w, (i2 + .5) * w / 4 + r() * 60, 30, function (x) { var yy = gy + 22 * u; return el('path', { d: 'M' + (x - 9 * u) + ' ' + yy + ' Q' + x + ' ' + (yy - 14 * u) + ' ' + (x + 9 * u) + ' ' + yy + ' Z', fill: S.shell, stroke: S.shell, 'stroke-width': 3, 'stroke-linejoin': 'round' }); });
    for (i2 = 0; i2 < 3; i2++) s += wrap(w, (i2 + .2) * w / 3 + r() * 80, 30, function (x) { var yy = gy + 46 * u, d = '', a; for (a = 0; a < 10; a++) { var rr = a % 2 ? 5 * u : 12 * u, an = -Math.PI / 2 + a * Math.PI / 5; d += (a ? ' L' : 'M') + (x + rr * Math.cos(an)).toFixed(1) + ' ' + (yy + rr * Math.sin(an)).toFixed(1); } return el('path', { d: d + ' Z', fill: S.star, stroke: S.star, 'stroke-width': 3, 'stroke-linejoin': 'round' }); });
    out.ground = s;
    /* 近景：海草叢（像森林的樹叢，略超出畫面下緣）＋幾顆靜止氣泡 */
    r = rng(115); s = '';
    for (i2 = 0; i2 < 9; i2++) {
      var nx = (i2 + .2 + r() * .6) * w / 9, nh = (60 + r() * 50) * u;
      s += wrap(w, nx, 40 * u, function (x) { var b = h + 10 * u, out2 = '', q; for (q = -1; q <= 1; q++) out2 += el('path', { d: 'M' + (x + q * 10 * u) + ' ' + b + ' C' + (x + q * 10 * u - 16 * u) + ' ' + (b - nh * .4) + ' ' + (x + q * 10 * u + 16 * u) + ' ' + (b - nh * .7) + ' ' + (x + q * 14 * u) + ' ' + (b - nh * (1 - Math.abs(q) * .25)), stroke: S.weedNear, 'stroke-width': 11 * u, 'stroke-linecap': 'round', fill: 'none' }); return out2; });
    }
    for (i2 = 0; i2 < 10; i2++) { var bx = r() * w, by = gy - r() * h * .6, br = (3 + r() * 6) * u; s += wrap(w, bx, br, function (x) { return circ(x, by, br, 'none', { stroke: S.bubble, 'stroke-width': 2 * u, opacity: .7 }) + circ(x - br * .35, by - br * .35, br * .25, S.bubble, { opacity: .8 }); }); }
    out.near = s;
    /* 上方水面：波浪亮帶 */
    s = rect(0, 0, w, 16 * u, 0, S.surface, { opacity: .55 }) + el('path', { d: wave(w, 22 * u, 7 * u, 6, .2, 0, 10), fill: S.surface, opacity: .35 });
    out.canopy = s;
    var res = {}; F.layers.forEach(function (n) { res[n] = svg(w, h, out[n] || '', 'g-layer g-layer-' + n); });
    res._inner = out; res._w = w; res._h = h; res._groundY = gy;
    return res;
  }

  /* 宇宙空間（商店場景，2026-10-20）：深藍紫漸層、銀河帶（clouds 層：視差 .02，跟雲一樣緩慢漂移）、星星（far，大顆的會閃）、
   * 行星／星雲／彗星（mid）、前景星塵（near）。沒有地面也沒有太陽月亮；無重力物理見 sceneInfo.physics（space）。
   * 平鋪無縫：所有隨機值都先算好再交給 wrap（同一物件在左右兩側的複本完全一樣）。 */
  function spaceLayers(F, S, w, h, gy, u, night) {
    var out = {}, gid = 'gsky' + H.nextId(), r, s, i;
    out.sky = '<defs><linearGradient id="' + gid + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + S.skyTop + '"/><stop offset="1" stop-color="' + S.skyBottom + '"/></linearGradient></defs>' + rect(0, 0, w, h, 0, 'url(#' + gid + ')');
    /* 銀河：沿著週期曲線排半透明橢圓（順著曲線斜度旋轉）＋亮核＋密集小星點 */
    var bandY = function (x) { return h * .36 + h * .13 * Math.sin(6.2832 * x / w + .8); };
    var bandA = function (x) { return Math.atan(h * .13 * 6.2832 / w * Math.cos(6.2832 * x / w + .8)) * 57.2958; };
    r = rng(201); s = '';
    for (i = 0; i < 28; i++) {
      (function () {
        var bx = (i + r() * .6) * w / 28, by = bandY(bx) + (r() - .5) * h * .05, rx = (80 + r() * 60) * u, ry = (24 + r() * 20) * u, col = i % 3 === 0 ? S.nebulaA : S.milky, op = (.1 + r() * .1).toFixed(2), a = bandA(bx).toFixed(1);
        s += wrap(w, bx, rx, function (x) { return ell(x, by, rx, ry, col, { opacity: op, transform: 'rotate(' + a + ' ' + x.toFixed(1) + ' ' + by.toFixed(1) + ')' }); });
      })();
    }
    for (i = 0; i < 16; i++) {
      (function () {
        var bx = (i + r() * .6) * w / 16, by = bandY(bx), rx = (60 + r() * 40) * u, ry = (8 + r() * 6) * u, op = (.12 + r() * .1).toFixed(2), a = bandA(bx).toFixed(1);
        s += wrap(w, bx, rx, function (x) { return ell(x, by, rx, ry, S.milkyCore, { opacity: op, transform: 'rotate(' + a + ' ' + x.toFixed(1) + ' ' + by.toFixed(1) + ')' }); });
      })();
    }
    for (i = 0; i < 170; i++) {
      (function () {
        var bx = r() * w, by = bandY(bx) + (r() + r() - 1) * h * .08, rr = ((.5 + r() * .9) * u).toFixed(2), op = (.45 + r() * .5).toFixed(2);
        s += wrap(w, bx, 2, function (x) { return circ(x.toFixed(1), by.toFixed(1), rr, S.star, { opacity: op }); });
      })();
    }
    out.clouds = s;
    /* 星星：小點（三種色溫）＋大顆四角星（會閃，各自錯開動畫時間） */
    r = rng(233); s = '';
    var cols = [S.star, S.star, S.starWarm, S.starCool];
    for (i = 0; i < 120; i++) {
      (function () {
        var sx = r() * w, sy = r() * h, rr = ((.7 + r() * 1.4) * u).toFixed(2), col = cols[i % 4], op = (.5 + r() * .5).toFixed(2), tw = i % 7 === 0, dl = (r() * 2.8).toFixed(1);
        s += wrap(w, sx, 3, function (x) { var c = circ(x.toFixed(1), sy.toFixed(1), rr, col, { opacity: op }); return tw ? el('g', { class: 'g-twinkle', style: 'animation-delay:-' + dl + 's' }, c) : c; });
      })();
    }
    for (i = 0; i < 14; i++) {
      (function () {
        var sx = (i + .2 + r() * .6) * w / 14, sy = h * (.05 + r() * .8), k = (4 + r() * 4) * u, col = i % 3 === 1 ? S.starWarm : S.star, dl = (r() * 2.8).toFixed(1);
        s += wrap(w, sx, k, function (x) {
          var d = 'M' + x + ' ' + (sy - k) + ' Q' + x + ' ' + sy + ' ' + (x + k) + ' ' + sy + ' Q' + x + ' ' + sy + ' ' + x + ' ' + (sy + k) + ' Q' + x + ' ' + sy + ' ' + (x - k) + ' ' + sy + ' Q' + x + ' ' + sy + ' ' + x + ' ' + (sy - k) + ' Z';
          return el('g', { class: 'g-twinkle', style: 'animation-delay:-' + dl + 's' }, el('path', { d: d, fill: col }) + circ(x, sy, k * .28, col));
        });
      })();
    }
    out.far = s;
    /* 中景：星雲、土星環行星、藍色小行星球、小衛星、彗星、遠方的小石塊 */
    r = rng(271); s = '';
    [[.12, .7, 150, 70, S.nebulaB], [.48, .2, 130, 56, S.nebulaA], [.83, .78, 170, 64, S.nebulaB]].forEach(function (n) {
      s += wrap(w, w * n[0], n[2] * u, function (x) { return ell(x, h * n[1], n[2] * u, n[3] * u, n[4], { opacity: .12 }) + ell(x + 20 * u, h * n[1] - 8 * u, n[2] * .55 * u, n[3] * .5 * u, n[4], { opacity: .12 }); });
    });
    var R = 40 * u, cid = 'gclip' + H.nextId();
    s += wrap(w, w * .2, R * 2.2, function (x) {
      var y = h * .26, rid = cid + (x < 0 ? 'l' : x > w ? 'r' : 'c');
      return el('g', { transform: 'rotate(-14 ' + x.toFixed(1) + ' ' + y.toFixed(1) + ')' },
        ell(x, y, R * 1.9, R * .45, 'none', { stroke: S.planetRing, 'stroke-width': 6 * u, opacity: .9 })
        + '<clipPath id="' + rid + '"><circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + R.toFixed(1) + '"/></clipPath>'
        + el('g', { 'clip-path': 'url(#' + rid + ')' }, circ(x, y, R, S.planetA) + ell(x, y - R * .3, R * 1.2, R * .12, S.planetAShade, { opacity: .45 }) + ell(x, y + R * .25, R * 1.2, R * .16, S.planetAShade, { opacity: .45 }) + circ(x + R * .55, y + R * .5, R * .95, S.planetAShade, { opacity: .5 }))
        + el('path', { d: 'M' + (x - R * 1.9).toFixed(1) + ' ' + y.toFixed(1) + ' A' + (R * 1.9).toFixed(1) + ' ' + (R * .45).toFixed(1) + ' 0 0 0 ' + (x + R * 1.9).toFixed(1) + ' ' + y.toFixed(1), stroke: S.planetRing, 'stroke-width': 6 * u, 'stroke-linecap': 'round', fill: 'none' }));
    });
    var R2 = 24 * u, cid2 = 'gclip' + H.nextId();
    s += wrap(w, w * .72, R2, function (x) {
      var y = h * .6, rid = cid2 + (x < 0 ? 'l' : x > w ? 'r' : 'c');
      return '<clipPath id="' + rid + '"><circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + R2.toFixed(1) + '"/></clipPath>'
        + el('g', { 'clip-path': 'url(#' + rid + ')' }, circ(x, y, R2, S.planetB) + circ(x + R2 * .6, y + R2 * .45, R2 * .95, S.planetBShade, { opacity: .6 }) + circ(x - R2 * .35, y - R2 * .2, R2 * .22, S.planetBCrater) + circ(x + R2 * .2, y + R2 * .3, R2 * .14, S.planetBCrater) + circ(x - R2 * .05, y - R2 * .55, R2 * .1, S.planetBCrater));
    });
    s += wrap(w, w * .5, 12 * u, function (x) { var y = h * .14; return circ(x, y, 10 * u, S.moon) + circ(x + 3 * u, y + 3 * u, 7 * u, S.moonShade, { opacity: .5 }) + circ(x - 3 * u, y - 2 * u, 2 * u, S.moonShade); });
    s += wrap(w, w * .9, 80 * u, function (x) { var y = h * .12; return el('path', { d: 'M' + x + ' ' + (y - 5 * u) + ' L' + (x - 74 * u) + ' ' + (y - 30 * u) + ' L' + (x - 70 * u) + ' ' + (y - 22 * u) + ' L' + x + ' ' + (y + 5 * u) + ' Z', fill: S.comet, opacity: .28 }) + circ(x, y, 5.5 * u, S.comet); });
    for (i = 0; i < 9; i++) {
      (function () {
        var ax = (i + .3 + r() * .4) * w / 9, ay = h * (.1 + r() * .8), ar = (3 + r() * 4) * u, a2 = (r() * 3).toFixed(2);
        s += wrap(w, ax, ar * 2, function (x) { return ell(x, ay, ar * 1.3, ar, S.moonShade, { opacity: .8, transform: 'rotate(' + (a2 * 40).toFixed(0) + ' ' + x.toFixed(1) + ' ' + ay.toFixed(1) + ')' }) + circ(x - ar * .3, ay - ar * .2, ar * .3, S.moon, { opacity: .7 }); });
      })();
    }
    out.mid = s;
    /* 前景星塵（蓋在角色前面，很淡很小，不擋視線） */
    r = rng(307); s = '';
    for (i = 0; i < 16; i++) {
      (function () {
        var dx = r() * w, dy = h * (.05 + r() * .9), rr = ((1.2 + r() * 1.4) * u).toFixed(2), op = (.3 + r() * .3).toFixed(2);
        s += wrap(w, dx, 4, function (x) { return circ(x.toFixed(1), dy.toFixed(1), rr, S.dust, { opacity: op }); });
      })();
    }
    out.near = s;
    var res = {}; F.layers.forEach(function (n) { res[n] = svg(w, h, out[n] || '', 'g-layer g-layer-' + n); });
    res._inner = out; res._w = w; res._h = h; res._groundY = gy;
    return res;
  }

  /* 夜光墓園（萬聖節商店場景）：暮光暮色／幽冥月夜、遠方尖塔古堡、鐵花柵欄、枯木老樹、南瓜墓碑與地表夜光小精靈；
   * 恐怖又可愛的童趣風格。重力微輕盈（物理參數見 sceneInfo.physics.graveyard）。 */
  function graveyardLayers(F, S, w, h, gy, u, night) {
    var out = {}, gid = 'gsky' + H.nextId(), r = rng(42), s = '', i;
    out.sky = '<defs><linearGradient id="' + gid + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + S.skyTop + '"/><stop offset="1" stop-color="' + S.skyBottom + '"/></linearGradient></defs>' + rect(0, 0, w, h, 0, 'url(#' + gid + ')');
    s = '';
    for (i = 0; i < 30; i++) {
      var sx = (r() * w).toFixed(0), sy = (r() * gy * 0.7 + 10).toFixed(0), sr = (1 + r() * 1.8).toFixed(1);
      s += circ(sx, sy, sr, S.star, { opacity: (0.35 + r() * 0.55).toFixed(2), 'class': 'g-twinkle' });
    }
    out.stars = s;
    s = '';
    var gcloud = function (x, y, k) {
      return el('g', { transform: 'translate(' + x + ' ' + y + ') scale(' + k + ')', opacity: S.cloudOpacity },
        rect(0, 18, 110, 26, 13, S.cloud) + circ(30, 20, 22, S.cloud) + circ(65, 14, 26, S.cloud) + circ(90, 24, 16, S.cloud)
        + el('path', { d: 'M0 26 Q-18 20 -24 30 Q-12 36 0 34 Z', fill: S.cloud })
      );
    };
    [[0.08, 0.12, 1.0], [0.42, 0.22, 0.8], [0.72, 0.08, 0.95], [0.92, 0.25, 0.75]].forEach(function (c) {
      s += wrap(w, w * c[0], 150 * u, function (x) { return gcloud(x, h * c[1], c[2] * u); });
    });
    out.clouds = s;
    r = rng(66); s = '';
    s += rpath(wave(w, gy - h * 0.22, h * 0.05, 2, 0.2, gy, 12), S.farHill, 0);
    var castleX = w * 0.72, castleY = gy - h * 0.22;
    s += el('g', { transform: 'translate(' + castleX + ' ' + castleY + ')' },
      rect(-40 * u, -60 * u, 80 * u, 60 * u, 4 * u, S.farCastle)
      + el('path', { d: 'M' + (-30 * u) + ' ' + (-60 * u) + ' L' + (-20 * u) + ' ' + (-100 * u) + ' L' + (-10 * u) + ' ' + (-60 * u) + ' Z', fill: S.farCastle })
      + el('path', { d: 'M' + (10 * u) + ' ' + (-60 * u) + ' L' + (20 * u) + ' ' + (-90 * u) + ' L' + (30 * u) + ' ' + (-60 * u) + ' Z', fill: S.farCastle })
      + rect(-10 * u, -75 * u, 20 * u, 75 * u, 2 * u, S.farCastle)
      + el('path', { d: 'M' + (-12 * u) + ' ' + (-75 * u) + ' L0 ' + (-115 * u) + ' L' + (12 * u) + ' ' + (-75 * u) + ' Z', fill: S.farCastle })
    );
    out.far = s;
    r = rng(88); s = '';
    var fencePosts = 16;
    for (i = 0; i < fencePosts; i++) {
      var fx = i * w / fencePosts;
      s += wrap(w, fx, 30 * u, function (x) {
        return line(x, gy, x, gy - 36 * u, S.midFence, 4 * u)
          + circ(x, gy - 38 * u, 3.5 * u, S.midFence)
          + line(x - 10 * u, gy - 20 * u, x + 30 * u, gy - 20 * u, S.midFence, 2.5 * u)
          + line(x - 10 * u, gy - 10 * u, x + 30 * u, gy - 10 * u, S.midFence, 2.5 * u);
      });
    }
    [[0.15, 1.1], [0.85, 0.95]].forEach(function (tr) {
      var tx = w * tr[0], tk = tr[1] * u;
      s += wrap(w, tx, 80 * tk, function (x) {
        return el('path', {
          d: 'M' + (x - 14 * tk) + ' ' + gy + ' Q' + (x - 8 * tk) + ' ' + (gy - 60 * tk) + ' ' + (x - 28 * tk) + ' ' + (gy - 110 * tk)
            + ' Q' + (x - 18 * tk) + ' ' + (gy - 100 * tk) + ' ' + (x - 4 * tk) + ' ' + (gy - 70 * tk)
            + ' Q' + (x + 12 * tk) + ' ' + (gy - 120 * tk) + ' ' + (x + 28 * tk) + ' ' + (gy - 130 * tk)
            + ' Q' + (x + 16 * tk) + ' ' + (gy - 100 * tk) + ' ' + (x + 12 * tk) + ' ' + (gy - 60 * tk)
            + ' Q' + (x + 18 * tk) + ' ' + (gy - 80 * tk) + ' ' + (x + 36 * tk) + ' ' + (gy - 95 * tk)
            + ' Q' + (x + 24 * tk) + ' ' + (gy - 70 * tk) + ' ' + (x + 14 * tk) + ' ' + gy + ' Z',
          fill: S.midTree, stroke: S.midTree, 'stroke-width': 4 * tk, 'stroke-linejoin': 'round'
        });
      });
    });
    [[0.28, 0.9], [0.48, 1.05], [0.65, 0.85]].forEach(function (tb) {
      var bx = w * tb[0], bk = tb[1] * u;
      s += wrap(w, bx, 50 * bk, function (x) {
        var tstone = el('path', {
          d: 'M' + (x - 18 * bk) + ' ' + gy + ' L' + (x - 18 * bk) + ' ' + (gy - 36 * bk)
            + ' Q' + x + ' ' + (gy - 56 * bk) + ' ' + (x + 18 * bk) + ' ' + (gy - 36 * bk)
            + ' L' + (x + 18 * bk) + ' ' + gy + ' Z',
          fill: S.midTomb, stroke: S.midTomb, 'stroke-width': 4 * bk, 'stroke-linejoin': 'round'
        });
        var etch = line(x, gy - 24 * bk, x, gy - 40 * bk, S.midFence, 2.5 * bk)
          + line(x - 7 * bk, gy - 33 * bk, x + 7 * bk, gy - 33 * bk, S.midFence, 2.5 * bk);
        var px = x + 16 * bk, py = gy - 10 * bk;
        var pkin = circ(px, py, 11 * bk, S.pumpkin)
          + rect(px - 1.5 * bk, py - 14 * bk, 3 * bk, 4 * bk, 1.5 * bk, '#3A7330')
          + circ(px - 3.5 * bk, py - 1 * bk, 1.4 * bk, S.midFence)
          + circ(px + 3.5 * bk, py - 1 * bk, 1.4 * bk, S.midFence)
          + el('path', { d: 'M' + (px - 4 * bk) + ' ' + (py + 3 * bk) + ' Q' + px + ' ' + (py + 6 * bk) + ' ' + (px + 4 * bk) + ' ' + (py + 3 * bk), stroke: S.midFence, 'stroke-width': 1.6 * bk, fill: 'none', 'stroke-linecap': 'round' });
        return tstone + etch + pkin;
      });
    });
    out.mid = s;
    s = rect(0, gy, w, h - gy, 0, S.groundBody) + rect(0, gy - 4, w, 20, 0, S.groundTop);
    for (i = 0; i * 26 < w + 26; i++) s += circ(i * 26, gy + 3, 14, S.groundTop);
    for (i = 0; i < 7; i++) {
      var mx = (i + 0.3 + r() * 0.4) * w / 7, my = gy + (4 + r() * 8) * u;
      s += wrap(w, mx, 20 * u, function (x) {
        return line(x, my + 8 * u, x, my, '#E8F5E2', 3 * u)
          + ell(x, my, 8 * u, 5 * u, S.shroom)
          + circ(x - 3 * u, my - 1 * u, 1.2 * u, '#FFFFFF')
          + circ(x + 3 * u, my - 1 * u, 1.2 * u, '#FFFFFF');
      });
    }
    out.ground = s;
    r = rng(99); s = '';
    for (i = 0; i < 11; i++) {
      var nx = (i + 0.2 + r() * 0.6) * w / 11, nh = (36 + r() * 30) * u;
      s += wrap(w, nx, 36 * u, function (x) {
        var b = h + 6 * u;
        return el('path', {
          d: 'M' + (x - 16 * u) + ' ' + b + ' Q' + (x - 20 * u) + ' ' + (b - nh * 0.7) + ' ' + (x - 8 * u) + ' ' + (b - nh)
            + ' Q' + x + ' ' + (b - nh * 0.5) + ' ' + (x + 8 * u) + ' ' + (b - nh * 0.9)
            + ' Q' + (x + 18 * u) + ' ' + (b - nh * 0.4) + ' ' + (x + 16 * u) + ' ' + b + ' Z',
          fill: S.nearBush
        });
      });
    }
    for (i = 0; i < 9; i++) {
      var wx = r() * w, wy = gy - (15 + r() * 110) * u, wr = (3.5 + r() * 3.5) * u;
      s += wrap(w, wx, wr * 2, function (x) {
        return circ(x, wy, wr * 1.8, S.wisp, { opacity: (S.wispOpacity * 0.35).toFixed(2), 'class': 'g-glow' })
          + circ(x, wy, wr, S.wisp, { opacity: S.wispOpacity, 'class': 'g-twinkle' });
      });
    }
    out.near = s;
    var res2 = {}; F.layers.forEach(function (n) { res2[n] = svg(w, h, out[n] || '', 'g-layer g-layer-' + n); });
    res2._inner = out; res2._w = w; res2._h = h; res2._groundY = gy;
    return res2;
  }

  function layers(id, time, w, h) {
    var F = C.world.scene[id]; if (!F) throw new Error('未知場景：' + id);
    var S = F[time || 'day']; if (!S) throw new Error('未知時段：' + time);
    w = w || 960; h = h || 540;
    var gy = Math.round(h * (F.groundLine || .8)), night = time === 'night', u = h / 540, out = {};
    if (id === 'studio') return studioLayers(F, S, w, h, gy, u);
    if (id === 'ocean') return oceanLayers(F, S, w, h, gy, u, night);
    if (id === 'space') return spaceLayers(F, S, w, h, gy, u, night);
    if (id === 'graveyard') return graveyardLayers(F, S, w, h, gy, u, night);

    /* ---- 天空（只有漸層）、星星、雲；太陽月亮是獨立物件 ---- */
    var gid = 'gsky' + H.nextId(), r = rng(7), s = '';
    s += '<defs><linearGradient id="' + gid + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + S.skyTop + '"/><stop offset="1" stop-color="' + S.skyBottom + '"/></linearGradient></defs>' + rect(0, 0, w, h, 0, 'url(#' + gid + ')');
    out.sky = s;
    s = '';
    if (night) for (var i = 0; i < 34; i++) s += circ((r() * w).toFixed(0), (r() * gy * .62 + 8).toFixed(0), (.9 + r() * 1.7).toFixed(1), S.star, { opacity: (.45 + r() * .5).toFixed(2) });
    out.stars = s;
    var cloud = function (x, y, k) { return el('g', { transform: 'translate(' + x + ' ' + y + ') scale(' + k + ')', opacity: S.cloudOpacity }, rect(0, 22, 96, 24, 12, S.cloud) + circ(28, 24, 20, S.cloud) + circ(58, 18, 24, S.cloud) + circ(80, 30, 14, S.cloud)); };
    s = '';
    [[.06, .1, 1.1], [.38, .21, .8], [.62, .07, .95], [.86, .26, .7]].forEach(function (c) { s += wrap(w, w * c[0], 130 * u, function (x) { return cloud(x, h * c[1], c[2] * u); }); });
    out.clouds = s;

    /* ---- 遠景：薄霧丘陵與小樹 ---- */
    r = rng(21); s = '';
    s += rpath(wave(w, gy - h * .20, h * .045, 2, .12, gy, 12), S.farHill, 0);
    var N = 17, i2;
    for (i2 = 0; i2 < N; i2++) {
      var x = (i2 + .2 + r() * .6) * w / N, rr = (15 + r() * 15) * u, by = gy - h * (.17 + r() * .06), col = i2 % 2 ? S.farTree : S.farTree2;
      s += wrap(w, x, 60 * u, function (xx) { return rect(xx - 3 * u, by, 6 * u, 40 * u, 3 * u, col) + circ(xx, by - rr * .2, rr, col) + circ(xx - rr * .6, by + rr * .3, rr * .7, col) + circ(xx + rr * .6, by + rr * .3, rr * .7, col); });
    }
    s += rpath(wave(w, gy - h * .075, h * .04, 3, .4, gy, 12), S.farHill2, 0);
    out.far = s;

    /* ---- 中景：主要樹木 ---- */
    r = rng(42); s = ''; var M = 7;
    for (i2 = 0; i2 < M; i2++) {
      var mx = (i2 + .25 + r() * .5) * w / M, k = (.85 + r() * .5) * u, th = 150 * k, y0 = gy - th - 8 * k;
      s += wrap(w, mx, 110 * k, function (x2) {
        return rect(x2 - 11 * k, gy - th, 22 * k, th + 6 * k, 11 * k, S.midTrunk) + rect(x2 + 2 * k, gy - th + 6 * k, 7 * k, th - 4 * k, 3.5 * k, S.midTrunkLedge, { opacity: .8 })
          + circ(x2 - 38 * k, y0 + 24 * k, 34 * k, S.canopyDeep) + circ(x2 + 38 * k, y0 + 24 * k, 34 * k, S.canopyDeep)
          + circ(x2, y0, 50 * k, S.canopy)
          + circ(x2 - 30 * k, gy - 4 * k, 9 * k, S.canopyDeep) + circ(x2 + 28 * k, gy - 3 * k, 7 * k, S.canopyDeep);
      });
      if (i2 % 3 === 1) s += wrap(w, mx + 70 * k, 40 * k, function (x3) { return rect(x3 - 4 * k, gy - 12 * k, 8 * k, 14 * k, 4 * k, N2(S)) + el('path', { d: 'M' + (x3 - 14 * k) + ' ' + (gy - 10 * k) + ' Q' + (x3 - 14 * k) + ' ' + (gy - 26 * k) + ' ' + x3 + ' ' + (gy - 26 * k) + ' Q' + (x3 + 14 * k) + ' ' + (gy - 26 * k) + ' ' + (x3 + 14 * k) + ' ' + (gy - 10 * k) + ' Z', fill: S.midMush, stroke: S.midMush, 'stroke-width': 3, 'stroke-linejoin': 'round' }); });
    }
    function N2(S2) { return C.hue.wood.soft; }
    out.mid = s;

    /* ---- 地面（可踩的地方） ---- */
    r = rng(63); s = rect(0, gy, w, h - gy, 0, S.groundBody) + rect(0, gy - 4, w, 22, 0, S.groundTop);
    for (i2 = 0; i2 * 22 < w + 22; i2++) s += circ(i2 * 22, gy + 4, 15, S.groundTop);
    for (i2 = 0; i2 < 14; i2++) s += wrap(w, r() * w, 20, function (x4) { return ell(x4, gy + 34 * u + r() * (h - gy - 50 * u), (6 + r() * 8) * u, (3.5 + r() * 3) * u, S.groundStone); });
    out.ground = s;

    /* ---- 近景：單色樹叢（連續起伏的圓弧輪廓，略超出畫面下緣；不放花草）、（夜晚）螢火蟲 ---- */
    r = rng(84); s = '';
    var B = 4, bush = function (cx, bw, bh, n) {
      var x0 = cx - bw / 2, base = h + 14 * u, d = 'M' + x0.toFixed(1) + ' ' + base.toFixed(1), pts = [], q;
      for (q = 0; q <= n; q++) { var t = q / n, env = Math.sin(Math.PI * t) * .55 + .45 * Math.sin(Math.PI * t) * Math.sin(Math.PI * t); pts.push([x0 + bw * t, base - bh * (.35 + .65 * env) + (q % 2 ? 0 : -bh * .06)]); }
      d += ' L' + pts[0][0].toFixed(1) + ' ' + pts[0][1].toFixed(1);
      for (q = 1; q <= n; q++) { var dx = pts[q][0] - pts[q - 1][0], dy = pts[q][1] - pts[q - 1][1], rad = Math.sqrt(dx * dx + dy * dy) * .6; d += ' A' + rad.toFixed(1) + ' ' + rad.toFixed(1) + ' 0 0 1 ' + pts[q][0].toFixed(1) + ' ' + pts[q][1].toFixed(1); }
      return el('path', { d: d + ' L' + (x0 + bw).toFixed(1) + ' ' + base.toFixed(1) + ' Z', fill: S.bush, stroke: S.bush, 'stroke-width': 6, 'stroke-linejoin': 'round' });
    };
    for (i2 = 0; i2 < B; i2++) {
      var bx = (i2 + .2 + r() * .6) * w / B, bw = (230 + r() * 90) * u, bh = (62 + r() * 26) * u, nb = 5 + Math.floor(r() * 2);
      s += wrap(w, bx, bw, function (x5) { return bush(x5, bw, bh, nb); });
    }
    if (night) for (i2 = 0; i2 < 12; i2++) {
      var ffx = r() * w, ffy = gy - h * (.04 + r() * .3), dl = (r() * 3).toFixed(1);
      s += el('g', { class: 'g-firefly', style: 'animation-delay:-' + dl + 's' }, circ(ffx, ffy, 8 * u, S.firefly, { opacity: .25 }) + circ(ffx, ffy, 3 * u, S.firefly));
    }
    out.near = s;

    /* ---- 樹冠前景（上方懸垂） ---- */
    r = rng(105); s = ''; var K = 8;
    for (i2 = 0; i2 < K; i2++) {
      var kx = (i2 + r() * .8) * w / K, kr = (46 + r() * 34) * u, col2 = i2 % 2 ? S.canopyTop : S.canopyTop2;
      s += wrap(w, kx, kr * 2, function (x8) { return circ(x8, -10 * u + r() * 14 * u, kr, col2) + circ(x8 + kr * .7, 8 * u, kr * .6, col2); });
    }
    for (i2 = 0; i2 < 4; i2++) {
      var vx = (i2 + .3 + r() * .4) * w / 4, vl = (60 + r() * 70) * u;
      s += wrap(w, vx, 20, function (x9) { return line(x9, 10 * u, x9, vl, S.canopyTop, 4 * u) + circ(x9 - 7 * u, vl * .5, 6 * u, S.canopyTop) + circ(x9 + 7 * u, vl * .75, 6 * u, S.canopyTop) + circ(x9, vl, 7 * u, S.canopyTop2); });
    }
    out.canopy = s;

    var res = {}; F.layers.forEach(function (n) { res[n] = svg(w, h, out[n], 'g-layer g-layer-' + n); });
    res._inner = out; res._w = w; res._h = h; res._groundY = gy;
    return res;
  }

  /* 一天的時間軸 u∈[0,1)：0 日出、0.25 正午、0.5 日落/月出、0.75 午夜、1 月落 */
  function sm(a, b, x) { var t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); }
  function mixc(h1, h2, t) { var p = function (h) { h = h.replace('#', ''); return [0, 2, 4].map(function (i) { return parseInt(h.substr(i, 2), 16); }); }, a = p(h1), b = p(h2); return '#' + a.map(function (v, i) { var q = Math.round(v + (b[i] - v) * t); return ('0' + q.toString(16)).slice(-2); }).join(''); }
  function skyAt(id, u) {
    var F = C.world.scene[id], Z = F.celestial; u = ((u % 1) + 1) % 1;
    var d = Z.nightStrength.dusk, n = Z.nightStrength.dawn, nf;
    if (u < .25) nf = 1 - sm(n[0], n[1], u + 1); else if (u < .75) nf = sm(d[0], d[1], u); else nf = 1 - sm(n[0], n[1], u);
    var tw = 1 - Math.abs(nf * 2 - 1), isDusk = u > .25 && u < .75, tint = Z.twilight.tint[isDusk ? 0 : 1];
    var top = mixc(mixc(F.day.skyTop, F.night.skyTop, nf), tint, Z.twilight.amount * tw * .55), bot = mixc(mixc(F.day.skyBottom, F.night.skyBottom, nf), tint, Z.twilight.amount * tw);
    function arc(c, lo) { var k = (u - lo) / .5, on = k >= 0 && k <= 1; return { visible: on, x: c.x[0] + (c.x[1] - c.x[0]) * k, y: c.yHorizon - (c.yHorizon - c.yPeak) * Math.sin(Math.PI * Math.max(0, Math.min(1, k))), size: c.size }; }
    var sunO = arc(Z.sun, 0), e = Math.sin(Math.PI * Math.max(0, Math.min(1, u / .5)));   /* e：太陽高度 0（地平線）~1（正午） */
    var ramp = Z.sunColor; sunO.color = e < ramp.mid[0] ? mixc(ramp.low, ramp.mid[1], e / ramp.mid[0]) : mixc(ramp.mid[1], ramp.noon, (e - ramp.mid[0]) / (1 - ramp.mid[0]));
    var moonO = arc(Z.moon, .5); if (Z.hidden) { sunO.visible = false; moonO.visible = false; }
    return { u: u, night: nf, top: top, bottom: bot, sun: sunO, moon: moonO };
  }
  function nest(id, cx, cy, size, st) { return '<svg overflow="visible" x="' + (cx - size / 2) + '" y="' + (cy - size / 2) + '" width="' + size + '" height="' + size + '" viewBox="0 0 120 120">' + A.prop(id, st ? { state: st } : {}).replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '') + '</svg>'; }

  var F_RISE = 6, F_SET = 18;   /* 系統時間對應：06:00 日出、18:00 日落 */
  function scene(id, w, h, o) {
    o = o || {}; w = w || 960; h = h || 540;
    var time = o.time || 'day', L = layers(id, time, w, h), F = C.world.scene[id], use = o.layers || F.layers, s = '';
    var K = skyAt(id, o.u != null ? o.u : (time === 'night' ? .75 : .25));
    F.layers.forEach(function (n) {
      if (use.indexOf(n) < 0) return;
      s += L._inner[n];
      if (n === 'stars' && !(F.celestial && F.celestial.hidden)) {
        var obj = time === 'night' ? K.moon : K.sun;
        var moonState = id === 'graveyard' ? 'skull' : 'round';
        s += nest(time === 'night' ? 'moon' : 'sun', obj.x * w, obj.y * h, obj.size * h * (time === 'night' ? 1.1 : 1), time === 'night' ? moonState : null);
      }
    });
    return svg(w, h, s, 'g-scene g-scene-' + id + ' g-' + time, { preserveAspectRatio: 'xMidYMid slice' });
  }

  A.scene = scene; A.sceneLayers = layers; A.skyAt = skyAt; A.uFromDate = function (d) { d = d || new Date(); var h = d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600, r = F_RISE, st = F_SET; if (h >= r && h < st) return (h - r) / (st - r) * .5; var n = h >= st ? h - st : h + 24 - st; return .5 + n / (24 - (st - r)) * .5; };
  A.scenes = Object.keys(C.world.scene); A.sceneTimes = ['day', 'night']; A.sceneInfo = C.world.scene;
})(typeof window !== 'undefined' ? window : globalThis);
