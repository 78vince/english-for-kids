# Handoff：單元／主題完成度徽章改為要求 Stage D + Stage E 都完成

使用者確認：現在 Stage E（會話練習）已經全站 43 主題 100% 上線，且「挑戰紀錄」統計頁（`getStageRowsForTopic()`）已經把 Stage E 算進每個主題的完整關卡清單。但徽章判斷邏輯還停留在只看 Stage D，造成「進度看起來還沒完成，徽章卻已經解鎖」或反過來的認知落差。使用者明確要求：**單元/主題完成度徽章應該也要求做完 Stage E**，也就是 OB-03「初次過關」跟 WC-01~08 這一整組單元完成徽章，判斷條件要改成「Stage D 綜合關卡 **且** Stage E 會話練習都完成」。

`content/badges/badges.json` 裡 OB-03 跟 WC-01~08 的 `description`／`condition` 文字我已經直接改好了（改成提到「與 Stage E 會話練習」），這份 handoff 只需要處理 `app/src/main.ts` 的判斷邏輯本身。

## 1. 改 `computeCompletedStageDTopics()`（約第 4118-4124 行）

目前：

```ts
function computeCompletedStageDTopics(profileId: string): Set<string> {
  return new Set(
    availableTopics
      .filter((summary) => getStageProgress(profileId, summary.topic.fileKey, "capstone") !== null)
      .map((summary) => summary.topic.fileKey)
  );
}
```

改成（順便改名，因為現在的語意已經不是「完成 Stage D 的主題」，而是「完整完成這個主題」——含 Stage E）：

```ts
/** 「完整完成一個主題」現在的定義：Stage D 綜合關卡通過，且如果這個主題已經有
 * Stage E 會話練習內容，也要一併通過 Stage E。用 getConversationByTopic() 判斷
 * 「這個主題有沒有 Stage E 內容」是刻意寫成防呆條件——目前全部 43 個主題都已經有
 * Stage E，但如果未來又新增沒有 Stage E 的暫時性主題，不會因為卡在這裡而讓
 * 玩家永遠拿不到完成徽章。判斷方式跟 Stage D 完全一致：
 * getStageProgress(...) !== null 代表通過一次 finalizeRoundCompletion()／
 * recordStageCompletion()（Stage E 是在 conversationGame 全部回合答完時，透過
 * finalizeRoundCompletion("conversation", ...) 觸發，跟其餘關卡共用同一套
 * 記錄機制）。 */
function computeCompletedTopics(profileId: string): Set<string> {
  return new Set(
    availableTopics
      .filter((summary) => {
        const stageDDone = getStageProgress(profileId, summary.topic.fileKey, "capstone") !== null;
        if (!stageDDone) return false;
        const hasStageE = !!getConversationByTopic(summary.topic.fileKey);
        if (!hasStageE) return true;
        return getStageProgress(profileId, summary.topic.fileKey, "conversation") !== null;
      })
      .map((summary) => summary.topic.fileKey)
  );
}
```

`getConversationByTopic` 已經在檔案最上方 import 過了（第 15 行左右），不用新增 import。

## 2. 更新所有呼叫端的變數名稱

搜尋 `completedStageDTopics`（目前只在 `computeBadgeViewState()` 裡面被呼叫一次、存成一個變數再傳給後面兩個 case 用），把呼叫端也一併改名成 `completedTopics`，維持前後一致：

```ts
// 原本類似：
const completedStageDTopics = computeCompletedStageDTopics(activeProfile!.id);
// 改成：
const completedTopics = computeCompletedTopics(activeProfile!.id);
```

以及下面兩處使用到這個變數的地方（`case "onboarding"` 跟 `case "unit_completion"`），把 `completedStageDTopics` 全部改成 `completedTopics`：

```ts
// OB-03（first_stage_d）：
if (badge.id === "badge.onboarding.first_stage_d") {
  return { achieved: completedTopics.size > 0, blockedByMissingFeature: false };
}
```

```ts
// unit_completion（WC-01~08）：
const achieved = unitsToCheck.every((unit) =>
  unit.topicFileKeys.every(
    (fileKey) => availableTopics.some((t) => t.topic.fileKey === fileKey) && completedTopics.has(fileKey)
  )
);
```

`badge.onboarding.first_stage_d` 這個 id 字串本身不用改（改 id 會牽動 `content/badges/badges.json` 跟其他判斷式，範圍沒必要擴大），只是它現在代表的意思變成「Stage D 且 Stage E 都完成」。

## 3. 更新主題選單裡 Stage D／Stage E 的說明文字（約第 1606-1621 行）

現在的文字：

```ts
{
  label: "Stage D　綜合關卡",
  description: `混合單字、短句、短文的最終測驗，過關就算這個主題單元完成`,
  stageKey: "capstone",
  onSelect: goToCapstone,
},
```

`「過關就算這個主題單元完成」` 這句話現在不準確了（如果這個主題有 Stage E，還要再過 Stage E 才算完成）。改成：

