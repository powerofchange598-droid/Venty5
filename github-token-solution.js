#!/usr/bin/env node

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔐 GitHub Authentication Solution for Venty');
console.log('==========================================');
console.log();

console.log('🎯 THE SOLUTION: Use Personal Access Token');
console.log('-------------------------------------------');
console.log();

console.log('📋 STEP 1: Create GitHub Personal Access Token');
console.log('1. Go to: https://github.com/settings/tokens');
console.log('2. Click "Generate new token (classic)"');
console.log('3. Give it a name like "Venty App Sync"');
console.log('4. Select these scopes:');
console.log('   ✅ repo (Full control of private repositories)');
console.log('   ✅ workflow (Update GitHub Action workflows)');
console.log('5. Click "Generate token"');
console.log('6. COPY the token immediately (you won\'t see it again)');
console.log();

console.log('📋 STEP 2: Configure Git with Your Token');
console.log('-----------------------------------------');
console.log();

// Get the current repository URL
const currentUrl = execSync('git remote get-url origin', { encoding: 'utf8' }).trim();
console.log(`Current repository: ${currentUrl}`);
console.log();

console.log('🔄 Now, update your Git configuration:');
console.log('Copy and paste this command (replace YOUR_TOKEN with your actual token):');
console.log();
console.log(`git remote set-url origin https://YOUR_TOKEN@github.com/sorrymaster66-eng/venty.git`);
console.log();

// Create a helper script for token setup
const tokenSetupScript = `#!/usr/bin/env node
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
    const newUrl = \`https://\${token}@github.com/sorrymaster66-eng/venty.git\`;
    execSync(\`git remote set-url origin "\${newUrl}"\`, { encoding: 'utf8' });
    
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
`;

writeFileSync(join(__dirname, 'setup-my-token.js'), tokenSetupScript);

console.log('✅ Created setup-my-token.js');
console.log();
console.log('🎯 QUICK SETUP:');
console.log('1. Get your token from: https://github.com/settings/tokens');
console.log('2. Run: node setup-my-token.js YOUR_TOKEN_HERE');
console.log('3. Done! Your files will sync automatically');
console.log();

console.log('🔄 ALTERNATIVE: Manual Token Setup');
console.log('-----------------------------------');
console.log('If you prefer to do it manually:');
console.log('1. Get your token from GitHub');
console.log('2. Run this command (replace YOUR_TOKEN):');
console.log(`   git remote set-url origin https://YOUR_TOKEN@github.com/sorrymaster66-eng/venty.git`);
console.log('3. Test: git push origin main');
console.log();

console.log('📱 ALTERNATIVE: Use GitHub CLI (gh)');
console.log('------------------------------------');
console.log('If you have GitHub CLI installed:');
console.log('1. Run: gh auth login');
console.log('2. Follow the prompts');
console.log('3. Then: gh repo clone sorrymaster66-eng/venty');
console.log('4. Or: gh repo create your-own-venty-repo');
console.log();

console.log('🎉 Once you set up your token, your Venty app files');
console.log('   will be completely connected to GitHub!');
console.log();
console.log('✨ Ready to sync? Run: node setup-my-token.js YOUR_TOKEN');