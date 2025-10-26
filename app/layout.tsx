import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BackToTop from "@/components/BackToTop";
import ThemeProvider from "@/components/ThemeProvider";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

export const metadata: Metadata = {
  metadataBase: new URL('https://bakerbeanie.me'),
  title: "Baker Beanie",
  description: "A blog full of tasty vegetarian and vegan recipes",
  openGraph: {
    title: "Baker Beanie",
    description: "A blog full of tasty vegetarian and vegan recipes",
    url: 'https://bakerbeanie.me',
    siteName: 'Baker Beanie',
    images: [{
      url: '/author.jpg',
      width: 1200,
      height: 630,
      alt: 'Baker Beanie - Vegetarian and Vegan Recipes',
    }],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Baker Beanie",
    description: "A blog full of tasty vegetarian and vegan recipes",
    images: ['/author.jpg'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
                if (darkModeMediaQuery.matches) {
                  document.documentElement.classList.add('dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body>
        <ThemeProvider>
          <Header />
          <div className="container mx-auto main-content">
            <section className="content">{children}</section>
          </div>
          <Footer />
          <BackToTop />
          <Analytics />
          <SpeedInsights />
        </ThemeProvider>
      </body>
    </html>
  );
}
