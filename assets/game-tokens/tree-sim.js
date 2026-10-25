/* tree-sim.js — 「爬樹」可達性檢查＋平衡試算（Node：node tree-sim.js [次數]；env TREE_OVERRIDE 為 JSON，深度合併進 treeClimb）。
 * 1) 可達性：用 GameArt.treeBuild 產生各難度、多組種子的地形，檢查『只用一般樹枝』是否存在從起點到樹頂的路徑（跳高、水平空隙、單向平台規則）。
 * 2) 平衡：用技能模型（新手／一般／熟練／滿分／連跳）模擬 N 局，輸出各難度的星等機率、中位高度、掉出畫面率與登頂率。
 *    技能模型是『假設的玩家行為』，不是實測；上線後要用實機結果回頭校正 tree-sim 參數。 */
var fs = require('fs'), path = require('path'), vm = require('vm');
var DIR = __dirname;
global.window = global;
['game-tokens.js', 'game-art.js', 'game-props.js', 'game-race.js', 'game-tree.js'].forEach(function (f) { vm.runInThisContext(fs.readFileSync(path.join(DIR, f), 'utf8'), { filename: f }); });
var A = global.GameArt, T = global.GameTokens, TC = T.treeClimb;
if (process.env.TREE_OVERRIDE) { (function m(a, b) { Object.keys(b).forEach(function (k) { if (b[k] && typeof b[k] === 'object' && !Array.isArray(b[k])) m(a[k] = a[k] || {}, b[k]); else a[k] = b[k]; }); })(TC, JSON.parse(process.env.TREE_OVERRIDE)); }
var N = +process.argv[2] || 2000;
var rnd = Math.random;

/* ---------- 物理（與 token player 一致） ---------- */
var JH = TC.player.jump.height, JT = TC.player.jump.airMs / 1000, G = 2 * JH / Math.pow(JT / 2, 2), VX = TC.player.walk * TC.player.airControl;
function airTime(dy) { return JT / 2 + Math.sqrt(Math.max(0, 2 * (JH - dy) / G)); }       /* 起跳後落到高 dy 的平台所需時間 */
function reachX(dy) { return VX * airTime(dy); }

/* ---------- 1) 可達性 ---------- */
function reachable(a, b, lv) {
  var dy = b.alt - a.alt; if (dy <= 0 || dy > JH * 0.91) return dy <= 0 && Math.abs(dy) < 1e-6 ? false : false;
  var gap = Math.max(0, Math.max(a.x0, b.x0) - Math.min(a.x1, b.x1));
  return gap <= lv.gapMax && gap <= 0.85 * reachX(dy);
}
function checkReach() {
  var bad = 0, tot = 0, worst = 0;
  TC.levels.forEach(function (lv) {
    for (var seed = 1; seed <= 150; seed++) {
      var br = A.treeBuild(lv.id, seed), main = br.filter(function (b) { return b.kind !== 'brittle'; }).sort(function (x, y) { return x.alt - y.alt; });
      var reach = [true], i, j, ok = true;
      for (i = 1; i < main.length; i++) {
        reach[i] = false;
        for (j = i - 1; j >= 0 && main[i].alt - main[j].alt <= JH; j--) if (reach[j] && reachable(main[j], main[i], lv)) { reach[i] = true; break; }
        if (!reach[i] && main[i].kind !== 'top') { /* 備援枝未接上也算不可達 */ ok = false; }
        if (!reach[i] && main[i].kind === 'top') ok = false;
      }
      /* 樹頂必須可達；中間若有「孤立」枝不影響通關，但要有一條路徑到頂 */
      var topOK = reach[main.length - 1]; tot++; if (!topOK) { bad++; worst++; }
    }
  });
  return { total: tot, bad: bad };
}

