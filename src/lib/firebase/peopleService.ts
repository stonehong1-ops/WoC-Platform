import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Person } from '@/types/people';

const COLLECTION = 'people';

function toData(p: Partial<Person>) {
  return {
    ...p,
    updatedAt: serverTimestamp(),
  };
}

export const peopleService = {
  /** 실시간 목록 구독 */
  subscribe(cb: (items: Person[]) => void) {
    const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snap) => {
      const items = snap.docs.map((d) => {
        const data = d.data();
        return {
          ...data,
          id: d.id,
          createdAt: data.createdAt instanceof Timestamp
            ? data.createdAt.toDate().toISOString()
            : data.createdAt,
          updatedAt: data.updatedAt instanceof Timestamp
            ? data.updatedAt.toDate().toISOString()
            : data.updatedAt,
        } as Person;
      });
      cb(items);
    });
  },

  /** 단건 구독 */
  subscribeOne(id: string, cb: (item: Person | null) => void) {
    return onSnapshot(doc(db, COLLECTION, id), (snap) => {
      if (!snap.exists()) { cb(null); return; }
      const data = snap.data();
      cb({
        ...data,
        id: snap.id,
        createdAt: data.createdAt instanceof Timestamp
          ? data.createdAt.toDate().toISOString()
          : data.createdAt,
        updatedAt: data.updatedAt instanceof Timestamp
          ? data.updatedAt.toDate().toISOString()
          : data.updatedAt,
      } as Person);
    });
  },

  /** 추가 */
  async add(data: Omit<Person, 'id' | 'createdAt' | 'updatedAt'>) {
    const ref = await addDoc(collection(db, COLLECTION), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return ref.id;
  },

  /** 수정 */
  async update(id: string, data: Partial<Person>) {
    await updateDoc(doc(db, COLLECTION, id), toData(data));
  },

  /** 삭제 */
  async delete(id: string) {
    await deleteDoc(doc(db, COLLECTION, id));
  },
};

