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
  assignee?: AIHandoffAssignee;      // TASK only
  status: AIHandoffStatus;
  title?: string;
  content?: string;                  // TASK body
  summary?: string;                  // REPORT body
  changedFiles?: string[];
  validation?: string;
  problems?: string;
  nextDecisionNeeded?: string;
  scope?: AIHandoffScope;
  claimedBy?: AIHandoffAssignee;
  claimedAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}
