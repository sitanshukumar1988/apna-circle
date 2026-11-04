import './globals.css';
import PwaRegister from '../components/PwaRegister';

export const metadata = {
  title: 'Apna Circle',
  description: 'A private community app',
  manifest: '/manifest.json',
  themeColor: '#E1306C', // Instagram Pink Color
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <PwaRegister />
        {children}
      </body>
    </html>
  );
    }
