import { Timestamp } from 'firebase/firestore';

export type SocialRadarCandidate = {
  id: string;
  sourceType: 'google' | 'facebook_indexed' | 'instagram_indexed' | 'website' | 'manual';
  sourceUrl?: string;
  sourceTitle?: string;
  sourceSnippet?: string;
  sourceText?: string;

  extracted: {
    title?: string;
    titleNative?: string;
    date?: string;
    dayOfWeek?: string; // e.g., "0" (Sunday) ~ "6" (Saturday)
    startTime?: string; // e.g., "19:00"
    endTime?: string;   // e.g., "23:00" or "24:00"
    venue?: string;     // Venue name (text)
    region?: string;    // e.g., "SEOUL", "DAEJEON"
    organizer?: string; // Organizer name (text)
    dj?: string;        // DJ name (text)
    posterUrl?: string;
    description?: string;
  };

  match: {
    status: 'matched' | 'possible_match' | 'new_candidate' | 'unknown';
    socialId?: string;
    socialTitle?: string;
    confidence?: number; // 0 to 100
    reason?: string;
  };

  detectedChanges: {
    poster?: boolean;
    dj?: boolean;
    description?: boolean;
    time?: boolean;
    venue?: boolean;
    newSocial?: boolean;
  };

  confidence: number; // Overall reliability of extraction/match (0 to 100)

  handoffStatus: 'candidate' | 'sent_to_antigravity' | 'applied' | 'ignored' | 'hold';

  createdAt: Timestamp | Date;
  updatedAt?: Timestamp | Date;

  sentAt?: Timestamp | Date;
  appliedAt?: Timestamp | Date;
  reviewedBy?: string;
};

export type SocialRegisterTask = {
  id: string;
  candidateId: string;
  markdownContent: string;
  createdAt: Timestamp | Date;
  status: 'pending' | 'completed' | 'failed';
};
