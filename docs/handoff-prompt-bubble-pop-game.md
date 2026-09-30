# Handoff：遊戲室第三款遊戲——戳泡泡（Bubble Pop，多主題綜合冒險模式）

## 背景

使用者提出企劃：泡泡裡有字母，照中文提示依序點破拼出正確英文單字，答錯的泡泡往隨機方向飄走（不會消失，可以再點）。這是遊戲室第三款遊戲，延續前兩款（翻牌配對、填字遊戲）已經確立的架構：**獨立 iframe 頁面＋`gameBridge.ts` 橋接**，不需要重新決定架構方向，直接套用即可。

## 1. 單字範圍：多主題綜合冒險模式（共 134 字）

為避免僅限顏色主題容易玩膩，題庫全面擴充為 7 大主題綜合冒險題庫，共 134 個精選單字（長度介於 3~7 個英文字母，皆為無空格之具體形象詞）：
1. **動物與昆蟲（Animals & Insects）**（29 字）：DOG, CAT, PIG, COW, BEE, BEAR, BIRD, DUCK, FISH, FROG, LION, DEER, GOAT, HORSE, SHEEP, TIGER, MOUSE, PANDA, ZEBRA, MONKEY, RABBIT, CHICKEN, DOLPHIN, ELEPHANT, GIRAFFE...
2. **食物與飲品（Food & Drink）**（15 字）：EGG, TEA, CAKE, MILK, RICE, SOUP, BREAD, PIZZA, CANDY, WATER, JUICE, APPLE, BANANA, COOKIE, NOODLES
3. **生活交通工具（Transportation）**（11 字）：BUS, CAR, VAN, BIKE, BOAT, SHIP, TAXI, TRAIN, TRUCK, PLANE, ROCKET
4. **奇妙身體部位（Parts of Body）**（21 字）：ARM, EAR, EYE, LEG, FOOT, HAND, HEAD, KNEE, NOSE, FACE, HAIR, MOUTH, TEETH, HEART, FINGER, STOMACH, SHOULDER...
5. **大自然與天氣（Weather & Nature）**（31 字）：SUN, SKY, RAIN, SNOW, WIND, STAR, TREE, ROSE, LEAF, CLOUD, RIVER, GRASS, BEACH, EARTH, FLOWER, FOREST, RAINBOW...
6. **學校與文具（School）**（13 字）：PEN, BAG, BOOK, DESK, RULER, ERASER, PENCIL...
7. **經典繽紛色彩（Colors）**（14 字）：嚴格篩選純顏色詞（RED, PINK, BLUE, GRAY, GOLD, BLACK, BROWN, GREEN, WHITE, YELLOW, ORANGE, PURPLE, SILVER, INDIGO）

提示詞顯示單字的中文翻譯，並自動**去掉結尾的「的」字與補充括號**（工具函式 `stripAdjectiveSuffix(zh: string): string`），例如「乳牛（黑白花紋）」轉為「乳牛」、「紅色的」轉為「紅色」。

## 2. 畫面四個區塊

1. **提示詞**：畫面上方，顯示「依序戳破字母，拼出：紅色」這樣的動作指引文字（清楚引導兒童依序點擊英文字母拼出中文顏色名稱，已去掉「的」）。
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

## 5. 關卡機制與星等評鑑（一局五關的漸進式難度階梯與 1-5 顆星機制）

```ts
const LEVEL_CONFIGS = [
  { wordLengthRange: [3, 4], decoyCount: 3 }, // 第 1 關 (3-4 字母 + 3 干擾，快速暖身)
  { wordLengthRange: [4, 5], decoyCount: 4 }, // 第 2 關 (4-5 字母 + 4 干擾)
  { wordLengthRange: [5, 5], decoyCount: 5 }, // 第 3 關 (5 字母 + 5 干擾)
  { wordLengthRange: [5, 6], decoyCount: 6 }, // 第 4 關 (5-6 字母 + 6 干擾)
  { wordLengthRange: [6, 7], decoyCount: 7 }, // 第 5 關 (6-7 字母 + 7 干擾，終極挑戰)
];
```

