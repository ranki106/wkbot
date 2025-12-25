const { SlashCommandBuilder } = require('discord.js');
const { isApiKeyValid } = require('../helpers/apikeyTest');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup')
        .setDescription('Set your WaniKani API key and ping preferences')
        .addStringOption(opt => 
            opt.setName('apikey')
               .setDescription('Your WaniKani API Key')
               .setRequired(false)
        )
        .addBooleanOption(opt => 
            opt.setName('ping')
               .setDescription('Enable or disable daily pings')
               .setRequired(false)
        ),

    async execute(interaction, db) {
        const apiKey = interaction.options.getString('apikey');
        const userId = interaction.user.id;
        const guildId = interaction.guild?.id;
        const ping_enabled = interaction.options.getBoolean('ping') ? 1 : 0;

        if (!guildId) {
            return interaction.reply({
                content: 'Could not get server ID. Please try again later.',
                ephemeral: true
            });
        }

        // Validate API key if provided
        if (apiKey) {
            const isValid = await isApiKeyValid(apiKey);
            console.log("API key validation result:", isValid);
            if (!isValid) {
                return interaction.reply({
                    content: "The provided API key is invalid. Please check and try again.",
                    ephemeral: true
                });
            }
        }

        db.get(
            `SELECT * FROM apikeys WHERE user_id = ? AND guild_id = ?`,
            [userId, guildId],
            (err, row) => {
                if (err) {
                    console.error("SQLite SELECT error:", err.message);
                    return interaction.reply({
                        content: 'There was an error while accessing your API key!',
                        ephemeral: true
                    });
                }

                if (!row) {
                    if (!apiKey) {
                        return interaction.reply({
                            content: 'You must provide an API key to set it up for the first time!',
                            ephemeral: true
                        });
                    }

                    db.run(
                        `INSERT INTO apikeys (user_id, guild_id, api_key, ping_enabled)
                         VALUES (?, ?, ?, ?)`,
                        [userId, guildId, apiKey, ping_enabled],
                        (err) => {
                            if (err) {
                                console.error("SQLite INSERT error:", err.message);
                                return interaction.reply({
                                    content: 'Failed to save your API key. Please try again.',
                                    ephemeral: true
                                });
                            }

                            return interaction.reply({
                                content: `Your API key has been set. \nPing notifications: **${ping_enabled ? 'Enabled' : 'Disabled'}**.`,
                                ephemeral: true
                            });
                        }
                    );
                } else {
                    // Update existing row
                    const query = apiKey
                        ? `UPDATE apikeys SET api_key = ?, ping_enabled = ? WHERE user_id = ? AND guild_id = ?`
                        : `UPDATE apikeys SET ping_enabled = ? WHERE user_id = ? AND guild_id = ?`;

                    const params = apiKey
                        ? [apiKey, ping_enabled, userId, guildId]
                        : [ping_enabled, userId, guildId];

                    db.run(query, params, (err) => {
                        if (err) {
                            console.error("SQLite UPDATE error:", err.message);
                            return interaction.reply({
                                content: 'Failed to update your settings. Please try again.',
                                ephemeral: true
                            });
                        }

                        const action = apiKey ? 'updated' : 'ping preferences updated';
                        return interaction.reply({
                            content: `Your ${action}. \nPing notifications: **${ping_enabled ? 'Enabled' : 'Disabled'}**.`,
                            ephemeral: true
                        });
                    });
                }
            }
        );
    }
};
