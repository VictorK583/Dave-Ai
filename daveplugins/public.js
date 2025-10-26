const axios = require("axios");

let daveplug = async (m, { daveshown, reply, dave }) => {
    if (!daveshown) return reply(mess.owner);
    
    const settings = global.settings;
    settings.public = true;
    global.saveSettings(settings);
    global.settings = settings;

    reply('Successfully changed to Public Usage');
};

daveplug.help = ['public'];
daveplug.tags = ['public'];
daveplug.command = ['public'];

module.exports = daveplug;