const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: {
        name: 'rapor',
        description: 'Haftalık sunucu raporunu gösterir'
    },
    
    async execute(message, args, database) {
        try {
            const guild = message.guild;
            
            // Haftalık verileri al
            const weeklyData = await database.getWeeklyStats(guild.id);

            if (!weeklyData || weeklyData.length === 0) {
                await message.reply('Henüz haftalık veri bulunmuyor!');
                return;
            }

            // Haftalık istatistikleri hesapla
            const totalMessages = weeklyData.reduce((sum, day) => sum + (day.messageCount || 0), 0);
            const totalNewMembers = weeklyData.reduce((sum, day) => sum + (day.newMembers || 0), 0);
            const totalLeftMembers = weeklyData.reduce((sum, day) => sum + (day.leftMembers || 0), 0);
            const avgOnlineMembers = Math.round(
                weeklyData.reduce((sum, day) => sum + (day.onlineMembers || 0), 0) / weeklyData.length
            );
            const netGrowth = totalNewMembers - totalLeftMembers;

            // Günlük mesaj grafiği oluştur
            const dailyMessages = weeklyData.map(day => ({
                date: new Date(day.date).toLocaleDateString('tr-TR', { weekday: 'short' }),
                messages: day.messageCount || 0
            }));

            const embed = new EmbedBuilder()
                .setTitle('📈 Haftalık Sunucu Raporu')
                .setDescription(`**${guild.name}** sunucusunun bu haftaki performansı`)
                .setColor(0x00ff00)
                .addFields(
                    { 
                        name: '💬 Toplam Mesaj', 
                        value: totalMessages.toString(), 
                        inline: true 
                    },
                    { 
                        name: '👥 Yeni Üye', 
                        value: totalNewMembers.toString(), 
                        inline: true 
                    },
                    { 
                        name: '👋 Ayrılan Üye', 
                        value: totalLeftMembers.toString(), 
                        inline: true 
                    },
                    { 
                        name: '🟢 Ortalama Çevrimiçi', 
                        value: avgOnlineMembers.toString(), 
                        inline: true 
                    },
                    { 
                        name: '📊 Net Büyüme', 
                        value: netGrowth.toString(), 
                        inline: true 
                    },
                    { 
                        name: '📅 Rapor Dönemi', 
                        value: `${weeklyData.length} gün`, 
                        inline: true 
                    }
                )
                .setThumbnail(guild.iconURL())
                .setTimestamp()
                .setFooter({ text: 'İstatistik Botu - Haftalık Rapor' });

            // Günlük mesaj dağılımını ekle
            if (dailyMessages.length > 0) {
                const dailyChart = dailyMessages.map(day => 
                    `${day.date}: ${day.messages} mesaj`
                ).join('\n');
                
                embed.addFields({
                    name: '📊 Günlük Mesaj Dağılımı',
                    value: dailyChart,
                    inline: false
                });
            }

            // En aktif günü bul
            const mostActiveDay = dailyMessages.reduce((max, day) => 
                day.messages > max.messages ? day : max, { messages: 0 }
            );

            if (mostActiveDay.messages > 0) {
                embed.addFields({
                    name: '🔥 En Aktif Gün',
                    value: `${mostActiveDay.date} (${mostActiveDay.messages} mesaj)`,
                    inline: false
                });
            }

            await message.reply({ embeds: [embed] });
            
        } catch (error) {
            console.error('Haftalık rapor komutunda hata:', error);
            await message.reply('Haftalık rapor alınırken bir hata oluştu!');
        }
    }
};