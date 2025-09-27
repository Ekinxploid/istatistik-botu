const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');

// Zaman formatlama fonksiyonu
function formatTime(seconds) {
    if (!seconds || seconds === 0) return '0 dakika';
    
    const days = Math.floor(seconds / (3600 * 24));
    const hours = Math.floor((seconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    const parts = [];
    if (days > 0) parts.push(`${days} gün`);
    if (hours > 0) parts.push(`${hours} saat`);
    if (minutes > 0) parts.push(`${minutes} dakika`);
    
    return parts.length > 0 ? parts.join(' ') : '0 dakika';
}

module.exports = {
    data: {
        name: 'sesli',
        description: 'Sesli kanal istatistiklerini gösterir'
    },
    
    async execute(message, args, database) {
        try {
            const guild = message.guild;
            
            // En çok kullanılan sesli kanalları al
            const voiceStats = await new Promise((resolve, reject) => {
                database.db.all(
                    `SELECT channelId, SUM(duration) as totalDuration, COUNT(*) as usageCount
                     FROM voice_stats 
                     GROUP BY channelId 
                     ORDER BY totalDuration DESC 
                     LIMIT 10`,
                    (err, rows) => {
                        if (err) reject(err);
                        else resolve(rows || []);
                    }
                );
            });

            // Toplam sesli kanal süresini hesapla
            const totalVoiceTime = await new Promise((resolve, reject) => {
                database.db.get(
                    `SELECT SUM(duration) as totalDuration 
                     FROM voice_stats`,
                    (err, row) => {
                        if (err) reject(err);
                        else resolve(row || { totalDuration: 0 });
                    }
                );
            });

            const embed = new EmbedBuilder()
                .setTitle('🎤 Sesli Kanal İstatistikleri')
                .setColor(0xff6b6b)
                .setTimestamp()
                .setFooter({ text: 'İstatistik Botu' });

            if (!voiceStats || voiceStats.length === 0) {
                embed.setDescription('Henüz sesli kanal istatistiği bulunmuyor.');
            } else {
                // Toplam süre bilgisini ekle
                embed.addFields({
                    name: '⏱️ Toplam Sesli Süre',
                    value: formatTime(totalVoiceTime.totalDuration),
                    inline: false
                });

                // En çok kullanılan kanalları ekle
                const fields = voiceStats.map((stat, index) => {
                    const channel = guild.channels.cache.get(stat.channelId);
                    const channelName = channel ? `#${channel.name}` : '❌ Silinmiş Kanal';
                    const duration = formatTime(stat.totalDuration);
                    
                    return {
                        name: `${index + 1}. ${channelName}`,
                        value: `⏰ ${duration}\n📊 ${stat.usageCount} kez`,
                        inline: true
                    };
                });

                embed.addFields(fields);

                // En aktif kanal bilgisini ekle
                if (voiceStats.length > 0) {
                    const mostActive = voiceStats[0];
                    const mostActiveChannel = guild.channels.cache.get(mostActive.channelId);
                    const channelName = mostActiveChannel ? `#${mostActiveChannel.name}` : 'Silinmiş Kanal';
                    
                    embed.addFields({
                        name: '🏆 En Aktif Sesli Kanal',
                        value: `${channelName}\n⏰ ${formatTime(mostActive.totalDuration)}`,
                        inline: false
                    });
                }
            }

            await message.reply({ embeds: [embed] });
            
        } catch (error) {
            console.error('Sesli kanal istatistikleri komutunda hata:', error);
            await message.reply('Sesli kanal istatistikleri alınırken bir hata oluştu!');
        }
    }
};