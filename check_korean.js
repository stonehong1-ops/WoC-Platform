const fs = require('fs');
const files = [
'src/components/auth/AuthModal.tsx',
'src/components/chat/ChatRoom.tsx',
'src/components/common/TodoPage.tsx',
'src/components/events/EditEvent.tsx',
'src/components/events/EventProgramTab.tsx',
'src/components/feed/CommentBottomSheet.tsx',
'src/components/feed/CreateFeedPopup.tsx',
'src/components/feed/FeedPostCard.tsx',
'src/components/feed/MediaViewerPopup.tsx',
'src/components/groups/GroupAccountEditor.tsx',
'src/components/groups/GroupCalendar.tsx',
'src/components/groups/GroupClassAddEditor.tsx',
'src/components/groups/GroupClassRegistrations.tsx',
'src/components/groups/GroupContactEditor.tsx',
'src/components/groups/GroupFooter.tsx',
'src/components/groups/GroupGalleryEditor.tsx',
'src/components/groups/GroupHome.tsx',
'src/components/groups/GroupHomeConfig.tsx',
'src/components/groups/GroupMemberManager.tsx',
'src/components/groups/GroupMembershipEditor.tsx',
'src/components/groups/GroupRentalEditor.tsx',
'src/components/groups/GroupRoleEditor.tsx',
'src/components/groups/GroupShopEditor.tsx',
'src/components/groups/PostEditorModal.tsx',
'src/components/home/ActivitySpotlight.tsx',
'src/components/layout/LocationSelector.tsx',
'src/components/layout/NavigationDrawer.tsx',
'src/components/providers/AuthProvider.tsx',
'src/components/providers/LocationProvider.tsx',
'src/components/shop/ProductDetail.tsx',
'src/components/social/EditSocialEvent.tsx',
'src/components/social/SocialHeroCard.tsx',
'src/components/ui/ChipSelector.tsx',
'src/components/ui/CollapseSection.tsx',
'src/components/ui/FullScreenModal.tsx',
'src/components/ui/index.ts',
'src/components/ui/InfoRow.tsx',
'src/components/ui/RadioSelector.tsx',
'src/components/ui/SectionCard.tsx',
'src/components/venues/MapComponent.tsx'
];
const koreanRegex = /[가-힣]/;
for (const f of files) {
  if (!fs.existsSync(f)) continue;
  const content = fs.readFileSync(f, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, i) => {
    if (koreanRegex.test(line)) {
      console.log(f + ':' + (i+1) + ': ' + line.trim());
    }
  });
}
