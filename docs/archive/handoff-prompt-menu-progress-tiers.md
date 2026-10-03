# 任務：題型選單卡片的視覺分級（尚未挑戰／練習中／表現不錯／完美）

## 背景

主題的「題型選單」畫面（`renderMenu()`）目前每張關卡卡片（`.menu-item`）不管有沒有挑戰過、正確率多少，樣式都長得一樣，只有卡片裡的文字內容不同。現有一個小瑕疵：`.menu-item-progress` 的文字顏色目前寫死是 `var(--color-accent-orange)`，連「尚未挑戰過」都顯示成橘色，容易誤導使用者以為已經有進度。

這次要讓卡片透過**色條＋淡底色**呈現 4 種狀態，讓使用者一眼就能分辨每個題型目前的熟悉程度，同時修掉上面那個文字顏色的瑕疵。

## 相關檔案

- `app/src/progress.ts` — `StageProgress`（含 `bestAccuracy`）、`getStageProgress()` 都在這裡
- `app/src/main.ts`：
  - 約 843-850 行：`formatProgressBadge()`，把 `StageProgress | null` 轉成選單上那行文字，這次要在附近新增一個姊妹函式算「分級」（見下方）
  - 約 1248-1305 行：`renderMenu()` 組出 `items: MenuItem[]` 並逐一 build `.menu-item` 按鈕的地方，這次要在這裡幫每個按鈕加上分級對應的 modifier class
- `app/src/style.css` 約 429-465 行：`.menu-item`／`.menu-item-label`／`.menu-item-desc`／`.menu-item-progress` 既有樣式，這次要在後面新增分級用的 modifier class
- `assets/design-tokens/design-tokens.css` — 既有色彩 token，這次的分級顏色全部從這裡挑，不新增新色相，只新增幾個「淡色版本」token（見下方）

## 分級邏輯

在 `main.ts` 新增一個函式（可以放在 `formatProgressBadge()` 旁邊），輸入 `StageProgress | null`，輸出 4 選 1 的分級：

```ts
type ProgressTier = "not-started" | "practicing" | "good" | "mastered";

function progressTier(progress: StageProgress | null): ProgressTier {
  if (!progress) return "not-started";
  if (progress.bestAccuracy >= 100) return "mastered";
  if (progress.bestAccuracy >= 80) return "good";
  return "practicing";
}
```

門檻沿用專案舊版徽章邏輯就出現過的 80% 分界（`accuracyTargets = [80, 90, 100]`），不用另外發明新數字。

**這個分級只套用在有 `stageKey` 的關卡項目上**（字卡暖身、Stage A、B-1、B-2、C、D）。「📖 單字總覽」這個項目**不套用**這套分級——它是瀏覽功能，沒有正確率，套用「正確率分級」語意不通，維持現在的中性樣式即可。

## 顏色對應（全部沿用既有 token，不新增色相）

| 分級 | 色條／文字顏色 | 語意 |
|---|---|---|
| `not-started` | `--color-border`（維持現狀，不特別強調）；進度文字改用 `--color-ink-muted` | 還沒開始 |
| `practicing` | `--color-primary-500` | 練習中 |
| `good` | `--color-success` | 表現不錯 |
| `mastered` | `--color-accent-yellow` | 完美全對 |

**刻意不用橘色（`--color-accent-orange`）或紅色（`--color-error`）代表「待加強」**——橘色在既有 token 裡是留給 CTA/獎勵用的，紅色是「答錯」瞬間回饋專用，長期掛在卡片上會讓小朋友覺得「我做錯了」，跟這個產品一路避免負面設計的方向（沒有排行榜、沒有熬夜徽章）不一致。用「灰→藍→綠→金」這種漸進色階，感覺是「越來越棒」而不是被打分數。

`mastered` 這一級，在進度文字前面加一個 ⭐ 前綴（比照現有「📖 單字總覽」已經用 emoji 當前綴的做法，風格一致，不用另外做 SVG icon）。

## 視覺實作方式：每張卡片只改兩個地方

**不要**同時改邊框整圈顏色＋底色＋標題顏色＋說明文字顏色，那樣 4 種狀態同時存在時會太雜亂（這是我們已經討論過、你特別在意的地方）。只改：

1. **卡片左側一條 4-6px 色條**（accent stripe，例如用 `border-left` 或一個絕對定位的偽元素），顏色照上面對照表
2. **卡片底色一層極淡的同色調底色**（tint）

標題（`.menu-item-label`）跟說明文字（`.menu-item-desc`）**維持原本的 `--color-ink` / `--color-ink-muted`，不跟著分級變色**，只有進度文字那一行（`.menu-item-progress`）顏色呼應色條。這樣即使同一個畫面 4 種狀態並存，每張卡片視覺上也只有「一種強調色」，不會互相打架。

### 淡色 token 怎麼加

在 `design-tokens.css` 新增 3 個淡色 token，供 `practicing`／`good`／`mastered` 三級的卡片底色用（`not-started` 沿用現有 `--color-surface` 白底，不用新增）：

```css
--color-primary-tint: #EAF2FB;   /* 從 --color-primary-500 提亮出的淡藍，practicing 用 */
--color-success-tint: #EAFBF1;   /* 從 --color-success 提亮出的淡綠，good 用 */
--color-accent-yellow-tint: #FFF8E6; /* 從 --color-accent-yellow 提亮出的淡金，mastered 用 */
```

上面這三個色碼是建議值，實際請你目視微調到跟既有卡片的白底／陰影搭配起來舒服為準，不用完全照抄這三個數字。

## 實作檢查清單

1. `design-tokens.css`：新增上述 3 個淡色 token。
2. `main.ts`：新增 `progressTier()` 函式；`renderMenu()` 組 `.menu-item` 按鈕時，對有 `stageKey` 的項目算出分級，加上對應 modifier class（例如 `menu-item--practicing`）；`formatProgressBadge()` 本身不用改，只是額外算一個分級標籤用來加 class。
3. `style.css`：在既有 `.menu-item` 規則後面，新增 `.menu-item--practicing`／`.menu-item--good`／`.menu-item--mastered` 三個 modifier class，分別設定色條（`border-left` 或偽元素）＋底色 tint；同時把 `.menu-item-progress` 的文字顏色從寫死的 `var(--color-accent-orange)` 改成由分級決定（`not-started` 用 `--color-ink-muted`，其餘三級用對照表的顏色）。
4. `mastered` 級的進度文字前面加 ⭐ 前綴。
5. 「📖 單字總覽」項目維持現有中性樣式，不加分級 class。
6. 做完後實際切換不同正確率的挑戰紀錄（或直接改 localStorage 測試資料）跑過 4 種狀態，確認色條/底色/文字顏色都正確切換，且 4 張卡片同時出現在畫面上時看起來協調、不雜亂。

## 範圍界線

- 這次只處理題型選單卡片的視覺分級，不要順便去改其他畫面（例如挑戰紀錄頁的 `.stats-topic-card`）的樣式，即使那邊邏輯類似也不要自動套用，除非之後我另外提出。
- 不用新增任何新的色相（hue），所有顏色都從既有 token 衍生。
- 如果 3 個淡色 token 的具體色碼你評估後覺得需要調整幅度（太淺看不出來或太深蓋過白底），可以自行微調，不用為了色碼數值跟我確認。
