import React from "react";
import fs from "fs";
import path from "path";
import { MoveRight, AlertTriangle, CheckCircle, Database, HelpCircle, Layers } from "lucide-react";

// 서버 사이드에서 실시간 분석 실행
function runI18nDiagnosis() {
  const krPath = path.resolve("src/i18n/kr.ts");
  const enPath = path.resolve("src/i18n/en.ts");

  // 1. 사전 키 추출
  const krKeys = new Set<string>();
  const enKeys = new Set<string>();

  try {
    if (fs.existsSync(krPath)) {
      const content = fs.readFileSync(krPath, "utf-8");
      content.split("\n").forEach(line => {
        const match = line.trim().match(/^\s*['"]([^'"]+)['"]\s*:/);
        if (match) krKeys.add(match[1]);
      });
    }
    if (fs.existsSync(enPath)) {
      const content = fs.readFileSync(enPath, "utf-8");
      content.split("\n").forEach(line => {
        const match = line.trim().match(/^\s*['"]([^'"]+)['"]\s*:/);
        if (match) enKeys.add(match[1]);
      });
    }
  } catch (e) {
    console.error(e);
  }

  // 2. 소스 파일 스캔
  const usedKeys = new Map<string, string[]>(); // key -> 파일목록
  const srcDir = path.resolve("src");

  function getFiles(dir: string, fileList: string[] = []) {
    if (!fs.existsSync(dir)) return fileList;
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const absolutePath = path.join(dir, file);
      const relativePath = path.relative(process.cwd(), absolutePath);

      if (
        file === "node_modules" ||
        file === ".next" ||
        file === "i18n" ||
        relativePath.startsWith("src/app/admin/i18n")
      ) {
        continue;
      }

      if (fs.statSync(absolutePath).isDirectory()) {
        getFiles(absolutePath, fileList);
      } else {
        const ext = path.extname(file);
        if ([".ts", ".tsx", ".js", ".jsx"].includes(ext)) {
          fileList.push(absolutePath);
        }
      }
    }
    return fileList;
  }

  const files = getFiles(srcDir);
  const tRegex = /\bt\(\s*(['"`])([a-zA-Z0-9_.-]+)\1/g;

  files.forEach(file => {
    try {
      const content = fs.readFileSync(file, "utf-8");
      const relative = path.relative(process.cwd(), file);
      let match;
      while ((match = tRegex.exec(content)) !== null) {
        const key = match[2];
        if (key.includes("${")) continue;
        if (!usedKeys.has(key)) {
          usedKeys.set(key, []);
        }
        if (!usedKeys.get(key)!.includes(relative)) {
          usedKeys.get(key)!.push(relative);
        }
      }
    } catch (e) {
      console.error(e);
    }
  });

  // 3. 지표 산출
  const missingKeys: { key: string; files: string[] }[] = [];
  const unusedKeys: string[] = [];
  const koMissing: string[] = [];
  const enMissing: string[] = [];

  // 소스에는 쓰이는데 사전에 없는 키 (Missing)
  usedKeys.forEach((filesList, key) => {
    if (!krKeys.has(key) || !enKeys.has(key)) {
      missingKeys.push({ key, files: filesList });
    }
  });

  // 사전엔 있으나 소스에 안 쓰이는 키 (Unused)
  krKeys.forEach(key => {
    if (!usedKeys.has(key)) {
      unusedKeys.push(key);
    }
  });

  // 영한 사전 간 불일치
  krKeys.forEach(key => {
    if (!enKeys.has(key)) {
      enMissing.push(key);
    }
  });
  enKeys.forEach(key => {
    if (!krKeys.has(key)) {
      koMissing.push(key);
    }
  });

  return {
    totalKr: krKeys.size,
    totalEn: enKeys.size,
    totalUsed: usedKeys.size,
    missingKeys,
    unusedKeys,
    koMissing,
    enMissing,
  };
}

export default async function AdminI18nPage() {
  const diagnosis = runI18nDiagnosis();
  const isHealthy = diagnosis.missingKeys.length === 0 && diagnosis.koMissing.length === 0 && diagnosis.enMissing.length === 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 selection:bg-rose-500 selection:text-white">
      {/* 프리미엄 메인 헤더 */}
      <div className="max-w-7xl mx-auto mb-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-800 pb-6 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-900 border border-slate-800 rounded-full text-xs font-bold tracking-widest text-slate-400 uppercase mb-3">
              <Database className="w-3.5 h-3.5 text-rose-500" />
              WoC Core Infrastructure
            </div>
            <h1 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-white via-slate-300 to-slate-500 bg-clip-text text-transparent uppercase tracking-tight">
              i18n Translation Diagnosis
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              영한 다국어 번역 사전 및 소스코드 사용률 실시간 무결성 모니터링 시스템입니다.
            </p>
          </div>
          
          {/* 상태 요약 배지 */}
          <div className="flex items-center">
            {isHealthy ? (
              <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2.5 rounded-xl text-emerald-400 text-sm font-bold">
                <CheckCircle className="w-4 h-4" />
                Zero Errors — Perfect Locale Stability
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 px-4 py-2.5 rounded-xl text-rose-400 text-sm font-bold animate-pulse">
                <AlertTriangle className="w-4 h-4" />
                Attention Required — Errors Detected
              </div>
            )}
          </div>
        </div>

        {/* 정량적 스태츠 카드 세션 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
          <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 p-5 rounded-2xl">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Korean Dictionary Keys</p>
            <p className="text-3xl font-black text-white mt-1.5">{diagnosis.totalKr}</p>
          </div>
          <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 p-5 rounded-2xl">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">English Dictionary Keys</p>
            <p className="text-3xl font-black text-white mt-1.5">{diagnosis.totalEn}</p>
          </div>
          <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 p-5 rounded-2xl">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Active Codes t() Calls</p>
            <p className="text-3xl font-black text-white mt-1.5">{diagnosis.totalUsed}</p>
          </div>
          <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 p-5 rounded-2xl">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Missing Keys</p>
            <p className={`text-3xl font-black mt-1.5 ${diagnosis.missingKeys.length > 0 ? "text-rose-500 font-black animate-pulse" : "text-slate-400"}`}>
              {diagnosis.missingKeys.length}
            </p>
          </div>
        </div>

        {/* 1. Missing Translation (최우선순위 노출) */}
        <div className="mt-10 bg-slate-900/20 backdrop-blur-sm border border-slate-800 rounded-3xl p-6 md:p-8">
          <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-rose-500" />
            🚨 Missing Keys in Source Code ({diagnosis.missingKeys.length})
          </h2>
          <p className="text-xs text-slate-400 mb-6">
            소스코드 내에선 번역 함수 `t()` 로 선언되어 있으나, 다국어 사전에 등록되지 않은 누락 키 목록입니다. 이 항목들이 1개라도 발생하면 빌드가 정적으로 자동 차단됩니다.
          </p>

          {diagnosis.missingKeys.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-xs font-bold text-slate-400 uppercase">
                    <th className="py-3 px-4 w-1/3">Missing Translation Key</th>
                    <th className="py-3 px-4">Referenced Source Files</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-slate-800/50">
                  {diagnosis.missingKeys.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-4 px-4 font-mono text-rose-400 font-bold break-all select-all">{item.key}</td>
                      <td className="py-4 px-4 text-xs text-slate-400">
                        <div className="flex flex-col gap-1.5">
                          {item.files.map((file, fIdx) => (
                            <span key={fIdx} className="font-mono bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800 inline-block w-fit">{file}</span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-10 bg-slate-950/40 border border-dashed border-slate-800 rounded-2xl">
              <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm font-bold text-emerald-400">Perfect Clear — All used keys exist in dictionary</p>
            </div>
          )}
        </div>

        {/* 2중 그리드: 사전 간 대조 불일치 (KO / EN Missing) */}
        <div className="grid lg:grid-cols-2 gap-6 mt-6">
          {/* KO Missing */}
          <div className="bg-slate-900/20 backdrop-blur-sm border border-slate-800 rounded-3xl p-6">
            <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2 mb-3">
              <Layers className="w-4 h-4 text-yellow-500" />
              KO Missing Keys ({diagnosis.koMissing.length})
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              영어 사전(en.ts)에는 정의되어 있으나 한국어 사전(kr.ts)에는 등록되어 있지 않은 불일치 키 목록입니다.
            </p>
            {diagnosis.koMissing.length > 0 ? (
              <div className="bg-slate-950/50 p-4 rounded-2xl max-h-80 overflow-y-auto border border-slate-800/60 font-mono text-xs text-yellow-400 divide-y divide-slate-800/40">
                {diagnosis.koMissing.map((key, i) => (
                  <div key={i} className="py-2.5 break-all select-all">{key}</div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 bg-slate-950/20 border border-dashed border-slate-800 rounded-xl">
                <CheckCircle className="w-6 h-6 text-emerald-500 mx-auto mb-1" />
                <p className="text-xs font-bold text-slate-400">No missing keys in Korean</p>
              </div>
            )}
          </div>

          {/* EN Missing */}
          <div className="bg-slate-900/20 backdrop-blur-sm border border-slate-800 rounded-3xl p-6">
            <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2 mb-3">
              <Layers className="w-4 h-4 text-cyan-500" />
              EN Missing Keys ({diagnosis.enMissing.length})
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              한국어 사전(kr.ts)에는 정의되어 있으나 영어 사전(en.ts)에는 등록되어 있지 않은 불일치 키 목록입니다.
            </p>
            {diagnosis.enMissing.length > 0 ? (
              <div className="bg-slate-950/50 p-4 rounded-2xl max-h-80 overflow-y-auto border border-slate-800/60 font-mono text-xs text-cyan-400 divide-y divide-slate-800/40">
                {diagnosis.enMissing.map((key, i) => (
                  <div key={i} className="py-2.5 break-all select-all">{key}</div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 bg-slate-950/20 border border-dashed border-slate-800 rounded-xl">
                <CheckCircle className="w-6 h-6 text-emerald-500 mx-auto mb-1" />
                <p className="text-xs font-bold text-slate-400">No missing keys in English</p>
              </div>
            )}
          </div>
        </div>

        {/* 3. Unused Keys (사전 청소용 데이터) */}
        <div className="mt-6 bg-slate-900/20 backdrop-blur-sm border border-slate-800 rounded-3xl p-6">
          <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2 mb-2">
            <HelpCircle className="w-4.5 h-4.5 text-slate-400" />
            🧹 Unused Keys in Dictionaries ({diagnosis.unusedKeys.length})
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            사전에 등록은 되어 있으나, 현재 코드베이스에서 정적으로 사용(호출)되고 있지 않는 키 목록입니다. 사전 데이터 다이어트 및 리팩토링 시 참고하여 안전하게 정리할 수 있습니다.
          </p>
          {diagnosis.unusedKeys.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-96 overflow-y-auto p-4 bg-slate-950/50 rounded-2xl border border-slate-800/60 text-xs font-mono text-slate-400">
              {diagnosis.unusedKeys.map((key, idx) => (
                <div key={idx} className="bg-slate-900/40 px-3 py-2 rounded-lg border border-slate-800/40 hover:border-slate-800 transition-colors truncate select-all" title={key}>
                  {key}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 bg-slate-950/20 border border-dashed border-slate-800 rounded-xl">
              <p className="text-xs font-bold text-slate-400">Clean slate — No unused keys found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
