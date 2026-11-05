import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  locales: ['en', 'hi'],
  defaultLocale: 'en'
});

export const config = {
  // 👈 Ye line ensure karti hai ki .json, .js, .png wali files middleware ko bypass karein
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
