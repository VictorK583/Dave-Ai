const acrcloud = require("acrcloud");
const yts = require("yt-search");
const ytdl = require("ytdl-core");

let daveplug = async (m, { dave, reply, mime }) => {
    try {
        let acr = new acrcloud({
            host: 'identify-ap-southeast-1.acrcloud.com',
            access_key: '26afd4eec96b0f5e5ab16a7e6e05ab37',
            access_secret: 'wXOZIqdMNZmaHJP1YDWVyeQLg579uK2CfY6hWMN8'
        });

        if (!/video|audio/.test(mime)) {
            return reply("Tag a short video or audio for the bot to analyse.");
        }

        let p = m.quoted ? m.quoted : m;
        let buffer = await p.download();

        let { status, metadata } = await acr.identify(buffer);
        if (status.code !== 0) return reply(status.msg); 
        
        let { title, artists, album, genres, release_date } = metadata.music[0];
        let txt = `Title: ${title}`;
        if (artists) txt += `\nArtists: ${artists.map(v => v.name).join(', ')}`;
        if (album) txt += `\nAlbum: ${album.name}`;
        if (genres) txt += `\nGenres: ${genres.map(v => v.name).join(', ')}`;
        txt += `\nRelease Date: ${release_date}`;
        
        reply(txt.trim());

    } catch (error) {
        console.error('Song recognition error:', error.message);
        reply("Song not recognisable");
    }
};

daveplug.help = ['shazam (reply to audio/video)'];
daveplug.tags = ['tools'];
daveplug.command = ['shazam', 'whatsong', 'whoisartist', 'songname'];

module.exports = daveplug;