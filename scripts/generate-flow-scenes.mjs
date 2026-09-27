#!/usr/bin/env node
/**
 * scripts/generate-flow-scenes.mjs
 * 透過 Playwright CDP 連接本機已登入的 Google Chrome，
 * 自動在 Google Flow 填入提示詞、生成圖片、下載並自動入庫至 app/src/assets/scenes/
 */

import { chromium } from "./node_modules/playwright-core/index.mjs";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, "..");
const ASSETS_DIR = path.resolve(ROOT_DIR, "app/src/assets/scenes");
const QUEUE_FILE = path.resolve(__dirname, "flow-queue.json");
const ARTIFACT_DIR = "/Users/admin/.gemini/antigravity/brain/39ccceab-f435-40dd-b1bd-ca1b1395acae";

// 解析命令列參數
const args = process.argv.slice(2);
const options = {
  port: 9222,
  topic: null,
  filename: null,
  limit: null,
  dryRun: false,
};

for (const arg of args) {
  if (arg.startsWith("--port=")) options.port = parseInt(arg.split("=")[1], 10);
  else if (arg.startsWith("--topic=")) options.topic = arg.split("=")[1];
  else if (arg.startsWith("--filename=")) options.filename = arg.split("=")[1];
  else if (arg.startsWith("--limit=")) options.limit = parseInt(arg.split("=")[1], 10);
  else if (arg === "--dry-run") options.dryRun = true;
}

console.log("========================================================");
console.log("🎨 Google Flow 自動化生圖工具 (Playwright CDP)");
console.log("========================================================");
console.log(`🔌 目標 Chrome CDP 埠: http://localhost:${options.port}`);
console.log(`📂 目標資源庫: ${ASSETS_DIR}`);

// 1. 載入任務隊列
if (!fs.existsSync(QUEUE_FILE)) {
  console.error(`❌ 找不到隊列檔案: ${QUEUE_FILE}`);
  process.exit(1);
}

const rawQueue = JSON.parse(fs.readFileSync(QUEUE_FILE, "utf-8"));
const existingFiles = new Set(fs.readdirSync(ASSETS_DIR));

let tasks = rawQueue.filter((t) => !existingFiles.has(t.filename));

if (options.topic) {
  tasks = tasks.filter((t) => t.topic === options.topic);
}
if (options.filename) {
  tasks = tasks.filter((t) => t.filename === options.filename);
}
if (options.limit && options.limit > 0) {
  tasks = tasks.slice(0, options.limit);
}

console.log(`📋 待處理生圖任務數: ${tasks.length}`);
if (tasks.length > 0) {
  console.log("🎯 任務清單:");
  tasks.forEach((t, i) => console.log(`   ${i + 1}. [${t.topic}] ${t.filename} - ${t.title}`));
}

if (options.dryRun) {
  console.log("\n💡 --dry-run 模式：僅檢視任務清單，不執行瀏覽器連線。");
  if (tasks.length > 0) {
    console.log("\n第一筆任務 Prompt 預覽:");
    console.log(tasks[0].prompt);
  }
  process.exit(0);
}

if (tasks.length === 0) {
  console.log("🎉 沒有需要生成的任務！全數已存在或已被篩選排除。");
  process.exit(0);
}

// 2. 連接本機 Chrome CDP
let browser;
try {
  browser = await chromium.connectOverCDP(`http://localhost:${options.port}`);
  console.log("✅ 成功連線至本機 Chrome CDP！");
} catch (err) {
  console.error("\n❌ 無法連線至 Chrome CDP (http://localhost:" + options.port + ")");
  console.error("💡 請確認 Chrome 視窗已啟動。");
  process.exit(1);
}

// 3. 尋找或切換至 Google Flow 分頁
const contexts = browser.contexts();
let flowPage = null;

for (const ctx of contexts) {
  for (const page of ctx.pages()) {
    const url = page.url();
    if (url.includes("flow.google.com") || url.includes("labs.google")) {
      flowPage = page;
      break;
    }
  }
  if (flowPage) break;
}

if (!flowPage) {
  console.error("❌ 未在 Chrome 中找到 Google Flow (flow.google.com) 分頁！請先在 Chrome 視窗開啟專案。");
  process.exit(1);
}

await flowPage.bringToFront();
console.log(`🎯 當前控制分頁: ${await flowPage.title()} (${flowPage.url()})`);

console.log("\n🚀 開始自動生圖流程...");

