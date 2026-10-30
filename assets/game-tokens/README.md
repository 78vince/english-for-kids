# Game Tokens v0.7（遊戲 design token）

遊戲專用視覺規範與繪製器，**與英語內容無關**，目標是推動學習動機與樂趣。獨立於 App 學習介面 token（`../design-tokens/`）。

預覽：Cowork Artifact「game-design-tokens」，或開啟 `preview.html`（單檔、可離線）。

## 檔案
| 檔案 | 說明 |
|---|---|
| `game-tokens.json` | **唯一資料來源**：色彩、造型、深度、文字、icon、動態、角色、場景、道具、按鍵 |
| `build-tokens.py` | 產生 `game-tokens.css` / `game-tokens.js`，並檢查對比 ≥ 4.5:1 |
| `game-art.js` | 共用繪圖工具、`GameArt.prop(id,{state})` |
| `game-props.js` | 30 件道具與互動狀態（含 4 種樹、日月） |
| `game-character.js` | `GameArt.character({view,facing,pose,t,…})`、`animate`、`randomLook` |
| `game-scene.js` | `GameArt.scene(id,w,h,{time})`、`sceneLayers(...)`（分層，供視差）；場景：forest、studio（攝影棚） |
| `game-export.js` | `GameArt.exportSVG(opts)`／`exportPNG(opts)` 拍照匯出、`GameArt.avatar(look,size)` 頭像（v0.4，第一關「人物設定」用） |
| `game-icons.js` | `GameIcons.icon(id,{size,color})`，55 個扁平雙色 icon（含工作室：camera、undo、redo、save、download、image、shirt、dice、trash、edit、face） |
| `preview.src.html` → `build-preview.py` → `preview.html` | 預覽頁（試玩、編輯器、圖庫） |

改 token：編輯 json → `python3 build-tokens.py` → `python3 build-preview.py`。載入順序：tokens → art → props → character → scene → export → icons。

## 規則摘要
1. **色彩**：9 色相 × 4 階（base／soft／deep／ledge）；漸層只用於場景天空；不用純黑純白色塊。
2. **造型**：全圓角、無深色描邊、線條圓頭；多邊形以同色描邊磨圓。
3. **文字**：12 種樣式 `.g-t-*`（display/title/heading/body/dialog/label/button/caption/number/score/tag/floating）＋元件 `.g-bubble .g-tag .g-chip .g-float`；無描邊字、無模糊陰影；數字 tabular。字型隨附 Nunito＋Noto Sans TC。
4. **Icon**：24 網格、主形狀＋35% 次形狀、圓頭圓角；按鈕 `.g-iconbtn`（≥56px）。
5. **角色**（120×170；v0.5 頭放大、脖子短、手掌大、半圓鞋底平）：肢體兩段、關節圓滑彎曲；視角 front／side／back（side 可 `facing:'left'`）。參數 swing（前後）、spread（向外）、bend（彎曲）；18 種動作（v0.4 新增 sit、salute、victory、sleep、think、surprise、shy；pose 可帶 `eyes`/`mouth`/`blush`/`fx`/`byView` 覆寫），v0.5 起 sit＝坐在椅子上（附 `seat` 小板凳）、sitGround＝坐地上；新增只改 json；序列（`motion.sequences`，`GameArt.sequenceAt`）可連播並轉身展示三視角。款式（v0.4）：髮型 +curly/twintail/long、眼 +lash/sparkle、口 +tongue、服裝 +jacket/stripe/sundress、配件 +star-clip/goggles/wings/cape、手持 +pinwheel/bouquet、小熊毛色 5 種；預設角色 9 組。部位 `data-part`：root、torso、head、armL/R、foreL/R、legL/R、shinL/R。
6. **場景**：「森林」與「攝影棚」，白天／夜晚；攝影棚只有 sky／far／ground 三層、無日月（`celestial.hidden`）；圖層 sky→far→mid→ground→near→canopy，可無縫平鋪；視差速度見 `parallax`；夜晚加螢火蟲（`.g-firefly`）與星月；夜晚時角色套 `world.light.night.filter`。
7. **虛擬按鍵**：↑↓←→＋A、B，≥56px，多點觸控。

## 待辦
- 場景第二批：海灘、溫暖房間（見 `docs/plan-game-level1-character-studio.md` §8）。
- 拍照二期：相框、貼紙、日期戳記。
- 通過後規劃平台遊戲本體。

