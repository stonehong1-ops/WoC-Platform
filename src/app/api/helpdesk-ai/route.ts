import { NextRequest, NextResponse } from 'next/server';
import { WOC_SYSTEM_PROMPT } from '@/lib/ai/wocSystemGuide';

/**
 * POST /api/helpdesk-ai
 * Server-side Gemini API call for Help Desk AI responses
 */
export async function POST(request: NextRequest) {
  try {
    const { content, language } = await request.json();

    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY_NOT_SET' }, { status: 503 });
    }

    const langInstruction = language === 'kr'
      ? 'The user is writing in Korean. Respond in Korean.'
      : 'The user is writing in English. Respond in English.';

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: WOC_SYSTEM_PROMPT + '\n\n' + langInstruction }]
          },
          contents: [{
            parts: [{ text: `A user posted the following question in the Help Desk:\n\n"${content}"\n\nProvide a helpful, concise response. Keep it under 300 words.` }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
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
      console.error('[HelpDesk AI] Gemini API error:', response.status, errorText);
      return NextResponse.json({ error: 'GEMINI_API_ERROR', details: errorText }, { status: 502 });
    }

    const data = await response.json();
    const aiText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiText) {
      console.error('[HelpDesk AI] Empty Gemini response:', JSON.stringify(data));
      return NextResponse.json({ error: 'EMPTY_RESPONSE' }, { status: 502 });
    }

    return NextResponse.json({ response: aiText });
  } catch (error: any) {
    console.error('[HelpDesk AI] Server error:', error);
    return NextResponse.json({ error: 'INTERNAL_ERROR', message: error?.message }, { status: 500 });
  }
}
