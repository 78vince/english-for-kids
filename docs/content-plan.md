# 兒童英語學習內容規劃

本文件規劃兒童英語學習平台的「單字 / 短句 / 短文」內容範圍與資料架構，重點解決三件事：資料如何新增、修改、引用、擴充；關卡如何分類；以及其他建議事項。

> 更新記錄（2026-08-22）：本文件原名 `content-plan-gept-kids.md`，內容原本直接引用特定測驗機構的官方字表與名稱作為規劃依據。考量該機構已公開聲明其測驗名稱、服務標章受商標保護，且參考字表本身亦標示著作權聲明，為避免商標與編輯著作權爭議，已將文件改名並移除相關品牌引用，改以「台灣國小階段常見英語學習主題」作為中性描述；規劃邏輯、資料架構與分類方式維持不變。舊檔 `content-plan-gept-kids.md` 僅留下指向本文件的提示，內容不再維護。

---

## 1. 範圍依據

本專案的單字範圍鎖定**國小階段、CEFR A1 程度**的兒童英語學習內容，字彙量規劃約 600 字上下，依生活主題分類（見第 5 節附錄），適用對象為國小學童。

> 重要前提：內容本身不對應任何特定測驗的官方分級，「關卡分等」是我們自己設計的一套教學用漸進式難度結構，讓孩子能從零逐步累積到涵蓋規劃字量，跟準備任何特定考試無關。

---

## 2. 資料結構設計

目標：新增一個單字、修改一個翻譯、讓短文引用某個單字、日後擴充內容範圍，都應該是低風險、低成本的操作。

### 2.1 設計原則

1. **內容即資料（content-as-data），以純文字 JSON 存放在 git repo**，不用二進位資料庫當作 source of truth——這樣每次修改都能在 GitHub 上看到清楚的 diff，方便日後開放協作或自己回頭追蹤變更紀錄。
2. **一個主題一個檔案**，不要把全部單字塞進一個大檔案。檔案越小，PR 越好審、衝突越少，之後要擴充新主題也只是新增檔案而不動舊檔案。
3. **所有內容用穩定唯一 ID 互相引用，不複製內容**。翻譯、音檔只在單字條目維護一次，句子/短文都用 ID 指過去，這樣修改一次就能全平台同步，不會有「改了單字翻譯但某個舊句子還是舊翻譯」的不一致問題。
4. **開發時的原始檔（JSON）跟執行期資料庫分離**。App 實際跑的時候，用一個 build script 把這些 JSON 匯入瀏覽器端資料庫（IndexedDB）或本地 SQLite，原始 JSON 永遠是唯一真相來源（single source of truth）。

### 2.2 三層內容實體與 ID 規則

| 實體 | ID 格式範例 | 說明 |
|---|---|---|
| 單字 Vocab | `voc.family.003` | `<topic>` 用主題的英文代稱（如 family、animals、colors） |
| 句子 Sentence | `sent.family.b1.007` | `b1` 代表所屬 Stage（見第 3 節），方便一眼看出難度階段 |
| 短文 Passage | `pass.family.p01` | 每主題通常只有少數幾篇短文 |

ID 一旦分配就**不可重複使用**，即使該條目之後被刪除也保留（避免舊資料或舊連結悄悄指向錯誤內容）。

### 2.3 欄位設計（Schema）

**單字 Vocab**

| 欄位 | 型別 | 說明 |
|---|---|---|
| id | string | 唯一識別碼 |
| en | string | 英文單字 |
| zh | string | 中文翻譯 |
| pos | string | 詞性（名詞/動詞/形容詞...） |
| topic | string | 所屬主題 |
| scope | string | 內容範圍，如 `elementary_core`，為未來擴充預留（此值只是內部分類代稱，不代表引用任何特定機構的官方內容） |
| difficulty_tier | number | 1-3，我們自訂的教學難度（見 3.4） |
| ipa | string \| null | 音標，可留空日後補 |
| audio | string \| null | 音檔路徑，慣例 `audio/{id}.mp3` |
| image | string \| null | 圖片路徑，慣例 `image/{id}.svg` |
| sense_of | string \| null | 若同形異義，指回同一書寫形式的分組鍵（見 2.4） |
| related_forms | string[] | 相關詞形 ID，如複數、動詞三態（見 2.5） |
| source | string | 內容來源標註，例如 `"國小常用英語主題字彙 - Family"`，用來註記這筆資料屬於哪個主題整理批次，不指向特定測驗機構 |
| status | string | `draft` / `reviewed` / `published`，追蹤審核進度 |

**句子 Sentence**

| 欄位 | 型別 | 說明 |
|---|---|---|
| id | string | 唯一識別碼 |
| en | string | 英文句子 |
| zh | string | 中文翻譯 |
| topic | string | 所屬主題 |
| stage | string | `A`(單字)/`B`(短句)/`C`(短文)/`D`(綜合)，見第 3 節 |
| grammar_point | string | 這句練習的文法點，如 `"There is/are"`、`"Wh-question: what"` |
| vocab_ids | string[] | 引用到的單字 ID 陣列（此句用了哪些目標單字） |
| audio | string \| null | 音檔路徑 |
| status | string | draft/reviewed/published |

**短文 Passage**

| 欄位 | 型別 | 說明 |
|---|---|---|
| id | string | 唯一識別碼 |
| title | string | 短文標題 |
| topic | string | 所屬主題 |
| text | string | 短文全文 |
| sentence_ids | string[] | 組成短文的句子 ID（可選，若短文由既有句子組成） |
| vocab_ids | string[] | 涵蓋的單字 ID（自動彙整或手動標註） |
| questions | object[] | 理解性問答，見下 |
| status | string | draft/reviewed/published |

`questions[]` 內每題結構：`{ id, question, options[], answer, type }`，`type` 例如 `single_choice`。

實際範例檔案已放在 `content/schema/` 與 `content/vocab/`、`content/sentences/`、`content/passages/`（見本文件最後「已產出的範例檔案」清單），可以直接參考格式。

### 2.4 一詞多義處理

同一個字可能出現在不同主題、代表不同意思，例如：

- `chicken`：動物主題（雞，動物）／食物主題（雞肉，食物）
- `fish`：食物主題（魚肉，名詞）／運動主題（釣魚，動詞）
- `cold`：健康主題（感冒，名詞）／天氣主題（寒冷的，形容詞）
- `short`：個性特點主題（矮的）／尺寸主題（短的）

**處理方式**：不要用「單字拼寫」當唯一鍵，而是每個語意各自一個 ID（如 `voc.animals.chicken` 與 `voc.food.chicken`），並用 `sense_of: "chicken"` 欄位標記它們屬於同一個書寫形式。這樣遊戲出題時可以精準控制「這一關只考動物語意的 chicken」，也能在未來做「你知道這個字還有另一個意思嗎」的延伸題型。

> 目前實際內容為了避免同一個英文字在兩個不同主題檔案裡各自出現一份、造成跨主題查詢表衝突，暫時採取更簡單的做法：發現衝突時只保留其中一個主題收錄該字，沒有全面套用 `sense_of` 機制。之後如果要更完整處理一詞多義，可以照這節的設計實作。

### 2.5 不規則詞形處理

若字彙中包含 `mouse/mice`、`foot/feet`、`tooth/teeth` 這類單複數不規則變化，各自是獨立條目。用 `related_forms` 欄位把它們互相關聯（`voc.animals.mouse.related_forms = ["voc.animals.mice"]`），方便日後做「單複數配對」小遊戲，也避免被誤判為兩個不相關的單字。

