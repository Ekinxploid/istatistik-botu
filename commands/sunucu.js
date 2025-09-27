const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: {
        name: 'sunucu',
        description: 'Sunucu istatistiklerini gösterir'
    },
    
    async execute(message, args, database) {
        try {
            const guild = message.guild;
            const today = new Date().toISOString().split('T')[0];
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            const weekAgoStr = weekAgo.toISOString().split('T')[0];

            // Bugünkü mesaj sayısını al
            const todayMessages = await new Promise((resolve, reject) => {
                database.db.get(
                    `SELECT SUM(messageCount) as count FROM message_stats WHERE date = ?`,
                    [today],
                    (err, row) => {
                        if (err) reject(err);
                        else resolve(row || { count: 0 });
                    }
                );
            });

            // Bu haftaki mesaj sayısını al
            const weekMessages = await new Promise((resolve, reject) => {
                database.db.get(
                    `SELECT SUM(messageCount) as count FROM message_stats WHERE date >= ?`,
                    [weekAgoStr],
                    (err, row) => {
                        if (err) reject(err);
                        else resolve(row || { count: 0 });
                    }
                );
            });

            // Bu haftaki yeni üye sayısını al
            const weekNewMembers = await new Promise((resolve, reject) => {
                database.db.get(
                    `SELECT SUM(newMembers) as count FROM guild_stats WHERE date >= ? AND guildId = ?`,
                    [weekAgoStr, guild.id],
                    (err, row) => {
                        if (err) reject(err);
                        else resolve(row || { count: 0 });
                    }
                );
            });

            // Bu haftaki ayrılan üye sayısını al
            const weekLeftMembers = await new Promise((resolve, reject) => {
                database.db.get(
                    `SELECT SUM(leftMembers) as count FROM guild_stats WHERE date >= ? AND guildId = ?`,
                    [weekAgoStr, guild.id],
                    (err, row) => {
                        if (err) reject(err);
                        else resolve(row || { count: 0 });
                    }
                );
            });

            // En aktif kanalları al
            const topChannels = await database.getTopChannels(guild.id, 5);

            const embed = new EmbedBuilder()
                .setTitle(`📊 ${guild.name} Sunucu İstatistikleri`)
                .setColor(0x00ff00)
                .addFields(
                    { 
                        name: '👥 Toplam Üye', 
                        value: guild.memberCount.toString(), 
                        inline: true 
                    },
                    { 
                        name: '📅 Bugünkü Mesajlar', 
                        value: todayMessages.count.toString(), 
                        inline: true 
                    },
                    { 
                        name: '📈 Bu Haftaki Mesajlar', 
                        value: weekMessages.count.toString(), 
                        inline: true 
                    },
                    { 
                        name: '🟢 Çevrimiçi Üye', 
                        value: guild.members.cache.filter(m => m.presence?.status === 'online').size.toString(), 
                        inline: true 
                    },
                    { 
                        name: '📊 Net Büyüme', 
                        value: (weekNewMembers.count - weekLeftMembers.count).toString(), 
                        inline: true 
                    },
                    { 
                        name: '🏠 Toplam Kanal', 
                        value: guild.channels.cache.size.toString(), 
                        inline: true 
                    }
                )
                .setThumbnail(guild.iconURL({ size: 256 }))
                .setTimestamp()
                .setFooter({ text: 'İstatistik Botu' });

            // Sunucu oluşturulma tarihi
            embed.addFields({
                name: '📅 Sunucu Kurulma Tarihi',
                value: guild.createdAt.toLocaleDateString('tr-TR'),
                inline: false
            });

            // En aktif kanalları ekle
            if (topChannels && topChannels.length > 0) {
                const channelList = topChannels.map((channel, index) => {
                    const channelObj = guild.channels.cache.get(channel.channelId);
                    const channelName = channelObj ? `#${channelObj.name}` : '❌ Silinmiş Kanal';
                    return `${index + 1}. ${channelName}: **${channel.totalMessages}** mesaj`;
                }).join('\n');

                embed.addFields({
                    name: '🔥 En Aktif Kanallar (Son 7 Gün)',
                    value: channelList,
                    inline: false
                });
            }

            // Rol sayısı
            embed.addFields({
                name: '🎭 Rol Sayısı',
                value: guild.roles.cache.size.toString(),
                inline: true
            });

            await message.reply({ embeds: [embed] });
            
        } catch (error) {
            console.error('Sunucu istatistikleri komutunda hata:', error);
            await message.reply('Sunucu istatistikleri alınırken bir hata oluştu!');
        }
    }
};