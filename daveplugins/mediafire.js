const axios = require('axios');
const cheerio = require('cheerio');

let daveplug = async (m, { dave, reply, text }) => {
    try {
        if (!text) {
            return reply('Provide mediafire link for download');
        }

        if (!text.includes('mediafire.com')) {
            return reply('Doesnt look like a mediafire link');
        }

        await reply('A moment...');

        async function MediaFire(url, options) {
            try {
                let mime;
                options = options ? options : {};
                const res = await axios.get(url, options);
                const $ = cheerio.load(res.data);
                const hasil = [];
                const link = $('a#downloadButton').attr('href');
                const size = $('a#downloadButton').text().replace('Download', '').replace('(', '').replace(')', '').replace('\n', '').replace('\n', '').replace('                         ', '');
                const seplit = link.split('/');
                const nama = seplit[5];
                mime = nama.split('.');
                mime = mime[1];
                hasil.push({ nama, mime, size, link });
                return hasil;
            } catch (err) {
                return err;
            }
        }

        const fileInfo = await MediaFire(text);

        if (!fileInfo || !fileInfo.length) {
            return reply('Sorry, this file is no longer stored in mediafire.');
        }

        await dave.sendMessage(m.chat, {
            document: {
                url: fileInfo[0].link,
            },
            fileName: fileInfo[0].nama,
            mimetype: fileInfo[0].mime,
            caption: `${fileInfo[0].nama} downloaded by DaveAI`,
        }, { quoted: m });

    } catch (error) {
        console.error('Mediafire error:', error.message);
        reply('An error occurred: ' + error.message);
    }
};

daveplug.help = ['mediafire'];
daveplug.tags = ['downloader'];
daveplug.command = ['mediafire'];

module.exports = daveplug;