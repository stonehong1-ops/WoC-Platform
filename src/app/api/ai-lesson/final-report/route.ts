import { NextRequest, NextResponse } from 'next/server';

const REPORT_SYSTEM_PROMPT = `You are an Argentine Tango instructor creating a final lesson report.
Based on the full conversation history provided, generate a structured summary report.

ALWAYS respond in valid JSON format with this exact structure:
{
  "summary": "Brief overall assessment in 2-3 sentences",
  "strengths": ["Positive observation 1", "Positive observation 2", ...],
  "pointsToCheck": ["Area to check 1", "Area to check 2", ...],
  "recommendedDrills": ["Recommended practice 1", "Recommended practice 2", ...],
  "nextQuestions": ["Suggested follow-up question 1", "Suggested follow-up question 2", ...]
}

Guidelines:
- summary: Summarize the entire conversation's key themes and findings
- strengths: List 2-5 positive aspects discussed or observed
- pointsToCheck: List 2-5 areas for improvement mentioned
- recommendedDrills: List 2-5 specific practice exercises
- nextQuestions: List 2-3 questions the student could explore next
- Keep each item concise (1-2 sentences max)
- If the conversation was only text questions (no analysis), focus on learning insights`;

export async function POST(request: NextRequest) {
  try {
    const { messages, language } = await request.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'MISSING_MESSAGES' }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY_NOT_SET' }, { status: 503 });
    }

    const lang = (language || '').toUpperCase();
    const langInstruction = lang === 'KR'
      ? 'Respond entirely in Korean.'
      : 'Respond entirely in English.';

    // Build conversation text for summary
    const conversationText = messages.map((msg: { role: string; content: string }) => {
      const speaker = msg.role === 'user' ? 'Student' : 'AI Instructor';
      return `${speaker}: ${msg.content}`;
    }).join('\n\n');

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: REPORT_SYSTEM_PROMPT + '\n\n' + langInstruction }],
          },
          contents: [{
            role: 'user',
            parts: [{ text: `Here is the full conversation to summarize:\n\n${conversationText}` }],
          }],
          generationConfig: {
            temperature: 0.5,
            maxOutputTokens: 2048,
            topP: 0.9,
            responseMimeType: 'application/json',
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
      console.error('[AI Lesson Report] Gemini API error:', response.status, errorText);
      return NextResponse.json({ error: 'GEMINI_API_ERROR', details: errorText }, { status: 502 });
    }

    const data = await response.json();
    const aiText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiText) {
      console.error('[AI Lesson Report] Empty response:', JSON.stringify(data));
      return NextResponse.json({ error: 'EMPTY_RESPONSE' }, { status: 502 });
    }

    try {
      const report = JSON.parse(aiText);
      return NextResponse.json({ success: true, report });
    } catch {
      return NextResponse.json({
        success: true,
        report: {
          summary: aiText,
          strengths: [],
          pointsToCheck: [],
          recommendedDrills: [],
          nextQuestions: [],
        },
      });
    }
  } catch (error: any) {
    console.error('[AI Lesson Report] Server error:', error);
    return NextResponse.json({ error: 'INTERNAL_ERROR', message: error?.message }, { status: 500 });
  }
}
