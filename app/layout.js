import './globals.css';

export const metadata = {
  title: 'Apna Circle',
  description: 'A private community app',
  manifest: '/manifest.json',
  themeColor: '#E1306C',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
    }
