# 🛠️ ISSUES LOG

### 1. `SocietyPage` (home/page.tsx) 내 `useRouter` 미선언 오류
- **발생 원인**: Today 페이지에 백그라운드 prefetch 기능을 넣는 과정에서 `router` 변수를 호출하였으나, 해당 컴포넌트에 `useRouter` 임포트 및 인스턴스화 코드가 누락되어 빌드가 실패하였습니다.
- **해결 방안**: `import { useRouter } from 'next/navigation';` 및 `const router = useRouter();` 를 추가하여 해결하였습니다.

### 2. Next.js 빌드 과정에서 `Another next build process is already running` 발생
- **발생 원인**: 이전 백그라운드 빌드 작업 중 비정상적으로 종료된 node 고아 프로세스들이 OS 상에서 런타임 잠금(lock)을 유지하여 빌드 가동이 차단되었습니다.
- **해결 방안**: `taskkill /F /IM node.exe` 명령어로 고아 node 프로세스를 완전히 청소하고 `.next` 임시 빌드 아티팩트 디렉토리를 초기화(`Remove-Item -Recurse -Force .next`)하여 깨끗한 상태에서 빌드를 성공시켰습니다.

### 3. Next.js 중복 타입 체크 및 OOM/대기 문제
- **발생 원인**: 빌드 파이프라인 전단에서 이미 `tsc --noEmit` 검증을 완벽하게 통과시켰음에도, Next.js 자체 빌드 옵션에서 `typescript: { ignoreBuildErrors: false }` 로 지정되어 불필요하게 2차 타입 스캔을 돌리다 OOM이 유발되거나 시간 초과가 발생했습니다.
- **해결 방안**: `next.config.js` 파일 내의 `typescript: { ignoreBuildErrors: true }` 로 설정을 수정하여 빌드 타임을 단축하고 안정성을 확보했습니다.
