// 垂直攀爬舞台引擎（treeStageController.ts）
// 負責「爬樹」遊戲的物理、樹枝單向平台、鏡頭推進、視差背景分塊、障礙/道具管理與降落傘演出。
// 所有數值完全取自 GameTokens.treeClimb，嚴禁硬寫數值。

import { GameArt, GameTokens, Look, PoseController, TreeBranch } from "./gameKit";
import { PadKey } from "./virtualPad";

export interface TreeLevelConfig {
  id: string;
  label: string;
  timeSec: number;
  gapMax: number;
  obstacleScale: number;
  allow: string[];
  brittle: boolean;
}

export interface TreeObstacle {
  id: string;
  kind: string; // caterpillar, birdFoe, bee, acorn, balloonCluster, gust, meteor
  x: number;
  startX: number;
  alt: number;
  startAlt: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  started: boolean;
  warnTimer: number;
  active: boolean;
  timer: number;
  flip?: boolean;
  branchId?: string;
  animState?: string;
}

export interface TreeItem {
  id: string;
  kind: "hourglass" | "cape" | "acorn";
  x: number;
  alt: number;
  w: number;
  h: number;
  collected: boolean;
}

export interface TreeStageCallbacks {
  onHeightChange(meters: number, maxMeters: number): void;
  onHourglassCollect(remainSecondsAdded: number): void;
  onCapeCollect(): void;
  onCapeUsed(): void;
  onHit(kind: string): void;
  onSummit(): void;
  onFallOut(): void;
  onLandAfterFall(meters: number): void;
  onJump?(): void;
  onBounce?(): void;
  onBrittleCrack?(): void;
}

export class TreeStageController {
  private readonly container: HTMLElement;
  private readonly stageEl: HTMLDivElement;
  private readonly svgBgEl: SVGSVGElement;
  private readonly branchesGroupEl: SVGGElement;
  private readonly entitiesGroupEl: SVGGElement;
  private readonly playerGroupEl: SVGGElement;
  private readonly playerRootEl: SVGGElement;
  private readonly charFacingGEl: SVGGElement;
  private charSvgEl: SVGSVGElement;
  private readonly chuteGEl: SVGGElement;

  private look: Look;
  private level: TreeLevelConfig;
  private seed: number;
  private callbacks: TreeStageCallbacks;

  // Token 數值快取
  private TC: any;
  private W: any;
  private P: any;
  private E: any;

  // 世界常數（自 TC.world 讀取，不寫死）
  readonly viewW: number;
  readonly viewH: number;
  readonly topAlt: number;
  readonly unitsPerMeter: number;
  readonly walkSpeed: number;
  readonly runSpeed: number;

  // 鏡頭與角色狀態
  camAlt = 0;
  charX = 630;
  charAlt = 90;
  charVx = 0;
  charVy = 0;
  maxAltReached = 90;

  charView: "side" | "front" = "side";
  facing: "left" | "right" = "right";
  pose = "idle";
  private poseCtrl: PoseController | null = null;
  private running = false;
  private paused = false;
  private animFrameId = 0;
  private lastTime = 0;

  // 手感與物理計時器 (ms)
  private grounded = true;
  private currentBranch: TreeBranch | null = null;
  private coyoteTimer = 0;
  private jumpBufferTimer = 0;
  private dropThroughTimer = 0;
  private stunTimer = 0;
  private invincibleTimer = 0;
  private capeTimer = 0;
  private capeFlying = false;
  private tempCapeAdded = false;
  private parachuteMode = false;
  private parachuteTimer = 0; // 降落傘總演出時間上限（秒）
  private summitReached = false;
  private balloonLiftTimer = 0;

  // 道具與障礙
  hasCape = false;
  hourglassCount = 0;
  readonly maxHourglass = 3;
  capePickedCount = 0;

  private branches: TreeBranch[] = [];
  private branchEls = new Map<string, SVGGElement>();
  private fallingBranches = new Map<string, { vy: number }>();
  private obstacles: TreeObstacle[] = [];
  private obstacleEls = new Map<string, SVGGElement>();
  private warnMarkEls = new Map<string, SVGGElement>();
  private items: TreeItem[] = [];
  private itemEls = new Map<string, SVGGElement>();

  // 背景分塊管理
  private activeChunks: Record<string, Set<number>> = {
    far: new Set(),
    mid: new Set(),
    trunk: new Set(),
    near: new Set(),
  };
  private chunkEls = new Map<string, SVGElement>();
  private defsEl: SVGDefsElement | null = null;
  private bgRectEl: SVGRectElement | null = null;
  private starGroupEl: SVGGElement | null = null;
  private layerGroups: Record<string, SVGGElement> = {} as any;

  // 輸入狀態
  private inputLeft = false;
  private inputRight = false;
  private inputDown = false;
  private inputB = false; // 按住 B 鍵加速 (Sprint)
  private inputJumpPressed = false;
  private inputJumpHolding = false;

