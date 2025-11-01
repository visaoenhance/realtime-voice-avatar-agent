import type { Metadata } from 'next';
import './globals.css';
import { Bebas_Neue, Work_Sans } from 'next/font/google';

const display = Bebas_Neue({ subsets: ['latin'], weight: '400', variable: '--font-display' });
const body = Work_Sans({ subsets: ['latin'], variable: '--font-body' });

export const metadata: Metadata = {
  title: 'MovieNite Voice Concierge (HITL Demo)',
  description:
    'Voice-first human-in-the-loop concierge that helps households pick streaming titles with Netflix-inspired theming and explicit preview/playback approvals.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body className="antialiased bg-netflix-black text-netflix-gray-100">
        {children}
      </body>
    </html>
  );
}

