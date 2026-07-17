const fs = require('fs');
let code = fs.readFileSync('src/services/geminiService.ts', 'utf-8');

code = code.replace(/const PRIMARY_MODEL = "gemini-3.5-flash";/g, 'const PRIMARY_MODEL = "gemini-1.5-flash";');
code = code.replace(/const FALLBACK_MODEL = "gemini-3.0-flash-lite";/g, 'const FALLBACK_MODEL = "gemini-1.5-flash-8b";');
code = code.replace(/gemini-3.0-flash-lite/g, 'gemini-1.5-flash-8b');

fs.writeFileSync('src/services/geminiService.ts', code);
console.log("Done");
