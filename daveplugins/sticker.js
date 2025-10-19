const { Sticker, createSticker, StickerTypes } = require('wa-sticker-formatter');
const fs = require('fs').promises;
const path = require('path');
const { queue } = require('async');

const commandQueue = queue(async (task, callback) => {
    try {
        await task.run(task.context);
    } catch (error) {
        console.error(`Sticker error: ${error.message}`);
    }
    callback();
}, 1);

let daveplug = async (m, { dave, reply, mime }) => {
    commandQueue.push({
        context: { dave, m, mime, reply },
        run: async ({ dave, m, mime, reply }) => {
            try {
                if (!m.quoted) {
                    return reply('Quote an image or a short video');
                }

                if (!/image|video/.test(mime)) {
                    return reply('That is neither an image nor a short video');
                }

                if (m.quoted.videoMessage && m.quoted.videoMessage.seconds > 30) {
                    return reply('Videos must be 30 seconds or shorter');
                }

                const tempFile = path.join(__dirname, `temp-sticker-${Date.now()}.${/image/.test(mime) ? 'jpg' : 'mp4'}`);
                await reply('Creating sticker...');

                const media = await dave.downloadAndSaveMediaMessage(m.quoted, tempFile);

                const stickerResult = new Sticker(media, {
                    pack: 'DaveAI Pack',
                    author: 'DaveAI',
                    type: StickerTypes.FULL,
                    categories: ['🤩', '🎉'],
                    id: '12345',
                    quality: 50,
                    background: 'transparent'
                });

                const buffer = await stickerResult.toBuffer();
                await dave.sendMessage(m.chat, { sticker: buffer }, { quoted: m });

                await fs.unlink(tempFile).catch(() => console.warn('Failed to delete temp file'));
            } catch (error) {
                console.error(`Sticker error: ${error.message}`);
                reply('An error occurred while creating the sticker');
            }
        }
    });
};

daveplug.help = ['sticker (reply to image/video)'];
daveplug.tags = ['tools'];
daveplug.command = ['sticker', 's'];

module.exports = daveplug;