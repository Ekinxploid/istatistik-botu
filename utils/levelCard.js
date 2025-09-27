const { AttachmentBuilder } = require('discord.js');
const { Rank } = require('canvacord');

class LevelCard {
    static async createLevelCard(user, userData, guild) {
        try {
            // Kullanıcı verilerini hazırla
            const username = user.username;
            const discriminator = user.discriminator;
            const avatar = user.displayAvatarURL({ extension: 'png', size: 256 });
            const currentLevel = userData.level || 0;
            const currentXP = userData.xp || 0;
            const nextLevelXP = Math.pow(currentLevel + 1, 2) * 100;

            // Canvacord Rank sınıfını kullanarak kart oluştur
            const rank = new Rank()
                .setAvatar(avatar)
                .setCurrentXP(currentXP)
                .setRequiredXP(nextLevelXP)
                .setLevel(currentLevel)
                .setRank(1) // Rank bilgisi
                .setStatus(user.presence?.status || 'online') // Kullanıcı durumu
                .setProgressBar(["#00FF00", "#FFFFFF"], "GRADIENT") // Gradient progress bar
                .setUsername(username)
                .setDiscriminator(discriminator)
                .setBackground("IMAGE", "https://images.unsplash.com/photo-1557683316-973673baf926?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80")
                .setOverlay("#000000", 0.4);

            // Kartı render et
            const card = await rank.build();
            
            // Attachment olarak döndür
            return new AttachmentBuilder(card, { name: 'level-card.png' });

        } catch (error) {
            console.error('Seviye kartı oluşturulurken hata:', error);
            return null;
        }
    }

    static async createLevelUpCard(user, oldLevel, newLevel, userData, guild) {
        try {
            const username = user.username;
            const avatar = user.displayAvatarURL({ extension: 'png', size: 256 });
            const currentXP = userData.xp || 0;
            const nextLevelXP = Math.pow(newLevel + 1, 2) * 100;

            const rank = new Rank()
                .setAvatar(avatar)
                .setCurrentXP(currentXP)
                .setRequiredXP(nextLevelXP)
                .setLevel(newLevel)
                .setRank(1)
                .setStatus(user.presence?.status || 'online')
                .setProgressBar(["#FFD700", "#FFA500"], "GRADIENT") // Altın gradient
                .setUsername(username)
                .setDiscriminator(user.discriminator)
                .setBackground("IMAGE", "https://images.unsplash.com/photo-1518709268805-4e9042af2176?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80")
                .setOverlay("#000000", 0.3);

            const card = await rank.build();
            return new AttachmentBuilder(card, { name: 'levelup-card.png' });

        } catch (error) {
            console.error('Tebrik kartı oluşturulurken hata:', error);
            return null;
        }
    }
}

module.exports = LevelCard;