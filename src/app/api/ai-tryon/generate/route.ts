import { GoogleGenAI } from '@google/genai';
import { NextRequest } from 'next/server';
import { requireUser, AuthError } from '@/lib/server/userAuth';

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
    await requireUser(request);

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
    const { productImageUrl, userPhotoUrl, faceReferenceUrls, options = {} } = body;

    // 2. 필수 필드 검증
    if (!userPhotoUrl || typeof userPhotoUrl !== 'string') {
      return Response.json(
        { success: false, message: 'userPhotoUrl is required.', code: 'MISSING_USER_PHOTO' },
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
    const imageParts: Array<{ inlineData: { mimeType: string; data: string } }> = [];
    // 헤어 모드일 때는 productImageUrl이 없을 수 있으므로 유효 URL만 포함
    const allUrls = [userPhotoUrl, productImageUrl, ...validFaceRefs].filter((u): u is string => typeof u === 'string' && u.length > 0);

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
      console.log(`[AI TryOn] Primary model: ${primaryModel}, mode: ${options.mode || 'dress'}`);
      
      if (options.mode === 'shoe' || options.mode === 'shoes') {
        // 캐주얼 신발 렌더링 1차
        const promptCasual = buildTryOnPrompt({ ...options, shoeType: 'casual' }, hasFaceRefs, validFaceRefs.length);
        const resCasual = await ai.models.generateContent({
          model: formatModelName(primaryModel),
          contents: [...imageParts, { text: promptCasual }],
          config: { responseModalities: ['IMAGE', 'TEXT'] },
        });
        const extCasual = extractImageFromResponse(resCasual);
        if (extCasual) generatedImages.push(extCasual);

        // 비즈니스 신발 렌더링 2차
        const promptBusiness = buildTryOnPrompt({ ...options, shoeType: 'business' }, hasFaceRefs, validFaceRefs.length);
        const resBusiness = await ai.models.generateContent({
          model: formatModelName(primaryModel),
          contents: [...imageParts, { text: promptBusiness }],
          config: { responseModalities: ['IMAGE', 'TEXT'] },
        });
        const extBusiness = extractImageFromResponse(resBusiness);
        if (extBusiness) generatedImages.push(extBusiness);

        if (generatedImages.length === 0) {
          throw new Error('No image generated for shoe mode.');
        }
      } else {
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
    if (error instanceof AuthError) {
      return Response.json(
        { success: false, message: error.message, code: 'UNAUTHORIZED' },
        { status: error.status }
      );
    }
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
// Virtual Try-On 및 Hair 스타일링 프롬프트 빌더
// ---------------------------------------------------------------------------
function buildTryOnPrompt(options: Record<string, string>, hasFaceRefs: boolean, faceRefCount: number): string {
  // 헤어 전용 프롬프트 분기 (핀포인트 영역 변환 지침)
  if (options.mode === 'hair') {
    const hairStyle = options.hairStyle || 'maintain current hair style';
    const hairColor = options.hairColor || 'maintain current hair color';

    return [
      'You are performing a precision AI hair segmentation and hair color transformation.',
      '',
      'Inputs:',
      '1. Image 1: Target person\'s face, head, and body photo.',
      '',
      '--- ABSOLUTE ZERO-DEVIATION PRESERVATION ---',
      '- Keep the person\'s face, eyes, nose, lips, skin tone, facial features, body shape, clothes, and background 100% EXACTLY IDENTICAL to Image 1.',
      '- DO NOT apply color filters or tinting to skin, face, clothing, or background.',
      '- ONLY target the scalp and hair strands on top of the head.',
      '',
      '--- PRECISION HAIR & COLOR APPLICATION ---',
      `- Change ONLY the hairstyle to: '${hairStyle}'.`,
      `- Change ONLY the hair color to: '${hairColor}'.`,
      '- Ensure seamless hair strand integration, natural hairline blending, realistic lighting, and photorealistic hair texture.',
      '',
      'Produce a clean, realistic, high-resolution beauty salon photograph.',
      'No text, no logos, no watermarks.'
    ].join('\n');
  }

  // 신발 전용 프롬프트 분기 (WoC AI Shoe Studio 핀포인트 전신 착장: 캐주얼 1장 / 비즈니스 1장)
  if (options.mode === 'shoe' || options.mode === 'shoes') {
    const hasProductImage = !!options.hasProductImage;
    const shoeType = options.shoeType || 'casual';
    const isBusiness = shoeType === 'business';

    return [
      `You are performing a precision AI full-body fashion try-on image generation for ${isBusiness ? 'BUSINESS FORMAL' : 'CASUAL ELEGANT'} style.`,
      '',
      'Inputs:',
      '1. Image 1: Target person photo for body shape, height, face, and skin tone reference.',
      hasProductImage ? '2. Image 2: Target shoe product photo to be fitted onto the person\'s feet.' : '2. Target shoe style specification.',
      '',
      '--- FULL-BODY OUTFIT & STYLING SPECIFICATION ---',
      `- Generate a HIGH-RESOLUTION FULL-BODY photograph showing the person from head to toe wearing the target shoes.`,
      isBusiness
        ? '- OUTFIT STYLE: Premium Classic Business Formal Outfit (tailored navy/charcoal suit, dress shirt, formal pants, professional office look).'
        : '- OUTFIT STYLE: Chic Casual Fashion Outfit (stylish blazer/jacket, modern denim/slacks, elegant daily lifestyle outfit).',
      '',
      '--- PERSON & FACE IDENTITY PRESERVATION ---',
      '- Preserve the target person\'s face, hair, facial features, skin tone, and body proportions from Image 1.',
      '',
      '--- TARGETED SHOE FITTING & PINPOINT BLENDING ---',
      hasProductImage 
        ? '- Seamlessly fit and render the EXACT target shoe product shown in Image 2 onto the person\'s feet.' 
        : '- Render clean premium dress shoes matching the outfit onto the person\'s feet.',
      '- Ensure 100% photorealistic leather/fabric texture, soles, and natural ground contact shadow.',
      '',
      'Produce a clean, realistic, high-resolution fashion lookbook photograph.',
      'No text, no logos, no watermarks.'
    ].join('\n');
  }

  // 드레스/의상 가상 착장 프롬프트
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
    'You are performing a virtual garment try-on.',
    '',
    'Inputs:',
    '1. First image (PRIMARY PERSON BASE): User original body and face photo — THIS IS THE TARGET PERSON WHO MUST APPEAR IN THE FINAL IMAGE.',
    '2. Second image (TARGET CLOTHING ONLY): The dress/garment photo — THIS IS THE CLOTHING TO BE FITTED ONTO THE PERSON FROM IMAGE 1.',
  ];

  if (hasFaceRefs) {
    lines.push(`3. Images 3 through ${2 + faceRefCount}: Additional face identity reference photos of the person in Image 1 (${faceRefCount} photos).`);
  }

  lines.push(
    '',
    '--- STRICT PERSON PRESERVATION (MUST COMPLY) ---',
    'The person in the final output MUST BE THE EXACT SAME PERSON from Image 1.',
    'Keep their facial features, face shape, eyes, nose, mouth, hair style/color, skin tone, age, and body proportions unchanged.',
    'Do NOT generate a model or face from Image 2. Image 2 is CLOTHING ONLY.',
    '',
    '--- CLOTHING FIT MANDATE ---',
    'Dress the person from Image 1 in the exact garment/dress shown in Image 2.',
    'Maintain the original color hue, pattern, neckline, sleeves, silhouette, and design of the garment from Image 2.',
    'Fit the garment naturally and realistically onto the body of the person from Image 1.',
    '',
    `Scene: ${location}.`,
    `Mood: ${mood}.`,
    `Frame: ${frame}.`,
    `Pose: ${pose}.`,
    '',
    'Produce a clean, high-resolution fashion photograph.',
    'No text, no logos, no watermarks.'
  );

  return lines.join('\n');
}

function buildNegativePrompt(): string {
  return [
    'Do not change the person\'s identity or facial features.',
    'Do not alter face shape, age, or expression.',
    'overexposed, washed-out colors, blurry, low quality, distorted face.',
  ].join('\n');
}
