/* race-sim.js — 賽跑平衡試算（Node：node race-sim.js [次數]）。
 * 讀 game-tokens.json 的 race：用四種熟練度的玩家模型跟各場對手模擬，輸出勝率與時間分布。
 * 目標勝率：第 1 場新手 ≥90%；第 2 場一般玩家 ≈60–70%；第 3 場熟練玩家 ≈35–50%。調整 race.opponents／stages 後重跑。 */
var fs = require('fs'), path = require('path');
var T = JSON.parse(fs.readFileSync(path.join(__dirname, 'game-tokens.json'), 'utf8')), R = T.race;
if (process.env.RACE_OVERRIDE) { var OV = JSON.parse(process.env.RACE_OVERRIDE); (function m(a, b) { Object.keys(b).forEach(function (k) { if (b[k] && typeof b[k] === 'object' && !Array.isArray(b[k])) m(a[k] = a[k] || {}, b[k]); else a[k] = b[k]; }); })(R, OV); }
var N = +process.argv[2] || 3000, DT = 0.02;
var SKILLS = {
  novice:  { clear: .55, col: .55, plat: .05, smartCan: false, hold: .3, tap: 0, label: '新手' },
  average: { clear: .80, col: .75, plat: .25, smartCan: false, hold: .5, tap: .15, label: '一般' },
  good:    { clear: .92, col: .90, plat: .55, smartCan: false, hold: .6, tap: .3, label: '熟練' },
  expert:  { clear: 1.0, col: 1.0, plat: 1.0, smartCan: false, hold: .5, tap: .5, label: '滿分' },
  tapper:  { clear: .92, col: .90, plat: .55, smartCan: false, hold: 0, tap: 1, label: '連點（熟練）' }
};
function rnd() { return Math.random(); }

/* 把賽道攤平成事件：pickup／hazard／zone／platform */
function events(stage) {
  var ev = [];
  stage.items.forEach(function (it) {
    var d = T.props.list.filter(function (p) { return p.id === it.id; })[0], k = d && d.collider && d.collider.kind;
    if (it.id === 'stoneBlock') { (it.top || []).forEach(function (t, i) { ev.push({ x: it.x + i * 30, id: t, kind: 'platform' }); }); return; }
    if (k === 'pickup' || k === 'spring') ev.push({ x: it.x, id: d.collider.effect || it.id, kind: 'pickup' });
    else if (k === 'zone') ev.push({ x: it.x, w: it.w || d.size[0], id: d.collider.effect, kind: 'zone' });
    else if (k === 'hazard') ev.push({ x: it.x, id: d.collider.effect || it.id, kind: 'hazard' });
    else if (it.id === 'log') ev.push({ x: it.x, id: it.id, kind: 'solid' });
  });
  ev.sort(function (a, b) { return a.x - b.x; });
  return ev;
}

