const yts = require('yt-search');
const axios = require('axios');

let daveplug = async (m, { dave, text, reply, args }) => {
  const react = async (emoji) => {
    await dave.sendMessage(m.chat, { react: { text: emoji, key: m.key } });
  };

  try {
    await react('🎵');

    if (!text) return reply('*Please provide a song name!*\n\nExample: .song Faded Alan Walker');

    const searchQuery = text.trim();
    const search = await yts(searchQuery);

    if (!search?.videos?.length) {
      await react('🔥');
      return reply('*No songs found!* Try another search.');
    }

    const video = search.videos[0];
    const urlYt = video.url;

    await reply('*Downloading...*');

    const response = await axios.get(`https://api.goodnesstechhost.xyz/download/youtube/audio?url=${urlYt}`);
    const data = response.data;

    const audioUrl = data?.result?.download_url || data?.result?.url;
    const title = data?.result?.title || video.title;

    if (!audioUrl) {
      await react('❌');
      return reply('*Failed to fetch audio link!*');
    }

    await dave.sendMessage(
      m.chat,
      {
        audio: { url: audioUrl },
        mimetype: 'audio/mpeg',
        fileName: `${title}.mp3`,
      },
      { quoted: m }
    );

    await react('🔥');

  } catch (error) {
    console.error('SONG ERROR:', error);
    await react('🔥');
    reply('*Download failed!* Try again later.');
  }
};

daveplug.help = ['song'];
daveplug.tags = ['downloader'];
daveplug.command = ['song', 'audio', 'music'];

module.exports = daveplug;