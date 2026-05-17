import { feedService } from '../firebase/feedService';
import { findKeywordMatch } from './wocSystemGuide';

/**
 * Help Desk AI Assistant Service
 * 1st: Gemini API (contextual, intelligent responses)
 * 2nd: Local keyword matching (fallback when API unavailable)
 */

const AI_BOT_INFO = {
  userId: 'ai-assistant',
  userName: 'WoC AI Assistant',
  userPhoto: 'https://api.dicebear.com/7.x/bottts/svg?seed=woc-ai',
  isOfficial: true
};

const GENERIC_FALLBACK = {
  KR: `질문을 남겨주셔서 감사합니다! 🤖

저희 팀이 확인 후 곧 답변드리겠습니다. 
더 빠른 도움이 필요하시면 아래 핵심 메뉴를 참고해 주세요:

• **Social**: 밀롱가/프랙티카 확인 및 예약
• **Events**: 페스티벌/마라톤 등 특별 이벤트
• **Groups**: 커뮤니티 그룹 가입 및 관리
• **Live**: 실시간 사진/영상 공유
• **My Page → Wallet**: 결제 및 잔액 관리
• **My Page → My Info**: 프로필 설정`,
  EN: `Thank you for your question! 🤖

Our team will review and respond shortly.
For quick help, check these key sections:

• **Social**: Find and book milongas/prácticas
• **Events**: Festivals, marathons & special events
• **Groups**: Join and manage community groups
• **Live**: Share real-time photos & videos
• **My Page → Wallet**: Payments & balance
• **My Page → My Info**: Profile settings`
};

/**
 * Detect if content is Korean
 */
function isKoreanContent(content: string): boolean {
  return /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(content);
}

/**
 * Try Gemini API first, then fall back to keyword matching
 */
async function generateResponse(content: string): Promise<string> {
  const isKorean = isKoreanContent(content);

  // === 1st: Try Gemini API ===
  try {
    const res = await fetch('/api/helpdesk-ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content,
        language: isKorean ? 'kr' : 'en',
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.response) {
        return `🤖 *AI Assistant*\n\n${data.response}`;
      }
    }
    
    // Log but don't throw — fall through to fallback
    const errorData = await res.json().catch(() => ({}));
    console.warn('[HelpDeskAI] Gemini API unavailable, using fallback:', errorData.error);
  } catch (error) {
    console.warn('[HelpDeskAI] Gemini API call failed, using fallback:', error);
  }

  // === 2nd: Local Keyword Matching Fallback ===
  const match = findKeywordMatch(content);
  if (match) {
    return isKorean ? match.responseKR : match.responseEN;
  }

  // === 3rd: Generic Fallback ===
  return isKorean ? GENERIC_FALLBACK.KR : GENERIC_FALLBACK.EN;
}

export const helpDeskAIService = {
  /**
   * Generates a response based on the post content and adds it as a comment.
   */
  processNewPost: async (postId: string, content: string) => {
    // Simulate thinking delay (feels more natural)
    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
      const response = await generateResponse(content);

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