### 2.6 新增／修改流程

1. 貢獻者（含未來的你自己）直接編輯對應主題的 JSON 檔案，或新增一個檔案。
2. 跑一個**內容驗證 script**（可放進 GitHub Actions CI），檢查：必填欄位是否齊全、ID 是否重複、`vocab_ids`/`sentence_ids` 等引用是否指向真實存在的 ID、翻譯是否為空字串。
3. 跑一個**缺件檢查 script**，列出目前還沒有音檔/圖片的條目清單，避免內容上線後才發現某個單字沒聲音。
4. 之後如果想讓不熟 JSON 格式的人（例如你自己用手機臨時想到要加字）也能維護內容，可以做一個簡易本地管理頁面（對應 canvas 上「內容管理」節點），本質上只是讀寫同一套 JSON 檔案，不需要另外設計資料庫。

### 2.7 擴充性設計

- 每筆資料都帶 `scope` 欄位。未來要加其他範圍的字彙時，只要開新的主題資料夾、`scope` 填新值，既有架構完全不用改。
- `difficulty_tier` 獨立於 `topic` 存在，方便同一主題內做難度分層，也方便之後接入間隔重複演算法（把 tier 當作排序權重之一）。
- `status` 欄位讓「內容量」與「已審核可上線的內容量」分開追蹤，內容持續擴充的過程中不會誤把草稿內容推上線。

---

## 3. 關卡分類方式

### 3.1 主軸一：主題單元（Topic Unit）

原始規劃了 24 個「內容主題」（動物、食物、家庭...）加 11 個「文法/功能詞類別」（冠詞、代名詞、介系詞...，見附錄），2026-08-22 Personal characteristics 拆成三個主題後變成 26 個。24／26 個主題若直接攤平成關卡列表會太長、缺乏方向感，建議歸納成 0～7 共 8 個大單元，每個單元內含 1-11 個主題：

| 單元 | 涵蓋主題 |
|---|---|
| 單元 0：教室常用語 | Greetings 問候與禮貌用語、Pronouns 代名詞（2026-08-23 起拆成這兩個主題，見 3.5 節） |
| 單元一：我和身邊的人 | Family、People、Appearance、Emotions、Personality traits、Parts of body |
| 單元二：食衣住行 | Food & drink、Clothing & accessories、Houses & apartments、Kitchen & Dining（原 Tableware，2026-08-22 擴充成廚房與餐具，見下方更新記錄）、Bathroom 浴室（2026-08-24 起新增，見 3.1 節 2026-08-24 註〔十九〕）、Transportation |
| 單元三：上學去 | School、Math（原 Numbers，2026-08-25 起改名擴充，見 3.1 節 2026-08-25 二 註）、Art（原 Colors，同上）、PE / Sports 體育課、Clubs & Hobbies 社團活動（2026-08-24 起，原「Sports/interests/hobbies」拆成這兩個主題並移入單元三，見 3.1 節 2026-08-24 註）、Science 自然科學（2026-08-25 起新增，見 3.1 節 2026-08-25 二 註） |
| 單元四：大自然與動物 | Animals & insects、Weather & nature、Geographical terms |
| 單元五：生活情境 | Places & directions、Occupations、Money、Health、Forms of address |
| 單元六：時間與節日 | Time、Calendar、Holidays & festivals、Sizes & measurements（2026-08-25 起，Time 因候選字過多拆成 Time 與 Calendar 兩個主題，見 3.1 節 2026-08-25 註） |
| 單元七：文法小幫手 | Advanced Pronouns 代名詞總複習、Wh-Words & Frequency 疑問詞與頻率副詞、Articles & Determiners 冠詞與限定詞、Sentence Connectors 造句小幫手、Prepositions 介系詞、Other Nouns 其他常用名詞、Other Verbs I／II 其他常用動詞、Other Adjectives I／II 其他常用形容詞、Other Adverbs & Responses 其他副詞與應答詞（2026-08-25 起新增，原本 3.2 節「文法/功能詞不獨立成關卡」的政策在這裡正式修訂，見下方 3.1 節 2026-08-25 三 註與 3.2 節說明） |

