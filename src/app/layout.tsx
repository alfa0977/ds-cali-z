import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Vazirmatn } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { QueryProvider } from "@/components/query-provider";
import { I18nProvider } from "@/lib/i18n";
import { ThemeColorProvider } from "@/lib/theme-color";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const vazirmatn = Vazirmatn({
  variable: "--font-vazirmatn",
  subsets: ["arabic", "latin"],
});

export const metadata: Metadata = {
  title: "DS-Cali — ردیاب هوشمند کالری",
  description:
    "اسکن وعده‌های غذایی، ردیابی درشت‌مغذی‌ها و رسیدن به اهداف. Scan your meals, track macros, and hit your goals.",
  keywords: ["کالری", "DS-Cali", "تغذیه", "calories", "AI", "nutrition"],
  authors: [{ name: "DS-Cali" }],
  icons: {
    icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='.9em' font-size='90'%3E%F0%9F%A5%97%3C/text%3E%3C/svg%3E",
  },
  openGraph: {
    title: "DS-Cali — ردیاب هوشمند کالری",
    description: "اسکن وعده‌های غذایی، ردیابی درشت‌مغذی‌ها و رسیدن به اهداف.",
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
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${vazirmatn.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider>
          <ThemeColorProvider>
            <I18nProvider>
              <QueryProvider>{children}</QueryProvider>
            </I18nProvider>
          </ThemeColorProvider>
        </ThemeProvider>
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
