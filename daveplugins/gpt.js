const axios = require("axios");

let daveplug = async (m, { dave, command, reply }) => {
    try {
        // Add reaction to show processing
        await dave.sendMessage(m.chat, {
            react: { text: '🤔', key: m.key }
        });

        const text = m.text || m.message?.conversation || m.message?.extendedTextMessage?.text;
        
        // Check if query is provided
        if (!text) {
            return await reply(`Please provide a question after *${command}*\n\nExample: *${command} write a basic html code*`);
        }

        // Remove command from text
        const query = text.replace(command, '').trim();
        if (!query) {
            return await reply(`Please provide a question after *${command}*\n\nExample: *${command} write a basic html code*`);
        }

        // Call AI API
        const res = await axios.get(`https://api.nekolabs.my.id/ai/copilot?text=${encodeURIComponent(query)}`);
        
        if (!res.data || !res.data.result || !res.data.result.text) {
            return await reply('❌ No response from AI service');
        }

        // Send AI response
        await reply(res.data.result.text);

        // Add success reaction
        await dave.sendMessage(m.chat, {
            react: { text: '✅', key: m.key }
        });

    } catch (err) {
        console.error('AI Command Error:', err);
        await reply('❌ Error occurred while processing your request');
    }
};

daveplug.help = ['gpt', 'gemini', 'ai'];
daveplug.tags = ['ai'];
daveplug.command = ['gpt', 'gemini', 'ai'];

module.exports = daveplug;