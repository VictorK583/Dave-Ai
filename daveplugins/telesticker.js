const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const webp = require('node-webpmux');
const crypto = require('crypto');
const { exec } = require('child_process');
const settings = require('../settings');

let daveplug = async (m, { dave, reply, text, prefix, command }) => {
    try {
        const args = text ? text.trim().split(' ').slice(1) : [];

        if (!args[0]) {
            return await reply(`Please enter the Telegram sticker URL!\n\nExample: ${prefix + command} https://t.me/addstickers/Porcientoreal`);
        }

        if (!args[0].match(/(https:\/\/t.me\/addstickers\/)/gi)) {
            return await reply('Invalid URL! Make sure it is a Telegram sticker URL.');
        }

        await dave.sendMessage(m.chat, { react: { text: '...', key: m.key } });

        const packName = args[0].replace("https://t.me/addstickers/", "");
        const botToken = '7801479976:AAGuPL0a7kXXBYz6XUSR_ll2SR5V_W6oHl4';

        const response = await fetch(`https://api.telegram.org/bot${botToken}/getStickerSet?name=${encodeURIComponent(packName)}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const stickerSet = await response.json();
        if (!stickerSet.ok || !stickerSet.result) throw new Error('Invalid sticker pack or API response');

        await reply(`Found ${stickerSet.result.stickers.length} stickers\nStarting download...`);

        const tempDir = path.join(process.cwd(), 'temp'); // Use your existing temp folder

        let successCount = 0;
        for (let i = 0; i < stickerSet.result.stickers.length; i++) {
            try {
                const sticker = stickerSet.result.stickers[i];
                const fileId = sticker.file_id;

                const fileInfo = await fetch(`https://api.telegram.org/bot${botToken}/getFile?file_id=${fileId}`);
                if (!fileInfo.ok) continue;
                const fileData = await fileInfo.json();
                if (!fileData.ok || !fileData.result.file_path) continue;

                const fileUrl = `https://api.telegram.org/file/bot${botToken}/${fileData.result.file_path}`;
                const imageBuffer = await (await fetch(fileUrl)).buffer();

                const tempInput = path.join(tempDir, `input_${i}.tgs`);
                const tempOutput = path.join(tempDir, `output_${i}.webp`);

                fs.writeFileSync(tempInput, imageBuffer);

                const isAnimated = sticker.is_animated || sticker.is_video;
                const ffmpegCommand = isAnimated
                    ? `ffmpeg -i "${tempInput}" -vf "scale=512:512:force_original_aspect_ratio=decrease,fps=15,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000" -c:v libwebp -preset default -loop 0 -vsync 0 -pix_fmt yuva420p -quality 75 -compression_level 6 "${tempOutput}"`
                    : `ffmpeg -i "${tempInput}" -vf "scale=512:512:force_original_aspect_ratio=decrease,format=rgba,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000" -c:v libwebp -preset default -loop 0 -vsync 0 -pix_fmt yuva420p -quality 75 -compression_level 6 "${tempOutput}"`;

                await new Promise((resolve, reject) => {
                    exec(ffmpegCommand, (error) => (error ? reject(error) : resolve()));
                });

                const webpBuffer = fs.readFileSync(tempOutput);
                const img = new webp.Image();
                await img.load(webpBuffer);

                const metadata = {
                    'sticker-pack-id': crypto.randomBytes(32).toString('hex'),
                    'sticker-pack-name': settings.packname || 'DaveAI',
                    'sticker-pack-publisher': settings.author || 'DaveAI',
                    'emojis': sticker.emoji ? [sticker.emoji] : []
                };

                const exifAttr = Buffer.from([
                    0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00,
                    0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00,
                    0x00, 0x00, 0x16, 0x00, 0x00, 0x00
                ]);
                const jsonBuffer = Buffer.from(JSON.stringify(metadata), 'utf8');
                const exif = Buffer.concat([exifAttr, jsonBuffer]);
                exif.writeUIntLE(jsonBuffer.length, 14, 4);
                img.exif = exif;

                const finalBuffer = await img.save(null);
                await dave.sendMessage(m.chat, { sticker: finalBuffer });

                successCount++;
                await new Promise(resolve => setTimeout(resolve, 800));

                fs.unlinkSync(tempInput);
                fs.unlinkSync(tempOutput);

            } catch (err) {
                console.error(`Error processing sticker ${i}:`, err);
                continue;
            }
        }

        await dave.sendMessage(m.chat, { react: { text: '✓', key: m.key } });
        await reply(`Successfully downloaded ${successCount}/${stickerSet.result.stickers.length} stickers!`);

    } catch (error) {
        console.error('Telegram Sticker Command Error:', error);
        await dave.sendMessage(m.chat, { react: { text: '✗', key: m.key } });
        await reply('Failed to process Telegram stickers! Check if:\n1. The URL is correct\n2. The sticker pack exists\n3. The sticker pack is public');
    }
};

daveplug.help = ['tgs', 'telegram'];
daveplug.tags = ['media'];
daveplug.command = ['tellesticker', 'telegramsticker', 'tstick'];

module.exports = daveplug;