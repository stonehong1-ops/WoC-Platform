# WoC Platform — Firestore Data Model

> **AI 참조 필수 문서**: 코드 작성 전 반드시 이 파일을 확인하여 컬렉션 간 관계와 FK 방향을 정확히 파악할 것.
> Source of Truth: `src/types/*.ts` + `src/lib/firebase/*Service.ts`

---

## ⚠️ 핵심 원칙 (AI가 반드시 기억해야 할 규칙)

| 규칙 | 내용 |
|------|------|
| **ID 독립성** | `venues.id` ≠ `groups.id`. 각 컬렉션은 Firestore auto-generated ID를 독립적으로 사용. 절대 혼용하지 말 것. |
| **FK 방향** | 항상 자식(child)이 부모(parent)를 참조. `groups.venueId → venues.id` (group이 venue를 참조, venue는 group을 모름) |
| **역방향 조회** | venue로 group 찾기: `query(collection('groups'), where('venueId','==', venue.id))` |
| **서브컬렉션** | member, post, calendarEvent 등은 groups 하위 서브컬렉션으로 존재 |

---

## 📦 컬렉션 전체 목록

```
Firestore Root
├── users/              ← Firebase Auth UID를 문서 ID로 사용
├── groups/             ← 커뮤니티 그룹 (핵심)
│   └── {groupId}/
│       ├── members/        (서브컬렉션)
│       ├── posts/          (서브컬렉션)
│       ├── calendarEvents/ (서브컬렉션)
│       └── classes/        (서브컬렉션, 일부는 group 필드에 내장)
├── venues/             ← 물리적 장소 (지도 마커)
├── socials/            ← 정기/팝업 소셜 이벤트
├── events/             ← 페스티벌/워크숍 등 대형 이벤트
├── feeds/              ← 통합 피드 게시물
├── notifications/      ← 사용자 알림
├── chatRooms/          ← 채팅방
│   └── {roomId}/
│       └── messages/       (서브컬렉션)
├── stays/              ← 숙소 (group이 운영)
├── stay_bookings/      ← 숙소 예약
├── rental_spaces/      ← 대관 공간
├── rental_requests/    ← 대관 신청
├── class_registrations/← 클래스 등록
├── people/             ← 강사/오거나이저 프로필
├── lost_found/         ← 분실물/습득물
├── gallery/            ← 갤러리 (moments)
└── banners/            ← 관리자 배너
```

---

## 🔗 컬렉션 관계도 (ERD)

```
Firebase Auth (users)
       │ uid
       ▼
   users/{uid}                    ← UserProfile
       │ joinedGroups[]           (group ID 배열, 비정규화)
       │
       ├──────────────────────────────────┐
       │                                  │
       ▼ ownerId / members[]              ▼ authorId
   groups/{groupId}              people/{personId}
       │
       ├── venueId ──────────────► venues/{venueId}
       │                               ▲        ▲
       │                               │        │
       │                           socials.venueId
       │                           events.venueId
       │
       ├── [서브컬렉션] members/
       ├── [서브컬렉션] posts/
       ├── [서브컬렉션] calendarEvents/
       ├── [서브컬렉션] classes/
       │
       ├── [1:1] chatRooms/{roomId} (linkedGroupId → groups.id)
       │
       ├── [1:N] stays/           (stay.groupId → groups.id)
       │          └── stay_bookings/ (booking.stayId, booking.groupId)
       │
       ├── [1:N] rental_spaces/   (space.groupId → groups.id)
       │          └── rental_requests/
       │
       └── [1:N] class_registrations/ (reg.groupId → groups.id)
```

---

## 📋 컬렉션별 상세 스펙

### `users/{uid}`
```typescript
UserProfile {
  id: string;           // = Firebase Auth UID
  nickname: string;
  photoURL?: string;
  gender?: string;
  role?: 'leader' | 'follower';
  isInstructor?: boolean;
  isAdmin?: boolean;
  joinedGroups?: string[];  // group ID 배열 (비정규화)
  createdAt, updatedAt
}
```
**⚠️ 주의**: `users.id` = Firebase Auth UID. Firestore document ID도 UID와 동일.

---

