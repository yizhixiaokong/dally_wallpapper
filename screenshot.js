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

  const dir = "./api";
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);

  const browser = await puppeteer.launch({
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--allow-file-access-from-files",
    ],
  });

  try {
    // 横屏截图（原有行为）
    const params = new URLSearchParams({
      image: data.url,
      title: data.title,
      copyright: data.copyright,
    });
    const targetUrl = `${baseUrl}?${params.toString()}`;

    console.log("正在访问（横屏）:", targetUrl);
    const page = await browser.newPage();
    await page.setViewport({ width: 3840, height: 2160, deviceScaleFactor: 1 });
    await page.goto(targetUrl, { waitUntil: "networkidle2" });
    await page.evaluateHandle("document.fonts.ready");
    await new Promise((r) => setTimeout(r, 4000));

    await page.screenshot({ path: "./api/today.jpg", type: "jpeg", quality: 80 });
    console.log("横屏截图已保存到 ./api/today.jpg");
    await page.close();

    // 竖屏截图（如果存在 portrait_url）
    if (data.portrait_url) {
      const paramsP = new URLSearchParams({
        image: data.portrait_url,
        title: data.title,
        copyright: data.copyright,
        orientation: "portrait",
      });
      const targetUrlP = `${baseUrl}?${paramsP.toString()}`;

      console.log("正在访问（竖屏）:", targetUrlP);
      const pageP = await browser.newPage();
      // 9:16 竖屏分辨率
      await pageP.setViewport({ width: 2160, height: 3840, deviceScaleFactor: 1 });
      await pageP.goto(targetUrlP, { waitUntil: "networkidle2" });
      await pageP.evaluateHandle("document.fonts.ready");
      await new Promise((r) => setTimeout(r, 4000));

      await pageP.screenshot({ path: "./api/today_portrait.jpg", type: "jpeg", quality: 80 });
      console.log("竖屏截图已保存到 ./api/today_portrait.jpg");
      await pageP.close();
    } else {
      console.log("未找到 portrait_url，跳过竖屏截图");
    }
  } finally {
    await browser.close();
  }
})();
