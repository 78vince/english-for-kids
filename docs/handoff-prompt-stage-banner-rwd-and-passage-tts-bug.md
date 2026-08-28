# Handoff Prompt：題型橫幅手機版 RWD 修正＋短文朗讀專有名詞逐字拼讀 bug 排查

## 背景

使用者用手機（iPhone Safari）實測正式站時回報兩個問題，並附了截圖：

1. 四種題型畫面共用的 `.stage-banner`（`stageHeader()` 產生）在窄螢幕上左右版面分配不均——標題文字被擠成一欄只能放一兩個字的窄直條，右側的「🐢 慢速」「← 返回選單」兩顆按鈕維持原本寬度不縮。
2. Stage C 短文理解朗讀 Pronouns 主題短文時，句子「She is Mia, my friend.」裡的 `Mia` 被瀏覽器語音引擎逐字母拼讀（"M－I－A"），而不是唸成完整名字的讀音。

這份改動只動 `app/src/style.css`（問題 1）跟 `app/src/speech.ts`（問題 2 的修復，若排查後確認需要修）。問題 1 是純 CSS，不用改 `main.ts`；問題 2 需要先在瀏覽器實測排查根因，這裡沒辦法在無瀏覽器的沙盒環境裡重現/確認，麻煩你這邊實測後再動手修。

---

## 問題 1：`.stage-banner` 窄螢幕 RWD 修正

### 根因

`app/src/style.css` 第 106 行的 `.stage-banner` 目前是：

```css
.stage-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  margin: 0 0 var(--space-5);
  padding: var(--space-6);
  background: var(--color-primary-700);
  border-radius: var(--radius-lg);
}
```

沒有任何窄螢幕斷點覆寫。`.stage-banner-text`（`min-width: 0`）跟 `.stage-banner-actions`（內含 `.slow-speech-toggle-btn`／`.back-btn`，兩者都是 `flex-shrink: 0`）在同一列裡搶版面：按鈕群組因為 `flex-shrink: 0` 完全不縮，窄螢幕下所有被擠壓的空間就全部落到 `.stage-banner-text` 頭上，標題文字被壓成極窄的直條、逐字換行，跟使用者截圖看到的狀況一致。

這跟先前已經修過的 `.brand-banner--user` 頭像疊字問題是同一類 bug（見 `app/src/style.css` 第 317-345 行、`verify-brand-banner-responsive.ts`），這次比照同一個做法修。

### 修法

沿用專案既有的 640px 窄螢幕斷點慣例（`style.css` 裡已經有 640px／420px 斷點），在 `.stage-banner` 相關規則後面（第 180 行之後、`v2 全站外殼` 註解之前）新增：

```css
/* ---- 窄螢幕（手機寬度）響應式：.stage-banner 原本是 justify-content: space-between
   的單列排版，標題文字（.stage-banner-text，min-width:0 會被壓縮）跟右側按鈕群組
   （.stage-banner-actions，內部按鈕都是 flex-shrink:0 不會縮）搶版面，手機寬度下
   標題被擠成一欄只能放一兩個字的窄直條——跟 .brand-banner--user 的頭像疊字問題
   同一類成因，比照同一個做法修：640px 以下改上下堆疊，標題文字獨占一整列，
   動作按鈕群組換到下面單獨一列。 ---- */
@media (max-width: 640px) {
  .stage-banner {
    flex-direction: column;
    align-items: stretch;
  }

  .stage-banner-actions {
    justify-content: flex-end;
  }
}
```

`.stage-banner-actions` 本身已經是 `display: flex; gap: var(--space-3);`，改成 column 版面後兩顆按鈕會自然排在標題文字下方那一列，靠右對齊（`justify-content: flex-end`）；不需要動 `.stage-banner-text` 或按鈕本身的規則。

### 驗證

比照 `verify-brand-banner-responsive.ts` 的做法，新增 `app/scripts/verify-stage-banner-responsive.ts`：

- 用 regex 從 `style.css` 抓出 `@media (max-width: 640px) { ... }` 區塊，斷言裡面含 `.stage-banner { ... flex-direction: column; ... }`。
- 斷言斷點外（桌面版預設規則）的 `.stage-banner` 仍然是 `justify-content: space-between`，沒有 `flex-direction: column`，確認這次修正只影響窄螢幕。
- `npm run build`（`tsc --noEmit && vite build`）通過。
- 手動用瀏覽器開發者工具切到手機寬度（例如 iPhone SE 375px、iPhone 14 390px）實際看一次四種題型畫面＋單字總覽頁（`renderVocabOverview()`，也是用 `stageHeader()`），確認標題文字跟按鈕上下分開後排版正常、不會互相擠壓。

---

## 問題 2：短文朗讀時專有名詞被逐字母拼讀（排查為主，修復視排查結果而定）

### 現況說明

`app/src/main.ts` 第 3076 行「▶ 朗讀短文」按鈕直接把 `game.passage.text`（`content/passages/pronouns.json` 的原始短文全文字串）整段傳給 `speakPassage()`：

