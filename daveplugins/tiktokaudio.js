const fetch = require("node-fetch");

let daveplug = async (m, { dave, reply, text }) => {
  try {
    if (!text) return reply('Provide a TikTok link for the audio.');
    if (!text.includes("tiktok.com")) return reply('Invalid TikTok link.');

    const apiUrl = `https://api.dreaded.site/api/tiktok?url=${text}`;
    reply('Fetching TikTok audio...');

    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error(`API error: ${response.status}`);

    const data = await response.json();
    if (!data || !data.tiktok || !data.tiktok.music) throw new Error('No audio found for that TikTok link.');

    const audioUrl = data.tiktok.music;
    reply('TikTok audio found. Downloading...');

    // Download audio with headers to prevent CDN block
    const audioRes = await fetch(audioUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10)',
        'Referer': 'https://www.tiktok.com/',
      },
    });

    if (!audioRes.ok) throw new Error(`Failed to fetch audio file: ${audioRes.status}`);

    const audioBuffer = Buffer.from(await audioRes.arrayBuffer());

    await dave.sendMessage(m.chat, {
      audio: audioBuffer,
      mimetype: 'audio/mpeg',
      fileName: 'tiktok_audio.mp3',
      ptt: false,
    }, { quoted: m });

  } catch (error) {
    console.error('TikTok audio error:', error);
    reply(`Error: ${error.message}`);
  }
};

daveplug.help = ['tiktokaudio <tiktok url>'];
daveplug.tags = ['downloader'];
daveplug.command = ['tiktokaudio', 'tta', 'tiktokmp3', 'tiktokmusic'];

module.exports = daveplug;