import type { Metadata, Viewport } from "next";
import "./globals.css";
import GlobalNavigation from "@/components/layout/GlobalNavigation";
import PageWrapper from "@/components/layout/PageWrapper";
import SWRegister from "@/components/layout/SWRegister";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { Inter, Plus_Jakarta_Sans, Manrope } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
});

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
});


export const metadata: Metadata = {
  title: "WoC",
  description: "A premium group platform for shared experiences and collective living.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "WoC",
  },
};

export const viewport: Viewport = {
  themeColor: "#005BC0",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

import { NavigationProvider } from "@/components/providers/NavigationProvider";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { LocationProvider } from "@/components/providers/LocationProvider";
import { ClassCartProvider } from "@/contexts/ClassCartContext";
import NavigationDrawer from "@/components/layout/NavigationDrawer";
import NotificationTray from "@/components/layout/NotificationTray";
import LocationSelector from "@/components/layout/LocationSelector";
import AuthModal from "@/components/auth/AuthModal";
import AuthGuard from "@/components/auth/AuthGuard";
import InAppBrowserGuard from "@/components/layout/InAppBrowserGuard";
import { Toaster } from "sonner";

export default function RootLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal?: React.ReactNode;
}) {
  return (
    <html lang="en" className={`light notranslate ${inter.variable} ${jakarta.variable} ${manrope.variable}`} translate="no" style={{ colorScheme: 'light' }}>
      <head>
        <meta name="color-scheme" content="light" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block" rel="stylesheet" />
      </head>
      <body className="overflow-x-hidden bg-background text-on-surface font-body selection:bg-primary-container selection:text-on-primary-container antialiased">
        <div className="w-full relative flex flex-col min-h-[100dvh]">
          <LanguageProvider>
            <AuthProvider>
              <AuthModal />
              <AuthGuard>
                <NotificationProvider>
                  <LocationProvider>
                    <NavigationProvider>
                      <ClassCartProvider>
                        <SWRegister />
                        <GlobalNavigation>
                          {/* Full Screen Menu */}
                          <NavigationDrawer />

                          {/* Notification Tray */}
                          <NotificationTray />

                          {/* Location Selector Bottom Sheet/Modal */}
                          <LocationSelector />

                          {/* Dynamic Body Content */}
                          <PageWrapper>
                            {children}
                          </PageWrapper>

                          {/* Parallel Route Modal Content */}
                          {modal}

                          {/* In-App Browser Guard (KakaoTalk etc.) */}
                          <InAppBrowserGuard />
                        </GlobalNavigation>
                      </ClassCartProvider>
                    </NavigationProvider>
                  </LocationProvider>
                </NotificationProvider>
              </AuthGuard>
              <Toaster position="top-center" richColors />
            </AuthProvider>
          </LanguageProvider>
        </div>
      </body>
    </html>
  );
}
