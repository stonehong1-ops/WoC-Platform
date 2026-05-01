import { NextResponse } from 'next/server';
import { collection, getDocs, addDoc, serverTimestamp, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export async function GET() {
  try {
    const groupsQuery = query(collection(db, 'groups'), where('tags', 'array-contains', 'Studio'));
    const groupDocs = await getDocs(groupsQuery);
    
    let addedCount = 0;

    for (const doc of groupDocs.docs) {
      const groupData = doc.data();
      
      const rentalData = {
        title: groupData.name || '스튜디오',
        description: groupData.description || '쾌적한 댄스 스튜디오입니다.',
        location: groupData.description?.includes('마포구') ? '마포구' : 
                 groupData.description?.includes('강남구') ? '강남구' :
                 groupData.description?.includes('성동구') ? '성동구' :
                 groupData.description?.includes('해운대구') ? '해운대구' :
                 groupData.description?.includes('유성구') ? '유성구' :
                 groupData.description?.includes('부산진구') ? '부산진구' : '서울',
        address: groupData.description?.split('위치한')?.[0]?.trim() || '상세주소 미정',
        category: '댄스 스튜디오',
        pricePerHour: 15000,
        minHours: 2,
        facilities: ['전면 거울', '블루투스 오디오', '정수기', '마루 바닥'],
        rules: '실내 전용 운동화(댄스화) 착용 필수, 음식물 반입 금지',
        hostId: groupData.ownerId || 'system_admin',
        images: [groupData.coverImage || 'https://images.unsplash.com/photo-1547153760-18fc86324498?q=80&w=600'],
        regularClasses: [],
        likesCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await addDoc(collection(db, 'rental_spaces'), rentalData);
      addedCount++;
    }
    
    return NextResponse.json({ success: true, count: addedCount, message: `Seeded ${addedCount} rentals.` });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
