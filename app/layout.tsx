import type { Metadata, Viewport } from 'next';
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