> 註（2026-08-22）：規劃的 24 個內容主題，但原始分配只分到 23 個，「Forms of address」（稱謂，Mr./Mrs./Miss/name，約 4 字）當初漏了沒排進任何單元。已補進單元五「生活情境」，跟 Occupations/Places & directions 這類生活情境主題放在一起。
>
> 註（2026-08-22 二）：Personal characteristics（個性與特點）原本是單一主題（32 字，涵蓋外觀、情緒、性格三種性質不同的形容詞），使用者提議拆成三個主題分開學習，討論後決定拆成 **Appearance 外觀特徵**（7 字：tall/short/thin/strong/cute/pretty/handsome）、**Emotions 情緒**（11 字：happy/sad/angry/tired/hungry/excited/scared/bored/surprised/worried/nervous）、**Personality traits 性格特質**（14 字：kind/shy/friendly/brave/smart/funny/lazy/active/quiet/polite/naughty/patient/honest/curious），三個都留在單元一（跟 Family/People 一樣是「描述人」的主題，單元分類上沒有更適合的單元）。內容主題總數從 24 個變成 26 個。舊的 `content/vocab/personal_characteristics.json` 四個檔案技術端已經處理完畢並實際刪除（見 `HANDOFF.md` 9.42 節），這裡不再是待辦事項。
>
> 註（2026-08-22 三）：「Tableware 餐具」（原本只有 7 個純餐具單字：chopsticks/knife/plate/bowl/fork/cup/spoon）依使用者要求擴充範圍成「**Kitchen & Dining 廚房與餐具**」，補上 6 個廚房電器／設備字（refrigerator/stove/pot/sink/microwave/oven），變成 13 字。`fileKey` 維持不變（still `tableware`），只有 `main.ts` 的 `TOPICS` 陣列裡這個主題的顯示 `label` 文字要從 `"Tableware 餐具"` 改成 `"Kitchen & Dining 廚房與餐具"`（詳見 `docs/handoff-prompt-rename-tableware.md`，已完成）。
>
> 註（2026-08-23）：原本的「6 大世界」分類改名成「6 大單元」（世界一～六 → 單元一～六），避免使用者誤會成地圖／關卡世界。同時把原本刻意獨立於世界分類之外的 Unit 0「教室常用語」整合進來，變成「單元 0」，跟單元一～六形成連貫的 0-6 序列。內部程式碼識別碼（`WORLDS`→`UNITS`、`world1`~`world6`→`unit1`~`unit6`、`badge.world_completion.*`→`badge.unit_completion.*`）也一併改名，因為應用還沒正式對外發布、沒有真正的使用者進度資料，不需要做新舊 ID 相容轉換。單元 0 雖然併入 `UNITS` 陣列統一命名，但「單元完成度」徽章判斷邏輯刻意排除單元 0，避免跟它原本專屬的新手徽章語意重複。完整規劃與分工見 `docs/plan-rename-world-to-unit.md`。
>
> 註（2026-08-23 四）：使用者看首頁截圖後回饋「單元一：我和我的家」這個名字跟底下 6 個主題對不太起來——Family／People 確實跟「家」有關，但 Appearance／Emotions／Personality traits／Parts of body 其實是「描述人」的主題（跟前段 2026-08-22 二 的註記緣由相同：找不到更適合的單元，才留在單元一），跟「我的家」沒有直接關係。討論後決定採用影響最小的做法：只改單元名稱、不搬動任何主題，改成「**我和身邊的人**」，涵蓋範圍更貼近實際的 6 個主題（家人、人物、外觀、情緒、性格、身體部位）。內部識別碼 `unit1` 不變，只有顯示用的 `label`／badge 名稱等文字需要更新，App 端改動只有 `main.ts` 裡 `UNITS` 陣列的一行 `label`（見 `docs/handoff-prompt-rename-unit1-label.md`）。
>
> 註（2026-08-23 五）：Appearance 外觀特徵原本只有 7 字（tall/short/thin/strong/cute/pretty/handsome），使用者要求補充更多外觀描述詞，討論後新增 11 字：**fat 胖的**、**heavy 重的**（比 fat 委婉的說法，跟 fat 互為 `related_forms`，避免同一批出現造成混淆）、**slim 苗條的**（跟 thin 互為 `related_forms`）、**beautiful 美麗的**（跟 pretty 互為 `related_forms`）、**young 年輕的**、**old 老的**、**long hair 長髮**、**short hair 短髮**、**curly hair 捲髮**、**straight hair 直髮**（後 4 個是名詞片語，跟其餘單一形容詞不同詞性）、**cool 酷的**，共 18 字。新增後發現 `young`／`old`／`beautiful` 原本分別是 People／Geographical Terms 主題透過自己的 `content/glossary/*.json` 補充詞彙表才查得到中文意思，現在變成全域 vocab 直接查得到（跟先前 he/she/we/it、feet 那幾次是同一種正面副作用：這幾個字現在也能被收藏），兩個主題裡對應的 glossary 補充詞彙已同步移除，避免死資料。
>
> 註（2026-08-23 六）：使用者問 Emotions 情緒是不是該拆成「生理」跟「心理」兩個單元。檢查後發現這個專案的資料模型要求每個英文單字全站唯一（不能兩個主題各自收一份同一個英文字），而使用者原本想加的字裡，hot／cold 已經是 Weather & Nature 的字、sick 已經是 Health 的字、shy 已經是 Personality Traits 的字——代表這個專案本來就沒有把「生理狀態」類的字集中管理，而是依情境分散到各主題，Emotions 的定位其實一直是「純情緒表達」。討論後決定不拆新單元（Emotions 加完也才 20 字，跟其他主題差不多大，還不到需要拆分的規模），使用者也主動選擇只加純心理狀態的字，不加 thirsty／full／sleepy 這類生理感受字。最終新增 9 字：**glad 高興的**（跟 happy 互為 `related_forms`）、**calm 平靜的**、**proud 感到驕傲的**、**fine 很好的**（跟 okay 互為 `related_forms`）、**okay 沒事的**、**afraid 害怕的**（跟 scared 互為 `related_forms`）、**mad 生氣的**（跟 angry 互為 `related_forms`）、**upset 心煩意亂的**、**lonely 孤單的**，從 11 字變 20 字。
>
> 註（2026-08-23 七）：使用者提供一份廚房用品候選清單，要求從中挑選適合的字補進 Kitchen & Dining。跳過 3 個字：**dish**（中文翻譯「盤子/菜餚」會跟既有的 plate「盤子」重疊，同一批配對題可能造成混淆）、**towel**（英文原意通常指浴室毛巾，不是廚房抹布，中文註釋「毛巾/抹布」兩義混在一起會誤導）、**cook**（已經是 Occupations 主題的字，全站單字不能重複）。候選清單裡另有 bake／cut／wash／clean 4 個廚房常用動詞，跟使用者確認後決定不加，維持這個主題純名詞（餐具、廚房家電）的一致性。最終新增 15 字：**glass 玻璃杯**、**pan 平底鍋**、**bottle 瓶子**、**kettle 水壺**、**straw 吸管**、**tray 托盤**、**napkin 餐巾紙**、**tablecloth 桌布**、**trash can 垃圾桶**、**apron 圍裙**、**sponge 海綿**、**blender 果汁機**、**toaster 烤麵包機**、**rice cooker 電鍋**、**freezer 冷凍庫**，從 13 字變 28 字。
>
> 註（2026-08-23 八）：使用者提供一份顏色候選清單，要求從中挑選適合的字補進 Colors。跳過 3 個字：**rainbow**（已經是 Weather & Nature 的字，全站單字不能重複，且彩虹本來就更像天氣現象而非顏色本身）、**violet**（中文翻譯「藍紫色的」跟既有的 purple「紫色的」太接近，對國小程度來說色差太細，容易造成配對題混淆）、**peach**（中文翻譯「桃紅色的」跟既有的 pink「粉紅色的」重疊，且 peach 更常見的意思是「桃子」這個水果，日後食物主題若收錄桃子會撞字）。最終新增 7 字：**gold 金色的**、**silver 銀色的**、**indigo 靛藍色的**（彩虹七色之一）、**light 淺色的**（用於顏色前，如 light blue）、**dark 深色的**（用於顏色前，如 dark green）、**bright 明亮的、鮮豔的**、**colorful 多彩的**，從 12 字變 19 字。
>
> 註（2026-08-23 九）：使用者看畫面後覺得 Numbers 30 個字有點多，討論後決定移除 5 個「不算真正數字」的字：**first／second／third**（3 個序數詞，留到未來 Time 主題〔單元六，尚未建置〕再收，序數詞通常跟日期、排名一起教，比較適合放在那邊）、**number／how many**（2 個功能詞，跟這個專案自己訂的「文法/功能詞融入短句短文、不獨立成關卡」原則本來就不一致）。30 字變 25 字。連鎖影響：短文「Numbers Everywhere」整篇故事都建立在序數詞跟 how many 上，已經整篇換掉，改成新故事「A Fun Day at the Zoo」（動物園主題，只用基數詞），3 題理解題也全部重寫；`content/sentences/numbers.json` 裡引用到被移除字的 3 句也一併換掉。另外發現 `content/passages/personality_traits.json` 的短文裡有一句「shy at first」（片語，意思是「一開始」，不是「第一」），先前一直是誤打誤撞透過 Numbers 的 first（第一）這個全域字翻出「第一」這個錯誤答案，這次順便修正，在 `content/glossary/personality_traits.json` 補上正確的片語翻譯。過程中也發現 `verify-passage-glossary.ts` 那份「已知缺口」（TOPICS 清單少 7 個主題，見 9.56 節）這次真的擋到路——新短文用到的 name／zoo 兩個字實際上在 App 裡已經是 forms_of_address／places_directions 的全域字，但因為這兩個主題不在這支腳本的驗證範圍內，腳本會誤判成查不到，暫時在 `content/glossary/numbers.json` 也補一份（在真正的 App 裡這兩筆會被全域字蓋掉、實際上用不到，純粹是為了讓這支腳本過），這個已知缺口現在被踩到第二次，可能之後真的要找時間補進那 7 個主題。
>
> 註（2026-08-23 十）：使用者想把「Weather & Nature 天氣與自然」拆成兩個主題。查過內容後發現候選的「自然地理與地景」類字（beach／river／mountain／lake／sea 等）其實已經是同一個單元（單元四）底下 **Geographical Terms 地理名詞** 主題的字了，不需要另開一個「Nature」主題重複收錄。跟使用者確認後決定：（a）Weather & Nature 改名成「**Weather 天氣**」，新增天氣現象、氣溫形容詞、四季共 16 個新字（snowy／foggy／fog／storm／stormy／typhoon／cloud／lightning／thunder／ice／wet／dry／spring／summer／fall／winter），從 16 字變 32 字，`fileKey` 不變仍是 `weather_nature`，只改顯示 `label`（App 端待執行，見 `docs/handoff-prompt-rename-weather-nature-label.md`）；（b）不新開 Nature 主題，把地景類新字（nature／hill／island／forest／tree／flower／grass／plant／rock／earth／ground）直接併入既有的 Geographical Terms，從 5 字變 16 字，這部分完全不用動 `main.ts`。候選清單裡的 **cool**（涼爽的）沒辦法加，因為這個字已經是 Appearance 的「cool 酷的」，全站同一個英文字不能兩個主題各收一份意思不同的版本。fall／autumn 是同義詞，只收錄 `fall`（zh 註明＝ autumn）；rock 也只收錄一個字（zh 註明＝ stone）；但 earth（地球）／ground（地面）意思不同，两個都收。
>
> 註（2026-08-24 十一）：使用者再提供一份「自然地形與水域」＋「自然物質與地表成分」候選清單，問要不要補進 Geographical Terms。先做過跨主題衝突掃描，這批候選字都沒有跟現有任何主題撞名，但有兩個字概念已經被現有字覆蓋，直接跳過：**stone**（已經收在 rock 的中文註解裡，＝ stone）、**woods**（跟既有的 forest 太接近，會變成同義詞重複）。因為全部候選字（14 個）會讓這個主題一次跳到 30 字，接近先前 Numbers 30 字被使用者覺得太多的量級，跟使用者確認後改成只加常用的 9 個：**ocean 海洋**（跟既有的 sea 互為 `related_forms`，避免同一批配對/選擇題出現時選項混淆）、**pond 池塘**、**waterfall 瀑布**、**desert 沙漠**、**cave 洞穴**、**jungle 叢林**、**sand 沙子**、**mud 泥巴**、**wood 木頭/木材**，從 16 字變 25 字。跳過的候選字：stream/creek、coast、cliff、valley、soil、land（較次要或跟既有字略有重疊）。
>
> 註（2026-08-24 十二）：使用者想新增「體育課」（運動相關單字）與「社團活動」（小學常見興趣嗜好）兩個新主題，原本建議放進單元六「時間與節日」（因為單元六原本規劃的「Sports/interests/hobbies」正好對應這個範圍，只是拆成兩個主題），但使用者提議改放進單元三「上學去」，理由是體育課、社團活動都是學生在學校會遇到的日常情境，跟單元三既有的 School／Numbers／Colors 更貼近。討論後採用使用者的提案：單元三新增 **PE / Sports 體育課** 與 **Clubs & Hobbies 社團活動** 兩個主題，從 3 個主題變 5 個（跟單元二、單元五一樣大，不算異常）；單元六原本規劃的「Sports/interests/hobbies」正式移除，改成只剩 Time／Holidays & festivals／Sizes & measurements 三個主題（跟單元四一樣大）。跨主題衝突掃描先確認過常見候選字裡 **bike**（已是 Transportation 的字）、**read／draw／book**（已是 School 的字）不能重複使用，之後選字要繞開。這次調整只影響 `docs/content-plan.md` 規劃文字與 App 端 `main.ts` 的 `UNITS` 陣列，不影響任何徽章判斷邏輯（`badges.json` 的單元完成度徽章條件文字沒有寫死主題清單）。
>
> 註（2026-08-24 十三）：延續上一則決定，正式建立 **PE / Sports 體育課**（24 字）與 **Clubs & Hobbies 社團活動**（16 字）兩個主題的完整內容。體育課候選字原本規劃「核心 15 個」，使用者選擇全部都加，但列出的候選清單實際合計是 24 個（不是問題選項裡誤標的 21 個，這裡誠實記錄這個小失誤）：soccer／basketball／baseball／badminton／table tennis／volleyball／tennis／swimming（球類與泳類）、run／jump／throw／catch／kick（動作）、ball／bat／racket／whistle／gym（裝備場地）、team／coach／player／win／lose／race（角色與概念）。社團活動使用者同樣選擇全部加，候選清單 16 個字數與選項標示一致：drawing／painting／singing／dancing／music／guitar／piano（才藝與樂器）、chess club／book club／art club／choir（社團）、photography／cooking／gardening／collecting／origami（興趣）。兩個主題都各寫了一篇短文（PE / Sports：「My PE Class」；Clubs & Hobbies：「After-School Clubs」）＋3 題理解題＋補充詞彙表，過程中發現短文草稿裡的 "short race" 會被誤連結到 Appearance 主題的 short（矮的，跟賽跑的「短」是不同語意），"scored a run" 也會被誤連結到體育課自己的 run（跑步，跟棒球「得分」的 run 是不同語意），這類全站單字唯一、無法區分詞義的限制這個專案已經處理過很多次（rock/stone、fall/autumn 等），這次選擇直接修改短文措辭來避開歧義，而不是勉強收錄容易混淆的字義。`app/scripts/verify-multi-topic.ts`／`verify-unit-completion-badges.ts`／`verify-passage-glossary.ts`／`build-content-review.mjs` 都已經正常補上這兩個新主題（不是套用已知的 7 主題缺口繞過法，這兩個是全新主題，直接照正常流程登記）。App 端還需要 `main.ts` 的 `TOPICS`／`UNITS`／`TOPIC_THUMBS` 三處改動才能真正在畫面上玩到，詳見 `docs/handoff-prompt-add-pe-sports-clubs-hobbies.md`。
>
> 註（2026-08-24 十四）：使用者看 Places & Directions（18 字，以地點名詞為主，方位/導航類只有 there／left／right／here 4 個字）的畫面後，問要不要補對街、街角、前面、後面、旁邊這類道路/地圖指引概念。查過這個專案自己在 3.2 節訂的原則——介系詞類的詞（in/on/under 這種）太抽象不適合當獨立單字關卡，要融入短句短文——候選概念裡「對面（across from）／前面（in front of）／後面（behind）／旁邊（beside/next to）／之間（between）」都是介系詞片語，不開成獨立單字，改成在句子裡自然出現（新增兩句：bank in front of post office/museum behind it、restaurant across from movie theater）。真正開成獨立單字的是具體名詞/形容詞/動詞（跟現有的 left/right/there/here 同類）：**corner 街角、street 街道、traffic light 紅綠燈、crosswalk 斑馬線、map 地圖、near 附近的、far 遠的、straight 直直地（直走）、turn 轉彎**，18 字變 27 字，跟現有字都沒有撞名。另外補充 4 句涵蓋這 9 個新字。這個主題不在 `verify-passage-glossary.ts` 已知的 7 主題缺口清單裡（本來就沒被納入），這次也沒有改動短文本文，所以不受影響。
>
> 註（2026-08-24 十五）：使用者問 Occupations（13 字）要不要補一些貼近現代情境的職業，像 youtuber／streamer／homemaker／工程師／企劃。查過後有兩個字需要使用者決定方向：（a）「網路內容創作者」這個概念——youtuber 這個字直接包含 YouTube 這個特定平台的品牌名稱，這個專案之後要開源上 GitHub，先前已經因為商標/品牌引用風險移除過「GEPT Kids」，跟使用者確認後決定改用不含特定品牌名稱的 **content creator 內容創作者**；（b）「企劃」這個中文職稱很抽象，對應的英文字不明確（planner／coordinator／producer 都有可能，看情境而定），對國小程度也不夠具象，跟使用者確認後決定不收。最終新增 3 字：**engineer 工程師**、**homemaker 家庭主夫、家庭主婦**、**content creator 內容創作者**，13 字變 16 字，跟現有全站單字都沒有撞名。
>
> 註（2026-08-24 十六）：使用者問 Money（4 字：dollar／money／free／buy）還可以補什麼小學範圍的金錢單字，並提到販售/零錢/電子支付/打折/優惠這幾個方向。討論後把「電子支付」改用更具體的 **credit card 信用卡**、「優惠」改用 **coupon 優惠券**（比抽象的 deal 更具象），最終新增 18 字：sell 賣、change 零錢、coin 硬幣、bill 紙鈔、price 價格（跟 cost 互為 `related_forms`，避免同一批出現造成混淆）、cheap 便宜的、expensive 貴的、cost 花費、pay 付錢、save 存錢、spend 花錢、wallet 錢包、piggy bank 撲滿、allowance 零用錢、discount 折扣、coupon 優惠券、receipt 收據、credit card 信用卡，4 字變 22 字，跟現有全站單字都沒有撞名。
>
> 順便發現一個既有的潛在問題（不是這次新增造成的，是本來就存在）：短文「Saving Money」裡的「piggy bank」（撲滿）這個詞組，因為 App 的短文點字查詢是逐字比對（不是整個詞組比對），"piggy bank" 拆成 "piggy" 和 "bank" 兩個字分別查，"bank" 這個字剛好已經是 Places & Directions 的全域字（銀行），所以小朋友點短文裡 "piggy bank" 的 "bank" 會看到「銀行」，而不是撲滿相關的意思，語意不對。這個問題在這次新增 Money 單字之前就已經存在（「piggy bank」新增成 Money 自己的單字也不會讓這個問題變好或變壞，兩者互不影響），根本原因是 App 短文點字功能不支援詞組比對，只能逐字查，這是程式端的限制，不是內容端能單靠補字/補 glossary 解決的（`content/glossary/money.json` 早就有 `piggy: 小豬的` 但沒辦法解決 `bank` 本身已經是全域字這件事，全域字優先權比 glossary 高）。這裡先記錄下來，之後如果要修，需要在 App 端把短文點字功能改成支援多字詞組比對，屬於技術架構 session 的工作範圍。
>
> 註（2026-08-24 十七）：使用者問 Health（4 字）能不能擴充。查過候選字後只有 **cold**（感冒）撞名——已經是 Weather 的「cold 冷的」；也主動跳過 **band-aid**（OK 繃），因為這個字其實是特定品牌的商標（跟 youtuber 那次同樣的商標謹慎原則），改用不含品牌名稱的 **bandage 繃帶**。
>
> 討論過程中使用者問了「一字多義」限制有沒有解法，這個討論最後產出了另一份 handoff prompt（把短文查字的查詢順序改成「主題優先」，見 `docs/handoff-prompt-word-sense-and-favorites-sort.md`）。使用者接著問：既然決定要修，那 cold 現在能不能就直接加？結論是可以——因為 Stage A/B/D 這些題型本來就只讀各主題自己的單字清單，不受跨主題撞名影響，唯一有風險的是 Stage C 短文點字功能（如果短文本文剛好用到這個字），所以這次寫 Health 短文時刻意避開讓本文出現「cold」這個字面（已用 Python 驗證過），等 App 端那個查詢順序修正真的執行完，這裡完全不用回頭改。
>
> 使用者也同時問到「浴室」要不要另開主題，因為 wash hands／brush teeth 這類字感覺更適合放進浴室情境。查過 Houses & Apartments 後發現「bathroom」這個房間名稱本身已經收錄，浴室主題如果之後要開，會是收「浴室裡的物品/動作」（toothbrush／toothpaste／soap／shampoo／towel／bathtub／shower／toilet／mirror／comb／wash hands／brush teeth 這類，其中 **towel** 正好是先前 2026-08-23 七 Kitchen & Dining 那次特地跳過的字，當時就是因為它其實是浴室毛巾不是廚房抹布），可以放進單元二「食衣住行」跟 Houses & Apartments／Kitchen & Dining 同層級。這次使用者決定**先不開浴室主題**，wash hands／brush teeth 這兩個字這次也沒有收進 Health（因為它們的歸屬本來就該是浴室，不是生病/保健），留到之後真的要做浴室主題時再收。
>
> 最終 Health 新增 17 字：**cold 感冒**、**fever 發燒**、**cough 咳嗽**、**stomachache 肚子痛**、**sore throat 喉嚨痛**、**runny nose 流鼻涕**、**rest 休息**、**medicine 藥**、**exercise 運動**、**sleep 睡覺**、**healthy 健康的**（跟既有的 well 互為 `related_forms`，避免同一批出現造成混淆）、**hurt 受傷、疼痛**、**mask 口罩**、**thermometer 體溫計**、**vitamin 維他命**、**allergy 過敏**、**bandage 繃帶**，4 字變 21 字。
>
> 註（2026-08-24 十八）：使用者問 Forms of Address（4 字：name／Mr./Mrs./Miss）還有哪些單字可以加。跨主題衝突掃描先排除了 teacher（已是 School 的字）、uncle／aunt（已是 Family 的字）這些容易聯想到但已經被其他主題收走的候選字，確認剩下的候選都沒有跟現有全站單字撞名。最終新增 9 字：**Ms. 女士**（不分已婚未婚的中性稱謂，跟既有的 Mrs./Miss 併用可以自然教到已婚/未婚/不指定三種稱謂的差異）、**Dr. ...博士**（頭銜用法，用在姓氏前，跟 Occupations 的 doctor 職業名詞是不同字）、**Sir 先生**（禮貌尊稱，不加姓名單獨使用，像店員稱呼客人）、**Madam 女士、夫人**（禮貌尊稱，跟 Sir 對應，一句並列教學）、**nickname 綽號**、**full name 全名**、**first name 名**、**last name 姓**（first name／last name 一句並列，跟 full name 分開一句）、**Professor 教授**，4 字變 13 字。這個主題不在 `verify-passage-glossary.ts` 已知的 7 主題缺口清單裡，短文「My Teachers」這次也沒有引用到任何新字，不受影響。
>
> 註（2026-08-24 十九）：使用者要求在單元二「食衣住行」新增 **Bathroom 浴室** 主題。這對應到十七節記錄的討論——當時查過 Houses & Apartments 已經收錄「bathroom」這個房間名稱，浴室裡的物品/動作可以另開一個新主題，但那次決定「先不建」。這次正式建立，候選字沿用十七節記錄的 12 個核心字，並加碼補了 6 個常用字，最終新增 18 字：**toothbrush 牙刷**、**toothpaste 牙膏**、**soap 肥皂**、**shampoo 洗髮精**、**towel 毛巾**（先前 2026-08-23 七 Kitchen & Dining 那次特地跳過的字，這次終於有適合的家）、**bathtub 浴缸**、**shower 淋浴**、**toilet 馬桶**、**mirror 鏡子**、**comb 梳子**、**wash hands 洗手**、**brush teeth 刷牙**（核心 12 個）＋**toilet paper 衛生紙**、**mouthwash 漱口水**、**slippers 拖鞋**、**bath mat 浴室踏墊**、**hairbrush 髮梳**、**wash face 洗臉**（加碼 6 個），跨主題衝突掃描確認全站零撞名（原本考慮的 sink／sponge 已經是 Tableware 廚房水槽/海綿的字，語意相同不重複收）。短文「Getting Ready Every Morning」寫作時特別避開了 **dry**（原本想寫「用毛巾擦乾手」，但 dry 已經是 Weather 的全域字「乾燥的」，跟「擦乾」動詞是不同語意，改用 wipe 擦拭來避開這個已知的一字多義限制，跟先前處理 short/run、piggy bank 那幾次同樣的原則）。這個主題是全新建立，比照 PE / Sports／Clubs & Hobbies 的慣例，直接正常登記進 `verify-passage-glossary.ts`（不是套用舊有的 7 主題缺口繞過法）。App 端還需要 `main.ts` 的 `TOPICS`／`UNITS`／`TOPIC_THUMBS` 三處改動才能真正在畫面上玩到，詳見 `docs/handoff-prompt-add-bathroom.md`。
>
> 註（2026-08-25）：使用者要求開始規劃單元六「時間與節日」，正式把原本規劃階段就存在、但一直沒動工的 Time／Holidays & Festivals／Sizes & Measurements 三個主題建立起來。討論候選字範圍時發現三個決定點：（1）**Time** 的候選字（報時概念＋星期＋月份）合計超過 40 個，比其他任何單一主題都大很多，跟使用者確認後決定拆成兩個主題——**Time**（報時＋一天中的時段＋今天/明天/昨天等相對日期詞＋now/later/early/late/soon，22 字）跟 **Calendar**（星期一到日、一月到十二月、day/week/month/year/date/calendar/weekend/weekday 等日曆概念詞，27 字），單元六因此從原規劃的 3 個主題變成 4 個；（2）**Holidays & Festivals** 使用者選擇「中西合併」，收了西方節日（Christmas／Halloween／Easter／Thanksgiving）跟台灣/華人常見節日（Lunar New Year／Mid-Autumn Festival／Dragon Boat Festival），加上 birthday／gift／party／celebrate／decorate／card／costume／fireworks／lantern／mooncake／red envelope 等通用概念詞，共 18 字；（3）**Sizes & Measurements** 因為 tall/short/heavy/light/thin 已經被 Appearance 主題收走，改從「日常尺寸形容詞」角度切入，收 large／huge／tiny／medium／wide／narrow／thick／deep／shallow／size／half／full／empty 共 13 字，不含正式測量單位（公斤/公尺等）。四個主題跨主題衝突掃描全部零撞名（watch 因為已經是 Clothing & Accessories 的字被排除在 Time 之外；tall/short/heavy/light/thin 因為已經是 Appearance 的字被排除在 Sizes & Measurements 之外）。撰寫短文時發現並避開了兩個已知的一字多義風險：Time 的短文原本想寫「用手錶看時間」，但 watch 已經是 Clothing & Accessories 的全域字（手錶），改成不寫這個字；Holidays & Festivals 的短文原本想寫「看划龍舟比賽」用 watch 動詞，同樣的問題，改用 cheer for 迴避。這四個主題都是全新建立，比照 PE / Sports／Bathroom 的慣例，直接正常登記進 `verify-passage-glossary.ts`。App 端還需要 `main.ts` 的 `TOPICS`／`UNITS`／`TOPIC_THUMBS` 三處改動才能真正在畫面上玩到，詳見 `docs/handoff-prompt-add-unit6-time-calendar-holidays-sizes.md`。
>
> 註（2026-08-25 二）：使用者看過先前提出的「學科擴充」建議後，要求把單元三的 Colors 改為「美術課」、Numbers 改為「數學」，並加入其他學科項目。跟使用者確認調整方式（AskUserQuestion）：採用「直接改名＋擴充」（不是砍掉重建），`colors`／`numbers` 兩個 `fileKey` 完全不變（沿用原有 vocab id、badge、玩過紀錄），只調整 App 端顯示的 `label` 文字，並在 content 端擴充新單字；額外主題只選了 **Science 自然科學**（Music／Social Studies／English 這幾個候選都沒有被選）。三個主題的範圍也都個別確認過：
>
> - **Colors → Art 美術**：核心 10 個＋進階 6 個，共新增 16 字：paint 顏料、brush 畫筆、scissors 剪刀、glue 膠水、crayon 蠟筆、marker 麥克筆、sticker 貼紙、paper 紙、craft 手工藝、art 美術（核心 10）＋canvas 畫布、palette 調色盤、easel 畫架、clay 黏土、sketch 素描、sculpture 雕塑（進階 6），19 字變 35 字。短文從「My Favorite Colors」整篇改寫成「My Art Class」。原本 6 個舊顏色字（gray／pink／purple／brown／color／orange）發現沒有被任何例句涵蓋到——這是這次改動之前就存在的缺口，不是這次造成的，趁著在改這個檔案順手補了 3 句涵蓋這 6 個字。
> - **Numbers → Math 數學**：運算概念 8 個＋形狀 5 個＋進階 6 個，共新增 19 字：math 數學、add 加、subtract 減、plus 加上、minus 減去、equal 等於、count 數（動詞）、shape 形狀（運算概念 8）＋circle 圓形、square 正方形、triangle 三角形、star 星形、heart 愛心形（形狀 5）＋multiply 乘、divide 除、pattern 規律、calculator 計算機、more 更多、less 更少（進階 6），30 字變 49 字。短文從「A Fun Day at the Zoo」整篇改寫成「My Math Class」。**star**（星形）刻意跟 Weather 既有的 star（星星）撞名，是跟 `cold` 同一種「不同主題各自收一份不同意思」的刻意重複，兩邊主題底下點字查詢都只會查到自己主題的版本。
> - **Science 自然科學（全新主題，`fileKey: "science"`）**：核心 12 個＋進階 8 個，共 20 字：science 科學、experiment 實驗、observe 觀察、plant 植物、seed 種子、leaf 葉子、grow 生長、magnet 磁鐵、energy 能量、air 空氣、sound 聲音、planet 行星（核心 12）＋gravity 重力、force 力、solid 固體、liquid 液體、gas 氣體、matter 物質、battery 電池、electricity 電（進階 8）。短文「My Science Class」。`plant`／`grow` 分別跟 Geographical Terms（植物）／Family（成長、長大）同義重複收錄，語意相同不算衝突。
>
> 過程中發現一個連鎖問題：Art 新增「brush」（畫筆，名詞）之後，`bathroom` 主題短文裡原本「brush my teeth」的 brush 會被 Art 的全域查詢表誤蓋成「畫筆」（因為 bathroom 原本只收了「brush teeth」這個片語，沒有單獨的「brush」動詞條目，短文逐字點擊查詢時單字是拆開比對的）。修正方式是在 `bathroom.json` 也補一個獨立的 `brush`（刷，動詞）條目，讓 bathroom 自己主題的查詢優先權蓋過全域表，這是這次改動連帶修好的一個真實跨主題查詢 bug，不是單純的測試腳本已知缺口。三個主題的內容全部驗證過（`jsonschema`、跨主題衝突掃描、短文查字模擬、全部 21 支 `verify-*.ts`、`npm run build`）。App 端還需要 `main.ts` 的 `TOPICS`（改兩個 label＋新增一筆）／`UNITS`（`unit3.topicFileKeys` 新增 `"science"`）／`TOPIC_THUMBS`（新增一筆）三處改動才能真正在畫面上玩到，詳見 `docs/handoff-prompt-art-math-science.md`。

