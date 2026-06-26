import type { Metadata } from "next";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "SyncFit Dashboard - WoC",
  description: "SyncFit Responsive Hybrid Collaboration Platform",
};

export default function SyncFit3Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f8f9ff]">
      {children}
    </div>
  );
}
