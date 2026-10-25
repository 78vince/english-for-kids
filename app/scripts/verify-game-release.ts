// 公開版：驗證遊戲室同步與上架閘門（2026-10-25；LetsGo 有自己的版本，這支不在同步範圍）
//  1. content/games/games.json：欄位、status／kind 合法、頁面檔存在、payout 0
//  2. 建置清單：正式站（vite.config.ts）只打包 active 的遊戲頁；遊戲實驗室打包全部＋lab.html
//  3. 執行時閘門：gameRelease 一般模式只放行 active；我的角色卡片用 isGamePlayable；Boot 先 guardGamePage
//  4. 同步檔案都已轉換成公開版前綴（沒有 levelUnitReview）、沒有 ?test 後門
//  5. 若 dist/ 已建置：未上架的遊戲頁不在 dist/ 裡
// 用法：npx tsx scripts/verify-game-release.ts

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { gamePageInputs, inputKey, readGames } from "../gamePages";

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (p: string) => fs.readFileSync(path.resolve(APP, p), "utf-8");
function assert(c: unknown, m: string): void {
  if (!c) throw new Error("❌ " + m);
}

const games = readGames() as any[];
const ids = new Set<string>();
for (const g of games) {
  for (const k of ["id", "name", "description", "icon_placeholder", "kind", "page", "cost", "status", "order"]) assert(g[k] !== undefined, `${g.id} 缺 ${k}`);
  assert(!ids.has(g.id), `id 重複 ${g.id}`);
  ids.add(g.id);
  assert(["in_development", "coming_soon", "active", "disabled"].includes(g.status), `${g.id} status 不合法`);
  assert(["studio", "learning", "character"].includes(g.kind), `${g.id} kind 不合法`);
  assert(fs.existsSync(path.resolve(APP, g.page)), `${g.id} 的頁面 ${g.page} 不存在`);
  assert(g.payout === undefined || g.payout === 0, `${g.id} payout 必須是 0`);
}
console.log(`✅ games.json：${games.map((g) => `${g.id}=${g.status}`).join("、")}`);

const prod = gamePageInputs({ lab: false });
const lab = gamePageInputs({ lab: true });
for (const g of games) {
  if (g.status === "active") assert(prod[inputKey(g.id)] === g.page, `${g.id} 已上架但沒有被打包`);
  else assert(!Object.values(prod).includes(g.page), `${g.id}（${g.status}）不應被打包進正式站`);
  assert(lab[inputKey(g.id)] === g.page, `${g.id} 沒有被打包進遊戲實驗室`);
}
const vite = read("vite.config.ts");
assert(/gamePageInputs\(\{\s*lab:\s*false\s*\}\)/.test(vite) && /__LAB__:\s*JSON\.stringify\(false\)/.test(vite), "vite.config.ts 要用 gamePageInputs 並定義 __LAB__=false");
assert(!/["']games\/[a-z0-9-]+\.html["']/.test(vite.replace(/\/\/.*$/gm, "")), "vite.config.ts 不能寫死遊戲頁");
assert(/__LAB__:\s*JSON\.stringify\(false\)/.test(read("vite.standalone.config.ts")), "vite.standalone.config.ts 要定義 __LAB__=false");
assert(/outDir:\s*"dist-lab"/.test(read("vite.lab.config.ts")), "遊戲實驗室輸出到 dist-lab");
console.log(`✅ 建置清單：正式站 ${Object.keys(prod).length} 個遊戲頁、實驗室 ${Object.keys(lab).length} 個＋lab.html`);

(globalThis as any).window = { location: { replace: () => {} } };
const rel = await import("../src/gameRelease");
for (const g of games) assert(rel.isGamePlayable(g.id) === (g.status === "active"), `${g.id} 一般模式可玩判斷不對`);
const cards = read("src/myCharacterCards.ts");
assert(/isGamePlayable\(g\.id\)/.test(cards), "myCharacterCards 要用 isGamePlayable 篩選");
assert(/g\.kind === "learning" && isGameListed\(g\.id\)/.test(read("src/main.ts")), "遊戲室通用卡片只列 learning 類且經過 isGameListed");
for (const g of games.filter((x) => x.kind === "character")) {
  const boot = `src/games/${inputKey(g.id)}Boot.ts`;
  assert(fs.existsSync(path.resolve(APP, boot)) && read(boot).includes(`guardGamePage("${g.id}")`), `${boot} 要先呼叫 guardGamePage`);
}
console.log("✅ 執行時閘門：卡片、Boot 都有檢查");

const walk = (d: string): string[] =>
  fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : e.name.endsWith(".ts") ? [path.join(d, e.name)] : []));
for (const f of walk(path.resolve(APP, "src"))) {
  const s = fs.readFileSync(f, "utf-8");
  assert(!s.includes("levelUnitReview."), `${path.relative(APP, f)} 還有 LetsGo 的存檔前綴 levelUnitReview.`);
  if (f.includes(`${path.sep}games${path.sep}`)) assert(!/\.has\(\s*["']test["']\s*\)/.test(s), `${path.relative(APP, f)} 不能有 ?test 後門`);
}
console.log("✅ 存檔前綴都是 englishForKids.、沒有 ?test 後門");

// 本機 dist/ 只提醒、不擋：公開版 vite.config.ts 的 emptyOutDir 是 false，舊的頁面會留在本機 dist/；
// 正式站由 GitHub Actions 從乾淨環境重新建置（.github/workflows/deploy.yml），不會帶到舊檔。
const dist = path.resolve(APP, "dist");
if (fs.existsSync(path.join(dist, "index.html"))) {
  const stale = games.filter((g) => g.status !== "active" && fs.existsSync(path.join(dist, g.page))).map((g) => g.page);
  const missing = games.filter((g) => g.status === "active" && !fs.existsSync(path.join(dist, g.page))).map((g) => g.page);
  if (fs.existsSync(path.join(dist, "lab.html"))) stale.push("lab.html");
  if (stale.length || missing.length)
    console.log(`ℹ️  本機 dist/ 有舊檔 ${stale.join("、") || "無"}、缺 ${missing.join("、") || "無"}（正式站會重新建置，不影響；要清乾淨可刪掉 dist/ 再 build）`);
  else console.log("✅ dist/：只有已上架的遊戲頁");
}
console.log("\n全部通過");
