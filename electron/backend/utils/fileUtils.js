const fs = require('fs');
const path = require('path');

// Quick binary check: known binary extensions and null byte detection
const BINARY_EXTENSIONS = new Set([
    'png',
    'jpg',
    'jpeg',
    'gif',
    'bmp',
    'ico',
    'webp',
    'tiff',
    'mp3',
    'wav',
    'ogg',
    'flac',
    'mp4',
    'avi',
    'mov',
    'mkv',
    'pdf',
    'doc',
    'docx',
    'xls',
    'xlsx',
    'ppt',
    'pptx',
    'zip',
    'tar',
    'gz',
    'rar',
    '7z',
    'exe',
    'dll',
    'so',
    'dylib',
    'ttf',
    'otf',
    'woff',
    'woff2',
    'eot',
]);

function isTextFile(filePath) {
    const ext = path.extname(filePath).slice(1).toLowerCase();
    if (BINARY_EXTENSIONS.has(ext)) return false;
    // Unknown extension: read first 512 bytes and check for null bytes
    try {
        const buffer = Buffer.alloc(512);
        const fd = fs.openSync(filePath, 'r');
        const bytesRead = fs.readSync(fd, buffer, 0, 512, 0);
        fs.closeSync(fd);
        for (let i = 0; i < bytesRead; i++) {
            if (buffer[i] === 0) return false;
        }
    } catch (e) {
        return false;
    }
    return true;
}

function walkDirectory(dir, ignoreNames = []) {
    const files = [];
    const ignoreSet = new Set(ignoreNames);

    function walk(current) {
        const entries = fs.readdirSync(current, { withFileTypes: true });
        for (const entry of entries) {
            if (ignoreSet.has(entry.name)) continue;
            const fullPath = path.join(current, entry.name);
            if (entry.isDirectory()) {
                walk(fullPath);
            } else if (entry.isFile()) {
                files.push(fullPath);
            }
        }
    }
    walk(dir);
    return files;
}

function sanitizeForXml(text) {
    if (!text) return '';

    // Remove invalid XML characters
    return String(text)
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '')
        .replace(/\uFFFD/g, '?')
        .replace(/\u0000/g, '');
}

module.exports = { isTextFile, walkDirectory, sanitizeForXml };
