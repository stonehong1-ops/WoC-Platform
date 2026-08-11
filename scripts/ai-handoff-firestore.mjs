#!/usr/bin/env node
/**
 * GPT ↔ Claude MAIN/SUB Firestore 기반 핸드오프 CLI (Phase 1: MAIN/SUB ↔ Firestore ↔ Stone UI만).
 * GPT 쪽 연결 adapter는 별도 단계에서 붙인다. 이 스크립트는 Admin SDK로 Firestore 규칙을 우회해
 * `aiHandoffMessages` 컬렉션에 직접 read/write한다. 기존 /chat, chat_rooms, chat_messages와는
 * 완전히 무관하다 — 절대 건드리지 않는다.
 *
 *   node scripts/ai-handoff-firestore.mjs list [--status=READY] [--assignee=CLAUDE_SUB]
 *   node scripts/ai-handoff-firestore.mjs post-task --assignee=CLAUDE_SUB --title="..." --content="..." [--taskId=WOC-...] [--from=GPT] [--scope-files=a.ts,b.ts] [--scope-dirs=src/x,src/y]
 *   node scripts/ai-handoff-firestore.mjs claim --taskId=WOC-... --agent=CLAUDE_SUB
 *   node scripts/ai-handoff-firestore.mjs report --taskId=WOC-... --agent=CLAUDE_SUB --status=DONE --summary="..." [--changedFiles=a.ts,b.ts] [--commits=hash1,hash2] [--build=PASS] [--qa=...] [--deployment=...] [--blockers=...] [--next=...] [--details=...]
 */
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import fs from "fs";

const serviceAccount = JSON.parse(
  fs.readFileSync("./woc-platform-seoul-1234-firebase-adminsdk-fbsvc-225cc1138a.json", "utf8")
);

if (!getApps().length) {
  initializeApp({ credential: cert(serviceAccount) });
}

const db = getFirestore();
const COLLECTION = "aiHandoffMessages";

const VALID_ASSIGNEES = ["CLAUDE_MAIN", "CLAUDE_SUB"];
const VALID_STATUSES = ["READY", "IN_PROGRESS", "DONE", "BLOCKED", "BLOCKED_CONFLICT", "FAILED"];

function parseArgs(argv) {
  const args = {};
  for (const raw of argv) {
    const m = raw.match(/^--([a-zA-Z-]+)=(.*)$/);
    if (m) args[m[1]] = m[2];
  }
  return args;
}

function splitList(v) {
  return v ? v.split(",").map((s) => s.trim()).filter(Boolean) : undefined;
}

function fail(msg) {
  console.error(`❌ ${msg}`);
  process.exit(1);
}

