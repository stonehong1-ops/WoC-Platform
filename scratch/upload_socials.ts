import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load service account
const serviceAccount = JSON.parse(
  readFileSync('c:/Users/stone/WoC/woc-platform-seoul-1234-firebase-adminsdk.json', 'utf8')
);

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

const socials = [
  {
    title: "Big Milonga \"Estrellas\"",
    date: new Date("2026-10-17"),
    startTime: "12:00",
    endTime: "24:00",
    organizerName: "Navi & Bongbong"
  },
  {
    title: "Busan Tango Marathon",
    date: new Date("2026-06-24"),
    startTime: "12:00",
    endTime: "24:00",
    organizerName: "Moses Park"
  },
  {
    title: "Gunsan Sunset Tango Marathon",
    date: new Date("2026-05-01"),
    startTime: "12:00",
    endTime: "24:00",
    organizerName: "If"
  },
  {
    title: "RoyBeDDong",
    date: new Date("2026-12-18"),
    startTime: "20:00",
    endTime: "24:00",
    organizerName: "Royroy & Beto"
  },
  {
    title: "Valsamic",
    date: new Date("2026-05-05"),
    startTime: "18:00",
    endTime: "20:00",
    organizerName: "Isabelle"
  }
];

async function upload() {
  const collectionRef = db.collection('socials');
  
  for (const s of socials) {
    const data = {
      type: 'popup',
      title: s.title,
      organizerId: 'system1',
      organizerName: s.organizerName,
      venueId: '',
      venueName: '', // Venue not provided explicitly, but could be inferred or left empty
      imageUrl: '',
      startTime: s.startTime,
      endTime: s.endTime,
      date: Timestamp.fromDate(s.date),
      createdAt: Timestamp.now(),
      description: `[팝업 밀롱가] ${s.title} - ${s.organizerName} 주최`
    };
    
    const res = await collectionRef.add(data);
    console.log(`Added social: ${s.title} with ID: ${res.id}`);
  }
}

upload().then(() => console.log('Done')).catch(console.error);
