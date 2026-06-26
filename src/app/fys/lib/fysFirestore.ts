import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  doc,
  updateDoc,
  deleteDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase/clientApp";
import {
  FysApplicantInput,
  FysRegistration,
  FysPaymentStatus,
} from "../types";
import { normalizeLookupValue } from "./normalizeLookupValue";
import { calculateFysPrice } from "./calculateFysPrice";

const COLLECTION_NAME = "fysRegistrations";

export async function submitFysRegistration(
  input: FysApplicantInput,
  selectedClassIds: string[]
): Promise<string> {
  const now = new Date();
  const pricing = calculateFysPrice({ selectedClassIds, now });

  const nicknameNormalized = normalizeLookupValue(input.nickname);
  const depositorNameNormalized = normalizeLookupValue(input.depositorName);

  const docData = {
    nickname: input.nickname.trim(),
    nicknameNormalized,
    depositorName: input.depositorName.trim(),
    depositorNameNormalized,
    depositDate: input.depositDate,
    role: input.role,
    phone: input.phone?.trim() || "",
    memo: input.memo?.trim() || "",
    selectedClassIds,
    calculatedAmount: pricing.total,
    pricingSnapshot: {
      submittedAt: Timestamp.fromDate(now),
      pricingType: pricing.pricingType,
      classSubtotal: pricing.classSubtotal,
      milongaSubtotal: pricing.milongaSubtotal,
      total: pricing.total,
      detail: pricing.detail,
    },
    paymentStatus: "pending" as FysPaymentStatus,
    adminPaymentMemo: "",
    adminInternalMemo: "",
    createdAt: Timestamp.fromDate(now),
    updatedAt: Timestamp.fromDate(now),
  };

  const docRef = await addDoc(collection(db, COLLECTION_NAME), docData);
  return docRef.id;
}

export async function getFysRegistrationsByNickname(
  nickname: string
): Promise<FysRegistration[]> {
  const nicknameNormalized = normalizeLookupValue(nickname);
  const q = query(
    collection(db, COLLECTION_NAME),
    where("nicknameNormalized", "==", nicknameNormalized),
    orderBy("createdAt", "desc")
  );

  const querySnapshot = await getDocs(q);
  const results: FysRegistration[] = [];
  querySnapshot.forEach((d) => {
    results.push({
      id: d.id,
      ...d.data(),
    } as FysRegistration);
  });
  return results;
}

export async function getAllFysRegistrations(): Promise<FysRegistration[]> {
  const q = query(
    collection(db, COLLECTION_NAME),
    orderBy("createdAt", "desc")
  );

  const querySnapshot = await getDocs(q);
  const results: FysRegistration[] = [];
  querySnapshot.forEach((d) => {
    results.push({
      id: d.id,
      ...d.data(),
    } as FysRegistration);
  });
  return results;
}

export async function updateFysRegistrationStatus(
  id: string,
  updates: Partial<FysRegistration>
): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, id);
  const dataToUpdate: any = {
    ...updates,
    updatedAt: Timestamp.fromDate(new Date()),
  };
  
  // id, createdAt 등 변경 불가 필드 제거
  delete dataToUpdate.id;
  delete dataToUpdate.createdAt;

  await updateDoc(docRef, dataToUpdate);
}

export async function deleteFysRegistration(id: string): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, id);
  await deleteDoc(docRef);
}

