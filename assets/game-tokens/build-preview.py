#!/usr/bin/env python3
"""把 css 與全部 js 內嵌進 preview.src.html → preview.html（單檔，可離線開啟，也可作為 Artifact）。
先跑 build-tokens.py。"""
import os
h = os.path.dirname(os.path.abspath(__file__))
rd = lambda n: open(os.path.join(h, n), encoding="utf-8").read()
src = rd("preview.src.html")
js = "\n".join(rd(n) for n in ("game-tokens.js", "game-art.js", "game-props.js", "game-race.js", "game-tree.js", "game-character.js", "game-scene.js", "game-export.js", "game-icons.js"))
out = src.replace("/*@CSS@*/", rd("game-tokens.css")).replace("/*@JS@*/", js.replace("</script", "<\\/script"))
open(os.path.join(h, "preview.html"), "w", encoding="utf-8").write(out)
print("preview.html", len(out)//1024, "KB")
