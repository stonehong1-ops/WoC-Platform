import fs from 'fs';
import readline from 'readline';

const ids = [
  '5GhmrJXdNzdte53Qs1uD',
  'BrP6IxFlHSpxA37nKpmZ',
  'EqZPQLbM3rDh1C3xdGLU',
  'FlfaKe3IE2P5Ldx5Gr8O',
  'iNmsCS86KtAqMLFAeqfE',
  'ly4uuyXjO3Cnhnd9dsCD',
  'nNxPVNAsmjvnZsyc73T8',
  'qJ8IAzDvW8JLj5zD1YXV',
  'd1bZMMcG1KSBBm4dMdEe',
  'QeCGlfbf6oJrlEUoswjL',
  'YzYzfVNnYqPJ7riMwPWT'
];

async function run() {
  const filePath = 'C:/Users/stone/.gemini/antigravity/brain/77584f7a-10ee-43e5-a1b6-5a48a55e20e7/.system_generated/logs/transcript_full.jsonl';
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  const results = {};

  for await (const line of rl) {
    for (const id of ids) {
      if (line.includes(id)) {
        const matches = line.match(/(https:\/\/(?:storage\.googleapis\.com|firebasestorage\.googleapis\.com)\/[^\s\\n"\}]+)/g);
        if (matches) {
          for (const url of matches) {
            if (!url.includes('andante_calendar_202607')) {
              let cleanUrl = url.replace(/\\u0026/g, '&').replace(/\\/g, '');
              // 맨 끝에 마침표나 괄호 등이 포함되어 있다면 제거
              cleanUrl = cleanUrl.replace(/[\.\,\)\`]+$/, '');
              results[id] = cleanUrl;
            }
          }
        }
      }
    }
  }

  console.log('=== EXTRACTED ORIGINAL IMAGE URLS ===');
  console.log(JSON.stringify(results, null, 2));
}

run();
