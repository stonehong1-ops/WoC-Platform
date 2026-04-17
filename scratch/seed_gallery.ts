import { db } from '../src/lib/firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const seedGallery = async () => {
  const posts = [
    {
      authorId: 'system',
      authorName: 'WoC Admin',
      authorPhoto: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
      media: [
        'https://images.unsplash.com/photo-1545128485-c400e7702796?w=800',
        'https://images.unsplash.com/photo-1504609813442-a8924e83f73e?w=800',
        'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800'
      ],
      caption: 'Busan Tango Marathon was amazing! 💃🕺 #BusanTango #Marathon',
      venueId: 'busan-marathon-venue',
      venueName: 'Busan, South Korea',
      eventId: 'busan-tango-marathon',
      eventName: 'Busan Tango Marathon',
      likesCount: 24,
      commentsCount: 5,
      likedBy: [],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      authorId: 'system',
      authorName: 'Tango Lover',
      authorPhoto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
      media: [
        'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800',
        'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800'
      ],
      caption: 'Suncheon Youth Training Center | Big Milonga "Estrellas" ✨ #Suncheon #Tango',
      venueId: 'suncheon-youth-center',
      venueName: 'Suncheon Youth Training Center',
      eventId: 'estrellas-milonga',
      eventName: 'Big Milonga "Estrellas"',
      likesCount: 15,
      commentsCount: 2,
      likedBy: [],
      createdAt: new Date(Date.now() - 3600000), // 1 hour ago
      updatedAt: new Date(Date.now() - 3600000)
    },
    {
      authorId: 'system',
      authorName: 'Milonguero',
      authorPhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100',
      media: [
        'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800'
      ],
      caption: 'Gunsan Beerport Sunset Tango was purely magical. 🌅 #Gunsan #SunsetTango',
      venueId: 'gunsan-beerport',
      venueName: 'Gunsan Beerport',
      eventId: 'gunsan-marathon',
      eventName: 'Gunsan Sunset Tango Marathon',
      likesCount: 42,
      commentsCount: 12,
      likedBy: [],
      createdAt: new Date(Date.now() - 86400000), // 1 day ago
      updatedAt: new Date(Date.now() - 86400000)
    }
  ];

  for (const post of posts) {
    await addDoc(collection(db, 'galleries'), {
      ...post,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    console.log(`Added post: ${post.caption}`);
  }
};

seedGallery();
