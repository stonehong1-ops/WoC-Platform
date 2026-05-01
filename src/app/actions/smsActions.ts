"use server";

import { SolapiMessageService } from 'solapi';

export async function sendSmsViaSolapi(to: string, message: string) {
  try {
    const apiKey = process.env.SOLAPI_API_KEY;
    const apiSecret = process.env.SOLAPI_API_SECRET;
    const senderNumber = process.env.SOLAPI_SENDER_NUMBER;

    if (!apiKey || !apiSecret || !senderNumber) {
      console.warn('Solapi 환경 변수가 설정되지 않았습니다. 문자 발송을 스킵합니다.');
      return { success: false, error: 'Solapi 환경 변수 누락 (env.local 확인 필요)' };
    }

    const messageService = new SolapiMessageService(apiKey, apiSecret);

    // 숫자가 아닌 문자 모두 제거하여 전화번호 형식 통일
    const formattedTo = to.replace(/[^0-9]/g, '');
    const formattedFrom = senderNumber.replace(/[^0-9]/g, '');

    const response = await messageService.send({
      to: formattedTo,
      from: formattedFrom,
      text: message,
      autoTypeDetect: true, // 메시지 길이에 따라 SMS/LMS/MMS 자동 전환
    });

    console.log('Solapi 전송 완료:', response);
    return { success: true, data: response };
  } catch (error: any) {
    console.error('Solapi 전송 실패:', error);
    return { success: false, error: error.message || '문자 발송에 실패했습니다.' };
  }
}
