require('dotenv').config()
const fs = require('fs')
const express = require('express');
const { scheduleDailyPing } = require('./scheduler');
const { Client, GatewayIntentBits, Collection } = require('discord.js');

const app = express();
const PORT = process.env.PORT || 8080;
app.get('/', (req, res) => {
  res.send('WaniKani Discord Bot is running!');
});
app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
})

// Database stuff
const sqlite3 = require('sqlite3').verbose()
const db = new sqlite3.Database('./database.sqlite')

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        ping_enabled INTEGER DEFAULT 1,
        points INTEGER DEFAULT 0
    )`)

    //db.run(`DROP TABLE IF EXISTS apikeys`)
    
    db.run(`CREATE TABLE IF NOT EXISTS apikeys (
        user_id TEXT NOT NULL,
        guild_id TEXT NOT NULL,
        api_key TEXT,
        ping_enabled INTEGER DEFAULT 1,
        PRIMARY KEY (user_id, guild_id)
    )`)
})


// Discord Client stuff
const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent
    ]
  });

// loading commands
client.commands = new Collection()
const commandsFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'))
for (const file of commandsFiles) {
    const cmd = require(`./commands/${file}`)
    client.commands.set(cmd.data.name, cmd)
}

client.once('clientReady', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  scheduleDailyPing(client, db)
});

client.on('interactionCreate', async interaction => {
    if(!interaction.isChatInputCommand()) return

    const command = client.commands.get(interaction.commandName)
    if(!command) return

    try {
        await command.execute(interaction, db)

    } catch (err) {
        console.error(err)
        await interaction.reply({
            content: 'There was an error while executing this command!',
            ephemeral: true
        })
    }
    
})

client.on('messageCreate', (message) => {
  if (message.author.bot) return;
});

client.login(process.env.TOKEN);

process.on('SIGINT', () => {
    console.log('Closing database connection...')
    db.close()
    process.exit()
})