### `venues/{venueId}`
```typescript
Venue {
  id: string;           // auto-generated (groups.id와 다름!)
  name: string;
  nameKo?: string;
  types: VenueType[];   // 'Studio'|'Club'|'Academy'|'Shop'|'Cafe'|'Eats'|'Beauty'|'Stay'|'Service'|'Other'
  category: VenueType;  // Primary (지도 필터용)
  address, region, city, district, country
  status: 'active' | 'inactive';
  coordinates: { latitude, longitude }
  societyId?: string;   // 'tango'|'yoga'|... (undefined = tango)
  imageUrl?, rating?, price?, owner?, contact?
  createdAt: Timestamp;
}
```
**⚠️ 주의**: venue는 group을 직접 참조하지 않음. 역방향 조회 필요:
```typescript
// venue로 연결된 group 찾기
query(collection(db, 'groups'), where('venueId', '==', venueId), limit(1))
```

---

### `groups/{groupId}`
```typescript
Group {
  id: string;           // auto-generated (venues.id와 다름!)
  name: string;
  nativeName?: string;
  venueId?: string;     // → venues/{venueId} (FK)
  ownerId?: string;     // → users/{uid} (FK)
  memberCount: number;
  isPublished?: boolean;
  headerThemeColor?: string;
  selectedFunctions?: string[];
  membershipPolicy?: { joinStrategy: 'open'|'approval'|'invite' }
  // ... 기타 메타데이터
}
```

**서브컬렉션:**
```
groups/{groupId}/members/{uid}         ← Member { role, status, joinedAt }
groups/{groupId}/posts/{postId}        ← Post { category, content, author }
groups/{groupId}/calendarEvents/{id}   ← CalendarEvent
groups/{groupId}/classes/{classId}     ← GroupClass (일부는 group.classes[] 필드에 내장)
```

---

### `socials/{socialId}`
```typescript
Social {
  id: string;
  type: 'regular' | 'popup';
  venueId: string;      // → venues/{venueId} (FK, required)
  venueName: string;    // 비정규화
  organizerId: string;  // → users/{uid} (FK)
  dayOfWeek?: number;   // 0-6, regular 전용
  date?: Timestamp;     // popup 전용
  societyId?: string;   // 'tango'|'yoga'|...
  // 서브컬렉션: socialReservations/, socialWeeklyStates/, socialLikes/
}
```
**조회 패턴:**
```typescript
// venue의 socials
where('venueId', '==', venueId)
// group의 socials (group.venueId를 통해 2단계)
const group = await getGroup(groupId);
where('venueId', '==', group.venueId)
```

---

### `events/{eventId}`
```typescript
Event {
  id: string;
  hostId: string;       // → users/{uid} (FK)
  venueId?: string;     // → venues/{venueId} (FK, optional)
  startDate, endDate: Timestamp;
  societyId?: string;
  programs?: EventProgram[];
  pricing?: EventPricing;
  // 서브컬렉션: eventRegistrations/
}
```

---

### `feeds/{postId}`
```typescript
Post (feed) {
  id: string;
  userId: string;       // → users/{uid} (FK)
  targets: string[];    // scopeId 배열 (groupId, 'tango', 'plaza' 등)
  category: string;     // 'plaza'|'group'|'venue'|'event'
  // 서브컬렉션: comments/, reactions/
}
```
**조회 패턴:**
```typescript
// group 피드
where('targets', 'array-contains', groupId)
// plaza (전체 공개)
where('category', '==', 'plaza')
```

---

### `chatRooms/{roomId}`
```typescript
ChatRoom {
  id: string;
  type: 'public'|'private'|'group'|'groups'|'business'|...;
  linkedGroupId?: string;  // → groups/{groupId} (1:1, type='groups' 전용)
  participants: string[];  // user UID 배열
  // 서브컬렉션: messages/
}
```
**⚠️ 주의**: `chatRoom.linkedGroupId` = group chat 연동. group 1개 = chatRoom 1개 (1:1).

---

### `stays/{stayId}`
```typescript
Stay {
  id: string;
  groupId: string;      // → groups/{groupId} (FK, required)
  host: { userId }      // → users/{uid}
  isActive: boolean;
}
```

### `stay_bookings/{bookingId}`
```typescript
StayBooking {
  stayId: string;       // → stays/{stayId} (FK)
  groupId: string;      // → groups/{groupId} (FK, Manager Todo 필터용)
  userId: string;       // → users/{uid} (FK)
  status: StayBookingStatus;
}
```

