import React from "react";

export default function FysNotice() {
  return (
    <div className="bg-yellow-50/70 border-y border-yellow-100 p-4 text-[13px] space-y-4 text-gray-700">
      <div className="space-y-1.5">
        <p className="font-bold text-amber-800 text-sm">💡 중요 안내 (KO)</p>
        <p className="leading-relaxed">
          • 시스템이 신청 내용과 신청 시점을 기준으로 수퍼얼리버드, 얼리버드, Day Pack, 정가를 자동 판단하여 입금액을 계산합니다.<br />
          • 날짜가 지난 후에는 할인 조건으로 변경될 수 없습니다.<br />
          • 7월 31일까지 취소 및 환불 가능합니다. 이후에는 동일한 역할/성별 신청자로 교체만 가능합니다.<br />
          • 남·녀 15명을 기준으로 인원수 조정을 위해 취소 요청이 있을 수 있습니다.
        </p>
      </div>
      <div className="space-y-1.5 border-t border-yellow-100/60 pt-3.5">
        <p className="font-bold text-amber-800 text-sm">💡 Important Notice (EN)</p>
        <p className="leading-relaxed">
          • The system automatically calculates the payment amount based on your selected program and registration date, including Super Early Bird, Early Bird, Day Pack, and regular pricing.<br />
          • Discount conditions cannot be changed after the deadline has passed.<br />
          • Cancellation and refund are available until July 31. After that date, only replacement with the same role/gender is allowed.<br />
          • Registration may be adjusted or canceled to balance the target number of 15 leaders and 15 followers.
        </p>
      </div>
    </div>
  );
}
