import type { Metadata } from "next";
import { IBM_Plex_Sans } from "next/font/google";
import Image from "next/image";
import "./globals.css";
import Navbar from "../components/Navbar";
import ViewerCount from "@/components/ViewerCount";

const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-ibm-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "BOM Live Score",
  description: "Live Score Broadcasting For Battle Of The Maroons",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  console.log(
    "Designed And Developed By ACICTS\nProject Repository: https://github.com/nyxv3il/live-score-app",
  );

  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
          integrity="sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA=="
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
      </head>
      <body className={`${ibmPlexSans.variable} antialiased`}>
        <div className="app-shell min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-1">{children}</main>
          <footer className="site-footer">
            <div className="site-footer__inner">
              <Image
                src="/acicts.png"
                alt="ACICTS logo"
                width={48}
                height={48}
                className="site-footer__logo"
              />
              <p className="site-footer__text">
                Designed And Developed By ACICTS
              </p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
