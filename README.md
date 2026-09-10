# dally_wallpapper

Bing 每日壁纸的网页展示 + 4K 截图，每天自动更新。

## 访问入口

| 地址 | 内容 |
| --- | --- |
| https://yizhixiaokong.github.io/dally_wallpapper/ | 展示页（文字叠加 + 每小时自动刷新） |
| https://yizhixiaokong.github.io/dally_wallpapper/api/ | 按设备方向自动跳转 |
| https://yizhixiaokong.github.io/dally_wallpapper/api/today.jpg | 横屏 3840×2160 |
| https://yizhixiaokong.github.io/dally_wallpapper/api/today_portrait.jpg | 竖屏 2160×3840 |

## 工作方式

GitHub Actions 每天 UTC 07:02 / 16:02（北京时间 15:02 / 00:02）运行：

1. 抓 Bing 的 `HPImageArchive` 接口（横屏 / 竖屏各一次），用 `jq` 生成 `dist/wallpaper-data.json`
2. 用 Puppeteer 加载 `index.html`，截图到 `dist/api/`
3. 把 `dist/` 作为 Pages artifact 发布

**产物不入库**：仓库只存源码，图片和 JSON 都是构建时生成的（见 `.gitignore`）。推送到 `main` 且改动了 `index.html` / `api/index.html` / `screenshot.js` / 工作流本身时，也会自动部署一次。

## 本地开发

`wallpaper-data.json` 和两张截图都是构建产物，不在仓库里。所以全新 clone 之后，不管怎么打开都只会看到硬编码的 fallback 默认图：

- `file://` 直接双击打开 → `fetch` 被 CORS 拦掉
- 起了 HTTP 服务但没同步产物 → `fetch` 得到 404

想看到真实效果，两步：

```bash
./sync-assets.sh                # 从线上拉取 wallpaper-data.json 和 api/today*.jpg 到本地
python3 -m http.server 8000     # 然后访问 http://localhost:8000/
```

`sync-assets.sh` 默认从 GitHub Pages 拉取，也可指定其他地址（`./sync-assets.sh http://localhost:8000`）。它会带时间戳参数绕过 CDN 缓存，拿到的始终是线上最新的一份，但不会自动刷新，停了几天后内容就是旧的。

这三个文件都已被 `.gitignore` 忽略，不会污染仓库。

| URL 参数 | 作用 |
| --- | --- |
| `image`、`title`、`copyright` | 直接渲染指定图片和文字，跳过 fetch（截图流程用的就是这个） |
| `cron` | 覆盖自动刷新表达式，默认 `0 * * * *` |

### 调试截图脚本

```bash
npm init -y && npm install puppeteer@25   # 首次会下载 Chromium，约 150MB
node screenshot.js [数据文件] [输出目录]    # 默认 wallpaper-data.json / api
```

数据文件至少要有 `url`，竖屏可选 `portrait_url`：

```json
{
  "title": "俯瞰大地拼图",
  "copyright": "奥尔韦拉航拍图，安达卢西亚，西班牙 (© ...)",
  "url": "https://cn.bing.com/th?id=...&w=3840&h=2160",
  "portrait_url": "https://cn.bing.com/th?id=...&w=2160&h=3840",
  "date": "2026-09-10"
}
```

## 注意

- **Pages 的 Source 必须是 `GitHub Actions`**。改回 `Deploy from a branch` 会导致产物缺失 —— 图片和 JSON 都不在 git 里。
- 改动不在 `push` 白名单里的文件（比如本文件）不会触发部署，需要手动 `Run workflow`。
- 截图流程失败时（图片加载超时、产出文件小于 100KB），任务会直接报错且**不会覆盖线上版本**，站点保持上一次成功的部署。
