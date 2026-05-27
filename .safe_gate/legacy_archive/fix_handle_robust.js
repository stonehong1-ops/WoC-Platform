const fs = require('fs');

try {
  let content = fs.readFileSync('c:/Users/stone/WoC/src/components/groups/GroupHome.tsx', 'utf8');

  const scrollToLine = "    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });";
  
  if (content.includes(scrollToLine)) {
    // We only want to remove the scrollTo from handleTabClick, but if there's only one, we can just replace it.
    // Also, we need to ensure setVisitedTabs is called. Let's see if setVisitedTabs is in handleTabClick.
    if (!content.includes("setVisitedTabs(prev =>")) {
        // We will just do a regex replace over the whole handleTabClick function body
        // finding the start and end indices.
    }
    
    // Actually let's just do:
    content = content.replace("    // [Fix #2] 모든 탭 전환 시 스크롤 최상단으로 이동\r\n    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });", "");
    content = content.replace("    // [Fix #2] 모든 탭 전환 시 스크롤 최상단으로 이동\n    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });", "");
    
    // Add setVisitedTabs
    const searchStr1 = `    if (tab === 'home' || tab === 'about') {\r\n      setActiveTab(tab);`;
    const searchStr1_n = `    if (tab === 'home' || tab === 'about') {\n      setActiveTab(tab);`;
    
    const replacement1 = `    if (tab === 'home' || tab === 'about') {\n      setActiveTab(tab);\n      setVisitedTabs(prev => { const newSet = new Set(prev); newSet.add(tab); return newSet; });`;
    
    content = content.replace(searchStr1, replacement1);
    content = content.replace(searchStr1_n, replacement1);

    const searchStr2 = `    if (!isFullMember) {\r\n      return;\r\n    }\r\n\r\n    setActiveTab(tab);`;
    const searchStr2_n = `    if (!isFullMember) {\n      return;\n    }\n\n    setActiveTab(tab);`;
    
    const replacement2 = `    if (!isFullMember) {\n      return;\n    }\n\n    setActiveTab(tab);\n    setVisitedTabs(prev => { const newSet = new Set(prev); newSet.add(tab); return newSet; });`;

    content = content.replace(searchStr2, replacement2);
    content = content.replace(searchStr2_n, replacement2);

    fs.writeFileSync('c:/Users/stone/WoC/src/components/groups/GroupHome.tsx', content);
    console.log("Replacement complete.");
  } else {
    console.log("Not found.");
  }
} catch(e) {
  console.error(e);
}
