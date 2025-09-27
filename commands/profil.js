const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');

// Zaman formatlama fonksiyonu
function formatTime(seconds) {
    if (!seconds || seconds === 0) return '0 dakika';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
        return `${hours} saat ${minutes} dakika`;
    } else {
        return `${minutes} dakika`;
    }
}

module.exports = {
    data: {
        name: 'profil',
        description: 'Kullanıcı profil bilgilerini gösterir'
    },
    
    async execute(message, args, database) {
        try {
            // Kullanıcıyı args'tan al veya mesaj gönderen kişiyi kullan
            let targetUser;
            if (args.length > 0) {
                const mention = args[0];
                const userId = mention.replace(/[<@!>]/g, '');
                targetUser = message.guild.members.cache.get(userId)?.user;
            }
            
            if (!targetUser) {
                targetUser = message.author;
            }
            
            const guild = message.guild;
            
            // Kullanıcı verilerini al
            let userData = await database.getUser(targetUser.id);
            
            if (!userData) {
                await database.createUser(targetUser);
                userData = await database.getUser(targetUser.id);
            }

            // En aktif kanalı bul
            const mostActiveChannel = await new Promise((resolve, reject) => {
                database.db.get(
                    `SELECT channelId, SUM(messageCount) as totalMessages 
                     FROM message_stats 
                     WHERE userId = ? 
                     GROUP BY channelId 
                     ORDER BY totalMessages DESC 
                     LIMIT 1`,
                    [targetUser.id],
                    (err, row) => {
                        if (err) reject(err);
                        else resolve(row);
                    }
                );
            });

            // Toplam sesli kanal süresini hesapla (saniye cinsinden)
            const totalVoiceTime = await new Promise((resolve, reject) => {
                database.db.get(
                    `SELECT SUM(duration) as totalDuration 
                     FROM voice_stats 
                     WHERE userId = ?`,
                    [targetUser.id],
                    (err, row) => {
                        if (err) reject(err);
                        else resolve(row);
                    }
                );
            });

            // Kullanıcının sunucuya katılma tarihini al
            const member = guild.members.cache.get(targetUser.id);
            const joinedAt = member ? member.joinedAt : new Date(userData.joinedAt || Date.now());

            const embed = new EmbedBuilder()
                .setTitle(`👤 ${targetUser.username} Profil Bilgileri`)
                .setColor(0x0099ff)
                .addFields(
                    { 
                        name: '📊 Seviye', 
                        value: (userData.level || 0).toString(), 
                        inline: true 
                    },
                    { 
                        name: '⭐ XP', 
                        value: (userData.xp || 0).toString(), 
                        inline: true 
                    },
                    { 
                        name: '💬 Toplam Mesaj', 
                        value: (userData.totalMessages || 0).toString(), 
                        inline: true 
                    },
                    { 
                        name: '🎤 Sesli Süre', 
                        value: formatTime(totalVoiceTime?.totalDuration || 0), 
                        inline: true 
                    },
                    { 
                        name: '📅 Katılma Tarihi', 
                        value: joinedAt.toLocaleDateString('tr-TR'), 
                        inline: true 
                    },
                    { 
                        name: '🏠 Sunucu', 
                        value: guild.name, 
                        inline: true 
                    }
                )
                .setThumbnail(targetUser.displayAvatarURL())
                .setTimestamp()
                .setFooter({ text: 'İstatistik Botu' });

            // En aktif kanal bilgisini ekle
            if (mostActiveChannel) {
                const channel = guild.channels.cache.get(mostActiveChannel.channelId);
                const channelName = channel ? channel.name : 'Bilinmeyen Kanal';
                embed.addFields({
                    name: '🔥 En Aktif Kanal',
                    value: `${channelName} (${mostActiveChannel.totalMessages} mesaj)`,
                    inline: false
                });
            }

            // Sonraki seviye için gerekli XP'yi hesapla
            const currentLevel = userData.level || 0;
            const currentXP = userData.xp || 0;
            const nextLevelXP = Math.pow(currentLevel + 1, 2) * 100;
            const xpToNext = nextLevelXP - currentXP;
            
            embed.addFields({
                name: '🎯 Sonraki Seviye',
                value: `${xpToNext} XP kaldı`,
                inline: true
            });

            await message.reply({ embeds: [embed] });
            
        } catch (error) {
            console.error('Profil komutunda hata:', error);
            await message.reply('Profil bilgileri alınırken bir hata oluştu!');
        }
    }
};