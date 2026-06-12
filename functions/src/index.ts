import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import puppeteer from "puppeteer";

export const generateCoverImage = onRequest(
  {
    memory: "2GiB",
    timeoutSeconds: 60,
    cors: true,
  },
  async (request, response) => {
    const targetUrl = request.query.url as string;

    if (!targetUrl) {
      response.status(400).send("Missing 'url' query parameter.");
      return;
    }

    let browser;
    try {
      logger.info(`Starting capture for: ${targetUrl}`);
      
      browser = await puppeteer.launch({
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-gpu"
        ]
      });

      const page = await browser.newPage();
      
      // Set viewport strictly to 1080x1920
      await page.setViewport({
        width: 1080,
        height: 1920,
        deviceScaleFactor: 1, // 1 for exactly 1080x1920 pixels
      });

      // Navigate to the target URL
      await page.goto(targetUrl, {
        waitUntil: "networkidle0",
        timeout: 30000,
      });

      // Wait for the render-complete signal to ensure all images and fonts are fully loaded
      try {
        await page.waitForSelector("#render-complete", { timeout: 15000 });
      } catch (e) {
        logger.warn("Timeout waiting for #render-complete, capturing anyway.");
      }

      // Take the screenshot
      const imageBuffer = await page.screenshot({
        type: "jpeg",
        quality: 95,
        fullPage: false,
      });

      response.setHeader("Content-Type", "image/jpeg");
      response.setHeader("Cache-Control", "public, max-age=86400");
      response.send(imageBuffer);
      
    } catch (error) {
      logger.error("Error generating image", error);
      response.status(500).send("Failed to generate image.");
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }
);
