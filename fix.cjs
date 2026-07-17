const fs = require('fs');
let code = fs.readFileSync('src/services/geminiService.ts', 'utf-8');

// Replace withRetry
code = code.replace(/withRetry\(\s*async\s*\(\)\s*=>\s*\{/g, 'executeWithReliabilityEngine("Gemini_API_Call", async (model) => {');

// Replace the hardcoded model
code = code.replace(/model:\s*['"]gemini-[^'"]+['"]/g, 'model');

fs.writeFileSync('src/services/geminiService.ts', code);
console.log("Done");
