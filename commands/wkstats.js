const { SlashCommandBuilder } = require('discord.js');
const fetch = require('node-fetch')
const { getWaniKaniData } = require('../helpers/wanikaniData');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('wkstats')
        .setDescription('Get your WaniKani statistics'),

    async execute(interaction, db) {
        const userId = interaction.user.id
        const guildId = interaction.guild.id
        const username = interaction.user.nickname ? interaction.user.nickname : interaction.user.username 

        db.get(`SELECT api_key FROM apikeys WHERE user_id = ? AND guild_id = ?`, [userId, guildId], async (err, row) => {
            if (err) {
                return interaction.reply({ content: 'There was an error while retrieving your API key!', ephemeral: true });
            }
            if (!row) {
                return interaction.reply({ content: 'You have not set your API key yet. Use /setkey to add your WaniKani API key.', ephemeral: true });
            }

            try {
                const { userData, dueNext24Hours, dueRightNow, pendingLessons } = await getWaniKaniData(row.api_key);
                // console.log("Fetched WaniKani Data: ", userData, dueNext24Hours, dueRightNow, pendingLessons)   
                // console.log("Fetched WaniKani Data:", userData)
                return interaction.reply({
                    content: `**WaniKani Statistics for ${username}:**\n` +
                             `Level: ${userData.level}\n` +
                             `Pending Lessons: ${pendingLessons}\n` +
                             `Current Due Reviews: ${dueRightNow}\n` +
                             `Reviews Due in Next 24 Hours: ${dueNext24Hours}\n` +
                             `Max Level Granted: ${userData.subscription.max_level_granted || 'N/A'}`,
                });
            } catch (err) {
                console.error(err)
                interaction.reply({ content: 'There was an error while fetching your WaniKani statistics. Please ensure your API key is valid.', ephemeral: true });
            }
        })
    }
}