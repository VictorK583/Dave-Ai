const yts = require('yt-search');
const axios = require('axios');

let daveplug = async (m, { dave, text, reply, react, args }) => {
    try {
        await react('🎵');

        if (!text) {
            return reply('❌ *Please provide a song name!*\n\nExample: `.song Faded Alan Walker`');
        }

        // Check if user wants document format
        const asDocument = args[0]?.toLowerCase() === '-d';
        const searchQuery = asDocument ? args.slice(1).join(' ') : text;

        const { videos } = await yts(searchQuery);
        if (!videos || videos.length === 0) {
            await react('❌');
            return reply('🔍 *No songs found!* Try a different search term.');
        }

        await reply('⏳ *Downloading...*');

        const video = videos[0];
        const urlYt = video.url;

        const response = await axios.get(`https://api.goodnesstechhost.xyz/download/youtube/audio?url=${urlYt}`);
        const data = response.data;

        if (!data?.status || !data?.result?.download_url) {
            await react('❌');
            return reply('❌ *API Error!* Try again later.');
        }

        const audioUrl = data.result.download_url;
        const title = data.result.title || video.title;
        const duration = video.timestamp || 'Unknown';

        const caption = `🎵 *${title}*\n⏱️ ${duration}\n🔗 ${urlYt}`;

        if (asDocument) {
            // Send as document
            await dave.sendMessage(m.chat, {
                document: { url: audioUrl },
                mimetype: 'audio/mpeg',
                fileName: `${title}.mp3`,
                caption: caption
            }, { quoted: m });
        } else {
            // Send as audio
            await dave.sendMessage(m.chat, {
                audio: { url: audioUrl },
                mimetype: 'audio/mpeg',
                fileName: `${title}.mp3`
            }, { quoted: m });
            
            await reply(caption);
        }

        await react('🔥');

    } catch (error) {
        console.error('SONG ERROR:', error);
        await react('❌');
        return reply('❌ *Download failed!* Try again later.');
    }
};

daveplug.help = ['song'];
daveplug.tags = ['downloader'];
daveplug.command = ['song', 'play', 'music'];

module.exports = daveplug;