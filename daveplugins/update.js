const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const AdmZip = require('adm-zip');

global.updateZipUrl = "https://codeload.github.com/gifteddevsmd/Dave-Ai/zip/refs/heads/main";
const githubRepo = "gifteddevsmd/Dave-Ai";

function run(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, { windowsHide: true }, (err, stdout, stderr) => {
      if (err) return reject(stderr || stdout || err.message);
      resolve(stdout.toString());
    });
  });
}

// Check for Git repo
function hasGitRepo() {
  return fs.existsSync(path.join(process.cwd(), '.git'));
}

// Restart process safely
async function restartProcess() {
  try {
    await run('pm2 restart all');
    console.log('Restarted using PM2.');
  } catch {
    console.log('PM2 not found, restarting manually...');
    setTimeout(() => process.exit(0), 2000);
  }
}

// Backup critical files
function backupCriticalFiles() {
  const backupDir = path.join(process.cwd(), 'backup_' + Date.now());
  fs.mkdirSync(backupDir, { recursive: true });
  const critical = ['settings.js', 'config.js', '.env', 'database.json'];
  for (const f of critical) {
    if (fs.existsSync(f)) fs.copyFileSync(f, path.join(backupDir, f));
  }
  console.log(`Backup created: ${backupDir}`);
  return backupDir;
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
      console.log(`Deleted old folder: ${item}`);
    }
  }
}

// Safety check
function safetyChecks() {
  if (!fs.existsSync('./package.json'))
    throw new Error('Not in project root directory - missing package.json');
  fs.accessSync('.', fs.constants.W_OK);
}

// Compare versions
async function checkForUpdates() {
  try {
    const current = JSON.parse(fs.readFileSync('./package.json'));
    const latest = (await axios.get(`https://raw.githubusercontent.com/${githubRepo}/main/package.json`)).data;
    return current.version !== latest.version;
  } catch {
    return true;
  }
}

// Get latest commit info
async function getLatestCommitInfo() {
  try {
    const res = await axios.get(`https://api.github.com/repos/${githubRepo}/commits/main`, {
      headers: { 'User-Agent': 'DaveAI-Updater' },
      timeout: 10000
    });
    const commit = res.data;
    return {
      message: commit.commit.message,
      author: commit.commit.author.name,
      date: new Date(commit.commit.author.date).toLocaleString(),
      sha: commit.sha.substring(0, 7)
    };
  } catch {
    return null;
  }
}

// Git-based update
async function updateViaGit(dave, m) {
  try {
    safetyChecks();
    const backupDir = backupCriticalFiles();

    await dave.sendMessage(m.chat, { text: '🔁 Updating via Git…' });
    await run('git reset --hard');
    await run('git pull origin main');
    await run('npm install --omit=dev --no-audit --no-fund --silent');

    const commit = await getLatestCommitInfo();
    let info = commit
      ? `✅ Updated to latest commit:\n\n📜 ${commit.message}\n👤 ${commit.author}\n🕓 ${commit.date}\n🔢 ${commit.sha}`
      : '✅ Updated via Git successfully.';

    await dave.sendMessage(m.chat, { text: info });
    deleteOldBackupsAndTemps(backupDir);
    await restartProcess();
  } catch (err) {
    console.error('Git update failed:', err.message);
    await dave.sendMessage(m.chat, { text: `Git update failed: ${err.message}` });
  }
}

// ZIP download
async function downloadFile(url, dest) {
  const writer = fs.createWriteStream(dest);
  const response = await axios({ url, method: 'GET', responseType: 'stream', timeout: 60000 });
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

// Copy recursive
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
    } catch (err) {
      console.error(`Copy failed: ${s}`, err.message);
    }
  }
}

// ZIP-based update
async function updateViaZip(dave, m) {
  safetyChecks();

  let currentVersion = 'unknown';
  try { currentVersion = JSON.parse(fs.readFileSync('package.json')).version || 'unknown'; } catch {}

  const updateNeeded = await checkForUpdates();
  if (!updateNeeded) {
    await dave.sendMessage(m.chat, { text: '✅Already on latest version.' });
    deleteOldBackupsAndTemps();
    return;
  }

  const backupDir = backupCriticalFiles();
  const latestCommit = await getLatestCommitInfo();
  const changelog = latestCommit
    ? `\n\n📜 ${latestCommit.message}\n👤 ${latestCommit.author}\n🕓 ${latestCommit.date}\n🔢 ${latestCommit.sha}`
    : '';

  const tmpDir = path.join(process.cwd(), 'tmp_update');
  const zipPath = path.join(tmpDir, 'update.zip');
  const extractTo = path.join(tmpDir, 'update_extract');
  if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true, force: true });
  fs.mkdirSync(tmpDir, { recursive: true });

  try {
    await dave.sendMessage(m.chat, { text: `Downloading update (v${currentVersion})...${changelog}` });
    await downloadFile(global.updateZipUrl, zipPath);
    await dave.sendMessage(m.chat, { text: 'Extracting update...' });
    await extractZip(zipPath, extractTo);

    const folders = fs.readdirSync(extractTo);
    const mainFolder = folders.length === 1 ? path.join(extractTo, folders[0]) : extractTo;

    await dave.sendMessage(m.chat, { text: 'Copying new files...' });
    await copyRecursive(mainFolder, process.cwd(), [
      'node_modules', '.git', 'session', 'tmp', 'tmp_update', '.env',
      'config.js', 'settings.js', 'database.json'
    ]);

    await run('npm install --omit=dev --no-audit --no-fund --silent');
    await dave.sendMessage(m.chat, { text: 'Update complete! Restarting...' });

    deleteOldBackupsAndTemps(backupDir);
    if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true, force: true });
    await restartProcess();

  } catch (err) {
    console.error('Update Error:', err.message);
    await copyRecursive(backupDir, process.cwd());
    await dave.sendMessage(m.chat, { text: `Update failed: ${err.message}\nRestored from backup.` });
    deleteOldBackupsAndTemps(backupDir);
    setTimeout(() => process.exit(1), 2000);
  }
}

// Command entry
let daveplug = async (m, { dave, daveshown, command, reply }) => {
  if (!daveshown) return reply('Owner only command.');
  try {
    if (command === 'update') {
      await reply('Checking for updates...');
      if (hasGitRepo()) await updateViaGit(dave, m);
      else await updateViaZip(dave, m);
    } else if (command === 'restart' || command === 'start') {
      await reply('Restarting...');
      await restartProcess();
    } else {
      reply('Usage:\n.update - Update bot\n.restart - Restart bot');
    }
  } catch (err) {
    console.error('Update error:', err);
    reply(`Update failed: ${err.message || err}`);
  }
};

daveplug.help = ['update', 'redeploy', 'start'];
daveplug.tags = ['system'];
daveplug.command = ['update', 'redeploy', 'start'];

module.exports = daveplug;