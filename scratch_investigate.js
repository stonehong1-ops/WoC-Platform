// 이 스크립트는 conversation 로그(transcript.jsonl)에서 JEONIKYONG의 가라 데이터를 판별하기 위해 관련 키워드를 정밀 탐색하는 디버그 스크립트입니다.
const fs = require('fs');
const readline = require('readline');
const path = require('path');

const logPath = 'C:\\Users\\stone\\.gemini\\antigravity\\brain\\c71ada19-d233-49eb-967a-91e723fad956\\.system_generated\\logs\\transcript.jsonl';

async function main() {
  if (!fs.existsSync(logPath)) {
    console.error("Log file does not exist at path:", logPath);
    process.exit(1);
  }

  const fileStream = fs.createReadStream(logPath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  console.log("=== SCANNING TRANSCRIPT LOGS ===");
  for await (const line of rl) {
    if (line.includes('CL-2026-U3T67D') || line.includes('CL-2026-DENM9F') || line.includes('jeonikyong')) {
      // Print snippets
      const truncatedLine = line.length > 500 ? line.substring(0, 500) + '...' : line;
      console.log(truncatedLine);
    }
  }

  process.exit(0);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
