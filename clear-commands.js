require('dotenv').config();
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord.js');

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
    try {
        console.log('Clearing all global commands...');
        await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID),
            { body: [] } // empty array clears all global commands
        );
        console.log('All global commands cleared successfully!');
    } catch (err) {
        console.error('Error clearing global commands:', err);
    }
})();
