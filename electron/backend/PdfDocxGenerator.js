// electron/backend/PdfDocxGenerator.js
const fs = require('fs');
const path = require('path');
const HtmlDocxGenerator = require('./HtmlDocxGenerator');

class PdfDocxGenerator {
    constructor() {
        this.htmlGenerator = new HtmlDocxGenerator();
    }

    /**
     * Generate PDF from HTML using Electron's built-in browser
     */
    async generatePdfFromHtml(mainWindow, htmlString, pdfPath) {
        return new Promise((resolve, reject) => {
            try {
                // Create a hidden BrowserWindow for PDF generation
                const { BrowserWindow } = require('electron');

                const pdfWindow = new BrowserWindow({
                    width: 1200,
                    height: 800,
                    show: false,
                    webPreferences: { nodeIntegration: false, contextIsolation: true },
                });

                // Load HTML content
                pdfWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlString)}`);

                pdfWindow.webContents.on('did-finish-load', async () => {
                    try {
                        // Generate PDF with white background
                        const pdfBuffer = await pdfWindow.webContents.printToPDF({
                            printBackground: true,
                            preferCSSPageSize: true,
                            margins: { top: 0.5, bottom: 0.5, left: 0.5, right: 0.5 },
                        });

                        // Save PDF
                        fs.writeFileSync(pdfPath, pdfBuffer);

                        // Close the hidden window
                        pdfWindow.close();

                        resolve(pdfPath);
                    } catch (err) {
                        pdfWindow.close();
                        reject(err);
                    }
                });

                pdfWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
                    pdfWindow.close();
                    reject(new Error(`Failed to load HTML: ${errorDescription}`));
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Generate documentation files
     */
    async generate(repo, sources, outputPath) {
        // Generate HTML
        const htmlPath = outputPath.replace(/\.docx$/, '.html');
        await this.htmlGenerator.generateHtmlFile(repo, sources, htmlPath);

        // Also generate PDF
        const pdfPath = outputPath.replace(/\.docx$/, '.pdf');
        const htmlString = this.htmlGenerator.generateHtml(repo, sources);

        // This requires the mainWindow reference from main.js
        // Pass it as parameter or store globally

        return {
            htmlPath,
            pdfPath: null, // Will be set if PDF generation succeeds
            message: 'HTML documentation generated. PDF requires main window reference.',
        };
    }
}

module.exports = PdfDocxGenerator;
