const axios = require('axios');

let daveplug = async (m, { dave, reply }) => {
    try {
        // Add processing reaction
        await dave.sendMessage(m.chat, {
            react: { text: '...', key: m.key }
        });

        const apiKey = 'dcd720a6f1914e2d9dba9790c188c08c';
        const response = await axios.get(`https://newsapi.org/v2/top-headlines?country=us&apiKey=${apiKey}`);
        const articles = response.data.articles.slice(0, 5);
        
        let newsMessage = 'Latest News:\n\n';
        articles.forEach((article, index) => {
            newsMessage += `${index + 1}. ${article.title}\n${article.description}\n\n`;
        });

        // Add success reaction
        await dave.sendMessage(m.chat, {
            react: { text: '✓', key: m.key }
        });

        await reply(newsMessage);

    } catch (error) {
        console.error('News Command Error:', error);
        
        // Add error reaction
        await dave.sendMessage(m.chat, {
            react: { text: '✗', key: m.key }
        });
        
        await reply('Sorry, I could not fetch news right now. Please try again later.');
    }
};

daveplug.help = ['news'];
daveplug.tags = ['information'];
daveplug.command = ['news'];

module.exports = daveplug;