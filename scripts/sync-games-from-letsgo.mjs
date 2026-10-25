#!/usr/bin/env node
// 把 LetsGo（私有開發版）的遊戲室內容同步到公開版（2026-10-20 建立，2026-10-25 改版）。
// 由 sync-games-from-letsgo.sh（同步遊戲.command）呼叫：node scripts/sync-games-from-letsgo.mjs [LetsGo 路徑]
//
// 同步範圍（課程內容一律不碰）：
//   1. 遊戲清單：LetsGo content/games/games.json 裡 kind = studio／character、status = active 的遊戲
//      （開發中 in_development 的不會帶過來；公開版自己的學習小遊戲 learning 類維持公開版的設定）
//   2. 這些遊戲的程式：app/src/games/<名稱>.ts／.css／<名稱>Boot.ts、app/games/<頁面>.html
//   3. 共用遊戲框架 app/src/game/*、美術／數值套件 assets/game-tokens/*
//   4. 遊戲室共用模組：gameTokens.ts（代幣規則）、gameRelease.ts（上架閘門）、gamePages.ts（建置清單）、
//      遊戲實驗室（lab.html、src/lab/*、vite.lab.config.ts）、content/schema/game.schema.json
//
// 不同步（公開版自己的轉接檔）：storage.ts（只用 localStorage）、pin.ts（沒有密碼）、badgeRules.ts（不判定遊戲徽章）、
//   main.ts、myCharacterCards.ts（遊戲室卡片）、games/gameIcons.ts、style.css。
// 唯一的文字轉換：localStorage／IndexedDB 前綴 levelUnitReview. → englishForKids.（兩邊紀錄各自獨立）。
// 只新增／覆蓋，不刪檔；LetsGo 下架的遊戲會從公開版 games.json 移除，所以不會被打包。

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PUBLIC_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const LETSGO_DIR = path.resolve(process.argv[2] ?? path.join(PUBLIC_DIR, "..", "English for Kids LetsGo"));
const L = (...p) => path.join(LETSGO_DIR, ...p);
const P = (...p) => path.join(PUBLIC_DIR, ...p);

function fail(msg) {
  console.error("❌ " + msg);
  process.exit(1);
}
for (const p of ["content/games/games.json", "app/src/game/gameKit.ts", "assets/game-tokens/game-tokens.json", "app/src/gameRelease.ts"]) {
  if (!fs.existsSync(L(p))) fail(`找不到 ${L(p)}（LetsGo 資料夾位置對嗎？）`);
}
console.log(`從：${LETSGO_DIR}\n到：${PUBLIC_DIR}\n`);

const copied = [];
function copy(from, to) {
  fs.mkdirSync(path.dirname(to), { recursive: true });
  let data = fs.readFileSync(from);
  if (/\.(ts|mjs|js|html)$/.test(from) && !from.includes(`${path.sep}game-tokens${path.sep}`)) {
    data = Buffer.from(data.toString("utf-8").replace(/levelUnitReview\./g, "englishForKids."), "utf-8");
  }
  fs.writeFileSync(to, data);
  copied.push(path.relative(PUBLIC_DIR, to));
}
function copyDirFiles(fromDir, toDir) {
  for (const f of fs.readdirSync(fromDir)) {
    const src = path.join(fromDir, f);
    if (fs.statSync(src).isFile() && !f.startsWith(".")) copy(src, path.join(toDir, f));
  }
}
const camel = (id) => id.replace(/_([a-z])/g, (_, c) => c.toUpperCase());

// ---- 1. 遊戲清單 ----
const letsgoGames = JSON.parse(fs.readFileSync(L("content/games/games.json"), "utf-8"));
const synced = letsgoGames.filter((g) => (g.kind === "studio" || g.kind === "character") && g.status === "active");
const skipped = letsgoGames.filter((g) => (g.kind === "studio" || g.kind === "character") && g.status !== "active");
const publicGamesPath = P("content/games/games.json");
const publicGames = JSON.parse(fs.readFileSync(publicGamesPath, "utf-8"));
const learning = publicGames.filter((g) => (g.kind ?? "learning") === "learning");
const merged = [...synced.map((g) => ({ ...g })), ...learning].sort((a, b) => a.order - b.order);
fs.writeFileSync(publicGamesPath, JSON.stringify(merged, null, 2) + "\n");
copy(L("content/schema/game.schema.json"), P("content/schema/game.schema.json"));

// ---- 2. 遊戲程式與頁面 ----
for (const g of synced) {
  const name = camel(g.id);
  for (const ext of ["ts", "css"]) {
    if (fs.existsSync(L(`app/src/games/${name}.${ext}`))) copy(L(`app/src/games/${name}.${ext}`), P(`app/src/games/${name}.${ext}`));
  }
  if (fs.existsSync(L(`app/src/games/${name}Boot.ts`))) copy(L(`app/src/games/${name}Boot.ts`), P(`app/src/games/${name}Boot.ts`));
  copy(L("app", g.page), P("app", g.page));
}

