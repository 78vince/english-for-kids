// 驗證功能列（appendShell() 的 .function-nav）版面塞不下時的響應式設計：
// - 原本用固定的 @media (max-width: 640px) 斷點隱藏 .nav-item-label，但使用者
//   截圖回報過：寬度介於 640px 斷點跟桌面版版面之間時（例如瀏覽器視窗沒開滿版、
//   或內嵌在較窄的容器裡），文字標籤還是會被擠到跑版，卻沒被隱藏，因為那個
//   寬度大於 640px、斷點沒有觸發。
// - 修正做法：main.ts 的 updateNavCompactState() 直接量測 .function-nav 的
//   scrollWidth／clientWidth，塞不下就切上 .function-nav--compact class（CSS
//   隱藏 .nav-item-label 只留圖示），並用 ResizeObserver 動態監看，不管寬度
//   變窄的原因是什麼都能正確反應，不用再猜一個固定的像素數字。
// - main.ts 有幫每個 nav 按鈕（含登出）補上 title 屬性，文字說明沒有真的消失，
//   只是移到 title，滑鼠移過去／長按還是看得到。
// - .function-nav 仍然保留 flex-wrap: nowrap／overflow-x: auto（9.29 那次修正），
//   當極端窄寬度下 icon-only 都還放不下時的最後保險。
// main.ts／style.css 因為 import.meta.glob 沒辦法直接 import 執行，這裡用原始碼
// 字串比對，做法跟其他 verify-*.ts（例如 verify-menu-progress-tier.ts）一致。
// 用法：npx tsx scripts/verify-nav-responsive.ts

import { readFileSync } from "node:fs";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error("❌ " + message);
}

const mainTs = readFileSync(new URL("../src/main.ts", import.meta.url), "utf-8");
const styleCss = readFileSync(new URL("../src/style.css", import.meta.url), "utf-8");

