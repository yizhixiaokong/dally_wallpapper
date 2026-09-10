#!/usr/bin/env bash
# 把线上已发布的产物（wallpaper-data.json 和两张截图）同步到本地，供本地预览使用
# 用法: ./sync-assets.sh [线上地址]

set -euo pipefail

BASE_URL="${1:-https://yizhixiaokong.github.io/dally_wallpapper}"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

fetch() {
  local url="$1" out="$2"
  # -f 让 HTTP 失败时直接报错，避免把 404 页面写进文件
  curl -fsS --max-time 120 "${url}?t=$(date +%s)" -o "${ROOT_DIR}/${out}"
  printf '  %-26s %s 字节\n' "${out}" "$(wc -c <"${ROOT_DIR}/${out}" | tr -d ' ')"
}

echo "从 ${BASE_URL} 同步产物..."

mkdir -p "${ROOT_DIR}/api"
fetch "${BASE_URL}/wallpaper-data.json" "wallpaper-data.json"
fetch "${BASE_URL}/api/today.jpg" "api/today.jpg"
fetch "${BASE_URL}/api/today_portrait.jpg" "api/today_portrait.jpg"

echo "完成。起个 HTTP 服务预览: python3 -m http.server 8000"
