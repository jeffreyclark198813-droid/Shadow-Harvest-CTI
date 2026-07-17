const fs = require('fs');
const content = fs.readFileSync('src/services/geminiService.ts', 'utf8');
fs.writeFileSync('src/services/geminiService.ts', content.replace(/gemini-3-flash-preview/g, 'gemini-2.5-pro'));
console.log('Done replacing model');
