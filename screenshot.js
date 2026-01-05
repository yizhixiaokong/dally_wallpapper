const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

(async () => {
  // 1. 读取刚刚生成的 JSON 数据
  const dataPath = path.join(process.cwd(), "wallpaper-data.json");
  const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));

  // 2. 构造带参数的本地文件 URL
  // 我们利用你 index.html 里的 getWallpaperFromUrl 逻辑
  const baseUrl = `file://${path.join(process.cwd(), "index.html")}`;
  const params = new URLSearchParams({
    image: data.url,
    title: data.title,
    copyright: data.copyright,
  });
  const targetUrl = `${baseUrl}?${params.toString()}`;

  console.log("正在访问:", targetUrl);

  const browser = await puppeteer.launch({
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--allow-file-access-from-files",
    ],
  });
  const page = await browser.newPage();

  // 3. 设置视口 (1080p)
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 2 });

  // 4. 访问页面
  await page.goto(targetUrl, { waitUntil: "networkidle2" });

  // 5. 额外等待：确保字体以及背景图片渲染完成
  await page.evaluateHandle("document.fonts.ready");
  await new Promise((r) => setTimeout(r, 8000));

  // 6. 截图保存
  const dir = "./api";
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);

  await page.screenshot({
    path: "./api/today.png",
    type: "png",
  });

  await browser.close();
  console.log("截图已完成并保存到 ./api/today.png");
})();
