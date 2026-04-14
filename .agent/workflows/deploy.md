---
description: Build and Deploy to Production with Notification
---

// turbo-all
1. 로컬 빌드 검증을 수행합니다.
   `powershell -ExecutionPolicy Bypass -Command "npm run build"`

2. 변경 사항을 스테이징하고 커밋 후 푸시합니다.
   `git add .; git commit -m "chore: automated deployment and polish"; git push origin master`
