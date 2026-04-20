import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import ThemeToggle from "@/components/theme-toggle";
import PwaInstallBanner from "@/components/PwaInstallBanner";
import HeaderSideNavSection from "@/components/account/HeaderSideNavSection";
import TopProgressBar from "@/components/ui/TopProgressBar";

export const metadata: Metadata = {
  title: "Real Estate Staff Work Tracker",
  description: "Internal staff work tracker",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0a0a0a" />
      </head>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TopProgressBar />
          <div className="min-h-screen bg-brand-surface dark:bg-brand-dark-bg">
            <header className="sticky top-0 z-10 border-b border-white/10 bg-brand-tertiary p-3">
              <div className="flex items-center justify-between gap-3">
                {/* Left: Hamburger (SideNav) + App Title */}
                <div className="flex items-center gap-2">
                  <HeaderSideNavSection />
                  <div className="text-sm font-semibold text-white">Aarya Hub</div>
                </div>
                {/* Right: Theme toggle only */}
                <ThemeToggle />
              </div>
            </header>
            <main className="mx-auto w-full max-w-2xl px-3 py-4">
              {children}
            </main>
            <PwaInstallBanner />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
