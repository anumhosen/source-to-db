const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiService {
  constructor(apiKey) {
    if (!apiKey) {
      throw new Error('API key is required');
    }

    this.apiKey = apiKey;
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = null;
    this.initialized = false;
    this.modelName = null;
  }

  /**
   * Initialize the service by finding a working model
   */
  async initialize() {
    if (this.initialized) return true;

    // List of model names to try - ordered by preference
    // Based on Google's available models as of 2024-2025
    const modelsToTry = [
      'gemini-2.0-flash', // Latest fast model
      'gemini-2.0-flash-lite', // Lightweight version
      'gemini-flash-latest', // Auto-updating flash model (from your curl)
      'gemini-1.5-flash', // Stable flash model
      'gemini-1.5-flash-latest', // Latest 1.5 flash
      'gemini-pro', // Original pro model
      'gemini-1.5-pro', // 1.5 pro model
      'gemini-1.5-pro-latest', // Latest 1.5 pro
      'gemini-1.0-pro', // 1.0 pro
      'gemini-1.0-pro-latest', // Latest 1.0 pro
    ];

    console.log('Searching for available Gemini models...');

    for (const modelName of modelsToTry) {
      try {
        console.log(`  Trying model: ${modelName}...`);
        const testModel = this.genAI.getGenerativeModel({ model: modelName });

        const result = await testModel.generateContent({
          contents: [{ role: 'user', parts: [{ text: 'Reply with just "OK"' }] }],
          generationConfig: { maxOutputTokens: 5, temperature: 0 },
        });

        const responseText = result.response.text();
        if (responseText && responseText.length > 0) {
          this.model = testModel;
          this.modelName = modelName;
          this.initialized = true;
          console.log(`  ✓ Successfully connected to: ${modelName}`);
          return true;
        }
      } catch (error) {
        console.log(`  ✗ ${modelName}: ${error.message?.split('\n')[0] || 'Failed'}`);
        // Continue to next model
      }
    }

    console.error('No working Gemini model found');
    console.error('Please check:');
    console.error('  1. API key is valid and has proper permissions');
    console.error('  2. Gemini API is enabled in Google Cloud Console');
    console.error('  3. You have available quota');
    console.error('  4. Your region supports the Gemini API');

    return false;
  }

  /**
   * Validate the API key by initializing and testing
   */
  async validateApiKey() {
    try {
      const isValid = await this.initialize();
      if (isValid) {
        console.log(`API key validated successfully using model: ${this.modelName}`);
      }
      return isValid;
    } catch (error) {
      console.error('API validation error:', error.message);
      return false;
    }
  }

  /**
   * Generate documentation for a single file
   */
  async generateDocumentation(filepath, filetype, code) {
    // Ensure service is initialized
    if (!this.initialized) {
      const initialized = await this.initialize();
      if (!initialized) {
        throw new Error('No working Gemini model available. Please check your API key.');
      }
    }

    console.log(`Generating documentation for: ${filepath}`);
    console.log(`  Using model: ${this.modelName}`);

    // Limit code length to avoid token limits
    const truncatedCode = code?.slice(0, 30000) || '';

    const prompt = `You are a code documentation expert. Analyze the following code file and provide documentation.

File path: ${filepath}
Language: ${filetype || 'unknown'}

Code:
\`\`\`
${truncatedCode}
\`\`\`

Respond with ONLY a valid JSON object (no markdown formatting, no backticks) in this exact format:
{
  "header": "A concise, descriptive title for this file (max 15 words)",
  "explanation": "A clear, educational paragraph explaining what this file does, its main purpose, and important patterns or architecture",
  "footnote": "Any additional notes about dependencies, edge cases, usage considerations, or important warnings"
}

IMPORTANT: Return ONLY the JSON object. Do not include any text before or after the JSON.`;

    try {
      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 1500, topP: 0.95, topK: 40 },
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
        ],
      });

      const response = result.response;
      let text = response.text();

      console.log(`  Response received (${text.length} chars)`);

      // Clean up the response to extract JSON
      let jsonStr = text.trim();

      // Remove markdown code block if present
      const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (codeBlockMatch) {
        jsonStr = codeBlockMatch[1].trim();
      }

      // Remove any text before or after the JSON object
      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
      }

      // Parse the JSON
      const data = JSON.parse(jsonStr);

      return {
        header: data.header || '',
        explanation: data.explanation || '',
        footnote: data.footnote || '',
      };
    } catch (error) {
      console.error('  Generation error:', error.message);

      // If model not found, try to reinitialize with other models
      if (error.message?.includes('404') || error.message?.includes('not found')) {
        console.log('  Model not found, attempting to reinitialize...');
        this.initialized = false;
        const reinitialized = await this.initialize();

        if (reinitialized) {
          console.log('  Reinitialized, retrying generation...');
          return this.generateDocumentation(filepath, filetype, code);
        }
      }

      throw error;
    }
  }

  /**
   * Get information about the current model
   */
  getModelInfo() {
    return {
      initialized: this.initialized,
      modelName: this.modelName,
      apiConfigured: !!this.apiKey,
    };
  }
}

module.exports = GeminiService;
