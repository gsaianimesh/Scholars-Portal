import type { Metadata } from "next";
import localFont from "next/font/local";
import { ThemeProvider } from "@/components/theme-provider";
import { ConditionalChatbot } from "@/components/layout/conditional-chatbot";
import Script from "next/script";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Researchify | The Omnipresent AI Lab Assistant",
  description: "Researchify is the ultimate research supervision platform. Stop juggling emails and spreadsheets—schedule meetings automatically, manage scholar tasks seamlessly, and let Lumi, our smart AI lab assistant, handle notes, transcripts, and insights.",
  openGraph: {
    title: "Researchify | The Omnipresent AI Lab Assistant",
    description: "Researchify is the ultimate research supervision platform. Stop juggling emails and spreadsheets—schedule meetings automatically, manage scholar tasks seamlessly, and let Lumi, our smart AI lab assistant, handle notes, transcripts, and insights.",
    url: "https://researchify.app",
    siteName: "Researchify",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Researchify | The Omnipresent AI Lab Assistant",
    description: "Your ultimate research supervision platform powered by AI. Seamlessly track scholar progress, take automated meeting notes, and auto-generate tasks.",
  },
  keywords: ["Research Supervision", "AI Notetaker", "Lab Management", "Scholar Tracking", "Academic Software", "University Lab Dashboard", "PhD Management"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script
          strategy="afterInteractive"
          src={`https://www.googletagmanager.com/gtag/js?id=G-X8G125TXH8`}
        />
        <Script
          id="gtag-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());

              gtag('config', 'G-X8G125TXH8');
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <ConditionalChatbot />
        </ThemeProvider>
      </body>
    </html>
  );
}