> 註（2026-08-25 三）：使用者要求把 3.2 節原本排除在外的 11 個「文法／功能詞類別」正式建成單元七「文法小幫手」，共 11 個獨立主題：**Advanced Pronouns 代名詞總複習**、**Wh-Words & Frequency 疑問詞與頻率副詞**、**Articles & Determiners 冠詞與限定詞**（7 字）、**Sentence Connectors 造句小幫手**（be 動詞/助動詞＋連接詞＋感嘆詞，20 字）、**Prepositions 介系詞**（24 字）、**Other Nouns 其他常用名詞**（19 字）、**Other Verbs I**（28 字）／**Other Verbs II**（36 字，因候選字超過 60 個比照 Time 的拆法拆成兩個主題）、**Other Adjectives I**（25 字）／**Other Adjectives II**（19 字，同樣因候選字過多拆成兩個）、**Other Adverbs & Responses 其他副詞與應答詞**（15 字）。建置過程重新即時爬取來源網站核對每個主題的確切字表（不採信舊有摘要），並確認一個明確政策：**跨主題重複收錄同一個英文單字（同義時）是被允許、甚至是必要的**——例如 hello/please/excuse me 在 greetings 與 sentence_connectors 都收錄、near 在 prepositions 與 places_directions 都收錄——省略這些字會讓單一主題的內容顯得不完整；這比照先前 star/cold 那種「不同語意各收一份」的既有慣例，差別只在於這次是同一語意也刻意重複。收錄過程也刻意排除了 4 個字以避免撞名衝突風險：**like**（介系詞義的「像」若收進 prepositions 會蓋掉 5 個主題依賴的全域「喜歡」動詞義，改成以動詞「喜歡」收進 other_verbs_2）、**do**（若收進 other_verbs_1 的「做」義會蓋掉 sentence_connectors 已收錄的助動詞義）、**can**（若收進 other_nouns 的「罐頭」義會蓋掉 sentence_connectors 已收錄的助動詞「可以」義）、**fun**（other_adjectives_2 裡跟 other_adjectives_1 已收的同義字重複，直接省略不重複收）。全部 11 個主題都驗證過（`jsonschema`、跨主題衝突掃描、短文查字模擬、全部 `verify-*.ts`、`npm run build`），並在 `verify-unit-completion-badges.ts` 新增 `unit7` 與對應的單元完成徽章（`badges.json` 新增 WC-07「文法小幫手」，`all_topics` 徽章 code 因此往後遞補為 WC-08，條件文字更新為「全部 40 個規劃主題」）。**3.2 節「文法／功能詞不獨立成關卡」的原始政策自本次起正式作廢**——這些詞類其實可以圖卡化、也做成了完整的單字/短句/短文/王關關卡，只是內容設計上刻意大量重複使用其他主題已出現過的例句情境。App 端還需要 `main.ts` 的 `TOPICS`（新增 11 筆）／`UNITS`（新增 `unit7`）／`TOPIC_THUMBS`（新增 11 筆）三處改動才能真正在畫面上玩到，詳見 `docs/handoff-prompt-unit7-grammar-topics.md`。

