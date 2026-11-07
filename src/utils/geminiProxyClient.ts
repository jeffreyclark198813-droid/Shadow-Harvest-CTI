export async function callGeminiProxy(method: 'generateContent' | 'generateContentStream', params: any, operationName: string) {
    const response = await fetch("/api/v1/gemini/proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method, params, operationName }),
    });
    if (!response.ok) throw new Error(`Failed to call Gemini: ${response.statusText}`);
    
    // For generateContentStream, we can't return JSON directly. 
    // This helper should be adjusted based on the specific usage (streaming vs static).
    return await response.json();
}
