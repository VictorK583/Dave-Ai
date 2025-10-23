const axios = require('axios');

let daveplug = async (m, { command, text, dave, xprefix }) => {
    if (!text) {
        return dave.sendMessage(m.chat, {
            text: `Example: ${xprefix}gemma What is artificial intelligence?`
        }, { quoted: m });
    }

    await dave.sendMessage(m.chat, { react: { text: '.', key: m.key } });

    try {
        // 1️⃣ Main API - Velyn Gemma
        const velynUrl = `https://www.velyn.biz.id/api/ai/gemma-2-9b-it?prompt=${encodeURIComponent(text)}`;
        const velynRes = await axios.get(velynUrl, { timeout: 15000 });

        if (velynRes.data?.status && velynRes.data?.data) {
            return dave.sendMessage(m.chat, { text: velynRes.data.data }, { quoted: m });
        }
        throw new Error('Velyn returned invalid response');

    } catch (err1) {
        console.error('Velyn Gemma error:', err1.message);

        try {
            // 2️⃣ Gemini public fallback
            const geminiKey = 'AIzaSyAai-9aQrxl6xJH-random-public-demo'; // free public demo key
            const geminiRes = await axios.post(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
                { contents: [{ parts: [{ text }] }] },
                { headers: { 'Content-Type': 'application/json' }, timeout: 15000 }
            );

            const output = geminiRes.data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (output) {
                return dave.sendMessage(m.chat, { text: output.trim() }, { quoted: m });
            }
            throw new Error('Gemini returned no content');

        } catch (err2) {
            console.error('Gemini Fallback error:', err2.message);

            try {
                // 3️⃣ GPT-4o public fallback
                const gptUrl = `https://api.azzayez.me/v1/gpt4?prompt=${encodeURIComponent(text)}`;
                const gptRes = await axios.get(gptUrl, { timeout: 15000 });

                if (gptRes.data?.result) {
                    return dave.sendMessage(m.chat, { text: gptRes.data.result }, { quoted: m });
                }
                throw new Error('GPT-4o returned invalid response');

            } catch (err3) {
                console.error('GPT-4o fallback error:', err3.message);
                return dave.sendMessage(m.chat, {
                    text: 'All AI endpoints failed. Please try again later.'
                }, { quoted: m });
            }
        }
    }
};

daveplug.help = ['gemma'];
daveplug.tags = ['ai'];
daveplug.command = ['gemma'];

module.exports = daveplug;