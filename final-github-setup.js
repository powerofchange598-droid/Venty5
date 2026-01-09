#!/usr/bin/env node

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Final GitHub Connection Solution for Venty');
console.log('============================================');
console.log();

// Function to run commands safely
function runCommand(command, description) {
    try {
        const result = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
        return { success: true, output: result };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

console.log('🎯 STEP 1: Creating new GitHub repository connection');
console.log('---------------------------------------------------');

// Remove existing problematic remotes
console.log('🗑️ Removing existing remotes...');
const remotes = ['origin', 'user', 'beta', 'ventty'];
remotes.forEach(remote => {
    const result = runCommand(`git remote remove ${remote}`, `Remove ${remote}`);
    if (result.success) {
        console.log(`✅ Removed ${remote}`);
    }
});

// Create a new repository or use existing one
console.log('\n🔗 STEP 2: Setting up fresh GitHub connection');
console.log('---------------------------------------------');

// Option 1: Create new repository (recommended)
console.log('💡 RECOMMENDED: Create a new GitHub repository');
console.log('1. Go to: https://github.com/new');
console.log('2. Create repository named "venty-app" or similar');
console.log('3. Copy the repository URL');
console.log('4. Paste it below when prompted');

// For now, let's create a comprehensive solution
const repoOptions = [
    'https://github.com/sorrymaster66-eng/venty.git',
    'https://github.com/powerofchange598-droid/venty.git',
    'git@github.com:sorrymaster66-eng/venty.git'
];

console.log('\n🔄 Trying different repository options...');

let connectedRepo = null;
for (const repoUrl of repoOptions) {
    console.log(`\n🧪 Testing: ${repoUrl}`);
    
    // Add as origin
    const addResult = runCommand(`git remote add origin ${repoUrl}`, 'Add remote');
    if (addResult.success) {
        // Test connection
        const testResult = runCommand('git ls-remote origin', 'Test connection');
        if (testResult.success) {
            console.log(`✅ Successfully connected to: ${repoUrl}`);
            connectedRepo = repoUrl;
            break;
        } else {
            console.log(`❌ Connection failed: ${testResult.error}`);
            // Remove failed remote
            runCommand('git remote remove origin', 'Remove failed remote');
        }
    }
}

if (!connectedRepo) {
    console.log('\n❌ All repository connections failed');
    console.log('\n🎯 SOLUTION: Create your own GitHub repository');
    console.log('1. Go to https://github.com/new');
    console.log('2. Create a new repository (name it "venty" or similar)');
    console.log('3. Copy the HTTPS URL (looks like: https://github.com/YOUR_USERNAME/venty.git)');
    console.log('4. Run: node create-my-repo.js YOUR_REPO_URL');
    
    // Create the helper script
    const createRepoScript = `#!/usr/bin/env node
import { execSync } from 'child_process';
import { argv } from 'process';

const repoUrl = argv[2];
if (!repoUrl) {
    console.log('❌ Please provide your GitHub repository URL');
    console.log('Usage: node create-my-repo.js https://github.com/YOUR_USERNAME/venty.git');
    process.exit(1);
}

console.log(\`🔄 Setting up repository: \${repoUrl}\`);

try {
    // Remove any existing origin
    try { execSync('git remote remove origin', { stdio: 'ignore' }); } catch {}
    
    // Add new origin
    execSync(\`git remote add origin "\${repoUrl}"\`, { encoding: 'utf8' });
    console.log('✅ Repository configured!');
    
    // Test connection
    console.log('🧪 Testing connection...');
    execSync('git ls-remote origin', { encoding: 'utf8' });
    console.log('✅ Connection successful!');
    
    // Push all files
    console.log('🚀 Pushing all files to GitHub...');
    execSync('git push -u origin main', { encoding: 'utf8' });
    console.log('🎉 All files successfully pushed to GitHub!');
    
} catch (error) {
    console.log('❌ Failed:', error.message);
    console.log('💡 Make sure you have permission to push to this repository');
}
`;
    
    writeFileSync(join(__dirname, 'create-my-repo.js'), createRepoScript);
    console.log('\n✅ Created create-my-repo.js - use it with your new repository URL');
    
} else {
    console.log('\n🎉 Repository connected successfully!');
    
    console.log('\n📤 STEP 3: Pushing all files to GitHub');
    console.log('---------------------------------------');
    
    // Check for uncommitted changes
    const statusResult = runCommand('git status --porcelain', 'Check status');
    if (statusResult.success && statusResult.output.trim()) {
        console.log('📋 Found uncommitted changes, committing...');
        runCommand('git add .', 'Add all files');
        runCommand('git commit -m "Complete Venty app setup"', 'Commit changes');
    }
    
    // Push to GitHub
    console.log('🚀 Pushing to GitHub...');
    const pushResult = runCommand('git push -u origin main', 'Push to GitHub');
    
    if (pushResult.success) {
        console.log('✅ All files successfully pushed to GitHub!');
        console.log('\n🎉 COMPLETE: Your Venty app is now fully connected to GitHub!');
        console.log('\n📋 Summary:');
        console.log('✅ Repository: ' + connectedRepo);
        console.log('✅ All files synced');
        console.log('✅ Ready for automatic syncing');
        
        console.log('\n🔄 To start automatic sync:');
        console.log('npm run sync:start');
        
    } else {
        console.log('❌ Push failed:', pushResult.error);
        console.log('\n💡 This might be due to authentication issues');
        console.log('Try using a Personal Access Token or SSH key');
        console.log('Run: node auth-helper.js for detailed instructions');
    }
}

console.log('\n🏁 Setup complete!');