## v0.5 規則（角色比例與動作）
- 頭：kid 半徑約 30、bear 約 30.5，下巴在 y=75；脖子只在正面露出約 6px。手掌半徑 8.2；鞋＝上緣半圓弧、下緣平貼 groundY=164。
- 正面手臂不再壓扁：`swing` 前擺→手臂往身體中線轉（僅 `spread` 小時），上臂長度不變；`bend` 永遠朝身體中線／頭的方向折。
- `legMode:'splay'`（正／背面膝蓋往兩側張開，用於蹲下、落地、坐地上）、`thighMin`、`sink`、`seat:{prop,hUnits}`（`GameArt.seatFor(pose)`；匯出拍照自動補座位）。

## v0.6 變更（2026-10-10）
- 移除：蝴蝶結、領巾、圍巾、星星髮夾、閃亮眼、大眼睛（oval）；正面不再畫背包（側面、背面仍有）。舊 id 對應見 `character.legacy`。
- 改名／改款：爆炸頭→**雙包頭 `twinbun`**；眯眯眼（`happy`）＝兩條橫線；小花束→**馬桶吸把 `plunger`**；書→**帶骨肉 `meat`**；翅膀＝羽毛翅膀；披風＝紅色（`character.colors.cape`）。
- 驚訝（`wide` 眼）＝有眼白與瞳孔的大眼睛。
- 手略大（半徑 9）並比膚色深約 6%；鞋略大；身體往下加長 4px（腿起點不變）；脖子再縮短（下巴 y=76，正面外露約 4.5px）。
- Z 軸：長直髮（正、側、背面）畫在身體之下，正面為全場最底層；歡呼（`armsTop`）兩手在最上層；背面兩手在最低層；側面遠手最低、近手最高。
- 坐在地上（正／背面盤腿）鞋底平面朝向身體中心（`footIn:90`）。

## v0.7 變更（2026-10-11）
- **營火**不再被裁切（64×60 框內完整）；其他道具底部／頂部超出 viewBox 的筆畫已收回（`LIFT` 位移），`exportSVG` 與場景嵌入的道具加 `overflow="visible"`。彈起類狀態（禮物方塊被撞擊、彈簧彈起）本來就會向上超出，容器要允許 overflow。
- **新道具**：`log` 木頭、`stump` 樹墩（可踩踏）；道具 json 新增 `collider`（`kind: solid|hazard`、`box`）：圓石 `rock`＝hazard（碰到跌倒）、石頭方塊／草地方塊／禮物方塊／木頭／樹墩＝solid（可站上、側面擋住）。
- **動作**：`trip`（絆倒，ramp）、`fallen`（趴倒暈）、`getup`（爬起，ramp）＋序列 `trip`（380＋1000＋520 ms）。動作新增 `ramp:true`（緩出到 base+amp 後停住）。`GameArt.poses` 共 21。
- **蓄力光暈**：角色 SVG 內建 `.g-glow`；`GameArt.setCharge(svg, on, full)` 開關；CSS 脈動／上升光點在 `game-tokens.css`；偏好減少動態時為靜態。

## v0.7 補充（2026-10-11）
- `exportSVG`：道具與角色改畫在 `near`（前景灌木）之後、`canopy` 之前，拍照時腳底不再被灌木蓋住（無 `near` 的場景退回 `ground` 之後）。
- `character.options.optionLabels`：所有選項 id → 中文名稱（App 可移除寫死的 `NAMES`）。`puff`＝爆炸頭仍保留；`twinbun`＝雙包頭（舊 `curly` 由 `legacy` 對應到 `twinbun`）。版本號不變（0.7.0，僅新增欄位）。

## v0.7.1（2026-10-11）樹幹加深
- 新增色票 `color.hue.bark`（base #7A5230／ledge #5F3F24／deep／soft），`tree`、`pine`、`cherry`、`palm`、`maple` 樹幹改用 bark；其他木製道具（告示牌、log、stump、板凳）維持 `wood`。
- 場景中景樹幹：白天 `midTrunk` #CBA982→#8A6240（ledge #6E4A2E）；夜晚 #6E6286→#3F3558（ledge #322A48），與土色地面、遠山分開。
- `meta.version` 0.7.1：App 的 `EXPECTED_GAME_TOKENS_VERSION` 請同步改 0.7.1，並覆蓋 `game-tokens.*`、`game-props.js`。