  constructor(
    container: HTMLElement,
    look: Look,
    level: TreeLevelConfig,
    seed: number,
    callbacks: TreeStageCallbacks
  ) {
    this.container = container;
    this.look = look;
    this.level = level;
    this.seed = seed;
    this.callbacks = callbacks;

    this.TC = GameTokens.treeClimb;
    this.W = this.TC.world;
    this.P = this.TC.player;
    this.E = this.TC.effects;

    // 世界常數自 token 讀取
    this.viewW = this.W.viewW || 1260;
    this.viewH = this.W.viewH || 708;
    this.topAlt = this.W.topAlt || 8000;
    this.unitsPerMeter = this.W.unitsPerMeter || 50;
    this.walkSpeed = (this.P.walk || 130) * 1.38; // ~180 行走
    this.runSpeed = (this.P.walk || 130) * 2.46; // ~320 按住 B 加速奔跑
    this.unitsPerMeter = this.W.unitsPerMeter || 50;

    // 建立 DOM 結構
    this.stageEl = document.createElement("div");
    this.stageEl.className = "tree-stage";

    // 背景與世界 SVG
    this.svgBgEl = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    this.svgBgEl.setAttribute("viewBox", `0 0 ${this.viewW} ${this.viewH}`);
    this.svgBgEl.setAttribute("class", "tree-bg-svg");
    this.svgBgEl.setAttribute("preserveAspectRatio", "xMidYMid slice");

    // 建立樹枝、實體與角色圖層
    this.branchesGroupEl = document.createElementNS("http://www.w3.org/2000/svg", "g");
    this.branchesGroupEl.setAttribute("class", "tree-layer-branches");

    this.entitiesGroupEl = document.createElementNS("http://www.w3.org/2000/svg", "g");
    this.entitiesGroupEl.setAttribute("class", "tree-layer-entities");

    this.playerGroupEl = document.createElementNS("http://www.w3.org/2000/svg", "g");
    this.playerGroupEl.setAttribute("class", "tree-layer-player");

    this.playerRootEl = document.createElementNS("http://www.w3.org/2000/svg", "g");
    this.playerRootEl.setAttribute("class", "tree-player-root");

    this.charFacingGEl = document.createElementNS("http://www.w3.org/2000/svg", "g");
    this.charFacingGEl.setAttribute("class", "tree-player-facing");

    // 角色 SVG（寬 120 高 170，腳底在 x=60, y=164，偏置 -60, -164 讓腳底對準原點）
    const charSvgStr = GameArt.character({
      ...this.look,
      view: "side",
      facing: "right",
      pose: this.pose,
    });
    const parser = new DOMParser();
    const doc = parser.parseFromString(charSvgStr, "image/svg+xml");
    this.charSvgEl = doc.documentElement as unknown as SVGSVGElement;
    this.charSvgEl.setAttribute("x", "-60");
    this.charSvgEl.setAttribute("y", "-164");
    this.charSvgEl.setAttribute("width", "120");
    this.charSvgEl.setAttribute("height", "170");
    this.charSvgEl.setAttribute("overflow", "visible");
    this.charSvgEl.classList.add("tree-char-svg");
    this.charFacingGEl.appendChild(this.charSvgEl);
    this.playerRootEl.appendChild(this.charFacingGEl);

    // 降落傘元素（雙手向上抓握，底部中心在 (75, 140)，置於頭頂上方）
    this.chuteGEl = document.createElementNS("http://www.w3.org/2000/svg", "g");
    this.chuteGEl.setAttribute("class", "tree-char-chute");
    this.chuteGEl.setAttribute("transform", "translate(-75, -254)");
    this.chuteGEl.innerHTML = GameArt.prop("parachute", { state: "open" }).replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "");
    this.chuteGEl.style.display = "none";
    this.playerRootEl.appendChild(this.chuteGEl);

    this.playerGroupEl.appendChild(this.playerRootEl);

    this.setupBackgroundSvg();
    this.stageEl.appendChild(this.svgBgEl);
    this.container.appendChild(this.stageEl);

    this.poseCtrl = GameArt.animate(this.charSvgEl, this.pose);

