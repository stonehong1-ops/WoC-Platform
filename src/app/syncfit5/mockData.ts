import { Style, TimelineMessage, Media } from './types';

export const mockStyles: Style[] = [
  {
    id: "ST-00001",
    name: "오버사이즈 테크 쉘",
    category: "2025 봄 컬렉션",
    status: "생산중",
    updatedAt: "2026-06-17T04:00:00Z",
    scmPrice: {
      fabricCost: 84.50,
      usage: 1.85,
      cmt: 45.00,
      exchangeRate: 190.0
    },
    isMock: true
  },
  {
    id: "ST-00002",
    name: "라이너 니트 V넥",
    category: "코어 에센셜",
    status: "디자인중",
    updatedAt: "2026-06-17T00:00:00Z",
    scmPrice: {
      fabricCost: 55.00,
      usage: 1.20,
      cmt: 30.00,
      exchangeRate: 190.0
    },
    isMock: true
  },
  {
    id: "ST-00003",
    name: "택티컬 카고 팬츠",
    category: "2025 봄 컬렉션",
    status: "완료",
    updatedAt: "2026-06-16T04:00:00Z",
    scmPrice: {
      fabricCost: 65.00,
      usage: 1.50,
      cmt: 38.00,
      exchangeRate: 190.0
    },
    isMock: true
  },
  {
    id: "ST-00004",
    name: "크롭 윈드브레이커",
    category: "액티브웨어",
    status: "디자인중",
    updatedAt: "2026-06-16T12:00:00Z",
    scmPrice: {
      fabricCost: 72.00,
      usage: 1.40,
      cmt: 35.00,
      exchangeRate: 190.0
    },
    isMock: true
  },
  {
    id: "ST-00005",
    name: "헤비웨이트 후드티",
    category: "코어 에센셜",
    status: "생산중",
    updatedAt: "2026-06-16T10:00:00Z",
    scmPrice: {
      fabricCost: 40.00,
      usage: 1.65,
      cmt: 28.00,
      exchangeRate: 190.0
    },
    isMock: true
  },
  {
    id: "ST-00006",
    name: "슬림핏 셀비지 데님",
    category: "데님 라인",
    status: "디자인중",
    updatedAt: "2026-06-15T08:00:00Z",
    scmPrice: {
      fabricCost: 90.00,
      usage: 1.30,
      cmt: 48.00,
      exchangeRate: 190.0
    },
    isMock: true
  },
  {
    id: "ST-00007",
    name: "클래식 옥스포드 셔츠",
    category: "코어 에센셜",
    status: "완료",
    updatedAt: "2026-06-15T03:00:00Z",
    scmPrice: {
      fabricCost: 35.00,
      usage: 1.15,
      cmt: 25.00,
      exchangeRate: 190.0
    },
    isMock: true
  },
  {
    id: "ST-00008",
    name: "테크니컬 플리스 자켓",
    category: "2025 봄 컬렉션",
    status: "생산중",
    updatedAt: "2026-06-14T06:00:00Z",
    scmPrice: {
      fabricCost: 78.00,
      usage: 1.70,
      cmt: 42.00,
      exchangeRate: 190.0
    },
    isMock: true
  }
];

