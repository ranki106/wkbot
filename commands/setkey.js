const { SlashCommandBuilder, InteractionResponse } = require('discord.js')
const { isApiKeyValid } = require('../helpers/apikeyTest')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup')
        .setDescription('Set your WaniKani API key and ping prefernces')
        .addStringOption(opt => 
            opt.setName('apikey').setDescription('Your WaniKani API Key').setRequired(false)
        )
        .addBooleanOption(opt => 
            opt.setName('ping').setDescription('Enable or disable daily pings').setRequired(false)
        ),

        async execute(interaction, db) {
            const apiKey = interaction.options.getString('apikey')
            const userId = interaction.user.id
            const guildId = interaction.guild.id
            const ping_enabled = interaction.options.getBoolean('ping') ? 1 : 0

            if(apiKey) {
                const isValid = await isApiKeyValid(apiKey)
                console.log("TESTING", isValid)
                if(!isValid) {
                    return interaction.editReply({
                        content: "The provided API key is invalid. Please check and try again.",
                        flags: 64
                    })
                }
            }
            
            db.get(
                `SELECT * FROM apikeys where user_id = ? AND guild_id = ?`,
                [userId, guildId],
                (err, row) => {
                    if(err) {
                        console.error(err)
                        return interaction.editReply({
                            content: 'There was an error while accessing your API key!',
                            ephemeral: true
                        })
                    }
                    
                    if(!row) {
                        if(!apiKey) {
                            return interaction.editReply({
                                content: 'You must provide an API key to set it up for the first time!',
                                ephemeral: true
                            })
                        }

                        db.run(
                            `INSERT INTO apikeys (user_id, guild_id, api_key, ping_enabled)
                             VALUES (?, ?, ?, ?)`,
                            [userId, guildId, apiKey, ping_enabled],
                        )

                        return interaction.editReply({ content: `Your API key has been set. \nPing notifications: **${ping_enabled ? 'Enabled' : 'Disabled'}**.`, ephemeral: true } );
                    }

                    if (apiKey) {
                        db.run(
                            `UPDATE apikeys SET api_key = ?, ping_enabled = ? WHERE user_id = ? AND guild_id = ?`,
                            [apiKey, ping_enabled, userId, guildId],
                        )
                        return interaction.editReply({ content: `Your API key has been updated. \nPing notifications: **${ping_enabled ? 'Enabled' : 'Disabled'}**.`, ephemeral: true } );
                    } else {
                        db.run(
                            `UPDATE apikeys SET ping_enabled = ? WHERE user_id = ? AND guild_id = ?`,
                            [ping_enabled, userId, guildId],
                        )

                        return interaction.editReply({ content: `Your ping preferences have been updated. \nPing notifications: **${ping_enabled ? 'Enabled' : 'Disabled'}**.`, ephemeral: true } );
                    }
                }
            )
        }
}