/** ─── 샘플 데이터 ─────────────────────────────────── */
export const SAMPLE_PEOPLE: Omit<Person, 'id'>[] = [
  {
    name: 'Fausto Carpino & Stephanie Fesneau',
    roles: ['Instructor', 'Couple'],
    partnerName: 'Stephanie Fesneau',
    baseCity: 'Sicily',
    baseCountry: 'Italy',
    currentCity: 'Milan',
    currentCountry: 'Italy',
    isLiveNow: true,
    liveStatus: 'MILAN THIS MONTH',
    heroImageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuB3A-3clyTz1foqUQXdFwzp84pJF1zMBspUu5g49if34ODAGr6y4nmrtRfna1yr-thCNqldhwTo0O6tWqRAjK2tpl6EX0CUqJt82fQSAO3nuHaYJxCTbMHwHh1ibp7t0jN7NOWlyvL5iVTJp8wXSX3hYGOTIlZyIyrdyiGeYhGpWXzdhKLjSNO0YyNg-K5Nu9VCpcUA58Yrv6W729r7QvdvHez8Zu9giXDzn1TO1K6sroTmlNIrh9gyRzOJ7E5yDPAnceE1ElNUtqE',
    profilePhotoUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuB3A-3clyTz1foqUQXdFwzp84pJF1zMBspUu5g49if34ODAGr6y4nmrtRfna1yr-thCNqldhwTo0O6tWqRAjK2tpl6EX0CUqJt82fQSAO3nuHaYJxCTbMHwHh1ibp7t0jN7NOWlyvL5iVTJp8wXSX3hYGOTIlZyIyrdyiGeYhGpWXzdhKLjSNO0YyNg-K5Nu9VCpcUA58Yrv6W729r7QvdvHez8Zu9giXDzn1TO1K6sroTmlNIrh9gyRzOJ7E5yDPAnceE1ElNUtqE',
    title: 'Maestros • Tango de Pista',
    bio: 'Professional dancers, teachers and DJs of Argentine Tango. Fausto and Stephanie have been teaching Tango de Pista around the world since 2011, sharing their passion for the authentic social dance with a focus on musicality and connection.',
    languages: ['English', 'Spanish', 'French', 'Italian'],
    bookingNote: 'Open for: Festival Invitations, International Workshops, Private Masterclasses',
    style: 'Tango de Pista',
    partnerSince: '2011',
    achievements: ['World Tango Champions 2012', 'Buenos Aires Festival Headline'],
    activityFlow: [
      {
        status: 'live',
        label: 'LIVE NOW',
        location: 'Milan, Italy',
        title: 'Intensive Masterclass: The Embrace',
        description: 'Teaching advanced students at Centro Tango Milano. Final session concludes May 31.',
      },
      {
        status: 'upcoming',
        label: 'Upcoming',
        location: 'Sicily, Italy',
        title: 'Sicily Tango Holiday',
        description: 'July • Annual summer tango retreat in Sicily with daily workshops and milongas.',
        cta: 'Join the Holiday',
      },
      {
        status: 'past',
        label: 'Winter Cycle',
        location: 'Buenos Aires, Argentina',
        title: 'Homecoming Residency',
        description: 'Dec – Jan. Annual residency at La Nacional milonga including private coaching.',
      },
    ],
    tourStops: [
      { city: 'Milan', country: 'IT', month: 'MAY' },
      { city: 'Sicily', country: 'IT', month: 'JUL' },
      { city: 'Paris', country: 'FR', month: 'SEP' },
    ],
    mediaItems: [
      {
        type: 'VOD',
        title: 'Tango de Pista – The Connection',
        subtitle: 'Live Performance • 2023',
        thumbnailUrl:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuBHOp_AXBXcZoj1Cv_kEyHPI3LgCwfZYKJgcYLurHrZp4M6fbJZeZ3GtXZ5CdpCm-qDgSyk6n83zlB-9kE4N43VcbFLpwixCzKw6n6G_9G6Z1oVzPAP_VysWr_WKblFQgSsZzSjQDB_f_FCsm89-OaInfxnnmzTcGBnx-NzrpcRHbmY53NeBk1VCHfh7yQx5OVXvFYUI7jpeAGGcdRmHIgpGZIyuAgzcaM5u-ToidTOde9GqH9_9TbhxBaUf7I0iz4BWHc293EtTxI',
      },
      {
        type: 'COURSE',
        title: 'The Art of Walking',
        subtitle: 'Instructional • 8 Chapters',
        thumbnailUrl:
          'https://lh3.googleusercontent.com/aida-public/AB6AXuCj9-tWQ-LxyCGLz9vn5wrzBjJtSyoY-g5Ex_A7YrXm3woaECwytYgPJEFtyhQxj2rEO0Fyj8bMNWzsXh-kVE3Oc1USzeM_G4daIII-rHjIVfIHzwtQgxFLnc2YrmbbfzkwA0VARTQRM0PHVPuWby1mSStzlgUK6V_nGIg82tepd-TqHptaBd74CVe_6luci2sSDc4aC_A323GSh0oKDMpv1wg2f-S9-VTlllsydOvnUWF316uxWNjvRBD9E8t1h89LCf6_NhV1vo0',
      },
    ],
    featuredVideoUrls: [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBDNLlIV1zLDIfV0nz3mg_1fstwHg8J2TgVOtfEjsRzcBC0RsD80kZlUjUuvsGaAlGF4xcjvSRWsICJV2-io7S4VYXh1U6TLig8pwI8PnHhKty8RB8UYIkYr_upDfugGdwkjU0ca2BO6lKvNzWGkoqHjuiLjioTRvinSBvWB8iP8CuXcuBCRZT3QKrMT43014Q7LeGBQCsSUAv-waBY42J86n_mDhtyXqPdxahrW4sVsrDhsQDaxutL5NNvQ2JkgKJ9j2WKGArqwdY',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAcaMYwrGLZ1DwjFe4YhN_6oekxx7H7XlgKv4ZDDBN5TfkGHCo93rqHLPh1gzTCTx-opQ1gBMorfZynv-d4BJE9V7kwNclMrEpVxVGX05sfqjN7OwmcDQp8gZeI9lLi4Iqc8UDpYa3Jw_vcVRi7b-CBxW-xdSQeGFvUee8bBgzPSq50mhs9jClqIQ2TLIX4fvcsEjrXgFiLSe2o0Wxl9as4BOHmlUXzHHb7Pt9Mf30jjanfLbRJtKbrgQYuFVUIB48Fb3xy6_7YcII',
    ],
    globalImpact: {
      award: 'World Champions',
      awardSub: 'Buenos Aires 2012',
      org: 'Global Tour',
      orgSub: '30+ Countries',
      classCount: '500+ Masterclasses',
      classReach: 'Teaching dancers across 30+ countries since 2011',
      appearances: '60+ festival appearances worldwide',
    },
    authorId: 'seed',
    authorName: 'Admin',
    createdAt: new Date().toISOString(),
  },
];