## v0.7.2（2026-10-11）跌倒殘影
- 原因：`character()` 不帶 `pose` 時畫的是站姿基準；`animate()` 原本等下一個 rAF 才套姿勢，序列每換一步（絆倒→趴倒→爬起）重畫 SVG 時會閃一格站姿。
- 修正：`animate()` 啟動與 `setPose()` 時先同步套用 t=0 的姿勢。
- App 端建議（選配，更保險）：`stageController.ts` 序列重畫時 `GameArt.character({...look, view, pose: q.pose, t: q.t})`；`startTrip` 後同一幀就重畫，不要等下一輪 loop。

## v0.8.0（2026-10-11）賽跑素材
- 新增 `game-race.js`：`GameArt.animal(kind,{pose,t,facing})`／`animateAnimal(svg,pose)`（烏龜・兔子・鴕鳥；idle／run／sleep／stumble／cheer／sad，啟動同步套 t=0）；賽跑道具 `speedShoe`、`boostCan`、`bubble`、`windZone`、`mud`、`branch`、`hive`、`warnSign`、`mileFlag`、`startGate`、`finishLine`（idle／broken）、`trophy`。載入順序：tokens → art → props → **race** → character → scene → export → icons。
- `game-tokens.json`：`props.list` +12（群組「賽跑」，新增 collider kind：`pickup`、`zone`、`spring`，hazard 可帶 `elev`／`needs`）；新增 `race`（cost 5、payout 0、track、player、effects、animals、referee〔泰迪熊〕、opponents、stages〔三場賽道資料〕、stars、unlock、rewards）；`color.hueDecorOnly:["bark"]`（build-tokens 對裝飾色不檢查文字對比）。
- `race-sim.js`：平衡試算（`node race-sim.js [次數]`，可用環境變數 `RACE_OVERRIDE` 覆寫參數）；目前勝率：第 1 場新手 99%、第 2 場一般 61%、第 3 場熟練 41%。
- 裁判＝角色系統 `bear`（`race.referee.look`），不另畫 rig。預覽頁新增 §9。

## v0.8.1（2026-10-12）
- `GameArt.animalAvatar(kind, size)`：動物頭部方形裁切（對手進度條、結算用）。
- 新道具 `podium`（頒獎台，120×72，無文字）：結算拍照可當前景。

## v0.9.0（2026-10-12）髮型與臉部細修
- **移除髮型**：爆炸頭 `puff`、馬尾 `ponytail`、包包頭 `bun`、長直髮 `long`；`character.legacy.hairStyle` 對應：puff→twinbun、ponytail→twintail、bun→short、long→bob（舊存檔自動轉換）。現有髮型：short、bob、buzz、sidepart、spiky、none、twinbun、twintail。
- **新增髮型**：平頭 `buzz`、旁分劉海 `sidepart`、刺蝟頭 `spiky`（正／側／背三視角；`optionLabels` 已加中文）。預設角色髮型：kid-sunny→spiky、kid-mint→buzz、kid-rose→sidepart、kid-fairy→bob。
- **臉型**：kid 兩側臉頰略突（正面、背面加兩顆臉頰圓，側面加前臉頰）；小熊不變。
- **脖子再短**：頭整體下移 2px（下巴貼肩）。
- **手（拳頭）**：半徑 9→10.5；手與前臂膚色＝臉部膚色（不再加深；側面遠手維持原本略暗）。

## v1.0.0（2026-10-12）臉型、眉毛、無脖子
- **臉頰回復**：移除 v0.9 的「兩側臉頰略突」，臉型預設 `round` 即原本的圓臉。
- **臉型** `options.faceShape`：`round` 圓臉（預設，原樣）、`square` 方臉、`oval` 橢圓臉、`pointed` 瓜子臉；只影響 kid（小熊不變）；正／側／背三視角，耳朵位置隨臉寬調整；下巴一律在原位（頭部縮放軸不變）。
- **眉毛** `options.brows`：`none`（預設，不畫）、`thin` 細眉、`thick` 粗眉、`arch` 彎眉、`sharp` 劍眉；顏色＝髮色加深（小熊＝毛色加深）；正面左右對稱、側面一道、背面不畫；`eyes:'wide'`（驚訝）時眉毛上抬 3。小熊也可畫眉毛。
- **脖子移除**：正／側／背面都不再畫脖子，頭直接接身體（頭位置維持 v0.9 的下巴 y=78）。
- 預設角色加入臉型／眉毛；`randomLook()` 也會隨機臉型與眉毛。舊存檔沒有這兩個欄位時用預設值（圓臉、無眉毛）。

