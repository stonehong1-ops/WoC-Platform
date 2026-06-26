"use client";

import React, { useState } from "react";

export default function SyncFit3Page() {
  // Authentication & Role State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState("");
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);

  // Layout & Navigation State
  // Mobile Tab: 'styles' | 'updates' (협업) | 'showroom' (쇼룸) | 'scm' | 'specs' (테크 팩)
  const [activeTab, setActiveTab] = useState<"styles" | "updates" | "showroom" | "scm" | "specs">("updates");
  
  // PC Right Panel Tab: 'techpack' | 'files' | 'showroom' | 'scm'
  const [activeRightTab, setActiveRightTab] = useState<"techpack" | "files" | "showroom" | "scm">("scm");

  // Showroom Config
  const [fabric, setFabric] = useState<"pique" | "synthetic">("pique");
  const [color, setColor] = useState<"navy" | "grey" | "blue" | "white" | "red">("navy");
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Accordion toggle helper
  const toggleAccordion = (section: string) => {
    setOpenAccordion(prev => (prev === section ? null : section));
  };

  // Login action helper
  const handleLogin = (role: string) => {
    setUserRole(role);
    setIsLoggedIn(true);
    // Default tabs based on role or standard
    setActiveTab("updates");
  };

  // Logout helper
  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserRole("");
  };

  // Return Login Screen if not authenticated
  if (!isLoggedIn) {
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
        `}} />

        <div className="bg-surface font-body-md text-on-surface min-h-screen flex flex-col">
          {/* Login screen header */}
          <header className="w-full pt-12 pb-8 px-margin-mobile flex flex-col items-center text-center">
            <div className="mb-6">
              <span className="text-primary text-[40px] font-black tracking-tighter">SyncFit</span>
            </div>
            <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-on-background mb-2">다시 오신 것을 환영합니다</h1>
            <p className="font-body-md text-on-surface-variant max-w-[280px]">라이프사이클 대시보드에 접속하려면 프로필을 선택해 주세요.</p>
          </header>

          <main className="flex-grow px-margin-mobile pb-12 overflow-y-auto">
            <div className="space-y-4 max-w-md mx-auto">
              
              {/* Admin Role Accordion */}
              <div className={`bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden transition-all duration-200`}>
                <button 
                  className="w-full flex items-center justify-between p-stack-md" 
                  onClick={() => toggleAccordion("admin")}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary-container/10 flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>admin_panel_settings</span>
                    </div>
                    <div className="text-left">
                      <h3 className="font-title-lg text-title-lg">관리자</h3>
                      <p className="font-body-sm text-on-surface-variant">글로벌 통합 관리</p>
                    </div>
                  </div>
                  <span className={`material-symbols-outlined text-outline transition-transform duration-300 ${openAccordion === "admin" ? "rotate-180" : ""}`}>expand_more</span>
                </button>
                <div className={`transition-all duration-300 overflow-hidden ${openAccordion === "admin" ? "max-h-[1000px] opacity-100 mt-3 p-stack-md pt-0" : "max-h-0 opacity-0 px-stack-md pb-0"}`}>
                  <div className="grid grid-cols-1 gap-2">
                    <button className="role-card flex items-center p-stack-md bg-surface hover:bg-surface-container-high border border-outline-variant rounded-lg transition-all" onClick={() => handleLogin("한국 관리자")}>
                      <span className="material-symbols-outlined mr-3 text-secondary">shield_person</span>
                      <span className="font-label-md text-label-md">한국 관리자</span>
                    </button>
                    <button className="role-card flex items-center p-stack-md bg-surface hover:bg-surface-container-high border border-outline-variant rounded-lg transition-all" onClick={() => handleLogin("중국 관리자")}>
                      <span className="material-symbols-outlined mr-3 text-secondary">shield_person</span>
                      <span className="font-label-md text-label-md">중국 관리자</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Designer Role Accordion */}
              <div className={`bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden transition-all duration-200`}>
                <button 
                  className="w-full flex items-center justify-between p-stack-md" 
                  onClick={() => toggleAccordion("designer")}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary-container/10 flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>palette</span>
                    </div>
                    <div className="text-left">
                      <h3 className="font-title-lg text-title-lg">디자이너</h3>
                      <p className="font-body-sm text-on-surface-variant">제품 크리에이티브</p>
                    </div>
                  </div>
                  <span className={`material-symbols-outlined text-outline transition-transform duration-300 ${openAccordion === "designer" ? "rotate-180" : ""}`}>expand_more</span>
                </button>
                <div className={`transition-all duration-300 overflow-hidden ${openAccordion === "designer" ? "max-h-[1000px] opacity-100 mt-3 p-stack-md pt-0" : "max-h-0 opacity-0 px-stack-md pb-0"}`}>
                  <div className="grid grid-cols-1 gap-2">
                    <button className="role-card flex items-center p-stack-md bg-surface hover:bg-surface-container-high border border-outline-variant rounded-lg transition-all" onClick={() => handleLogin("디자이너 1")}>
                      <span className="material-symbols-outlined mr-3 text-secondary">person</span>
                      <span className="font-label-md text-label-md">디자이너 1</span>
                    </button>
                    <button className="role-card flex items-center p-stack-md bg-surface hover:bg-surface-container-high border border-outline-variant rounded-lg transition-all" onClick={() => handleLogin("디자이너 2")}>
                      <span className="material-symbols-outlined mr-3 text-secondary">person</span>
                      <span className="font-label-md text-label-md">디자이너 2</span>
                    </button>
                    <button className="role-card flex items-center p-stack-md bg-surface hover:bg-surface-container-high border border-outline-variant rounded-lg transition-all" onClick={() => handleLogin("디자이너 3")}>
                      <span className="material-symbols-outlined mr-3 text-secondary">person</span>
                      <span className="font-label-md text-label-md">디자이너 3</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Factory Staff Accordion */}
              <div className={`bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden transition-all duration-200`}>
                <button 
                  className="w-full flex items-center justify-between p-stack-md" 
                  onClick={() => toggleAccordion("factory")}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary-container/10 flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>factory</span>
                    </div>
                    <div className="text-left">
                      <h3 className="font-title-lg text-title-lg">공장 직원</h3>
                      <p className="font-body-sm text-on-surface-variant">10개 활성 프로필</p>
                    </div>
                  </div>
                  <span className={`material-symbols-outlined text-outline transition-transform duration-300 ${openAccordion === "factory" ? "rotate-180" : ""}`}>expand_more</span>
                </button>
                <div className={`transition-all duration-300 overflow-hidden ${openAccordion === "factory" ? "max-h-[1000px] opacity-100 mt-3 p-stack-md pt-0" : "max-h-0 opacity-0 px-stack-md pb-0"}`}>
                  <div className="grid grid-cols-2 gap-2">
                    {Array.from({ length: 10 }, (_, i) => (
                      <button 
                        key={i} 
                        className="role-card flex items-center p-stack-md bg-surface hover:bg-surface-container-high border border-outline-variant rounded-lg transition-all" 
                        onClick={() => handleLogin(`공장 직원 ${i + 1}`)}
                      >
                        <span className="material-symbols-outlined mr-2 text-secondary text-sm">precision_manufacturing</span>
                        <span className="font-label-md text-label-md text-xs">직원 {i + 1}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Vendor Staff Accordion */}
              <div className={`bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden transition-all duration-200`}>
                <button 
                  className="w-full flex items-center justify-between p-stack-md" 
                  onClick={() => toggleAccordion("vendor")}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary-container/10 flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>inventory</span>
                    </div>
                    <div className="text-left">
                      <h3 className="font-title-lg text-title-lg">협력사 직원</h3>
                      <p className="font-body-sm text-on-surface-variant">30개 활성 프로필</p>
                    </div>
                  </div>
                  <span className={`material-symbols-outlined text-outline transition-transform duration-300 ${openAccordion === "vendor" ? "rotate-180" : ""}`}>expand_more</span>
                </button>
                <div className={`transition-all duration-300 overflow-hidden ${openAccordion === "vendor" ? "max-h-[1000px] opacity-100 mt-3 p-stack-md pt-0" : "max-h-0 opacity-0 px-stack-md pb-0"}`}>
                  <div className="grid grid-cols-2 gap-2">
                    {Array.from({ length: 30 }, (_, i) => (
                      <button 
                        key={i} 
                        className="role-card flex items-center p-stack-md bg-surface hover:bg-surface-container-high border border-outline-variant rounded-lg transition-all" 
                        onClick={() => handleLogin(`협력사 직원 ${i + 1}`)}
                      >
                        <span className="material-symbols-outlined mr-2 text-secondary text-sm">storefront</span>
                        <span className="font-label-md text-label-md text-xs">협력사 {i + 1}</span>
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

  // Return Main Dashboard Workspace if authenticated
  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@600;700;800;900&family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@100..900&family=Outfit:wght@100..900&display=swap" rel="stylesheet" />
      
      <style dangerouslySetInnerHTML={{ __html: `
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
            vertical-align: middle;
        }
        .glass-panel {
            background: rgba(255, 255, 255, 0.8);
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
        }
        .canvas-bg {
            background: radial-gradient(circle at 50% 50%, #f0f4ff 0%, #faf8ff 100%);
        }
        .swatch-active {
            box-shadow: 0 0 0 2px white, 0 0 0 4px #004ac6;
        }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
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
      `}} />

      <div className="bg-surface-container-low text-on-surface font-body-md overflow-hidden h-screen flex flex-col">
        {/* TopNavBar */}
        <header className="flex justify-between items-center w-full px-4 md:px-margin-desktop h-16 z-50 bg-surface border-b border-outline-variant shrink-0">
          <div className="flex items-center gap-stack-md">
            <span className="text-title-lg font-title-lg font-black text-primary">SyncFit</span>
            <div className="hidden md:flex items-center ml-8 gap-6 h-full">
              <a className="h-full flex items-center text-primary border-b-2 border-primary font-label-md text-label-md" href="#">상태</a>
              <a className="h-full flex items-center text-on-surface-variant hover:bg-surface-container-high transition-colors font-label-md text-label-md px-2" href="#">벤더</a>
              <a className="h-full flex items-center text-on-surface-variant hover:bg-surface-container-high transition-colors font-label-md text-label-md px-2" href="#">공장</a>
              <a className="h-full flex items-center text-on-surface-variant hover:bg-surface-container-high transition-colors font-label-md text-label-md px-2" href="#">아카이브</a>
            </div>
          </div>
          <div className="flex items-center gap-stack-md">
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-outline-variant text-label-md font-label-md hover:bg-surface-container-high transition-colors">
              <span className="material-symbols-outlined text-[20px]">language</span>
              <span>CN (중국어)</span>
            </button>
            <div className="h-8 w-px bg-outline-variant mx-2"></div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="font-label-md text-label-md text-on-surface">{userRole || "디자이너 2"}</p>
                <p className="text-[12px] text-on-surface-variant">글로벌 관리자</p>
              </div>
              <img alt="User profile" className="w-10 h-10 rounded-full object-cover border-2 border-primary-container" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDpoRU4Sj7KZ9sugy09btuk7W2vyfigXhkaXZSDJ5icoX_g7APoIQJOxHPq_mm0fVRkueMXn29wdXFey5Y1hdURAnX4cjPGb2XsXAqq65JUhV6I1udnhLuHfq7zziXulEnoNeCrFarq6CGns0k01ywH4OUUMo2yUlGoCGvzautaGdROSAm6qX1SKo3fvxyk44xkvRkV66CADFpiQG_Wax_-3-nxl8KGKcx0h6KKvnXq0Fgg08A2PIvGNgE__vQlggCep3PX-IcvOrM" />
            </div>
            <button onClick={handleLogout} className="ml-2 text-on-surface-variant hover:text-error transition-colors p-2">
              <span className="material-symbols-outlined">logout</span>
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 flex overflow-hidden">
          
          {/* Column 1: Style List (PC에서는 항상 보이고, 모바일에서는 activeTab이 'styles'일 때 노출) */}
          <aside className={`lg:flex flex-col w-full lg:w-[300px] bg-surface border-r border-outline-variant shrink-0 ${activeTab === "styles" ? "flex" : "hidden"}`}>
            <div className="p-stack-md flex flex-col gap-stack-md">
              <div className="flex justify-between items-center">
                <h2 className="font-headline-md text-headline-md">스타일 탐색기</h2>
              </div>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
                <input className="w-full pl-10 pr-4 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-body-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none" placeholder="스타일 검색..." type="text" />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                <button className="px-3 py-1 bg-primary text-on-primary rounded-full text-label-md font-label-md whitespace-nowrap">전체</button>
                <button className="px-3 py-1 bg-surface-container-high text-on-surface-variant rounded-full text-label-md font-label-md whitespace-nowrap hover:bg-surface-container-highest">디자인</button>
                <button className="px-3 py-1 bg-surface-container-high text-on-surface-variant rounded-full text-label-md font-label-md whitespace-nowrap hover:bg-surface-container-highest">생산</button>
              </div>
              <button className="w-full py-2.5 bg-primary text-on-primary rounded-lg font-label-md text-label-md flex items-center justify-center gap-2 hover:bg-primary-container transition-all active:scale-[0.98]">
                <span className="material-symbols-outlined">add</span>
                새 제품 추가
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-stack-md pb-stack-lg space-y-3">
              {/* Style Card Active */}
              <div className="p-3 bg-primary-container/10 border-2 border-primary rounded-xl cursor-pointer transition-all">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-code-sm text-code-sm text-primary">ST-00001</span>
                  <span className="px-2 py-0.5 bg-error text-white text-[10px] font-bold rounded-full">3</span>
                </div>
                <h3 className="font-label-md text-label-md mb-1">오버사이즈 테크 쉘</h3>
                <p className="text-body-sm text-on-surface-variant mb-3">2025 봄 컬렉션</p>
                <div className="flex items-center justify-between">
                  <span className="px-2 py-1 bg-tertiary-fixed text-on-tertiary-fixed-variant text-[11px] rounded font-bold uppercase tracking-wider">생산중</span>
                  <span className="text-[11px] text-on-surface-variant">2분 전 업데이트</span>
                </div>
              </div>
              {/* Style Cards */}
              <div className="p-3 bg-surface border border-outline-variant rounded-xl cursor-pointer hover:border-primary-container transition-all">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-code-sm text-code-sm text-on-surface-variant">ST-00002</span>
                </div>
                <h3 className="font-label-md text-label-md mb-1">라이너 니트 V넥</h3>
                <p className="text-body-sm text-on-surface-variant mb-3">코어 에센셜</p>
                <div className="flex items-center justify-between">
                  <span className="px-2 py-1 bg-surface-container-highest text-on-surface-variant text-[11px] rounded font-bold uppercase tracking-wider">디자인</span>
                  <span className="text-[11px] text-on-surface-variant">4시간 전 업데이트</span>
                </div>
              </div>
              <div className="p-3 bg-surface border border-outline-variant rounded-xl cursor-pointer hover:border-primary-container transition-all">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-code-sm text-code-sm text-on-surface-variant">ST-00003</span>
                </div>
                <h3 className="font-label-md text-label-md mb-1">택티컬 카고 팬츠</h3>
                <p className="text-body-sm text-on-surface-variant mb-3">2025 봄 컬렉션</p>
                <div className="flex items-center justify-between">
                  <span className="px-2 py-1 bg-surface-container-highest text-on-surface-variant text-[11px] rounded font-bold uppercase tracking-wider">아카이브</span>
                  <span className="text-[11px] text-on-surface-variant">1일 전 업데이트</span>
                </div>
              </div>
            </div>
          </aside>

          {/* Column 2: Collaboration Feed (PC에서는 항상 보이고, 모바일에서는 activeTab이 'updates'일 때 노출) */}
          <section className={`lg:flex flex-1 flex-col bg-slate-50 relative min-w-0 ${activeTab === "updates" ? "flex" : "hidden"}`}>
            {/* Mobile Header (Visible < 768px) */}
            <div className="md:hidden h-14 flex items-center justify-between px-4 bg-surface border-b border-outline-variant shrink-0">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined" onClick={() => setActiveTab("styles")}>arrow_back</span>
                <span className="font-title-lg text-title-lg">ST-00001</span>
              </div>
              <span className="material-symbols-outlined">menu</span>
            </div>
            
            <div className="p-4 border-b border-outline-variant bg-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-primary-container/20 rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary">factory</span>
                </div>
                <div>
                  <h1 className="font-headline-sm font-bold text-lg">둥관 정밀 텍스타일 (Dongguan Precision)</h1>
                  <p className="text-body-sm text-on-surface-variant flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span> 현재 접속 중
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-surface-container-high px-3 py-1.5 rounded-full">
                  <span className="text-label-md font-label-md">자동 번역</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input defaultChecked className="sr-only peer" type="checkbox" />
                    <div className="w-9 h-5 bg-outline rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Feed Area */}
            <div className="flex-1 overflow-y-auto p-stack-md space-y-6">
              {/* System Message */}
              <div className="flex justify-center">
                <span className="px-4 py-1.5 bg-secondary-container text-on-secondary-fixed-variant text-[12px] font-bold rounded-full uppercase tracking-widest">
                  시스템: 상태가 '샘플 생산'으로 변경되었습니다
                </span>
              </div>
              
              {/* Factory Message */}
              <div className="flex gap-3 max-w-[85%]">
                <div className="w-8 h-8 shrink-0 bg-secondary rounded-full overflow-hidden">
                  <img alt="Factory contact" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuARfsdno299WSXQ9px-FH-zricBXUIrmcVqm1WQoh5_8CTE6nGdOOeFzbWBbmRMFqWfMoNTXajcAZln37ke9YokuZL9-wrhC1qafYKtRoog91hEE28MB4ZRl-7A2CUVUniXqzV_2aMAyNkFvlFyDxPiyR5nEseN5IRytdc0snj22H27VxG1oCSSxAvR3U7N3clHVMMBfEuxrr89ewZQv-2MdoQXKwe8a3WXdcFaycAPC4W8qQviz8ZeAQSOUVFyUnMrpxr7qANk-Gk" />
                </div>
                <div>
                  <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-slate-200 shadow-sm">
                    <p className="text-body-md">你好，关于ST-00001的样品制作，我们已经收到了更新的Tech Pack。所有的面料已经准备好，预计下周三可以完成首样。</p>
                    <div className="mt-2 pt-2 border-t border-slate-100 flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-primary uppercase">번역됨 (한국어)</span>
                      <p className="text-body-sm text-on-surface-variant italic">"안녕하세요, ST-00001 샘플 제작과 관련하여 업데이트된 테크 팩을 잘 받았습니다. 모든 원단 준비가 완료되었으며, 다음 주 수요일까지 첫 번째 샘플을 완성할 수 있을 것으로 예상됩니다."</p>
                    </div>
                  </div>
                  <span className="text-[11px] text-on-surface-variant ml-1 mt-1 block">공장 현장 • 오전 09:42</span>
                </div>
              </div>

              {/* Designer Message (Self) */}
              <div className="flex flex-row-reverse gap-3 max-w-[85%] ml-auto">
                <div className="w-8 h-8 shrink-0 bg-primary rounded-full overflow-hidden">
                  <img alt="Self" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD2_Mf7ImZA9SiRDfMa-IpT2pLME8YXDlynNT0IB6HM6slkN4_6T5yLMgg3wxeq0yWDbfiVwMz2EDJacAJZgGEzXxjciDTi5k0qe_HboMlgXjLzWYoCPZYME2VvhfxEmCaN_U_Y3wMLRWZUBQ6r9mEPle8GLy86xoWW55G-2mT2RKA4BAJZUHnmZYP_lDsweWrghP1SSc7Hhi8GNkBM8yiCMpvgjC6GCqSmF40v-obRIWfgmM7cllRGjPYLHLkyQUe91RgQ6LXsK00" />
                </div>
                <div className="text-right">
                  <div className="bg-primary text-on-primary p-4 rounded-2xl rounded-tr-none shadow-md">
                    <p className="text-body-md text-left">좋습니다. 내부 포켓의 심 실링(seam sealing) 처리가 14페이지의 새로운 사양을 따르는지 확인 부탁드립니다.</p>
                  </div>
                  <span className="text-[11px] text-on-surface-variant mr-1 mt-1 block">{userRole || "디자이너 2"} • 오전 09:55</span>
                </div>
              </div>

              {/* Log Attachment */}
              <div className="flex justify-center">
                <div className="flex items-center gap-2 text-on-surface-variant">
                  <div className="h-px w-8 bg-outline-variant"></div>
                  <span className="text-[11px] font-label-md">첨부파일: ST001_Revised_Seams.pdf (4.2 MB)</span>
                  <div className="h-px w-8 bg-outline-variant"></div>
                </div>
              </div>
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-outline-variant shrink-0">
              <div className="max-w-4xl mx-auto flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <select className="appearance-none bg-surface-container-low border border-outline-variant rounded-full pl-3 pr-8 py-1 text-label-md font-label-md text-on-surface-variant focus:ring-primary outline-none">
                      <option>상태: 생산</option>
                      <option>상태: 지연</option>
                      <option>상태: QC 대기</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant text-[18px]">expand_more</span>
                  </div>
                  <button className="p-1.5 text-on-surface-variant hover:bg-surface-container-high rounded-full">
                    <span className="material-symbols-outlined">alternate_email</span>
                  </button>
                </div>
                <div className="flex items-end gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-2">
                  <button className="p-2 text-on-surface-variant hover:text-primary transition-colors">
                    <span className="material-symbols-outlined">attach_file</span>
                  </button>
                  <textarea className="flex-1 bg-transparent border-none focus:ring-0 resize-none py-2 text-body-md min-h-[40px] outline-none" placeholder="공장에 메시지 입력..." rows={1}></textarea>
                  <button className="bg-primary text-on-primary w-10 h-10 rounded-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all">
                    <span className="material-symbols-outlined">send</span>
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Column 3: Style Detail Panel (PC에서는 항상 보이고, 모바일에서는 'specs' or 'showroom' or 'scm' 일 때 노출) */}
          <aside className={`lg:flex flex-col w-full lg:w-[400px] bg-white border-l border-outline-variant shrink-0 ${activeTab === "showroom" || activeTab === "scm" || activeTab === "specs" ? "flex" : "hidden"}`}>
            
            {/* Tabs */}
            <div className="flex border-b border-outline-variant overflow-x-auto no-scrollbar shrink-0">
              <button 
                onClick={() => { setActiveRightTab("techpack"); setActiveTab("specs"); }}
                className={`flex-1 py-4 px-2 text-[12px] font-bold uppercase tracking-wider transition-colors text-center ${activeRightTab === "techpack" ? "text-primary border-b-2 border-primary bg-primary-container/5" : "text-on-surface-variant hover:bg-surface-container-low border-b-2 border-transparent"}`}
              >
                테크 팩
              </button>
              <button 
                onClick={() => { setActiveRightTab("files"); }}
                className={`flex-1 py-4 px-2 text-[12px] font-bold uppercase tracking-wider transition-colors text-center ${activeRightTab === "files" ? "text-primary border-b-2 border-primary bg-primary-container/5" : "text-on-surface-variant hover:bg-surface-container-low border-b-2 border-transparent"}`}
              >
                파일
              </button>
              <button 
                onClick={() => { setActiveRightTab("showroom"); setActiveTab("showroom"); }}
                className={`flex-1 py-4 px-2 text-[12px] font-bold uppercase tracking-wider transition-colors text-center ${activeRightTab === "showroom" ? "text-primary border-b-2 border-primary bg-primary-container/5" : "text-on-surface-variant hover:bg-surface-container-low border-b-2 border-transparent"}`}
              >
                쇼룸
              </button>
              <button 
                onClick={() => { setActiveRightTab("scm"); setActiveTab("scm"); }}
                className={`flex-1 py-4 px-2 text-[12px] font-bold uppercase tracking-wider transition-colors text-center ${activeRightTab === "scm" ? "text-primary border-b-2 border-primary bg-primary-container/5" : "text-on-surface-variant hover:bg-surface-container-low border-b-2 border-transparent"}`}
              >
                SCM
              </button>
            </div>

            {/* Inner Content Switcher */}
            <div className="flex-1 overflow-y-auto p-stack-md">
              {activeRightTab === "scm" && (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-headline-md text-headline-md">SCM 계산기</h3>
                    <button className="text-primary font-label-md text-label-md flex items-center gap-1">
                      <span className="material-symbols-outlined text-[18px]">history</span> 이력
                    </button>
                  </div>
                  <div className="space-y-6">
                    {/* Calculator Inputs */}
                    <div className="bg-slate-50 p-stack-md rounded-2xl border border-slate-200 space-y-4">
                      <div>
                        <label className="block font-label-md text-label-md mb-2 text-on-surface-variant">원단 비용 (RMB/m)</label>
                        <div className="relative">
                          <input className="w-full bg-white border border-outline-variant rounded-lg py-2.5 px-4 font-code-sm text-on-surface focus:ring-primary outline-none" type="number" defaultValue="84.50" />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">¥</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block font-label-md text-label-md mb-2 text-on-surface-variant">소요량</label>
                          <div className="relative">
                            <input className="w-full bg-white border border-outline-variant rounded-lg py-2.5 px-4 font-code-sm text-on-surface focus:ring-primary outline-none" type="number" defaultValue="1.85" />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">m</span>
                          </div>
                        </div>
                        <div>
                          <label className="block font-label-md text-label-md mb-2 text-on-surface-variant">공임 비용 (CMT)</label>
                          <div className="relative">
                            <input className="w-full bg-white border border-outline-variant rounded-lg py-2.5 px-4 font-code-sm text-on-surface focus:ring-primary outline-none" type="number" defaultValue="45.00" />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">¥</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="block font-label-md text-label-md mb-2 text-on-surface-variant">환율 (CNY/USD)</label>
                        <div className="relative">
                          <input className="w-full bg-white border border-outline-variant rounded-lg py-2.5 px-4 font-code-sm text-on-surface focus:ring-primary outline-none" type="number" defaultValue="7.24" />
                          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">$</span>
                        </div>
                      </div>
                    </div>
                    {/* Auto-Calculated Results */}
                    <div className="bg-primary text-on-primary p-6 rounded-2xl shadow-xl space-y-4 relative overflow-hidden group">
                      <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all duration-700"></div>
                      <div>
                        <p className="text-[12px] font-bold uppercase tracking-widest text-on-primary/70">계산된 도매가</p>
                        <h4 className="text-[40px] font-bold font-title-lg tracking-tight">$68.42</h4>
                      </div>
                      <div className="pt-4 border-t border-on-primary/20 grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[10px] font-bold uppercase text-on-primary/60">총 원가 (USD)</p>
                          <p className="font-code-sm text-lg">$27.37</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase text-on-primary/60">마진율 %</p>
                          <p className="font-code-sm text-lg">60.0%</p>
                        </div>
                      </div>
                    </div>
                    {/* Market Insights */}
                    <div className="space-y-3">
                      <h4 className="font-label-md text-label-md text-on-surface-variant">카테고리 비교</h4>
                      <div className="p-4 border border-outline-variant rounded-xl flex items-center gap-4">
                        <div className="flex-1">
                          <div className="flex justify-between mb-1">
                            <span className="text-body-sm">쉘 자켓</span>
                            <span className="font-code-sm text-green-600">-$4.20</span>
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

              {activeRightTab === "showroom" && (
                <div className="flex flex-col h-full relative overflow-hidden">
                  <div className="flex-grow relative canvas-bg overflow-hidden flex flex-col rounded-xl min-h-[300px] border border-outline-variant mb-4">
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <img 
                        alt="3D 어패럴 뷰" 
                        className="w-full h-full object-contain mix-blend-multiply opacity-90 transition-all duration-350" 
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuD2M775m46Uq9oDlRHhW3dHSQ_ITcej4eqfLUA8H3fF72C_SKGp4XRnVUdZOSGMZzg_AhJQbuX_kqmpaLg4O2Z4rvB_R3y4L6nwSBopEIYw0FRkGIxGeHD9ZlXxkvnW1pxfSvy9AtCw4wrx7W9bH8_QLLimItJkjDxlpljAR7xzhKblquRsg1W0jeF43_4MjWl5m_diKVPRy4k3HAmnlmVZZw5vlYdXDQKVT_IOKXVl2giQzkQcnVdS9BzHtgKvYQLC6H-p4T2wvik" 
                      />
                    </div>
                    <div className="absolute left-4 top-4 flex flex-col gap-2">
                      <button className="w-10 h-10 glass-panel border border-outline-variant rounded-full flex items-center justify-center shadow-sm"><span className="material-symbols-outlined text-primary">360</span></button>
                      <button className="w-10 h-10 glass-panel border border-outline-variant rounded-full flex items-center justify-center shadow-sm"><span className="material-symbols-outlined text-on-surface-variant">zoom_in</span></button>
                    </div>
                  </div>
                  
                  <div className="glass-panel border border-outline-variant rounded-xl p-4 space-y-4">
                    <div>
                      <h3 className="font-label-md text-on-surface-variant mb-2 uppercase tracking-wider text-[10px]">원단 선택</h3>
                      <div className="grid grid-cols-2 gap-2">
                        <button 
                          onClick={() => setFabric("pique")}
                          className={`flex items-center gap-2 p-2.5 rounded-lg border-2 transition-all ${fabric === "pique" ? "border-primary bg-primary-container/10" : "border-outline-variant bg-surface"}`}
                        >
                          <div className="w-6 h-6 rounded bg-slate-400 overflow-hidden shrink-0">
                            <img alt="Fabric sw" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDaJ_nwpbfg-HsXEtyiAdSEhJomLPQOw3AnW6mUs9j3-BcZTbtY6lpS_n6QevOsvDWgGl6zdx0UZxZ7api2yWEoW5fDG3ftNpDj0AagyNrdb2R9_iztFCkDRZAwThwVBWa_uEZLv0r27nZSt1cA5OGos0Xh2yOkeA2_QEBFD9Fy5FByxey0VVzPN2HL9fHF8k8_qQHLDkgm7L19LyYixExTH49-tTA580pWD1znc1wNIyss6XEoSeYCpAHL9GvNKN1jsf9LBMdMgM0" />
                          </div>
                          <div className="text-left leading-none">
                            <p className="font-label-md text-xs font-bold">테크-피케</p>
                          </div>
                        </button>
                        <button 
                          onClick={() => setFabric("synthetic")}
                          className={`flex items-center gap-2 p-2.5 rounded-lg border transition-all ${fabric === "synthetic" ? "border-primary bg-primary-container/10" : "border-outline-variant bg-surface"}`}
                        >
                          <div className="w-6 h-6 rounded bg-slate-300 overflow-hidden shrink-0">
                            <img alt="Fabric sw 2" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBY7KtHHNZ4_ubLXvSYJ7-QEZRutWA9AZwSpY0Pog_paEL9AFJKPw7Tbz5QRHfX9XjZFaxGNXdojMrDYUmiIAXCxfm8bsqVsptADxCJYu10cXdcGvlHh-5pBDrptte20YrJHTb-WmYXPg6vj6x46q0WW7BzGAmZEE-Bfb1DI7hIEG3HoO3nNO1sjyvrWPEQ5aF_7DcWVjEaWPgEsBGt7aSWWSscd_tzZUXOH4oPU9kmqDHxTCqrOiBaFhUvSnVxeTecNUgZfkH1Nmk" />
                          </div>
                          <div className="text-left leading-none">
                            <p className="font-label-md text-xs font-bold">플렉스-브레이드</p>
                          </div>
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-label-md text-on-surface-variant mb-2 uppercase tracking-wider text-[10px]">컬러 팔레트</h3>
                      <div className="flex items-center gap-3 py-1">
                        <button onClick={() => setColor("navy")} className={`w-8 h-8 rounded-full bg-[#131b2e] ${color === "navy" ? "swatch-active" : ""}`}></button>
                        <button onClick={() => setColor("grey")} className={`w-8 h-8 rounded-full bg-[#5c5f61] ${color === "grey" ? "swatch-active" : ""}`}></button>
                        <button onClick={() => setColor("blue")} className={`w-8 h-8 rounded-full bg-[#004ac6] ${color === "blue" ? "swatch-active" : ""}`}></button>
                        <button onClick={() => setColor("white")} className={`w-8 h-8 rounded-full bg-[#faf8ff] border border-outline-variant ${color === "white" ? "swatch-active" : ""}`}></button>
                        <button onClick={() => setColor("red")} className={`w-8 h-8 rounded-full bg-[#ab0b1c] ${color === "red" ? "swatch-active" : ""}`}></button>
                      </div>
                    </div>

                    <div className="flex justify-between items-center py-2 border-t border-outline-variant/30">
                      <div>
                        <p className="font-label-md text-xs">예상 단가</p>
                        <p className="font-headline-md text-primary text-base">₩58,500</p>
                      </div>
                      <div className="text-right">
                        <p className="font-label-md text-xs">리드 타임</p>
                        <p className="font-body-sm text-xs text-on-surface-variant">14-21일</p>
                      </div>
                    </div>
                    
                    <button className="w-full bg-primary hover:bg-on-primary-fixed-variant text-on-primary font-label-md py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2">
                      <span>생산 확정하기</span>
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </button>
                  </div>
                </div>
              )}

              {activeRightTab === "techpack" && (
                <div className="space-y-4">
                  <h3 className="font-headline-md text-headline-md">테크 팩 정보</h3>
                  <div className="p-4 border border-outline-variant rounded-xl bg-slate-50">
                    <p className="text-body-sm font-bold mb-1">ST-00001 Specs</p>
                    <p className="text-xs text-on-surface-variant mb-3">최종 수정: Sarah Kim (2일 전)</p>
                    <div className="flex items-center gap-2 p-2 bg-white rounded border border-outline-variant">
                      <span className="material-symbols-outlined text-primary">description</span>
                      <span className="text-body-sm font-medium flex-1 truncate">ST001_Revised_Seams.pdf</span>
                      <button className="text-primary text-xs font-bold">다운로드</button>
                    </div>
                  </div>
                </div>
              )}

              {activeRightTab === "files" && (
                <div className="space-y-4">
                  <h3 className="font-headline-md text-headline-md">공유 파일 아카이브</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 p-3 bg-white rounded-xl border border-outline-variant">
                      <span className="material-symbols-outlined text-primary">description</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-body-sm font-bold truncate">Elasticity_Report_V2.pdf</p>
                        <p className="text-[10px] text-on-surface-variant">1.2 MB • Sarah Kim</p>
                      </div>
                      <button className="text-primary text-xs font-bold">보기</button>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {activeRightTab === "scm" && (
              <div className="p-stack-md border-t border-outline-variant shrink-0">
                <button className="w-full py-3 bg-surface border-2 border-primary text-primary rounded-xl font-bold hover:bg-primary/5 transition-all">
                  SCM 시트 내보내기
                </button>
              </div>
            )}
          </aside>

        </main>

        {/* BottomNavBar (Visible on mobile only) */}
        <nav className="fixed bottom-0 left-0 w-full z-50 flex lg:hidden justify-around items-center px-4 pb-safe h-16 bg-surface border-t border-outline-variant shadow-lg">
          <div 
            onClick={() => { setActiveTab("specs"); setActiveRightTab("techpack"); }}
            className={`flex flex-col items-center justify-center cursor-pointer ${activeTab === "specs" ? "bg-primary-container/20 text-primary rounded-full px-4 py-1" : "text-on-surface-variant"}`}
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: activeTab === "specs" ? "'FILL' 1" : "'FILL' 0" }}>description</span>
            <span className="text-[10px] font-medium">테크 팩</span>
          </div>
          <div 
            onClick={() => setActiveTab("updates")}
            className={`flex flex-col items-center justify-center cursor-pointer ${activeTab === "updates" ? "bg-primary-container/20 text-primary rounded-full px-4 py-1" : "text-on-surface-variant"}`}
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: activeTab === "updates" ? "'FILL' 1" : "'FILL' 0" }}>chat_bubble</span>
            <span className="text-[10px] font-bold">협업</span>
          </div>
          <div 
            onClick={() => { setActiveTab("showroom"); setActiveRightTab("showroom"); }}
            className={`flex flex-col items-center justify-center cursor-pointer ${activeTab === "showroom" ? "bg-primary-container/20 text-primary rounded-full px-4 py-1" : "text-on-surface-variant"}`}
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: activeTab === "showroom" ? "'FILL' 1" : "'FILL' 0" }}>view_in_ar</span>
            <span className="text-[10px] font-medium">쇼룸</span>
          </div>
          <div 
            onClick={() => { setActiveTab("scm"); setActiveRightTab("scm"); }}
            className={`flex flex-col items-center justify-center cursor-pointer ${activeTab === "scm" ? "bg-primary-container/20 text-primary rounded-full px-4 py-1" : "text-on-surface-variant"}`}
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: activeTab === "scm" ? "'FILL' 1" : "'FILL' 0" }}>calculate</span>
            <span className="text-[10px] font-medium">SCM</span>
          </div>
        </nav>
      </div>
    </>
  );
}
