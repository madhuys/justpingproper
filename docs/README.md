# JustPing Backend - Documentation Generator

This project includes an automated documentation generator that analyzes your codebase and creates comprehensive project structure documentation.

## Features

- 📊 **Project Statistics**: Total files, lines of code, and complexity metrics
- 🏗️ **Architecture Analysis**: Identifies API modules, endpoints, and system components  
- 📁 **File Categorization**: Groups files by purpose (Controllers, Services, Routes, etc.)
- 🌳 **Project Tree**: Visual representation of your project structure
- 📈 **Module Complexity**: Lines of code and file count per module
- 🛣️ **API Endpoint Detection**: Automatically discovers Express routes

## Usage

### Method 1: NPM Script
```bash
npm run docs
```

### Method 2: Direct Node Execution
```bash
node scripts/generate-docs.js
```

### Method 3: Batch Files (Windows)
```bash
# Command Prompt
generate-docs.bat

# PowerShell
.\generate-docs.ps1
```

## Auto-Generation

The documentation is automatically generated when you run:
```bash
npm run dev
```

This ensures your documentation stays up-to-date during development.

## Output

The generated documentation is saved to:
```
docs/PROJECT_STRUCTURE.md
```

## Customization

You can customize the documentation generator by editing:
```
scripts/generate-docs.js
```

### File Categories

The generator categorizes files based on:
- File paths (e.g., `api/`, `AgentsFlow/`)
- File names (e.g., `controller.js`, `service.js`)
- File extensions (e.g., `.js`, `.json`, `.md`)

### Ignored Files

Files and directories are ignored based on:
- `.gitignore` patterns
- Built-in ignore patterns for common artifacts
- Custom ignore patterns in the script

## Example Output

The documentation includes:

1. **Project Statistics Table**
2. **Architecture Overview**
3. **Largest Files by Lines of Code**
4. **API Endpoints by Module**
5. **Module Complexity Analysis**
6. **Visual Project Tree**
7. **Files Categorized by Type**
8. **File Extensions Summary**

## Backend-Specific Features

This generator is specifically tailored for Node.js/Express backends and includes:

- **API Controller Analysis**: Identifies controllers, services, and routes
- **Database Layer Detection**: Finds models, migrations, and repositories
- **Middleware Categorization**: Groups authentication and validation middleware
- **AI/Automation Recognition**: Specifically identifies AgentsFlow components
- **WhatsApp Integration**: Recognizes messaging and webhook components

## Maintenance

The documentation should be regenerated:
- After adding new modules or major features
- Before releases or deployments
- When onboarding new team members
- As part of CI/CD pipeline (optional)

---

*Generated documentation helps maintain code quality and assists in project onboarding.*
