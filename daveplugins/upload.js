const fs = require("fs");
const path = require('path');
const axios = require('axios');

let daveplug = async (m, { dave, reply, uploadtoimgur, text }) => {
    try {
        let mediaBuffer;
        let mime;

        // Check if text is a URL
        if (text && (text.startsWith('http://') || text.startsWith('https://'))) {
            // Download from URL
            const response = await axios.get(text, { responseType: 'arraybuffer' });
            mediaBuffer = Buffer.from(response.data);
            
            // Try to determine mime type from response headers or URL extension
            mime = response.headers['content-type'] || 'image/jpeg';
            
        } else {
            // Handle quoted media
            let q = m.quoted ? m.quoted : m;
            mime = (q.msg || q).mimetype || '';

            if (!mime) {
                return reply('Quote an image/video or provide a URL');
            }

            mediaBuffer = await q.download();
        }

        if (mediaBuffer.length > 10 * 1024 * 1024) {
            return reply('Media is too large.');
        }

        let isTele = /image\/(png|jpe?g|gif)|video\/mp4/.test(mime);

        if (isTele) {
            // Save buffer to temporary file
            const tempPath = path.join(__dirname, `temp_upload_${Date.now()}.tmp`);
            fs.writeFileSync(tempPath, mediaBuffer);
            
            let link = await uploadtoimgur(tempPath);
            
            // Clean up temp file
            fs.unlinkSync(tempPath);
            
            const fileSizeMB = (mediaBuffer.length / (1024 * 1024)).toFixed(2);
            reply(`Media Link:\n\n${link}`);
        } else {
            reply('Unsupported media type');
        }

    } catch (error) {
        console.error('Upload error:', error.message);
        reply('An error occurred while uploading media');
    }
};

daveplug.help = ['upload (reply to image/video or provide URL)'];
daveplug.tags = ['tools'];
daveplug.command = ['upload', 'tourl3'];

module.exports = daveplug;