## v1.0.1（2026-10-12）側面眉毛位置
- 側面眉毛中心＝眼睛 x ＋ `character.rig.browSideShift`（目前 1，設計單位；面向方向為正，面向左走鏡像）。同時修正舊算式（縮放軸心在原點）讓眉毛中心實際比眼睛靠後約 5 單位的問題；小孩、小熊都適用。正面、背面不變，驚訝上抬 3 的規則不變。

## v1.0.2（2026-10-12）刺蝟頭
- 刺蝟頭 `spiky`：尖刺改成「短小且多」（約 7–8 根、高約 5.5 單位，沿頭頂弧線排列，圓角）；正／側／背三視角。

## v1.1.0（2026-10-12）腿再短一點
- `character.rig.legCut`（目前 10，設計單位）：大腿與小腿各縮短一半；髖、肩、頭位置不變，站立時 `plant` 讓整個身體下移貼地，所以角色整體約矮 10 單位（腳底仍在 groundY=164）。想再調只改這個數字（0＝舊腿長）。正／側／背面與所有動作（跑、跳、蹲、坐、坐地、落地…）都已確認腳貼地；坐椅子的板凳高度不用改。

## v1.2.0（2026-10-12）雙馬尾側面、沖天炮、門牙笑
- 雙馬尾 `twintail` 側面：馬尾往後方微微翹起（正面、背面不變）。
- 新髮型 `rocket` 沖天炮：頭頂一束高高豎起的瀏海（正／側／背；側面微向前傾）。髮型順序：short、bob、buzz、sidepart、spiky、rocket、none、twinbun、twintail。
- 新嘴型 `teeth` 門牙笑：開心張嘴、看得見兩顆略為分開的門牙（小熊也可用；側面可用）。`optionLabels`：沖天炮、門牙笑。

## v1.2.1（2026-10-12）
- 沖天炮 `rocket`：頂端那束改成倒三角形（上寬下窄、圓角），額前瀏海（頂蓋）修短。
- 嘴型 `teeth` 名稱改為「可愛實實」（`optionLabels`）；門牙高度縮短、上緣貼齊嘴巴上緣、上緣平直無圓角（下緣仍微圓）。

## v1.3.0（2026-10-12）
- 移除髮型 `rocket` 沖天炮（`legacy.hairStyle.rocket → short`，舊存檔自動轉換）。
- 新動作 `shake` 抖腳舞（循環、週期 230ms）：兩腳微蹲、膝蓋左右交替快速抖動（正／背面膝蓋開合、側面膝蓋彎曲來回），兩手向下微微張開不動；表情：開心眼、張嘴。動作總數 22。

## v1.3.1（2026-10-12）抖腳舞改版
- `shake`：兩腳掌貼地（腳掌保持水平、位置不滑動）、雙腿呈蹲姿；抖動以雙腿內外角度為主——正／背面膝蓋開合（`legMode:'splay'`，`spread` 50±7，`bend` 隨 `spread` 同步以維持腳踝不動），側面膝蓋彎曲來回（`swing` 50±7、`bend` 50±11，`foot` 固定水平）。兩手向下微微張開不動。

## v1.3.2（2026-10-12）抖腳舞：雙腿向外／向內快速切換
- `shake` 正／背面：大腿外張角在「向外（膝蓋張開，約 +46°）」與「向內（大腿朝中線、小腿朝外，約 −30°，膝蓋內夾）」之間快速切換，小腿角度同步以維持腳掌貼地；腳掌保持水平。
- `ev()` 新增模式 `'snap'`（近似方波，tanh）：停留在兩端、快速切換，避免中間時間太長而像站直。側面維持膝蓋彎曲來回。

## v1.3.3（2026-10-12）
- `shake` 動作名稱改回「抖腳舞」（原本誤把說明文字寫進 label）。

