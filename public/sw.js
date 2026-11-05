self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('fetch', (e) => {
  // Ye basic fetch event PWA install condition ko pura karta hai
});
