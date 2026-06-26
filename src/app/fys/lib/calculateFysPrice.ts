import { FYS_CLASSES } from "../data/classes";
import { FYS_PRICE, FYS_DEADLINES } from "../data/pricing";

export function calculateFysPrice({
  selectedClassIds,
  now,
}: {
  selectedClassIds: string[];
  now: Date;
}) {
  const selectedClasses = FYS_CLASSES.filter((c) => selectedClassIds.includes(c.id));
  const grandMilongas = selectedClasses.filter((c) => c.isGrandMilonga);
  const regularClasses = selectedClasses.filter((c) => !c.isGrandMilonga);

  const milongaSubtotal = grandMilongas.length * FYS_PRICE.grandMilonga;

  const nowTime = now.getTime();
  const superEarlyBirdDeadline = new Date(FYS_DEADLINES.superEarlyBirdUntil).getTime();
  const earlyBirdDeadline = new Date(FYS_DEADLINES.earlyBirdUntil).getTime();

  let classSubtotal = 0;
  let pricingType: "superEarlyBird" | "earlyBird" | "regular" | "dayPack" | "mixed" = "regular";
  const detail: Array<{
    labelKo: string;
    labelEn: string;
    amount: number;
    classIds?: string[];
  }> = [];

  if (nowTime <= superEarlyBirdDeadline) {
    pricingType = "superEarlyBird";
    const amount = regularClasses.length * FYS_PRICE.superEarlyBird;
    classSubtotal = amount;
    if (regularClasses.length > 0) {
      detail.push({
        labelKo: `수퍼 얼리버드 할인가: 32,000원 × ${regularClasses.length}클래스`,
        labelEn: `Super Early Bird: 32,000 KRW × ${regularClasses.length} class(es)`,
        amount: amount,
        classIds: regularClasses.map((c) => c.id),
      });
    }
  } else if (nowTime <= earlyBirdDeadline) {
    pricingType = "earlyBird";
    const amount = regularClasses.length * FYS_PRICE.earlyBird;
    classSubtotal = amount;
    if (regularClasses.length > 0) {
      detail.push({
        labelKo: `얼리버드 할인가: 36,000원 × ${regularClasses.length}클래스`,
        labelEn: `Early Bird: 36,000 KRW × ${regularClasses.length} class(es)`,
        amount: amount,
        classIds: regularClasses.map((c) => c.id),
      });
    }
  } else {
    // 정가 기간 (Day Pack 적용 가능)
    const classesByDate: { [date: string]: typeof regularClasses } = {};
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

          const dateObj = dayClasses[0];
          const dateStr = `${dateObj.date.substring(5).replace("-", "/")} (${dateObj.dayKo})`;
          const dateStrEn = `${dateObj.date.substring(5).replace("-", "/")} (${dateObj.dayEn})`;

          if (dayPackCount > 0) {
            detail.push({
              labelKo: `${dateStr} Day Pack 할인가 적용`,
              labelEn: `${dateStrEn} Day Pack Applied`,
              amount: dayPackAmount,
              classIds: dayClasses.slice(0, dayPackCount * 2).map((c) => c.id),
            });
          }
          if (regularCount > 0) {
            detail.push({
              labelKo: `${dateStr} 일반 요금: 42,000원 × ${regularCount}클래스`,
              labelEn: `${dateStrEn} Regular Price: 42,000 KRW × ${regularCount} class(es)`,
              amount: regularAmount,
              classIds: dayClasses.slice(dayPackCount * 2).map((c) => c.id),
            });
          }
        } else {
          hasRegular = true;
          const amount = dayClasses.length * FYS_PRICE.classRegular;
          classSubtotal += amount;
          const dateObj = dayClasses[0];
          const dateStr = `${dateObj.date.substring(5).replace("-", "/")} (${dateObj.dayKo})`;
          const dateStrEn = `${dateObj.date.substring(5).replace("-", "/")} (${dateObj.dayEn})`;
          detail.push({
            labelKo: `${dateStr} 일반 요금: 42,000원`,
            labelEn: `${dateStrEn} Regular Price: 42,000 KRW`,
            amount: amount,
            classIds: dayClasses.map((c) => c.id),
          });
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
    detail.push({
      labelKo: `그랜드 밀롱가: 28,000원 × ${grandMilongas.length}개`,
      labelEn: `Grand Milonga: 28,000 KRW × ${grandMilongas.length}`,
      amount: milongaSubtotal,
      classIds: grandMilongas.map((c) => c.id),
    });
  }

  const total = classSubtotal + milongaSubtotal;

  return {
    total,
    pricingType,
    classSubtotal,
    milongaSubtotal,
    detail,
  };
}
