# Handoff：連擊方向鍵誤觸 iPad 局部放大（App 端修正）

*撰寫：2026-10-12（內容端，依使用者回饋）｜執行對象：App 端 `app/`（內容端不改 App 程式）*

## 問題
平板上連續點方向鍵（賽跑連點 →）時，Safari 把快速的連擊判成「連點兩下放大」，畫面局部放大，打斷遊戲。

## 原因（依目前程式）
- `virtualPad.ts` 的 `.vpad-k` 按鈕只擋了 `pointerdown` 的 `preventDefault`，iOS 的 double-tap zoom 不受影響。
- `.vpad`／`.race-controls` 沒有 `touch-action: manipulation`；`gamePage.css` 的 `touch-action:none` 只掛在 html/body，且 iPadOS Safari 對雙擊縮放不一定遵守。
- `index.html` viewport 沒有限制縮放。

## 請 App 端修改
1. CSS：`.vpad`、`.vpad-k`、`.race-controls`、賽跑畫面容器加 `touch-action: manipulation`（按鈕本身可再加 `-webkit-user-select:none; -webkit-touch-callout:none`）。
2. 遊戲進行中（賽跑與其他用虛擬按鍵的遊戲）在 `document` 掛：
   - `touchend` 防連擊縮放（`{ passive:false }`）：與上一次 `touchend` 間隔 < 350ms 就 `e.preventDefault()`。
   - `gesturestart`／`gesturechange`／`gestureend`：`preventDefault()`（擋雙指縮放）。
   - 離開遊戲時移除這些 listener，避免影響一般頁面的縮放。
3. `index.html` viewport：遊戲頁加 `maximum-scale=1, user-scalable=no`（iOS 會部分忽略，仍建議加；一般學習頁是否限制縮放由你判斷）。
4. `dblclick` 也 `preventDefault()`（作用在 `.race-controls` 範圍內）。

## 驗收（iPad Safari，主畫面 App 與一般分頁各測一次）
- 賽跑中用力快速連點 → 十幾秒，畫面完全不放大、不閃動，連點步調仍正常觸發。
- 同時按住 → 與 A／B 不受影響；雙指縮放被擋。
- 離開遊戲回到一般頁面，原本的縮放行為不變。
