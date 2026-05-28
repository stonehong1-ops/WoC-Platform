'use client';

import { Suspense } from 'react';
import ClassPageContent from './ClassPageContent';

interface ClubClassSelectionPageProps {
  propGroupId?: string;
  propModalId?: string;
  isOverlay?: boolean;
  onClose?: () => void;
}

export default function ClubClassSelectionPage({
  propGroupId,
  propModalId,
  isOverlay = false,
  onClose
}: ClubClassSelectionPageProps) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex justify-center items-center">
        <span className="material-symbols-outlined animate-spin text-4xl text-primary">progress_activity</span>
      </div>
    }>
      <ClassPageContent 
        propGroupId={propGroupId}
        propModalId={propModalId}
        isOverlay={isOverlay}
        onClose={onClose}
      />
    </Suspense>
  );
}
