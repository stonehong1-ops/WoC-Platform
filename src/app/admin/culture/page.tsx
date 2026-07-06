'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase/clientApp';
import { collection, getDocs, query, where, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { getSafeStorageUrl } from '@/lib/utils/storageUtils';

const CATEGORIES = [
  { id: 'focus', name: 'FOCUS (포커스)' },
  { id: 'tangotoon', name: '가비의 탱고툰' },
  { id: 'etiquette', name: '밀롱가 에티켓' },
  { id: 'music365', name: '탱고뮤직 365' },
  { id: 'travel', name: '베토의 탱고여행' },
  { id: 'history', name: '탱고의 역사 리뷰' }
];

export default function CultureCMSPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState('focus');
  const [contents, setContents] = useState<any[]>([]);

  // 콘텐츠 작성/수정 Form 상태 변수들
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [titleNative, setTitleNative] = useState('');
  const [keyword, setKeyword] = useState('');
  const [keywordNative, setKeywordNative] = useState('');
  const [desc, setDesc] = useState('');
  const [descNative, setDescNative] = useState('');
  const [contentBody, setContentBody] = useState('');
  const [contentBodyNative, setContentBodyNative] = useState('');
  
  // 다중 이미지 등록 상태 변수들
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  // 로그인 인증 처리
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === '1234') {
      setIsAuthenticated(true);
    } else {
      alert('비밀번호가 일치하지 않습니다.');
    }
  };

  // 활성 탭 데이터 패치
  const fetchContents = async () => {
    try {
      const q = query(
        collection(db, 'culture_contents'),
        where('category', '==', activeTab)
      );
      const snap = await getDocs(q);
      let list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      let seeded = false;

      // focus 카테고리 시드 개별 무결성 동기화 (자가 치유 시딩)
      if (activeTab === 'focus') {
        const hasSafeFloor = list.some((item: any) => item.title?.includes('Safe Floor'));
        const hasCabeceo = list.some((item: any) => item.title?.includes('Cabeceo'));
        const hasRonda = list.some((item: any) => item.title?.includes('Ronda'));

        seeded = false;

        if (!hasSafeFloor) {
          const seedData = {
            category: 'focus',
            title: 'Safe Floor: Zero Tolerance Policy',
            titleNative: 'Safe Floor: 상호 존중 및 성희롱 제로 톨러런스 정책',
            keyword: 'ZERO TOLERANCE',
            keywordNative: '상호존중정책',
            description: 'We believe that every embrace should be built on mutual respect and absolute safety. Our community has no room for harassment of any kind.',
            descriptionNative: '탱고의 본질은 서로에 대한 깊은 존중과 신뢰 위에 세워진 포옹에 있습니다. 우리 커뮤니티는 어떠한 형태의 괴롭힘이나 위해도 용납하지 않습니다.',
            imageUrl: '/life_on_bg.jpg',
            imageUrls: ['/life_on_bg.jpg', 'https://images.unsplash.com/photo-1542332213-31f87348057f?q=80&w=800'],
            content: `Safe Floor: Zero Tolerance Policy

1. Respect the Embrace
Tango is a dance of intimacy and connection. This proximity requires an even higher level of respect and boundaries. Every dancer has the right to feel safe, respected, and in control of their own space.

2. Our Commitment
- Immediate Action: We take all reports seriously and act immediately to protect our members.
- Safe Environment: We foster a culture where everyone feels empowered to speak up.
- Zero Exceptions: Rules apply to everyone, regardless of status or skill level.

3. Let's Keep the Floor Safe Together
By participating in our events, you agree to uphold these standards of conduct.`,
            contentNative: `존중이 없는 곳에, 탱고는 존재할 수 없습니다.

1. 안전한 환경
최근 탱고 씬 내에서 발생하는 성 비위 및 괴롭힘 사건들은 우리가 소중히 여기는 이 춤의 근간을 흔들고 있습니다. 누군가의 고통 위에 피어나는 예술은 없습니다.

2. 안전한 포옹을 위한 우리의 약속
- 무관용 원칙: 성폭력, 성희롱 또는 원치 않는 물리적/언어적 괴롭힘이 확인될 경우, 지위나 직책에 관계없이 커뮤니티에서 즉각적이고 영구적인 제명 조치를 취할 것입니다.
- 피해자 연대 및 보호: 우리는 피해자의 목소리에 귀를 기울이고 2차 가해를 엄격히 금지합니다. 용기 있게 목소리를 낸 분들이 고립되지 않도록 끝까지 연대하겠습니다.
- 명확한 경계 존중: 누군가 거부 의사를 표현할 때, 그것은 즉시 받아들여져야 합니다. 탱고는 합의 하에 이루어지는 교감입니다.

3. 우리는 플로어를 다시 가장 안전한 곳으로 만들어야 합니다.
모두가 두려움 없이 눈을 맞추고 다시 완전한 신뢰 속에서 서로를 안을 수 있는 날을 위해 행동해 주십시오.`,
            order: 1,
            createdAt: new Date()
          };
          await addDoc(collection(db, 'culture_contents'), seedData);
          seeded = true;
        }

        if (!hasCabeceo) {
          const seedData = {
            category: 'focus',
            title: 'How to Cabeceo: The Etiquette of Glance & Connection',
            titleNative: '카베세오 하는 법: 눈빛과 교감의 에티켓',
            keyword: 'CABECEO',
            keywordNative: '카베세오',
            description: 'Tango begins not with a step, but with a gaze. Master the traditional Cabeceo etiquette.',
            descriptionNative: '탱고는 첫 걸음이 아니라, 서로 마주하는 첫 눈빛에서 시작됩니다. 전통적인 카베세오 에티켓을 마스터해 보세요.',
            imageUrl: 'https://images.unsplash.com/photo-1542332213-31f87348057f?q=80&w=800',
            imageUrls: ['https://images.unsplash.com/photo-1542332213-31f87348057f?q=80&w=800', '/life_on_bg.jpg'],
            content: `How to Cabeceo: The Etiquette of Glance & Connection

1. Glance Exchange (Mirada)
It starts by making eye contact with the partner you want to dance with.

2. Nod (Cabeceo)
Once eye contact is established, nod slightly or send a gaze to confirm the other person's consent.

3. Consent
If the partner responds with a smile or a nod, they agree to dance.`,
            contentNative: `탱고에서 까베세오(Cabeceo)는 말없이 눈빛과 고갯짓만으로 춤을 청하고 받아들이는 전통적인 에티켓이자 소통 방식입니다.

1. 까베세오의 기본 원리
- 시선 교환(미라다, Mirada): 춤을 추고 싶은 상대와 눈을 맞추는 것으로 시작합니다.
- 고갯짓(까베세오): 눈이 마주친 후, 살짝 고개를 끄덕이거나 눈빛을 보내 상대의 승낙을 확인합니다.
- 승낙: 상대방도 미소나 고갯짓으로 화답하면 춤을 추기로 한 것입니다.

2. 밀롱가에서의 실전 팁
- 거절 대신 못 본 척: 춤을 추고 싶지 않거나 상황이 여의치 않을 때는 자연스럽게 다른 곳을 바라보며 시선을 피하면 됩니다. 직접적인 거절의 민망함을 피할 수 있는 것이 까베세오의 큰 장점입니다.
- 상대 확인: 눈빛이 교환되었다고 확신하기 전까지는 함부로 자리에서 일어나지 않는 것이 좋습니다. 남자가 여자 앞으로 다가와 직접적으로 춤을 청할 때까지 기다리는 것이 정중합니다.`,
            order: 2,
            createdAt: new Date()
          };
          await addDoc(collection(db, 'culture_contents'), seedData);
          seeded = true;
        }

        if (!hasRonda) {
          const seedData = {
            category: 'focus',
            title: 'Milonga Ronda & Floor Manners Guidelines',
            titleNative: '밀롱가 론다와 플로어 매너 가이드라인',
            keyword: 'RONDA MANNER',
            keywordNative: '론다매너',
            description: 'Keep the flow of Ronda and respect the shared space for a safe tango experience.',
            descriptionNative: '밀롱가 플로어의 론다 흐름을 지키고, 안전한 탱고 감상을 위해 공유된 공간을 상호 존중하십시오.',
            imageUrl: 'https://images.unsplash.com/photo-1508807526345-15e9b5f4eaff?q=80&w=1200',
            imageUrls: ['https://images.unsplash.com/photo-1508807526345-15e9b5f4eaff?q=80&w=1200'],
            content: `Milonga Ronda & Floor Manners Guidelines

1. Respect the Ronda Flow
Keep a safe distance from the couple in front of you and keep the counter-clockwise flow steady. Avoid walking backwards or blocking the flow with excessive moves.

2. Floor Manners
- Observe the flow even while waiting on the side.
- Avoid teaching or giving feedback while on the dance floor.`,
            contentNative: `서로의 즐겁고 안전한 춤을 위해 밀롱가 플로어에서 반드시 지켜야 할 론다와 매너 수칙입니다.

1. 론다(Ronda) 질서 지키기
- 시선을 마주하며 앞선 커플과의 안전 거리를 확보하고 시계 반대 방향의 흐름을 일정하게 유지합니다.
- 임의로 뒤로 걷거나 흐름을 가로막는 무리한 동작은 지양합니다.

2. 플로어 매너
- 춤을 추지 않는 대기 상태에서도 플로어의 전반적인 흐름을 바라보며 파악합니다.
- 플로어 위에서는 서로 동작을 가르치거나 피드백을 주는 행위를 삼가합니다.`,
            order: 3,
            createdAt: new Date()
          };
          await addDoc(collection(db, 'culture_contents'), seedData);
          seeded = true;
        }

        if (seeded) {
          const reSnap = await getDocs(q);
          list = reSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        }
      } else if (activeTab === 'etiquette') {
        if (list.length === 0) {
          const etiquetteItems = [
            {
              order: 1,
              title: '1. How to Cabeceo',
              titleNative: '1. 까베세오 하는 법',
              keyword: 'ETIQUETTE',
              keywordNative: '에티켓',
              description: 'The starting point of tango connection: Gaze and nod.',
              descriptionNative: '탱고 커넥션의 출발점: 시선 맞추기와 가벼운 고갯짓.',
              imageUrls: [
                'https://tangoclass.co.kr/wp-content/uploads/2026/06/Cabeceo1.jpg',
                'https://tangoclass.co.kr/wp-content/uploads/2026/06/Cabeceo2.jpg',
                'https://tangoclass.co.kr/wp-content/uploads/2026/06/Cabeceo3.jpg',
                'https://tangoclass.co.kr/wp-content/uploads/2026/06/Cabeceo4.jpg'
              ],
              content: 'Learn the basics of traditional invitation.',
              contentNative: '눈빛으로 춤을 청하고 답하는 전통적인 커뮤니케이션입니다.'
            },
            {
              order: 2,
              title: '2. Decline with Ignorance',
              titleNative: '2. 거절 대신 못본척',
              keyword: 'ETIQUETTE',
              keywordNative: '에티켓',
              description: 'Politely decline without direct embarrassment.',
              descriptionNative: '직접적인 민망함 없이 시선을 돌려 자연스럽게 청함을 사양해 보세요.',
              imageUrls: [
                'https://tangoclass.co.kr/wp-content/uploads/2026/06/Rejection1.jpg',
                'https://tangoclass.co.kr/wp-content/uploads/2026/06/Rejection2.jpg',
                'https://tangoclass.co.kr/wp-content/uploads/2026/06/Rejection3.jpg',
                'https://tangoclass.co.kr/wp-content/uploads/2026/06/Rejection4.jpg'
              ],
              content: 'A natural way to skip a tanda.',
              contentNative: '눈을 마주치지 않고 딴 곳을 봄으로써 정중하고 깔끔하게 춤 신청을 패스할 수 있습니다.'
            },
            {
              order: 3,
              title: '3. Do Not Stand Up First',
              titleNative: '3. 먼저 일어나지 마세요',
              keyword: 'ETIQUETTE',
              keywordNative: '에티켓',
              description: 'Wait for direct confirmation before standing up.',
              descriptionNative: '시선이 완벽하게 확인되어 남자가 다가올 때까지 차분히 앉아서 기다리는 매너.',
              imageUrls: [
                'https://tangoclass.co.kr/wp-content/uploads/2026/06/Stand1.jpg',
                'https://tangoclass.co.kr/wp-content/uploads/2026/06/Stand2.jpg',
                'https://tangoclass.co.kr/wp-content/uploads/2026/06/Stand3.jpg',
                'https://tangoclass.co.kr/wp-content/uploads/2026/06/Stand4.jpg'
              ],
              content: 'Prevent awkward mistakes.',
              contentNative: '섣불리 먼저 일어나면 옆 사람에게 청한 시선과 꼬여서 서로 민망한 상황이 생길 수 있습니다.'
            },
            {
              order: 4,
              title: '4. How to Avoid Awkwardness',
              titleNative: '4. 민망함을 피하는 법',
              keyword: 'ETIQUETTE',
              keywordNative: '에티켓',
              description: 'Keep the distance and confirm step-by-step.',
              descriptionNative: '눈빛이 100% 매칭될 때까지 천천히 단계를 밟아가며 확인하는 습관.',
              imageUrls: [
                'https://tangoclass.co.kr/wp-content/uploads/2026/06/Avoid-Awkward1.jpg',
                'https://tangoclass.co.kr/wp-content/uploads/2026/06/Avoid-Awkward2.jpg',
                'https://tangoclass.co.kr/wp-content/uploads/2026/06/Avoid-Awkward3.jpg',
                'https://tangoclass.co.kr/wp-content/uploads/2026/06/Avoid-Awkward4.jpg'
              ],
              content: 'Safety measures for connection.',
              contentNative: '정확한 교감 신호를 통해 불필요한 마찰을 줄이고 모두가 기분 좋은 밀롱가를 만드는 지혜.'
            },
            {
              order: 5,
              title: '5. Next Time, Not Now',
              titleNative: '5. 지금 말고 나중에',
              keyword: 'ETIQUETTE',
              keywordNative: '에티켓',
              description: 'Let them know you want to dance later.',
              descriptionNative: '지금은 휴식이 필요하지만, 다음 탄다에는 기쁘게 함께 춤출 것을 넌지시 표시하기.',
              imageUrls: [
                'https://tangoclass.co.kr/wp-content/uploads/2026/06/Right-Tanda1.jpg',
                'https://tangoclass.co.kr/wp-content/uploads/2026/06/Right-Tanda2.jpg',
                'https://tangoclass.co.kr/wp-content/uploads/2026/06/Right-Tanda3.jpg',
                'https://tangoclass.co.kr/wp-content/uploads/2026/06/Right-Tanda4.jpg'
              ],
              content: 'Manage your energy and connections.',
              contentNative: '체력이 다했거나 아끼고 싶을 때는 다음 기회를 암시하며 상대를 존중하며 사양합니다.'
            },
            {
              order: 6,
              title: '6. The Perfect Angle',
              titleNative: '6. 바로 이 각도',
              keyword: 'ETIQUETTE',
              keywordNative: '에티켓',
              description: 'Perfect line of sight for Cabeceo.',
              descriptionNative: '상대방의 론다와 시야각을 배려해 시선이 가장 편안하게 닿을 수 있는 완벽한 각도 찾기.',
              imageUrls: [
                'https://tangoclass.co.kr/wp-content/uploads/2026/06/Right-Angle1.jpg',
                'https://tangoclass.co.kr/wp-content/uploads/2026/06/Right-Angle2.jpg',
                'https://tangoclass.co.kr/wp-content/uploads/2026/06/Right-Angle3.jpg',
                'https://tangoclass.co.kr/wp-content/uploads/2026/06/Right-Angle4.jpg'
              ],
              content: 'Angle of interaction.',
              contentNative: '시선이 마주하기 편하도록 몸의 방향이나 각도를 자연스럽게 매만지는 숨은 에티켓 스펙.'
            },
            {
              order: 7,
              title: '7. Too Much Pressure',
              titleNative: '7. 너무 부담스러워요',
              keyword: 'ETIQUETTE',
              keywordNative: '에티켓',
              description: 'Avoid staring or forcing connections.',
              descriptionNative: '부담스러운 뚫어질 듯한 응시나 춤을 강요하는 시선은 상대에게 불편을 줍니다.',
              imageUrls: [
                'https://tangoclass.co.kr/wp-content/uploads/2026/06/Mirada1.jpg',
                'https://tangoclass.co.kr/wp-content/uploads/2026/06/Mirada2.jpg',
                'https://tangoclass.co.kr/wp-content/uploads/2026/06/Mirada3.jpg',
                'https://tangoclass.co.kr/wp-content/uploads/2026/06/Mirada4.jpg'
              ],
              content: 'Respect personal space.',
              contentNative: '은근하고 자연스러운 시선이 아닌, 레이저를 쏘듯 쳐다보는 강압적인 미라다는 피해야 합니다.'
            },
            {
              order: 8,
              title: '8. This Moment, You',
              titleNative: '8. 이 순간, 바로 당신',
              keyword: 'ETIQUETTE',
              keywordNative: '에티켓',
              description: 'Finding the exact connection partner.',
              descriptionNative: '수많은 밀롱가의 군중 속에서 서로의 파동과 눈빛이 단 한 번에 일치되는 감동의 찰나.',
              imageUrls: [
                'https://tangoclass.co.kr/wp-content/uploads/2026/06/Right-Person1.jpg',
                'https://tangoclass.co.kr/wp-content/uploads/2026/06/Right-Person2.jpg',
                'https://tangoclass.co.kr/wp-content/uploads/2026/06/Right-Person3.jpg',
                'https://tangoclass.co.kr/wp-content/uploads/2026/06/Right-Person4.jpg'
              ],
              content: 'The magic connection of gaze.',
              contentNative: '서로가 원하는 춤의 주파수가 맞아떨어지는 아름다운 밀롱가의 순간을 선사합니다.'
            },
            {
              order: 9,
              title: '9. Power of Positivity',
              titleNative: '9. 긍정의 힘!',
              keyword: 'ETIQUETTE',
              keywordNative: '에티켓',
              description: 'Keep smiling and enjoy the waiting.',
              descriptionNative: '지금 당장 춤을 추지 않더라도, 플로어를 감상하며 다음 기회를 즐겁게 준비하는 여유.',
              imageUrls: [
                'https://tangoclass.co.kr/wp-content/uploads/2026/06/Waiting1.jpg',
                'https://tangoclass.co.kr/wp-content/uploads/2026/06/Waiting2.jpg',
                'https://tangoclass.co.kr/wp-content/uploads/2026/06/Waiting3.jpg',
                'https://tangoclass.co.kr/wp-content/uploads/2026/06/Waiting4.jpg'
              ],
              content: 'Patience and smile.',
              contentNative: '밀롱가에 앉아있는 대기 시간조차 음악을 듣고 교류를 기쁘게 여기는 긍정의 마인드.'
            },
            {
              order: 10,
              title: '10. Ronda Guardians',
              titleNative: '10. 여자는 론다 지키미',
              keyword: 'ETIQUETTE',
              keywordNative: '에티켓',
              description: 'Observe and respect Ronda from the seats.',
              descriptionNative: '춤을 직접 추지 않더라도, 플로어 론다의 흐름과 공간을 소중히 지키고 관찰하는 안목.',
              imageUrls: [
                'https://tangoclass.co.kr/wp-content/uploads/2026/06/Observe1.jpg',
                'https://tangoclass.co.kr/wp-content/uploads/2026/06/Observe2.jpg',
                'https://tangoclass.co.kr/wp-content/uploads/2026/06/Observe3.jpg',
                'https://tangoclass.co.kr/wp-content/uploads/2026/06/Observe4.jpg'
              ],
              content: 'Protect the flow of tango floor.',
              contentNative: '자리에 앉아 흐름을 면밀히 바라봄으로써, 플로어 위 댄서들이 완전한 신뢰 속에서 춤추게 돕습니다.'
            },
            {
              order: 11,
              title: '11. Glasses',
              titleNative: '11. 안경',
              keyword: 'ETIQUETTE',
              keywordNative: '에티켓',
              description: 'Slight helper for clear gaze connection.',
              descriptionNative: '시력이 좋지 않다면 예쁜 안경이나 렌즈로 상대의 시선과 표정을 더욱 선명히 인식하기.',
              imageUrls: [
                'https://tangoclass.co.kr/wp-content/uploads/2026/06/Glasses1.jpg',
                'https://tangoclass.co.kr/wp-content/uploads/2026/06/Glasses2.jpg',
                'https://tangoclass.co.kr/wp-content/uploads/2026/06/Glasses3.jpg',
                'https://tangoclass.co.kr/wp-content/uploads/2026/06/Glasses4.jpg'
              ],
              content: 'Clear vision for connection.',
              contentNative: '눈이 마주쳤을 때 오해나 착오를 줄여주며, 눈 맞춤의 교감 감각을 정교하게 돕습니다.'
            },
            {
              order: 12,
              title: '12. What Style Do You Prefer?',
              titleNative: '12. 어떤 스타일을 좋아하세요?',
              keyword: 'ETIQUETTE',
              keywordNative: '에티켓',
              description: 'Recognize preferences and dance styles.',
              descriptionNative: '밀롱가에 모인 다양한 댄서들의 취향과 개성을 폭넓게 마주하고 기쁘게 소통하는 방법.',
              imageUrls: [
                'https://tangoclass.co.kr/wp-content/uploads/2026/06/Way1.jpg',
                'https://tangoclass.co.kr/wp-content/uploads/2026/06/Way2.jpg',
                'https://tangoclass.co.kr/wp-content/uploads/2026/06/Way3.jpg',
                'https://tangoclass.co.kr/wp-content/uploads/2026/06/Way4.jpg'
              ],
              content: 'Enjoy diversity on the floor.',
              contentNative: '각자 지닌 춤의 선율과 깊이를 편견 없이 존중하며 서로의 아브라소를 나누어 보세요.'
            }
          ];

          let seededEtiquette = false;
          for (const item of etiquetteItems) {
            const exists = list.some((d: any) => d.titleNative === item.titleNative);
            if (!exists) {
              await addDoc(collection(db, 'culture_contents'), {
                ...item,
                category: 'etiquette',
                imageUrl: item.imageUrls[0],
                createdAt: new Date()
              });
              seededEtiquette = true;
            }
          }
          if (seededEtiquette) {
            seeded = true;
          }
        }

        if (seeded) {
          const reSnap = await getDocs(q);
          list = reSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        }
      }

      list.sort((a: any, b: any) => {
        const orderA = a.order !== undefined ? a.order : 9999;
        const orderB = b.order !== undefined ? b.order : 9999;
        if (orderA !== orderB) return orderA - orderB;
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
      });
      setContents(list);
    } catch (err) {
      console.error('Error fetching contents:', err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchContents();
    }
  }, [isAuthenticated, activeTab]);

  // 다중 이미지 추가
  const addImage = () => {
    if (imageUrlInput.trim()) {
      setImageUrls([...imageUrls, imageUrlInput.trim()]);
      setImageUrlInput('');
    }
  };

  // 다중 이미지 제거
  const removeImage = (idx: number) => {
    setImageUrls(imageUrls.filter((_, i) => i !== idx));
  };

  // 폼 리셋
  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setTitleNative('');
    setKeyword('');
    setKeywordNative('');
    setDesc('');
    setDescNative('');
    setContentBody('');
    setContentBodyNative('');
    setImageUrls([]);
    setImageUrlInput('');
  };

  // 등록 및 수정 저장
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) {
      alert('제목을 입력해 주십시오.');
      return;
    }

    try {
      const docData = {
        category: activeTab,
        title,
        titleNative: titleNative || null,
        keyword: keyword || 'CULTURE',
        keywordNative: keywordNative || null,
        description: desc,
        descriptionNative: descNative || null,
        content: contentBody,
        contentNative: contentBodyNative || null,
        imageUrls: imageUrls,
        imageUrl: imageUrls[0] || '/life_on_bg.jpg', // 첫 이미지를 폴백 대표이미지로 호환
        updatedAt: new Date()
      };

      if (editingId) {
        await updateDoc(doc(db, 'culture_contents', editingId), docData);
        alert('성공적으로 수정되었습니다.');
      } else {
        const nextOrder = contents.length > 0 ? Math.max(...contents.map(x => x.order || 0)) + 1 : 1;
        await addDoc(collection(db, 'culture_contents'), {
          ...docData,
          order: nextOrder,
          createdAt: new Date()
        });
        alert('성공적으로 등록되었습니다.');
      }
      resetForm();
      fetchContents();
    } catch (err) {
      console.error('Error saving content:', err);
      alert('저장 중 오류가 발생했습니다.');
    }
  };

  // 편집 세팅
  const startEdit = (item: any) => {
    setEditingId(item.id);
    setTitle(item.title || '');
    setTitleNative(item.titleNative || '');
    setKeyword(item.keyword || '');
    setKeywordNative(item.keywordNative || '');
    setDesc(item.description || '');
    setDescNative(item.descriptionNative || '');
    setContentBody(item.content || '');
    setContentBodyNative(item.contentNative || '');
    setImageUrls(item.imageUrls || (item.imageUrl ? [item.imageUrl] : []));
  };

  // 삭제
  const handleDelete = async (id: string) => {
    if (!confirm('정말로 삭제하시겠습니까?')) return;
    try {
      await deleteDoc(doc(db, 'culture_contents', id));
      alert('삭제되었습니다.');
      fetchContents();
    } catch (err) {
      console.error('Error deleting content:', err);
    }
  };

  // 순서 이동 (스왑)
  const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= contents.length) return;

    try {
      const item1 = contents[index];
      const item2 = contents[targetIndex];

      const tempOrder = item1.order !== undefined ? item1.order : index;
      const targetOrder = item2.order !== undefined ? item2.order : targetIndex;

      await updateDoc(doc(db, 'culture_contents', item1.id), { order: targetOrder });
      await updateDoc(doc(db, 'culture_contents', item2.id), { order: tempOrder });

      fetchContents();
    } catch (err) {
      console.error('Error reordering content:', err);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <form onSubmit={handleLogin} className="w-full max-w-sm bg-white rounded-3xl p-8 border border-slate-100 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-[36px]">lock</span>
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-800 font-headline">Culture CMS</h2>
            <p className="text-slate-400 text-sm mt-1">콘텐츠 관리 시스템 비밀번호를 입력해 주십시오.</p>
          </div>
          <input 
            type="password" 
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="비밀번호"
            className="w-full p-3 border border-slate-200 rounded-xl text-center font-bold text-lg tracking-widest focus:outline-primary"
            autoFocus
          />
          <button type="submit" className="w-full py-3.5 bg-primary text-white font-bold rounded-xl hover:bg-primary-dark transition-all border-none cursor-pointer">
            인증 및 진입
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 py-6 px-8 sticky top-0 z-40 shadow-sm">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-[32px]">auto_stories</span>
            <h1 className="text-2xl font-black text-slate-800 font-headline">Culture & Canvas CMS</h1>
          </div>
          <button 
            onClick={() => setIsAuthenticated(false)}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-sm font-bold border-none cursor-pointer"
          >
            로그아웃
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-8 mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Category tabs & List */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Tabs */}
          <div className="flex flex-wrap gap-2 bg-slate-200/60 p-1.5 rounded-2xl">
            {CATEGORIES.map(cat => (
              <button 
                key={cat.id}
                onClick={() => {
                  setActiveTab(cat.id);
                  resetForm();
                }}
                className={`flex-1 min-w-[120px] py-3 text-xs font-bold rounded-xl transition-all border-none cursor-pointer ${activeTab === cat.id ? 'bg-white text-slate-800 shadow' : 'text-slate-500 hover:text-slate-800 bg-transparent'}`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* List Card */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 text-left space-y-4">
            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">list_alt</span>
              연재 리스트 ({contents.length}개)
            </h3>
            
            {contents.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-sm">
                등록된 콘텐츠가 없습니다. 우측 폼에서 첫 연재를 등록해 주십시오.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {contents.map((item, idx) => (
                  <div key={item.id} className="flex justify-between items-center py-4 gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                        <img 
                          src={getSafeStorageUrl(item.imageUrl || (item.imageUrls && item.imageUrls[0]) || '/life_on_bg.jpg')} 
                          className="w-full h-full object-cover"
                          alt="Thumbnail"
                        />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] font-bold text-primary bg-primary/5 px-2 py-0.5 rounded uppercase tracking-wider">{item.keyword || 'INFO'}</span>
                        <h4 className="font-bold text-slate-800 text-sm mt-1 truncate">{item.titleNative || item.title}</h4>
                        <p className="text-slate-400 text-xs truncate mt-0.5">{item.descriptionNative || item.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button 
                        onClick={() => handleMoveOrder(idx, 'up')}
                        disabled={idx === 0}
                        className="p-2 bg-slate-50 hover:bg-slate-100 disabled:opacity-20 rounded-lg text-slate-600 border border-slate-200 cursor-pointer text-xs"
                      >
                        ▲
                      </button>
                      <button 
                        onClick={() => handleMoveOrder(idx, 'down')}
                        disabled={idx === contents.length - 1}
                        className="p-2 bg-slate-50 hover:bg-slate-100 disabled:opacity-20 rounded-lg text-slate-600 border border-slate-200 cursor-pointer text-xs"
                      >
                        ▼
                      </button>
                      <button 
                        onClick={() => startEdit(item)}
                        className="p-2 px-3 bg-amber-50 hover:bg-amber-100 text-amber-600 border border-amber-200 rounded-lg text-xs font-bold cursor-pointer"
                      >
                        수정
                      </button>
                      <button 
                        onClick={() => handleDelete(item.id)}
                        className="p-2 px-3 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg text-xs font-bold cursor-pointer"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="lg:col-span-1">
          <form onSubmit={handleSave} className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 text-left space-y-6 sticky top-28">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">edit_note</span>
                {editingId ? '연재물 수정' : '신규 연재 등록'}
              </h3>
              {editingId && (
                <button 
                  type="button" 
                  onClick={resetForm}
                  className="text-slate-400 hover:text-slate-600 text-xs font-bold bg-transparent border-none cursor-pointer"
                >
                  취소
                </button>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-500 mb-1">제목 (English)</label>
                <input 
                  type="text" 
                  value={title} 
                  onChange={e => setTitle(e.target.value)} 
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-sm" 
                  placeholder="e.g. Safe Floor Policy"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-500 mb-1">제목 (한글)</label>
                <input 
                  type="text" 
                  value={titleNative} 
                  onChange={e => setTitleNative(e.target.value)} 
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-sm" 
                  placeholder="예: 안전한 플로어 가이드라인"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-slate-500 mb-1">태그키워드 (EN)</label>
                  <input 
                    type="text" 
                    value={keyword} 
                    onChange={e => setKeyword(e.target.value)} 
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-sm" 
                    placeholder="e.g. FOCUS"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 mb-1">태그키워드 (KR)</label>
                  <input 
                    type="text" 
                    value={keywordNative} 
                    onChange={e => setKeywordNative(e.target.value)} 
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-sm" 
                    placeholder="예: 포커스"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-500 mb-1">요약 설명 (English)</label>
                <input 
                  type="text" 
                  value={desc} 
                  onChange={e => setDesc(e.target.value)} 
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-sm" 
                  placeholder="Zero tolerance policy description..."
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-500 mb-1">요약 설명 (한글)</label>
                <input 
                  type="text" 
                  value={descNative} 
                  onChange={e => setDescNative(e.target.value)} 
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-sm" 
                  placeholder="한글 설명 요약..."
                />
              </div>

              {/* Multiple Images Array Editor */}
              <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50 space-y-3">
                <label className="block text-xs font-black text-slate-500">다중 이미지 컬렉션 ({imageUrls.length}장)</label>
                
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={imageUrlInput} 
                    onChange={e => setImageUrlInput(e.target.value)}
                    placeholder="이미지 주소 (https://...)" 
                    className="flex-1 p-2 border border-slate-200 rounded-lg text-xs"
                  />
                  <button 
                    type="button" 
                    onClick={addImage}
                    className="px-3 bg-slate-800 text-white font-bold rounded-lg text-xs border-none cursor-pointer"
                  >
                    추가
                  </button>
                </div>

                {imageUrls.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 pt-2">
                    {imageUrls.map((url, i) => (
                      <div key={i} className="relative w-full h-12 rounded-lg overflow-hidden border border-slate-200 group bg-slate-200">
                        <img src={getSafeStorageUrl(url)} className="w-full h-full object-cover" alt="slide"/>
                        <button 
                          type="button"
                          onClick={() => removeImage(i)}
                          className="absolute inset-0 bg-red-600/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity border-none cursor-pointer text-[10px] font-bold"
                        >
                          삭제
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-black text-slate-500 mb-1">본문 내용 (English)</label>
                <textarea 
                  value={contentBody} 
                  onChange={e => setContentBody(e.target.value)} 
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-sm h-32" 
                  placeholder="Content details..."
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-500 mb-1">본문 내용 (한글)</label>
                <textarea 
                  value={contentBodyNative} 
                  onChange={e => setContentBodyNative(e.target.value)} 
                  className="w-full p-2.5 border border-slate-200 rounded-xl text-sm h-32" 
                  placeholder="한글 상세 내용..."
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="w-full py-3.5 bg-primary text-white font-black rounded-xl hover:bg-primary-dark transition-all border-none cursor-pointer shadow-lg shadow-primary/20"
            >
              {editingId ? '수정 내용 반영' : '새 연재물 저장 및 배포'}
            </button>
          </form>
        </div>

      </main>
    </div>
  );
}
