// 角色小鎮（第一階段：小鎮骨架）— docs/plan-game-town.md
// - 有邊界的街道（StageController.bounds），角色左右走、跑、跳；建築目前是 token 色票的色塊佔位。
// - 走到門口：↑ 亮起，頭上出現提示，店名英文唸一次；**只有 ↑ 會進門**（A／空白照樣跳，不會進門）。
// - 進門：角色轉背面、原地走路 enterMs（1 秒）後才換頁。
// - 點建築：角色自己走過去，到了就進去。
// - 街道兩端是盡頭（樹籬）：鏡頭停在 camRange 內，角色可以繼續走到畫面邊緣（StageController.camRange）。
// - 造型店、服裝店、配件店、道具店：在小鎮裡開店內畫面（townShop.ts），離開後角色從門口走出來。
// - 其他地點（家、廣場、照相館、城門）暫時打開角色工作室對應分頁（tokens town.places[].link），工作室返回時回到小鎮同一個位置。
// - 只讀角色、不改存檔；不扣代幣、不發代幣。
import "../game/gamePage.css";
import "./town.css";
import { GameArt, GameTokens, icon, nightFilterCss, performablePoses, SEQUENCE_ONLY_POSES, type Look } from "../game/gameKit";
import { storeEnabled } from "../game/homeStore";
import { TownCamera, creatureExtras, domExtras, type CameraText } from "../game/townPhoto";
import { updateStats } from "../game/lookShop";
import { getActiveLook, loadCharacter } from "../game/characterStore";
import {
  leaveTo,
  preventZoomGestures,
  requireActiveProfileId,
  returnTarget,
  toast,
  tryFullscreenOnFirstTap,
  TOWN_FROM_KEY,
} from "../game/fullscreenPage";
import { flushPending } from "../storage";
import { getTokenBalance } from "../gameTokens";
import { COIN_ICON } from "./gameIcons";
import { unlockSpeech } from "../speech";
import { playBlip, playDoorOpen, playKnock, playPlaceChime, playStep, setTownSfxMuted, setTownSfxVolume, townSfxMuted, unlockTownSfx } from "../game/townSfx";
import { VirtualPad, type PadKey } from "../game/virtualPad";
import { GameScreen } from "../game/gameScreen";
import { StageController } from "../game/stageController";
import { ScenePlay } from "../game/scenePlay";
import { TownGallery, type GalleryCfg } from "../game/townGallery";
import { LAB_MODE } from "../gameRelease";
import { TownShop, type ShopLines, type ShopPlaceInfo } from "./townShop";
import { findItem, isOwned, purchase, sceneTrialRule, sceneTrialsLeft, useSceneTrial } from "../game/shopStore";

type PlaceKind = "portal" | "home" | "shop" | "stage" | "photo" | "mystery";
interface TownPlace {
  id: string;
  label: string;
  en: string;
  x: number;
  kind: PlaceKind;
  hue: string;
  say?: string;
  link: { tab: string; cat?: string; scene?: string };
  /** 還沒開放（神秘的房間）：按 ↑ 只會敲門、顯示 lockedText */
  locked?: boolean;
  lockedText?: string;
  /** 建築道具（token props，state day／night 或 propState）；沒有＝佔位造型（神秘的房間） */
  prop?: string;
  propState?: string;
  /** 先不開放：街上不顯示、不能進去（2026-11-04 照相館、廣場舞台） */
  hidden?: boolean;
  labOnly?: boolean;
  /** 有 shop＝在小鎮裡開店內畫面（第二階段 2a）；沒有＝暫接角色工作室（link） */
  shop?: ShopPlaceInfo["shop"];
  /** 美術館：走進展覽大廳看自己拍的照片 */
  gallery?: GalleryCfg;
  /** 廣場舞台：站上去表演動作（不進門） */
  stage?: { hello: { en: string; zh: string }; text: Record<"title" | "hint" | "seq" | "leave" | "enterHint", string> };
}
interface TownConfig {
  sceneId: string;
  hideLayers: string[];
  time: number;
  charH: number;
  length: number;
  bounds: [number, number];
  camRange: [number, number];
  startX: number;
  enterRange: number;
  enterMs: number;
  places: TownPlace[];
  shopLines: ShopLines;
  lamps: number[];
  /** 城門後方的大背景（森林樹林、湖、墓碑） */
  backdrops: { prop: string; x: number }[];
  /** 前面的樹叢（scale＝倍率） */
  frontDecor: { prop: string; x: number; scale?: number }[];
  timeMode?: "system" | "fixed";
  sfx: { walkMs: number; runMs: number; runSpeed: number; volume: number };
  scenes: {
    exitX: number;
    startX: number;
    exits: Record<string, string>;
    upExit: string[];
    text: { back: string; backEn: string; exitHint: string; trialEnd: string };
  };
  enterFx: { scale: number };
  camera: { aspect: string; text: CameraText };
  text: { enter: string; enterHint: string; knockHint?: string; walkHint: string; comingSoon: string };
}

const CFG = (GameTokens as unknown as { town: TownConfig }).town;
const POS_KEY = "townX";
/** 街上看得到的地點（hidden＝先不開放：不畫、不能進去） */
// labOnly＝開發中的地點（例如家具店）：只在遊戲實驗室或 token home.features.store 打開時出現
const PLACES = CFG.places.filter((p) => !p.hidden && (!p.labOnly || storeEnabled()));

const profileId = requireActiveProfileId();
const appEl = document.getElementById("town-app");

