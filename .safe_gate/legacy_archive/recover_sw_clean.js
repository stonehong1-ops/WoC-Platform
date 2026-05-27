const fs = require('fs');
const path = require('path');

const logPath = 'C:\\Users\\stone\\.gemini\\antigravity\\brain\\aaa4de1b-1dd1-42ad-be9e-7041fe55b36a\\.system_generated\\logs\\transcript.jsonl';

try {
  const content = fs.readFileSync(logPath, 'utf-8');
  const lines = content.split('\n');
  
  let candidates = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    try {
      const step = JSON.parse(line);
      // step.tool_calls 내부에서 write_to_file이나 replace_file_content 호출을 찾음
      if (step.tool_calls && Array.isArray(step.tool_calls)) {
        for (const tc of step.tool_calls) {
          if (tc.name === 'write_to_file' || tc.name === 'replace_file_content') {
            const args = tc.args || {};
            const targetFile = args.TargetFile || '';
            const codeContent = args.CodeContent || args.ReplacementContent || '';
            
            if (targetFile.includes('sw.js') && codeContent) {
              candidates.push({
                step_index: step.step_index,
                type: tc.name,
                target: targetFile,
                content: codeContent
              });
            }
          }
        }
      }
    } catch (e) {}
  }

  console.log(`Found ${candidates.length} tool call candidates for sw.js in logs.`);
  
  candidates.forEach((cand, idx) => {
    console.log(`\n--- Candidate #${idx + 1} (Step: ${cand.step_index}, Type: ${cand.type}) ---`);
    console.log(`Target: ${cand.target}`);
    console.log(`Content Length: ${cand.content.length}`);
    
    // 내용 중 실제 sw.js의 핵심 문구 검증
    let code = cand.content.trim();
    // JSON 파싱으로 이중 이스케이프 해제
    if (code.startsWith('"') && code.endsWith('"')) {
      try { code = JSON.parse(code); } catch(e) {}
    }
    if (code.includes('\\n')) {
      code = code.replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
    }
    
    console.log('--- Preview (First 200 chars) ---');
    console.log(code.substring(0, 300));
    console.log('----------------------------------');
    
    // 타당한 PWA 서비스 워커라고 생각되는 경우 파일로 별도 기록
    if (code.includes('self.addEventListener') && code.includes('fetch') && !code.includes('recover_sw')) {
      const outPath = `C:\\Users\\stone\\WoC\\public\\sw.js.candidate_${cand.step_index}`;
      fs.writeFileSync(outPath, code, 'utf-8');
      console.log(`Saved full content to ${outPath}`);
    }
  });

} catch (error) {
  console.error(error);
}
