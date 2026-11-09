// 角色小鎮音效（Web Audio 即時合成，不需要音檔）：腳步、開門、靠近地點的提示「叮」。
// 第一次點畫面／按鍵後才建立 AudioContext（iOS 自動播放限制）；靜音開關記在 sessionStorage。
let ctx: AudioContext | null = null;
let muted = false;
let volume = 0.5;
try {
  muted = sessionStorage.getItem("townMuted") === "1";
} catch {
  // 忽略
}

export function setTownSfxVolume(v: number): void {
  volume = Math.max(0, Math.min(1, v));
}
export function townSfxMuted(): boolean {
  return muted;
}
export function setTownSfxMuted(m: boolean): void {
  muted = m;
  try {
    sessionStorage.setItem("townMuted", m ? "1" : "0");
  } catch {
    // 忽略
  }
}
/** 使用者互動時呼叫：建立／喚醒 AudioContext */
export function unlockTownSfx(): void {
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!ctx && AC) ctx = new AC();
    if (ctx && ctx.state === "suspended") void ctx.resume();
  } catch {
    ctx = null;
  }
}

function out(gain: number): { c: AudioContext; g: GainNode; t: number } | null {
  if (muted || !ctx || ctx.state !== "running") return null;
  const g = ctx.createGain();
  g.gain.value = gain * volume;
  g.connect(ctx.destination);
  return { c: ctx, g, t: ctx.currentTime };
}

