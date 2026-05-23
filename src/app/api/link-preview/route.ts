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

    // 유튜브 주소 판별 및 고도화된 파싱 (oEmbed API 호출)
    const isYouTube = parsedUrl.hostname.includes('youtube.com') || parsedUrl.hostname.includes('youtu.be');
    if (isYouTube) {
      try {
        const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
        const oembedRes = await fetch(oembedUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36',
          },
          next: { revalidate: 3600 },
        });
        if (oembedRes.ok) {
          const oembedData = await oembedRes.json();
          const channelName = oembedData.author_name ? `${oembedData.author_name}` : 'YouTube';
          return NextResponse.json({
            title: oembedData.title || 'YouTube 동영상',
            description: `${channelName} • YouTube 동영상`,
            image: oembedData.thumbnail_url || '',
            domain: 'youtube.com',
          });
        }
      } catch (e) {
        console.error('YouTube oEmbed parsing failed, trying fallback:', e);
      }

      // oEmbed 실패 시의 견고한 Fallback (정규식을 활용한 동영상 ID 추출 및 썸네일 주소 복구)
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
      const match = url.match(regExp);
      const videoId = (match && match[2].length === 11) ? match[2] : null;
      if (videoId) {
        return NextResponse.json({
          title: 'YouTube 동영상',
          description: '클릭하여 YouTube에서 시청하세요.',
          image: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
          domain: 'youtube.com',
        });
      }
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
