import './globals.css';

export const metadata = {
  title: 'Apna Circle',
  description: 'A private community app',
};

// Zoom rokne ke liye viewport settings
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
