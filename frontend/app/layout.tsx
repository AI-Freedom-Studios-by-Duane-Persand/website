// frontend/app/layout.tsx
import './globals.css';
import { ReactNode } from 'react';
import { getBrandingConfig } from '../lib/branding';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default async function RootLayout({ children }: { children: ReactNode }) {
  const branding = await getBrandingConfig();
  return (
    <html lang="en">
      <head>
        {branding.faviconUrl ? (
          <link rel="icon" href={branding.faviconUrl} />
        ) : (
          <link rel="icon" href="/favicon.ico" />
        )}
        {branding.logoUrl && (
          <meta property="og:image" content={branding.logoUrl} />
        )}
      </head>
      <body>
        <Header />
        {children}
        <Footer/>
      </body>
    </html>
  );
}
