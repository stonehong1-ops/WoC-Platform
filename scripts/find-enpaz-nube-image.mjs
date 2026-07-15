import fs from 'fs';
import readline from 'readline';

async function run() {
  const filePath = 'C:/Users/stone/.gemini/antigravity/brain/77584f7a-10ee-43e5-a1b6-5a48a55e20e7/.system_generated/logs/transcript_full.jsonl';
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  const ids = [
    'hEvFnQySTM3XtPCWShRd', // 누베르
    'iNmsCS86KtAqMLFAeqfE'  // 금루미
  ];

  const results = {};

  for await (const line of rl) {
    // 본 스크립트 파일과 관련된 줄은 스킵
    if (line.includes('find-enpaz-nube-image.mjs')) continue;

    for (const id of ids) {
      if (line.includes(id)) {
        // http URL 매칭
        const matches = line.match(/(https:\/\/(?:storage\.googleapis\.com|firebasestorage\.googleapis\.com)\/[^\s\\n"\}]+)/g);
        if (matches) {
          for (const url of matches) {
            if (!url.includes('en_paz_weekly_20260629') && !url.includes('...')) {
              let cleanUrl = url.replace(/\\u0026/g, '&').replace(/\\/g, '');
              cleanUrl = cleanUrl.replace(/[\.\,\)\`\\n\}]+$/, '');
              if (!cleanUrl.endsWith('...')) {
                results[id] = cleanUrl;
              }
            }
          }
        }
      }
    }
  }

  console.log('=== FINAL DETECTED ORIGINAL URLS ===');
  console.log(JSON.stringify(results, null, 2));
}

run();
