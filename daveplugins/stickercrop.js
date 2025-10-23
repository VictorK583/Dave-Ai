const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const settings = require('../settings');
const webp = require('node-webpmux');
const crypto = require('crypto');

let daveplug = async (m, { dave, reply, quoted }) => {
    try {
        // Use quoted message if available, otherwise use current message
        const targetMessage = quoted ? quoted : m;
        
        const mediaMessage = targetMessage.message?.imageMessage || targetMessage.message?.videoMessage || targetMessage.message?.documentMessage || targetMessage.message?.stickerMessage;

        if (!mediaMessage) {
            return await reply('Please reply to an image/video/sticker with .crop, or send an image/video/sticker with .crop as the caption.');
        }

        // Add processing reaction
        await dave.sendMessage(m.chat, {
            react: { text: '...', key: m.key }
        });

        const mediaBuffer = await downloadMediaMessage(targetMessage, 'buffer', {}, { 
            logger: undefined, 
            reuploadRequest: dave.updateMediaMessage 
        });

        if (!mediaBuffer) {
            return await reply('Failed to download media. Please try again.');
        }

        // Create temp directory if it doesn't exist
        const tmpDir = path.join(process.cwd(), 'tmp');
        if (!fs.existsSync(tmpDir)) {
            fs.mkdirSync(tmpDir, { recursive: true });
        }

        // Generate temp file paths
        const tempInput = path.join(tmpDir, `temp_${Date.now()}`);
        const tempOutput = path.join(tmpDir, `crop_${Date.now()}.webp`);

        // Write media to temp file
        fs.writeFileSync(tempInput, mediaBuffer);

        // Check if media is animated (GIF or video)
        const isAnimated = mediaMessage.mimetype?.includes('gif') || 
                          mediaMessage.mimetype?.includes('video') || 
                          mediaMessage.seconds > 0;

        // Convert to WebP using ffmpeg with crop to square
        // The crop filter will center-crop the image to a square
        const ffmpegCommand = isAnimated
            ? `ffmpeg -i "${tempInput}" -vf "crop=min(iw\\,ih):min(iw\\,ih),scale=512:512,fps=15" -c:v libwebp -preset default -loop 0 -vsync 0 -pix_fmt yuva420p -quality 75 -compression_level 6 "${tempOutput}"`
            : `ffmpeg -i "${tempInput}" -vf "crop=min(iw\\,ih):min(iw\\,ih),scale=512:512,format=rgba" -c:v libwebp -preset default -loop 0 -vsync 0 -pix_fmt yuva420p -quality 75 -compression_level 6 "${tempOutput}"`;

        await new Promise((resolve, reject) => {
            exec(ffmpegCommand, (error) => {
                if (error) {
                    console.error('FFmpeg error:', error);
                    reject(error);
                } else resolve();
            });
        });

        // Read the WebP file
        const webpBuffer = fs.readFileSync(tempOutput);

        // Add metadata using webpmux
        const img = new webp.Image();
        await img.load(webpBuffer);

        // Create metadata
        const json = {
            'sticker-pack-id': crypto.randomBytes(32).toString('hex'),
            'sticker-pack-name': settings.packname || 'DaveAI',
            'sticker-pack-publisher': settings.author || 'DaveAI',
            'emojis': ['✂️']
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

        // Cleanup temp files
        try {
            fs.unlinkSync(tempInput);
            fs.unlinkSync(tempOutput);
        } catch (err) {
            console.error('Error cleaning up temp files:', err);
        }

    } catch (error) {
        console.error('Sticker Crop Command Error:', error);
        
        // Add error reaction
        await dave.sendMessage(m.chat, {
            react: { text: '✗', key: m.key }
        });
        
        await reply('Failed to crop sticker! Make sure ffmpeg is installed and try again with a different image/video.');
    }
};

daveplug.help = ['crop'];
daveplug.tags = ['media'];
daveplug.command = ['scrop', 'stickercrop'];

module.exports = daveplug;