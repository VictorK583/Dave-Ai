const yts = require('yt-search');
const axios = require('axios');

let daveplug = async (m, { dave, reply, text }) => {
    if (!text) {
        return reply('Please specify the song name!');
    }

    try {
        // Search for song
        const { videos } = await yts(text);
        if (!videos || videos.length === 0) {
            return reply('No songs found!');
        }

        // Pick the first result
        const video = videos[0];
        const urlYt = video.url;

        // Fetch audio info from API
        const response = await axios.get(`https://apis-keith.vercel.app/download/dlmp3?url=${urlYt}`);
        const data = response.data;

        if (!data || !data.status || !data.result || !data.result.downloadUrl) {
            return reply('Failed to fetch audio from the API. Try again later.');
        }

        const audioUrl = data.result.downloadUrl;
        const title = data.result.title;

        // Send as normal playable audio
        await dave.sendMessage(m.chat, {
            audio: { url: audioUrl },
            mimetype: 'audio/mpeg',
            ptt: false, // false = normal audio, true = voice note
            caption: `🎶 *${title}*`
        }, { quoted: m });

    } catch (error) {
        console.error('Error in play2 command:', error);
        reply('Download failed. Please try again later.');
    }
};

daveplug.help = ['play'];
daveplug.tags = ['download'];
daveplug.command = ['play'];

module.exports = daveplug;