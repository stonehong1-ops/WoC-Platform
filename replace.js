const fs = require('fs');
let code = fs.readFileSync('src/app/page.tsx', 'utf8');
code = code.replace(/href="\/home"/g, 'href="/home?society=tango"');
code = code.replace(/<a className="tap-target text-base hover:underline" href="#">([^<]+)<\/a>/g, (match, p1) => {
  return `<Link className="tap-target text-base hover:underline" href="/home?society=${p1.toLowerCase().replace(/[^a-z0-9]+/g, '-')}">${p1}</Link>`;
});
fs.writeFileSync('src/app/page.tsx', code);
