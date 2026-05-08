const fs = require('fs');
const data = JSON.parse(fs.readFileSync('users.json', 'utf8'));

// The user is in KST (+09:00) as per their current local time: 2026-05-08T21:16:10+09:00
const todayString = '2026-05-08';
const todayStart = new Date(todayString + 'T00:00:00+09:00').getTime();
const todayEnd = new Date(todayString + 'T23:59:59.999+09:00').getTime();

let todayCount = 0;
data.users.forEach(user => {
  const t = parseInt(user.createdAt, 10);
  if (t >= todayStart && t <= todayEnd) {
    todayCount++;
  }
});

console.log('Total users:', data.users.length);
console.log('Created today:', todayCount);
