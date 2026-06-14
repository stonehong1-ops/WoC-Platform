const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// CLI Arguments
const isDryRun = process.argv.includes('--dry-run');
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

// Helper: Send Discord Alert
async function sendDiscordAlert(isSuccess, message, errorTrace = null) {
  if (!DISCORD_WEBHOOK_URL) {
    console.log('Discord Webhook URL이 설정되지 않아 알림 전송을 건너뜁니다.');
    return;
  }
  const payload = {
    embeds: [{
      title: isSuccess ? '✅ [성공] 오늘의 탱고 페이스북 포스팅' : '❌ [실패] 오늘의 탱고 페이스북 포스팅',
      description: message,
      color: isSuccess ? 3066993 : 15158332,
      timestamp: new Date().toISOString()
    }]
  };
  if (errorTrace) {
    payload.embeds[0].fields = [{ name: '에러 내용', value: '```\n' + errorTrace.slice(0, 1000) + '\n```' }];
  }
  try {
    const response = await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      console.error(`Discord Webhook 전송 실패: ${response.status}`);
    }
  } catch (err) {
    console.error('Discord Webhook 전송 오류:', err);
  }
}

// Helper: Get formatted date in KST (yyyy-mm-dd)
function getKSTDateString() {
  const kstOffset = 9 * 60 * 60 * 1000;
  const kstDate = new Date(Date.now() + kstOffset);
  return kstDate.toISOString().split('T')[0];
}

