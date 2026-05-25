import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function POST(req: Request) {
  try {
    const { message, imageUrl } = await req.json();
    if (!message) {
      return NextResponse.json({ success: false, error: 'Message is required' }, { status: 400 });
    }

    // Write to public/antigravity.txt (local file system for development backup)
    try {
      const publicPath = path.join(process.cwd(), 'public', 'antigravity.txt');
      let fileContent = `스톤님의 실시간 지시사항:\n${message}\n`;
      if (imageUrl) {
        fileContent += `첨부 이미지: ${imageUrl}\n`;
      }
      fileContent += `\n전송 일시: ${new Date().toISOString()}\n`;
      await fs.writeFile(publicPath, fileContent, 'utf-8');
    } catch (fsErr) {
      console.warn('File system write skipped or failed (likely read-only cloud environment):', fsErr);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Antigravity API POST error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Return success since client-side directly subscribes to Firestore in real-time
    return NextResponse.json({ success: true, messages: [] });
  } catch (err: any) {
    console.error('Antigravity API GET error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
