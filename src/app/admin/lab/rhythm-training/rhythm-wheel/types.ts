export type RhythmPattern = {
  id: string;
  label: string;
  displayLabel: string;
  beats: number[]; // 한 박자 내 subdivision 위치 (예: 0, 0.25, 0.5, 0.75)
  accents?: number[]; // 강세를 줄 beats 배열의 인덱스
  description?: string;
  footworkHint?: string;
  difficulty?: "basic" | "intermediate" | "advanced";
};

export type TrainingMode =
  | "Walking"
  | "Side Step"
  | "Ocho"
  | "Giro"
  | "Sacada"
  | "Adorno"
  | "Free Drill";
