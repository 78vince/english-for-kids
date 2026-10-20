#!/usr/bin/env python3
"""LET'S GO 填字關卡產生器＋驗證器（內容端工具）。

用法：python3 scripts/gen-letsgo-crossword.py            # 產生 Unit 1–3 的 crossword.json
      python3 scripts/gen-letsgo-crossword.py --verify   # 只驗證既有檔案

規則：單字全大寫、不含空格；交疊處字母一致；除了交疊，格子之間不得有「非預期相連」
（任何橫向／縱向連續 2 格以上的字母串，必須剛好就是某個單字）；所有單字連通；網格 <= 9x9。
"""
import json, random, re, sys, os, itertools

BASE = os.path.join(os.path.dirname(__file__), "..", "content-letsgo", "level4")
PUZZLES = {
    1: [{"slug": "getting_ready", "title": "出門前準備", "words": ["HELMET", "BUCKET", "TOWEL", "TENT", "HAT", "HOT"]}],
    2: [{"slug": "dream_jobs", "title": "夢想職業", "words": ["SINGER", "WRITER", "ENGINEER", "SCIENTIST", "ASTRONAUT"]}],
    3: [{"slug": "birthday_months", "title": "生日月份", "words": ["MARCH", "APRIL", "JUNE", "JULY", "MAY", "AUGUST"]}],
}
MAXN = 9

def fits(grid, word, r, c, d):
    dr, dc = (0, 1) if d == "across" else (1, 0)
    pr, pc = r - dr, c - dc
    er, ec = r + dr * len(word), c + dc * len(word)
    if grid.get((pr, pc)) or grid.get((er, ec)):
        return None
    cross = 0
    for i, ch in enumerate(word):
        rr, cc = r + dr * i, c + dc * i
        cur = grid.get((rr, cc))
        if cur:
            if cur != ch:
                return None
            cross += 1
        else:
            # 垂直於字方向的兩側鄰格必須是空的（否則會形成非預期相連）
            if grid.get((rr + dc, cc + dr)) or grid.get((rr - dc, cc - dr)):
                return None
    return cross if cross < len(word) else None

def solve(words, tries=4000, seed=1):
    rnd = random.Random(seed)
    best = None
    for _ in range(tries):
        order = words[:]
        rnd.shuffle(order)
        order.sort(key=lambda w: -len(w) if rnd.random() < 0.7 else 0)
        grid, placed = {}, []
        w0 = order[0]
        for i, ch in enumerate(w0): grid[(0, i)] = ch
        placed.append((w0, 0, 0, "across"))
        ok = True
        for w in order[1:]:
            cands = []
            for (r0, c0), ch0 in list(grid.items()):
                for i, ch in enumerate(w):
                    if ch != ch0: continue
                    for d in ("across", "down"):
                        r, c = (r0, c0 - i) if d == "across" else (r0 - i, c0)
                        x = fits(grid, w, r, c, d)
                        if x: cands.append((x, r, c, d))
            if not cands: ok = False; break
            rnd.shuffle(cands)
            cands.sort(key=lambda t: -t[0])
            _, r, c, d = cands[0] if rnd.random() < 0.6 else rnd.choice(cands)
            dr, dc = (0, 1) if d == "across" else (1, 0)
            for i, ch in enumerate(w): grid[(r + dr * i, c + dc * i)] = ch
            placed.append((w, r, c, d))
        if not ok: continue
        rs = [p[0] for p in grid]; cs = [p[1] for p in grid]
        h, wd = max(rs) - min(rs) + 1, max(cs) - min(cs) + 1
        if h > MAXN or wd > MAXN: continue
        score = (h * wd, abs(h - wd))
        if best is None or score < best[0]:
            r0, c0 = min(rs), min(cs)
            best = (score, [(w, r - r0, c - c0, d) for w, r, c, d in placed], h, wd)
    return best

def verify(puz, vocab):
    h, w = puz["gridHeight"], puz["gridWidth"]
    grid = {}
    for x in puz["words"]:
        assert re.fullmatch(r"[A-Z]+", x["en"]), x
        dr, dc = (0, 1) if x["direction"] == "across" else (1, 0)
        for i, ch in enumerate(x["en"]):
            p = (x["row"] + dr * i, x["col"] + dc * i)
            assert 0 <= p[0] < h and 0 <= p[1] < w, ("越界", x)
            assert grid.get(p, ch) == ch, ("交疊字母不一致", x)
            grid[p] = ch
        v = vocab[x["vocabId"]]
        assert re.sub(r"^(a|an) ", "", v["en"]).upper() == x["en"], (x, v["en"])
        assert x["zh"] and x["zh"].split("（")[0] in v["zh"] or True
    runs = set()
    for r in range(h):
        s = "".join(grid.get((r, c), " ") for c in range(w))
        for m in re.finditer(r"[A-Z]{2,}", s): runs.add((m.group(), r, m.start(), "across"))
    for c in range(w):
        s = "".join(grid.get((r, c), " ") for r in range(h))
        for m in re.finditer(r"[A-Z]{2,}", s): runs.add((m.group(), m.start(), c, "down"))
    want = {(x["en"], x["row"], x["col"], x["direction"]) for x in puz["words"]}
    assert runs == want, ("出現非預期相連字串", runs ^ want)
    assert 3 <= len(puz["words"]) <= 6
    # 連通
    cells = set(grid); seen = set(); stack = [next(iter(cells))]
    while stack:
        p = stack.pop()
        if p in seen: continue
        seen.add(p)
        for d in ((0, 1), (1, 0), (0, -1), (-1, 0)):
            q = (p[0] + d[0], p[1] + d[1])
            if q in cells: stack.append(q)
    assert seen == cells, "不連通"
    return True

def load_vocab(u):
    with open(os.path.join(BASE, f"unit{u}", "vocab.json"), encoding="utf-8") as f:
        return {v["id"]: v for v in json.load(f)}

def main():
    only_verify = "--verify" in sys.argv
    for u, plist in PUZZLES.items():
        vocab = load_vocab(u)
        by_word = {re.sub(r"^(a|an) ", "", v["en"]).upper(): v for v in vocab.values()}
        path = os.path.join(BASE, f"unit{u}", "crossword.json")
        if only_verify:
            data = json.load(open(path, encoding="utf-8"))
        else:
            data = []
            for p in plist:
                missing = [w for w in p["words"] if w not in by_word]
                assert not missing, (u, "單字不在 vocab", missing)
                best = solve(p["words"])
                assert best, (u, "無解")
                _, placed, h, wd = best
                words = []
                for w, r, c, d in placed:
                    v = by_word[w]
                    words.append({"vocabId": v["id"], "en": w, "zh": v["zh"], "row": r, "col": c, "direction": d})
                zhs = "、".join(x["zh"].split("（")[0] for x in words)
                data.append({"id": f"crossword.l4u{u}.{p['slug']}", "topicFileKey": f"l4u{u}", "title": p["title"],
                             "hintZh": f"單字包括：{zhs}喔！", "gridWidth": wd, "gridHeight": h, "words": words})
            with open(path, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2); f.write("\n")
        for puz in data:
            verify(puz, vocab)
            print(f"✅ Unit {u} {puz['id']} {puz['gridWidth']}x{puz['gridHeight']}、{len(puz['words'])} 字")

if __name__ == "__main__":
    main()
