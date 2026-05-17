const fs = require('fs');

// Read static missing keys
const keys = fs.readFileSync('i18n_static_missing.txt', 'utf-8').split('\n').filter(l => l.trim());

// Korean translations map for known keys
const krMap = {
  // common
  'common.about': 'About', 'common.terms': '이용약관', 'common.privacy': '개인정보처리방침',
  'common.cancel': '취소', 'common.close': '닫기', 'common.save': '저장',
  'common.saving': '저장 중...', 'common.delete': '삭제', 'common.edit': '수정',
  'common.done': '완료', 'common.update': '업데이트', 'common.error': '오류',
  'common.post': '게시', 'common.posting': '게시 중...', 'common.new': '새로운',
  'common.coming_soon': '준비 중', 'common.no_results': '결과 없음',
  'common.got_it': '확인', 'common.important': '중요',
  'common.failed_update': '업데이트 실패', 'common.focus': '포커스',
  'common.anonymous': '익명', 'common.member': '멤버', 'common.instructor': '강사',
  'common.on': '켜기', 'common.clear_and_add': '초기화 후 추가',
  'common.mon': '월', 'common.tue': '화', 'common.wed': '수',
  'common.thu': '목', 'common.fri': '금', 'common.sat': '토', 'common.sun': '일',
  'common.todo_message1': '할 일 메시지 1', 'common.todo_message2': '할 일 메시지 2',
  // auth
  'auth.login_required': '로그인이 필요합니다',
  // home
  'home.global_tango_society': 'Global Tango Society',
  'home.coming_soon_desc': '곧 만나보실 수 있습니다',
  // checkout
  'checkout.applicant_name': '신청자 이름', 'checkout.contact_number': '연락처',
  // class
  'class.change_video': '영상 변경', 'class.upload_video': '영상 업로드',
  'class.video_desc': '영상 설명',
  // chatroom
  'chatroom.total': '전체',
  // event
  'event.confirm_status_change': '상태를 변경하시겠습니까?',
  'event.date_label': '날짜',
  // feed
  'feed.video_badge': '영상',
  // search
  'search.no_results': '검색 결과가 없습니다',
  // fb (Function Builder)
  'fb.badge.installed': 'INSTALLED', 'fb.badge.required': 'REQUIRED',
  'fb.cart.apply': 'Apply Changes', 'fb.cart.estimated': 'Estimated:',
  'fb.cart.saving': 'Saving...', 'fb.cart.selected': 'Functions Selected',
  'fb.header.desc': 'Architect your community ecosystem.',
  'fb.header.title': 'WoC Group Function Builder',
  'fb.toast.failed': '저장 실패', 'fb.toast.noSelection': '선택된 항목이 없습니다',
  'fb.toast.saved': '저장되었습니다',
  // group general
  'group.general': '일반', 'group.notice': '공지',
  'group.post': '게시글', 'group.comments': '댓글',
  'group.compose_prompt': '무슨 생각을 하고 계세요?',
  'group.share_thoughts': '생각을 나눠주세요',
  'group.create_post': '게시글 작성', 'group.edit_post': '게시글 수정',
  'group.post_created': '게시글이 작성되었습니다', 'group.post_updated': '게시글이 수정되었습니다',
  'group.delete_post_confirm': '이 게시글을 삭제하시겠습니까?',
  'group.delete_comment_confirm': '이 댓글을 삭제하시겠습니까?',
  'group.comment_error': '댓글 작성 실패', 'group.no_comments': '아직 댓글이 없습니다',
  'group.no_content': '콘텐츠가 없습니다', 'group.min_read': '분 읽기',
  'group.permission_denied': '권한이 없습니다',
  'group.title_placeholder': '제목을 입력하세요',
  'group.no_members': '멤버가 없습니다', 'group.no_staff': '스태프가 없습니다',
  'group.loading_members': '멤버 로딩 중...',
  'group.manage_members': '멤버 관리', 'group.manage_members_desc': '그룹 멤버를 관리합니다',
  'group.manage_posts': '게시글 관리', 'group.manage_posts_desc': '그룹 게시글을 관리합니다',
  'group.view_analytics': '분석 보기', 'group.view_analytics_desc': '그룹 통계를 확인합니다',
  'group.generate_invite': '초대 링크 생성', 'group.invite_staff': '스태프 초대',
  'group.open_group': '공개 그룹', 'group.open_group_desc': '누구나 가입할 수 있습니다',
  'group.admin_approval': '관리자 승인', 'group.admin_approval_desc': '관리자 승인 후 가입',
  'group.manager_selection': '관리자 선택', 'group.manager_selection_desc': '관리자를 선택합니다',
  'group.save_permissions': '권한 저장',
  'group.owner_role': 'Owner', 'group.owner_desc': '그룹의 소유자입니다',
  'group.staff_role': 'Staff', 'group.staff_desc': '그룹 운영을 돕습니다',
  'group.instructor_role': 'Instructor', 'group.instructor_desc': '클래스를 운영합니다',
  'group.member_role': 'Member', 'group.member_desc': '일반 멤버입니다',
  'group.role_desc1': '역할에 따라 권한이 다릅니다',
  'group.role_desc2': '역할을 변경하려면 관리자에게 문의하세요',
  'group.role.saving': '역할 저장 중...', 'group.role.settings_desc': '역할 및 권한 설정',
  'group.policy_desc1': '커뮤니티 정책을 설정합니다',
  'group.policy_desc2': '모든 멤버가 준수해야 합니다',
  'group.policy_save': '정책 저장',
  'group.policy_warn1': '정책 변경 시 모든 멤버에게 알림이 전송됩니다',
  'group.policy_warn2': '정책을 신중하게 설정해주세요',
  'group.homeConfig.placeholder.nativeName': '현지 이름 입력',
  // group.about
  'group.about.copied': '복사되었습니다', 'group.about.join_requested': '가입 신청되었습니다',
  'group.about.no_team': '팀 정보가 없습니다', 'group.about.services': '서비스',
  // group.board.editor
  'group.board.editor.title': '게시판 관리', 'group.board.editor.boards': '게시판',
  'group.board.editor.board_list': '게시판 목록', 'group.board.editor.board_title': '게시판 제목',
  'group.board.editor.add_board': '게시판 추가', 'group.board.editor.enter_title': '제목 입력',
  'group.board.editor.save': '저장', 'group.board.editor.saving': '저장 중...',
  'group.board.editor.error_save': '저장 실패',
  'group.board.editor.default_setting': '기본 설정',
  'group.board.editor.notice': '공지사항', 'group.board.editor.notice_title': '공지사항 게시판',
  'group.board.editor.mandatory_notice': '필수 공지',
  'group.board.editor.pinned': '고정됨',
  'group.board.editor.everyone': '모든 멤버',
  'group.board.editor.only_admin': '관리자만',
  'group.board.editor.who_can_post': '게시 권한',
  'group.board.editor.max_boards': '최대 게시판 수에 도달했습니다',
  'group.board.editor.section01': '기본 게시판', 'group.board.editor.section02': '커스텀 게시판',
  'group.board.write_post': '글쓰기',
  // group.class
  'group.class.management': '클래스 관리', 'group.class.class': '클래스',
  'group.class.register': '등록', 'group.class.application': '신청',
  'group.class.instructor': '강사', 'group.class.all_levels': 'All Levels',
  'group.class.tbd': 'TBD', 'group.class.stats': '통계',
  'group.class.no_items': '등록된 항목이 없습니다',
  'group.class.no_sessions': '세션이 없습니다',
  'group.class.monthly_pass_br': 'Monthly\nPass',
  'group.class.pass_badge': 'PASS', 'group.class.bundle_badge': 'BUNDLE',
  'group.class.bundle_discount': '번들 할인',
  'group.class.monthly_price': '월 가격', 'group.class.discounted_price': '할인 가격',
  'group.class.unlimited_access': '무제한 이용',
  'group.class.includes_classes': '클래스 포함',
  'group.class.plus_sessions': '추가 세션',
  'group.class.show_this_month': '이번 달 표시',
  'group.class.monthly_visibility': '월간 노출',
  'group.class.delete_confirm': '삭제하시겠습니까?',
  'group.class.delete_failed': '삭제 실패', 'group.class.delete_success': '삭제되었습니다',
  'group.class.deleting': '삭제 중...',
  'group.class.migrated_success': '마이그레이션 완료',
  'group.class.actions.delete_record': '기록 삭제',
  'group.class.actions.edit_list': '목록 수정',
  'group.class.toast.payment_confirmed': '결제가 확인되었습니다',
  'group.class.toast.payment_pending': '결제 대기 중',
  // group.contact
  'group.contact.intro_title': '소개',
  'group.contact.location.title': '위치', 'group.contact.location.address_label': '주소',
  'group.contact.location.detail_label': '상세 주소',
  'group.contact.location.transit_label': '대중교통',
  'group.contact.location.syncing': '동기화 중...',
  'group.contact.representative.title': '대표자',
  'group.contact.representative.name_label': '이름',
  'group.contact.representative.phone_label': '전화번호',
  'group.contact.representative.phone_placeholder': '010-0000-0000',
  'group.contact.social.title': '소셜 미디어',
  'group.contact.actions.save': '저장', 'group.contact.actions.saving': '저장 중...',
  'group.contact.actions.fail_save': '저장 실패',
  'group.contact.actions.fail_upload': '업로드 실패',
  // group.gallery.editor
  'group.gallery.editor.title': '갤러리 관리',
  'group.gallery.editor.repo_title': '미디어 저장소',
  'group.gallery.editor.add_content': '콘텐츠 추가',
  'group.gallery.editor.new_section': '새 섹션',
  'group.gallery.editor.init_section': '섹션 초기화',
  'group.gallery.editor.terminate_section': '섹션 삭제',
  'group.gallery.editor.section_identity': '섹션 이름',
  'group.gallery.editor.section_placeholder': '섹션 이름 입력',
  'group.gallery.editor.layout_sections': '레이아웃 섹션',
  'group.gallery.editor.expand_story': '스토리 확장',
  'group.gallery.editor.photo_stream': '포토 스트림',
  'group.gallery.editor.cinema_stream': '시네마 스트림',
  'group.gallery.editor.active_clip': '활성 클립',
  'group.gallery.editor.photos': '사진',
  'group.gallery.editor.videos': '영상',
  'group.gallery.editor.max_photos': '최대 사진 수 도달',
  'group.gallery.editor.max_videos': '최대 영상 수 도달',
  'group.gallery.editor.media_protocol': '미디어 프로토콜',
  'group.gallery.editor.milonga': '밀롱가',
  'group.gallery.editor.slots_occupied': '슬롯 사용 중',
  'group.gallery.editor.assets_managed': '에셋 관리됨',
  'group.gallery.editor.storage_quota': '저장 용량',
  'group.gallery.editor.save': '저장', 'group.gallery.editor.saving': '저장 중...',
  'group.gallery.editor.syncing': '동기화 중...',
  'group.gallery.editor.optimizing': '최적화 중...',
  'group.gallery.editor.success_save': '저장 완료',
  'group.gallery.editor.error_save': '저장 실패',
  'group.gallery.editor.warning_switch_type': '타입 변경 시 기존 콘텐츠가 삭제됩니다',
  // group.rental
  'group.rental.general_info.title': '기본 정보',
  'group.rental.general_info.desc': '대관 기본 정보를 설정합니다',
  'group.rental.general_info.currency_label': '통화',
  'group.rental.general_info.rules_label': '이용 규칙',
  'group.rental.general_info.rules_placeholder': '이용 규칙을 입력하세요',
  'group.rental.pricing_palette.title': '가격 팔레트',
  'group.rental.pricing_palette.desc': '시간대별 가격을 설정합니다',
  'group.rental.time_grid.title': '시간표',
  'group.rental.time_grid.desc': '대관 가능 시간을 설정합니다',
  'group.rental.time_grid.color_set_title': '색상 설정',
  'group.rental.requests.empty_title': '요청 없음',
  'group.rental.requests.empty_desc': '아직 대관 요청이 없습니다',
  'group.rental.actions.save': '저장', 'group.rental.actions.saving': '저장 중...',
  'group.rental.actions.cancel': '취소',
  'group.rental.actions.save_confirm': '저장하시겠습니까?',
  'group.rental.actions.cancel_confirm': '취소하시겠습니까?',
  'group.rental.actions.success_msg': '저장되었습니다',
  'group.rental.actions.error_msg': '오류가 발생했습니다',
  // groups
  'groups.category_unavailable_online': '온라인에서 이용 불가',
  'groups.form_venue_type_label': '장소 유형',
  'groups.venue_search_label': '장소 검색',
  'groups.venue_search_placeholder': '장소를 검색하세요',
  'groups.venue_no_results': '검색 결과가 없습니다',
  'groups.venue_not_registered': '장소가 등록되어 있지 않습니다',
  'groups.venue_register_guide': '장소를 등록해주세요',
  'groups.venue_type_online': '온라인',
  'groups.venue_type_online_desc': '온라인으로 진행합니다',
  'groups.venue_type_venue': '오프라인 장소',
  'groups.venue_type_venue_desc': '실제 장소에서 진행합니다',
  // myinfo
  'myinfo.dance_role': '댄스 역할',
  // shop
  'shop.price': '가격', 'shop.location': '위치',
  'shop.location_detail': '상세 위치',
  'shop.location_detail_placeholder': '상세 위치를 입력하세요',
  'shop.added_to_cart': '장바구니에 추가되었습니다',
  'shop.already_in_cart': '이미 장바구니에 있습니다',
  'shop.chat_image': '이미지',
  'shop.different_group_error': '다른 그룹의 상품입니다',
  'shop.different_group_desc': '장바구니에는 같은 그룹의 상품만 담을 수 있습니다',
  'shop.msg_fill_required': '필수 항목을 입력해주세요',
  'shop.msg_max_photos': '최대 사진 수에 도달했습니다',
  'shop.order.cancelled_msg': '주문이 취소되었습니다',
  'shop.order.completed_msg': '주문이 완료되었습니다',
  'shop.order.confirmed_msg': '주문이 확인되었습니다',
  'shop.order.in_production_msg': '제작 중입니다',
  'shop.order.no_tracking_info': '배송 정보가 없습니다',
  'shop.order.ready_pickup_msg': '수령 준비 완료',
  'shop.order.shipping_msg': '배송 중입니다',
  'shop.order_reported_prefix': '주문이 신고되었습니다: ',
  'shop.order_reported_suffix': '',
  // social
  'social.seats': '좌석', 'social.select_date': '날짜 선택',
  'social.status': '상태', 'social.unknown_error': '알 수 없는 오류',
  // stay
  'stay.agree_terms': '약관 동의', 'stay.agree_text': '위 약관에 동의합니다',
  'stay.chat_depositor': '입금자명', 'stay.chat_order_no': '주문번호',
  'stay.chat_payment_msg': '결제 메시지',
  'stay.chat_payment_prefix': '[결제 안내]',
  'stay.confirm_booking': '예약 확인',
  'stay.reservation_summary': '예약 요약',
  'stay.select_dates_first': '먼저 날짜를 선택해주세요',
  // resale
  'resale.description': '설명', 'resale.item_specs': '상품 상세',
  'resale.msg_max_photos': '최대 사진 수에 도달했습니다',
  'resale.negotiable': '가격 협의 가능', 'resale.no_description': '설명 없음',
  // coupon (camelCase keys)
  'activeCoupons': '활성 쿠폰', 'all': '전체',
  'beTheFirstToShare': '첫 번째로 공유해보세요',
  'confirmDeactivateCoupon': '쿠폰을 비활성화하시겠습니까?',
  'couponCreatedSuccess': '쿠폰이 생성되었습니다',
  'couponDeactivated': '쿠폰이 비활성화되었습니다',
  'couponTitle': '쿠폰 제목', 'couponTitlePlaceholder': '쿠폰 제목을 입력하세요',
  'createCoupon': '쿠폰 생성', 'createNewGroupCoupon': '새 그룹 쿠폰 생성',
  'creating': '생성 중...',
  'discountAmountKrw': '할인 금액 (KRW)', 'discountType': '할인 유형',
  'durationMonths': '기간 (월)',
  'failedToCreateCoupon': '쿠폰 생성 실패',
  'failedToDeactivateCoupon': '쿠폰 비활성화 실패',
  'failedToLoadCoupons': '쿠폰 로딩 실패',
  'freePass': '프리패스', 'general': '일반',
  'loadMorePosts': '더 보기', 'loadingCoupons': '쿠폰 로딩 중...',
  'months': '개월', 'noActiveCouponsFound': '활성 쿠폰이 없습니다',
  'noPostsFound': '게시글이 없습니다',
  'pleaseEnterCouponTitle': '쿠폰 제목을 입력해주세요',
  'quantity': '수량', 'totalQuantity': '총 수량',
  'unlimited': '무제한', 'validity': '유효기간',
  'zeroForUnlimited': '0 = 무제한',
};

