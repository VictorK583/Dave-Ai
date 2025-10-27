const { Sticker, createSticker, StickerTypes } = require('wa-sticker-formatter')
const canvacord = require("canvacord");

let daveplug = async (m, { dave, q, reply }) => {
    let cap = `Converted By 𝘿𝙖𝙫𝙚𝘼𝙄`;
    
    try {
        let result;
        let img;

        if (m.quoted) {
            try {
                img = await dave.profilePictureUrl(m.quoted.sender, 'image');
            } catch {
                img = "https://telegra.ph/file/9521e9ee2fdbd0d6f4f1c.jpg";
            }
            result = await canvacord.Canvacord.trigger(img);
        } else if (m.mentionedJid && m.mentionedJid.length > 0) {
            try {
                img = await dave.profilePictureUrl(m.mentionedJid[0], 'image');
            } catch {
                img = 'https://telegra.ph/file/9521e9ee2fdbd0d6f4f1c.jpg';
            }
            result = await canvacord.Canvacord.trigger(img);
        } else {
            try {
                img = await dave.profilePictureUrl(m.sender, 'image');
            } catch {
                img = 'https://telegra.ph/file/9521e9ee2fdbd0d6f4f1c.jpg';
            }
            result = await canvacord.Canvacord.trigger(img);
        }

        let sticker = new Sticker(result, {
            pack: `𝘿𝙖𝙫𝙚𝘼𝙄`,
            author: "dave",
            categories: ['🤩', '🎉'],
            id: '12345',
            quality: 75,
            background: 'transparent'
        })
        const stikk = await sticker.toBuffer()
        await dave.sendMessage(m.chat, {sticker: stikk}, {quoted: m})

    } catch (e) {
        reply("Something wrong occurred.");
    }
};

daveplug.help = ['trigger'];
daveplug.tags = ['fun'];
daveplug.command = ['trigger'];

module.exports = daveplug;