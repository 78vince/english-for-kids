# 任務：單字收藏功能

## 背景

要讓使用者點選單字即可收藏，並有一個地方能看到收藏清單。這個功能徽章系統其實已經預留好接口了：`main.ts` 裡的 `BADGES_BLOCKED_BY_MISSING_FEATURE`（約 2620-2632 行）目前把 `badge.onboarding.first_favorite`（OB-04）跟 `badge.favorites.10`／`badge.favorites.30`／`badge.favorites.100`（FV-01~03）列為「功能開發中」永久鎖定，就是在等這個功能做出來。

已經跟我確認過兩個範圍問題：

1. 收藏的點擊入口要做在**三個地方**：新的「單字總覽」畫面、Stage C 短文的點字翻譯彈窗、字卡學習單元（見 `docs/handoff-prompt-flashcard-unit.md`）。
2. 收藏清單**不分主題**，全部收藏的單字攤平在同一張清單裡。

## 相關檔案

- `app/src/types.ts` — `Vocab` 型別在這裡
- `app/src/content.ts` — `getVocabByTopic()`、`lookupPassageWordZh()` 都在這裡
- `app/src/main.ts`：
  - 約 95-122 行：最上層 `screen` 的型別 union 跟 `render()` 的 if/else 分派，新增畫面要在這裡登記
  - 約 682-700 行：全站底部導覽列（`NavKey`、nav 項目陣列），「成就徽章」是照這個模式加的，新的「收藏清單」建議比照辦理
  - 約 1172-1198 行：主題內的「題型選單」項目清單（`renderMenu()` 裡的 `items: MenuItem[]`），新的「單字總覽」要加在這裡，是**主題內的入口**，不是全站導覽
  - 約 2325-2365 行：`buildInteractivePassage()`，Stage C 短文點字彈出翻譯泡泡的實作，這次要在這裡加收藏星星（細節見下方「Stage C 彈窗的技術細節」）
  - 約 2620-2632 行：`BADGES_BLOCKED_BY_MISSING_FEATURE`，這次做完之後要把 4 個徽章 ID 移出這份清單
  - 約 2700 行附近：`computeVocabAggregate()`，是「單字里程碑」徽章用的聚合函式，這次要寫一個同樣寫法的 `computeFavoritesAggregate()` 給收藏徽章用
- `app/src/playLog.ts`、`app/src/playTime.ts`、`app/src/badgeStats.ts` — 這三個是既有的「依 profileId 分開存在 localStorage」資料層範例，新的收藏資料層直接照同一套寫法做
- `app/src/sound.ts` — 已有 `playCorrectSound()`，收藏成功時可以直接借用當作音效回饋，不用新增音檔

## 功能規劃

### 1. 資料層：新增 `favorites.ts`

比照 `playLog.ts`／`badgeStats.ts` 的寫法：

- 用 localStorage，key 依 `profileId` 分開存，儲存內容是該使用者收藏的 vocab id 陣列（或 Set）。
- 對外函式至少要有：`isFavorite(profileId, vocabId): boolean`、`toggleFavorite(profileId, vocabId): void`、`getFavoriteVocabIds(profileId): string[]`、`getFavoriteCount(profileId): number`。
- 跟其他資料層一樣，localStorage 被擋掉或資料壞掉時要安靜降級（當作沒有任何收藏），不要讓 App 掛掉。

### 2. 新畫面：單字總覽（主題內）

- 從主題的「題型選單」（`renderMenu()`）新增一個入口項目，進到一個列出**這個主題**全部單字的畫面（`getVocabByTopic(topicFileKey)`）。
- 每個單字顯示英文／中文／詞性，旁邊放一顆星星（或愛心）圖示，點擊呼叫 `toggleFavorite()` 切換收藏狀態，圖示要能明顯區分「已收藏／未收藏」兩種狀態。
- 這個畫面**不是** Stage，不要塞進 `StageKey`／`STAGE_ROWS`（那是給有進度/正確率可以追蹤的題型關卡用的，單字總覽只是瀏覽，沒有「完成度」的概念）。
- 建議每個單字旁邊也放一個播放發音的按鈕，重用 `speakEnglish()`（`speech.ts`），不是這次的硬性需求，但反正單字都列出來了，順手加上使用體驗會好很多。

### 3. 新畫面：收藏清單（全站，不分主題）

