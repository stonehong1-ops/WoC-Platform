import { chromium } from "playwright";
import { jsPDF } from "jspdf";
import fs from "fs";
import path from "path";

async function exportPDF() {
  const PORT = process.env.PORT || 3000;
  const baseUrl = `http://localhost:${PORT}`;
  console.log(`🚀 PDF Export 스크립트를 시작합니다. (대상 서버: ${baseUrl})`);

  // public/exports 디렉토리 존재 확인 및 생성
  const exportsDir = path.resolve("public/exports");
  if (!fs.existsSync(exportsDir)) {
    fs.mkdirSync(exportsDir, { recursive: true });
    console.log(`📁 디렉토리 생성 완료: ${exportsDir}`);
  }

  // Playwright 브라우저 기동 (1280x720 고정)
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 2, // 초고화질
  });

  const page = await context.newPage();

  // 1280x720px 16:9 커스텀 규격 PDF 인스턴스 생성
  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "px",
    format: [1280, 720]
  });

  const totalPages = 19;

  for (let i = 1; i <= totalPages; i++) {
    const pageNum = String(i).padStart(2, "0");
    const targetUrl = `${baseUrl}/pt?page=${pageNum}&export=1`;
    console.log(`📸 [${i}/${totalPages}] 슬라이드 캡처 중: ${targetUrl}`);

    try {
      // 페이지 로드 대기
      await page.goto(targetUrl, { waitUntil: "networkidle" });
      
      // 폰트 안정화 대기
      await page.evaluate(() => document.fonts.ready);
      
      // 레이아웃 안정화 및 프레임 완성 추가 대기
      await page.waitForTimeout(800);

      // 전체 화면 캡처
      const buffer = await page.screenshot({ type: "png" });

      if (i > 1) {
        pdf.addPage([1280, 720], "landscape");
      }

      // 1280x720px 크기에 딱 맞춰 1:1로 full-bleed 삽입
      pdf.addImage(buffer, "PNG", 0, 0, 1280, 720, undefined, "FAST");
    } catch (error) {
      console.error(`❌ 슬라이드 ${pageNum} 캡처 실패:`, error);
      await browser.close();
      process.exit(1);
    }
  }

  const outputPath = path.join(exportsDir, "WoC_Investment_Proposal_2026.pdf");
  
  // ArrayBuffer를 Buffer로 변환하여 fs.writeFileSync로 저장
  const pdfBuffer = Buffer.from(pdf.output("arraybuffer"));
  fs.writeFileSync(outputPath, pdfBuffer);
  console.log(`✅ 16:9 PDF 생성 및 저장 성공: ${outputPath}`);

  await browser.close();
  process.exit(0);
}

exportPDF();
