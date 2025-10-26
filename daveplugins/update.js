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

// Delete old backups & temp folders
function deleteOldBackupsAndTemps(excludeDir = '') {
    const items = fs.readdirSync('.');
    for (const item of items) {
        if (
            (item.startsWith('backup_') || item.startsWith('tmp_')) &&
            item !== path.basename(excludeDir) &&
            fs.lstatSync(item).isDirectory()
        ) {
            fs.rmSync(item, { recursive: true, force: true });
        }
    }
}

// Backup critical files
function backupCriticalFiles() {
    const backupDir = path.join(process.cwd(), 'backup_' + Date.now());
    fs.mkdirSync(backupDir, { recursive: true });
    
    // Include session and database folders
    const critical = [
        'settings.js', 'config.js', '.env', 
        'session', 'library/database'
    ];
    
    for (const f of critical) {
        if (fs.existsSync(f)) {
            const dest = path.join(backupDir, f);
            if (fs.lstatSync(f).isDirectory()) {
                fs.cpSync(f, dest, { recursive: true });
            } else {
                fs.copyFileSync(f, dest);
            }
        }
    }
    return backupDir;
}

// Download ZIP
async function downloadFile(url, dest) {
    const writer = fs.createWriteStream(dest);
    const response = await axios({ 
        url, 
        method: 'GET', 
        responseType: 'stream', 
        timeout: 60000,
        headers: { 'User-Agent': 'DaveAI-Updater' }
    });
    response.data.pipe(writer);
    return new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
        response.data.on('error', reject);
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

// Recursive copy
async function copyRecursive(src, dest, ignore = []) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
        if (ignore.includes(entry)) continue;
        const s = path.join(src, entry);
        const d = path.join(dest, entry);
        const stat = fs.lstatSync(s);
        try {
            if (stat.isDirectory()) await copyRecursive(s, d, ignore);
            else fs.copyFileSync(s, d);
        } catch {}
    }
}

// ==================== GIT UPDATE ==================== //
async function updateViaGit(dave, m) {
    let backupDir = null;
    try {
        await dave.sendMessage(m.chat, { text: 'Starting Git update...' });
        
        deleteOldBackupsAndTemps();
        backupDir = backupCriticalFiles();

        await run('git reset --hard');
        await run('git pull origin main');
        await run('npm install --omit=dev --no-audit --no-fund --silent');

        await dave.sendMessage(m.chat, { text: 'Update complete. Restarting...' });
        await restartProcess(dave, m);
    } catch (error) {
        console.error('Git update error:', error);
        if (backupDir && fs.existsSync(backupDir)) {
            await copyRecursive(backupDir, process.cwd());
            await dave.sendMessage(m.chat, { text: 'Update failed. Restored from backup.' });
        }
    } finally {
        if (backupDir && fs.existsSync(backupDir)) {
            fs.rmSync(backupDir, { recursive: true, force: true });
        }
    }
}

// ==================== ZIP UPDATE ==================== //
async function updateViaZip(dave, m) {
    let backupDir = null;
    const tmpDir = path.join(process.cwd(), 'tmp_update');
    try {
        await dave.sendMessage(m.chat, { text: 'Starting ZIP update...' });
        
        deleteOldBackupsAndTemps();
        backupDir = backupCriticalFiles();

        if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true, force: true });
        fs.mkdirSync(tmpDir, { recursive: true });

        const zipPath = path.join(tmpDir, 'update.zip');
        const extractTo = path.join(tmpDir, 'update_extract');

        await downloadFile(global.updateZipUrl, zipPath);
        await extractZip(zipPath, extractTo);

        const folders = fs.readdirSync(extractTo);
        const mainFolder = folders.length === 1 ? path.join(extractTo, folders[0]) : extractTo;

        await copyRecursive(mainFolder, process.cwd(), [
            'node_modules', '.git', 'session', 'tmp', 'tmp_update', 'backup_*'
            // .env, config.js, settings.js, database.json will be preserved via backup
        ]);

        await run('npm install --omit=dev --no-audit --no-fund --silent');
        
        await dave.sendMessage(m.chat, { text: 'Update complete. Restarting...' });
        await restartProcess(dave, m);
    } catch (error) {
        console.error('ZIP update error:', error);
        if (backupDir && fs.existsSync(backupDir)) {
            await copyRecursive(backupDir, process.cwd());
            await dave.sendMessage(m.chat, { text: 'Update failed. Restored from backup.' });
        }
    } finally {
        if (backupDir && fs.existsSync(backupDir)) {
            fs.rmSync(backupDir, { recursive: true, force: true });
        }
        if (fs.existsSync(tmpDir)) {
            fs.rmSync(tmpDir, { recursive: true, force: true });
        }
    }
}

// ==================== COMMAND HANDLER ==================== //
let daveplug = async (m, { dave, daveshown, command, reply }) => {
    if (!daveshown) return reply('Owner only command.');
    try {
        if (command === 'update') {
            await reply('Checking update method...');
            if (hasGitRepo()) {
                await updateViaGit(dave, m);
            } else {
                await updateViaZip(dave, m);
            }
        } else if (command === 'restart' || command === 'start') {
            await reply('Restarting bot...');
            await restartProcess(dave, m);
        } else {
            reply('Usage: .update or .restart');
        }
    } catch (error) {
        console.error('Update command error:', error);
        await reply('Update failed: ' + error.message);
    }
};

daveplug.command = ['update', 'redeploy', 'start'];
daveplug.tags = ['system'];
daveplug.help = ['update', 'redeploy', 'start'];

module.exports = daveplug;