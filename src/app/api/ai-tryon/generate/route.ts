import { GoogleGenAI } from '@google/genai';
import { NextRequest } from 'next/server';

// ---------------------------------------------------------------------------
// 비용 추산 기준 (1장당)
// ---------------------------------------------------------------------------
const COST_TABLE: Record<string, { usd: number; krw: number }> = {
  'gemini-3-pro-image':     { usd: 0.025, krw: 350 },
  'gemini-2.5-flash-image': { usd: 0.010, krw: 140 },
};

// ---------------------------------------------------------------------------
// POST /api/ai-tryon/generate
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  try {
    // 0. 환경변수 로드
    const apiKey = process.env.GOOGLE_AI_IMAGE_KEY;
    const primaryModel = process.env.GOOGLE_AI_IMAGE_MODEL || 'gemini-3-pro-image';
    const imageSize = process.env.GOOGLE_AI_IMAGE_SIZE || '4K';

    if (!apiKey) {
      return Response.json(
        { success: false, message: 'GOOGLE_AI_IMAGE_KEY is not configured.', code: 'MISSING_API_KEY' },
        { status: 500 }
      );
    }

    // 1. 요청 바디 파싱
    const body = await request.json();
    const { productImageUrl, userPhotoUrl, faceReferenceUrls, options } = body;

    // 2. 필수 필드 검증
    if (!productImageUrl || typeof productImageUrl !== 'string') {
      return Response.json(
        { success: false, message: 'productImageUrl is required.', code: 'MISSING_PRODUCT_IMAGE' },
        { status: 400 }
      );
    }
    if (!userPhotoUrl || typeof userPhotoUrl !== 'string') {
      return Response.json(
        { success: false, message: 'userPhotoUrl is required.', code: 'MISSING_USER_PHOTO' },
        { status: 400 }
      );
    }
    if (!options || typeof options !== 'object') {
      return Response.json(
        { success: false, message: 'options is required.', code: 'MISSING_OPTIONS' },
        { status: 400 }
      );
    }

    // 3. faceReferenceUrls 검증 (선택 사항)
    const validFaceRefs: string[] = [];
    if (Array.isArray(faceReferenceUrls)) {
      for (const url of faceReferenceUrls) {
        if (typeof url === 'string' && (url.startsWith('http://') || url.startsWith('https://'))) {
          validFaceRefs.push(url);
        }
      }
    }
    const hasFaceRefs = validFaceRefs.length > 0;

    // 4. 이미지 로드
    // 순서: [상품 이미지] [유저 원본 사진] [얼굴 참조 사진들...]
    const imageParts: Array<{ inlineData: { mimeType: string; data: string } }> = [];
    const allUrls = [productImageUrl, userPhotoUrl, ...validFaceRefs];

    for (const url of allUrls) {
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        return Response.json(
          { success: false, message: `Invalid image URL: ${url}`, code: 'INVALID_URL' },
          { status: 400 }
        );
      }
      const imgResponse = await fetch(url);
      if (!imgResponse.ok) {
        return Response.json(
          { success: false, message: `Failed to fetch image: HTTP ${imgResponse.status}`, code: 'IMAGE_FETCH_ERROR' },
          { status: 500 }
        );
      }
      const arrayBuffer = await imgResponse.arrayBuffer();
      const imageBase64 = Buffer.from(arrayBuffer).toString('base64');
      const ct = imgResponse.headers.get('content-type') || 'image/jpeg';
      imageParts.push({ inlineData: { mimeType: ct, data: imageBase64 } });
    }

    // 5. 프롬프트 구성
    const prompt = buildTryOnPrompt(options, hasFaceRefs, validFaceRefs.length);
    const negativePrompt = buildNegativePrompt();

    // 6. Gemini API 호출 (Primary → Fallback)
    const ai = new GoogleGenAI({ apiKey });
    const fallbackModel = 'gemini-2.5-flash-image';
    const formatModelName = (name: string) => name.startsWith('models/') ? name : `models/${name}`;

    let usedModel = primaryModel;
    let usedFallback = false;
    let fallbackReason: string | undefined;
    const generatedImages: Array<{ base64: string; mimeType: string }> = [];

    try {
      console.log(`[AI TryOn] Primary model: ${primaryModel}, faceRefs: ${validFaceRefs.length}`);
      const response = await ai.models.generateContent({
        model: formatModelName(primaryModel),
        contents: [
          ...imageParts,
          { text: prompt },
        ],
        config: { responseModalities: ['IMAGE', 'TEXT'] },
      });

      const extracted = extractImageFromResponse(response);
      if (extracted) {
        generatedImages.push(extracted);
      } else {
        throw new Error('No image data in AI response.');
      }
    } catch (primaryError: unknown) {
      const primaryMsg = primaryError instanceof Error ? primaryError.message : 'Primary model failed';
      console.warn(`[AI TryOn] Primary failed: ${primaryMsg}, trying fallback...`);

      try {
        const fallbackResponse = await ai.models.generateContent({
          model: formatModelName(fallbackModel),
          contents: [
            ...imageParts,
            { text: prompt },
          ],
          config: { responseModalities: ['IMAGE', 'TEXT'] },
        });

        const extracted = extractImageFromResponse(fallbackResponse);
        if (extracted) {
          generatedImages.push(extracted);
          usedModel = fallbackModel;
          usedFallback = true;
          fallbackReason = `Primary (${primaryModel}) failed: ${primaryMsg}`;
        } else {
          throw new Error('Fallback also produced no image.');
        }
      } catch (fallbackError: unknown) {
        const fallbackMsg = fallbackError instanceof Error ? fallbackError.message : 'Fallback failed';
        return Response.json(
          { success: false, message: `AI generation failed. Primary: ${primaryMsg}, Fallback: ${fallbackMsg}`, code: 'AI_GENERATION_FAILED' },
          { status: 500 }
        );
      }
    }

    // 7. 비용 추산
    const costEntry = COST_TABLE[usedModel] || { usd: 0, krw: 0 };
    const estimatedCostUsd = Math.round(costEntry.usd * generatedImages.length * 1000) / 1000;
    const estimatedCostKrw = Math.round(costEntry.krw * generatedImages.length);

    // 8. 성공 응답
    return Response.json({
      success: true,
      provider: 'gemini',
      model: usedModel,
      imageSize,
      generatedImages,
      prompt,
      negativePrompt,
      estimatedCostUsd,
      estimatedCostKrw,
      usedFallback,
      fallbackReason,
      faceRefsUsed: validFaceRefs.length,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[AI TryOn] Unexpected error:', errorMessage);
    return Response.json(
      { success: false, message: `Server error: ${errorMessage}`, code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// AI 응답에서 이미지 추출
// ---------------------------------------------------------------------------
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractImageFromResponse(response: any): { base64: string; mimeType: string } | null {
  const candidates = response.candidates;
  if (!candidates || candidates.length === 0) return null;
  const parts = candidates[0].content?.parts;
  if (!parts || parts.length === 0) return null;
  for (const part of parts) {
    if (part.inlineData && part.inlineData.data) {
      return { base64: part.inlineData.data, mimeType: part.inlineData.mimeType || 'image/png' };
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Virtual Try-On 프롬프트 빌더 (역할 분리)
// ---------------------------------------------------------------------------
function buildTryOnPrompt(options: Record<string, string>, hasFaceRefs: boolean, faceRefCount: number): string {
  const locationMap: Record<string, string> = {
    studio: 'clean minimal white studio with soft diffused lighting',
    showroom: 'elegant indoor fashion showroom with warm ambient lighting',
    cafe: 'modern urban cafe terrace with natural daylight',
    city_street: 'vibrant modern city street with urban architecture',
    park: 'beautiful sunlit park with lush greenery and golden hour light',
    restaurant: 'upscale modern restaurant with warm ambient lighting',
    hotel_lobby: 'luxurious hotel lobby with sophisticated interior design',
    resort: 'tropical resort with ocean views and natural light',
    home: 'cozy modern home interior with warm lifestyle atmosphere',
  };
  const moodMap: Record<string, string> = {
    minimal: 'minimalist, clean, modern',
    luxury: 'luxurious, opulent, high-end',
    daily: 'natural, casual, everyday lifestyle',
    emotional: 'dreamy, film-grain, warm emotional tones',
    premium: 'premium fashion brand lookbook, polished editorial',
    street: 'streetwear, edgy, urban hip',
    feminine: 'soft, feminine, graceful',
    casual: 'relaxed, sporty, comfortable',
    elegant: 'classic, refined, timeless elegance',
  };
  const frameMap: Record<string, string> = {
    full_body: 'full body shot',
    three_quarter: 'three-quarter body shot',
    upper_body: 'upper body shot',
  };
  const poseMap: Record<string, string> = {
    front_standing: 'natural front-facing standing pose',
    slight_side: 'slight side angle pose',
    walking: 'natural walking pose',
    natural: 'relaxed natural pose',
    sitting: 'seated pose',
  };

  const location = locationMap[options.locationPreset] || 'clean minimal white studio';
  const mood = moodMap[options.moodPreset] || 'minimalist, clean, modern';
  const frame = frameMap[options.frameType] || 'full body shot';
  const pose = poseMap[options.posePreset] || 'natural front-facing standing pose';

  const lines: string[] = [
    'You are generating a virtual try-on image.',
    '',
    'Inputs:',
    '1. First image: Product / garment / clothing / shoes reference.',
    '2. Second image: User original body photo — the person and body to preserve.',
  ];

  if (hasFaceRefs) {
    lines.push(`3. Images 3 through ${2 + faceRefCount}: Face identity reference photos (${faceRefCount} photos). Use ONLY for identity preservation.`);
  }

  lines.push(
    '',
    '--- PERSON PRESERVATION (CRITICAL) ---',
    'Preserve the user\'s facial identity exactly.',
    'Do not alter the face, age, skin tone, facial structure, hairstyle, or expression.',
    'The person in the output MUST look identical to the person in the second image.',
    'Preserve their body proportions and overall appearance.',
  );

  if (hasFaceRefs) {
    lines.push(
      '',
      '--- FACE REFERENCE USAGE ---',
      'Use the face reference photos ONLY to maintain facial identity consistency.',
      'Do NOT copy clothing, background, pose, or any other element from the face reference photos.',
      'The face reference photos are identity anchors only.',
    );
  }

  lines.push(
    '',
    '--- GARMENT PRESERVATION (CRITICAL) ---',
    'The garment MUST match the first image exactly.',
    'Preserve the garment\'s design details: buttons, zippers, pockets, collar, sleeves, hem length, silhouette.',
    'Maintain the exact color hue, saturation, brightness of the original garment.',
    'Do NOT redesign, recolor, or add new patterns/logos to the garment.',
    '',
    '--- RULES ---',
    'Only change clothing, shoes, styling, background, pose, and lighting as specified.',
    'Do NOT change the user\'s body shape unless required by pose.',
    'Keep the output realistic and suitable for fashion try-on.',
    '',
    `Scene: ${location}.`,
    `Mood: ${mood}.`,
    `Frame: ${frame}.`,
    `Pose: ${pose}.`,
    '',
    'Produce a high-resolution, realistic photograph.',
    'No text, logos, or watermarks.',
  );

  return lines.join('\n');
}

function buildNegativePrompt(): string {
  return [
    'Do not change the person\'s identity or facial features.',
    'Do not alter garment design, color, or details.',
    'Do not add new patterns, logos, or decorations.',
    'overexposed, washed-out colors, blurry, low quality, distorted face.',
  ].join('\n');
}