## v1.4.0（2026-10-12）賽跑場景第二輪（依 `docs/handoff-prompt-letsgo-race-scene-r2.md`）
- **木頭物件加深**：`log`、`stump`、`campfire` 柴堆、`bench`、`stool`、`signpost` 改用 `bark` 色票（樹幹同色）；年輪／木牌線條維持淺木色。
- **移除順風氣流**：道具 `windZone` 與 `effects.wind` 刪除、三場賽道不再有順風帶。重新試算：兔子速度 140→134、各場 `targetTime` 改 25／23／20.5；勝率 第 1 場新手 97%、第 2 場一般 60%、第 3 場熟練 39%。
- **起點線／終點線**：`startGate`、`finishLine` 改成貼地的黑白格線（32×16，4 欄×2 列方格，無星形）；`finishLine` `broken` 狀態＝格線上方冒出彩帶碎片（在 viewBox 上方，容器需 `overflow:visible`）。舊的立起拱門保留為選用道具 `startArch`（140×130）、`finishArch`（120×140，`broken` 的六芒星換成彩帶圓點）。
- **森林樹冠高光移除**：`game-scene.js` 中景樹的淺色圓形高光拿掉（工作室與賽跑共用；`tree` 道具本來就沒有獨立高光）。
- **旗子朝上**：任何動作下，旗子（所有角色手持 `flag`）都保持朝上、略往外側傾 `character.rig.flagTilt`（12°），旗桿不再跟著手臂旋轉（`poseTransforms` 對手持物加反向旋轉 `held`）；裁判各姿勢（idle／wave／cheer／salute／victory／run）三視角已確認。

## v1.4.1（2026-10-12）物種只留小孩
- `options.species` 只剩 `['kid']`（工作室不再顯示物種選項）；`legacy.species.bear → kid`（舊存檔的小熊角色自動轉成小孩）；移除預設角色 `bear-buddy`、`panda-buddy`（現 7 組）。
- `bear` 仍保留在渲染器，只給熊熊裁判（`race.referee.look`）使用；`fur` 選項同為 bear 專用，工作室不用顯示。

## v1.5.0（2026-10-12）兔子跳躍前進＋賽跑步調（依 `docs/handoff-prompt-letsgo-rabbit-hop.md`）
- **兔子重畫**：直立的身體、大後腿、長耳朵、圓尾巴（圓潤無描邊）；`run` 改成**跳躍循環**（`runPeriod` 400ms）：落地壓扁＋後腿收 → 蹬地拉長 → 騰空（高約 20 單位、耳朵後飄、後腿伸直、機身略仰→俯）→ 前腳先落地；跳高、擠壓伸展都由動作本身（`root.y/sx/sy`）決定，App 不另外加。`idle`／`sleep`／`stumble`／`cheer`（較高的歡呼跳）／`sad` 都用新造型；`animalViewBox.rabbit` 130×112，`animalAvatar` 裁切同步調整。
- **步調參數**：`race.player.pace`＝`{hold:1.1, tap:1.35, back:0.85, tapCount:3, tapWindowMs:900, tapKeepMs:450}`（App 讀 token，沒有才用內建值）。
- **試算**：`race-sim.js` 加入步調（各熟練度的「按住 →」與「連點」時間比例）與「連點（熟練）」玩家；對手速度改為烏龜 120、兔子 148（衝刺 215）、鴕鳥 230；`targetTime` 23／20.5／18。勝率：第 1 場新手 96%、第 2 場一般 68%、第 3 場熟練 37%（連點的熟練玩家 98%）。

## v1.6.0 — 賽跑第三輪平衡（移除蹲滑）
- 移除 `branch`／`hive` 賽道物件（改為 rock／mud／log）；`stoneBlock` 疊層最多 2 層，每個 2 層方塊前加 1 層台階；`effects.branch`／`effects.hive`／`player.chargeJump` 已刪除。
- 加速：`speedShoe.mult` 1.6、`boostCan.mult` 2.1；連點步調 `player.pace.tap` 1.6。
- 對手重調：turtle 122；rabbit 215（午睡領先門檻 450）；ostrich 283。`targetTime` 24／18.5／14.5。
- race-sim（4000 次）：場1 新手 96%；場2 一般 63%；場3 熟練 47%；連點（熟練）三場 ≥100%/100%/100%。