(async () => {
  const dateStr = getKSTDateString();
  const coverPath = path.join(__dirname, 'cover.png');
  const sessionPath = path.join(__dirname, 'fb_session.json');

  console.log(`구동일자(KST): ${dateStr}`);
  if (isDryRun) {
    console.log('--- DRY RUN MODE로 가동됩니다 (실제 발행 안 됨) ---');
  }

  let browser;
  try {
    // 1. 세션 쿠키 검증
    if (!fs.existsSync(sessionPath)) {
      throw new Error(`페이스북 세션 파일(fb_session.json)이 없습니다. 먼저 'npm run bot:login'을 실행하세요.`);
    }
    const cookies = JSON.parse(fs.readFileSync(sessionPath, 'utf8'));

    // 2. Playwright 브라우저 가동 (3배 해상도 지원)
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: 1200, height: 1600 },
      deviceScaleFactor: 3, // 1080px 수준 고해상도 캡처
      locale: 'ko-KR',
      timezoneId: 'Asia/Seoul'
    });
    await context.addCookies(cookies);

    const page = await context.newPage();

    // 3. 오늘의 텍스트 가공 결과 가져오기
    console.log('오늘의 일정 텍스트를 불러옵니다...');
    const textApiUrl = `https://www.woc.today/api/cover-text?format=text&date=${dateStr}`;
    await page.goto(textApiUrl);
    const contentText = await page.textContent('body');
    if (!contentText || contentText.trim().length === 0 || contentText.includes('Error')) {
      throw new Error('일정 텍스트를 API로부터 가져오는 데 실패했습니다.');
    }
    console.log(`[텍스트 추출 성공] 글자수: ${contentText.length}`);

    // 4. 스타일 D 표지 캡처
    console.log('표지 이미지를 렌더링하고 캡처합니다...');
    const renderUrl = `https://www.woc.today/admin/covers/render?theme=D&date=${dateStr}`;
    await page.goto(renderUrl, { waitUntil: 'domcontentloaded' });
    
    // 렌더링 완료 요소를 감지 (캡처 타겟 대기)
    const targetSelector = '#capture-target';
    await page.waitForSelector(targetSelector, { timeout: 15000 });
    // 내부 이미지 등의 완전 로딩을 위해 2초 추가 대기
    await page.waitForTimeout(2000);

    const captureEl = await page.$(targetSelector);
    if (!captureEl) {
      throw new Error('캡처 대상(#capture-target) 엘리먼트를 찾지 못했습니다.');
    }
    await captureEl.screenshot({ path: coverPath });
    console.log(`✅ 표지 이미지 캡처 완료: ${coverPath}`);

    // 5. 페이스북 그룹 접속 및 포스팅
    console.log('페이스북 그룹 페이지에 진입합니다...');
    await page.goto('https://www.facebook.com/groups/evening.tea.milonga', { waitUntil: 'domcontentloaded' });

    // 로그인 만료 여부 검증 (로그인 페이지 등으로 리다이렉트 되었는지 체크)
    if (page.url().includes('login')) {
      throw new Error('페이스북 세션이 만료되었습니다. 다시 로그인 세션을 갱신해 주세요.');
    }

    // 6. 글쓰기 모달 활성화 (다중 셀렉터 순차 폴백)
    console.log('글쓰기 대화상자를 탐색합니다...');
    const writeSelectors = [
      'role=button[name*="Write something"]',
      'role=button[name*="아름다운 이야기"]',
      'role=button[name*="글쓰기"]',
      'text="Write something..."',
      'text="아름다운 이야기를 나누어보세요..."'
    ];

    let writeButton = null;
    for (const sel of writeSelectors) {
      try {
        writeButton = page.locator(sel).first();
        if (await writeButton.isVisible()) {
          console.log(`글쓰기 버튼 발견: ${sel}`);
          break;
        }
      } catch (e) {}
    }

    if (!writeButton || !(await writeButton.isVisible())) {
      // 최후의 보루: 일반 텍스트 매칭으로 클릭 시도
      writeButton = page.getByRole('button').filter({ hasText: /Write something|아름다운 이야기|글쓰기/ }).first();
    }

    await writeButton.click();
    console.log('글쓰기 모달을 열었습니다.');

    // 7. 텍스트 입력창 탐색 및 텍스트 주입
    console.log('포스트 작성 상자를 찾습니다...');
    const textBoxSelectors = [
      'role=textbox[name*="Write something"]',
      'role=textbox[name*="그룹에 글쓰기"]',
      'role=textbox[name*="아름다운 이야기"]',
      'role=textbox',
      '[aria-label*="Write something"]',
      '[aria-label*="그룹에 글쓰기"]'
    ];

    let textBox = null;
    for (const sel of textBoxSelectors) {
      try {
        textBox = page.locator(sel).first();
        if (await textBox.isVisible()) {
          console.log(`작성 창 발견: ${sel}`);
          break;
        }
      } catch (e) {}
    }

    if (!textBox || !(await textBox.isVisible())) {
      textBox = page.getByRole('textbox').first();
    }

    await textBox.fill(contentText);
    console.log('텍스트를 정상적으로 채웠습니다.');

    // 8. 이미지 업로드 처리
    console.log('이미지 첨부 도구를 실행합니다...');
    // 파일 업로드 인풋(hidden)에 캡처한 이미지 파일 주입
    const fileInput = page.locator('input[type="file"][accept*="image"]').first();
    await fileInput.setInputFiles(coverPath);
    console.log('이미지 파일 첨부를 완료했습니다.');

    // 미디어가 정상 로드/렌더링될 수 있도록 잠시 대기
    await page.waitForTimeout(3000);

    // 9. 최종 게시 버튼 트리거
    const postSelectors = [
      'role=button[name="Post"]',
      'role=button[name="게시"]',
      'role=button[name="공유"]'
    ];

    let postButton = null;
    for (const sel of postSelectors) {
      try {
        postButton = page.locator(sel).first();
        if (await postButton.isVisible()) {
          console.log(`게시 버튼 발견: ${sel}`);
          break;
        }
      } catch (e) {}
    }

    if (!postButton || !(await postButton.isVisible())) {
      postButton = page.getByRole('button').filter({ hasText: /Post|게시|공유/ }).first();
    }

    if (isDryRun) {
      console.log('--- [DRY RUN] 게시 직전 모달 화면 캡처 저장 ---');
      const previewPath = path.join(__dirname, 'cover_preview_dryrun.png');
      await page.screenshot({ path: previewPath });
      console.log(`✅ 드라이런 미리보기 저장 완료: ${previewPath}`);
      await sendDiscordAlert(true, `[Dry Run] 페이스북 포스팅 시뮬레이션 성공\n- 일자: ${dateStr}\n- 실제 글쓰기 모달 폼 작성까지 완료되었습니다.`);
    } else {
      console.log('게시 버튼을 클릭하여 발행을 개시합니다...');
      await postButton.click();
      
      // 업로드 및 완료 대기
      await page.waitForTimeout(7000);
      console.log('✅ 페이스북 그룹에 정상 포스팅 발행 완료.');
      await sendDiscordAlert(true, `[성공] 페이스북 포스팅 완료\n- 일자: ${dateStr}\n- 오늘의 탱고 일정이 페이스북 그룹에 성공적으로 포스팅되었습니다.`);
    }

  } catch (error) {
    console.error('자동 포스팅 중 오류 발생:', error);
    await sendDiscordAlert(false, `[실패] 페이스북 포스팅 오류 발생\n- 일자: ${dateStr}\n- 사유: ${error.message}`, error.stack);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
})();
