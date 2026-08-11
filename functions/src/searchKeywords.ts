/**
 * 검색 keyword 생성 규칙 — **단일 출처(canonical)**.
 *
 * searchIndex 는 `keywords array-contains` 로 조회한다. 원래 사람 검색은
 * `nickname.includes(kw)` 부분일치였기 때문에, 같은 결과를 내려면 이름의 모든
 * 부분문자열을 미리 펼쳐 두어야 한다. (앞글자 prefix 만으로는 "세바" 안의 "바",
 * "Mickey Choi" 안의 "key" 같은 검색이 깨진다.)
 *
 * ⚠️ 이 파일이 유일한 규칙 정의다.
 * 마이그레이션 스크립트와 런타임 트리거가 서로 다른 규칙을 쓰면 재색인 시점마다
 * 검색 결과가 달라지므로, 스크립트도 반드시 `functions/lib/searchKeywords.js` 를
 * import 해서 이 함수를 쓴다. 규칙을 바꾸면 전체 재색인이 필요하다.
 */

/** 이 길이까지만 부분문자열을 생성한다. 지나치게 긴 이름에서 조합이 폭발하는 것을 막는다. */
export const MAX_SOURCE_LENGTH = 24;

/** 생성할 부분문자열의 최대 길이. */
export const MAX_SUBSTRING_LENGTH = 12;

/**
 * 주어진 이름들에서 소문자 부분문자열 집합을 만든다.
 * 한글·영문 모두 코드 유닛 단위로 잘라내므로 두 언어가 동일하게 동작한다.
 */
export function buildSearchKeywords(...sources: (string | undefined | null)[]): string[] {
  const set = new Set<string>();

  for (const raw of sources) {
    if (!raw || typeof raw !== "string") continue;
    const normalized = raw.toLowerCase().trim();
    if (!normalized) continue;

    const base = normalized.slice(0, MAX_SOURCE_LENGTH);
    for (let start = 0; start < base.length; start++) {
      for (let len = 1; len <= MAX_SUBSTRING_LENGTH && start + len <= base.length; len++) {
        const sub = base.slice(start, start + len);
        if (sub.trim()) set.add(sub);
      }
    }
  }

  return [...set];
}
