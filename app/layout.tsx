import type { Metadata } from "next";
import { Barlow, Geist_Mono } from "next/font/google";
import "./globals.css";
import { APP } from "@/lib/constants";
import { StoreProvider } from "@/components/providers/store-provider";
import { SiteHeader } from "@/components/layout/site-header";

const barlow = Barlow({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: APP.name, template: `%s | ${APP.name}` },
  description: APP.description,
  icons: { icon: APP.logo },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${barlow.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <StoreProvider>
          <a href="#main-content" className="skip-link">Skip to content</a>
          <SiteHeader />
          <main id="main-content" className="flex-1">{children}</main>
          <footer className="site-footer"><div className="container">{APP.name} · {APP.description}</div></footer>
        </StoreProvider>
      </body>
    </html>
  );
}
