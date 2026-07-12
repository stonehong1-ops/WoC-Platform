"use client";

import { Suspense } from "react";
import SocialPageContent from "../social/SocialPageContent";

export default function TodayPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-slate-50/50">Loading...</div>}>
      <SocialPageContent />
    </Suspense>
  );
}
