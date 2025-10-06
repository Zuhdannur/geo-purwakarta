import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import { Toaster } from '@/components/ui/sonner';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Purwakarta Map Dashboard',
  description: 'Interactive map dashboard for Purwakarta',
};

// Force dynamic rendering to allow middleware to run
export const dynamic = 'force-dynamic';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Navbar />
        <div className="pt-14 h-screen">
          {children}
        </div>
        <Toaster richColors closeButton />
      </body>
    </html>
  );
}
