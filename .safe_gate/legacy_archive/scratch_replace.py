import re

with open('c:/Users/stone/WoC/src/components/groups/GroupHome.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace activeTab state with visitedTabs
content = content.replace(
    "const [activeTab, setActiveTab] = useState<TabType>('home');",
    "const [activeTab, setActiveTab] = useState<TabType>('home');\n  const [visitedTabs, setVisitedTabs] = useState<Set<TabType>>(new Set(['home']));"
)

# Replace in useEffect
content = content.replace(
    "setActiveTab(tabParam as TabType);",
    "setActiveTab(tabParam as TabType);\n          setVisitedTabs(prev => { const newSet = new Set(prev); newSet.add(tabParam as TabType); return newSet; });"
)

# Replace in handleTabClick (remove window.scrollTo and add visitedTabs)
old_handle = """  const handleTabClick = (tab: TabType) => {
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
  };"""

new_handle = """  const handleTabClick = (tab: TabType) => {
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
  };"""

if old_handle in content:
    content = content.replace(old_handle, new_handle)
else:
    print("WARNING: handleTabClick not found or already modified!")

def modify_tab_blocks(text):
    import re
    # matches e.g. `{activeTab === 'home' && (` or `{activeTab === 'members' && isFullMember && (`
    pattern = re.compile(r"\{activeTab === '([^']+)'(?: && isFullMember)?(?: && isAdminUser)? && \(")
    
    pos = 0
    while True:
        match = pattern.search(text, pos)
        if not match:
            break
            
        tab_name = match.group(1)
        start_idx = match.start()
        end_idx = match.end()
        
        prefix = match.group(0)
        
        if "isFullMember" in prefix:
            new_prefix = f"{{visitedTabs.has('{tab_name}') && isFullMember && (<div style={{{{ display: activeTab === '{tab_name}' ? 'block' : 'none' }}}}>\n"
        elif "isAdminUser" in prefix:
            new_prefix = f"{{visitedTabs.has('{tab_name}') && isAdminUser && (<div style={{{{ display: activeTab === '{tab_name}' ? 'block' : 'none' }}}}>\n"
        else:
            new_prefix = f"{{visitedTabs.has('{tab_name}') && (<div style={{{{ display: activeTab === '{tab_name}' ? 'block' : 'none' }}}}>\n"
        
        paren_count = 1
        curr = end_idx
        while curr < len(text) and paren_count > 0:
            if text[curr] == '(':
                paren_count += 1
            elif text[curr] == ')':
                paren_count -= 1
            curr += 1
            
        insert_pos = curr - 1
        
        text = text[:insert_pos] + "\n              </div>" + text[insert_pos:]
        text = text[:start_idx] + new_prefix + text[end_idx:]
        
        pos = start_idx + len(new_prefix)

    return text

content = modify_tab_blocks(content)

with open('c:/Users/stone/WoC/src/components/groups/GroupHome.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Replacement complete.")