export const mockMessages: TimelineMessage[] = [
  {
    id: "MSG-001",
    styleId: "ST-00001",
    sender: "한국 매니저",
    role: "글로벌 총괄 매니저",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuD2_Mf7ImZA9SiRDfMa-IpT2pLME8YXDlynNT0IB6HM6slkN4_6T5yLMgg3wxeq0yWDbfiVwMz2EDJacAJZgGEzXxjciDTi5k0qe_HboMlgXjLzWYoCPZYME2VvhfxEmCaN_U_Y3wMLRWZUBQ6r9mEPle8GLy86xoWW55G-2mT2RKA4BAJZUHnmZYP_lDsweWrghP1SSc7Hhi8GNkBM8yiCMpvgjC6GCqSmF40v-obRIWfgmM7cllRGjPYLHLkyQUe91RgQ6LXsK00",
    content: "ST-00001 제품의 대화방을 개설합니다. 공장 현장 매니저님과 디자이너 분들은 진행 상황 공유해 주세요.",
    createdAt: "2026-06-16T09:00:00Z",
    isSelf: false,
    isSystem: false,
    attachment: null,
    isMock: true
  },
  {
    id: "MSG-002",
    styleId: "ST-00001",
    sender: "공장 현장",
    role: "공장 현장",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuARfsdno299WSXQ9px-FH-zricBXUIrmcVqm1WQoh5_8CTE6nGdOOeFzbWBbmRMFqWfMoNTXajcAZln37ke9YokuZL9-wrhC1qafYKtRoog91hEE28MB4ZRl-7A2CUVUniXqzV_2aMAyNkFvlFyDxPiyR5nEseN5IRytdc0snj22H27VxG1oCSSxAvR3U7N3clHVMMBfEuxrr89ewZQv-2MdoQXKwe8a3WXdcFaycAPC4W8qQviz8ZeAQSOUVFyUnMrpxr7qANk-Gk",
    content: "你好，我是东莞工厂的生产经理。很高兴能在此平台协作。我们会全力配合设计修改。",
    translatedContent: "안녕하세요, 동관 공장의 생산 매니저입니다. 이 플랫폼에서 협업하게 되어 기쁩니다. 디자인 수정 사항에 적극 협조하겠습니다.",
    createdAt: "2026-06-16T09:15:00Z",
    isSelf: false,
    isSystem: false,
    attachment: null,
    isMock: true
  },
  {
    id: "MSG-003",
    styleId: "ST-00001",
    sender: "디자이너 1",
    role: "글로벌 크리에이티브 디자이너",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuDpoRU4Sj7KZ9sugy09btuk7W2vyfigXhkaXZSDJ5icoX_g7APoIQJOxHPq_mm0fVRkueMXn29wdXFey5Y1hdURAnX4cjPGb2XsXAqq65JUhV6I1udnhLuHfq7zziXulEnoNeCrFarq6CGns0k01ywH4OUUMo2yUlGoCGvzautaGdROSAm6qX1SKo3fvxyk44xkvRkV66CADFpiQG_Wax_-3-nxl8KGKcx0h6KKvnXq0Fgg08A2PIvGNgE__vQlggCep3PX-IcvOrM",
    content: "반갑습니다! 첫 번째 작업지시서 초안을 업로드합니다. 지퍼 위치와 마감 사양 검토 부탁드립니다.",
    createdAt: "2026-06-16T10:00:00Z",
    isSelf: false,
    isSystem: false,
    attachment: null,
    isMock: true
  },
  {
    id: "MSG-004",
    styleId: "ST-00001",
    sender: "시스템",
    role: "시스템",
    avatar: "",
    content: "새로운 작업지시서가 등록되었습니다: ST001_v1_Draft.png (3.4 MB)",
    createdAt: "2026-06-16T10:01:00Z",
    isSelf: false,
    isSystem: true,
    attachment: {
      fileName: "ST001_v1_Draft.png",
      fileSize: "3.4 MB",
      url: "/images/techpack/techpack_template.png"
    },
    isMock: true
  },
  {
    id: "MSG-005",
    styleId: "ST-00001",
    sender: "공장 현장",
    role: "공장 현장",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuARfsdno299WSXQ9px-FH-zricBXUIrmcVqm1WQoh5_8CTE6nGdOOeFzbWBbmRMFqWfMoNTXajcAZln37ke9YokuZL9-wrhC1qafYKtRoog91hEE28MB4ZRl-7A2CUVUniXqzV_2aMAyNkFvlFyDxPiyR5nEseN5IRytdc0snj22H27VxG1oCSSxAvR3U7N3clHVMMBfEuxrr89ewZQv-2MdoQXKwe8a3WXdcFaycAPC4W8qQviz8ZeAQSOUVFyUnMrpxr7qANk-Gk",
    content: "我们查看了第一版图纸。内部拉链的缝合线位置有点窄，在量产时可能会卡住防水胶条。建议建议调整缝边宽度。",
    translatedContent: "첫 번째 버전의 도면을 확인했습니다. 내부 지퍼의 봉제선 위치가 약간 좁아서, 양산 시 방수 테이프에 걸릴 우려가 있습니다. 시접 폭 조정을 제안합니다.",
    createdAt: "2026-06-16T11:30:00Z",
    isSelf: false,
    isSystem: false,
    attachment: null,
    isMock: true
  },
  {
    id: "MSG-006",
    styleId: "ST-00001",
    sender: "디자이너 2",
    role: "글로벌 크리에이티브 디자이너",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuDpoRU4Sj7KZ9sugy09btuk7W2vyfigXhkaXZSDJ5icoX_g7APoIQJOxHPq_mm0fVRkueMXn29wdXFey5Y1hdURAnX4cjPGb2XsXAqq65JUhV6I1udnhLuHfq7zziXulEnoNeCrFarq6CGns0k01ywH4OUUMo2yUlGoCGvzautaGdROSAm6qX1SKo3fvxyk44xkvRkV66CADFpiQG_Wax_-3-nxl8KGKcx0h6KKvnXq0Fgg08A2PIvGNgE__vQlggCep3PX-IcvOrM",
    content: "피드백 감사합니다. 지퍼 봉제 폭을 5mm 확장하여 수정한 작업지시서 2차 수정본을 공유합니다.",
    createdAt: "2026-06-16T13:00:00Z",
    isSelf: false,
    isSystem: false,
    attachment: null,
    isMock: true
  },
  {
    id: "MSG-007",
    styleId: "ST-00001",
    sender: "시스템",
    role: "시스템",
    avatar: "",
    content: "새로운 작업지시서가 등록되었습니다: ST001_v2_Zipper_Fixed.png (4.1 MB)",
    createdAt: "2026-06-16T13:02:00Z",
    isSelf: false,
    isSystem: true,
    attachment: {
      fileName: "ST001_v2_Zipper_Fixed.png",
      fileSize: "4.1 MB",
      url: "/images/techpack/techpack_template.png"
    },
    isMock: true
  },
  {
    id: "MSG-008",
    styleId: "ST-00001",
    sender: "공장 현장",
    role: "공장 현장",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuARfsdno299WSXQ9px-FH-zricBXUIrmcVqm1WQoh5_8CTE6nGdOOeFzbWBbmRMFqWfMoNTXajcAZln37ke9YokuZL9-wrhC1qafYKtRoog91hEE28MB4ZRl-7A2CUVUniXqzV_2aMAyNkFvlFyDxPiyR5nEseN5IRytdc0snj22H27VxG1oCSSxAvR3U7N3clHVMMBfEuxrr89ewZQv-2MdoQXKwe8a3WXdcFaycAPC4W8qQviz8ZeAQSOUVFyUnMrpxr7qANk-Gk",
    content: "新图纸非常完美。这样拉链受力更均匀。我们将使用该规格制作初版样品。",
    translatedContent: "새 도면은 완벽합니다. 이렇게 하면 지퍼의 힘 분산이 더 균일해집니다. 이 사양을 기반으로 첫 샘플 제작을 개시하겠습니다.",
    createdAt: "2026-06-16T14:40:00Z",
    isSelf: false,
    isSystem: false,
    attachment: null,
    isMock: true
  },
  {
    id: "MSG-009",
    styleId: "ST-00001",
    sender: "시스템",
    role: "시스템",
    avatar: "",
    content: "시스템: 상태가 '디자인'에서 '생산중'으로 변경되었습니다.",
    createdAt: "2026-06-16T15:00:00Z",
    isSelf: false,
    isSystem: true,
    attachment: null,
    isMock: true
  },
  {
    id: "MSG-010",
    styleId: "ST-00001",
    sender: "중국 매니저",
    role: "공장 생산 실무 매니저",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuARfsdno299WSXQ9px-FH-zricBXUIrmcVqm1WQoh5_8CTE6nGdOOeFzbWBbmRMFqWfMoNTXajcAZln37ke9YokuZL9-wrhC1qafYKtRoog91hEE28MB4ZRl-7A2CUVUniXqzV_2aMAyNkFvlFyDxPiyR5nEseN5IRytdc0snj22H27VxG1oCSSxAvR3U7N3clHVMMBfEuxrr89ewZQv-2MdoQXKwe8a3WXdcFaycAPC4W8qQviz8ZeAQSOUVFyUnMrpxr7qANk-Gk",
    content: "원단 수급 일정 공유드립니다. 기능성 스판덱스 원단이 공장에 입고되었습니다. 신축성 테스트 리포트를 공유합니다.",
    createdAt: "2026-06-17T00:30:00Z",
    isSelf: false,
    isSystem: false,
    attachment: null,
    isMock: true
  },
  {
    id: "MSG-011",
    styleId: "ST-00001",
    sender: "시스템",
    role: "시스템",
    avatar: "",
    content: "첨부파일: Elasticity_Report_V2.pdf (1.2 MB)",
    createdAt: "2026-06-17T00:31:00Z",
    isSelf: false,
    isSystem: false,
    attachment: {
      fileName: "Elasticity_Report_V2.pdf",
      fileSize: "1.2 MB",
      url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
    },
    isMock: true
  },
  {
    id: "MSG-012",
    styleId: "ST-00001",
    sender: "공장 현장",
    role: "공장 현장",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuARfsdno299WSXQ9px-FH-zricBXUIrmcVqm1WQoh5_8CTE6nGdOOeFzbWBbmRMFqWfMoNTXajcAZln37ke9YokuZL9-wrhC1qafYKtRoog91hEE28MB4ZRl-7A2CUVUniXqzV_2aMAyNkFvlFyDxPiyR5nEseN5IRytdc0snj22H27VxG1oCSSxAvR3U7N3clHVMMBfEuxrr89ewZQv-2MdoQXKwe8a3WXdcFaycAPC4W8qQviz8ZeAQSOUVFyUnMrpxr7qANk-Gk",
    content: "你好，关于ST-00001의 샘플 제작, 우리는 방수 테스트를 진행하였습니다. 테스트 가이드 동영상을 참고해 주십시오.",
    translatedContent: "안녕하세요, ST-00001의 샘플 제작과 관련하여 방수 테스트를 진행하였습니다. 테스트 가이드 동영상을 참고해 주십시오.",
    createdAt: "2026-06-17T00:42:00Z",
    isSelf: false,
    isSystem: false,
    attachment: null,
    isMock: true
  },
  {
    id: "MSG-013",
    styleId: "ST-00001",
    sender: "시스템",
    role: "시스템",
    avatar: "",
    content: "첨부파일: Seam_Sealing_Waterproof_Guide.mp4 (14.2 MB)",
    createdAt: "2026-06-17T00:43:00Z",
    isSelf: false,
    isSystem: false,
    attachment: {
      fileName: "Seam_Sealing_Waterproof_Guide.mp4",
      fileSize: "14.2 MB",
      url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
    },
    isMock: true
  },
  {
    id: "MSG-014",
    styleId: "ST-00001",
    sender: "디자이너 2",
    role: "글로벌 크리에이티브 디자이너",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuD2_Mf7ImZA9SiRDfMa-IpT2pLME8YXDlynNT0IB6HM6slkN4_6T5yLMgg3wxeq0yWDbfiVwMz2EDJacAJZgGEzXxjciDTi5k0qe_HboMlgXjLzWYoCPZYME2VvhfxEmCaN_U_Y3wMLRWZUBQ6r9mEPle8GLy86xoWW55G-2mT2RKA4BAJZUHnmZYP_lDsweWrghP1SSc7Hhi8GNkBM8yiCMpvgjC6GCqSmF40v-obRIWfgmM7cllRGjPYLHLkyQUe91RgQ6LXsK00",
    content: "동영상 보고서 잘 보았습니다. 힙 방수 심 테이프 밀착도가 좋습니다. 지시서의 방수 사양을 통과한 것으로 보입니다.",
    createdAt: "2026-06-17T00:55:00Z",
    isSelf: true,
    isSystem: false,
    attachment: null,
    isMock: true
  },
  {
    id: "MSG-015",
    styleId: "ST-00001",
    sender: "시스템",
    role: "시스템",
    avatar: "",
    content: "새로운 작업지시서가 등록되었습니다: ST001_v3_Final_Approved.png (4.5 MB)",
    createdAt: "2026-06-17T00:56:00Z",
    isSelf: false,
    isSystem: true,
    attachment: {
      fileName: "ST001_v3_Final_Approved.png",
      fileSize: "4.5 MB",
      url: "/images/techpack/techpack_template.png"
    },
    isMock: true
  },
  {
    id: "MSG-016",
    styleId: "ST-00001",
    sender: "한국 매니저",
    role: "글로벌 총괄 매니저",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuD2_Mf7ImZA9SiRDfMa-IpT2pLME8YXDlynNT0IB6HM6slkN4_6T5yLMgg3wxeq0yWDbfiVwMz2EDJacAJZgGEzXxjciDTi5k0qe_HboMlgXjLzWYoCPZYME2VvhfxEmCaN_U_Y3wMLRWZUBQ6r9mEPle8GLy86xoWW55G-2mT2RKA4BAJZUHnmZYP_lDsweWrghP1SSc7Hhi8GNkBM8yiCMpvgjC6GCqSmF40v-obRIWfgmM7cllRGjPYLHLkyQUe91RgQ6LXsK00",
    content: "최종 버전 작업지시서가 승인되었습니다. 본 사양에 맞춰 SCM 원가 산출해주시고 대량 생산 시작해 주십시오.",
    createdAt: "2026-06-17T01:10:00Z",
    isSelf: false,
    isSystem: false,
    attachment: null,
    isMock: true
  },
  {
    id: "MSG-017",
    styleId: "ST-00001",
    sender: "중국 매니저",
    role: "공장 생산 실무 매니저",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuARfsdno299WSXQ9px-FH-zricBXUIrmcVqm1WQoh5_8CTE6nGdOOeFzbWBbmRMFqWfMoNTXajcAZln37ke9YokuZL9-wrhC1qafYKtRoog91hEE28MB4ZRl-7A2CUVUniXqzV_2aMAyNkFvlFyDxPiyR5nEseN5IRytdc0snj22H27VxG1oCSSxAvR3U7N3clHVMMBfEuxrr89ewZQv-2MdoQXKwe8a3WXdcFaycAPC4W8qQviz8ZeAQSOUVFyUnMrpxr7qANk-Gk",
    content: "네, 원가 계산기를 통해 대량생산 견적 입력 완료했습니다. 확인 부탁드립니다.",
    createdAt: "2026-06-17T01:25:00Z",
    isSelf: false,
    isSystem: false,
    attachment: null,
    isMock: true
  },
  {
    id: "MSG-018",
    styleId: "ST-00001",
    sender: "시스템",
    role: "시스템",
    avatar: "",
    content: "시스템: SCM 계산 결과가 업데이트되었습니다 (도매가: ¥431.20, 원가: ¥172.48).",
    createdAt: "2026-06-17T01:26:00Z",
    isSelf: false,
    isSystem: true,
    attachment: null,
    isMock: true
  },
  {
    id: "MSG-019",
    styleId: "ST-00001",
    sender: "한국 매니저",
    role: "글로벌 총괄 매니저",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuD2_Mf7ImZA9SiRDfMa-IpT2pLME8YXDlynNT0IB6HM6slkN4_6T5yLMgg3wxeq0yWDbfiVwMz2EDJacAJZgGEzXxjciDTi5k0qe_HboMlgXjLzWYoCPZYME2VvhfxEmCaN_U_Y3wMLRWZUBQ6r9mEPle8GLy86xoWW55G-2mT2RKA4BAJZUHnmZYP_lDsweWrghP1SSc7Hhi8GNkBM8yiCMpvgjC6GCqSmF40v-obRIWfgmM7cllRGjPYLHLkyQUe91RgQ6LXsK00",
    content: "단가가 적정 마진 범위를 충족하므로, 쇼룸 생산 확정을 진행하겠습니다. 공장 현장은 생산 라인 세팅에 착수해 주세요.",
    createdAt: "2026-06-17T02:00:00Z",
    isSelf: false,
    isSystem: false,
    attachment: null,
    isMock: true
  },
  {
    id: "MSG-020",
    styleId: "ST-00001",
    sender: "공장 현장",
    role: "공장 현장",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuARfsdno299WSXQ9px-FH-zricBXUIrmcVqm1WQoh5_8CTE6nGdOOeFzbWBbmRMFqWfMoNTXajcAZln37ke9YokuZL9-wrhC1qafYKtRoog91hEE28MB4ZRl-7A2CUVUniXqzV_2aMAyNkFvlFyDxPiyR5nEseN5IRytdc0snj22H27VxG1oCSSxAvR3U7N3clHVMMBfEuxrr89ewZQv-2MdoQXKwe8a3WXdcFaycAPC4W8qQviz8ZeAQSOUVFyUnMrpxr7qANk-Gk",
    content: "收到确认。我们将于明日正式上线剪裁，首批计划产出500件。",
    translatedContent: "확인했습니다. 내일부터 본격적으로 재단을 시작하며, 첫 배치로 500개 생산을 계획하고 있습니다.",
    createdAt: "2026-06-17T02:45:00Z",
    isSelf: false,
    isSystem: false,
    attachment: null,
    isMock: true
  },
  {
    id: "MSG-021",
    styleId: "ST-00001",
    sender: "한국 매니저",
    role: "글로벌 총괄 매니저",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuD2_Mf7ImZA9SiRDfMa-IpT2pLME8YXDlynNT0IB6HM6slkN4_6T5yLMgg3wxeq0yWDbfiVwMz2EDJacAJZgGEzXxjciDTi5k0qe_HboMlgXjLzWYoCPZYME2VvhfxEmCaN_U_Y3wMLRWZUBQ6r9mEPle8GLy86xoWW55G-2mT2RKA4BAJZUHnmZYP_lDsweWrghP1SSc7Hhi8GNkBM8yiCMpvgjC6GCqSmF40v-obRIWfgmM7cllRGjPYLHLkyQUe91RgQ6LXsK00",
    content: "훌륭합니다. 생산 과정에서 특이사항 발생하면 바로 이 피드에 남겨서 싱크 맞춰주세요.",
    createdAt: "2026-06-17T03:30:00Z",
    isSelf: false,
    isSystem: false,
    attachment: null,
    isMock: true
  },
  {
    id: "MSG-022",
    styleId: "ST-00001",
    sender: "공장 현장",
    role: "공장 현장",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuARfsdno299WSXQ9px-FH-zricBXUIrmcVqm1WQoh5_8CTE6nGdOOeFzbWBbmRMFqWfMoNTXajcAZln37ke9YokuZL9-wrhC1qafYKtRoog91hEE28MB4ZRl-7A2CUVUniXqzV_2aMAyNkFvlFyDxPiyR5nEseN5IRytdc0snj22H27VxG1oCSSxAvR3U7N3clHVMMBfEuxrr89ewZQv-2MdoQXKwe8a3WXdcFaycAPC4W8qQviz8ZeAQSOUVFyUnMrpxr7qANk-Gk",
    content: "明白，有情况随时保持联系。",
    translatedContent: "이해했습니다, 상황이 발생하면 즉시 연락드리겠습니다.",
    createdAt: "2026-06-17T03:50:00Z",
    isSelf: false,
    isSystem: false,
    attachment: null,
    isMock: true
  }
];