// ---- 測試 1：style.css 用 .function-nav--compact class 隱藏 .nav-item-label，
//      不是綁死在固定的 @media 螢幕寬度斷點裡（那正是這次要修掉的舊做法）。 ----
{
  assert(
    styleCss.includes(".function-nav--compact .nav-item-label"),
    "應該要有 .function-nav--compact .nav-item-label 規則（動態切換 class 隱藏文字標籤）"
  );
  const compactLabelRule = styleCss.match(/\.function-nav--compact \.nav-item-label \{[^}]*\}/);
  assert(compactLabelRule !== null, "應該找得到 .function-nav--compact .nav-item-label 規則內容");
  assert(compactLabelRule![0].includes("display: none;"), ".function-nav--compact .nav-item-label 應該是 display: none");

  // 確認這條規則不是被包在 @media (max-width: ...) 裡面——舊做法的根本問題就是
  // 綁死一個固定像素斷點，這裡要確保它是一條不受螢幕寬度限制的一般規則。
  const mediaQueryBlocks = [...styleCss.matchAll(/@media\s*\([^{]*\{[\s\S]*?\n\}\n/g)];
  for (const block of mediaQueryBlocks) {
    assert(
      !block[0].includes(".function-nav--compact"),
      ".function-nav--compact 的規則不應該被包在任何固定寬度的 @media 斷點裡，要能被 JS 動態套用/移除"
    );
  }

  console.log("✅ 測試 1 通過：style.css 用 .function-nav--compact class（不是固定 @media 斷點）隱藏文字標籤。");
}

// ---- 測試 2：main.ts 有 updateNavCompactState()，量測 scrollWidth／clientWidth
//      並切換 .function-nav--compact class，且會先移除 class 才量測（避免用
//      「已經是 compact 狀態」的寬度誤判）。 ----
{
  assert(mainTs.includes("function updateNavCompactState"), "main.ts 應該要有 updateNavCompactState() 函式");
  assert(
    mainTs.includes('nav.classList.remove("function-nav--compact")'),
    "updateNavCompactState() 應該先移除 compact class，才能量出「文字標籤都顯示」時的真實內容寬度"
  );
  assert(
    /nav\.scrollWidth\s*>\s*nav\.clientWidth/.test(mainTs),
    "updateNavCompactState() 應該比較 nav.scrollWidth 跟 nav.clientWidth 來判斷塞不塞得下"
  );
  assert(
    mainTs.includes('nav.classList.toggle("function-nav--compact"'),
    "updateNavCompactState() 應該用 classList.toggle 切換 function-nav--compact class"
  );

  console.log("✅ 測試 2 通過：main.ts 的 updateNavCompactState() 正確量測寬度並切換 compact class。");
}

// ---- 測試 3：appendShell() 掛上 DOM 之後才呼叫 updateNavCompactState()（量寬度
//      需要先掛到 DOM 上），並用 ResizeObserver 動態監看，不是只在初始渲染時
//      判斷一次——這樣使用者拖動視窗、或容器尺寸改變時都能重新反應。 ----
{
  assert(
    mainTs.includes("new ResizeObserver"),
    "appendShell() 應該用 ResizeObserver 動態監看 .function-nav 的寬度變化"
  );

  const appendShellMatch = mainTs.match(/function appendShell\([\s\S]*?\n\}\n/);
  assert(appendShellMatch !== null, "應該找得到 appendShell() 函式內容");
  const appendShellBody = appendShellMatch![0];

  assert(
    appendShellBody.includes("app!.appendChild(nav)"),
    "appendShell() 應該把 nav 掛到 #app 上"
  );
  assert(
    appendShellBody.includes("updateNavCompactState(nav)"),
    "appendShell() 應該呼叫 updateNavCompactState(nav) 做初始判斷"
  );
  assert(
    appendShellBody.indexOf("app!.appendChild(nav)") < appendShellBody.indexOf("updateNavCompactState(nav)"),
    "updateNavCompactState(nav) 必須在 nav 掛上 DOM 之後才呼叫，量測寬度才會準確"
  );
  assert(
    appendShellBody.includes("navResizeObserver.observe(nav)"),
    "appendShell() 應該對 nav 呼叫 ResizeObserver 的 observe()，持續監看寬度變化"
  );

  console.log("✅ 測試 3 通過：appendShell() 掛上 DOM 後才量測，並用 ResizeObserver 持續監看。");
}

// ---- 測試 4：.function-nav 仍然保留 nowrap／overflow-x: auto（9.29 修正的保險機制），
//      當極端窄寬度連 icon-only 都放不下時的最後保險，這次改動不應該把它拿掉。 ----
{
  const functionNavRule = styleCss.match(/\.function-nav \{[^}]*\}/);
  assert(functionNavRule !== null, "應該找得到完整的 .function-nav 規則");
  assert(functionNavRule![0].includes("flex-wrap: nowrap;"), ".function-nav 應該仍然是 flex-wrap: nowrap");
  assert(functionNavRule![0].includes("overflow-x: auto;"), ".function-nav 應該仍然保留 overflow-x: auto 當保險");

  console.log("✅ 測試 4 通過：.function-nav 的 nowrap／overflow-x: auto 保險機制沒有被這次調整動到。");
}

// ---- 測試 5：.function-nav--compact 底下 .nav-item 本身沒有偷縮字級——專案先前
//      特別把全站字級加大過，塞不下要靠隱藏文字/縮小圖示/縮小內距解決，不是縮字。 ----
{
  const compactNavItemRule = styleCss.match(/\.function-nav--compact \.nav-item \{[^}]*\}/);
  assert(compactNavItemRule !== null, "應該找得到 .function-nav--compact .nav-item 規則");
  assert(
    !compactNavItemRule![0].includes("font-size"),
    ".function-nav--compact .nav-item 規則不應該縮小字級——專案先前特別把全站字級加大過"
  );

  console.log("✅ 測試 5 通過：compact 模式下 .nav-item 本身沒有偷縮字級。");
}

// ---- 測試 6：main.ts 真的幫每個 nav 按鈕（NAV_ITEMS 迴圈＋登出按鈕）補上 title 屬性，
//      文字標籤被隱藏之後，使用者還是能靠滑鼠移過去／長按看到這顆按鈕是做什麼的。 ----
{
  assert(mainTs.includes("btn.title = item.label;"), "NAV_ITEMS 迴圈組出來的按鈕應該要有 title = item.label");
  assert(mainTs.includes('logoutBtn.title = "登出";'), "登出按鈕應該要有 title = \"登出\"");

  console.log("✅ 測試 6 通過：main.ts 真的幫每個功能列按鈕（含登出）補上 title 屬性。");
}

console.log("\n✅ 全部功能列響應式設計驗證通過。");
