const fs = require('fs');

try {
  let content = fs.readFileSync('c:/Users/stone/WoC/src/components/groups/GroupHome.tsx', 'utf8');

  const oldHandle = `  const handleTabClick = (tab: TabType) => {
    // [Fix #1] 홈이 아닌 탭을 클릭하면 히어로를 다시 보이지 않도록 처리
    if (tab !== 'home') heroShown.current = true;

    // [Fix #2] 모든 탭 전환 시 스크롤 최상단으로 이동
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });

    // 메인(home)과 About(about)은 누구나 접근 가능
    if (tab === 'home' || tab === 'about') {
      setActiveTab(tab);
      // [App Shell] 수평 이동: replaceState로 URL 반영 (히스토리 안 쌓임)
      const url = new URL(window.location.href);
      if (tab === 'home') {
        url.searchParams.delete('tab');
      } else {
        url.searchParams.set('tab', tab);
      }
      window.history.replaceState({ __groupPageGuard: currentGroup.id, tab }, '', url.toString());
      return;
    }

    // 그 외 메뉴는 정회원만 가능
    if (!isFullMember) {
      return;
    }

    setActiveTab(tab);
    // [App Shell] 수평 이동: replaceState로 URL 반영 (히스토리 안 쌓임)
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tab);
    window.history.replaceState({ __groupPageGuard: currentGroup.id, tab }, '', url.toString());
  };`;

  const newHandle = `  const handleTabClick = (tab: TabType) => {
    // [Fix #1] 홈이 아닌 탭을 클릭하면 히어로를 다시 보이지 않도록 처리
    if (tab !== 'home') heroShown.current = true;

    // 메인(home)과 About(about)은 누구나 접근 가능
    if (tab === 'home' || tab === 'about') {
      setActiveTab(tab);
      setVisitedTabs(prev => {
        const newSet = new Set(prev);
        newSet.add(tab);
        return newSet;
      });
      // [App Shell] 수평 이동: replaceState로 URL 반영 (히스토리 안 쌓임)
      const url = new URL(window.location.href);
      if (tab === 'home') {
        url.searchParams.delete('tab');
      } else {
        url.searchParams.set('tab', tab);
      }
      window.history.replaceState({ __groupPageGuard: currentGroup.id, tab }, '', url.toString());
      return;
    }

    // 그 외 메뉴는 정회원만 가능
    if (!isFullMember) {
      return;
    }

    setActiveTab(tab);
    setVisitedTabs(prev => {
      const newSet = new Set(prev);
      newSet.add(tab);
      return newSet;
    });
    // [App Shell] 수평 이동: replaceState로 URL 반영 (히스토리 안 쌓임)
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tab);
    window.history.replaceState({ __groupPageGuard: currentGroup.id, tab }, '', url.toString());
  };`;

  if (content.includes("window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });")) {
    content = content.replace(oldHandle, newHandle);
    fs.writeFileSync('c:/Users/stone/WoC/src/components/groups/GroupHome.tsx', content);
    console.log("Replacement complete.");
  } else {
    console.log("Already replaced or not found.");
  }
} catch(e) {
  console.error("Error modifying file:", e);
}