export const mockMedia: Media[] = [
  {
    id: "MEDIA-001",
    styleId: "ST-00001",
    type: "techpack",
    url: "/images/techpack/techpack_template.png",
    fileName: "ST001_v3_Final_Approved.png",
    fileSize: "4.5 MB",
    uploadedAt: "2026-06-17T00:56:00Z",
    isMock: true
  },
  {
    id: "MEDIA-002",
    styleId: "ST-00001",
    type: "techpack",
    url: "/images/techpack/techpack_template.png",
    fileName: "ST001_v2_Zipper_Fixed.png",
    fileSize: "4.1 MB",
    uploadedAt: "2026-06-16T13:02:00Z",
    isMock: true
  },
  {
    id: "MEDIA-003",
    styleId: "ST-00001",
    type: "techpack",
    url: "/images/techpack/techpack_template.png",
    fileName: "ST001_v1_Draft.png",
    fileSize: "3.4 MB",
    uploadedAt: "2026-06-16T10:01:00Z",
    isMock: true
  },
  {
    id: "MEDIA-004",
    styleId: "ST-00001",
    type: "file",
    url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    fileName: "Elasticity_Report_V2.pdf",
    fileSize: "1.2 MB",
    uploadedAt: "2026-06-17T00:31:00Z",
    isMock: true
  },
  {
    id: "MEDIA-005",
    styleId: "ST-00001",
    type: "file",
    url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    fileName: "Seam_Sealing_Waterproof_Guide.mp4",
    fileSize: "14.2 MB",
    uploadedAt: "2026-06-17T00:43:00Z",
    isMock: true
  },
  {
    id: "MEDIA-006",
    styleId: "ST-00001",
    type: "file",
    url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    fileName: "Dongguan_Packing_Standard.xlsx",
    fileSize: "780 KB",
    uploadedAt: "2026-06-16T16:00:00Z",
    isMock: true
  },
  {
    id: "MEDIA-007",
    styleId: "ST-00002",
    type: "techpack",
    url: "/images/techpack/techpack_template.png",
    fileName: "ST002_Draft_v1.png",
    fileSize: "2.8 MB",
    uploadedAt: "2026-06-17T00:00:00Z",
    isMock: true
  },
  {
    id: "MEDIA-008",
    styleId: "ST-00002",
    type: "file",
    url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    fileName: "Yarn_Specification_Card.pdf",
    fileSize: "2.1 MB",
    uploadedAt: "2026-06-16T14:00:00Z",
    isMock: true
  },
  {
    id: "MEDIA-009",
    styleId: "ST-00003",
    type: "techpack",
    url: "/images/techpack/techpack_template.png",
    fileName: "ST003_Final_Release.png",
    fileSize: "5.2 MB",
    uploadedAt: "2026-06-16T04:00:00Z",
    isMock: true
  },
  {
    id: "MEDIA-010",
    styleId: "ST-00003",
    type: "file",
    url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    fileName: "Archived_Cargo_Fitting_Notes.pdf",
    fileSize: "890 KB",
    uploadedAt: "2026-06-15T10:00:00Z",
    isMock: true
  },
  {
    id: "MEDIA-011",
    styleId: "ST-00005",
    type: "techpack",
    url: "/images/techpack/techpack_template.png",
    fileName: "ST005_Sweatshirt_v1.png",
    fileSize: "3.1 MB",
    uploadedAt: "2026-06-16T10:00:00Z",
    isMock: true
  },
  {
    id: "MEDIA-012",
    styleId: "ST-00005",
    type: "file",
    url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    fileName: "Cotton_Weight_Certificate.pdf",
    fileSize: "650 KB",
    uploadedAt: "2026-06-15T12:00:00Z",
    isMock: true
  }
];
