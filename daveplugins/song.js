const yts = require('yt-search');
const axios = require('axios');

let daveplug = async (m, { dave, reply, text }) => {
    try {
        if (!text) {
            return dave.sendMessage(m.chat, { 
                text: "specify the song you want stop wasting my time bitch!"
            }, { quoted: m });
        }

        // Search for the song
        const { videos } = await yts(text);
        if (!videos || videos.length === 0) {
            return dave.sendMessage(m.chat, { 
                text: "No songs found!"
            }, { quoted: m });
        }

        // Send loading message
        await dave.sendMessage(m.chat, {
            text: "```hold tight dropping it for you fam```"
        }, { quoted: m });

        // Get the first video result
        const video = videos[0];
        const urlYt = video.url;

        // Fetch audio data from API
        const response = await axios.get(`https://api.goodnesstechhost.xyz/download/youtube/audio?url=${urlYt}`);
        const data = response.data;

        if (!data || !data.status || !data.result || !data.result.download_url) {
            return dave.sendMessage(m.chat, { 
                text: "Failed to fetch audio from the API. Please try again later."
            }, { quoted: m });
        }

        const audioUrl = data.result.download_url;
        const title = data.result.title;

        // Send the audio
        await dave.sendMessage(m.chat, {
            audio: { url: audioUrl },
            mimetype: "audio/mpeg",
            fileName: `${title}.mp3`
        }, { quoted: m });

        //successful react ✔️
        await dave.sendMessage(m.chat, { 
            react: { text: '🔊', key: m.key } 
        });
        
        await dave.sendMessage(m.chat, {
            text: `_Downloaded successfully by DaveAI 🖤_`
        }, { quoted: m });

    } catch (error) {
        console.error('Error in song command:', error);
        await dave.sendMessage(m.chat, { 
            text: "Download failed. Please try again later."
        }, { quoted: m });

        //err react ❌
        await dave.sendMessage(m.chat, {
            react: { text: '❌', key: m.key }
        });
    }
};

daveplug.help = ['song'];
daveplug.tags = ['downloader'];
daveplug.command = ['song'];

module.exports = daveplug;