// 驗證翻牌配對「獨立 iframe＋postMessage 橋接」架構（2026-09-29 架構升級）的訊息協定
// 有沒有正確接上。main.ts／memoryMatchStandalone.ts 都用了 Vite 專屬的
// import.meta.glob／?url 這類語法，沒辦法在 plain tsx 下直接 import 執行，這裡沿用
// verify-unit-completion-badges.ts 等既有腳本的作法：直接讀原始碼字串做靜態比對，
// 確認關鍵的程式碼片段真的存在、責任真的收斂在該收斂的地方，不是測試「跨視窗訊息
// 實際送達」這種沒有瀏覽器環境測不了的行為。
// 用法：npx tsx scripts/verify-game-bridge-messages.ts

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error("❌ " + message);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.join(__dirname, "..", "src");

const gameBridgeSrc = readFileSync(path.join(srcDir, "gameBridge.ts"), "utf-8");
const mainSrc = readFileSync(path.join(srcDir, "main.ts"), "utf-8");
const standaloneSrc = readFileSync(path.join(srcDir, "games", "memoryMatchStandalone.ts"), "utf-8");
// 2026-09-30 填字遊戲（遊戲室第二款遊戲）上線，一開始就照同一套 iframe＋postMessage
// 架構做，這支腳本比照擴充涵蓋它的橋接程式碼。
const crosswordStandaloneSrc = readFileSync(path.join(srcDir, "games", "crosswordStandalone.ts"), "utf-8");

// ---- 檢查 1：gameBridge.ts 有正確 export GAME_BRIDGE_CHANNEL 常數，
//      main.ts／memoryMatchStandalone.ts 都是 import 這個常數，不是各自定義字串 ----
{
  assert(
    /export const GAME_BRIDGE_CHANNEL\s*=/.test(gameBridgeSrc),
    "gameBridge.ts 應該要 export GAME_BRIDGE_CHANNEL 常數"
  );
  assert(
    /import\s*\{[^}]*GAME_BRIDGE_CHANNEL[^}]*\}\s*from\s*["']\.\/gameBridge["']/.test(mainSrc),
    "main.ts 應該從 ./gameBridge import GAME_BRIDGE_CHANNEL，不是自己定義一份字串常值"
  );
  assert(
    /import\s*\{[^}]*GAME_BRIDGE_CHANNEL[^}]*\}\s*from\s*["']\.\.\/gameBridge["']/.test(standaloneSrc),
    "memoryMatchStandalone.ts 應該從 ../gameBridge import GAME_BRIDGE_CHANNEL，不是自己定義一份字串常值"
  );
  assert(
    /import\s*\{[^}]*GAME_BRIDGE_CHANNEL[^}]*\}\s*from\s*["']\.\.\/gameBridge["']/.test(crosswordStandaloneSrc),
    "crosswordStandalone.ts 應該從 ../gameBridge import GAME_BRIDGE_CHANNEL，不是自己定義一份字串常值"
  );
  console.log("✅ 檢查 1 通過：GAME_BRIDGE_CHANNEL 只有一份定義，三邊都是 import 使用。");
}