// Generate EN value from key name
function keyToEN(key) {
  // Remove prefix
  const lastPart = key.includes('.') ? key.split('.').pop() : key;
  // camelCase to words
  const words = lastPart.replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2');
  // Capitalize first letter
  return words.charAt(0).toUpperCase() + words.slice(1);
}

// Build entries
const enLines = [];
const krLines = [];

keys.forEach(key => {
  const enVal = keyToEN(key);
  const krVal = krMap[key] || enVal; // fallback to EN if no KR
  enLines.push(`    '${key}': '${enVal.replace(/'/g, "\\'")}',`);
  krLines.push(`    '${key}': '${krVal.replace(/'/g, "\\'")}',`);
});

// Read LanguageContext
const filePath = './src/contexts/LanguageContext.tsx';
let content = fs.readFileSync(filePath, 'utf-8');

// Find EN and KR insertion points (before the closing of each dict)
// Insert before the fb.ui section or at end of each dict
const enInsert = '\n    // Auto-generated missing keys\n' + enLines.join('\n') + '\n';
const krInsert = '\n    // Auto-generated missing keys\n' + krLines.join('\n') + '\n';

// Find the FB UI section marker in EN dict and insert before it
const enMarker = "    // Function Builder UI";
const krMarker = "    // Function Builder Data";

if (content.includes(enMarker)) {
  content = content.replace(enMarker, enInsert + '\n' + enMarker);
} else {
  // Fallback: insert before first closing of EN dict
  console.log('WARNING: EN marker not found, skipping EN injection');
}

// For KR, find the marker
if (content.includes(krMarker)) {
  content = content.replace(krMarker, krInsert + '\n' + krMarker);
} else {
  console.log('WARNING: KR marker not found, skipping KR injection');
}

fs.writeFileSync(filePath, content, 'utf-8');
console.log(`Injected ${keys.length} keys into EN and KR dictionaries.`);