### 3.2 文法／功能詞類別：曾經不獨立成關卡，2026-08-25 起已推翻

> **本節政策已於 2026-08-25 更新，以下為歷史記錄。**

原始規劃認為 Articles、Pronouns、Be & auxiliaries、Prepositions、Conjunctions、Interjections、Wh-words、Other verbs/adjectives/adverbs 這類詞太抽象、無法圖卡化，不適合當獨立單字關卡，只自然融入各主題的「短句」與「短文」關卡（例如 in/on/under 融入「房子」主題的句子練習，what/where 融入「學校」主題的問答句）。

2026-08-25 使用者要求重新檢視這個假設，實際建置後發現這些詞類完全可以圖卡化、分級、寫短文——差別只在於例句/短文的情境會大量借用其他主題已經出現過的場景（因為 be 動詞、介系詞、連接詞本來就是黏著在具體名詞/動詞上使用的）。因此改為單元七「文法小幫手」11 個獨立主題，細節見 3.1 節 2026-08-25 三 註與附錄 5。

### 3.3 主軸二：主題單元內的漸進關卡（Stage A→D）

每個主題單元內部固定走這個順序：

- **Stage A 單字認識**：flash card + 配對/選擇題，建立單字-圖像-發音連結
- **Stage B 短句應用**：例句 + 填空/排序題，帶入該主題常見文法點
- **Stage C 短文閱讀**：一篇短文（建議 40-80 字，3-5 句）+ 理解性選擇題
- **Stage D 綜合關卡（主題王關）**：混合單字+短句+短文的最終測驗，過關即視為該主題單元完成

