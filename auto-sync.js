#!/usr/bin/env node

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, appendFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const LOG_FILE = join(__dirname, 'sync-log.txt');
const CONFIG_FILE = join(__dirname, 'sync-config.json');

// Default configuration
const defaultConfig = {
    remote: 'origin',
    branch: 'main',
    interval: 60, // seconds
    autoCommit: true,
    excludePatterns: ['node_modules', '.git', 'dist', 'build', '*.log']
};

// Load or create config
let config;
try {
    config = JSON.parse(readFileSync(CONFIG_FILE, 'utf8'));
} catch {
    config = defaultConfig;
    writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

function log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;
    console.log(message);
    appendFileSync(LOG_FILE, logMessage);
}

function runCommand(command) {
    try {
        return execSync(command, { encoding: 'utf8', stdio: 'pipe' }).trim();
    } catch (error) {
        throw new Error(`Command failed: ${command}\n${error.message}`);
    }
}

function checkGitStatus() {
    try {
        const status = runCommand('git status --porcelain');
        return status.length > 0;
    } catch (error) {
        log(`❌ Error checking git status: ${error.message}`);
        return false;
    }
}

function syncRepository() {
    log('🔄 Starting sync check...');
    
    try {
        // Check if we have changes
        if (!checkGitStatus()) {
            log('ℹ️ No changes detected');
            return;
        }

        log('📝 Changes detected, starting sync process...');
        
        // Add all changes
        runCommand('git add .');
        log('✅ Files added to staging');
        
        // Create commit message
        const commitMessage = `Auto-sync: ${new Date().toISOString()}`;
        runCommand(`git commit -m "${commitMessage}"`);
        log('✅ Changes committed');
        
        // Push to remote
        runCommand(`git push ${config.remote} ${config.branch}`);
        log('✅ Changes pushed to remote repository');
        
    } catch (error) {
        log(`❌ Sync failed: ${error.message}`);
    }
}

function main() {
    log('🚀 Starting automatic Git sync service...');
    log(`📡 Remote: ${config.remote}/${config.branch}`);
    log(`⏰ Check interval: ${config.interval} seconds`);
    log('Press Ctrl+C to stop\n');
    
    // Initial sync
    syncRepository();
    
    // Set up interval
    setInterval(syncRepository, config.interval * 1000);
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    log('\n👋 Sync service stopped');
    process.exit(0);
});

process.on('uncaughtException', (error) => {
    log(`💥 Uncaught exception: ${error.message}`);
    process.exit(1);
});

// Start the service
main();