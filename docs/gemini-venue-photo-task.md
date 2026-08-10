# WoC 신규 해외 Venue 사진 확보 작업 지시서 (Gemini)

Gemini에게 요청합니다.

## 0. 배경

오늘(2026-08-10) WoC에 중국 6개 도시(Beijing/Shanghai/Guangzhou/Shenzhen/Xiamen/Hangzhou) 및 아르헨티나 부에노스아이레스의 정기 밀롱가 데이터가 신규 Firestore 배치로 임포트되었습니다.

- China: `origin = china_global_20260810`, Venue 22개, Social 23개
- Argentina: `origin = argentina_ba_20260810`, Venue 29개, Social 64개

이 51개 Venue와 그에 속한 87개 Social 문서는 전부 `imageUrl`이 빈 값입니다. Social 자체를 찍은 사진은 거의 존재하지 않으므로, **각 Venue의 Google 지도 등록 장소 사진**을 대신 가져와 채우는 것이 이번 작업의 목표입니다.

## 1. 입력 파일

`docs/venues-needing-photos.json`

이 파일에 정확히 채워야 할 51개 Venue의 `venueId`, `name`, `address`, `city`, `country`, `coordinates`(참고용, China 22개 중 21개는 미검증 추정치이므로 좌표보다 `name`+`address` 텍스트 검색을 우선하십시오), `socialIds`(해당 Venue에서 열리는 Social 문서 ID들)가 이미 정리되어 있습니다. 이 파일을 그대로 입력으로 사용하고, 새로 추정하거나 목록을 바꾸지 마십시오.

## 2. 각 Venue별로 할 일

1. `name` + `address` (+ 있으면 `coordinates`)로 해당 장소를 Google 지도에서 검색해 실제 등록된 업소/장소인지 확인합니다.
2. 찾은 장소의 **공식 등록 사진(장소 소유자 업로드 사진 또는 방문자 대표 사진)** 중 대표 사진 1장을 선택합니다.
   - 순서 우선순위: ① 업소 소유자가 등록한 커버 사진 → ② 조회수/평점이 높은 방문자 사진 → ③ 사진이 아예 없으면 다음 항목으로.
   - 인테리어/외관 사진을 우선하고, 음식 클로즈업이나 사람 얼굴이 크게 나온 사진, 텍스트/로고만 있는 이미지는 피하십시오.
3. 장소를 찾지 못했거나 등록된 사진이 하나도 없으면 **그 항목은 건너뛰고 결과에 `"found": false`로 명시**하십시오. 비슷해 보이는 다른 장소 사진으로 대충 채우거나, AI로 이미지를 생성해서 채우는 것은 절대 금지합니다.
4. 같은 Venue를 공유하는 Social이 여러 개(`socialIds` 배열이 2개 이상)인 경우, 사진은 Venue 기준으로 1번만 찾고 그 결과를 모든 socialIds에 동일하게 적용하면 됩니다.

## 3. 금지 사항

- ❌ AI 이미지 생성 (실제 장소 사진 대체 불가)
- ❌ 다른 도시/다른 상호의 유사 이미지로 대체
- ❌ 스톡 이미지(Unsplash 등)로 채우기 — 이번 51개는 반드시 "그 장소의 실사진"이어야 합니다
- ❌ 사진 URL 추측 생성 — 실제로 Google 지도에서 확인한 사진 URL만 사용
- ❌ `docs/venues-needing-photos.json`에 없는 다른 Venue/Social 건드리기 (기존 이미 이미지가 있는 문서는 대상 아님)

## 4. 출력 형식

`docs/venue-photos-result.json` 파일 하나로 출력하십시오.

```json
{
  "generatedAt": "YYYY-MM-DD",
  "totalVenues": 51,
  "foundCount": 0,
  "notFoundCount": 0,
  "results": [
    {
      "venueId": "<입력 파일의 venueId 그대로>",
      "name": "<venue 이름>",
      "found": true,
      "photoUrl": "<실제 Google 지도 사진 URL 또는 Places Photo 참조로 구성한 URL>",
      "photoSource": "google_maps_owner | google_maps_visitor",
      "mapsListingUrl": "<확인한 Google 지도 장소 URL>",
      "note": ""
    },
    {
      "venueId": "...",
      "name": "...",
      "found": false,
      "photoUrl": "",
      "note": "Google 지도에서 해당 업소를 찾지 못함 / 등록된 사진 없음 (사유를 구체적으로)"
    }
  ]
}
```

## 5. 완료 후

결과 파일만 만들어 두면 됩니다. Firestore에 실제로 반영(각 Venue와 Social 문서의 `imageUrl` 갱신)하는 작업은 별도로 처리합니다. Gemini는 Firestore 쓰기 작업을 하지 마십시오.
