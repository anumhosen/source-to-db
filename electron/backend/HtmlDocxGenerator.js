// electron/backend/HtmlDocxGenerator.js
const fs = require('fs');
const path = require('path');
const hljs = require('highlight.js');

class HtmlDocxGenerator {
    constructor() {
        // CSS for white-themed documentation
        this.styles = `
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333333;
          background: #ffffff;
          padding: 40px 60px;
          max-width: 1200px;
          margin: 0 auto;
        }
        
        /* Title Page */
        .title-page {
          text-align: center;
          padding: 100px 0;
          page-break-after: always;
        }
        
        .title-page h1 {
          font-size: 36px;
          color: #1a1a1a;
          margin-bottom: 20px;
          font-weight: 700;
        }
        
        .title-page .meta {
          font-size: 16px;
          color: #666666;
          margin-bottom: 10px;
        }
        
        /* Table of Contents */
        .toc {
          page-break-after: always;
          margin-bottom: 40px;
        }
        
        .toc h2 {
          font-size: 28px;
          color: #1a1a1a;
          border-bottom: 2px solid #e0e0e0;
          padding-bottom: 10px;
          margin-bottom: 20px;
        }
        
        .toc-item {
          padding: 8px 0;
          border-bottom: 1px dotted #e0e0e0;
          font-size: 15px;
          color: #444444;
        }
        
        .toc-item .number {
          color: #999999;
          margin-right: 10px;
        }
        
        /* File Sections */
        .file-section {
          page-break-before: always;
          margin-bottom: 40px;
        }
        
        .file-section:first-of-type {
          page-break-before: auto;
        }
        
        .file-header {
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 3px solid #2b6cb0;
        }
        
        .file-header h2 {
          font-size: 28px;
          color: #1a1a1a;
          margin-bottom: 8px;
        }
        
        .file-path {
          font-size: 14px;
          color: #666666;
          font-family: 'Consolas', 'Monaco', monospace;
          background: #f0f0f0;
          padding: 4px 12px;
          border-radius: 4px;
          display: inline-block;
        }
        
        /* Overview Section */
        .overview-section {
          margin-bottom: 25px;
        }
        
        .overview-section h3 {
          font-size: 20px;
          color: #2b6cb0;
          margin-bottom: 12px;
          font-weight: 600;
        }
        
        .overview-section p {
          font-size: 15px;
          color: #444444;
          margin-bottom: 12px;
          text-align: justify;
        }
        
        /* Code Block */
        .code-section {
          margin-bottom: 25px;
        }
        
        .code-section h3 {
          font-size: 20px;
          color: #2b6cb0;
          margin-bottom: 12px;
          font-weight: 600;
        }
        
        .code-info {
          font-size: 13px;
          color: #888888;
          margin-bottom: 8px;
          font-style: italic;
        }
        
        .code-block {
          background: #ffffff;
          border: 1px solid #e0e0e0;
          border-radius: 6px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }
        
        .code-header {
          background: #f8f9fa;
          padding: 8px 16px;
          border-bottom: 1px solid #e0e0e0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 13px;
        }
        
        .code-language {
          color: #666666;
          font-weight: 600;
          text-transform: uppercase;
        }
        
        .code-line-count {
          color: #999999;
        }
        
        .code-content {
          padding: 16px;
          overflow-x: auto;
          background: #ffffff;
        }
        
        .code-content pre {
          margin: 0;
          font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
          font-size: 13px;
          line-height: 1.5;
          white-space: pre-wrap;
          word-wrap: break-word;
          color: #333333;
          background: #ffffff;
        }
        
        .code-content code {
          font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
          font-size: 13px;
          line-height: 1.5;
          color: #333333;
          background: transparent;
        }
        
        /* Syntax Highlighting - Light Theme */
        .hljs { background: #ffffff; color: #333333; }
        .hljs-keyword { color: #0000ff; font-weight: bold; }
        .hljs-string { color: #a31515; }
        .hljs-comment { color: #008000; font-style: italic; }
        .hljs-number { color: #098658; }
        .hljs-title { color: #795e26; }
        .hljs-type { color: #267f99; }
        .hljs-literal { color: #0000ff; }
        .hljs-built_in { color: #0070c1; }
        .hljs-attr { color: #0451a5; }
        .hljs-params { color: #333333; }
        .hljs-function { color: #795e26; }
        .hljs-class { color: #267f99; }
        .hljs-regexp { color: #811f3f; }
        
        /* Footnotes Section */
        .footnotes-section {
          margin-top: 25px;
          padding: 20px;
          background: #f8f9fa;
          border-left: 4px solid #2b6cb0;
          border-radius: 4px;
        }
        
        .footnotes-section h3 {
          font-size: 20px;
          color: #2b6cb0;
          margin-bottom: 12px;
          font-weight: 600;
        }
        
        .footnotes-section ul {
          list-style: none;
          padding: 0;
        }
        
        .footnotes-section li {
          font-size: 14px;
          color: #555555;
          padding: 6px 0;
          padding-left: 20px;
          position: relative;
        }
        
        .footnotes-section li:before {
          content: "•";
          position: absolute;
          left: 0;
          color: #2b6cb0;
          font-weight: bold;
        }
        
        /* Error notice */
        .error-notice {
          padding: 16px;
          background: #fff3f3;
          border-left: 4px solid #dc3545;
          color: #dc3545;
          margin: 20px 0;
          border-radius: 4px;
          font-size: 14px;
        }
        
        /* Print styles */
        @media print {
          body {
            padding: 20px 30px;
          }
          
          .file-section {
            page-break-before: always;
          }
          
          .code-content {
            max-height: none;
          }
        }
      </style>
    `;
    }

