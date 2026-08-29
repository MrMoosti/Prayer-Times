import type { Metadata, Viewport } from 'next';
// Self-hosted rather than pulled from Google at build time, so the Docker
// build needs nothing but the npm registry.
import '@fontsource-variable/plus-jakarta-sans';
import '@fontsource/amiri/400.css';
import { SettingsProvider } from '@/lib/useSettings';
import './globals.css';
import './scene.css';

export const metadata: Metadata = {
  title: 'Mektep Prayer',
  description:
    'Prayer times, kerahat windows and live weather on a clay landscape that follows the sun.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#2f4a36',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SettingsProvider>{children}</SettingsProvider>
      </body>
    </html>
  );
}
