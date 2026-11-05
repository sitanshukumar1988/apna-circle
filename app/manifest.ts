import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Apna Circle',
    short_name: 'Apna Circle',
    description: 'A private community app',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#0070f3',
    icons: [
      {
        src: '/file_0000000060908208a9ebab06167.png', // 192 wali file ka naam
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/file_0000000060908208a9ebab06167(1).png', // 512 wali file ka naam
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  };
}
