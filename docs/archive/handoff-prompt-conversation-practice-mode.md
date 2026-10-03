# Handoff：Stage E 會話練習新增「練習模式」——模糊中文翻譯

## 需求

使用者希望在 Stage E 會話練習（`renderConversation()`）新增一個「練習模式」開關，打開後把中文翻譯模糊起來，逼使用者先靠英文理解、聽發音，而不是直接看中文翻譯。跟使用者確認範圍：**不只模糊聊天記錄裡已經說過的台詞中文，這一回合要選答案的三個選項中文也要一起模糊**（進階挑戰模式,不是只有回顧歷史對話才模糊）。

這個功能的核心互動精神直接沿用「單字總覽」練習模式（HANDOFF 9.114～9.117）已經確立的設計原則：**裝置層級開關、預設關閉、純 CSS class 切換不呼叫 `render()`**（避免整段對話畫面重繪、捲動位置跑掉、或聊天記錄被打斷),只是這次套用在 Stage E 的兩個地方（聊天氣泡的中文、答題選項的中文),而不是單字總覽的例句英文。

## 1. 新增裝置層級設定（比照 `isSlowSpeechEnabled()`／`readVocabOverviewShowEnglish()` 的既有寫法）

放在 `app/src/main.ts`（或 `speech.ts` 附近皆可,這個設定跟語音無關,建議直接放 `main.ts` 裡`renderConversation()` 定義之前,比照 `VOCAB_OVERVIEW_SHOW_ENGLISH_STORAGE_KEY` 的做法)：

```ts
const CONVERSATION_PRACTICE_MODE_STORAGE_KEY = "englishForKids.settings.conversationPracticeMode.v1";

/** Stage E 會話練習「練習模式」——裝置層級設定，預設關閉（false）。打開後聊天記錄裡的
 * 中文翻譯跟這一回合答題選項的中文都會模糊，逼使用者先靠英文／發音理解，需要時才點開看。 */
function readConversationPracticeMode(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(CONVERSATION_PRACTICE_MODE_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function setConversationPracticeMode(enabled: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CONVERSATION_PRACTICE_MODE_STORAGE_KEY, enabled ? "1" : "0");
  } catch {
    // 忽略，跟其餘模組一致的容錯方式
  }
}
```

## 2. 開關按鈕：放進 `stageHeader()` 的 `extraActions`

比照單字總覽練習模式按鈕已經確立的做法（9.117：「練習模式按鈕移入題型橫幅」），`renderConversation()` 一開始呼叫 `stageHeader()` 時，第三個參數 `extraActions` 加入這個按鈕：

```ts
const practiceModeOn = readConversationPracticeMode();
const practiceModeBtn = document.createElement("button");
practiceModeBtn.type = "button";
practiceModeBtn.className = "slow-speech-toggle-btn" + (practiceModeOn ? " active" : ""); // 沿用既有按鈕樣式
practiceModeBtn.setAttribute("aria-pressed", String(practiceModeOn));
practiceModeBtn.textContent = practiceModeOn ? "🙈 練習模式" : "👁️ 練習模式";
practiceModeBtn.title = "打開後，聊天記錄跟答題選項的中文會先模糊，點一下才會顯示";
practiceModeBtn.addEventListener("click", () => {
  setConversationPracticeMode(!practiceModeOn);
  render(); // 練習模式本身是「一整段畫面模式切換」，這裡跟單字總覽的整頁開關一樣需要重繪一次；
            // 但畫面內「個別點開哪一句」的動作（見下方第 3/4 節）不能觸發 render()，兩者要分開看待
});

stageHeader(
  `${currentTopic.label} — Stage E 會話練習`,
  `第 ${game.currentTurnNumber} / ${game.totalTurns} 回合　與 ${conv.character.name} 互動對話中`,
  [practiceModeBtn]
);
```

## 3. 聊天記錄中文模糊——個別可點開，狀態跟著這句訊息走

`createChatRow()`（main.ts 第 4152 行起）目前：

```ts
const zhText = document.createElement("div");
zhText.className = "chat-text-zh";
zhText.textContent = msg.zh;
```

改成：練習模式開啟時，每一句訊息的中文預設模糊（CSS `filter: blur(...)`），**點一下這句中文就能單獨解除模糊（不影響其他句子）**，這個「點開」的動作是純 DOM/class 操作，不能呼叫 `render()`（不然聊天記錄會整個重繪、捲動位置跑掉）：

```ts
const zhText = document.createElement("div");
zhText.className = "chat-text-zh";
zhText.textContent = msg.zh;

if (practiceModeOn) {
  zhText.classList.add("chat-text-zh--blurred");
  zhText.title = "點一下看中文翻譯";
  zhText.addEventListener("click", () => {
    zhText.classList.toggle("chat-text-zh--revealed"); // CSS 用這個 class 取消 blur，不重繪
  });
}
```

**注意**：`msg` 這個訊息物件（`game.history` 陣列裡的項目）不需要新增欄位記錄「這句有沒有被點開」——因為 `game.history` 只有在使用者離開/重進這個畫面時才會整個重繪一次（`renderConversation()` 每次被呼叫都是從頭 loop `game.history` 重建所有聊天氣泡的 DOM），中途只要沒有觸發 `render()`，這些 DOM 節點跟它們身上的 `chat-text-zh--revealed` class 都會維持原狀，不需要額外資料結構追蹤。

