#!/usr/bin/env node

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, appendFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const LOG_FILE = join(__dirname, 'sync-log.txt');

function log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;
    console.log(message);
    appendFileSync(LOG_FILE, logMessage);
}

console.log('🔄 Manual Git Sync for Venty');
console.log('=====================================');
console.log();

try {
    // Check current status
    log('📊 Checking repository status...');
    const status = execSync('git status --porcelain', { encoding: 'utf8' });
    
    if (!status.trim()) {
        log('ℹ️ No changes to sync');
        process.exit(0);
    }
    
    log(`📝 Found ${status.split('\n').filter(line => line.trim()).length} changed files`);
    
    // Show what will be synced
    console.log('\n📋 Files to sync:');
    console.log(status);
    
    // Add all changes
    log('➕ Adding files...');
    execSync('git add .');
    
    // Create commit
    const commitMessage = `Manual sync: ${new Date().toISOString()}`;
    log('💬 Creating commit...');
    execSync(`git commit -m "${commitMessage}"`);
    
    // Push with retry logic
    log('🚀 Pushing to remote...');
    let retries = 3;
    while (retries > 0) {
        try {
            execSync('git push origin main', { encoding: 'utf8' });
            log('✅ Sync completed successfully!');
            break;
        } catch (error) {
            retries--;
            if (retries > 0) {
                log(`⚠️ Push failed, retrying in 5 seconds... (${retries} retries left)`);
                execSync('sleep 5');
            } else {
                log('❌ Push failed after 3 attempts');
                log('💡 Troubleshooting tips:');
                log('1. Check your internet connection');
                log('2. Verify GitHub credentials');
                log('3. Check repository permissions');
                log('4. Use: git config --global user.name "Your Name"');
                log('5. Use: git config --global user.email "your.email@example.com"');
                throw error;
            }
        }
    }
    
} catch (error) {
    log(`💥 Sync failed: ${error.message}`);
    process.exit(1);
}