// ---- 檢查 2：main.ts 的訊息處理函式裡，requestReplay 分支確實有呼叫 spendTokens，
//      且成功/失敗兩條路徑都有對應的 postMessage／window.alert／goToGameRoom 呼叫 ----
{
  const handlerMatch = mainSrc.match(
    /function handleGameBridgeMessage\([\s\S]*?\n\}\n/
  );
  assert(!!handlerMatch, "main.ts 應該有 handleGameBridgeMessage() 這個訊息處理函式");
  const handlerBody = handlerMatch![0];

  assert(
    /requestReplay/.test(handlerBody) && /spendTokens\(/.test(handlerBody),
    "handleGameBridgeMessage() 的 requestReplay 分支應該要呼叫 spendTokens()"
  );
  assert(
    /replayApproved/.test(handlerBody) && /postMessage/.test(handlerBody),
    "handleGameBridgeMessage() 應該在扣款成功時 postMessage replayApproved 給 iframe"
  );
  assert(
    /replayDenied/.test(handlerBody),
    "handleGameBridgeMessage() 應該在扣款失敗時 postMessage replayDenied 給 iframe"
  );
  assert(
    /window\.alert\(/.test(handlerBody),
    "handleGameBridgeMessage() 扣款失敗時應該用鼓勵文案的 window.alert() 提示使用者"
  );
  assert(
    /goToGameRoom\(\)/.test(handlerBody),
    "handleGameBridgeMessage() 應該在扣款失敗或收到 exitToRoom 時呼叫 goToGameRoom()"
  );
  // 2026-09-30 填字遊戲上線時把原本寫死 "memory_match" 的 cost 查詢改成用目前畫面
  // （screen 狀態）判斷是哪一款遊戲——這裡守住這個回歸，不要有人手滑改回寫死单一款
  // 遊戲 id 的舊寫法，導致填字遊戲的「再玩一次」扣到翻牌配對的代幣數字。
  assert(
    /currentGameId\(\)/.test(handlerBody),
    "handleGameBridgeMessage() 的 requestReplay 分支應該用 currentGameId() 判斷目前是哪一款遊戲，不要寫死單一款遊戲 id"
  );
  assert(
    !/GAMES\.find\(\(g\) => g\.id === "memory_match"\)/.test(handlerBody),
    "handleGameBridgeMessage() 不應該寫死用 \"memory_match\" 查代幣成本——這樣填字遊戲的再玩一次會扣錯金額"
  );
  console.log("✅ 檢查 2 通過：main.ts 的 requestReplay 分支正確呼叫 spendTokens，用 currentGameId() 判斷成本，成功/失敗兩條路徑都有對應處理。");
}

// ---- 檢查 3：memoryMatchStandalone.ts／crosswordStandalone.ts 的「再玩一次」按鈕
//      click handler 裡，沒有直接呼叫 spendTokens 或 getTokenBalance（確認扣款責任
//      真的收斂回 parent，沒有殘留舊架構的直接扣款程式碼；填字遊戲也不應該直接呼叫
//      gameHighScores.ts 的 recordStars——星等存檔責任一樣收斂在 parent）----
for (const [name, src] of [
  ["memoryMatchStandalone.ts", standaloneSrc],
  ["crosswordStandalone.ts", crosswordStandaloneSrc],
] as const) {
  assert(!/spendTokens/.test(src), `${name} 不應該出現 spendTokens——扣款責任要收斂在 main.ts（parent）那邊`);
  assert(!/getTokenBalance/.test(src), `${name} 不應該出現 getTokenBalance——代幣餘額只有 parent 需要知道`);
  assert(!/from ["']\.\.\/gameTokens["']/.test(src), `${name} 不應該 import gameTokens.ts——遊戲本身完全不知道代幣這個概念存在`);
  assert(!/recordStars|getBestStars/.test(src), `${name} 不應該出現 recordStars／getBestStars——最高紀錄存檔責任要收斂在 main.ts（parent）那邊`);
  assert(!/from ["']\.\.\/gameHighScores["']/.test(src), `${name} 不應該 import gameHighScores.ts——遊戲本身完全不知道最高紀錄怎麼存`);
  assert(
    /requestReplay/.test(src) && /postMessage/.test(src),
    `${name} 的「再玩一次」按鈕應該 postMessage requestReplay 給 parent`
  );
  console.log(`✅ 檢查 3 通過：${name} 完全沒有直接扣款／存最高紀錄的程式碼，責任正確收斂在 parent。`);
}

// ---- 檢查 4：main.ts／memoryMatchStandalone.ts／crosswordStandalone.ts 的 message
//      事件監聽器裡都有檢查 event.origin === window.location.origin（同源保護沒有
//      被遺漏）----
for (const [name, src] of [
  ["main.ts", mainSrc],
  ["memoryMatchStandalone.ts", standaloneSrc],
  ["crosswordStandalone.ts", crosswordStandaloneSrc],
] as const) {
  assert(
    /event\.origin\s*!==\s*window\.location\.origin/.test(src),
    `${name} 的訊息處理應該檢查 event.origin === window.location.origin，忽略非同源的訊息`
  );
}
console.log("✅ 檢查 4 通過：main.ts／memoryMatchStandalone.ts／crosswordStandalone.ts 的 message 監聽器都有同源保護。");

// ---- 檢查 5：填字遊戲「破關回報星等」的橋接——crosswordStandalone.ts 的 "complete"
//      訊息要帶 stars 欄位，main.ts 收到帶 stars 的 "complete" 訊息要呼叫 recordStars()
//      存檔（見 gameBridge.ts 2026-09-30 新增的 stars 欄位說明）----
{
  assert(
    /type:\s*"complete"[^}]*stars/.test(crosswordStandaloneSrc) || /stars\s*[,}][\s\S]{0,80}type:\s*"complete"/.test(crosswordStandaloneSrc),
    "crosswordStandalone.ts 送出的 \"complete\" 訊息應該帶 stars 欄位"
  );
  assert(
    /data\.type === "complete"/.test(mainSrc) && /recordStars\(/.test(mainSrc),
    "main.ts 收到 \"complete\" 訊息時應該呼叫 recordStars() 存最高紀錄"
  );
  console.log("✅ 檢查 5 通過：填字遊戲破關的星等會透過 \"complete\" 訊息回報給 parent，parent 正確呼叫 recordStars() 存檔。");
}

console.log("\n✅ 全部 game bridge 訊息協定靜態檢查通過。");