    // 生成地形與道具/障礙物
    this.generateTerrain();
  }

  private setupBackgroundSvg(): void {
    this.defsEl = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    this.defsEl.innerHTML = `
      <linearGradient id="tree-sky-grad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#BFE3F7" class="tree-sky-top" />
        <stop offset="100%" stop-color="#F1F8E8" class="tree-sky-bottom" />
      </linearGradient>
    `;
    this.svgBgEl.appendChild(this.defsEl);

    this.bgRectEl = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    this.bgRectEl.setAttribute("width", String(this.viewW));
    this.bgRectEl.setAttribute("height", String(this.viewH));
    this.bgRectEl.setAttribute("fill", "url(#tree-sky-grad)");
    this.svgBgEl.appendChild(this.bgRectEl);

    this.starGroupEl = document.createElementNS("http://www.w3.org/2000/svg", "g");
    this.starGroupEl.setAttribute("class", "tree-stars-layer");
    const starsSvg = GameArt.treeStars(this.viewW, this.viewH);
    this.starGroupEl.innerHTML = starsSvg.replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "");
    this.starGroupEl.style.opacity = "0";
    this.svgBgEl.appendChild(this.starGroupEl);

    for (const layer of ["far", "mid", "trunk"] as const) {
      const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
      g.setAttribute("class", `tree-layer-${layer}`);
      this.layerGroups[layer] = g;
      this.svgBgEl.appendChild(g);
    }

    // 樹枝層在樹幹上方
    this.svgBgEl.appendChild(this.branchesGroupEl);

    // 近景樹葉層在樹枝上方
    const nearG = document.createElementNS("http://www.w3.org/2000/svg", "g");
    nearG.setAttribute("class", "tree-layer-near");
    this.layerGroups["near"] = nearG;
    this.svgBgEl.appendChild(nearG);

    // 道具與障礙物層
    this.svgBgEl.appendChild(this.entitiesGroupEl);

    // 角色層在最前方
    this.svgBgEl.appendChild(this.playerGroupEl);
  }

  private generateTerrain(): void {
    this.branches = GameArt.treeBuild(this.level.id, this.seed, this.topAlt);
    // 第一根起始環幹枝在 alt=90
    const startBranch = this.branches[0];
    if (startBranch) {
      this.currentBranch = startBranch;
      this.charAlt = startBranch.alt;
      this.charX = (startBranch.x0 + startBranch.x1) / 2;
    }

    // 依據 token spawn 比率精確生成障礙物與道具
    const spawnDef = this.TC.spawn;
    const obsSpawn = spawnDef.obstacles;
    const itemSpawn = spawnDef.items;
    const minObsGap = spawnDef.minGapUnits?.obstacle || 160;
    const minItemGap = spawnDef.minGapUnits?.item || 300;

    const rng = (s: number) => {
      let t = (s ^ 0x6d2b79f5) | 0;
      t = Math.imul(t ^ (t >>> 15), 1 | t);
      t = t + Math.imul(t ^ (t >>> 7), 61 | t) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };

    let objId = 0;
    let lastObsAlt = 100;
    let lastItemAlt = 150;

    // 遍歷樹枝安排道具與障礙
    for (let i = 1; i < this.branches.length - 1; i++) {
      const b = this.branches[i];
      const zoneId = GameArt.treeZoneAt(b.alt).id;
      const zoneObsRates = (obsSpawn as any)[zoneId] || {};
      const seedVal = this.seed * 37 + i * 23;
      const r1 = rng(seedVal);
      const r2 = rng(seedVal + 7);

      // 1. 道具生成檢測
      if (b.alt - lastItemAlt >= minItemGap) {
        // 沙漏葉
        if (r1 < itemSpawn.hourglassLeaf * 0.4 && this.items.filter((it) => it.kind === "hourglass").length < 4) {
          this.items.push({
            id: `item-${++objId}`,
            kind: "hourglass",
            x: (b.x0 + b.x1) / 2 - 20,
            alt: b.alt + 30,
            w: 44,
            h: 44,
            collected: false,
          });
          lastItemAlt = b.alt;
          continue;
        }

        // 披風（高處樹冠/遠山層出現，每 1000 單位約 0.22）
        if (b.alt > 2000 && r1 > 0.85 && r2 < itemSpawn.capeItem * 1.5) {
          this.items.push({
            id: `item-${++objId}`,
            kind: "cape",
            x: (b.x0 + b.x1) / 2 - 24,
            alt: b.alt + 35,
            w: 48,
            h: 48,
            collected: false,
          });
          lastItemAlt = b.alt;
          continue;
        }
      }

      // 2. 障礙物生成檢測
      if (b.alt - lastObsAlt >= minObsGap) {
        const allowed = this.level.allow;
        const scale = this.level.obstacleScale || 1.0;

        // 依據該 zone 的期望率挑選障礙
        if (allowed.includes("caterpillar") && zoneObsRates.caterpillar && r2 < zoneObsRates.caterpillar * scale * 0.7) {
          const speed = this.E.caterpillar.crawlSpeed || 28;
          this.obstacles.push({
            id: `obs-${++objId}`,
            kind: "caterpillar",
            x: b.x0 + 20,
            startX: b.x0 + 20,
            alt: b.alt + 6,
            startAlt: b.alt + 6,
            vx: speed,
            vy: 0,
            w: 80,
            h: 40,
            started: false,
            warnTimer: 0,
            active: true,
            timer: 0,
            branchId: b.uid || b.id,
          });
          lastObsAlt = b.alt;
        } else if (allowed.includes("birdFoe") && zoneObsRates.birdFoe && r2 < zoneObsRates.birdFoe * scale * 0.7) {
          const fromLeft = rng(seedVal + 3) < 0.5;
          const speed = this.E.birdFoe.speed || 190;
          this.obstacles.push({
            id: `obs-${++objId}`,
            kind: "birdFoe",
            x: fromLeft ? -100 : this.viewW + 20,
            startX: fromLeft ? -100 : this.viewW + 20,
            alt: b.alt + 50,
            startAlt: b.alt + 50,
            vx: fromLeft ? speed : -speed,
            vy: 0,
            w: 92,
            h: 56,
            started: false,
            warnTimer: 0,
            active: true,
            timer: 0,
            flip: !fromLeft,
          });
          lastObsAlt = b.alt;
        } else if (allowed.includes("bee") && zoneObsRates.bee && r2 < zoneObsRates.bee * scale * 0.7) {
          const speed = this.E.bee.speed || 60;
          this.obstacles.push({
            id: `obs-${++objId}`,
            kind: "bee",
            x: (b.x0 + b.x1) / 2,
            startX: (b.x0 + b.x1) / 2,
            alt: b.alt + 40,
            startAlt: b.alt + 40,
            vx: speed,
            vy: 0,
            w: 50,
            h: 40,
            started: false,
            warnTimer: 0,
            active: true,
            timer: 0,
          });
          lastObsAlt = b.alt;
        } else if (allowed.includes("acorn") && zoneObsRates.acorn && r2 < zoneObsRates.acorn * scale * 0.7) {
          const speed = this.E.acorn.fallSpeed || 320;
          this.obstacles.push({
            id: `obs-${++objId}`,
            kind: "acorn",
            x: (b.x0 + b.x1) / 2,
            startX: (b.x0 + b.x1) / 2,
            alt: b.alt + 220,
            startAlt: b.alt + 220,
            vx: 0,
            vy: -speed,
            w: 32,
            h: 36,
            started: false,
            warnTimer: 0,
            active: true,
            timer: 0,
          });
          lastObsAlt = b.alt;
        } else if (allowed.includes("balloonCluster") && zoneObsRates.balloonCluster && r2 < zoneObsRates.balloonCluster * scale * 0.7) {
          const riseSpeed = this.E.balloonCluster.riseSpeed || 24;
          this.obstacles.push({
            id: `obs-${++objId}`,
            kind: "balloonCluster",
            x: (b.x0 + b.x1) / 2 - 40,
            startX: (b.x0 + b.x1) / 2 - 40,
            alt: b.alt + 20,
            startAlt: b.alt + 20,
            vx: 0,
            vy: riseSpeed,
            w: 80,
            h: 110,
            started: false,
            warnTimer: 0,
            active: true,
            timer: 0,
          });
          lastObsAlt = b.alt;
        } else if (allowed.includes("gust") && zoneObsRates.gust && r2 < zoneObsRates.gust * scale * 0.7) {
          const push = this.E.gust.push || 60;
          const fromLeft = rng(seedVal + 5) < 0.5;
          this.obstacles.push({
            id: `obs-${++objId}`,
            kind: "gust",
            x: (b.x0 + b.x1) / 2 - 180,
            startX: (b.x0 + b.x1) / 2 - 180,
            alt: b.alt + 30,
            startAlt: b.alt + 30,
            vx: fromLeft ? push : -push,
            vy: 0,
            w: this.E.gust.length || 360,
            h: 80,
            started: false,
            warnTimer: 0,
            active: true,
            timer: 0,
          });
          lastObsAlt = b.alt;
        } else if (allowed.includes("meteor") && zoneObsRates.meteor && r2 < zoneObsRates.meteor * scale * 0.7) {
          const speed = this.E.meteor.speed || 420;
          const fromLeft = rng(seedVal + 9) < 0.5;
          this.obstacles.push({
            id: `obs-${++objId}`,
            kind: "meteor",
            x: fromLeft ? 0 : this.viewW - 100,
            startX: fromLeft ? 0 : this.viewW - 100,
            alt: b.alt + 200,
            startAlt: b.alt + 200,
            vx: fromLeft ? speed * 0.8 : -speed * 0.8,
            vy: -speed * 0.6,
            w: 80,
            h: 50,
            started: false,
            warnTimer: 0,
            active: true,
            timer: 0,
            flip: !fromLeft,
          });
          lastObsAlt = b.alt;
        }
      }
    }
  }

  handleInput(key: PadKey, pressed: boolean): void {
    if (key === "left") this.inputLeft = pressed;
    if (key === "right") this.inputRight = pressed;
    if (key === "down") this.inputDown = pressed;
    if (key === "b") this.inputB = pressed; // 按住 B 鍵加速奔跑 (Sprint)
    if (key === "a") {
      if (pressed && !this.inputJumpHolding) {
        this.inputJumpPressed = true;
        this.jumpBufferTimer = this.P.bufferMs || 100;
      }
      this.inputJumpHolding = pressed;
    }
  }

  /** 觸碰披風道具時自動觸發飛升（正面跳起姿勢，穿戴披風配件） */
  startCapeFlight(): void {
    if (this.parachuteMode) return;
    this.capeFlying = true;
    this.capeTimer = this.E.cape.flyMs || 3000;
    this.charVy = this.E.cape.speed || 230;
    this.grounded = false;
    this.currentBranch = null;
    this.charView = "front";
    this.pose = "jump";

    const hadCapeNaturally = Boolean(this.look.accessories?.includes("cape"));
    if (!hadCapeNaturally) {
      this.tempCapeAdded = true;
      this.look = { ...this.look, accessories: [...(this.look.accessories || []), "cape"] };
    } else {
      this.tempCapeAdded = false;
    }
    this.rebuildCharSvg();
    this.callbacks.onCapeCollect();
  }

  /** 結束披風飛升（卸下臨時披風配件，轉回側面） */
  endCapeFlight(): void {
    if (!this.capeFlying && !this.tempCapeAdded && this.charView === "side") return;
    this.capeFlying = false;
    this.charView = "side";
    this.pose = this.charVy > 0 ? "jump" : "fall";
    if (this.tempCapeAdded) {
      this.tempCapeAdded = false;
      this.look = { ...this.look, accessories: (this.look.accessories || []).filter((a) => a !== "cape") };
    }
    this.rebuildCharSvg();
    this.callbacks.onCapeUsed();
  }

  private rebuildCharSvg(): void {
    // 角色朝向一律由外層 charFacingGEl 的 scale(-1 1) 負責翻轉，此處固定傳入 "right" 避免二次翻轉造成左右顛倒
    const charSvgStr = GameArt.character({
      ...this.look,
      view: this.charView,
      facing: "right",
      pose: this.pose,
    });
    const parser = new DOMParser();
    const doc = parser.parseFromString(charSvgStr, "image/svg+xml");
    const newSvg = doc.documentElement as unknown as SVGSVGElement;
    newSvg.setAttribute("x", "-60");
    newSvg.setAttribute("y", "-164");
    newSvg.setAttribute("width", "120");
    newSvg.setAttribute("height", "170");
    newSvg.setAttribute("overflow", "visible");
    newSvg.classList.add("tree-char-svg");
    this.charSvgEl.replaceWith(newSvg);
    this.charSvgEl = newSvg;
    this.poseCtrl?.stop();
    this.poseCtrl = GameArt.animate(this.charSvgEl, this.pose);
  }

  private triggerShroomSquash(uid: string): void {
    const bEl = this.branchEls.get(uid);
    const shroomEl = bEl?.querySelector(".tree-spring-shroom");
    if (!shroomEl) return;
    shroomEl.innerHTML = GameArt.prop("springShroom", { state: "squash" }).replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "");
    setTimeout(() => {
      const cur = this.branchEls.get(uid)?.querySelector(".tree-spring-shroom");
      if (cur) {
        cur.innerHTML = GameArt.prop("springShroom", { state: "idle" }).replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "");
      }
    }, 120);
  }

  /** 跳過降落傘緩降，直接落地進結算 */
  skipParachute(): void {
    if (!this.parachuteMode) return;
    this.parachuteMode = false;
    this.chuteGEl.style.display = "none";
    this.charAlt = 0;
    this.charVy = 0;
    this.setPose("land");
    this.callbacks.onLandAfterFall(Math.floor(this.maxAltReached / this.unitsPerMeter));
  }

  start(): void {
    this.running = true;
    this.paused = false;
    this.lastTime = performance.now();
    this.animFrameId = requestAnimationFrame(this.loop);
  }

  pause(): void {
    this.paused = true;
  }

  resume(): void {
    if (!this.paused) return;
    this.paused = false;
    this.lastTime = performance.now();
    this.animFrameId = requestAnimationFrame(this.loop);
  }

  stop(): void {
    this.running = false;
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);
    this.poseCtrl?.stop();
  }

  destroy(): void {
    this.stop();
    this.fallingBranches.clear();
    this.stageEl.remove();
  }

  private loop = (now: number): void => {
    if (!this.running) return;
    if (this.paused) return;

    const dt = Math.min(0.05, (now - this.lastTime) / 1000);
    this.lastTime = now;

    this.update(dt);
    this.render();

    this.animFrameId = requestAnimationFrame(this.loop);
  };

  private update(dt: number): void {
    const dtMs = dt * 1000;

    // 倒數各項計時器
    if (this.jumpBufferTimer > 0) this.jumpBufferTimer -= dtMs;
    if (this.coyoteTimer > 0) this.coyoteTimer -= dtMs;
    if (this.dropThroughTimer > 0) this.dropThroughTimer -= dtMs;
    if (this.stunTimer > 0) this.stunTimer -= dtMs;
    if (this.invincibleTimer > 0) this.invincibleTimer -= dtMs;
    if (this.balloonLiftTimer > 0) this.balloonLiftTimer -= dtMs;

    // 更新無敵閃爍外觀
    this.playerRootEl.classList.toggle("tree-invincible", this.invincibleTimer > 0);
    this.playerRootEl.classList.toggle("tree-stunned", this.stunTimer > 0);

    // 1. 降落傘收尾緩降模式（時長限制 2.5 秒）
    if (this.parachuteMode) {
      this.parachuteTimer -= dt;
      // 依剩餘時間動態調速，保證 2.5 秒內落地
      const remainingHeight = Math.max(0, this.charAlt);
      const reqSpeed = this.parachuteTimer > 0 ? remainingHeight / this.parachuteTimer : 2000;
      this.charVy = -Math.max(this.E.parachute.descent || 60, reqSpeed);

      if (this.inputLeft) this.charX -= (this.E.parachute.steer || 40) * dt;
      if (this.inputRight) this.charX += (this.E.parachute.steer || 40) * dt;
      this.charAlt += this.charVy * dt;

      // 鏡頭快速跟隨下移
      const targetCam = Math.max(0, this.charAlt - this.viewH * 0.4);
      this.camAlt += (targetCam - this.camAlt) * Math.min(1, dt * 5);

      if (this.charAlt <= 0 || this.parachuteTimer <= 0) {
        this.charAlt = 0;
        this.charVy = 0;
        this.parachuteMode = false;
        this.chuteGEl.style.display = "none";
        this.setPose("land");
        this.callbacks.onLandAfterFall(Math.floor(this.maxAltReached / this.unitsPerMeter));
      }
      return;
    }

    // 2. 披風飛升模式
    if (this.capeFlying) {
      this.capeTimer -= dtMs;
      this.charVy = this.E.cape.speed || 230;
      let steer = 0;
      if (this.inputLeft) {
        steer -= this.E.cape.steer || 80;
        this.facing = "left";
      }
      if (this.inputRight) {
        steer += this.E.cape.steer || 80;
        this.facing = "right";
      }
      this.charX += steer * dt;
      this.charAlt += this.charVy * dt;

      if (this.capeTimer <= 0) {
        this.endCapeFlight();
      }
    } else if (this.balloonLiftTimer > 0) {
      // 3. 被氣球拉升
      this.charVy = 80;
      this.charAlt += this.charVy * dt;
    } else {
      // 4. 一般重力與跳躍物理
      const JH = this.P.jump.height; // 130
      const JT = this.P.jump.airMs / 1000; // 0.9s
      let G = (2 * JH) / Math.pow(JT / 2, 2); // ~1283.95
      if (this.charAlt >= (this.P.lowGravity?.fromAlt || 7000)) {
        G *= this.P.lowGravity?.factor || 0.75;
      }

      // 水平移動控制（按住 B 加速奔跑）
      let targetVx = 0;
      const moveSpeed = this.inputB ? this.runSpeed : this.walkSpeed;
      if (this.stunTimer <= 0) {
        if (this.inputLeft) {
          targetVx -= moveSpeed;
          this.facing = "left";
        }
        if (this.inputRight) {
          targetVx += moveSpeed;
          this.facing = "right";
        }
      }

      const airControl = this.grounded ? 1 : this.P.airControl || 0.8;
      this.charVx = targetVx * airControl;
      this.charX += this.charVx * dt;

      // 限制角色不超出左右邊界
      this.charX = Math.max(30, Math.min(this.viewW - 30, this.charX));

      // 檢查跳躍與下跳
      const canJump = this.grounded || this.coyoteTimer > 0;

      // 下跳穿過平台 (↓ + A)
      if (this.grounded && this.inputDown && (this.inputJumpPressed || this.jumpBufferTimer > 0)) {
        this.grounded = false;
        this.currentBranch = null;
        this.dropThroughTimer = 260;
        this.charVy = -160;
        this.jumpBufferTimer = 0;
        this.inputJumpPressed = false;
        this.setPose("fall");
      } else if (canJump && (this.inputJumpPressed || this.jumpBufferTimer > 0) && this.stunTimer <= 0) {
        // 正常起跳（移除在蕈樹枝上手動按 A 才加成的舊邏輯，統一為一般起跳）
        const v0 = Math.sqrt(2 * G * JH);
        this.charVy = v0;
        this.callbacks.onJump?.();
        this.grounded = false;
        this.currentBranch = null;
        this.coyoteTimer = 0;
        this.jumpBufferTimer = 0;
        this.inputJumpPressed = false;
        this.setPose("jump");
      } else if (!this.grounded) {
        // 空中受重力
        this.charVy -= G * dt;

        // 可變跳高：玩家放開 A 鍵時提早減速下落
        if (!this.inputJumpHolding && this.charVy > 0) {
          this.charVy -= G * dt * 1.5;
        }

        // 姿勢切換
        if (this.stunTimer <= 0) {
          if (this.charVy > 50) this.setPose("jump");
          else this.setPose("fall");
        }
      } else {
        // 在地面/樹枝上
        if (this.stunTimer <= 0) {
          if (this.inputDown) {
            this.setPose("crouch");
          } else if (Math.abs(this.charVx) > 10) {
            this.setPose(this.inputB ? "run" : "walk");
          } else {
            this.setPose("idle");
          }
        }
      }

      // 更新垂直高度
      const prevAlt = this.charAlt;
      this.charAlt += this.charVy * dt;

      // 樹枝單向平台碰撞檢測（僅在下落且未處於下跳穿透期間）
      if (this.charVy <= 0 && this.dropThroughTimer <= 0) {
        let landed = false;
        const edgeForgive = this.P.edgeForgive || 12;

        for (const b of this.branches) {
          // 踩踏面就是 b.alt
          if (prevAlt >= b.alt - 4 && this.charAlt <= b.alt + 8) {
            // 水平位置是否在樹枝範圍內
            if (this.charX >= b.x0 - edgeForgive && this.charX <= b.x1 + edgeForgive) {
              const shroomMidX = (b.x0 + b.x1) / 2;
              // 彈跳蕈範圍：尺寸 64×52，碰撞框 [4, 12, 56, 40]，有效水平範圍 [shroomMidX - 28, shroomMidX + 24]
              const isOverShroom = Boolean(b.shroom) && !this.inputDown && (this.charX >= shroomMidX - 28 && this.charX <= shroomMidX + 24);
              if (isOverShroom) {
                // 真正的彈跳蕈：落上去就自動彈跳（不需要按 A），彈跳高度增加為目前的兩倍（mult * 2 = 3.0，彈高 390 單位）
                const v0 = Math.sqrt(2 * G * JH);
                const bounceMult = (this.TC.effects?.shroom?.mult || 1.5) * 2;
                this.charAlt = b.alt;
                this.charVy = v0 * Math.sqrt(bounceMult);
                this.grounded = false;
                this.currentBranch = null;
                this.setPose("jump");
                this.callbacks.onBounce?.();
                this.triggerShroomSquash(b.uid || b.id);
                landed = true;
                break;
              }

              this.charAlt = b.alt;
              this.charVy = 0;
              this.grounded = true;
              this.currentBranch = b;
              landed = true;

              // 樹枝移動機制：玩家碰觸到該樹枝時，樹枝開始向下移動，直到可視範圍外後移除
              const uid = b.uid || b.id;
              if (b.kind === "brittle" && !this.fallingBranches.has(uid)) {
                this.fallingBranches.set(uid, { vy: 100 });
                this.callbacks.onBrittleCrack?.();
                const bEl = this.branchEls.get(uid);
                if (bEl && !bEl.classList.contains("tree-limb-cracked")) {
                  bEl.classList.add("tree-limb-cracked");
                  const body = bEl.querySelector(".tree-limb-body");
                  if (body) {
                    body.innerHTML = GameArt.prop("limbBrittle", { state: "cracked" }).replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "");
                  }
                }
              }

              // 登頂檢測
              if (b.kind === "top" && !this.summitReached) {
                this.summitReached = true;
                this.setPose("victory");
                this.callbacks.onSummit();
              }
              break;
            }
          }
        }

        if (!landed && this.grounded) {
          // 走離樹枝邊緣，啟動 Coyote time
          this.grounded = false;
          this.currentBranch = null;
          this.coyoteTimer = this.P.coyoteMs || 80;
        }
      }

      // 地面層（alt <= 0）碰撞保護
      if (this.charAlt <= 0) {
        this.charAlt = 0;
        this.charVy = 0;
        this.grounded = true;
        this.currentBranch = null;
      }
    }

    // 5. 碰觸樹枝向下移動機制：樹枝往下移動一直到可視範圍外後移除
    for (const [uid, info] of this.fallingBranches.entries()) {
      const b = this.branches.find((br) => (br.uid || br.id) === uid);
      if (!b) {
        this.fallingBranches.delete(uid);
        continue;
      }

      // 重力加速度：向下移動速度漸增
      info.vy += 300 * dt;
      const dy = info.vy * dt;
      b.alt -= dy;

      // 若玩家正踩在此樹枝上，高度跟隨樹枝同步向下移動
      if (this.grounded && this.currentBranch === b) {
        this.charAlt = b.alt;
        this.charVy = -info.vy;

        // 走離樹枝邊緣檢測
        const edgeForgive = this.P.edgeForgive || 12;
        if (this.charX < b.x0 - edgeForgive || this.charX > b.x1 + edgeForgive) {
          this.grounded = false;
          this.currentBranch = null;
          this.coyoteTimer = this.P.coyoteMs || 80;
        }
      }

      // 若有巡邏障礙物（如毛毛蟲）綁定在此樹枝，高度同步更新
      for (const obs of this.obstacles) {
        if (obs.branchId === uid) {
          obs.alt = b.alt + 6;
        }
      }

      // 樹枝踩踏面已低於鏡頭畫面底端 60 單位以上，完全移出可視範圍外後移除
      if (b.alt < this.camAlt - 60) {
        if (this.currentBranch === b) {
          this.grounded = false;
          this.currentBranch = null;
        }
        const bIdx = this.branches.indexOf(b);
        if (bIdx >= 0) {
          this.branches.splice(bIdx, 1);
        }
        const bEl = this.branchEls.get(uid);
        if (bEl) {
          bEl.remove();
          this.branchEls.delete(uid);
        }
        this.fallingBranches.delete(uid);
      }
    }

    // 6. 鏡頭推進：只向上推，永不後退
    const pushThreshold = this.viewH * (this.P.camera?.followFrac || 0.6);
    if (this.charAlt - this.camAlt > pushThreshold) {
      this.camAlt = this.charAlt - pushThreshold;
    }

    // 更新最高高度
    if (this.charAlt > this.maxAltReached) {
      this.maxAltReached = this.charAlt;
      const meters = Math.floor(this.charAlt / this.unitsPerMeter);
      const maxMeters = Math.floor(this.maxAltReached / this.unitsPerMeter);
      this.callbacks.onHeightChange(meters, maxMeters);
    }

    // 7. 掉出底端失敗檢測
    if (!this.parachuteMode && this.charAlt < this.camAlt) {
      if (this.camAlt < 40) {
        // 仍看得到地面，安全落地
        this.charAlt = 0;
        this.charVy = 0;
        this.grounded = true;
      } else {
        // 真正掉出畫面底端 -> 展開降落傘緩降收尾（上限 2.5 秒）
        this.parachuteMode = true;
        this.parachuteTimer = 2.5;
        this.grounded = false;
        this.endCapeFlight();
        this.chuteGEl.style.display = "";
        this.setPose("parachute");
        this.callbacks.onFallOut();
      }
    }

    // 8. 障礙物與道具更新與碰撞檢測
    this.updateObstaclesAndItems(dt, dtMs);

    this.inputJumpPressed = false;
  }

  private updateObstaclesAndItems(dt: number, dtMs: number): void {
    const charBox = {
      x: this.charX - 18,
      y: this.charAlt + 4,
      w: 36,
      h: 100,
    };

    // 道具拾取
    for (const item of this.items) {
      if (item.collected) continue;
      const hit =
        charBox.x < item.x + item.w &&
        charBox.x + charBox.w > item.x &&
        charBox.y < item.alt + item.h &&
        charBox.y + charBox.h > item.alt;

      if (hit) {
        item.collected = true;
        const el = this.itemEls.get(item.id);
        el?.remove();
        if (item.kind === "hourglass") {
          if (this.hourglassCount < this.maxHourglass) {
            this.hourglassCount++;
            this.callbacks.onHourglassCollect(this.E.hourglass.addSec || 5);
          }
        } else if (item.kind === "cape") {
          this.capePickedCount++;
          this.startCapeFlight();
        }
      }
    }

    // 障礙物激活、預警與行為更新
    for (const obs of this.obstacles) {
      if (!obs.active) continue;

      // 只有在接近鏡頭可見範圍時才啟動！
      const inCameraRange = obs.alt <= this.camAlt + this.viewH + 120 && obs.alt >= this.camAlt - 60;
      if (!obs.started) {
        if (inCameraRange) {
          obs.started = true;
          if (obs.kind === "birdFoe") obs.warnTimer = this.E.birdFoe.warnMs || 1000;
          else if (obs.kind === "acorn") obs.warnTimer = this.E.acorn.warnMs || 900;
          else if (obs.kind === "meteor") obs.warnTimer = this.E.meteor.warnMs || 1000;
          else obs.warnTimer = 0;
        } else {
          continue; // 尚未接近畫面，不更新也不碰撞
        }
      }

      // 預警階段：倒數並顯示警示標記，不移動、不碰撞
      if (obs.warnTimer > 0) {
        obs.warnTimer -= dtMs;
        continue;
      }

      // 正式行為與位移更新
      obs.timer += dt;

      if (obs.kind === "caterpillar") {
        obs.x += obs.vx * dt;
        const b = this.branches.find((br) => (br.uid || br.id) === obs.branchId);
        if (b) {
          if (obs.x < b.x0 + 10) {
            obs.x = b.x0 + 10;
            obs.vx = Math.abs(obs.vx);
            obs.flip = false;
          } else if (obs.x > b.x1 - obs.w - 10) {
            obs.x = b.x1 - obs.w - 10;
            obs.vx = -Math.abs(obs.vx);
            obs.flip = true;
          }
        }
      } else if (obs.kind === "birdFoe") {
        obs.x += obs.vx * dt;
      } else if (obs.kind === "bee") {
        // Z 字形飛行
        const zig = this.E.bee.zig || 70;
        obs.x = obs.startX + Math.sin(obs.timer * 4) * zig;
        obs.alt = obs.startAlt + Math.cos(obs.timer * 2) * 20;
      } else if (obs.kind === "acorn") {
        obs.alt += obs.vy * dt;
      } else if (obs.kind === "balloonCluster") {
        obs.alt += obs.vy * dt;
      } else if (obs.kind === "gust") {
        // 強風區域：角色若在風帶內，推動角色
        if (
          charBox.x + charBox.w > obs.x &&
          charBox.x < obs.x + obs.w &&
          charBox.y + charBox.h > obs.alt &&
          charBox.y < obs.alt + obs.h
        ) {
          this.charX += (obs.vx > 0 ? 1 : -1) * (this.E.gust.push || 60) * dt;
        }
      } else if (obs.kind === "meteor") {
        obs.x += obs.vx * dt;
        obs.alt += obs.vy * dt;
      }

      // 強風已處理推力，不造成暈眩碰撞；無敵或特殊狀態也不受撞擊
      if (obs.kind === "gust" || this.invincibleTimer > 0 || this.capeFlying || this.parachuteMode) {
        continue;
      }

      // 碰撞檢測：使用核心命中範圍，避免角色與障礙物視覺邊緣過於寬鬆造成的「遠距離誤觸」
      let obsHitX = obs.x;
      let obsHitY = obs.alt;
      let obsHitW = obs.w;
      let obsHitH = obs.h;

      if (obs.kind === "caterpillar") {
        // 毛毛蟲本體居中，外緣預留緩衝，縮小判定盒
        obsHitX = obs.x + 12;
        obsHitY = obs.alt + 4;
        obsHitW = Math.max(10, obs.w - 24);
        obsHitH = Math.max(10, obs.h - 10);
      } else if (obs.kind === "birdFoe") {
        // 小鳥翅膀與嘴喙外緣較虛，使用身體核心判定盒
        obsHitX = obs.x + 16;
        obsHitY = obs.alt + 8;
        obsHitW = Math.max(10, obs.w - 32);
        obsHitH = Math.max(10, obs.h - 16);
      }

      const hit =
        charBox.x < obsHitX + obsHitW &&
        charBox.x + charBox.w > obsHitX &&
        charBox.y < obsHitY + obsHitH &&
        charBox.y + charBox.h > obsHitY;

      if (hit) {
        this.triggerObstacleHit(obs);
        break;
      }
    }
  }

  private triggerObstacleHit(obs: TreeObstacle): void {
    this.invincibleTimer = this.E.invincibleAfterHitMs || 1500;
    this.callbacks.onHit(obs.kind);

    if (obs.kind === "caterpillar") {
      this.stunTimer = this.E.caterpillar.stunMs || 800;
      this.charX += this.charVx >= 0 ? -(this.E.caterpillar.knock || 40) : (this.E.caterpillar.knock || 40);
      this.setPose("dizzy");
    } else if (obs.kind === "birdFoe") {
      this.stunTimer = this.E.birdFoe.stunMs || 1000;
      this.charX += obs.vx > 0 ? (this.E.birdFoe.knock || 80) : -(this.E.birdFoe.knock || 80);
      this.setPose("dizzy");
    } else if (obs.kind === "bee") {
      this.stunTimer = this.E.bee.stunMs || 600;
      this.setPose("dizzy");
    } else if (obs.kind === "acorn") {
      this.stunTimer = this.E.acorn.stunMs || 800;
      this.charAlt -= this.E.acorn.knockDown || 40;
      this.setPose("dizzy");
    } else if (obs.kind === "meteor") {
      this.stunTimer = this.E.meteor.stunMs || 1000;
      this.charX += obs.vx > 0 ? (this.E.meteor.knock || 90) : -(this.E.meteor.knock || 90);
      this.setPose("dizzy");
    } else if (obs.kind === "balloonCluster") {
      // 氣球拉升
      this.balloonLiftTimer = this.E.balloonCluster.liftMs || 1500;
      this.grounded = false;
      this.currentBranch = null;
      this.setPose("surprise");
    }
  }

  private setPose(pose: string): void {
    if (this.pose === pose) return;
    this.pose = pose;
    this.poseCtrl?.setPose(pose);
  }

  private render(): void {
    // 1. 更新天空與背景視差
    this.renderBackground();

    // 2. 更新樹枝
    this.renderBranches();

    // 3. 更新道具與障礙
    this.renderEntities();

    // 4. 更新角色位置與朝向
    const screenX = this.charX;
    const screenY = this.viewH - (this.charAlt - this.camAlt);

    this.playerRootEl.setAttribute("transform", `translate(${screenX.toFixed(1)} ${screenY.toFixed(1)})`);
    const flip = this.charView === "front" ? "scale(1 1)" : (this.facing === "left" ? "scale(-1 1)" : "scale(1 1)");
    this.charFacingGEl.setAttribute("transform", flip);
    this.chuteGEl.style.display = this.parachuteMode ? "" : "none";
  }

  private renderBackground(): void {
    const sky = GameArt.treeSkyAt(this.camAlt + this.viewH / 2);
    const topStop = this.defsEl?.querySelector(".tree-sky-top");
    const bottomStop = this.defsEl?.querySelector(".tree-sky-bottom");
    if (topStop) topStop.setAttribute("stop-color", sky.top);
    if (bottomStop) bottomStop.setAttribute("stop-color", sky.bottom);

    if (this.starGroupEl) {
      this.starGroupEl.style.opacity = String(sky.star);
    }

    // 分塊管理 (far, mid, trunk, near)
    const ch = this.W.chunkH || 640;
    const px = this.W.parallax;

    for (const layer of ["far", "mid", "trunk", "near"] as const) {
      const pRatio = px[layer] || 1;
      const cam = this.camAlt * pRatio;
      // 增加 160 單位預載與過渡緩衝，避免邊界閃爍與反覆建立銷毀
      const buffer = 160;
      const lo = Math.max(0, Math.floor((cam - buffer) / ch));
      const hi = Math.max(0, Math.floor((cam + this.viewH + buffer) / ch));

      const needed = new Set<number>();
      for (let k = lo; k <= hi; k++) needed.add(k);

      const current = this.activeChunks[layer];
      const grp = this.layerGroups[layer];

      // 移除不再可見的 chunk
      for (const idx of current) {
        if (!needed.has(idx)) {
          const key = `${layer}-${idx}`;
          this.chunkEls.get(key)?.remove();
          this.chunkEls.delete(key);
          current.delete(idx);
        }
      }

      // 加入新增的 chunk（使用 <g> 容器承載內容，避免 iPad/WebKit 無視巢狀 <svg> 的 transform 屬性）
      for (const idx of needed) {
        const key = `${layer}-${idx}`;
        let el = this.chunkEls.get(key);
        if (!el) {
          el = document.createElementNS("http://www.w3.org/2000/svg", "g") as unknown as SVGElement;
          el.setAttribute("class", `g-tree-chunk g-tree-${layer}`);
          const svgStr = GameArt.treeChunk(layer, idx, this.viewW);
          const parser = new DOMParser();
          const doc = parser.parseFromString(svgStr, "image/svg+xml");
          const root = doc.documentElement;
          while (root.firstChild) {
            el.appendChild(root.firstChild);
          }
          this.chunkEls.set(key, el);
          grp.appendChild(el);
          current.add(idx);
        }
        // 更新 Chunk 垂直位移（以 <g> transform 實作，iPad/WebKit 及所有設備均能 60fps 平滑同步捲動）
        const yTop = this.viewH - ((idx + 1) * ch - cam);
        el.setAttribute("transform", `translate(0, ${yTop.toFixed(1)})`);
      }
    }
  }

  private renderBranches(): void {
    const visibleRange = {
      min: this.camAlt - 120,
      max: this.camAlt + this.viewH + 120,
    };

    for (const b of this.branches) {
      const uid = b.uid || b.id;
      const visible = b.alt >= visibleRange.min && b.alt <= visibleRange.max;
      let el = this.branchEls.get(uid);

      if (!visible) {
        if (el) {
          el.remove();
          this.branchEls.delete(uid);
        }
        continue;
      }

      const y = this.viewH - (b.alt - this.camAlt) - 14;
      if (!el) {
        el = document.createElementNS("http://www.w3.org/2000/svg", "g") as unknown as SVGGElement;
        el.setAttribute("class", "tree-limb");
        el.dataset.uid = uid;

        const propId = b.id;
        const isCracked = b.id === "limbBrittle" && this.fallingBranches.has(uid);
        const state = b.id === "limbBrittle" ? (isCracked ? "cracked" : "idle") : (b.id === "limbTop" ? undefined : b.style);
        const svgp = GameArt.prop(propId, state ? { state } : {});
        const inner = svgp.replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "");

        const flip = b.side === "L" ? `translate(${b.x1} 0) scale(-1 1)` : `translate(${b.x0} 0)`;
        let branchInner = `<g class="tree-limb-anchor" transform="${flip}"><g class="tree-limb-body">${inner}</g></g>`;
        if (b.shroom) {
          const shroomX = (b.x0 + b.x1) / 2 - 32;
          branchInner += `<g class="tree-spring-shroom" transform="translate(${shroomX} -36)">${GameArt.prop("springShroom").replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "")}</g>`;
        }
        el.innerHTML = branchInner;
        this.branchesGroupEl.appendChild(el);
        this.branchEls.set(uid, el);
      }

      el.setAttribute("transform", `translate(0 ${y.toFixed(1)})`);
    }
  }

  private renderEntities(): void {
    const visibleRange = {
      min: this.camAlt - 120,
      max: this.camAlt + this.viewH + 120,
    };

    // 道具
    for (const it of this.items) {
      let el = this.itemEls.get(it.id);
      if (it.collected) {
        if (el) {
          el.remove();
          this.itemEls.delete(it.id);
        }
        continue;
      }

      const visible = it.alt >= visibleRange.min && it.alt <= visibleRange.max;
      if (!visible) {
        if (el) {
          el.remove();
          this.itemEls.delete(it.id);
        }
        continue;
      }
      const y = this.viewH - (it.alt - this.camAlt);
      if (!el) {
        el = document.createElementNS("http://www.w3.org/2000/svg", "g") as unknown as SVGGElement;
        el.setAttribute("class", `tree-item tree-item-${it.kind}`);
        const propId = it.kind === "hourglass" ? "hourglassLeaf" : it.kind === "cape" ? "capeItem" : "acornPick";
        const inner = GameArt.prop(propId).replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "");
        el.innerHTML = `<g class="tree-item-float">${inner}</g>`;
        this.entitiesGroupEl.appendChild(el);
        this.itemEls.set(it.id, el);
      }
      el.setAttribute("transform", `translate(${it.x} ${(y - it.h).toFixed(1)})`);
    }

    // 障礙物與預警標記
    for (const obs of this.obstacles) {
      if (!obs.active) continue;

      let warnEl = this.warnMarkEls.get(obs.id);
      let obsEl = this.obstacleEls.get(obs.id);

      // 預警階段：渲染 alertMark
      if (obs.started && obs.warnTimer > 0) {
        if (obsEl) {
          obsEl.remove();
          this.obstacleEls.delete(obs.id);
        }

        if (!warnEl) {
          warnEl = document.createElementNS("http://www.w3.org/2000/svg", "g") as unknown as SVGGElement;
          warnEl.setAttribute("class", "tree-alert-mark");
          warnEl.innerHTML = GameArt.prop("alertMark").replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "");
          this.entitiesGroupEl.appendChild(warnEl);
          this.warnMarkEls.set(obs.id, warnEl);
        }

        // 預警符號位置：小鳥在即將飛入的那一側邊緣，並與飛行高度對齊；橡實/流星在上方
        let warnX = obs.x;
        let warnY = this.viewH - (obs.alt - this.camAlt) - 40;
        if (obs.kind === "birdFoe") {
          // vx > 0 從左側飛入，驚嘆號在左邊界 (24px)；vx < 0 從右側飛入，驚嘆號在右邊界 (viewW - 52px)
          warnX = obs.vx > 0 ? 24 : this.viewW - 52;
          warnY = this.viewH - (obs.alt - this.camAlt) - 46;
        }
        warnEl.setAttribute("transform", `translate(${warnX.toFixed(1)} ${warnY.toFixed(1)})`);
        continue;
      }

      // 預警結束，移除 alertMark
      if (warnEl) {
        warnEl.remove();
        this.warnMarkEls.delete(obs.id);
      }

      // 未啟動者不渲染本體
      if (!obs.started) continue;

      const visible = obs.alt >= visibleRange.min && obs.alt <= visibleRange.max;
      if (!visible) {
        if (obsEl) {
          obsEl.remove();
          this.obstacleEls.delete(obs.id);
        }
        continue;
      }

      // 依時間計算兩格動態狀態（毛毛蟲蠕動 a/b、小鳥拍翅 up/down）
      let curState: string | undefined;
      if (obs.kind === "caterpillar") {
        const frame = Math.floor(obs.timer / 0.18) % 2;
        curState = frame === 0 ? "a" : "b";
      } else if (obs.kind === "birdFoe") {
        const frame = Math.floor(obs.timer / 0.12) % 2;
        curState = frame === 0 ? "up" : "down";
      }

      const y = this.viewH - (obs.alt - this.camAlt);
      if (!obsEl) {
        obsEl = document.createElementNS("http://www.w3.org/2000/svg", "g") as unknown as SVGGElement;
        obsEl.setAttribute("class", `tree-obstacle tree-obs-${obs.kind}`);
        obsEl.innerHTML = GameArt.prop(obs.kind, curState ? { state: curState } : {}).replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "");
        obs.animState = curState;
        this.entitiesGroupEl.appendChild(obsEl);
        this.obstacleEls.set(obs.id, obsEl);
      } else if (curState && obs.animState !== curState) {
        obsEl.innerHTML = GameArt.prop(obs.kind, { state: curState }).replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "");
        obs.animState = curState;
      }

      // 翻轉修正：SVG scale(-1 1) 以原點翻轉，若 flip 需以 (obs.x + obs.w) 為原點平移，使視覺範圍完美落在 [obs.x, obs.x + obs.w]
      const scaleX = obs.flip ? " scale(-1 1)" : "";
      const tx = obs.flip ? (obs.x + obs.w).toFixed(1) : obs.x.toFixed(1);
      const ty = (y - obs.h).toFixed(1);
      obsEl.setAttribute("transform", `translate(${tx} ${ty})${scaleX}`);
    }
  }
}
