// electron/backend/DocxGenerator.js
const fs = require('fs');
const path = require('path');
const HtmlDocxGenerator = require('./HtmlDocxGenerator');

class DocxGenerator {
    constructor() {
        this.htmlGenerator = new HtmlDocxGenerator();
    }

    /**
     * Convert HTML string to DOCX buffer using html-docx-js
     * Falls back to simple conversion if html-docx-js fails
     */
    async htmlToDocx(htmlString) {
        try {
            // Try using html-docx-js for proper conversion
            const htmlDocx = require('html-docx-js');
            const converted = htmlDocx.asBlob(htmlString);

            // Convert Blob to Buffer
            const arrayBuffer = await converted.arrayBuffer();
            return Buffer.from(arrayBuffer);
        } catch (error) {
            console.warn('html-docx-js failed, using fallback:', error.message);
            return this.fallbackHtmlToDocx(htmlString);
        }
    }

    /**
     * Fallback: Create a simple DOCX with embedded HTML
     * Uses the docx package to create a basic structure
     */
    async fallbackHtmlToDocx(htmlString) {
        const { Document, Packer, Paragraph, TextRun, HeadingLevel, PageBreak } = require('docx');

        // This is a last resort - save HTML separately and create a reference
        console.warn('Using fallback DOCX generation - HTML file will be saved separately');

        const doc = new Document({
            sections: [
                {
                    children: [
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: 'Full documentation has been saved as HTML. Please open the HTML file for proper formatting.',
                                    size: 24,
                                    color: '666666',
                                }),
                            ],
                        }),
                    ],
                },
            ],
        });

        return await Packer.toBuffer(doc);
    }

    /**
     * Main generation method
     * Generates both HTML and DOCX, returns both paths
     */
    async generate(repo, sources, outputPath) {
        console.log(`Generating documentation for: ${repo.name}`);

        // Generate HTML first
        const htmlPath = outputPath.replace(/\.docx$/, '.html');
        await this.htmlGenerator.generateHtmlFile(repo, sources, htmlPath);

        // Generate HTML string
        const htmlString = this.htmlGenerator.generateHtml(repo, sources);

        // Try to convert to DOCX
        let buffer;
        try {
            buffer = await this.htmlToDocx(htmlString);
        } catch (error) {
            console.error('DOCX conversion failed:', error);
            // Save HTML as fallback
            const newPath = outputPath.replace(/\.docx$/, '.html');
            fs.writeFileSync(newPath, htmlString, 'utf8');
            return {
                docxPath: null,
                htmlPath: newPath,
                error: 'DOCX conversion failed, HTML saved instead',
            };
        }

        // Save DOCX
        const dir = path.dirname(outputPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(outputPath, buffer);

        return { docxPath: outputPath, htmlPath: htmlPath };
    }
}

module.exports = DocxGenerator;
