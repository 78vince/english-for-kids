# Handoff Prompt：短文查字改成「主題優先」＋收藏清單排序功能

這份提示詞包含兩個獨立的改動，可以分開執行、分開驗證，彼此沒有相依關係。

## 改動一：短文點字查中文意思，改成「這個主題自己的單字優先」

### 背景

content 端目前有個自己訂的硬規則：**同一個英文字全站只能收錄一次**，不能讓 A 主題跟 B 主題各自收一份意思不同的版本（例如 change 不能同時是 Money 的「零錢」又是別的主題的「改變」）。這個規則存在的原因是 `app/src/content.ts` 的 `globalVocabByEnglish` 是一張「英文字（小寫）→ 中文意思」的全站攤平表，同一個 key 後面的主題會蓋掉前面的（`content.ts` 第 69-70 行的註解也承認這是「可接受的簡化」）。

但重新看過程式碼後發現，這個限制其實沒有必要這麼嚴格：

- `MatchingGame`／`FlashcardGame`／`OrderingGame`／`FillBlankGame`／`ChoiceGame`／`buildCapstoneQuestions` 這些遊戲邏輯，都是吃 `getVocabByTopic(topicFileKey)` 回傳的「這個主題自己的單字清單」，完全不會用到 `globalVocabByEnglish`。也就是說，兩個不同主題各自收一份意思不同的「change」，在各自主題玩遊戲時完全不會互相干擾。
- `globalVocabByEnglish` 唯一真正用到的地方，是 `lookupPassageWordZh()`——短文閱讀（Stage C）點一個字看中文意思、順便收藏這個功能。它目前的查詢順序是「先查全站（任何主題都算），查不到才查這個主題自己的補充詞彙表 `content/glossary/<topic>.json`」，順序反過來了，才會變成「哪個主題的 vocab 檔案後被載入，就蓋掉先載入的主題」。

### 需要的改動（`app/src/content.ts`）

把 `lookupPassageWordZh()` 的查詢順序改成「這個主題自己的 vocab 優先」：

```ts
export function lookupPassageWordZh(
  topicFileKey: string,
  word: string
): { zh: string; vocabId: string | null } | null {
  const key = word.toLowerCase();

  // 1. 先查「這個主題自己」的 vocab 清單——這個主題自己收錄的意思，優先權最高，
  //    不管其他主題有沒有收過同一個英文字、收的是什麼意思。
  const ownVocab = vocabByTopic[topicFileKey]?.find((v) => v.en.toLowerCase() === key);
  if (ownVocab) return { zh: ownVocab.zh, vocabId: ownVocab.id };

  // 2. 這個主題自己沒收，才退回跨主題全域表（維持原本「順便學到別的主題單字」的
  //    加分功能，例如在 Colors 短文點到 sister 查到 Family 主題的意思）。
  const fromVocab = globalVocabByEnglish[key];
  if (fromVocab) return { zh: fromVocab.zh, vocabId: fromVocab.vocabId };

  // 3. 都查不到，才退回這個主題自己的補充詞彙表。
  const glossary = glossaryByTopic[topicFileKey];
  const zh = glossary?.[key];
  return zh ? { zh, vocabId: null } : null;
}
```

`vocabByTopic` 已經是 `content.ts` 裡現成的模組變數（第 61 行 `const vocabByTopic = indexByTopicKey(vocabModules);`），不用額外建新的資料結構，只是在 `lookupPassageWordZh()` 裡多查一次「自己主題」。

### 連帶影響：`app/scripts/verify-passage-glossary.ts` 也要同步改

這支腳本第 63-73 行自己重建了一份跟 `lookupPassageWordZh()` 邏輯一致的查詢函式（因為 `content.ts` 用 Vite 的 `import.meta.glob`，`tsx` 沒辦法直接 import），要照同樣的邏輯加上「先查自己主題」這一段，兩邊查詢順序才會一致，這支驗證腳本才有意義。

### content 端的規則放寬

改完之後，content 端「同一個英文字全站只能收錄一次」的規則可以放寬成「**同一個英文字在同一個主題裡只能收錄一次**」——不同主題可以各自收一份意思不同的版本了（例如未來某個動作/情緒類主題如果想收 `change＝改變`，不會再跟 Money 的 `change＝零錢` 衝突）。這一側我（content 端）之後會自己注意，不用你這邊額外處理 schema 或驗證邏輯。

### 驗證

- `npm run build`（含 `tsc --noEmit`）過即可。
- 全部 `verify-*.ts` 重跑一次都要過，特別是 `verify-passage-glossary.ts`（已經同步改過查詢順序）。
- 建議手動測試：如果目前 content 端還沒有真正出現「同一個字兩個主題各收一份」的情況，這個改動不會讓任何畫面看起來不一樣（純粹是查詢順序的內部改動，行為在「無衝突字」的情況下完全等價）；之後 content 端真的收了衝突字，才會看到差異。

