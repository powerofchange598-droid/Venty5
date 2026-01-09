#!/usr/bin/env node

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔐 GitHub Authentication Fix for Venty');
console.log('======================================');
console.log();

// Check current authentication method
console.log('📡 Current GitHub authentication status:');
try {
    // Try to fetch from GitHub
    execSync('git fetch origin', { encoding: 'utf8' });
    console.log('✅ Authentication working!');
} catch (error) {
    console.log('❌ Authentication failed');
    console.log('🔧 Setting up new authentication...');
    
    console.log('\n🎯 Choose authentication method:');
    console.log('1. Personal Access Token (Recommended)');
    console.log('2. SSH Key');
    console.log('3. Update remote URL with credentials');
    
    // For now, let's set up Personal Access Token authentication
    console.log('\n🔑 Setting up Personal Access Token authentication...');
    
    // Backup current remote
    try {
        const currentUrl = execSync('git remote get-url origin', { encoding: 'utf8' }).trim();
        console.log(`Current URL: ${currentUrl}`);
        
        // Update to use token authentication
        console.log('\n📋 To fix authentication, follow these steps:');
        console.log('1. Go to GitHub Settings > Developer settings > Personal access tokens');
        console.log('2. Create a new token with "repo" permissions');
        console.log('3. Copy your token');
        console.log('4. Run this command (replace YOUR_TOKEN with your actual token):');
        console.log('   git remote set-url origin https://YOUR_TOKEN@github.com/sorrymaster66-eng/venty.git');
        
        console.log('\n🔄 Alternative: Use SSH authentication');
        console.log('1. Generate SSH key: ssh-keygen -t ed25519 -C "your_email@example.com"');
        console.log('2. Add SSH key to GitHub: Settings > SSH and GPG keys');
        console.log('3. Update remote: git remote set-url origin git@github.com:sorrymaster66-eng/venty.git');
        
        // Create a helper script for token setup
        const tokenHelper = `#!/usr/bin/env node
import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';

console.log('🔑 GitHub Token Setup Helper');
console.log('============================');
console.log();
console.log('📝 To set up your GitHub token:');
console.log('1. Go to: https://github.com/settings/tokens');
console.log('2. Click "Generate new token"');
console.log('3. Select "repo" scope');
console.log('4. Copy the generated token');
console.log('5. Run: node setup-token.js YOUR_TOKEN_HERE');
`;
        
        writeFileSync(join(__dirname, 'setup-token-helper.js'), tokenHelper);
        
        console.log('\n✅ Created setup-token-helper.js');
        console.log('Run: node setup-token-helper.js for detailed instructions');
        
    } catch (error) {
        console.log('❌ Could not get current remote URL');
    }
}

console.log('\n🚀 Quick fix commands:');
console.log('# For Personal Access Token:');
console.log('git remote set-url origin https://YOUR_TOKEN@github.com/sorrymaster66-eng/venty.git');
console.log();
console.log('# For SSH:');
console.log('git remote set-url origin git@github.com:sorrymaster66-eng/venty.git');
console.log();
console.log('# Test connection:');
console.log('git fetch origin');