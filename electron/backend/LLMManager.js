const LocalLLMService = require('./LocalLLMService');
const GeminiService = require('./GeminiService');

class LLMManager {
  constructor() {
    this.provider = 'local'; // 'local' or 'gemini'
    this.localService = null;
    this.geminiService = null;
    this.initialized = false;
  }

  /**
   * Initialize with local model
   */
  async initLocal(modelPath) {
    console.log('Initializing local LLM...');
    this.localService = new LocalLLMService({ modelPath, context: 4096, threads: 4 });

    const success = await this.localService.initialize();
    if (success) {
      this.provider = 'local';
      this.initialized = true;
      console.log('✓ Local LLM ready');
      return true;
    }
    return false;
  }

  /**
   * Initialize with Gemini API
   */
  async initGemini(apiKey) {
    console.log('Initializing Gemini...');
    this.geminiService = new GeminiService(apiKey);

    const success = await this.geminiService.initialize();
    if (success) {
      this.provider = 'gemini';
      this.initialized = true;
      console.log('✓ Gemini ready');
      return true;
    }
    return false;
  }

  /**
   * Generate documentation using the active provider
   */
  async generateDocumentation(filepath, filetype, code) {
    if (!this.initialized) {
      throw new Error('No LLM provider initialized');
    }

    if (this.provider === 'local' && this.localService) {
      return this.localService.generateDocumentation(filepath, filetype, code);
    } else if (this.provider === 'gemini' && this.geminiService) {
      return this.geminiService.generateDocumentation(filepath, filetype, code);
    }

    throw new Error('No LLM provider configured');
  }

  /**
   * Get current provider info
   */
  getInfo() {
    return {
      provider: this.provider,
      initialized: this.initialized,
      model: this.provider === 'local' ? this.localService?.modelName : 'gemini',
    };
  }
}

module.exports = LLMManager;
