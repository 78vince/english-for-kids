#!/bin/bash
# ========================================================
# 啟動帶有遠端偵錯埠 (9222) 的 Google Chrome
# 支援專屬設定檔模式，可與日常 Chrome 視窗同時並行運作
# ========================================================

PROFILE_DIR="$HOME/Library/Application Support/Google/Chrome-Flow"
mkdir -p "$PROFILE_DIR"

echo "========================================================"
echo "🚀 正在啟動 Google Flow 自動化除錯 Chrome..."
echo "📂 設定檔目錄: $PROFILE_DIR"
echo "🌐 遠端除錯埠: http://localhost:9222"
echo "========================================================"

/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --remote-debugging-port=9222 \
  --user-data-dir="$PROFILE_DIR" \
  "https://labs.google/fx/tools/flow" &

echo "✅ Chrome 已啟動！若首次開啟請在該視窗登入您的 Google 帳號。"
