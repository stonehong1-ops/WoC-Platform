const fs = require('fs');
const path = require('path');

const translations = {
  'auth.sending_code': 'Sending code... Please wait up to 3 seconds.',
  'auth.enter_6_digits': 'Please enter the 6-digit code or check the SMS from Google.',
  'common.todo_message1': 'Sorry, the **{title}** service is currently under design.',
  'common.todo_message2': 'We will be back with a high-quality experience soon!',
  'group.not_setup_yet': 'This group has not been set up yet',
  'group.claim_admin_desc': 'If you are the admin of this community, claim your rights to activate the group.',
  'common.processing': 'Processing...',
  'group.claim_admin_btn': 'I am the admin here',
  'auth.push_noti_title': 'Would you like to receive real-time chat notifications?',
  'auth.push_noti_desc': 'You can receive notifications when a new chat arrives.',
  'auth.push_noti_enable': 'Enable Notifications',
  'auth.push_noti_success': 'Push notifications successfully enabled!',
  'auth.push_noti_blocked': 'Browser notification permissions are blocked.',
  'common.later': 'Later',
  'common.no_results': 'No results found',
  'group.loading_members': 'Loading member list...',
  'group.no_members': 'No matching members found.',
  'class.enter_title': 'Please enter a class title.',
  'class.check_cost': 'Please check the class cost.',
  'class.enter_instructors': 'Please enter all instructor names.',
  'class.edited_success': 'Class updated successfully.',
  'class.added_success': 'Class added successfully.',
  'class.save_failed': 'Failed to save class.',
  'class.edit_class': 'Edit Class',
  'class.add_class': 'Add Class',
  'common.saving': 'Saving...',
  'common.save': 'Save',
  'class.title_label': 'Class Title',
  'class.desc_label': 'Class Description',
  'class.level_label': 'Level',
  'class.type_label': 'Class Type (Partner)',
  'class.venue_label': 'Venue',
  'class.venue_select': 'Select Venue',
  'class.venue_memo': 'Venue Memo',
  'class.price_label': 'Price',
  'class.capacity_label': 'Capacity Management',
  'class.instructors_label': 'Instructors',
  'class.add_instructor': 'Add Instructor',
  'class.schedule_label': 'Schedule',
  'class.media_label': 'Media (Optional)',
  'class.main_photo': 'Main Photo (1)',
  'class.optimizing': 'Optimizing...',
  'class.change_photo': 'Change Photo',
  'class.upload_photo': 'Upload Photo',
  'class.photo_desc': 'PNG, JPG max 5MB',
  'class.promo_video': 'Promo Video (1)',
  'class.change_video': 'Change Video',
  'class.upload_video': 'Upload Video',
  'class.video_desc': 'MP4 max 50MB',
  'group.open_group': 'Open Group',
  'group.open_group_desc': 'An open community that anyone can join instantly. Suitable for large-scale announcements.',
  'group.admin_approval': 'Admin Approval',
  'group.admin_approval_desc': 'Requires admin approval after applying. Useful for filtering members.',
  'group.manager_selection': 'Manager Selection',
  'group.manager_selection_desc': 'Only members invited by the manager can join. Optimized for private groups.',
  'group.policy_save': 'Save Policy',
  'group.policy_desc1': 'Define how new members join your community. <br/>',
  'group.policy_desc2': 'Adjust the barrier to entry based on your operational goals.',
  'group.policy_warn1': 'When changing policies, existing pending applicants <br/>',
  'group.policy_warn2': 'may not be subject to the new policy retroactively.',
  'group.owner_role': 'Owner',
  'group.owner_desc': 'Has full rights to the group. Can manage payments, settings, and deletion.',
  'group.staff_role': 'Staff',
  'group.staff_desc': 'Has management and moderation rights. Can view member data and analytics.',
  'group.member_role': 'Member',
  'group.member_desc': 'Has basic activity rights. Can create posts and participate in the group.',
  'group.save_permissions': 'Save Permissions',
  'group.role_desc1': 'Define the core permission structure for members in the group.',
  'group.role_desc2': 'Select detailed permissions for staff members.',
  'group.manage_posts': 'Manage Posts',
  'group.manage_posts_desc': 'Permission to edit, delete, and pin any post in the group',
  'group.manage_members': 'Manage Members',
  'group.manage_members_desc': 'Permission to invite, kick, and blacklist members',
  'group.view_analytics': 'View Analytics',
  'group.view_analytics_desc': 'Access to activity metrics and report dashboards',
  'group.no_staff': 'No staff assigned.',
  'group.invite_staff': 'You can invite experts or partners to help run the group. Generate an invite link.',
  'group.generate_invite': 'Generate Staff Invite Link'
};

