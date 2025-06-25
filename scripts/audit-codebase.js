#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Configuration
const SRC_DIR = path.join(__dirname, '..', 'src');
const COMPONENT_DIRS = {
  atoms: path.join(SRC_DIR, 'components', 'atoms'),
  molecules: path.join(SRC_DIR, 'components', 'molecules'),
  organisms: path.join(SRC_DIR, 'components', 'organisms'),
  layouts: path.join(SRC_DIR, 'components', 'layouts'),
  navigation: path.join(SRC_DIR, 'components', 'navigation'),
  providers: path.join(SRC_DIR, 'components', 'providers')
  // ui folder excluded from orphaned component analysis
};

const LARGE_FILE_THRESHOLD = 400;

// Results storage
const results = {
  atomicDesignIssues: [],
  orphanedComponents: new Set(),
  largeFiles: [],
  hardcodedStrings: [],
  componentUsage: new Map()
};

// Helper functions
function getAllFiles(dir, extensions = ['.tsx', '.ts']) {
  const files = [];
  
  function traverse(currentDir) {
    if (!fs.existsSync(currentDir)) return;
    
    const items = fs.readdirSync(currentDir);
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        traverse(fullPath);
      } else if (stat.isFile() && extensions.some(ext => item.endsWith(ext))) {
        files.push(fullPath);
      }
    }
  }
  
  traverse(dir);
  return files;
}

function countLines(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return content.split('\n').length;
  } catch {
    return 0;
  }
}

function extractComponentName(filePath) {
  const baseName = path.basename(filePath, path.extname(filePath));
  return baseName;
}

