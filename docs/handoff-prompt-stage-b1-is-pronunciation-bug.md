# Handoff：Stage B-1 句子排序，單獨點「Is」字塊發音變成 "Ice"

## 問題（使用者截圖回報）

主題 Parts of Body 身體部位 — Stage B-1 句子排序，句子「Is your foot bigger than your hand?」的字塊池裡，單獨點擊「Is」這個字塊時，語音唸出來像「Ice」，不是正確的 "is" /ɪz/ 發音。句子裡其他字塊（bigger／your／hand?／foot／than）發音都正常，用「播放整句」聽整句也是正常的，只有單獨點這一個字塊會唸錯。

## 這跟先前修過的「I」發音 bug 是同一類問題，但不是同一個字

`app/src/speech.ts` 裡已經有一個機制在處理這類問題：

```ts
// 有些系統的語音合成引擎，看到「單獨」一個大寫 I（前後沒有其他字）時會誤判成羅馬數字 1，
// 唸成 "one" 而不是代名詞 I（應該唸作 "eye"）——這是 Stage B-1 句子排序點單一字塊時會發生的問題，
// ...
// （檢查過其他會出現在句子裡的短字：is / in / us / He / It / My / my——都不是羅馬數字也不是
// 容易跟字母名稱搞混的字，目前沒有觀察到同樣的問題，所以先只處理 I。）
const AMBIGUOUS_STANDALONE_WORDS: Record<string, string> = {
  I: "Eye",
};
```

當時檢查「is」是在**完整句子**裡的發音（例如 "He is happy." 裡的 is），結論是沒問題。但這次回報的是**句首大寫、單獨字塊**的「Is」（例如 "Is your foot bigger than your hand?" 拆出來的第一個字塊，因為是句首字所以保留大寫），這是不同的呼叫情境，跟先前排除的「句子裡小寫 is」不衝突，不代表先前的排查有錯，只是沒涵蓋到這個情境。

## 確認過的呼叫路徑

`app/src/main.ts` 第 744-753 行，Stage B-1 字塊池的 `tokenButton()`：

```ts
btn.addEventListener("click", () => {
  speakEnglish(token.text); // 點字塊池裡的字塊時唸出這個字，跟 Stage A 單字配對同一個概念
  onClick(token.instanceId);
});
```

`token.text` 保留句子原始大小寫，所以句首字塊會是 `"Is"`（大寫 I）而不是 `"is"`。`speakEnglish()` 目前只有 `AMBIGUOUS_STANDALONE_WORDS["I"]` 這一條規則，`"Is"` 沒有命中，所以照原文送進 Web Speech API，被使用者的瀏覽器/語音引擎誤判成 "Ice"。

目前確認 content 裡有 2 句話的句首是「Is」，都在 Stage B-1 會被拆成獨立字塊：
- `content/sentences/parts_of_body.json`：`"Is your foot bigger than your hand?"`
- `content/sentences/places_directions.json`：`"Is the hospital near here or over there?"`

（之後新增句子如果句首用到 Is/Are/Do/Does 這類大寫開頭的疑問詞，理論上都可能有同樣風險，不只這 2 句。）

## 建議修法（需要實機測試確認，沙盒沒有喇叭/瀏覽器語音，無法直接驗證哪個做法有效）

在 `AMBIGUOUS_STANDALONE_WORDS` 補上 `"Is"` 這個 key。因為沙盒沒辦法實際聽發音，這裡列出兩個候選做法，麻煩實機測試後選一個真的有效的：

**候選 1（優先試這個，改動最小）**：在字尾補句點，讓引擎當作完整短句處理，可能會用一般語調唸而不是被當成單一縮寫字判斷：
```ts
const AMBIGUOUS_STANDALONE_WORDS: Record<string, string> = {
  I: "Eye",
  Is: "Is.",
};
```

**候選 2（如果候選 1 沒用，換一個拼法）**：用發音相同但不會被誤判的另一種拼法，做法跟 "I" → "Eye" 同一個邏輯：
```ts
const AMBIGUOUS_STANDALONE_WORDS: Record<string, string> = {
  I: "Eye",
  Is: "Izz",
};
```

無論選哪個，麻煩同時確認：
1. 小寫 `"is"`（如果之後哪個字塊剛好就是小寫 is，理論上目前的架構不會發生，因為只有句首字塊會大寫，但保險起見可以順手也加一條 `is: "..."` 對應的小寫版本，或者讓查表邏輯改成不分大小寫比對，兩種做法擇一即可）要不要一併處理。
2. 修好後麻煩重新測一次 Parts of Body 跟 Places & Directions 這兩句的「Is」字塊，確認發音正常，其餘字塊跟整句朗讀沒有被改壞。
3. 如果找得到專案裡既有的 `verify-*.ts` 或後續要新增驗證腳本，比照先前處理 "Mia→Ella" bug 的方式，可以在 `speech.ts` 加註解記錄這次排查過程（哪個候選有效、為什麼），方便以後遇到類似字再參考。

## 補充

這個 bug 範圍很小（目前只影響 2 句話的句首字塊），不影響整句朗讀，也不影響其他題型，可以正常排入下一輪修正，不急。