這個順序也直接對應到你 canvas 上原本規劃的「先練習單字+例句 → 進入遊戲」流程，Stage A/B 對應練習與基礎遊戲，Stage C/D 對應進階與驗收。

### 3.4 主軸三：難度分級（因為內容本身不分級）

內容範圍本身沒有官方內部分級，需要我們自訂一套「教學排序」，用 `difficulty_tier` 驅動：

- **Tier 1**（優先教）：具象名詞、顏色、數字、家人稱謂——認知負荷最低
- **Tier 2**：動作動詞、地點、職業、身體部位
- **Tier 3**：抽象形容詞、時間相關詞、與文法功能詞搭配度高的詞彙

即使兩個主題同屬一個「單元」，較簡單的主題（tier 分數低）會先解鎖。

### 3.5 單元 0（Unit 0）：新手起手式

建議在所有主題單元之前，先設計一個必玩的 **單元 0「教室常用語」（Unit 0）**，內容涵蓋 Interjections（hi/bye/please/thank you）、基本代名詞（I/you）、Numbers 1-10、Colors。原因：這些字會在遊戲介面互動與後續每個主題中反覆出現，等於是熱身兼新手教學，也順便解決「文法功能詞去哪裡教」的問題。

> 實作異動記錄（2026-08-22）：Numbers、Colors 後來都各自成為獨立主題，Unit 0 一開始只保留 Interjections＋基本代名詞（I/you），這次再進一步限縮成「基本問候」單一主題：擴充完整人稱代名詞（I/you/he/she/we/they/it）、禮貌用語（please/thank you/you're welcome/excuse me/sorry）、時段問候（good morning/afternoon/evening/night）、課堂求助句（can you help me），共 20 個單字，不再收錄任何數字。詳見 `content/vocab/unit_zero.json` 與 `HANDOFF.md` 對應章節。
>
> 實作異動記錄（2026-08-23）：原本刻意獨立於「6 大世界」之外的 Unit 0，隨著「世界→單元」改名，正式整合成「單元 0」，跟單元一～六形成連貫的 0-6 序列（見 3.1 節 2026-08-23 註）。首頁呈現上仍保留獨立區塊與新手提示文字，不強制排在單元一之前完成。
>
> 實作異動記錄（2026-08-23 二）：單元 0 原本 20 個字集中在單一主題，使用者提議拆成兩個主題分開學習，討論後決定拆成 **Greetings 問候與禮貌用語**（13 字：hi/hello/bye/sorry/please/thank you/you're welcome/excuse me/good morning/good afternoon/good evening/good night/can you help me）跟 **Pronouns 代名詞**（7 字：I/you/he/she/we/they/it），拆分前後 20 個字的英文字集合完全一樣，只是重新分組。首頁「🚀 新手起手式」區塊底下同時顯示兩張主題卡，不強制先完成才能玩其他單元；「暖身起步」徽章（OB-02）改成兩個主題都要完成 Stage A 單字配對才算達成。詳見 `docs/handoff-prompt-split-unit-zero.md`。

