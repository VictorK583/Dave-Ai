const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { removeBackgroundFromImageFile } = require('remove.bg');

let daveplug = async (m, { dave, reply }) => {
    try {
        if (!m.quoted || m.quoted.mtype !== 'imageMessage') {
            return reply('Send/Reply with an image to remove background\nExample: .removebg');
        }

        const apiKeys = [
            'q61faXzzR5zNU6cvcrwtUkRU', 'S258diZhcuFJooAtHTaPEn4T',
            '5LjfCVAp4vVNYiTjq9mXJWHF', 'aT7ibfUsGSwFyjaPZ9eoJc61',
            'BY63t7Vx2tS68YZFY6AJ4HHF', '5Gdq1sSWSeyZzPMHqz7ENfi8',
            '86h6d6u4AXrst4BVMD9dzdGZ', 'xp8pSDavAgfE5XScqXo9UKHF',
            'dWbCoCb3TacCP93imNEcPxcL'
        ];
        const apiKey = apiKeys[Math.floor(Math.random() * apiKeys.length)];

        const localFilePath = path.join(__dirname, `remobg-${uuidv4()}`);
        const outputFilePath = path.join(__dirname, `hremo-${uuidv4()}.png`);
        const media = await m.quoted.download();

        fs.writeFileSync(localFilePath, media);

        await reply('Processing...');

        removeBackgroundFromImageFile({
            path: localFilePath,
            apiKey,
            size: 'regular',
            type: 'auto',
            scale: '100%',
            outputFile: outputFilePath
        }).then(async () => {
            await dave.sendMessage(m.chat, { 
                image: fs.readFileSync(outputFilePath), 
                caption: `Background removed successfully` 
            }, { quoted: m });
            
            fs.unlinkSync(localFilePath);
            fs.unlinkSync(outputFilePath);
        }).catch(error => {
            console.error('Error processing image:', error);
            reply('There was an error processing the image.');
            fs.unlinkSync(localFilePath);
        });

    } catch (error) {
        console.error('Removebg error:', error.message);
        reply('An error occurred while processing the image');
    }
};

daveplug.help = ['removebg (reply to image)'];
daveplug.tags = ['tools'];
daveplug.command = ['removebg', 'nobg'];

module.exports = daveplug;