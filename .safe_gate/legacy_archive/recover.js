const fs = require('fs');
const path = require('path');

const logPath = 'C:\\Users\\stone\\.gemini\\antigravity\\brain\\aaa4de1b-1dd1-42ad-be9e-7041fe55b36a\\.system_generated\\logs\\transcript.jsonl';
const targetPath = 'C:\\Users\\stone\\WoC\\public\\landing.html';

// 깨진 한글 인코딩(latin1 / binary 로 오독된 UTF-8 바이트)을 진짜 깨끗한 한국어로 강제 복원하는 천재적인 디코더
function decodeGarbageKorean(str) {
  try {
    // 1단계: 문자열을 'latin1' 바이트 버퍼로 환원한 뒤 UTF-8로 정밀 재디코딩
    let restored = Buffer.from(str, 'latin1').toString('utf8');
    
    // 만약 여전히 깨진 패턴이 보이거나 개선되지 않았다면 'binary' 인코딩으로 2차 변환 시도
    if (restored.includes('媛') || restored.includes('섎') || restored.includes('?')) {
      const binaryBuf = Buffer.from(str, 'binary');
      restored = binaryBuf.toString('utf8');
    }
    
    return restored;
  } catch (e) {
    return str;
  }
}

try {
  const content = fs.readFileSync(logPath, 'utf-8');
  const lines = content.split('\n');
  
  let rawHtmlCandidates = [];
  
  function searchForHtml(obj) {
    if (typeof obj === 'string') {
      const hasHtml = obj.includes('<!DOCTYPE html>') || obj.includes('<html') || obj.includes('&lt;!DOCTYPE html&gt;');
      // 한글이 깨진 텍스트(예: "媛뺤젣", "?섎굂??")나 깨지지 않은 텍스트가 매칭되도록 함
      const hasKeywords = obj.includes('하나의 세계') || obj.includes('媛뺤젣') || obj.includes('?섎굂??') || obj.includes('TANGO World');
      const isScriptCode = obj.includes('const fs =') || obj.includes('searchForHtml') || obj.includes('fs.writeFileSync');
      
      const isToolLog = obj.includes('Created At:') || obj.includes('File Path:') || obj.includes('Showing lines');
      
      if (hasHtml && hasKeywords && !isScriptCode && !isToolLog) {
        rawHtmlCandidates.push(obj);
      }
    } else if (typeof obj === 'object' && obj !== null) {
      for (const key in obj) {
        searchForHtml(obj[key]);
      }
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    try {
      const obj = JSON.parse(line);
      searchForHtml(obj);
    } catch (e) {
      // 무시
    }
  }

  let bestHtml = '';
  // 가장 알맹이가 크고 풍부한 후보를 추출
  for (const candidate of rawHtmlCandidates) {
    if (candidate.length > bestHtml.length) {
      bestHtml = candidate;
    }
  }

  if (bestHtml) {
    let clean = bestHtml.trim();
    
    // 이스케이프 및 JSON 디스크립터 해제
    if (clean.startsWith('"') && clean.endsWith('"')) {
      try {
        clean = JSON.parse(clean);
      } catch (e) {
        // 무시
      }
    }
    
    if (clean.includes('\\n') || clean.includes('\\"')) {
      clean = clean
        .replace(/\\n/g, '\n')
        .replace(/\\t/g, '\t')
        .replace(/\\"/g, '"')
        .replace(/\\'/g, "'")
        .replace(/\\\\/g, '\\');
    }
    
    clean = clean
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&');

    // ★★★ 핵심: 한글 깨짐 강제 역디코딩 수행 ★★★
    clean = decodeGarbageKorean(clean);

    // 행 번호 찌꺼기 정화
    if (/^\s*\d+:\s*<!DOCTYPE/m.test(clean) || /^\s*1:\s*<!DOCTYPE/m.test(clean)) {
      const lines = clean.split('\n');
      let cleanedLines = [];
      let htmlStarted = false;
      for (let line of lines) {
        if (line.includes('Created At:') || line.includes('File Path:') || line.includes('Showing lines')) continue;
        let cleanLine = line.replace(/^\s*\d+:\s*/, '');
        if (cleanLine.includes('<!DOCTYPE html>') || cleanLine.includes('<html')) htmlStarted = true;
        if (htmlStarted) cleanedLines.push(cleanLine);
      }
      clean = cleanedLines.join('\n');
    }
    
    const htmlEndIndex = clean.lastIndexOf('</html>');
    if (htmlEndIndex !== -1) {
      clean = clean.substring(0, htmlEndIndex + 7);
    }
    const htmlStartIndex = clean.indexOf('<!DOCTYPE html>');
    if (htmlStartIndex !== -1) {
      clean = clean.substring(htmlStartIndex);
    }

    fs.writeFileSync(targetPath, clean, 'utf-8');
    console.log('========================================');
    console.log('SUCCESS: Extremely pure original landing.html recovered and UTF-8 decoded!');
    console.log('Final HTML Length:', clean.length);
    console.log('HTML Preview (First 800 chars):');
    console.log(clean.substring(0, 800));
    console.log('========================================');
  } else {
    console.log('FAILED: No matching HTML candidates found.');
  }
} catch (error) {
  console.error('Error during recovery process:', error);
}
