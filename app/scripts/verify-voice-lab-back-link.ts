// 驗證 Voice Lab（語音比較實驗室）的「返回學習主站」連結是相對路徑，不是絕對路徑。
// 背景：vite.config.ts 的 build.base 設成 "./"（相對路徑輸出），就是為了讓正式站可以
// 部署在 GitHub Pages 的專案子路徑（https://78vince.github.io/english-for-kids/），
// 不是網域根目錄。voiceLab.ts 這個連結原本寫死 href="/"，點下去會被導到網域根目錄
// （https://78vince.github.io/，帳號的 GitHub Pages 根頁面，不是這個學習平台），
// 等於連結失效——這支腳本就是要守住這個回歸，避免以後又不小心寫回絕對路徑。
// 用法：npx tsx scripts/verify-voice-lab-back-link.ts

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error("❌ " + message);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const voiceLabSrc = readFileSync(path.join(__dirname, "..", "src", "voiceLab.ts"), "utf-8");

const backLinkMatch = voiceLabSrc.match(/<a href="([^"]*)" class="lab-back-btn">/);
assert(!!backLinkMatch, "voiceLab.ts 應該要有一個 class=\"lab-back-btn\" 的 <a> 連結");

const href = backLinkMatch![1];
assert(
  href !== "/" && !href.startsWith("http"),
  `「返回學習主站」連結不應該是絕對路徑（實際是 "${href}"）——部署在 GitHub Pages 專案子路徑時，` +
    `絕對路徑會被導到網域根目錄，不是這個學習平台本身`
);
assert(
  href === "index.html",
  `「返回學習主站」連結應該是相對於目前頁面的 "index.html"（voice-lab.html 打包後跟 index.html ` +
    `在同一層目錄），實際是 "${href}"`
);

console.log('✅ Voice Lab 的「返回學習主站」連結是相對路徑 "index.html"，不是絕對路徑。');