// Check atomic design structure
function checkAtomicDesign() {
  console.log('\n🔍 Checking Atomic Design Structure...\n');
  
  const appDir = path.join(SRC_DIR, 'app');
  const pages = getAllFiles(appDir).filter(f => f.endsWith('page.tsx'));
  
  pages.forEach(pagePath => {
    const content = fs.readFileSync(pagePath, 'utf8');
    const relativePath = path.relative(SRC_DIR, pagePath);
    const lineCount = content.split('\n').length;

    // Check for direct HTML elements in pages (should use components)
    const htmlElements = [
      /<(div|span|button|input|form|section|header|footer|nav|main|article|aside)[^>]*>/g
    ];
    
    let directHtmlCount = 0;
    htmlElements.forEach(regex => {
      const matches = content.match(regex) || [];
      directHtmlCount += matches.length;
    });
    
    if (directHtmlCount > 10) { // Threshold for too many direct HTML elements
      results.atomicDesignIssues.push({
        file: relativePath,
        issue: `High usage of direct HTML elements (${directHtmlCount}). Consider using atomic components.`,
        severity: 'high'
      });
    }

    // Check for imports from component directories
    const hasAtomImports = /from ['"]@\/components\/(atoms|molecules|organisms)/.test(content);
    if (!hasAtomImports && content.length > 200) {
      results.atomicDesignIssues.push({
        file: relativePath,
        issue: 'Page does not import any atomic design components',
        severity: 'medium'
      });
    }

    // NEW: Flag only if file is over 400 lines
    if (lineCount > 400) {
      results.atomicDesignIssues.push({
        file: relativePath,
        issue: `Page is very large (${lineCount} lines). Consider extracting to atomic components.`,
        severity: 'medium'
      });
    }

    // Count number of React hooks used
    const hookMatches = content.match(/use(State|Effect|Reducer|Callback|Memo|Ref|Context|ImperativeHandle|LayoutEffect|DebugValue)/g) || [];
    if (hookMatches.length > 3) {
      results.atomicDesignIssues.push({
        file: relativePath,
        issue: `Page uses many React hooks (${hookMatches.length}). Consider extracting logic to smaller components or hooks.`,
        severity: 'medium'
      });
    }

    // Count number of custom components used (capitalized JSX tags)
    const customComponentMatches = content.match(/<([A-Z][A-Za-z0-9]*)[\s/>]/g) || [];
    if (customComponentMatches.length > 10) {
      results.atomicDesignIssues.push({
        file: relativePath,
        issue: `Page uses many custom components in JSX (${customComponentMatches.length}). Consider splitting into smaller atomic components if needed.`,
        severity: 'medium'
      });
    }
  });
}

// Find component usage (recursive, graph-based)
function findComponentUsage() {
  console.log('\n🔍 Analyzing Component Usage (Recursive)...\n');  // 1. Gather all components and their file paths (excluding UI folder)
  const allComponents = new Map();
  Object.entries(COMPONENT_DIRS).forEach(([type, dir]) => {
    const files = getAllFiles(dir);
    files.forEach(file => {
      const componentName = extractComponentName(file);
      allComponents.set(componentName, {
        path: path.relative(SRC_DIR, file),
        absPath: file,
        type,
        used: false
      });
      results.componentUsage.set(componentName, 0);
    });
  });

  // 2. Build a dependency graph: componentName -> Set of componentNames it uses
  const dependencyGraph = new Map();
  allComponents.forEach((info, componentName) => {
    let deps = new Set();
    try {
      const content = fs.readFileSync(info.absPath, 'utf8');
      // Find imports from other components (atoms, molecules, organisms, layouts, navigation, ui, providers)
      Object.keys(COMPONENT_DIRS).forEach(dirType => {
        const importRegex = new RegExp(`from ['\"]@/components/${dirType}/([A-Za-z0-9_/]+)['\"]`, 'g');
        let match;
        while ((match = importRegex.exec(content)) !== null) {
          // Extract the imported component name (last part of the path)
          const importPath = match[1];
          const importedName = importPath.split('/').pop();
          if (importedName && allComponents.has(importedName)) {
            deps.add(importedName);
          }
        }
      });
      // Also check for direct JSX usage of other custom components
      allComponents.forEach((_, otherName) => {
        if (otherName !== componentName) {
          const jsxRegex = new RegExp(`<${otherName}[\s/>]`, 'g');
          if (jsxRegex.test(content)) {
            deps.add(otherName);
          }
        }
      });
    } catch {}
    dependencyGraph.set(componentName, deps);
  });

  // 3. Find all entry points (pages)
  const appDir = path.join(SRC_DIR, 'app');
  const pageFiles = getAllFiles(appDir).filter(f => f.endsWith('page.tsx'));

  // 4. For each page, find all components it uses (directly or indirectly)
  const visited = new Set();
  function visit(componentName) {
    if (visited.has(componentName)) return;
    visited.add(componentName);
    if (allComponents.has(componentName)) {
      allComponents.get(componentName).used = true;
      results.componentUsage.set(
        componentName,
        (results.componentUsage.get(componentName) || 0) + 1
      );
      // Recursively visit dependencies
      (dependencyGraph.get(componentName) || []).forEach(dep => visit(dep));
    }
  }  // Check pages AND all component files AND layout files for usage
  const allFilesToCheck = [...pageFiles];
    // Also add all component files as potential users of other components (including UI for scanning)
  Object.values(COMPONENT_DIRS).forEach(dir => {
    const componentFiles = getAllFiles(dir);
    allFilesToCheck.push(...componentFiles);
  });
  
  // Also include UI components in scanning (but not in orphaned analysis)
  const uiDir = path.join(SRC_DIR, 'components', 'ui');
  const uiFiles = getAllFiles(uiDir);
  allFilesToCheck.push(...uiFiles);

  // Also add layout files from the app directory
  const appLayoutFiles = getAllFiles(appDir).filter(f => f.endsWith('layout.tsx'));
  allFilesToCheck.push(...appLayoutFiles);

  allFilesToCheck.forEach(filePath => {
    let content = '';
    try { content = fs.readFileSync(filePath, 'utf8'); } catch {}
    // Find imported components from component dirs
    Object.keys(COMPONENT_DIRS).forEach(dirType => {
      const importRegex = new RegExp(`from ['\"]@/components/${dirType}/([A-Za-z0-9_/]+)['\"]`, 'g');
      let match;
      while ((match = importRegex.exec(content)) !== null) {
        // Extract the imported component name (last part of the path)
        const importPath = match[1];
        const importedName = importPath.split('/').pop();
        if (importedName && allComponents.has(importedName)) {
          visit(importedName);
        }
      }
    });
    // Also check for direct JSX usage of custom components
    allComponents.forEach((_, componentName) => {
      const jsxRegex = new RegExp(`<${componentName}[\\s/>]`, 'g');
      if (jsxRegex.test(content)) {
        visit(componentName);
      }
    });
  });
  // 5. Find orphaned components
  allComponents.forEach((info, componentName) => {
    if (!info.used && !componentName.includes('index')) {
      results.orphanedComponents.add({
        name: componentName,
        path: info.path,
        type: info.type
      });
    }
  });
}

// Check file sizes
function checkFileSizes() {
  console.log('\n🔍 Checking File Sizes...\n');
  
  const allFiles = getAllFiles(SRC_DIR);
  
  allFiles.forEach(file => {
    const lines = countLines(file);
    if (lines > LARGE_FILE_THRESHOLD) {
      results.largeFiles.push({
        path: path.relative(SRC_DIR, file),
        lines: lines
      });
    }
  });
  
  // Sort by size
  results.largeFiles.sort((a, b) => b.lines - a.lines);
}

// Find hardcoded strings
function findHardcodedStrings() {
  console.log('\n🔍 Finding Hardcoded Strings...\n');
  
  const componentFiles = getAllFiles(path.join(SRC_DIR, 'components'));
  const pageFiles = getAllFiles(path.join(SRC_DIR, 'app')).filter(f => f.endsWith('page.tsx'));
  const allFiles = [...componentFiles, ...pageFiles];
  
  const stringPatterns = [
    // Toast messages
    /toast\.(success|error|info|warning)\(['"`]([^'"`]+)['"`]\)/g,
    // Button/Link text
    />([A-Z][a-zA-Z\s]+)</g,
    // Placeholder text
    /placeholder=['"`]([^'"`]+)['"`]/g,
    // Label text
    /label=['"`]([^'"`]+)['"`]/g,
    // Title/description props
    /(title|description)=['"`]([^'"`]+)['"`]/g,
    // Direct string literals in JSX
    />\s*['"`]([^'"`]+)['"`]\s*</g,
    // Alert/error messages
    /(alert|error|message):\s*['"`]([^'"`]+)['"`]/g
  ];
  
  allFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const relativePath = path.relative(SRC_DIR, file);
    const lines = content.split('\n');
    
    const foundStrings = [];
    
    lines.forEach((line, index) => {
      // Skip import statements and comments
      if (line.trim().startsWith('import') || 
          line.trim().startsWith('//') || 
          line.trim().startsWith('*') ||
          line.trim().startsWith('/*')) {
        return;
      }
      
      stringPatterns.forEach(pattern => {
        let match;
        const regex = new RegExp(pattern);
        while ((match = regex.exec(line)) !== null) {
          const string = match[match.length - 1] || match[0];
          
          // Filter out common non-text strings
          if (string && 
              string.length > 2 && 
              !string.match(/^[a-z-_]+$/) && // Skip CSS classes, IDs
              !string.match(/^\d+$/) && // Skip numbers
              !string.match(/^(true|false|null|undefined)$/) && // Skip JS keywords
              !string.includes('{') && // Skip template literals
              !string.includes('(') && // Skip function calls
              !string.startsWith('/') && // Skip paths
              !string.match(/^(sm|md|lg|xl|2xl)$/) // Skip size variants
          ) {
            foundStrings.push({
              line: index + 1,
              text: string.trim(),
              context: line.trim()
            });
          }
        }
      });
    });
    
    if (foundStrings.length > 0) {
      results.hardcodedStrings.push({
        file: relativePath,
        strings: foundStrings
      });
    }
  });
}

// Generate report
function generateReport() {
  const reportPath = path.join(__dirname, '..', 'docs', 'AUDIT_REPORT.md');
  let report = `# JustPing Codebase Audit Report

Generated on: ${new Date().toISOString()}

## 📋 Summary

- **Atomic Design Issues**: ${results.atomicDesignIssues.length}
- **Orphaned Components**: ${results.orphanedComponents.size}
- **Large Files (>${LARGE_FILE_THRESHOLD} lines)**: ${results.largeFiles.length}
- **Files with Hardcoded Strings**: ${results.hardcodedStrings.length}

## 🏗️ Atomic Design Structure Issues

`;

  if (results.atomicDesignIssues.length === 0) {
    report += '*No atomic design issues found.*\n\n';
  } else {
    results.atomicDesignIssues.forEach(issue => {
      report += `### ${issue.file}\n`;
      report += `- **Issue**: ${issue.issue}\n`;
      report += `- **Severity**: ${issue.severity}\n\n`;
    });
  }

  report += `## 🔌 Orphaned Components

These components are not imported or used anywhere in the codebase:

`;
  if (results.orphanedComponents.size === 0) {
    report += '*No orphaned components found.*\n\n';
  } else {
    const orphanedArray = Array.from(results.orphanedComponents);
    const groupedByType = orphanedArray.reduce((acc, comp) => {
      if (!acc[comp.type]) acc[comp.type] = [];
      acc[comp.type].push(comp);
      return acc;
    }, {});
    
    Object.entries(groupedByType).forEach(([type, components]) => {
      report += `### ${type.charAt(0).toUpperCase() + type.slice(1)}\n\n`;
      components.forEach(comp => {
        report += `- **${comp.name}** - \`${comp.path}\`\n`;
      });
      report += '\n';
    });
  }

  report += `## 📏 Large Files (>${LARGE_FILE_THRESHOLD} lines)

`;

  if (results.largeFiles.length === 0) {
    report += '*No files exceed the threshold.*\n\n';
  } else {
    report += '| File | Lines |\n';
    report += '|------|-------|\n';
    results.largeFiles.forEach(file => {
      report += `| \`${file.path}\` | ${file.lines} |\n`;
    });
    report += '\n';
  }

  report += `## 🔤 Hardcoded Strings

Files containing hardcoded strings that should be moved to localization files:

`;

  if (results.hardcodedStrings.length === 0) {
    report += '*No hardcoded strings found.*\n\n';
  } else {
    results.hardcodedStrings.forEach(file => {
      report += `### ${file.file}\n\n`;
      report += `Found ${file.strings.length} hardcoded strings:\n\n`;
      
      file.strings.slice(0, 10).forEach(str => {
        report += `- Line ${str.line}: \`"${str.text}"\`\n`;
        report += `  Context: \`${str.context.substring(0, 80)}${str.context.length > 80 ? '...' : ''}\`\n\n`;
      });
      
      if (file.strings.length > 10) {
        report += `*... and ${file.strings.length - 10} more*\n\n`;
      }
    });
  }

  report += `## 📊 Component Usage Statistics

Top 10 most used components:

`;

  const sortedUsage = Array.from(results.componentUsage.entries())
    .filter(([_, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  if (sortedUsage.length === 0) {
    report += '*No component usage data available.*\n\n';
  } else {
    report += '| Component | Usage Count |\n';
    report += '|-----------|-------------|\n';
    sortedUsage.forEach(([component, count]) => {
      report += `| ${component} | ${count} |\n`;
    });
  }

  report += `\n## 🔧 Recommendations

1. **Atomic Design Compliance**: Review pages with high direct HTML usage and refactor to use atomic components.
2. **Remove Orphaned Components**: Delete unused components to reduce codebase complexity.
3. **Refactor Large Files**: Consider breaking down files over ${LARGE_FILE_THRESHOLD} lines into smaller, more manageable components.
4. **Internationalization**: Move hardcoded strings to localization files for better maintainability.
`;

  fs.writeFileSync(reportPath, report);
  console.log(`\n✅ Audit report generated: ${reportPath}\n`);
}

// Main analysis function
function analyze() {
  checkAtomicDesign();
  findComponentUsage();

  // Log results
  console.log('\n✅ Analysis Complete!');
  console.log('📋 Results:');
  console.log('--------------------');
  
  // Atomic design issues
  if (results.atomicDesignIssues.length > 0) {
    console.log('\n⚠️ Atomic Design Issues:');
    results.atomicDesignIssues.forEach(issue => {
      console.log(`- ${issue.file}: ${issue.issue} (Severity: ${issue.severity})`);
    });
  } else {
    console.log('\n✔️ No atomic design issues found.');
  }

  // Orphaned components
  if (results.orphanedComponents.size > 0) {
    console.log('\n⚠️ Orphaned Components (not used in any page):');
    results.orphanedComponents.forEach(component => {
      console.log(`- ${component}`);
    });
  } else {
    console.log('\n✔️ No orphaned components found.');
  }

  // Large files
  if (results.largeFiles.length > 0) {
    console.log('\n⚠️ Large Files (over 400 lines):');
    results.largeFiles.forEach(file => {
      console.log(`- ${file}`);
    });
  } else {
    console.log('\n✔️ No large files found.');
  }

  // Hardcoded strings
  if (results.hardcodedStrings.length > 0) {
    console.log('\n⚠️ Hardcoded Strings (consider i18n):');
    results.hardcodedStrings.forEach(file => {
      console.log(`- ${file}`);
    });
  } else {
    console.log('\n✔️ No hardcoded strings found.');
  }

  // Component usage
  console.log('\n📊 Component Usage (used in pages):');
  const sortedUsage = Array.from(results.componentUsage.entries()).sort((a, b) => b[1] - a[1]);
  sortedUsage.forEach(([component, count]) => {
    console.log(`- ${component}: ${count} time${count === 1 ? '' : 's'}`);
  });

  generateReport();
}

// Run analysis
analyze();