import type { Metadata } from 'next';
import './globals.css';
import { Bebas_Neue, Work_Sans } from 'next/font/google';

const display = Bebas_Neue({ subsets: ['latin'], weight: '400', variable: '--font-display' });
const body = Work_Sans({ subsets: ['latin'], variable: '--font-body' });

export const metadata: Metadata = {
  title: 'Food Court Voice Concierge (HITL Demo)',
  description:
    'Human-in-the-loop concierge demo that reimagines the Netflix sample as a Food Court experience while keeping the original flow available for reference.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body className="antialiased bg-slate-50 text-slate-800">
        {children}
      </body>
    </html>
  );
}