## v1.7.0 — 學習代幣獲得規則（`economy`）
- 新增 `GameTokens.economy`：firstClear 6、personalBest 2、perfectFirst 3、review 1（同題型單元每天最多 3 次）× `stageWeight` × `unitMultiplier.byUnit`。不設每日總上限。
- 單元倍率：l4u1 1、l4u2 1、l4u3 1.25、l4u4 1.25（規則：單字數 ×（0.5＋0.5×平均難度層級），<30／30–50／>50 → 1／1.25／1.5）。
- 試算：Unit 4 七種題型第一次全完成約 80，再複習一輪約 15（舊規則固定 35）。

## v1.8.0 — 手機橫式版面規格（`layout.landscapePhone`）
- 三欄（左欄 144／遊戲畫面 16:9／右欄 96）、按鍵尺寸（← 56、→ 72、A 72、B 56）、HUD 搬到側欄、計時＋進度條改上方細列、過關對話框橫式雙欄。數值給 App 讀，不改繪圖檔。

## v2.0.0 — 爬樹（`treeClimb`、`game-tree.js`、`tree-sim.js`）
- 載入順序：tokens → art → props → race → **tree** → character → scene → export → icons。
- `GameArt.treeBuild(levelId, seed)`：回傳保證可通關的樹枝陣列（`{side,len,style,alt,kind,x0,x1,id}`；左側枝由 App 鏡像）。`treeCompose(camAlt,w,h,{branches,sprites})` 為靜態合成；實際遊玩請用 `treeChunk(layer,idx)` 分層捲動（視差 far .5／mid .75／trunk 1／near 1.15）。`treeSkyAt`、`treeZoneAt`、`treeTrunkHalf` 供天色與分區查詢。
- 世界：50 單位＝1 m，頂高 8000（160 m），分區 ground/forest/canopy/mountain/edge。樹枝為單向平台，頂面 y=14。
- 新動作 `parachute`、`fly`；新道具群組「爬樹」（23 個，含 `capeItem` 披風、`capeFx`、`parachute`）。
- 平衡：`node tree-sim.js 4000`；`TREE_OVERRIDE='{"stars":{...}}'` 可覆寫試算。
- 徽章 TC-01..08 在 `treeClimb.rewards.badges`（草案，未入 badges.json）。

## v2.8.0 — 我的角色 — 打地鼠（mole、game-tokens.json、props.moleHole）
- 新增 `GameTokens.mole` 數值區塊（`cost: 5, payout: 0, durationSec: 30, holeCount: 8, starThresholds: [8, 16, 24]`，暖身/加速/極速三階段、成就稱號與鼓勵文案）。
- 新增道具 `props.moleHole`（120×60，支援 idle/back/front/active 狀態）：深色坑底、翻土土堆與草葉，無描邊、全圓角、色相遵循 leaf/wood/bark token。
- 支援西瓜帽目標（已收錄於 `accessories: melonhat`）。

## v2.9.0 — 森林場景生物（蝙蝠道具 props.bat、蜜蜂支援）
- 新增道具 `props.bat`（48×36，支援 up/down 振翅狀態）：夜晚飛行生物，深紫萌趣造型，無描邊、全圓角、色相遵循 lilac deep / neutral token。

## v2.10.0 — 萬聖節「暗夜魔法與夜光墓園」（配件、手持物、墓園場景與道具）
- **萬聖節稀有著裝配件與手持物（稀有款統一 120 代幣）**：
  - `accessories: witchhat`（巫師帽，120 代幣）：放大寬大帽簷與加高微彎尖錐，金色飾帶配星星扣，經典深紫巫師造型。
  - `held: magiccane`（魔拐杖，120 代幣）：等身高深木長杖，杖頭頂端盤旋捲曲＋微光薄荷綠晶球，支援反向旋轉補償保持朝上。
  - `accessories: pumpkinhood`（南瓜萌頭，120 代幣）：正面輪廓完全參照背面三個直立橢圓形交疊的波浪立體輪廓（上下具備南瓜瓣凹槽與飽滿起伏，正／側／背三視角皆純淨純色無雜線無反光點，頂端配深綠瓜蒂與歪斜綠葉），納入 `HOOD_ACCESSORIES` 互斥清單。
  - `held: pumpkinbucket`（南瓜糖果桶，120 代幣）：微笑南瓜手提桶＋彩色糖果棒，支援反向旋轉補償保持朝上。