const ko_translations = {
  'auth.sending_code': '인증번호 발송중... 최대 3초 소요됩니다.',
  'auth.enter_6_digits': '6자리 숫자를 선택하세요. 혹은 구글에서 발송한 문자를 확인하세요.',
  'common.todo_message1': '죄송합니다. 현재 **{title}** 서비스는 핵심 기능을 설계 중입니다.',
  'common.todo_message2': '곧 완성도 높은 모습으로 찾아뵙겠습니다!',
  'group.not_setup_yet': '아직 세팅되지 않은 그룹입니다',
  'group.claim_admin_desc': '해당 커뮤니티의 어드민이시라면 권한을 획득하고 그룹을 활성화해 보세요.',
  'common.processing': '처리 중...',
  'group.claim_admin_btn': '내가 여기 어드민입니다',
  'auth.push_noti_title': '새로운 채팅 알림을 실시간으로 받으시겠습니까?',
  'auth.push_noti_desc': '채팅이 오면 알림을 받아볼 수 있습니다.',
  'auth.push_noti_enable': '알림 켜기',
  'auth.push_noti_success': '푸시 알림이 성공적으로 켜졌습니다!',
  'auth.push_noti_blocked': '브라우저 알림 권한이 차단되어 설정할 수 없습니다.',
  'common.later': '나중에',
  'common.no_results': '검색 결과가 없습니다',
  'group.loading_members': '멤버 목록을 불러오는 중...',
  'group.no_members': '해당하는 멤버가 없습니다.',
  'class.enter_title': '클래스 제목을 입력해주세요.',
  'class.check_cost': '클래스 비용을 확인해주세요.',
  'class.enter_instructors': '강사 이름을 모두 입력해주세요.',
  'class.edited_success': '클래스가 수정되었습니다.',
  'class.added_success': '클래스가 추가되었습니다.',
  'class.save_failed': '클래스 저장에 실패했습니다.',
  'class.edit_class': '클래스 수정',
  'class.add_class': '클래스 추가',
  'common.saving': '저장 중...',
  'common.save': '저장',
  'class.title_label': '클래스 제목',
  'class.desc_label': '클래스 설명',
  'class.level_label': '레벨',
  'class.type_label': '클래스 유형 (파트너)',
  'class.venue_label': '장소',
  'class.venue_select': '장소 선택',
  'class.venue_memo': '장소 메모',
  'class.price_label': '가격',
  'class.capacity_label': '정원 관리',
  'class.instructors_label': '강사진',
  'class.add_instructor': '강사 추가',
  'class.schedule_label': '스케줄',
  'class.media_label': '미디어 (선택)',
  'class.main_photo': '대표 사진 (1)',
  'class.optimizing': '최적화 중...',
  'class.change_photo': '사진 변경',
  'class.upload_photo': '사진 업로드',
  'class.photo_desc': 'PNG, JPG 최대 5MB',
  'class.promo_video': '프로모션 비디오 (1)',
  'class.change_video': '비디오 변경',
  'class.upload_video': '비디오 업로드',
  'class.video_desc': 'MP4 최대 50MB',
  'group.open_group': 'Open Group (공개 그룹)',
  'group.open_group_desc': '누구나 즉시 가입할 수 있는 개방형 커뮤니티입니다. 대규모 공지나 정보 공유 목적에 적합합니다.',
  'group.admin_approval': 'Admin Approval (승인제)',
  'group.admin_approval_desc': '가입 신청 후 관리자의 승인이 필요합니다. 커뮤니티의 성격에 맞는 멤버를 선별할 때 유용합니다.',
  'group.manager_selection': 'Manager Selection (초대제)',
  'group.manager_selection_desc': '관리자가 직접 초대한 멤버만 가입할 수 있습니다. 보안이 중요하거나 소수 정예 모임에 최적화되어 있습니다.',
  'group.policy_save': '정책 저장',
  'group.policy_desc1': '새로운 멤버가 커뮤니티에 합류하는 방식을 정의하세요. <br/>',
  'group.policy_desc2': '운영 목적에 따라 가입 문턱을 조절할 수 있습니다.',
  'group.policy_warn1': '정책 변경 시 기존 대기 중인 가입 신청자들에게는 <br/>',
  'group.policy_warn2': '새로운 정책이 소급 적용되지 않을 수 있습니다.',
  'group.owner_role': 'Owner (소유자)',
  'group.owner_desc': '그룹의 모든 권한을 가집니다. 결제 관리, 그룹 설정 및 삭제가 가능합니다.',
  'group.staff_role': 'Staff (운영진)',
  'group.staff_desc': '그룹 관리 및 중재 권한을 가집니다. 멤버 관리 및 분석 데이터를 조회할 수 있습니다.',
  'group.member_role': 'Member (일반 멤버)',
  'group.member_desc': '기본적인 활동 권한을 가집니다. 게시글 작성 및 그룹 내 활동이 가능합니다.',
  'group.save_permissions': '권한 저장',
  'group.role_desc1': '그룹 내 멤버들의 핵심 권한 체계를 정의합니다.',
  'group.role_desc2': '운영진에게 부여할 세부 권한을 선택하세요.',
  'group.manage_posts': '게시글 관리',
  'group.manage_posts_desc': '그룹 내 모든 포스트 수정, 삭제 및 고정 권한',
  'group.manage_members': '멤버 관리',
  'group.manage_members_desc': '멤버 초대, 추방 및 블랙리스트 관리 권한',
  'group.view_analytics': '데이터 분석',
  'group.view_analytics_desc': '활동 지표 및 리포트 대시보드 접근 권한',
  'group.no_staff': '할당된 운영진이 없습니다.',
  'group.invite_staff': '그룹 운영을 도와줄 전문가나 파트너를 운영진으로 초대할 수 있습니다. 초대 링크를 생성하세요.',
  'group.generate_invite': 'Staff Invite Link 생성'
};

