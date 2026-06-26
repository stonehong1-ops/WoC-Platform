import { Style, Vendor, Factory, Media, TimelineMessage, STYLE_STATUS } from './types';

// 1. 동대문 실제 스타일의 거래처 (1~30번 지정)
export const mockVendors: Vendor[] = [
  { id: "VEND-101", name: "APM Luxe 2층 어나더 (Another)" },
  { id: "VEND-102", name: "디오트 3층 제이플레이 (J-Play)" },
  { id: "VEND-103", name: "청평화 1층 라벨 (Label)" },
  { id: "VEND-104", name: "APM 1층 비포어 (Before)" },
  { id: "VEND-105", name: "신평화 지하 1층 텐션 (Tension)" },
  { id: "VEND-106", name: "퀸즈스퀘어 3층 아웃핏 (Outfit)" },
  { id: "VEND-107", name: "APM Luxe B1 마일드 (Mild)" },
  ...Array.from({ length: 23 }, (_, i) => ({
    id: `VEND-${108 + i}`,
    name: `동대문 도매 시장 ${108 + i}호점`
  }))
];

// 2. 중국 광저우 실제 봉제 공장 (30~40여 곳)
export const mockFactories: Factory[] = [
  { id: "FACT-31", name: "광저우 하이주구(海珠区) 남방 봉제공장", contact: "+86 138-1234-5678" },
  { id: "FACT-32", name: "광저우 판위구(番禺区) 클래식 셔츠 라인", contact: "+86 139-8765-4321" },
  { id: "FACT-33", name: "광저우 바이윈구(白云区) 테크니컬 우븐공장", contact: "+86 135-2244-6688" },
  { id: "FACT-34", name: "광저우 리완구(荔湾区) 울 헤비 아우터공장", contact: "+86 137-9900-1122" },
  ...Array.from({ length: 8 }, (_, i) => ({
    id: `FACT-${35 + i}`,
    name: `광저우 중다(中大) 시장 연계 제${35 + i} 임가공공장`,
    contact: `+86 130-0000-${9000 + i}`
  }))
];

// 3. 미디어 리소스 독립 데이터 (작업지시서, 디자인 스케치, 샘플 사진 등)
export const mockMedia: Media[] = [
  {
    id: "MEDIA-101",
    styleId: "ST-24001",
    type: "techpack",
    url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    fileName: "ST-24001_피그먼트_가디건_작업지시서_V1.0.pdf",
    uploadedAt: "2026-06-16T10:00:00Z"
  },
  {
    id: "MEDIA-102",
    styleId: "ST-24001",
    type: "image",
    url: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&q=80&w=600",
    fileName: "ST-24001_피그먼트_Charcoal_디자인스케치.jpg",
    uploadedAt: "2026-06-16T10:05:00Z"
  },
  {
    id: "MEDIA-103",
    styleId: "ST-24002",
    type: "techpack",
    url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    fileName: "ST-24002_옥스퍼드_셔츠_작업지시서_V2.1.pdf",
    uploadedAt: "2026-06-16T11:00:00Z"
  },
  {
    id: "MEDIA-104",
    styleId: "ST-24002",
    type: "image",
    url: "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&q=80&w=600",
    fileName: "ST-24002_옥스퍼드_Blue_디자인시안.jpg",
    uploadedAt: "2026-06-16T11:02:00Z"
  },
  {
    id: "MEDIA-105",
    styleId: "ST-24003",
    type: "sample",
    url: "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&q=80&w=600",
    fileName: "ST-24003_나일론_카고팬츠_1차실물샘플.jpg",
    uploadedAt: "2026-06-16T12:00:00Z"
  },
  {
    id: "MEDIA-106",
    styleId: "ST-24003",
    type: "video",
    url: "https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-light-holding-jacket-40436-large.mp4",
    fileName: "ST-24003_모델착장_동영상.mp4",
    uploadedAt: "2026-06-16T12:10:00Z"
  },
  {
    id: "MEDIA-107",
    styleId: "ST-24004",
    type: "techpack",
    url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    fileName: "ST-24004_울코트_작업지시서_V1.0.pdf",
    uploadedAt: "2026-06-15T09:00:00Z"
  },
  {
    id: "MEDIA-108",
    styleId: "ST-24004",
    type: "image",
    url: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=600",
    fileName: "ST-24004_헤링본_코트_스케치.jpg",
    uploadedAt: "2026-06-15T09:15:00Z"
  }
];

