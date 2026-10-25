#!/bin/bash
# 把 LetsGo（私有開發版）的遊戲室內容同步到公開版（2026-10-20 建立，2026-10-25 改版）。
# 實際的複製與檢查在 scripts/sync-games-from-letsgo.mjs（範圍與規則見那支檔案開頭）；這支只負責找到 Node.js。
#
# 用法：bash scripts/sync-games-from-letsgo.sh [LetsGo 專案路徑]（預設是隔壁資料夾「English for Kids LetsGo」）
# 一般用雙擊根目錄的「同步遊戲.command」。

set -e
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

# ---- 找 Node.js ----
# 雙擊執行時用的是 bash，不會讀到 zsh 的設定（~/.zshrc、~/.zprofile），
# 所以 Homebrew／nvm／Volta 等裝的 Node.js 可能不在 PATH 裡。依序嘗試：
#   1. 常見安裝位置  2. nvm／fnm  3. 問 zsh（登入＋互動模式）node 在哪
#   4. 隔壁 LetsGo 專案內建的 Node.js（English for Kids LetsGo/.node，區網啟動.command 自動裝的）
have_node() { command -v node >/dev/null 2>&1 && command -v npm >/dev/null 2>&1; }

export PATH="/opt/homebrew/bin:/usr/local/bin:${HOME}/.volta/bin:${HOME}/.local/bin:${HOME}/.asdf/shims:${HOME}/.nodenv/shims:${HOME}/n/bin:${PATH}"

if ! have_node && [ -s "${HOME}/.nvm/nvm.sh" ]; then
  . "${HOME}/.nvm/nvm.sh" >/dev/null 2>&1 || true
  have_node || nvm use default >/dev/null 2>&1 || true
fi
if ! have_node && [ -d "${HOME}/.nvm/versions/node" ]; then
  NVM_LATEST="$(ls -1 "${HOME}/.nvm/versions/node" 2>/dev/null | sort -V | tail -n 1)"
  [ -n "$NVM_LATEST" ] && export PATH="${HOME}/.nvm/versions/node/${NVM_LATEST}/bin:${PATH}"
fi
if ! have_node && command -v fnm >/dev/null 2>&1; then
  eval "$(fnm env 2>/dev/null)" || true
fi
if ! have_node && [ -x /bin/zsh ]; then
  ZSH_NODE="$(/bin/zsh -lic 'command -v node' 2>/dev/null | tail -n 1)"
  if [ -n "$ZSH_NODE" ] && [ -x "$ZSH_NODE" ]; then
    export PATH="$(dirname "$ZSH_NODE"):${PATH}"
  fi
fi
for LOCAL_NODE_DIR in "${PROJECT_DIR}/.node" "${PROJECT_DIR}/../English for Kids LetsGo/.node"; do
  if ! have_node && [ -x "${LOCAL_NODE_DIR}/bin/node" ]; then
    export PATH="${LOCAL_NODE_DIR}/bin:${PATH}"
  fi
done

if ! have_node; then
  echo "❌ 找不到 Node.js（node／npm），沒有做任何修改，先停在這裡。"
  echo ""
  echo "   最簡單的解法：先雙擊一次「English for Kids LetsGo」資料夾裡的「區網啟動.command」，"
  echo "   它會自動把 Node.js 裝好，之後這個檔案就能找到。"
  echo "   或者開一個新的「終端機」視窗輸入 which node，把結果告訴 Claude。"
  exit 1
fi

node scripts/sync-games-from-letsgo.mjs "$@"
