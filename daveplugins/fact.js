let daveplug = async (m, { dave, reply, fetchJson }) => {
    try {
        const data = await fetchJson('https://api.dreaded.site/api/fact');
        const fact = data.fact;
        
        await reply(fact);
    } catch (error) {
        console.error('Fact error:', error.message);
        reply('Something is wrong.');
    }
};

daveplug.help = ['fact'];
daveplug.tags = ['fun'];
daveplug.command = ['fact', 'getfact'];

module.exports = daveplug;