function esc(t: string): string {
  return t.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

function ssGet(k: string): string | null {
  try {
    return sessionStorage.getItem(k);
  } catch {
    return null;
  }
}
function ssSet(k: string, v: string): void {
  try {
    sessionStorage.setItem(k, v);
  } catch {
    // 忽略（私密模式）
  }
}

if (profileId && appEl && CFG) start(profileId, appEl);

function start(pid: string, root: HTMLElement): void {
  preventZoomGestures();
  tryFullscreenOnFirstTap();
  window.addEventListener("pointerdown", () => unlockSpeech(), { once: true, capture: true });
  // 音效：第一次點畫面或按鍵時才能啟動（iOS 自動播放限制）
  window.addEventListener("pointerdown", () => unlockTownSfx(), { capture: true });
  window.addEventListener("keydown", () => unlockTownSfx(), { capture: true });
  setTownSfxVolume(CFG.sfx?.volume ?? 0.5);

  let look: Look = getActiveLook(pid) ?? GameArt.presets["kid-blue"];
  const ch = loadCharacter(pid);
  const name = ch?.slots[ch.activeSlot]?.name ?? "小夥伴";

  // ---- 按鍵：↑ 只在門口亮；C／D 沒有道具 → 半透明 ----
  const pad = new VirtualPad({ v2: true });
  pad.setActive({ up: false, down: true, left: true, right: true, a: true, b: true, c: false, d: false });

  // ---- HUD ----
  const backBtn = document.createElement("button");
  backBtn.type = "button";
  backBtn.className = "g-iconbtn town-back";
  backBtn.setAttribute("aria-label", "返回");
  backBtn.innerHTML = icon("back");

  const who = document.createElement("div");
  who.className = "town-who";
  who.innerHTML = `<span class="town-who-avatar">${GameArt.avatar(look, 40)}</span>
    <span class="town-who-text"><strong class="g-t-heading">${esc(name)}</strong></span>`;

  const coins = document.createElement("span");
  coins.className = "g-chip town-coins";
  coins.innerHTML = `${COIN_ICON(22)}<span class="g-t-number">${getTokenBalance(pid)}</span>`;

  root.innerHTML = "";
  const soundBtn = document.createElement("button");
  soundBtn.type = "button";
  soundBtn.className = "g-iconbtn town-sound";
  const renderSound = () => {
    soundBtn.innerHTML = icon(townSfxMuted() ? "mute" : "sound");
    soundBtn.setAttribute("aria-label", townSfxMuted() ? "打開音效" : "關掉音效");
  };
  renderSound();
  soundBtn.addEventListener("click", () => {
    setTownSfxMuted(!townSfxMuted());
    renderSound();
  });
  const screen = new GameScreen(root, { pad, hudLeft: [backBtn, who], hudRight: [coins, soundBtn] });

  const stage = new StageController(screen.canvas, pad, { sceneId: CFG.sceneId, look, view: "side", charH: CFG.charH });
  stage.setTime(CFG.timeMode === "system" ? { kind: "system" } : { kind: "fixed", u: CFG.time });
  stage.bounds = CFG.bounds;
  stage.camRange = CFG.camRange;
  stage.propPeriod = CFG.length + 4; // 不平鋪
  stage.el.classList.add("town-stage");
  stage.stretchLayers = true;
  // 跳躍／落地音效、蓄力跳；主題場景的互動道具（第三階段 3b-1，scenePlay.ts）
  const play = new ScenePlay(stage, pad, toast, {
    balance: () => getTokenBalance(pid),
    // 萬聖節傳送門：巨大南瓜怪大作戰（玩完回小鎮）
    goPumpkinBoss: () => {
      ssSet(TOWN_FROM_KEY, returnTarget());
      void flushPending().finally(() => window.location.assign("pumpkin-boss.html?from=town"));
    },
  });
  stage.el.style.setProperty("--town-enter-scale", String(CFG.enterFx?.scale ?? 0.8));
  stage.el.style.setProperty("--town-enter-ms", `${CFG.enterMs}ms`);
  for (const n of CFG.hideLayers) stage.el.classList.add(`town-hide-${n}`);

  // ---- 街景（遠景屋頂＋人行道＋馬路；日夜兩疊，跟鏡頭捲動） ----
  type TownLay = { el: HTMLDivElement; night: boolean; f: number };
  const townLays: TownLay[] = [];
  {
    const Ld = GameArt.townLayers("day", 960, 540);
    const Ln = GameArt.townLayers("night", 960, 540);
    const props = stage.world.querySelector(".gstage-props");
    const mk = (html: string, z: number, f: number, night: boolean) => {
      const d = document.createElement("div");
      d.className = "town-lay"; // 不用 gstage-lay：StageController 換場景時會清掉 .gstage-lay
      d.style.zIndex = String(z);
      d.innerHTML = html + html;
      if (night) d.style.opacity = "0";
      stage.world.insertBefore(d, props);
      townLays.push({ el: d, night, f });
    };
    mk(Ld.far, 5, 0.15, false);
    mk(Ln.far, 5, 0.15, true);
    mk(Ld.ground, 7, 1, false);
    mk(Ln.ground, 7, 1, true);
  }

  // ---- 建築圖層（token 道具；放在道具與角色後面）。1em＝舞台高 1%，道具 1 單位＝角色高／170 ----
  const UNIT_EM = (CFG.charH * 100) / 170;
  const propSize = (id: string): [number, number] => (GameArt.props.find((x) => x.id === id)?.size as [number, number]) ?? [180, 230];
  const bldLayer = document.createElement("div");
  bldLayer.className = "town-blds";
  bldLayer.style.zIndex = "8";
  stage.world.insertBefore(bldLayer, stage.world.querySelector(".gstage-props"));
  const blds = new Map<string, HTMLDivElement>();
  for (const p of PLACES) {
    const b = document.createElement("div");
    b.className = `town-bld town-bld--${p.kind}`;
    b.dataset.id = p.id;
    b.style.setProperty("--h", `var(--g-${p.hue})`);
    b.style.setProperty("--hs", `var(--g-${p.hue}-soft)`);
    b.style.setProperty("--hd", `var(--g-${p.hue}-deep)`);
    b.style.setProperty("--hl", `var(--g-${p.hue}-ledge)`);
    b.setAttribute("role", "button");
    b.setAttribute("aria-label", `${p.label}（${p.en}）`);
    if (p.prop) {
      const [w] = propSize(p.prop);
      b.classList.add("town-bld--art", `town-bld--${p.prop}`);
      b.style.width = `${(w * UNIT_EM).toFixed(2)}em`;
      // 建築上不放招牌：名稱只在角色靠近時的提示泡泡顯示（2026-11-02 使用者要求）
      b.innerHTML = `<div class="town-art"></div>`;
    } else
      b.innerHTML = `<div class="town-roof"></div>
           <div class="town-body">
             <div class="town-row"><span class="town-win"></span><span class="town-door">${p.kind === "mystery" ? `<span class="town-q">?</span>` : ""}</span><span class="town-win"></span></div>
           </div>`;
    b.addEventListener("click", () => walkTo(p));
    bldLayer.appendChild(b);
    blds.set(p.id, b);
  }
  // 街道兩端的盡頭（樹籬），中心放在 x＝0 與 x＝length
  const ends: { x: number; el: HTMLDivElement }[] = [0, CFG.length].map((x) => {
    const el = document.createElement("div");
    el.className = "town-end";
    el.setAttribute("aria-hidden", "true");
    el.innerHTML = `<span class="town-bush town-bush--a"></span><span class="town-bush town-bush--b"></span><span class="town-bush town-bush--c"></span>`;
    bldLayer.appendChild(el);
    return { x, el };
  });

  // ---- 城門後方的大背景（最底層）與前面的樹叢（最上層，仍在角色後面） ----
  type Deco = { x: number; el: HTMLDivElement; half: number };
  const decos: Deco[] = [];
  const mkDeco = (prop: string, x: number, scale: number, front: boolean) => {
    const el = document.createElement("div");
    el.className = `town-deco${front ? " town-deco--front" : ""}`;
    el.setAttribute("aria-hidden", "true");
    const w = propSize(prop)[0] * UNIT_EM * scale;
    el.style.width = `${w.toFixed(2)}em`;
    el.innerHTML = GameArt.prop(prop);
    if (front) bldLayer.appendChild(el);
    else bldLayer.insertBefore(el, bldLayer.firstChild);
    decos.push({ x, el, half: (w / 2) * (stage.height / 100) });
  };
  for (const d of [...CFG.backdrops].reverse()) mkDeco(d.prop, d.x, 1, false);
  for (const d of CFG.frontDecor) mkDeco(d.prop, d.x, d.scale ?? 1, true);

  // ---- 路燈（建築之間；夜晚亮燈） ----
  const lamps = CFG.lamps.map((x) => {
    const el = document.createElement("div");
    el.className = "town-lamp";
    el.setAttribute("aria-hidden", "true");
    el.style.width = `${(propSize("streetLamp")[0] * UNIT_EM).toFixed(2)}em`;
    bldLayer.insertBefore(el, bldLayer.firstChild);
    return { x, el };
  });
  /** 依日夜重畫建築與路燈（夜晚窗戶、路燈亮） */
  let litNight: boolean | null = null;
  function drawArt(): void {
    const st = litNight ? "night" : "day";
    for (const p of PLACES) {
      if (!p.prop) continue;
      const box = blds.get(p.id)!.querySelector(".town-art");
      if (box) box.innerHTML = GameArt.prop(p.prop, { state: p.propState ?? st });
    }
    for (const lp of lamps) lp.el.innerHTML = GameArt.prop("streetLamp", { state: st });
  }

  // ---- 門口提示 ----
  const bubble = document.createElement("div");
  bubble.className = "g-bubble town-bubble";
  bubble.hidden = true;
  stage.hud.appendChild(bubble);

  // ---- 狀態 ----
  let near: TownPlace | null = null;
  let entering = false;
  let auto: TownPlace | null = null;
  let lastW = 0;
  let lastX = Number(ssGet(POS_KEY));
  if (!Number.isFinite(lastX) || lastX <= 0) lastX = CFG.startX;
  const spokenAt = new Map<string, number>();
  /** 剛離開的店（不播店名，直到角色走離這個門口） */
  let quietAt: string | null = null;

  function releaseAuto(): void {
    if (!auto) return;
    auto = null;
    pad.down.left = pad.down.right = pad.down.b = false;
  }

  function walkTo(p: TownPlace): void {
    if (entering) return;
    if (Math.abs(p.x - stage.worldX) < CFG.enterRange * 0.5) {
      enter(p);
      return;
    }
    auto = p;
  }

  function setNear(p: TownPlace | null): void {
    if (p === near) return;
    near = p;
    if (!p || p.id !== quietAt) quietAt = null;
    pad.setActive({ up: !!p });
    for (const [id, el] of blds) el.classList.toggle("is-near", !!p && id === p.id);
    if (p) {
      const hint = p.locked ? CFG.text.knockHint ?? "按 ↑ 敲門" : p.stage ? p.stage.text.enterHint : CFG.text.enterHint;
      bubble.innerHTML = `<strong class="town-pop-en">${esc(p.en)}</strong><span class="town-pop-zh">${esc(p.label)}</span><span class="town-pop-hint g-tag">${esc(hint)}</span>`;
      bubble.hidden = false;
      // 每個地點都一樣：先「叮咚」，再用同一個英文語音唸名稱（同一地點 4 秒內不重複）
      const now = performance.now();
      // 剛從這間店走出來：店長的告別語音還在唸，不播店名（走離門口後才恢復）
      if (p.id === quietAt) {
        // 不播
      } else if (now - (spokenAt.get(p.id) ?? -1e9) > 4000) {
        spokenAt.set(p.id, now);
        playPlaceChime(); // 不唸店名（2026-11-04 使用者要求），只留提示音
      }
    } else bubble.hidden = true;
  }

  /** 還沒開放的地點：轉背面敲門，顯示提示，不會進去 */
  function knock(p: TownPlace): void {
    entering = true;
    releaseAuto();
    pad.setEnabled(false);
    setNear(null);
    stage.setView("back");
    stage.perform(GameArt.poses.includes("wave") ? "wave" : "idle");
    playKnock();
    toast(`${icon("lock")} ${esc(p.lockedText ?? "還沒開門喔")}`, 3000, p.hue);
    window.setTimeout(() => {
      stage.perform(null);
      stage.setView("side");
      entering = false;
      pad.setEnabled(true);
    }, 1200);
  }

  function enter(p: TownPlace): void {
    if (entering) return;
    if (p.locked) return knock(p);
    if (camera.isOn) camera.toggle(false);
    if (p.stage) return openPlaza(p);
    entering = true;
    releaseAuto();
    pad.setEnabled(false);
    ssSet(POS_KEY, String(p.x));
    ssSet(TOWN_FROM_KEY, returnTarget());
    setNear(null);
    // 轉背面、原地走路約 1 秒（像走進門裡）：門打開、角色縮小到 0.8 並淡出、開門聲＋腳步聲，再進店／換頁
    stage.setView("back");
    stage.perform("walk");
    const bld = blds.get(p.id)!;
    bld.classList.add("is-open");
    if (bld.querySelector(".g-door")) playDoorOpen();
    stage.el.classList.add("is-entering");
    stepsFor(CFG.enterMs);
    if (p.shop) {
      window.setTimeout(() => openShop(p), CFG.enterMs);
      return;
    }
    if (p.gallery) {
      window.setTimeout(() => void enterGallery(p), CFG.enterMs);
      return;
    }
    if (p.link.scene && CFG.scenes) {
      const sid = p.link.scene;
      window.setTimeout(() => void enterScene(p, sid), CFG.enterMs);
      return;
    }
    const q = new URLSearchParams({ from: "town", tab: p.link.tab });
    if (p.link.cat) q.set("cat", p.link.cat);
    if (p.link.scene) q.set("scene", p.link.scene);
    window.setTimeout(() => {
      void flushPending().finally(() => window.location.assign(`character-studio.html?${q.toString()}`));
    }, CFG.enterMs);
  }

  // ================= 主題場景（第三階段 3a）：在小鎮頁裡直接換成森林／海底世界／夜光墓園／宇宙空間 =================
  let scene: { id: string; from: TownPlace; trialEnds: number; timer: number } | null = null;
  const backTownBtn = document.createElement("button");
  backTownBtn.type = "button";
  backTownBtn.className = "gbtn g-h-mint town-back-town";
  backTownBtn.hidden = true;
  backTownBtn.innerHTML = `${icon("home")}<span>${esc(CFG.scenes?.text.back ?? "回小鎮")}</span>`;
  backTownBtn.setAttribute("aria-label", CFG.scenes?.text.back ?? "回小鎮");
  backTownBtn.addEventListener("click", () => void exitScene(true)); // 按鈕：直接回去，不播背面走路的過場
  // 右上角：相機＋回小鎮
  const hudTR = document.createElement("div");
  hudTR.className = "town-hud-tr";
  stage.hud.appendChild(hudTR);
  const camera = new TownCamera({
    stage,
    pad,
    pid,
    text: CFG.camera.text,
    where: () => (scene ? { sceneId: scene.id } : { sceneId: "town", hideLayers: CFG.hideLayers }),
    extras: () => {
      if (scene) return [...creatureExtras(stage), ...play.photoExtras()];
      // 街上：小鎮自己的街景（遠景屋頂、馬路）與建築、路燈、樹叢（都在角色後面）
      const lays = [...stage.world.querySelectorAll<SVGSVGElement>(".town-lay > svg")];
      const bld = [...bldLayer.querySelectorAll<SVGSVGElement>("svg")].filter((v) => !v.parentElement?.closest("svg"));
      return domExtras(stage.el, [...lays, ...bld], "under");
    },
    onToggle: (on) => {
      if (on) closePlaza();
    },
  });
  hudTR.append(camera.button, backTownBtn);
  const trialChip = document.createElement("span");
  trialChip.className = "g-chip town-trial";
  trialChip.hidden = true;
  stage.hud.appendChild(trialChip);

  /** 從城門出來（回到小鎮）：門口恢復、角色出現 */
  function resumeStreet(p: TownPlace): void {
    stage.perform(null);
    stage.setView("side");
    stage.el.classList.remove("is-entering");
    blds.get(p.id)?.classList.remove("is-open");
    entering = false;
    pad.setEnabled(true);
  }

  /** 沒買的場景：買下來／試玩 30 秒／不要 */
  function askScene(sid: string): Promise<"buy" | "trial" | "no"> {
    const it = findItem("scene", sid)!;
    const left = sceneTrialsLeft(pid, sid);
    const rule = sceneTrialRule();
    const bal = getTokenBalance(pid);
    const name = GameArt.sceneInfo[sid]?.label ?? sid;
    return new Promise((resolve) => {
      const ov = document.createElement("div");
      ov.className = "gmodal";
      ov.innerHTML = `<div class="gmodal-card" role="dialog" aria-modal="true" style="align-items:center;text-align:center">
        <p class="g-t-heading">${icon("lock")} ${esc(name)}</p>
        <p class="g-t-body">這個地方要買下來才能一直玩：${COIN_ICON(20)}${it.price}（你有 ${bal} 個代幣）</p>
        <p class="g-t-caption">${left > 0 ? `也可以先試玩 ${rule.seconds} 秒（今天還可以試 ${left} 次）` : "今天的試玩次數用完了，明天可以再試"}</p>
        <div class="gmodal-actions">
          <button type="button" class="gbtn gbtn--quiet" data-v="no">${icon("close")} 不要</button>
          ${left > 0 ? `<button type="button" class="gbtn g-h-sky" data-v="trial">${icon("timer")} 試玩</button>` : ""}
          <button type="button" class="gbtn g-h-sun" data-v="buy"${bal >= it.price ? "" : " disabled"}>${COIN_ICON(20)} 買下來</button>
        </div></div>`;
      ov.addEventListener("click", (e) => {
        const b = (e.target as HTMLElement).closest<HTMLButtonElement>("button[data-v]");
        if (!b || b.disabled) return;
        ov.remove();
        resolve(b.dataset.v as "buy" | "trial" | "no");
      });
      document.body.appendChild(ov);
    });
  }

  async function enterScene(p: TownPlace, sid: string): Promise<void> {
    let trialEnds = 0;
    if (findItem("scene", sid) && !isOwned(pid, "scene", sid)) {
      stage.el.classList.remove("is-entering"); // 先讓角色回來，問完再進去
      const c = await askScene(sid);
      if (c === "no") return resumeStreet(p);
      if (c === "buy") {
        const r = purchase(pid, findItem("scene", sid)!);
        if (!r.ok && r.reason === "tokens") {
          toast(`${COIN_ICON(22)} 再多 ${r.need} 個代幣就能買囉！`, 2400, "sky");
          return resumeStreet(p);
        }
        coins.querySelector(".g-t-number")!.textContent = String(getTokenBalance(pid));
        toast(`${icon("sparkle")} 買到「${esc(GameArt.sceneInfo[sid]?.label ?? sid)}」了！`, 2400, "mint");
      } else {
        if (!useSceneTrial(pid, sid)) return resumeStreet(p);
        trialEnds = Date.now() + sceneTrialRule().seconds * 1000;
      }
      stage.el.classList.add("is-entering");
    }
    // 收起小鎮（街景、建築、隱藏圖層規則），換成場景
    for (const n of CFG.hideLayers) stage.el.classList.remove(`town-hide-${n}`);
    stage.el.classList.add("town-in-scene");
    stage.bounds = [CFG.scenes.exitX - 0.05, 1e6];
    stage.camRange = null;
    stage.setCharX(0.5);
    await stage.setScene(sid);
    // 出口門＋從工作室搬來的試玩場域（宇宙空間：第一顆小行星在出生點腳下）
    play.start(sid, [{ id: "townGate", x: CFG.scenes.exitX, state: CFG.scenes.exits[sid] ?? "forest" }], stage.inSpace ? CFG.scenes.startX : CFG.scenes.startX + 0.3);
    stage.setWorldX(CFG.scenes.startX);
    scene = { id: sid, from: p, trialEnds, timer: 0 };
    backTownBtn.hidden = false;
    if (trialEnds) {
      trialChip.hidden = false;
      scene.timer = window.setInterval(() => {
        const left = Math.max(0, Math.ceil((trialEnds - Date.now()) / 1000));
        trialChip.innerHTML = `${icon("timer", "sm")}<span class="g-t-number">${left}</span>`;
        if (left <= 0) {
          toast(`${icon("timer")} ${esc(CFG.scenes.text.trialEnd)}`, 2600, "sun");
          void exitScene();
        }
      }, 250);
    }
    const up = CFG.scenes.upExit.includes(sid);
    pad.setActive({ up: !up || false, down: true });
    stage.perform(null);
    stage.setView("side");
    stage.el.classList.remove("is-entering");
    entering = false;
    pad.setEnabled(true);
  }

  // 按鈕回小鎮的過場：整個舞台淡出、換回街上、再淡入（2026-11-05 使用者要求）
  const fadeEl = document.createElement("div");
  fadeEl.className = "town-fade";
  fadeEl.setAttribute("aria-hidden", "true");
  stage.el.appendChild(fadeEl);
  const FADE_MS = 280;
  function fadeTo(on: boolean): Promise<void> {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    fadeEl.classList.toggle("is-on", on);
    return new Promise((r) => setTimeout(r, reduce ? 0 : FADE_MS));
  }

  /** instant＝按「回小鎮」／返回鈕：不播轉背面走路的過場，改成淡出淡入（2026-11-05 使用者要求）；走到出口按 ↑ 才播走路過場 */
  async function exitScene(instant = false): Promise<void> {
    if (!scene || entering) return;
    const sc = scene;
    entering = true;
    pad.setEnabled(false);
    clearInterval(sc.timer);
    trialChip.hidden = true;
    backTownBtn.hidden = true;
    bubble.hidden = true;
    if (!instant) {
      stage.setView("back");
      stage.perform("walk");
      stage.el.classList.add("is-entering");
      stepsFor(600);
      await new Promise((r) => setTimeout(r, 600));
    } else {
      stage.perform(null);
      await fadeTo(true);
    }
    scene = null;
    if (gallery) {
      // 美術館：拆掉展廳、恢復街上的時間與相機
      gallery.destroy();
      gallery = null;
      stage.el.classList.remove("town-in-gallery");
      stage.setTime(CFG.timeMode === "system" ? { kind: "system" } : { kind: "fixed", u: CFG.time });
      camera.button.style.display = "";
      pad.setEnabled(true);
    } else {
      play.stop();
      stage.setProps([]);
      stage.propPeriod = CFG.length + 4;
      stage.el.classList.remove("town-in-scene");
      for (const n of CFG.hideLayers) stage.el.classList.add(`town-hide-${n}`);
      await stage.setScene(CFG.sceneId);
    }
    stage.bounds = CFG.bounds;
    stage.camRange = CFG.camRange;
    stage.setWorldX(sc.from.x);
    lastX = sc.from.x;
    pad.setActive({ down: true });
    quietAt = sc.from.id;
    resumeStreet(sc.from);
    near = null;
    if (instant) void fadeTo(false);
  }

  /** 場景裡每幀：出口門的提示 */
  function sceneFrame(): void {
    if (!scene) return;
    if (gallery) return galleryFrame();
    const atExit = Math.abs(stage.worldX - CFG.scenes.exitX) < CFG.enterRange;
    const upOk = CFG.scenes.upExit.includes(scene.id);
    if (upOk) pad.setActive({ up: atExit });
    if (atExit && !entering) {
      if (bubble.hidden) {
        bubble.innerHTML = `<strong class="town-pop-en">${esc(CFG.scenes.text.backEn)}</strong><span class="town-pop-zh">${esc(CFG.scenes.text.back)}</span>${upOk ? `<span class="town-pop-hint g-tag">${esc(CFG.scenes.text.exitHint)}</span>` : ""}`;
        bubble.hidden = false;
      }
      const W = stage.width;
      const bw = bubble.offsetWidth / 2 + 8;
      bubble.style.left = `${Math.round(Math.max(bw, Math.min(W - bw, stage.propScreenX(stage.props[0]))))}px`;
      bubble.style.top = `${Math.round(Math.max(bubble.offsetHeight + 12, stage.height * 0.3))}px`;
    } else bubble.hidden = true;
  }

  // ================= 美術館：自己拍的照片像畫作一樣掛在展覽大廳 =================
  let gallery: TownGallery | null = null;
  let galleryModal = false;
  async function enterGallery(p: TownPlace): Promise<void> {
    const G = p.gallery!;
    stage.el.classList.add("town-in-gallery");
    stage.setTime({ kind: "fixed", u: 0.25 }); // 室內：一直是白天的燈光
    camera.button.style.display = "none"; // .g-iconbtn 的 display 會蓋掉 [hidden]
    gallery = new TownGallery(stage, pid, G, (len) => {
      stage.bounds = [G.exitX - 0.05, len];
      stage.camRange = [0.5, Math.max(0.5, len - 0.5)];
      if (stage.worldX > len) stage.setWorldX(len);
    });
    stage.bounds = [G.exitX - 0.05, G.exitX + 1.2];
    stage.camRange = [0.5, 0.5];
    stage.setWorldX(G.exitX + 0.22);
    await gallery.load();
    scene = { id: "gallery", from: p, trialEnds: 0, timer: 0 };
    backTownBtn.hidden = false;
    pad.setActive({ up: false, down: true });
    stage.perform(null);
    stage.setView("side");
    stage.el.classList.remove("is-entering");
    entering = false;
    pad.setEnabled(true);
    playPlaceChime();
    toast(`${icon("image")} ${esc(G.text.hello)}`, 2400, p.hue);
  }
  function galleryFrame(): void {
    if (!gallery || !scene) return;
    const G = scene.from.gallery!;
    // 看大圖時角色不動
    const m = gallery.modalOpen;
    if (m !== galleryModal) {
      galleryModal = m;
      pad.setEnabled(!m);
    }
    const n = gallery.frame(stage.worldX);
    pad.setActive({ up: !!n });
    const a = !entering && !m ? gallery.anchorOf(n) : null;
    if (!a || !n) {
      bubble.hidden = true;
      return;
    }
    bubble.innerHTML =
      n.kind === "exit"
        ? `<strong class="town-pop-en">${esc(CFG.scenes.text.backEn)}</strong><span class="town-pop-zh">${esc(CFG.scenes.text.back)}</span><span class="town-pop-hint g-tag">${esc(G.text.exitHint)}</span>`
        : `<strong class="town-pop-en">No.${n.idx + 1}</strong><span class="town-pop-hint g-tag">${esc(G.text.viewHint)}</span>`;
    bubble.hidden = false;
    const W = stage.width;
    const bw = bubble.offsetWidth / 2 + 8;
    bubble.style.left = `${Math.round(Math.max(bw, Math.min(W - bw, a.x)))}px`;
    bubble.style.top = `${Math.round(Math.max(bubble.offsetHeight + 12, a.top - 8))}px`;
  }

  // ================= 廣場舞台：站上去表演動作（同工作室的動作分頁） =================
  let plaza: { p: TownPlace; el: HTMLDivElement; spot: HTMLDivElement; perf: string | null } | null = null;
  function plazaHtml(): string {
    if (!plaza) return "";
    const T = plaza.p.stage!.text;
    const cur = plaza.perf;
    const poses = performablePoses().map((x) => `<button type="button" class="studio-pose" data-pose="${x}" aria-pressed="${cur === x}">${esc(GameTokens.motion.poses[x]?.label ?? x)}</button>`);
    const seqs = GameArt.sequences
      .filter((q) => !SEQUENCE_ONLY_POSES.includes(q))
      .map((q) => `<button type="button" class="studio-pose studio-pose--seq" data-seq="${q}" aria-pressed="${cur === "seq:" + q}">${icon("play", "sm")}${esc(GameTokens.motion.sequences[q]?.label ?? q)}</button>`);
    return `<div class="town-perform-head"><p class="g-t-label">${icon("sparkle", "sm")} ${esc(T.title)}</p><button type="button" class="gbtn gbtn--quiet town-perform-leave" data-act="leave">${icon("close", "sm")}${esc(T.leave)}</button></div>
      <p class="g-t-caption">${esc(T.hint)}</p>
      <div class="studio-poses town-poses">${poses.join("")}</div>
      <p class="g-t-label town-perform-seq">${esc(T.seq)}</p>
      <div class="studio-poses town-poses">${seqs.join("")}</div>`;
  }
  function openPlaza(p: TownPlace): void {
    if (plaza) return;
    releaseAuto();
    const el = document.createElement("div");
    el.className = "town-perform";
    el.setAttribute("role", "group");
    el.setAttribute("aria-label", p.stage!.text.title);
    const spot = document.createElement("div");
    spot.className = "town-spot";
    spot.setAttribute("aria-hidden", "true");
    stage.hud.append(spot, el);
    plaza = { p, el, spot, perf: null };
    el.innerHTML = plazaHtml();
    el.addEventListener("click", (e) => {
      const b = (e.target as HTMLElement).closest<HTMLButtonElement>("button");
      if (!b || !plaza) return;
      if (b.dataset.act === "leave") return closePlaza();
      const key = b.dataset.pose ?? (b.dataset.seq ? `seq:${b.dataset.seq}` : null);
      if (key) perform(key);
    });
    el.addEventListener("keydown", (e) => e.stopPropagation());
    bubble.hidden = true;
    stage.setView("front");
    playPlaceChime();
    toast(`${icon("sparkle")} ${esc(p.stage!.hello.en)}　${esc(p.stage!.hello.zh)}`, 2200, p.hue);
  }
  function perform(key: string): void {
    if (!plaza) return;
    if (plaza.perf === key) return stopPerform();
    plaza.perf = key;
    if (key.startsWith("seq:")) stage.playSequence(key.slice(4));
    else {
      stage.perform(key);
      // 「動作達人」徽章：記下演過的動作（跟工作室一樣存在角色存檔）
      const badges = updateStats(pid, (d) => {
        const tried = d.stats.posesTried ?? (d.stats.posesTried = []);
        if (tried.includes(key)) return false;
        tried.push(key);
        if (!d.stats.poseMasterDone && performablePoses().every((x) => tried.includes(x))) d.stats.poseMasterDone = true;
        return true;
      });
      for (const b of badges) toast(`${icon("trophy")} 獲得新徽章：${esc(b)}`, 3200, "lilac");
    }
    playBlip("tap");
    plaza.el.innerHTML = plazaHtml();
  }
  function stopPerform(): void {
    if (!plaza) return;
    plaza.perf = null;
    stage.perform(null);
    stage.playSequence(null);
    plaza.el.innerHTML = plazaHtml();
  }
  function closePlaza(): void {
    if (!plaza) return;
    if (plaza.perf) {
      stage.perform(null);
      stage.playSequence(null);
    }
    plaza.el.remove();
    plaza.spot.remove();
    plaza = null;
    stage.setView("side");
    near = null; // 讓門口提示重新出現
  }

  function openShop(p: TownPlace): void {
    stage.perform(null);
    new TownShop(root, pid, p as ShopPlaceInfo, look, CFG.shopLines, (next, newName) => {
      if (newName) who.querySelector(".town-who-text strong")!.textContent = newName;
      // 離開店裡：換上新造型、從門口走出來（正面一下再轉側面）；店長正在說再見，不再播店名
      quietAt = p.id;
      look = next;
      stage.setLook(look);
      who.querySelector(".town-who-avatar")!.innerHTML = GameArt.avatar(look, 40);
      coins.querySelector(".g-t-number")!.textContent = String(getTokenBalance(pid));
      stage.setView("front");
      stage.el.classList.remove("is-entering");
      window.setTimeout(() => {
        stage.setView("side");
        blds.get(p.id)?.classList.remove("is-open");
        entering = false;
        pad.setEnabled(true);
      }, 450);
    }, { night: !!litNight }); // 我的家：窗外景色、燈跟著小鎮的日夜
  }

  /** 進門時原地走路的腳步聲 */
  function stepsFor(ms: number): void {
    const n = Math.max(1, Math.floor(ms / CFG.sfx.walkMs));
    for (let i = 0; i < n; i++) window.setTimeout(() => playStep(false), 120 + i * CFG.sfx.walkMs);
  }

  // ---- 走路／跑步腳步聲：在地上移動時依速度（每 walkMs／runMs）響一步 ----
  let stepT = 0;
  let prevX = stage.worldX;
  function footsteps(dt: number): void {
    const x = stage.worldX;
    const v = dt > 0 ? Math.abs(x - prevX) / dt : 0;
    prevX = x;
    if (entering || v < 0.05 || stage.isAirborne) {
      stepT = 0;
      return;
    }
    const run = v > CFG.sfx.runSpeed;
    stepT -= dt * 1000;
    if (stepT <= 0) {
      playStep(run);
      stepT = run ? CFG.sfx.runMs : CFG.sfx.walkMs;
    }
  }

  pad.on((k: PadKey, down: boolean) => {
    if (!down || entering) return;
    // 舞台上：開始移動、跳、蹲＝停止表演
    if (plaza?.perf && (k === "left" || k === "right" || k === "a" || k === "down")) stopPerform();
    if (plaza && k === "up") return;
    if (auto && k !== "a") releaseAuto();
    if (scene && gallery) {
      const n = gallery.near;
      if (k === "up" && n?.kind === "exit") void exitScene();
      else if (k === "up" && n?.kind === "photo") gallery.open(n.idx);
      return;
    }
    if (scene) {
      if (k === "up" && CFG.scenes.upExit.includes(scene.id) && Math.abs(stage.worldX - CFG.scenes.exitX) < CFG.enterRange) void exitScene();
      return;
    }
    if (k === "up" && near) enter(near);
  });

  // ---- 每幀：建築位置、門口判斷、自動走路 ----
  function frame(): void {
    if (scene) {
      const W0 = stage.width;
      if (W0 !== lastW) {
        lastW = W0;
        stage.setWorldX(lastX);
      }
      lastX = stage.worldX;
      sceneFrame();
      return;
    }
    const W = stage.width;
    if (W !== lastW) {
      lastW = W;
      stage.setWorldX(lastX);
      bldLayer.style.fontSize = `${stage.height / 100}px`; // 1em＝舞台高 1%
    }
    const wx = stage.worldX;
    lastX = wx;
    // 鏡頭中心（走到盡頭時停住）：街景、建築都依鏡頭位置擺放
    const camC = Math.max(CFG.camRange[0], Math.min(CFG.camRange[1], wx));
    const night = stage.skyState.night;
    for (const L of townLays) {
      const off = camC * W * L.f;
      L.el.style.transform = `translateX(${Math.round(-(((off % W) + W) % W))}px)`;
      if (L.night) L.el.style.opacity = night.toFixed(3);
    }
    const isNight = night > 0.5;
    if (isNight !== litNight) {
      litNight = isNight;
      drawArt();
    }
    bldLayer.style.filter = nightFilterCss(night);
    for (const d of decos) {
      const sx = (d.x - camC) * W + W * 0.5;
      d.el.style.display = sx > -W * 0.6 && sx < W * 1.6 ? "" : "none";
      d.el.style.transform = `translateX(${Math.round(sx)}px) translateX(-50%)`;
    }
    for (const lp of lamps) {
      const sx = (lp.x - camC) * W + W * 0.5;
      lp.el.style.display = sx > -W * 0.2 && sx < W * 1.2 ? "" : "none";
      lp.el.style.transform = `translateX(${sx.toFixed(1)}px) translateX(-50%)`;
    }
    for (const p of PLACES) {
      const el = blds.get(p.id)!;
      const sx = (p.x - camC) * W + W * 0.5;
      const vis = sx > -W * 0.4 && sx < W * 1.4;
      el.style.display = vis ? "" : "none";
      if (vis) el.style.transform = `translateX(${sx.toFixed(1)}px) translateX(-50%)`;
    }
    // 鏡頭中心（走到盡頭時停住）：建築依鏡頭位置擺放
    const cam = Math.max(CFG.camRange[0], Math.min(CFG.camRange[1], wx));
    for (const e of ends) e.el.style.transform = `translateX(${((e.x - cam) * W + W * 0.5).toFixed(1)}px) translateX(-50%)`;
    if (auto) {
      const d = auto.x - wx;
      if (Math.abs(d) < 0.015) {
        const p = auto;
        releaseAuto();
        enter(p);
      } else {
        pad.down.right = d > 0;
        pad.down.left = d < 0;
        pad.down.b = Math.abs(d) > 0.6;
      }
    }
    let best: TownPlace | null = null;
    for (const p of PLACES) {
      const d = Math.abs(p.x - wx);
      if (d < CFG.enterRange && (!best || d < Math.abs(best.x - wx))) best = p;
    }
    if (!entering) setNear(best);
    if (camera.isOn) bubble.hidden = true;
    if (plaza) {
      bubble.hidden = true;
      // 走離舞台：收起動作面板
      if (Math.abs(plaza.p.x - wx) > CFG.enterRange * 1.6) closePlaza();
      else plaza.spot.style.setProperty("--spot-x", `${(stage.charX * 100).toFixed(2)}%`);
    }
    // 提示泡泡跟著角色（走到街道盡頭時角色不在畫面中間）；不超出畫面
    // 提示泡泡固定在這棟建築的上緣（不蓋住建築）；不超出畫面
    if (!bubble.hidden && near) {
      const el = blds.get(near.id)!;
      const art = (el.querySelector(".town-art svg") as Element | null) ?? el;
      const sr = stage.el.getBoundingClientRect();
      const r = art.getBoundingClientRect();
      const bw = bubble.offsetWidth / 2 + 8;
      const cx = r.left + r.width / 2 - sr.left;
      bubble.style.left = `${Math.round(Math.max(bw, Math.min(W - bw, cx)))}px`;
      bubble.style.top = `${Math.round(Math.max(bubble.offsetHeight + 12, r.top - sr.top - 6))}px`;
    }
  }
  stage.onTick = (dt) => {
    frame();
    play.tick();
    footsteps(dt);
  };
  frame();

  backBtn.addEventListener("click", () => {
    if (scene) return void exitScene(true); // 在場景裡：返回＝回小鎮（不播過場）
    releaseAuto();
    ssSet(POS_KEY, String(CFG.startX));
    stage.destroy();
    pad.destroy();
    screen.destroy();
    void leaveTo(returnTarget());
  });

  toast(esc(CFG.text.walkHint), 3600, "sky");
  // 從工作室回來時頁面可能是從 bfcache 復原：重新整理狀態
  window.addEventListener("pageshow", (e) => {
    if ((e as PageTransitionEvent).persisted) location.reload();
  });
  // 除錯掛勾只在遊戲實驗室（上架版不暴露內部狀態）
  if (LAB_MODE && new URLSearchParams(location.search).has("debug")) (window as unknown as Record<string, unknown>).__town = { stage, pad, CFG, play };
}
