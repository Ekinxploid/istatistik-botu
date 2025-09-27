const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: {
        name: 'seviye',
        description: 'Seviye tablosunu gösterir'
    },
    
    async execute(message, args, database) {
        try {
            const page = parseInt(args[0]) || 1;
            const limit = 10;
            const offset = (page - 1) * limit;

            // En yüksek seviyeli kullanıcıları al
            const topUsers = await database.getTopUsers(limit + offset);
            const pageUsers = topUsers.slice(offset, offset + limit);

            if (pageUsers.length === 0) {
                await message.reply('Bu sayfada kullanıcı bulunamadı!');
                return;
            }

            const embed = new EmbedBuilder()
                .setTitle('🏆 Seviye Tablosu')
                .setColor(0xffd700)
                .setTimestamp()
                .setFooter({ text: `Sayfa ${page} | İstatistik Botu` });

            const leaderboard = pageUsers.map((user, index) => {
                const globalIndex = offset + index + 1;
                const level = user.level || 0;
                const xp = user.xp || 0;
                const nextLevelXP = Math.pow(level + 1, 2) * 100;
                const xpToNext = Math.max(0, nextLevelXP - xp);
                const progress = level > 0 ? Math.round((xp / nextLevelXP) * 100) : 0;

                // Emoji ile sıralama
                let rankEmoji = '🔹';
                if (globalIndex === 1) rankEmoji = '🥇';
                else if (globalIndex === 2) rankEmoji = '🥈';
                else if (globalIndex === 3) rankEmoji = '🥉';

                return {
                    name: `${rankEmoji} ${globalIndex}. ${user.username}`,
                    value: `📊 Seviye ${level} | ⭐ ${xp} XP\n🎯 ${xpToNext} XP kaldı`,
                    inline: true
                };
            });

            embed.addFields(leaderboard);

            // Sayfa bilgisi ekle
            const totalPages = Math.ceil(topUsers.length / limit);
            if (totalPages > 1) {
                embed.addFields({
                    name: '📄 Sayfa Bilgisi',
                    value: `Sayfa ${page}/${totalPages} - Toplam ${topUsers.length} kullanıcı`,
                    inline: false
                });
            }

            // İlk 3 kullanıcıyı vurgula
            if (page === 1 && topUsers.length >= 3) {
                const top3 = topUsers.slice(0, 3);
                embed.setDescription(`**Liderler:** ${top3.map((u, i) => `${['🥇','🥈','🥉'][i]} ${u.username}`).join(' | ')}`);
            }

            await message.reply({ embeds: [embed] });
            
        } catch (error) {
            console.error('Seviye komutunda hata:', error);
            await message.reply('Seviye tablosu alınırken bir hata oluştu!');
        }
    }
};