# Handoff：遊戲室第三款遊戲——戳泡泡（Bubble Pop，顏色主題）

## 背景

使用者提出企劃：泡泡裡有字母，照中文提示（顏色名稱）依序點破拼出正確英文單字，答錯的泡泡往隨機方向飄走（不會消失，可以再點）。這是遊戲室第三款遊戲，延續前兩款（翻牌配對、填字遊戲）已經確立的架構：**獨立 iframe 頁面＋`gameBridge.ts` 橋接**，不需要重新決定架構方向，直接套用即可。

## 1. 單字範圍：`content/vocab/colors.json` 裡的純顏色詞

**只能用以下 14 個 vocabId 當作答案**（已經排除掉 light／dark／bright／colorful 這幾個「形容顏色的修飾詞」、以及 paint／brush／scissors／glue／crayon／marker／sticker／paper／craft／art／canvas／palette／easel 這些美術用品名詞——`colors.json` 這個檔案雖然檔名還是 colors，但內容已經因為先前的主題擴充變成「美術」主題,混雜了顏色詞跟美術用品詞,這次只能挑純顏色的部分）：

| vocabId | en | 字母數 |
|---|---|---|
| voc.colors.010 | RED | 3 |
| voc.colors.008 | PINK | 4 |
| voc.colors.002 | BLUE | 4 |
| voc.colors.005 | GRAY | 4 |
| voc.colors.013 | GOLD | 4 |
| voc.colors.001 | BLACK | 5 |
| voc.colors.003 | BROWN | 5 |
| voc.colors.006 | GREEN | 5 |
| voc.colors.011 | WHITE | 5 |
| voc.colors.012 | YELLOW | 6 |
| voc.colors.007 | ORANGE | 6 |
| voc.colors.009 | PURPLE | 6 |
| voc.colors.014 | SILVER | 6 |
| voc.colors.015 | INDIGO | 6 |

提示詞顯示這個單字的 `zh` 欄位，但要**去掉結尾的「的」字**（例如 `voc.colors.010` 的 `zh` 是「紅色的」，提示詞畫面上要顯示「紅色」，不要顯示「紅色的」——這是形容詞欄位本來的寫法，用在提示詞上要處理過比較乾淨），寫一個小工具函式 `stripAdjectiveSuffix(zh: string): string`（把結尾的「的」去掉即可，這 14 個字都符合這個規則,不用做更複雜的判斷）。

## 2. 畫面四個區塊

1. **提示詞**：畫面上方，顯示「請找出：紅色」這樣的文字（中文顏色名稱,已去掉「的」)。
2. **題目區**：一群漂浮的泡泡,每顆泡泡裡一個大寫字母,泡泡在背景上有輕微的漂浮動畫(CSS `@keyframes` 讓泡泡緩慢上下/左右飄動,增加生氣,但飄動幅度要小,不能真的飄出畫面或讓使用者點不到)。
3. **字母區**：畫面下方,顯示「目前拼到哪裡了」的進度,答對一個字母就依序累加顯示(例如答案 RED,依序答對後變成 "R" → "R E" → "R E D"),這裡是純顯示區,不是可以互動的地方(這點跟填字遊戲的「字母庫」不一樣,不要照搬那個做法)。
4. **背景**：天空＋白雲插畫(見 `docs/image-prompt-bubble-pop-background.md`,圖片生成完成後放在 `app/src/assets/games/bubble-pop-sky-bg.jpg`)。

## 3. 泡泡生成規則

```ts
// 給定目標單字（例如 "RED"）跟這一關要生成的干擾字母數量，回傳打散排列的泡泡清單
function generateBubbles(targetWord: string, decoyCount: number): BubbleData[] {
  const correctLetters = targetWord.split(""); // 正確答案的每個字母（含重複，例如 YELLOW 有兩個 L）
  const decoyLetters = pickRandomDecoyLetters(decoyCount, correctLetters);
  const allLetters = shuffle([...correctLetters, ...decoyLetters]);
  return allLetters.map((letter, i) => ({
    id: `bubble-${i}`,
    letter,
    // 隨機決定初始位置（畫面內，避免太靠邊緣被裁切），加上隨機的飄浮動畫延遲/週期營造自然感
  }));
}
```

`pickRandomDecoyLetters()`：從英文字母表隨機挑,**避免意外拼出跟目標單字看起來太像或會混淆的字母組合**就好,不用過度設計,單純隨機挑 A-Z 之間、非目標單字下一個「必須」字母的字母即可(允許偶爾跟目標單字重複到某個字母,這是正常情況,不用特別排除)。

## 4. 答題邏輯（依序拼字）

