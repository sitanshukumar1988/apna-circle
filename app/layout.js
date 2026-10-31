import './globals.css';

export const metadata = {
  title: 'Apna Circle',
  description: 'A private community app',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
