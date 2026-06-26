"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { Style, TimelineMessage, Media, ScmPrice, ColorBookItem } from "./types";
import { mockStyles, mockMessages, mockMedia } from "./mockData";
import { useLanguage } from "@/contexts/LanguageContext";

// Firebase db 및 storage 수입
import { db, storage } from "@/lib/firebase/clientApp";
import {
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  onSnapshot, 
  query, 
  where, 
  writeBatch,
  getDocs,
  deleteDoc
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export interface SyncFitUser {
  name: string;
  role: string;
  roleTitle: string;
  avatar: string;
}

const MANAGERS: SyncFitUser[] = [
  { 
    name: "한국 매니저", 
    role: "admin", 
    roleTitle: "글로벌 총괄 매니저",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuD2_Mf7ImZA9SiRDfMa-IpT2pLME8YXDlynNT0IB6HM6slkN4_6T5yLMgg3wxeq0yWDbfiVwMz2EDJacAJZgGEzXxjciDTi5k0qe_HboMlgXjLzWYoCPZYME2VvhfxEmCaN_U_Y3wMLRWZUBQ6r9mEPle8GLy86xoWW55G-2mT2RKA4BAJZUHnmZYP_lDsweWrghP1SSc7Hhi8GNkBM8yiCMpvgjC6GCqSmF40v-obRIWfgmM7cllRGjPYLHLkyQUe91RgQ6LXsK00"
  },
  { 
    name: "중국 매니저", 
    role: "factory_staff", 
    roleTitle: "공장 생산 실무 매니저",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuARfsdno299WSXQ9px-FH-zricBXUIrmcVqm1WQoh5_8CTE6nGdOOeFzbWBbmRMFqWfMoNTXajcAZln37ke9YokuZL9-wrhC1qafYKtRoog91hEE28MB4ZRl-7A2CUVUniXqzV_2aMAyNkFvlFyDxPiyR5nEseN5IRytdc0snj22H27VxG1oCSSxAvR3U7N3clHVMMBfEuxrr89ewZQv-2MdoQXKwe8a3WXdcFaycAPC4W8qQviz8ZeAQSOUVFyUnMrpxr7qANk-Gk"
  }
];

const DESIGNERS: SyncFitUser[] = Array.from({ length: 3 }, (_, i) => ({
  name: `디자이너 ${i + 1}`,
  role: "designer",
  roleTitle: "글로벌 크리에이티브 디자이너",
  avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuDpoRU4Sj7KZ9sugy09btuk7W2vyfigXhkaXZSDJ5icoX_g7APoIQJOxHPq_mm0fVRkueMXn29wdXFey5Y1hdURAnX4cjPGb2XsXAqq65JUhV6I1udnhLuHfq7zziXulEnoNeCrFarq6CGns0k01ywH4OUUMo2yUlGoCGvzautaGdROSAm6qX1SKo3fvxyk44xkvRkV66CADFpiQG_Wax_-3-nxl8KGKcx0h6KKvnXq0Fgg08A2PIvGNgE__vQlggCep3PX-IcvOrM"
}));

const FACTORY_STAFF: SyncFitUser[] = Array.from({ length: 10 }, (_, i) => ({
  name: `공장 직원 ${i + 1}`,
  role: "factory_staff",
  roleTitle: "생산 공장 현장 실무원",
  avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuARfsdno299WSXQ9px-FH-zricBXUIrmcVqm1WQoh5_8CTE6nGdOOeFzbWBbmRMFqWfMoNTXajcAZln37ke9YokuZL9-wrhC1qafYKtRoog91hEE28MB4ZRl-7A2CUVUniXqzV_2aMAyNkFvlFyDxPiyR5nEseN5IRytdc0snj22H27VxG1oCSSxAvR3U7N3clHVMMBfEuxrr89ewZQv-2MdoQXKwe8a3WXdcFaycAPC4W8qQviz8ZeAQSOUVFyUnMrpxr7qANk-Gk"
}));

const VENDORS: SyncFitUser[] = Array.from({ length: 30 }, (_, i) => ({
  name: `협력사 직원 ${i + 1}`,
  role: "vendor_staff",
  roleTitle: "원단 공급 협력 파트너",
  avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuDpoRU4Sj7KZ9sugy09btuk7W2vyfigXhkaXZSDJ5icoX_g7APoIQJOxHPq_mm0fVRkueMXn29wdXFey5Y1hdURAnX4cjPGb2XsXAqq65JUhV6I1udnhLuHfq7zziXulEnoNeCrFarq6CGns0k01ywH4OUUMo2yUlGoCGvzautaGdROSAm6qX1SKo3fvxyk44xkvRkV66CADFpiQG_Wax_-3-nxl8KGKcx0h6KKvnXq0Fgg08A2PIvGNgE__vQlggCep3PX-IcvOrM"
}));

const TRANSLATION_MAP: Record<string, string> = {
  // 한국어 -> 중국어 (전송 및 번역용)
  "안녕하세요.": "你好。",
  "네, 확인했습니다.": "好的，收到。",
  "작업지시서 확인 부탁드립니다.": "请确认作业指示书。",
  "원단을 변경해 주세요.": "请更换面料。",
  "생산을 확정합니다.": "确认生产。",
  "단가가 너무 높습니다.": "单价太高了。",
  "도매 가격을 확인해 주세요.": "请确认批发价格。",
  "샘플을 보내주세요.": "请寄送样品。",
  "일정에 문제 없습니다.": "日程没有问题。",
  "언제 배송되나요?": "什么时候发货？",
  "이미지를 공유했습니다.": "分享了图片。",
  "동영상을 공유했습니다.": "分享了视频。",
  "파일을 공유했습니다.": "分享了文件。",
  "ST-00001 제품의 대화방을 개설합니다. 공장 현장 매니저님과 디자이너 분들은 진행 상황 공유해 주세요.": "我来开通ST-00001产品的聊天室。请工厂现场经理和设计师们分享进度。",
  "반갑습니다! 첫 번째 작업지시서 초안을 업로드합니다. 지퍼 위치와 마감 사양 검토 부탁드립니다.": "见到你们很高兴！上传第一版作业指示书草案。请检查拉链位置和收尾规格。",
  "새로운 작업지시서가 등록되었습니다: ST001_v1_Draft.png (3.4 MB)": "新作业指示书已注册：ST001_v1_Draft.png (3.4 MB)",
  "피드백 감사합니다. 지퍼 봉제 폭을 5mm 확장하여 수정한 작업지시서 2차 수정본을 공유합니다.": "感谢您的反馈。分享拉链缝线宽度扩大5mm后的作业指示书第二次修改版本。",
  "새로운 작업지시서가 등록되었습니다: ST001_v2_Zipper_Fixed.png (4.1 MB)": "新作业指示书已注册：ST001_v2_Zipper_Fixed.png (4.1 MB)",
  "원단 수급 일정 공유드립니다. 기능성 스판덱스 원단이 공장에 입고되었습니다. 신축성 테스트 리포트를 공유합니다.": "分享面料收发日程。功能性氨纶面料已入库工厂。分享弹性测试报告。",
  "첨부파일: Elasticity_Report_V2.pdf (1.2 MB)": "附件：Elasticity_Report_V2.pdf (1.2 MB)",
  "안녕하세요, ST-00001의 샘플 제작과 관련하여 방수 테스트를 진행하였습니다. 테스트 가이드 동영상을 참고해 주십시오.": "你好，关于ST-00001的样品制作，我们进行了防水测试。请参考测试指南视频。",
  "첨부파일: Seam_Sealing_Waterproof_Guide.mp4 (14.2 MB)": "附件：Seam_Sealing_Waterproof_Guide.mp4 (14.2 MB)",

  // 중국어 -> 한국어 (전송 및 번역용)
  "你好。": "안녕하세요.",
  "好的，收到。": "네, 확인했습니다.",
  "请确认作业指示书。": "작업지시서 확인 부탁드립니다.",
  "请更换面料。": "원단을 변경해 주세요.",
  "确认生产。": "생산을 확정합니다.",
  "单价太高了。": "단가가 너무 높습니다.",
  "请确认批发价格。": "도매 가격을 확인해 주세요.",
  "请寄送样品。": "샘플을 보내주세요.",
  "日程没有问题。": "일정에 문제 없습니다.",
  "什么时候发货？": "언제 배송되나요？",
  "没有问题。": "문제 없습니다.",
  "面料已更换。": "원단이 변경되었습니다.",
  "确认。": "확인했습니다.",
  "分享了图片。": "이미지를 공유했습니다.",
  "分享了视频。": "동영상을 공유했습니다.",
  "分享了文件。": "파일을 공유했습니다.",
  "我来开通ST-00001产品的聊天室。请工厂现场经理和设计师们分享进度。": "ST-00001 제품의 대화방을 개설합니다. 공장 현장 매니저님과 디자이너 분들은 진행 상황 공유해 주세요.",
  "你好，我是东莞工厂的生产经理。很高兴能在此平台协作。我们会全力配合设计修改。": "안녕하세요, 동관 공장의 생산 매니저입니다. 이 플랫폼에서 협업하게 되어 기쁩니다. 디자인 수정 사항에 적극 협조하겠습니다.",
  "见到你们很高兴！上传第一版作业指示书草案。请检查拉链位置和收尾规格。": "반갑습니다! 첫 번째 작업지시서 초안을 업로드합니다. 지퍼 위치와 마감 사양 검토 부탁드립니다.",
  "我们查看了第一版图纸。内部拉链的缝合线位置有点窄，在量产时可能会卡住防水胶条。建议建议调整缝边宽度。": "첫 번째 버전의 도면을 확인했습니다. 내부 지퍼의 봉제선 위치가 약간 좁아서, 양산 시 방수 테이프에 걸릴 우려가 있습니다. 시접 폭 조정을 제안합니다.",
  "我们查看了第一版图纸。内部拉链의 缝合线位置有点窄，在量产时可能会卡住防水胶条。建议建议调整缝边宽度。": "첫 번째 버전의 도면을 확인했습니다. 내부 지퍼의 봉제선 위치가 약간 좁아서, 양산 시 방수 테이프에 걸릴 우려가 있습니다. 시접 폭 조정을 제안합니다.",
  "感谢您的反馈。分享拉链缝线宽度扩大5mm后的作业指示书第二次修改版本。": "피드백 감사합니다. 지퍼 봉제 폭을 5mm 확장하여 수정한 작업지시서 2차 수정본을 공유합니다.",
  "新图纸非常完美。这样拉链受力更均匀。我们将使用该规格制作初版样品。": "새 도면은 완벽합니다. 이렇게 하면 지퍼의 힘 분산이 더 균일해집니다. 이 사양을 기반으로 첫 샘플 제작을 개시하겠습니다.",
  "分享面料收发日程。功能性氨纶面料已入库工厂。分享弹性测试报告。": "원단 수급 일정 공유드립니다. 기능성 스판덱스 원단이 공장에 입고되었습니다. 신축성 테스트 리포트를 공유합니다.",
  "你好，关于ST-00001의 샘플 제작, 우리는 방수 테스트를 진행하였습니다. 테스트 가이드 동영상을 참고해 주십시오.": "안녕하세요, ST-00001의 샘플 제작과 관련하여 방수 테스트를 진행하였습니다. 테스트 가이드 동영상을 참고해 주십시오.",
  "你好，关于ST-00001的样品制作，我们进行了防水测试。请参考测试指南视频。": "안녕하세요, ST-00001의 샘플 제작과 관련하여 방수 테스트를 진행하였습니다. 테스트 가이드 동영상을 참고해 주십시오.",

  // 원단 대분류 및 소분류 번역
  "면(Cotton) 계열": "棉(Cotton)系列",
  "린넨 계열": "亚麻(Linen)系列",
  "폴리 계열": "涤纶(Polyester)系列",
  "레이온 계열": "粘胶(Rayon)系列",
  "니트 / 저지 계열": "针织/泽西(Knit/Jersey)系列",
  "데님 계열": "牛仔(Denim)系列",
  "아우터 계열": "外套(Outer)系列",
  "여성복 특화": "女装特化系列",

  "면 20수": "20支棉",
  "면 30수": "30支棉",
  "면 40수": "40支棉",
  "코튼 트윌": "斜纹棉",
  "코튼 워싱": "水洗棉",
  "린넨 100%": "100%亚麻",
  "린넨 코튼": "棉麻混纺",
  "린넨 레이온": "粘麻混纺",
  "폴리 100%": "100%涤纶",
  "폴리 스판": "涤纶氨纶混纺",
  "폴리 쉬폰": "涤纶雪纺",
  "폴리 조젯": "涤纶乔其纱",
  "폴리 피치": "桃皮绒",
  "레이온 100%": "100%人造丝",
  "레이온 스판": "人造丝氨纶混纺",
  "레이온 나일론": "人造丝尼龙混纺",
  "싱글 저지": "单面汗布",
  "골지(Rib)": "罗纹布",
  "다이마루": "大圆机针织面料",
  "특양면": "罗马布",
  "쭈리": "毛圈布",
  "기모쭈리": "抓绒毛圈布",
  "데님 6oz": "6安士牛仔",
  "데님 8oz": "8安士牛仔",
  "데님 10oz": "10安士牛仔",
  "나일론": "尼龙",
  "나일론 스판": "尼龙氨纶混纺",
  "바람막이 원단": "防风衣面料",
  "패딩지": "防羽绒面料",
  "쉬폰": "雪纺",
  "새틴": "色丁/缎面",
  "오간자": "欧根纱",
  "벨벳": "天鹅绒",
  "레이스": "蕾丝"
};

function translateText(text: string, toLang: 'CN' | 'KO'): string {
  const trimmed = text.trim();
  if (TRANSLATION_MAP[trimmed]) {
    return TRANSLATION_MAP[trimmed];
  }
  
  if (toLang === 'CN') {
    let result = trimmed;
    if (result.includes("원단")) result = result.replace(/원단/g, "面料");
    if (result.includes("작업지시서")) result = result.replace(/작업지시서/g, "作业指示书");
    if (result.includes("확인")) result = result.replace(/확인/g, "确认");
    if (result.includes("가격") || result.includes("단가")) result = result.replace(/(가격|단가)/g, "单价");
    if (result.includes("감사합니다")) result = result.replace(/감사합니다/g, "谢谢");
    if (result.includes("안녕하세요")) result = result.replace(/안녕하세요/g, "你好");
    if (result.includes("반갑습니다")) result = result.replace(/반갑습니다/g, "很高兴");
    
    if (result !== trimmed) {
      return result;
    }
    return trimmed;
  } else {
    let result = trimmed;
    if (result.includes("面料")) result = result.replace(/面料/g, "원단");
    if (result.includes("作业指示书")) result = result.replace(/作业指示书/g, "작업지시서");
    if (result.includes("确认")) result = result.replace(/确认/g, "확인");
    if (result.includes("单价") || result.includes("价格")) result = result.replace(/(单价|价格)/g, "단가");
    if (result.includes("谢谢")) result = result.replace(/谢谢/g, "감사합니다");
    if (result.includes("你好")) result = result.replace(/你好/g, "안녕하세요");
    
    if (result !== trimmed) {
      return result;
    }
    return trimmed;
  }
}

const STATUS_CN_MAP: Record<string, string> = {
  "디자인중": "设计中",
  "공장검토": "工厂审核",
  "샘플진행": "样品制作",
  "생산확정": "确认生产",
  "생산중": "生产中",
  "완료": "已完成",
  "보류": "暂停",
  "디자인": "设计中",
  "아카이브": "已完成"
};

const getStatusLabel = (status: string, lang: 'KR' | 'CN') => {
  if (lang === 'CN') {
    return STATUS_CN_MAP[status] || status;
  }
  if (status === "디자인") return "디자인중";
  if (status === "아카이브") return "완료";
  return status;
};

// 동적 사용자 정보 및 역할 타이틀 번역 헬퍼
const getTranslatedName = (name: string, lang: 'KR' | 'CN') => {
  if (lang === 'KR') return name;
  if (name.startsWith("공장 직원 ")) {
    return name.replace("공장 직원 ", "工厂员工 ");
  }
  if (name.startsWith("협력사 직원 ")) {
    return name.replace("협력사 직원 ", "合作公司员工 ");
  }
  if (name.startsWith("관리자 ")) {
    return name.replace("관리자 ", "管理员 ");
  }
  if (name.startsWith("디자이너 ")) {
    return name.replace("디자이너 ", "设计师 ");
  }
  
  // 제품명 및 추가 번역
  const nameMap: Record<string, string> = {
    "오버사이즈 테크 쉘": "宽松科技夹克",
    "라이너 니트 V넥": "内衬V领针织衫",
    "택티컬 카고 팬츠": "战术工装裤",
    "크롭 윈드브레이커": "短款防风衣",
    "헤비웨이트 후드티": "重磅连帽衫",
    "슬림핏 셀비지 데님": "修身赤耳牛仔裤",
    "클래식 옥스포드 셔츠": "经典牛津纺衬衫",
    "테크니컬 플리스 자켓": "科技抓绒夹크",
    "린넨혼방 A": "亚麻混纺 A",
    "린넨혼방 B": "亚麻混纺 B",
    "시스템": "系统",
    "한국 매니저": "韩国经理",
    "공장 현장": "工厂现场",
    "디자이너 1": "设计师 1",
    "디자이너 2": "设计师 2",
    "중국 매니저": "中国经理",
    "2025 봄 컬렉션": "2025春季系列",
    "코어 에센셜": "核心单品",
    "액티브웨어": "运动服系列",
    "데님 라인": "牛仔系列"
  };
  return nameMap[name] || TRANSLATION_MAP[name] || name;
};

const getTranslatedRoleTitle = (roleTitle: string, lang: 'KR' | 'CN') => {
  if (lang === 'KR') return roleTitle;
  if (roleTitle === "글로벌 총괄 매니저") return "全球总监经理";
  if (roleTitle === "공장 현장") return "工厂现场";
  if (roleTitle === "글로벌 크리에이티브 디자이너") return "全球创意设计师";
  if (roleTitle === "시스템") return "系统";
  if (roleTitle === "공장 생산 실무 매니저") return "工厂生产实务经理";
  if (roleTitle === "생산 공장 현장 실무원") return "生产工厂现场实务员";
  if (roleTitle === "원단 공급 협력 파트너") return "面料供应合作机构";
  return roleTitle;
};

// 시스템 메시지 번역 헬퍼
const translateSystemMessage = (content: string, lang: 'KR' | 'CN') => {
  if (lang === 'KR') return content;
  
  if (content.startsWith("시스템: 상태가 '") && content.endsWith("'으로 변경되었습니다")) {
    const status = content.replace("시스템: 상태가 '", "").replace("'으로 변경되었습니다", "");
    const cnStatus = STATUS_CN_MAP[status] || status;
    return `系统：状态已变更为 '${cnStatus}'`;
  }
  if (content.startsWith("시스템: SCM 계산 결과가 업데이트되었습니다")) {
    return content
      .replace("시스템: SCM 계산 결과가 업데이트되었습니다", "系统：SCM 计算结果已更新")
      .replace("도매가", "批发价")
      .replace("원가", "成本");
  }
  if (content.startsWith("새로운 작업지시서가 등록되었습니다:")) {
    return content.replace("새로운 작업지시서가 등록되었습니다:", "新作业指示书已注册：");
  }
  if (content.startsWith("첨부파일:")) {
    return content.replace("첨부파일:", "附件：");
  }
  return TRANSLATION_MAP[content] || content;
};

interface FabricItem {
  id: string;
  name: string;
  imageUrl: string;
}

interface FabricCategory {
  categoryName: string;
  items: FabricItem[];
}

const TEXTURE_URLS = [
  "https://images.unsplash.com/photo-1545048702-79362596cdc9?auto=format&fit=crop&q=80&w=400", // Linen A
  "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&q=80&w=400", // Linen B
  "https://images.unsplash.com/photo-1606744824163-985d376605aa?auto=format&fit=crop&q=80&w=400", // Cotton
  "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&q=80&w=400", // Knit/Rib
  "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&q=80&w=400", // Denim
  "https://images.unsplash.com/photo-1571243006545-792f2c9dafc5?auto=format&fit=crop&q=80&w=400", // Nylon/Outer
  "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&q=80&w=400", // Silk/Satin/Chiffon
  "https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?auto=format&fit=crop&q=80&w=400"  // Pattern/Lace
];

const FABRIC_CATEGORIES: FabricCategory[] = [
  {
    categoryName: "면(Cotton) 계열",
    items: [
      { id: "COT-001", name: "면 20수", imageUrl: TEXTURE_URLS[2] },
      { id: "COT-002", name: "면 30수", imageUrl: TEXTURE_URLS[2] },
      { id: "COT-003", name: "면 40수", imageUrl: TEXTURE_URLS[2] },
      { id: "COT-004", name: "코튼 트윌", imageUrl: TEXTURE_URLS[2] },
      { id: "COT-005", name: "코튼 워싱", imageUrl: TEXTURE_URLS[2] }
    ]
  },
  {
    categoryName: "린넨 계열",
    items: [
      { id: "LIN-001", name: "린넨 100%", imageUrl: TEXTURE_URLS[0] },
      { id: "LIN-002", name: "린넨 코튼", imageUrl: TEXTURE_URLS[1] },
      { id: "LIN-003", name: "린넨 레이온", imageUrl: TEXTURE_URLS[0] }
    ]
  },
  {
    categoryName: "폴리 계열",
    items: [
      { id: "POL-001", name: "폴리 100%", imageUrl: TEXTURE_URLS[6] },
      { id: "POL-002", name: "폴리 스판", imageUrl: TEXTURE_URLS[6] },
      { id: "POL-003", name: "폴리 쉬폰", imageUrl: TEXTURE_URLS[6] },
      { id: "POL-004", name: "폴리 조젯", imageUrl: TEXTURE_URLS[6] },
      { id: "POL-005", name: "폴리 피치", imageUrl: TEXTURE_URLS[6] }
    ]
  },
  {
    categoryName: "레이온 계열",
    items: [
      { id: "RAY-001", name: "레이온 100%", imageUrl: TEXTURE_URLS[6] },
      { id: "RAY-002", name: "레이온 스판", imageUrl: TEXTURE_URLS[6] },
      { id: "RAY-003", name: "레이온 나일론", imageUrl: TEXTURE_URLS[6] }
    ]
  },
  {
    categoryName: "니트 / 저지 계열",
    items: [
      { id: "KNT-001", name: "싱글 저지", imageUrl: TEXTURE_URLS[3] },
      { id: "KNT-002", name: "골지(Rib)", imageUrl: TEXTURE_URLS[3] },
      { id: "KNT-003", name: "다이마루", imageUrl: TEXTURE_URLS[3] },
      { id: "KNT-004", name: "특양면", imageUrl: TEXTURE_URLS[3] },
      { id: "KNT-005", name: "쭈리", imageUrl: TEXTURE_URLS[3] },
      { id: "KNT-006", name: "기모쭈리", imageUrl: TEXTURE_URLS[3] }
    ]
  },
  {
    categoryName: "데님 계열",
    items: [
      { id: "DEN-001", name: "데님 6oz", imageUrl: TEXTURE_URLS[4] },
      { id: "DEN-002", name: "데님 8oz", imageUrl: TEXTURE_URLS[4] },
      { id: "DEN-003", name: "데님 10oz", imageUrl: TEXTURE_URLS[4] }
    ]
  },
  {
    categoryName: "아우터 계열",
    items: [
      { id: "OUT-001", name: "나일론", imageUrl: TEXTURE_URLS[5] },
      { id: "OUT-002", name: "나일론 스판", imageUrl: TEXTURE_URLS[5] },
      { id: "OUT-003", name: "바람막이 원단", imageUrl: TEXTURE_URLS[5] },
      { id: "OUT-004", name: "패딩지", imageUrl: TEXTURE_URLS[5] }
    ]
  },
  {
    categoryName: "여성복 특화",
    items: [
      { id: "WOM-001", name: "쉬폰", imageUrl: TEXTURE_URLS[6] },
      { id: "WOM-002", name: "새틴", imageUrl: TEXTURE_URLS[6] },
      { id: "WOM-003", name: "오간자", imageUrl: TEXTURE_URLS[6] },
      { id: "WOM-004", name: "벨벳", imageUrl: TEXTURE_URLS[6] },
      { id: "WOM-005", name: "레이스", imageUrl: TEXTURE_URLS[7] }
    ]
  }
];

export default function SyncFit5Page() {
  const { t, language } = useLanguage();
  // Authentication & Role State
  const [currentUser, setCurrentUser] = useState<SyncFitUser | null>(null);
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("면(Cotton) 계열");

  // Firestore Realtime States
  const [styles, setStyles] = useState<Style[]>([]);
  const [allMessages, setAllMessages] = useState<TimelineMessage[]>([]);
  const [mediaList, setMediaList] = useState<Media[]>([]);
  const [readLogs, setReadLogs] = useState<Record<string, string>>({});

  // Active Context
  const [activeStyleId, setActiveStyleId] = useState<string>("ST-00001");
  const [activeRightTab, setActiveRightTab] = useState<"techpack" | "files" | "showroom" | "scm">("scm");
  
  // Search & Filter
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<"전체" | "디자인" | "생산">("전체");

  // Color Book Config
  const [colorBooks, setColorBooks] = useState<ColorBookItem[]>([]);
  const [isFabricModalOpen, setIsFabricModalOpen] = useState<boolean>(false);
  const [targetColorBookId, setTargetColorBookId] = useState<string | null>(null);
  
  // Techpack Uploading & Viewer States
  const [isUploadingTechpack, setIsUploadingTechpack] = useState<boolean>(false);
  const [fullscreenImageIndex, setFullscreenImageIndex] = useState<number | null>(null);

  // New Chat Message
  const [newMsgText, setNewMsgText] = useState<string>("");

  // Chat File Upload Ref & State
  const chatFileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingChatFile, setIsUploadingChatFile] = useState<boolean>(false);
  const [chatLanguage, setChatLanguage] = useState<'KR' | 'CN'>('KR');

  // Derived Active Style (Fallback to mockStyles if firestore not yet loaded)
  const activeStyle = useMemo(() => {
    return styles.find((s) => s.id === activeStyleId) || mockStyles.find((s) => s.id === activeStyleId) || null;
  }, [styles, activeStyleId]);

  // Derived timeline messages for active style
  const messages = useMemo(() => {
    return allMessages
      .filter((m) => m.styleId === activeStyleId)
      .sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return (isNaN(timeA) ? 0 : timeA) - (isNaN(timeB) ? 0 : timeB);
      });
  }, [allMessages, activeStyleId]);

  // Derived techpacks and files for active style (Sorted by uploadedAt descending)
  const activeTechPacks = useMemo(() => {
    return mediaList
      .filter((m) => m.styleId === activeStyleId && m.type === "techpack")
      .sort((a, b) => {
        const timeA = a.uploadedAt ? new Date(a.uploadedAt).getTime() : 0;
        const timeB = b.uploadedAt ? new Date(b.uploadedAt).getTime() : 0;
        return (isNaN(timeB) ? 0 : timeB) - (isNaN(timeA) ? 0 : timeA);
      });
  }, [mediaList, activeStyleId]);

  const activeFiles = useMemo(() => {
    return mediaList.filter((m) => m.styleId === activeStyleId && m.type === "file");
  }, [mediaList, activeStyleId]);

  const activeColorBooks = useMemo(() => {
    return colorBooks.filter((cb) => cb.styleId === activeStyleId);
  }, [colorBooks, activeStyleId]);

  // Session recovery on client side
  useEffect(() => {
    const saved = localStorage.getItem("syncfit_user");
    if (saved) {
      try {
        setCurrentUser(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to restore session:", e);
      }
    }
  }, []);

  // Firestore & Storage Seeding & Realtime Synced Subscriptions
  useEffect(() => {
    const stylesCol = collection(db, "syncfit_styles");
    
    const unsubscribeStyles = onSnapshot(stylesCol, async (snapshot) => {
      if (snapshot.empty) {
        // Seeding initial 100% matching mockup data to Firestore (Col: syncfit_xxx)
        const batch = writeBatch(db);
        
        mockStyles.forEach((style) => {
          const docRef = doc(db, "syncfit_styles", style.id);
          batch.set(docRef, {
            ...style,
            isMock: true,
            updatedAt: new Date().toISOString()
          });
        });

        mockMessages.forEach((msg) => {
          const docRef = doc(db, "syncfit_messages", msg.id);
          batch.set(docRef, {
            ...msg,
            isMock: true
          });
        });

        mockMedia.forEach((med) => {
          const docRef = doc(db, "syncfit_media", med.id);
          batch.set(docRef, {
            ...med,
            isMock: true
          });
        });

        try {
          await batch.commit();
        } catch (e) {
          console.error("Failed to seed syncfit data:", e);
        }
        return;
      }

      const loadedStyles: Style[] = [];
      snapshot.forEach((docSnapshot) => {
        loadedStyles.push(docSnapshot.data() as Style);
      });
      loadedStyles.sort((a, b) => a.id.localeCompare(b.id));
      setStyles(loadedStyles);
      if (loadedStyles.length > 0) {
        setActiveStyleId((prev) => (prev ? prev : loadedStyles[0].id));
      }
    });

    const mediaCol = collection(db, "syncfit_media");
    const unsubscribeMedia = onSnapshot(mediaCol, (snapshot) => {
      const loadedMedia: Media[] = [];
      snapshot.forEach((docSnapshot) => {
        loadedMedia.push(docSnapshot.data() as Media);
      });
      setMediaList(loadedMedia);
    });

    const messagesCol = collection(db, "syncfit_messages");
    const unsubscribeMessages = onSnapshot(messagesCol, (snapshot) => {
      const loadedMessages: TimelineMessage[] = [];
      snapshot.forEach((docSnapshot) => {
        loadedMessages.push(docSnapshot.data() as TimelineMessage);
      });
      setAllMessages(loadedMessages);
    });

    const colorBooksCol = collection(db, "syncfit_colorbooks");
    const unsubscribeColorBooks = onSnapshot(colorBooksCol, (snapshot) => {
      const loadedColorBooks: ColorBookItem[] = [];
      snapshot.forEach((docSnapshot) => {
        loadedColorBooks.push(docSnapshot.data() as ColorBookItem);
      });
      setColorBooks(loadedColorBooks);
    });

    return () => {
      unsubscribeStyles();
      unsubscribeMedia();
      unsubscribeMessages();
      unsubscribeColorBooks();
    };
  }, []);

  // Read logs subscription for current user
  useEffect(() => {
    if (!currentUser) return;
    const readLogsCol = collection(db, "syncfit_read_logs");
    const q = query(readLogsCol, where("userName", "==", currentUser.name));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logs: Record<string, string> = {};
      snapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        if (data.styleId && data.lastReadAt) {
          logs[data.styleId] = data.lastReadAt;
        }
      });
      setReadLogs(logs);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // 작업지시서 전체화면 보기 키보드 네비게이션 제어
  useEffect(() => {
    if (fullscreenImageIndex === null || activeTechPacks.length === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        if (fullscreenImageIndex > 0) {
          setFullscreenImageIndex(fullscreenImageIndex - 1);
        }
      } else if (e.key === "ArrowRight") {
        if (fullscreenImageIndex < activeTechPacks.length - 1) {
          setFullscreenImageIndex(fullscreenImageIndex + 1);
        }
      } else if (e.key === "Escape") {
        setFullscreenImageIndex(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [fullscreenImageIndex, activeTechPacks]);

  // Update last read timestamp on active style transition
  const updateLastRead = async (styleId: string) => {
    if (!styleId || !currentUser) return;
    const docId = `${currentUser.name}_${styleId}`;
    try {
      await setDoc(doc(db, "syncfit_read_logs", docId), {
        id: docId,
        userName: currentUser.name,
        styleId,
        lastReadAt: new Date().toISOString()
      }, { merge: true });
    } catch (e) {
      console.error("Failed to update read log:", e);
    }
  };

  // 제품 목록 전환 시 풀스크린 이미지 모달 인덱스 초기화
  useEffect(() => {
    setFullscreenImageIndex(null);
  }, [activeStyleId]);

  useEffect(() => {
    if (activeStyleId) {
      updateLastRead(activeStyleId);
    }
  }, [activeStyleId, currentUser]);

  const lastMessageTime = messages.length > 0 ? messages[messages.length - 1].createdAt : "";
  useEffect(() => {
    if (activeStyleId && lastMessageTime) {
      updateLastRead(activeStyleId);
    }
  }, [activeStyleId, lastMessageTime]);

  // Calculate real-time unread messages count per style
  const unreadCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    styles.forEach((style) => {
      const lastRead = readLogs[style.id] ? new Date(readLogs[style.id]).getTime() : 0;
      const styleMessages = allMessages.filter((m) => m.styleId === style.id);
      counts[style.id] = styleMessages.filter((m) => new Date(m.createdAt).getTime() > lastRead).length;
    });
    return counts;
  }, [styles, readLogs, allMessages]);

  // Filter styles list
  const filteredStyles = useMemo(() => {
    return styles.filter((style) => {
      const matchesSearch = style.name.toLowerCase().includes(searchTerm.toLowerCase()) || style.id.toLowerCase().includes(searchTerm.toLowerCase());
      if (categoryFilter === "전체") return matchesSearch;
      if (categoryFilter === "디자인") return matchesSearch && (style.status === "디자인" || style.status === "디자인중");
      if (categoryFilter === "생산") return matchesSearch && (style.status === "생산중" || style.status === "생산확정" || style.status === "공장검토" || style.status === "샘플진행");
      return matchesSearch;
    });
  }, [styles, searchTerm, categoryFilter]);

  // Handlers & Mutators
  const handleLogin = (user: SyncFitUser) => {
    setCurrentUser(user);
    localStorage.setItem("syncfit_user", JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("syncfit_user");
  };

  const toggleAccordion = (section: string) => {
    setOpenAccordion(prev => (prev === section ? null : section));
  };

  // 1단 스타일 추가
  const handleAddNewStyle = async () => {
    const styleName = window.prompt(
      chatLanguage === 'KR' 
        ? "새로 추가할 스타일의 제품명을 입력해 주세요:" 
        : "请输入要新增的产品名称："
    );
    if (!styleName) return;

    const nextIdNum = styles.length + 1;
    const newId = `ST-0000${nextIdNum}`;

    const newStyle: Style = {
      id: newId,
      name: styleName,
      category: "2025 봄 컬렉션",
      status: "디자인중",
      updatedAt: new Date().toISOString(),
      scmPrice: {
        fabricCost: 75.00,
        usage: 1.50,
        cmt: 35.00,
        exchangeRate: 190.0
      }
    };

    try {
      await setDoc(doc(db, "syncfit_styles", newId), newStyle);
      setActiveStyleId(newId);
    } catch (e) {
      console.error("Failed to add style:", e);
    }
  };

  // 2단 메시지 전송
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsgText.trim() || !currentUser || !activeStyleId) return;

    // 역할에 따른 번역 대상 언어 설정
    let translated = "";
    if (currentUser.role === 'factory_staff' || currentUser.name.includes("중국")) {
      translated = translateText(newMsgText, 'KO');
    } else {
      translated = translateText(newMsgText, 'CN');
    }

    const newMsgId = `MSG-${Date.now()}`;
    const newMsg: TimelineMessage = {
      id: newMsgId,
      styleId: activeStyleId,
      sender: currentUser.name || "",
      role: currentUser.roleTitle || currentUser.role || "",
      avatar: currentUser.avatar || "",
      content: newMsgText,
      translatedContent: translated || "",
      createdAt: new Date().toISOString(),
      isSelf: true,
      isSystem: false,
      attachment: null
    };

    try {
      await setDoc(doc(db, "syncfit_messages", newMsgId), newMsg);
      await updateDoc(doc(db, "syncfit_styles", activeStyleId), {
        updatedAt: new Date().toISOString()
      });
      setNewMsgText("");
    } catch (e) {
      console.error("Failed to send message:", e);
      alert("메시지 전송 중 오류가 발생했습니다: " + (e instanceof Error ? e.message : String(e)));
    }
  };

  // 채팅방 일반 파일/이미지/동영상 업로드 처리
  const handleChatFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeStyleId || !currentUser) return;

    setIsUploadingChatFile(true);
    try {
      // 1. Firebase Storage 업로드
      const storagePath = `syncfit/messages/${activeStyleId}/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, storagePath);
      const uploadResult = await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(uploadResult.ref);

      // 2. 파일 크기 계산
      let sizeStr = "";
      if (file.size >= 1024 * 1024) {
        sizeStr = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
      } else {
        sizeStr = `${(file.size / 1024).toFixed(0)} KB`;
      }

      // 3. 파일 타입 판별 및 기본 피드 텍스트 생성
      const fileType = file.type || "";
      let msgContent = "";
      if (fileType.startsWith("image/")) {
        msgContent = "이미지를 공유했습니다.";
      } else if (fileType.startsWith("video/")) {
        msgContent = "동영상을 공유했습니다.";
      } else {
        msgContent = "파일을 공유했습니다.";
      }

      // 번역 텍스트 생성
      let translated = "";
      if (currentUser.role === 'factory_staff' || currentUser.name.includes("중국")) {
        translated = translateText(msgContent, 'KO');
      } else {
        translated = translateText(msgContent, 'CN');
      }

      // 4. Firestore syncfit_messages 메시지 추가
      const newMsgId = `MSG-${Date.now()}`;
      const newMsg: TimelineMessage = {
        id: newMsgId,
        styleId: activeStyleId,
        sender: currentUser.name || "",
        role: currentUser.roleTitle || currentUser.role || "",
        avatar: currentUser.avatar || "",
        content: msgContent,
        translatedContent: translated || "",
        createdAt: new Date().toISOString(),
        isSelf: true,
        isSystem: false,
        attachment: {
          fileName: file.name,
          fileSize: sizeStr,
          url: downloadUrl
        }
      };

      await setDoc(doc(db, "syncfit_messages", newMsgId), newMsg);

      // 5. Firestore syncfit_media 파일 보관함에 연동 추가 (type: 'file')
      const mediaId = `MEDIA-${Date.now()}`;
      const newMedia: Media = {
        id: mediaId,
        styleId: activeStyleId,
        type: 'file',
        url: downloadUrl,
        fileName: file.name,
        fileSize: sizeStr,
        uploadedAt: new Date().toISOString()
      };

      await setDoc(doc(db, "syncfit_media", mediaId), newMedia);

      // 6. 스타일 최종 업데이트 시간 갱신
      await updateDoc(doc(db, "syncfit_styles", activeStyleId), {
        updatedAt: new Date().toISOString()
      });

    } catch (err) {
      console.error("Failed to upload chat file:", err);
      alert("파일 업로드 중 오류가 발생했습니다: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsUploadingChatFile(false);
      e.target.value = "";
    }
  };

  // 2단 헤더 상태 업데이트 및 시스템 알림 추가
  const handleStatusChange = async (newStatus: string) => {
    if (!activeStyleId || !currentUser) return;
    
    try {
      await updateDoc(doc(db, "syncfit_styles", activeStyleId), {
        status: newStatus,
        updatedAt: new Date().toISOString()
      });

      // System notification timeline message
      const sysMsgId = `SYS-${Date.now()}`;
      const sysMsg: TimelineMessage = {
        id: sysMsgId,
        styleId: activeStyleId,
        sender: "시스템",
        role: "시스템",
        avatar: "",
        content: `시스템: 상태가 '${newStatus}'으로 변경되었습니다`,
        createdAt: new Date().toISOString(),
        isSelf: false,
        isSystem: true,
        attachment: null
      };

      await setDoc(doc(db, "syncfit_messages", sysMsgId), sysMsg);
    } catch (e) {
      console.error("Failed to update status:", e);
    }
  };

  // SCM 계산 수치 입력값 업데이트
  const handleScmChange = async (field: keyof ScmPrice, val: number) => {
    if (!activeStyle || !activeStyleId) return;
    const updatedScm = {
      fabricCost: activeStyle.scmPrice?.fabricCost ?? 84.50,
      usage: activeStyle.scmPrice?.usage ?? 1.85,
      cmt: activeStyle.scmPrice?.cmt ?? 45.00,
      exchangeRate: activeStyle.scmPrice?.exchangeRate ?? 190.0,
      [field]: val
    };

    try {
      await updateDoc(doc(db, "syncfit_styles", activeStyleId), {
        scmPrice: updatedScm,
        updatedAt: new Date().toISOString()
      });
    } catch (e) {
      console.error("Failed to update SCM price:", e);
    }
  };

  // 쇼룸 생산 확정
  const handleConfirmProduction = async () => {
    if (!activeStyleId) return;
    await handleStatusChange("생산확정");
    alert("생산 확정이 접수되었습니다. 스타일 상태가 '생산확정'으로 업데이트되었습니다.");
  };

  // 컬러북 데이터셋 정의
  const MOCK_FABRICS = FABRIC_CATEGORIES.flatMap(cat => cat.items);

  // 컬러북 추가
  const handleAddColorBook = async () => {
    if (!activeStyleId) return;
    const newId = `CB-${Date.now()}`;
    const defaultFabric = MOCK_FABRICS[0];
    const newColorBook: ColorBookItem = {
      id: newId,
      styleId: activeStyleId,
      fabricId: defaultFabric.id,
      fabricName: defaultFabric.name,
      fabricImageUrl: defaultFabric.imageUrl,
      colorHex: "#E7E0D3"
    };

    try {
      await setDoc(doc(db, "syncfit_colorbooks", newId), newColorBook);
    } catch (e) {
      console.error("Failed to add color book:", e);
    }
  };

  // 컬러북 원단 변경 적용
  const handleSelectFabric = async (fabric: typeof MOCK_FABRICS[0]) => {
    if (!targetColorBookId) return;
    try {
      await updateDoc(doc(db, "syncfit_colorbooks", targetColorBookId), {
        fabricId: fabric.id,
        fabricName: fabric.name,
        fabricImageUrl: fabric.imageUrl
      });
    } catch (e) {
      console.error("Failed to update fabric:", e);
    } finally {
      setIsFabricModalOpen(false);
      setTargetColorBookId(null);
    }
  };

  // 컬러북 컬러 변경 적용
  const handleColorChange = async (id: string, hex: string) => {
    try {
      await updateDoc(doc(db, "syncfit_colorbooks", id), {
        colorHex: hex
      });
    } catch (e) {
      console.error("Failed to update color:", e);
    }
  };

  // 컬러북 삭제
  const handleDeleteColorBook = async (id: string) => {
    if (!window.confirm(t("syncfit.colorbook_delete_confirm"))) return;
    try {
      await deleteDoc(doc(db, "syncfit_colorbooks", id));
    } catch (e) {
      console.error("Failed to delete color book:", e);
    }
  };

  // 작업지시서 이미지 업로드 처리
  const handleTechpackUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeStyleId) return;

    // 이미지 파일만 업로드 허용
    if (!file.type.startsWith("image/")) {
      alert("작업지시서는 이미지 파일(*.png, *.jpg, *.jpeg)만 등록 가능합니다.");
      return;
    }

    setIsUploadingTechpack(true);
    try {
      // 1. Firebase Storage 업로드
      const storagePath = `syncfit/techpacks/${activeStyleId}/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, storagePath);
      const uploadResult = await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(uploadResult.ref);

      // 2. 파일 사이즈 포맷팅
      let sizeStr = "";
      if (file.size >= 1024 * 1024) {
        sizeStr = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
      } else {
        sizeStr = `${(file.size / 1024).toFixed(0)} KB`;
      }

      // 3. Firestore syncfit_media 새 문서 추가
      const mediaId = `MEDIA-${Date.now()}`;
      const newMedia: Media = {
        id: mediaId,
        styleId: activeStyleId,
        type: "techpack",
        url: downloadUrl,
        fileName: file.name,
        fileSize: sizeStr,
        uploadedAt: new Date().toISOString()
      };

      await setDoc(doc(db, "syncfit_media", mediaId), newMedia);

      // 4. 피드에 시스템 메시지 자동 기록
      const sysMsgId = `MSG-SYS-${Date.now()}`;
      const sysMsg: TimelineMessage = {
        id: sysMsgId,
        styleId: activeStyleId,
        sender: "시스템",
        role: "시스템",
        avatar: "",
        content: `새로운 작업지시서가 등록되었습니다: ${file.name} (${sizeStr})`,
        createdAt: new Date().toISOString(),
        isSelf: false,
        isSystem: true,
        attachment: null
      };

      await setDoc(doc(db, "syncfit_messages", sysMsgId), sysMsg);

      alert("새 작업지시서 이미지가 정상적으로 등록되었습니다.");
    } catch (err) {
      console.error("Failed to upload techpack image:", err);
      alert("작업지시서 업로드 중 오류가 발생했습니다: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsUploadingTechpack(false);
      // 파일 입력 엘리먼트 초기화
      e.target.value = "";
    }
  };

  // 모의 데이터 일괄 삭제 처리
  const handleClearMockData = async () => {
    if (!window.confirm(t("syncfit.clear_mock_confirm"))) return;

    try {
      const batch = writeBatch(db);

      // 1. syncfit_styles 삭제
      const stylesSnap = await getDocs(collection(db, "syncfit_styles"));
      stylesSnap.forEach((d) => batch.delete(d.ref));

      // 2. syncfit_messages 삭제
      const messagesSnap = await getDocs(collection(db, "syncfit_messages"));
      messagesSnap.forEach((d) => batch.delete(d.ref));

      // 3. syncfit_media 삭제
      const mediaSnap = await getDocs(collection(db, "syncfit_media"));
      mediaSnap.forEach((d) => batch.delete(d.ref));

      // 4. syncfit_colorbooks 삭제
      const colorBooksSnap = await getDocs(collection(db, "syncfit_colorbooks"));
      colorBooksSnap.forEach((d) => batch.delete(d.ref));

      await batch.commit();
      alert(t("syncfit.clear_mock_success"));
      window.location.reload();
    } catch (e) {
      console.error("Failed to clear mock data:", e);
      alert(t("syncfit.clear_mock_error"));
    }
  };

  // Return Login Screen if not authenticated
  if (!currentUser) {
    return (
      <>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@600;700;800&family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&family=Outfit:wght@100..900&display=swap" rel="stylesheet" />
        
        <style dangerouslySetInnerHTML={{ __html: `
          .material-symbols-outlined {
              font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
          }
          .role-card:active {
              transform: scale(0.98);
          }
          .px-margin-desktop {
              padding-left: 32px !important;
              padding-right: 32px !important;
          }
          .px-margin-mobile {
              padding-left: 16px !important;
              padding-right: 16px !important;
          }
          .p-stack-md {
              padding: 16px !important;
          }
          .p-stack-lg {
              padding: 24px !important;
          }
          .p-stack-sm {
              padding: 8px !important;
          }
          .gap-stack-md {
              gap: 16px !important;
          }
          .gap-stack-sm {
              gap: 8px !important;
          }
          .mb-stack-md {
              margin-bottom: 16px !important;
          }
          .mb-stack-sm {
              margin-bottom: 8px !important;
          }
          .bg-surface-container-lowest { background-color: #ffffff !important; }
          .bg-surface { background-color: #faf8ff !important; }
          .text-on-surface { color: #131b2e !important; }
          .text-on-surface-variant { color: #434655 !important; }
          .text-primary { color: #004ac6 !important; }
          .border-outline-variant { border-color: #c3c6d7 !important; }
        `}} />

        <div className="bg-surface font-body-md text-on-surface min-h-screen flex flex-col">
          {/* 로그인 화면 전용 언어 토글바 */}
          <div className="w-full max-w-md mx-auto flex justify-end px-margin-mobile pt-6">
            <button 
              onClick={() => setChatLanguage(prev => prev === 'KR' ? 'CN' : 'KR')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-outline-variant text-label-md font-label-md hover:bg-slate-100 transition-colors bg-white text-on-surface"
            >
              <span className="material-symbols-outlined text-[20px]">language</span>
              <span>{chatLanguage === 'KR' ? "KR (한국어)" : "CN (중국어)"}</span>
            </button>
          </div>

          {/* Login screen header */}
          <header className="w-full pt-6 pb-8 px-margin-mobile flex flex-col items-center text-center">
            <div className="mb-6">
              <span className="text-primary text-[40px] font-black tracking-tighter">SyncFit</span>
            </div>
            <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-background mb-2">
              {chatLanguage === 'KR' ? "다시 오신 것을 환영합니다" : "欢迎回来"}
            </h1>
            <p className="font-body-md text-on-surface-variant max-w-[280px]">
              {chatLanguage === 'KR' ? "라이프사이클 대시보드에 접속하려면 프로필을 선택해 주세요." : "请选择一个配置文件以访问生命周期仪表板。"}
            </p>
          </header>

          <main className="flex-grow px-margin-mobile pb-12 overflow-y-auto">
            <div className="space-y-4 max-w-md mx-auto">
              
              {/* Admin Role Accordion */}
              <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden transition-all duration-200">
                <button 
                  className="w-full flex items-center justify-between p-stack-md" 
                  onClick={() => toggleAccordion("admin")}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>admin_panel_settings</span>
                    </div>
                    <div className="text-left">
                      <h3 className="font-title-lg text-title-lg text-on-surface">
                        {chatLanguage === 'KR' ? "관리자" : "管理员"}
                      </h3>
                      <p className="font-body-sm text-on-surface-variant">
                        {chatLanguage === 'KR' ? "글로벌 통합 관리" : "全球统一管理"}
                      </p>
                    </div>
                  </div>
                  <span className={`material-symbols-outlined text-outline transition-transform duration-300 ${openAccordion === "admin" ? "rotate-180" : ""}`}>expand_more</span>
                </button>
                <div className={`transition-all duration-300 overflow-hidden ${openAccordion === "admin" ? "max-h-[1000px] opacity-100 mt-3 p-stack-md pt-0" : "max-h-0 opacity-0 px-stack-md pb-0"}`}>
                  <div className="grid grid-cols-1 gap-2">
                    {MANAGERS.map((mgr) => (
                      <button key={mgr.name} className="role-card flex items-center p-stack-md bg-surface hover:bg-slate-100 border border-outline-variant rounded-lg transition-all w-full text-left" onClick={() => handleLogin(mgr)}>
                        <span className="material-symbols-outlined mr-3 text-secondary">shield_person</span>
                        <span className="font-label-md text-label-md">
                          {getTranslatedName(mgr.name, chatLanguage)} ({getTranslatedRoleTitle(mgr.roleTitle, chatLanguage)})
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Designer Role Accordion */}
              <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden transition-all duration-200">
                <button 
                  className="w-full flex items-center justify-between p-stack-md" 
                  onClick={() => toggleAccordion("designer")}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>palette</span>
                    </div>
                    <div className="text-left">
                      <h3 className="font-title-lg text-title-lg text-on-surface">
                        {chatLanguage === 'KR' ? "디자이너" : "设计师"}
                      </h3>
                      <p className="font-body-sm text-on-surface-variant">
                        {chatLanguage === 'KR' ? "제품 크리에이티브" : "产品创意"}
                      </p>
                    </div>
                  </div>
                  <span className={`material-symbols-outlined text-outline transition-transform duration-300 ${openAccordion === "designer" ? "rotate-180" : ""}`}>expand_more</span>
                </button>
                <div className={`transition-all duration-300 overflow-hidden ${openAccordion === "designer" ? "max-h-[1000px] opacity-100 mt-3 p-stack-md pt-0" : "max-h-0 opacity-0 px-stack-md pb-0"}`}>
                  <div className="grid grid-cols-1 gap-2">
                    {DESIGNERS.map((dsg) => (
                      <button key={dsg.name} className="role-card flex items-center p-stack-md bg-surface hover:bg-slate-100 border border-outline-variant rounded-lg transition-all w-full text-left" onClick={() => handleLogin(dsg)}>
                        <span className="material-symbols-outlined mr-3 text-secondary">person</span>
                        <span className="font-label-md text-label-md">
                          {getTranslatedName(dsg.name, chatLanguage)} ({getTranslatedRoleTitle(dsg.roleTitle, chatLanguage)})
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Factory Staff Accordion */}
              <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden transition-all duration-200">
                <button 
                  className="w-full flex items-center justify-between p-stack-md" 
                  onClick={() => toggleAccordion("factory")}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>factory</span>
                    </div>
                    <div className="text-left">
                      <h3 className="font-title-lg text-title-lg text-on-surface">
                        {chatLanguage === 'KR' ? "공장 직원" : "工厂员工"}
                      </h3>
                      <p className="font-body-sm text-on-surface-variant">
                        {chatLanguage === 'KR' ? "10개 활성 프로필" : "10个有效配置文件"}
                      </p>
                    </div>
                  </div>
                  <span className={`material-symbols-outlined text-outline transition-transform duration-300 ${openAccordion === "factory" ? "rotate-180" : ""}`}>expand_more</span>
                </button>
                <div className={`transition-all duration-300 overflow-hidden ${openAccordion === "factory" ? "max-h-[1000px] opacity-100 mt-3 p-stack-md pt-0" : "max-h-0 opacity-0 px-stack-md pb-0"}`}>
                  <div className="grid grid-cols-2 gap-2">
                    {FACTORY_STAFF.map((fac) => (
                      <button key={fac.name} className="role-card flex items-center p-stack-md bg-surface hover:bg-slate-100 border border-outline-variant rounded-lg transition-all w-full text-left" onClick={() => handleLogin(fac)}>
                        <span className="material-symbols-outlined mr-2 text-secondary text-sm">precision_manufacturing</span>
                        <span className="font-label-md text-label-md text-xs">
                          {getTranslatedName(fac.name, chatLanguage)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Vendor Staff Accordion */}
              <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden transition-all duration-200">
                <button 
                  className="w-full flex items-center justify-between p-stack-md" 
                  onClick={() => toggleAccordion("vendor")}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>inventory</span>
                    </div>
                    <div className="text-left">
                      <h3 className="font-title-lg text-title-lg text-on-surface">
                        {chatLanguage === 'KR' ? "협력사 직원" : "合作公司员工"}
                      </h3>
                      <p className="font-body-sm text-on-surface-variant">
                        {chatLanguage === 'KR' ? "30개 활성 프로필" : "30个有效配置文件"}
                      </p>
                    </div>
                  </div>
                  <span className={`material-symbols-outlined text-outline transition-transform duration-300 ${openAccordion === "vendor" ? "rotate-180" : ""}`}>expand_more</span>
                </button>
                <div className={`transition-all duration-300 overflow-hidden ${openAccordion === "vendor" ? "max-h-[1000px] opacity-100 mt-3 p-stack-md pt-0" : "max-h-0 opacity-0 px-stack-md pb-0"}`}>
                  <div className="grid grid-cols-2 gap-2">
                    {VENDORS.map((vnd) => (
                      <button key={vnd.name} className="role-card flex items-center p-stack-md bg-surface hover:bg-slate-100 border border-outline-variant rounded-lg transition-all w-full text-left" onClick={() => handleLogin(vnd)}>
                        <span className="material-symbols-outlined mr-2 text-secondary text-sm">storefront</span>
                        <span className="font-label-md text-label-md text-xs">
                          {getTranslatedName(vnd.name, chatLanguage)}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          </main>

          {/* Visual Anchor */}
          <div className="mt-auto px-margin-mobile pb-margin-mobile">
            <div className="relative w-full h-32 rounded-2xl overflow-hidden">
              <img alt="작업 공간 배경" className="w-full h-full object-cover grayscale opacity-20 contrast-125" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBUnDS6x89NvmkmZ3gCXLtiFYSegf1tULjaGa_2UDxOH1XI3bkzPeGHSQqkYBEa9lzFWdnD5F67RaDrsB9hgchF1yyRX7AzgdcnRmMFdkAbY2UGyueQkO4pizNhq68reMdv9q6BTgg-mkDvnT_yPggOUFmFL-c-vci0R_bg50sJFISj9zNu9jhmg7uHGZLtpI7_BAwDJBPzycPcgbiABXv08plhMxEOdEFWlasmOgrz6plk95EHI6ATvJ_2wddyjgnqNwoXM4lQSSs" />
              <div className="absolute inset-0 bg-gradient-to-t from-surface to-transparent"></div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // SCM Live Data Calculations
  const liveFabricCost = activeStyle?.scmPrice?.fabricCost ?? 84.50;
  const liveUsage = activeStyle?.scmPrice?.usage ?? 1.85;
  const liveCmt = activeStyle?.scmPrice?.cmt ?? 45.00;
  const liveExchangeRate = activeStyle?.scmPrice?.exchangeRate ?? 190.0;

  const liveTotalCostCny = (liveFabricCost * liveUsage) + liveCmt;
  const liveTotalCostKrw = liveTotalCostCny * liveExchangeRate;
  const liveWholesalePriceKrw = liveTotalCostKrw / 0.4;
  const liveWholesalePriceCny = liveTotalCostCny / 0.4;

  // Render Main 3단 대시보드
  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@600;700;800;900&family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&family=Outfit:wght@100..900&display=swap" rel="stylesheet" />
      
      <style dangerouslySetInnerHTML={{ __html: `
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
            vertical-align: middle;
        }
        .swatch-active {
            box-shadow: 0 0 0 2px white, 0 0 0 4px #004ac6;
        }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

        /* Stitch Specific Spacing Tokens Override */
        .px-margin-desktop {
            padding-left: 32px !important;
            padding-right: 32px !important;
        }
        .p-stack-md {
            padding: 16px !important;
        }
        .p-stack-lg {
            padding: 24px !important;
        }
        .p-stack-sm {
            padding: 8px !important;
        }
        .gap-stack-md {
            gap: 16px !important;
        }
        .gap-stack-sm {
            gap: 8px !important;
        }

        /* Color Palette Override for Zero Deviation */
        .bg-surface-container-low { background-color: #f2f3ff !important; }
        .bg-surface { background-color: #faf8ff !important; }
        .bg-white { background-color: #ffffff !important; }
        .bg-slate-50 { background-color: #f8fafc !important; }
        .text-on-surface { color: #131b2e !important; }
        .text-on-surface-variant { color: #434655 !important; }
        .text-primary { color: #004ac6 !important; }
        .border-outline-variant { border-color: #c3c6d7 !important; }
        .border-slate-200 { border-color: #e2e8f0 !important; }
        .bg-primary { background-color: #004ac6 !important; }
        .text-on-primary { color: #ffffff !important; }
        .bg-primary-container\\/10 { background-color: rgba(37, 99, 235, 0.1) !important; }
        .border-primary { border-color: #004ac6 !important; }
      `}} />

      <div className="bg-surface-container-low text-on-surface font-body-md overflow-hidden h-screen flex flex-col w-full">
        {/* TopNavBar */}
        <header className="flex justify-between items-center w-full px-margin-desktop h-16 z-50 bg-surface border-b border-outline-variant shrink-0">
          <div className="flex items-center gap-stack-md">
            <span className="text-title-lg font-title-lg font-black text-primary">SyncFit</span>
            <div className="flex items-center ml-8 gap-6 h-full">
              <a className="h-full flex items-center text-primary border-b-2 border-primary font-label-md text-label-md" href="#">
                {chatLanguage === 'KR' ? "상태" : "状态"}
              </a>
              <a className="h-full flex items-center text-on-surface-variant hover:bg-surface-container-high transition-colors font-label-md text-label-md px-2" href="#">
                {chatLanguage === 'KR' ? "벤더" : "供应商"}
              </a>
              <a className="h-full flex items-center text-on-surface-variant hover:bg-surface-container-high transition-colors font-label-md text-label-md px-2" href="#">
                {chatLanguage === 'KR' ? "공장" : "工厂"}
              </a>
              <a className="h-full flex items-center text-on-surface-variant hover:bg-surface-container-high transition-colors font-label-md text-label-md px-2" href="#">
                {chatLanguage === 'KR' ? "아카이브" : "存档"}
              </a>
            </div>
          </div>
          <div className="flex items-center gap-stack-md">
            <button 
              onClick={() => setChatLanguage(prev => prev === 'KR' ? 'CN' : 'KR')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-outline-variant text-label-md font-label-md hover:bg-surface-container-high transition-colors bg-white text-on-surface"
            >
              <span className="material-symbols-outlined text-[20px]">language</span>
              <span>{chatLanguage === 'KR' ? "KR (한국어)" : "CN (중국어)"}</span>
            </button>
            <div className="h-8 w-px bg-outline-variant mx-2"></div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="font-label-md text-label-md text-on-surface">
                  {currentUser ? getTranslatedName(currentUser.name, chatLanguage) : ""}
                </p>
                <p className="text-[12px] text-on-surface-variant">
                  {currentUser ? getTranslatedRoleTitle(currentUser.roleTitle, chatLanguage) : ""}
                </p>
              </div>
              <img alt="User profile" className="w-10 h-10 rounded-full object-cover border-2 border-primary-container" src={currentUser?.avatar || ""} />
            </div>
            <button onClick={handleLogout} className="ml-2 text-on-surface-variant hover:text-error transition-colors p-2">
              <span className="material-symbols-outlined">logout</span>
            </button>
          </div>
        </header>

        {/* Main Content Area (PC 3단 분할 레이아웃 고정) */}
        <main className="flex-1 flex overflow-hidden w-full">
          
          {/* Column 1: Style List (제품 목록 여백 제거 px-0) */}
          <aside className="flex flex-col w-[300px] bg-surface border-r border-outline-variant shrink-0">
            <div className="p-stack-md flex flex-col gap-stack-md">
              <div className="flex justify-between items-center">
                <h2 className="font-headline-md text-headline-md">
                  {chatLanguage === 'KR' ? "스타일 탐색기" : "款式探索器"}
                </h2>
              </div>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
                <input 
                  className="w-full pl-10 pr-4 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-body-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none" 
                  placeholder={chatLanguage === 'KR' ? "스타일 검색..." : "搜索款式..."} 
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                <button 
                  onClick={() => setCategoryFilter("전체")}
                  className={`px-3 py-1 rounded-full text-label-md font-label-md whitespace-nowrap transition-colors ${categoryFilter === "전체" ? "bg-primary text-on-primary" : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest"}`}
                >
                  {chatLanguage === 'KR' ? "전체" : "全部"}
                </button>
                <button 
                  onClick={() => setCategoryFilter("디자인")}
                  className={`px-3 py-1 rounded-full text-label-md font-label-md whitespace-nowrap transition-colors ${categoryFilter === "디자인" ? "bg-primary text-on-primary" : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest"}`}
                >
                  {chatLanguage === 'KR' ? "디자인" : "设计"}
                </button>
                <button 
                  onClick={() => setCategoryFilter("생산")}
                  className={`px-3 py-1 rounded-full text-label-md font-label-md whitespace-nowrap transition-colors ${categoryFilter === "생산" ? "bg-primary text-on-primary" : "bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest"}`}
                >
                  {chatLanguage === 'KR' ? "생산" : "生产"}
                </button>
              </div>
              <button 
                onClick={handleAddNewStyle}
                className="w-full py-2.5 bg-primary text-on-primary rounded-lg font-label-md text-label-md flex items-center justify-center gap-2 hover:bg-primary/95 transition-all active:scale-[0.98]"
              >
                <span className="material-symbols-outlined">add</span>
                {chatLanguage === 'KR' ? "새 제품 추가" : "添加新产品"}
              </button>

            </div>

            {/* 카드 목록 영역 좌우 패딩 px-0, space-y-0 으로 여백 제거 */}
            <div className="flex-1 overflow-y-auto px-0 pb-stack-lg space-y-0">
              {filteredStyles.map((style) => {
                const isActive = style.id === activeStyleId;
                const unread = unreadCounts[style.id] || 0;

                return (
                  <div 
                    key={style.id}
                    onClick={() => setActiveStyleId(style.id)}
                    className={`p-4 cursor-pointer transition-all ${
                      isActive 
                        ? "bg-primary-container/10 border-y-2 border-primary" 
                        : "bg-surface border-b border-outline-variant hover:bg-surface-container-high"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className={`font-code-sm text-code-sm ${isActive ? "text-primary" : "text-on-surface-variant"}`}>
                        {style.id}
                      </span>
                      {unread > 0 && (
                        <span className="px-2 py-0.5 bg-error text-white text-[10px] font-bold rounded-full">
                          {unread}
                        </span>
                      )}
                    </div>
                    <h3 className="font-label-md text-label-md mb-1">
                      {chatLanguage === 'CN' ? (TRANSLATION_MAP[style.name] || style.name) : style.name}
                    </h3>
                    <p className="text-body-sm text-on-surface-variant mb-3">
                      {chatLanguage === 'CN' ? (TRANSLATION_MAP[style.category] || style.category) : style.category}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-1 text-[11px] rounded font-bold uppercase tracking-wider ${
                        style.status === "생산중" || style.status === "생산확정" || style.status === "샘플진행"
                          ? "bg-tertiary-fixed text-on-tertiary-fixed-variant" 
                          : "bg-surface-container-highest text-on-surface-variant"
                      }`}>
                        {getStatusLabel(style.status, chatLanguage)}
                      </span>
                      <span className="text-[11px] text-on-surface-variant">
                        {chatLanguage === 'KR' ? "업데이트 완료" : "更新完毕"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </aside>

          {/* Column 2: Collaboration Feed */}
          <section className="flex-1 flex flex-col bg-slate-50 relative min-w-0">
            <div className="p-4 border-b border-outline-variant bg-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-primary-container/20 rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary">factory</span>
                </div>
                <div>
                  <h1 className="font-headline-sm font-bold text-lg">둥관 정밀 텍스타일 (Dongguan Precision)</h1>
                </div>
              </div>
              {/* 자동번역 삭제 후 상태 드롭다운 배치 및 실시간 Firestore 연동 */}
              {activeStyle && (
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <select 
                      className="appearance-none bg-surface-container-low border border-outline-variant rounded-full pl-3 pr-8 py-1.5 text-label-md font-label-md text-on-surface-variant focus:ring-primary outline-none"
                      value={activeStyle.status}
                      onChange={(e) => handleStatusChange(e.target.value)}
                    >
                      <option value="디자인중">{chatLanguage === 'KR' ? "상태: 디자인중" : "状态: 设计中"}</option>
                      <option value="공장검토">{chatLanguage === 'KR' ? "상태: 공장검토" : "状态: 工厂审核"}</option>
                      <option value="샘플진행">{chatLanguage === 'KR' ? "상태: 샘플진행" : "状态: 样品制作"}</option>
                      <option value="생산확정">{chatLanguage === 'KR' ? "상태: 생산확정" : "状态: 确认生产"}</option>
                      <option value="생산중">{chatLanguage === 'KR' ? "상태: 생산중" : "状态: 生产中"}</option>
                      <option value="완료">{chatLanguage === 'KR' ? "상태: 완료" : "状态: 已完成"}</option>
                      <option value="보류">{chatLanguage === 'KR' ? "상태: 보류" : "状态: 暂停"}</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant text-[18px]">expand_more</span>
                  </div>
                </div>
              )}
            </div>

            {/* Feed Area */}
            <div className="flex-1 overflow-y-auto p-stack-md space-y-6">
              {messages.map((msg) => {
                if (msg.isSystem) {
                  return (
                    <div key={msg.id} className="flex justify-center">
                      <span className="px-4 py-1.5 bg-secondary-container text-on-secondary-fixed-variant text-[12px] font-bold rounded-full uppercase tracking-widest">
                        {msg.content}
                      </span>
                    </div>
                  );
                }

                const isMsgSelf = currentUser ? msg.sender === currentUser.name : false;
                
                // 메시지 내용의 실제 언어로 판별 (한글이 포함되어 있으면 한국어 메시지, 없으면 중국어 메시지로 간주)
                const isKoreanMsg = /[\uac00-\ud7a3]/.test(msg.content);
                const isChineseMsg = !isKoreanMsg && !msg.isSystem;

                // 표시할 텍스트 결정
                let mainContent = msg.content;
                let subContent = "";

                if (chatLanguage === 'KR') {
                  // 한국어 모드: 중국어 메시지를 번역하여 노출
                  if (isChineseMsg) {
                    mainContent = msg.translatedContent || translateText(msg.content, 'KO');
                    subContent = msg.content;
                  } else {
                    // 한국어 메시지는 번역 없이 그대로 노출
                    mainContent = msg.content;
                    subContent = "";
                  }
                } else {
                  // 중국어 모드(CN): 한국어 메시지를 번역하여 노출
                  if (isKoreanMsg) {
                    mainContent = msg.translatedContent || translateText(msg.content, 'CN');
                    subContent = msg.content;
                  } else {
                    // 중국어 메시지는 번역 없이 그대로 노출
                    mainContent = msg.content;
                    subContent = "";
                  }
                }

                const subLabel = chatLanguage === 'KR'
                  ? (isChineseMsg ? "원문 (중국어)" : "")
                  : (isKoreanMsg ? "원문 (한국어)" : "");

                return (
                  <div key={msg.id} className={`flex gap-3 max-w-[85%] ${isMsgSelf ? "ml-auto flex-row-reverse" : ""}`}>
                    {!isMsgSelf && (
                      <div className="w-8 h-8 shrink-0 bg-secondary rounded-full overflow-hidden">
                        <img alt={msg.sender} className="w-full h-full object-cover" src={msg.avatar || "https://lh3.googleusercontent.com/aida-public/AB6AXuARfsdno299WSXQ9px-FH-zricBXUIrmcVqm1WQoh5_8CTE6nGdOOeFzbWBbmRMFqWfMoNTXajcAZln37ke9YokuZL9-wrhC1qafYKtRoog91hEE28MB4ZRl-7A2CUVUniXqzV_2aMAyNkFvlFyDxPiyR5nEseN5IRytdc0snj22H27VxG1oCSSxAvR3U7N3clHVMMBfEuxrr89ewZQv-2MdoQXKwe8a3WXdcFaycAPC4W8qQviz8ZeAQSOUVFyUnMrpxr7qANk-Gk"} />
                      </div>
                    )}
                    {isMsgSelf && (
                      <div className="w-8 h-8 shrink-0 bg-primary rounded-full overflow-hidden">
                        <img alt={msg.sender} className="w-full h-full object-cover" src={msg.avatar || "https://lh3.googleusercontent.com/aida-public/AB6AXuD2_Mf7ImZA9SiRDfMa-IpT2pLME8YXDlynNT0IB6HM6slkN4_6T5yLMgg3wxeq0yWDbfiVwMz2EDJacAJZgGEzXxjciDTi5k0qe_HboMlgXjLzWYoCPZYME2VvhfxEmCaN_U_Y3wMLRWZUBQ6r9mEPle8GLy86xoWW55G-2mT2RKA4BAJZUHnmZYP_lDsweWrghP1SSc7Hhi8GNkBM8yiCMpvgjC6GCqSmF40v-obRIWfgmM7cllRGjPYLHLkyQUe91RgQ6LXsK00"} />
                      </div>
                    )}
                    <div className={isMsgSelf ? "text-right" : ""}>
                      <div className={`p-4 rounded-2xl shadow-sm border ${
                        isMsgSelf 
                          ? "bg-primary text-on-primary border-primary rounded-tr-none text-left" 
                          : "bg-white border-slate-200 rounded-tl-none text-left"
                      }`}>
                        {msg.attachment ? (() => {
                          const att = msg.attachment;
                          const fileName = att.fileName || "file";
                          const fileSize = att.fileSize || "0 KB";
                          const fileUrl = att.url || "";
                          const isImage = fileName.match(/\.(jpeg|jpg|gif|png|webp)$/i);
                          const isVideo = fileName.match(/\.(mp4|webm|ogg|mov)$/i);

                          return (
                            <div className="flex flex-col gap-2">
                              {isImage ? (
                                <div className="relative rounded-lg overflow-hidden border border-outline-variant max-w-[280px] bg-slate-100">
                                  <img 
                                    src={fileUrl} 
                                    alt={fileName} 
                                    className="w-full h-auto object-contain max-h-[200px] cursor-pointer hover:opacity-95"
                                    onClick={() => window.open(fileUrl, '_blank')}
                                  />
                                </div>
                              ) : isVideo ? (
                                <video 
                                  src={fileUrl} 
                                  controls 
                                  className="max-w-[280px] rounded-lg border border-outline-variant bg-black"
                                />
                              ) : (
                                <a 
                                  href={fileUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                                    isMsgSelf 
                                      ? "bg-white/10 hover:bg-white/20 border-white/20 text-white" 
                                      : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-on-surface"
                                  }`}
                                >
                                  <span className="material-symbols-outlined text-[28px]">description</span>
                                  <div className="flex-1 min-w-0 text-left">
                                    <p className="text-xs font-bold truncate">{fileName}</p>
                                    <p className="text-[10px] opacity-75">{fileSize}</p>
                                  </div>
                                  <span className="material-symbols-outlined">download</span>
                                </a>
                              )}
                              {msg.content && <p className="text-body-sm mt-1">{mainContent}</p>}
                            </div>
                          );
                        })() : (
                          <p className="text-body-md">{mainContent}</p>
                        )}

                        {subContent && (
                          <div className={`mt-2 pt-2 border-t flex flex-col gap-0.5 text-left ${
                            isMsgSelf ? "border-white/10" : "border-slate-100"
                          }`}>
                            <span className={`text-[9px] font-bold uppercase ${
                              isMsgSelf ? "text-white/70" : "text-primary"
                            }`}>
                              {subLabel}
                            </span>
                            <p className={`text-body-sm italic ${
                              isMsgSelf ? "text-white/80" : "text-on-surface-variant"
                            }`}>
                              "{subContent}"
                            </p>
                          </div>
                        )}
                      </div>
                      <span className="text-[11px] text-on-surface-variant mt-1 block px-1">
                        {msg.sender} • {(() => {
                          try {
                            return new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                          } catch (e) {
                            return "";
                          }
                        })()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Input Area */}
            <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-outline-variant shrink-0">
              <div className="max-w-4xl mx-auto">
                {isUploadingChatFile && (
                  <div className="flex items-center gap-2 mb-2 text-xs font-bold text-primary animate-pulse px-2">
                    <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <span>
                      {chatLanguage === 'KR' ? "파일 업로드 중... 잠시만 기다려 주세요." : "文件上传中... 请稍候。"}
                    </span>
                  </div>
                )}
                <div className="flex items-end gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-2">
                  <button 
                    type="button" 
                    onClick={() => chatFileInputRef.current?.click()}
                    disabled={isUploadingChatFile}
                    className="p-2 text-on-surface-variant hover:text-primary transition-colors disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined">attach_file</span>
                  </button>
                  <input 
                    type="file" 
                    ref={chatFileInputRef} 
                    onChange={handleChatFileUpload} 
                    className="hidden" 
                    disabled={isUploadingChatFile}
                  />
                  <textarea 
                    className="flex-1 bg-transparent border-none focus:ring-0 resize-none py-2 text-body-md min-h-[40px] outline-none" 
                    placeholder={isUploadingChatFile ? (chatLanguage === 'KR' ? "파일 업로드 중..." : "正在上传文件...") : (chatLanguage === 'KR' ? "공장에 메시지 입력..." : "向工厂发送消息...")} 
                    rows={1}
                    value={newMsgText}
                    onChange={(e) => setNewMsgText(e.target.value)}
                    disabled={isUploadingChatFile}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(e);
                      }
                    }}
                  />
                  <button 
                    type="submit" 
                    disabled={isUploadingChatFile || !newMsgText.trim()}
                    className="bg-primary text-on-primary w-10 h-10 rounded-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                  >
                    <span className="material-symbols-outlined">send</span>
                  </button>
                </div>
              </div>
            </form>
          </section>

          {/* Column 3: Style Detail Panel (항상 표시) */}
          <aside className="flex flex-col w-[400px] bg-white border-l border-outline-variant shrink-0">
            {/* Tabs */}
            <div className="flex border-b border-outline-variant overflow-x-auto no-scrollbar shrink-0">
              <button 
                onClick={() => setActiveRightTab("techpack")}
                className={`flex-1 py-4 px-2 text-[12px] font-bold uppercase tracking-wider text-center border-b-2 transition-colors ${activeRightTab === "techpack" ? "text-primary border-primary bg-primary-container/5" : "text-on-surface-variant hover:bg-surface-container-low border-transparent"}`}
              >
                {chatLanguage === 'KR' ? "작업지시서" : "作业指示书"}
              </button>
              <button 
                onClick={() => setActiveRightTab("files")}
                className={`flex-1 py-4 px-2 text-[12px] font-bold uppercase tracking-wider text-center border-b-2 transition-colors ${activeRightTab === "files" ? "text-primary border-primary bg-primary-container/5" : "text-on-surface-variant hover:bg-surface-container-low border-transparent"}`}
              >
                {chatLanguage === 'KR' ? "파일" : "文件"}
              </button>
              <button 
                onClick={() => setActiveRightTab("showroom")}
                className={`flex-1 py-4 px-2 text-[12px] font-bold uppercase tracking-wider text-center border-b-2 transition-colors ${activeRightTab === "showroom" ? "text-primary border-primary bg-primary-container/5" : "text-on-surface-variant hover:bg-surface-container-low border-transparent"}`}
              >
                {chatLanguage === 'KR' ? "컬러북" : "配色册"}
              </button>
              <button 
                onClick={() => setActiveRightTab("scm")}
                className={`flex-1 py-4 px-2 text-[12px] font-bold uppercase tracking-wider text-center border-b-2 transition-colors ${activeRightTab === "scm" ? "text-primary border-primary bg-primary-container/5" : "text-on-surface-variant hover:bg-surface-container-low border-transparent"}`}
              >
                SCM
              </button>
            </div>

            {/* Inner Content Switcher */}
            <div className="flex-1 overflow-y-auto p-stack-md">
              {activeRightTab === "techpack" && (
                <div className="space-y-6">
                  {/* Header & Upload Button for Designer/Admin */}
                  <div className="flex items-center justify-between">
                    <h3 className="font-headline-md text-headline-md font-bold">
                      {chatLanguage === 'KR' ? "작업지시서" : "作业指示书"}
                    </h3>
                    {(currentUser?.role === "designer" || currentUser?.role === "admin") && (
                      <div>
                        <label className="flex items-center gap-2 px-3 py-2 bg-primary hover:bg-primary/90 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors shadow-sm">
                          <span className="material-symbols-outlined text-[18px]">upload</span>
                          {chatLanguage === 'KR' ? "신규 등록" : "上传新图"}
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={handleTechpackUpload} 
                            className="hidden" 
                            disabled={isUploadingTechpack}
                          />
                        </label>
                      </div>
                    )}
                  </div>

                  {/* Uploading Spinner Overlay */}
                  {isUploadingTechpack && (
                    <div className="flex flex-col items-center justify-center p-8 bg-slate-50 border border-dashed border-outline-variant rounded-xl animate-pulse">
                      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-2"></div>
                      <p className="text-body-sm font-bold text-primary">
                        {chatLanguage === 'KR' ? "작업지시서 업로드 중..." : "正在上传作业指示书..."}
                      </p>
                    </div>
                  )}

                  {/* Latest Techpack Preview */}
                  {activeTechPacks.length > 0 ? (
                    <div className="space-y-4">
                      {/* 최신 작업지시서 큰 이미지 영역 */}
                      <div className="group relative border border-outline-variant rounded-xl overflow-hidden bg-slate-100 flex flex-col">
                        <div className="p-3 bg-slate-200/50 border-b border-outline-variant flex items-center justify-between text-xs font-medium">
                          <span className="text-body-sm font-bold truncate flex-1 mr-2">
                            {activeTechPacks[0].fileName}
                          </span>
                          <span className="shrink-0 text-on-surface-variant">
                            {(() => {
                              try {
                                const d = activeTechPacks[0]?.uploadedAt;
                                return d ? new Date(d).toLocaleDateString() : "";
                              } catch (e) {
                                return "";
                              }
                            })()}
                          </span>
                        </div>
                        
                        <div 
                          onClick={() => setFullscreenImageIndex(0)}
                          className="relative h-[280px] w-full flex items-center justify-center bg-white cursor-pointer overflow-hidden"
                        >
                          <img 
                            src={activeTechPacks[0].url && activeTechPacks[0].url.startsWith("http") ? activeTechPacks[0].url : "/images/techpack/techpack_template.png"} 
                            alt={chatLanguage === 'KR' ? "최신 작업지시서" : "最新作业指示书"} 
                            className="w-full h-full object-contain p-2 transition-transform duration-300 group-hover:scale-[1.02]"
                          />
                          {/* Hover Overlay */}
                          <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <span className="w-10 h-10 rounded-full bg-black/60 text-white flex items-center justify-center shadow-md">
                              <span className="material-symbols-outlined">zoom_in</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 이전 버전 목록 (최신순 정렬) */}
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
                          {chatLanguage === 'KR' ? `이전 버전 이력 (${activeTechPacks.length})` : `历史版本列表 (${activeTechPacks.length})`}
                        </h4>
                        <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                          {activeTechPacks.map((med, idx) => (
                            <div 
                              key={med.id} 
                              onClick={() => setFullscreenImageIndex(idx)}
                              className={`flex items-center gap-3 p-3 bg-white rounded-xl border transition-all cursor-pointer ${idx === 0 ? "border-primary/40 bg-primary-container/5 hover:bg-primary-container/10" : "border-outline-variant hover:bg-slate-50"}`}
                            >
                              {/* Thumbnail preview */}
                              <div className="w-12 h-12 rounded bg-slate-100 border border-outline-variant shrink-0 overflow-hidden flex items-center justify-center">
                                <img 
                                  src={med.url && med.url.startsWith("http") ? med.url : "/images/techpack/techpack_template.png"} 
                                  alt="미니보기" 
                                  className="w-full h-full object-contain p-0.5"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-0.5">
                                  <p className="text-body-sm font-bold truncate">{med.fileName}</p>
                                  {idx === 0 && <span className="px-1.5 py-0.5 bg-primary/10 text-primary font-bold text-[9px] rounded">{chatLanguage === 'KR' ? "최신" : "最新"}</span>}
                                </div>
                                <p className="text-[10px] text-on-surface-variant">
                                  {med.fileSize} • {(() => {
                                    try {
                                      return med.uploadedAt ? new Date(med.uploadedAt).toLocaleString() : "";
                                    } catch (e) {
                                      return "";
                                    }
                                  })()}
                                </p>
                              </div>
                              <span className="material-symbols-outlined text-on-surface-variant font-light text-[20px]">chevron_right</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* 등록된 작업지시서가 없는 경우 기본 템플릿 보기 제공 */
                    <div className="space-y-4">
                      <div className="border border-outline-variant rounded-xl overflow-hidden bg-slate-100 flex flex-col">
                        <div className="p-3 bg-slate-200/50 border-b border-outline-variant flex items-center justify-between text-xs font-medium">
                          <span className="text-body-sm font-bold">
                            {chatLanguage === 'KR' ? "기본 작업지시서 템플릿" : "默认作业指示书模板"}
                          </span>
                        </div>
                        <div 
                          onClick={() => {
                            alert(chatLanguage === 'KR' ? "등록된 작업지시서가 없습니다. 디자이너 계정으로 작업지시서 이미지를 신규 등록해 주십시오." : "暂无已注册的作业指示书。请用设计师账号上传新的作业指示书图片。");
                          }}
                          className="relative h-[250px] w-full flex items-center justify-center bg-white cursor-pointer"
                        >
                          <img 
                            src="/images/techpack/techpack_template.png" 
                            alt="기본 템플릿" 
                            className="w-full h-full object-contain p-2 opacity-50"
                          />
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/5 text-center p-4">
                            <span className="material-symbols-outlined text-[40px] text-on-surface-variant mb-2">image_not_supported</span>
                            <p className="text-body-sm font-bold text-on-surface-variant">
                              {chatLanguage === 'KR' ? "등록된 작업지시서가 없습니다." : "暂无已注册的作业指示书。"}
                            </p>
                            <p className="text-xs text-on-surface-variant/70 mt-1">
                              {chatLanguage === 'KR' ? "상단의 '신규 등록' 버튼을 눌러 이미지를 올려주세요." : "请点击上方的'上传新图'按钮上传图片。"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeRightTab === "files" && (
                <div className="space-y-4">
                  <h3 className="font-headline-md text-headline-md">
                    {chatLanguage === 'KR' ? "공유 파일 아카이브" : "共享文件存档"}
                  </h3>
                  {activeFiles.length > 0 ? (
                    <div className="space-y-2">
                      {activeFiles.map((med) => (
                        <div key={med.id} className="flex items-center gap-2 p-3 bg-white rounded-xl border border-outline-variant hover:bg-slate-50 transition-colors">
                          <span className="material-symbols-outlined text-primary">description</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-body-sm font-bold truncate">{med.fileName}</p>
                            <p className="text-[10px] text-on-surface-variant">
                              {med.fileSize} • {chatLanguage === 'KR' ? "공장 공유" : "工厂共享"}
                            </p>
                          </div>
                          <button className="text-primary text-xs font-bold hover:underline">
                            {chatLanguage === 'KR' ? "보기" : "查看"}
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-body-sm text-on-surface-variant">
                      {chatLanguage === 'KR' ? "공유된 파일이 없습니다." : "暂无共享文件。"}
                    </p>
                  )}
                </div>
              )}

              {activeRightTab === "showroom" && (
                <div className="flex flex-col h-full space-y-4">
                  {/* 컬러북 상단 도구 모음 */}
                  <div className="flex justify-between items-center shrink-0">
                    <h3 className="font-headline-md text-headline-md font-bold">
                      {chatLanguage === 'KR' ? "컬러북" : "配色册"}
                    </h3>
                    <button 
                      onClick={handleAddColorBook}
                      className="px-3 py-2 bg-primary text-on-primary text-xs font-bold rounded-lg hover:bg-primary/95 transition-all flex items-center gap-1.5 active:scale-[0.98] cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">playlist_add</span>
                      {chatLanguage === 'KR' ? "컬러북 추가" : "添加配色册"}
                    </button>
                  </div>

                  {/* 컬러북 카드 목록 (비교 기능) */}
                  <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                    {activeColorBooks.length > 0 ? (
                      <div className="grid grid-cols-1 gap-4">
                        {activeColorBooks.map((cb) => (
                          <div 
                            key={cb.id} 
                            className="bg-white border border-outline-variant rounded-xl p-4 shadow-sm relative group hover:shadow-md transition-all"
                          >
                            {/* 삭제 버튼 */}
                            <button 
                              onClick={() => handleDeleteColorBook(cb.id)}
                              className="absolute top-3 right-3 text-on-surface-variant hover:text-error transition-colors p-1 cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[20px]">delete</span>
                            </button>

                            {/* 원단 정보 및 모달 팝업 트리거 */}
                            <div className="mb-3">
                              <h4 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                                {chatLanguage === 'KR' ? "원단 선택" : "面料选择"}
                              </h4>
                              <button 
                                type="button"
                                onClick={() => {
                                  setTargetColorBookId(cb.id);
                                  setIsFabricModalOpen(true);
                                }}
                                className="flex items-center gap-3 p-2 border border-outline-variant hover:border-primary rounded-lg w-full text-left bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
                              >
                                <img 
                                  src={cb.fabricImageUrl} 
                                  alt={cb.fabricName} 
                                  className="w-10 h-10 object-cover rounded border border-outline-variant"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="font-label-md text-xs font-bold truncate">
                                    {chatLanguage === 'CN' ? (TRANSLATION_MAP[cb.fabricName] || cb.fabricName) : cb.fabricName}
                                  </p>
                                  <p className="text-[10px] text-on-surface-variant">
                                    {chatLanguage === 'KR' ? "클릭하여 변경" : "点击更改"}
                                  </p>
                                </div>
                                <span className="material-symbols-outlined text-on-surface-variant font-light text-[18px]">open_in_new</span>
                              </button>
                            </div>

                            {/* 컬러 피커 및 직접 HEX 입력 */}
                            <div className="mb-4">
                              <h4 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                                {chatLanguage === 'KR' ? "컬러 선택" : "配色选择"}
                              </h4>
                              <div className="flex gap-2">
                                <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-outline-variant shrink-0 cursor-pointer">
                                  <input 
                                    type="color" 
                                    value={cb.colorHex}
                                    onChange={(e) => handleColorChange(cb.id, e.target.value)}
                                    className="absolute inset-0 w-full h-full p-0 border-0 cursor-pointer scale-150"
                                  />
                                </div>
                                <input 
                                  type="text" 
                                  value={cb.colorHex.toUpperCase()}
                                  onChange={(e) => handleColorChange(cb.id, e.target.value)}
                                  placeholder="#HEX"
                                  className="flex-1 bg-white border border-outline-variant rounded-lg px-3 text-xs font-code-sm outline-none focus:ring-1 focus:ring-primary focus:border-transparent uppercase"
                                />
                              </div>
                            </div>

                            {/* 실시간 렌더링 결과 이미지 */}
                            <div>
                              <h4 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">
                                {chatLanguage === 'KR' ? "실시간 프리뷰" : "实时预览"}
                              </h4>
                              <div className="relative w-full h-36 rounded-lg overflow-hidden bg-slate-100 border border-outline-variant">
                                <img 
                                  src={cb.fabricImageUrl} 
                                  alt={cb.fabricName} 
                                  className="w-full h-full object-cover"
                                />
                                <div 
                                  className="absolute inset-0 pointer-events-none mix-blend-multiply opacity-85 transition-colors duration-250" 
                                  style={{ backgroundColor: cb.colorHex }}
                                />
                              </div>
                            </div>

                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-8 bg-slate-50 border border-dashed border-outline-variant rounded-xl text-center">
                        <span className="material-symbols-outlined text-[40px] text-on-surface-variant mb-2">texture</span>
                        <p className="text-body-sm font-bold text-on-surface-variant">
                          {chatLanguage === 'KR' ? "등록된 컬러북 후보안이 없습니다. 상단의 버튼을 눌러 후보안을 추가해 주세요." : "暂无已注册的配色册候选方案。请点击上方按钮添加候选方案。"}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeRightTab === "scm" && (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-headline-md text-headline-md">
                      {chatLanguage === 'KR' ? "SCM 계산기" : "SCM 计算器"}
                    </h3>
                    <button className="text-primary font-label-md text-label-md flex items-center gap-1 cursor-pointer">
                      <span className="material-symbols-outlined text-[18px]">history</span>
                      {chatLanguage === 'KR' ? "이력" : "历史"}
                    </button>
                  </div>
                  
                  <div className="space-y-6">
                    {/* Calculator Inputs */}
                    <div className="bg-slate-50 p-stack-md rounded-2xl border border-slate-200 space-y-4">
                      <div>
                        <label className="block font-label-md text-label-md mb-2 text-on-surface-variant">
                          {chatLanguage === 'KR' ? "원단 비용 (RMB/m)" : "面料成本 (RMB/m)"}
                        </label>
                        <div className="relative">
                          <input 
                            className="w-full bg-white border border-outline-variant rounded-lg py-2.5 px-4 font-code-sm text-on-surface focus:ring-primary outline-none" 
                            type="number" 
                            value={liveFabricCost} 
                            onChange={(e) => handleScmChange("fabricCost", parseFloat(e.target.value) || 0)}
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">¥</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block font-label-md text-label-md mb-2 text-on-surface-variant">
                            {chatLanguage === 'KR' ? "소요량" : "用料量"}
                          </label>
                          <div className="relative">
                            <input 
                              className="w-full bg-white border border-outline-variant rounded-lg py-2.5 px-4 font-code-sm text-on-surface focus:ring-primary outline-none" 
                              type="number" 
                              value={liveUsage} 
                              onChange={(e) => handleScmChange("usage", parseFloat(e.target.value) || 0)}
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">m</span>
                          </div>
                        </div>
                        <div>
                          <label className="block font-label-md text-label-md mb-2 text-on-surface-variant">
                            {chatLanguage === 'KR' ? "공임 비용 (CMT)" : "加工费 (CMT)"}
                          </label>
                          <div className="relative">
                            <input 
                              className="w-full bg-white border border-outline-variant rounded-lg py-2.5 px-4 font-code-sm text-on-surface focus:ring-primary outline-none" 
                              type="number" 
                              value={liveCmt} 
                              onChange={(e) => handleScmChange("cmt", parseFloat(e.target.value) || 0)}
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">¥</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="block font-label-md text-label-md mb-2 text-on-surface-variant">
                          {chatLanguage === 'KR' ? "환율 (KRW/CNY)" : "汇率 (KRW/CNY)"}
                        </label>
                        <div className="relative">
                          <input 
                            className="w-full bg-white border border-outline-variant rounded-lg py-2.5 px-4 font-code-sm text-on-surface focus:ring-primary outline-none" 
                            type="number" 
                            value={liveExchangeRate} 
                            onChange={(e) => handleScmChange("exchangeRate", parseFloat(e.target.value) || 0)}
                          />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">₩</span>
                        </div>
                      </div>
                    </div>

                    {/* Auto-Calculated Results in ₩ KRW / ¥ CNY */}
                    <div className="bg-primary text-on-primary p-6 rounded-2xl shadow-xl space-y-4 relative overflow-hidden group">
                      <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all duration-700"></div>
                      <div>
                        <p className="text-[12px] font-bold uppercase tracking-widest text-on-primary/70">
                          {chatLanguage === 'KR' ? "계산된 도매가 (KRW)" : "计算后批发价 (KRW)"}
                        </p>
                        <h4 className="text-[36px] font-bold font-title-lg tracking-tight flex items-baseline gap-2">
                          ₩{liveWholesalePriceKrw > 0 ? Math.round(liveWholesalePriceKrw).toLocaleString() : "0"}
                          <span className="text-sm font-normal text-on-primary/70">(¥{liveWholesalePriceCny.toFixed(2)})</span>
                        </h4>
                      </div>
                      <div className="pt-4 border-t border-on-primary/20 grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[10px] font-bold uppercase text-on-primary/60">
                            {chatLanguage === 'KR' ? "총 원가 (KRW / CNY)" : "总成本 (KRW / CNY)"}
                          </p>
                          <p className="font-code-sm text-sm">
                            ₩{liveTotalCostKrw > 0 ? Math.round(liveTotalCostKrw).toLocaleString() : "0"} / ¥{liveTotalCostCny.toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase text-on-primary/60">
                            {chatLanguage === 'KR' ? "마진율 %" : "利润率 %"}
                          </p>
                          <p className="font-code-sm text-lg">60.0%</p>
                        </div>
                      </div>
                    </div>

                    {/* Market Insights */}
                    <div className="space-y-3">
                      <h4 className="font-label-md text-label-md text-on-surface-variant">
                        {chatLanguage === 'KR' ? "카테고리 비교" : "品类对比"}
                      </h4>
                      <div className="p-4 border border-outline-variant rounded-xl flex items-center gap-4">
                        <div className="flex-1">
                          <div className="flex justify-between mb-1">
                            <span className="text-body-sm">
                              {chatLanguage === 'KR' ? "쉘 자켓" : "冲锋衣"}
                            </span>
                            <span className="font-code-sm text-green-600">-₩{(4.20 * liveExchangeRate).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                          </div>
                          <div className="w-full h-1.5 bg-surface-container-high rounded-full overflow-hidden">
                            <div className="h-full bg-primary w-[75%]"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {activeRightTab === "scm" && (
              <div className="p-stack-md border-t border-outline-variant shrink-0">
                <button className="w-full py-3 bg-surface border-2 border-primary text-primary rounded-xl font-bold hover:bg-primary/5 transition-all cursor-pointer">
                  {chatLanguage === 'KR' ? "SCM 시트 내보내기" : "导出 SCM 报表"}
                </button>
              </div>
            )}
          </aside>

        </main>
      </div>

      {/* Fullscreen Techpack Viewer Modal */}
      {fullscreenImageIndex !== null && activeTechPacks.length > 0 && (
        <div 
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm p-4"
          onClick={() => setFullscreenImageIndex(null)}
        >
          {/* Header */}
          <div 
            className="absolute top-0 inset-x-0 p-4 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent text-white z-50"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col">
              <h4 className="text-body-lg font-bold">
                {chatLanguage === 'KR' ? (activeTechPacks[fullscreenImageIndex]?.fileName || "작업지시서") : (activeTechPacks[fullscreenImageIndex]?.fileName || "作业指示书")}
              </h4>
              <p className="text-xs text-white/70">
                {chatLanguage === 'KR' ? "버전" : "版本"} {activeTechPacks.length - fullscreenImageIndex} / {activeTechPacks.length} • {chatLanguage === 'KR' ? "업로드" : "上传时间"}: {(() => {
                  try {
                    const dateVal = activeTechPacks[fullscreenImageIndex]?.uploadedAt;
                    return dateVal ? new Date(dateVal).toLocaleString() : "";
                  } catch (e) {
                    return "";
                  }
                })()}
              </p>
            </div>
            <button 
              onClick={() => setFullscreenImageIndex(null)}
              className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white cursor-pointer"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {/* Main Image Container */}
          <div 
            className="relative flex items-center justify-center max-w-full max-h-[85vh] select-none p-12"
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src={activeTechPacks[fullscreenImageIndex]?.url && activeTechPacks[fullscreenImageIndex]?.url?.startsWith("http") ? activeTechPacks[fullscreenImageIndex]?.url : "/images/techpack/techpack_template.png"} 
              alt={chatLanguage === 'KR' ? "작업지시서 전체화면" : "作业指示书全屏"}
              className="max-w-full max-h-[80vh] object-contain border border-white/10 rounded-lg shadow-2xl bg-white p-2"
            />

            {/* Navigation Buttons inside Container */}
            {fullscreenImageIndex > 0 && (
              <button 
                onClick={(e) => { e.stopPropagation(); setFullscreenImageIndex(fullscreenImageIndex - 1); }}
                className="absolute left-0 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/50 hover:bg-black/80 flex items-center justify-center text-white transition-colors border border-white/10 z-50 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[32px]">chevron_left</span>
              </button>
            )}

            {fullscreenImageIndex < activeTechPacks.length - 1 && (
              <button 
                onClick={(e) => { e.stopPropagation(); setFullscreenImageIndex(fullscreenImageIndex + 1); }}
                className="absolute right-0 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/50 hover:bg-black/80 flex items-center justify-center text-white transition-colors border border-white/10 z-50 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[32px]">chevron_right</span>
              </button>
            )}
          </div>

          {/* Bottom thumbnails / info */}
          <div className="absolute bottom-4 text-center text-white/60 text-xs">
            {chatLanguage === 'KR' 
              ? "좌우 방향키(◀ ▶)로 다른 버전을 탐색할 수 있으며, ESC 또는 배경 클릭으로 닫을 수 있습니다."
              : "可用左右方向键(◀ ▶)探索其他版本，按 ESC 或点击背景可关闭。"}
          </div>
        </div>
      )}

      {/* 원단 선택 모달 */}
      {isFabricModalOpen && (
        <div 
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => {
            setIsFabricModalOpen(false);
            setTargetColorBookId(null);
          }}
        >
          <div 
            className="bg-white rounded-2xl w-full max-w-2xl p-6 border border-outline-variant shadow-xl flex flex-col max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center pb-4 border-b border-outline-variant mb-4 shrink-0">
              <h3 className="text-headline-sm font-headline-sm font-bold">
                {chatLanguage === 'KR' ? "원단 선택 (2단계 분류)" : "面料选择 (两级分类)"}
              </h3>
              <button 
                onClick={() => {
                  setIsFabricModalOpen(false);
                  setTargetColorBookId(null);
                }}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors text-on-surface-variant cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            {/* 2단 분할 레이아웃 컨테이너 */}
            <div className="flex-1 flex gap-6 min-h-0 overflow-hidden">
              {/* 좌측: 대분류 세로 탭 바 */}
              <div className="w-1/3 border-r border-outline-variant pr-4 overflow-y-auto space-y-2">
                {FABRIC_CATEGORIES.map((cat) => {
                  const displayName = chatLanguage === 'CN'
                    ? (TRANSLATION_MAP[cat.categoryName] || cat.categoryName)
                    : cat.categoryName;
                  const isActive = activeCategory === cat.categoryName;
                  
                  return (
                    <button
                      key={cat.categoryName}
                      onClick={() => setActiveCategory(cat.categoryName)}
                      className={`w-full text-left px-4 py-3 rounded-xl font-label-md text-sm transition-all duration-200 cursor-pointer ${
                        isActive 
                          ? "bg-primary text-on-primary font-bold shadow-sm" 
                          : "hover:bg-slate-100 text-on-surface-variant"
                      }`}
                    >
                      {displayName}
                    </button>
                  );
                })}
              </div>
              
              {/* 우측: 선택된 대분류 소속 원단 리스트 */}
              <div className="w-2/3 overflow-y-auto space-y-3 pr-2">
                {(() => {
                  const currentCategoryData = FABRIC_CATEGORIES.find(cat => cat.categoryName === activeCategory);
                  const items = currentCategoryData ? currentCategoryData.items : [];
                  
                  if (items.length === 0) {
                    return (
                      <div className="h-full flex items-center justify-center text-on-surface-variant text-sm py-12">
                        {chatLanguage === 'KR' ? "원단이 없습니다." : "没有相关面料。"}
                      </div>
                    );
                  }
                  
                  return items.map((fabric) => {
                    const displayFabricName = chatLanguage === 'CN'
                      ? (TRANSLATION_MAP[fabric.name] || fabric.name)
                      : fabric.name;
                      
                    return (
                      <button
                        key={fabric.id}
                        onClick={() => handleSelectFabric(fabric)}
                        className="flex items-center gap-4 p-3 border border-outline-variant hover:border-primary rounded-xl w-full text-left hover:bg-primary-container/5 transition-all group cursor-pointer"
                      >
                        <img 
                          src={fabric.imageUrl} 
                          alt={fabric.name} 
                          className="w-14 h-14 object-cover rounded-lg border border-outline-variant group-hover:scale-105 transition-transform shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <span className="text-[10px] font-bold text-primary px-1.5 py-0.5 bg-primary-container/30 rounded border border-primary/10 tracking-widest font-code">
                            {fabric.id}
                          </span>
                          <p className="font-label-md text-sm font-bold truncate group-hover:text-primary transition-colors mt-1">
                            {displayFabricName}
                          </p>
                        </div>
                        <span className="material-symbols-outlined text-on-surface-variant font-light group-hover:text-primary transition-colors">check_circle</span>
                      </button>
                    );
                  });
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
