// 驗證「加入主畫面／安裝應用程式」固定 App 圖示的接線是否正確（見
// docs/handoff-prompt-app-icon-manifest.md）：
// - app/public/manifest.webmanifest 存在且欄位齊全，icons[].src 用相對路徑（沒有開頭斜線）。
// - app/index.html 的 <head> 裡有 favicon／apple-touch-icon／manifest／theme-color／
//   apple-mobile-web-app-* 這些標籤。
// - npm run build 之後，dist/ 底下真的有 favicon.ico／apple-touch-icon.png／
//   manifest.webmanifest／icons/icon-192.png／icons/icon-512.png，且 dist/index.html
//   裡的路徑已經被 Vite 的 base: "./" 設定正確改寫成相對路徑（不是還留著開頭斜線）。
// 這是純靜態檔案／HTML 標籤的檢查，不涉及任何執行期程式邏輯，不用改 main.ts。
// 手機「加入主畫面」之後主畫面圖示長怎樣、名稱有沒有被截斷、點開是不是全螢幕獨立視窗，
// 沒辦法在沒有手機的沙盒環境裡確認，需要使用者實測（見 handoff 文件第 3 點）。
// 用法：先 npm run build，再 npx tsx scripts/verify-app-icon-manifest.ts

import { existsSync, readFileSync } from "node:fs";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error("❌ " + message);
}

const manifestPath = new URL("../public/manifest.webmanifest", import.meta.url);
const indexHtmlPath = new URL("../index.html", import.meta.url);
const distIndexHtmlPath = new URL("../dist/index.html", import.meta.url);

// ---- 測試 1：app/public/ 底下的圖示檔案都存在。 ----
{
  const requiredFiles = [
    "../public/favicon.ico",
    "../public/apple-touch-icon.png",
    "../public/icons/favicon-16.png",
    "../public/icons/favicon-32.png",
    "../public/icons/icon-192.png",
    "../public/icons/icon-512.png",
  ];
  for (const relPath of requiredFiles) {
    assert(existsSync(new URL(relPath, import.meta.url)), `應該存在 app/${relPath.replace("../", "")}`);
  }
  console.log("✅ 測試 1 通過：app/public/ 底下的圖示檔案都齊全。");
}

// ---- 測試 2：manifest.webmanifest 內容正確，icons[].src 是相對路徑（沒有開頭斜線）。 ----
{
  assert(existsSync(manifestPath), "應該存在 app/public/manifest.webmanifest");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
  assert(manifest.name === "English for Kids - 每天玩一點英語！", "manifest 的 name 欄位不符預期");
  assert(manifest.short_name === "English for Kids", "manifest 的 short_name 欄位不符預期");
  assert(manifest.display === "standalone", "manifest 的 display 應該是 standalone（加入主畫面後全螢幕獨立視窗）");
  assert(Array.isArray(manifest.icons) && manifest.icons.length === 2, "manifest 的 icons 應該有 192／512 兩個尺寸");
  for (const icon of manifest.icons) {
    assert(
      !icon.src.startsWith("/"),
      `manifest icons[].src（${icon.src}）不應該用開頭斜線的絕對路徑，manifest 裡的路徑是相對於 manifest 檔案本身解析，開頭斜線在 GitHub Pages 子路徑下會指到錯誤的網域根目錄`
    );
  }
  console.log("✅ 測試 2 通過：manifest.webmanifest 內容正確，icons 用相對路徑。");
}

// ---- 測試 3：app/index.html 的 <head> 有齊全的圖示／manifest／PWA 相關標籤。 ----
{
  const indexHtml = readFileSync(indexHtmlPath, "utf-8");
  const requiredSnippets = [
    'rel="icon" type="image/x-icon" href="/favicon.ico"',
    'rel="apple-touch-icon" href="/apple-touch-icon.png"',
    'rel="manifest" href="/manifest.webmanifest"',
    'name="theme-color" content="#0052A3"',
    'name="apple-mobile-web-app-capable" content="yes"',
    'name="apple-mobile-web-app-title" content="English for Kids"',
  ];
  for (const snippet of requiredSnippets) {
    assert(indexHtml.includes(snippet), `app/index.html 的 <head> 應該包含：${snippet}`);
  }
  // apple-mobile-web-app-title 刻意用比較短的「English for Kids」，不是網頁 <title> 那串
  // 「每天玩一點 - English for Kids」，避免 iOS 主畫面名稱被截斷。
  assert(
    !indexHtml.includes('name="apple-mobile-web-app-title" content="每天玩一點'),
    "apple-mobile-web-app-title 不應該用完整網頁標題，主畫面名稱空間很窄，太長會被截斷"
  );
  console.log("✅ 測試 3 通過：app/index.html 的 <head> 標籤齊全。");
}

// ---- 測試 4：npm run build 之後，dist/ 底下有對應的靜態檔案，且路徑被正確改寫成相對路徑。 ----
{
  if (!existsSync(distIndexHtmlPath)) {
    console.log("⚠️ 測試 4 略過：找不到 dist/index.html，請先執行 npm run build 再跑這支腳本確認完整結果。");
  } else {
    const distFiles = [
      "../dist/favicon.ico",
      "../dist/apple-touch-icon.png",
      "../dist/manifest.webmanifest",
      "../dist/icons/icon-192.png",
      "../dist/icons/icon-512.png",
    ];
    for (const relPath of distFiles) {
      assert(existsSync(new URL(relPath, import.meta.url)), `build 之後應該存在 app/${relPath.replace("../", "")}`);
    }

    const distIndexHtml = readFileSync(distIndexHtmlPath, "utf-8");
    assert(
      distIndexHtml.includes('href="./favicon.ico"'),
      "dist/index.html 裡 favicon 的路徑應該被 Vite 的 base: \"./\" 設定改寫成相對路徑（./favicon.ico），不是還留著開頭斜線的絕對路徑"
    );
    assert(
      distIndexHtml.includes('href="./manifest.webmanifest"'),
      "dist/index.html 裡 manifest 的路徑應該被改寫成相對路徑（./manifest.webmanifest）"
    );
    assert(
      !distIndexHtml.includes('href="/favicon.ico"') && !distIndexHtml.includes('href="/manifest.webmanifest"'),
      "dist/index.html 不應該還殘留開頭斜線的絕對路徑，那樣在 GitHub Pages 子路徑下會指向錯誤位置"
    );

    console.log("✅ 測試 4 通過：dist/ 底下靜態檔案齊全，且路徑已正確改寫成相對路徑。");
  }
}

console.log("\n✅ 全部 App 圖示／manifest 接線驗證通過（手機「加入主畫面」的實際視覺效果仍需真機測試確認）。");
