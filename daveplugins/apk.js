const axios = require('axios');

let daveplug = async (m, { dave, reply, text }) => {
    try {
        const query = text ? text.trim() : '';

        // Check if user provided an app name
        if (!query) {
            return await reply("Please provide an app name to search.\n\nUsage:\n.apk Instagram");
        }

        // Add processing reaction
        await dave.sendMessage(m.chat, {
            react: { text: '...', key: m.key }
        });

        const apiUrl = `http://ws75.aptoide.com/api/7/apps/search/query=${encodeURIComponent(query)}/limit=1`;
        const response = await axios.get(apiUrl);
        const data = response.data;

        if (!data.datalist || !data.datalist.list || !data.datalist.list.length) {
            return await reply("No APK found for your query.");
        }

        const app = data.datalist.list[0];
        const sizeMB = (app.size / (1024 * 1024)).toFixed(2);

        const caption = `
App Name: ${app.name}
Package: ${app.package}
Last Updated: ${app.updated}
Size: ${sizeMB} MB
Downloads: ${app.downloads || 'N/A'}
Rating: ${app.rating || 'N/A'}
`.trim();

        // Check if download URL exists
        if (!app.file || !app.file.path) {
            return await reply("Download URL not available for this app.");
        }

        const downloadUrl = app.file.path;

        // Add upload reaction
        await dave.sendMessage(m.chat, {
            react: { text: '⬆️', key: m.key }
        });

        // Download the APK file first
        const apkResponse = await axios({
            method: 'GET',
            url: downloadUrl,
            responseType: 'stream',
            timeout: 60000
        });

        // Convert stream to buffer
        const chunks = [];
        for await (const chunk of apkResponse.data) {
            chunks.push(chunk);
        }
        const apkBuffer = Buffer.concat(chunks);

        // Send the APK as document
        await dave.sendMessage(m.chat, {
            document: apkBuffer,
            fileName: `${app.name.replace(/[^a-zA-Z0-9]/g, '_')}.apk`,
            mimetype: 'application/vnd.android.package-archive',
            caption: caption
        });

        // Add success reaction
        await dave.sendMessage(m.chat, {
            react: { text: '✓', key: m.key }
        });

    } catch (error) {
        console.error('APK Command Error:', error);

        // Add error reaction
        await dave.sendMessage(m.chat, {
            react: { text: '✗', key: m.key }
        });

        if (error.response?.status === 404) {
            await reply("APK not found or download link expired.");
        } else if (error.code === 'ECONNREFUSED') {
            await reply("APK download service is currently unavailable.");
        } else if (error.response?.status === 403) {
            await reply("This APK cannot be downloaded due to restrictions.");
        } else {
            await reply("Error occurred while downloading the APK. Please try a different app name.");
        }
    }
};

daveplug.help = ['apk'];
daveplug.tags = ['download'];
daveplug.command = ['apk', 'app'];

module.exports = daveplug;