```ts
class BubblePopGame {
  private targetWord: string; // 例如 "RED"
  private progressIndex = 0; // 目前已經正確拼到第幾個字母（0 代表還沒拼對任何字母）
  bubbles: BubbleData[] = [];
  wrongCount = 0;

  onCorrectPop: (letter: string, progressSoFar: string) => void = () => {};
  onWrongPop: (bubbleId: string) => void = () => {}; // 給 renderer 觸發「飄移」動畫用
  onComplete: () => void = () => {};

  popBubble(bubbleId: string): void {
    const bubble = this.bubbles.find((b) => b.id === bubbleId);
    if (!bubble || bubble.popped) return;

    const expectedLetter = this.targetWord[this.progressIndex];
    if (bubble.letter === expectedLetter) {
      bubble.popped = true;
      this.progressIndex += 1;
      this.onCorrectPop(bubble.letter, this.targetWord.slice(0, this.progressIndex));
      if (this.progressIndex === this.targetWord.length) {
        this.onComplete();
      }
    } else {
      this.wrongCount += 1;
      this.onWrongPop(bubbleId); // renderer 收到後執行「往隨機方向飄移」的動畫，不移除這顆泡泡
    }
  }
}
```

**注意**：答錯時**泡泡本身不會從 `this.bubbles` 陣列移除**，只是觸發一個視覺事件讓 renderer 做飄移動畫（實際的新位置只是畫面呈現，不需要寫回 game 物件的資料模型，因為位置對答題邏輯沒有影響，只有「有沒有被戳破」跟「戳的當下是不是正確字母」有關係）。

## 5. 關卡機制（比照前兩款遊戲「一局三關」的既有節奏）

```ts
const LEVEL_CONFIGS = [
  { wordLengthRange: [3, 4], decoyCount: 4 }, // 第 1 關
  { wordLengthRange: [5, 5], decoyCount: 6 }, // 第 2 關
  { wordLengthRange: [6, 6], decoyCount: 8 }, // 第 3 關
];
```

每一關從第 1 節的 14 個顏色詞裡，篩出字母數落在該關 `wordLengthRange` 的候選字，隨機抽一個當這一關的目標單字。過三關的畫面轉場（過關訊息停留、自動進入下一關）比照 `memoryMatchGame.ts` 的 `phase` 狀態機模式（`playing`／`levelComplete`／`complete`），不用重新設計一套。

## 6. 架構：獨立 iframe（沿用既有模式，不需要另外說明）

- 新增 Vite 進入點 `app/games/bubble-pop.html` + `app/src/games/bubblePopStandalone.ts`（`vite.config.ts` 新增一行 `rollupOptions.input`）。
- 引擎：`app/src/games/bubblePopGame.ts`（純邏輯 class，不碰 DOM，比照上方第 4 節）。
- 沿用 `gameBridge.ts` 的 `ready`／`requestReplay`／`exitToRoom`／`complete` 訊息協定，「再玩一次」一樣要問主站扣代幣，遊戲進行中不碰代幣。
- CSS：`app/src/games/bubblePopStandalone.css`，泡泡半透明質感（`border-radius: 50%` + `background: rgba(...)` + 一點 `box-shadow` 模擬泡泡光澤感）、粉色系 UI（提示詞文字框、字母區背景），背景圖見第 2 節。
- `content/games/games.json` 已經新增 `bubble_pop` 這一筆（我已經直接加好了），`status` 先設 `"coming_soon"`，做完實機測試沒問題後記得改回 `"active"`。

## 7. 驗證

- 新增 `verify-bubble-pop-logic.ts`（比照 `verify-memory-match-logic.ts`／`verify-crossword-logic.ts`）：
  - `generateBubbles()` 產生的泡泡數量等於目標單字長度加上 `decoyCount`，且包含目標單字所需的完整字母（含重複字母的正確數量）。
  - `popBubble()` 對「目前該拼的字母」判斷正確；拼對後 `progressIndex` 正確累加；拼完整個單字觸發 `onComplete()`。
  - 拼錯字母時 `wrongCount` 正確累加，且該泡泡**沒有**被標記 `popped`（確認答錯不會誤刪泡泡）。
  - 三個關卡設定（`LEVEL_CONFIGS`）分別對應到字母數範圍正確的候選字。
- `npm run build` 要過。泡泡漂浮動畫、飄移動畫、觸控點擊（手機是點按不是拖曳，互動比填字遊戲單純，但一樣要注意泡泡尺寸在小螢幕上要夠大、夠好點）務必實機測試。

## 8. 這次刻意不做的事

- 不做最高紀錄／星等（使用者這次沒有要求）——如果之後想加，直接沿用填字遊戲那份 handoff 建議的共用 `gameHighScores.ts` 模組即可，不用重新設計一套。
- 不用調整關卡的字母數範圍、干擾字母數量這些數字的手感，先照文件上線，之後有實際試玩回饋再回頭調整。
- 不要把這款遊戲的顏色詞範圍偷偷擴大到「顏色深淺/鮮豔程度」（light／dark／bright／colorful）——這些詞不是顏色本身，混進去會讓提示詞「請找出：淺色」對應不到明確的單一正確拼法，維持只用第 1 節列出的 14 個純顏色詞。
