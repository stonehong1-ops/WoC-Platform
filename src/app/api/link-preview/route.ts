// 외부 링크의 오픈 그래프 메타데이터를 파싱하여 돌려주는 API 라우터
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const url = searchParams.get('url');

    if (!url) {
      return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
    }

    // URL 형식 검증
    let parsedUrl;
    try {
      parsedUrl = new URL(url);
    } catch (e) {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    // HTML Fetch (User-Agent를 추가하여 봇 감지 우회)
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
      },
      next: { revalidate: 3600 }, // 1시간 캐시
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch target URL' }, { status: 502 });
    }

    const html = await response.text();

    // 메타 태그 정규식 추출 헬퍼
    const getMetaTag = (property: string): string => {
      const regex = new RegExp(
        `<meta[^>]*(?:property|name)=["']${property}["'][^>]*content=["']([^"']*)["']`,
        'i'
      );
      const match = html.match(regex);
      if (match && match[1]) return decodeHtmlEntities(match[1]);

      const reverseRegex = new RegExp(
        `<meta[^>]*content=["']([^"']*)["'][^>]*(?:property|name)=["']${property}["']`,
        'i'
      );
      const reverseMatch = html.match(reverseRegex);
      if (reverseMatch && reverseMatch[1]) return decodeHtmlEntities(reverseMatch[1]);

      return '';
    };

    const title = getMetaTag('og:title') || getMetaTag('twitter:title') || extractTitleTag(html) || parsedUrl.hostname;
    const description = getMetaTag('og:description') || getMetaTag('twitter:description') || getMetaTag('description') || '';
    const image = getMetaTag('og:image') || getMetaTag('twitter:image') || '';
    const domain = parsedUrl.hostname.replace('www.', '');

    return NextResponse.json({
      title: title.trim(),
      description: description.trim(),
      image: image.trim(),
      domain,
    });
  } catch (error: any) {
    console.error('Link preview error:', error);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}

// HTML 엔티티 디코딩
function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&middot;/g, '·')
    .replace(/&nbsp;/g, ' ');
}

// <title> 태그 백업 추출
function extractTitleTag(html: string): string {
  const match = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return match && match[1] ? decodeHtmlEntities(match[1]) : '';
}
