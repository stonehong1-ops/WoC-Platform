const fs = require('fs');

try {
  let content = fs.readFileSync('c:/Users/stone/WoC/src/components/groups/GroupHome.tsx', 'utf8');

  // 1. Replace activeTab state with visitedTabs
  content = content.replace(
      "const [activeTab, setActiveTab] = useState<TabType>('home');",
      "const [activeTab, setActiveTab] = useState<TabType>('home');\n  const [visitedTabs, setVisitedTabs] = useState<Set<TabType>>(new Set(['home']));"
  );

  // 2. Add visitedTabs update to useEffect
  content = content.replace(
      "setActiveTab(tabParam as TabType);",
      "setActiveTab(tabParam as TabType);\n          setVisitedTabs(prev => { const newSet = new Set(prev); newSet.add(tabParam as TabType); return newSet; });"
  );

  // 3. Remove window.scrollTo from handleTabClick and add visitedTabs
  const oldHandleRegex = /  const handleTabClick = \(tab: TabType\) => {[\s\S]*?window\.history\.replaceState\({ __groupPageGuard: currentGroup\.id, tab }, '', url\.toString\(\)\);\n  };/;
  
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

  content = content.replace(oldHandleRegex, newHandle);

  // 4. Replace tab blocks
  // {activeTab === 'home' && (
  const pattern = /\{activeTab === '([^']+)'(?: && isFullMember)?(?: && isAdminUser)? && \(/g;
  let match;
  while ((match = pattern.exec(content)) !== null) {
      const tabName = match[1];
      const prefix = match[0];
      const startIdx = match.index;
      const endIdx = pattern.lastIndex;

      let newPrefix = "";
      if (prefix.includes("isFullMember")) {
          newPrefix = "{visitedTabs.has('" + tabName + "') && isFullMember && (<div style={{ display: activeTab === '" + tabName + "' ? 'block' : 'none' }}>\\n";
      } else if (prefix.includes("isAdminUser")) {
          newPrefix = "{visitedTabs.has('" + tabName + "') && isAdminUser && (<div style={{ display: activeTab === '" + tabName + "' ? 'block' : 'none' }}>\\n";
      } else {
          newPrefix = "{visitedTabs.has('" + tabName + "') && (<div style={{ display: activeTab === '" + tabName + "' ? 'block' : 'none' }}>\\n";
      }
      // fix literal newline string that I used in newPrefix
      newPrefix = newPrefix.replace("\\n", "\n");

      let parenCount = 1;
      let curr = endIdx;
      while (curr < content.length && parenCount > 0) {
          if (content[curr] === '(') parenCount++;
          else if (content[curr] === ')') parenCount--;
          curr++;
      }

      const insertPos = curr - 1;
      
      content = content.slice(0, insertPos) + "\\n              </div>" + content.slice(insertPos);
      content = content.replace("\\n", "\n"); // just in case
      content = content.slice(0, startIdx) + newPrefix + content.slice(endIdx);
      
      pattern.lastIndex = startIdx + newPrefix.length;
  }

  fs.writeFileSync('c:/Users/stone/WoC/src/components/groups/GroupHome.tsx', content);
  console.log("Replacement complete.");
} catch(e) {
  console.error("Error modifying file:", e);
}
