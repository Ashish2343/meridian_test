import type { Metadata } from "next";
import { Inter } from "next/font/google";
const inter = Inter({ subsets: ["latin"] });

import "./globals.css";
import "@stream-io/video-react-sdk/dist/css/styles.css";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "meridian",
  description: "video calling",
  icons:{
    icon: '/icons/logo.svg'
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <ClerkProvider>
        <body className={`${inter.className} antialiased bg-gradient-to-tr from-[#0f0f0f] via-[#121212] to-[#1a1a2e]`}>
          {children}
          <Toaster/>
        </body>
      </ClerkProvider>
    </html>
  );
}