每一關從第 1 節的 134 個多主題詞庫裡，篩出字母數落在該關 `wordLengthRange` 的候選字，隨機抽一個當這一關的目標單字（優先排除當局已出過的單字，確保 5 關單字不重複）。過五關的畫面轉場比照 `memoryMatchGame.ts` 的 `phase` 狀態機模式（`playing`／`levelComplete`／`complete`），並在每關通關後停留在原畫面由使用者手動點擊「進入下一關」按鈕推進。

### 5.1 星等評鑑機制（比照 prompt-star-rating-mechanism.md）
依據全站教育理念，星等不採用時間或速度，而是以**五關加總的錯誤次數**依門檻換算成 1-5 顆星：
- 0 次失誤：★★★★★（5 顆星）
- 1～2 次失誤：★★★★☆（4 顆星）
- 3～4 次失誤：★★★☆☆（3 顆星）
- 5～7 次失誤：★★☆☆☆（2 顆星）
- 8 次以上：★☆☆☆☆（1 顆星）

五關完成時由 `bubblePopGame.ts` 的 `starsForMistakes()` 換算星等，`bubblePopStandalone.ts` 在通關彈窗呈現實心/空心星星，並透過 `gameBridge.ts` 的 `complete` 訊息帶入 `stars` 欄位；主站 `main.ts` 收到後呼叫 `recordStars()` 存檔，並在遊戲室的戳泡泡卡片上顯示最高星等。

## 6. 架構：獨立 iframe（沿用既有模式，不需要另外說明）

- 新增 Vite 進入點 `app/games/bubble-pop.html` + `app/src/games/bubblePopStandalone.ts`（`vite.config.ts` 新增一行 `rollupOptions.input`）。
- 引擎：`app/src/games/bubblePopGame.ts`（純邏輯 class，不碰 DOM，比照上方第 4 節）。
- 泡泡位置分佈：自第 1 關起，固定設定為 4 個垂直層級（Layer 0: ~12%, Layer 1: ~35%, Layer 2: ~57%, Layer 3: ~80%），每層隨機分配不重複的 column 欄位，保證 4 層皆有泡泡且互不重疊。
- 沿用 `gameBridge.ts` 的 `ready`／`requestReplay`／`exitToRoom`／`complete` 訊息協定，「再玩一次」一樣要問主站扣代幣，遊戲進行中不碰代幣。
- CSS：`app/src/games/bubblePopStandalone.css`，泡泡半透明質感（`border-radius: 50%` + `background: rgba(...)` + 一點 `box-shadow` 模擬泡泡光澤感）、粉色系 UI（提示詞文字框、字母區背景），背景圖見第 2 節。
- `content/games/games.json` 已經新增 `bubble_pop` 這一筆，`status: "active"`。

## 7. 驗證

- 新增 `verify-bubble-pop-logic.ts`（比照 `verify-memory-match-logic.ts`／`verify-crossword-logic.ts`）：
  - `generateBubbles()` 產生的泡泡數量等於目標單字長度加上 `decoyCount`，且包含目標單字所需的完整字母（含重複字母的正確數量）。
  - 從第 1 關起泡泡保證完整分佈在 4 個垂直層級，同層無重疊且座標均在安全範圍。
  - `popBubble()` 對「目前該拼的字母」判斷正確；拼對後 `progressIndex` 正確累加；拼完整個單字觸發 `onComplete(stars)`。
  - 拼錯字母時 `wrongCount` 正確累加，且該泡泡**沒有**被標記 `popped`（確認答錯不會誤刪泡泡）。
  - 五個關卡設定（`LEVEL_CONFIGS`）分別對應到字母數範圍正確的候選字。
  - `starsForMistakes()` 邊界門檻值測試。
- `npm run build` 要過。泡泡漂浮動畫、WAAPI 即時飄移動畫、觸控點擊務必實機測試。

## 8. 這次刻意不做的事

- 不用調整關卡的字母數範圍、干擾字母數量這些數字的手感，先照文件上線，之後有實際試玩回饋再回頭調整。
- 不要把這款遊戲的顏色詞範圍偷偷擴大到「顏色深淺/鮮豔程度」（light／dark／bright／colorful）——這些詞不是顏色本身，混進去會讓提示詞「請找出：淺色」對應不到明確的單一正確拼法，維持只用第 1 節列出的 14 個純顏色詞。
