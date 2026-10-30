// 遊戲實驗室：統一按鍵 v2 ＋ 五種版面的測試頁（只在 vite.lab.config.ts 建置；docs/GAME-PRODUCTION-SPEC.md §6.3–6.4）。
// 用真的 VirtualPad({ v2: true })、GameScreen、StageController，在手機／平板／電腦上看版面與按鍵是否正確。
import "../game/gamePage.css";
import { GameArt, icon, type Look } from "../game/gameKit";
import { VirtualPad, type PadKey } from "../game/virtualPad";
import { StageController } from "../game/stageController";
import { GameScreen, SCREEN_LAYOUT_LABEL, type ScreenLayout } from "../game/gameScreen";
import { getActiveLook } from "../game/characterStore";
import { getActiveProfileId } from "../profile";

const root = document.getElementById("layout-demo")!;
document.body.style.margin = "0";
document.body.style.overflow = "hidden";
root.style.cssText = "position:fixed;inset:0";

if (!__LAB__) {
  root.innerHTML = `<p style="padding:24px">這一頁只在遊戲實驗室使用。<a href="index.html">回到 App</a></p>`;
} else {
  const pid = getActiveProfileId();
  const look: Look = (pid && getActiveLook(pid)) || GameArt.presets["kid-blue"];

  const back = document.createElement("a");
  back.className = "g-iconbtn g-h-stone";
  back.href = "lab.html";
  back.setAttribute("aria-label", "回遊戲實驗室");
  back.innerHTML = icon("back");
  const who = document.createElement("span");
  who.className = "g-chip";
  who.style.fontWeight = "900";
  who.textContent = "版面測試";
  const coins = document.createElement("span");
  coins.className = "g-chip";
  coins.innerHTML = `${icon("coin")}<span>120</span>`;
  const mode = document.createElement("button");
  mode.type = "button";
  mode.className = "g-iconbtn g-h-sky";
  mode.setAttribute("aria-label", "切換版面");
  mode.innerHTML = icon("settings");
  const strip = document.createElement("div");
  strip.className = "g-chip";
  strip.style.fontSize = "13px";

  // 版面：自動，或用右上角按鈕依序強制切換（只給測試用）
  const ORDER: (ScreenLayout | null)[] = [null, "phoneLand", "phonePort", "tabletLand", "tabletPort", "desktop"];
  let forced = 0;
  const pad = new VirtualPad({ v2: true });
  const screen = new GameScreen(root, {
    pad,
    hudLeft: [back, who],
    hudRight: [coins, mode],
    strip,
    forceLayout: () => ORDER[forced],
  });
  const stage = new StageController(screen.canvas, pad, { sceneId: "forest", look, view: "side", charH: 0.3 });

  // 三種按鍵情境：橫向動作（上下不用、C D 沒道具）／有道具（C D 啟用）／點按型（全部半透明）
  const PRESETS: { name: string; act: Partial<Record<PadKey, boolean>> }[] = [
    { name: "動作遊戲", act: { up: false, down: false, left: true, right: true, a: true, b: true, c: false, d: false } },
    { name: "拿到道具", act: { up: true, down: true, left: true, right: true, a: true, b: true, c: true, d: true } },
    { name: "點按遊戲", act: { up: false, down: false, left: false, right: false, a: false, b: false, c: false, d: false } },
  ];
  let preset = 0;
  const presetBtn = document.createElement("button");
  presetBtn.type = "button";
  presetBtn.className = "g-chip";
  presetBtn.style.cssText = "border:0;font:inherit;font-weight:900;cursor:pointer";
  screen.canvas.appendChild(presetBtn);
  presetBtn.style.cssText += ";position:absolute;left:8px;bottom:8px;z-index:20";

  const label = () => {
    const L = screen.layout;
    strip.textContent = `${SCREEN_LAYOUT_LABEL[L]}${forced ? "（強制）" : "（自動）"} · ${window.innerWidth}×${window.innerHeight}`;
    presetBtn.textContent = `按鍵：${PRESETS[preset].name}`;
  };
  const applyPreset = () => {
    pad.setActive(PRESETS[preset].act);
    label();
  };
  presetBtn.addEventListener("click", () => {
    preset = (preset + 1) % PRESETS.length;
    applyPreset();
  });
  mode.addEventListener("click", () => {
    forced = (forced + 1) % ORDER.length;
    screen.refresh(true);
  });
  screen.onLayoutChange = label;
  window.addEventListener("resize", label);
  applyPreset();
  void stage;
}
