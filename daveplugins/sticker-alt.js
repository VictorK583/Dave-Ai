const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { exec } = require('child_process');
const fs = require('fs');

let daveplug = async (m, { dave, reply, quoted }) => {
    try {
        // Check if there's a quoted message
        if (!quoted) {
            return await reply('Please reply to an image or video!');
        }

        const type = Object.keys(quoted.message)[0];
        if (!['imageMessage', 'videoMessage'].includes(type)) {
            return await reply('Please reply to an image or video!');
        }

        // Add processing reaction
        await dave.sendMessage(m.chat, {
            react: { text: '...', key: m.key }
        });

        const stream = await downloadContentFromMessage(quoted.message[type], type.split('Message')[0]);
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }

        const tempInput = `./temp/temp_${Date.now()}.${type === 'imageMessage' ? 'jpg' : 'mp4'}`;
        const tempOutput = `./temp/sticker_${Date.now()}.webp`;

        // Create temp directory if it doesn't exist
        if (!fs.existsSync('./temp')) {
            fs.mkdirSync('./temp', { recursive: true });
        }

        fs.writeFileSync(tempInput, buffer);

        // Convert to WebP using ffmpeg
        await new Promise((resolve, reject) => {
            const cmd = type === 'imageMessage' 
                ? `ffmpeg -i "${tempInput}" -vf "scale='min(320,iw)':min'(320,ih)':force_original_aspect_ratio=decrease" "${tempOutput}"`
                : `ffmpeg -i "${tempInput}" -vf "scale='min(320,iw)':min'(320,ih)':force_original_aspect_ratio=decrease" -c:v libwebp -preset default -loop 0 -vsync 0 -t 6 "${tempOutput}"`;
            
            exec(cmd, (error) => {
                if (error) reject(error);
                else resolve();
            });
        });

        // Add success reaction
        await dave.sendMessage(m.chat, {
            react: { text: '✓', key: m.key }
        });

        // Send the sticker
        await dave.sendMessage(m.chat, { 
            sticker: fs.readFileSync(tempOutput) 
        });

        // Cleanup
        fs.unlinkSync(tempInput);
        fs.unlinkSync(tempOutput);

    } catch (error) {
        console.error('Sticker Command Error:', error);
        
        // Add error reaction
        await dave.sendMessage(m.chat, {
            react: { text: '✗', key: m.key }
        });
        
        await reply('Failed to create sticker! Make sure ffmpeg is installed.');
    }
};

daveplug.help = ['sticker'];
daveplug.tags = ['media'];
daveplug.command = ['tosticker', 's'];

module.exports = daveplug;