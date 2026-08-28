#!/bin/bash
# 雙擊這個檔案，就能自動完成「建置檢查 → 跑驗證腳本 → commit → 上傳 GitHub」整套流程。
# 第一次雙擊如果被 macOS 擋下（顯示「無法辨識開發者」），
# 改成：在 Finder 裡對這個檔案按右鍵 → 打開，再確認一次「打開」就可以了，之後就能正常雙擊。

set -e
cd "$(dirname "$0")"

echo "================================================"
echo " English for Kids — 上傳更新到 GitHub"
echo "================================================"
echo ""

if [ ! -d "app/node_modules" ]; then
  echo "偵測到還沒安裝相依套件，先執行 npm install..."
  (cd app && npm install)
  echo ""
fi

echo "=== 步驟 1／3：建置檢查（npm run build）==="
(cd app && npm run build)
echo "✅ 建置通過"
echo ""

echo "=== 步驟 2／3：跑全部驗證腳本 ==="
cd app
fail=0
for f in scripts/verify-*.ts; do
  if ! npx tsx "$f" > /tmp/verify_output.txt 2>&1; then
    echo "❌ 失敗：$f"
    cat /tmp/verify_output.txt
    fail=1
  fi
done
cd ..
if [ "$fail" -eq 1 ]; then
  echo ""
  echo "有驗證腳本沒通過，先不上傳，麻煩把上面的錯誤訊息回報給 Claude 看一下。"
  read -p "按 Enter 鍵關閉視窗..."
  exit 1
fi
echo "✅ 全部驗證腳本通過"
echo ""

echo "=== 目前有這些變更 ==="
git status --short
echo ""

if [ -z "$(git status --porcelain)" ]; then
  echo "目前沒有任何變更，不用上傳。"
  read -p "按 Enter 鍵關閉視窗..."
  exit 0
fi

echo "=== 步驟 3／3：commit 並上傳 ==="
read -p "確認要 commit 並上傳到 GitHub 嗎？(y/n) " confirm
if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
  echo "已取消，變更還留在本機，之後可以再重新執行這個檔案。"
  read -p "按 Enter 鍵關閉視窗..."
  exit 0
fi

read -p "這次更新的簡短說明（直接按 Enter 使用預設訊息）: " msg
if [ -z "$msg" ]; then
  msg="chore: 更新 $(date '+%Y-%m-%d %H:%M')"
fi

git add -A
git commit -m "$msg"
git push

echo ""
echo "================================================"
echo "✅ 完成！GitHub Actions 會自動重新部署正式站，"
echo "   大約 1 分鐘後重新整理 https://78vince.github.io/english-for-kids/ 確認就可以了。"
echo "================================================"
read -p "按 Enter 鍵關閉視窗..."
