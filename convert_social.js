const fs = require('fs');

const html = fs.readFileSync('C:/Users/stone/WoC/public/aiantigravity.txt', 'utf8');

// Extract tailwind config script
const tailwindScriptMatch = html.match(/<script id="tailwind-config">([\s\S]*?)<\/script>/);
const tailwindConfig = tailwindScriptMatch ? tailwindScriptMatch[1] : '';

// Extract style
const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/);
const styleContent = styleMatch ? styleMatch[1] : '';

// Extract body
const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/);
let bodyContent = bodyMatch ? bodyMatch[1] : '';

// Convert class to className
bodyContent = bodyContent.replace(/class=/g, 'className=');

// Convert HTML comments to JSX comments
bodyContent = bodyContent.replace(/<!--([\s\S]*?)-->/g, '{/*$1*/}');

// Convert for to htmlFor
bodyContent = bodyContent.replace(/for=/g, 'htmlFor=');

const jsxFile = `'use client';

import React from 'react';
import Script from 'next/script';

export default function SocialPage() {
  return (
    <div className="bg-background text-on-background antialiased font-body-md w-full relative overflow-x-hidden pb-20">
      <Script src="https://cdn.tailwindcss.com?plugins=forms,container-queries" strategy="lazyOnload" />
      <Script id="tailwind-config" strategy="lazyOnload">
        {\`${tailwindConfig}\`}
      </Script>
      <style dangerouslySetInnerHTML={{__html: \`${styleContent}\`}} />
      
      {/* Design Content */}
      ${bodyContent}
    </div>
  );
}
`;

fs.writeFileSync('C:/Users/stone/WoC/src/app/social/page.tsx', jsxFile, 'utf8');
console.log('Done!');
