import { NextRequest, NextResponse } from 'next/server';

export function GET(request: NextRequest) {
  const ua = request.headers.get('user-agent') || '';

  // 카카오톡, 카카오 디버거, 페이스북, 트위터, 슬랙 등 스크래퍼 봇인 경우 Open Graph HTML 즉시 반환 (302 방지)
  const isBot = /kakao|scrap|bot|facebook|twitter|slack|whatsapp|line|linkedin|outbrain|pinterest|telegram/i.test(ua);

  if (isBot) {
    const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>Tango World / 탱고월드</title>
  <meta name="description" content="Meet.Dance.Belong" />
  
  <!-- Open Graph / Facebook / KakaoTalk -->
  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://www.woc.today/app" />
  <meta property="og:site_name" content="www.woc.today/app" />
  <meta property="og:title" content="Tango World / 탱고월드" />
  <meta property="og:description" content="Meet.Dance.Belong" />
  <meta property="og:image" content="https://www.woc.today/images/tango-world-app-share-v2.jpg?v=20260724_2" />
  <meta property="og:image:secure_url" content="https://www.woc.today/images/tango-world-app-share-v2.jpg?v=20260724_2" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content="Tango World" />
  
  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="Tango World / 탱고월드" />
  <meta name="twitter:description" content="Meet.Dance.Belong" />
  <meta name="twitter:image" content="https://www.woc.today/images/tango-world-app-share-v2.jpg?v=20260724_2" />
</head>
<body>
  <h1>Tango World / 탱고월드</h1>
  <p>Meet.Dance.Belong</p>
</body>
</html>`;

    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  }

  // iOS 기기 감지
  if (/iPhone|iPad|iPod/i.test(ua)) {
    return NextResponse.redirect(
      'https://apps.apple.com/app/tango-world/id6789032896',
      302
    );
  }

  // Android 기기 감지
  if (/Android/i.test(ua)) {
    return NextResponse.redirect(
      'https://play.google.com/store/apps/details?id=com.woc.today',
      302
    );
  }

  // 판별 불가 → 선택 페이지
  const selectUrl = new URL('/app/select', request.url);
  return NextResponse.redirect(selectUrl, 302);
}
