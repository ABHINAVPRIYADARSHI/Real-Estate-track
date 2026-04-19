import type { Metadata } from "next";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "next-themes";
import ThemeToggle from "@/components/theme-toggle";
import PwaInstallBanner from "@/components/PwaInstallBanner";
import HeaderSideNavSection from "@/components/account/HeaderSideNavSection";

export const metadata: Metadata = {
  title: "Real Estate Staff Work Tracker",
  description: "Internal staff work tracker",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0a0a0a" />
      </head>
      <body>
        {publishableKey ? (
          <ClerkProvider
            publishableKey={publishableKey}
            afterSignInUrl="/dashboard"
          >
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              enableSystem
              disableTransitionOnChange
            >
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
          </ClerkProvider>
        ) : (
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <div className="min-h-screen bg-white dark:bg-neutral-950">
              <header className="sticky top-0 z-10 border-b border-neutral-200/70 bg-white/80 p-3 backdrop-blur dark:border-neutral-800/70 dark:bg-neutral-950/80">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold">Work Tracker</div>
                  <ThemeToggle />
                </div>
              </header>
              <main className="mx-auto w-full max-w-2xl px-3 py-4">
                {children}
              </main>
              <PwaInstallBanner />
            </div>
          </ThemeProvider>
        )}
      </body>
    </html>
  );
}
