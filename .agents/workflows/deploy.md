---
description: Build and Deploy WoC to Vercel via GitHub Integration
---
// turbo-all
// Note: This project uses Windows/PowerShell.

1. 로컬 빌드 검증 (Build Check)
배포 전 프로젝트에 빌드 에러가 없는지 확인합니다.
```powershell
npm run build
```

2. 변경 사항 커밋 및 푸시 (Git Push)
GitHub `master` 브랜치로 푸시하여 Vercel 자동 배포를 트리거합니다.
```powershell
git add .
git commit -m "deploy: update contents and features"
git push origin master
```

3. 배포 결과 확인 및 알림
   - Vercel 대시보드 또는 [www.woc.today](https://www.woc.today) 접속하여 정상 반영 확인
   - 배포 완료 시 사용자에게 보고
