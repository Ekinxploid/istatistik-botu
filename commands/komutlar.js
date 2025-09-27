const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: {
        name: 'komutlar',
        description: 'En çok kullanılan komutları gösterir'
    },
    
    async execute(message, args, database) {
        try {
            // En çok kullanılan komutları al
            const commandStats = await database.getTopCommands(10);

            const embed = new EmbedBuilder()
                .setTitle('⚡ En Çok Kullanılan Komutlar')
                .setColor(0xffd93d)
                .setTimestamp()
                .setFooter({ text: 'İstatistik Botu' });

            if (commandStats.length === 0) {
                embed.setDescription('Henüz komut kullanım istatistiği bulunmuyor.');
            } else {
                // Discord.js v14'te addFields doğru kullanımı
                embed.addFields(
                    commandStats.map((stat, index) => {
                        return {
                            name: `${index + 1}. ${stat.commandName}`,
                            value: `${stat.usageCount} kez kullanıldı`,
                            inline: true
                        };
                    })
                );
            }

            await message.reply({ embeds: [embed] });
            
        } catch (error) {
            console.error('Komut istatistikleri komutunda hata:', error);
            await message.reply('Komut istatistikleri alınırken bir hata oluştu!');
        }
    }
};