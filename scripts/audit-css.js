#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Configuration
const SRC_DIR = path.join(__dirname, '..', 'src');
const GLOBALS_CSS_PATH = path.join(SRC_DIR, 'app', 'globals.css');

// Results storage
const results = {
  definedClasses: new Set(),
  usedClasses: new Set(),
  unusedClasses: new Set(),
  undefinedClasses: new Set(), // Classes used in code but not defined in CSS
  cssVariables: {
    defined: new Set(),
    used: new Set(),
    unused: new Set()
  },
  tailwindClasses: new Set(),
  customUtilities: new Map()
};

// Helper functions
function getAllFiles(dir, extensions = ['.tsx', '.ts', '.jsx', '.js']) {
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

// Parse globals.css to extract defined classes and CSS variables
function parseGlobalsCss() {
  console.log('\n🔍 Parsing globals.css...\n');
  
  const cssContent = fs.readFileSync(GLOBALS_CSS_PATH, 'utf8');
  
  // Extract CSS classes
  const classRegex = /\.([a-zA-Z0-9_-]+)(?:\s*{|[:\s,>+~\[])/g;
  let match;
  while ((match = classRegex.exec(cssContent)) !== null) {
    const className = match[1];
    // Filter out pseudo-classes and common Tailwind utilities
    if (!className.match(/^(hover|focus|active|disabled|before|after|first|last|odd|even|dark)$/)) {
      results.definedClasses.add(className);
    }
  }
  
  // Extract CSS variables
  const varDefinitionRegex = /--([a-zA-Z0-9-]+):\s*[^;]+;/g;
  while ((match = varDefinitionRegex.exec(cssContent)) !== null) {
    results.cssVariables.defined.add(match[1]);
  }
  
  // Extract custom utilities from @layer utilities
  const layerUtilitiesMatch = cssContent.match(/@layer\s+utilities\s*{([\s\S]*?)}\s*(?:\/\*|@|$)/);
  if (layerUtilitiesMatch) {
    const utilitiesContent = layerUtilitiesMatch[1];
    const utilityClassRegex = /\.([a-zA-Z0-9_-]+)\s*{([^}]+)}/g;
    while ((match = utilityClassRegex.exec(utilitiesContent)) !== null) {
      results.customUtilities.set(match[1], match[2].trim());
    }
  }
  
  // Extract animations and keyframes
  const keyframesRegex = /@keyframes\s+([a-zA-Z0-9_-]+)/g;
  while ((match = keyframesRegex.exec(cssContent)) !== null) {
    // Store animations as they might be referenced
    results.definedClasses.add(`animate-${match[1]}`);
  }
  
  console.log(`Found ${results.definedClasses.size} CSS classes`);
  console.log(`Found ${results.cssVariables.defined.size} CSS variables`);
  console.log(`Found ${results.customUtilities.size} custom utilities`);
}

// Extract classes used in TypeScript/JavaScript files
function extractUsedClasses() {
  console.log('\n🔍 Scanning for used CSS classes...\n');
  
  const allFiles = getAllFiles(SRC_DIR);
  
  // Patterns to match className usage
  const classNamePatterns = [
    // className="..."
    /className\s*=\s*["'`]([^"'`]+)["'`]/g,
    // className={`...`}
    /className\s*=\s*{[`]([^`]+)[`]}/g,
    // className={'...'} or className={"..."}
    /className\s*=\s*{["']([^"']+)["']}/g,
    // cn('...', '...')
    /cn\s*\(\s*["'`]([^"'`]+)["'`]/g,
    // clsx('...', '...')
    /clsx\s*\(\s*["'`]([^"'`]+)["'`]/g,
    // Dynamic className with template literals
    /className\s*=\s*{`([^`]+)`}/g
  ];
  
  // Patterns for CSS variable usage
  const cssVarPatterns = [
    /var\(--([a-zA-Z0-9-]+)\)/g,
    /\$\{.*?--([a-zA-Z0-9-]+).*?\}/g
  ];
  
  allFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    
    // Extract className usage
    classNamePatterns.forEach(pattern => {
      const regex = new RegExp(pattern);
      let match;
      while ((match = regex.exec(content)) !== null) {
        const classString = match[1];
        
        // Split by spaces to get individual classes
        const classes = classString.split(/\s+/).filter(c => c.length > 0);
        
        classes.forEach(cls => {
          // Clean up the class name
          cls = cls.trim();
          
          // Skip template literal expressions
          if (cls.includes('${') || cls.includes('{') || cls.includes('}')) {
            return;
          }
          
          // Handle conditional classes (e.g., hover:bg-gray-100)
          if (cls.includes(':')) {
            const parts = cls.split(':');
            const actualClass = parts[parts.length - 1];
            
            // Check if it's a Tailwind utility
            if (parts.length > 1) {
              results.tailwindClasses.add(cls);
            }
            
            // Also check the base class
            if (results.definedClasses.has(actualClass) || results.customUtilities.has(actualClass)) {
              results.usedClasses.add(actualClass);
            }
          } else {
            // Regular class
            if (results.definedClasses.has(cls) || results.customUtilities.has(cls)) {
              results.usedClasses.add(cls);
            } else if (!cls.match(/^[a-z]/) || cls.includes('-')) {
              // Track potentially undefined custom classes
              if (!isTailwindClass(cls)) {
                results.undefinedClasses.add(cls);
              }
            }
          }
        });
      }
    });
    
    // Extract CSS variable usage
    cssVarPatterns.forEach(pattern => {
      const regex = new RegExp(pattern);
      let match;
      while ((match = regex.exec(content)) !== null) {
        const varName = match[1];
        if (results.cssVariables.defined.has(varName)) {
          results.cssVariables.used.add(varName);
        }
      }
    });
  });
  
  console.log(`Found ${results.usedClasses.size} used CSS classes`);
  console.log(`Found ${results.cssVariables.used.size} used CSS variables`);
}

// Check if a class is likely a Tailwind utility class
function isTailwindClass(className) {
  // Common Tailwind patterns
  const tailwindPatterns = [
    /^(m|p|w|h|text|bg|border|flex|grid|gap|space|rounded|shadow|opacity|z|inset|top|right|bottom|left)-/,
    /^(block|inline|flex|grid|table|hidden|visible|static|fixed|absolute|relative|sticky)$/,
    /^(items|justify|content|self|place)-/,
    /^(font|leading|tracking|decoration)-/,
    /^(transition|duration|ease|delay|animate)-/,
    /^(hover:|focus:|active:|disabled:|dark:|sm:|md:|lg:|xl:|2xl:)/,
    /^(min-|max-)/,
    /^(col-|row-)/,
    /^(overflow|whitespace|break)-/,
    /^(ring|outline|backdrop|filter|blur)-/,
    /^(scale|rotate|translate|skew|origin)-/,
    /^(fill|stroke|object)-/,
    /^(cursor|select|resize|appearance|pointer-events)-/,
    /^sr-only$/,
    /^not-sr-only$/,
    /^(group|peer)(-|$)/
  ];
  
  return tailwindPatterns.some(pattern => pattern.test(className));
}

// Find unused classes and variables
function findUnused() {
  console.log('\n🔍 Analyzing usage...\n');
  
  // Find unused classes
  results.definedClasses.forEach(cls => {
    if (!results.usedClasses.has(cls)) {
      results.unusedClasses.add(cls);
    }
  });
  
  // Find unused custom utilities
  results.customUtilities.forEach((_, cls) => {
    if (!results.usedClasses.has(cls)) {
      results.unusedClasses.add(cls);
    }
  });
  
  // Find unused CSS variables
  results.cssVariables.defined.forEach(varName => {
    if (!results.cssVariables.used.has(varName)) {
      results.cssVariables.unused.add(varName);
    }
  });
}

// Generate detailed report
function generateReport() {
  const reportPath = path.join(__dirname, '..', 'docs', 'CSS_AUDIT_REPORT.md');
  
  let report = `# CSS Audit Report

Generated on: ${new Date().toISOString()}

## 📊 Summary

- **Total CSS Classes Defined**: ${results.definedClasses.size + results.customUtilities.size}
- **Total CSS Classes Used**: ${results.usedClasses.size}
- **Unused CSS Classes**: ${results.unusedClasses.size}
- **Undefined Classes Used**: ${results.undefinedClasses.size}
- **CSS Variables Defined**: ${results.cssVariables.defined.size}
- **CSS Variables Used**: ${results.cssVariables.used.size}
- **Unused CSS Variables**: ${results.cssVariables.unused.size}

## 🚫 Unused CSS Classes

The following classes are defined in globals.css but not used anywhere in the codebase:

`;

  if (results.unusedClasses.size === 0) {
    report += '*All defined CSS classes are being used.*\n\n';
  } else {
    const sortedUnused = Array.from(results.unusedClasses).sort();
    
    // Group by prefix for better organization
    const grouped = {};
    sortedUnused.forEach(cls => {
      const prefix = cls.split('-')[0];
      if (!grouped[prefix]) grouped[prefix] = [];
      grouped[prefix].push(cls);
    });
    
    Object.entries(grouped).forEach(([prefix, classes]) => {
      report += `### ${prefix} classes\n\n`;
      classes.forEach(cls => {
        report += `- \`.${cls}\`\n`;
      });
      report += '\n';
    });
  }

  report += `## 🚫 Unused CSS Variables

The following CSS variables are defined but not used:

`;

  if (results.cssVariables.unused.size === 0) {
    report += '*All defined CSS variables are being used.*\n\n';
  } else {
    const sortedUnusedVars = Array.from(results.cssVariables.unused).sort();
    sortedUnusedVars.forEach(varName => {
      report += `- \`--${varName}\`\n`;
    });
    report += '\n';
  }

  report += `## ❓ Undefined Classes

The following classes are used in the code but not defined in globals.css (excluding Tailwind utilities):

`;

  if (results.undefinedClasses.size === 0) {
    report += '*No undefined custom classes found.*\n\n';
  } else {
    const sortedUndefined = Array.from(results.undefinedClasses)
      .filter(cls => !isTailwindClass(cls) && !cls.includes('undefined'))
      .sort();
    
    if (sortedUndefined.length === 0) {
      report += '*No undefined custom classes found.*\n\n';
    } else {
      sortedUndefined.forEach(cls => {
        report += `- \`.${cls}\`\n`;
      });
      report += '\n';
    }
  }

  report += `## 📋 Custom Utilities Analysis

### Defined Custom Utilities
`;

  if (results.customUtilities.size === 0) {
    report += '*No custom utilities defined.*\n\n';
  } else {
    const used = [];
    const unused = [];
    
    results.customUtilities.forEach((styles, cls) => {
      if (results.usedClasses.has(cls)) {
        used.push({ cls, styles });
      } else {
        unused.push({ cls, styles });
      }
    });
    
    if (used.length > 0) {
      report += '\n#### ✅ Used Utilities\n\n';
      used.forEach(({ cls, styles }) => {
        report += `- \`.${cls}\` - \`${styles.substring(0, 50)}${styles.length > 50 ? '...' : ''}\`\n`;
      });
    }
    
    if (unused.length > 0) {
      report += '\n#### ❌ Unused Utilities\n\n';
      unused.forEach(({ cls, styles }) => {
        report += `- \`.${cls}\` - \`${styles.substring(0, 50)}${styles.length > 50 ? '...' : ''}\`\n`;
      });
    }
  }

  report += `\n## 🎯 Recommendations

1. **Remove Unused Classes**: Delete the unused CSS classes from globals.css to reduce file size.
2. **Remove Unused Variables**: Clean up unused CSS variables to improve maintainability.
3. **Document Custom Classes**: Consider adding comments to explain the purpose of custom utility classes.
4. **Use Tailwind**: For undefined classes, consider if existing Tailwind utilities can replace them.
5. **Regular Audits**: Run this audit regularly to keep CSS clean and maintainable.

## 📝 Notes

- This audit excludes Tailwind utility classes
- Dynamic class names with template literals may not be fully captured
- Some classes might be used in conditional logic that wasn't detected
`;

  fs.writeFileSync(reportPath, report);
  console.log(`\n✅ CSS audit report generated: ${reportPath}\n`);
}

// Main execution
async function main() {
  console.log('🚀 Starting CSS Audit...\n');
  
  if (!fs.existsSync(GLOBALS_CSS_PATH)) {
    console.error('❌ globals.css not found at:', GLOBALS_CSS_PATH);
    process.exit(1);
  }
  
  parseGlobalsCss();
  extractUsedClasses();
  findUnused();
  generateReport();
  
  console.log('✨ CSS audit complete!\n');
  console.log(`📊 Summary:`);
  console.log(`   - Unused classes: ${results.unusedClasses.size}`);
  console.log(`   - Unused CSS variables: ${results.cssVariables.unused.size}`);
  console.log(`   - Undefined classes: ${Array.from(results.undefinedClasses).filter(cls => !isTailwindClass(cls)).length}`);
}

main().catch(console.error);