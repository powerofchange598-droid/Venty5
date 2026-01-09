#!/usr/bin/env node

import { execSync } from 'child_process';

console.log('🎮 GITHUB TOKEN SETUP - VENTY APP');
console.log('=====================================');
console.log();

console.log('📋 QUICK STEPS TO GET YOUR TOKEN:');
console.log('1. Go to: https://github.com/settings/tokens');
console.log('2. Click "Generate new token (classic)"');
console.log('3. Name: "Venty App Sync"');
console.log('4. Check: ✅ repo (Full control of private repositories)');
console.log('5. Click "Generate token" at bottom');
console.log('6. COPY the token (you won\'t see it again!)');
console.log();

console.log('🎯 AFTER YOU GET YOUR TOKEN:');
console.log('Run this command with your actual token:');
console.log('node setup-my-token.js YOUR_TOKEN_HERE');
console.log();

console.log('💡 EXAMPLE:');
console.log('node setup-my-token.js ghp_1234567890abcdefghijklmnopqrstuvwxyz');
console.log();

console.log('🚀 READY? Go get your token from GitHub and come back!');
console.log('   Then run the command above to complete the setup.');