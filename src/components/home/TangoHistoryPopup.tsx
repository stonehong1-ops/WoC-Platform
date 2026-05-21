"use client";
// Tango History 팝업을 공통 ContentViewerPopup 컴포넌트로 래핑하여 렌더링하는 컴포넌트

import React from 'react';
import ContentViewerPopup from '@/components/common/ContentViewerPopup';

interface TangoHistoryPopupProps {
  onClose: () => void;
}

export default function TangoHistoryPopup({ onClose }: TangoHistoryPopupProps) {
  return (
    <ContentViewerPopup
      collectionName="tangoHistory"
      adminPassword="ddakji"
      themeColor="indigo"
      navTitleKey="home.history.navTitle"
      subtitleKey="home.history.subtitle"
      adminUploadKey="home.history.admin.uploadPost"
      viewerDayPrefixKey="home.history.viewer.chapterPrefix"
      noPostsKey="home.history.viewer.noPosts"
      decoratorIcon="history_edu"
      popupHistoryKey="tangoHistory"
      popupSheetHistoryKey="tangoHistorySheet"
      onClose={onClose}
    />
  );
}
