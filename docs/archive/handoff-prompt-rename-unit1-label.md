# Handoff Prompt：單元一名稱改為「我和身邊的人」

## 背景

使用者看首頁截圖後回饋：「單元一：我和我的家」這個名字，跟底下 6 個主題（Family／People／Appearance／Emotions／Personality Traits／Parts of Body）對不太起來。只有 Family／People 真的跟「家」有關，其餘 4 個（Appearance／Emotions／Personality Traits／Parts of Body）是 2026-08-22 從 Personal Characteristics 拆分＋Parts of Body 擴充而來的「描述人」主題，當初找不到更適合的單元才留在單元一。

跟使用者確認過兩個方案（A 只改名／B 拆成兩個單元）後，使用者選擇影響最小的方案 A：**只改單元一的顯示名稱，不搬動任何主題**。新名稱「**我和身邊的人**」涵蓋範圍更貼近實際的 6 個主題。

## 需要的改動

只有一處，`app/src/main.ts` 裡 `UNITS` 陣列的 `unit1` 項目：

```ts
{
  key: "unit1",
  label: "單元一：我和我的家",   // ← 改成 "單元一：我和身邊的人"
  topicFileKeys: ["family", "people", "appearance", "emotions", "personality_traits", "parts_of_body"],
},
```

`key`（`"unit1"`）、`topicFileKeys` 陣列都不變，只改 `label` 字串。

## 不需要改的地方

- 徽章邏輯：`badge.unit_completion.unit1` 這個 ID 不變，只有它的 `name`／`description`／`condition` 顯示文字（content 端已同步改好，`content/badges/badges.json` 已完成）。
- 沒有任何程式邏輯依賴這個 label 字串做判斷（只用來顯示），所以不會有連鎖影響。

## 驗證

- `npx tsx scripts/verify-unit-completion-badges.ts`（這支腳本裡的 `UNITS` fixture 已同步改成「我和身邊的人」，若 `main.ts` 改完後兩邊文字不一致，這支腳本本身不會直接比對 label 字串，但建議順手確認兩邊一致）。
- `npm run build` 過即可。
- 建議跑一次 `node scripts/build-standalone-demo.mjs` 重新產生 `demo-standalone.html`，並記得同步覆蓋專案根目錄那份重複的 `demo-standalone.html`（`cp app/demo-standalone.html ../demo-standalone.html`）。
- 完成後在 `HANDOFF.md` 的 `### 9.59` 條目下方補一行「App 端已於 main.ts 執行完成」的記錄即可，不用開新編號。
