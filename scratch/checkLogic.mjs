import { subMonths, addMonths, startOfDay, addDays, format } from 'date-fns';

const now = new Date();
const startOfWindow = subMonths(now, 2);
const endOfWindow = addMonths(now, 6);

const s = {
  id: 'VyqVuIEoqv6M06aDLYET',
  title: 'LUCY',
  type: 'regular',
  dayOfWeek: 0,
  startTime: '18:00',
  endTime: '22:00'
};

const socialAsCalendarEvents = [];

if (s.type === 'regular' && s.dayOfWeek !== undefined) {
  let d = startOfDay(new Date(startOfWindow));
  while (d.getDay() !== Number(s.dayOfWeek)) {
    d = addDays(d, 1);
  }
  while (d <= endOfWindow) {
    socialAsCalendarEvents.push({
      id: `social-${s.id}-${format(d, 'yyyy-MM-dd')}`,
      title: s.title,
      startDate: d.getTime(),
      startTime: s.startTime || '',
      endTime: s.endTime || '',
      type: s.title.toLowerCase().includes('milonga') || s.title.toLowerCase().includes('밀롱가') ? 'milonga' : 'social',
    });
    d = addDays(d, 7);
  }
}

console.log(`Generated ${socialAsCalendarEvents.length} events for LUCY.`);
if (socialAsCalendarEvents.length > 0) {
  console.log('First event:', new Date(socialAsCalendarEvents[0].startDate).toISOString());
  console.log('Type:', socialAsCalendarEvents[0].type);
}