function newTaskId() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  const stamp = `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
  return `WOC-${stamp}`;
}

// ─────────────────────────── list ───────────────────────────
async function cmdList(args) {
  let q = db.collection(COLLECTION).orderBy("createdAt", "asc");
  if (args.status) q = q.where("status", "==", args.status);
  if (args.assignee) q = q.where("assignee", "==", args.assignee);

  const snap = await q.get();
  if (snap.empty) {
    console.log("⚪ 메시지가 없습니다.");
    return;
  }
  for (const doc of snap.docs) {
    const m = doc.data();
    const arrow = m.to ? `${m.from} → ${m.to}` : m.assignee ? `${m.from} → ${m.assignee}` : m.from;
    console.log(`[${m.type === "AI_TASK" ? "TASK" : "REPORT"}] ${m.taskId} | ${arrow} | ${m.status} | ${m.title || m.summary || ""}`);
  }
}

// ─────────────────────────── post-task ───────────────────────────
async function cmdPostTask(args) {
  if (!args.assignee || !VALID_ASSIGNEES.includes(args.assignee)) {
    fail(`--assignee 필수 (${VALID_ASSIGNEES.join(" | ")})`);
  }
  if (!args.title && !args.content) fail("--title 또는 --content 중 최소 하나는 필요합니다.");

  const taskId = args.taskId || newTaskId();
  const doc = {
    type: "AI_TASK",
    taskId,
    from: args.from || "GPT",
    assignee: args.assignee,
    status: "READY",
    title: args.title || "",
    content: args.content || "",
    scope: {
      files: splitList(args["scope-files"]) || [],
      directories: splitList(args["scope-dirs"]) || [],
    },
    createdAt: FieldValue.serverTimestamp(),
  };

  const ref = await db.collection(COLLECTION).add(doc);
  console.log(`✅ TASK 등록 완료: taskId=${taskId} (doc=${ref.id})`);
}

// ─────────────────────────── claim ───────────────────────────
async function cmdClaim(args) {
  if (!args.taskId) fail("--taskId 필수");
  if (!args.agent || !VALID_ASSIGNEES.includes(args.agent)) {
    fail(`--agent 필수 (${VALID_ASSIGNEES.join(" | ")})`);
  }

  const taskSnap = await db.collection(COLLECTION)
    .where("taskId", "==", args.taskId)
    .where("type", "==", "AI_TASK")
    .limit(1)
    .get();

  if (taskSnap.empty) fail(`taskId=${args.taskId} 인 TASK를 찾을 수 없습니다.`);
  const taskRef = taskSnap.docs[0].ref;
  const task = taskSnap.docs[0].data();

  if (task.assignee !== args.agent) {
    fail(`이 TASK는 ${task.assignee} 담당입니다. ${args.agent}는 claim할 수 없습니다.`);
  }

  // scope 충돌 검사: 다른 IN_PROGRESS TASK와 files/directories 겹치는지 확인
  const inProgressSnap = await db.collection(COLLECTION)
    .where("type", "==", "AI_TASK")
    .where("status", "==", "IN_PROGRESS")
    .get();

  const myFiles = new Set(task.scope?.files || []);
  const myDirs = task.scope?.directories || [];
  let conflict = null;
  for (const doc of inProgressSnap.docs) {
    if (doc.id === taskRef.id) continue;
    const other = doc.data();
    const otherFiles = other.scope?.files || [];
    const otherDirs = other.scope?.directories || [];
    const fileOverlap = otherFiles.some((f) => myFiles.has(f));
    const dirOverlap = myDirs.some((d) => otherDirs.some((od) => d === od || d.startsWith(od) || od.startsWith(d)));
    if (fileOverlap || dirOverlap) {
      conflict = other.taskId;
      break;
    }
  }

  if (conflict) {
    await taskRef.update({ status: "BLOCKED_CONFLICT", updatedAt: FieldValue.serverTimestamp() });
    console.error(`🚫 BLOCKED_CONFLICT: taskId=${args.taskId} — 진행 중인 taskId=${conflict}와 scope가 겹칩니다.`);
    process.exit(1);
  }

  await db.runTransaction(async (tx) => {
    const fresh = await tx.get(taskRef);
    if (fresh.data().status !== "READY") {
      throw new Error(`이미 다른 상태(${fresh.data().status})입니다 — 이미 claim되었을 수 있습니다.`);
    }
    tx.update(taskRef, {
      status: "IN_PROGRESS",
      claimedBy: args.agent,
      claimedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  });

  console.log(`✅ claim 완료: taskId=${args.taskId} → IN_PROGRESS (${args.agent})`);
}

// ─────────────────────────── report ───────────────────────────
async function cmdReport(args) {
  if (!args.taskId) fail("--taskId 필수");
  if (!args.agent || !VALID_ASSIGNEES.includes(args.agent)) {
    fail(`--agent 필수 (${VALID_ASSIGNEES.join(" | ")})`);
  }
  if (!args.status || !VALID_STATUSES.includes(args.status)) {
    fail(`--status 필수 (${VALID_STATUSES.join(" | ")})`);
  }

  const taskSnap = await db.collection(COLLECTION)
    .where("taskId", "==", args.taskId)
    .where("type", "==", "AI_TASK")
    .limit(1)
    .get();
  if (taskSnap.empty) fail(`taskId=${args.taskId} 인 TASK를 찾을 수 없습니다.`);
  const taskRef = taskSnap.docs[0].ref;

  const reportDoc = {
    type: "AI_REPORT",
    taskId: args.taskId,
    from: args.agent,
    to: "GPT",
    assignee: args.agent,
    status: args.status,
    summary: args.summary || "",
    changedFiles: splitList(args.changedFiles) || [],
    commits: splitList(args.commits) || [],
    build: args.build || "",
    qa: args.qa || "",
    deployment: args.deployment || "",
    blockers: args.blockers || "",
    nextRecommendation: args.next || "",
    details: args.details || "",
    createdAt: FieldValue.serverTimestamp(),
    completedAt: FieldValue.serverTimestamp(),
  };

  const batch = db.batch();
  batch.set(db.collection(COLLECTION).doc(), reportDoc);
  batch.update(taskRef, { status: args.status, updatedAt: FieldValue.serverTimestamp() });
  await batch.commit();

  console.log(`✅ REPORT 등록 완료: taskId=${args.taskId} | status=${args.status}`);
}

// ─────────────────────────── entry ───────────────────────────
const [, , cmd, ...rest] = process.argv;
const args = parseArgs(rest);

const commands = { list: cmdList, "post-task": cmdPostTask, claim: cmdClaim, report: cmdReport };

if (commands[cmd]) {
  commands[cmd](args)
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("❌ 오류:", err.message);
      process.exit(1);
    });
} else {
  console.log("AI Handoff Firestore CLI (Phase 1 — MAIN/SUB ↔ Firestore ↔ Stone UI)");
  console.log("");
  console.log("  node scripts/ai-handoff-firestore.mjs list [--status=READY] [--assignee=CLAUDE_SUB]");
  console.log("  node scripts/ai-handoff-firestore.mjs post-task --assignee=CLAUDE_SUB --title=\"...\" --content=\"...\"");
  console.log("  node scripts/ai-handoff-firestore.mjs claim --taskId=WOC-... --agent=CLAUDE_SUB");
  console.log("  node scripts/ai-handoff-firestore.mjs report --taskId=WOC-... --agent=CLAUDE_SUB --status=DONE --summary=\"...\"");
  if (cmd) {
    console.error(`알 수 없는 명령: ${cmd}`);
    process.exit(1);
  }
}
