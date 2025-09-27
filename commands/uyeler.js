const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: {
        name: 'uyeler',
        description: 'Sunucu üye istatistiklerini gösterir'
    },
    
    async execute(message, args, database) {
        try {
            const guild = message.guild;
            
            // Üye sayılarını hesapla
            const totalMembers = guild.memberCount;
            const onlineMembers = guild.members.cache.filter(member => 
                member.presence?.status === 'online'
            ).size;
            const idleMembers = guild.members.cache.filter(member => 
                member.presence?.status === 'idle'
            ).size;
            const dndMembers = guild.members.cache.filter(member => 
                member.presence?.status === 'dnd'
            ).size;
            const offlineMembers = totalMembers - onlineMembers - idleMembers - dndMembers;
            const botCount = guild.members.cache.filter(member => member.user.bot).size;
            const humanCount = totalMembers - botCount;

            // Son 7 gün üye değişimini al
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            const weekAgoStr = weekAgo.toISOString().split('T')[0];

            const weeklyStats = await new Promise((resolve, reject) => {
                database.db.get(
                    `SELECT SUM(newMembers) as newMembers, SUM(leftMembers) as leftMembers 
                     FROM guild_stats 
                     WHERE guildId = ? AND date >= ?`,
                    [guild.id, weekAgoStr],
                    (err, row) => {
                        if (err) reject(err);
                        else resolve(row || { newMembers: 0, leftMembers: 0 });
                    }
                );
            });

            // Embed oluştur
            const embed = new EmbedBuilder()
                .setTitle('👥 Sunucu Üye İstatistikleri')
                .setColor(0x3498db)
                .setThumbnail(guild.iconURL({ size: 256 }))
                .addFields(
                    {
                        name: '📊 Genel İstatistikler',
                        value: `👥 Toplam Üye: **${totalMembers}**\n👤 İnsan: **${humanCount}**\n🤖 Bot: **${botCount}**`,
                        inline: true
                    },
                    {
                        name: '🟢 Çevrimiçi Durumlar',
                        value: `🟢 Çevrimiçi: **${onlineMembers}**\n🟡 Boşta: **${idleMembers}**\n🔴 Rahatsız Etmeyin: **${dndMembers}**\n⚫ Çevrimdışı: **${offlineMembers}**`,
                        inline: true
                    },
                    {
                        name: '📈 Son 7 Gün',
                        value: `📥 Yeni Üye: **${weeklyStats.newMembers}**\n📤 Ayrılan Üye: **${weeklyStats.leftMembers}**\n📊 Net Büyüme: **${weeklyStats.newMembers - weeklyStats.leftMembers}**`,
                        inline: false
                    }
                )
                .setTimestamp()
                .setFooter({ text: `${guild.name} • İstatistik Botu` });

            // Üye dağılımı için progress bar benzeri görsel
            const onlinePercentage = Math.round((onlineMembers / totalMembers) * 100);
            const offlinePercentage = Math.round((offlineMembers / totalMembers) * 100);
            const humanPercentage = Math.round((humanCount / totalMembers) * 100);
            const botPercentage = Math.round((botCount / totalMembers) * 100);

            embed.addFields(
                {
                    name: '📊 Çevrimiçi Dağılımı',
                    value: `🟢 Çevrimiçi: ${onlinePercentage}%\n⚫ Çevrimdışı: ${offlinePercentage}%`,
                    inline: true
                },
                {
                    name: '🤖 Bot/İnsan Oranı',
                    value: `👤 İnsan: ${humanPercentage}%\n🤖 Bot: ${botPercentage}%`,
                    inline: true
                }
            );

            // En son katılan üyeyi göster
            const recentMembers = guild.members.cache
                .filter(m => !m.user.bot)
                .sort((a, b) => b.joinedTimestamp - a.joinedTimestamp)
                .first(3);

            if (recentMembers.length > 0) {
                const recentMembersText = recentMembers.map((member, index) => 
                    `${index + 1}. ${member.user.username} (${member.joinedAt.toLocaleDateString('tr-TR')})`
                ).join('\n');

                embed.addFields({
                    name: '🆕 Son Katılan Üyeler',
                    value: recentMembersText,
                    inline: false
                });
            }

            await message.reply({ embeds: [embed] });
            
        } catch (error) {
            console.error('Üye istatistikleri komutunda hata:', error);
            await message.reply('Üye istatistikleri alınırken bir hata oluştu!');
        }
    }
};