#!/usr/bin/env node

/**
 * JustPing Backend Project Documentation Generator
 * 
 * Generates comprehensive project structure documentation in markdown format
 * - Respects .gitignore rules
 * - Calculates lines of code per file
 * - Categorizes files by type
 * - Generates project statistics
 * - Focuses on Node.js/Express backend architecture
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Configuration
const OUTPUT_FILE = 'docs/PROJECT_STRUCTURE.md';
const CACHE_FILE = 'docs/.project-cache.json';
const IGNORED_DIRS = [
  'node_modules', '.git', '.next', '.github'
];

const IGNORED_FILES = [
  '.gitignore'
];

class BackendProjectAnalyzer {  constructor() {
    this.projectRoot = process.cwd();
    this.fileStats = {
      totalFiles: 0,
      totalLines: 0,
      categories: {},
      extensions: {},
      largestFiles: [],
      apiEndpoints: [],
      moduleComplexity: {}
    };
    this.fileCache = this.loadCache();
    this.currentFiles = new Set();
  }

  loadCache() {
    try {
      const cachePath = path.join(this.projectRoot, CACHE_FILE);
      if (fs.existsSync(cachePath)) {
        return JSON.parse(fs.readFileSync(cachePath, 'utf8'));
      }
    } catch (error) {
      console.warn('Could not load project cache:', error.message);
    }
    return { files: {}, lastGenerated: null };
  }
  saveCache() {
    try {
      const cachePath = path.join(this.projectRoot, CACHE_FILE);
      const cacheData = {
        files: {},
        lastGenerated: new Date().toISOString()
      };
      
      // Store file hashes for change detection
      this.currentFiles.forEach(filePath => {
        try {
          const fullPath = path.join(this.projectRoot, filePath);
          const content = fs.readFileSync(fullPath, 'utf8');
          cacheData.files[filePath] = crypto.createHash('md5').update(content).digest('hex');
        } catch (error) {
          // File might be binary or unreadable, skip
        }
      });
      
      fs.writeFileSync(cachePath, JSON.stringify(cacheData, null, 2));
    } catch (error) {
      console.warn('Could not save project cache:', error.message);
    }
  }

  shouldIgnore(filePath, relativePath) {
    const patterns = [...IGNORED_DIRS, ...IGNORED_FILES];
    
    for (const pattern of patterns) {
      if (this.matchesPattern(relativePath, pattern) || 
          this.matchesPattern(path.basename(filePath), pattern)) {
        return true;
      }
    }
    
    return false;
  }
  matchesPattern(str, pattern) {
    if (pattern.includes('*')) {
      // Convert glob pattern to regex
      const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$', 'i');
      return regex.test(str);
    }
    // Direct string match (case insensitive)
    return str.toLowerCase().includes(pattern.toLowerCase());
  }
  countLines(filePath) {
    try {
      const ext = path.extname(filePath).toLowerCase();
      
      // Binary files and assets should have 0 lines
      const binaryExtensions = [
        '.jpg', '.jpeg', '.png', '.gif', '.svg', '.ico', '.bmp', '.webp',
        '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
        '.zip', '.rar', '.tar', '.gz', '.7z',
        '.mp3', '.mp4', '.avi', '.mov', '.wav',
        '.exe', '.dll', '.so', '.dylib',
        '.ttf', '.otf', '.woff', '.woff2'
      ];
      
      if (binaryExtensions.includes(ext)) {
        return 0;
      }
      
      // Documentation files should have 0 lines for line counting purposes
      const docExtensions = ['.md', '.txt', '.rst', '.doc', '.docx'];
      if (docExtensions.includes(ext)) {
        return 0;
      }
      
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n').filter(line => line.trim() !== '').length;
      return lines;
    } catch (error) {
      return 0;
    }
  }
  analyzeApiStructure(filePath, relativePath, content) {
    // Analyze API endpoints from any route files (not just hardcoded paths)
    const fileName = path.basename(filePath);
    const isRouteFile = fileName.includes('route') || 
                       fileName.includes('router') || 
                       relativePath.includes('route') ||
                       content.includes('router.') ||
                       content.includes('app.get') ||
                       content.includes('app.post') ||
                       content.includes('app.put') ||
                       content.includes('app.delete');
    
    if (isRouteFile) {
      const routes = this.extractRoutes(content);
      this.fileStats.apiEndpoints.push(...routes.map(route => ({
        ...route,
        module: this.getModuleName(relativePath),
        file: relativePath
      })));
    }
  }

  extractRoutes(content) {
    const routes = [];
    
    // Match various router patterns
    const patterns = [
      /(?:router|app)\.(get|post|put|delete|patch)\s*\(['"`]([^'"`]+)['"`]/g,
      /\.route\(['"`]([^'"`]+)['"`]\)\s*\.(get|post|put|delete|patch)/g,
      /app\.(get|post|put|delete|patch)\s*\(['"`]([^'"`]+)['"`]/g
    ];
    
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const method = match[1] || match[2];
        const path = match[2] || match[1];
        
        if (method && path) {
          routes.push({
            method: method.toUpperCase(),
            path: path
          });
        }
      }
    }
    
    return routes;
  }
  getModuleName(relativePath) {
    const parts = relativePath.split('/');
    
    // For api/* structure
    if (parts[0] === 'api' && parts[1]) {
      return parts[1];
    }
    
    // For other structures, use the first meaningful folder
    if (parts.length > 1) {
      return parts[0];
    }
    
    // For files in root, use the filename without extension
    return path.basename(relativePath, path.extname(relativePath));
  }  getFileCategory(filePath, relativePath) {
    // Simplified - no categorization, just return file extension or 'Other'
    const ext = path.extname(filePath);
    return ext || 'Other';
  }
  analyzeFile(filePath, relativePath) {
    this.currentFiles.add(relativePath);
    
    const stats = fs.statSync(filePath);
    const ext = path.extname(filePath);
    const lines = this.countLines(filePath);
    const category = this.getFileCategory(filePath, relativePath);
    
    // Read content for additional analysis
    let content = '';
    try {
      content = fs.readFileSync(filePath, 'utf8');
      this.analyzeApiStructure(filePath, relativePath, content);
    } catch (error) {
      // Continue without content analysis
    }
    
    // Update statistics
    this.fileStats.totalFiles++;
    this.fileStats.totalLines += lines;
    
    // Category stats
    if (!this.fileStats.categories[category]) {
      this.fileStats.categories[category] = { files: 0, lines: 0, fileList: [] };
    }
    this.fileStats.categories[category].files++;
    this.fileStats.categories[category].lines += lines;
    this.fileStats.categories[category].fileList.push({
      path: relativePath,
      lines,
      size: stats.size,
      modified: stats.mtime
    });
    
    // Extension stats
    if (ext) {
      if (!this.fileStats.extensions[ext]) {
        this.fileStats.extensions[ext] = { files: 0, lines: 0 };
      }
      this.fileStats.extensions[ext].files++;
      this.fileStats.extensions[ext].lines += lines;
    }
    
    // Track largest files
    this.fileStats.largestFiles.push({
      path: relativePath,
      lines,
      size: stats.size,
      category
    });
    
    // Module complexity analysis
    const module = this.getModuleName(relativePath);
    if (!this.fileStats.moduleComplexity[module]) {
      this.fileStats.moduleComplexity[module] = { files: 0, lines: 0 };
    }
    this.fileStats.moduleComplexity[module].files++;
    this.fileStats.moduleComplexity[module].lines += lines;
    
    return {
      path: relativePath,
      lines,
      size: stats.size,
      category,
      extension: ext,
      modified: stats.mtime
    };
  }
  walkDirectory(dirPath = this.projectRoot, relativePath = '') {
    const files = [];
    
    try {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        const entryRelativePath = path.join(relativePath, entry.name).replace(/\\/g, '/');
        
        if (this.shouldIgnore(fullPath, entryRelativePath)) {
          continue;
        }
        
        if (entry.isDirectory()) {
          // Verify directory actually exists and is accessible
          try {
            fs.accessSync(fullPath, fs.constants.R_OK);
            const subFiles = this.walkDirectory(fullPath, entryRelativePath);
            files.push(...subFiles);
          } catch (error) {
            console.warn(`Skipping inaccessible directory: ${entryRelativePath}`);
          }
        } else if (entry.isFile()) {
          // Verify file actually exists and is accessible
          try {
            fs.accessSync(fullPath, fs.constants.R_OK);
            const fileInfo = this.analyzeFile(fullPath, entryRelativePath);
            files.push(fileInfo);
          } catch (error) {
            console.warn(`Skipping inaccessible file: ${entryRelativePath}`);
          }
        }
      }
    } catch (error) {
      console.warn(`Error reading directory ${dirPath}:`, error.message);
    }
    
    return files;
  }

  generateProjectTree(files) {
    const tree = {};
    
    files.forEach(file => {
      const parts = file.path.split('/');
      let current = tree;
      
      parts.forEach((part, index) => {
        if (index === parts.length - 1) {
          current[part] = {
            type: 'file',
            lines: file.lines,
            size: file.size,
            category: file.category
          };
        } else {
          if (!current[part]) {
            current[part] = { type: 'directory', children: {} };
          }
          current = current[part].children || current[part];
        }
      });
    });
    
    return tree;
  }

  renderTree(tree, indent = '', isLast = true) {
    let output = '';
    const entries = Object.entries(tree);
    
    entries.forEach(([name, info], index) => {
      const isLastEntry = index === entries.length - 1;
      const prefix = indent + (isLast ? '└── ' : '├── ');
      
      if (info.type === 'file') {
        const linesInfo = info.lines > 0 ? ` (${info.lines} lines)` : '';
        const icon = this.getFileIcon(name, info.category);
        output += `${prefix}${icon} ${name}${linesInfo}\n`;
      } else {
        output += `${prefix}📁 ${name}/\n`;
        if (info.children) {
          const newIndent = indent + (isLast ? '    ' : '│   ');
          output += this.renderTree(info.children, newIndent, isLastEntry);
        }
      }
    });
    
    return output;
  }

  getFileIcon(fileName, category) {
    if (fileName.includes('controller')) return '🎮';
    if (fileName.includes('route')) return '🛣️';
    if (fileName.includes('service')) return '⚙️';
    if (fileName.includes('middleware')) return '🔒';
    if (fileName.includes('schema')) return '📋';
    if (fileName.includes('model')) return '🗃️';
    if (fileName.includes('migration')) return '🔄';
    if (fileName.includes('config')) return '⚡';
    if (fileName.includes('test')) return '🧪';
    if (fileName.endsWith('.md')) return '📖';
    if (fileName.endsWith('.json')) return '📄';
    return '📄';
  }
  generateMarkdown(files) {
    this.fileStats.largestFiles.sort((a, b) => b.lines - a.lines);
    this.fileStats.largestFiles = this.fileStats.largestFiles.slice(0, 15);
    const tree = this.generateProjectTree(files);
    const now = new Date();
    
    // Detect changes
    const deletedFiles = Object.keys(this.fileCache.files || {}).filter(
      file => !this.currentFiles.has(file)
    );
    
    let changesSummary = '';
    if (deletedFiles.length > 0) {
      changesSummary += `\n> **Recent Changes**: ${deletedFiles.length} files removed since last generation\n`;
    }
    
    let markdown = `# JustPing Backend Project Structure Documentation

> Generated on ${now.toISOString().split('T')[0]} at ${now.toTimeString().split(' ')[0]}${changesSummary}

## 📊 Project Statistics

| Metric | Value |
|--------|-------|
| **Total Files** | ${this.fileStats.totalFiles.toLocaleString()} |
| **Total Lines of Code** | ${this.fileStats.totalLines.toLocaleString()} |
| **API Modules** | ${Object.keys(this.fileStats.moduleComplexity).length} |
| **API Endpoints Detected** | ${this.fileStats.apiEndpoints.length} |
| **Average Lines per File** | ${Math.round(this.fileStats.totalLines / this.fileStats.totalFiles)} |

## 🏗️ Architecture Overview

This is a Node.js/Express backend API with the following key architectural components:
- **Modular API Structure**: Organized by business domains (Agents, Auth, Contacts, etc.)
- **AgentsFlow System**: AI-powered conversation flow management
- **WhatsApp Integration**: Comprehensive messaging and webhook handling
- **Database Layer**: Knex.js with PostgreSQL migrations
- **Authentication**: Firebase Admin SDK integration
- **Background Processing**: Worker-based job processing

## 🏆 Top 15 Largest Files by Lines of Code

| File | Lines | Size (KB) | Category |
|------|-------|-----------|----------|
`;
    
    for (const file of this.fileStats.largestFiles) {
      const sizeKB = (file.size / 1024).toFixed(1);
      markdown += `| \`${file.path}\` | ${file.lines} | ${sizeKB} | ${file.category} |\n`;
    }

    // API Endpoints Summary
    if (this.fileStats.apiEndpoints.length > 0) {
      markdown += `\n## 🛣️ API Endpoints by Module\n\n`;
      
      const endpointsByModule = {};
      this.fileStats.apiEndpoints.forEach(endpoint => {
        if (!endpointsByModule[endpoint.module]) {
          endpointsByModule[endpoint.module] = [];
        }
        endpointsByModule[endpoint.module].push(endpoint);
      });

      for (const [module, endpoints] of Object.entries(endpointsByModule)) {
        markdown += `### ${module} Module (${endpoints.length} endpoints)\n\n`;
        endpoints.forEach(endpoint => {
          markdown += `- **${endpoint.method}** \`${endpoint.path}\`\n`;
        });
        markdown += '\n';
      }
    }

    // Module Complexity Analysis
    markdown += `\n## 📈 Module Complexity Analysis\n\n| Module | Files | Lines | Avg Lines/File |\n|--------|-------|-------|----------------|\n`;
    
    const sortedModules = Object.entries(this.fileStats.moduleComplexity)
      .sort(([,a], [,b]) => b.lines - a.lines);

    for (const [module, stats] of sortedModules) {
      const avgLines = Math.round(stats.lines / stats.files);
      markdown += `| **${module}** | ${stats.files} | ${stats.lines.toLocaleString()} | ${avgLines} |\n`;
    }    markdown += `\n## 🗂️ Project Structure Tree\n\n\`\`\`\njustping-backend/\n${this.renderTree(tree)}\`\`\`\n\n## 📄 File Extensions Summary\n\n| Extension | Files | Lines | Avg Lines/File |\n|-----------|-------|-------|----------------|\n`;

    const sortedExtensions = Object.entries(this.fileStats.extensions)
      .sort(([,a], [,b]) => b.lines - a.lines);

    for (const [ext, stats] of sortedExtensions) {
      const avgLines = Math.round(stats.lines / stats.files);
      markdown += `| \`${ext}\` | ${stats.files} | ${stats.lines.toLocaleString()} | ${avgLines} |\n`;
    }

    markdown += `\n## 🔧 Development Notes\n\n- **Main Entry Point**: \`bin/www\`\n- **Development Command**: \`npm run dev\`\n- **Database**: PostgreSQL with Knex.js migrations\n- **Key Dependencies**: Express.js, Firebase Admin, Axios, Knex\n- **AI Integration**: Custom AgentsFlow system for conversation management\n- **Authentication**: Firebase Admin SDK\n- **Background Jobs**: Contact worker processing\n\n`;
    
    // Normalize line endings and remove trailing whitespace
    markdown = markdown.replace(/\r\n/g, '\n').replace(/[ \t]+$/gm, '');
    
    return markdown;
  }

  cleanupOldFiles() {
    // Remove .bat and .ps1 files if they exist
    const filesToRemove = [
      'generate-docs.bat',
      'generate-docs.ps1'
    ];
    
    filesToRemove.forEach(file => {
      const filePath = path.join(this.projectRoot, file);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
          console.log(`🗑️  Removed old file: ${file}`);
        } catch (error) {
          console.warn(`Could not remove ${file}:`, error.message);
        }
      }
    });
  }

  run() {
    console.log('🔍 Analyzing JustPing backend project structure...');
    
    // Clean up old files first
    this.cleanupOldFiles();
    
    const files = this.walkDirectory();
    const markdown = this.generateMarkdown(files);
    
    // Ensure docs directory exists
    const docsDir = path.join(this.projectRoot, 'docs');
    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir, { recursive: true });
    }
      // Write the documentation with proper line endings
    const outputPath = path.join(this.projectRoot, OUTPUT_FILE);
    // On Windows, ensure consistent line endings
    const finalMarkdown = process.platform === 'win32' ? markdown.replace(/\n/g, '\r\n') : markdown;
    fs.writeFileSync(outputPath, finalMarkdown, 'utf8');
    
    // Save cache for next run
    this.saveCache();
    
    console.log('✅ Project documentation generated successfully!');
    console.log(`📄 Documentation saved to: ${OUTPUT_FILE}`);
    console.log(`📊 Analyzed ${this.fileStats.totalFiles} files with ${this.fileStats.totalLines.toLocaleString()} lines of code`);
    console.log(`🛣️ Found ${this.fileStats.apiEndpoints.length} API endpoints across ${Object.keys(this.fileStats.moduleComplexity).length} modules`);
  }
}

// Run the analyzer
if (require.main === module) {
  const analyzer = new BackendProjectAnalyzer();
  analyzer.run();
}

module.exports = BackendProjectAnalyzer;
