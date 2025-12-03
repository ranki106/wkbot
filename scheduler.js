const cron = require('node-cron');
const fetch = require('node-fetch');
const { getWaniKaniData } = require('./helpers/wanikaniData');
const { EmbedBuilder } = require('discord.js');

function scheduleDailyPing(client, db) {
    cron.schedule("* * * * *", async () => {
        sendDailyWKUpdates(client, db)
    })
}

async function sendDailyWKUpdates(client, db) {
    console.log("Running daily WaniKani update task");

    client.guilds.cache.forEach(async guild => {
        const channel = guild.channels.cache.find(ch => 
            ch.name === '日本語上手' && ch.isTextBased()
        );
        if (!channel) return console.log(`Channel not found in guild ${guild.name}`);

        db.all(`SELECT user_id, api_key, ping_enabled FROM apikeys WHERE guild_id = ?`, [guild.id], async (err, rows) => {
            if (err) return console.error(err);
            if (rows.length === 0) return;

            // Prepare embed
            const embed = new EmbedBuilder()
                .setTitle("Daily WaniKani Summary")
                .setColor("#FF9900")
                .setDescription("Here are today's WaniKani stats for everyone:");
            
            const pingList = []
            
            for (const row of rows) {
                const member = await guild.members.fetch(row.user_id).catch(() => null);
                const username = member ? member.user.username : "Unknown";

                if (row.ping_enabled === 1) {
                    pingList.push(`<@${row.user_id}>`);
                }

                try {
                    const { userData, pendingLessons, dueRightNow, dueNext24Hours } = await getWaniKaniData(row.api_key);
                    if(!userData.current_vacation_started_at) {
                        embed.addFields({
                            name: username,
                            value: `Lvl: ${userData.level} | Lessons: ${pendingLessons} | Now: ${dueRightNow} | 24h: ${dueNext24Hours}`,
                            inline: false
                        });
                    } else {
                        embed.addFields({
                            name: username,
                            value: `Vacation Mode Activated`,
                            inline: false
                        });
                    }
                } catch (err) {
                    console.error(`Error fetching WaniKani data for user ${row.user_id}:`, err);
                    embed.addFields({
                        name: username,
                        value: `Error fetching data`,
                        inline: false
                    });
                }
            }

            channel.send({ 
                content: pingList.join(' '),
                embeds: [embed] 
            });
        });
    });
}


module.exports = { scheduleDailyPing, sendDailyWKUpdates }
