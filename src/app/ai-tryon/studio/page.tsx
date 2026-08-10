'use client';

import React, { useState, useEffect, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { db, storage } from '@/lib/firebase/clientApp';
import { collection, doc, setDoc, deleteDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { shopService } from '@/lib/firebase/shopService';
import { Product } from '@/types/shop';
import { toast } from 'sonner';

export interface TryOnPhoto {
  photoId: string;
  url: string;
  storagePath: string;
  mode?: string;
  createdAt: string;
}

export interface FootProfileData {
  profileId: string;
  leftLength: string;
  rightLength: string;
  leftWidth: string;
  rightWidth: string;
  sizeSheetStoragePath?: string;
  sizeSheetUrl?: string;
  confirmed: boolean;
  measuredAt: string;
}

export interface ShoeProductItem {
  id: string;
  title: string;
  category: 'loafer' | 'derby' | 'sneakers' | 'boots';
  imageUrl: string;
  description: string;
}

// 👟 프리미엄 신발 제품 카탈로그 (0% 상표명 노출 원칙)
const SHOE_CATALOG_PRODUCTS: ShoeProductItem[] = [
  { id: 'sp1', title: 'Uniform Pleats Loafer', category: 'loafer', imageUrl: 'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=500&q=80', description: '플리츠 밴딩 클래식 가죽 로퍼' },
  { id: 'sp2', title: 'Yard Classic Derby', category: 'derby', imageUrl: 'https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=500&q=80', description: '시그니처 아웃솔 수제 더비슈즈' },
  { id: 'sp3', title: 'Zero Signature Loafer', category: 'loafer', imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500&q=80', description: '제로 밴딩 드레스 로퍼' },
  { id: 'sp4', title: 'Uniform Driving Sneakers', category: 'sneakers', imageUrl: 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=500&q=80', description: '프리미엄 레더 드라이빙 스니커즈' },
  { id: 'sp5', title: 'Max Chelsea Leather Boots', category: 'boots', imageUrl: 'https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=500&q=80', description: '슬림 핏 수제 첼시부츠' },
  { id: 'sp6', title: 'Field Tactical Leather Boots', category: 'boots', imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80', description: '볼드 레더 레이스업 필드 부츠' },
  { id: 'sp7', title: 'Wide Square Toe Loafer', category: 'loafer', imageUrl: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=500&q=80', description: '와이드 스퀘어 토 프리미엄 로퍼' },
  { id: 'sp8', title: 'Minimal Dress Oxford', category: 'derby', imageUrl: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=500&q=80', description: '모던 옥스퍼드 미니멀 구두' },
];

// 👩 여성 Atelier-K 공식 전수 카탈로그
const ATELIER_K_WOMEN_STYLES = [
  { id: 'w01', name: '인디언 선 컬러', enName: 'Indian Sun Color', img: 'https://www.atelier-k.kr/hairstyle/01.png' },
  { id: 'w02', name: '트렌드 컷 킴', enName: 'Trend Cut Kim', img: 'https://www.atelier-k.kr/hairstyle/02.png' },
  { id: 'w03', name: '트렌드 롱', enName: 'Trend Long', img: 'https://www.atelier-k.kr/hairstyle/03.png' },
  { id: 'w04', name: '아그네스 컷 & 펌', enName: 'Agness Cut & Perm', img: 'https://www.atelier-k.kr/hairstyle/04.png' },
  { id: 'w05', name: '엠버 컷 & 펌', enName: 'Amber Cut & Perm', img: 'https://www.atelier-k.kr/hairstyle/05.png' },
  { id: 'w06', name: 'SS 롱 스타일', enName: 'Spring-Summer Long', img: 'https://www.atelier-k.kr/hairstyle/06.png' },
  { id: 'w07', name: 'SS 웨이브 롱', enName: 'SS Wave Long', img: 'https://www.atelier-k.kr/hairstyle/07.png' },
  { id: 'w08', name: '볼륨 레이어드 롱', enName: 'Volume Layered Long', img: 'https://www.atelier-k.kr/hairstyle/08.png' },
  { id: 'w09', name: '아이리스 컷 & 펌', enName: 'Iris Cut & Perm', img: 'https://www.atelier-k.kr/hairstyle/09.png' },
  { id: 'w10', name: '트렌드 미디엄', enName: 'Trend Medium', img: 'https://www.atelier-k.kr/hairstyle/10.png' },
  { id: 'w11', name: '브라이트 컷 & 펌', enName: 'Bright Cut & Perm', img: 'https://www.atelier-k.kr/hairstyle/11.png' },
  { id: 'w12', name: 'SS 미디엄 컬', enName: 'SS Medium Curl', img: 'https://www.atelier-k.kr/hairstyle/12.png' },
  { id: 'w13', name: '클래식 미디엄', enName: 'Classic Medium', img: 'https://www.atelier-k.kr/hairstyle/13.png' },
  { id: 'w14', name: '미디엄 소프트 레이어', enName: 'Medium Soft Layer', img: 'https://www.atelier-k.kr/hairstyle/14.png' },
  { id: 'w15', name: '미디엄 C컬 보브', enName: 'Medium C-Curl Bob', img: 'https://www.atelier-k.kr/hairstyle/15.png' },
  { id: 'w16', name: '트렌드 숏컷', enName: 'Trend Short Cut', img: 'https://www.atelier-k.kr/hairstyle/16.png' },
  { id: 'w17', name: '미아 컷 & 펌', enName: 'Mia Cut & Perm', img: 'https://www.atelier-k.kr/hairstyle/17.png' },
  { id: 'w18', name: 'SS 숏 스타일', enName: 'SS Short Style', img: 'https://www.atelier-k.kr/hairstyle/18.png' },
  { id: 'w19', name: '라일라 컷 & 펌', enName: 'Layla Cut & Perm', img: 'https://www.atelier-k.kr/hairstyle/19.png' },
  { id: 'w20', name: '시크 숏 보브', enName: 'Chic Short Bob', img: 'https://www.atelier-k.kr/hairstyle/20.png' },
  { id: 'w21', name: '숏 픽시 컷', enName: 'Short Pixie Cut', img: 'https://www.atelier-k.kr/hairstyle/21.png' },
  { id: 'w22', name: '애쉬 베이지 컬렉션', enName: 'Ash Beige Collection', img: 'https://www.atelier-k.kr/hairstyle/22.png' },
  { id: 'w23', name: '로즈 브라운 컬렉션', enName: 'Rose Brown Collection', img: 'https://www.atelier-k.kr/hairstyle/23.png' },
  { id: 'w24', name: '밀크티 브라운 컬렉션', enName: 'Milk Tea Brown', img: 'https://www.atelier-k.kr/hairstyle/24.png' },
  { id: 'w25', name: 'S컬 디지털 펌', enName: 'S-Curl Digital Perm', img: 'https://www.atelier-k.kr/hairstyle/25.png' },
  { id: 'w26', name: '프리미엄 디지털 펌', enName: 'Premium Digital Perm', img: 'https://www.atelier-k.kr/hairstyle/26.png' },
  { id: 'w27', name: '뿌리 볼륨 펌', enName: 'Root Volume Perm', img: 'https://www.atelier-k.kr/hairstyle/27.png' },
];

// 👨 남성 Atelier-K 18종 전수 카탈로그
const MEN_HAIR_STYLES = [
  { id: 'm01', name: '맨즈 베이비펌', enName: "Man's Baby Perm", img: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&q=80' },
  { id: 'm02', name: '내 남자의 자존심 : 가르마펌', enName: 'Garuma Perm', img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80' },
  { id: 'm03', name: '훈남 댄디 쉐도우펌', enName: 'Dandy Shadow Perm', img: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&q=80' },
  { id: 'm04', name: '댄디 투블럭', enName: 'Dandy Two-Block', img: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&q=80' },
  { id: 'm05', name: '27살 회사원 펌 염색', enName: 'Office Worker Perm', img: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&q=80' },
  { id: 'm06', name: '투블럭 댄디', enName: 'Two-Block Dandy', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80' },
  { id: 'm07', name: '베이비 믹스 펌', enName: 'Baby Mix Perm', img: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&q=80' },
  { id: 'm08', name: '가을엔 클래식하게', enName: 'Classic Autumn Cut', img: 'https://images.unsplash.com/photo-1622281985336-d748f3226dbd?w=400&q=80' },
  { id: 'm09', name: '투블럭 뚜껑머리 컷', enName: 'Sleek Two-Block', img: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=400&q=80' },
  { id: 'm10', name: '애쉬블루그레이 컬러컷', enName: 'Ash Blue Gray Cut', img: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=400&q=80' },
  { id: 'm11', name: '곱슬 전용 투블럭', enName: 'Curly Two-Block', img: 'https://images.unsplash.com/photo-1488161628813-04466f872be2?w=400&q=80' },
  { id: 'm12', name: '포마드 펌', enName: 'Classic Pomade', img: 'https://images.unsplash.com/photo-1504257426295-5d962804d9c7?w=400&q=80' },
  { id: 'm13', name: '화이트애쉬 실버', enName: 'White Ash Silver', img: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=400&q=80' },
  { id: 'm14', name: '밀크 화이트애쉬 컬러', enName: 'Milk White Ash', img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80' },
  { id: 'm15', name: '리젠트 포마드펌', enName: 'Regent Pomade Perm', img: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&q=80' },
  { id: 'm16', name: '로즈쿼츠 염색 컷', enName: 'Rose Quartz Color', img: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&q=80' },
  { id: 'm17', name: '스핀스왈로 펌', enName: 'Spin Swallow Perm', img: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&q=80' },
  { id: 'm18', name: '투블럭 볼륨 펌', enName: 'Two-Block Volume Perm', img: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80' },
];

const ATELIER_K_HAIR_COLORS = [
  { id: 'c1', name: '애쉬 브라운', hex: '#6e5647' },
  { id: 'c2', name: '핑크 베이지', hex: '#d6a0a0' },
  { id: 'c3', name: '딥 블랙', hex: '#1a1a1a' },
  { id: 'c4', name: '애쉬 그레이', hex: '#7a808a' },
  { id: 'c5', name: '코랄 오렌지', hex: '#e07a5f' },
  { id: 'c6', name: '밀크 브라운', hex: '#a3836c' },
  { id: 'c7', name: '딥 바이올렛', hex: '#5c4d7d' },
];

function AiTryOnStudioContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const appId = searchParams.get('app') || 'woc';
  const modeParam = searchParams.get('mode') || 'dress';
  const isShoeMode = modeParam === 'shoes' || modeParam === 'shoe';

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // 내 사진 상태
  const [myPhotos, setMyPhotos] = useState<TryOnPhoto[]>([]);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<string[]>([]);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // 업로드 프로그레스 표시용 상태 (전체 공통)
  const [uploadProgressText, setUploadProgressText] = useState<string | null>(null);

  // 프로그레스바 상태 (0 ~ 100%)
  const [progress, setProgress] = useState<number>(0);
  const [progressText, setProgressText] = useState<string>('');

  // 헤어 전용 상태
  const [gender, setGender] = useState<'women' | 'men'>('women');
  const [selectedStyle, setSelectedStyle] = useState<string>(ATELIER_K_WOMEN_STYLES[0].name);
  const [selectedColor, setSelectedColor] = useState<typeof ATELIER_K_HAIR_COLORS[0]>(ATELIER_K_HAIR_COLORS[0]);

  // 👟 신발 전용 상태
  const [showShoeGuide, setShowShoeGuide] = useState(false);
  const [sliderPosition, setSliderPosition] = useState<number>(50);
  const [selectedShoeProduct, setSelectedShoeProduct] = useState<ShoeProductItem | null>(SHOE_CATALOG_PRODUCTS[0]);
  const [customShoeProductUrl, setCustomShoeProductUrl] = useState<string | null>(null);

  // 📏 Size Sheet / Foot Profile 상태
  const [leftFootLength, setLeftFootLength] = useState<string>('265');
  const [rightFootLength, setRightFootLength] = useState<string>('267');
  const [leftFootWidth, setLeftFootWidth] = useState<string>('102');
  const [rightFootWidth, setRightFootWidth] = useState<string>('104');
  const [sizeSheetFileUrl, setSizeSheetFileUrl] = useState<string | null>(null);
  const [sizeSheetStoragePath, setSizeSheetStoragePath] = useState<string | null>(null);
  const [isUploadingSizeSheet, setIsUploadingSizeSheet] = useState<boolean>(false);

  // 👗 드레스 전용 상태 (WoC 상점 상품 카탈로그 연동)
  const [customGarmentUrl, setCustomGarmentUrl] = useState<string | null>(null);
  const [isUploadingGarment, setIsUploadingGarment] = useState(false);
  const [shopProducts, setShopProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // AI 생성 결과 상태
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [selectedResultIndex, setSelectedResultIndex] = useState<number>(0);
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const garmentInputRef = useRef<HTMLInputElement>(null);
  const shoeProductInputRef = useRef<HTMLInputElement>(null);
  const sizeSheetInputRef = useRef<HTMLInputElement>(null);

  // 프로그레스바 너비 실시간 애니메이션 타이머 (0% -> 100% 동기화)
  useEffect(() => {
    let timer: any;
    if (isGenerating) {
      setProgress(5);
      setProgressText(
        isShoeMode 
          ? 'AI 핀포인트 신발 가상 착장 피팅 중...'
          : modeParam === 'hair'
          ? 'AI 핀포인트 헤어 세그멘테이션 분석 중...'
          : 'AI 드레스 피팅 렌더링 분석 중...'
      );
      timer = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 95) {
            clearInterval(timer);
            return 95;
          }
          if (prev < 30) {
            setProgressText(
              isShoeMode
                ? '발목/신발 마스킹 및 배경 100% 보존 파이프라인 가동 중...'
                : '피부/얼굴/배경 100% 보존 구역 마스킹 중...'
            );
            return prev + 8;
          } else if (prev < 70) {
            setProgressText(
              isShoeMode
                ? '선택된 프리미엄 신발 실루엣 및 텍스처 3D 피팅 중...'
                : `머리카락 영역에 ${selectedStyle} & ${selectedColor.name} 3D 합성 중...`
            );
            return prev + 5;
          } else {
            setProgressText('착장 컷 렌더링 보정 완료 중...');
            return prev + 3;
          }
        });
      }, 300);
    } else {
      setProgress(0);
    }
    return () => clearInterval(timer);
  }, [isGenerating, isShoeMode, modeParam, selectedStyle, selectedColor]);

  // 1. 내 사진 전용 로드 (3개 AI 착장 모드별 참고 사진 100% 독립 분리)
  useEffect(() => {
    if (!user?.uid) return;
    const q = query(
      collection(db, 'users', user.uid, 'aiTryonPhotos'),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      const photos: TryOnPhoto[] = snap.docs.map(d => ({ photoId: d.id, ...d.data() } as TryOnPhoto));
      const modeFilter = isShoeMode ? 'shoe' : modeParam;

      // 3개 모드(dress, shoe, hair) 전용 참고 사진 100% 독립 분리
      const filtered = photos.filter(p => p.mode === modeFilter);

      setMyPhotos(filtered);
      if (filtered.length > 0 && selectedPhotoIds.length === 0) {
        setSelectedPhotoIds([filtered[0].photoId]);
      }
    });
    return () => unsub();
  }, [user?.uid, isShoeMode, modeParam]);

  // 2. WoC 상점 상품 로드 (드레스 카탈로그 선택 100% 복원)
  useEffect(() => {
    if (modeParam === 'dress') {
      const unsub = shopService.subscribeAllProducts((products: Product[]) => {
        const validProducts = products.filter((p: Product) => !!(p.imageUrl || (p.images && p.images.length > 0)));
        setShopProducts(validProducts);
        if (validProducts.length > 0 && !selectedProduct) {
          setSelectedProduct(validProducts[0]);
        }
      });
      return () => {
        if (unsub) unsub();
      };
    }
  }, [modeParam, selectedProduct]);

  // 내 사진 선택
  const togglePhotoSelection = (photoId: string) => {
    setSelectedPhotoIds(prev => prev.includes(photoId) ? prev.filter(id => id !== photoId) : [...prev, photoId]);
  };

  // 내 사진 업로드 (공통 프로그레스 로딩 오버레이 연동)
  const handleUploadMyPhoto = async (file?: File) => {
    if (!file || !user?.uid) return;

    setIsUploadingPhoto(true);
    setUploadProgressText('내 착장 사진 업로드 중...');
    try {
      const photoId = `photo_${Date.now()}`;
      const modeTag = isShoeMode ? 'shoe' : modeParam;
      const storagePath = `ai_tryon/${user.uid}/body/${photoId}.jpg`;
      const storageRef = ref(storage, storagePath);

      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      const newPhoto: TryOnPhoto = {
        photoId,
        url,
        storagePath,
        mode: modeTag,
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'users', user.uid, 'aiTryonPhotos', photoId), newPhoto);
      setSelectedPhotoIds(prev => [...prev, photoId]);
      toast.success('내 착장 사진이 등록되었습니다.');
    } catch (err) {
      console.error(err);
      toast.error('사진 업로드 중 오류가 발생했습니다.');
    } finally {
      setIsUploadingPhoto(false);
      setUploadProgressText(null);
    }
  };

  // 신발 제품 직접 사진 업로드
  const handleUploadCustomShoeProduct = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.uid) return;

    setUploadProgressText('신발 제품 사진 업로드 중...');
    try {
      const path = `ai_tryon/${user.uid}/shoes/${Date.now()}.jpg`;
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      setCustomShoeProductUrl(url);
      setSelectedShoeProduct(null);
      toast.success('임의 신발 제품 사진이 업로드되었습니다.');
    } catch (err) {
      console.error(err);
      toast.error('신발 업로드 실패');
    } finally {
      setUploadProgressText(null);
    }
  };

  // Size Sheet 사진 업로드
  const handleUploadSizeSheet = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.uid) return;

    setIsUploadingSizeSheet(true);
    setUploadProgressText('Size Sheet 사진 업로드 중...');
    try {
      const path = `ai_tryon/${user.uid}/sizesheets/${Date.now()}.jpg`;
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      setSizeSheetFileUrl(url);
      setSizeSheetStoragePath(path);
      toast.success('Size Sheet 사진이 등록되었습니다.');
    } catch (err) {
      console.error(err);
      toast.error('Size Sheet 업로드 실패');
    } finally {
      setIsUploadingSizeSheet(false);
      setUploadProgressText(null);
    }
  };

  // Foot Profile 저장
  const handleSaveFootProfile = async () => {
    if (!user?.uid) return;
    try {
      const profileId = `profile_${Date.now()}`;
      const data: FootProfileData = {
        profileId,
        leftLength: leftFootLength,
        rightLength: rightFootLength,
        leftWidth: leftFootWidth,
        rightWidth: rightFootWidth,
        sizeSheetStoragePath: sizeSheetStoragePath || '',
        sizeSheetUrl: sizeSheetFileUrl || '',
        confirmed: true,
        measuredAt: new Date().toISOString()
      };
      await setDoc(doc(db, 'users', user.uid, 'footProfiles', profileId), data);
      toast.success('Foot Profile이 저장되었습니다.');
    } catch (err) {
      console.error(err);
      toast.error('저장 중 오류가 발생했습니다.');
    }
  };

  // 드레스 사진 업로드
  const handleUploadGarment = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.uid) return;

    setIsUploadingGarment(true);
    setUploadProgressText('의상 사진 업로드 중...');
    try {
      const path = `ai_tryon/${user.uid}/garments/${Date.now()}.jpg`;
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      setCustomGarmentUrl(url);
      setSelectedProduct(null);
      toast.success('의상 사진 업로드가 완료되었습니다.');
    } catch (err) {
      console.error(err);
      toast.error('의상 사진 업로드 실패');
    } finally {
      setIsUploadingGarment(false);
      setUploadProgressText(null);
    }
  };

  // AI 가상 착장 실행 (완료 시 STEP 4 결과 화면으로 100% 자동 이동)
  const handleRunTryOn = async () => {
    const selectedPhotos = myPhotos.filter(p => selectedPhotoIds.includes(p.photoId));
    if (selectedPhotos.length === 0) {
      toast.error('최소 1장 이상의 내 착장 사진을 선택해야 합니다.');
      return;
    }

    const mainUserPhoto = selectedPhotos[0].url;
    const faceRefUrls = selectedPhotos.slice(1).map(p => p.url);

    let payload: any = {
      userPhotoUrl: mainUserPhoto,
      faceReferenceUrls: faceRefUrls,
      options: { mode: isShoeMode ? 'shoe' : modeParam }
    };

    if (isShoeMode) {
      const shoeImg = customShoeProductUrl || selectedShoeProduct?.imageUrl;
      if (!shoeImg) {
        toast.error('착장해 볼 신발 제품을 선택하거나 등록해주세요.');
        return;
      }
      payload.productImageUrl = shoeImg;
      payload.options.hasProductImage = true;
    } else if (modeParam === 'hair') {
      payload.options.hairStyle = selectedStyle;
      payload.options.hairColor = selectedColor.name;
    } else if (modeParam === 'dress') {
      const garmentUrl = customGarmentUrl || selectedProduct?.imageUrl || selectedProduct?.images?.[0];
      if (!garmentUrl) {
        toast.error('착장할 의상 사진을 선택해야 합니다.');
        return;
      }
      payload.productImageUrl = garmentUrl;
    }

    // 🚀 착장 실행 즉시 결과 단계(STEP 4)로 이동 및 렌더링 모달 표출
    setIsGenerating(true);
    setStep(4);
    setGeneratedImages([]);

    try {
      const idToken = await user?.getIdToken();
      const res = await fetch('/api/ai-tryon/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}) },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success && data.generatedImages && data.generatedImages.length > 0) {
        setProgress(100);
        setProgressText('AI 핀포인트 피팅 완성!');
        const imagesBase64 = data.generatedImages.map((img: any) => `data:${img.mimeType};base64,${img.base64}`);
        setGeneratedImages(imagesBase64);
        setSelectedResultIndex(0);
        toast.success('AI 착장이 완성되었습니다!');
      } else {
        toast.error(data.message || 'AI 변환 생성에 실패했습니다.');
        setStep(3); // 실패 시 STEP 3로 복귀
      }
    } catch (err) {
      console.error(err);
      toast.error('AI 서버 통신 중 오류가 발생했습니다.');
      setStep(3); // 에러 시 STEP 3로 복귀
    } finally {
      setTimeout(() => {
        setIsGenerating(false);
      }, 400);
    }
  };

  // 내 히스토리 저장
  const handleSaveToHistory = async () => {
    if (!user?.uid) return;

    const firstPhotoUrl = myPhotos.find(p => selectedPhotoIds.includes(p.photoId))?.url || '';
    const activeImage = generatedImages.length > 0 ? generatedImages[selectedResultIndex] : firstPhotoUrl;

    if (!activeImage) {
      toast.error('변환할 유저 사진을 먼저 선택해주세요.');
      return;
    }

    setIsSaving(true);
    try {
      const resultId = `result_${Date.now()}`;
      let finalUrl = activeImage;
      let storagePath = `ai_tryon/${user.uid}/results/${resultId}.png`;

      if (activeImage.startsWith('data:')) {
        const response = await fetch(activeImage);
        const blob = await response.blob();
        const storageRef = ref(storage, storagePath);

        await uploadBytes(storageRef, blob);
        finalUrl = await getDownloadURL(storageRef);
      }

      const resultDoc = {
        resultId,
        appId,
        mode: isShoeMode ? 'shoe' : modeParam,
        productTitle: isShoeMode ? (selectedShoeProduct?.title || '커스텀 선택 신발') : modeParam === 'hair' ? `Atelier-K 스타일` : (selectedProduct?.title || '업로드 드레스'),
        userPhotoUrl: firstPhotoUrl,
        generatedImageUrl: finalUrl,
        storagePath,
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'users', user.uid, 'aiTryonResults', resultId), resultDoc);

      toast.success('저장되었습니다.');
      setTimeout(() => {
        router.back();
      }, 600);
    } catch (err) {
      console.error(err);
      toast.error('저장 중 오류가 발생했습니다.');
      setIsSaving(false);
    }
  };

  const currentStyles = gender === 'women' ? ATELIER_K_WOMEN_STYLES : MEN_HAIR_STYLES;
  const activeUserPhoto = myPhotos.find(p => selectedPhotoIds.includes(p.photoId))?.url || '';

  return (
    <div className="fixed inset-0 z-[9999] bg-[#f8f9fa] text-[#2d3435] overflow-y-auto flex flex-col justify-between animate-in fade-in duration-200">
      
      {/* ⏳ 사진 업로드 중 프로그레스 로딩 오버레이 (전체 공통) */}
      {uploadProgressText && (
        <div className="fixed inset-0 z-[10002] bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-white animate-in fade-in">
          <div className="bg-white text-slate-900 rounded-3xl p-5 w-full max-w-xs text-center space-y-3 shadow-2xl">
            <div className="w-10 h-10 mx-auto border-4 border-[#0057bd] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-black text-slate-900">{uploadProgressText}</p>
          </div>
        </div>
      )}

      {/* 📊 진행 프로그레스바 모달 (예상 소요 시간 10~15초 표시 & 너비 실시간 애니메이션) */}
      {isGenerating && (
        <div className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-white animate-in fade-in duration-200">
          <div className="bg-white text-slate-900 w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-4 text-center border border-slate-100">
            <div className="w-12 h-12 mx-auto rounded-full bg-indigo-50 text-[#0057bd] flex items-center justify-center animate-spin">
              <span className="material-symbols-outlined text-2xl">auto_awesome</span>
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-black text-slate-900">
                {isShoeMode ? 'AI 핀포인트 신발 가상 피팅 렌더링 중' : modeParam === 'hair' ? 'AI 핀포인트 헤어 렌더링 중' : 'AI 드레스 피팅 렌더링 중'}
              </h3>
              <p className="text-xs font-bold text-slate-500">{progressText}</p>
            </div>

            {/* ⏱️ 예상 소요 시간 표시 */}
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl py-1.5 px-3 inline-flex items-center gap-1 text-[11px] font-black text-[#0057bd]">
              <span className="material-symbols-outlined text-[14px]">timer</span>
              <span>예상 소요 시간: 약 10~15초</span>
            </div>

            {/* 실시간 0% -> 100% 유연 너비 프로그레스바 */}
            <div className="space-y-1.5 pt-1">
              <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                <div
                  className="h-full bg-gradient-to-r from-[#0057bd] via-indigo-600 to-indigo-500 rounded-full transition-all duration-300 ease-out shadow-sm"
                  style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[11px] font-black text-slate-500 px-1">
                <span>진행률</span>
                <span className="text-[#0057bd] font-black">{progress}%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 상단 헤더 */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#e0e4e5] px-4 pt-[max(env(safe-area-inset-top),16px)] pb-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
          <div>
            <h1 className="text-base font-black text-slate-900 tracking-tight">
              {isShoeMode ? 'WoC AI Shoe Studio' : modeParam === 'hair' ? 'Atelier-K 공식 스타일북' : 'AI 드레스 피팅룸'}
            </h1>
            <p className="text-[11px] font-bold text-slate-500">
              4단계 AI 가상 착장 스튜디오 ({step} / 4 단계)
            </p>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 👗👟💇‍♀️ 3개 AI 기능 통일 4-STEP UX Engine */}
      {/* ========================================================================= */}
      <main className="max-w-md mx-auto w-full px-5 py-6 space-y-6 flex-1">
        
        {/* STEP 1: 내 사진 선택 (전 모드 통일 + 모드별 독립 분리) */}
        {step === 1 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="text-center space-y-1.5">
              <span className="px-3 py-1 bg-indigo-50 text-[#0057bd] text-[11px] font-black rounded-full">1단계</span>
              <h2 className="text-lg font-black text-slate-900">내 참고 사진을 선택하세요</h2>
              <p className="text-xs font-bold text-slate-400">
                {isShoeMode ? 'Shoe Studio 전용 발/착장 사진' : modeParam === 'hair' ? '헤어 변환 전용 얼굴 사진' : '드레스 피팅 전용 전신 사진'}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                disabled={isUploadingPhoto}
                className="aspect-[3/4] border-2 border-dashed border-indigo-300 rounded-2xl flex flex-col items-center justify-center gap-1 bg-indigo-50/50 hover:bg-indigo-100/50 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-2xl text-[#0057bd]">photo_camera</span>
                <span className="text-[11px] font-black text-slate-800">촬영하기</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingPhoto}
                className="aspect-[3/4] border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center gap-1 bg-white hover:bg-slate-50 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-2xl text-slate-600">photo_library</span>
                <span className="text-[11px] font-black text-slate-800">사진첩</span>
              </button>
              <input ref={cameraInputRef} type="file" accept="image/*" capture="user" onChange={(e) => handleUploadMyPhoto(e.target.files?.[0])} className="hidden" />
              <input ref={fileInputRef} type="file" accept="image/*" onChange={(e) => handleUploadMyPhoto(e.target.files?.[0])} className="hidden" />

              {myPhotos.map((photo) => {
                const isSelected = selectedPhotoIds.includes(photo.photoId);
                return (
                  <div
                    key={photo.photoId}
                    onClick={() => togglePhotoSelection(photo.photoId)}
                    className={`relative aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer border-2 transition-all ${
                      isSelected ? 'border-[#0057bd] ring-4 ring-[#0057bd]/20 scale-[1.02]' : 'border-slate-200'
                    }`}
                  >
                    <img src={photo.url} alt="" className="w-full h-full object-cover" />
                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-[#0057bd] text-white flex items-center justify-center shadow-md">
                        <span className="material-symbols-outlined text-[13px]">check</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 2: 상세 가이드 & 데이터 확인 */}
        {step === 2 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="text-center space-y-1.5">
              <span className="px-3 py-1 bg-indigo-50 text-[#0057bd] text-[11px] font-black rounded-full">2단계</span>
              <h2 className="text-lg font-black text-slate-900">
                {isShoeMode ? '내 Size Sheet & 발 수치 확인' : '가이드 및 준비사항 확인'}
              </h2>
            </div>

            {isShoeMode ? (
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b pb-3">
                  <span className="text-xs font-black text-slate-900">A4 Size Sheet 등록 (선택)</span>
                  <button
                    type="button"
                    onClick={() => sizeSheetInputRef.current?.click()}
                    disabled={isUploadingSizeSheet}
                    className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-xl text-[11px] font-black hover:bg-indigo-100 cursor-pointer flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[14px]">description</span>
                    <span>{sizeSheetFileUrl ? '시트 변경' : '시트 사진 올리기'}</span>
                  </button>
                  <input ref={sizeSheetInputRef} type="file" accept="image/*" onChange={handleUploadSizeSheet} className="hidden" />
                </div>

                {sizeSheetFileUrl && (
                  <div className="aspect-[4/2] rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
                    <img src={sizeSheetFileUrl} alt="Size Sheet" className="w-full h-full object-contain" />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                    <span className="text-[11px] font-black text-indigo-600">🦶 왼발 (Left)</span>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-500">발 길이 (mm)</label>
                      <input type="number" value={leftFootLength} onChange={(e) => setLeftFootLength(e.target.value)} className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-black" />
                      <label className="text-[9px] font-bold text-slate-500">발 폭 (mm)</label>
                      <input type="number" value={leftFootWidth} onChange={(e) => setLeftFootWidth(e.target.value)} className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-black" />
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                    <span className="text-[11px] font-black text-indigo-600">🦶 오른발 (Right)</span>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-500">발 길이 (mm)</label>
                      <input type="number" value={rightFootLength} onChange={(e) => setRightFootLength(e.target.value)} className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-black" />
                      <label className="text-[9px] font-bold text-slate-500">발 폭 (mm)</label>
                      <input type="number" value={rightFootWidth} onChange={(e) => setRightFootWidth(e.target.value)} className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-black" />
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleSaveFootProfile}
                  className="w-full py-3 bg-slate-900 !text-white text-xs font-black rounded-xl cursor-pointer"
                >
                  수치 확정 및 Foot Profile 저장
                </button>
              </div>
            ) : (
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center gap-3 border-b pb-3 text-indigo-600">
                  <span className="material-symbols-outlined text-2xl">auto_awesome</span>
                  <h3 className="text-sm font-black text-slate-900">
                    {modeParam === 'hair' ? 'AI 헤어 렌더링 팁' : 'AI 드레스 피팅 팁'}
                  </h3>
                </div>
                <ul className="text-xs font-bold text-slate-600 space-y-2.5 list-disc pl-4 leading-relaxed">
                  {modeParam === 'hair' ? (
                    <>
                      <li>얼굴 전체와 이마라인이 잘 보이는 정면 사진이 가장 적합합니다.</li>
                      <li>모자나 안경을 벗은 상태에서 찍은 사진이 3D 변환 품질이 좋습니다.</li>
                      <li>원하는 헤어 스타일과 컬러를 선택하면 AI가 머리카락 구역을 자동 인식합니다.</li>
                    </>
                  ) : (
                    <>
                      <li>전신이 똑바로 서 있는 정면 착장 사진이 가장 높은 품질을 제공합니다.</li>
                      <li>배경과 복장의 명암 차이가 뚜렷할수록 핀포인트 피팅 정밀도가 향상됩니다.</li>
                      <li>다음 단계에서 WoC 상점 드레스나 내 옷 사진을 자유롭게 선택하세요.</li>
                    </>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* STEP 3: 착장 아이템/스타일 선택 (드레스 상점 / 슈즈 카탈로그 / 헤어 스타일북) */}
        {step === 3 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div className="text-center space-y-1.5">
              <span className="px-3 py-1 bg-indigo-50 text-[#0057bd] text-[11px] font-black rounded-full">3단계</span>
              <h2 className="text-lg font-black text-slate-900">
                {isShoeMode ? '착장해 볼 신발 제품 선택' : modeParam === 'hair' ? '헤어 스타일 & 컬러 선택' : '입어볼 드레스/의상 선택'}
              </h2>
            </div>

            {/* A. 👗 드레스 모드 (WoC 상점 상품 카탈로그 선택 100% 복원) */}
            {modeParam === 'dress' && (
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => garmentInputRef.current?.click()}
                  disabled={isUploadingGarment}
                  className="w-full aspect-[4/2] border-2 border-dashed border-indigo-200 bg-white rounded-3xl flex flex-col items-center justify-center gap-1 text-slate-800 hover:bg-slate-50 transition-all cursor-pointer shadow-sm p-3"
                >
                  {customGarmentUrl ? (
                    <div className="relative w-full h-full rounded-2xl overflow-hidden">
                      <img src={customGarmentUrl} alt="내 업로드 드레스" className="w-full h-full object-contain" />
                      <span className="absolute top-2 left-2 px-2 py-0.5 bg-[#0057bd] text-white text-[9px] font-black rounded">내 업로드 의상</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1.5">
                      <span className="material-symbols-outlined text-3xl text-[#0057bd]">checkroom</span>
                      <span className="text-xs font-black text-slate-900">원하는 의상 사진 올리기 (쇼핑몰 캡처본/사진)</span>
                      <span className="text-[10px] font-bold text-slate-400">사진 1장만 올리면 내 모습에 가상 피팅됩니다</span>
                    </div>
                  )}
                </button>
                <input ref={garmentInputRef} type="file" accept="image/*" onChange={handleUploadGarment} className="hidden" />

                <div className="space-y-2 pt-2">
                  <span className="text-xs font-black text-slate-900">WoC 상점 추천 드레스 컬렉션</span>
                  <div className="grid grid-cols-2 gap-3">
                    {shopProducts.map((p) => {
                      const isSelected = selectedProduct?.id === p.id && !customGarmentUrl;
                      const img = p.imageUrl || (p.images && p.images[0]) || '';
                      return (
                        <div
                          key={p.id}
                          onClick={() => {
                            setSelectedProduct(p);
                            setCustomGarmentUrl(null);
                          }}
                          className={`p-2.5 rounded-2xl border-2 cursor-pointer transition-all bg-white flex flex-col justify-between ${
                            isSelected ? 'border-[#0057bd] ring-4 ring-[#0057bd]/20 scale-[1.02] shadow-md' : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="aspect-[3/4] rounded-xl overflow-hidden bg-slate-100 mb-2 relative">
                            <img src={img} alt={p.title} className="w-full h-full object-cover" />
                            {isSelected && (
                              <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-[#0057bd] text-white flex items-center justify-center shadow-md">
                                <span className="material-symbols-outlined text-[13px]">check</span>
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-[11px] font-black text-slate-900 truncate">{p.title}</p>
                            <p className="text-[10px] font-bold text-[#0057bd] truncate">￦{p.price ? p.price.toLocaleString() : '변동'}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* B. 👟 슈즈 모드 (신발 카탈로그 선택 100% 보장) */}
            {isShoeMode && (
              <div className="space-y-4">
                <div
                  onClick={() => shoeProductInputRef.current?.click()}
                  className="w-full aspect-[4/2] border-2 border-dashed border-indigo-300 rounded-3xl bg-white flex flex-col items-center justify-center gap-1.5 cursor-pointer hover:bg-indigo-50/50 transition-all p-3 shadow-sm"
                >
                  {customShoeProductUrl ? (
                    <div className="relative w-full h-full rounded-2xl overflow-hidden">
                      <img src={customShoeProductUrl} alt="업로드 신발" className="w-full h-full object-contain" />
                      <span className="absolute top-2 left-2 px-2 py-0.5 bg-[#0057bd] text-white text-[9px] font-black rounded">내 업로드 신발</span>
                    </div>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-3xl text-[#0057bd]">add_photo_alternate</span>
                      <span className="text-xs font-black text-slate-900">원하는 신발 사진 올리기 (쇼핑몰/갤러리 캡처본)</span>
                      <span className="text-[10px] font-bold text-slate-400">사진 1장만 올리면 내 발에 핀포인트 착장됩니다</span>
                    </>
                  )}
                  <input ref={shoeProductInputRef} type="file" accept="image/*" onChange={handleUploadCustomShoeProduct} className="hidden" />
                </div>

                <div className="space-y-2 pt-2">
                  <span className="text-xs font-black text-slate-900">WoC 신발 컬렉션 라인업 (8종)</span>
                  <div className="grid grid-cols-2 gap-3">
                    {SHOE_CATALOG_PRODUCTS.map((item) => {
                      const isSelected = selectedShoeProduct?.id === item.id && !customShoeProductUrl;
                      return (
                        <div
                          key={item.id}
                          onClick={() => {
                            setSelectedShoeProduct(item);
                            setCustomShoeProductUrl(null);
                          }}
                          className={`p-2.5 rounded-2xl border-2 cursor-pointer transition-all bg-white flex flex-col justify-between ${
                            isSelected ? 'border-[#0057bd] ring-4 ring-[#0057bd]/20 scale-[1.02] shadow-md' : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="aspect-[4/3] rounded-xl overflow-hidden bg-slate-100 mb-2 relative">
                            <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                            {isSelected && (
                              <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-[#0057bd] text-white flex items-center justify-center shadow-md">
                                <span className="material-symbols-outlined text-[13px]">check</span>
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-[11px] font-black text-slate-900 truncate">{item.title}</p>
                            <p className="text-[9px] font-bold text-slate-400 truncate">{item.description}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* C. 💇‍♀️ 헤어 모드 (Atelier-K 스타일북 & 컬러 선택) */}
            {modeParam === 'hair' && (
              <div className="space-y-4">
                <div className="flex bg-[#e8eaeb] p-1 rounded-2xl border border-[#e0e4e5]">
                  <button
                    type="button"
                    onClick={() => {
                      setGender('women');
                      setSelectedStyle(ATELIER_K_WOMEN_STYLES[0].name);
                    }}
                    className={`flex-1 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      gender === 'women' ? 'bg-white text-pink-600 shadow-sm' : 'text-slate-600'
                    }`}
                  >
                    👩 여성 Atelier-K (27종)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setGender('men');
                      setSelectedStyle(MEN_HAIR_STYLES[0].name);
                    }}
                    className={`flex-1 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                      gender === 'men' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-600'
                    }`}
                  >
                    👨 남성 Atelier-K (18종)
                  </button>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-black text-slate-900">
                    1. 헤어 스타일북 ({currentStyles.length}종)
                  </span>
                  <div className="flex gap-3 overflow-x-auto no-scrollbar py-1 px-0.5">
                    {currentStyles.map((item) => {
                      const isSelected = selectedStyle === item.name;
                      return (
                        <div
                          key={item.id}
                          onClick={() => setSelectedStyle(item.name)}
                          className={`flex-shrink-0 w-28 rounded-2xl overflow-hidden border-2 cursor-pointer transition-all bg-white ${
                            isSelected ? 'border-[#0057bd] ring-4 ring-[#0057bd]/20 scale-105 shadow-md' : 'border-slate-200 opacity-80 hover:opacity-100'
                          }`}
                        >
                          <div className="aspect-[4/5] bg-slate-100 relative">
                            <img src={item.img} alt={item.name} className="w-full h-full object-cover" />
                            {isSelected && (
                              <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-[#0057bd] text-white flex items-center justify-center shadow-md">
                                <span className="material-symbols-outlined text-[13px]">check</span>
                              </div>
                            )}
                          </div>
                          <div className="p-2 text-center">
                            <p className="text-[11px] font-black text-slate-900 truncate">{item.name}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <span className="text-xs font-black text-slate-900">2. 염색 컬러 선택</span>
                  <div className="flex gap-2.5 overflow-x-auto no-scrollbar py-1 px-0.5">
                    {ATELIER_K_HAIR_COLORS.map((col) => {
                      const isSelected = selectedColor.id === col.id;
                      return (
                        <div
                          key={col.id}
                          onClick={() => setSelectedColor(col)}
                          className={`flex-shrink-0 p-2 bg-white rounded-2xl border-2 cursor-pointer flex flex-col items-center gap-1.5 w-20 text-center transition-all ${
                            isSelected ? 'border-[#0057bd] scale-105 shadow-md bg-indigo-50/50' : 'border-slate-200'
                          }`}
                        >
                          <div className="w-8 h-8 rounded-full shadow-md border border-black/10" style={{ backgroundColor: col.hex }} />
                          <p className="text-[10px] font-black text-slate-900 truncate w-full">{col.name}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 4: AI 렌더링 착장 결과 */}
        {step === 4 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="text-center space-y-1">
              <span className="px-3 py-1 bg-indigo-50 text-[#0057bd] text-[11px] font-black rounded-full">4단계</span>
              <h2 className="text-lg font-black text-slate-900">AI 가상 착장 피팅 결과</h2>
              <p className="text-xs font-bold text-slate-400">Before/After 터치 슬라이더를 통해 확인하세요</p>
            </div>

            {/* 👟 슈즈 전용: 캐주얼 룩 & 비즈니스 룩 2종 전신 착장 탭 토글 */}
            {isShoeMode && (
              <div className="flex bg-[#e8eaeb] p-1 rounded-2xl border border-[#e0e4e5] max-w-xs mx-auto">
                <button
                  type="button"
                  onClick={() => setSelectedResultIndex(0)}
                  className={`flex-1 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1 ${
                    selectedResultIndex === 0 ? 'bg-[#0057bd] !text-white shadow-md' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>👔 캐주얼 룩</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedResultIndex(1)}
                  className={`flex-1 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1 ${
                    selectedResultIndex === 1 ? 'bg-[#0057bd] !text-white shadow-md' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>💼 비즈니스 룩</span>
                </button>
              </div>
            )}

            <div className="relative aspect-[3/4] max-h-[360px] w-full mx-auto rounded-3xl overflow-hidden bg-slate-900 shadow-lg border-2 border-slate-200">
              {generatedImages.length > 0 ? (
                <div className="relative w-full h-full select-none overflow-hidden">
                  <img src={generatedImages[selectedResultIndex] || generatedImages[0]} alt="After" className="absolute inset-0 w-full h-full object-cover" />
                  
                  <div
                    className="absolute inset-y-0 left-0 overflow-hidden border-r-2 border-white shadow-xl"
                    style={{ width: `${sliderPosition}%` }}
                  >
                    <img src={activeUserPhoto} alt="Before" className="absolute inset-0 w-full h-full object-cover max-w-none" style={{ width: '100%', height: '100%' }} />
                    <span className="absolute top-3 left-3 px-2 py-0.5 bg-black/70 text-white text-[9px] font-black rounded">Before</span>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={sliderPosition}
                    onChange={(e) => setSliderPosition(Number(e.target.value))}
                    className="absolute inset-x-0 bottom-4 w-4/5 mx-auto opacity-70 hover:opacity-100 accent-[#0057bd] cursor-pointer"
                  />
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                  <p className="text-xs font-bold">생성 중...</p>
                </div>
              )}

              <div className="absolute top-3 left-3 px-3 py-1 bg-black/60 backdrop-blur-md text-white text-[11px] font-black rounded-full border border-white/20 truncate max-w-[200px]">
                {isShoeMode 
                  ? (selectedResultIndex === 0 ? '👔 캐주얼 전신 룩' : '💼 비즈니스 전신 룩')
                  : modeParam === 'hair'
                  ? `${selectedStyle} · ${selectedColor.name}`
                  : (customGarmentUrl ? '커스텀 의상 착장' : selectedProduct?.title || '드레스 착장')}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 하단 CTA 이동 버튼 (전 모드/전 단계 공통 이전/다음 유연화) */}
      <footer className="sticky bottom-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#e0e4e5] p-4 pt-3 pb-[max(env(safe-area-inset-bottom),24px)]">
        <div className="max-w-md mx-auto flex items-center gap-3">
          {step === 1 && (
            <button
              type="button"
              onClick={() => setStep(2)}
              disabled={selectedPhotoIds.length === 0}
              className="w-full py-4 !bg-[#0057bd] !text-white font-black rounded-2xl shadow-lg shadow-[#0057bd]/30 hover:bg-indigo-700 text-base cursor-pointer flex items-center justify-center gap-2"
            >
              <span className="!text-white !font-black drop-shadow-sm">다음: 가이드 & 수치 확인</span>
              <span className="material-symbols-outlined text-xl !text-white">arrow_forward</span>
            </button>
          )}

          {step === 2 && (
            <div className="flex items-center gap-2 w-full">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="py-4 px-5 bg-slate-100 text-slate-700 font-black rounded-2xl hover:bg-slate-200 text-sm cursor-pointer"
              >
                이전
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="flex-1 py-4 !bg-[#0057bd] !text-white font-black rounded-2xl hover:bg-indigo-700 active:scale-[0.98] transition-all text-sm flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-[#0057bd]/30"
              >
                <span className="!text-white !font-black drop-shadow-sm">다음: 아이템/스타일 선택</span>
                <span className="material-symbols-outlined text-xl !text-white">arrow_forward</span>
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="flex items-center gap-2 w-full">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="py-4 px-5 bg-slate-100 text-slate-700 font-black rounded-2xl hover:bg-slate-200 text-sm cursor-pointer"
              >
                이전
              </button>
              <button
                type="button"
                onClick={handleRunTryOn}
                disabled={isGenerating || (isShoeMode && !selectedShoeProduct && !customShoeProductUrl) || (modeParam === 'dress' && !selectedProduct && !customGarmentUrl)}
                className="flex-1 py-4 !bg-[#0057bd] !text-white font-black rounded-2xl hover:bg-indigo-700 active:scale-[0.98] transition-all text-sm flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-[#0057bd]/30 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[18px] !text-white">auto_awesome</span>
                <span className="!text-white !font-black drop-shadow-sm">선택한 아이템 AI 착장 보기</span>
              </button>
            </div>
          )}

          {step === 4 && (
            <div className="flex items-center gap-2 w-full">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="py-4 px-4 bg-slate-100 text-slate-700 font-black rounded-2xl hover:bg-slate-200 text-xs cursor-pointer"
              >
                다른 아이템 선택
              </button>
              <button
                type="button"
                onClick={handleSaveToHistory}
                disabled={isSaving}
                className="flex-1 py-4 !bg-[#0057bd] !text-white font-black rounded-2xl shadow-lg shadow-[#0057bd]/30 hover:bg-indigo-700 text-sm flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px] !text-white">bookmark</span>
                <span className="!text-white !font-black drop-shadow-sm">착장 결과 저장</span>
              </button>
            </div>
          )}
        </div>
      </footer>
    </div>
  );
}

export default function AiTryOnStudioPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-slate-50 text-xs font-bold text-slate-400">로딩 중...</div>}>
      <AiTryOnStudioContent />
    </Suspense>
  );
}
