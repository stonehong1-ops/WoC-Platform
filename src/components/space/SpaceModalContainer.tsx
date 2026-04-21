"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function SpaceModalContainer({ children }: { children: React.ReactNode }) {
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
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="relative w-full h-full bg-background overflow-hidden flex flex-col"
      >
        {/* The children already contain the header and navigation logic */}
        <div className="flex-1 w-full h-full overflow-hidden">
          {children}
        </div>
      </motion.div>
    </div>
  );
}