// Update LanguageContext.tsx
const langPath = path.join(__dirname, 'src/contexts/LanguageContext.tsx');
let langContent = fs.readFileSync(langPath, 'utf8');

// Insert en translations
const enKeys = Object.entries(translations).map(([k, v]) => `    '${k}': '${v.replace(/'/g, "\\'")}',`).join('\n');
langContent = langContent.replace(/const en: Record<string, string> = {/, `const en: Record<string, string> = {\n${enKeys}`);

// Insert ko translations
const koKeys = Object.entries(ko_translations).map(([k, v]) => `    '${k}': '${v.replace(/'/g, "\\'")}',`).join('\n');
langContent = langContent.replace(/const ko: Record<string, string> = {/, `const ko: Record<string, string> = {\n${koKeys}`);

fs.writeFileSync(langPath, langContent);
console.log('LanguageContext.tsx updated');

// Files to replace text
const replacements = [
  {
    file: 'src/components/auth/AuthModal.tsx',
    reps: [
      [/인증번호 발송중\.\.\. 최대 3초 소요됩니다\./g, "{t('auth.sending_code')}"],
      [/6자리 숫자를 선택하세요\. 혹은 구글에서 발송한 문자를 확인하세요\./g, "{t('auth.enter_6_digits')}"]
    ]
  },
  {
    file: 'src/components/common/TodoPage.tsx',
    reps: [
      [/죄송합니다\. 현재 \*\*\{title\}\*\* 서비스는 핵심 기능을 설계 중입니다\./g, "{t('common.todo_message1').replace('{title}', title)}"],
      [/곧 완성도 높은 모습으로 찾아뵙겠습니다!/g, "{t('common.todo_message2')}"]
    ]
  },
  {
    file: 'src/components/groups/GroupHome.tsx',
    reps: [
      [/아직 세팅되지 않은 그룹입니다/g, "{t('group.not_setup_yet')}"],
      [/해당 커뮤니티의 어드민이시라면 권한을 획득하고 그룹을 활성화해 보세요\./g, "{t('group.claim_admin_desc')}"],
      [/"처리 중\.\.\."/g, "t('common.processing')"],
      [/"내가 여기 어드민입니다"/g, "t('group.claim_admin_btn')"]
    ]
  },
  {
    file: 'src/components/providers/AuthProvider.tsx',
    reps: [
      [/'새로운 채팅 알림을 실시간으로 받으시겠습니까\?'/g, "t('auth.push_noti_title')"],
      [/'채팅이 오면 알림을 받아볼 수 있습니다\.'/g, "t('auth.push_noti_desc')"],
      [/'알림 켜기'/g, "t('auth.push_noti_enable')"],
      [/'푸시 알림이 성공적으로 켜졌습니다!'/g, "t('auth.push_noti_success')"],
      [/'브라우저 알림 권한이 차단되어 설정할 수 없습니다\.'/g, "t('auth.push_noti_blocked')"],
      [/'나중에'/g, "t('common.later')"]
    ]
  },
  {
    file: 'src/components/feed/CreateFeedPopup.tsx',
    reps: [
      [/검색 결과가 없습니다/g, "{t('common.no_results')}"]
    ]
  },
  {
    file: 'src/components/groups/GroupMemberManager.tsx',
    reps: [
      [/멤버 목록을 불러오는 중\.\.\./g, "{t('group.loading_members')}"],
      [/해당하는 멤버가 없습니다\./g, "{t('group.no_members')}"],
      [/검색 결과가 없습니다\./g, "{t('common.no_results')}"]
    ]
  },
  {
    file: 'src/components/groups/GroupClassAddEditor.tsx',
    reps: [
      [/"클래스 제목을 입력해주세요\."/g, "t('class.enter_title')"],
      [/"클래스 비용을 확인해주세요\."/g, "t('class.check_cost')"],
      [/"강사 이름을 모두 입력해주세요\."/g, "t('class.enter_instructors')"],
      [/"클래스가 수정되었습니다\."/g, "t('class.edited_success')"],
      [/"클래스가 추가되었습니다\."/g, "t('class.added_success')"],
      [/"클래스 저장에 실패했습니다\."/g, "t('class.save_failed')"],
      [/"클래스 수정"/g, "t('class.edit_class')"],
      [/"클래스 추가"/g, "t('class.add_class')"],
      [/"저장 중\.\.\."/g, "t('common.saving')"],
      [/"저장"/g, "t('common.save')"],
      [/>클래스 제목</g, ">{t('class.title_label')}<"],
      [/>클래스 설명</g, ">{t('class.desc_label')}<"],
      [/>레벨</g, ">{t('class.level_label')}<"],
      [/>클래스 유형 \(파트너\)</g, ">{t('class.type_label')}<"],
      [/>장소 선택</g, ">{t('class.venue_select')}<"],
      [/>장소 메모</g, ">{t('class.venue_memo')}<"],
      [/>가격</g, ">{t('class.price_label')}<"],
      [/>정원 관리</g, ">{t('class.capacity_label')}<"],
      [/>강사진</g, ">{t('class.instructors_label')}<"],
      [/>강사 추가</g, ">{t('class.add_instructor')}<"],
      [/>스케줄</g, ">{t('class.schedule_label')}<"],
      [/>미디어 \(선택\)</g, ">{t('class.media_label')}<"],
      [/>대표 사진 \(1\)</g, ">{t('class.main_photo')}<"],
      [/>최적화 중\.\.\.</g, ">{t('class.optimizing')}<"],
      [/>사진 변경</g, ">{t('class.change_photo')}<"],
      [/>사진 업로드</g, ">{t('class.upload_photo')}<"],
      [/>PNG, JPG 최대 5MB</g, ">{t('class.photo_desc')}<"],
      [/>프로모션 비디오 \(1\)</g, ">{t('class.promo_video')}<"],
      [/>비디오 변경</g, ">{t('class.change_video')}<"],
      [/>비디오 업로드</g, ">{t('class.upload_video')}<"],
      [/>MP4 최대 50MB</g, ">{t('class.video_desc')}<"]
    ]
  },
  {
    file: 'src/components/groups/GroupMembershipEditor.tsx',
    reps: [
      [/'Open Group \(공개 그룹\)'/g, "t('group.open_group')"],
      [/'누구나 즉시 가입할 수 있는 개방형 커뮤니티입니다\. 대규모 공지나 정보 공유 목적에 적합합니다\.'/g, "t('group.open_group_desc')"],
      [/'Admin Approval \(승인제\)'/g, "t('group.admin_approval')"],
      [/'가입 신청 후 관리자의 승인이 필요합니다\. 커뮤니티의 성격에 맞는 멤버를 선별할 때 유용합니다\.'/g, "t('group.admin_approval_desc')"],
      [/'Manager Selection \(초대제\)'/g, "t('group.manager_selection')"],
      [/'관리자가 직접 초대한 멤버만 가입할 수 있습니다\. 보안이 중요하거나 소수 정예 모임에 최적화되어 있습니다\.'/g, "t('group.manager_selection_desc')"],
      [/'정책 저장'/g, "t('group.policy_save')"],
      [/새로운 멤버가 커뮤니티에 합류하는 방식을 정의하세요\. <br\/>/g, "{t('group.policy_desc1')} <br/>"],
      [/운영 목적에 따라 가입 문턱을 조절할 수 있습니다\./g, "{t('group.policy_desc2')}"],
      [/정책 변경 시 기존 대기 중인 가입 신청자들에게는 <br\/>/g, "{t('group.policy_warn1')} <br/>"],
      [/새로운 정책이 소급 적용되지 않을 수 있습니다\./g, "{t('group.policy_warn2')}"]
    ]
  },
  {
    file: 'src/components/groups/GroupRoleEditor.tsx',
    reps: [
      [/'Owner \(소유자\)'/g, "t('group.owner_role')"],
      [/'그룹의 모든 권한을 가집니다\. 결제 관리, 그룹 설정 및 삭제가 가능합니다\.'/g, "t('group.owner_desc')"],
      [/'Staff \(운영진\)'/g, "t('group.staff_role')"],
      [/'그룹 관리 및 중재 권한을 가집니다\. 멤버 관리 및 분석 데이터를 조회할 수 있습니다\.'/g, "t('group.staff_desc')"],
      [/'Member \(일반 멤버\)'/g, "t('group.member_role')"],
      [/'기본적인 활동 권한을 가집니다\. 게시글 작성 및 그룹 내 활동이 가능합니다\.'/g, "t('group.member_desc')"],
      [/'권한 저장'/g, "t('group.save_permissions')"],
      [/>그룹 내 멤버들의 핵심 권한 체계를 정의합니다\.</g, ">{t('group.role_desc1')}<"],
      [/>운영진에게 부여할 세부 권한을 선택하세요\.</g, ">{t('group.role_desc2')}<"],
      [/"게시글 관리"/g, "t('group.manage_posts')"],
      [/"그룹 내 모든 포스트 수정, 삭제 및 고정 권한"/g, "t('group.manage_posts_desc')"],
      [/"멤버 관리"/g, "t('group.manage_members')"],
      [/"멤버 초대, 추방 및 블랙리스트 관리 권한"/g, "t('group.manage_members_desc')"],
      [/"데이터 분석"/g, "t('group.view_analytics')"],
      [/"활동 지표 및 리포트 대시보드 접근 권한"/g, "t('group.view_analytics_desc')"],
      [/>할당된 운영진이 없습니다\.</g, ">{t('group.no_staff')}<"],
      [/그룹 운영을 도와줄 전문가나 파트너를 운영진으로 초대할 수 있습니다\. 초대 링크를 생성하세요\./g, "{t('group.invite_staff')}"],
      [/Staff Invite Link 생성/g, "{t('group.generate_invite')}"]
    ]
  }
];

for (const rep of replacements) {
  const f = path.join(__dirname, rep.file);
  if (fs.existsSync(f)) {
    let content = fs.readFileSync(f, 'utf8');
    
    // Add useLanguage hook if needed
    if (!content.includes('useLanguage')) {
      // Find the first component definition and insert it
      const componentMatch = content.match(/const\s+[A-Z][a-zA-Z0-9_]*\s*=\s*(?:<[^>]*>)?\s*\([^)]*\)\s*(?::\s*[^=]+)?\s*=>\s*\{/);
      if (componentMatch) {
        if (!content.includes('import { useLanguage }')) {
          content = "import { useLanguage } from '@/contexts/LanguageContext';\n" + content;
        }
        content = content.replace(componentMatch[0], `${componentMatch[0]}\n  const { t } = useLanguage();\n`);
      } else {
        const functionMatch = content.match(/export\s+default\s+function\s+[A-Z][a-zA-Z0-9_]*\s*\([^)]*\)\s*\{/);
        if (functionMatch) {
          if (!content.includes('import { useLanguage }')) {
            content = "import { useLanguage } from '@/contexts/LanguageContext';\n" + content;
          }
          content = content.replace(functionMatch[0], `${functionMatch[0]}\n  const { t } = useLanguage();\n`);
        }
      }
    }

    // Apply replacements
    rep.reps.forEach(([regex, replacement]) => {
      content = content.replace(regex, replacement);
    });

    fs.writeFileSync(f, content);
    console.log(`Updated ${rep.file}`);
  }
}
