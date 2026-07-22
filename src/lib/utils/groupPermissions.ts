import { Group } from '@/types/group';

// ─── 그룹 권한 판정 공통 유틸 ───
// WoC 전체에서 인라인으로 중복 구현되던 권한 판정 로직을 일원화.
// 향후 Staff 권한 확장 시 이 함수만 수정하면 전체 반영됨.

interface UserProfile {
  systemRole?: string;
  isAdmin?: boolean;
}

/**
 * 특정 그룹에 대해 관리자 권한(Owner 또는 시스템 Admin)을 가졌는지 판정.
 * - group.ownerId === userId
 * - profile.systemRole === 'admin'
 * - profile.isAdmin === true
 */
export function isGroupManager(
  group: Group | null | undefined,
  userId: string | undefined,
  profile: UserProfile | null | undefined
): boolean {
  if (!userId) return false;
  if (profile?.systemRole === 'admin' || profile?.isAdmin) return true;
  if (group?.ownerId === userId) return true;
  return false;
}

/**
 * 사용자가 관리 권한을 가진 그룹 목록을 필터링하여 반환.
 */
export function getManageableGroups(
  groups: Group[],
  userId: string | undefined,
  profile: UserProfile | null | undefined
): Group[] {
  if (!userId) return [];
  if (profile?.systemRole === 'admin' || profile?.isAdmin) return groups;
  return groups.filter(g => g.ownerId === userId);
}
