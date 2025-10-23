const fetch = require('node-fetch');

let daveplug = async (m, { dave, text, reply, quoted, command, prefix }) => {
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
                return await reply(`TRANSLATOR\n\nUsage:\n• Reply to a message with: ${prefix + command} <lang>\n• Or type: ${prefix + command} <text> <lang>\n\nExamples:\n${prefix + command} hello fr\n${prefix}trt hello es\n\nLanguage Codes:\nfr - French, es - Spanish, de - German\nit - Italian, pt - Portuguese, ru - Russian\nja - Japanese, ko - Korean, zh - Chinese\nar - Arabic, hi - Hindi, en - English`);
            }

            lang = args.pop(); // Get language code
            textToTranslate = args.join(' '); // Get text to translate
        }

        if (!textToTranslate) {
            return await reply('No text found to translate. Please provide text or reply to a message.');
        }

        if (!lang) {
            return await reply('Please specify a language code.\n\nExample: ' + prefix + command + ' en (for English)');
        }

        // Add processing reaction
        await dave.sendMessage(m.chat, {
            react: { text: '...', key: m.key }
        });

        // Try multiple translation APIs in sequence
        let translatedText = null;

        // Try API 1 (Google Translate API)
        try {
            const response = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${lang}&dt=t&q=${encodeURIComponent(textToTranslate)}`);
            if (response.ok) {
                const data = await response.json();
                if (data && data[0] && data[0][0] && data[0][0][0]) {
                    translatedText = data[0][0][0];
                }
            }
        } catch (e) {}

        // If API 1 fails, try API 2
        if (!translatedText) {
            try {
                const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(textToTranslate)}&langpair=auto|${lang}`);
                if (response.ok) {
                    const data = await response.json();
                    if (data && data.responseData && data.responseData.translatedText) {
                        translatedText = data.responseData.translatedText;
                    }
                }
            } catch (e) {}
        }

        // If API 2 fails, try API 3
        if (!translatedText) {
            try {
                const response = await fetch(`https://api.dreaded.site/api/translate?text=${encodeURIComponent(textToTranslate)}&lang=${lang}`);
                if (response.ok) {
                    const data = await response.json();
                    if (data && data.translated) {
                        translatedText = data.translated;
                    }
                }
            } catch (e) {}
        }

        if (!translatedText) {
            throw new Error('All translation APIs failed');
        }

        // Add success reaction
        await dave.sendMessage(m.chat, {
            react: { text: '✓', key: m.key }
        });

        // Send translation result
        await reply(`Translation Result\n\nOriginal: ${textToTranslate}\n\nTranslated (${lang}): ${translatedText}`);

    } catch (error) {
        console.error('Translate Command Error:', error);
        
        // Add error reaction
        await dave.sendMessage(m.chat, {
            react: { text: '✗', key: m.key }
        });
        
        await reply('Failed to translate text. Please try again later.\n\nMake sure you use a valid language code like: en, es, fr, etc.');
    }
};

daveplug.help = ['translate', 'trt'];
daveplug.tags = ['tools'];
daveplug.command = ['translate', 'trt', 'traducir', 'traduzir'];

module.exports = daveplug;