---

### `rental_spaces/{spaceId}`
```typescript
RentalSpace {
  id: string;
  hostId: string;       // → users/{uid}
  groupId?: string;     // → groups/{groupId} (optional)
}
```

### `rental_requests/{requestId}`
```typescript
RentalRequest {
  spaceId: string;      // → rental_spaces/{spaceId}
  guestId, hostId: string;  // → users/{uid}
  chatRoomId?: string;  // → chatRooms/{roomId}
}
```

---

### `class_registrations/{regId}`
```typescript
ClassRegistration {
  classId: string;      // → groups/{groupId}/classes/{classId}
  groupId: string;      // → groups/{groupId} (FK)
  userId: string;       // → users/{uid} (FK)
  status: 'PAYMENT_PENDING'|'PAYMENT_REPORTED'|'PAYMENT_COMPLETED'|'CANCELED';
}
```

---

### `notifications/{notifId}`
```typescript
Notification {
  targetUserId: string; // → users/{uid} (FK)
  groupId?: string;     // → groups/{groupId} (optional)
  category: 'CLASS'|'STAY'|'SHOP'|'FEED'|'SYSTEM'|'GROUP'|'ADMIN'|'SOCIAL'|'BOOKING';
  createdAt: number | Timestamp;
}
```

---

### `people/{personId}`
```typescript
Person {
  id: string;
  authorId: string;     // → users/{uid} (작성자)
  roles: ('Instructor'|'Organizer'|'Couple'|'Touring'|'Dancer')[];
  // 독립 컬렉션 — group/venue와 직접 FK 없음
}
```

---

### `lost_found/{itemId}`
```typescript
LostFoundItem {
  authorId: string;     // → users/{uid}
  // 독립 컬렉션 — group/venue와 직접 FK 없음
}
```

---

## 🚨 자주 발생하는 실수 패턴 (Anti-Patterns)

### ❌ WRONG: venue ID로 group 조회
```typescript
// venue.id와 group.id는 다름!
groupService.getGroup(venue.id)  // ← 항상 null 반환
```

### ✅ CORRECT: venueId 역방향 쿼리
```typescript
query(collection(db, 'groups'), where('venueId', '==', venue.id), limit(1))
```

---

### ❌ WRONG: group에서 social 직접 조회
```typescript
where('groupId', '==', groupId)  // socials에는 groupId 필드 없음!
```

### ✅ CORRECT: venue를 경유한 2단계 조회
```typescript
const group = await getGroup(groupId);
where('venueId', '==', group.venueId)
```

---

### ❌ WRONG: chatRoom을 group ID로 직접 조회
```typescript
doc(db, 'chatRooms', groupId)  // chatRoom.id ≠ group.id
```

### ✅ CORRECT: linkedGroupId로 쿼리
```typescript
query(collection(db, 'chatRooms'), where('linkedGroupId', '==', groupId))
```

---

## 🗂️ societyId 구분

여러 컬렉션에서 `societyId` 필드로 소사이어티(커뮤니티 종류)를 구분:

| societyId | 의미 |
|-----------|------|
| `undefined` | tango (기본값, 레거시 호환) |
| `'tango'` | 탱고 |
| `'yoga'` | 요가 |
| `'salsa'` | 살사 |

**적용 컬렉션**: `venues`, `events`, `groups` (간접적으로 filtering에 사용)

---

## 📝 서비스 파일 매핑

| 컬렉션 | 서비스 파일 |
|--------|------------|
| groups + 서브컬렉션 | `src/lib/firebase/groupService.ts` |
| venues | `src/lib/firebase/venueService.ts` |
| socials | `src/lib/firebase/socialService.ts` |
| events | `src/lib/firebase/eventService.ts` |
| feeds | `src/lib/firebase/feedService.ts` |
| notifications | `src/lib/firebase/notificationService.ts` |
| chatRooms | `src/lib/firebase/chatService.ts` |
| stays + bookings | `src/lib/firebase/stayService.ts` |
| gallery | `src/lib/firebase/galleryService.ts` |
| people | `src/lib/firebase/peopleService.ts` |
| users | `src/lib/firebase/userService.ts` |

---

*Last updated: 2026-05-16 | 변경 시 types/*.ts 와 함께 동기화 필요*
