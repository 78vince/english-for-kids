/* game-export.js — 拍照（截圖）匯出與頭像。
 * GameArt.exportSVG(opts) → 獨立 SVG 字串（CSS 變數、filter 已展開成實值，可直接轉 PNG）
 *   opts: { scene:'forest', u:0~1（時間軸，預設正午）, aspect:'16:9'|'1:1'|'4:5', width, height,
 *           look:{…角色外觀}, pose:'idle', t:毫秒, view:'front'|'side'|'back', facing:'right'|'left',
 *           charX:0~1（角色水平位置，預設 .5）, charH:0~1（角色高度占畫面比，預設 .42）, feetY:0~1（腳底，預設 .88）,
 *           shadowY:0~1（腳下支撐面＝陰影位置；跳起來、在水裡浮著時比 feetY 低，影子留在地面／方塊上並變小變淡，預設＝feetY）,
 *           rot:度（宇宙空間的身體旋轉，繞身體中心）, scale:0~1（被黑洞吸進去時縮小）, shadow:false（不畫影子：飄在太空中）,
 *           shift:0~∞（背景水平位移，單位＝畫面寬；依各圖層視差係數換算）,
 *           props:[{id, x:0~1, state, h:0~1（高度占比，預設 .16）, front:true|false}] }
 * GameArt.exportPNG(opts) → Promise<Blob>（僅瀏覽器）
 * GameArt.avatar(look, size) → 頭像 SVG（頭部裁切）
 * 設計原因：整個舞台都是 SVG，拍照時重組成單一 SVG 再光柵化，畫質與螢幕解析度無關，也不需要截圖整個畫面。 */
