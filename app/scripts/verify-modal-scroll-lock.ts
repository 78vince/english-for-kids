// 驗證彈窗開啟期間鎖定背景捲動的接線是否正確（解決使用者回報：作答時往上滑動、
// 讓 .stage-banner 滑出畫面外，答完跳出「獲得新徽章」pop 時遮罩覆蓋不完整的問題，
// 見 docs/handoff-prompt-mobile-layout-round2.md 問題 3）。
//
// 這是純「原始碼接線是否正確」的靜態檢查（regex 比對 main.ts 原始碼字串），不是
// 真的模擬瀏覽器捲動行為——這類 iOS Safari 專屬的視覺 bug 沒辦法在沒有瀏覽器的
// 沙盒環境裡重現或驗證是否真的解決，需要使用者在真實 iOS Safari 上實測確認。
// 用法：npx tsx scripts/verify-modal-scroll-lock.ts

import { readFileSync } from "node:fs";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error("❌ " + message);
}

const mainTs = readFileSync(new URL("../src/main.ts", import.meta.url), "utf-8");

// ---- 測試 1：lockBodyScroll／unlockBodyScroll 函式存在，且用計數器（不是布林值）
//      管理鎖定狀態，並且有記錄／還原捲動位置。 ----
{
  assert(mainTs.includes("function lockBodyScroll(): void"), "應該要有 lockBodyScroll() 函式");
  assert(mainTs.includes("function unlockBodyScroll(): void"), "應該要有 unlockBodyScroll() 函式");
  assert(mainTs.includes("let modalScrollLockCount = 0;"), "應該用計數器（modalScrollLockCount）管理鎖定狀態，不是單純布林值");
  assert(mainTs.includes("let savedScrollY = 0;"), "應該要記錄開啟當下的捲動位置（savedScrollY），解鎖時才能還原");
  assert(
    mainTs.includes('document.body.style.position = "fixed"'),
    "lockBodyScroll() 應該用 position: fixed 鎖住 body（而不是只用 overflow: hidden，iOS Safari 常鎖不住）"
  );
  assert(
    mainTs.includes("window.scrollTo(0, savedScrollY)"),
    "unlockBodyScroll() 應該把捲動位置還原回開啟前記錄的 savedScrollY"
  );

  console.log("✅ 測試 1 通過：lockBodyScroll／unlockBodyScroll 函式存在，用計數器管理，且有記錄/還原捲動位置。");
}

// ---- 測試 2：appendModalShell()／appendBadgeUnlockModal() 開頭都呼叫 lockBodyScroll()。 ----
{
  const modalShellFn = mainTs.match(/function appendModalShell\(title: string\): HTMLElement \{[\s\S]*?\n\}/);
  assert(modalShellFn !== null, "應該找得到 appendModalShell() 函式定義");
  const modalShellBody = modalShellFn![0];
  const lockIndex = modalShellBody.indexOf("lockBodyScroll()");
  const overlayCreateIndex = modalShellBody.indexOf('document.createElement("div")');
  assert(lockIndex !== -1, "appendModalShell() 應該呼叫 lockBodyScroll()");
  assert(lockIndex < overlayCreateIndex, "appendModalShell() 應該在建立任何 DOM 節點之前就先呼叫 lockBodyScroll()");

  const badgeModalFn = mainTs.match(/function appendBadgeUnlockModal\(\): void \{[\s\S]*?\n\}/);
  assert(badgeModalFn !== null, "應該找得到 appendBadgeUnlockModal() 函式定義");
  const badgeModalBody = badgeModalFn![0];
  const badgeLockIndex = badgeModalBody.indexOf("lockBodyScroll()");
  const badgeOverlayCreateIndex = badgeModalBody.indexOf('document.createElement("div")');
  assert(badgeLockIndex !== -1, "appendBadgeUnlockModal() 應該呼叫 lockBodyScroll()");
  assert(
    badgeLockIndex < badgeOverlayCreateIndex,
    "appendBadgeUnlockModal() 應該在建立任何 DOM 節點之前就先呼叫 lockBodyScroll()"
  );

  console.log("✅ 測試 2 通過：appendModalShell()／appendBadgeUnlockModal() 開頭都呼叫 lockBodyScroll()。");
}

