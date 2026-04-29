const path = require('path');
const fs = require('fs');
const { app } = require('electron');

class LocalLLMService {
  constructor(options = {}) {
    this.modelPath = options.modelPath || null;
    this.contextSize = options.context || 4096;
    this.threads = options.threads || 4;
    this.temperature = options.temperature || 0.1; // Lower temperature for JSON
    this.maxTokens = options.maxTokens || 500; // Smaller response for JSON

    this.llama = null;
    this.model = null;
    this.context = null;
    this.session = null;
    this.initialized = false;
    this.modelName = null;
  }

  async initialize(modelPath = null) {
    if (this.initialized) return true;

    const modelFile = modelPath || this.modelPath;

    if (!modelFile) {
      console.error('No model path provided');
      return false;
    }

    if (!fs.existsSync(modelFile)) {
      console.error(`Model file not found: ${modelFile}`);
      return false;
    }

    try {
      console.log('Loading node-llama-cpp...');

      const { getLlama, LlamaChatSession } = await import('node-llama-cpp');

      this.llama = await getLlama({ gpu: 'auto' });

      console.log('Loading model:', path.basename(modelFile));
      this.model = await this.llama.loadModel({ modelPath: modelFile });

      this.context = await this.model.createContext({
        contextSize: this.contextSize,
        threads: this.threads,
      });

      this.session = new LlamaChatSession({
        contextSequence: this.context.getSequence(),
        systemPrompt: `You are a code documentation assistant.
You MUST respond with ONLY a valid JSON object.
Use double quotes for all keys and string values.
Escape any special characters.
Format:
{
  "header": "file title here",
  "explanation": "what the file does",
  "footnote": "additional notes"
}`,
      });

      this.modelName = path.basename(modelFile, '.gguf');
      this.initialized = true;

      console.log('✓ Local LLM ready');
      console.log('  Model:', this.modelName);

      return true;
    } catch (error) {
      console.error('Failed to initialize:', error.message);
      this.initialized = false;
      return false;
    }
  }

  /**
   * Fix common JSON formatting issues from LLM output
   */
  fixJsonString(str) {
    let fixed = str.trim();

    // Remove any text before the first {
    const firstBrace = fixed.indexOf('{');
    if (firstBrace > 0) {
      fixed = fixed.substring(firstBrace);
    }

    // Remove any text after the last }
    const lastBrace = fixed.lastIndexOf('}');
    if (lastBrace !== -1 && lastBrace < fixed.length - 1) {
      fixed = fixed.substring(0, lastBrace + 1);
    }

    // Replace single quotes with double quotes (for property names and string values)
    // Be careful not to replace single quotes inside already double-quoted strings
    fixed = fixed.replace(/'/g, '"');

    // Fix unquoted property names
    fixed = fixed.replace(/(\{|\,)\s*(\w+)\s*\:/g, '$1"$2":');

    // Remove trailing commas before closing braces
    fixed = fixed.replace(/,\s*\}/g, '}');
    fixed = fixed.replace(/,\s*\]/g, ']');

    // Fix newlines in strings (replace with space)
    fixed = fixed.replace(/\n/g, ' ');

    // Fix multiple spaces
    fixed = fixed.replace(/\s+/g, ' ');

    // Remove leading/trailing whitespace
    fixed = fixed.trim();

    return fixed;
  }

  /**
   * Extract JSON from text with multiple fallback strategies
   */
  extractJson(text) {
    console.log('Raw response length:', text.length);
    console.log('Raw response preview:', text.substring(0, 200));

    // Strategy 1: Try to parse the whole text as JSON
    try {
      return JSON.parse(text);
    } catch (e1) {
      // Continue to next strategy
    }

    // Strategy 2: Find JSON in markdown code block
    const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      try {
        return JSON.parse(this.fixJsonString(codeBlockMatch[1]));
      } catch (e2) {
        // Continue
      }
      try {
        return JSON.parse(codeBlockMatch[1].trim());
      } catch (e2b) {
        // Continue
      }
    }

    // Strategy 3: Find content between { and }
    const braceMatch = text.match(/\{[\s\S]*\}/);
    if (braceMatch) {
      try {
        return JSON.parse(braceMatch[0]);
      } catch (e3) {
        // Continue
      }
      try {
        return JSON.parse(this.fixJsonString(braceMatch[0]));
      } catch (e3b) {
        // Continue
      }
    }

