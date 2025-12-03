const { SlashCommandBuilder, InteractionResponse } = require('discord.js')
const { EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Information on how to use this bot'),

        async execute(interaction) {
            const embed = new EmbedBuilder()
                .setTitle("WaniKani Bot Info")
                .setColor("#FF9900")
                .setDescription("How to set configure your Discord WaniKani experience")

            embed.addFields({
                name: "/help",
                value: `Pulls up the help menu`,
                inline: false
            })

            embed.addFields({
                name: "/setup",
                value: `**Setting your Wanikani API key**: You can find this on wanikani.com, please provide a read only key for the bot\n**Ping Status**: By default you will be pinged with daily stats, if you would like to disable this please set it to false`,
                inline: false
            })

            embed.addFields({
                name: "/wkstats",
                value: `Pulls the stats of the user who called it\nProvides level, reviews due now, reviews due within 24 hours and the amount of pending lessons`,
                inline: false
            })


            return interaction.editReply({
                    embeds: [embed]
            })
        }


}