- 全站導覽列新增一個入口（比照「成就徽章」的加法），進到一個畫面，列出使用者目前收藏的**所有**單字，不分主題、攤平成一張清單。
- 每個單字一樣顯示英文／中文，並可以再點一次移除收藏（呼叫 `toggleFavorite()`）。
- 如果目前沒有收藏任何單字，畫面要有清楚的空狀態提示（例如「還沒有收藏任何單字，去單字總覽點幾個喜歡的字吧！」），不要顯示空白一片。

### 4. Stage C 短文點字翻譯彈窗也要能收藏

這裡有一個技術細節要注意：`buildInteractivePassage()` 目前是用 `lookupPassageWordZh(topicFileKey, token)` 查中文意思，這個函式**只回傳中文字串**，而且查詢範圍是跨所有主題的 vocab、查不到才退回這個主題的 `content/glossary/` 補充詞彙表——**glossary 裡的字沒有對應的 `Vocab.id`**（例如短文裡出現的職業名稱，剛好不在任何主題的 vocab 清單裡），這種字沒辦法收藏，因為收藏本質上是收藏一個 `vocab.id`。

具體修法（根源在 `content.ts` 建查詢表的地方，把 `v.id` 一起存下來就好，目前只存了 `v.zh`）：

1. 把現有的 `globalVocabZhByEnglish: Record<string, string>` 改成 `globalVocabByEnglish: Record<string, { zh: string; vocabId: string }>`，建表迴圈裡從 `globalVocabZhByEnglish[v.en.toLowerCase()] = v.zh` 改成 `globalVocabByEnglish[v.en.toLowerCase()] = { zh: v.zh, vocabId: v.id }`。
2. `lookupPassageWordZh()` 的回傳型別從 `string | null` 改成 `{ zh: string; vocabId: string | null } | null`：查得到 vocab 就回傳真正的 `vocabId`；查不到、退回 glossary 查到的，`vocabId` 給 `null`。
3. `main.ts` 裡唯一呼叫這個函式的地方（`buildInteractivePassage()`）跟著改：用 `result.zh` 顯示翻譯泡泡文字，**只有 `result.vocabId` 不是 null 時才畫收藏星星**，glossary 查到的補充詞彙不顯示星星（因為沒有東西可以收藏）。

這個改動範圍很小，只有這一個函式跟它唯一的呼叫點要動。

### 5. 字卡學習單元也要能收藏

字卡學習單元是另一個任務（`docs/handoff-prompt-flashcard-unit.md`），執行這次任務時請先確認那個功能目前有沒有做出來：

- **如果已經做出來了**：在字卡畫面上加收藏星星，點擊呼叫同一套 `favorites.ts` 的 `toggleFavorite()`。
- **如果還沒做出來**：不用等它，先完成單字總覽跟 Stage C 彈窗這兩個部分，並在 `favorites.ts` 或這次改動的地方留一行註解，提醒之後字卡單元做出來時要記得加上同樣的收藏星星（引用這個 API 就好）。

### 6. 把預留的徽章真正接起來

- 把 `badge.onboarding.first_favorite`、`badge.favorites.10`、`badge.favorites.30`、`badge.favorites.100` 從 `BADGES_BLOCKED_BY_MISSING_FEATURE` 移除。
- 照 `computeVocabAggregate()` 的寫法新增 `computeFavoritesAggregate()`（回傳目前收藏數量），接進判斷徽章解鎖狀態的邏輯（`computeBadgeViewState()` 那個 switch/分支），讓這 4 個徽章能被真正解鎖。
- 改完之後實際操作一次收藏功能，確認徽章頁面上這 4 個徽章真的會從「功能開發中」變成正常的鎖定/解鎖狀態，不要只憑程式碼邏輯推論就結案。

### 7. 加分建議（非硬性規定）

點擊收藏／取消收藏時，可以重用 `sound.ts` 的 `playCorrectSound()` 當作即時音效回饋，讓小朋友點下去有明確的反饋感；如果評估後覺得不需要也可以不做。

## 範圍界線

- 這次只做收藏功能本身（資料層＋三個入口畫面＋徽章解封），不要順便去改 Stage A-D 既有題型的邏輯或版面。
- 不用做「收藏數量上限」之類的限制，沒有這個需求。
- 如果過程中發現 `content/` 資料格式或既有程式碼有不方便的地方，一樣先跟我確認要不要調整，不要自己直接改。
