# Fabric Image Package

- `images/` 폴더: 원단별 개별 이미지 20장
- 모든 이미지는 텍스트/번호/설명/박스 없이 원단 텍스처만 포함
- 권장 배치 경로: `/public/fabrics/`
- `fabrics.seed.ts`: UI/DB seed용 데이터
- `fabrics.csv`: 관리/검수용 표 데이터

Antigravity 지시:
1. collage 이미지에서 자르지 말 것.
2. `/public/fabrics/`에 `images` 안의 PNG 파일 20개를 그대로 복사.
3. 원단명/소재/설명은 이미지에 합성하지 말고 seed 데이터만 참조.
4. 상품/원단 선택 UI는 `imageUrl`을 사용해 이미지를 표시.
