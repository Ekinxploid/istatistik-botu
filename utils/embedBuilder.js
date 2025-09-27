const { EmbedBuilder: DiscordEmbedBuilder } = require('discord.js');

class EmbedBuilder {
    static createStatsEmbed(title, description, color = 0x00ff00) {
        return new DiscordEmbedBuilder()
            .setTitle(title)
            .setDescription(description)
            .setColor(color)
            .setTimestamp()
            .setFooter({ text: 'İstatistik Botu' });
    }

    static createMemberStatsEmbed(guild) {
        const totalMembers = guild.memberCount;
        const onlineMembers = guild.members.cache.filter(member => member.presence?.status === 'online').size;
        const idleMembers = guild.members.cache.filter(member => member.presence?.status === 'idle').size;
        const dndMembers = guild.members.cache.filter(member => member.presence?.status === 'dnd').size;
        const offlineMembers = totalMembers - onlineMembers - idleMembers - dndMembers;
        const botCount = guild.members.cache.filter(member => member.user.bot).size;
        const humanCount = totalMembers - botCount;

        const embed = new DiscordEmbedBuilder()
            .setTitle('📊 Sunucu Üye İstatistikleri')
            .setColor(0x00ff00)
            .addFields(
                { name: '👥 Toplam Üye', value: totalMembers.toString(), inline: true },
                { name: '🤖 Bot Sayısı', value: botCount.toString(), inline: true },
                { name: '👤 İnsan Sayısı', value: humanCount.toString(), inline: true },
                { name: '🟢 Çevrimiçi', value: onlineMembers.toString(), inline: true },
                { name: '🟡 Meşgul', value: idleMembers.toString(), inline: true },
                { name: '🔴 Rahatsız Etmeyin', value: dndMembers.toString(), inline: true },
                { name: '⚫ Çevrimdışı', value: offlineMembers.toString(), inline: true }
            )
            .setThumbnail(guild.iconURL())
            .setTimestamp()
            .setFooter({ text: 'İstatistik Botu' });

        return embed;
    }

    static createUserProfileEmbed(user, userData, guild) {
        const joinDate = new Date(userData.joinedAt);
        const level = userData.level || 0;
        const xp = userData.xp || 0;
        const totalMessages = userData.totalMessages || 0;
        const totalVoiceTime = userData.totalVoiceTime || 0;

        const embed = new DiscordEmbedBuilder()
            .setTitle(`👤 ${user.username} Profil Bilgileri`)
            .setColor(0x0099ff)
            .addFields(
                { name: '📊 Seviye', value: level.toString(), inline: true },
                { name: '⭐ XP', value: xp.toString(), inline: true },
                { name: '💬 Toplam Mesaj', value: totalMessages.toString(), inline: true },
                { name: '🎤 Sesli Süre', value: this.formatTime(totalVoiceTime), inline: true },
                { name: '📅 Katılma Tarihi', value: joinDate.toLocaleDateString('tr-TR'), inline: true },
                { name: '🏠 Sunucu', value: guild.name, inline: true }
            )
            .setThumbnail(user.displayAvatarURL())
            .setTimestamp()
            .setFooter({ text: 'İstatistik Botu' });

        return embed;
    }

    static createVoiceStatsEmbed(voiceStats, guild) {
        const embed = new DiscordEmbedBuilder()
            .setTitle('🎤 Sesli Kanal İstatistikleri')
            .setColor(0xff6b6b)
            .setTimestamp()
            .setFooter({ text: 'İstatistik Botu' });

        if (voiceStats.length === 0) {
            embed.setDescription('Henüz sesli kanal istatistiği bulunmuyor.');
            return embed;
        }

        const fields = voiceStats.slice(0, 10).map((stat, index) => {
            const channel = guild.channels.cache.get(stat.channelId);
            const channelName = channel ? channel.name : 'Bilinmeyen Kanal';
            const duration = this.formatTime(stat.totalDuration);
            
            return {
                name: `${index + 1}. ${channelName}`,
                value: `Süre: ${duration}\nKullanım: ${stat.usageCount} kez`,
                inline: true
            };
        });

        embed.addFields(fields);
        return embed;
    }

    static createCommandStatsEmbed(commandStats) {
        const embed = new DiscordEmbedBuilder()
            .setTitle('⚡ En Çok Kullanılan Komutlar')
            .setColor(0xffd93d)
            .setTimestamp()
            .setFooter({ text: 'İstatistik Botu' });

        if (commandStats.length === 0) {
            embed.setDescription('Henüz komut kullanım istatistiği bulunmuyor.');
            return embed;
        }

        const fields = commandStats.slice(0, 10).map((stat, index) => {
            return {
                name: `${index + 1}. ${stat.commandName}`,
                value: `${stat.usageCount} kez kullanıldı`,
                inline: true
            };
        });

        embed.addFields(fields);
        return embed;
    }

