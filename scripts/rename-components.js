#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Configuration
const COMPONENTS_DIR = path.join(__dirname, '../src/components');
const APP_DIR = path.join(__dirname, '../src/app');
const SRC_DIR = path.join(__dirname, '../src');

// Components to rename
const componentsToRename = [
  { old: 'loading-spinner.tsx', new: 'LoadingSpinner.tsx' },
  { old: 'logout-fab.tsx', new: 'LogoutFab.tsx' },
  { old: 'status-indicator.tsx', new: 'StatusIndicator.tsx' },
  { old: 'search-bar.tsx', new: 'SearchBar.tsx' },
  { old: 'theme-provider.tsx', new: 'ThemeProvider.tsx' },
  { old: 'add-team-member-modal.tsx', new: 'AddTeamMemberModal.tsx' },
  { old: 'edit-profile-modal.tsx', new: 'EditProfileModal.tsx' },
  { old: 'remove-member-modal.tsx', new: 'RemoveMemberModal.tsx' },
  { old: 'business-setup-form.tsx', new: 'BusinessSetupForm.tsx' },
];

// Function to rename files
function renameFile(dir, oldName, newName) {
  const oldPath = path.join(dir, oldName);
  const newPath = path.join(dir, newName);
  
  if (fs.existsSync(oldPath)) {
    // Rename via temporary file to handle case-insensitive filesystems
    const tempPath = path.join(dir, `temp-${Date.now()}.tsx`);
    fs.renameSync(oldPath, tempPath);
    fs.renameSync(tempPath, newPath);
    console.log(`✅ Renamed: ${oldName} → ${newName}`);
    return true;
  }
  return false;
}

// Function to update imports in files
function updateImports(filePath, updates) {
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  updates.forEach(({ oldPath, newPath }) => {
    const regex = new RegExp(`(['"])${oldPath.replace(/\//g, '\\/')}(['"])`, 'g');
    if (regex.test(content)) {
      content = content.replace(regex, `$1${newPath}$2`);
      modified = true;
    }
  });
  
  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`📝 Updated imports in: ${path.relative(process.cwd(), filePath)}`);
  }
}

// Function to recursively find all TypeScript/JavaScript files
function findAllFiles(dir, extensions = ['.ts', '.tsx', '.js', '.jsx']) {
  const files = [];
  
  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    items.forEach(item => {
      const itemPath = path.join(currentDir, item);
      const stat = fs.statSync(itemPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        traverse(itemPath);
      } else if (stat.isFile() && extensions.includes(path.extname(item))) {
        files.push(itemPath);
      }
    });
  }
  
  traverse(dir);
  return files;
}

// Main execution
console.log('🔄 Starting component renaming process...\n');

// Step 1: Rename atom components
console.log('📁 Renaming atom components...');
componentsToRename.slice(0, 3).forEach(({ old, new: newName }) => {
  renameFile(path.join(COMPONENTS_DIR, 'atoms'), old, newName);
});

// Step 2: Rename molecule components
console.log('\n📁 Renaming molecule components...');
componentsToRename.slice(3, 4).forEach(({ old, new: newName }) => {
  renameFile(path.join(COMPONENTS_DIR, 'molecules'), old, newName);
});

// Step 3: Rename provider components
console.log('\n📁 Renaming provider components...');
componentsToRename.slice(4, 5).forEach(({ old, new: newName }) => {
  renameFile(path.join(COMPONENTS_DIR, 'providers'), old, newName);
});

// Step 4: Rename modal components
console.log('\n📁 Renaming modal components...');
componentsToRename.slice(5, 8).forEach(({ old, new: newName }) => {
  renameFile(path.join(COMPONENTS_DIR, 'organisms/modals'), old, newName);
});

// Step 5: Rename onboarding components
console.log('\n📁 Renaming onboarding components...');
componentsToRename.slice(8, 9).forEach(({ old, new: newName }) => {
  renameFile(path.join(COMPONENTS_DIR, 'organisms/onboarding'), old, newName);
});

// Step 6: Create import updates mapping
const importUpdates = [
  { oldPath: '@/components/atoms/loading-spinner', newPath: '@/components/atoms/LoadingSpinner' },
  { oldPath: '@/components/atoms/logout-fab', newPath: '@/components/atoms/LogoutFab' },
  { oldPath: '@/components/atoms/status-indicator', newPath: '@/components/atoms/StatusIndicator' },
  { oldPath: '@/components/molecules/search-bar', newPath: '@/components/molecules/SearchBar' },
  { oldPath: '@/components/providers/theme-provider', newPath: '@/components/providers/ThemeProvider' },
  { oldPath: '@/components/organisms/modals/add-team-member-modal', newPath: '@/components/organisms/modals/AddTeamMemberModal' },
  { oldPath: '@/components/organisms/modals/edit-profile-modal', newPath: '@/components/organisms/modals/EditProfileModal' },
  { oldPath: '@/components/organisms/modals/remove-member-modal', newPath: '@/components/organisms/modals/RemoveMemberModal' },
  { oldPath: '@/components/organisms/onboarding/business-setup-form', newPath: '@/components/organisms/onboarding/BusinessSetupForm' },
];

// Step 7: Update all imports
console.log('\n📝 Updating imports across the codebase...');
const allFiles = findAllFiles(SRC_DIR);
allFiles.forEach(file => {
  updateImports(file, importUpdates);
});

console.log('\n✨ Component renaming complete!');
console.log('\n📌 Note: You may need to restart your development server for changes to take effect.');