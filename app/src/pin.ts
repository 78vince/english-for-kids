// 公開版轉接檔（2026-10-20）：LetsGo 有登入數字密碼與「記住登入 12 小時」，
// 公開版沒有密碼，遊戲頁（game/fullscreenPage.ts）只要有目前使用者就放行。
// 這個檔案不在同步範圍內；LetsGo 的 pin.ts（含密碼雜湊）絕對不要複製過來。
export function isLoginRemembered(): boolean {
  return true;
}

/** 2026-10-25：遊戲實驗室（lab.ts）會呼叫；公開版沒有密碼，什麼都不用記 */
export function rememberLogin(): void {
  // 不需要
}
