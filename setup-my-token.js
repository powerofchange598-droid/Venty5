#!/usr/bin/env node
import { execSync } from 'child_process';
import { argv } from 'process';

const token = argv[2];
if (!token) {
    console.log('❌ Please provide your GitHub token');
    console.log('Usage: node setup-my-token.js YOUR_GITHUB_TOKEN');
    console.log('');
    console.log('To get your token:');
    console.log('1. Go to: https://github.com/settings/tokens');
    console.log('2. Click "Generate new token (classic)"');
    console.log('3. Select "repo" scope');
    console.log('4. Copy the token and run this command');
    process.exit(1);
}

try {
    // Update remote URL with token
    const newUrl = `https://${token}@github.com/sorrymaster66-eng/venty.git`;
    execSync(`git remote set-url origin "${newUrl}"`, { encoding: 'utf8' });
    
    console.log('✅ Token authentication configured!');
    console.log('🧪 Testing connection...');
    
    // Test the connection
    execSync('git fetch origin', { encoding: 'utf8' });
    console.log('✅ Connection successful!');
    
    console.log('🚀 Pushing all files to GitHub...');
    execSync('git push -u origin main', { encoding: 'utf8' });
    console.log('🎉 All files successfully pushed to GitHub!');
    
    console.log('');
    console.log('✅ COMPLETE: Your Venty app is now fully connected to GitHub!');
    console.log('🔄 You can now use automatic sync with: npm run sync:start');
    
} catch (error) {
    console.log('❌ Failed:', error.message);
    console.log('💡 Make sure your token has "repo" permissions');
    console.log('💡 Also verify you have push access to the repository');
}
