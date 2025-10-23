const axios = require('axios');

let daveplug = async (m, { command, xprefix, q, daveshown, reply, text, args }) => {
    if (!daveshown) return reply(mess.owner);
    if (args.length < 1) return reply(`Example: ${xprefix + command} on/off`);

    let option = q.toLowerCase(); // handles ON / On / on

    if (option === 'on') {
        global.autoTyping = true;
        reply(`Autotyping presence is now set to ON`);
    } else if (option === 'off') {
        global.autoTyping = false;
        reply(`Autotyping presence is now set to OFF`);
    } else {
        reply(`Invalid option. Use ${xprefix + command} on/off`);
    }
};

daveplug.help = ['autotypes'];
daveplug.tags = ['autotyping'];
daveplug.command = ['autotype'];

module.exports = daveplug;