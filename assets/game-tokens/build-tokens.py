#!/usr/bin/env python3
"""game-tokens.json -> game-tokens.css / game-tokens.js，並檢查對比。
用法：python3 build-tokens.py（在本資料夾執行）。不要手改產生的 css/js。"""
import json, os, sys
here = os.path.dirname(os.path.abspath(__file__))
T = json.load(open(os.path.join(here, "game-tokens.json"), encoding="utf-8"))

def lum(h):
    h = h.lstrip("#"); r, g, b = [int(h[i:i+2], 16)/255 for i in (0, 2, 4)]
    f = lambda c: c/12.92 if c <= .03928 else ((c+.055)/1.055)**2.4
    return .2126*f(r)+.7152*f(g)+.0722*f(b)
def cr(a, b):
    la, lb = sorted([lum(a), lum(b)], reverse=True); return (la+.05)/(lb+.05)
kebab = lambda k: "".join("-"+c.lower() if c.isupper() else c for c in k)

L = [":root {", "  /* 產生自 game-tokens.json — 請勿手改 */"]
for k, v in T["color"]["neutral"].items(): L.append(f"  --g-{k}: {v};")
for h, s in T["color"]["hue"].items():
    for step, v in s.items(): L.append(f"  --g-{h}{'' if step=='base' else '-'+step}: {v};")
for grp in ("skin", "hair", "fur", "face"):
    for k, v in T["color"][grp].items(): L.append(f"  --g-{grp}-{k}: {v};")
for sid, sc in T["color"]["world"]["scene"].items():
    for tm in ("day", "night"):
        for k, v in sc[tm].items():
            if isinstance(v, str) and v.startswith("#"): L.append(f"  --g-{sid}-{tm}-{kebab(k)}: {v};")
for k, v in T["shape"]["radius"].items(): L.append(f"  --g-radius-{k}: {v}px;")
for k, v in T["depth"]["shadow"].items(): L.append(f"  --g-shadow-{k}: {v};")
for i, v in enumerate(T["space"]["scale"]): L.append(f"  --g-space-{i+1}: {v}px;")
for k, v in T["motion"]["duration"].items(): L.append(f"  --g-dur-{k}: {v}ms;")
for k, v in T["motion"]["easing"].items(): L.append(f"  --g-ease-{k}: {v};")
Y = T["typography"]
for k, v in Y["family"].items(): L.append(f"  --g-font-{k}: {v};")
for k, v in Y["size"].items(): L.append(f"  --g-text-{k}: {v}px;")
for k, v in Y["weight"].items(): L.append(f"  --g-weight-{k}: {v};")
for k, v in Y["leading"].items(): L.append(f"  --g-leading-{k}: {v};")
for k, v in T["icons"]["size"].items(): L.append(f"  --g-icon-{k}: {v}px;")
L.append(f"  --g-tap-min: {T['controls']['tapTargetMin']}px;")
L.append("}")

# 文字樣式
for k, s in Y["styles"].items():
    r = [f"font-family:var(--g-font-{s['family']})", f"font-size:var(--g-text-{s['size']})", f"font-weight:var(--g-weight-{s['weight']})", f"line-height:var(--g-leading-{s['leading']})"]
    if s.get("tabular"): r.append("font-variant-numeric:tabular-nums")
    if s.get("tracking"): r.append("letter-spacing:" + Y["tracking"][s["tracking"]])
    r.append("color:var(--g-" + s.get("color", "ink") + ")")
    L.append(f".g-t-{k}{{{';'.join(r)};margin:0}}")
# 色相工具類
for h in T["color"]["hue"]:
    L.append(f".g-h-{h}{{--h:var(--g-{h});--h-soft:var(--g-{h}-soft);--h-deep:var(--g-{h}-deep);--h-ledge:var(--g-{h}-ledge)}}")
