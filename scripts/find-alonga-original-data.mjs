import fs from 'fs';
import readline from 'readline';

async function run() {
  const filePath = 'C:/Users/stone/.gemini/antigravity/brain/77584f7a-10ee-43e5-a1b6-5a48a55e20e7/.system_generated/logs/transcript_full.jsonl';
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  const targetId = 'nNxPVNAsmjvnZsyc73T8';

  for await (const line of rl) {
    if (line.includes(targetId) && line.includes('imageUrl')) {
      // 덤프 데이터가 있는 부분을 찾음
      console.log('=== FOUND Alonga DATA LINE ===');
      const startIdx = line.indexOf(targetId) - 500;
      const endIdx = line.indexOf(targetId) + 1500;
      console.log(line.substring(Math.max(0, startIdx), Math.min(line.length, endIdx)));
      console.log('==============================');
    }
  }
}

run();
