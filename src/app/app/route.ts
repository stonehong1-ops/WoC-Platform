import { NextRequest, NextResponse } from 'next/server';

export function GET(request: NextRequest) {
  const ua = request.headers.get('user-agent') || '';
  
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