---

## 改動二：收藏清單新增排序功能（收藏時間／字母 A→Z／字母 Z→A）

### 背景

`renderFavorites()`（`app/src/main.ts` 約第 1536 行）目前直接照 `getFavoriteVocabIds()` 回傳的順序畫列表，沒有排序控制項。使用者想要三種排序：依收藏時間、字母 A→Z、字母 Z→A。

先說一個好消息：**收藏功能本身已經支援「同一個英文字的不同意思分開收藏」，這部分不用改**——`favorites.ts` 是用 `vocab.id`（不是英文字串）當 key 存收藏清單，`buildVocabOverviewRow()` 顯示的 `vocab.en`／`vocab.zh` 也是直接讀 Vocab 物件自己的欄位（不是查那張全域表），所以就算改動一之後 content 端真的出現「change」兩種意思分別收錄在兩個主題，收藏清單本來就會把它們當成兩個獨立項目正確顯示，不會互相蓋掉或合併。這裡列出來只是提醒你，實作完改動一之後可以順手測一下這個情境，不需要為此另外寫程式碼。

### 需要的改動（`app/src/main.ts`）

1. 新增一個畫面層級的排序狀態（跟 `activePassageWordKey`〔第 278 行〕同一種模組層級 `let` 變數的寫法）：

```ts
type FavoritesSortMode = "recent" | "az" | "za";
let favoritesSortMode: FavoritesSortMode = "recent";
```

2. 在 `renderFavorites()` 裡（第 1536-1570 行），標題底下、清單上方加一組排序控制項（三個按鈕或一個 `<select>` 都可以，跟現有畫面風格一致即可），切換時更新 `favoritesSortMode` 並呼叫 `render()` 重新畫面。

3. 排序邏輯（在組出 `Vocab[]` 之後、畫列表之前排序）：

```ts
function sortFavoriteVocabs(vocabs: Vocab[], mode: FavoritesSortMode): Vocab[] {
  if (mode === "az") {
    return [...vocabs].sort((a, b) => a.en.localeCompare(b.en));
  }
  if (mode === "za") {
    return [...vocabs].sort((a, b) => b.en.localeCompare(a.en));
  }
  // "recent"：getFavoriteVocabIds() 回傳的是 Set 的插入順序（舊到新，見 favorites.ts
  // 的 readFavoriteIds()），直接反過來就是「最近收藏的排最前面」，不用另外存時間戳記。
  return [...vocabs].reverse();
}
```

呼叫端把現有的

```ts
for (const vocabId of favoriteIds) {
  const vocab = vocabById.get(vocabId);
  if (!vocab) continue;
  list.appendChild(buildVocabOverviewRow(vocab));
}
```

改成先組出 `Vocab[]`、排序、再畫：

```ts
const favoriteVocabs = favoriteIds
  .map((id) => vocabById.get(id))
  .filter((v): v is Vocab => v !== undefined);
const sorted = sortFavoriteVocabs(favoriteVocabs, favoritesSortMode);
for (const vocab of sorted) {
  list.appendChild(buildVocabOverviewRow(vocab));
}
```

4. 預設排序建議用 **「收藏時間，新到舊」**（`favoritesSortMode` 初始值 `"recent"`）——最近收藏的東西放最前面，比較符合一般收藏清單的使用習慣，這是我的建議，你也可以依實際畫面感覺調整。

5. 排序狀態不用跨畫面/跨工作階段記住（不用存進 `localStorage`），每次進入收藏清單畫面重置成預設值即可，這是比較單純的做法；如果你覺得記住使用者上次選的排序方式體驗更好，也可以比照 `favorites.ts` 的模式另外存一個 `localStorage` key，非必要，看你判斷。

### 驗證

- `npm run build`（含 `tsc --noEmit`）過即可。
- 手動測試：收藏至少 3-4 個不同主題的單字，切換三種排序方式，確認英文字母排序正確（含大小寫不影響排序、中文不受影響，只排英文）、「收藏時間」新到舊排序符合收藏的先後順序。
- 全部 `verify-*.ts` 重跑一次確認沒有連帶影響其他功能（這個改動範圍局限在 `renderFavorites()`，理論上不會影響其他畫面）。

---

## 完成後

在 `HANDOFF.md` 開一個新編號記錄這兩項改動（不是延續某個舊條目底下補記錄，因為這兩個改動都是全新的功能/架構調整，不是延續之前哪個 content 異動），內容包含：改動一的查詢順序調整＋`verify-passage-glossary.ts` 同步更新、改動二的排序功能＋預設排序方式，`npm run build`／全部 `verify-*.ts`／`build-standalone-demo.mjs` 都過的驗證紀錄。
