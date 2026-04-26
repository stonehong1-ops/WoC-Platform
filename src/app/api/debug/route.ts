import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase/clientApp';
import { collection, getDocs, doc, updateDoc, query, where } from 'firebase/firestore';

export async function GET() {
  try {
    const q = query(collection(db, 'groups'), where('name', '==', 'freestyle tango'));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return NextResponse.json({ error: 'Group not found' });
    }
    
    const groupDoc = snapshot.docs[0];
    await updateDoc(doc(db, 'groups', groupDoc.id), {
      nativeName: '프리스타일'
    });
    
    return NextResponse.json({ success: true, id: groupDoc.id, updatedNativeName: '프리스타일' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message });
  }
}
