// gameBridge.ts——遊戲室各獨立遊戲（iframe）跟主站（parent）之間的 postMessage 訊息格式。
// 訊息一律帶一個固定的 channel 欄位，parent／iframe 收到 message 事件時都要先檢查
// event.data?.channel 是不是這個值，避免跟瀏覽器擴充功能或其他來源送來的雜訊訊息搞混。
//
// 2026-09-29：翻牌配對架構升級 handoff——把遊戲從「跟主站共用 main.ts 的 DOM 渲染」
// 改成「獨立打包成自己的頁面，用 <iframe> 嵌進遊戲室畫面裡」，目的是之後想加更多元、
// 更複雜的遊戲類型時可以獨立開發打包，不用逼每一款新遊戲都遵守 main.ts 現在的純 DOM
// 操作寫法。遊戲進行中（翻牌、配對、過關）完全是遊戲自己的事，不需要跟 parent 溝通；
// 但「再玩一次」要扣代幣，代幣餘額跟扣款邏輯只存在於主站（parent）這邊，遊戲（iframe）
// 沒辦法自己決定/執行扣款，所以這個動作需要透過這裡定義的訊息協定橋接。
//
// parent 跟每一支獨立遊戲的進入點都要 import 這份型別定義，兩邊共用同一份型別，
// 不要各自寫字串常值，避免其中一邊打錯字漏接訊息。

export const GAME_BRIDGE_CHANNEL = "englishForKids.gameBridge.v1" as const;

/** 遊戲（iframe）→ 主站（parent）
 * 2026-09-30 填字遊戲（遊戲室第二款遊戲）新增："complete" 訊息多了一個選填的 stars
 * 欄位（1-3），給有「最高紀錄」機制的遊戲回報這次玩到的星等，parent 收到才呼叫
 * gameHighScores.ts 的 recordStars() 存檔——iframe 完全不知道 profile／localStorage
 * 這些概念存在，只負責把算好的星等數字送出去，跟代幣扣款走同一套「持久化狀態只存在
 * parent」的架構原則。翻牌配對沒有最高紀錄機制，送 "complete" 時不會帶這個欄位
 * （維持 undefined），parent 那邊看到沒有 stars 就不用做任何事。 */
export type GameToParentMessage =
  | { channel: typeof GAME_BRIDGE_CHANNEL; type: "ready" }
  | { channel: typeof GAME_BRIDGE_CHANNEL; type: "requestReplay" }
  | { channel: typeof GAME_BRIDGE_CHANNEL; type: "exitToRoom" }
  | { channel: typeof GAME_BRIDGE_CHANNEL; type: "complete"; stars?: number };

/** 主站（parent）→ 遊戲（iframe） */
export type ParentToGameMessage =
  | { channel: typeof GAME_BRIDGE_CHANNEL; type: "replayApproved" }
  | { channel: typeof GAME_BRIDGE_CHANNEL; type: "replayDenied" };
