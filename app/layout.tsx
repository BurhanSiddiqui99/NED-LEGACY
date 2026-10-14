import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/auth-context";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "LogiPulse — Last-Mile Courier & Delivery Management",
  description:
    "Enterprise last-mile logistics management platform connecting customers, delivery riders, and operations administrators across Karachi.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 font-sans antialiased">
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
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
