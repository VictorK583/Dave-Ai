const yts = require('yt-search');
const axios = require('axios');

let daveplug = async (m, { dave, reply, text }) => {
    try {
        if (!text) {
            return reply('Usage: .play <song name>\nExample: .play Not Like Us');
        }

        const search = await yts(text);
        const video = search.videos[0];

        if (!video) {
            return reply('No songs found for your query. Please try different keywords.');
        }

        const safeTitle = video.title.replace(/[\\/:*?"<>|]/g, '');
        const fileName = `${safeTitle}.mp3`;
        const apiURL = `https://noobs-api.top/dipto/ytDl3?link=${encodeURIComponent(video.videoId)}&format=mp3`;

        const response = await axios.get(apiURL, { timeout: 30000 });
        const data = response.data;

        if (!data.downloadLink) {
            return reply('Failed to retrieve the MP3 download link. Please try again later.');
        }

        await dave.sendMessage(m.chat, {
            document: { url: data.downloadLink },
            mimetype: 'audio/mpeg',
        }, { quoted: m });

    } catch (err) {
        console.error('Play error:', err.message);
        reply('An error occurred while processing your request');
    }
};

daveplug.help = ['play'];
daveplug.tags = ['downloader'];
daveplug.command = ['play'];

module.exports = daveplug;