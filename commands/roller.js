const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: {
        name: 'roller',
        description: 'Rol istatistiklerini gösterir'
    },
    
    async execute(message, args, database) {
        try {
            const guild = message.guild;
            
            // Rol istatistiklerini hesapla
            const roleStats = [];
            
            for (const role of guild.roles.cache.values()) {
                if (role.name === '@everyone') continue; // @everyone rolünü atla
                
                const memberCount = role.members.size;
                if (memberCount > 0) {
                    roleStats.push({
                        roleId: role.id,
                        roleName: role.name,
                        memberCount: role.members.size,
                        color: role.hexColor
                    });
                }
            }

            // Üye sayısına göre sırala
            roleStats.sort((a, b) => b.memberCount - a.memberCount);

            const embed = new EmbedBuilder()
                .setTitle('🎭 Rol İstatistikleri')
                .setColor(0x9b59b6)
                .setTimestamp()
                .setFooter({ text: 'İstatistik Botu' });

            if (roleStats.length === 0) {
                embed.setDescription('Rol istatistiği bulunamadı.');
            } else {
                // İlk 15 rolü göster
                const fields = roleStats.slice(0, 15).map((stat, index) => {
                    return {
                        name: `${index + 1}. ${stat.roleName}`,
                        value: `${stat.memberCount} üye`,
                        inline: true
                    };
                });

                embed.addFields(fields);

                // Toplam rol sayısını ekle
                embed.addFields({
                    name: '📊 Özet',
                    value: `Toplam ${roleStats.length} aktif rol`,
                    inline: false
                });

                // En popüler rolü vurgula
                if (roleStats.length > 0) {
                    const mostPopular = roleStats[0];
                    embed.addFields({
                        name: '👑 En Popüler Rol',
                        value: `${mostPopular.roleName} (${mostPopular.memberCount} üye)`,
                        inline: false
                    });
                }
            }

            await message.reply({ embeds: [embed] });
            
        } catch (error) {
            console.error('Rol istatistikleri komutunda hata:', error);
            await message.reply('Rol istatistikleri alınırken bir hata oluştu!');
        }
    }
};