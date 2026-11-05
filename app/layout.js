import './globals.css';
import PwaRegister from './components/PwaRegister'; 
import DisableContextMenu from './components/DisableContextMenu'; 
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';

export const metadata = {
  title: 'Apna Circle',
  description: 'A private community app',
  // 👈 Yahan se manifest: '/manifest.json' hata diya gaya hai
  icons: {
    icon: [
      { url: '/file_0000000060908208a9ebab06167.png', sizes: '192x192', type: 'image/png' },
      { url: '/file_0000000060908208a9ebab06167(1).png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/file_0000000060908208a9ebab06167.png',
  },
};

export const viewport = {
  themeColor: '#0070f3', 
};

export default async function RootLayout({ children }) {
  const locale = await getLocale(); 
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider messages={messages}>
          <PwaRegister />
          <DisableContextMenu />
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
    }
