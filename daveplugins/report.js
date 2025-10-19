let daveplug = async (m, { dave, reply, text, daveshown }) => {
    try {
        if (!text) {
            return reply('Usage: .bug <message>\nExample: .bug hi dev play command is not working');
        }

        const ownerNumber = '254104260236@s.whatsapp.net'; // Your number

        const reportMessage = `Bug Report\n\nUser: @${m.sender.split("@")[0]}\nMessage: ${text}`;

        // Send to owner
        await dave.sendMessage(ownerNumber, {
            text: reportMessage,
            mentions: [m.sender]
        }, {
            quoted: m
        });

        // Reply to user
        reply('Thank you for your report. It has been forwarded to the owner. Please wait for a response.');

    } catch (error) {
        console.error('Bug report error:', error.message);
        reply('An error occurred while sending the report');
    }
};

daveplug.help = ['bug <message>'];
daveplug.tags = ['tools'];
daveplug.command = ['bug', 'report', 'request'];

module.exports = daveplug;