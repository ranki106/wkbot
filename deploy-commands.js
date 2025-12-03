require('dotenv').config(); // load .env first
const fs = require('fs');
const path = require('path');
const { REST } = require('@discordjs/rest'); // correct package
const { Routes } = require('discord.js');

// Load command files
const commands = [];
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    commands.push(command.data.toJSON());
}

// Create REST instance and set token
const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
    try {
        console.log('Deploying slash commands...');
        await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
            { body: commands }
        );
        console.log('Slash commands deployed successfully!');
    } catch (err) {
        console.error('Error deploying commands:', err);
    }
})();
