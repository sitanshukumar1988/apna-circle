
export const metadata = {
  title: "Apna Circle",
  description: "A private community to connect with people",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
