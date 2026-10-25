#!/bin/bash
# 雙擊這個檔案：把 LetsGo 資料夾裡最新的遊戲室內容（已上架的「我的角色」遊戲、遊戲框架、美術套件、
# 代幣規則、上架閘門與遊戲實驗室；課程內容不動）複製到公開版，然後可以選擇直接上傳到 GitHub（正式站）。
# LetsGo 還在開發中（遊戲實驗室）的遊戲不會被帶過來。
# 第一次雙擊如果被 macOS 擋下：在 Finder 裡對這個檔案按右鍵 → 打開，再按一次「打開」。

cd "$(dirname "$0")"

echo "================================================"
echo " English for Kids — 從 LetsGo 同步遊戲到公開版"
echo "================================================"
echo ""

if ! bash scripts/sync-games-from-letsgo.sh; then
  echo ""
  echo "❌ 同步失敗，公開版沒有上傳。請把上面的訊息截圖給 Claude 看。"
  read -p "按 Enter 鍵關閉視窗..." _
  exit 1
fi

echo ""
read -p "要接著上傳到正式站嗎？(y/n) " ans
if [ "$ans" = "y" ] || [ "$ans" = "Y" ]; then
  exec bash "./上傳更新.command"
fi
echo "已同步到公開版資料夾，先不上傳。之後雙擊「上傳更新.command」就會一起上傳。"
read -p "按 Enter 鍵關閉視窗..." _
