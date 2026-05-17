import fs from 'fs';

const p = 'c:/Users/stone/WoC/src/contexts/LanguageContext.tsx';
let c = fs.readFileSync(p, 'utf-8');

const enKeys = `
    // Auth Modal
    'auth.title_register': 'Complete Registration',
    'auth.title_signin': 'Sign In / Register',
    'auth.wait_message': 'Wait 3 seconds...',
    'auth.headline_more': 'Tell us more',
    'auth.headline_verify': 'Verify Identity',
    'auth.headline_join': 'Join WoC',
    'auth.desc_more': 'Identity verified! Just a few more details to set up your profile.',
    'auth.desc_input': 'Enter your phone number to receive a verification code.',
    'auth.desc_verify': 'Enter the 6-digit code sent to your phone.',
    'auth.desc_join': 'Create your global identity and start your journey.',
    'auth.continue_phone': 'Continue with Phone',
    'auth.other_methods': 'Other Methods',
    'auth.phone_label': 'Phone Number',
    'auth.send_code': 'Send Verification Code',
    'auth.back': 'Back',
    'auth.code_label': 'Verification Code',
    'auth.code_instruction': 'Select the 6-digit number on the message keypad, or check the text sent by Google.',
    'auth.verify_code': 'Verify Code',
    'auth.country': 'Country',
    'auth.select_country': 'Select your country',
    'auth.country_kr': 'South Korea',
    'auth.country_us': 'United States',
    'auth.country_gb': 'United Kingdom',
    'auth.country_fr': 'France',
    'auth.country_jp': 'Japan',
    'auth.country_cn': 'China',
    'auth.country_de': 'Germany',
    'auth.country_ca': 'Canada',
    'auth.country_au': 'Australia',
    'auth.country_sg': 'Singapore',
    'auth.english_nickname': 'English Nickname',
    'auth.placeholder_en_nick': 'e.g. John Doe',
    'auth.gender': 'Gender',
    'auth.gender_male': 'Male',
    'auth.gender_female': 'Female',
    'auth.gender_other': 'Other',
    'auth.native_nickname': 'Native Nickname',
    'auth.placeholder_ko_nick': 'e.g. 홍길동',
    'auth.complete_reg_btn': 'Complete Registration',
    'auth.terms_agree': 'By continuing, you agree to our ',
    'auth.terms': 'Terms',
    'auth.and': ' and ',
    'auth.privacy': 'Privacy',
    'auth.period': '.',
`;

const krKeys = `
    // Auth Modal
    'auth.title_register': '가입 완료',
    'auth.title_signin': '로그인 / 회원가입',
    'auth.wait_message': '3초만 기다려주세요...',
    'auth.headline_more': '추가 정보 입력',
    'auth.headline_verify': '본인 인증',
    'auth.headline_join': 'WoC 가입하기',
    'auth.desc_more': '인증이 완료되었습니다! 프로필 설정을 위해 추가 정보를 입력해주세요.',
    'auth.desc_input': '인증 코드를 받을 전화번호를 입력하세요.',
    'auth.desc_verify': '휴대폰으로 전송된 6자리 코드를 입력하세요.',
    'auth.desc_join': '글로벌 아이덴티티를 만들고 여정을 시작하세요.',
    'auth.continue_phone': '전화번호로 계속하기',
    'auth.other_methods': '다른 방법',
    'auth.phone_label': '전화번호',
    'auth.send_code': '인증 코드 보내기',
    'auth.back': '뒤로',
    'auth.code_label': '인증 코드',
    'auth.code_instruction': '키패드 위에 6자리 숫자를 선택하세요. 혹은 구글에서 발송한 문자를 확인하세요.',
    'auth.verify_code': '코드 확인',
    'auth.country': '국가',
    'auth.select_country': '국가를 선택하세요',
    'auth.country_kr': '대한민국 (South Korea)',
    'auth.country_us': '미국 (United States)',
    'auth.country_gb': '영국 (United Kingdom)',
    'auth.country_fr': '프랑스 (France)',
    'auth.country_jp': '일본 (Japan)',
    'auth.country_cn': '중국 (China)',
    'auth.country_de': '독일 (Germany)',
    'auth.country_ca': '캐나다 (Canada)',
    'auth.country_au': '호주 (Australia)',
    'auth.country_sg': '싱가포르 (Singapore)',
    'auth.english_nickname': '영어 닉네임',
    'auth.placeholder_en_nick': '예: John Doe',
    'auth.gender': '성별',
    'auth.gender_male': '남성 (Male)',
    'auth.gender_female': '여성 (Female)',
    'auth.gender_other': '기타 (Other)',
    'auth.native_nickname': '한글 닉네임',
    'auth.placeholder_ko_nick': '예: 홍길동',
    'auth.complete_reg_btn': '가입 완료',
    'auth.terms_agree': '계속 진행하면 당사의 ',
    'auth.terms': '이용약관',
    'auth.and': ' 및 ',
    'auth.privacy': '개인정보처리방침',
    'auth.period': '에 동의하는 것으로 간주됩니다.',
`;

// Default to KR
c = c.replace(/useState<Language>\('EN'\);/g, "useState<Language>('KR');");

// The auto-detect code:
const detectCode = `
    const saved = localStorage.getItem('woc_language') as Language;
    if (saved) {
      setLangState(saved);
    } else {
      // Default to user's browser language if Korean
      const browserLang = navigator.language;
      if (browserLang.toLowerCase().includes('ko')) {
        setLangState('KR');
      }
    }
`;

const newDetectCode = `
    const saved = localStorage.getItem('woc_language') as Language;
    if (saved) {
      setLangState(saved);
    }
`;

c = c.replace(detectCode, newDetectCode);

// Add to EN
c = c.replace(/    'search\.members': 'members',/, "    'search.members': 'members',\n" + enKeys);

// Add to KR
c = c.replace(/    'search\.members': '멤버',/, "    'search.members': '멤버',\n" + krKeys);

fs.writeFileSync(p, c);
console.log("Done");
