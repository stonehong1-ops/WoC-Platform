#!/usr/bin/env node
/**
 * GPT ↔ Claude Code 파일 기반 핸드오프 브리지 CLI
 *
 *   node scripts/ai-handoff.mjs status    현재 TASK/REPORT 상태 및 mismatch 확인
 *   node scripts/ai-handoff.mjs archive   TASK+REPORT를 HISTORY에 append 후 초기화
 *
 * 로컬 파일만 다룬다. 외부 API·Firebase·Vercel 연동 없음. WoC 기능 코드는 건드리지 않는다.
 */
import fs from "fs";
import path from "path";

const TASK_PATH = path.resolve("docs/AI_TASK.md");
const REPORT_PATH = path.resolve("docs/AI_REPORT.md");
const HISTORY_PATH = path.resolve("docs/AI_HANDOFF_HISTORY.md");

const VALID_STATUSES = ["EMPTY", "READY", "IN_PROGRESS", "DONE"];

const TASK_TEMPLATE = `# AI TASK
status: EMPTY
task_id:
created_at:

## Objective

## Instructions

## Do Not Touch

## Acceptance Criteria
`;

const REPORT_TEMPLATE = `# AI REPORT
status: EMPTY
task_id:
completed_at:

## Summary

## Changed Files

## Validation

## Problems / Risks

## Next Decision Needed
`;