/* ---------- 2) 平衡 ---------- */
var SKILLS = {
  novice: { label: '新手', tJump: 2.4, p0: .88, dyPen: .16, pOut: .03, hit: .55, col: .5 },
  average: { label: '一般', tJump: 1.75, p0: .93, dyPen: .10, pOut: .02, hit: .36, col: .7 },
  good: { label: '熟練', tJump: 1.35, p0: .965, dyPen: .06, pOut: .012, hit: .2, col: .85 },
  expert: { label: '滿分', tJump: 1.1, p0: .99, dyPen: .02, pOut: .004, hit: .1, col: .95 },
  jumper: { label: '節奏型連跳', tJump: 1.2, p0: .965, dyPen: .06, pOut: .012, hit: .22, col: .85 }
};
function zoneOf(alt) { var z = TC.world.zones, i; for (i = 0; i < z.length; i++) if (alt < z[i].to) return z[i].id; return z[z.length - 1].id; }
function runOne(lv, S) {
  var br = A.treeBuild(lv.id, 1 + Math.floor(rnd() * 1e6)).filter(function (b) { return b.kind !== 'brittle'; }).sort(function (x, y) { return x.alt - y.alt; });
  var t = 0, limit = lv.timeSec, i = 0, maxAlt = 0, hourglass = 0, out = false, summit = false, hits = 0, ob = TC.spawn.obstacles, it = TC.spawn.items, cur = br[0];
  while (t < limit && i < br.length - 1) {
    var nx = br[i + 1], dy = nx.alt - br[i].alt, dyN = (dy - 60) / 60, kind = nx.kind;
    var p = Math.max(.35, S.p0 - S.dyPen * Math.max(0, dyN) * 2 - (br[i].side !== nx.side && nx.side !== 'W' && br[i].side !== 'W' ? .02 : 0));
    if (nx.shroom) p = Math.min(.995, p + .04);
    t += S.tJump * (.85 + .3 * rnd()) * (1 + .08 * (dy - 80) / 40);
    /* 障礙：此段高度內遇到的障礙數（期望值），各自有機率被碰到 */
    var z = zoneOf(nx.alt), types = ob[z] || {}, k;
    for (k in types) { if (lv.allow.indexOf(k) < 0) continue; var lam = types[k] * lv.obstacleScale * dy / 1000; if (rnd() < lam && rnd() < S.hit) { hits++; t += (TC.effects[k].stunMs || 800) / 1000 + .6; if (rnd() < .22) p *= .5; } }
    /* 道具 */
    if (rnd() < it.hourglassLeaf * dy / 1000 && rnd() < S.col && hourglass < TC.effects.hourglass.maxPerRun) { hourglass++; limit += TC.effects.hourglass.addSec; }
    var capeUse = rnd() < it.capeItem * dy / 1000 && rnd() < S.col;
    if (t >= limit) break;
    if (rnd() < p) { i++; maxAlt = Math.max(maxAlt, br[i].alt); }
    else {   /* 失敗：往下掉 1–3 層，可能掉出畫面 */
      var back = 1 + (rnd() < .35 ? 1 : 0); t += 1.0 + .4 * back;
      if (rnd() < S.pOut * (1 + .5 * (back - 1))) { out = true; break; }
      i = Math.max(0, i - back);
    }
    if (capeUse) {   /* 披風：3 秒飛升，結束後落在最近的樹枝 */
      var up = TC.effects.cape.speed * TC.effects.cape.flyMs / 1000, tgt = br[i].alt + up, j2 = i; while (j2 < br.length - 1 && br[j2 + 1].alt <= tgt) j2++;
      t += TC.effects.cape.flyMs / 1000; i = j2; maxAlt = Math.max(maxAlt, br[i].alt);
    }
  }
  if (i >= br.length - 1) summit = true;
  return { m: maxAlt / TC.world.unitsPerMeter, out: out, summit: summit, hits: hits };
}
function pct(a, p) { a = a.slice().sort(function (x, y) { return x - y; }); return a[Math.min(a.length - 1, Math.floor(a.length * p))]; }

var rc = checkReach();
console.log('可達性：' + rc.total + ' 組地形（3 難度 × 150 種子），樹頂不可達 ' + rc.bad + ' 組' + (rc.bad ? ' ❌' : ' ✅'));
console.log('跳躍：高 ' + JH + '、滯空 ' + JT + 's、重力 ' + G.toFixed(0) + '、空中水平速度 ' + VX.toFixed(0) + '；dy=95/105/118 的水平可達 ' + [95, 105, 118].map(function (d) { return reachX(d).toFixed(0); }).join('/'));
console.log('\n平衡試算（每格 ' + N + ' 局）：★／★★／★★★ 機率｜中位公尺｜掉出畫面率｜登頂率｜平均碰撞');
TC.levels.forEach(function (lv) {
  var th = TC.stars[lv.id];
  console.log('【' + lv.label + '】' + lv.timeSec + 's，門檻 ' + th.join('/') + ' m');
  Object.keys(SKILLS).forEach(function (sk) {
    var S = SKILLS[sk], ms = [], o = 0, su = 0, h = 0, s1 = 0, s2 = 0, s3 = 0, n;
    for (n = 0; n < N; n++) { var r = runOne(lv, S); ms.push(r.m); if (r.out) o++; if (r.summit) su++; h += r.hits; if (r.m >= th[0]) s1++; if (r.m >= th[1]) s2++; if (r.m >= th[2]) s3++; }
    console.log('  ' + S.label + '：' + (s1 / N * 100).toFixed(0) + '%／' + (s2 / N * 100).toFixed(0) + '%／' + (s3 / N * 100).toFixed(0) + '%｜' + pct(ms, .5).toFixed(0) + ' m｜掉出 ' + (o / N * 100).toFixed(0) + '%｜登頂 ' + (su / N * 100).toFixed(0) + '%｜碰撞 ' + (h / N).toFixed(1));
  });
});
