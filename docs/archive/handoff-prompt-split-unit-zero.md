# 任務：把「單元 0 教室常用語」拆成兩個主題：Greetings（問候與禮貌用語）／Pronouns（代名詞）

## 背景

跟使用者確認後，把原本單一主題的「單元 0（Unit 0，fileKey `unit_zero`，20 字）」拆成兩個主題：

- **Greetings 問候與禮貌用語**（fileKey `greetings`，13 字）：hi／hello／bye／good morning／good afternoon／good evening／good night／please／thank you／you're welcome／sorry／excuse me／can you help me
- **Pronouns 代名詞**（fileKey `pronouns`，7 字）：I／you／he／she／we／they／it

拆分前後 20 個字的英文字集合完全一樣，只是重新分組成兩個主題，內容資料已經寫好、驗證過（`jsonschema` 通過、跨主題撞字檢查通過、短文逐字查詢模擬通過、全部 21 支 `verify-*.ts` 都過），**內容資料這次不用檢查**，只需要處理 App 接線＋刪除舊檔案。

「單元 0」在架構上維持現況：首頁還是獨立區塊＋專屬新手提示文字，不強制排在其他單元之前完成，只是底下從 1 張主題卡變成 2 張。

## 一、`app/src/main.ts`

### 1. `TOPICS` 陣列（約 77 行）

```ts
{ fileKey: "unit_zero", label: "Unit 0　教室常用語" },
```

改成：

```ts
{ fileKey: "greetings", label: "Greetings 問候與禮貌用語" },
{ fileKey: "pronouns", label: "Pronouns 代名詞" },
```

### 2. `UNITS` 陣列，`unit0` 項目（約 121-126 行）

```ts
{
  key: "unit0",
  label: "單元 0：教室常用語",
  topicFileKeys: ["unit_zero"],
},
```

`topicFileKeys` 改成：

```ts
topicFileKeys: ["greetings", "pronouns"],
```

（`key`／`label` 不用改，還是 `unit0`／「單元 0：教室常用語」——這是整個單元的名稱，不是底下個別主題的名稱。）

### 3. `TOPIC_THUMBS`（約 1175 行）

```ts
unit_zero: { emoji: "🚀", className: "thumb-unit-zero" },
```

改成兩筆：

```ts
greetings: { emoji: "👋", className: "thumb-greetings" },
pronouns: { emoji: "🙋", className: "thumb-pronouns" },
```

（emoji 可以依你的喜好調整，`🙋` 目前 `forms_of_address` 主題已經用過，如果覺得重複不好看，可以換一個，不強制。）

### 4. `renderTopicSelect()` 的「單元 0」專屬區塊（約 1229-1253 行）

目前只放一張卡片：

```ts
const unitZeroConfig = UNITS.find((unit) => unit.key === "unit0");
const unitZeroSummary = availableTopics.find((summary) => summary.topic.fileKey === "unit_zero");
if (unitZeroConfig && unitZeroSummary) {
  const unitZeroSection = document.createElement("section");
  unitZeroSection.className = "unit-section unit-zero-section";

  const unitZeroTitle = document.createElement("h2");
  unitZeroTitle.className = "unit-title";
  unitZeroTitle.textContent = "🚀 新手起手式";
  unitZeroSection.appendChild(unitZeroTitle);

  const unitZeroHint = document.createElement("p");
  unitZeroHint.className = "unit-zero-hint";
  unitZeroHint.textContent = "推薦新朋友從這裡開始暖身，不過也可以跳過、直接挑其他單元的主題玩。";
  unitZeroSection.appendChild(unitZeroHint);

  const unitZeroGrid = document.createElement("div");
  unitZeroGrid.className = "topic-grid";
  unitZeroGrid.appendChild(buildTopicCard(unitZeroSummary));
  unitZeroSection.appendChild(unitZeroGrid);

  app!.appendChild(unitZeroSection);
}
```

改成從 `unitZeroConfig.topicFileKeys` 迴圈渲染（跟底下 `for (const unit of UNITS)` 那段找 `topicsInUnit` 的寫法同一套邏輯，只是套用在 unit0 身上）：

```ts
const unitZeroConfig = UNITS.find((unit) => unit.key === "unit0");
if (unitZeroConfig) {
  const unitZeroTopics = availableTopics.filter((summary) =>
    unitZeroConfig.topicFileKeys.includes(summary.topic.fileKey)
  );
  if (unitZeroTopics.length > 0) {
    const unitZeroSection = document.createElement("section");
    unitZeroSection.className = "unit-section unit-zero-section";

    const unitZeroTitle = document.createElement("h2");
    unitZeroTitle.className = "unit-title";
    unitZeroTitle.textContent = "🚀 新手起手式";
    unitZeroSection.appendChild(unitZeroTitle);

    const unitZeroHint = document.createElement("p");
    unitZeroHint.className = "unit-zero-hint";
    unitZeroHint.textContent = "推薦新朋友從這裡開始暖身，不過也可以跳過、直接挑其他單元的主題玩。";
    unitZeroSection.appendChild(unitZeroHint);

    const unitZeroGrid = document.createElement("div");
    unitZeroGrid.className = "topic-grid";
    for (const summary of unitZeroTopics) {
      unitZeroGrid.appendChild(buildTopicCard(summary));
    }
    unitZeroSection.appendChild(unitZeroGrid);

    app!.appendChild(unitZeroSection);
  }
}
```

（這樣寫還有一個好處：如果之後 greetings／pronouns 只有其中一個內容準備好、另一個還沒上架，這個區塊會自動只顯示已上架的那張卡，不會整個區塊消失或出現壞掉的卡片，行為跟底下單元一～六的「敬請期待」邏輯一致。）

