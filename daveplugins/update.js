const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');

function run(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, { windowsHide: true }, (err, stdout, stderr) => {
      if (err) return reject(stderr || stdout || err.message);
      resolve(stdout.toString());
    });
  });
}

async function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, res => {
      if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
    }).on('error', err => {
      fs.unlink(dest, () => reject(err));
    });
  });
}

async function extractZip(zipPath, outDir) {
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  await run(`unzip -o "${zipPath}" -d "${outDir}"`);
}

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

async function updateViaZip(dave, m) {
  const zipUrl = (global.updateZipUrl || process.env.UPDATE_ZIP_URL || '').trim();
  if (!zipUrl) throw new Error('No ZIP URL configured in global.updateZipUrl.');

  const tmpDir = path.join(process.cwd(), 'tmp');
  const zipPath = path.join(tmpDir, 'update.zip');
  const extractTo = path.join(tmpDir, 'update_extract');

  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
  if (fs.existsSync(extractTo)) fs.rmSync(extractTo, { recursive: true, force: true });

  await dave.sendMessage(m.chat, { text: '📦 Downloading update package...' }, { quoted: m });
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

  await dave.sendMessage(m.chat, { text: '✅ Update complete! Restarting...' }, { quoted: m });
  setTimeout(() => process.exit(0), 1500);
}

let daveplug = async (m, { dave, daveshown, command, reply }) => {
  if (!daveshown) return reply('⚠️ Only the owner can use this command.');

  try {
    if (command === 'update') {
      await updateViaZip(dave, m);
    } else if (command === 'restart' || command === 'start') {
      await reply('♻️ Restarting 𝐃𝐀𝐕𝐄-𝐗𝐌𝐃...');
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