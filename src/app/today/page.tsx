"use client";

import { Suspense } from "react";
import TodayPageContent from "./TodayPageContent";

export default function TodayPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-slate-50/50">Loading...</div>}>
      <TodayPageContent />
    </Suspense>
  );
}
