// 驗證 Stage E 會話練習的「練習模式」（聊天記錄中文＋答題選項中文模糊）：
// - readConversationPracticeMode()/setConversationPracticeMode() 存在，沒存過值時預設 false。
// - 主開關放進 stageHeader() 的 extraActions，只切換 .conversation-wrapper 的
//   practice-mode-on class，不呼叫 render()（比照單字總覽 9.117 的做法）。
// - createChatRow()：每句中文點擊只切換 chat-text-zh--revealed，不呼叫 render()。
// - renderButtons()：「看中文」鈕只切換 optionsList 的 options-zh-revealed，每輪重建時先拿掉。
// - 練習模式關閉時不會有任何模糊：wrapper 只在 practiceModeOn 為 true 時帶 practice-mode-on，
//   且 style.css 裡所有 Stage E 的 blur 規則都掛在 .conversation-wrapper.practice-mode-on 底下。
// - 不影響點單字查翻譯的 tooltip，也不碰 conversationGame.ts。
// 純字串比對原始碼，實際模糊效果仍需在 demo-standalone.html 手動確認。
// 用法：npx tsx scripts/verify-conversation-practice-mode.ts

import { readFileSync } from "node:fs";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error("❌ " + message);
}

const mainTs = readFileSync(new URL("../src/main.ts", import.meta.url), "utf-8");
const styleCss = readFileSync(new URL("../src/style.css", import.meta.url), "utf-8");
const gameTs = readFileSync(new URL("../src/conversationGame.ts", import.meta.url), "utf-8");

const convFn = mainTs.match(/function renderConversation\(\): void \{[\s\S]*?\n\}\n/);
assert(convFn !== null, "應該找得到 renderConversation() 函式定義");
// 去掉 // 註解再比對，避免註解裡提到 render() 造成誤判
const conv = convFn![0].replace(/\/\/[^\n]*/g, "");

// ---- 測試 1：設定讀寫函式 + 預設 false（實際執行，用假的 localStorage）----
{
  const readMatch = mainTs.match(/function readConversationPracticeMode\(\): boolean \{[\s\S]*?\n\}/);
  const setMatch = mainTs.match(/function setConversationPracticeMode\(enabled: boolean\): void \{[\s\S]*?\n\}/);
  assert(readMatch !== null, "應該有 readConversationPracticeMode()");
  assert(setMatch !== null, "應該有 setConversationPracticeMode()");
  const keyMatch = mainTs.match(/const CONVERSATION_PRACTICE_MODE_STORAGE_KEY = "([^"]+)";/);
  assert(keyMatch !== null, "應該有 CONVERSATION_PRACTICE_MODE_STORAGE_KEY 常數");

  const store = new Map<string, string>();
  (globalThis as any).window = {
    localStorage: {
      getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
      setItem: (k: string, v: string) => void store.set(k, v),
    },
  };
  const strip = (src: string) => src.replace(/\): boolean \{/, ") {").replace(/\(enabled: boolean\): void \{/, "(enabled) {");
  const factory = new Function(
    `const CONVERSATION_PRACTICE_MODE_STORAGE_KEY = ${JSON.stringify(keyMatch![1])};
     ${strip(readMatch![0])}
     ${strip(setMatch![0])}
     return { readConversationPracticeMode, setConversationPracticeMode };`
  );
  const api = factory();
  assert(api.readConversationPracticeMode() === false, "沒存過值時應該預設回傳 false");
  api.setConversationPracticeMode(true);
  assert(api.readConversationPracticeMode() === true, "設成 true 後應該讀到 true");
  api.setConversationPracticeMode(false);
  assert(api.readConversationPracticeMode() === false, "設回 false 後應該讀到 false");
  delete (globalThis as any).window;
  console.log("✅ 測試 1 通過：設定讀寫正確，預設關閉。");
}

// ---- 測試 2：主開關在 stageHeader extraActions、只切 class 不呼叫 render() ----
{
  assert(/stageHeader\([\s\S]*?\[practiceModeBtn\]\s*\)/.test(conv), "練習模式按鈕應該透過 stageHeader() 的 extraActions 傳入");
  const handler = conv.match(/practiceModeBtn\.addEventListener\("click", \(\) => \{[\s\S]*?\n  \}\);/);
  assert(handler !== null, "應該找得到練習模式按鈕的點擊事件");
  assert(handler![0].includes('wrapper.classList.toggle("practice-mode-on", next)'), "主開關應該切換 wrapper 的 practice-mode-on class");
  assert(handler![0].includes("setConversationPracticeMode(next)"), "主開關應該寫回裝置設定");
  assert(!handler![0].includes("render()"), "主開關不應該呼叫 render()（避免對話畫面重繪、捲動跑掉）");
  console.log("✅ 測試 2 通過：主開關在題型橫幅內，純 class 切換。");
}

