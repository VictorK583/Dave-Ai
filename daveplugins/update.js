const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// 🔗 Update source (your GitHub ZIP link)
global.updateZipUrl = "https://codeload.github.com/giftdedavesmd/Dave-Ai/zip/refs/heads/main";

// Utility to run shell commands
function run(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, { windowsHide: true }, (err, stdout, stderr) => {
      if (err) return reject(stderr || stdout || err.message);
      resolve(stdout.toString());
    });
  });
}

// Download ZIP with redirect support
async function downloadFile(url, dest) {
  const writer = fs.createWriteStream(dest);
  const response = await axios({
    url,
    method: 'GET',
    responseType: 'stream',
    maxRedirects: 5, // ✅ follows 302 redirects
  });
  response.data.pipe(writer);
  return new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });
}

// Extract ZIP file
async function extractZip(zipPath, outDir) {
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  await run(`unzip -o "${zipPath}" -d "${outDir}"`);
}

// Copy recursively while ignoring key folders
async function copyRecursive(src, dest, ignore = []) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src)) {
    if (ignore.includes(entry)) continue;
    const s = path.join(src, entry);
    const d = path.join(dest, entry);
    const stat = fs.lstatSync(s);
    if (stat.isDirectory()) await copyRecursive(s, d, ignore);
    else fs.copyFileSync(s, d);
  }
}

// Main updater
async function updateViaZip(dave, m) {
  const zipUrl = (global.updateZipUrl || process.env.UPDATE_ZIP_URL || '').trim();
  if (!zipUrl) throw new Error('No ZIP URL configured in global.updateZipUrl.');

  // 🔍 Get current version
  let currentVersion = 'unknown';
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json')));
    currentVersion = pkg.version || 'unknown';
  } catch (e) {
    console.warn('⚠️ Could not read package.json version:', e.message);
  }

  const tmpDir = path.join(process.cwd(), 'tmp');
  const zipPath = path.join(tmpDir, 'update.zip');
  const extractTo = path.join(tmpDir, 'update_extract');

  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
  if (fs.existsSync(extractTo)) fs.rmSync(extractTo, { recursive: true, force: true });

  await dave.sendMessage(m.chat, { text: `📦 *𝘿𝙖𝙫𝙚𝘼𝙄 Updater*\n\n🧩 Current version: v${currentVersion}\n🔄 Downloading update...` }, { quoted: m });

  await downloadFile(zipUrl, zipPath);
  await dave.sendMessage(m.chat, { text: '📂 Extracting update files...' }, { quoted: m });

  await extractZip(zipPath, extractTo);

  const folders = fs.readdirSync(extractTo);
  const mainFolder = folders.length === 1 ? path.join(extractTo, folders[0]) : extractTo;

  await copyRecursive(mainFolder, process.cwd(), [
    'node_modules', '.git', 'session', 'tmp', '.env'
  ]);

  fs.rmSync(tmpDir, { recursive: true, force: true });
  await run('npm install --no-audit --no-fund');

  await dave.sendMessage(m.chat, {
    text: `✅ *Update complete!*\n\n✨ 𝘿𝙖𝙫𝙚𝘼𝙄 has been successfully updated from *v${currentVersion}* to *latest version*.\n\n♻️ Restarting...`
  }, { quoted: m });

  setTimeout(() => process.exit(0), 2000);
}

// Plugin definition
let daveplug = async (m, { dave, daveshown, command, reply }) => {
  if (!daveshown) return reply('⚠️ Only the owner can use this command.');

  try {
    if (command === 'update') {
      await updateViaZip(dave, m);
    } else if (command === 'restart' || command === 'start') {
      await reply('♻️ Restarting 𝘿𝙖𝙫𝙚𝘼𝙄...');
      setTimeout(() => process.exit(0), 1000);
    } else {
      reply('Usage: .update or .restart');
    }
  } catch (err) {
    console.error(err);
    reply(`❌ Update failed: ${err.message}`);
  }
};

daveplug.help = ['update', 'restart', 'start'];
daveplug.tags = ['system'];
daveplug.command = ['update', 'restart', 'start'];

module.exports = daveplug;