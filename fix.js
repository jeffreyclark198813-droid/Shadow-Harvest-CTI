const fs = require('fs');
let code = fs.readFileSync('src/services/geminiService.ts', 'utf-8');

// Replace withRetry
code = code.replace(/withRetry\(\s*async\s*\(\)\s*=>\s*\{/g, 'executeWithReliabilityEngine("Gemini_API_Call", async (model) => {');

// We also need to replace the static model references in generateContent calls to use the passed `model` parameter.
// Like: model: "gemini-3.5-flash" -> model: model
// Note: only inside the geminiService file.
code = code.replace(/model:\s*['"]gemini-[^'"]+['"]/g, 'model: model || "gemini-3.5-flash"');

fs.writeFileSync('src/services/geminiService.ts', code);
console.log("Done");