### 3.6 跨主題複習關卡

每完成 3 個主題單元，安排一個「混合複習關」，依錯題紀錄與間隔重複排程從已學主題中抽題——這直接對應 canvas 上原本規劃的「錯題複習機制」，讓複習不是額外系統，而是關卡地圖的一部分。

### 3.7 解鎖策略建議

- 單元 0 必玩。
- 完成單元 0 後，各「單元」開放自由選擇（不強制單元順序），但每個單元內的主題、以及每個主題內的 Stage A→B→C→D，仍需依序完成。
- 每個單元完成任一主題後，該單元的「混合複習關」隨即解鎖，兼顧目標感與探索自由度。

---

## 4. 其他建議

1. **內容來源與智慧財產**（2026-08-22 更新）：字彙範圍規劃過程中曾直接參考特定測驗機構公開的參考字表作為草稿依據，後來發現該機構已就其測驗名稱、服務標章發表商標聲明，字表本身也標示著作權聲明，考量之後要開源上 GitHub、公開散布，決定不直接沿用其名稱或整份字表當作內容基礎。目前作法：（a）不在專案任何地方使用該測驗名稱作為品牌或標題；（b）單字選字與分類逐步改成交叉參考多個公開/開放的兒童英語字彙資源（例如政府公告的國中小英語課綱基本字彙、CEFR 相關公開字表等），自行判斷、篩選收錄哪些字，不整份照搬單一來源；（c）例句、短文、題目全部原創撰寫，不照抄任何教材或測驗書；（d）README 已加上不隸屬任何測驗機構、非官方教材的聲明。這不是正式法律意見，真的要公開上架前建議另外找律師確認一次。

