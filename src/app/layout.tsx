import type { Metadata } from 'next';

// The menu pages themselves are full HTML documents served by route handlers.
// This root layout only wraps Next.js's built-in pages (such as 404).
export const metadata: Metadata = {
  title: 'Auto Shop Menu',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="my">
      <body>{children}</body>
    </html>
  );
}
