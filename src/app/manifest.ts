import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'WoC Today | World of Community',
    short_name: 'WoC Today',
    description: 'A premium community platform for shared experiences and collective living.',
    start_url: '/',
    display: 'standalone',
    background_color: '#F9F9F9',
    theme_color: '#005BC0',
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
