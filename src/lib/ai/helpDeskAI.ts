import { feedService } from '../firebase/feedService';

/**
 * Help Desk AI Assistant Service
 * Provides automated responses to questions in the Help Desk.
 */

const AI_BOT_INFO = {
  userId: 'ai-assistant',
  userName: 'WoC AI Assistant',
  userPhoto: 'https://api.dicebear.com/7.x/bottts/svg?seed=woc-ai',
  isOfficial: true
};

const SYSTEM_GUIDES = {
  KR: `
반갑습니다! World of Community(WoC) AI 어시스턴트입니다. 🤖
도움이 필요하신 내용을 키워드로 말씀해 주시면 더 정확한 안내가 가능합니다.

[WoC 주요 기능 안내]
• Plaza: 일상을 공유하고 글로벌 커뮤니티와 소통하는 공간입니다.
• Social: 밀롱가, 클래스, 페스티벌 정보를 확인하고 예약할 수 있습니다.
• Groups: 관심사 기반의 소모임에 참여하거나 직접 개설할 수 있습니다.
• Shop: 필요한 상품을 구매하거나 중고 장터(Resale)를 이용하세요.
• Rental: 베뉴 대관 및 의상/장비 렌탈 서비스를 제공합니다.
• Wallet: 마이페이지에서 예약 내역과 월렛 잔액을 관리할 수 있습니다.

추가적인 기술 지원이 필요하시면 상세 내용을 남겨주세요. 저희 팀이 곧 확인하겠습니다!
`,
  EN: `
Welcome! I am the World of Community (WoC) AI Assistant. 🤖
Tell me what you need help with, and I'll guide you through our platform.

[Key Features]
• Plaza: Share your life and interact with the global community.
• Social: Discover and book Milongas, Classes, and Festivals.
• Groups: Join or create communities based on your interests.
• Shop: Buy new products or use our Resale marketplace.
• Rental: Venue booking and costume/equipment rental services.
• Wallet: Manage your bookings and wallet balance in My Page.

If you have technical issues, please describe them clearly so our support team can assist you better!
`
};

export const helpDeskAIService = {
  /**
   * Generates a response based on the post content and adds it as a comment.
   */
  processNewPost: async (postId: string, content: string) => {
    // Simulate thinking delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    let response = "";
    const lowerContent = content.toLowerCase();
    
    // Check if it's mostly Korean or English
    const isKorean = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(content);
    const guide = isKorean ? SYSTEM_GUIDES.KR : SYSTEM_GUIDES.EN;

    if (lowerContent.includes('hello') || lowerContent.includes('hi') || lowerContent.includes('안녕') || lowerContent.includes('반갑')) {
      response = isKorean 
        ? `안녕하세요! WoC에 오신 것을 환영합니다. 무엇을 도와드릴까요? \n${guide}`
        : `Hello! Welcome to WoC. How can I help you today? \n${guide}`;
    } else if (lowerContent.includes('milonga') || lowerContent.includes('밀롱가') || lowerContent.includes('class') || lowerContent.includes('클래스') || lowerContent.includes('수업')) {
      response = isKorean
        ? `이벤트 예약에 대해 궁금하시군요! [Social] 탭에서 전 세계의 밀롱가와 클래스를 확인하고 예약하실 수 있습니다.`
        : `Looking for events? Check out the [Social] tab to find and book Milongas and Classes around the world.`;
      response += `\n${guide}`;
    } else if (lowerContent.includes('payment') || lowerContent.includes('결제') || lowerContent.includes('wallet') || lowerContent.includes('월렛') || lowerContent.includes('money') || lowerContent.includes('입금')) {
      response = isKorean
        ? `결제 및 월렛 관련 문의는 [My Page > Wallet] 메뉴를 확인해주세요. 충전 및 내역 확인이 가능합니다.`
        : `For payment and wallet inquiries, please check [My Page > Wallet]. You can manage your balance and history there.`;
      response += `\n${guide}`;
    } else if (lowerContent.includes('error') || lowerContent.includes('bug') || lowerContent.includes('오류') || lowerContent.includes('안돼') || lowerContent.includes('고장')) {
      response = isKorean
        ? `불편을 드려 죄송합니다. 😭 오류 증상을 상세히(스크린샷 등) 남겨주시면 개발팀에서 즉시 확인하겠습니다. 페이지를 새로고침 해보시는 것도 추천드려요.`
        : `I'm sorry for the inconvenience. 😭 Please describe the error in detail (or share a screenshot) and our tech team will look into it immediately. Try refreshing the page as well.`;
    } else if (lowerContent.includes('how to') || lowerContent.includes('어떻게') || lowerContent.includes('방법') || lowerContent.includes('가이드')) {
      response = isKorean
        ? `시스템 사용법이 궁금하시군요! 아래 가이드를 참고해 주시고, 더 구체적인 내용은 댓글로 질문해 주세요. \n${guide}`
        : `Need a hand with the system? Check the guide below, or ask a specific question in the comments! \n${guide}`;
    } else {
      response = isKorean
        ? `질문을 남겨주셔서 감사합니다! 제가 파악하지 못한 내용은 곧 담당자나 커뮤니티 멤버가 답변 드릴 예정입니다. \n${guide}`
        : `Thank you for your question! I've recorded it, and our team or community members will respond shortly. \n${guide}`;
    }

    try {
      await feedService.addComment(postId, {
        userId: AI_BOT_INFO.userId,
        userName: AI_BOT_INFO.userName,
        userPhoto: AI_BOT_INFO.userPhoto,
        content: response,
        isOfficial: true,
        parentId: null,
        repliesCount: 0
      });
    } catch (error) {
      console.error("[HelpDeskAI] Failed to post automated response:", error);
    }
  }
};