// ── 비밀정보 유출 방지 스캔 패턴 ──
const SECRET_PATTERNS = [
  { name: "Google API key", re: /AIza[0-9A-Za-z_-]{30,}/ },
  { name: "OpenAI/Anthropic key", re: /\b(sk|sk-ant)-[A-Za-z0-9_-]{20,}/ },
  { name: "Private key block", re: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
  { name: "Firebase service account", re: /"private_key_id"\s*:/ },
  { name: "Bearer token", re: /\bBearer\s+[A-Za-z0-9._-]{20,}/ },
  { name: "AWS access key", re: /\bAKIA[0-9A-Z]{16}\b/ },
];

function readFileSafe(p, label) {
  if (!fs.existsSync(p)) {
    console.error(`❌ ${label} 파일이 없습니다: ${path.relative(process.cwd(), p)}`);
    process.exit(1);
  }
  return fs.readFileSync(p, "utf-8");
}

/** 헤더 영역(첫 '##' 이전)에서 `key: value` 필드를 파싱한다. */
function parseHeader(content) {
  const headEnd = content.indexOf("\n## ");
  const head = headEnd === -1 ? content : content.slice(0, headEnd);
  const fields = {};
  for (const line of head.split("\n")) {
    const m = line.match(/^([a-z_]+)\s*:\s*(.*)$/);
    if (m) fields[m[1]] = m[2].trim();
  }
  return fields;
}

/** 본문 섹션이 실제로 채워져 있는지 (제목만 있고 내용 없으면 false) */
function hasBody(content) {
  const body = content.split(/\n## /).slice(1);
  return body.some((sec) => sec.split("\n").slice(1).join("\n").trim().length > 0);
}

function scanSecrets(text, label) {
  const hits = [];
  for (const { name, re } of SECRET_PATTERNS) {
    if (re.test(text)) hits.push(`${label}: ${name}`);
  }
  return hits;
}

function nowStamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

function statusIcon(s) {
  return { EMPTY: "⚪", READY: "🟢", IN_PROGRESS: "🟡", DONE: "🔵" }[s] || "❓";
}

// ─────────────────────────── status ───────────────────────────
function cmdStatus() {
  const taskRaw = readFileSafe(TASK_PATH, "AI_TASK.md");
  const reportRaw = readFileSafe(REPORT_PATH, "AI_REPORT.md");

  const task = parseHeader(taskRaw);
  const report = parseHeader(reportRaw);

  const taskStatus = task.status || "(없음)";
  const reportStatus = report.status || "(없음)";
  const taskId = task.task_id || "(없음)";
  const reportId = report.task_id || "(없음)";

  console.log("📋 [AI Handoff 상태]");
  console.log("");
  console.log(`  ${statusIcon(taskStatus)} TASK    status: ${taskStatus.padEnd(12)} task_id: ${taskId}`);
  console.log(`     ${" ".repeat(2)}        created_at: ${task.created_at || "(없음)"}`);
  console.log(`  ${statusIcon(reportStatus)} REPORT  status: ${reportStatus.padEnd(12)} task_id: ${reportId}`);
  console.log(`     ${" ".repeat(2)}        completed_at: ${report.completed_at || "(없음)"}`);
  console.log("");

  const issues = [];

  for (const [label, s] of [["TASK", taskStatus], ["REPORT", reportStatus]]) {
    if (s !== "(없음)" && !VALID_STATUSES.includes(s)) {
      issues.push(`${label} status 값이 올바르지 않습니다: "${s}" (허용: ${VALID_STATUSES.join(" / ")})`);
    }
  }

  // task_id mismatch
  const bothHaveId = taskId !== "(없음)" && taskId !== "" && reportId !== "(없음)" && reportId !== "";
  if (bothHaveId && taskId !== reportId) {
    issues.push(`task_id 불일치 — TASK(${taskId}) ≠ REPORT(${reportId})`);
  }

  // TASK가 DONE인데 REPORT가 비어있음
  if (taskStatus === "DONE" && reportStatus !== "DONE") {
    issues.push(`TASK는 DONE인데 REPORT status가 ${reportStatus} 입니다.`);
  }
  // REPORT는 DONE인데 TASK가 아직 IN_PROGRESS
  if (reportStatus === "DONE" && taskStatus === "IN_PROGRESS") {
    issues.push(`REPORT는 DONE인데 TASK가 아직 IN_PROGRESS 입니다. TASK를 DONE으로 변경하세요.`);
  }
  // READY인데 내용이 비어있음
  if (taskStatus === "READY" && !hasBody(taskRaw)) {
    issues.push(`TASK가 READY인데 본문(Objective/Instructions)이 비어 있습니다.`);
  }

  if (issues.length === 0) {
    console.log("  ✅ mismatch 없음");
  } else {
    console.log("  ⚠️  확인 필요:");
    for (const i of issues) console.log(`     - ${i}`);
  }

  console.log("");
  // 다음 행동 안내
  if (taskStatus === "READY") {
    console.log("  ▶ 다음: Claude가 이 task를 실행할 수 있습니다 (status → IN_PROGRESS).");
  } else if (taskStatus === "IN_PROGRESS") {
    console.log("  ▶ 다음: 작업 진행 중. 완료 시 AI_REPORT.md 작성 후 TASK를 DONE으로.");
  } else if (taskStatus === "DONE" && reportStatus === "DONE") {
    console.log("  ▶ 다음: `node scripts/ai-handoff.mjs archive` 로 이력에 보관하고 초기화하세요.");
  } else if (taskStatus === "EMPTY") {
    console.log("  ▶ 다음: GPT가 docs/AI_TASK.md 에 새 지시를 작성하고 status를 READY로 바꾸면 됩니다.");
  }

  if (issues.length > 0) process.exitCode = 1;
}

// ─────────────────────────── archive ───────────────────────────
function cmdArchive() {
  const taskRaw = readFileSafe(TASK_PATH, "AI_TASK.md");
  const reportRaw = readFileSafe(REPORT_PATH, "AI_REPORT.md");

  const task = parseHeader(taskRaw);
  const report = parseHeader(reportRaw);

  if ((task.status || "EMPTY") === "EMPTY" && (report.status || "EMPTY") === "EMPTY") {
    console.log("⚪ TASK/REPORT가 모두 비어 있어 보관할 내용이 없습니다.");
    return;
  }

  // 비밀정보 스캔 — 발견 시 중단
  const hits = [
    ...scanSecrets(taskRaw, "AI_TASK.md"),
    ...scanSecrets(reportRaw, "AI_REPORT.md"),
  ];
  if (hits.length > 0) {
    console.error("🚨 비밀정보로 의심되는 값이 발견되어 archive를 중단합니다.");
    for (const h of hits) console.error(`   - ${h}`);
    console.error("   해당 값을 제거한 뒤 다시 실행하세요.");
    process.exit(1);
  }

  if (!fs.existsSync(HISTORY_PATH)) {
    fs.writeFileSync(HISTORY_PATH, "# AI HANDOFF HISTORY\n\n---\n", "utf-8");
  }

  const stamp = nowStamp();
  const id = task.task_id || report.task_id || "(no-task-id)";

  const entry = [
    "",
    `## [${stamp}] task_id: ${id}`,
    "",
    "<details>",
    `<summary>TASK (status: ${task.status || "?"}) / REPORT (status: ${report.status || "?"})</summary>`,
    "",
    "### — TASK —",
    "",
    taskRaw.trimEnd(),
    "",
    "### — REPORT —",
    "",
    reportRaw.trimEnd(),
    "",
    "</details>",
    "",
    "---",
    "",
  ].join("\n");

  fs.appendFileSync(HISTORY_PATH, entry, "utf-8");
  fs.writeFileSync(TASK_PATH, TASK_TEMPLATE, "utf-8");
  fs.writeFileSync(REPORT_PATH, REPORT_TEMPLATE, "utf-8");

  console.log("📦 [archive 완료]");
  console.log(`   task_id     : ${id}`);
  console.log(`   보관 위치    : docs/AI_HANDOFF_HISTORY.md`);
  console.log(`   timestamp   : ${stamp}`);
  console.log(`   초기화       : AI_TASK.md / AI_REPORT.md → 빈 템플릿(status: EMPTY)`);
}

// ─────────────────────────── entry ───────────────────────────
const cmd = process.argv[2];

if (cmd === "status") {
  cmdStatus();
} else if (cmd === "archive") {
  cmdArchive();
} else {
  console.log("GPT ↔ Claude Code 핸드오프 브리지");
  console.log("");
  console.log("  node scripts/ai-handoff.mjs status    현재 TASK/REPORT 상태 및 mismatch 확인");
  console.log("  node scripts/ai-handoff.mjs archive   TASK+REPORT를 HISTORY에 보관 후 초기화");
  console.log("");
  if (cmd) {
    console.error(`알 수 없는 명령: ${cmd}`);
    process.exit(1);
  }
}
