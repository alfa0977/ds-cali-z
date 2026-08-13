import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { QueryProvider } from "@/components/query-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CalAI — AI Calorie Tracker",
  description:
    "Scan your meals, track macros, and hit your goals. Powered by AI vision.",
  keywords: ["calories", "AI", "nutrition", "meal tracker", "macros"],
  authors: [{ name: "CalAI" }],
  icons: {
    icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='.9em' font-size='90'%3E%F0%9F%8D%8E%3C/text%3E%3C/svg%3E",
  },
  openGraph: {
    title: "CalAI — AI Calorie Tracker",
    description: "Scan your meals, track macros, and hit your goals.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#1C1C1E",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider>
          <QueryProvider>{children}</QueryProvider>
        </ThemeProvider>
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