let noiseBuf: AudioBuffer | null = null;
function noise(c: AudioContext): AudioBuffer {
  if (noiseBuf) return noiseBuf;
  const b = c.createBuffer(1, Math.floor(c.sampleRate * 0.2), c.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  noiseBuf = b;
  return b;
}

let stepAlt = false;
/** 一步腳步聲：短促、低頻的「噠」（左右腳音高略不同）；run＝稍微輕快 */
export function playStep(run = false): void {
  const o = out(run ? 0.5 : 0.42);
  if (!o) return;
  const { c, g, t } = o;
  stepAlt = !stepAlt;
  const src = c.createBufferSource();
  src.buffer = noise(c);
  const f = c.createBiquadFilter();
  f.type = "lowpass";
  f.frequency.value = (run ? 900 : 700) * (stepAlt ? 1 : 0.82);
  const env = c.createGain();
  env.gain.setValueAtTime(0.0001, t);
  env.gain.exponentialRampToValueAtTime(1, t + 0.006);
  env.gain.exponentialRampToValueAtTime(0.0001, t + (run ? 0.05 : 0.07));
  src.connect(f).connect(env).connect(g);
  src.start(t);
  src.stop(t + 0.1);
}

/** 開門：門把「喀」一聲＋輕輕的「吱——」 */
export function playDoorOpen(): void {
  const o = out(0.5);
  if (!o) return;
  const { c, g, t } = o;
  // 喀（門把）
  const src = c.createBufferSource();
  src.buffer = noise(c);
  const hp = c.createBiquadFilter();
  hp.type = "bandpass";
  hp.frequency.value = 2400;
  const e1 = c.createGain();
  e1.gain.setValueAtTime(0.0001, t);
  e1.gain.exponentialRampToValueAtTime(0.9, t + 0.004);
  e1.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
  src.connect(hp).connect(e1).connect(g);
  src.start(t);
  src.stop(t + 0.08);
  // 吱（門軸）
  const osc = c.createOscillator();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(420, t + 0.06);
  osc.frequency.linearRampToValueAtTime(640, t + 0.32);
  osc.frequency.linearRampToValueAtTime(520, t + 0.48);
  const lfo = c.createOscillator();
  lfo.frequency.value = 26;
  const lg = c.createGain();
  lg.gain.value = 18;
  lfo.connect(lg).connect(osc.frequency);
  const e2 = c.createGain();
  e2.gain.setValueAtTime(0.0001, t + 0.06);
  e2.gain.exponentialRampToValueAtTime(0.12, t + 0.12);
  e2.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
  osc.connect(e2).connect(g);
  osc.start(t + 0.06);
  lfo.start(t + 0.06);
  osc.stop(t + 0.52);
  lfo.stop(t + 0.52);
}

/** 靠近地點（唸名稱前）：柔和的兩音「叮咚」，每個地點都一樣 */
export function playPlaceChime(): void {
  const o = out(0.32);
  if (!o) return;
  const { c, g, t } = o;
  [
    [880, 0],
    [1318.5, 0.11],
  ].forEach(([f, dt]) => {
    const osc = c.createOscillator();
    osc.type = "sine";
    osc.frequency.value = f;
    const e = c.createGain();
    e.gain.setValueAtTime(0.0001, t + dt);
    e.gain.exponentialRampToValueAtTime(0.8, t + dt + 0.01);
    e.gain.exponentialRampToValueAtTime(0.0001, t + dt + 0.35);
    osc.connect(e).connect(g);
    osc.start(t + dt);
    osc.stop(t + dt + 0.4);
  });
}

/** 敲門：兩下「叩叩」 */
export function playKnock(): void {
  const o = out(0.6);
  if (!o) return;
  const { c, g, t } = o;
  [0, 0.18].forEach((dt) => {
    const osc = c.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(190, t + dt);
    osc.frequency.exponentialRampToValueAtTime(110, t + dt + 0.08);
    const e = c.createGain();
    e.gain.setValueAtTime(0.0001, t + dt);
    e.gain.exponentialRampToValueAtTime(1, t + dt + 0.004);
    e.gain.exponentialRampToValueAtTime(0.0001, t + dt + 0.1);
    osc.connect(e).connect(g);
    osc.start(t + dt);
    osc.stop(t + dt + 0.12);
  });
}

/** 遊戲短音（同角色工作室的 blip）：tap 點、jump 跳、land 落地、coin 叮、pop 啵、trip 絆倒 */
export function playBlip(kind: "tap" | "jump" | "land" | "coin" | "pop" | "trip"): void {
  const o = out(1);
  if (!o) return;
  const { c, g, t } = o;
  if (kind === "trip") {
    const o1 = c.createOscillator();
    o1.type = "sine";
    o1.frequency.setValueAtTime(620, t);
    o1.frequency.exponentialRampToValueAtTime(180, t + 0.3);
    const e1 = c.createGain();
    e1.gain.setValueAtTime(0.0001, t);
    e1.gain.exponentialRampToValueAtTime(0.13, t + 0.03);
    e1.gain.exponentialRampToValueAtTime(0.001, t + 0.32);
    o1.connect(e1).connect(g);
    o1.start(t);
    o1.stop(t + 0.34);
    const t2 = t + 0.38;
    const o2 = c.createOscillator();
    o2.type = "triangle";
    o2.frequency.setValueAtTime(140, t2);
    o2.frequency.exponentialRampToValueAtTime(55, t2 + 0.18);
    const e2 = c.createGain();
    e2.gain.setValueAtTime(0.0001, t2);
    e2.gain.exponentialRampToValueAtTime(0.3, t2 + 0.01);
    e2.gain.exponentialRampToValueAtTime(0.001, t2 + 0.24);
    o2.connect(e2).connect(g);
    o2.start(t2);
    o2.stop(t2 + 0.26);
    return;
  }
  const osc = c.createOscillator();
  const f = { tap: [660, 660], jump: [420, 760], land: [220, 140], coin: [880, 1320], pop: [520, 900] }[kind];
  osc.type = kind === "land" ? "triangle" : "sine";
  osc.frequency.setValueAtTime(f[0], t);
  osc.frequency.exponentialRampToValueAtTime(f[1], t + 0.1);
  const e = c.createGain();
  e.gain.setValueAtTime(0.12, t);
  e.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
  osc.connect(e).connect(g);
  osc.start(t);
  osc.stop(t + 0.18);
}

/** 相機快門：兩下短促的「喀嚓」（雜訊＋低音） */
export function playShutter(): void {
  const o = out(1);
  if (!o) return;
  const { c, g, t } = o;
  const len = Math.floor(c.sampleRate * 0.05);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  for (const [dt, vol] of [
    [0, 0.35],
    [0.09, 0.25],
  ] as const) {
    const src = c.createBufferSource();
    src.buffer = buf;
    const f = c.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.value = 2400;
    const e = c.createGain();
    e.gain.setValueAtTime(vol, t + dt);
    e.gain.exponentialRampToValueAtTime(0.001, t + dt + 0.05);
    src.connect(f).connect(e).connect(g);
    src.start(t + dt);
  }
}

/** 寵物叫一聲（我的家・摸摸牠）：貓＝上揚再下滑的「喵」，狗＝兩聲短短的「汪」 */
export function playPet(kind: "cat" | "dog"): void {
  const o = out(1);
  if (!o) return;
  const { c, g, t } = o;
  const voice = (start: number, f0: number, f1: number, f2: number, dur: number, vol: number, type: OscillatorType) => {
    const osc = c.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(f0, t + start);
    osc.frequency.linearRampToValueAtTime(f1, t + start + dur * 0.35);
    osc.frequency.linearRampToValueAtTime(f2, t + start + dur);
    const f = c.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = kind === "cat" ? 2600 : 1400;
    const e = c.createGain();
    e.gain.setValueAtTime(0.0001, t + start);
    e.gain.exponentialRampToValueAtTime(vol, t + start + 0.03);
    e.gain.exponentialRampToValueAtTime(0.0001, t + start + dur);
    osc.connect(f).connect(e).connect(g);
    osc.start(t + start);
    osc.stop(t + start + dur + 0.02);
  };
  if (kind === "cat") voice(0, 520, 860, 600, 0.55, 0.16, "triangle");
  else {
    voice(0, 300, 380, 220, 0.16, 0.22, "sawtooth");
    voice(0.22, 300, 380, 220, 0.16, 0.2, "sawtooth");
  }
}
