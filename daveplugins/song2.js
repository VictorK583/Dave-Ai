const yts = require("yt-search");

let daveplug = async (m, { reply, text }) => {
    try {
        if (!text) {
            return reply('Yo, dumbass, give me a song name! 🎵 Don’t waste my time. <song name>\nExample: .song2 Not Like Us');
        }

        if (text.length > 100) {
            return reply('What’s this essay, loser? Keep the song name short, max 100 chars.');
        }

        const { videos } = await yts(text);
        if (!videos || videos.length === 0) {
            return reply('No songs found. Try something else');
        }

        const song = videos[0];
        const title = song.title;
        const artist = song.author?.name || "Unknown Artist";
        const views = song.views?.toLocaleString() || "Unknown";
        const duration = song.duration?.toString() || "Unknown";
        const uploaded = song.ago || "Unknown";
        const videoUrl = song.url;

        const response = `Title: ${title}\n` +
                        `Artist: ${artist}\n` +
                        `Views: ${views}\n` +
                        `Duration: ${duration}\n` +
                        `Uploaded: ${uploaded}\n` +
                        `URL: ${videoUrl}`;

        await reply(response);

    } catch (error) {
        console.error('Song2 error:', error.message);
        reply('An error occurred while searching for the song');
    }
};

daveplug.help = ['song2 <song name>'];
daveplug.tags = ['search'];
daveplug.command = ['song2', 'audio2', 'play3'];

module.exports = daveplug;
