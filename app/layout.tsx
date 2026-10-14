import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/auth-context";
import { Toaster } from "sonner";
import { RouteProgress } from "@/components/layouts/route-progress";
import { THEME_INIT_SCRIPT } from "@/components/layouts/theme-toggle";

const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "LogiPulse — Last-Mile Courier & Delivery Management",
  description:
    "Book, track and deliver parcels across Pakistan with live maps, instant rider matching and real-time chat.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F5F8F6" },
    { media: "(prefers-color-scheme: dark)", color: "#0A0F0C" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={sans.variable}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-screen bg-[#F5F8F6] dark:bg-slate-950 font-sans antialiased text-slate-900 dark:text-slate-100">
        <AuthProvider>
          <RouteProgress />
          {children}
          <Toaster
            position="top-center"
            richColors
            closeButton
            toastOptions={{
              className: "rounded-2xl text-xs font-medium shadow-xl",
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
