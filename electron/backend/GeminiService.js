const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiService {
    constructor(apiKey) {
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    }

    /**
     * Generate documentation for a single file.
     * @returns {{header:string, explanation:string, footnote:string} | null}
     */
    async generateDocumentation(filepath, filetype, code) {
        const prompt = `You are a code documentation expert. Given the following file, output a JSON object with exactly these three keys:
- "header": a concise, descriptive title (max 15 words) for the file.
- "explanation": a clear paragraph explaining what this file does, its main purpose, and important patterns.
- "footnote": any additional notes, dependencies, edge cases, or usage considerations.

File path: ${filepath}
Language: ${filetype || 'unknown'}
Content:
\`\`\`
${code.slice(0, 30000)}   // Truncate to avoid token limits
\`\`\`

Return ONLY the JSON object, no other text.`;

        try {
            const result = await this.model.generateContent(prompt);
            const response = result.response;
            const text = response.text();
            // Extract JSON from possible markdown code fences
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) throw new Error('No JSON found in response');
            const data = JSON.parse(jsonMatch[0]);
            return {
                header: data.header || '',
                explanation: data.explanation || '',
                footnote: data.footnote || '',
            };
        } catch (error) {
            console.error('Gemini error:', error);
            return null;
        }
    }
}

module.exports = GeminiService;