// 4. 스타일 기본 레코드 (실무 팩트 스펙 적용)
export const mockStyles: Style[] = [
  {
    id: "ST-24001",
    status: STYLE_STATUS.DESIGN,
    name: "피그먼트 다잉 3단쭈리 가디건",
    vendorId: "VEND-101",
    factoryId: "FACT-31",
    techPackUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    techPackVersion: "V1.0",
    colorBook: {
      fabricName: "3단 쭈리 특양면 코튼 100% (헤비웨이트 550g/y)",
      colors: [
        { name: "Pigment Charcoal", hex: "#3A3B3C" },
        { name: "Pigment Khaki", hex: "#556B2F" },
        { name: "Pigment Cream", hex: "#EAE6DF" }
      ]
    },
    scmPrice: {
      factoryCostRmb: 48.0, // 광저우 공장 48위안
      exchangeRate: 195.5,  // 환율 195.5원
      duty: 1250,          // 관세 (기본 13% 수준)
      shipping: 900,        // 에어 수입 물류비
      margin: 5200         // 본사 목표 마진
    },
    qrLogs: [
      { stage: "Factory", timestamp: "2026-06-16T09:00:00Z", location: "광저우 하이주구 31번 공장 라인" }
    ]
  },
  {
    id: "ST-24002",
    status: STYLE_STATUS.FACTORY_REVIEW,
    name: "헤비 옥스퍼드 스트라이프 오버핏 셔츠",
    vendorId: "VEND-102",
    factoryId: "FACT-32",
    techPackUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    techPackVersion: "V2.1",
    colorBook: {
      fabricName: "40수 2합 풀코움 옥스퍼드 스트라이프 코튼",
      colors: [
        { name: "Classic Sky Blue", hex: "#7EC0EE" },
        { name: "Pure White Oxford", hex: "#FDFDFD" },
        { name: "Apricot Stripe", hex: "#FFD39B" }
      ]
    },
    scmPrice: {
      factoryCostRmb: 34.0, // 34위안
      exchangeRate: 195.5,
      duty: 980,
      shipping: 650,
      margin: 4200
    },
    qrLogs: [
      { stage: "Factory", timestamp: "2026-06-15T10:00:00Z", location: "광저우 판위구 32번 봉제 라인" },
      { stage: "QC", timestamp: "2026-06-16T11:00:00Z", location: "중국 심사 QC 센터" }
    ]
  },
  {
    id: "ST-24003",
    status: STYLE_STATUS.SAMPLE_PROD,
    name: "테크니컬 워시드 나일론 벌룬 카고팬츠",
    vendorId: "VEND-105",
    factoryId: "FACT-33",
    techPackUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    techPackVersion: "V1.2",
    colorBook: {
      fabricName: "크링클 나일론 테슬란 타슬란 워시드 우븐 (120g/y)",
      colors: [
        { name: "Matt Black", hex: "#111111" },
        { name: "Stone Gray Taslan", hex: "#708090" },
        { name: "Forest Olive", hex: "#2E8B57" }
      ]
    },
    scmPrice: {
      factoryCostRmb: 55.0, // 55위안
      exchangeRate: 195.5,
      duty: 1450,
      shipping: 950,
      margin: 5500
    },
    qrLogs: [
      { stage: "Factory", timestamp: "2026-06-14T08:00:00Z", location: "광저우 바이윈구 33번 우븐공장" },
      { stage: "QC", timestamp: "2026-06-15T09:30:00Z", location: "중국 심사 QC 센터" },
      { stage: "Shipping", timestamp: "2026-06-16T04:00:00Z", location: "심천 선적항 항공 발송 대기" }
    ]
  },
  {
    id: "ST-24004",
    status: STYLE_STATUS.SAMPLE_REVIEW,
    name: "헤링본 울 트위드 싱글 코트",
    vendorId: "VEND-106",
    factoryId: "FACT-34",
    techPackUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    techPackVersion: "V1.0",
    colorBook: {
      fabricName: "해리스 트위드 울 80% 헤링본 방모 (780g/y Heavy)",
      colors: [
        { name: "Midnight Navy Herringbone", hex: "#191970" },
        { name: "Rich Oat Tweed", hex: "#D2B48C" }
      ]
    },
    scmPrice: {
      factoryCostRmb: 98.0, // 98위안
      exchangeRate: 195.5,
      duty: 2500,
      shipping: 1400,
      margin: 11000
    },
    qrLogs: [
      { stage: "Factory", timestamp: "2026-06-12T09:00:00Z", location: "광저우 리완구 34번 라인" },
      { stage: "QC", timestamp: "2026-06-13T10:00:00Z", location: "중국 심사 QC 센터" },
      { stage: "Shipping", timestamp: "2026-06-14T15:00:00Z", location: "광저우 바이윈 공항 선적 완료" },
      { stage: "Korea", timestamp: "2026-06-15T11:00:00Z", location: "인천공항 세관 통과 및 배송완료" },
      { stage: "Review", timestamp: "2026-06-16T14:00:00Z", location: "서울 본사 3층 디자인실 수령" }
    ]
  }
];