```ts
speakPassage(game.passage.text, () => { ... });
```

`app/src/speech.ts` 的 `speakPassage()` 也是把整段文字原封不動包成一個 `SpeechSynthesisUtterance` 唸出來，沒有做任何逐字拆解或重組——換句話說，`Mia` 不是被這個專案的程式碼拆成一個一個字母的，這是瀏覽器/作業系統語音合成引擎本身，在某個特定條件下把一個三個字母、開頭大寫的專有名詞誤判成「要逐字母拼讀的縮寫」（類似人類看到 "FBI" 會唸成 F-B-I，不會唸成一個詞）。

### 最可能的根因：慢速語速

`speech.ts` 第 47-48 行：

```ts
const NORMAL_RATE = 0.9;
const SLOW_RATE = 0.6; // 明顯放慢但不到逐字唸的程度，可依實際聽感微調
```

2026-08-26 剛上線的「慢速朗讀」全域開關（`isSlowSpeechEnabled()`）把語速降到 0.6。使用者回報這個問題時，截圖裡 Stage C 畫面的「🐢 慢速」按鈕看起來是啟用狀態（黃底、`.active` 樣式）。多數瀏覽器的語音合成引擎（尤其 Web Speech API 在 macOS/iOS Safari 上背後掛的系統語音）在語速被大幅調低時，對不常見的短專有名詞／縮寫詞會有比較高機率誤判成需要逐字母拼讀——這是已知的 TTS 引擎行為模式，不是這次才出現的新程式邏輯錯誤。

**排查步驟（麻煩在瀏覽器裡實測，這邊沒有瀏覽器沒辦法重現）：**

1. 先確認：關閉「🐢 慢速」（回到 `NORMAL_RATE = 0.9`）後，重新朗讀 Pronouns 短文，`Mia` 是否恢復正常讀音。
   - 如果**關閉慢速就正常**：可以確認根因就是慢速語速，繼續看下面「候選修法」。
   - 如果**開關慢速都會拼讀**：根因可能是特定語音引擎（`pickPreferredVoice()` 選到的那個 voice）本身的問題，跟語速無關，需要另外排查是不是某個特定 `SpeechSynthesisVoice`（用瀏覽器開發者工具印出 `speechSynthesis.getVoices()` 確認目前選到哪一個）對這個字有問題，換一個聲音測試看看是否還會發生。
2. 也可以直接在瀏覽器 Console 手動測試最小重現案例，排除是不是這個專案特有的問題：
   ```js
   const u = new SpeechSynthesisUtterance("She is Mia, my friend.");
   u.lang = "en-US";
   u.rate = 0.6; // 對照組再測一次 u.rate = 0.9
   speechSynthesis.speak(u);
   ```

### 候選修法（依排查結果擇一或組合）

- **如果確認是慢速語速造成**：`SLOW_RATE` 從 0.6 調高一點（例如 0.7～0.75），在「明顯變慢」跟「引擎還能正常判斷單字邊界」之間抓平衡；或者只有短文朗讀（`speakPassage`）維持較保守的慢速倍率，不用跟單字/句子朗讀（`speakEnglish`）套用同一個 `SLOW_RATE`，因為單字/句子朗讀的文字通常比較短、比較不會誤判。
- **如果確認是特定語音引擎的問題**：可以考慮在 `pickPreferredVoice()` 的候選清單裡，把已知有這個問題的 voice 排除，或至少留一筆註解記錄下來（比照 `speech.ts` 檔案開頭處理「單獨大寫 I 被唸成羅馬數字」的 `AMBIGUOUS_STANDALONE_WORDS` 那種做法——這裡不建議直接照抄那個「替換拼法」的解法，因為 `Mia` 不是唯一會出現在短文人名，之後 Ben／Tom／Amy／Lily 等其他短文人名都可能有同樣風險，治標不治本；先排查清楚根因再決定修法比較不會白工）。

### 驗證

- 排查結論跟最終採用的修法，記得寫回 `HANDOFF.md`（append 新的 `### 9.x`節），方便之後同類問題排查參考。
- 修完後實際在瀏覽器朗讀 Pronouns／Food & Drink（兩篇短文都有 `Mia`）確認讀音正常，且慢速開關兩種狀態都測過。
- 如果最後判斷是特定語音引擎的已知限制、沒有辦法在程式層面完美解決，也可以直接記錄下來當作已知限制（不強求一定要有程式碼修法），這是所有瀏覽器 TTS 方案本來就有的天花板，跟 HANDOFF.md 裡其他「已知限制」項目（例如短文查字的多字詞組比對）性質類似。

## 不需要改的地方

- `content/` 完全不用動，這兩個問題都跟主題內容資料無關。
- 不用改 `main.ts`（問題 1 純 CSS；問題 2 目前看起來也不需要動 `main.ts` 的呼叫方式，除非排查後發現需要改成分段朗讀等更大改動，那樣的話麻煩額外評估一下對「暫停」按鈕行為／`isPassageReading` 狀態管理的影響再動手）。
