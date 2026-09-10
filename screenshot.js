const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

const dataPath = process.argv[2] || "wallpaper-data.json";
const outDir = process.argv[3] || "api";
const htmlUrl = `file://${path.join(process.cwd(), "index.html")}`;

async function render(browser, { image, title, copyright }, viewport, outFile) {
  const params = new URLSearchParams({ image });
  if (title) params.set("title", title);
  if (copyright) params.set("copyright", copyright);

  console.log("正在截图:", outFile);
  const page = await browser.newPage();
  try {
    await page.setViewport(viewport);
    await page.goto(`${htmlUrl}?${params.toString()}`, {
      waitUntil: "networkidle2",
    });
    await page.evaluate(() => document.fonts.ready);

    // 等图片真正解码完成 + 淡入结束，避免截到空白或半透明画面
    await page.waitForFunction(
      async () => {
        if (getComputedStyle(document.body).opacity !== "1") return false;
        const match = /url\(['"]?(.*?)['"]?\)/.exec(
          document.body.style.backgroundImage || ""
        );
        if (!match) return false;
        const img = new Image();
        img.src = match[1];
        try {
          await img.decode();
        } catch {
          return false;
        }
        return img.naturalWidth > 0;
      },
      { timeout: 60000, polling: 250 }
    );

    await page.screenshot({ path: outFile, type: "jpeg", quality: 80 });
    console.log("已保存:", outFile);
  } finally {
    await page.close();
  }
}

(async () => {
  const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));
  if (!data.url) throw new Error(`${dataPath} 中缺少 url 字段`);

  fs.mkdirSync(outDir, { recursive: true });

  const browser = await puppeteer.launch({
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--allow-file-access-from-files",
    ],
  });

  try {
    await render(
      browser,
      { image: data.url, title: data.title, copyright: data.copyright },
      { width: 3840, height: 2160, deviceScaleFactor: 1 },
      path.join(outDir, "today.jpg")
    );

    if (data.portrait_url) {
      await render(
        browser,
        {
          image: data.portrait_url,
          title: data.title,
          copyright: data.copyright,
        },
        { width: 2160, height: 3840, deviceScaleFactor: 1 },
        path.join(outDir, "today_portrait.jpg")
      );
    } else {
      console.log("未找到 portrait_url，跳过竖屏截图");
    }
  } finally {
    await browser.close();
  }
})();