// ---- 3. 框架與美術套件 ----
copyDirFiles(L("app/src/game"), P("app/src/game"));
copyDirFiles(L("assets/game-tokens"), P("assets/game-tokens"));

// ---- 4. 遊戲室共用模組、遊戲實驗室 ----
for (const f of ["app/src/gameTokens.ts", "app/src/gameRelease.ts", "app/gamePages.ts", "app/lab.html", "app/vite.lab.config.ts"]) copy(L(f), P(f));
copyDirFiles(L("app/src/lab"), P("app/src/lab"));

// ---- 檢查 ----
const problems = [];
const grepFiles = (dir) => fs.readdirSync(dir).filter((f) => f.endsWith(".ts")).map((f) => path.join(dir, f));
for (const f of [...grepFiles(P("app/src/game")), ...grepFiles(P("app/src/games")), P("app/src/gameTokens.ts")]) {
  if (fs.readFileSync(f, "utf-8").includes("levelUnitReview")) problems.push(`轉換後仍有 levelUnitReview：${path.relative(PUBLIC_DIR, f)}`);
}
const storageTs = fs.readFileSync(P("app/src/storage.ts"), "utf-8");
for (const fn of ["appStorage", "flushPending", "bootThen", "serverSyncEnabled", "getSyncStatus", "onSyncStatusChange"]) {
  if (!new RegExp(`export (const|function) ${fn}\\b`).test(storageTs)) problems.push(`公開版 storage.ts 缺少 ${fn}（LetsGo 的遊戲會用到，請在轉接檔補上）`);
}
const pinTs = fs.readFileSync(P("app/src/pin.ts"), "utf-8");
for (const fn of ["isLoginRemembered", "rememberLogin"]) if (!pinTs.includes(`export function ${fn}`)) problems.push(`公開版 pin.ts 缺少 ${fn}`);
// 同步過來的程式 import 了公開版自己的模組（storage、pin、speech、content…）：檢查名稱都有 export
const syncedTs = copied.filter((f) => f.endsWith(".ts") && f.startsWith("app/"));
const syncedSet = new Set(syncedTs.map((f) => path.resolve(PUBLIC_DIR, f)));
for (const rel of syncedTs) {
  const file = P(rel);
  const src = fs.readFileSync(file, "utf-8");
  for (const m of src.matchAll(/import\s+(?:type\s+)?\{([^}]*)\}\s+from\s+"(\.{1,2}\/[^"]+)"/g)) {
    const target = path.resolve(path.dirname(file), m[2]) + ".ts";
    if (syncedSet.has(target) || !target.startsWith(P("app/src"))) continue;
    if (!fs.existsSync(target)) {
      problems.push(`${rel} 需要 ${path.relative(PUBLIC_DIR, target)}，公開版沒有這個檔案`);
      continue;
    }
    const tsrc = fs.readFileSync(target, "utf-8");
    for (let name of m[1].split(",")) {
      name = name.replace(/^\s*type\s+/, "").split(/\s+as\s+/)[0].trim();
      if (!name) continue;
      if (!new RegExp(`export\\s+(async\\s+)?(function|const|let|class|type|interface|enum)\\s+${name}\\b`).test(tsrc))
        problems.push(`${rel} 需要 ${path.relative(PUBLIC_DIR, target)} 的 ${name}，公開版轉接檔沒有提供`);
    }
  }
}
const cards = fs.readFileSync(P("app/src/myCharacterCards.ts"), "utf-8");
const newGames = synced.filter((g) => g.kind === "character" && !new RegExp(`^\\s*${g.id}:`, "m").test(cards));
const tokenVersion = JSON.parse(fs.readFileSync(P("assets/game-tokens/game-tokens.json"), "utf-8")).meta.version;

console.log(`✅ 已同步 ${copied.length} 個檔案（game-tokens v${tokenVersion}）`);
console.log(`   遊戲：${synced.map((g) => g.name).join("、")}`);
if (skipped.length) console.log(`   沒有帶過來（LetsGo 還沒上架）：${skipped.map((g) => `${g.name}（${g.status}）`).join("、")}`);
if (newGames.length)
  console.log(`   ℹ️ 新遊戲 ${newGames.map((g) => g.name).join("、")} 在公開版遊戲室用通用卡片顯示；要顯示個人紀錄，請在 app/src/myCharacterCards.ts 的 DETAIL 加專屬寫法。`);
if (problems.length) {
  for (const p of problems) console.error("❌ " + p);
  process.exit(1);
}
console.log("   接下來：cd app && npm run build 檢查，沒問題再雙擊「上傳更新.command」。");
