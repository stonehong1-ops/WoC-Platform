import { Timestamp } from 'firebase/firestore';

export type AIHandoffAgent = 'GPT' | 'CLAUDE_MAIN' | 'CLAUDE_SUB' | 'STONE';
export type AIHandoffAssignee = 'CLAUDE_MAIN' | 'CLAUDE_SUB';
export type AIHandoffMessageType = 'AI_TASK' | 'AI_REPORT';
export type AIHandoffStatus =
  | 'READY'
  | 'IN_PROGRESS'
  | 'DONE'
  | 'BLOCKED'
  | 'BLOCKED_CONFLICT'
  | 'FAILED';

export interface AIHandoffScope {
  files?: string[];
  directories?: string[];
}

export interface AIHandoffMessage {
  id: string;
  type: AIHandoffMessageType;
  taskId: string;
  from: AIHandoffAgent;
  to?: AIHandoffAgent;
  assignee?: AIHandoffAssignee;      // TASK/REPORT 공통
  status: AIHandoffStatus;
  title?: string;
  content?: string;                  // TASK 본문
  scope?: AIHandoffScope;
  claimedBy?: AIHandoffAssignee;
  claimedAt?: Timestamp;
  clientRequestId?: string;          // idempotency key (TASK, API 경유 생성 시)

  // REPORT 표준 필드 - GPT가 재판단하기 쉽도록 최소 구조로 고정.
  // 긴 walkthrough는 기본으로 남기지 않는다. 원문 로그가 필요하면 details에 담는다.
  summary?: string;
  changedFiles?: string[];
  commits?: string[];
  build?: string;
  qa?: string;
  deployment?: string;
  blockers?: string;
  nextRecommendation?: string;
  details?: string;
  completedAt?: Timestamp;

  createdAt: Timestamp;
  updatedAt?: Timestamp;
}
