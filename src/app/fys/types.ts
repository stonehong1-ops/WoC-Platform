import { Timestamp } from "firebase/firestore";

export type FysRole = "leader" | "follower";

export type FysCategory =
  | "Milonga"
  | "Vals"
  | "Tango"
  | "Special"
  | "GrandMilonga";

export type FysClass = {
  id: string;
  date: string; // YYYY-MM-DD
  dayKo: string;
  dayEn: string;
  start: string;
  end: string;
  category: FysCategory;
  titleKo: string;
  titleEn: string;
  partnerOnly?: boolean;
  isGrandMilonga?: boolean;
};

export type FysPaymentStatus =
  | "pending"
  | "confirmed"
  | "cancelRequested"
  | "refunded"
  | "replaced";

export type FysRegistration = {
  id: string;

  nickname: string;
  nicknameNormalized: string;

  depositorName: string;
  depositorNameNormalized: string;

  depositDate: string;
  role: FysRole;
  phone?: string;
  memo?: string;

  selectedClassIds: string[];

  calculatedAmount: number;

  pricingSnapshot: {
    submittedAt: Timestamp;
    pricingType: "superEarlyBird" | "earlyBird" | "regular" | "dayPack" | "mixed";
    classSubtotal: number;
    milongaSubtotal: number;
    total: number;
    detail: Array<{
      labelKo: string;
      labelEn: string;
      amount: number;
      classIds?: string[];
    }>;
  };

  paymentStatus: FysPaymentStatus;

  adminPaymentMemo?: string;
  adminInternalMemo?: string;

  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type FysApplicantInput = {
  nickname: string;
  depositorName: string;
  depositDate: string;
  role: FysRole;
  phone?: string;
  memo?: string;
};
