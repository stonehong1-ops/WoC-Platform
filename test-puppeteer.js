const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');

async function test() {
  try {
    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: { width: 1080, height: 1920 },
      executablePath: await chromium.executablePath(),
      headless: true,
    });
    console.log("Browser launched successfully.");
    await browser.close();
  } catch (e) {
    console.error("Error launching browser:", e);
  }
}

test();
