import './globals.css' // (Agar ye error de raha ho toh is line ko hata dena, baad me banayenge)

export const metadata = {
  title: 'Apna Circle',
  description: 'A private community app for families and seniors.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900">
        {children}
      </body>
    </html>
  );
}