    /**
     * Sanitize text for HTML
     */
    escapeHtml(text) {
        if (!text) return '';
        const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
        return String(text).replace(/[&<>"']/g, (m) => map[m]);
    }

    /**
     * Highlight code with highlight.js - light theme
     */
    highlightCode(code, language) {
        if (!code) return '';

        try {
            if (language && hljs.getLanguage(language)) {
                const result = hljs.highlight(code, { language, ignoreIllegals: true });
                return result.value;
            } else {
                // Auto-detect language
                const result = hljs.highlightAuto(code);
                return result.value;
            }
        } catch (e) {
            return this.escapeHtml(code);
        }
    }

    /**
     * Generate HTML documentation
     */
    generateHtml(repo, sources) {
        let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.escapeHtml(repo.name)} - Documentation</title>
  ${this.styles}
</head>
<body>`;

        // Title Page
        html += `
  <div class="title-page">
    <h1>${this.escapeHtml(repo.name)}</h1>
    <div class="meta">Version: ${this.escapeHtml(repo.version)}</div>
    <div class="meta">Source: ${this.escapeHtml(repo.source)}</div>
    <div class="meta">Generated: ${new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    })}</div>
  </div>`;

        // Table of Contents
        html += `
  <div class="toc">
    <h2>Table of Contents</h2>`;

        sources.forEach((src, index) => {
            const title = src.header || src.filename;
            html += `
    <div class="toc-item">
      <span class="number">${index + 1}.</span>${this.escapeHtml(title)}
    </div>`;
        });

        html += `
  </div>`;

        // File Sections
        sources.forEach((src, index) => {
            try {
                const title = src.header || src.filename;

                html += `
  <div class="file-section">
    <div class="file-header">
      <h2>${index + 1}. ${this.escapeHtml(title)}</h2>
      <div class="file-path">${this.escapeHtml(src.filepath)}</div>
    </div>`;

                // Explanation
                if (src.explanation && src.explanation.trim()) {
                    html += `
    <div class="overview-section">
      <h3>Overview</h3>`;

                    const paragraphs = src.explanation.split('\n').filter((p) => p.trim());
                    paragraphs.forEach((p) => {
                        html += `
      <p>${this.escapeHtml(p.trim())}</p>`;
                    });

                    html += `
    </div>`;
                }

                // Code Block
                if (src.code && src.code.trim()) {
                    const highlightedCode = this.highlightCode(src.code, src.filetype);
                    const lineCount = src.code.split('\n').length;

                    html += `
    <div class="code-section">
      <h3>Source Code</h3>
      <div class="code-info">Language: ${(src.filetype || 'plain text').toUpperCase()} | Lines: ${lineCount}</div>
      <div class="code-block">
        <div class="code-header">
          <span class="code-language">${(src.filetype || 'text').toUpperCase()}</span>
          <span class="code-line-count">${lineCount} lines</span>
        </div>
        <div class="code-content">
          <pre><code class="language-${src.filetype || 'text'}">${highlightedCode}</code></pre>
        </div>
      </div>
    </div>`;
                }

                // Footnotes
                if (src.footnote && src.footnote.trim()) {
                    html += `
    <div class="footnotes-section">
      <h3>Notes &amp; Dependencies</h3>
      <ul>`;

                    const notes = src.footnote.split('\n').filter((n) => n.trim());
                    notes.forEach((note) => {
                        html += `
        <li>${this.escapeHtml(note.trim())}</li>`;
                    });

                    html += `
      </ul>
    </div>`;
                }

                html += `
  </div>`;
            } catch (fileError) {
                console.error(`Error processing ${src.filename}:`, fileError);
                html += `
  <div class="error-notice">
    ⚠ Error processing file: ${this.escapeHtml(src.filename)} - ${this.escapeHtml(fileError.message)}
  </div>`;
            }
        });

        html += `
</body>
</html>`;

        return html;
    }

    /**
     * Generate and save HTML documentation
     */
    async generateHtmlFile(repo, sources, outputPath) {
        console.log(`Generating HTML documentation for repo: ${repo.name}`);

        const html = this.generateHtml(repo, sources);

        // Ensure directory exists
        const dir = path.dirname(outputPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        fs.writeFileSync(outputPath, html, 'utf8');
        console.log(`HTML saved to: ${outputPath}`);

        return outputPath;
    }
}

module.exports = HtmlDocxGenerator;
