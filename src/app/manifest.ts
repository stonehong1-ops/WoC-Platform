import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/tango-world-v2',
    name: 'Tango World',
    short_name: '탱고월드',
    description: '하나의 세계, 탱고의 모든 순간',
    start_url: '/live',
    scope: '/',
    display: 'standalone',
    background_color: '#F9F9F9',
    theme_color: '#005BC0',
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable' as any,
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable' as any,
      },
    ],
  };
}

