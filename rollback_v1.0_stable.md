# 🛡️ WoC v1.0-stable 10초 긴급 롤백 프로토콜 (Emergency Rollback Protocol)

본 문서는 v1.1 대규모 리팩토링 진행 도중 장애 또는 예상치 못한 부작용이 발생할 경우, 실서비스를 10초 이내에 직전 안정화 상태(v1.0)로 원상 복구하기 위한 긴급 절차서입니다.

---

## 📌 백업 및 안정 시점 정보 (Stable Snapshot)
- **백업 일시** : 2026-07-03 17:09
- **직전 안정 버전** : `v2026-07-03-003`
- **안정 Git 해시** : `b11c8cc` (master 브랜치 최종)
- **전용 백업 브랜치** : `backup/v1.0-stable` (GitHub 원격 동기화 완료)
- **Vercel Production Deployment ID** : `dpl_71eRKj1SNi8R5YafWx7S1HXmJKEQ`
- **Vercel Production Snapshot URL** : `https://woc-platform-ma2f2ap6x-stonehong1-8062s-projects.vercel.app`

---

## 🚨 10초 긴급 복구 절차 (Rollback Executions)

비상 장애 발생 시 아래의 명령을 복사하여 즉시 터미널에서 실행해 주십시오.

### 1단계. Vercel 라이브 서버 즉각 롤백 (소요 시간 5초)
빌드 및 배포 대기 없이 기존 빌드 완료본을 즉시 라이브에 동기화합니다.
```bash
npx vercel rollback dpl_71eRKj1SNi8R5YafWx7S1HXmJKEQ --yes
```

### 2단계. Git 소스코드 v1.0 상태 강제 복구 (소요 시간 5초)
로컬 작업 본을 강제 덮어쓰고 안정화 백업 시점으로 마스터를 회귀시킵니다.
```bash
git checkout master
git reset --hard backup/v1.0-stable
git push origin master --force
```

---
※ 리팩토링 단계 중 권한 문제나 기타 이슈 발생 시 이 문서를 즉각 참고하여 복구를 속행합니다.
