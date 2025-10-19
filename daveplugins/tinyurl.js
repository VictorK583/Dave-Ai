let daveplug = async (m, { reply, text, fetchJson }) => {
    try {
        if (!text) {
            return reply("Please provide a URL to shorten");
        }

        const urlRegex = /^(http:\/\/|https:\/\/)[^\s/$.?#].[^\s]*$/i;
        if (!urlRegex.test(text)) {
            return reply("That doesn't appear to be a valid URL");
        }

        let data = await fetchJson(`https://api.dreaded.site/api/shorten-url?url=${encodeURIComponent(text)}`);

        if (!data || data.status !== 200 || !data.result || !data.result.shortened_url) {
            return reply("URL shortening service didn't respond correctly. Please try again later");
        }

        const shortenedUrl = data.result.shortened_url;
        const originalUrl = data.result.original_url;

        await reply(`Original URL: ${originalUrl}\n\nShortened URL: ${shortenedUrl}`);

    } catch (error) {
        console.error('URL shorten error:', error.message);
        reply("An error occurred while shortening the URL");
    }
};

daveplug.help = ['shorturl <url>'];
daveplug.tags = ['tools'];
daveplug.command = ['shorturl', 'shorten', 'urlshort', 'tinyurl'];

module.exports = daveplug;