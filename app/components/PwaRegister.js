'use client';
import { useEffect } from 'react';

export default function PwaRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => console.log('Service Worker registered'))
        .catch((err) => console.log('Service Worker failed', err));
    }
  }, []);
  return null;
                                    }