- **操作介面與專屬特技（C 鍵與技能強化）**：
  - 虛擬按鍵（VirtualPad）動態出現紫丁香色 **C 鍵**，定位於 A 鍵左側（形成 C-A-B 經典三角形佈局，支援實體鍵盤 C / L）。
  - 裝備魔拐杖按 C 鍵：角色執行揮手動作（`wave`），爆發超大範圍煙火光環、22 枚向量閃光晶片，以及向八方四射飛馳的長拖尾流星（`magic-meteor`）。
  - 裝備南瓜糖果桶按 C 鍵：角色執行揮手動作（`wave`），26 顆向量糖果雨（蝴蝶糖、棒棒糖、軟糖豆）從角色上方「畫面外」降下並直落至「地面」彈跳。
  - **特技驅散怪物機制**：當使用者施放魔拐杖或南瓜糖果桶效果時，畫面中的所有可愛殭屍會背對使用者慌張揮手蹦跳逃離 3 秒（若正抱著角色則立即鬆脫嚇跑）；咬人的寶箱會立即關閉退縮，且 3 秒內進入防禦冷卻不咬人（若角色正被寶箱咬住則立即鬆開解困並恢復跳躍與行走）。
- **萬聖節主題場景（墓園重新配置與互動）**：
  - `scene: graveyard`（夜光墓園，180 代幣）：暮光暮色（day）／幽冥月夜（night），遠方尖塔古堡剪影、鐵花柵欄、枯木老樹、南瓜墓碑與地表夜光小鬼火。
  - **移除獎盃與石頭**，配置南瓜墓碑（`tombstone`）、老樹樁（`stump`）、墓石階梯與高台。
  - **左右隨機移動的大型墓碑（`tombstone`，1.8 倍大）**：原石頭處替換為大型發光南瓜墓碑，每次隨機向左或向右平滑移動約一個物件寬度，角色可跳至墓碑頂端隨其平移。
  - **會咬人的寶箱（`chest`，加大為目前的 1.5 倍（即 3 倍大尺寸），支援 bite / dizzy 狀態與張嘴後的鋸齒尖牙）**：碰到會被寶箱大嘴咬住，張嘴露出上下交錯的鋒利鋸齒尖牙，角色無法行走與跳躍。快速交替連按方向鍵「← →」持續 5 秒即可跳離寶箱至一個角色遠，寶箱陷入眩暈。
  - **可愛小殭屍（`zombie`，支援 hop / hug / dizzy 狀態）**：地表緩步跳躍巡邏，碰到角色會緊緊抱住，使角色行走變慢（0.35x）、跳不高（0.25x）。快速交替連按方向鍵「← →」持續 5 秒即可把可愛殭屍彈開至三個角色遠。
  - 掙脫時角色頭頂具備動態進度條（`.studio-struggle-hud`）與掙扎左右搖晃動畫。
  - **墓園停留彩蛋（180 秒群蝠掠過佔據畫面 10 秒）**：當使用者在墓園場景停留超過 180 秒（3 分鐘），畫面中會呼嘯掠過多波次萌趣蝙蝠（48 隻純向量 SVG 蝙蝠，支援雙翼扇動動畫與 4 種深淺波浪穿梭俯衝軌跡），飛行高度均勻分布於畫面高空、中景與近地層（4% 至 90% 全面涵蓋），全屏熱鬧佔據畫面達 **10 秒** 後平滑退場並完全清理。切換場景時會立即清除蝙蝠並重新計時。
