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
    '5GhmrJXdNzdte53Qs1uD', // La Melodia
    'BrP6IxFlHSpxA37nKpmZ', // 뮤롱가
    'iNmsCS86KtAqMLFAeqfE', // 금루미
    'ly4uuyXjO3Cnhnd9dsCD', // 알밀
    'nNxPVNAsmjvnZsyc73T8', // 알롱가
    'qJ8IAzDvW8JLj5zD1YXV', // 줄리
    'd1bZMMcG1KSBBm4dMdEe', // 히로
    'QeCGlfbf6oJrlEUoswjL', // 토요 까베세오
    'YzYzfVNnYqPJ7riMwPWT'  // 애프터눈 ONE
  ];

  const originalUrls = {};

  for await (const line of rl) {
    for (const id of ids) {
      if (line.includes(id) && (line.includes('https://') || line.includes('socials/'))) {
        // 정규식으로 https://... 주소를 모두 매칭
        const matches = line.match(/(https:\/\/(?:storage\.googleapis\.com|firebasestorage\.googleapis\.com)\/[^\s\\n"\}]+)/g);
        if (matches) {
          for (const url of matches) {
            if (!url.includes('andante_calendar_202607') && !url.includes('...')) {
              let cleanUrl = url.replace(/\\u0026/g, '&').replace(/\\/g, '');
              // 끝부분 특수문자 제거
              cleanUrl = cleanUrl.replace(/[\.\,\)\`\\n\}]+$/, '');
              // 만약 잘려 있는 주소가 아니라면 수집
              if (!cleanUrl.endsWith('...')) {
                originalUrls[id] = cleanUrl;
              }
            }
          }
        }
      }
    }
  }

  console.log('=== EXTRACTED COMPLETE ORIGINAL IMAGE URLS ===');
  console.log(JSON.stringify(originalUrls, null, 2));
}

run();