// ---- 測試 3：聊天記錄中文個別點開 ----
{
  const row = conv.match(/function createChatRow\([\s\S]*?\n    return row;\n  \}/);
  assert(row !== null, "應該找得到 createChatRow()");
  const zhHandler = row![0].match(/zhText\.addEventListener\("click", \(e\) => \{[\s\S]*?\n    \}\);/);
  assert(zhHandler !== null, "chat-text-zh 應該有點擊事件");
  assert(zhHandler![0].includes('zhText.classList.toggle("chat-text-zh--revealed")'), "點擊應該切換 chat-text-zh--revealed");
  assert(zhHandler![0].includes('if (!wrapper.classList.contains("practice-mode-on")) return;'), "練習模式關閉時點擊中文不應該有任何作用");
  assert(!zhHandler![0].includes("render()"), "點開單句中文不應該呼叫 render()");
  assert(row![0].includes("lookupPassageWordZh(") && row![0].includes("chat-word-tooltip"), "點單字查翻譯的 tooltip 應該維持存在");
  console.log("✅ 測試 3 通過：聊天記錄每句中文各自點開，不重繪，單字 tooltip 不受影響。");
}

// ---- 測試 4：答題選項「看中文」整批顯示 ----
{
  const btns = conv.match(/function renderButtons\(\) \{[\s\S]*?\n  \}\n  renderButtons\(\);/);
  assert(btns !== null, "應該找得到 renderButtons()");
  const b = btns![0];
  assert(b.includes('optionsList.classList.remove("options-zh-revealed")'), "每輪重建選項時應該先拿掉 options-zh-revealed，讓中文重新蓋回去");
  assert(b.includes('"conversation-reveal-zh-btn"'), "應該建立「看中文」按鈕");
  assert(b.includes('optionsList.classList.add("options-zh-revealed")'), "「看中文」應該在 optionsList 加上 options-zh-revealed");
  assert(!b.includes("render()"), "「看中文」不應該呼叫 render()");
  console.log("✅ 測試 4 通過：答題選項中文用一顆按鈕整批顯示，每輪重新蓋回。");
}

// ---- 測試 5（最重要）：練習模式關閉時完全不模糊 ----
{
  assert(
    conv.includes('wrapper.className = "conversation-wrapper" + (practiceModeOn ? " practice-mode-on" : "");'),
    "wrapper 只有在 practiceModeOn 為 true 時才加上 practice-mode-on"
  );
  assert(!/classList\.add\("practice-mode-on"\)/.test(conv), "不應該無條件加上 practice-mode-on");
  // style.css 裡所有涉及 Stage E 中文/看中文鈕的 blur 或顯示規則都必須掛在 practice-mode-on 底下
  const rules = [...styleCss.matchAll(/([^{}]+)\{([^{}]*)\}/g)];
  let blurRuleCount = 0;
  for (const [, selRaw, body] of rules) {
    const sel = selRaw.replace(/\/\*[\s\S]*?\*\//g, "").trim();
    const touchesConv = /chat-text-zh|conversation-option-zh|conversation-reveal-zh-btn/.test(sel);
    if (!touchesConv) continue;
    if (/filter:\s*blur/.test(body)) {
      blurRuleCount++;
      assert(sel.includes(".conversation-wrapper.practice-mode-on"), `模糊規則必須掛在 .conversation-wrapper.practice-mode-on 底下：${sel}`);
    }
    if (/conversation-reveal-zh-btn/.test(sel) && /display:\s*inline-flex/.test(body)) {
      assert(sel.includes(".conversation-wrapper.practice-mode-on"), `「看中文」鈕只能在練習模式下顯示：${sel}`);
    }
  }
  assert(blurRuleCount >= 2, "應該至少有聊天中文、選項中文兩條模糊規則");
  assert(/\.conversation-reveal-zh-btn \{[^}]*display:\s*none/.test(styleCss), "「看中文」鈕預設應該 display: none");
  console.log("✅ 測試 5 通過：練習模式關閉時沒有任何模糊 class/規則命中，看中文鈕也不出現。");
}

// ---- 測試 6：不碰遊戲邏輯 ----
{
  assert(!/PracticeMode|practice-mode|blur/.test(gameTs), "conversationGame.ts 不應該跟練習模式有任何關聯");
  console.log("✅ 測試 6 通過：conversationGame.ts 的遊戲邏輯未受影響。");
}

console.log("\n🎉 Stage E 練習模式驗證全部通過！");
