const fs = require('fs');
const path = require('path');

// Known binary file extensions
const BINARY_EXTENSIONS = new Set([
  'png',
  'jpg',
  'jpeg',
  'gif',
  'bmp',
  'ico',
  'webp',
  'tiff',
  'svg',
  'mp3',
  'wav',
  'ogg',
  'flac',
  'mp4',
  'avi',
  'mov',
  'mkv',
  'webm',
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
  'bz2',
  'xz',
  'exe',
  'dll',
  'so',
  'dylib',
  'bin',
  'ttf',
  'otf',
  'woff',
  'woff2',
  'eot',
  'class',
  'pyc',
  'pyo',
  'o',
  'obj',
  'db',
  'sqlite',
  'sqlite3',
  'wasm',
  'map',
]);

/**
 * Check if a file is text by extension and content sampling
 */
function isTextFile(filePath) {
  try {
    // Check extension first
    const ext = path.extname(filePath).slice(1).toLowerCase();
    if (BINARY_EXTENSIONS.has(ext)) {
      return false;
    }

    // Check file size (skip files larger than 10MB)
    const stats = fs.statSync(filePath);
    if (stats.size > 10 * 1024 * 1024) {
      return false;
    }
    if (stats.size === 0) {
      return false;
    }

    // Read first 512 bytes and check for null bytes
    const buffer = Buffer.alloc(512);
    const fd = fs.openSync(filePath, 'r');
    const bytesRead = fs.readSync(fd, buffer, 0, 512, 0);
    fs.closeSync(fd);

    for (let i = 0; i < bytesRead; i++) {
      if (buffer[i] === 0) {
        return false;
      }
    }

    return true;
  } catch (e) {
    console.warn(`Error checking file ${filePath}:`, e.message);
    return false;
  }
}

/**
 * Recursively walk a directory, returning all file paths
 */
function walkDirectory(dir, ignoreNames = []) {
  const files = [];
  const ignoreSet = new Set(ignoreNames);

  function walk(current) {
    try {
      const entries = fs.readdirSync(current, { withFileTypes: true });

      for (const entry of entries) {
        // Skip ignored directories and files
        if (ignoreSet.has(entry.name)) continue;

        // Skip hidden files/folders (starting with .) except .gitignore etc
        if (entry.name.startsWith('.') && entry.name !== '.gitignore' && entry.name !== '.env') {
          continue;
        }

        const fullPath = path.join(current, entry.name);

        try {
          if (entry.isDirectory()) {
            walk(fullPath);
          } else if (entry.isFile()) {
            files.push(fullPath);
          }
        } catch (entryError) {
          console.warn(`Cannot access ${fullPath}:`, entryError.message);
        }
      }
    } catch (dirError) {
      console.warn(`Cannot read directory ${current}:`, dirError.message);
    }
  }

  walk(dir);
  return files;
}

module.exports = { isTextFile, walkDirectory };
