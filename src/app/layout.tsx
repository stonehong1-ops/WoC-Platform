import type { Metadata, Viewport } from "next";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import PageWrapper from "@/components/layout/PageWrapper";
import SWRegister from "@/components/layout/SWRegister";

export const metadata: Metadata = {
  title: "WoC",
  description: "A premium community platform for shared experiences and collective living.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "WoC",
  },
};

export const viewport: Viewport = {
  themeColor: "#005BC0",
};

import { NavigationProvider } from "@/components/providers/NavigationProvider";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { LocationProvider } from "@/components/providers/LocationProvider";
import NavigationDrawer from "@/components/layout/NavigationDrawer";
import LocationSelector from "@/components/layout/LocationSelector";
import AuthModal from "@/components/auth/AuthModal";
import AuthGuard from "@/components/auth/AuthGuard";

export default function RootLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal?: React.ReactNode;
}) {
  return (
    <html lang="en" className="light">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"/>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className="bg-background text-on-surface font-body selection:bg-primary-container selection:text-on-primary-container antialiased">
        <AuthProvider>
          <AuthModal />
          <AuthGuard>
            <LocationProvider>
              <NavigationProvider>
                <SWRegister />
                {/* Fixed Header */}
                <Header />

                {/* Full Screen Menu */}
                <NavigationDrawer />

                {/* Location Selector Bottom Sheet/Modal */}
                <LocationSelector />

                {/* Dynamic Body Content */}
                <PageWrapper>
                  {children}
                </PageWrapper>

                {/* Parallel Route Modal Content */}
                {modal}

                {/* Fixed Footer */}
                <Footer />
              </NavigationProvider>
            </LocationProvider>
          </AuthGuard>
        </AuthProvider>
      </body>
    </html>
  );
}
