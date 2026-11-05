import './globals.css';
import PwaRegister from './components/PwaRegister'; 
import DisableContextMenu from './components/DisableContextMenu'; // 👈 Naya import kiya
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';

export const metadata = {
  title: 'Apna Circle',
  description: 'A private community app',
  manifest: '/manifest.json',
  icons: {
    icon: '/file_00000000f61882119c25be3ba52.png', // Aapke logo ka naam
  },
};

export const viewport = {
  themeColor: '#E1306C',
};

export default async function RootLayout({ children }) {
  const locale = await getLocale(); 
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider messages={messages}>
          <PwaRegister />
          <DisableContextMenu /> {/* 👈 Yahan add kiya taaki poore app par lagu ho */}
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
    }
