/* game-race.js — 賽跑素材（v0.8）：對手動物（烏龜／兔子／鴕鳥）與賽跑道具。
 * GameArt.animal(kind, {pose, t, facing}) → SVG 字串（側視、預設朝右；facing:'left' 鏡像）。kind：turtle | rabbit | ostrich
 * GameArt.animateAnimal(svgEl, pose) → { setPose, stop }（啟動與換姿勢時同步套用 t=0，避免殘影）
 * GameArt.animalPoses = ['idle','run','sleep','stumble','cheer','sad']；GameArt.animalKinds = [...]
 * 泰迪熊裁判＝GameArt.character({species:'bear', …})，不在這裡畫。
 * 道具（speedShoe、boostCan、bubble、windZone、mud、branch、hive、warnSign、startGate、finishLine、mileFlag、trophy）登錄在 game-tokens.json props.list，這裡只提供 P[id]。 */
(function (g) {
  var A = g.GameArt, H = A._h, T = H.T, N = T.color.neutral, P = A._P, hue = H.hue;
  var el = H.el, rect = H.rect, circ = H.circ, ell = H.ell, line = H.line, rpath = H.rpath, star = H.star;
  var ghost = function (f) { return function (s) { var r = f('idle'); return s === 'collected' ? '<g opacity=".25">' + r + '</g>' : r; }; };

  /* ======================= 道具 ======================= */
  P.speedShoe = ghost(function () {
    return ell(26, 45, 19, 3, T.depth.shadow.ground) + '<g transform="translate(9 4) scale(.84)">'
      + rpath('M10 38 Q8 20 18 16 L26 16 Q28 28 40 30 Q44 34 42 38 Z', hue('sky'), 5)
      + rect(8, 36, 36, 7, 3.5, hue('sky', 'deep')) + rect(20, 22, 8, 3, 1.5, hue('sky', 'soft')) + rect(25, 27, 8, 3, 1.5, hue('sky', 'soft'))
      + rpath('M6 22 Q-2 14 -2 6 Q8 8 14 16 Z', hue('sun'), 3) + rpath('M6 28 Q-4 24 -6 18 Q6 18 12 24 Z', hue('sun', 'ledge'), 3) + '</g>';
  });
  P.boostCan = ghost(function () {
    return ell(20, 54, 14, 2.6, T.depth.shadow.ground) + circ(20, 28, 25, hue('sun'), { opacity: .22 }) + circ(20, 28, 18, hue('sun'), { opacity: .3 })
      + rect(7, 12, 26, 38, 8, hue('rose')) + rect(7, 12, 26, 9, 4.5, hue('rose', 'deep')) + rect(12, 7, 16, 8, 3, hue('stone'))
      + el('path', { d: star(20, 32, 9, 4, 4), fill: hue('sun') }) + el('path', { d: 'M22 24 L16 33 L20 33 L18 41 L25 30 L21 30 Z', fill: N['on-fill'] });
  });
  P.bubble = ghost(function () {
    return circ(28, 28, 24, hue('sky'), { opacity: .28 }) + circ(28, 28, 24, 'none', { stroke: hue('sky', 'deep'), 'stroke-width': 3, opacity: .75 })
      + el('path', { d: 'M14 22 Q16 14 24 12', stroke: N['on-fill'], 'stroke-width': 4, 'stroke-linecap': 'round', opacity: .9 }) + circ(40, 38, 3, N['on-fill'], { opacity: .8 });
  });
  P.mud = function () {
    return ell(60, 18, 58, 12, hue('wood', 'deep')) + ell(60, 15, 50, 8, hue('wood', 'ledge'), { opacity: .75 }) + circ(34, 12, 4, hue('wood', 'soft'), { opacity: .7 }) + circ(76, 10, 3, hue('wood', 'soft'), { opacity: .7 }) + circ(94, 16, 2.5, hue('wood', 'soft'), { opacity: .7 });
  };
  P.branch = function () {   /* 低垂樹枝：頂端接樹幹（掛在高處），底端離地 elev 單位 */
    return rect(2, 0, 108, 14, 7, hue('bark')) + rect(46, 10, 14, 30, 7, hue('bark', 'ledge')) + circ(22, 24, 15, hue('leaf', 'ledge')) + circ(86, 26, 16, hue('leaf', 'ledge')) + circ(54, 38, 17, hue('leaf')) + circ(30, 36, 11, hue('leaf')) + circ(80, 42, 11, hue('leaf'));
  };
  P.hive = function () {
    var r = rpath('M28 16 Q8 22 12 44 Q18 62 28 62 Q38 62 44 44 Q48 22 28 16 Z', hue('sun', 'ledge'), 6);
    return rect(26, 0, 4, 14, 2, hue('bark')) + r + el('path', { d: 'M16 32 Q28 38 40 32 M14 42 Q28 49 42 42 M18 52 Q28 57 38 52', stroke: hue('sun', 'deep'), 'stroke-width': 3, 'stroke-linecap': 'round' }) + ell(28, 60, 6, 4, hue('wood', 'deep'))
      + ell(50, 30, 6, 4.5, hue('sun')) + rect(47, 27, 2.5, 7, 1, N.ink, { opacity: .8 }) + ell(8, 20, 6, 4.5, hue('sun')) + rect(5, 17, 2.5, 7, 1, N.ink, { opacity: .8 });
  };
  P.warnSign = function () {
    return rect(18, 22, 4, 36, 2, hue('wood', 'ledge')) + rpath('M20 4 L36 32 L4 32 Z', hue('sun'), 6) + rect(18, 12, 4, 10, 2, N.ink) + circ(20, 27, 2.4, N.ink);
  };
  P.mileFlag = function () {
    return rect(10, 6, 4, 54, 2, hue('wood', 'ledge')) + rpath('M14 8 L36 16 L14 24 Z', hue('rose'), 3) + circ(12, 6, 3.5, hue('sun'));
  };
  /* 起點線／終點線（v1.4）：貼地的黑白格線（像賽車方格旗），跨過跑道平鋪在地上。32×16：4 欄 × 2 列方格。
   * finishLine 的 broken 狀態：格線上方冒出彩帶碎片（在 viewBox 之外向上延伸，容器需 overflow:visible）。 */
  function chk(dark) {
    var s = '', c, r2; for (r2 = 0; r2 < 2; r2++) for (c = 0; c < 4; c++) s += rect(c * 8, r2 * 8, 8, 8, 0, (c + r2) % 2 ? dark : N['on-fill'] && '#FFFFFF');
    return rect(-1, -1, 34, 18, 2, N.ink, { opacity: .12 }) + s;
  }
  P.startGate = function () { return chk(N.ink); };
  P.finishLine = function (s) {
    var conf = s === 'broken' ? circ(4, -6, 2.4, hue('rose')) + circ(12, -14, 2.4, hue('sun')) + circ(20, -9, 2.4, hue('sky')) + circ(28, -17, 2.4, hue('mint')) + rect(8, -22, 3, 7, 1.5, hue('lilac')) + rect(22, -24, 3, 7, 1.5, hue('rose')) : '';
    return chk(N.ink) + conf;
  };
  P.startArch = function () {   /* 選用：起跑拱門 140×130（立起來的門；預設起點改用地上的 startGate 格線） */
    var s = '', i; for (i = 0; i < 10; i++) s += rect(20 + i * 10.4, 24 + (i % 2) * 10, 10.4, 10, 0, i % 2 ? N.ink : N['on-fill']) + rect(20 + i * 10.4, 34 - (i % 2) * 10, 10.4, 10, 0, i % 2 ? N['on-fill'] : N.ink);
    return rect(6, 18, 12, 112, 6, hue('wood')) + rect(122, 18, 12, 112, 6, hue('wood')) + rect(2, 12, 136, 14, 7, hue('wood', 'ledge'))
      + rect(18, 22, 104, 24, 4, N['on-fill']) + s + circ(12, 12, 6, hue('sun')) + circ(128, 12, 6, hue('sun'));
  };
  P.finishArch = function (s) {   /* 選用：終點拱門 120×140；broken＝彩帶被撞斷（v1.4 移除六芒星） */
    var chk = '', i; for (i = 0; i < 10; i++) chk += rect(8 + i * 10.4, 128 + (i % 2) * 6, 10.4, 6, 0, i % 2 ? N.ink : N['on-fill']) + rect(8 + i * 10.4, 134 - (i % 2) * 6, 10.4, 6, 0, i % 2 ? N['on-fill'] : N.ink);
    var tape = s === 'broken'
      ? rpath('M12 74 Q22 86 28 96', hue('rose'), 4) + rpath('M108 74 Q98 88 92 100', hue('rose'), 4) + circ(44, 58, 3, hue('sun')) + circ(60, 50, 3, hue('rose')) + circ(76, 58, 3, hue('sky'))
      : rect(10, 70, 100, 7, 3.5, hue('rose'));
    var top = ''; for (i = 0; i < 9; i++) top += rect(14 + i * 10.2, 10 + (i % 2) * 9, 10.2, 9, 0, i % 2 ? N.ink : N['on-fill']) + rect(14 + i * 10.2, 19 - (i % 2) * 9, 10.2, 9, 0, i % 2 ? N['on-fill'] : N.ink);
    return rect(4, 4, 10, 130, 5, hue('rose')) + rect(106, 4, 10, 130, 5, hue('rose')) + rect(10, 8, 100, 22, 4, N['on-fill']) + top + tape + chk;
  };
  P.trophy = function () {
    return rect(14, 54, 28, 8, 3, hue('wood')) + rect(24, 42, 8, 14, 3, hue('sun', 'ledge')) + el('path', { d: 'M8 12 Q6 28 18 32 M48 12 Q50 28 38 32', stroke: hue('sun', 'ledge'), 'stroke-width': 4, 'stroke-linecap': 'round' })
      + rpath('M12 8 H44 Q44 34 28 42 Q12 34 12 8 Z', hue('sun'), 5) + el('path', { d: star(28, 22, 7, 3, 5), fill: N['on-fill'] });
  };

  P.podium = function () {   /* 120×72：三階頒獎台（中間最高，星星標記冠軍）；不含文字 */
    return rect(2, 28, 38, 44, 6, hue('stone')) + rect(80, 44, 38, 28, 6, hue('wood')) + rect(40, 10, 40, 62, 6, hue('sun'))
      + rect(46, 16, 28, 5, 2.5, hue('sun', 'soft'), { opacity: .7 }) + el('path', { d: star(60, 40, 11, 4.6, 5), fill: N['on-fill'] })
      + circ(21, 46, 5, hue('stone', 'soft')) + circ(99, 58, 4, hue('wood', 'soft'));
  };

  /* ======================= 對手動物 ======================= */
  var VB = { turtle: [130, 72], rabbit: [130, 112], ostrich: [130, 192] };
  var COL = function () {
    return {
      turtle: { body: hue('mint'), dark: hue('mint', 'deep'), shell: hue('leaf'), shellD: hue('leaf', 'deep'), shellL: hue('leaf', 'ledge') },
      rabbit: { body: hue('stone', 'soft'), dark: hue('stone', 'ledge'), inner: hue('rose'), nose: hue('rose', 'deep') },
      ostrich: { body: hue('wood', 'deep'), wing: hue('wood'), tail: hue('stone', 'soft'), neck: hue('peach'), leg: hue('peach', 'ledge'), beak: hue('sun') }
    };
  };
  var sin = Math.sin, PI = Math.PI;

  /* 姿勢：回傳 {parts:{名稱:{r,x,y,sx,sy}}, eyes, fx}；t 為毫秒 */
  function poseOf(kind, pose, t) {
    var o = { parts: {}, eyes: 'normal', fx: null }, pr = T.race.animals[kind], per, s, sa, e, pp = o.parts;
    function set(n, v) { pp[n] = Object.assign({}, pp[n], v); }
    function legs(a, names) { names.forEach(function (n, i) { set(n, { r: (i % 2 ? -1 : 1) * a }); }); }
    var legN = kind === 'rabbit' ? ['hindA', 'hindB', 'foreB', 'foreA'] : ['legA', 'legB'];
    /* 兔子跳躍循環：蹲（落地壓扁）→ 蹬地拉長 → 騰空（耳朵後飄、後腿伸直）→ 前腳先落地、後腿收回；h＝跳高、k＝強度 */
    function hop(tt, pp, h, k) {
      var u = ((tt / pp) % 1 + 1) % 1, d = Math.min(u, 1 - u), sq = d < .2 ? Math.cos(Math.PI * d / .4) : 0;   // 以 u=0 為落地／蹲點
      var ua = (u - .25) / .55, air = ua > 0 && ua < 1 ? Math.sin(Math.PI * ua) : 0, tilt = ua > 0 && ua < 1 ? -10 * Math.cos(Math.PI * ua) : 0;
      set('root', { y: -h * air, sx: 1 + .13 * sq - .07 * air, sy: 1 - .15 * sq + .11 * air, r: tilt * k });
      set('hindA', { r: 42 * sq - 58 * air }); set('hindB', { r: 36 * sq - 52 * air });
      set('foreA', { r: 12 * sq - 40 * air }); set('foreB', { r: 8 * sq - 34 * air });
      set('earA', { r: 16 * sq - 30 * air }); set('earB', { r: 20 * sq - 36 * air });
      set('head', { r: -6 * air + 4 * sq });
    }
    if (pose === 'run') {
      per = pr.runPeriod; s = sin(2 * PI * t / per); sa = Math.abs(s);
      if (kind === 'turtle') { legs(30 * s, ['legA', 'legB']); set('root', { y: -1.5 * sa }); set('shell', { r: 2 * s }); set('head', { r: 3 * s }); }
      else if (kind === 'rabbit') hop(t, per, 20, 1);
      else { legs(42 * s, ['legA', 'legB']); set('root', { y: -3 * sa }); set('neck', { r: 8 + 3 * s }); set('head', { r: -4 * s }); set('wing', { r: -18 + 10 * s }); set('tailF', { r: 6 * s }); }
    } else if (pose === 'sleep') {
      s = sin(2 * PI * t / 2400); o.eyes = 'closed'; o.fx = 'zzz';
      if (kind === 'turtle') { set('head', { sx: .25, sy: .25, x: -34, y: 6 }); set('root', { y: 2 + .6 * s }); }
      else if (kind === 'rabbit') { set('root', { y: 0, sy: .74, sx: 1.12, r: 0 }); set('head', { r: 26, y: 6 }); set('earA', { r: 46 }); set('earB', { r: 54 }); set('hindA', { r: 55 }); set('hindB', { r: 55 }); set('foreA', { r: 40 }); set('foreB', { r: 40 }); }
      else { set('root', { y: 34 + .8 * s }); set('neck', { r: 28 }); set('head', { r: 24 }); set('legA', { r: -66 }); set('legB', { r: -70 }); }
    } else if (pose === 'stumble') {
      e = Math.min(1, t / pr.stumblePeriod); s = sin(PI * e); o.eyes = e < .9 ? 'x' : 'normal'; o.fx = e < .95 ? 'stars' : null;
      set('root', { r: (kind === 'ostrich' ? 38 : 55) * s, y: -5 * sin(2 * PI * e), x: 4 * e });
      if (kind === 'turtle') { set('head', { sx: .6 + .4 * (1 - s), sy: .6 + .4 * (1 - s) }); }
      legs(30 * s, legN);
    } else if (pose === 'cheer') {
      per = 640; s = sin(2 * PI * t / per); sa = Math.abs(s); o.eyes = 'happy';
      if (kind !== 'rabbit') { set('root', { y: -(kind === 'turtle' ? 5 : 10) * sa }); legs(10 * s, legN); }
      if (kind === 'rabbit') { hop(t, 560, 26, 1); }
      if (kind === 'ostrich') { set('wing', { r: -50 - 16 * sa }); set('neck', { r: -4 }); }
    } else if (pose === 'sad') {
      s = sin(2 * PI * t / 2600); o.eyes = 'closed'; o.fx = 'tear';
      set('root', { y: 1 + .5 * s }); set('head', { r: 20 });
      if (kind === 'rabbit') { set('earA', { r: 40 }); set('earB', { r: 48 }); set('root', { sy: .96 }); }
      if (kind === 'ostrich') { set('neck', { r: 20 }); set('wing', { r: 6 }); }
    } else { /* idle */
      s = sin(2 * PI * t / 2800); o.eyes = (t % 3600) > 3450 ? 'closed' : 'normal';
      set('root', { sy: 1 + .012 * s }); set('head', { r: 1.5 * s });
      if (kind === 'rabbit') { set('earA', { r: 3 * s }); set('earB', { r: -3 * s }); }
    }
    return o;
  }
  function tfStr(v, px, py) {
    if (!v) return '';
    var r = v.r || 0, x = v.x || 0, y = v.y || 0, sx = v.sx != null ? v.sx : 1, sy = v.sy != null ? v.sy : 1;
    return 'translate(' + x.toFixed(2) + ' ' + y.toFixed(2) + ') translate(' + px + ' ' + py + ') rotate(' + r.toFixed(2) + ') scale(' + sx.toFixed(3) + ' ' + sy.toFixed(3) + ') translate(' + (-px) + ' ' + (-py) + ')';
  }
  var PIV = {
    turtle: { root: [60, 66], shell: [58, 50], head: [96, 48], legA: [0, 0], legB: [0, 0] },
    rabbit: { root: [55, 108], head: [76, 56], earA: [72, 34], earB: [80, 34], hindA: [46, 88], hindB: [46, 88], foreA: [72, 80], foreB: [72, 80] },
    ostrich: { root: [60, 186], neck: [84, 84], head: [100, 28], wing: [54, 92], tailF: [30, 96], legA: [56, 114], legB: [70, 114] }
  };
  function part(kind, pm, name, inner, piv) {
    var p = piv || PIV[kind][name] || [0, 0];
    return '<g data-part="' + name + '" data-px="' + p[0] + '" data-py="' + p[1] + '" transform="' + tfStr(pm[name], p[0], p[1]) + '">' + inner + '</g>';
  }
  function eyes(ex, ey, k, c) {   /* 四種眼睛疊在一起，以 display 切換 */
    var inkc = N.ink;
    return '<g class="eyes-normal">' + circ(ex, ey, 3 * k, inkc) + circ(ex + .9 * k, ey - 1 * k, 1 * k, N['on-fill']) + '</g>'
      + '<g class="eyes-closed" style="display:none">' + el('path', { d: 'M' + (ex - 3.2 * k) + ' ' + ey + ' Q' + ex + ' ' + (ey + 3 * k) + ' ' + (ex + 3.2 * k) + ' ' + ey, stroke: inkc, 'stroke-width': 1.8 * k, 'stroke-linecap': 'round' }) + '</g>'
      + '<g class="eyes-x" style="display:none">' + el('path', { d: 'M' + (ex - 3 * k) + ' ' + (ey - 3 * k) + ' L' + (ex + 3 * k) + ' ' + (ey + 3 * k) + ' M' + (ex + 3 * k) + ' ' + (ey - 3 * k) + ' L' + (ex - 3 * k) + ' ' + (ey + 3 * k), stroke: inkc, 'stroke-width': 1.8 * k, 'stroke-linecap': 'round' }) + '</g>'
      + '<g class="eyes-happy" style="display:none">' + el('path', { d: 'M' + (ex - 3.2 * k) + ' ' + (ey + 1.5 * k) + ' Q' + ex + ' ' + (ey - 3.5 * k) + ' ' + (ex + 3.2 * k) + ' ' + (ey + 1.5 * k), stroke: inkc, 'stroke-width': 1.8 * k, 'stroke-linecap': 'round' }) + '</g>';
  }
  function fxLayer(hx, hy) {   /* 頭部附近特效：zzz／stars／tear */
    var z = '', i;
    for (i = 0; i < 3; i++) z += '<path d="M' + (hx + 6 + i * 9) + ' ' + (hy - 14 - i * 11) + ' h' + (6 + i * 2) + ' l-' + (6 + i * 2) + ' ' + (7 + i * 2) + ' h' + (6 + i * 2) + '" stroke="' + hue('sky', 'deep') + '" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>';
    var st = ''; for (i = 0; i < 3; i++) { var an = i * 2.094 - .6; st += '<path d="' + star(hx + 14 * Math.cos(an), hy - 14 + 6 * Math.sin(an), 5, 2.2, 5) + '" fill="' + hue('sun') + '"/>'; }
    return '<g data-fx="zzz" style="display:none">' + z + '</g><g data-fx="stars" style="display:none">' + st + '</g><g data-fx="tear" style="display:none">' + ell(hx + 2, hy + 8, 2.6, 4, hue('sky')) + '</g>';
  }

  function drawTurtle(pm, C) {
    var legs = function (x, c, n) { return rect(x, 48, 12, 18, 5.5, c); };
    return ell(60, 68, 38, 3, T.depth.shadow.ground)
      + part('turtle', pm, 'legA', legs(30, C.body), [36, 50]) + part('turtle', pm, 'legA', legs(84, C.dark), [90, 50])
      + part('turtle', pm, 'legB', legs(42, C.dark), [48, 50]) + part('turtle', pm, 'legB', legs(72, C.body), [78, 50])
      + rpath('M20 54 L10 56 L20 48 Z', C.body, 4)
      + ell(60, 54, 40, 11, C.body)
      + part('turtle', pm, 'shell', rpath('M18 52 Q20 14 60 12 Q100 14 102 52 Z', C.shell, 4) + circ(44, 34, 8, C.shellL) + circ(66, 28, 9, C.shellL) + circ(84, 40, 7, C.shellL) + rect(14, 48, 92, 8, 4, C.shellD))
      + part('turtle', pm, 'head', rect(92, 40, 16, 14, 7, C.body) + circ(108, 40, 13, C.body) + eyes(112, 37, 1, C) + circ(106, 45, 3, hue('rose'), { opacity: .6 }) + el('path', { d: 'M111 46 Q115 49 119 46', stroke: N.ink, 'stroke-width': 1.8, 'stroke-linecap': 'round' }) + fxLayer(108, 40));
  }
  function drawRabbit(pm, C) {   /* v1.5：直立身體、大後腿、長耳朵、圓尾巴；圓潤無描邊 */
    var W = N['surface-raised'];
    return ell(55, 109, 36, 3, T.depth.shadow.ground)
      + circ(25, 86, 9, W)
      + part('rabbit', pm, 'hindB', circ(45, 90, 12, C.dark) + ell(58, 107, 15, 4.8, C.dark))
      + part('rabbit', pm, 'foreB', rect(68, 82, 8, 19, 4, C.dark) + circ(72, 101, 4.6, C.dark))
      + ell(54, 76, 25, 29, C.body, { transform: 'rotate(-8 54 76)' }) + ell(60, 84, 15, 18, W, { opacity: .6 })
      + part('rabbit', pm, 'hindA', circ(46, 91, 14.5, C.body) + ell(61, 107.5, 17, 5.4, C.body) + circ(73, 106.5, 3, C.body))
      + part('rabbit', pm, 'foreA', rect(68, 82, 9, 20, 4.5, C.body) + circ(72.5, 102, 5.4, C.body))
      + part('rabbit', pm, 'earB', ell(80, 16, 5.5, 19, C.dark) + ell(80, 18, 2.8, 13, C.inner, { opacity: .7 }))
      + part('rabbit', pm, 'head', ell(80, 45, 17, 15, C.body) + ell(95, 48, 3.1, 2.4, C.nose) + eyes(87, 41, 1.05, C) + circ(85, 51, 4, hue('rose'), { opacity: .5 }) + el('path', { d: 'M93 52 Q96 55 99 52', stroke: N.ink, 'stroke-width': 1.7, 'stroke-linecap': 'round' }) + fxLayer(80, 36))
      + part('rabbit', pm, 'earA', ell(71, 17, 6, 20, C.body) + ell(71, 19, 3, 14, C.inner, { opacity: .85 }));
  }
  function drawOstrich(pm, C) {
    var leg = function (x, c) { return rect(x, 112, 7, 72, 3.5, c) + ell(x + 9, 185, 11, 4.2, c); };
    return ell(60, 188, 42, 3.4, T.depth.shadow.ground)
      + part('ostrich', pm, 'legB', leg(66, hue('peach', 'deep')))
      + part('ostrich', pm, 'tailF', ell(20, 92, 15, 7.5, C.tail) + ell(18, 100, 13, 7, C.tail, { transform: 'rotate(-18 18 100)' }) + ell(20, 84, 13, 6.5, C.tail, { transform: 'rotate(18 20 84)' }), [30, 96])
      + ell(60, 98, 40, 32, C.body)
      + part('ostrich', pm, 'legA', leg(54, C.leg))
      + part('ostrich', pm, 'neck', rect(80, 30, 12, 60, 6, C.neck) + part('ostrich', pm, 'head', ell(96, 26, 14, 10.5, C.neck) + rpath('M105 24 L124 28 L105 33 Z', C.beak, 3) + eyes(100, 23, .9, C) + circ(94, 29, 3.4, hue('rose'), { opacity: .5 }) + fxLayer(98, 24)), [86, 82])
      + part('ostrich', pm, 'wing', ell(56, 100, 24, 16, C.wing) + ell(44, 106, 18, 9, C.wing, { transform: 'rotate(10 44 106)', opacity: .8 }));
  }

  function animal(kind, o) {
    o = o || {}; var vb = VB[kind]; if (!vb) throw new Error('未知動物：' + kind);
    var pose = o.pose || 'idle', pm = poseOf(kind, pose, o.t || 0), C = COL()[kind];
    var inner = kind === 'turtle' ? drawTurtle(pm.parts, C) : kind === 'rabbit' ? drawRabbit(pm.parts, C) : drawOstrich(pm.parts, C);
    inner = part(kind, pm.parts, 'root', inner);
    if (o.facing === 'left') inner = '<g transform="translate(' + vb[0] + ' 0) scale(-1 1)">' + inner + '</g>';
    var s = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + vb[0] + ' ' + vb[1] + '" class="g-animal g-animal-' + kind + '" data-kind="' + kind + '" style="overflow:visible" fill="none">' + inner + '</svg>';
    return applyDisplay(s, pm);
  }
  /* 靜態字串渲染：眼睛／特效的 display 直接寫進字串 */
  function applyDisplay(s, pm) {
    ['normal', 'closed', 'x', 'happy'].forEach(function (k) { s = s.split('<g class="eyes-' + k + '" style="display:none">').join('<g class="eyes-' + k + '"' + (k === pm.eyes ? '' : ' style="display:none"') + '>').split('<g class="eyes-' + k + '">').join('<g class="eyes-' + k + '"' + (k === pm.eyes ? '' : ' style="display:none"') + '>'); });
    ['zzz', 'stars', 'tear'].forEach(function (k) { s = s.split('<g data-fx="' + k + '" style="display:none">').join('<g data-fx="' + k + '"' + (k === pm.fx ? '' : ' style="display:none"') + '>'); });
    return s;
  }
  function applyAnimalPose(svgEl, pose, t, reduced) {
    var kind = svgEl.getAttribute('data-kind'), pm = poseOf(kind, pose, reduced ? 0 : t), q, ps = svgEl.querySelectorAll('[data-part]');
    for (q = 0; q < ps.length; q++) { var n = ps[q].getAttribute('data-part'); ps[q].setAttribute('transform', tfStr(pm.parts[n], +ps[q].getAttribute('data-px'), +ps[q].getAttribute('data-py'))); }
    ['normal', 'closed', 'x', 'happy'].forEach(function (k) { var e1 = svgEl.querySelectorAll('.eyes-' + k); for (var i = 0; i < e1.length; i++) e1[i].style.display = k === pm.eyes ? '' : 'none'; });
    var fx = svgEl.querySelectorAll('[data-fx]'); for (q = 0; q < fx.length; q++) fx[q].style.display = (!reduced || pm.fx === 'zzz') && fx[q].getAttribute('data-fx') === pm.fx ? '' : 'none';
  }
  function animateAnimal(svgEl, pose) {
    var mq = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
    var cur = pose || 'idle', t0 = 0, raf = 0, stopped = false, kind = svgEl.getAttribute('data-kind'), pr = T.race.animals[kind];
    var oneShot = { stumble: pr.stumblePeriod };
    function frame(ts) {
      if (stopped) return; if (!t0) t0 = ts;
      var t = ts - t0;
      if (oneShot[cur] && t >= oneShot[cur]) { applyAnimalPose(svgEl, cur, oneShot[cur], mq.matches); return; }
      applyAnimalPose(svgEl, cur, t, mq.matches);
      if (!mq.matches) raf = requestAnimationFrame(frame);
    }
    function start() { cancelAnimationFrame(raf); t0 = 0; if (!stopped) applyAnimalPose(svgEl, cur, 0, mq.matches); raf = requestAnimationFrame(frame); }
    start();
    return { setPose: function (n) { cur = n; start(); }, stop: function () { stopped = true; cancelAnimationFrame(raf); } };
  }

  /* 頭像：把動物頭部裁成方形（對手進度條、結算用）；size 為像素 */
  var AV = { turtle: '74 8 56 56', rabbit: '52 -4 62 62', ostrich: '72 0 58 58' };
  function animalAvatar(kind, size) {
    var s = animal(kind, { pose: 'idle', t: 0 }).replace(/viewBox="[^"]*"/, 'viewBox="' + AV[kind] + '"').replace('overflow:visible', 'overflow:hidden');
    return size ? s.replace('<svg ', '<svg width="' + size + '" height="' + size + '" ') : s;
  }
  A.animalAvatar = animalAvatar;
  A.animal = animal; A.animateAnimal = animateAnimal; A.animalKinds = Object.keys(VB); A.animalPoses = ['idle', 'run', 'sleep', 'stumble', 'cheer', 'sad']; A.animalViewBox = VB;
})(typeof window !== 'undefined' ? window : globalThis);
