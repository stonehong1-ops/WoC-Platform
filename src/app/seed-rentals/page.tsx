'use client';

import React, { useEffect, useState } from 'react';
import { collection, getDocs, addDoc, serverTimestamp, updateDoc, doc, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

const defaultPalette = {
  tier7: 40000,
  tier6: 35000,
  tier5: 30000,
  tier4: 25000,
  tier3: 20000,
  tier2: 15000,
  tier1: 10000,
};

const generateDefaultTimeGrid = () => {
  const grid: Record<number, string[]> = {};
  for (let day = 0; day <= 6; day++) {
    const isWeekend = day === 5 || day === 6;
    grid[day] = Array(24).fill("tier1").map((_, hour) => {
      if (!isWeekend) {
        if (hour >= 0 && hour < 6) return "tier1";
        if (hour >= 6 && hour < 12) return "tier3";
        if (hour >= 12 && hour < 18) return "tier4";
        return "tier5";
      } else {
        if (hour >= 0 && hour < 6) return "tier3";
        if (hour >= 6 && hour < 12) return "tier5";
        if (hour >= 12 && hour < 18) return "tier6";
        return "tier7";
      }
    });
  }
  return grid;
};

export default function SeedRentalsPage() {
  const [status, setStatus] = useState('Idle');

  useEffect(() => {
    async function seed() {
      try {
        setStatus('Fetching Studio groups...');
        const groupsQuery = query(collection(db, 'groups'), where('tags', 'array-contains', 'Studio'));
        const groupDocs = await getDocs(groupsQuery);
        
        setStatus(`Found ${groupDocs.size} Studio groups. Updating settings and seeding spaces...`);
        
        let seededCount = 0;

        for (const groupDoc of groupDocs.docs) {
          const groupData = groupDoc.data();
          const groupId = groupDoc.id;
          
          // Enable rental service and apply the new 7-tier default setting
          await updateDoc(doc(db, 'groups', groupId), {
            'activeServices.rental': true,
            'rentalSettings': {
              currency: "KRW",
              rentalInfo: groupData.description || '쾌적한 대관 공간입니다.',
              pricePalette: defaultPalette,
              timeGrid: generateDefaultTimeGrid(),
            }
          });

          // Check if a rental_spaces document already exists for this group
          const spacesQuery = query(collection(db, 'rental_spaces'), where('groupId', '==', groupId));
          const existingSpaces = await getDocs(spacesQuery);

          if (existingSpaces.empty) {
            // Create a new rental_spaces document
            const rentalData = {
              groupId: groupId,
              title: (groupData.name || '스튜디오') + ' 대관',
              description: groupData.description || '쾌적한 다목적 공간입니다.',
              location: '서울', 
              address: groupData.description?.split('위치한')?.[0]?.trim() || '서울',
              category: 'Dance Studio',
              pricePerHour: 10000, // Using lowest tier as display base price
              minHours: 1,
              facilities: ['Wi-Fi', '거울', '냉난방기'],
              rules: '실내화 착용 필수, 음식물 반입 금지',
              hostId: groupData.ownerId || 'system_admin',
              images: [groupData.coverImage || 'https://images.unsplash.com/photo-1545041041-893f3c306263?q=80&w=2000&auto=format&fit=crop'],
              regularClasses: [],
              likesCount: 0,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            };
            await addDoc(collection(db, 'rental_spaces'), rentalData);
          } else {
            // Update existing rental space display price
            for (const spaceDoc of existingSpaces.docs) {
              await updateDoc(doc(db, 'rental_spaces', spaceDoc.id), {
                pricePerHour: 10000,
                updatedAt: serverTimestamp()
              });
            }
          }

          seededCount++;
        }
        
        setStatus(`Seeding complete! Updated ${seededCount} Studio groups and ensured rental spaces exist. You can navigate to the Rental list.`);
      } catch (err) {
        console.error(err);
        setStatus('Error: ' + (err instanceof Error ? err.message : String(err)));
      }
    }
    
    seed();
  }, []);

  return (
    <div className="p-10">
      <h1 className="text-2xl font-bold mb-4">Seeding Rental Settings & Spaces</h1>
      <p>{status}</p>
    </div>
  );
}
