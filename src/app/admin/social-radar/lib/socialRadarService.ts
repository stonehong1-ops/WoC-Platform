import { db } from '@/lib/firebase/clientApp';
import { collection, doc, updateDoc, getDocs, query, orderBy, getDoc, addDoc } from 'firebase/firestore';
import { SocialRadarCandidate } from '../types';

const COLLECTION_NAME = 'socialRadarCandidates';

export const socialRadarService = {
  /**
   * Fetch all candidates from Firestore
   */
  async getCandidates(): Promise<SocialRadarCandidate[]> {
    const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as SocialRadarCandidate));
  },

  /**
   * Update candidate status
   */
  async updateStatus(
    candidateId: string,
    status: SocialRadarCandidate['handoffStatus']
  ): Promise<void> {
    const ref = doc(db, COLLECTION_NAME, candidateId);
    await updateDoc(ref, {
      handoffStatus: status,
      updatedAt: new Date()
    });
  },

  /**
   * Send a candidate to Antigravity (Handoff Task creation)
   */
  async handoffToAntigravity(candidateId: string): Promise<{ success: boolean; error?: string; warning?: string }> {
    try {
      const response = await fetch('/api/admin/social-radar/handoff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId })
      });
      const data = await response.json();
      return {
        success: response.ok,
        error: data.error,
        warning: data.warning
      };
    } catch (err: any) {
      console.error('Failed to handoff candidate:', err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Analyze raw text or URL via Server API
   */
  async analyzeText(payload: { text: string; url?: string }): Promise<SocialRadarCandidate> {
    const response = await fetch('/api/admin/social-radar/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || '분석 중 오류가 발생하였습니다.');
    }
    
    return await response.json();
  }
};
