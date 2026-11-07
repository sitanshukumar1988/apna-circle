import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  locales: ['en', 'hi'],
  defaultLocale: 'en'
});

export const config = {
  // 👈 Ye matcher ensure karega ki home page aur files block na hon
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
