const fetch = require('node-fetch');
const cheerio = require('cheerio');

let daveplug = async (m, { reply, text }) => {
    try {
        if (!text) {
            return reply("Provide a valid web link to fetch");
        }

        if (!/^https?:\/\//i.test(text)) {
            return reply("Please provide a URL starting with http:// or https://");
        }

        const response = await fetch(text);
        const html = await response.text();
        const $ = cheerio.load(html);

        const mediaFiles = [];
        $('img[src], video[src], audio[src]').each((i, element) => {
            let src = $(element).attr('src');
            if (src) {
                mediaFiles.push(src);
            }
        });

        const cssFiles = [];
        $('link[rel="stylesheet"]').each((i, element) => {
            let href = $(element).attr('href');
            if (href) {
                cssFiles.push(href);
            }
        });

        const jsFiles = [];
        $('script[src]').each((i, element) => {
            let src = $(element).attr('src');
            if (src) {
                jsFiles.push(src);
            }
        });

        let result = `Website Analysis Results:\n\n`;

        if (cssFiles.length > 0) {
            result += `CSS Files Found: ${cssFiles.length}\n`;
        } else {
            result += `No external CSS files found\n`;
        }

        if (jsFiles.length > 0) {
            result += `JavaScript Files Found: ${jsFiles.length}\n`;
        } else {
            result += `No external JavaScript files found\n`;
        }

        if (mediaFiles.length > 0) {
            result += `Media Files Found: ${mediaFiles.length}\n`;
        } else {
            result += `No media files found\n`;
        }

        result += `\nHTML content length: ${html.length} characters`;

        await reply(result);

    } catch (error) {
        console.error('Web fetch error:', error.message);
        reply("An error occurred while fetching the website content");
    }
};

daveplug.help = ['webfetch <url>'];
daveplug.tags = ['tools'];
daveplug.command = ['webfetch', 'webcrawl', 'fetchweb'];

module.exports = daveplug;