L.append(".g-on-night{color:var(--g-surface)}")
# 元件
L += [
".g-bubble{position:relative;display:inline-block;max-width:22em;padding:12px 18px;border-radius:var(--g-radius-lg);background:var(--g-surface-raised);box-shadow:var(--g-shadow-tile);font:var(--g-weight-bold) var(--g-text-md)/var(--g-leading-snug) var(--g-font-ui);color:var(--g-ink)}",
".g-bubble::after{content:'';position:absolute;left:26px;bottom:-7px;width:16px;height:16px;border-radius:0 0 6px 0;background:inherit;transform:rotate(45deg)}",
".g-bubble.g-h-sky,.g-bubble.g-h-sun,.g-bubble.g-h-mint,.g-bubble.g-h-rose,.g-bubble.g-h-lilac,.g-bubble.g-h-peach{background:var(--h-soft)}",
".g-tag{display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:var(--g-radius-pill);background:var(--h-soft,var(--g-sky-soft));color:var(--h-deep,var(--g-sky-deep));font:var(--g-weight-heavy) var(--g-text-xs)/1.2 var(--g-font-ui);letter-spacing:.04em}",
".g-chip{display:inline-flex;align-items:center;gap:6px;padding:6px 14px 6px 10px;border-radius:var(--g-radius-pill);background:var(--h-soft,var(--g-sun-soft));color:var(--h-deep,var(--g-sun-deep));font:var(--g-weight-black) var(--g-text-lg)/1 var(--g-font-number);font-variant-numeric:tabular-nums}",
".g-icon{display:inline-block;width:var(--g-icon-md);height:var(--g-icon-md);flex:none;vertical-align:middle}",
".g-iconbtn{display:inline-flex;align-items:center;justify-content:center;width:var(--g-tap-min);height:var(--g-tap-min);border:0;border-radius:var(--g-radius-pill);background:var(--h,var(--g-surface-raised));color:var(--g-ink);cursor:pointer;box-shadow:0 4px 0 var(--h-ledge,var(--g-stone-ledge));transition:transform var(--g-dur-instant) linear,box-shadow var(--g-dur-instant) linear}",
".g-iconbtn:active,.g-iconbtn.on{transform:translateY(3px);box-shadow:0 1px 0 var(--h-ledge,var(--g-stone-ledge))}",
".g-iconbtn .g-icon{width:var(--g-icon-lg);height:var(--g-icon-lg)}",
"@keyframes g-rise{0%{transform:translateY(8px) scale(.9);opacity:0}20%{opacity:1}100%{transform:translateY(-34px) scale(1);opacity:0}}",
".g-float{display:inline-block;animation:g-rise var(--g-dur-pose) var(--g-ease-soft) both;text-shadow:0 2px 0 var(--h-soft,var(--g-sun-soft));color:var(--h-deep,var(--g-sun-deep));font:var(--g-weight-black) var(--g-text-xl)/1 var(--g-font-number)}",
"@keyframes g-glow{0%,100%{opacity:.25;transform:translate(0,0)}50%{opacity:1;transform:translate(6px,-8px)}}",
"@keyframes g-charge-pulse{0%,100%{opacity:.72;transform:scale(1)}50%{opacity:1;transform:scale(1.08)}}",
"@keyframes g-charge-rise{0%{transform:translateY(0);opacity:0}25%{opacity:1}100%{transform:translateY(-46px);opacity:0}}",
".g-glow-core{transform-box:fill-box;transform-origin:center;animation:g-charge-pulse 1.1s ease-in-out infinite}",
".g-glow.full .g-glow-core{animation-duration:.5s;filter:brightness(1.12)}",
".g-glow-sp{animation:g-charge-rise 1.1s ease-out infinite}",
".g-glow.full .g-glow-sp{animation-duration:.6s}",
".g-firefly{animation:g-glow 3.2s ease-in-out infinite}",
"@keyframes g-spin{to{transform:rotate(360deg)}}",
".g-spin{transform-box:view-box;transform-origin:50% 50%;animation:g-spin 6s linear infinite}",
"@keyframes g-twinkle{0%,100%{opacity:.3}50%{opacity:1}}",
".g-twinkle{animation:g-twinkle 2.8s ease-in-out infinite}",
"@media (prefers-reduced-motion: reduce){:root{--g-dur-fast:0ms;--g-dur-base:0ms;--g-dur-slow:0ms;--g-dur-pose:0ms}.g-firefly,.g-float,.g-glow-core,.g-glow-sp,.g-spin,.g-twinkle{animation:none}.g-glow-sp{opacity:0}.g-float{opacity:1}}",
]
open(os.path.join(here, "game-tokens.css"), "w", encoding="utf-8").write("\n".join(L)+"\n")

js = ("/* 產生自 game-tokens.json — 請勿手改 */\n(function (g) {\n  var T = "
      + json.dumps(T, ensure_ascii=False) + ";\n  g.GameTokens = T;\n  if (typeof module !== 'undefined' && module.exports) module.exports = T;\n})(typeof window !== 'undefined' ? window : globalThis);\n")
open(os.path.join(here, "game-tokens.js"), "w", encoding="utf-8").write(js)

bad = 0; N = T["color"]["neutral"]
for h, s in T["color"]["hue"].items():
    if h in T["color"].get("hueDecorOnly", []): continue   # 只當裝飾填色（例如樹幹 bark），不放文字，不檢查對比
    r1 = cr(N["on-fill"], s["base"]); r2 = cr(s["deep"], s["soft"]); r3 = cr(s["deep"], N["surface"])
    for r in (r1, r2, r3): bad += r < 4.5
    print(f"{h:6} on-fill/base {r1:4.1f} | deep/soft {r2:4.1f} | deep/surface {r3:4.1f}")
for k in ("ink", "ink-soft"): bad += cr(N[k], N["surface"]) < 4.5
n = T["color"]["world"]["scene"]["forest"]["night"]
print("night: surface 字 / skyTop", round(cr(N["surface"], n["skyTop"]), 1))
print("OK" if not bad else f"{bad} 項未達標"); sys.exit(1 if bad else 0)
