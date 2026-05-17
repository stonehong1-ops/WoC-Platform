export const KIND_ICON: Record<string, string> = {
  people: 'person',
  event: 'event',
  social: 'share',
  group: 'groups',
};

export const KIND_COLOR: Record<string, string> = {
  people: 'text-blue-500 bg-blue-50',
  event: 'text-orange-500 bg-orange-50',
  social: 'text-purple-500 bg-purple-50',
  group: 'text-pink-500 bg-pink-50',
};

// If we need the base color class (e.g. text-blue-500) without bg, we can add a new constant
export const KIND_TEXT_COLOR: Record<string, string> = {
  people: 'text-blue-500',
  event: 'text-orange-500',
  social: 'text-purple-500',
  group: 'text-pink-500',
};
