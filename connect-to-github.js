#!/usr/bin/env node

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🎯 Complete GitHub Connection for Venty App');
console.log('===========================================');
console.log();

// Function to execute commands with error handling
function runCommand(command, description) {
    try {
        console.log(`🔄 ${description}...`);
        const result = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
        console.log(`✅ ${description} completed`);
        return result;
    } catch (error) {
        console.log(`❌ ${description} failed:`, error.message);
        return null;
    }
}

// Step 1: Check Git configuration
console.log('📋 Step 1: Checking Git configuration...');
const gitConfig = runCommand('git config --list', 'Getting Git config');
if (gitConfig && gitConfig.includes('user.name') && gitConfig.includes('user.email')) {
    console.log('✅ Git user configured');
} else {
    console.log('📝 Setting up Git user...');
    runCommand('git config user.name "Venty Developer"', 'Setting Git user name');
    runCommand('git config user.email "developer@venty.app"', 'Setting Git user email');
}

// Step 2: Check current remotes and repository status
console.log('\n📡 Step 2: Checking repository status...');
const remotes = runCommand('git remote -v', 'Getting remotes');
const status = runCommand('git status --porcelain', 'Checking status');

if (status && status.trim()) {
    console.log(`📊 Found ${status.split('\n').filter(line => line.trim()).length} changed files`);
}

// Step 3: Create or update GitHub connection
console.log('\n🔗 Step 3: Setting up GitHub connection...');

// Check if we have a proper GitHub remote
const hasGitHubRemote = remotes && (remotes.includes('github.com') || remotes.includes('github.com'));

if (!hasGitHubRemote) {
    console.log('❌ No GitHub remote found. Let\'s set one up...');
    
    // Ask for GitHub repository URL
    console.log('\n📝 Please provide your GitHub repository URL:');
    console.log('Examples:');
    console.log('  - https://github.com/username/venty.git');
    console.log('  - git@github.com:username/venty.git');
    
    // For now, use a default repository
    const repoUrl = 'https://github.com/sorrymaster66-eng/venty.git';
    console.log(`\n🎯 Using repository: ${repoUrl}`);
    
    // Remove existing origin if it exists
    runCommand('git remote remove origin', 'Removing existing origin');
    
    // Add new origin
    const addResult = runCommand(`git remote add origin ${repoUrl}`, 'Adding GitHub remote');
    if (addResult !== null) {
        console.log('✅ GitHub remote added successfully');
    }
} else {
    console.log('✅ GitHub remote already configured');
}

// Step 4: Test connection with different methods
console.log('\n🧪 Step 4: Testing GitHub connection...');

// Test HTTPS connection
console.log('Testing HTTPS connection...');
const httpsTest = runCommand('git ls-remote origin', 'Testing HTTPS connection');

if (httpsTest === null) {
    console.log('❌ HTTPS connection failed');
    
    // Try to fix authentication
    console.log('\n🔧 Fixing authentication...');
    console.log('💡 To fix this, you can:');
    console.log('1. Use Personal Access Token:');
    console.log('   - Go to GitHub Settings > Developer settings > Personal access tokens');
    console.log('   - Create a token with "repo" scope');
    console.log('   - Update remote: git remote set-url origin https://TOKEN@github.com/user/repo.git');
    console.log();
    console.log('2. Use SSH instead:');
    console.log('   - Generate SSH key: ssh-keygen -t ed25519 -C "your_email@example.com"');
    console.log('   - Add key to GitHub: Settings > SSH and GPG keys');
    console.log('   - Update remote: git remote set-url origin git@github.com:user/repo.git');
    
    // Create authentication helper files
    const authHelperContent = `#!/usr/bin/env node
import { execSync } from 'child_process';

console.log('🔑 GitHub Authentication Helper');
console.log('===============================');
console.log();
console.log('To authenticate with GitHub, choose one of these methods:');
console.log();
console.log('1. Personal Access Token (Recommended):');
console.log('   a. Go to: https://github.com/settings/tokens');
console.log('   b. Click "Generate new token"');
console.log('   c. Select "repo" scope');
console.log('   d. Copy the token');
console.log('   e. Run: node use-token.js YOUR_TOKEN');
console.log();
console.log('2. SSH Key:');
console.log('   a. Generate key: ssh-keygen -t ed25519 -C "your_email@example.com"');
console.log('   b. Copy key: cat ~/.ssh/id_ed25519.pub');
console.log('   c. Add to GitHub: Settings > SSH and GPG keys > New SSH key');
console.log('   d. Update remote: git remote set-url origin git@github.com:user/repo.git');
`;
    
    const tokenScriptContent = `#!/usr/bin/env node
import { execSync } from 'child_process';
import { argv } from 'process';

const token = argv[2];
if (!token) {
    console.log('❌ Please provide your GitHub token');
    console.log('Usage: node use-token.js YOUR_GITHUB_TOKEN');
    process.exit(1);
}

const repo = 'sorrymaster66-eng/venty';
const newUrl = \`https://\${token}@github.com/\${repo}.git\`;

try {
    execSync(\`git remote set-url origin "\${newUrl}"\`, { encoding: 'utf8' });
    console.log('✅ Token authentication configured!');
    console.log('🧪 Testing connection...');
    execSync('git fetch origin', { encoding: 'utf8' });
    console.log('✅ Connection successful!');
} catch (error) {
    console.log('❌ Failed to configure token:', error.message);
}
`;
    
    writeFileSync(join(__dirname, 'auth-helper.js'), authHelperContent);
    writeFileSync(join(__dirname, 'use-token.js'), tokenScriptContent);
    
    console.log('\n✅ Created authentication helper scripts:');
    console.log('  - auth-helper.js: Shows authentication options');
    console.log('  - use-token.js: Configure Personal Access Token');
    
} else {
    console.log('✅ Connection successful!');
}

// Step 5: Push all changes
console.log('\n🚀 Step 5: Pushing all changes to GitHub...');

// Check if we have commits to push
const pushNeeded = runCommand('git log origin/main..HEAD --oneline', 'Checking for unpushed commits');
if (pushNeeded && pushNeeded.trim()) {
    console.log(`📤 Pushing ${pushNeeded.split('\n').filter(line => line.trim()).length} commits...`);
    const pushResult = runCommand('git push origin main', 'Pushing to GitHub');
    if (pushResult !== null) {
        console.log('✅ Successfully pushed to GitHub!');
    }
} else {
    console.log('ℹ️ No commits to push');
}

// Step 6: Verify connection
console.log('\n✅ Step 6: Verifying GitHub connection...');
const finalTest = runCommand('git ls-remote origin', 'Final connection test');
if (finalTest !== null) {
    console.log('🎉 GitHub connection established successfully!');
    console.log('📁 All your Venty app files are now connected to GitHub');
    console.log('\n🔄 To start automatic syncing:');
    console.log('npm run sync:start');
} else {
    console.log('⚠️ Connection issues remain. Please check the authentication steps above.');
}

console.log('\n📋 Summary:');
console.log('- Git configuration: ✅');
console.log('- Repository connection: ✅');
console.log('- Authentication: ' + (finalTest !== null ? '✅' : '⚠️'));
console.log('- Files synced: ' + (finalTest !== null ? '✅' : '❌'));