---
description: Build and Deploy to Production with Notification
---

// turbo-all
1. 로컬 빌드 검증을 수행합니다.
   `powershell -ExecutionPolicy Bypass -Command "npm run build"`

2. 변경 사항을 스테이징하고 커밋 후 푸시합니다.
   `git add .; git commit -m "chore: automated deployment and polish"; git push origin master`

3. 작업 완료를 알리는 비프음(Beep)을 발생시킵니다.
   `powershell -Command "[System.Console]::Beep(440, 500)"`
