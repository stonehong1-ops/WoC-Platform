import { NextResponse } from 'next/server';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

export const maxDuration = 10; // Hobby limit, Pro can be 60

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const renderUrl = searchParams.get('url');

    if (!renderUrl) {
      return new NextResponse('Missing url parameter', { status: 400 });
    }

    const isLocal = !!process.env.NEXT_PUBLIC_VERCEL_URL === false;
    
    // Fallback for local development or download remote binary on Vercel
    const exePath = isLocal
      ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' // common local windows path
      : await chromium.executablePath('https://github.com/Sparticuz/chromium/releases/download/v149.0.0/chromium-v149.0.0-pack.x64.tar');

    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: { width: 1080, height: 1920 },
      executablePath: exePath,
      headless: true,
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 1 });
    await page.goto(renderUrl, { waitUntil: 'networkidle0', timeout: 8000 });

    // Wait for the render-complete div to ensure all content is loaded
    await page.waitForSelector('#render-complete', { timeout: 5000 }).catch(() => {});

    const imageBuffer = await page.screenshot({
      type: 'jpeg',
      quality: 100,
      fullPage: true,
    });

    await browser.close();

    return new Response(imageBuffer as any, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Content-Disposition': 'attachment; filename="woc-cover.jpg"',
      },
    });
  } catch (error) {
    console.error('Error generating image:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(`Internal Server Error: ${errorMessage}`, { status: 500 });
  }
}