2. **例句/短文產出流程**：可以先用 AI 依 `vocab_ids` 與 `grammar_point` 產生初稿，但務必人工複審是否符合兒童認知程度、文法正確、語氣自然——這正是 `status: draft/reviewed/published` 欄位存在的原因，避免未審核內容流入正式關卡。

3. **音檔資源**：可搭配先前討論的免費方案（瀏覽器 Web Speech Synthesis API 或開源 TTS）批次產生單字/例句發音，檔名一律用 ID 對應（`audio/{id}.mp3`），程式端查找邏輯永遠不變，之後想換 TTS 引擎重新產生也不影響其他程式碼。

4. **內容規模抓感**：完整涵蓋約 600 字 + 24 主題是不小的工程。建議 MVP 階段先做 **Unit 0 + 2-3 個主題**（Family、Colors、Animals & insects 對兒童也最直覺），把「單字→短句→短文→關卡→成效追蹤」整條路徑跑通後，再依同樣模式擴充其餘主題——這也是本文件已經為 Family / Colors / Animals & insects 準備範例資料的原因（見下方檔案清單）。

5. **短文長度控制**：建議每篇 40-80 字（3-5 句），理解題 2-3 題即可，符合國小低中年級的閱讀負荷，避免關卡過長讓孩子失去耐心。

6. **主題完成度儀表板**：呼應 canvas 上「使用數據總覽 Dashboard」節點，建議讓家長/使用者能直接看到每個單元、每個主題的完成度百分比，而不只是總積分。

---

## 5. 附錄：主題範圍總覽

以下分類是兒童英語學習領域常見的通用主題劃分方式（顏色、動物、家庭這類分類廣泛見於各種兒童 ESL 教材），約略字數僅供內容規劃抓感使用，不代表逐字引用自任何單一機構的出版品。

**內容主題（24，可納入單字關卡）**

| 主題（英） | 主題（中） | 約略字數 |
|---|---|---|
| Animals & insects | 動物/昆蟲 | 31 |
| Clothing & accessories | 衣服/配件 | 19 |
| Colors | 顏色 | 12 |
| Family | 家庭 | 15 |
| Food & drink | 食物/飲料 | 51 |
| Forms of address | 稱謂 | 4 |
| Geographical terms | 地理名詞 | 5 |
| Holidays & festivals | 節日/節慶 | 5 |
| Health | 健康 | 7 |
| Houses & apartments | 房子/公寓 | 34 |
| Money | 金錢 | 4 |
| Numbers | 數字 | 40 |
| Occupations | 工作 | 16 |
| Parts of body | 身體部位 | 15 |
| People | 人 | 10 |
| Personal characteristics | 個性/特點 | 23 |
| Places & directions | 地點/方位 | 27 |
| School | 學校 | 39 |
| Sizes & measurements | 尺寸/計量 | 8 |
| Sports, interests & hobbies | 運動/興趣/嗜好 | 27 |
| Tableware | 餐具 | 7 |
| Time | 時間 | 42 |
| Transportation | 運輸 | 23 |
| Weather & nature | 天氣/自然 | 21 |

**文法／功能詞類別（11，原規劃「不獨立成關卡」，2026-08-25 起已建成單元七「文法小幫手」11 個獨立主題——見 3.1 節 2026-08-25 三 註）**

以下「約略字數」欄是原始規劃階段的抓感估計；「實際字數」欄是 2026-08-25 建置單元七時重新即時爬取來源網站核對後的真實收錄數，兩者有出入是因為規劃分類（例如「Be & auxiliaries」「Conjunctions」「Interjections」）跟最終 `fileKey` 分法（例如合併成 `sentence_connectors`）不是一對一對應，加上實際爬取字表跟舊有摘要本來就有落差，另有 like/do/can/fun 4 字因跨主題撞名風險或重複義刻意排除（見 3.1 節 2026-08-25 三 註）。

| 原規劃類別（英） | 類別（中） | 約略字數 | 最終 fileKey（單元七） | 實際字數 |
|---|---|---|---|---|
| Pronouns | 代名詞 | 13 | `advanced_pronouns` | 17 |
| Wh-words | 疑問詞 | 8 | `wh_words_frequency` | 15 |
| Articles & determiners | 冠詞/限定詞 | 15 | `articles_determiners` | 7 |
| Be & auxiliaries | be動詞/助動詞 | 5 | `sentence_connectors`（併入） | 20 |
| Conjunctions | 連接詞 | 3 | `sentence_connectors`（併入） | ↑ |
| Interjections | 感嘆詞 | 6 | `sentence_connectors`（併入） | ↑ |
| Prepositions | 介系詞 | 24 | `prepositions` | 24（不含排除的 like） |
| Other nouns | 其他名詞 | 21 | `other_nouns` | 19（不含排除的 can） |
| Other verbs | 其他動詞 | 53 | `other_verbs_1` ＋ `other_verbs_2` | 28 ＋ 36 = 64（不含排除的 do，含補收的 like） |
| Other adjectives | 其他形容詞 | 22 | `other_adjectives_1` ＋ `other_adjectives_2` | 25 ＋ 19 = 44（不含排除的 fun） |
| Other adverbs | 其他副詞 | 20 | `other_adverbs_responses` | 15 |

---

## 6. 已產出的範例檔案

為了讓上述資料結構不只是紙上規劃，已依此文件的 schema 產出可直接參考、可直接使用的範例檔案：

- `content/schema/vocab.schema.json`、`sentence.schema.json`、`passage.schema.json`：JSON Schema 定義，可用於前述的內容驗證 script
- `content/vocab/colors.json`、`family.json`、`animals_insects.json`：三個主題的完整單字資料
- `content/sentences/family.json`：Family 主題的範例句子（原創撰寫）
- `content/passages/family.json`：Family 主題的範例短文與理解題（原創撰寫）

建議下一步：先用這三個主題把遊戲關卡（Stage A-D）與 UI 實際串起來，驗證整個資料流程可行後，再依同樣模式擴充其餘主題。
