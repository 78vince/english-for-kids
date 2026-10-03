> ⚠️ **已過時，不要依此執行**：這份提示詞寫完之後才發現，技術架構 session 已經在 2026-08-20（HANDOFF.md 第 9.26／9.27 節）做過同樣的事——先做了全站頁尾，使用者反應「位置沒有很好」，後來改成獨立的「關於本站」頁面（入口在個人檔案頁的連結按鈕）。目前 App 已經是「關於本站」獨立頁面的版本，不是頁尾。這份文件僅保留當時的規劃紀錄，不要拿去重做。

# 任務：新增「關於」說明區塊＋全站頁尾（版本／作者資訊）

## 背景

目前 App 裡完全沒有「這是什麼平台、誰做的」這類說明文字，也沒有任何全站共用的頁尾。`README.md` 已經補完整版（專案介紹、使用緣起、內容來源、作者資訊），但那是給 GitHub 上瀏覽原始碼的人看的，App 使用者不會看到。這次要在 App 內補兩個小地方，讓實際使用的家長也能看到同樣的資訊，內容我已經寫好，不用重新發想文案。

**注意一個既有的命名陷阱**：`main.ts` 裡目前所有 `<footer>` 都是 `class="game-footer"`（約有 8 處，例如 952、2095、2159、2198、2253、2394、2484、2645、2782 行），是每一關「下一題／重玩」之類答題動作按鈕用的頁尾，跟這次要做的「全站說明頁尾」是完全不同的東西。這次新增的頁尾**必須用新的、不同的 class 名稱**（建議 `site-footer`），不能取名 `footer` 或沿用 `game-footer`，避免撞名互相干擾樣式。

## 相關檔案

- `app/src/main.ts`
  - 約 1035-1057 行：`appendBrandBanner()` —— 品牌橫幅，未登入（`renderProfileSelect()`，約 769 行）跟已登入畫面都會呼叫
  - 約 1065-1088 行：`appendShell(activeNav: NavKey)` —— 已登入的 5 個畫面（首頁／挑戰紀錄／成就徽章／收藏清單／個人檔案）共用的外殼，目前只 append 橫幅＋功能列，這次要在裡面追加頁尾
  - 約 1764-1886 行：`renderProfileDetail()` —— 「個人檔案」頁，這次要在「帳號設定」區塊（`settingsActions`，約 1871 行 append 完之後）跟已存在的「已儲存」提示訊息之間，新增一個「關於」小節
- `app/src/style.css` —— 新增 `.site-footer` 與「關於」小節的樣式，沿用既有 design tokens（字級、顏色用 `--color-ink-muted`，不要另外挑新顏色）
- `app/package.json` 第 4 行：`"version": "0.1.0"` —— 頁尾要顯示的版本號，直接讀這個值，不要在 `main.ts` 裡另外寫死一份版本字串（避免以後兩處版本號不同步）

## 功能規劃

### 1. 全站頁尾：新增 `appendSiteFooter()` 共用函式

在 `appendBrandBanner()` 附近新增一個函式，內容固定：

```
English for Kids v{版本號} ｜ Vincent - 小禮 ｜ 78vince@gmail.com
```

版本號的取得方式：`app/package.json` 的 `version` 欄位在建置時不會自動注入到前端程式碼裡，需要透過 Vite 的方式讀取（例如在 `vite.config.ts` 用 `define` 注入一個常數，或是直接 `import pkg from "../package.json"` 視專案目前的 TS/Vite 設定是否允許 JSON import 而定）。實作前請先確認專案目前的建置設定能不能直接 import package.json，如果不行，選一個最小改動的方式注入版本號，不用大動建置設定。

視覺上：

- 字級要小（比 `.menu-item-desc` 再小一階即可）、顏色用 `--color-ink-muted`，整行置中，跟畫面內容之間留一點間距，不要搶視覺重量——這是小朋友在用的 App，畫面主體的重點還是遊戲內容。
- Email `78vince@gmail.com` 用 `mailto:` 連結包起來即可，不用額外做成按鈕樣式。

呼叫位置：

- `appendShell()`（約 1065-1088 行）：在功能列 `nav` append 完之後，接著呼叫 `appendSiteFooter()`，讓 5 個已登入畫面都看得到。
- `renderProfileSelect()`（約 769 行）：畫面最後也呼叫一次 `appendSiteFooter()`，讓還沒登入的「選使用者」畫面一樣看得到。

這樣只需要維護一份 `appendSiteFooter()`，不用在每個畫面各寫一次。

### 2. 「個人檔案」頁新增「關於」小節

在 `renderProfileDetail()`（約 1764-1886 行）裡，「帳號設定」的危險操作按鈕（`settingsActions` append 完，約 1871 行之後）跟目前既有的「已儲存」提示訊息之間，新增一個跟「帳號設定」同樣層級的小節：

標題比照既有 `settingsTitle` 的做法（`section-heading` class）：

```
關於 English for Kids
```

內文（一段文字即可，不用做成卡片或按鈕）：

```
一個給小朋友在家練習 GEPT Kids 單字、句型與短文的學習平台。沒有排行榜、沒有跟別人比較，只記錄你自己的進步。
```

樣式沿用頁面既有段落文字的字級／顏色即可，不用另外設計新元件。

## 實作檢查清單

1. `main.ts`：新增 `appendSiteFooter()`，讀取 `package.json` 版本號（先確認建置設定能否直接 import，必要時用最小改動注入）；在 `appendShell()` 尾端與 `renderProfileSelect()` 尾端各呼叫一次。
2. `main.ts`：`renderProfileDetail()` 新增「關於」小節（標題＋一段說明文字），位置在帳號設定按鈕列之後。
3. `style.css`：新增 `.site-footer` 樣式（小字、`--color-ink-muted`、置中、與內容留間距），確認跟既有 8 處 `.game-footer` 沒有 class 名稱或樣式衝突。
4. 完成後實際切換「選使用者」畫面、5 個已登入畫面（首頁／挑戰紀錄／成就徽章／收藏清單／個人檔案）確認頁尾都正確顯示且版本號正確；個人檔案頁確認「關於」小節排版跟既有「帳號設定」區塊不會互相擠壓或跑版。

## 範圍界線

- 這次只做頁尾＋個人檔案頁的「關於」小節，不要順便去改 `README.md`（已經由我這邊完成）或既有的 `.game-footer` 相關邏輯。
- 頁尾文案、關於小節文案已經定稿如上，不用重新發想或潤飾用詞；如果評估後版面上有必要微調字句長度（例如太長跑版），可以做最小幅度調整，但語意跟資訊（版本號／Vincent - 小禮／email）都要保留。
- 如果 `package.json` 版本號注入的方式牽涉到要調整 `vite.config.ts` 或 TS 設定（例如開啟 `resolveJsonModule`），這類設定調整可以直接做，不用先跟我確認；但如果評估後發現需要更大幅度的建置改動才能做到，先跟我確認再動手。
