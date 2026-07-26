
'use client';
// 그룹 상세 래퍼 - GroupHome으로 데이터를 전달하는 패스쓰루 컴포넌트
// 클래스(ClassDetail)/이벤트(EventViewer)와 동일한 패턴으로
// 내부에서 useBackButtonClose를 직접 호출하여 뒤로가기 닫기 처리

import React, { useCallback, useEffect } from 'react';
import { Group } from '@/types/group';
import GroupHome from './GroupHome';
import { useBackButtonClose } from '@/hooks/useBackButtonClose';
import Portal from '@/components/common/Portal';
import { useNavigation } from '@/components/providers/NavigationProvider';

interface GroupDetailProps {
  group: Group;
  isModal?: boolean;
  onClose?: () => void;
}

export default function GroupDetail({ group, isModal, onClose }: GroupDetailProps) {
  const handleClose = useCallback(() => onClose?.(), [onClose]);
  const { setGlobalNavHidden } = useNavigation();

  // 모달 모드일 때 글로벌 네비게이션바 숨김 처리 (EventViewer / ClassDetail 동일)
  useEffect(() => {
    if (isModal) {
      setGlobalNavHidden(true);
      return () => setGlobalNavHidden(false);
    }
  }, [isModal, setGlobalNavHidden]);

  // 모달 모드일 때만 뒤로가기 닫기 바인딩 (ClassDetail, EventViewer와 동일 패턴)
  useBackButtonClose(!!isModal, handleClose);

  const content = <GroupHome group={group} isModal={isModal} onClose={onClose} />;

  if (isModal) {
    return (
      <Portal>
        <div className="fixed inset-0 z-[9000] bg-[#FAF8FF] overflow-hidden flex flex-col font-body notranslate animate-in slide-in-from-bottom duration-300">
          {content}
        </div>
      </Portal>
    );
  }

  return content;
}

