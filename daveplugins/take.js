const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const webp = require('node-webpmux');
const crypto = require('crypto');

let daveplug = async (m, { dave, reply, quoted, text, prefix, command }) => {
    try {
        // Check if message is a reply to a sticker
        if (!quoted?.message?.stickerMessage) {
            return await reply('Reply to a sticker with .take <packname>');
        }

        // Get the packname from text or use default
        const packname = text ? text.trim() : 'DaveAI';

        // Add processing reaction
        await dave.sendMessage(m.chat, {
            react: { text: '...', key: m.key }
        });

        // Download the sticker
        const stickerBuffer = await downloadMediaMessage(
            quoted,
            'buffer',
            {},
            {
                logger: undefined,
                reuploadRequest: dave.updateMediaMessage
            }
        );

        if (!stickerBuffer) {
            return await reply('Failed to download sticker');
        }

        // Add metadata using webpmux
        const img = new webp.Image();
        await img.load(stickerBuffer);

        // Create metadata
        const json = {
            'sticker-pack-id': crypto.randomBytes(32).toString('hex'),
            'sticker-pack-name': packname,
            'sticker-pack-publisher': 'DaveAI',
            'emojis': ['🤖']
        };

        // Create exif buffer
        const exifAttr = Buffer.from([0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00]);
        const jsonBuffer = Buffer.from(JSON.stringify(json), 'utf8');
        const exif = Buffer.concat([exifAttr, jsonBuffer]);
        exif.writeUIntLE(jsonBuffer.length, 14, 4);

        // Set the exif data
        img.exif = exif;

        // Get the final buffer with metadata
        const finalBuffer = await img.save(null);

        // Add success reaction
        await dave.sendMessage(m.chat, {
            react: { text: '✓', key: m.key }
        });

        // Send the sticker
        await dave.sendMessage(m.chat, {
            sticker: finalBuffer
        });

    } catch (error) {
        console.error('Take Command Error:', error);
        
        // Add error reaction
        await dave.sendMessage(m.chat, {
            react: { text: '✗', key: m.key }
        });
        
        await reply('Error processing sticker. Please try again with a different sticker.');
    }
};

daveplug.help = ['take'];
daveplug.tags = ['media'];
daveplug.command = ['take', 'steal'];

module.exports = daveplug;