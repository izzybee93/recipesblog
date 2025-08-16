import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BackToTop from "@/components/BackToTop";

export const metadata: Metadata = {
  title: "Baker Beanie",
  description: "A blog full of tasty vegetarian and vegan recipes",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Header />
        <div className="container mx-auto main-content">
          <section className="content">{children}</section>
        </div>
        <Footer />
        <BackToTop />
      </body>
    </html>
  );
}