- **萬聖節道具**：
  - `props.zombie`（萌萌小殭屍，56×72，支援 idle/hop/wave/hug/dizzy 狀態）：粉綠膚色、官帽愛心符咒、平舉雙手。
  - `props.tombstone`（南瓜墓碑，60×64，支援 idle/glow 狀態）：圓角厚石碑、頂端蹲著微笑發光小南瓜，solid 碰撞。
  - `props.moon`（月亮，120×120，支援 round / skull 狀態）：月亮預設為經典圓月（`state: round`，圓形月體、光暈與三個隕石坑）；**骷髏頭月亮（`state: skull`）專屬於墓園場景夜空**（外圍散發兩層紫霧夜光光暈，月體呈現完整骷髏頭顱剪影輪廓，表面點綴月球隕石坑，眼窩深邃透著夜色微光，配上倒心形鼻腔與下顎整齊排列的牙齒紋理），其餘場景（如森林、攝影棚等）依照原本經典圓月樣式。
  - `props.giantHand`（地底巨手，72×88，支援 hidden / grab / retreat 狀態）：埋伏於不特定的地底位置，觸發前為隱藏狀態（畫面上完全無異樣），當使用者走過該地點時破土突襲冒出抓住角色；支援左右連按 5 秒掙脫，以及被魔拐杖／南瓜糖果桶特技嚇退縮回地底並重新遷移至隨機新位置。

## v2.11.0 — 萬聖節特殊關卡「巨大南瓜怪大作戰」（stoneLantern、giantPumpkin、victoryChest、zombieTalisman）
- **關卡專用道具與 Boss（夜光墓園特殊關卡）**：
  - `props.stoneLantern`（辟邪石燈籠，52×80，支援 off / lit 狀態）：古老青石燈籠，使用魔拐杖或南瓜糖果桶的 C 鍵聖光可點亮；點亮時散發暖金聖火與薄荷綠光暈。
  - `props.giantPumpkin`（巨大南瓜怪，320×280，實體比例比畫面還大）：具備蓄力壓扁（squat）、衝天超高跳躍（jump，僅剩 1/5 頂部在可見邊緣）、砸地震顫（slam）與被聖光擊碎（shatter）等動態狀態，不可穿透實體碰撞壁。
  - `props.victoryChest`（萬聖勝利寶箱，64×52，支援 closed / open 狀態）：擊碎大南瓜後從地底升起的金色獎勵寶箱，開啟時金光與星芒四射，掉落「變身符咒」。
- **特殊獎勵配件與變身彩蛋**：
  - `accessories: zombieTalisman`（變身符咒）：裝備後角色額頭貼著隨風飄動的黃色符咒，外觀化身為可愛小殭屍造型（青綠色皮膚、腮紅與古風小袍），並暫時隱藏無效其他飾品與手持物。
  - **殭屍行動模式**：走動速度降為一般殭屍跳步速度（0.65x），無法奔跑衝刺，但保留正常跳躍能力。
  - **夜光墓園怪物免疫與社交對話**：殭屍、寶箱、巨手不再攻擊玩家；走近墓園怪物時，怪物頭頂會跳出幽默童趣的萬聖節隨機聊天對話框。
- **關卡數值（GameTokens.pumpkinBoss）**：
  - 3 顆愛心生命值、點亮 5 座石燈籠通關、1.8 秒無敵受傷閃爍保護。

## v2.11.1 — 巨大南瓜怪再次挑戰通關獎勵（repeatRewardTokens）
- **再次挑戰獎勵**：
  - 再次擊退巨大南瓜怪（已獲得過變身符咒）時發放 30 遊戲幣通關獎勵（`repeatRewardTokens: 30`）。









## v2.12.1（2026-10-28）平板橫放放大遊戲畫面
- `layout.screen.modes.tabletLand`：按鍵 dpad 58／act 64、操作區上下間距 4；`tabletLand`、`desktop` 新增 `stripInHud: true`（計時進度移到資訊列中間，不再自己佔一列）。iPad 1180×820 遊戲畫面約 693×390 → 約 960×540。

## v2.12.0（2026-10-28）統一按鍵 v2 與五種版面
- `controls.v2`：所有遊戲一律顯示十字鍵＋A、B、C、D；A＝跳／確定、B＝加速、C／D＝道具（拿到特定道具才啟用）；沒有功能的鍵半透明（0.35）、按了不觸發；按鍵只顯示英文字母。位置 `abcdUnits`（以直徑為 1）：C、A 一排、D、B 一排，各排左邊高 0.28 顆、下排往左錯開。鍵盤：A＝空白／J、B＝Shift／K、C＝L、D＝I。
- `layout.screen`：手機橫放／手機直放／平板直放／平板橫放／電腦的判斷條件、按鍵尺寸、兩側欄寬與操作區內距；按鍵只出現在操作區，不蓋遊戲畫面。App 端由 `app/src/game/gameScreen.ts`＋`VirtualPad({ v2: true })` 讀取。