// 5. 피드 협업 메시지 타임라인 (대화록 실제 반영 및 실시간 번역본 매핑)
export const mockMessages: TimelineMessage[] = [
  {
    id: "MSG-001",
    styleId: "ST-24001",
    sender: { name: "김디자이너", role: "designer", lang: "KR" },
    content: "구체적으로 부자재 샘플하고 작업지시서 준비를 해서 보냈습니다.",
    translations: {
      KR: "구체적으로 부자재 샘플하고 작업지시서 준비를 해서 보냈습니다.",
      CN: "具体准备了辅料样品和作业指示书并发过去了。"
    },
    createdAt: "2026-06-16T12:00:00Z"
  },
  {
    id: "MSG-002",
    styleId: "ST-24001",
    sender: { name: "김디자이너", role: "designer", lang: "KR" },
    content: "사진을 찍어서 먼저 공유하고, 원 샘플하고 작업 지시서는 중국 지사로 실물 항공 특송 발송했습니다. 지퍼 디테일 변경 확인 바랍니다.",
    translations: {
      KR: "사진을 찍어서 먼저 공유하고, 원 샘플하고 작업 지시서는 중국 지사로 실물 항공 특송 발송했습니다. 지퍼 디테일 변경 확인 바랍니다.",
      CN: "拍照先分享了，原样和作业指示书已通过实物航空特快发往中国分社。请确认拉链细节变更。"
    },
    createdAt: "2026-06-16T12:05:00Z"
  },
  {
    id: "MSG-003",
    styleId: "ST-24001",
    sender: { name: "장리화 (공장담당)", role: "factory_staff", lang: "CN" },
    content: "好的，收到。原版样品和作业指示书到达后，我们会马上在广州工厂查询面料并制作样衣。样衣制作完成后会计算出准确的出厂单价。",
    translations: {
      KR: "네, 확인했습니다. 오리지널 샘플과 작업지시서가 도착하는 대로 광저우 공장에서 원단을 조회하여 샘플을 제작하겠습니다. 샘플 제작 후 정확한 공장 단가가 산출될 예정입니다.",
      CN: "好的，收到。原版样品和作业指示书到达后，我们会马上在广州工厂查询面料并制作样衣。样衣制作完成后会计算出准确的出厂单价。"
    },
    createdAt: "2026-06-16T12:10:00Z"
  },
  {
    id: "MSG-004",
    styleId: "ST-24001",
    sender: { name: "장리화 (공장담당)", role: "factory_staff", lang: "CN" },
    content: "已经完成A-1颜色面料的采购，准备投入样衣制作生产。",
    translations: {
      KR: "A-1 컬러 원단 수급을 완료하여 샘플 생산 투입 준비를 마쳤습니다.",
      CN: "已经完成A-1颜色面料的采购，准备投入样衣制作生产。"
    },
    createdAt: "2026-06-16T13:30:00Z",
    logUpdate: {
      prevStatus: STYLE_STATUS.DESIGN,
      nextStatus: STYLE_STATUS.FACTORY_REVIEW
    }
  }
];
