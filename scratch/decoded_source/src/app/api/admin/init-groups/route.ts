import { db } from '@/lib/firebase/clientApp';
import { collection, getDocs, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { NextResponse } from 'next/server';

const MANDATORY_FUNCTIONS = [
  'dashboard',
  'feed',
  'live',
  'calendar',
  'members',
  'notice',
  'about',
  'brand-setting',
  'roles-permissions'
];

export async function GET() {
  try {
    const groupsRef = collection(db, 'groups');
    const snapshot = await getDocs(groupsRef);
    
    const results = [];
    
    for (const groupDoc of snapshot.docs) {
      const groupData = groupDoc.data();
      const groupRef = doc(db, 'groups', groupDoc.id);
      
      // Update the functions and order
      // We overwrite completely as requested ("테스트 때문에 추가한거는 모두 삭제")
      await updateDoc(groupRef, {
        selectedFunctions: MANDATORY_FUNCTIONS,
        menuOrder: MANDATORY_FUNCTIONS,
        updatedAt: Timestamp.now()
      });
      
      results.push({ 
        id: groupDoc.id, 
        name: groupData.name || 'Unnamed Group',
        status: 'updated' 
      });
    }
    
    return NextResponse.json({ 
      success: true,
      message: `Successfully initialized ${results.length} groups with mandatory functions.`,
      results 
    });
  } catch (error: any) {
    console.error('Migration Error:', error);
    return NextResponse.json({ 
      success: false,
      error: error.message 
    }, { status: 500 });
  }
}
