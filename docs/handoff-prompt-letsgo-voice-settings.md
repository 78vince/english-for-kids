# Handoff：語音設定改版（多角色、只列實用語音、優先增強音質）與 iOS 播放穩定（App 端）

*撰寫：2026-10-13（內容端，依使用者在 iPhone 上的實測截圖與回饋）｜執行對象：App 端 `app/`（`speech.ts`、`main.ts` 語音設定區、會話練習播放）｜內容端不改 App 程式*

## 使用者回饋（iPhone，Safari／Chrome）
1. 語音設定只有一個「發音（單字／例句朗讀）」；會話練習想能分別設定角色的聲音。
2. 使用者已在 iOS「設定 > 輔助使用 > 朗讀內容 > 聲音」下載 Allison（增強音質）、Ava（增強音質）等，想知道能不能用到。
3. 現在的語音清單有很多不實用的聲音（Albert、Bad News、Bahh…，還有 Kathy 這類舊式合成音），對練習沒有幫助。
4. 語音音量有時大聲有時小聲，應自動播放時有時沒反應。

## 請 App 端做
### A. 語音清單
1. **只列實用的語音**：預設完全隱藏 `isNoveltyVoice()` 命中的語音（不是排在後面）；並把舊式低品質聲音加進排除清單：kathy、vicki、bruce、agnes、princess、junior、ralph、fred、albert 等（以裝置實際出現的名字為準，保留可再增補的陣列）。
2. **品質排序**：名字含 `Enhanced`／`增強`／`Premium`／`高音質`（或 `quality`）的排最前，標籤加「增強音質」；其次一般自然聲（Samantha、Ava、Allison、Susan、Tom、Evan…）。
3. **口音分組**：教材是美式英文，`en-US` 放最上面一組；英／澳／愛／南非／印度（Daniel、Karen、Moira、Tessa、Rishi 等）放「其他口音」一組。
4. **重新整理語音清單**：使用者剛在系統下載新語音後，清單要能更新——頁面回到前景（`visibilitychange`）和 `voiceschanged` 時重新取得；設定區放一個「重新整理語音清單」按鈕，並提示「剛下載的語音需要重新開啟這個頁面才會出現」。
5. **能否用到下載的語音**：iOS 的瀏覽器通常能在 `speechSynthesis.getVoices()` 看到「增強音質」語音；「高音質（Premium）」不一定會開放給網頁。請實機確認清單裡有沒有 `Ava (Enhanced)`、`Allison (Enhanced)`，沒有的話在設定區說明「這個語音系統沒有開放給網頁使用」。

### B. 多個語音角色（`VoiceRole`）
- 目前只有 `general`。新增：`general`（單字／例句）、`conversationHost`（會話練習裡 Benny 的台詞）、`conversationLearner`（會話練習中孩子選的回答）。
- 設定區每個角色一個下拉＋「試聽」；沒設定的角色一律跟隨 `general`（舊資料不受影響，沒有新 key 就用 general）。
- 存放方式沿用：存在本機（不分使用者、不同步），文案已說明；新 key 依序命名 `levelUnitReview.settings.voice<Role>.v1`。
- 預設值（自動）：優先「US 增強音質」，`conversationHost` 與 `conversationLearner` 預設選不同的聲音（若有）。

### C. iOS 播放穩定
1. 第一次點擊（`pointerdown`）時「解鎖」語音：先播一段空白或極短的 utterance；之後自動朗讀才會成功。
2. `cancel()` 後等約 50–100ms 再 `speak()`；播放前若 `speechSynthesis.paused` 先 `resume()`；頁面回到前景時 `resume()`。
3. 固定 `utterance.volume = 1`；不要在不同呼叫間換語音（每個角色用該角色選定語音）。
4. 自動播放的畫面（例如進入題目自動唸）若尚未解鎖，不要靜默失敗：顯示小喇叭提示「點一下開始發音」。
5. 後續（第二階段，非這次）：單字與例句改用預錄音檔（`vocab.audio`），音量一致；找不到再退回語音合成。

## 驗收（iPhone，Safari 與 Chrome）
- 語音清單不再出現 Albert、Bad News、Bahh、Kathy 等；增強音質排在最前面並有標籤。
- 在系統下載新語音後，重新開啟頁面或按「重新整理語音清單」能看到（若系統有開放）。
- 三個角色可分別選擇與試聽；會話練習 Benny 與孩子回答用不同聲音；沒設定時跟隨「單字／例句」。
- 連續點喇叭 20 次、切到別的 App 再回來，仍能正常發音；音量一致。