    // Strategy 4: Manual extraction of fields
    const headerMatch = text.match(/"?header"?\s*:\s*"([^"]+)"/);
    const explanationMatch = text.match(/"?explanation"?\s*:\s*"([^"]+)"/);
    const footnoteMatch = text.match(/"?footnote"?\s*:\s*"([^"]+)"/);

    if (headerMatch || explanationMatch) {
      return {
        header: headerMatch ? headerMatch[1].replace(/\\"/g, '"').replace(/\\n/g, ' ') : '',
        explanation: explanationMatch
          ? explanationMatch[1].replace(/\\"/g, '"').replace(/\\n/g, ' ')
          : '',
        footnote: footnoteMatch ? footnoteMatch[1].replace(/\\"/g, '"').replace(/\\n/g, ' ') : '',
      };
    }

    // Strategy 5: If all fails, use the whole text as explanation
    console.error('Could not parse JSON, using raw text');
    return {
      header: path.basename(this.currentFile || 'File'),
      explanation: text.substring(0, 500),
      footnote: '',
    };
  }

  async generateDocumentation(filepath, filetype, code) {
    if (!this.initialized || !this.session) {
      throw new Error('Model not initialized');
    }

    this.currentFile = filepath;
    console.log(`Explaining: ${path.basename(filepath)}`);

    // Limit code length
    const maxCodeLength = Math.floor(this.contextSize * 2);
    const truncatedCode = (code || '').slice(0, maxCodeLength);

    // Simplified prompt for better JSON compliance
    const prompt = `Analyze this code file and return a JSON object with "header", "explanation", and "footnote".

File: ${filepath}
Language: ${filetype || 'text'}

\`\`\`
${truncatedCode}
\`\`\`

Return ONLY the JSON object (no other text):
{"header":"Brief title","explanation":"What this file does","footnote":"Notes"}`;

    try {
      const startTime = Date.now();

      let response = await this.session.prompt(prompt, {
        temperature: this.temperature,
        maxTokens: this.maxTokens,
        topP: 0.9,
      });

      const duration = Date.now() - startTime;
      console.log(`  Done in ${duration}ms`);

      // Extract and parse JSON
      const data = this.extractJson(response);

      return {
        header: data.header || '',
        explanation: data.explanation || '',
        footnote: data.footnote || '',
      };
    } catch (error) {
      console.error('Generation failed:', error.message);

      // Return empty result instead of throwing
      return { header: '', explanation: '', footnote: '' };
    }
  }

  async testPrompt(text) {
    if (!this.initialized || !this.session) {
      throw new Error('Model not initialized');
    }
    return this.session.prompt(text, { temperature: 0, maxTokens: 50 });
  }

  static getAvailableModels() {
    const modelsDir = path.join(app.getPath('userData'), 'models');
    if (!fs.existsSync(modelsDir)) fs.mkdirSync(modelsDir, { recursive: true });

    try {
      return fs
        .readdirSync(modelsDir)
        .filter((f) => f.endsWith('.gguf'))
        .map((f) => ({
          name: f.replace('.gguf', ''),
          path: path.join(modelsDir, f),
          size: fs.statSync(path.join(modelsDir, f)).size,
        }));
    } catch {
      return [];
    }
  }

  static getRecommendedModels() {
    return [
      {
        name: 'Qwen2.5-Coder-1.5B',
        size: '~1GB',
        url: 'https://huggingface.co/Qwen/Qwen2.5-Coder-1.5B-Instruct-GGUF/resolve/main/qwen2.5-coder-1.5b-instruct-q4_k_m.gguf',
        description: 'Best for code explanations, fast and accurate',
      },
      {
        name: 'DeepSeek-Coder-1.3B',
        size: '~1GB',
        url: 'https://huggingface.co/deepseek-ai/deepseek-coder-1.3b-instruct-GGUF/resolve/main/deepseek-coder-1.3b-instruct.Q4_K_M.gguf',
        description: 'Multi-language code understanding',
      },
      {
        name: 'Phi-3-mini-4k',
        size: '~2GB',
        url: 'https://huggingface.co/microsoft/Phi-3-mini-4k-instruct-gguf/resolve/main/Phi-3-mini-4k-instruct-q4.gguf',
        description: 'Good general purpose + code model',
      },
    ];
  }
}

module.exports = LocalLLMService;