```ts
{
  label: "Stage D　綜合關卡",
  description: `混合單字、短句、短文的最終測驗，過關再加上 Stage E 才算這個主題單元完成`,
  stageKey: "capstone",
  onSelect: goToCapstone,
},
```

如果這個主題有 Stage E（`topicConversation` 存在），Stage E 的說明文字也順便強調一下「完成度」的角色：

```ts
const topicConversation = getConversationByTopic(currentTopic.fileKey);
if (topicConversation) {
  items.push({
    label: "Stage E　會話練習",
    description: `與 ${topicConversation.character.name} 互動對話（共 ${topicConversation.turns.length * 2} 句），完成後這個主題單元才算全部通關`,
    stageKey: "conversation",
    onSelect: goToConversation,
  });
}
```

如果某個主題還沒有 Stage E 內容（`topicConversation` 是 `undefined`），Stage D 那句「加上 Stage E 才算完成」邏輯上就不精確——但因為 `computeCompletedTopics()` 已經用 `hasStageE` 防呆處理過（沒有 Stage E 的主題只看 Stage D 就算完成），這裡的文案落差只在極少數未來新增主題的過渡期存在，先不用為此寫條件式文案，等真的又出現沒有 Stage E 的主題再回來調整即可。

## 4. 重要：這會讓已經玩過的玩家「倒退」

徽章的 `achieved` 狀態是**每次都即時算出來的**，不是「解鎖過一次就永久記住」。也就是說：如果家裡小孩已經單靠 Stage D 拿到某個單元完成徽章（WC 系列）或 OB-03「初次過關」，這次修改上線後，這些徽章會**變回未解鎖**狀態，要等小孩補完對應主題的 Stage E 才會重新亮起來。

這是這次調整本來就會發生的正常結果（因為使用者明確要求「完成度」的定義要包含 Stage E），不是 bug，但麻煩上線前先跟我們家小孩說一聲「有一個新關卡要通關，之前拿到的幾個徽章會先暫時收起來，玩完新關卡就會拿回來」，避免小朋友以為是徽章不見了或系統壞掉。

## 5. 驗證

已經有現成的 `app/scripts/verify-unit-completion-badges.ts`，是實際呼叫 `main.ts` 邏輯（不是靜態比對字串）跑一系列情境測試 OB-02／OB-03／unit_completion 三種徽章。**這個腳本目前全部測試都還是只用 Stage D 資料在測，這次改動之後一定要回來更新它**，至少加入：

1. 只完成 Stage D、沒完成 Stage E 的主題 → `first_stage_d` 跟對應 `unit_completion` 都應該判斷為未達成（這是跟現在測試案例相反的新案例，務必加，不然舊測試會繼續通過但邏輯其實是錯的）。
2. Stage D 跟 Stage E 都完成 → 才判斷為達成。
3. 一個刻意模擬「沒有 Stage E 內容」的主題（例如測試裡假造一個 `getConversationByTopic` 回傳 `undefined` 的情境，或直接找目前確實沒有 Stage E 的主題來測，如果真的每個主題都有了就用 mock）只完成 Stage D 也要能正確判斷為達成（防呆 fallback）。

其餘既有測試（跨使用者隔離、單元有主題還沒上架等）維持不動，只是要確認它們的測試資料現在也要補上 Stage E 完成紀錄才會通過，不然這次改動下去這些舊測試會全部變成失敗。

除了這支腳本，也建議額外涵蓋：

1. `computeCompletedStageDTopics` 已經改名成 `computeCompletedTopics`，且內文有 `getConversationByTopic` 呼叫（確認真的檢查了 Stage E，不是只改名字沒改邏輯）。
2. 全檔案已經沒有 `completedStageDTopics` 這個舊變數名稱殘留（`grep -n "completedStageDTopics" app/src/main.ts` 應該要是空的）。
3. `badge.onboarding.first_stage_d` 跟 `unit_completion` 兩個 case 都是用 `completedTopics`（新名稱）判斷。

`npm run build` 要過；`npx tsx scripts/verify-*.ts`（全部）都要通過。手動測試建議：拿一個目前只做過 Stage D、還沒做 Stage E 的主題（或本機測試帳號故意只做 Stage D），確認：
- 該主題所屬單元的 WC 徽章卡片顯示「未達成」（灰階／鎖定樣式）。
- 補做完該主題 Stage E 後，重新整理挑戰紀錄／成就徽章頁，WC 徽章（如果單元其餘主題也都齊了）跟 OB-03 都會正確亮起來。
- 一個完全沒有 Stage E 內容的假設情境（如果找得到／方便暫時改一個主題測試）不會被卡住，只做 Stage D 一樣能算完成（防呆 fallback 有生效）。

完成後麻煩在 HANDOFF.md 記一節說明這次改動內容跟第 4 點提到的「舊徽章會暫時收回」的預期行為，方便之後回頭查。
