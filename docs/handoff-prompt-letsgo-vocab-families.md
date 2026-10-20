# Handoff：Unit 4 單字總覽「字族收合＋分組收合＋變化規則表」（App 端）

*撰寫：2026-10-12（內容端，依使用者選的 C＋B＋E）｜執行對象：App 端 `app/`（單字總覽畫面、新增規則頁）｜內容檔已更新，App 不用改內容*

## 內容端已做（`content/level4/unit4/`）
- `vocab.json`：55 → **42 字**。比較級、最高級（easier、heavier、older、better、best、the longest …共 15 筆）不再是獨立單字，改掛在原級的 `related_forms`（字串，例如 `easy` → `["easier","easiest"]`、`good` → `["better","best"]`）。新增 `good`、`bad` 當不規則字族的原級。id 沿用，沒有重新編號（有缺號是正常的）。
- `bubble_words.json`：12 筆補充字（longest、tallest、fastest、heavier、easier、harder、older、taller、faster、better、worse、newer），讓比較級仍能在戳泡泡出現；中文提示是單字本身。
- `unit.json` 新增兩個欄位（App 讀不到時請忽略，不要報錯）：
  - `vocab_groups`：總覽分組順序與標題（`topic`、`title_zh`、`title_en`、`default_collapsed`）。
  - `comparison_rules`：5 條規則（一般 -er／-est、y 變 ier、重複字母、不規則、用法），每條有 `title_zh` 與 `forms`（原級／比較級／最高級三元組，或例句）。
- 驗證：`verify-level-unit-content` 通過（Unit 4 單字 42、戳泡泡可用 51）。

## 請 App 端做
1. **單字總覽（B）**：每個單字卡若有 `related_forms`，在原級下方用小字顯示「→ easier, easiest」，可點開看變化形（先只顯示文字即可；有朗讀時一併可播）。數量統計用 vocab 筆數（42）。
2. **分組收合（E）**：單字總覽依 `unit.json.vocab_groups` 的順序分組，標題顯示「標題　N 個」，依 `default_collapsed` 預設收合／展開；沒有 `vocab_groups` 的 Unit 維持現況。
3. **規則表（C）**：Unit 4 單字總覽（或字卡／句型頁）加一個「比較變化規則」入口，讀 `unit.json.comparison_rules` 顯示：每條規則一張卡，標題＋三元組列（base → comparative → superlative，箭頭樣式）；`usage` 那條顯示例句。平板、手機都不要橫向捲動。
4. 其他題型不用改（填空／配對／排序／句型／填字都已用新資料驗證）。

## 驗收
- Unit 4 總覽：單字數 42；點 easy 可看到 easier、easiest；groups 順序與預設收合正確；規則頁 5 條內容完整。
- 其他 Unit（沒有 `vocab_groups`／`comparison_rules`）顯示與之前完全一樣。
- 手機 390px、平板 820px 無水平捲動；無 console error。
