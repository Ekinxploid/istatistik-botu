const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
    data: {
        name: 'yardim',
        description: 'Bot komutları ve özellikler hakkında yardım menüsü'
    },
    
    async execute(message, args, database) {
        try {
            // Basit ve temiz yardım embed'ini oluştur
            const embed = new EmbedBuilder()
                .setTitle('🤖 İstatistik Botu - Yardım Menüsü')
                .setDescription('Aşağıda botun kullanabileceğiniz komutları listelenmiştir:')
                .setColor(0x5865F2)
                .addFields(
                    {
                        name: '📊 Temel Komutlar',
                        value: 
                            '`.profil` - Kullanıcı profilinizi gösterir\n' +
                            '`.sunucu` - Sunucu istatistiklerini gösterir\n' +
                            '`.uyeler` - Üye istatistiklerini gösterir\n' +
                            '`.roller` - Rol dağılımını gösterir\n' +
                            '`.seviye` - Seviye tablosunu gösterir',
                        inline: false
                    },
                    {
                        name: '📈 İstatistik Komutları',
                        value: 
                            '`.sesli` - Sesli kanal istatistikleri\n' +
                            '`.rapor` - Haftalık sunucu raporu\n' +
                            '`.komutlar` - Komut kullanım istatistikleri',
                        inline: false
                    },
                    {
                        name: '🎴 Seviye Kartı',
                        value: 
                            '`.kart` - Seviye kartınızı gösterir',
                        inline: false
                    },
                    {
                        name: 'ℹ️ Diğer Komutlar',
                        value: 
                            '`.yardim` - Bu yardım menüsünü gösterir',
                        inline: false
                    }
                )
                .setThumbnail(message.client.user.displayAvatarURL())
                .setTimestamp()
                .setFooter({ 
                    text: 'İstatistik Botu • .yardim', 
                    iconURL: message.guild.iconURL() 
                });

            await message.reply({ 
                embeds: [embed]
            });
            
        } catch (error) {
            console.error('Yardım komutunda hata:', error);
            await message.reply('Yardım menüsü yüklenirken bir hata oluştu!');
        }
    }
};