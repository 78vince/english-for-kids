/* mole-sim.js — 打地鼠平衡試算（Node：node mole-sim.js [次數]）
 * 讀取 game-tokens.json 的 mole 區塊，模擬幼童新手、一般學童、熟練高手、滿分玩家在 30 秒內的得分與星等分布。
 * 目標梯度：新手 1 星 ≥95%、一般玩家 2 星 ≥80%、熟練玩家 3 星 ≥60%。 */
var fs = require('fs');
var path = require('path');

var tokensPath = path.join(__dirname, 'game-tokens.json');
var T = JSON.parse(fs.readFileSync(tokensPath, 'utf8'));
var M = T.mole;

var RUNS = +process.argv[2] || 4000;

var PLAYERS = {
  novice: {
    label: '幼童新手',
    hitRate: 0.58,
    melonErrorRate: 0.25,
  },
  average: {
    label: '一般學童',
    hitRate: 0.80,
    melonErrorRate: 0.10,
  },
  skilled: {
    label: '熟練高手',
    hitRate: 0.93,
    melonErrorRate: 0.03,
  },
  perfect: {
    label: '滿分極限',
    hitRate: 1.00,
    melonErrorRate: 0.00,
  },
};

function simulateOneGame(player) {
  var durationSec = M.durationSec || 30;
  var stages = M.stages || [
    { fromSec: 0, toSec: 10, maxActive: 1, stayMs: 1200, melonChance: 0.15 },
    { fromSec: 10, toSec: 20, maxActive: 2, stayMs: 900, melonChance: 0.25 },
    { fromSec: 20, toSec: 30, maxActive: 3, stayMs: 700, melonChance: 0.35 },
  ];

  var score = 0;
  var combo = 0;
  var maxCombo = 0;
  var melonsHit = 0;

  var currentTimeMs = 0;
  var holes = [0, 0, 0, 0, 0, 0, 0, 0]; // 每個洞忙碌至何時 (ms)
  var stepMs = 350; // 每 350ms 檢查並嘗試冒出

  while (currentTimeMs < durationSec * 1000) {
    var curSec = currentTimeMs / 1000;
    var st = stages[stages.length - 1];
    for (var i = 0; i < stages.length; i++) {
      if (curSec >= stages[i].fromSec && curSec < stages[i].toSec) {
        st = stages[i];
        break;
      }
    }

    // 計算目前活躍地鼠數
    var activeCount = 0;
    var idleIndices = [];
    for (var h = 0; h < 8; h++) {
      if (holes[h] > currentTimeMs) {
        activeCount++;
      } else {
        idleIndices.push(h);
      }
    }

    if (activeCount < st.maxActive && idleIndices.length > 0) {
      // 冒出 1 隻
      var pickIdx = idleIndices[Math.floor(Math.random() * idleIndices.length)];
      var isMelon = Math.random() < st.melonChance;
      holes[pickIdx] = currentTimeMs + st.stayMs;

      if (!isMelon) {
        // 普通目標：玩家判定是否擊中
        if (Math.random() < player.hitRate) {
          score++;
          combo++;
          if (combo > maxCombo) maxCombo = combo;
        }
      } else {
        // 西瓜帽目標：玩家是否誤擊
        if (Math.random() < player.melonErrorRate) {
          melonsHit++;
          combo = 0; // 斷連擊
        }
      }
    }

    currentTimeMs += stepMs;
  }

  var stars = 0;
  if (score >= M.starThresholds[2]) stars = 3;
  else if (score >= M.starThresholds[1]) stars = 2;
  else if (score >= M.starThresholds[0]) stars = 1;

  return {
    score: score,
    stars: stars,
    maxCombo: maxCombo,
    melonsHit: melonsHit,
    zeroMelon: melonsHit === 0,
  };
}

console.log('=== 打地鼠平衡模擬器 (mole-sim.js) ===');
console.log('星等門檻: ' + JSON.stringify(M.starThresholds));
console.log('模擬場次：' + RUNS + ' 場 / 玩家模型\n');

Object.keys(PLAYERS).forEach(function (k) {
  var p = PLAYERS[k];
  var totalScore = 0;
  var starsCount = [0, 0, 0, 0];
  var zeroMelonCount = 0;
  var totalMelonsHit = 0;

  for (var r = 0; r < RUNS; r++) {
    var res = simulateOneGame(p);
    totalScore += res.score;
    starsCount[res.stars]++;
    if (res.zeroMelon) zeroMelonCount++;
    totalMelonsHit += res.melonsHit;
  }

  var avgScore = (totalScore / RUNS).toFixed(1);
  var avgMelons = (totalMelonsHit / RUNS).toFixed(1);
  var s0 = ((starsCount[0] / RUNS) * 100).toFixed(1);
  var s1 = ((starsCount[1] / RUNS) * 100).toFixed(1);
  var s2 = ((starsCount[2] / RUNS) * 100).toFixed(1);
  var s3 = ((starsCount[3] / RUNS) * 100).toFixed(1);
  var zeroMelonPct = ((zeroMelonCount / RUNS) * 100).toFixed(1);
  var atLeast1Star = (((starsCount[1] + starsCount[2] + starsCount[3]) / RUNS) * 100).toFixed(1);
  var atLeast2Star = (((starsCount[2] + starsCount[3]) / RUNS) * 100).toFixed(1);

  console.log('【' + p.label + '】(命中率 ' + Math.round(p.hitRate * 100) + '% / 誤擊率 ' + Math.round(p.melonErrorRate * 100) + '%)');
  console.log('  平均得分: ' + avgScore + ' 分 | 平均誤擊西瓜: ' + avgMelons + ' 次 | 零誤擊率: ' + zeroMelonPct + '%');
  console.log('  星等達成: 0星 ' + s0 + '% | 1星 ' + s1 + '% | 2星 ' + s2 + '% | 3星 ' + s3 + '%');
  console.log('  ≥1星率: ' + atLeast1Star + '% | ≥2星率: ' + atLeast2Star + '%\n');
});