(function (g) {
  var A = g.GameArt, H = A._h, T = H.T, C = T.color, N = C.neutral;
  var SIZES = { '16:9': [1920, 1080], '1:1': [1080, 1080], '4:5': [1080, 1350] };

  /* 展開 CSS 變數：--sunc 以太陽顏色取代，其餘取後備值 */
  function expandVars(str, sunc) {
    return str.replace(/var\(--sunc,\s*([^)]+)\)/g, function (m, f) { return sunc || f.trim(); }).replace(/var\((--[\w-]+),\s*([^)]+)\)/g, '$2');
  }
  /* 夜晚濾鏡：把 "brightness(.88) saturate(.92)" 轉為 SVG filter（canvas 光柵化時 CSS filter 不可靠） */
  function nightFilter(id) {
    var f = (C.world.light && C.world.light.night && C.world.light.night.filter) || '', b = /brightness\(([\d.]+)\)/.exec(f), s = /saturate\(([\d.]+)\)/.exec(f);
    var br = b ? +b[1] : 1, sa = s ? +s[1] : 1;
    return '<filter id="' + id + '" color-interpolation-filters="sRGB"><feComponentTransfer><feFuncR type="linear" slope="' + br + '"/><feFuncG type="linear" slope="' + br + '"/><feFuncB type="linear" slope="' + br + '"/></feComponentTransfer><feColorMatrix type="saturate" values="' + sa + '"/></filter>';
  }
  function nestProp(id, state, cx, bottom, hpx) {
    var sz = A.props.filter(function (p) { return p.id === id; })[0]; if (!sz) return '';
    var w = hpx * sz.size[0] / sz.size[1];
    return A.prop(id, { state: state }).replace('<svg ', '<svg overflow="visible" x="' + (cx - w / 2).toFixed(1) + '" y="' + (bottom - hpx).toFixed(1) + '" width="' + w.toFixed(1) + '" height="' + hpx.toFixed(1) + '" ');
  }

  function exportSVG(o) {
    o = o || {};
    var id = o.scene || 'forest', F = C.world.scene[id]; if (!F) throw new Error('未知場景：' + id);
    var size = SIZES[o.aspect || '16:9'] || SIZES['16:9'], W = o.width || size[0], Hh = o.height || size[1];
    var u = o.u != null ? o.u : .25, K = A.skyAt(id, u), shift = (o.shift || 0) * W;
    var Ld = A.sceneLayers(id, 'day', W, Hh), Ln = A.sceneLayers(id, 'night', W, Hh), gy = Ld._groundY;
    var gid = 'gx' + H.nextId(), fid = 'gn' + H.nextId(), sky = '', body = '', front = '';
    sky = '<defs><linearGradient id="' + gid + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + K.top + '"/><stop offset="1" stop-color="' + K.bottom + '"/></linearGradient>' + nightFilter(fid) + '</defs>' + H.rect(0, 0, W, Hh, 0, 'url(#' + gid + ')');
    function lay(n, inner, op) {
      if (!inner) return '';
      var par = F.parallax[n] || 0, dx = par ? -(shift * par % W) : 0, grp = par ? '<g transform="translate(' + dx.toFixed(1) + ' 0)">' + inner + '</g><g transform="translate(' + (dx + W).toFixed(1) + ' 0)">' + inner + '</g>' : inner;
      return '<g' + (op != null && op < 1 ? ' opacity="' + Math.max(0, op).toFixed(3) + '"' : '') + '>' + grp + '</g>';
    }
    var feet = (o.feetY != null ? o.feetY : .88) * Hh, charPx = (o.charH != null ? o.charH : .42) * Hh, cw = charPx * 120 / 170, cx = (o.charX != null ? o.charX : .5) * W;
    var charSvg = A.character(Object.assign({}, o.look || A.presets['kid-blue'], { view: o.view || 'front', facing: o.facing || 'right', pose: o.pose || 'idle', t: o.t || 0 }))
      .replace('<svg ', '<svg x="' + (cx - cw / 2).toFixed(1) + '" y="' + (feet - charPx * 164 / 170).toFixed(1) + '" width="' + cw.toFixed(1) + '" height="' + charPx.toFixed(1) + '" ');
    /* 角色離開支撐面（跳躍、水中漂浮）：拿掉角色身上的影子，另外在支撐面畫一個縮小、變淡的影子（同舞台畫面） */
    var shY = o.shadowY != null ? o.shadowY * Hh : feet, lift = shY - feet, shadowSvg = '';
    if (o.shadow === false) charSvg = charSvg.replace(/<g data-part="shadow"[^>]*>[\s\S]*?<\/g>/, '');
    else if (lift > 1) {
      charSvg = charSvg.replace(/<g data-part="shadow"[^>]*>[\s\S]*?<\/g>/, '');
      var hh = Math.min(1, lift / (Hh * .4));
      shadowSvg = H.ell(cx, shY, cw * 28 / 120 * (1 - .4 * hh), charPx * 4.5 / 170, T.depth.shadow.ground, { opacity: (1 - .45 * hh).toFixed(2) });
    }
    /* 宇宙空間：旋轉／縮放繞身體中心（腳底往上 .435 角色高，同舞台 .gstage-me 的 transform-origin 50% 53%） */
    if ((o.rot || 0) % 360 || (o.scale != null && o.scale !== 1)) {
      var ocy = (feet - charPx * .435).toFixed(1), sc = o.scale != null ? Math.max(0, o.scale) : 1;
      charSvg = '<g transform="translate(' + cx.toFixed(1) + ' ' + ocy + ') rotate(' + (+(o.rot || 0)).toFixed(1) + ') scale(' + sc.toFixed(3) + ') translate(' + (-cx).toFixed(1) + ' ' + (-ocy) + ')">' + charSvg + '</g>';
    }
    var props = (o.props || []).slice(), pb = '', pf = '', seat = A.seatFor && A.seatFor(o.pose || 'idle');
    if (seat && o.seat !== false) props.push({ id: seat.prop, x: cx / W + seat.dx * charPx / 170 / W, y: feet / Hh, h: seat.hUnits / 170 * charPx / Hh, front: false });
    props.forEach(function (p) {
      var s = nestProp(p.id, p.state, p.x * W, (p.y != null ? p.y : .88) * Hh, (p.h || .16) * Hh);
      if (p.front) pf += s; else pb += s;
    });
    /* 道具與角色畫在 near（前景灌木）之後、canopy 之前，拍照時腳底不被灌木蓋住；無 near 的場景退回 ground 之後 */
    var anchor = F.layers.indexOf('near') >= 0 ? 'near' : 'ground';
    F.layers.forEach(function (n) {
      if (n === 'sky') return;
      var d = Ld._inner[n], nt = Ln._inner[n], s = '';
      if (n === 'stars') {
        s += lay(n, nt, K.night);
        if (K.sun.visible && F.celestial && !F.celestial.hidden) s += H_nest('sun', K.sun, W, Hh, K.sun.color, 1, 1 - K.night * .0);
        var moonState = id === 'graveyard' ? 'skull' : 'round';
        if (K.moon.visible && F.celestial && !F.celestial.hidden) s += H_nest('moon', K.moon, W, Hh, null, 1.1, 1, moonState);
      } else { s += lay(n, d, 1) + (nt ? lay(n, nt, K.night) : ''); }
      if (n === 'near' || n === 'canopy') front += s; else body += s;
      if (n === anchor) { var cg = pb + shadowSvg + '<g' + (K.night > .5 ? ' filter="url(#' + fid + ')"' : '') + '>' + charSvg + '</g>' + pf; if (n === 'near') front += cg; else body += cg; }
    });
    function H_nest(pid, obj, w, h, color, k, st) {
      var px = obj.size * h * k, s = A.prop(pid, st ? { state: st } : {}).replace('<svg ', '<svg x="' + (obj.x * w - px / 2).toFixed(1) + '" y="' + (obj.y * h - px / 2).toFixed(1) + '" width="' + px.toFixed(1) + '" height="' + px.toFixed(1) + '" ');
      return s;
    }
    var out = '<svg xmlns="http://www.w3.org/2000/svg" width="' + W + '" height="' + Hh + '" viewBox="0 0 ' + W + ' ' + Hh + '" fill="none">' + sky + body + front + '</svg>';
    return expandVars(out, K.sun && K.sun.color);
  }

  function exportPNG(o) {
    return new Promise(function (resolve, reject) {
      if (typeof document === 'undefined') { reject(new Error('exportPNG 只能在瀏覽器執行')); return; }
      var svg = exportSVG(o), m = /width="(\d+)" height="(\d+)"/.exec(svg), w = +m[1], h = +m[2];
      var img = new Image();
      img.onload = function () {
        var c = document.createElement('canvas'); c.width = w; c.height = h; var x = c.getContext('2d'); x.drawImage(img, 0, 0, w, h);
        c.toBlob(function (b) { b ? resolve(b) : reject(new Error('toBlob 失敗')); }, 'image/png');
      };
      img.onerror = function () { reject(new Error('SVG 載入失敗')); };
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    });
  }

  function avatar(look, size) {
    var s = A.character(Object.assign({}, look || A.presets['kid-blue'], { view: 'front', pose: null }));
    s = s.replace('viewBox="0 0 120 170"', 'viewBox="14 3 92 92"').replace('overflow="visible"', 'overflow="hidden"');
    return size ? s.replace('<svg ', '<svg width="' + size + '" height="' + size + '" ') : s;
  }

  A.exportSVG = exportSVG; A.exportPNG = exportPNG; A.avatar = avatar; A.photoSizes = SIZES;
})(typeof window !== 'undefined' ? window : globalThis);
