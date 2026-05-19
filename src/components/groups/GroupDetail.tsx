
'use client';
// 그룹 상세 래퍼 - GroupHome으로 데이터를 전달하는 패스쓰루 컴포넌트

import React from 'react';
import { Group } from '@/types/group';
import GroupHome from './GroupHome';

interface GroupDetailProps {
  group: Group;
  isModal?: boolean;
  onClose?: () => void;
}

export default function GroupDetail({ group, isModal, onClose }: GroupDetailProps) {
  return <GroupHome group={group} isModal={isModal} onClose={onClose} />;
}
