import { NextRequest, NextResponse } from 'next/server';

const TANGO_SYSTEM_PROMPT = `You are an expert Argentine Tango instructor and AI lesson assistant.
You ONLY answer questions related to Argentine Tango. If the user asks about anything unrelated to tango, you MUST respond with exactly this message (in the appropriate language):

Korean: "저는 탱고 전문 AI강사이기 때문에 탱고 이외의 질문에는 답변하지 않습니다. 탱고 동작, 음악, 연습법, 밀롱가 매너, 파트너와의 커넥션에 대해 물어봐 주세요."
English: "I am a tango-specialized AI instructor and cannot answer questions unrelated to tango. Please ask me about tango technique, music, practice methods, milonga etiquette, or partner connection."

Allowed topics:
- Argentine tango technique (walking, axis, posture, abrazo, sacada, giro, ocho, boleo, gancho)
- Rhythm and musicality
- Milonga etiquette (codigos)
- Partner connection
- Practice methods
- Photo/video based movement analysis

Strictly forbidden topics:
- General unrelated questions, politics, investment, health diagnosis, legal advice
- Sexual/obscene requests, appearance evaluation, mockery of individuals
- Dangerous physical advice

When analyzing photos or videos:
1. Provide structured feedback focusing on posture, frame, footwork, connection, and musicality
2. Be encouraging but honest with specific, actionable feedback
3. Keep each point concise (1-2 sentences)

For text questions:
1. Give clear, practical explanations
2. Include specific practice tips when relevant
3. Reference common tango terminology (with brief explanations)
4. Keep responses focused and concise

Always respond in the language specified.`;

export async function POST(request: NextRequest) {
  try {
    const { messages, language } = await request.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'MISSING_INPUT' }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY_NOT_SET' }, { status: 503 });
    }

    const lang = (language || '').toUpperCase();
    const langInstruction = lang === 'KR'
      ? 'Respond entirely in Korean.'
      : 'Respond entirely in English.';

    // Build conversation contents for Gemini
    // Only fetch media for the LAST user message to avoid timeout
    const rawContents: any[] = [];
    const lastUserIndex = messages.reduce((last: number, msg: any, i: number) =>
      msg.role === 'user' ? i : last, -1);

    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      const parts: any[] = [];

      // Add text content
      if (msg.content) {
        parts.push({ text: msg.content });
      }

      // Only fetch media for the last user message
      if (i === lastUserIndex && msg.role === 'user' && msg.mediaUrls && Array.isArray(msg.mediaUrls)) {
        for (const url of msg.mediaUrls.slice(0, 3)) {
          try {
            const imgResponse = await fetch(url, { signal: AbortSignal.timeout(8000) });
            if (!imgResponse.ok) continue;
            const buffer = await imgResponse.arrayBuffer();
            const base64 = Buffer.from(buffer).toString('base64');
            const contentType = imgResponse.headers.get('content-type') || 'image/jpeg';
            parts.push({
              inline_data: {
                mime_type: contentType,
                data: base64,
              },
            });
          } catch (e) {
            console.error('[AI Lesson Chat] Failed to fetch media:', url, e);
          }
        }
      }

      if (parts.length > 0) {
        rawContents.push({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts,
        });
      }
    }

    // Gemini API constraints: Must start with 'user' and alternate between 'user' and 'model'
    const contents: any[] = [];
    for (const item of rawContents) {
      if (contents.length === 0) {
        if (item.role === 'model') {
          // Skip initial assistant message to comply with 'must start with user' rule
          continue;
        }
        contents.push(item);
      } else {
        const last = contents[contents.length - 1];
        if (last.role === item.role) {
          // Merge parts of consecutive identical roles
          last.parts.push(...item.parts);
        } else {
          contents.push(item);
        }
      }
    }

    if (contents.length === 0) {
      return NextResponse.json({ error: 'EMPTY_CONTENT' }, { status: 400 });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: TANGO_SYSTEM_PROMPT + '\n\n' + langInstruction }],
          },
          contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 4096,
            topP: 0.9,
          },
          safetySettings: [
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
          ],
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[AI Lesson Chat] Gemini API error:', response.status, errorText);
      return NextResponse.json({ error: 'GEMINI_API_ERROR', details: errorText }, { status: 502 });
    }

    const data = await response.json();
    const aiText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiText) {
      console.error('[AI Lesson Chat] Empty Gemini response:', JSON.stringify(data));
      return NextResponse.json({ error: 'EMPTY_RESPONSE' }, { status: 502 });
    }

    return NextResponse.json({ success: true, response: aiText });
  } catch (error: any) {
    console.error('[AI Lesson Chat] Server error:', error);
    return NextResponse.json({ error: 'INTERNAL_ERROR', message: error?.message }, { status: 500 });
  }
}
