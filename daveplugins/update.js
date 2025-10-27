const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const AdmZip = require('adm-zip');

global.updateZipUrl = "https://codeload.github.com/gifteddevsmd/Dave-Ai/zip/refs/heads/main";

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
    if (dave && m) {
        await dave.sendMessage(m.chat, { text: 'Restarting bot... Back online shortly.' });
    }
    try { await run('pm2 restart all'); } 
    catch { setTimeout(() => process.exit(0), 2000); }
}

// ==================== CLEANUP ==================== //
function cleanAllTempFiles(base = '.') {
    if (!fs.existsSync(base)) return;
    for (const item of fs.readdirSync(base)) {
        const fullPath = path.join(base, item);
        try {
            const stat = fs.lstatSync(fullPath);
            if (stat.isDirectory()) {
                if (/^(backup_|tmp_|temp_|tmp_update|tmp)$/.test(item)) {
                    fs.rmSync(fullPath, { recursive: true, force: true });
                } else {
                    cleanAllTempFiles(fullPath);
                }
            } else if (stat.isFile() && /\.(zip|tmp|backup)$/.test(item)) {
                fs.unlinkSync(fullPath);
            }
        } catch (e) { console.log('Cleanup warning:', e.message); }
    }
}

// ==================== CONFIG MEMORY ==================== //
function readConfigFilesToMemory() {
    const files = [
        'settings.js', 'config.js', '.env',
        'library/database/menuSettings.json',
        'library/database/users.json',
        'messageCount.json'
    ];
    const memory = {};
    for (const f of files) if (fs.existsSync(f)) memory[f] = fs.readFileSync(f, 'utf8');
    return memory;
}

function restoreConfigFilesFromMemory(memory) {
    for (const [file, content] of Object.entries(memory)) {
        if (!content) continue;
        const dir = path.dirname(file);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(file, content, 'utf8');
    }
}

// ==================== FILE HELPERS ==================== //
async function downloadFile(url, dest) {
    return new Promise((resolve, reject) => {
        const writer = fs.createWriteStream(dest);
        axios({ url, method: 'GET', responseType: 'stream', timeout: 60000 })
            .then(r => { r.data.pipe(writer); writer.on('finish', resolve); writer.on('error', reject); })
            .catch(reject);
        setTimeout(() => reject(new Error('Download timeout')), 120000);
    });
}

async function extractZip(zipPath, outDir) {
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    try { await run(`unzip -o "${zipPath}" -d "${outDir}"`); } 
    catch { new AdmZip(zipPath).extractAllTo(outDir, true); }
}

async function smartCopy(src, dest, memory) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    const ignore = ['node_modules', '.git', 'session', 'backup_', 'tmp_', 'temp_'];
    for (const e of fs.readdirSync(src)) {
        if (ignore.some(i => e.includes(i)) || Object.keys(memory).some(f => path.basename(f) === e)) continue;
        const s = path.join(src, e), d = path.join(dest, e);
        const stat = fs.lstatSync(s);
        try { stat.isDirectory() ? await smartCopy(s, d, memory) : fs.copyFileSync(s, d); } 
        catch (err) { console.log('Copy warning:', e, err.message); }
    }
}

// ==================== UPDATES ==================== //
async function updateViaGit(dave, m, replyMsg) {
    const memory = readConfigFilesToMemory();
    try {
        await dave.sendMessage(m.chat, { text: 'Starting Git update...', edit: replyMsg.key });
        cleanAllTempFiles();
        try { await run('git stash'); } catch {}
        try { await run('git pull origin main'); } catch {}
        await run('npm install --omit=dev --no-audit --no-fund --silent');
        restoreConfigFilesFromMemory(memory);
        cleanAllTempFiles();
        await dave.sendMessage(m.chat, { text: 'Git update complete. Restarting...', edit: replyMsg.key });
        await restartProcess(dave, m);
    } catch (e) {
        console.error('Git update error:', e);
        restoreConfigFilesFromMemory(memory);
        cleanAllTempFiles();
        await dave.sendMessage(m.chat, { text: 'Update failed. Configs restored.', edit: replyMsg.key });
    }
}

async function updateViaZip(dave, m, replyMsg) {
    const memory = readConfigFilesToMemory();
    const tmpDir = path.join(process.cwd(), 'tmp_update_' + Date.now());
    try {
        await dave.sendMessage(m.chat, { text: 'Starting ZIP update...', edit: replyMsg.key });
        cleanAllTempFiles();
        if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true, force: true });
        fs.mkdirSync(tmpDir, { recursive: true });

        const zipPath = path.join(tmpDir, 'update.zip');
        const extractTo = path.join(tmpDir, 'update_extract');
        await downloadFile(global.updateZipUrl, zipPath);
        await extractZip(zipPath, extractTo);

        const folders = fs.readdirSync(extractTo);
        const mainFolder = folders.length === 1 ? path.join(extractTo, folders[0]) : extractTo;
        await smartCopy(mainFolder, process.cwd(), memory);
        await run('npm install --omit=dev --no-audit --no-fund --silent');
        restoreConfigFilesFromMemory(memory);

        await dave.sendMessage(m.chat, { text: 'ZIP update complete. Restarting...', edit: replyMsg.key });
        await restartProcess(dave, m);
    } catch (e) {
        console.error('ZIP update error:', e);
        restoreConfigFilesFromMemory(memory);
        await dave.sendMessage(m.chat, { text: 'Update failed. Configs restored.', edit: replyMsg.key });
    } finally {
        cleanAllTempFiles();
        if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true, force: true });
    }
}

// ==================== COMMAND HANDLER ==================== //
let daveplug = async (m, { dave, daveshown, command, reply }) => {
    if (!daveshown) return reply('Owner only command.');

    const replyMsg = await dave.sendMessage(m.chat, { text: 'Checking update method...' });

    try {
        if (command === 'update') hasGitRepo() ? await updateViaGit(dave, m, replyMsg) : await updateViaZip(dave, m, replyMsg);
        else if (command === 'restart' || command === 'start') {
            await dave.sendMessage(m.chat, { text: 'Restarting bot...', edit: replyMsg.key });
            await restartProcess(dave, m);
        }
        else if (command === 'clean') {
            cleanAllTempFiles();
            await dave.sendMessage(m.chat, { text: 'All temp files cleaned!', edit: replyMsg.key });
        }
        else await dave.sendMessage(m.chat, { text: 'Usage: .update or .restart or .clean', edit: replyMsg.key });
    } catch (e) {
        console.error('Update command error:', e);
        await dave.sendMessage(m.chat, { text: 'Update failed: ' + e.message, edit: replyMsg.key });
    }
};

daveplug.command = ['update', 'redeploy', 'start', 'clean'];
daveplug.tags = ['system'];
daveplug.help = ['update', 'redeploy', 'start', 'clean'];

module.exports = daveplug;