    static createRoleStatsEmbed(roleStats, guild) {
        const embed = new DiscordEmbedBuilder()
            .setTitle('🎭 Rol İstatistikleri')
            .setColor(0x9b59b6)
            .setTimestamp()
            .setFooter({ text: 'İstatistik Botu' });

        if (roleStats.length === 0) {
            embed.setDescription('Rol istatistiği bulunamadı.');
            return embed;
        }

        const fields = roleStats.slice(0, 10).map((stat, index) => {
            const role = guild.roles.cache.get(stat.roleId);
            const roleName = role ? role.name : 'Bilinmeyen Rol';
            
            return {
                name: `${index + 1}. ${roleName}`,
                value: `${stat.memberCount} üye`,
                inline: true
            };
        });

        embed.addFields(fields);
        return embed;
    }

    static createWeeklyReportEmbed(weeklyData, guild) {
        const totalMessages = weeklyData.reduce((sum, day) => sum + (day.messageCount || 0), 0);
        const totalNewMembers = weeklyData.reduce((sum, day) => sum + (day.newMembers || 0), 0);
        const totalLeftMembers = weeklyData.reduce((sum, day) => sum + (day.leftMembers || 0), 0);
        const avgOnlineMembers = Math.round(
            weeklyData.reduce((sum, day) => sum + (day.onlineMembers || 0), 0) / weeklyData.length
        );

        const embed = new DiscordEmbedBuilder()
            .setTitle('📈 Haftalık Sunucu Raporu')
            .setDescription(`**${guild.name}** sunucusunun bu haftaki performansı`)
            .setColor(0x00ff00)
            .addFields(
                { name: '💬 Toplam Mesaj', value: totalMessages.toString(), inline: true },
                { name: '👥 Yeni Üye', value: totalNewMembers.toString(), inline: true },
                { name: '👋 Ayrılan Üye', value: totalLeftMembers.toString(), inline: true },
                { name: '🟢 Ortalama Çevrimiçi', value: avgOnlineMembers.toString(), inline: true },
                { name: '📊 Net Büyüme', value: (totalNewMembers - totalLeftMembers).toString(), inline: true }
            )
            .setThumbnail(guild.iconURL())
            .setTimestamp()
            .setFooter({ text: 'İstatistik Botu - Haftalık Rapor' });

        return embed;
    }

    static createHelpEmbed() {
        const embed = new DiscordEmbedBuilder()
            .setTitle('🤖 İstatistik Botu - Yardım Menüsü')
            .setDescription('Aşağıdaki komutları kullanarak sunucu istatistiklerini görüntüleyebilirsiniz.')
            .setColor(0x00ff00)
            .addFields(
                { 
                    name: '📊 Temel Komutlar', 
                    value: '`.uyeler` - Sunucu üye istatistikleri\n`.sunucu` - Sunucu genel istatistikleri\n`.profil [kullanıcı]` - Kullanıcı profil bilgileri', 
                    inline: false 
                },
                { 
                    name: '🎤 Sesli & Aktivite', 
                    value: '`.sesli` - Sesli kanal istatistikleri\n`.komutlar` - En çok kullanılan komutlar\n`.roller` - Rol istatistikleri', 
                    inline: false 
                },
                { 
                    name: '🏆 Seviye Sistemi', 
                    value: '`.seviye [sayfa]` - Seviye tablosu\n`.rapor` - Haftalık sunucu raporu', 
                    inline: false 
                },
                { 
                    name: 'ℹ️ Bilgi', 
                    value: '• Mesaj göndererek ve sesli kanallarda zaman geçirerek XP kazanırsınız\n• Seviye atladığınızda otomatik bildirim alırsınız\n• Haftalık raporlar otomatik olarak gönderilir', 
                    inline: false 
                }
            )
            .setThumbnail('https://cdn.discordapp.com/emojis/1234567890123456789.png')
            .setTimestamp()
            .setFooter({ text: 'İstatistik Botu - Yardım' });

        return embed;
    }

    static formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hours > 0) {
            return `${hours}s ${minutes}d ${secs}s`;
        } else if (minutes > 0) {
            return `${minutes}d ${secs}s`;
        } else {
            return `${secs}s`;
        }
    }
}

module.exports = EmbedBuilder;