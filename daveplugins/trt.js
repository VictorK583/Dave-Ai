const fetch = require('node-fetch');

let daveplug = async (m, { dave, text, reply, quoted, command, xprefix }) => {
    try {
        let textToTranslate = '';
        let lang = '';

        // Check if it's a reply to a message
        if (quoted) {
            // Get text from quoted message
            textToTranslate = quoted.text || '';
            // Get language from command text
            lang = text ? text.trim() : '';
        } else {
            // Parse command arguments for direct message
            const args = text ? text.trim().split(' ') : [];

            if (args.length < 2) {
                return await reply(
`🌍 TRANSLATOR

Usage:
• Reply to a message with: ${xprefix + command} <lang>
• Or type: ${xprefix + command} <text> <lang>

Examples:
${xprefix + command} hello fr
${xprefix}trt hello es

Language Codes:
fr - French, es - Spanish, de - German
it - Italian, pt - Portuguese, ru - Russian
ja - Japanese, ko - Korean, zh - Chinese
ar - Arabic, hi - Hindi, en - English`
                );
            }

            lang = args.pop(); // Get language code
            textToTranslate = args.join(' '); // Get text to translate
        }

        if (!textToTranslate) {
            return await reply('No text found to translate. Please provide text or reply to a message.');
        }

        if (!lang) {
            return await reply('Please specify a language code.\n\nExample: ' + xprefix + command + ' en (for English)');
        }

        await dave.sendMessage(m.chat, { react: { text: '.', key: m.key } });

        let translatedText = null;

        // Try multiple translation APIs in sequence
        try {
            const response = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${lang}&dt=t&q=${encodeURIComponent(textToTranslate)}`);
            if (response.ok) {
                const data = await response.json();
                translatedText = data?.[0]?.[0]?.[0];
            }
        } catch {}

        if (!translatedText) {
            try {
                const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(textToTranslate)}&langpair=auto|${lang}`);
                if (response.ok) {
                    const data = await response.json();
                    translatedText = data?.responseData?.translatedText;
                }
            } catch {}
        }

        if (!translatedText) {
            try {
                const response = await fetch(`https://api.dreaded.site/api/translate?text=${encodeURIComponent(textToTranslate)}&lang=${lang}`);
                if (response.ok) {
                    const data = await response.json();
                    translatedText = data?.translated;
                }
            } catch {}
        }

        if (!translatedText) throw new Error('All translation APIs failed.');

        await dave.sendMessage(m.chat, { react: { text: '✓', key: m.key } });

        await reply(`🌐 *Translation Result*\n\n*Original:* ${textToTranslate}\n\n*Translated (${lang}):* ${translatedText}`);

    } catch (error) {
        console.error('Translate Command Error:', error);
        await dave.sendMessage(m.chat, { react: { text: '✗', key: m.key } });
        await reply('Failed to translate text. Please try again later.\n\nMake sure you use a valid language code like: en, es, fr, etc.');
    }
};

daveplug.help = ['translate', 'trt'];
daveplug.tags = ['tools'];
daveplug.command = ['translate', 'trt', 'traducir', 'traduzir'];

module.exports = daveplug;