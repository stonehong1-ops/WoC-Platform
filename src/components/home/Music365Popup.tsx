"use client";
// Camus365 팝업을 공통 ContentViewerPopup 컴포넌트로 래핑하여 렌더링하는 컴포넌트

import React from 'react';
import ContentViewerPopup from '@/components/common/ContentViewerPopup';

interface Music365PopupProps {
  onClose: () => void;
}

export default function Music365Popup({ onClose }: Music365PopupProps) {
  return (
    <ContentViewerPopup
      collectionName="music365"
      adminPassword="camus365"
      themeColor="amber"
      navTitleKey="home.music.navTitle"
      subtitleKey="home.music.subtitle"
      adminUploadKey="home.music.admin.uploadPost"
      viewerDayPrefixKey="home.music.viewer.dayPrefix"
      viewerDaySuffixKey="home.music.viewer.daySuffix"
      noPostsKey="home.music.viewer.noPosts"
      decoratorIcon="music_note"
      popupHistoryKey="music365"
      popupSheetHistoryKey="music365Sheet"
      onClose={onClose}
    />
  );
}
