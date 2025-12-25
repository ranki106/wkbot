require('dotenv').config();
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord.js');

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
    try {
        console.log('Clearing all guild commands...');
        await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
            { body: [] } // empty array clears all commands
        );
        console.log('All guild commands cleared successfully!');
    } catch (err) {
        console.error('Error clearing guild commands:', err);
    }
})();