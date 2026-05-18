# Context Notes - 그룹 더보기 메뉴 드롭다운 상태 관리 개선

## 결정 사항 및 배경
1. **문제 현상**
   - 그룹 '더보기' 메뉴에서 특정 탭 클릭 시, 페이지는 정상적으로 전환되나 열려 있는 드롭다운 메뉴가 닫히지 않고 계속 떠 있는 현상이 존재했음.
2. **해결 접근법**
   - `GroupShellMore.tsx`에서 개별 아이템 클릭 시 하위 `onClose()`를 처리하는 구조였으나, 상위 `GroupHome`의 리렌더링 주기와 상태 전이가 충돌하여 드롭다운 상태 업데이트가 무시되는 한계가 있었음.
   - 따라서 상위 셸 컴포넌트인 `GroupAppShell.tsx`의 탭 전환 핸들러(`handleMoreTabClick`)에서 탭 이동(`onTabClick`)과 드롭다운 닫기(`setIsMoreOpen(false)`)를 하나의 배치(batch)로 동시 처리하도록 개선하여 안정성을 확보함.
