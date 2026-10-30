/* game-character.js — 可彎曲肢體的角色（正面／側面／背面）與動作播放。
 * GameArt.character({view:'front'|'side'|'back', facing:'right'|'left', pose:'walk', t:毫秒, ...外觀選項}) → SVG 字串（可在 Node 執行）
 * GameArt.animate(svgEl, pose) → {setPose, stop}（瀏覽器）
 * 肢體分兩段並帶圓頭關節：上臂→前臂、大腿→小腿；腳掌獨立（側面時可保持水平貼地）；軀幹可前傾；頭可點頭。
 * 站立姿勢（plant）會依腿的實際位置自動調整身體高度，讓最低的腳底貼地。 */
(function (g) {
  var A = g.GameArt, H = A._h, T = H.T, C = T.color, N = C.neutral, hue = H.hue;
  var el = H.el, rect = H.rect, circ = H.circ, ell = H.ell, line = H.line, rpath = H.rpath, star = H.star, svg = H.svg;
  var CC = T.character.colors, LC = (T.character.rig && T.character.rig.legCut) || 0, THIGH = 22 - LC / 2, SHIN = 21 - LC / 2, KY = 130 - LC / 2, AY = 151 - LC, GROUND = 164, RAD = Math.PI / 180;

  function mix(h1, h2, t) {
    var p = function (h) { h = h.replace('#', ''); return [0, 2, 4].map(function (i) { return parseInt(h.substr(i, 2), 16); }); };
    var a = p(h1), b = p(h2), r = a.map(function (v, i) { return Math.round(v + (b[i] - v) * t); });
    return '#' + r.map(function (v) { return ('0' + v.toString(16)).slice(-2); }).join('');
  }

  /* ---------- 關節樞紐（設計座標） ---------- */
  var PVF = { root: [60, 164], torso: [60, 108], head: [60, 78], armL: [40, 82], foreL: [40, 99], armR: [80, 82], foreR: [80, 99], legL: [50, 108], shinL: [50, KY], legR: [70, 108], shinR: [70, KY], footL: [50, AY], footR: [70, AY], shadow: [60, 165] };
  var PVS = { root: [60, 164], torso: [58, 108], head: [62, 78], armL: [60, 82], foreL: [60, 99], armR: [60, 82], foreR: [60, 99], legL: [58, 108], shinL: [58, KY], legR: [58, 108], shinR: [58, KY], footL: [58, AY], footR: [58, AY], shadow: [60, 165] };
  function pvOf(view) { return view === 'side' ? PVS : PVF; }

  /* ---------- 動作運算（純函式） ---------- */
  function ev(p, t, period, loop, ramp) {
    if (!p) return 0;
    var base = p[0], amp = p[1], ph = p[2] || 0, fq = p[3] || 1, mode = p[4];
    if (!loop && ramp) { var u = Math.min(t / period, 1); return base + amp * (1 - (1 - u) * (1 - u)); }   /* ramp：緩出到 base+amp 後停住 */
    if (!loop) return base + amp * Math.sin(Math.PI * Math.min(t / period, 1));
    var s = Math.sin(2 * Math.PI * (t / period * fq + ph));
    if (mode === 'snap') s = Math.tanh(3 * s) / Math.tanh(3);   /* 近似方波：停在兩端、快速切換（抖腳舞） */
    else if (mode === 'abs') s = Math.abs(Math.sin(Math.PI * (t / period * fq + ph)));
    else if (mode === 'pos') s = Math.max(0, s);
    return base + amp * s;
  }
  function rot(a, pv) { return 'rotate(' + a.toFixed(2) + ' ' + pv[0] + ' ' + pv[1] + ')'; }
  function scY(s, pv) { return 'translate(' + pv[0] + ' ' + pv[1] + ') scale(1 ' + s.toFixed(3) + ') translate(' + (-pv[0]) + ' ' + (-pv[1]) + ')'; }
  function defaultFoot(a2) { return a2 > 0 ? a2 * .45 : a2 * .25; }   /* 離地腳尖向下、前腳腳尖微翹 */

  function poseTransforms(view, name, t) {
    var P0 = T.motion.poses[name], out = { tf: {}, eyesX: false, fx: null }; if (!P0) return out;
    if (P0.byView && P0.byView[view]) P0 = Object.assign({}, P0, P0.byView[view]);   /* 同一動作在不同視角可有不同參數 */
    var loop = P0.loop, per = P0.period, PV = pvOf(view), side = view === 'side', RP = !!P0.ramp;
    var v = function (part, key) { return P0[part] && P0[part][key] ? ev(P0[part][key], t, per, loop, RP) : 0; };
    var d = P0.root || {};
    var yp = d.y ? ev(d.y, t, per, loop, RP) : 0, rr = d.rot ? ev(d.rot, t, per, loop, RP) : 0, sx = d.sx ? ev(d.sx, t, per, loop, RP) : 1, sy = d.sy ? ev(d.sy, t, per, loop, RP) : 1;
    var lean = v('torso', 'lean'); out.tf.torso = rot(side ? lean : lean * 0.3, PV.torso);
    out.tf.head = rot(v('head', 'nod') * (side ? 1 : 0.5), PV.head);
    var bottoms = [], heldRot = 0, flagTilt = (T.character.rig && T.character.rig.flagTilt) || 0;
    var torsoRot = side ? lean : lean * 0.3;
    ['L', 'R'].forEach(function (s) {
      var sg = s === 'L' ? 1 : -1, ar = 'arm' + s, lg = 'leg' + s;
      var aw = v(ar, 'swing'), ap = v(ar, 'spread'), ab = v(ar, 'bend'), lw = v(lg, 'swing'), lp = v(lg, 'spread'), lb = v(lg, 'bend');
      if (side) {
        out.tf[ar] = rot(-aw, PV[ar]); out.tf['fore' + s] = rot(-ab, PV['fore' + s]);
        if (s === 'R') heldRot = flagTilt - (torsoRot - aw - ab);
        var a1 = -lw, a2 = a1 + lb, fw = P0[lg] && P0[lg].foot ? ev(P0[lg].foot, t, per, loop, RP) : defaultFoot(a2);
        out.tf[lg] = rot(a1, PV[lg]); out.tf['shin' + s] = rot(lb, PV['shin' + s]); out.tf['foot' + s] = rot(fw - a2, PV['foot' + s]);
        /* 正向運動學：算腳底最低點 */
        var hip = PV[lg], kx = hip[0] - THIGH * Math.sin(a1 * RAD), ky = hip[1] + THIGH * Math.cos(a1 * RAD);
        var ax = kx - SHIN * Math.sin(a2 * RAD), ay = ky + SHIN * Math.cos(a2 * RAD), b = -1e9;
        [[-8, 1], [15.5, 1], [-8, 13], [15.5, 13]].forEach(function (c) { var yy = c[0] * Math.sin(fw * RAD) + c[1] * Math.cos(fw * RAD); if (ay + yy > b) b = ay + yy; });
        bottoms.push(b);
      } else {
        /* v0.5：上臂長度不變；前擺（swing>0）→ 往身體中線旋轉，後擺 → 略往外。舉高的手（spread 大）不受影響。
           彎曲規則：前臂永遠朝身體中線（朝頭）折——手臂垂下時朝內，舉過水平線後朝內上。 */
        var fArm = Math.max(0, Math.min(1, 1 - (ap - 20) / 50)), apE = ap - (aw > 0 ? .45 : .22) * aw * fArm;
        var dirS = 1 - 2 * Math.max(0, Math.min(1, (apE - 80) / 20));
        out.tf[ar] = rot(sg * apE, PV[ar]);
        out.tf['fore' + s] = rot(-sg * ab * dirS, PV['fore' + s]);
        if (s === 'R') heldRot = flagTilt - (torsoRot + sg * apE - sg * ab * dirS);
        if (P0.legMode === 'splay') {
          /* 膝蓋往兩側張開：swing 不用；spread＝大腿外張角；bend＝小腿從垂直往內收的角度；腳掌保持水平 */
          out.tf[lg] = rot(sg * lp, PV[lg]);
          out.tf['shin' + s] = rot(-sg * (lp + lb), PV['shin' + s]);
          out.tf['foot' + s] = rot(sg * lb - sg * (P0.footIn || 0), PV['foot' + s]);   /* footIn：腳掌平面（鞋底）朝向身體中心的角度（盤腿用 90） */
          bottoms.push(108 + THIGH * Math.cos(lp * RAD) + SHIN * Math.cos(lb * RAD) + 13);
        } else {
          var uS = Math.max(P0.thighMin != null ? P0.thighMin : .72, Math.cos(Math.min(Math.abs(lw), 90) * RAD)), sS = Math.max(.55, Math.cos(Math.min(lb, 100) * 0.9 * RAD));
          out.tf[lg] = rot(sg * lp, PV[lg]) + ' ' + scY(uS, PV[lg]);
          out.tf['shin' + s] = scY(1 / uS, PV['shin' + s]) + ' ' + rot(-sg * lp, PV['shin' + s]) + ' ' + scY(sS, PV['shin' + s]);
          out.tf['foot' + s] = scY(1 / sS, PV['foot' + s]);
          bottoms.push(108 + THIGH * uS * Math.cos(lp * RAD) + SHIN * sS + 13);
        }
      }
    });
    out.tf.held = 'rotate(' + heldRot.toFixed(2) + ')';
    var plant = (P0.plant === false) ? 0 : GROUND - Math.max(bottoms[0], bottoms[1]) + (P0.sink || 0);
    out.tf.root = 'translate(0 ' + (plant + yp).toFixed(2) + ') translate(60 164) rotate(' + rr.toFixed(2) + ') scale(' + sx.toFixed(3) + ' ' + sy.toFixed(3) + ') translate(-60 -164)';
    var lift = Math.max(0, -yp), ss = 1 - Math.min(.45, lift / 90);
    out.tf.shadow = 'translate(60 165) scale(' + ss.toFixed(3) + ' 1) translate(-60 -165)';
    out.legsFront = !!P0.legsFront; out.eyesX = P0.eyes === 'x';
    out.armsTop = !!P0.armsTop; out.eyes = P0.eyes || null; out.mouth = P0.mouth || null; out.blush = !!P0.blush; out.fxKind = P0.fx || null;
    var ph = 2 * Math.PI * t / per;
    if (P0.fx === 'orbit') out.fx = 'rotate(' + ((t / per * 360) % 360).toFixed(1) + ' 60 18)';
    else if (P0.fx === 'sparkle') { var k = .8 + .25 * Math.abs(Math.sin(Math.PI * t / per)); out.fx = 'translate(60 18) scale(' + k.toFixed(2) + ') translate(-60 -18)'; }
    else if (P0.fx === 'zzz') out.fx = 'translate(0 ' + (-3 * Math.sin(ph)).toFixed(1) + ')';
    else if (P0.fx === 'think') out.fx = 'translate(0 ' + (-2 * Math.sin(ph)).toFixed(1) + ')';
    else if (P0.fx === 'bang') { var kb = 1 + .12 * Math.sin(ph * 2); out.fx = 'translate(98 -10) scale(' + kb.toFixed(3) + ') translate(-98 10)'; }
    return out;
  }

  /* ---------- 角色 ---------- */
  var DEF = { species: 'kid', view: 'front', facing: 'right', skin: 'peach', hairStyle: 'short', hairColor: 'chestnut', faceShape: 'round', brows: 'none', eyes: 'dot', mouth: 'smile', outfit: 'tee', outfitColor: 'sky', pantsColor: 'stone', accessories: [], held: 'none', fur: 'bear', pose: null, t: 0 };

  function character(opts) {
    var o = Object.assign({}, DEF, opts || {}), view = o.view, bear = o.species === 'bear', side = view === 'side', back = view === 'back';
    var F = C.face, acc0 = o.accessories || [];
    var isZombie = acc0.indexOf('zombieTalisman') >= 0;
    var acc = isZombie ? ['zombieTalisman'] : acc0;
    var has = function (k) { return acc.indexOf(k) >= 0; };
    if (isZombie) o.held = 'none';
    var skin = isZombie ? hue('mint') : bear ? (C.fur[o.fur] || C.fur.bear) : C.skin[o.skin], skinFar = mix(skin, N.ink, .12);
    var hair = C.hair[o.hairColor], oc = hue(o.outfitColor), ocl = hue(o.outfitColor, 'ledge'), ocFar = mix(oc, N.ink, .1);
    var pc = o.pantsColor === 'match' ? oc : o.pantsColor === 'ink' ? N.ink : hue(o.pantsColor), pcFar = mix(pc, N.ink, .1);
    var sundr = o.outfit === 'sundress', dress = o.outfit === 'dress' || sundr, hood = o.outfit === 'hoodie', jacket = o.outfit === 'jacket', longSl = hood || jacket;
    var shoe = hue(dress ? o.outfitColor : 'stone', 'deep'), sole = N['surface-raised'];
    var PX = o.pose ? poseTransforms(view, o.pose, o.t || 0) : { tf: {}, eyesX: false, fx: null, legsFront: false };
    var part = function (name, inner) { var at = { 'data-part': name }; if (PX.tf[name]) at.transform = PX.tf[name]; return el('g', at, inner); };
    var ey = bear ? 40 : 44, my = bear ? 56 : 54;

    /* --- 手持物（以手心為原點） --- */
    function heldItem() {
      if (o.held === 'flag') return line(0, 6, 0, -50, hue('wood'), 4) + rpath('M2 -50 L20 -43 L2 -35 Z', hue('rose'), 5);
      if (o.held === 'lollipop') return line(0, 6, 0, -30, hue('wood', 'soft'), 3.6) + circ(0, -42, 13, hue('rose')) + el('path', { d: 'M0 -42 a3 3 0 0 1 6 0 a6 6 0 0 1 -12 0 a9 9 0 0 1 18 0', stroke: hue('rose', 'ledge'), 'stroke-width': 2.4, 'stroke-linecap': 'round' });
      if (o.held === 'wand') return line(0, 4, 14, -26, hue('wood'), 4) + rpath(star(16, -32, 9, 4.6), hue('sun'), 3);
      if (o.held === 'pinwheel') { var pw = ''; ['rose', 'sun', 'sky', 'mint'].forEach(function (c, i) { pw += el('path', { d: 'M0 0 L13 -3 L5 -13 Z', fill: hue(c), stroke: hue(c), 'stroke-width': 3, 'stroke-linejoin': 'round', transform: 'rotate(' + (i * 90) + ')' }); }); return line(0, 6, 0, -34, hue('wood'), 3.6) + el('g', { transform: 'translate(0 -38)' }, pw + circ(0, 0, 3, hue('lilac', 'deep'))); }
      if (o.held === 'plunger') return line(0, 36, 0, -34, hue('wood'), 4) + rpath('M-11 -52 L11 -52 Q12 -33 0 -33 Q-12 -33 -11 -52 Z', CC.cape, 4) + rect(-12, -55, 24, 5, 2.5, CC.capeLedge);   /* 馬桶吸把：吸盤在上（開口朝上、圓弧朝下接木柄），木柄加長往下（2026-10-20） */
      if (o.held === 'poopstick') { var pc0 = hue('bark'), pc1 = hue('bark', 'ledge'), pe = N['surface-raised']; return line(0, 10, 5, -30, hue('wood', 'deep'), 4) + line(2, -10, -6, -16, hue('wood', 'deep'), 3) + ell(6, -34, 12, 5.5, pc1) + ell(6, -36, 11, 5, pc0) + ell(6, -42, 8.5, 4.6, pc0) + ell(6, -47.5, 5.5, 3.6, pc0) + rpath('M4 -50 Q6 -56 9 -54 Q7 -52 8 -50 Z', pc0, 2) + ell(3, -43.5, 2.2, 1.2, hue('wood', 'ledge'), { opacity: .7 }) + circ(2.6, -38, 2, pe) + circ(9.4, -38, 2, pe) + circ(2.9, -37.8, 1, N.ink) + circ(9.7, -37.8, 1, N.ink); }   /* 插著大便的樹枝（商店款，2026-10-20） */
      if (o.held === 'meat') return line(0, 8, 0, -14, CC.bone, 5) + circ(-3.4, 9.5, 3.4, CC.bone) + circ(3.4, 9.5, 3.4, CC.bone) + ell(0, -27, 13, 11, CC.meat) + ell(3, -23, 8, 6.5, CC.meatDeep, { opacity: .55 });   /* 帶骨肉 */
      if (o.held === 'magiccane') {   /* 魔拐杖（萬聖節稀有手持物）：等身高深木長杖，頂部盤旋捲曲＋微光晶球 */
        var shaft = line(0, 48, 0, -60, hue('bark', 'deep'), 5) + line(0, 42, 0, 48, hue('bark', 'ledge'), 5.5);
        var crook = el('path', { d: 'M0 -58 Q-2 -74 8 -82 Q22 -88 26 -72 Q28 -58 14 -58 Q6 -58 10 -68', fill: 'none', stroke: hue('bark', 'deep'), 'stroke-width': 4.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
        var orb = circ(16, -70, 4.8, hue('mint', 'soft')) + circ(16, -70, 3, hue('mint', 'base'));
        return shaft + crook + orb;
      }
      if (o.held === 'pumpkinbucket') {   /* 南瓜糖果桶（萬聖節稀有手持物）：微笑南瓜手提桶＋彩色糖果 */
        var handle = el('path', { d: 'M0 2 Q-10 12 -12 24 M0 2 Q10 12 12 24', fill: 'none', stroke: hue('wood', 'deep'), 'stroke-width': 2.8, 'stroke-linecap': 'round' });
        var pbody = rpath('M-15 24 Q-20 36 0 46 Q20 36 15 24 Z', CC.pumpkin || '#FF822E', 4) + el('path', { d: 'M-7 24 Q-10 36 0 45 Q10 36 7 24', fill: 'none', stroke: CC.pumpkinLedge || '#D95B11', 'stroke-width': 2.4 });
        var prim = rect(-16, 22, 32, 5, 2.5, CC.pumpkinLedge || '#D95B11');
        var candy1 = ell(-6, 17, 3.5, 2.5, hue('sun')) + rpath('M-11 17 L-8 15 L-8 19 Z', hue('sun', 'ledge'), 1);
        var candy2 = line(4, 23, 7, 13, hue('wood', 'soft'), 2) + circ(8, 11, 4.5, hue('rose')) + circ(8, 11, 2, hue('rose', 'soft'));
        var pface = circ(-5, 33, 1.8, N.ink) + circ(5, 33, 1.8, N.ink) + el('path', { d: 'M-5 38 Q0 43 5 38', fill: 'none', stroke: N.ink, 'stroke-width': 1.8, 'stroke-linecap': 'round' });
        return handle + candy1 + candy2 + pbody + prim + pface;
      }
      return '';
    }
    /* --- 手臂（兩段）；手持物畫在手之下 --- */
    function arm(s, sx, sy, far, withHeld) {
      var skC = far ? skinFar : skin, slv = far ? ocFar : oc, su = longSl ? 17 : 10;
      var hd = (withHeld && o.held !== 'none') ? el('g', { transform: 'translate(' + sx + ' ' + (sy + 35) + ')' }, part('held', heldItem())) : '';   /* 手持物：外層 part('held') 反向旋轉，舉手、揮手、歡呼時保持朝上（旗子 v1.4；2026-10-20 起所有手持物） */
      var fore = part('fore' + s, line(sx, sy + 17, sx, sy + 31, skC, 10.4) + (longSl ? line(sx, sy + 17, sx, sy + 30, slv, 12.6) : '') + hd + circ(sx, sy + 35, 10.5, skC));
      var upper = line(sx, sy, sx, sy + 17, skC, 11) + (su ? line(sx, sy, sx, sy + su, slv, 13) : '') + circ(sx, sy + 17, longSl ? 6.2 : 5.5, longSl ? slv : skC);
      return part('arm' + s, upper + fore);
    }
    /* 鞋：上緣半圓弧、下緣平（底部貼齊 groundY=164） */
    function shoeShape(x0, x1, yb, hy, ry, fill) {
      var rx = (x1 - x0) / 2;
      return el('path', { d: 'M' + (x0 + 3) + ' ' + yb + ' L' + (x1 - 3) + ' ' + yb + ' Q' + x1 + ' ' + yb + ' ' + x1 + ' ' + (yb - 3) + ' L' + x1 + ' ' + hy + ' A' + rx + ' ' + ry + ' 0 0 0 ' + x0 + ' ' + hy + ' L' + x0 + ' ' + (yb - 3) + ' Q' + x0 + ' ' + yb + ' ' + (x0 + 3) + ' ' + yb + ' Z', fill: fill });
    }
    /* --- 腿（兩段）；側面的腳掌獨立，可保持水平 --- */
    function leg(s, hx, far) {
      var lc = dress ? (far ? skinFar : skin) : (far ? pcFar : pc), sh = far ? mix(shoe, N.ink, .1) : shoe, foot;
      var up = function (x) { return LC ? '<g transform="translate(0 ' + (-LC) + ')">' + x + '</g>' : x; };
      if (side) foot = part('foot' + s, up(shoeShape(hx - 8, hx + 15.5, 164, 158.5, 8, sh) + rect(hx - 7.5, 160.5, 22, 3.5, 1.75, sole)));
      else foot = part('foot' + s, up(shoeShape(hx - 12, hx + 12, 164, 159, 8.5, sh) + rect(hx - 11.5, 160.5, 23, 3.5, 1.75, sole)));
      var shin = part('shin' + s, line(hx, KY, hx, AY, lc, 12) + foot);
      return part('leg' + s, line(hx, 108, hx, KY, lc, 13) + circ(hx, KY, 6, lc) + shin);
    }

    /* --- 身體各層 --- */
    function neckLine() { return ''; }   /* v1.0：脖子移除（頭直接接身體） */
    function under() {   /* 圍巾、領巾：在身體之下、脖子之上（側面、背面） */
      var r = '';
      if (side) {
      } else if (back) {
      }
      return r;
    }
    function outfitDeco(v) {
      var r = '', od = ocl;
      if (o.outfit === 'jacket') {
        if (v === 'front') r += line(60, 80, 60, 119, od, 2.8) + rpath('M47 75 L60 90 L73 75 L66 74 L60 82 L54 74 Z', od, 3) + rect(42, 106, 12, 8, 3, od, { opacity: .6 }) + rect(66, 106, 12, 8, 3, od, { opacity: .6 });
        else if (v === 'side') r += line(75, 80, 75, 118, od, 2.8) + rect(62, 104, 12, 8, 3, od, { opacity: .6 });
        else r += rect(40, 78, 40, 5, 2.5, od, { opacity: .6 });
      }
      if (o.outfit === 'stripe') {
        var x0 = v === 'side' ? 46 : 40, w0 = v === 'side' ? 28 : 40;
        r += rect(x0, 86, w0, 5, 2.5, od, { opacity: .85 }) + rect(x0, 96, w0, 5, 2.5, od, { opacity: .85 }) + rect(x0, 106, w0, 5, 2.5, od, { opacity: .85 });
      }
      if (sundr) {
        var D = v === 'side' ? [[56, 94], [66, 102], [52, 110], [70, 117], [60, 124]] : [[52, 94], [68, 98], [58, 110], [74, 115], [46, 120], [62, 125]];
        D.forEach(function (p) { r += circ(p[0], p[1], 2.5, hue('sun')); });
        if (v === 'front') r += rect(46, 80, 6, 12, 3, ocl, { opacity: .8 }) + rect(68, 80, 6, 12, 3, ocl, { opacity: .8 });
      }
      return r;
    }
    function bodyFront() {
      var r = '';
      if (dress) r += rpath('M44 80 Q60 74 76 80 L86 128 Q60 136 34 128 Z', oc, 8) + rect(46, 110, 28, 5, 2.5, ocl, { opacity: .6 });
      else if (o.outfit === 'overalls') r += rect(38, 74, 44, 48, 16, oc) + rect(46, 90, 28, 32, 10, pc) + rect(46, 78, 6, 16, 3, pc) + rect(68, 78, 6, 16, 3, pc) + circ(49, 94, 2.6, hue('sun')) + circ(71, 94, 2.6, hue('sun'));
      else if (hood) r += ell(60, 76, 22, 9, ocl) + rect(38, 74, 44, 48, 16, oc) + rect(47, 100, 26, 12, 6, ocl, { opacity: .75 });
      else r += rect(38, 74, 44, 46, 16, oc);
      r += outfitDeco('front');
      return r;
    }
    function bodyBack() { return bodyBack0() + outfitDeco('back'); }
    function bodyBack0() {
      if (dress) return rpath('M44 80 Q60 74 76 80 L86 128 Q60 136 34 128 Z', oc, 8) + rect(54, 82, 12, 5, 2.5, ocl, { opacity: .6 }) + rect(46, 110, 28, 5, 2.5, ocl, { opacity: .6 });
      if (o.outfit === 'overalls') return rect(38, 74, 44, 48, 16, oc) + rect(46, 90, 28, 32, 10, pc) + rect(48, 76, 6, 20, 3, pc, { transform: 'rotate(-14 51 86)' }) + rect(66, 76, 6, 20, 3, pc, { transform: 'rotate(14 69 86)' });
      if (hood) return rect(38, 74, 44, 48, 16, oc) + ell(60, 82, 19, 12, ocl);
      return rect(38, 74, 44, 46, 16, oc);
    }
    function wingPath(x0, dir, k) {   /* 羽毛翅膀：5 片長羽由下往上疊，白／淺藍交錯 */
      var Fd = [[132, 15, .58], [106, 16, .76], [80, 17, .94], [56, 17, 1], [32, 16, .9]], out = '';
      Fd.forEach(function (f, i) { var len = 50 * k * f[2]; out += el('g', { transform: 'translate(' + x0 + ' 90) rotate(' + (dir * f[0]) + ')' }, ell(0, -len * .5, f[1] * .62 * k, len * .5, i % 2 ? hue('sky', 'soft') : N['surface-raised'])); });
      return out;
    }
    function behind() {
      var r = '';
      if (side) {
        if (has('cape')) r += rpath('M52 80 Q38 100 28 132 Q48 140 64 112 L64 80 Z', CC.cape, 6);
        if (has('wings')) r += wingPath(58, -1, .85);
      } else if (!back) {
        if (has('cape')) r += rpath('M38 80 L82 80 L94 142 Q60 150 26 142 Z', CC.cape, 6) + rect(36, 134, 48, 6, 3, CC.capeLedge, { opacity: .7 });
        if (has('wings')) r += wingPath(42, -1, 1) + wingPath(78, 1, 1);
      }
      return r;
    }
    function backOver() {
      var r = bear ? circ(60, 113, 8, C.fur['bear-belly']) : '';
      if (has('wings')) r += wingPath(46, -1, 1) + wingPath(74, 1, 1);
      if (has('cape')) r += rpath('M40 78 L80 78 L90 128 Q60 136 30 128 Z', CC.cape, 6) + rect(42, 78, 36, 6, 3, CC.capeLedge) + circ(60, 84, 3.4, hue('sun'));
      if (has('backpack')) r += rect(42, 80, 36, 34, 13, hue('peach')) + rect(48, 98, 24, 11, 5, hue('peach', 'ledge')) + rect(50, 78, 6, 12, 3, hue('peach', 'ledge')) + rect(64, 78, 6, 12, 3, hue('peach', 'ledge'));
      return r;
    }
    function bodySide() {
      var r = bear ? circ(44, 112, 7, C.fur['bear-belly']) : '';
      if (dress) r += rpath('M46 80 Q58 74 72 80 L82 128 Q58 136 38 128 Z', oc, 8) + rect(44, 110, 32, 5, 2.5, ocl, { opacity: .6 });
      else if (o.outfit === 'overalls') r += rect(44, 74, 32, 48, 14, oc) + rect(48, 90, 28, 32, 10, pc) + rect(54, 78, 7, 16, 3, pc) + circ(60, 94, 2.6, hue('sun'));
      else if (hood) r += ell(46, 80, 9, 12, ocl) + rect(44, 74, 32, 48, 14, oc) + rect(52, 100, 20, 12, 6, ocl, { opacity: .75 });
      else r += rect(44, 74, 32, 46, 14, oc);
      return r + outfitDeco('side');
    }
    function sideOver() { return has('backpack') ? rect(32, 80, 20, 32, 10, hue('peach')) + rect(35, 96, 14, 10, 4, hue('peach', 'ledge')) : ''; }

    /* --- 頭 --- */
    function eyeShape(kind, x, two) {
      var out = two ? (x < 60 ? -1 : 1) : 1;
      if (kind === 'happy') return line(x - 4.8, ey, x + 4.8, ey, F.eye, 3);   /* 眯眯眼：一條橫線 */
      if (kind === 'lash') return circ(x, ey, 3.4, F.eye) + line(x + out * 3, ey - 2, x + out * 7.5, ey - 5, F.eye, 1.9) + line(x + out * 3.6, ey + .5, x + out * 8.2, ey - .8, F.eye, 1.9);
      if (kind === 'x') return el('path', { d: 'M' + (x - 4.5) + ' ' + (ey - 4) + ' L' + (x + 4.5) + ' ' + (ey + 4) + ' M' + (x + 4.5) + ' ' + (ey - 4) + ' L' + (x - 4.5) + ' ' + (ey + 4), stroke: F.eye, 'stroke-width': 2.8, 'stroke-linecap': 'round' });
      if (kind === 'closed') return el('path', { d: 'M' + (x - 4.5) + ' ' + (ey - 1) + ' Q' + x + ' ' + (ey + 4.5) + ' ' + (x + 4.5) + ' ' + (ey - 1), stroke: F.eye, 'stroke-width': 2.8, 'stroke-linecap': 'round' });
      if (kind === 'wide') return circ(x, ey, 6.4, N['surface-raised'], { stroke: hue('stone', 'soft'), 'stroke-width': 1.4 }) + circ(x, ey + .4, 3.3, F.eye) + line(x - 4.5, ey - 11, x + 4.5, ey - 12, F.eye, 2.4);   /* 驚訝：有眼白與瞳孔 */
      return circ(x, ey, 3.4, F.eye);
    }
    function eyeSet(cx, two) {
      var xs = two ? [49.5, 70.5] : [cx], act = PX.eyes || 'normal', out = '';
      ['normal', 'x', 'closed', 'wide', 'happy'].forEach(function (k) {
        var inner = '';
        xs.forEach(function (x) { inner += eyeShape(k === 'normal' ? o.eyes : k, x, two); });
        out += '<g class="eyes-' + k + '"' + (act === k ? '' : ' style="display:none"') + '>' + inner + '</g>';
      });
      return out;
    }
    function mouthShape(kind, cx, y) {
      if (kind === 'open') return el('path', { d: 'M' + (cx - 6) + ' ' + y + ' Q' + cx + ' ' + (y + 9) + ' ' + (cx + 6) + ' ' + y + ' Z', fill: F.mouth, stroke: F.mouth, 'stroke-width': 2, 'stroke-linejoin': 'round' });
      if (kind === 'tongue') return el('path', { d: 'M' + (cx - 6) + ' ' + y + ' Q' + cx + ' ' + (y + 9) + ' ' + (cx + 6) + ' ' + y + ' Z', fill: F.mouth, stroke: F.mouth, 'stroke-width': 2, 'stroke-linejoin': 'round' }) + ell(cx + 1, y + 5.4, 3.2, 2.6, F.cheek);
      if (kind === 'teeth') {   /* 可愛寶寶：開心張嘴＋兩顆略分開的門牙（上緣平、貼嘴巴上緣，高度短） */
        var tooth = function (x0) { return el('path', { d: 'M' + x0 + ' ' + (y - .8) + ' H' + (x0 + 4.4) + ' V' + (y + 1.9) + ' Q' + (x0 + 4.4) + ' ' + (y + 2.8) + ' ' + (x0 + 3.5) + ' ' + (y + 2.8) + ' H' + (x0 + .9) + ' Q' + x0 + ' ' + (y + 2.8) + ' ' + x0 + ' ' + (y + 1.9) + ' Z', fill: N['surface-raised'] }); };
        return el('path', { d: 'M' + (cx - 7.5) + ' ' + y + ' Q' + cx + ' ' + (y + 10) + ' ' + (cx + 7.5) + ' ' + y + ' Z', fill: F.mouth, stroke: F.mouth, 'stroke-width': 2, 'stroke-linejoin': 'round' }) + tooth(cx - 4.9) + tooth(cx + .5);
      }
      if (kind === 'o') return ell(cx, y + 2, 3, 3.6, F.mouth);
      if (kind === 'pout') return ell(cx + .6, y + 1.2, 4.2, 2.6, F.mouth) + ell(cx + .6, y + 4.2, 4, 2.6, F.mouth) + line(cx - 2, y + 2.7, cx + 3.2, y + 2.7, F.cheek, 1.2);   /* 嘟嘟嘴（商店款，2026-10-20） */
      if (kind === 'flat') return line(cx - 4, y + 2, cx + 4, y + 2, F.mouth, 2.8);
      return el('path', { d: 'M' + (cx - 6) + ' ' + y + ' Q' + cx + ' ' + (y + 6) + ' ' + (cx + 6) + ' ' + y, stroke: F.mouth, 'stroke-width': 2.8, 'stroke-linecap': 'round' });
    }
    function mouthAt(cx, y) {
      var act = PX.mouth || o.mouth, out = '';
      ['smile', 'open', 'o', 'tongue', 'flat', 'teeth', 'pout'].forEach(function (k) { out += '<g class="mouth-' + k + '"' + (act === k ? '' : ' style="display:none"') + '>' + mouthShape(k, cx, y) + '</g>'; });
      return out;
    }
    /* 臉型（v1.0）：kid 專用；round 圓臉（原樣）、square 方臉、oval 橢圓臉、pointed 瓜子臉。下巴一律落在 y=68（頭部縮放以下巴為軸）。
     * FACE[形狀] = {d: 路徑（以 cx=60 為中心）, hw: 耳朵到中心的半寬} */
    var FACE = {
      round:   { hw: 26 },
      square:  { d: 'M35 32 Q35 15 52 15 L68 15 Q85 15 85 32 L85 52 Q85 68 69 68 L51 68 Q35 68 35 52 Z', hw: 25 },
      oval:    { d: 'M60 14 C76 14 83 26 83 41 C83 57 74 68 60 68 C46 68 37 57 37 41 C37 26 44 14 60 14 Z', hw: 23 },
      pointed: { d: 'M34 36 Q34 14 60 14 Q86 14 86 36 Q86 50 75 61 Q67 69 60 69 Q53 69 45 61 Q34 50 34 36 Z', hw: 24.5 }
    };
    var FS = FACE[o.faceShape] || FACE.round;
    function faceBase(cx) {   /* 畫臉（不含耳朵）；cx 為頭中心（正／背面 60、側面 62） */
      return FS.d ? el('path', { d: FS.d, fill: skin, transform: cx === 60 ? null : 'translate(' + (cx - 60) + ' 0)' }) : circ(cx, 42, 26, skin);
    }
    /* 眉毛（v1.0）：none／thin 細眉／thick 粗眉／arch 彎眉／sharp 劍眉；顏色＝髮色加深（小熊＝毛色加深）。
     * 左眉路徑（正面，以 x=49.5 為中心）；右眉鏡射。pose 的 eyes:'wide'（驚訝）時整組上抬 3。 */
    var BROW = { thin: ['M44 33 Q49.5 30 55 33', 2.2], thick: ['M43.5 32.5 Q49.5 30.5 55.5 32.5', 4], arch: ['M44 34.5 Q49.5 28.5 55 33.5', 2.8], sharp: ['M44 30 L55 34', 3.2] };
    function browsSvg(side0, cx0, by) {
      var B = BROW[o.brows]; if (!B) return '';
      var col = bear ? mix(skin, N.ink, .55) : mix(hair, N.ink, .45), dy = (by == null ? 0 : by) + 2;
      var one = function (tf) { return el('path', { d: B[0], stroke: col, 'stroke-width': B[1], 'stroke-linecap': 'round', transform: tf }); };
      var sh = (T.character.rig && T.character.rig.browSideShift) || 0;   /* 側面：眉毛中心 = 眼睛 x + browSideShift（token） */
      var inner = side0 ? one('translate(' + (cx0 + sh) + ' ' + dy + ') scale(.9 1) translate(-49.5 0)') : one('translate(0 ' + dy + ')') + one('translate(120 ' + dy + ') scale(-1 1)');
      return el('g', { 'class': 'brows', transform: PX.eyes === 'wide' ? 'translate(0 -3)' : null }, inner);
    }
    /* 髮型頂蓋（v0.9）：default 為短髮；buzz 平頭、sidepart 旁分劉海、spiky 刺蝟頭 */
    var HAIRCAP = {
      front: { d: 'M34 40 Q32 15 60 15 Q88 15 86 40 Q78 29 60 29 Q42 29 34 40 Z',
        buzz: 'M35 38 Q34 17 41 14 L79 14 Q86 17 85 38 Q78 31 60 31 Q42 31 35 38 Z',
        sidepart: 'M34 42 Q31 15 60 14 Q89 15 86 42 Q85 31 77 28 Q60 29 47 38 Q41 44 34 42 Z',
        spiky: 'M35.0 34.1 L30.6 27.6 L38.6 26.8 L36.5 19.2 L44.4 21.0 L44.9 13.1 L51.8 17.3 L54.8 9.9 L60.0 16.0 L65.2 9.9 L68.2 17.3 L75.1 13.1 L75.6 21.0 L83.5 19.2 L81.4 26.8 L89.4 27.6 L85.0 34.1 L86 40 Q78 29 60 29 Q42 29 34 40 Z' },
      side: { d: 'M35 44 Q31 14 62 14 Q88 14 88 34 Q78 28 66 29 Q56 30 52 42 Q46 48 40 56 Q34 52 35 44 Z',
        buzz: 'M35 44 Q32 17 42 13 L80 13 Q90 15 88 34 Q78 29 66 30 Q56 31 52 42 Q46 48 40 56 Q34 52 35 44 Z',
        sidepart: 'M35 44 Q31 14 62 14 Q90 14 89 36 Q82 31 72 35 Q64 38 54 46 Q46 50 40 56 Q34 52 35 44 Z',
        spiky: 'M36.6 35.8 L32.1 28.8 L40.4 27.1 L38.8 18.9 L47.2 20.4 L48.9 12.2 L56.2 16.6 L60.9 9.5 L66.0 16.3 L73.0 11.3 L75.2 19.5 L83.5 17.4 L82.6 25.7 L91.0 26.8 L87.0 34.1 Q78 28 66 29 Q56 30 52 42 Q46 48 40 56 Q34 52 35 44 Z' },
      back: { d: 'M34 42 Q32 14 60 14 Q88 14 86 42 Q86 56 60 58 Q34 56 34 42 Z',
        buzz: 'M34 42 Q33 17 40 13 L80 13 Q87 17 86 42 Q85 50 60 52 Q35 50 34 42 Z',
        sidepart: 'M34 42 Q32 14 60 14 Q88 14 86 42 Q86 56 60 58 Q34 56 34 42 Z',
        spiky: 'M35.0 34.1 L30.6 27.6 L38.6 26.8 L36.5 19.2 L44.4 21.0 L44.9 13.1 L51.8 17.3 L54.8 9.9 L60.0 16.0 L65.2 9.9 L68.2 17.3 L75.1 13.1 L75.6 21.0 L83.5 19.2 L81.4 26.8 L89.4 27.6 L85.0 34.1 L86 42 Q86 56 60 58 Q34 56 34 42 Z' }
    };
    /* 龐克頭（商店款，2026-10-20）：兩側剃短（較淡的髮色）＋中間一排高高的尖冠 */
    var PUNK_CREST = { front: 'M52 18 L46 4 L54 8 L55 -7 L60 2 L65 -7 L66 8 L74 4 L68 18 Z', side: 'M37 24 L29 12 L40 14 L39 1 L50 10 L53 -6 L62 7 L70 -5 L73 10 L84 4 L82 18 Q62 12 37 24 Z', back: 'M52 18 L46 4 L54 8 L55 -7 L60 2 L65 -7 L66 8 L74 4 L68 18 Z' };
    /* 橘咪頭（稀有款頭套，2026-10-20）：圓形頭套＋頂上小圓球；正面挖出心形臉孔、側面開口在臉那側、背面整顆包住。戴上時頭髮藏在頭套裡。
     * 形狀＝外圓減去臉孔（fill-rule evenodd），臉的五官畫在頭套之前，從洞裡露出來。 */
    /* 咪頭系列（同一個造型、不同顏色）：橘咪頭 mikanhood、藍咪頭 bluehood、南瓜萌頭 pumpkinhood（萬聖節）。多個都選時以後選的那個為準 */
    var HOOD_COLORS = { mikanhood: ['mikan', '#F0A03C', '#D98A2B', '#F8C27A'], bluehood: ['bluehood', '#16B5FF', '#0E93D1', '#7AD3FF'], pumpkinhood: ['pumpkin', '#FF822E', '#D95B11', '#FFBA82'] };
    var HOOD = null; acc.forEach(function (k) { if (HOOD_COLORS[k]) HOOD = k; });
    /* v3：頭套貼合頭形（中心 y40、半徑 31，下緣在下巴下方一點）；沒有深色內緣。側面開口一路開到頭套邊緣，前緣停在臉的後方，鼻子、嘴巴完整露出 */
    var MK = { cy: 40, R: 32 };
    function mikanHole(v) {
      return v === 'front' ? 'M36.5 45 L36.5 36 Q36.5 23.6 48.5 23.6 Q55.5 23.6 60 27.4 Q64.5 23.6 71.5 23.6 Q83.5 23.6 83.5 36 L83.5 45 C83.5 59 73.5 67.4 60 67.4 C46.5 67.4 36.5 59 36.5 45 Z'
        : v === 'side' ? 'M67 47 L67 37 Q67 23.6 79 23.6 Q86 23.6 90.4 27.2 A31 31 0 0 1 78.6 66.2 Q67 60 67 47 Z' : '';
    }
    function mikanHood(v) {
      var hc = HOOD_COLORS[HOOD] || HOOD_COLORS.mikanhood, cx = v === 'side' ? 62 : 60, cy = MK.cy, R = MK.R, mk = CC[hc[0]] || hc[1], ml = CC[hc[0] + 'Ledge'] || hc[2], ms = CC[hc[0] + 'Soft'] || hc[3];
      var hole = mikanHole(v);
      var top = cy - R;
      var out = '';
      if (HOOD === 'pumpkinhood') {
        /* 南瓜萌頭（萬聖節稀有頭套）：三個直立橢圓形交疊的經典南瓜造型（無凹紋線、無反光點） */
        if (v === 'side') {
          var pSide = 'M79 12.9 Q86 16.5 87 24 C76 24.5 61.5 33 61.5 45 C61.5 55 65.5 62 72 66 L69 72 Q60 74 53 72 Q44 72 35 66 Q26 56 26 40 Q26 24 35 15 Q44 7 53 8 Q60 5.5 68 8 Q75 10 79 12.9 Z';
          out += el('path', { d: pSide, fill: mk });
        } else {
          /* 正面：輪廓造型完全參照背面三個直立橢圓形交疊的立體外輪廓＋中間挖出臉部 */
          var pOuter = 'M49.95 11.88 A16.5 31 0 1 0 49.95 68.12 A18.5 33.5 0 0 0 70.05 68.12 A16.5 31 0 1 0 70.05 11.88 A18.5 33.5 0 0 0 49.95 11.88 Z';
          out += el('path', { d: pOuter + (hole ? ' ' + hole : ''), fill: mk, 'fill-rule': 'evenodd' });
        }
        out += rect(56.5, -3, 7, 13, 3, hue('leaf', 'deep'))
             + ell(66.5, 2, 6, 3, hue('leaf', 'base'), { transform: 'rotate(-25 66.5 2)' });
        return out;
      }
      var outer = 'M' + (cx - R) + ' ' + cy + ' A' + R + ' ' + R + ' 0 1 0 ' + (cx + R) + ' ' + cy + ' A' + R + ' ' + R + ' 0 1 0 ' + (cx - R) + ' ' + cy + ' Z';
      /* 側面：頭套外形一筆畫成（從臉上方的前緣繞過頭頂、後腦、下方，再沿臉後方的前緣回來），開口邊緣沒有接縫細線 */
      var sideShape = 'M79 12.9 Q85.5 16.5 87 24 C76 24.5 61.5 33 61.5 45 C61.5 55 65.5 62 72 66 L69 71.2 A32 32 0 1 1 79 12.9 Z';   /* 依使用者紅線：上方往前延伸成小尖角蓋到額頭前方，再沿向後彎的 C 形弧線收到下巴後方 */
      out = v === 'side' ? el('path', { d: sideShape, fill: mk }) : el('path', { d: outer + (hole ? ' ' + hole : ''), fill: mk, 'fill-rule': 'evenodd' });
      out += rect(cx - 3.5, top - 9, 7, 12, 3, mk) + circ(cx, top - 10, 9, mk) + ell(cx - 3, top - 13, 3, 2, ms, { opacity: .8 });   /* 頂上小圓球 */
      var hx = cx - (v === 'side' ? 13 : 17), hy = top + 9;
      out += ell(hx, hy, 6, 3.4, ms, { opacity: .75, transform: 'rotate(-28 ' + hx + ' ' + hy + ')' });   /* 亮面 */
      return out;
    }
    function hairCap(v) {
      var st = o.hairStyle; if (st === 'none' || HOOD) return '';
      if (st === 'punk') return rpath(HAIRCAP[v].buzz, mix(hair, skin, .22), 5) + rpath(PUNK_CREST[v], hair, 4);
      var t = HAIRCAP[v], d = t[st] || t.d, out = rpath(d, hair, 5);
      if (st === 'sidepart' && v === 'front') out += el('path', { d: 'M47 15 Q48 22 50 29', stroke: mix(hair, N.ink, .28), 'stroke-width': 2.2, 'stroke-linecap': 'round' });
      if (st === 'sidepart' && v === 'side') out += el('path', { d: 'M76 16 Q78 24 74 32', stroke: mix(hair, N.ink, .28), 'stroke-width': 2.2, 'stroke-linecap': 'round' });
      return out;
    }
    function headFront() {
      var h = '';
      if (bear) h += circ(36, 20, 11, skin) + circ(84, 20, 11, skin) + circ(36, 20, 5.5, hue('rose'), { opacity: .75 }) + circ(84, 20, 5.5, hue('rose'), { opacity: .75 }) + circ(60, 42, 27, skin) + ell(60, 51, 14, 10.5, C.fur['bear-belly']) + ell(60, 46, 4.8, 3.4, F.nose);
      else {
        var bk = '';
        if (o.hairStyle === 'bob') bk = rect(30, 16, 60, 50, 24, hair);
        if (o.hairStyle === 'twinbun') bk = circ(38, 19, 10.5, hair) + circ(82, 19, 10.5, hair);
        if (o.hairStyle === 'twintail') bk = ell(26, 54, 9, 21, hair, { transform: 'rotate(8 26 54)' }) + ell(94, 54, 9, 21, hair, { transform: 'rotate(-8 94 54)' }) + circ(31, 33, 4, hue('rose')) + circ(89, 33, 4, hue('rose'));
        if (HOOD) bk = el('path', { d: mikanHole('front'), fill: skin });   /* 正面開口內補膚色底：窄臉型（橢圓臉）太陽穴兩側不會露縫 */
        h += bk + circ(60 - FS.hw, 45, 5, skin) + circ(60 + FS.hw, 45, 5, skin) + faceBase(60);
        h += hairCap('front');
      }
      h += circ(46, ey + 9, 4.4, F.cheek, { opacity: PX.blush ? .95 : .55, 'class': 'cheek', 'data-base': '.55' }) + circ(74, ey + 9, 4.4, F.cheek, { opacity: PX.blush ? .95 : .55, 'class': 'cheek', 'data-base': '.55' }) + eyeSet(0, true) + mouthAt(60, my) + browsSvg(false, 0, bear ? -4 : 0);
      if (HOOD) h += mikanHood('front');
      if (has('glasses-round')) h += circ(49.5, ey, 8, 'none', { stroke: N['ink-soft'], 'stroke-width': 2.6 }) + circ(70.5, ey, 8, 'none', { stroke: N['ink-soft'], 'stroke-width': 2.6 }) + line(57.5, ey, 62.5, ey, N['ink-soft'], 2.6);
      if (has('glasses-soft')) h += rect(40, ey - 7, 19, 14, 6, 'none', { stroke: hue('rose', 'deep'), 'stroke-width': 2.6 }) + rect(61, ey - 7, 19, 14, 6, 'none', { stroke: hue('rose', 'deep'), 'stroke-width': 2.6 }) + line(59, ey, 61, ey, hue('rose', 'deep'), 2.6);
      if (has('cap')) h += el('path', { d: 'M35 36 Q35 12 60 12 Q85 12 85 36 Z', fill: hue('peach'), stroke: hue('peach'), 'stroke-width': 4, 'stroke-linejoin': 'round' }) + rect(58, 31, 36, 9, 4.5, hue('peach', 'ledge')) + circ(60, 10, 3.5, hue('peach', 'ledge'));
      if (has('melonhat')) h += rpath('M32 33 Q32 6 60 6 Q88 6 88 33 Z', hue('leaf', 'ledge'), 5) + el('path', { d: 'M40.0 31.0 L42.2 26.0 L37.8 21.0 L42.2 16.0 L37.8 18.0', stroke: hue('leaf', 'deep'), 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', fill: 'none' }) + el('path', { d: 'M50.0 31.0 L52.2 26.0 L47.8 21.0 L52.2 16.0 L47.8 13.5', stroke: hue('leaf', 'deep'), 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', fill: 'none' }) + el('path', { d: 'M60.0 31.0 L62.2 26.0 L57.8 21.0 L62.2 16.0 L57.8 9.0', stroke: hue('leaf', 'deep'), 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', fill: 'none' }) + el('path', { d: 'M70.0 31.0 L72.2 26.0 L67.8 21.0 L72.2 16.0 L67.8 13.5', stroke: hue('leaf', 'deep'), 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', fill: 'none' }) + el('path', { d: 'M80.0 31.0 L82.2 26.0 L77.8 21.0 L82.2 16.0 L77.8 18.0', stroke: hue('leaf', 'deep'), 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', fill: 'none' }) + rect(30, 29, 60, 6, 3, hue('leaf', 'soft')) + rect(32, 34, 56, 3.4, 1.7, hue('rose', 'ledge')) + circ(48, 35.7, .9, N.ink) + circ(60, 35.7, .9, N.ink) + circ(72, 35.7, .9, N.ink);   /* 西瓜帽（商店款，2026-10-20） */
      if (has('witchhat')) {   /* 巫師帽（萬聖節稀有配件）：更宏偉寬大的帽簷與高聳後垂的帽尖＋暖黃金星搭扣 */
        h += rpath('M34 30 Q38 8 50 -10 Q66 -32 86 -24 Q80 -8 76 10 L84 30 Z', hue('lilac', 'deep'), 6)
          + ell(60, 31, 46, 9, hue('lilac', 'ledge'))
          + ell(60, 30, 44, 7.5, hue('lilac', 'deep'))
          + rect(40, 22, 40, 7, 3.5, hue('sun'))
          + rpath(star(60, 25.5, 6.5, 3.2), hue('sun', 'ledge'), 2);
      }
      if (has('zombieTalisman')) {
        // 黃紙朱砂符咒：一張黃紙垂掛於額頭，上有紅色奇怪符文
        h += rpath('M53 16 L67 16 L68 42 L60 40 L52 42 Z', '#FFDF6D', 1.5)
          + circ(60, 20, 2.2, '#D82B2B')
          + el('path', {
              d: 'M56 24 Q60 22 64 24 M60 24 L60 28 M56 28 L64 28 M57 31 L63 31 L57 35 L63 35 L60 38',
              stroke: '#D82B2B', 'stroke-width': 1.6, fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round'
            });
      }
      if (has('headphones')) h += el('path', { d: 'M33 44 Q33 12 60 12 Q87 12 87 44', stroke: hue('stone', 'deep'), 'stroke-width': 5, 'stroke-linecap': 'round' }) + rect(26, 36, 12, 20, 6, hue('lilac')) + rect(82, 36, 12, 20, 6, hue('lilac'));
      if (has('goggles')) h += line(34, 28, 86, 28, hue('stone', 'deep'), 4.5) + circ(48, 24, 8.5, hue('sky', 'soft'), { stroke: hue('stone', 'deep'), 'stroke-width': 3 }) + circ(72, 24, 8.5, hue('sky', 'soft'), { stroke: hue('stone', 'deep'), 'stroke-width': 3 });
      return h;
    }
    function headSide() {
      var cx = 62, h = '';
      if (bear) {
        h += circ(48, 20, 11, skin) + circ(48, 20, 5.5, hue('rose'), { opacity: .75 }) + circ(cx, 42, 27, skin) + ell(82, 51, 13, 10, C.fur['bear-belly']) + ell(92, 47, 4.8, 3.6, F.nose) + circ(66, 50, 4.4, F.cheek, { opacity: PX.blush ? .95 : .5, 'class': 'cheek', 'data-base': '.5' });
        h += eyeSet(72, false) + mouthAt(82, 57) + browsSvg(true, 72, -4);
      } else {
        var bk = '';
        if (o.hairStyle === 'bob') bk = rect(34, 16, 40, 50, 20, hair);
        if (o.hairStyle === 'twinbun') bk = circ(47, 19, 10.5, hair) + circ(68, 16.5, 9.5, hair);
        if (o.hairStyle === 'twintail') bk = rpath('M47 34 Q33 28 17 24 Q11 34 19 41 Q34 41 47 39 Z', hair, 5) + circ(47, 36, 4, hue('rose'));   /* v1.2：側面馬尾往後方微微翹起 */
        if (HOOD) bk = '';
        h += bk + faceBase(cx) + circ(88, 48, 3.6, skin);
        var ear = circ(56, 46, 5, skin);   /* 耳朵與膚色相同；除了 bob（頭髮蓋住耳朵）外，耳朵在頭髮之上 */
        if (o.hairStyle === 'bob' && !HOOD) h += ear + rect(36, 26, 28, 38, 14, hair);
        h += hairCap('side');
        if (o.hairStyle !== 'bob') h += ear;
        h += circ(68, ey + 9, 4.4, F.cheek, { opacity: PX.blush ? .95 : .55, 'class': 'cheek', 'data-base': '.55' }) + eyeSet(73, false) + mouthAt(77, my) + browsSvg(true, 73, 0);
      }
      if (HOOD && !bear) h += mikanHood('side');
      /* 眼鏡（側面）：鏡片是窄的橢圓，鏡腳從鏡片後緣連到耳朵 */
      if (has('glasses-round')) h += (HOOD ? '' : line(70, ey, 56, 46, N['ink-soft'], 2.4)) + ell(77, ey, 5.5, 8, 'none', { stroke: N['ink-soft'], 'stroke-width': 2.6 });
      if (has('glasses-soft')) h += (HOOD ? '' : line(72, ey, 56, 46, hue('rose', 'deep'), 2.4)) + rect(72, ey - 7, 11, 14, 5, 'none', { stroke: hue('rose', 'deep'), 'stroke-width': 2.6 });
      if (has('cap')) h += el('path', { d: 'M34 36 Q34 12 62 12 Q90 12 90 36 Z', fill: hue('peach'), stroke: hue('peach'), 'stroke-width': 4, 'stroke-linejoin': 'round' }) + rect(78, 31, 30, 9, 4.5, hue('peach', 'ledge')) + circ(62, 10, 3.5, hue('peach', 'ledge'));
      if (has('melonhat')) h += rpath('M34 33 Q34 6 62 6 Q90 6 90 33 Z', hue('leaf', 'ledge'), 5) + el('path', { d: 'M42.0 31.0 L44.2 26.0 L39.8 21.0 L44.2 16.0 L39.8 18.0', stroke: hue('leaf', 'deep'), 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', fill: 'none' }) + el('path', { d: 'M52.0 31.0 L54.2 26.0 L49.8 21.0 L54.2 16.0 L49.8 13.5', stroke: hue('leaf', 'deep'), 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', fill: 'none' }) + el('path', { d: 'M62.0 31.0 L64.2 26.0 L59.8 21.0 L64.2 16.0 L59.8 9.0', stroke: hue('leaf', 'deep'), 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', fill: 'none' }) + el('path', { d: 'M72.0 31.0 L74.2 26.0 L69.8 21.0 L74.2 16.0 L69.8 13.5', stroke: hue('leaf', 'deep'), 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', fill: 'none' }) + el('path', { d: 'M82.0 31.0 L82.2 26.0 L79.8 21.0 L84.2 16.0 L79.8 18.0', stroke: hue('leaf', 'deep'), 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', fill: 'none' }) + rect(32, 29, 60, 6, 3, hue('leaf', 'soft')) + rect(34, 34, 56, 3.4, 1.7, hue('rose', 'ledge')) + circ(50, 35.7, .9, N.ink) + circ(62, 35.7, .9, N.ink) + circ(74, 35.7, .9, N.ink);   /* 西瓜帽（商店款，2026-10-20） */
      if (has('witchhat')) {
        h += rpath('M38 30 Q48 6 62 -12 Q80 -32 98 -24 Q90 -8 82 10 L88 30 Z', hue('lilac', 'deep'), 6)
          + ell(62, 31, 45, 9, hue('lilac', 'ledge'))
          + ell(62, 30, 43, 7.5, hue('lilac', 'deep'))
          + rect(48, 22, 36, 7, 3.5, hue('sun'))
          + rpath(star(70, 25.5, 6, 3), hue('sun', 'ledge'), 2);
      }
      if (has('zombieTalisman')) {
        // 側面視角符咒：垂掛在前額
        h += rpath('M72 18 L82 18 L85 42 L78 40 L74 42 Z', '#FFDF6D', 1.5)
          + circ(77, 22, 2, '#D82B2B')
          + el('path', {
              d: 'M75 25 L80 25 M77 25 L77 29 M75 31 L80 31 L76 35 L80 35',
              stroke: '#D82B2B', 'stroke-width': 1.5, fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round'
            });
      }
      /* 耳機（側面）：支架是一條豎直線，對齊耳罩水平中間 */
      if (has('headphones')) h += line(59, 40, 59, 12, hue('stone', 'deep'), 5) + rect(51, 36, 16, 22, 8, hue('lilac'));
      if (has('goggles')) h += line(36, 28, 88, 28, hue('stone', 'deep'), 4.5) + circ(76, 24, 9, hue('sky', 'soft'), { stroke: hue('stone', 'deep'), 'stroke-width': 3 });
      return h;
    }
    function headBack() {
      var h = '';
      if (bear) return h + circ(36, 20, 11, skin) + circ(84, 20, 11, skin) + circ(60, 42, 27, skin) + circ(60, 56, 8, mix(skin, N.ink, .06), { opacity: .5 });
      h += circ(60 - FS.hw, 45, 5, skin) + circ(60 + FS.hw, 45, 5, skin) + faceBase(60);
      var st = o.hairStyle;
      if (HOOD) st = 'none';
      if (st === 'twinbun') h += circ(38, 19, 10.5, hair) + circ(82, 19, 10.5, hair);
      if (st === 'twintail') h += ell(26, 54, 9, 21, hair, { transform: 'rotate(8 26 54)' }) + ell(94, 54, 9, 21, hair, { transform: 'rotate(-8 94 54)' }) + circ(31, 33, 4, hue('rose')) + circ(89, 33, 4, hue('rose'));
      if (st === 'bob') h += rect(31, 16, 58, 50, 24, hair);
      else h += hairCap('back');
      if (HOOD) {
        if (HOOD === 'pumpkinhood') {
          /* 背面：三個完整直立橢圓形交疊的經典南瓜（無凹紋線、無反光點） */
          var pk = CC.pumpkin || '#FF822E';
          var pBack = ell(43, 40, 16.5, 31, pk)
            + ell(77, 40, 16.5, 31, pk)
            + ell(60, 40, 18.5, 33.5, pk)
            + rect(56.5, -3, 7, 13, 3, hue('leaf', 'deep'))
            + ell(66.5, 2, 6, 3, hue('leaf', 'base'), { transform: 'rotate(-25 66.5 2)' });
          return h + pBack;
        }
        return h + mikanHood('back');   /* 背面整顆包住：眼鏡、帽子、耳機等頭部配件都看不到 */
      }
      if (has('glasses-round') || has('glasses-soft')) h += line(34, 44, 38, 44, N['ink-soft'], 2.6) + line(82, 44, 86, 44, N['ink-soft'], 2.6);
      if (has('cap')) h += el('path', { d: 'M35 38 Q35 12 60 12 Q85 12 85 38 Z', fill: hue('peach'), stroke: hue('peach'), 'stroke-width': 4, 'stroke-linejoin': 'round' }) + rect(50, 33, 20, 5, 2.5, hue('peach', 'ledge')) + circ(60, 10, 3.5, hue('peach', 'ledge'));
      if (has('headphones')) h += el('path', { d: 'M33 44 Q33 12 60 12 Q87 12 87 44', stroke: hue('stone', 'deep'), 'stroke-width': 5, 'stroke-linecap': 'round' }) + rect(26, 36, 12, 20, 6, hue('lilac')) + rect(82, 36, 12, 20, 6, hue('lilac'));
      if (has('melonhat')) h += rpath('M32 33 Q32 6 60 6 Q88 6 88 33 Z', hue('leaf', 'ledge'), 5) + el('path', { d: 'M40.0 31.0 L42.2 26.0 L37.8 21.0 L42.2 16.0 L37.8 18.0', stroke: hue('leaf', 'deep'), 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', fill: 'none' }) + el('path', { d: 'M50.0 31.0 L52.2 26.0 L47.8 21.0 L52.2 16.0 L47.8 13.5', stroke: hue('leaf', 'deep'), 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', fill: 'none' }) + el('path', { d: 'M60.0 31.0 L62.2 26.0 L57.8 21.0 L62.2 16.0 L57.8 9.0', stroke: hue('leaf', 'deep'), 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', fill: 'none' }) + el('path', { d: 'M70.0 31.0 L72.2 26.0 L67.8 21.0 L72.2 16.0 L67.8 13.5', stroke: hue('leaf', 'deep'), 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', fill: 'none' }) + el('path', { d: 'M80.0 31.0 L82.2 26.0 L77.8 21.0 L82.2 16.0 L77.8 18.0', stroke: hue('leaf', 'deep'), 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', fill: 'none' }) + rect(30, 29, 60, 6, 3, hue('leaf', 'soft')) + rect(32, 34, 56, 3.4, 1.7, hue('rose', 'ledge')) + circ(48, 35.7, .9, N.ink) + circ(60, 35.7, .9, N.ink) + circ(72, 35.7, .9, N.ink);   /* 西瓜帽（商店款，2026-10-20） */
      if (has('witchhat')) {
        h += rpath('M34 31 Q38 9 50 -9 Q66 -31 86 -23 Q80 -7 76 11 L84 31 Z', hue('lilac', 'deep'), 6)
          + ell(60, 32, 46, 9, hue('lilac', 'ledge'));
      }
      if (has('zombieTalisman')) {
        h += rect(56, 18, 8, 4, 1.5, hue('sun', 'ledge'));
      }
      if (has('goggles')) h += line(34, 28, 86, 28, hue('stone', 'deep'), 4.5) + rect(56, 24, 8, 8, 3, hue('stone', 'ledge'));
      return h;
    }
    /* v0.5：頭放大（kid 半徑 26→約 30、bear 27→約 30.5），下巴貼近肩膀（y=75），脖子只露出約 6px（正面；側面、背面脖子在身體之下） */
    var HK = bear ? 1.13 : 1.16, HCX = side ? 62 : 60;
    var headScale = function (inner) { return '<g transform="translate(' + HCX + ' 78) scale(' + HK + ') translate(' + (-HCX) + ' -68)">' + inner + '</g>'; };
    var headG = function (inner) { return part('head', headScale(inner)); };
    var headLayer = function (inner) { return part('head', headScale(inner)); };   /* 與頭同一組變換，但畫在較低的圖層（長髮垂在身體之下） */
    var longUnder = '';   /* v0.9：長直髮已移除 */

    /* --- 組裝（Z 順序） --- */
    var r = '', tor = '', legs = '', lowArms = '', topArms = '';
    var longFront = '';
    var wb = function (x) { return '<g class="arms-base"' + (PX.armsTop && !back ? ' style="display:none"' : '') + '>' + x + '</g>'; };   /* 背面：歡呼時手仍在最低層，不上移 */   /* armsTop 動作（歡呼）：改畫在最上層的那份 */
    var topCopy = '';
    if (side) {
      legs = leg('L', 58, true) + leg('R', 58, false);
      lowArms = part('torso', arm('L', 60, 82, true, false));      /* 側面遠手：永遠最低層、略暗（歡呼時也不上移） */      /* 遠手：全場最低 */
      topArms = part('torso', wb(arm('R', 60, 82, false, true)));      /* 近手：全場最高 */
      tor = neckLine() + under() + longUnder + bodySide() + sideOver() + headG(headSide());
    } else if (back) {
      legs = leg('L', 50, false) + leg('R', 70, false);
      lowArms = part('torso', wb(arm('L', 40, 82, false, false) + arm('R', 80, 82, false, true)));   /* 背面：兩手都在最低層 */
      tor = neckLine() + under() + longUnder + bodyBack() + backOver() + headG(headBack());
    } else {
      legs = leg('L', 50, false) + leg('R', 70, false);
      tor = bodyFront() + wb(arm('L', 40, 82, false, false)) + headG(headFront()) + wb(arm('R', 80, 82, false, true));
    }
    topCopy = side ? arm('R', 60, 82, false, true) : back ? arm('L', 40, 82, false, false) + arm('R', 80, 82, false, true) : arm('L', 40, 82, false, false) + arm('R', 80, 82, false, true);
    r += longFront + lowArms + behind();
    /* 蹲下、落地等彎腿動作：腿畫在身體之上（legsFront） */
    r += (PX.legsFront ? part('torso', tor) + legs : legs + part('torso', tor)) + topArms + '<g class="arms-top"' + (PX.armsTop && !back ? '' : ' style="display:none"') + '>' + part('torso', topCopy) + '</g>';
    /* 蓄力光暈（預設隱藏；GameArt.setCharge 開關）：放在最底層，跟著 root 一起移動 */
    var gid = 'gcg' + H.nextId(), gl = '<defs><radialGradient id="' + gid + '"><stop offset="0" stop-color="' + hue('sun', 'soft') + '" stop-opacity=".95"/><stop offset=".55" stop-color="' + hue('sun') + '" stop-opacity=".55"/><stop offset="1" stop-color="' + hue('sun') + '" stop-opacity="0"/></radialGradient></defs>'
      + '<g class="g-glow" style="display:none">' + ell(60, 104, 62, 80, 'url(#' + gid + ')', { 'class': 'g-glow-core' });
    [[34, 150, 0], [86, 142, .35], [60, 156, .7], [48, 134, .15], [74, 160, .5]].forEach(function (p) { gl += circ(p[0], p[1], 2.6, N['surface-raised'], { 'class': 'g-glow-sp', style: 'animation-delay:' + p[2] + 's' }); });
    gl += '</g>';
    r = gl + r;
    var fx = '', i2; for (i2 = 0; i2 < 4; i2++) { var an = i2 * Math.PI / 2; fx += rpath(star(60 + 36 * Math.cos(an), 18 + 14 * Math.sin(an), 5, 2.4), hue('sun'), 2); }
    var zc = hue('sky', 'deep'), zz = '';
    [[84, 10, 1], [96, -4, 1.3], [110, -20, 1.6]].forEach(function (p) { zz += el('path', { d: 'M0 0 H8 L0 9 H8', transform: 'translate(' + p[0] + ' ' + p[1] + ') scale(' + p[2] + ')', stroke: zc, 'stroke-width': 2.4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }); });
    var tk = circ(88, 8, 3, N['surface-raised'], { stroke: hue('stone', 'soft'), 'stroke-width': 1.6 }) + circ(97, -2, 4.6, N['surface-raised'], { stroke: hue('stone', 'soft'), 'stroke-width': 1.6 }) + ell(110, -18, 14, 10, N['surface-raised'], { stroke: hue('stone', 'soft'), 'stroke-width': 1.6 }) + circ(104, -18, 1.8, N['ink-soft']) + circ(110, -18, 1.8, N['ink-soft']) + circ(116, -18, 1.8, N['ink-soft']);
    var bg = rect(95, -26, 6, 16, 3, hue('rose')) + circ(98, -4, 3.4, hue('rose'));
    function fxg(key, inner2) { var on = PX.fxKind === key || (key === '1' && (PX.fxKind === 'orbit' || PX.fxKind === 'sparkle')); return '<g class="g-fx" data-fx="' + key + '" style="display:' + (on ? '' : 'none') + '"' + (on && PX.fx ? ' transform="' + PX.fx + '"' : '') + '>' + inner2 + '</g>'; }
    var sh8 = function (x) { return '<g transform="translate(9 0)">' + x + '</g>'; };
    r += fxg('1', fx) + fxg('zzz', sh8(zz)) + fxg('think', sh8(tk)) + fxg('bang', sh8(bg));
    var inner = part('shadow', ell(60, 165, 28, 4.5, T.depth.shadow.ground)) + part('root', r);
    if (side && o.facing === 'left') inner = '<g transform="translate(120 0) scale(-1 1)">' + inner + '</g>';
    return svg(120, 170, inner, 'g-char g-char-' + view, { overflow: 'visible', 'data-view': view, 'data-mouth': o.mouth });
  }

  /* ---------- 播放 ---------- */
  function applyPose(svgEl, name, t, reduced) {
    var view = svgEl.getAttribute('data-view') || 'front', X = poseTransforms(view, name, reduced ? 0 : t);
    var parts = svgEl.querySelectorAll('[data-part]');
    for (var i = 0; i < parts.length; i++) { var n = parts[i].getAttribute('data-part'); if (X.tf[n]) parts[i].setAttribute('transform', X.tf[n]); }
    var upArms = X.armsTop && svgEl.getAttribute('data-view') !== 'back';
    var ab = svgEl.querySelectorAll('.arms-base'), at = svgEl.querySelectorAll('.arms-top'), q0;
    for (q0 = 0; q0 < ab.length; q0++) ab[q0].style.display = upArms ? 'none' : '';
    for (q0 = 0; q0 < at.length; q0++) at[q0].style.display = upArms ? '' : 'none';
    var ea = X.eyes || 'normal', k;
    ['normal', 'x', 'closed', 'wide', 'happy'].forEach(function (kk) { var e1 = svgEl.querySelectorAll('.eyes-' + kk); for (var q = 0; q < e1.length; q++) e1[q].style.display = kk === ea ? '' : 'none'; });
    var bw = svgEl.querySelectorAll('.brows'); for (var qb = 0; qb < bw.length; qb++) { if (ea === 'wide') bw[qb].setAttribute('transform', 'translate(0 -3)'); else bw[qb].removeAttribute('transform'); }
    var ma = X.mouth || svgEl.getAttribute('data-mouth') || 'smile';
    ['smile', 'open', 'o', 'tongue', 'flat', 'teeth', 'pout'].forEach(function (kk) { var m1 = svgEl.querySelectorAll('.mouth-' + kk); for (var q = 0; q < m1.length; q++) m1[q].style.display = kk === ma ? '' : 'none'; });
    var ch = svgEl.querySelectorAll('.cheek'); for (var c = 0; c < ch.length; c++) ch[c].setAttribute('opacity', X.blush ? '.95' : (ch[c].getAttribute('data-base') || '.55'));
    var fxs = svgEl.querySelectorAll('[data-fx]');
    for (k = 0; k < fxs.length; k++) {
      var key = fxs[k].getAttribute('data-fx'), on = !reduced && X.fxKind && (X.fxKind === key || (key === '1' && (X.fxKind === 'orbit' || X.fxKind === 'sparkle')));
      fxs[k].style.display = on ? '' : 'none'; if (on && X.fx) fxs[k].setAttribute('transform', X.fx); else fxs[k].removeAttribute('transform');
    }
  }
  function animate(svgEl, pose) {
    var mq = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
    var cur = pose || 'idle', t0 = 0, raf = 0, stopped = false;
    function frame(ts) {
      if (stopped) return; if (!t0) t0 = ts;
      var t = ts - t0, P0 = T.motion.poses[cur];
      if (P0 && !P0.loop && t >= P0.period) { applyPose(svgEl, cur, P0.period, mq.matches); return; }
      applyPose(svgEl, cur, t, mq.matches);
      if (!mq.matches) raf = requestAnimationFrame(frame);
    }
    /* 啟動／換姿勢時先同步套一次 t=0 的姿勢：character() 不帶 pose 時畫的是站姿基準，等 rAF 才套姿勢會閃一格站姿（殘影） */
    function start() { cancelAnimationFrame(raf); t0 = 0; if (!stopped) applyPose(svgEl, cur, 0, mq.matches); raf = requestAnimationFrame(frame); }
    start();
    return { setPose: function (n) { cur = n; start(); }, stop: function () { stopped = true; cancelAnimationFrame(raf); } };
  }

  function randomLook(rnd) {
    var r = rnd || Math.random, O = T.character.options, pick = function (arr) { return arr[Math.floor(r() * arr.length)]; };
    var acc = []; if (r() < .6) acc.push(pick(O.accessories.filter(function (x) { return x !== 'backpack' && x !== 'cape' && x !== 'wings'; }))); if (r() < .25) acc.push(pick(['backpack', 'cape', 'wings']));
    return { species: 'kid', skin: pick(O.skin), hairStyle: pick(O.hairStyle), hairColor: pick(O.hairColor), faceShape: pick(O.faceShape), brows: pick(O.brows), eyes: pick(O.eyes), mouth: pick(O.mouth), outfit: pick(O.outfit), outfitColor: pick(O.outfitColor), pantsColor: pick(O.pantsColor), accessories: acc.filter(function (v, i, a2) { return a2.indexOf(v) === i; }), held: pick(O.held) };
  }

  /* 序列取樣：依 motion.sequences 回傳 {pose, view, facing, t}，t 為該步內的毫秒 */
  function sequenceAt(name, ms) {
    var Q = T.motion.sequences && T.motion.sequences[name]; if (!Q) return null;
    var steps = Q.steps, total = 0, i; steps.forEach(function (st) { total += st.ms; });
    var m = Q.loop ? ((ms % total) + total) % total : Math.min(ms, total - 1);
    for (i = 0; i < steps.length; i++) { if (m < steps[i].ms) return { pose: steps[i].pose, view: steps[i].view, facing: steps[i].facing, t: m, step: i }; m -= steps[i].ms; }
    var l = steps[steps.length - 1]; return { pose: l.pose, view: l.view, facing: l.facing, t: l.ms, step: steps.length - 1 };
  }
  /* 座位：pose.seat = {prop, hUnits}；hUnits 為道具高（以角色 170 高的設計單位計），底部對齊角色腳底（groundY），水平置中於角色。 */
  A.seatFor = function (poseName) { var P0 = T.motion.poses[poseName]; return P0 && P0.seat ? { prop: P0.seat.prop, hUnits: P0.seat.hUnits, dx: P0.seat.dx || 0, hRel: P0.seat.hUnits / 170 } : null; };
  A.sequenceAt = sequenceAt; A.sequences = Object.keys(T.motion.sequences || {}).filter(function (k) { return k !== 'note'; });

  A.setCharge = function (svgEl, on, full) { var g = svgEl && svgEl.querySelector('.g-glow'); if (!g) return; g.style.display = on ? '' : 'none'; g.classList.toggle('full', !!(on && full)); };
  A.character = character; A.animate = animate; A.applyPose = applyPose; A.poseTransforms = poseTransforms; A.randomLook = randomLook;
  A.presets = T.character.presets; A.options = T.character.options; A.poses = Object.keys(T.motion.poses); A.views = Object.keys(T.character.views);
})(typeof window !== 'undefined' ? window : globalThis);
