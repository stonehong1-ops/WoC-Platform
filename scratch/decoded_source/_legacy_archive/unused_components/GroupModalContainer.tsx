"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";

export default function GroupModalContainer({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const onDismiss = useCallback(() => {
    router.back();
  }, [router]);

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onDismiss();
    },
    [onDismiss]
  );

  useEffect(() => {
    document.addEventListener("keydown", onKeyDown);
    // document.body.style.overflow = "hidden"; // App-in-App container handles its own overflow
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      // document.body.style.overflow = "auto";
    };
  }, [onKeyDown]);

  return (
    <div className="fixed inset-0 z-[100] bg-background overflow-hidden flex flex-col">
      {/* Full Screen container for App-in-App feel */}
      <div className="relative w-full h-full bg-background flex flex-col">
        {/* The children already contain the header and navigation logic */}
        <div className="flex-1 w-full h-full overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
}