## 4. 答題選項中文模糊——這一輪選項統一用一個按鈕整批顯示

`renderButtons()`（main.ts 第 4299 行起）目前：

```ts
optBtn.innerHTML = `
  <span class="conversation-option-en">${optState.option.en}</span>
  <span class="conversation-option-zh">${optState.option.zh}</span>
`;
```

因為三個選項是同一輪的內容，答對就會整批換下一輪的新選項（不像聊天記錄是逐句累積），**這裡不用三個選項各自獨立點開，改成一個「顯示中文」的按鈕，一次讓這一輪的三個選項中文一起顯示**：

```ts
function renderButtons() {
  optionsList.innerHTML = "";
  optionsList.classList.remove("options-zh-revealed"); // 每次重新產生新一輪選項時，中文重新蓋回去

  if (practiceModeOn) {
    const revealZhBtn = document.createElement("button");
    revealZhBtn.type = "button";
    revealZhBtn.className = "conversation-reveal-zh-btn";
    revealZhBtn.textContent = "👁️ 看中文";
    revealZhBtn.addEventListener("click", () => {
      optionsList.classList.add("options-zh-revealed"); // 純 class 切換，不重繪
      revealZhBtn.style.display = "none";
    });
    optionsList.appendChild(revealZhBtn);
  }

  for (const optState of game.optionStates) {
    // ...原本的按鈕建構邏輯不變
  }
}
```

`.options-zh-revealed` 這個 class 掛在 `optionsList`（父層容器）上，CSS 用後代選擇器 `.options-zh-revealed .conversation-option-zh` 取消 blur，不用逐個選項按鈕加 class。

## 5. CSS

```css
.chat-text-zh--blurred {
  filter: blur(5px);
  cursor: pointer;
  transition: filter 0.2s ease;
}
.chat-text-zh--blurred.chat-text-zh--revealed {
  filter: none;
}

.conversation-option-zh {
  filter: none;
}
/* 練習模式開啟且這一輪還沒按「看中文」時，選項中文模糊；按過之後 .options-zh-revealed
   會蓋掉這個 filter，所以下面這條規則的優先權要注意寫在 base 樣式，revealed 那條要在後面 */
.conversation-options-list.practice-mode-zh-hidden .conversation-option-zh {
  filter: blur(5px);
}
.conversation-options-list.options-zh-revealed .conversation-option-zh {
  filter: none;
}
```

（class 名稱請依實際實作習慣微調，重點是「模糊」跟「已顯示」要分成兩個獨立 class，不要用同一個 class 的有無直接切換,避免 `renderButtons()` 每輪重建 DOM 時漏加 base class 導致沒開練習模式的人也被模糊到——**務必只在 `practiceModeOn === true` 時才加上模糊用的 class，這是最容易不小心影響到沒開這個功能的人的地方**。）

## 6. 這個功能不影響什麼

- 練習模式關閉（預設狀態）時，畫面完全跟現在一樣，沒有任何視覺或互動差異——這點務必用既有的 `verify-*.ts` 手法寫一支靜態檢查，確認 `practiceModeOn` 為 `false` 時不會有任何模糊 class 被加上去。
- 不影響 `lookupPassageWordZh()` 點單字查翻譯的 tooltip 功能（第 4186-4251 行那段）——練習模式只管「整句中文翻譯」跟「整個選項的中文」，逐字點擊查詢的小提示泡泡維持現狀正常運作，不受這個開關影響（使用者可能還是想點單字查意思，只是不想一開始就看到整句/整個選項的翻譯）。
- 不影響 Stage E 的答對/答錯判定邏輯（`game.choose()`）——這個功能純粹是視覺呈現層面的開關，不碰 `conversationGame.ts` 的遊戲邏輯本身。

## 7. 驗證

新增 `verify-conversation-practice-mode.ts`（比照 `verify-vocab-overview-english-toggle.ts` 的靜態比對手法），至少涵蓋：

1. `readConversationPracticeMode()`／`setConversationPracticeMode()` 存在，沒存過值時預設回傳 `false`。
2. `createChatRow()` 裡有依 `practiceModeOn` 條件式加上模糊 class，且有對應的點擊事件切換 `--revealed` class（不是呼叫 `render()`）。
3. `renderButtons()` 裡有「看中文」按鈕的建構邏輯，且點擊事件是切換 `optionsList` 的 class，不是呼叫 `render()`。
4. 確認 `practiceModeOn` 為 `false` 時，兩處都不會加上任何模糊相關的 class（這是最重要的一條，確保沒開這個功能的人完全不受影響）。

`npm run build` 要過；`npx tsx scripts/verify-conversation-practice-mode.ts`（跟其餘 verify-*.ts）都要通過。手動測試建議在 `demo-standalone.html` 進任一主題的 Stage E，打開練習模式後確認：聊天記錄裡每句中文各自可以獨立點開、不會互相影響；答題選項的中文預設模糊，按「看中文」後三個選項一起顯示，答對進入下一輪後中文會重新蓋回去（需要再按一次「看中文」）；關閉練習模式後畫面完全恢復正常。
