'use client';

import { useState } from 'react';
import { db } from '@/lib/firebase/clientApp';
import { collection, addDoc, Timestamp, getDocs, deleteDoc, query, where } from 'firebase/firestore';

export default function TempSocialSyncCorrect() {
  const [logs, setLogs] = useState<string[]>([]);
  const addLog = (msg: string) => setLogs(prev => [...prev, msg]);

  const runSync = async () => {
    addLog('Starting Corrected Social Master Sync (to /socials)...');
    
    const today = new Date('2026-04-17'); 
    const getNextDate = (dayOffset: number) => {
      const d = new Date(today);
      const currentDay = d.getDay(); 
      const diff = (dayOffset - currentDay + 7) % 7;
      d.setDate(d.getDate() + diff);
      return Timestamp.fromDate(d);
    };

    const milongas = [
      { v: 'O Nada', d: 1, t: 'Wol Nada', k: '월나다', s: '20:00', e: '24:30', r: 'every' },
      { v: 'O Nada', d: 2, t: 'Solo tango gathering', k: '솔로탱고 정기모임', s: '20:00', e: '23:30', r: 'every' },
      { v: 'O Nada', d: 3, t: 'UNO', k: '우노 (1주)', s: '20:00', e: '24:00', r: '1st' },
      { v: 'O Nada', d: 3, t: 'In the Mood for Tango', k: '인 더 무드 포 탱고', s: '20:00', e: '24:00', r: 'every' },
      { v: 'O Nada', d: 4, t: 'La Noche Mil', k: '라 노체 밀', s: '20:00', e: '24:00', r: 'every' },
      { v: 'O Nada', d: 5, t: 'Geum Nada', k: '금나다 (1주)', s: '21:00', e: '02:00', r: '1st' },
      { v: 'O Nada', d: 5, t: 'Bul Geum', k: '불금', s: '21:00', e: '02:00', r: 'every' },
      { v: 'O Nada', d: 6, t: 'OPPA Mil', k: '오빠밀', s: '16:30', e: '20:00', r: 'every' },
      { v: 'O Nada', d: 6, t: 'To Nada', k: '투나다', s: '21:00', e: '03:00', r: 'every' },
      { v: 'O Nada', d: 0, t: 'Casita', k: '카시타', s: '14:00', e: '18:00', r: 'every' },
      { v: 'O Nada', d: 0, t: 'Mil Mil', k: '밀밀', s: '14:00', e: '18:00', r: 'every' },
      { v: 'O Nada', d: 0, t: 'HappG Mil', k: '헤피지 밀 (3주)', s: '19:00', e: '24:00', r: '3rd' },

      { v: 'Ocho', d: 1, t: 'Mucho Mil', k: '무초밀', s: '20:00', e: '24:00', r: 'every' },
      { v: 'Ocho', d: 2, t: 'CASA', k: '까사', s: '20:00', e: '24:00', r: 'every' },
      { v: 'Ocho', d: 3, t: 'Su Eight Mil', k: '슈에잇밀', s: '20:00', e: '24:00', r: 'every' },
      { v: 'Ocho', d: 4, t: 'Seoul Mil', k: '서울밀', s: '20:00', e: '24:30', r: 'every' },
      { v: 'Ocho', d: 5, t: 'Club Gricel', k: '클럽 그리셀', s: '20:00', e: '02:00', r: 'every' },
      { v: 'Ocho', d: 6, t: 'To IF Mil', k: '투이프밀', s: '14:00', e: '18:00', r: 'every' },
      { v: 'Ocho', d: 6, t: 'To Eight Mil', k: '투에잇밀 (1주)', s: '14:00', e: '18:00', r: '1st' },
      { v: 'Ocho', d: 6, t: 'Loca', k: '로까', s: '20:00', e: '02:00', r: 'every' },
      { v: 'Ocho', d: 0, t: 'Il Luminoso', k: '일 루미노소', s: '14:00', e: '18:00', r: 'every' },
      { v: 'Ocho', d: 0, t: 'Tanto Loco', k: '딴또 로꼬 (1주)', s: '14:00', e: '18:00', r: '1st' },
      { v: 'Ocho', d: 0, t: 'Jjin Mil', k: '찐밀 (2주)', s: '14:00', e: '18:00', r: '2nd' },
      { v: 'Ocho', d: 0, t: 'Camelia', k: '카멜리아 (3주)', s: '14:00', e: '18:00', r: '3rd' },
      { v: 'Ocho', d: 0, t: 'Me Mil', k: '미밀 (4주)', s: '19:00', e: '24:00', r: '4th' },

      { v: 'La Ventana', d: 2, t: 'Fire', k: '파이어', s: '20:30', e: '24:00', r: 'every' },
      { v: 'La Ventana', d: 4, t: 'Mok Dulce', k: '목둘세', s: '20:00', e: '24:00', r: 'every' },
      { v: 'La Ventana', d: 5, t: 'Labios', k: '라비오스 (2/3주)', s: '20:00', e: '24:00', r: '2nd' },
      { v: 'La Ventana', d: 0, t: 'Sueño Dulce', k: '수에뇨 둘세', s: '19:00', e: '23:00', r: 'every' },

      { v: 'Pista', d: 4, t: 'Crew Mil', k: '크루밀', s: '20:30', e: '23:00', r: 'every' },
      { v: 'Pista', d: 5, t: 'HappG Mil', k: '헤피지 밀 (1주)', s: '20:00', e: '02:00', r: '1st' },
      { v: 'Pista', d: 6, t: 'The PISTA', k: '더 피스타', s: '19:00', e: '24:00', r: 'every' },
      { v: 'Pista', d: 0, t: 'El Arranque', k: '엘 아란케', s: '14:00', e: '18:00', r: 'every' },

      { v: 'EnPaz', d: 1, t: 'Wol Luminoso', k: '월 루미노소', s: '19:30', e: '23:30', r: 'every' },
      { v: 'EnPaz', d: 3, t: 'Camelia', k: '카멜리아', s: '19:30', e: '23:30', r: 'every' },
      { v: 'EnPaz', d: 5, t: 'Vida Mia', k: '비다 미아', s: '19:00', e: '23:00', r: 'every' },
      { v: 'EnPaz', d: 6, t: 'RoRa Mil', k: '로라밀 (1주)', s: '19:00', e: '23:00', r: '1st' },
      { v: 'EnPaz', d: 6, t: 'Volver', k: '볼베르', s: '19:00', e: '23:00', r: 'every' },
      { v: 'EnPaz', d: 0, t: 'Salida Mil', k: '쌀리다 밀', s: '19:00', e: '23:00', r: 'every' }
    ];

    try {
      // 1. Cleanup old wrong collection if any? No, let's just use the correct one
      const socialCol = collection(db, "socials"); 
      
      // Clear existing in /socials to avoid duplicates before seeding
      const existing = await getDocs(socialCol);
      for (const d of existing.docs) {
        if (d.data().organizerId === 'admin_seeding') await deleteDoc(d.ref);
      }
      addLog('Cleaned up previous seeding metadata.');

      for (const m of milongas) {
        await addDoc(socialCol, {
          type: 'regular',
          title: m.k,
          titleEn: m.t,
          venueName: m.v,
          venueId: 'v_manual',
          organizerId: 'admin_seeding',
          organizerName: 'WoC Heritage',
          startTime: m.s,
          endTime: m.e,
          dayOfWeek: m.d,
          recurrence: m.r,
          date: getNextDate(m.d),
          createdAt: Timestamp.now(),
          imageUrl: `https://images.unsplash.com/photo-1542314831-068cd1dbf?auto=format&fit=crop&q=80&w=800` // Better random placeholder
        });
        addLog(`Added to /socials: ${m.k} at ${m.v}`);
      }
      addLog('All data pushed to /socials collection!');
    } catch (e: any) {
      addLog('Error: ' + e.message);
    }
  };

  return (
    <div className="p-10 font-mono text-xs text-left">
      <h1 className="text-xl font-bold mb-4">Corrected Seiding (/socials)</h1>
      <button onClick={runSync} className="bg-red-600 text-white px-4 py-2 rounded mb-4">Fix & Push Data</button>
      <div className="bg-gray-100 p-4 rounded h-96 overflow-y-auto">
        {logs.map((l, i) => <div key={i}>{l}</div>)}
      </div>
    </div>
  );
}
