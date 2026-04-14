import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "WoC Today | World of Community",
  description: "A community platform for the modern era.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-[#f8f9fa] flex flex-col">
        {/* Fixed Header */}
        <Header />

        {/* Dynamic Body Content */}
        <main className="flex-1 mt-16 mb-20">
          {children}
        </main>

        {/* Fixed Footer */}
        <Footer />
      </body>
    </html>
  );
}
