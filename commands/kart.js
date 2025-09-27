const { PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const LevelCard = require('../utils/levelCard');

module.exports = {
    data: {
        name: 'kart',
        description: 'Seviye kartınızı gösterir'
    },
    
    async execute(message, args, database) {
        try {
            const user = message.author;
            const guild = message.guild;
            
            // Kullanıcı verilerini al
            let userData = await database.getUser(user.id);
            if (!userData) {
                await database.createUser(user);
                userData = await database.getUser(user.id);
            }

            // Seviye kartını oluştur
            const card = await LevelCard.createLevelCard(user, userData, guild);
            
            if (!card) {
                await message.reply('Seviye kartı oluşturulurken bir hata oluştu!');
                return;
            }

            // Components v2 ile interaktif butonlar
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('refresh_card')
                        .setLabel('🔄 Yenile')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('share_card')
                        .setLabel('📤 Paylaş')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId('card_info')
                        .setLabel('ℹ️ Bilgi')
                        .setStyle(ButtonStyle.Secondary)
                );

            const embed = {
                title: '🎴 Seviye Kartınız',
                description: `**${user.username}** seviye kartınız hazır!`,
                color: 0x00ff00,
                image: {
                    url: 'attachment://level-card.png'
                },
                fields: [
                    {
                        name: '📊 Seviye',
                        value: userData.level?.toString() || '0',
                        inline: true
                    },
                    {
                        name: '⭐ XP',
                        value: userData.xp?.toString() || '0',
                        inline: true
                    },
                    {
                        name: '🎯 Sonraki Seviye',
                        value: `${Math.pow((userData.level || 0) + 1, 2) * 100 - (userData.xp || 0)} XP kaldı`,
                        inline: true
                    }
                ],
                timestamp: new Date().toISOString(),
                footer: {
                    text: 'İstatistik Botu • Seviye Kartı'
                }
            };

            await message.reply({ 
                embeds: [embed], 
                files: [card],
                components: [row]
            });
            
        } catch (error) {
            console.error('Kart komutunda hata:', error);
            await message.reply('Seviye kartı oluşturulurken bir hata oluştu!');
        }
    }
};
