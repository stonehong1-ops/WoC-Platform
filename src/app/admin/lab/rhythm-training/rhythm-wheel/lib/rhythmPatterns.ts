import { RhythmPattern } from "../types";

export const RHYTHM_PATTERNS: RhythmPattern[] = [
  {
    id: "1",
    label: "1",
    displayLabel: "1",
    beats: [0],
    accents: [0],
    description: "정박(Downbeat)을 짚는 가장 기본적이고 묵직한 탱고 걷기 리듬입니다.",
    footworkHint: "안정적인重心 이동과 정확한 디딤발 타이밍을 훈련합니다.",
    difficulty: "basic"
  },
  {
    id: "1-and",
    label: "1&",
    displayLabel: "1 &",
    beats: [0, 0.5],
    accents: [0],
    description: "한 박자를 반으로 쪼갠 2배속(Double Time) 싱코페이션 기초 리듬입니다.",
    footworkHint: "빠른 전후진 스텝이나 축이동이 없는 하프 오초 등의 훈련에 적합합니다.",
    difficulty: "basic"
  },
  {
    id: "1-and-a",
    label: "1&a",
    displayLabel: "1 & a",
    beats: [0, 0.5, 0.75],
    accents: [0],
    description: "탱고의 대표적인 트라스피에(Traspié) 및 싱코파 리바운드용 핵심 리듬입니다.",
    footworkHint: "밀고 당기는 싱코파 스텝 및 리바운드(Rebound) 풋워크 연습에 권장합니다.",
    difficulty: "intermediate"
  },
  {
    id: "1e-and",
    label: "1e&",
    displayLabel: "1 e &",
    beats: [0, 0.25, 0.5],
    accents: [0],
    description: "앞부분에 빠른 당김음이 들어가는 16분음표 정렬 리듬입니다.",
    footworkHint: "순간적인 디딤발 잽 스텝 및 빠른 발동작(Adorno) 타이밍을 익힙니다.",
    difficulty: "intermediate"
  },
  {
    id: "1e-and-a",
    label: "1e&a",
    displayLabel: "1 e & a",
    beats: [0, 0.25, 0.5, 0.75],
    accents: [0],
    description: "한 비트에 4번의 16분음표 쪼갬을 모두 연주하는 고난도 밀롱가 패턴입니다.",
    footworkHint: "빠르고 촘촘한 코리다(Corrida) 스텝 및 연속 아도르노를 제어합니다.",
    difficulty: "advanced"
  },
  {
    id: "and-a",
    label: "&a",
    displayLabel: "& a",
    beats: [0.5, 0.75],
    accents: [0],
    description: "정박을 비워두고 어박(Off-beat)과 그 다음 세분비트만 짚는 밀당 리듬입니다.",
    footworkHint: "몸의 텐션과 대기 시간을 조절하여 싱코파 타이밍에 진입하는 연습을 합니다.",
    difficulty: "intermediate"
  },
  {
    id: "e-and",
    label: "e&",
    displayLabel: "e &",
    beats: [0.25, 0.5],
    accents: [0],
    description: "정박 뒤에 즉각 나타나는 반박자 사이의 엇박을 공략하는 훈련용 리듬입니다.",
    footworkHint: "엇박(syncopated)에 체중을 싣지 않고 축만 가볍게 돌리는 지로 등에 응용합니다.",
    difficulty: "advanced"
  },
  {
    id: "e-and-a",
    label: "e&a",
    displayLabel: "e & a",
    beats: [0.25, 0.5, 0.75],
    accents: [0],
    description: "첫 정박을 완전히 숨겨 긴장감을 최대로 유지하는 고난도 리듬 패턴입니다.",
    footworkHint: "미세한 프레임 유도와 축 흔들림 없는 완벽한 보디 컨트롤을 단련합니다.",
    difficulty: "advanced"
  },
  {
    id: "1-a",
    label: "1 a",
    displayLabel: "1  a",
    beats: [0, 0.75],
    accents: [0],
    description: "정박 후 반박자를 건너뛰고 마지막 16분음표에만 틱이 발생하는 특이 리듬입니다.",
    footworkHint: "늘어지는 느린 스텝 후 즉각 빠르게 따라붙는 풋워크 훈련에 활용합니다.",
    difficulty: "intermediate"
  },
  {
    id: "1-e",
    label: "1 e",
    displayLabel: "1 e",
    beats: [0, 0.25],
    accents: [0],
    description: "정박과 바로 다음에 붙는 16분음표 엇박만 연주하는 비대칭 리듬입니다.",
    footworkHint: "빠르게 걸친 후 길게 뻗어 멈추는 오초 코르타도(Ocho Cortado) 타이밍에 제격입니다.",
    difficulty: "intermediate"
  },
  {
    id: "1e-a",
    label: "1e a",
    displayLabel: "1 e  a",
    beats: [0, 0.25, 0.75],
    accents: [0],
    description: "가운데 엇비트를 생략하여 앞뒤로 튀는 탄력적인 탱고 리듬입니다.",
    footworkHint: "탄성 있는 리바운드 후 잠시 멈췄다가 다시 걷는 하이 레벨 기량에 적합합니다.",
    difficulty: "advanced"
  },
  {
    id: "1-t-t",
    label: "1 t t",
    displayLabel: "1 t t",
    beats: [0, 0.333, 0.666],
    accents: [0],
    description: "탱고 발스(Vals)에 자주 쓰이는 셋잇단음표(3연음) 기반 리듬입니다.",
    footworkHint: "스윙감 넘치고 부드럽게 흐르는 3박자 탱고 왈츠 풋워크의 질감을 다듬습니다.",
    difficulty: "intermediate"
  }
];