for (let idx = 0; idx < tasks.length; idx++) {
  const task = tasks[idx];
  const targetPath = path.join(ASSETS_DIR, task.filename);
  console.log(`\n--------------------------------------------------------`);
  console.log(`▶ [${idx + 1}/${tasks.length}] 正在生成: ${task.filename}`);
  console.log(`   主題: ${task.topic}`);
  console.log(`   描述: ${task.description}`);
  console.log(`   Prompt: ${task.prompt}`);

  try {
    // 記錄當前頁面上已有的所有圖片網址，以便精準捕捉新生產的圖片
    const existingUrls = await flowPage.evaluate(() =>
      Array.from(document.querySelectorAll("img.image")).map((i) => i.src)
    );

    // 尋找 ProseMirror 輸入框
    const pm = flowPage.locator(".ProseMirror");
    await pm.waitFor({ state: "visible", timeout: 10000 });
    await pm.click();
    await pm.fill(task.prompt);
    await flowPage.waitForTimeout(600);

    // 尋找專屬生成按鈕（明確鎖定 button.generate-icon-button）
    const generateBtn = flowPage.locator("button.generate-icon-button, button[aria-label='開始生成']").first();
    await generateBtn.waitFor({ state: "visible", timeout: 15000 });

    // 等待按鈕解除 disabled 狀態（輸入完成後可能有一小段驗證延遲）
    for (let waitSec = 0; waitSec < 10; waitSec++) {
      const isDisabled = await generateBtn.evaluate((el) => el.classList.contains("mat-mdc-button-disabled") || el.hasAttribute("disabled"));
      if (!isDisabled) break;
      await flowPage.waitForTimeout(1000);
    }

    console.log("   👉 點擊「開始生成」按鈕...");
    await generateBtn.click();

    console.log("   ⏳ 等待 Google Flow AI 生成中 (通常約 15~35 秒)...");

    // 等待新生產的圖片出現
    const newImgHandle = await flowPage.waitForFunction(
      (oldUrls) => {
        const imgs = Array.from(document.querySelectorAll("img.image"));
        const brandNew = imgs.find(
          (img) => !oldUrls.includes(img.src) && img.naturalWidth > 100 && img.complete
        );
        return brandNew ? brandNew.src : null;
      },
      existingUrls,
      { timeout: 120000, polling: 1000 }
    );

    const newImgSrc = await newImgHandle.jsonValue();
    console.log(`   ✨ 偵測到新圖片生成完成！`);

    // 透過頁面 session 抓取圖片二進位資料
    console.log("   💾 正在自瀏覽器下載高解析度原圖...");
    const base64Info = await flowPage.evaluate(async (src) => {
      // 確保獲取最大解析度版本
      const highResSrc = src.includes("=") ? src.replace(/=s\d+.*$/, "=s2048-rw") : src;
      const resp = await fetch(highResSrc);
      const blob = await resp.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve({ type: blob.type, data: reader.result });
        reader.readAsDataURL(blob);
      });
    }, newImgSrc);

    if (!base64Info || !base64Info.data) {
      throw new Error("未能成功下載圖片二進位資料！");
    }

    const rawBuffer = Buffer.from(base64Info.data.split(",")[1], "base64");
    const isWebP = base64Info.type.includes("webp") || base64Info.data.startsWith("data:image/webp");

    if (isWebP) {
      const tempWebP = path.join("/tmp", `flow_temp_${Date.now()}.webp`);
      fs.writeFileSync(tempWebP, rawBuffer);
      // 使用 macOS 內建 sips 轉為高品質 JPEG
      execSync(`sips -s format jpeg "${tempWebP}" --out "${targetPath}" >/dev/null 2>&1`);
      try {
        fs.unlinkSync(tempWebP);
      } catch {}
    } else {
      fs.writeFileSync(targetPath, rawBuffer);
    }

    // 同步備份至 artifact 目錄供報告展示
    try {
      if (fs.existsSync(ARTIFACT_DIR)) {
        fs.copyFileSync(targetPath, path.join(ARTIFACT_DIR, task.filename));
      }
    } catch {}

    if (fs.existsSync(targetPath)) {
      const stats = fs.statSync(targetPath);
      console.log(`   🎉 成功入庫至: ${targetPath}`);
      console.log(`   📏 檔案大小: ${(stats.size / 1024).toFixed(1)} KB`);
    }

    // 冷卻間隔保護
    if (idx < tasks.length - 1) {
      console.log("   ☕ 間歇休息 3 秒...");
      await flowPage.waitForTimeout(3000);
    }
  } catch (err) {
    console.error(`   ❌ 生成失敗 [${task.filename}]:`, err.message);
  }
}

console.log("\n========================================================");
console.log("🏁 批次生成完成！正在觸發專案建置檢查...");
console.log("========================================================");

try {
  execSync("npm run typecheck && npm run build", { cwd: path.join(ROOT_DIR, "app"), stdio: "inherit" });
  console.log("\n🎉 前端 App 打包建置通過！所有新插畫已正式上線！");
} catch (e) {
  console.error("⚠️ 打包檢查時發生異常:", e.message);
}

// 關閉瀏覽器連線並退出進程，避免背景任務掛起
try {
  await browser.close();
} catch {}
process.exit(0);

