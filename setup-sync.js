#!/usr/bin/env node

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔧 GitHub Sync Setup for Venty');
console.log('=====================================');
console.log();

// Check current remotes
console.log('📡 Current Git remotes:');
try {
    const remotes = execSync('git remote -v', { encoding: 'utf8' });
    console.log(remotes);
} catch (error) {
    console.log('❌ No remotes found');
}

console.log();
console.log('🎯 Setup Options:');
console.log('1. Use existing remote (origin)');
console.log('2. Add new GitHub repository');
console.log('3. Configure Git credentials');
console.log('4. Test connection');
console.log();

// For now, let's test the current connection
console.log('🧪 Testing current connection...');
try {
    execSync('git fetch origin', { encoding: 'utf8' });
    console.log('✅ Connection successful!');
} catch (error) {
    console.log('❌ Connection failed:', error.message);
    console.log();
    console.log('💡 To fix this issue:');
    console.log('1. Make sure you have access to the repository');
    console.log('2. Check your Git credentials:');
    console.log('   git config --global user.name "Your Name"');
    console.log('   git config --global user.email "your.email@example.com"');
    console.log('3. Use a personal access token instead of password');
    console.log('4. Check if the repository URL is correct');
}

console.log();
console.log('🔄 To start automatic sync, run:');
console.log('npm run sync:start');
console.log();
console.log('📋 Available commands:');
console.log('npm run sync        - Start sync service');
console.log('npm run sync:start  - Start with monitoring');
console.log('npm run sync:stop   - Stop sync service');
console.log('npm run sync:log    - View sync logs');