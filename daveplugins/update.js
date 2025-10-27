const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const AdmZip = require('adm-zip');

global.updateZipUrl = "https://codeload.github.com/gifteddevsmd/Dave-Ai/zip/refs/heads/main";
const githubRepo = "gifteddevsmd/Dave-Ai";

// ==================== UTILITY ==================== //
function run(cmd) {
    return new Promise((resolve, reject) => {
        exec(cmd, { windowsHide: true }, (err, stdout, stderr) => {
            if (err) return reject(stderr || stdout || err.message);
            resolve(stdout.toString());
        });
    });
}

function hasGitRepo() {
    return fs.existsSync(path.join(process.cwd(), '.git'));
}

async function restartProcess(dave, m) {
    try {
        if (dave && m) {
            await dave.sendMessage(m.chat, { 
                text: 'Restarting bot... Back online shortly.' 
            });
        }
        await run('pm2 restart all');
    } catch {
        setTimeout(() => process.exit(0), 2000);
    }
}

// Clean ALL temp files (no backups kept)
function cleanAllTempFiles() {
    try {
        const items = fs.readdirSync('.');
        for (const item of items) {
            if (
                (item.startsWith('backup_') || 
                 item.startsWith('tmp_') || 
                 item.startsWith('temp_') ||
                 item === 'tmp_update' ||
                 item === 'tmp' ||
                 item.endsWith('.tmp') ||
                 item.endsWith('.backup') ||
                 item.endsWith('.zip')) &&
                fs.lstatSync(item).isDirectory()
            ) {
                fs.rmSync(item, { recursive: true, force: true });
            }
        }
        
        // Clean leftover files
        const files = fs.readdirSync('.');
        for (const file of files) {
            if (file.endsWith('.zip') || file.endsWith('.tmp') || file.endsWith('.backup')) {
                fs.unlinkSync(file);
            }
        }
    } catch (error) {
        console.log('Cleanup warning:', error.message);
    }
}

// Read current config files to memory (no file backups)
function readConfigFilesToMemory() {
    const configFiles = {
        'settings.js': null,
        'config.js': null, 
        '.env': null,
        'library/database/menuSettings.json': null,
        'library/database/users.json': null,
        'messageCount.json': null
    };
    
    for (const [filePath, _] of Object.entries(configFiles)) {
        if (fs.existsSync(filePath)) {
            try {
                configFiles[filePath] = fs.readFileSync(filePath, 'utf8');
            } catch (error) {
                console.log(`Failed to read ${filePath}:`, error.message);
            }
        }
    }
    
    return configFiles;
}

// Restore config files from memory
function restoreConfigFilesFromMemory(configFiles) {
    for (const [filePath, content] of Object.entries(configFiles)) {
        if (content !== null) {
            try {
                // Ensure directory exists
                const dir = path.dirname(filePath);
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir, { recursive: true });
                }
                // Write content back
                fs.writeFileSync(filePath, content, 'utf8');
            } catch (error) {
                console.log(`Failed to restore ${filePath}:`, error.message);
            }
        }
    }
}

// Download ZIP
async function downloadFile(url, dest) {
    return new Promise((resolve, reject) => {
        const writer = fs.createWriteStream(dest);
        axios({
            url, 
            method: 'GET', 
            responseType: 'stream', 
            timeout: 60000,
            headers: { 'User-Agent': 'DaveAI-Updater' }
        }).then(response => {
            response.data.pipe(writer);
            writer.on('finish', resolve);
            writer.on('error', reject);
        }).catch(reject);
        
        setTimeout(() => reject(new Error('Download timeout')), 120000);
    });
}

// Extract ZIP
async function extractZip(zipPath, outDir) {
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    try {
        await run(`unzip -o "${zipPath}" -d "${outDir}"`);
    } catch {
        const zip = new AdmZip(zipPath);
        zip.extractAllTo(outDir, true);
    }
}

// Smart copy that preserves config files from memory
async function smartCopy(src, dest, configFiles) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    
    const ignoreList = [
        'node_modules', '.git', 'session', 
        'backup_', 'tmp_', 'temp_'
    ];
    
    for (const entry of fs.readdirSync(src)) {
        // Skip if in ignore list or is a config file we're preserving
        if (ignoreList.some(ignore => entry.includes(ignore)) || 
            Object.keys(configFiles).some(config => entry.includes(path.basename(config)))) {
            continue;
        }
        
        const s = path.join(src, entry);
        const d = path.join(dest, entry);
        const stat = fs.lstatSync(s);
        
        try {
            if (stat.isDirectory()) {
                await smartCopy(s, d, configFiles);
            } else {
                fs.copyFileSync(s, d);
            }
        } catch (error) {
            console.log(`Copy warning for ${entry}:`, error.message);
        }
    }
}