function runPlayer(stage, S) {
  var L = R.track.length, base = R.player.speed, ev = events(stage), x = 0, t = 0, i = 0;
  var boost = { until: 0, mult: 1 }, slows = [], shield = 0, can = 0, hits = 0, zones = [], stall = 0;
  var opp = R.opponents[stage.opponent], o = { x: 0, t: 0, sleep: 0, cd: 0, stIdx: 0, stall: 0 };
  var oTime = null, pTime = null;
  while ((pTime === null || oTime === null) && t < 200) {
    /* 玩家事件 */
    while (i < ev.length && ev[i].x <= x) {
      var e = ev[i++], eff = R.effects[e.id] || {};
      if (e.kind === 'pickup') {
        if (rnd() < S.col) {
          if (e.id === 'speedShoe') { boost = { until: t + eff.sec, mult: Math.max(boost.until > t ? boost.mult : 1, eff.mult) }; }
          else if (e.id === 'boostCan') can = Math.min(can + 1, eff.store);
          else if (e.id === 'bubble') shield = 1;
          else if (e.id === 'spring') x += eff.skip;
        }
      } else if (e.kind === 'platform') {
        if (rnd() < S.plat) { if (e.id === 'speedShoe') boost = { until: t + 3, mult: Math.max(boost.until > t ? boost.mult : 1, 1.5) }; else if (e.id === 'boostCan') can = 1; else if (e.id === 'bubble') shield = 1; }
      } else if (e.kind === 'hazard') {
        if (rnd() > S.clear) { if (shield) shield = 0; else { hits++; slows.push({ until: t + eff.slow.sec, mult: eff.slow.mult }); } }
      } else if (e.kind === 'zone') {
        if (e.id === 'wind') zones.push({ x0: e.x, x1: e.x + e.w, mult: eff.mult });
        else if (rnd() > S.clear) { if (shield) shield = 0; else { hits++; zones.push({ x0: e.x, x1: e.x + e.w, mult: eff.slow.mult }); } }
      } else if (e.kind === 'solid') {
        if (rnd() > S.clear) { hits++; stall = Math.max(stall, .5); }
      }
    }
    /* 使用加速罐 */
    if (can && boost.until <= t) {
      var ahead = o.x < x, use = S.smartCan ? (x > 2900 || (!ahead && x > 1500 && (o.x - x) > 150)) : true;
      if (use) { can = 0; boost = { until: t + R.effects.boostCan.sec, mult: R.effects.boostCan.mult }; }
    }
    var pc = R.player.pace || { hold: 1, tap: 1 }, pace = 1 + (pc.hold - 1) * S.hold + (pc.tap - 1) * S.tap;   /* 步調：依各熟練度的『按住 → 時間比例』與『連點時間比例』估平均倍率（方向鍵步調，v1.5） */
    var v = base * pace * (boost.until > t ? boost.mult : 1);
    slows = slows.filter(function (s) { return s.until > t; }); slows.forEach(function (s) { v *= s.mult; });
    zones.forEach(function (z) { if (x >= z.x0 && x <= z.x1) v *= z.mult; });
    if (stall > 0) { stall -= DT; v *= .2; }
    if (pTime === null) { x += v * DT; if (x >= L) pTime = t; }
    /* 對手 */
    if (oTime === null) {
      var ov = opp.speed;
      if (opp.sprint && (t % opp.sprint.everySec) < opp.sprint.sec) ov = opp.sprint.speed;
      if (opp.nap) { o.cd -= DT; if (o.sleep > 0) { o.sleep -= DT; ov = 0; } else if (o.cd <= 0 && o.x - x > opp.nap.lead && pTime === null) { o.sleep = opp.nap.sec; o.cd = opp.nap.cooldownSec + opp.nap.sec; } }
      if (opp.stumble && o.stIdx < opp.stumble.length && o.x >= opp.stumble[o.stIdx].x) { o.stall = opp.stumble[o.stIdx].sec; o.stIdx++; }
      if (o.stall > 0) { o.stall -= DT; ov *= .15; }
      o.x += ov * DT; if (o.x >= L) oTime = t;
    }
    t += DT;
  }
  return { win: pTime <= oTime, pTime: pTime, oTime: oTime, hits: hits };
}

function pct(a, p) { a = a.slice().sort(function (x, y) { return x - y; }); return a[Math.min(a.length - 1, Math.floor(a.length * p))]; }
var out = [];
R.stages.forEach(function (st) {
  var row = { stage: st.id, opp: st.opponent, target: st.targetTime };
  Object.keys(SKILLS).forEach(function (k) {
    var w = 0, times = [], all = [], star2 = 0, star3 = 0, i;
    for (i = 0; i < N; i++) { var r = runPlayer(st, SKILLS[k]); all.push(r.pTime); if (r.win) { w++; times.push(r.pTime); if (r.pTime <= st.targetTime) { star2++; if (r.hits === 0) star3++; } } }
    row[k] = { win: w / N, med: pct(all, .5), p2: star2 / N, p3: star3 / N };
  });
  out.push(row);
});
console.log('賽跑試算（每格 ' + N + ' 次）：勝率｜中位完賽秒數（含輸的場次）｜★★比例｜★★★比例');
out.forEach(function (r) {
  console.log('場 ' + r.stage + ' vs ' + r.opp + '（targetTime ' + r.target + 's）');
  Object.keys(SKILLS).forEach(function (k) { var c = r[k]; console.log('  ' + SKILLS[k].label + '：' + (c.win * 100).toFixed(0) + '%｜' + (c.med ? c.med.toFixed(1) : '—') + 's｜★★ ' + (c.p2 * 100).toFixed(0) + '%｜★★★ ' + (c.p3 * 100).toFixed(0) + '%'); });
});
if (require.main === module && process.argv.indexOf('--json') > 0) fs.writeFileSync(path.join(__dirname, 'race-sim.result.json'), JSON.stringify(out, null, 1));