### 5. OB-02「暖身起步」徽章判斷邏輯（約 3064-3071 行）

跟使用者確認過：拆成兩個主題後，**兩個主題的 Stage A 單字配對都要完成，才算達成**「暖身起步」徽章，維持「整個單元 0 都學完才算暖身完成」的原意，跟其他單元完成度徽章要求「底下所有主題都完成」的判斷邏輯一致。

目前：

```ts
/** OB-02（unit0_complete）用：Unit 0 是否已上架（content 齊全才會出現在 availableTopics），
 * 而且這個使用者是否已經完成過一輪 unit_zero 主題的 Stage A 單字配對（MatchingGame 要求
 * 全部單字都配對成功才算完成一輪，剛好對應徽章條件「完成 Unit 0 全部單字練習」）。 */
function computeUnit0MatchingComplete(profileId: string): boolean {
  const unit0Available = availableTopics.some((summary) => summary.topic.fileKey === "unit_zero");
  if (!unit0Available) return false;
  return getStageProgress(profileId, "unit_zero", "matching") !== null;
}
```

改成：

```ts
/** OB-02（unit0_complete）用：單元 0 底下的 greetings／pronouns 兩個主題是否都已上架
 * （content 齊全才會出現在 availableTopics），而且這個使用者是否兩個主題都各自完成過
 * 一輪 Stage A 單字配對（MatchingGame 要求全部單字都配對成功才算完成一輪）——兩個主題
 * 都要完成才算達成「完成單元 0 全部單字練習」，跟其他單元完成度徽章「底下所有主題都要
 * 完成」的判斷邏輯一致（見 computeBadgeViewState 的 "unit_completion" case）。 */
function computeUnit0MatchingComplete(profileId: string): boolean {
  const unit0TopicFileKeys = UNITS.find((unit) => unit.key === "unit0")?.topicFileKeys ?? [];
  if (unit0TopicFileKeys.length === 0) return false;
  return unit0TopicFileKeys.every((fileKey) => {
    const isAvailable = availableTopics.some((summary) => summary.topic.fileKey === fileKey);
    return isAvailable && getStageProgress(profileId, fileKey, "matching") !== null;
  });
}
```

`main.ts:3099-3102` 附近提到「unit_zero 主題的 Stage A 配對」的註解也順手改成「greetings／pronouns 兩個主題」。

## 二、`app/scripts/verify-unit-completion-badges.ts`

內部鏡像的 `UNITS` fixture（`unit0` 那筆的 `topicFileKeys: ["unit_zero"]`）改成 `["greetings", "pronouns"]`，跟 `main.ts` 保持一致（這支腳本的 `unitsToCheck` 邏輯本來就會把 `unit0` 排除在 `unit_completion` 判斷之外，這裡改動不影響任何既有測試案例的判斷結果，純粹是保持 fixture 跟 `main.ts` 同步，避免以後看到不一致以為是漏改）。

## 三、刪除舊的 `unit_zero` 四個檔案

跟先前拆分 Personal Characteristics 時一樣的狀況：`content/` 底下的舊檔案我這邊沒辦法直接刪除（工作區保護規則），這次也需要你用 `allow_cowork_file_delete` 處理掉：

- `content/vocab/unit_zero.json`
- `content/sentences/unit_zero.json`
- `content/passages/unit_zero.json`
- `content/glossary/unit_zero.json`

**這次刪除的時機比較重要，建議動作要快**：這 4 個舊檔案目前跟新的 `greetings.json`／`pronouns.json` 有 20 個字重複（同一個英文字、不同 vocab.id），`content.ts` 的 `globalVocabByEnglish` 是跨主題攤平的表，同一個英文字撞到会被後載入的主題直接覆蓋——`import.meta.glob` 讀取順序不保證，短時間內共存不會讓 App 掛掉，但收藏功能／短文點字查詢在這個空窗期可能會抓到不確定是舊 `unit_zero` 還是新 `greetings`／`pronouns` 的 vocab.id，所以改完 `main.ts`（`unit_zero` fileKey 不再出現在 `TOPICS`／`UNITS` 裡）之後，建議直接接著把這 4 個檔案刪掉，不要留著。

## 驗證

1. `npm run build`（含 `tsc --noEmit`）通過。
2. 全部 `verify-*.ts` 重跑一次都通過（含改名後的 `verify-unit-completion-badges.ts`）。
3. 實際打開試玩：
   - 首頁「🚀 新手起手式」區塊底下應該看到兩張卡片：Greetings 問候與禮貌用語（13 字）、Pronouns 代名詞（7 字），不再是單一的「Unit 0　教室常用語」。
   - 兩個主題各自都能字卡暖身、Stage A→D 六關都能跑完，短文點字翻譯功能顯示正常。
   - 完成其中一個主題（例如 Pronouns）的 Stage A 單字配對，確認「暖身起步」徽章（成就徽章頁）還沒解鎖；再完成另一個主題（Greetings）的 Stage A 配對，確認這時才解鎖——驗證「兩個主題都要完成才算達成」的邏輯正確。
   - 找幾個字（例如 `hello`、`he`）在任何一個主題的短文裡點看看，確認只會查到一個乾淨的翻譯結果、vocab.id 是新的 `greetings`／`pronouns`，沒有跟已刪除的舊 `unit_zero` 資料衝突或重複。
4. `node scripts/build-standalone-demo.mjs`＋`node scripts/build-content-review.mjs` 重新產生，`cp app/demo-standalone.html ../demo-standalone.html` 同步專案根目錄那份。