// ---- 測試 3：closeProfileDetailModal()／closeBadgeUnlockModal() 都呼叫 unlockBodyScroll()。 ----
{
  const closeProfileFn = mainTs.match(/function closeProfileDetailModal\(\): void \{[\s\S]*?\n\}/);
  assert(closeProfileFn !== null, "應該找得到 closeProfileDetailModal() 函式定義");
  assert(
    closeProfileFn![0].includes("unlockBodyScroll()"),
    "closeProfileDetailModal() 應該呼叫 unlockBodyScroll()，這是「變更頭像」「修改名稱」「首次進站提醒」共用的關閉函式"
  );

  const closeBadgeFn = mainTs.match(/function closeBadgeUnlockModal\(\): void \{[\s\S]*?\n\}/);
  assert(closeBadgeFn !== null, "應該找得到 closeBadgeUnlockModal() 函式定義");
  assert(
    closeBadgeFn![0].includes("unlockBodyScroll()"),
    "closeBadgeUnlockModal() 應該呼叫 unlockBodyScroll()"
  );

  console.log("✅ 測試 3 通過：closeProfileDetailModal()／closeBadgeUnlockModal() 都呼叫 unlockBodyScroll()。");
}

// ---- 測試 4：確認每個可能導致彈窗消失的路徑，都是透過同一個關閉函式（不是各自
//      直接改狀態變數＋render()，繞過鎖定/解鎖邏輯）。 ----
{
  // appendModalShell()：叉叉／點遮罩都呼叫 closeProfileDetailModal。
  const modalShellFn = mainTs.match(/function appendModalShell\(title: string\): HTMLElement \{[\s\S]*?\n\}/)![0];
  assert(
    modalShellFn.includes("closeProfileDetailModal()") || modalShellFn.includes("closeProfileDetailModal)"),
    "appendModalShell() 的遮罩點擊／叉叉關閉，應該都呼叫 closeProfileDetailModal"
  );

  // appendWelcomeNoticeModal()：確認鈕也呼叫 closeProfileDetailModal（不是自己直接改狀態）。
  const welcomeModalFn = mainTs.match(/function appendWelcomeNoticeModal\(\): void \{[\s\S]*?\n\}/);
  assert(welcomeModalFn !== null, "應該找得到 appendWelcomeNoticeModal() 函式定義");
  assert(
    welcomeModalFn![0].includes("closeProfileDetailModal"),
    "appendWelcomeNoticeModal() 的確認鈕應該呼叫 closeProfileDetailModal，共用同一套鎖定/解鎖機制"
  );

  // appendBadgeUnlockModal()：叉叉／點遮罩／「太棒了！」都呼叫 closeBadgeUnlockModal。
  const badgeModalFn = mainTs.match(/function appendBadgeUnlockModal\(\): void \{[\s\S]*?\n\}/)![0];
  const closeBadgeCallCount = (badgeModalFn.match(/closeBadgeUnlockModal/g) ?? []).length;
  assert(
    closeBadgeCallCount >= 3,
    `appendBadgeUnlockModal() 裡應該有至少 3 處呼叫 closeBadgeUnlockModal（叉叉／點遮罩／「太棒了！」按鈕），實際找到 ${closeBadgeCallCount} 處`
  );

  console.log("✅ 測試 4 通過：每個彈窗的關閉路徑（叉叉／點遮罩／確認鈕）都經過同一個關閉函式，鎖定/解鎖不會被繞過。");
}

console.log("\n✅ 全部彈窗背景捲動鎖定接線驗證通過（純原始碼靜態檢查，iOS Safari 實際效果仍需真機測試確認）。");
