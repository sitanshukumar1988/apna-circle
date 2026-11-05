import './globals.css';
import PwaRegister from './components/PwaRegister'; 
import DisableContextMenu from './components/DisableContextMenu'; 
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';

export const metadata = {
  title: 'Apna Circle',
  description: 'A private community app',
  manifest: '/manifest.json',
  icons: {
    icon: '/icon.png', 
    apple: '/icon.png',
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
