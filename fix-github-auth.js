#!/usr/bin/env node

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, appendFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔧 GITHUB AUTHENTICATION FIX FOR VENTY APP');
console.log('==========================================');
console.log();

console.log('🎯 WHAT THIS WILL DO:');
console.log('✅ Fix GitHub authentication issues');
console.log('✅ Set up Personal Access Token');
console.log('✅ Enable file synchronization');
console.log('✅ Connect your Venty app to GitHub');
console.log();

console.log('📋 STEP-BY-STEP INSTRUCTIONS:');
console.log();

console.log('1️⃣ GET YOUR GITHUB PERSONAL ACCESS TOKEN:');
console.log('   • Open this link: https://github.com/settings/tokens');
console.log('   • Click "Generate new token (classic)"');
console.log('   • Name: "Venty App Sync"');
console.log('   • Select: ✅ repo (Full control of private repositories)');
console.log('   • Click "Generate token"');
console.log('   • COPY the token (you won\'t see it again!)');
console.log();

console.log('2️⃣ SET UP AUTHENTICATION:');
console.log('   • Copy your token from GitHub');
console.log('   • Run this command (replace YOUR_TOKEN):');
console.log('     node setup-my-token.js YOUR_TOKEN');
console.log();

console.log('3️⃣ VERIFY CONNECTION:');
console.log('   • Run: git push origin main');
console.log('   • Should work without errors');
console.log();

console.log('4️⃣ START AUTO-SYNC:');
console.log('   • Run: npm run sync:start');
console.log('   • Files will sync automatically every 60 seconds');
console.log();

console.log('🔍 CURRENT STATUS:');
try {
    // Check current remotes
    const remotes = execSync('git remote -v', { encoding: 'utf8' });
    console.log('📡 Current remotes:');
    console.log(remotes);
    
    // Test connection
    console.log('\n🧪 Testing connection...');
    try {
        execSync('git fetch origin', { encoding: 'utf8', timeout: 10000 });
        console.log('✅ Connection successful!');
    } catch (error) {
        console.log('❌ Connection failed - authentication needed');
        console.log('   Error:', error.message);
    }
    
} catch (error) {
    console.log('❌ Git repository not found');
    console.log('   Run: git init');
}

console.log();
console.log('🚀 READY TO FIX AUTHENTICATION?');
console.log('   Just run: node setup-my-token.js YOUR_TOKEN');
console.log('   (Replace YOUR_TOKEN with your actual GitHub token)');
console.log();

console.log('💡 NEED HELP?');
console.log('   • Check sync logs: npm run sync:log');
console.log('   • Stop sync: npm run sync:stop');
console.log('   • Manual sync: npm run sync:manual');
console.log('   • GitHub token help: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token');