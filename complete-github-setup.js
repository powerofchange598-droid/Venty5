#!/usr/bin/env node

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🎯 Complete GitHub Setup for Venty App');
console.log('========================================');
console.log();

// Step 1: Check current Git configuration
console.log('📋 Step 1: Checking current Git configuration...');
try {
    const userName = execSync('git config user.name', { encoding: 'utf8' }).trim();
    const userEmail = execSync('git config user.email', { encoding: 'utf8' }).trim();
    console.log(`✅ User: ${userName}`);
    console.log(`✅ Email: ${userEmail}`);
} catch (error) {
    console.log('❌ Git user not configured');
    console.log('📝 Setting up Git user...');
    
    // Set default user configuration
    execSync('git config user.name "Venty User"');
    execSync('git config user.email "venty@local.dev"');
    console.log('✅ Git user configured with default values');
}

// Step 2: Check remotes
console.log('\n📡 Step 2: Checking Git remotes...');
try {
    const remotes = execSync('git remote -v', { encoding: 'utf8' });
    console.log('Current remotes:');
    console.log(remotes);
    
    // Check if we have the main repository
    if (remotes.includes('sorrymaster66-eng/venty')) {
        console.log('✅ Main repository found');
    } else {
        console.log('❌ Main repository not found');
    }
} catch (error) {
    console.log('❌ No remotes configured');
}

// Step 3: Test connection
console.log('\n🧪 Step 3: Testing GitHub connection...');
try {
    execSync('git ls-remote origin', { encoding: 'utf8' });
    console.log('✅ Connection to GitHub successful!');
} catch (error) {
    console.log('❌ Connection failed:', error.message);
    console.log('\n💡 To fix authentication issues:');
    console.log('1. Use GitHub Personal Access Token instead of password');
    console.log('2. Update your remote URL to use token authentication');
    console.log('3. Or use SSH authentication');
    
    console.log('\n🔧 Quick fix options:');
    console.log('A. Use Personal Access Token:');
    console.log('   git remote set-url origin https://YOUR_TOKEN@github.com/sorrymaster66-eng/venty.git');
    console.log('B. Use SSH:');
    console.log('   git remote set-url origin git@github.com:sorrymaster66-eng/venty.git');
}

// Step 4: Push current changes
console.log('\n🚀 Step 4: Pushing current changes...');
try {
    const status = execSync('git status --porcelain', { encoding: 'utf8' });
    if (status.trim()) {
        console.log('📋 Found uncommitted changes:');
        console.log(status);
        
        console.log('➕ Adding changes...');
        execSync('git add .');
        
        console.log('💬 Creating commit...');
        execSync('git commit -m "Auto-sync: Update Venty app files"');
    }
    
    console.log('📤 Pushing to GitHub...');
    execSync('git push origin main', { encoding: 'utf8' });
    console.log('✅ Successfully pushed to GitHub!');
    
} catch (error) {
    console.log('❌ Push failed:', error.message);
    console.log('\n💡 Troubleshooting:');
    console.log('1. Check your internet connection');
    console.log('2. Verify GitHub credentials');
    console.log('3. Check repository permissions');
    console.log('4. Try: git push --force-with-lease origin main');
}

console.log('\n🎉 Setup complete!');
console.log('Use "npm run sync:start" to start automatic syncing');