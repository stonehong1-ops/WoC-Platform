const fs = require('fs');

const FILE_PATH = 'src/contexts/LanguageContext.tsx';
let content = fs.readFileSync(FILE_PATH, 'utf-8');

const enKeys = {
  'group.account.error': 'Failed to save account info.',
  'group.account.title': 'Account Settings',
  'group.account.subtitle': 'MANAGE BANK ACCOUNT',
  'group.account.saving': 'Saving...',
  'group.account.save': 'Save Changes',
  'group.account.identity.title': 'Group Bank Account',
  'group.account.identity.desc': 'Enter the bank account details for group payments, refunds, and settlements.',
  'group.account.details.title': 'Account Details',
  'group.account.bank_name.label': 'Bank Name',
  'group.account.bank_name.placeholder': 'Select a bank',
  'group.account.bank_name.major': 'Major Banks',
  'group.account.bank_name.regional': 'Regional Banks',
  'group.account.bank_name.foreign': 'Foreign Banks',
  'group.account.bank_name.special': 'Special Banks',
  'group.account.account_number.label': 'Account Number',
  'group.account.account_number.placeholder': 'Enter without hyphens',
  'group.account.account_holder.label': 'Account Holder Name',
  'group.account.account_holder.placeholder': 'Enter exactly as registered',
  'group.account.notice': 'The account holder name must match the name of the group owner or a registered representative. Incorrect information may result in delayed settlements.',

  'bank.kb': 'KB Kookmin',
  'bank.shinhan': 'Shinhan',
  'bank.hana': 'Hana',
  'bank.woori': 'Woori',
  'bank.nh': 'NH Nonghyup',
  'bank.ibk': 'IBK',
  'bank.kakao': 'Kakao Bank',
  'bank.toss': 'Toss Bank',
  'bank.kbank': 'K Bank',
  'bank.im': 'iM Bank',
  'bank.busan': 'Busan',
  'bank.kyongnam': 'Kyongnam',
  'bank.kwangju': 'Kwangju',
  'bank.jeonbuk': 'Jeonbuk',
  'bank.jeju': 'Jeju',
  'bank.sc': 'SC First',
  'bank.citi': 'Citibank Korea',
  'bank.suhyup': 'Suhyup',
  'bank.post': 'Korea Post',
  'bank.mg': 'MG Community Credit',
  'bank.shinhyup': 'Shinhyup',
  'bank.savings': 'Mutual Savings',
  'bank.forest': 'National Forestry Cooperative',
};

const krKeys = {
  'group.account.error': '계좌 정보 저장에 실패했습니다.',
  'group.account.title': '계좌 설정',
  'group.account.subtitle': 'MANAGE BANK ACCOUNT',
  'group.account.saving': '저장 중...',
  'group.account.save': '변경사항 저장',
  'group.account.identity.title': '그룹 정산 계좌',
  'group.account.identity.desc': '그룹 결제, 환불, 정산을 위한 은행 계좌 정보를 입력하세요.',
  'group.account.details.title': '계좌 정보',
  'group.account.bank_name.label': '은행명',
  'group.account.bank_name.placeholder': '은행 선택',
  'group.account.bank_name.major': '주요 은행',
  'group.account.bank_name.regional': '지방 은행',
  'group.account.bank_name.foreign': '외국계 은행',
  'group.account.bank_name.special': '특수 은행',
  'group.account.account_number.label': '계좌번호',
  'group.account.account_number.placeholder': '하이픈(-) 없이 입력',
  'group.account.account_holder.label': '예금주명',
  'group.account.account_holder.placeholder': '등록된 예금주명 정확히 입력',
  'group.account.notice': '예금주명은 그룹 소유자 또는 등록된 대표자 이름과 일치해야 합니다. 부정확한 정보는 정산 지연의 원인이 될 수 있습니다.',

  'bank.kb': 'KB국민은행',
  'bank.shinhan': '신한은행',
  'bank.hana': '하나은행',
  'bank.woori': '우리은행',
  'bank.nh': 'NH농협은행',
  'bank.ibk': 'IBK기업은행',
  'bank.kakao': '카카오뱅크',
  'bank.toss': '토스뱅크',
  'bank.kbank': '케이뱅크',
  'bank.im': 'iM뱅크',
  'bank.busan': '부산은행',
  'bank.kyongnam': '경남은행',
  'bank.kwangju': '광주은행',
  'bank.jeonbuk': '전북은행',
  'bank.jeju': '제주은행',
  'bank.sc': 'SC제일은행',
  'bank.citi': '한국씨티은행',
  'bank.suhyup': '수협은행',
  'bank.post': '우체국',
  'bank.mg': '새마을금고',
  'bank.shinhyup': '신협',
  'bank.savings': '저축은행',
  'bank.forest': '산림조합',
};

function injectKeys(lang, newKeys) {
  const langRegex = new RegExp(`(${lang}:\\s*\\{\\s*)`, 'g');
  const match = langRegex.exec(content);
  
  if (match) {
    let insertStr = '\\n    // Account & Bank Settings\\n';
    for (const [key, val] of Object.entries(newKeys)) {
      if (!content.includes(`'${key}':`)) {
        insertStr += `    '${key}': '${val.replace(/'/g, "\\'")}',\\n`;
      }
    }
    
    content = content.slice(0, match.index + match[1].length) + insertStr + content.slice(match.index + match[1].length);
  }
}

injectKeys('EN', enKeys);
injectKeys('KR', krKeys);

fs.writeFileSync(FILE_PATH, content, 'utf-8');
console.log('Successfully injected account/bank keys into LanguageContext.tsx');
