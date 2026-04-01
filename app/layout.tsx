import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://mpctools.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "MPC Tools Image outpainting using AI",
  description:
    "Prepare, outpaint, and merge high-quality images for outpainting using AI.",
  openGraph: {
    title: "MPC Tools Image outpainting using AI",
    description:
      "Prepare, outpaint, and merge high-quality images for outpainting using AI.",
    url: "/",
    type: "website",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "MPC Tools Image outpainting using AI",
    description:
      "Prepare, outpaint, and merge high-quality images for outpainting using AI.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}
      >
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "MPC Tools Image outpainting using AI",
              applicationCategory: "DesignApplication",
              operatingSystem: "Web",
              description:
                "Prepare, outpaint, and merge images for outpainting using AI.",
              url: siteUrl,
            }),
          }}
        />
        {process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID && (
          <Script
            src="https://cloud.umami.is/script.js"
            data-website-id={process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID}
            strategy="afterInteractive"
          />
        )}
      </body>
    </html>
  );
}
