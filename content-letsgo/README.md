# 內容版本：Level N - Unit N（課堂複習版）

第二套內容版本，與現行 `content/` 平行、互不干擾。供孩子在課後對應課堂進度複習，家庭內部使用，不公開部署。

## 結構

```
level4/
  level.json        Level 概要：預計 8 個單元、單元清單與狀態、涵蓋的不規則動詞
  unit1/
    unit.json       單元標題、文法重點、Phonics、文化閱讀頁備註（不收錄原文）
    vocab.json      單字（topic 欄位為單元內的分組）
    sentences.json  句型框架（grammar_point 為句型名稱）
  unit2/ unit3/ ...
level5/ level6/     之後依同樣格式新增
letsgo-content-review.html   檢閱頁（雙擊即可開啟，資料已內嵌）
```

- ID 格式：`l4u1.voc.001`、`l4u1.sen.001`（Level 4、Unit 1）。
- 狀態：Unit 1–3 已整理；Unit 4–8 在 `level.json` 標示為 `planned`。
- 例句皆為原創；不收錄課本的角色對話、歌謠／chant、文化閱讀短文原文。

## 後續

此資料夾之後會搬進獨立 app 專案（複製現行引擎，待 demo-standalone 白頁問題修復後進行）。規劃見 `docs/letsgo-platform-comparison-plan.md`。
