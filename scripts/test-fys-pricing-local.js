// FYS 가격 계산 자바스크립트 테스트 코드
// FYS_CLASSES, FYS_PRICE, FYS_DEADLINES 정의
const FYS_PRICE = {
  classRegular: 42000,
  dayPack: 78000,
  grandMilonga: 28000,
  superEarlyBird: 32000,
  earlyBird: 36000,
};

const FYS_DEADLINES = {
  superEarlyBirdUntil: "2026-07-15T23:59:59+09:00",
  earlyBirdUntil: "2026-07-31T23:59:59+09:00",
  refundUntil: "2026-07-31T23:59:59+09:00",
};

const FYS_CLASSES = [
  { id: "0901-1", date: "2026-09-01", isGrandMilonga: false },
  { id: "0901-2", date: "2026-09-01", isGrandMilonga: false },
  { id: "0902-1", date: "2026-09-02", isGrandMilonga: false },
  { id: "0902-2", date: "2026-09-02", isGrandMilonga: false },
  { id: "0905-grand", date: "2026-09-05", isGrandMilonga: true },
];

function calculateFysPrice({ selectedClassIds, now }) {
  const selectedClasses = FYS_CLASSES.filter((c) => selectedClassIds.includes(c.id));
  const grandMilongas = selectedClasses.filter((c) => c.isGrandMilonga);
  const regularClasses = selectedClasses.filter((c) => !c.isGrandMilonga);

  const milongaSubtotal = grandMilongas.length * FYS_PRICE.grandMilonga;

  const nowTime = now.getTime();
  const superEarlyBirdDeadline = new Date(FYS_DEADLINES.superEarlyBirdUntil).getTime();
  const earlyBirdDeadline = new Date(FYS_DEADLINES.earlyBirdUntil).getTime();

  let classSubtotal = 0;
  let pricingType = "regular";
  const detail = [];

  if (nowTime <= superEarlyBirdDeadline) {
    pricingType = "superEarlyBird";
    const amount = regularClasses.length * FYS_PRICE.superEarlyBird;
    classSubtotal = amount;
    if (regularClasses.length > 0) {
      detail.push({ amount });
    }
  } else if (nowTime <= earlyBirdDeadline) {
    pricingType = "earlyBird";
    const amount = regularClasses.length * FYS_PRICE.earlyBird;
    classSubtotal = amount;
    if (regularClasses.length > 0) {
      detail.push({ amount });
    }
  } else {
    const classesByDate = {};
    regularClasses.forEach((c) => {
      if (!classesByDate[c.date]) {
        classesByDate[c.date] = [];
      }
      classesByDate[c.date].push(c);
    });

    let hasDayPack = false;
    let hasRegular = false;

    Object.keys(classesByDate)
      .sort()
      .forEach((date) => {
        const dayClasses = classesByDate[date];
        if (dayClasses.length >= 2) {
          hasDayPack = true;
          const dayPackCount = Math.floor(dayClasses.length / 2);
          const regularCount = dayClasses.length % 2;
          const dayPackAmount = dayPackCount * FYS_PRICE.dayPack;
          const regularAmount = regularCount * FYS_PRICE.classRegular;
          const sub = dayPackAmount + regularAmount;
          classSubtotal += sub;
          if (regularCount > 0) {
            hasRegular = true;
          }
          if (dayPackCount > 0) detail.push({ amount: dayPackAmount });
          if (regularCount > 0) detail.push({ amount: regularAmount });
        } else {
          hasRegular = true;
          const amount = dayClasses.length * FYS_PRICE.classRegular;
          classSubtotal += amount;
          detail.push({ amount });
        }
      });

    if (hasDayPack && hasRegular) {
      pricingType = "mixed";
    } else if (hasDayPack) {
      pricingType = "dayPack";
    } else {
      pricingType = "regular";
    }
  }

  if (grandMilongas.length > 0) {
    detail.push({ amount: milongaSubtotal });
  }

  const total = classSubtotal + milongaSubtotal;

  return {
    total,
    pricingType,
    classSubtotal,
    milongaSubtotal,
  };
}

// Test cases
function runTests() {
  // Test 1: 7/10 신청 (Super Early Bird) - 2클래스 선택 -> 32,000 * 2 = 64,000원
  const res1 = calculateFysPrice({
    selectedClassIds: ["0901-1", "0901-2"],
    now: new Date("2026-07-10T12:00:00+09:00"),
  });
  console.assert(res1.total === 64000, `Test 1 Failed: expected 64000, got ${res1.total}`);
  console.assert(res1.pricingType === "superEarlyBird", `Test 1 PricingType Failed: ${res1.pricingType}`);

  // Test 2: 7/20 신청 (Early Bird) - 2클래스 선택 -> 36,000 * 2 = 72,000원
  const res2 = calculateFysPrice({
    selectedClassIds: ["0901-1", "0901-2"],
    now: new Date("2026-07-20T12:00:00+09:00"),
  });
  console.assert(res2.total === 72000, `Test 2 Failed: expected 72000, got ${res2.total}`);
  console.assert(res2.pricingType === "earlyBird", `Test 2 PricingType Failed: ${res2.pricingType}`);

  // Test 3: 8/10 신청 (Regular) - 같은 날 2클래스 선택 -> Day Pack 적용 78,000원
  const res3 = calculateFysPrice({
    selectedClassIds: ["0901-1", "0901-2"],
    now: new Date("2026-08-10T12:00:00+09:00"),
  });
  console.assert(res3.total === 78000, `Test 3 Failed: expected 78000, got ${res3.total}`);
  console.assert(res3.pricingType === "dayPack", `Test 3 PricingType Failed: ${res3.pricingType}`);

  // Test 4: 8/10 신청 (Regular) - 다른 날 2클래스 선택 -> 42,000 * 2 = 84,000원
  const res4 = calculateFysPrice({
    selectedClassIds: ["0901-1", "0902-1"],
    now: new Date("2026-08-10T12:00:00+09:00"),
  });
  console.assert(res4.total === 84000, `Test 4 Failed: expected 84000, got ${res4.total}`);
  console.assert(res4.pricingType === "regular", `Test 4 PricingType Failed: ${res4.pricingType}`);

  // Test 5: Grand Milonga 단독 선택 -> 항상 28,000원
  const res5 = calculateFysPrice({
    selectedClassIds: ["0905-grand"],
    now: new Date("2026-08-10T12:00:00+09:00"),
  });
  console.assert(res5.total === 28000, `Test 5 Failed: expected 28000, got ${res5.total}`);

  // Test 6: 8/10 신청 - 같은 날 2클래스 + Grand Milonga -> 78,000 + 28,000 = 106,000원
  const res6 = calculateFysPrice({
    selectedClassIds: ["0901-1", "0901-2", "0905-grand"],
    now: new Date("2026-08-10T12:00:00+09:00"),
  });
  console.assert(res6.total === 106000, `Test 6 Failed: expected 106000, got ${res6.total}`);

  console.log("All pricing tests passed successfully!");
}

runTests();
