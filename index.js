require('dotenv').config()
const fs = require('fs')
const path = require('path');
const { scheduleDailyPing } = require('./scheduler');
const { Client, GatewayIntentBits, Collection } = require('discord.js');

// Database stuff
const dbPath = path.join(__dirname, 'database.sqlite');
const sqlite3 = require('sqlite3').verbose()
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
    if (err) {
        console.error("Failed to open SQLite database:", err.message);
    } else {
        console.log("SQLite DB opened successfully");

        db.run("PRAGMA journal_mode = WAL;", (err) => {
            if (err) {
                console.error("Failed to set journal mode to WAL:", err.message);
            } else {
                console.log("Journal mode set to WAL");
            }
        });
    }
});


db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        ping_enabled, INTEGER DEFAULT 1,
        points INTEGER DEFAULT 0
    )`, (err) => {
        if (err) console.error(" Error creating users table:", err.message);
        else console.log("users table OK");
    });

    db.run(`CREATE TABLE IF NOT EXISTS apikeys (
        user_id TEXT NOT NULL,
        guild_id TEXT NOT NULL,
        api_key TEXT,
        ping_enabled INTEGER DEFAULT 1,
        PRIMARY KEY (user_id, guild_id)
    )`, (err) => {
        if (err) console.error("Error creating apikeys table:", err.message);
        else console.log("apikeys table OK");
    });
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

client.once('ready', () => {
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