// ==================== GIT UPDATE ==================== //
async function updateViaGit(dave, m, replyMsg) {
    let configFiles = {};
    try {
        // Edit initial message
        await dave.sendMessage(m.chat, { 
            text: 'Starting Git update...',
            edit: replyMsg.key 
        });

        // Clean first
        cleanAllTempFiles();
        
        // Read configs to memory
        configFiles = readConfigFilesToMemory();
        
        // Git operations
        await run('git stash');
        await run('git pull origin main');
        await run('npm install --omit=dev --no-audit --no-fund --silent');
        
        // Restore configs from memory
        restoreConfigFilesFromMemory(configFiles);
        
        // Final cleanup
        cleanAllTempFiles();
        
        // Edit success message
        await dave.sendMessage(m.chat, { 
            text: 'Update complete. Restarting...',
            edit: replyMsg.key 
        });
        await restartProcess(dave, m);
    } catch (error) {
        console.error('Git update error:', error);
        // Restore configs on error
        restoreConfigFilesFromMemory(configFiles);
        cleanAllTempFiles();
        // Edit error message
        await dave.sendMessage(m.chat, { 
            text: 'Update failed. Configs restored.',
            edit: replyMsg.key 
        });
    }
}

// ==================== ZIP UPDATE ==================== //
async function updateViaZip(dave, m, replyMsg) {
    let configFiles = {};
    const tmpDir = path.join(process.cwd(), 'tmp_update_' + Date.now());
    
    try {
        // Edit initial message
        await dave.sendMessage(m.chat, { 
            text: 'Starting ZIP update...',
            edit: replyMsg.key 
        });

        // Clean first
        cleanAllTempFiles();
        
        // Read configs to memory
        configFiles = readConfigFilesToMemory();
        
        // Create temp directory
        if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true, force: true });
        fs.mkdirSync(tmpDir, { recursive: true });

        const zipPath = path.join(tmpDir, 'update.zip');
        const extractTo = path.join(tmpDir, 'update_extract');

        // Download and extract
        await downloadFile(global.updateZipUrl, zipPath);
        await extractZip(zipPath, extractTo);

        // Find main folder
        const folders = fs.readdirSync(extractTo);
        const mainFolder = folders.length === 1 ? path.join(extractTo, folders[0]) : extractTo;

        // Copy files (excluding configs)
        await smartCopy(mainFolder, process.cwd(), configFiles);
        
        // Install dependencies
        await run('npm install --omit=dev --no-audit --no-fund --silent');
        
        // Restore configs from memory
        restoreConfigFilesFromMemory(configFiles);
        
        // Edit success message
        await dave.sendMessage(m.chat, { 
            text: 'Update complete. Restarting...',
            edit: replyMsg.key 
        });
        await restartProcess(dave, m);
    } catch (error) {
        console.error('ZIP update error:', error);
        // Restore configs on error
        restoreConfigFilesFromMemory(configFiles);
        // Edit error message
        await dave.sendMessage(m.chat, { 
            text: 'Update failed. Configs restored.',
            edit: replyMsg.key 
        });
    } finally {
        // Always clean up (no backups left behind)
        cleanAllTempFiles();
        if (fs.existsSync(tmpDir)) {
            fs.rmSync(tmpDir, { recursive: true, force: true });
        }
    }
}

// ==================== COMMAND HANDLER ==================== //
let daveplug = async (m, { dave, daveshown, command, reply }) => {
    if (!daveshown) return reply('Owner only command.');
    
    // Send initial message and get its key for editing
    const replyMsg = await reply('Checking update method...');
    
    try {
        if (command === 'update') {
            if (hasGitRepo()) {
                await updateViaGit(dave, m, replyMsg);
            } else {
                await updateViaZip(dave, m, replyMsg);
            }
        } else if (command === 'restart' || command === 'start') {
            await dave.sendMessage(m.chat, { 
                text: 'Restarting bot...',
                edit: replyMsg.key 
            });
            await restartProcess(dave, m);
        } else if (command === 'clean') {
            cleanAllTempFiles();
            await dave.sendMessage(m.chat, { 
                text: 'All temp files cleaned!',
                edit: replyMsg.key 
            });
        } else {
            await dave.sendMessage(m.chat, { 
                text: 'Usage: .update or .restart or .clean',
                edit: replyMsg.key 
            });
        }
    } catch (error) {
        console.error('Update command error:', error);
        await dave.sendMessage(m.chat, { 
            text: 'Update failed: ' + error.message,
            edit: replyMsg.key 
        });
    }
};

daveplug.command = ['update', 'redeploy', 'start', 'clean'];
daveplug.tags = ['system'];
daveplug.help = ['update', 'redeploy', 'start', 'clean'];

module.exports = daveplug;