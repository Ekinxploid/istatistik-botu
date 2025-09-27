const { Client, GatewayIntentBits, Collection, Events, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('./config.json');
const Database = require('./database');
const LevelSystem = require('./utils/levelSystem');

// Bot istemcisini oluştur
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildPresences
    ]
});

// Veritabanı bağlantısı
const database = new Database();

// Komut koleksiyonu
client.commands = new Collection();

// Komutları yükle
const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
            console.log(`Komut yüklendi: ${command.data.name}`);
        } else {
            console.log(`[UYARI] ${filePath} dosyasında gerekli "data" veya "execute" özelliği eksik.`);
        }
    }
} else {
    console.log('[UYARI] Commands klasörü bulunamadı!');
}

// Bot hazır olduğunda
client.once(Events.ClientReady, () => {
    console.log(`✅ Bot giriş yaptı: ${client.user.tag}`);
    console.log(`📊 ${client.guilds.cache.size} sunucuda aktif`);
    
    // Bot durumunu ayarla
    client.user.setActivity('İstatistikleri takip ediyor', { type: 'WATCHING' });
});

// Mesaj olayları
client.on(Events.MessageCreate, async (message) => {
    // Bot mesajlarını yoksay
    if (message.author.bot) return;
    
    // Komut kontrolü
    if (!message.content.startsWith(config.prefix)) return;
    
    const args = message.content.slice(config.prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();
    
    const command = client.commands.get(commandName);
    if (!command) return;
    
    try {
        // Komut kullanımını logla
        await database.logCommand(commandName, message.author.id, message.guild.id);
        
        // Kullanıcıyı veritabanına ekle/güncelle
        await database.createUser(message.author);
        
        // Mesaj sayısını güncelle
        await database.updateMessageCount(message.author.id, message.channel.id);
        
        // XP ver
        await database.updateUserXP(message.author.id, config.xpPerMessage);
        
        // Seviye kontrolü
        const user = await database.getUser(message.author.id);
        const levelUp = await LevelSystem.checkLevelUp(message.author.id, user.xp, database);
        
        if (levelUp.leveledUp) {
            // Seviye kartı oluştur
            const LevelCard = require('./utils/levelCard');
            const card = await LevelCard.createLevelUpCard(message.author, levelUp.oldLevel, levelUp.newLevel, user, message.guild);
            
            // Components v2 ile tebrik mesajı
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('congrats_celebration')
                        .setLabel('🎉 Kutlama!')
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId('view_profile')
                        .setLabel('👤 Profil')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('share_achievement')
                        .setLabel('📤 Paylaş')
                        .setStyle(ButtonStyle.Secondary)
                );

            const levelUpEmbed = {
                color: 0xffd700,
                title: '🎉 TEBRİKLER! Seviye Atladınız!',
                description: `**${message.author.username}** seviye **${levelUp.oldLevel}** → **${levelUp.newLevel}** atladı!`,
                fields: [
                    { name: '🏆 Yeni Seviye', value: levelUp.newLevel.toString(), inline: true },
                    { name: '⭐ Toplam XP', value: user.xp.toString(), inline: true },
                    { name: '🎯 Sonraki Seviye', value: `${levelUp.xpToNext} XP kaldı`, inline: true }
                ],
                thumbnail: {
                    url: message.author.displayAvatarURL()
                },
                timestamp: new Date().toISOString(),
                footer: {
                    text: 'İstatistik Botu • Seviye Atlama'
                }
            };

            // Kart varsa kart ile birlikte gönder
            if (card) {
                levelUpEmbed.image = { url: 'attachment://levelup-card.png' };
                await message.channel.send({ 
                    embeds: [levelUpEmbed], 
                    files: [card],
                    components: [row]
                });
            } else {
                await message.channel.send({ 
                    embeds: [levelUpEmbed],
                    components: [row]
                });
            }

            // 50 mesajda bir seviye kartı gönder
            const messageCount = user.totalMessages || 0;
            if (messageCount % 50 === 0 && messageCount > 0) {
                const levelCardChannel = message.guild.channels.cache.get(config.levelCardChannel);
                if (levelCardChannel) {
                    const regularCard = await LevelCard.createLevelCard(message.author, user, message.guild);
                    if (regularCard) {
                        const cardEmbed = {
                            title: '🎴 Seviye Kartı Güncellendi!',
                            description: `**${message.author.username}** ${messageCount} mesaj gönderdi!`,
                            color: 0x00ff00,
                            image: { url: 'attachment://level-card.png' },
                            fields: [
                                { name: '📊 Seviye', value: user.level?.toString() || '0', inline: true },
                                { name: '💬 Mesaj Sayısı', value: messageCount.toString(), inline: true },
                                { name: '⭐ Toplam XP', value: user.xp?.toString() || '0', inline: true }
                            ],
                            timestamp: new Date().toISOString(),
                            footer: { text: 'İstatistik Botu • Seviye Kartı' }
                        };

                        await levelCardChannel.send({ 
                            embeds: [cardEmbed], 
                            files: [regularCard]
                        });
                    }
                }
            }
        }
        
        // Komutu çalıştır
        await command.execute(message, args, database);
        
    } catch (error) {
        console.error(`Komut çalıştırılırken hata: ${error}`);
        await message.reply('Komut çalıştırılırken bir hata oluştu!');
    }
});

// Sesli kanal olayları
client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
    const member = newState.member;
    const userId = member.id;
    
    // Kullanıcıyı veritabanına ekle
    await database.createUser(member.user);
    
    // Sesli kanala katılma
    if (!oldState.channelId && newState.channelId) {
        member.voiceJoinTime = Date.now();
    }
    
    // Sesli kanaldan ayrılma
    if (oldState.channelId && !newState.channelId) {
        if (member.voiceJoinTime) {
            const duration = Math.floor((Date.now() - member.voiceJoinTime) / 1000);
            if (duration > 0) {
                await database.updateVoiceTime(userId, oldState.channelId, duration);
                
                // Sesli kanal XP'si ver
                const voiceXP = Math.floor(duration / 60) * config.xpPerVoiceMinute;
                await database.updateUserXP(userId, voiceXP);
                
                // Seviye kontrolü
                const user = await database.getUser(userId);
                const levelUp = await LevelSystem.checkLevelUp(userId, user.xp, database);
                
                if (levelUp.leveledUp) {
                    const channel = newState.guild.channels.cache.find(ch => ch.type === 0 && ch.permissionsFor(newState.guild.members.me).has('SendMessages'));
                    if (channel) {
                        const levelUpEmbed = {
                            color: 0x00ff00,
                            title: '🎉 Seviye Atladın!',
                            description: `${member} seviye ${levelUp.oldLevel} → ${levelUp.newLevel} atladı!`,
                            fields: [
                                { name: 'Yeni Seviye', value: levelUp.newLevel.toString(), inline: true },
                                { name: 'Sesli Kanal XP', value: voiceXP.toString(), inline: true }
                            ],
                            timestamp: new Date().toISOString()
                        };
                        
                        await channel.send({ embeds: [levelUpEmbed] });
                    }
                }
            }
        }
    }
});

// Üye katılma/ayrılma olayları
client.on(Events.GuildMemberAdd, async (member) => {
    await database.createUser(member.user);
    
    // Günlük istatistikleri güncelle
    const today = new Date().toISOString().split('T')[0];
    // Bu kısım daha sonra guild_stats tablosuna eklenecek
});

client.on(Events.GuildMemberRemove, async (member) => {
    // Günlük istatistikleri güncelle
    const today = new Date().toISOString().split('T')[0];
    // Bu kısım daha sonra guild_stats tablosuna eklenecek
});

// Button ve Select Menu Interactions
client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isButton() && !interaction.isStringSelectMenu()) return;

    try {
        const EmbedBuilder = require('./utils/embedBuilder');

        if (interaction.isButton()) {
            switch (interaction.customId) {
                case 'help_basic':
                    const basicEmbed = new EmbedBuilder()
                        .setTitle('📊 Temel Komutlar')
                        .setColor(0x00ff00)
                        .addFields(
                            { name: '`.uyeler`', value: 'Sunucu üye istatistiklerini gösterir', inline: false },
                            { name: '`.sunucu`', value: 'Sunucu genel istatistiklerini gösterir', inline: false },
                            { name: '`.profil [kullanıcı]`', value: 'Kullanıcı profil bilgilerini gösterir', inline: false }
                        )
                        .setTimestamp();
                    await interaction.reply({ embeds: [basicEmbed], ephemeral: true });
                    break;

                case 'help_voice':
                    const voiceEmbed = new EmbedBuilder()
                        .setTitle('🎤 Sesli & Aktivite Komutları')
                        .setColor(0xff6b6b)
                        .addFields(
                            { name: '`.sesli`', value: 'Sesli kanal istatistiklerini gösterir', inline: false },
                            { name: '`.komutlar`', value: 'En çok kullanılan komutları listeler', inline: false },
                            { name: '`.roller`', value: 'Rol istatistiklerini gösterir', inline: false }
                        )
                        .setTimestamp();
                    await interaction.reply({ embeds: [voiceEmbed], ephemeral: true });
                    break;

                case 'help_level':
                    const levelEmbed = new EmbedBuilder()
                        .setTitle('🏆 Seviye Sistemi')
                        .setColor(0xffd700)
                        .addFields(
                            { name: '`.seviye [sayfa]`', value: 'Seviye tablosunu gösterir', inline: false },
                            { name: '`.rapor`', value: 'Haftalık sunucu raporunu gösterir', inline: false },
                            { name: 'XP Kazanma', value: '• Her mesaj için 1 XP\n• Sesli kanalda her dakika için 2 XP', inline: false }
                        )
                        .setTimestamp();
                    await interaction.reply({ embeds: [levelEmbed], ephemeral: true });
                    break;

                case 'help_commands':
                    const commandsEmbed = new EmbedBuilder()
                        .setTitle('📋 Tüm Komutlar')
                        .setColor(0x9b59b6)
                        .addFields(
                            { name: 'İstatistik Komutları', value: '`.uyeler` `.sunucu` `.profil`', inline: true },
                            { name: 'Aktivite Komutları', value: '`.sesli` `.komutlar` `.roller`', inline: true },
                            { name: 'Seviye Komutları', value: '`.seviye` `.rapor`', inline: true },
                            { name: 'Yardım', value: '`.yardim`', inline: true }
                        )
                        .setTimestamp();
                    await interaction.reply({ embeds: [commandsEmbed], ephemeral: true });
                    break;

                case 'help_info':
                    const infoEmbed = new EmbedBuilder()
                        .setTitle('ℹ️ Bot Bilgisi')
                        .setColor(0x3498db)
                        .addFields(
                            { name: 'Bot Adı', value: 'İstatistik Botu', inline: true },
                            { name: 'Prefix', value: '`.`', inline: true },
                            { name: 'Versiyon', value: '1.0.0', inline: true },
                            { name: 'Özellikler', value: '• Gelişmiş istatistik takibi\n• Seviye sistemi\n• Otomatik raporlar\n• Components v2 desteği\n• Canvacord seviye kartları', inline: false }
                        )
                        .setTimestamp();
                    await interaction.reply({ embeds: [infoEmbed], ephemeral: true });
                    break;

                // Seviye kartı butonları
                case 'refresh_card':
                    const LevelCard = require('./utils/levelCard');
                    const user = interaction.user;
                    const userData = await database.getUser(user.id);
                    const newCard = await LevelCard.createLevelCard(user, userData, interaction.guild);
                    
                    if (newCard) {
                        const refreshEmbed = {
                            title: '🔄 Kart Yenilendi!',
                            description: 'Seviye kartınız güncellendi.',
                            color: 0x00ff00,
                            image: { url: 'attachment://level-card.png' },
                            timestamp: new Date().toISOString()
                        };
                        await interaction.reply({ embeds: [refreshEmbed], files: [newCard], ephemeral: true });
                    } else {
                        await interaction.reply({ content: 'Kart yenilenirken bir hata oluştu!', ephemeral: true });
                    }
                    break;

                case 'share_card':
                    await interaction.reply({ content: '🎴 Seviye kartınız paylaşıldı!', ephemeral: true });
                    break;

                case 'card_info':
                    const cardInfoEmbed = new EmbedBuilder()
                        .setTitle('ℹ️ Seviye Kartı Bilgisi')
                        .setColor(0x00ff00)
                        .addFields(
                            { name: '🎴 Kart Özellikleri', value: '• Canvacord ile oluşturulmuş\n• Gerçek zamanlı veriler\n• Özelleştirilebilir tasarım', inline: false },
                            { name: '📊 Gösterilen Bilgiler', value: '• Mevcut seviye\n• Toplam XP\n• Sonraki seviye için gerekli XP\n• Progress bar', inline: false },
                            { name: '🔄 Güncelleme', value: 'Kart her mesajda otomatik güncellenir', inline: false }
                        )
                        .setTimestamp();
                    await interaction.reply({ embeds: [cardInfoEmbed], ephemeral: true });
                    break;

                case 'congrats_celebration':
                    await interaction.reply({ content: '🎉🎊🎈 Tebrikler! Başarınız kutlanıyor! 🎈🎊🎉', ephemeral: true });
                    break;

                case 'view_profile':
                    await interaction.reply({ content: '👤 Profil komutunu kullanmak için `.profil` yazın!', ephemeral: true });
                    break;

                case 'share_achievement':
                    await interaction.reply({ content: '📤 Başarınız paylaşıldı! Harika iş! 🎉', ephemeral: true });
                    break;
            }
        }

        if (interaction.isStringSelectMenu()) {
            if (interaction.customId === 'help_category') {
                const selectedValue = interaction.values[0];
                let embed;

                switch (selectedValue) {
                    case 'basic_stats':
                        embed = new EmbedBuilder()
                            .setTitle('📊 Temel İstatistikler')
                            .setColor(0x00ff00)
                            .setDescription('Sunucu ve kullanıcı temel istatistikleri')
                            .addFields(
                                { name: '`.uyeler`', value: 'Üye sayıları ve durum dağılımı', inline: false },
                                { name: '`.sunucu`', value: 'Sunucu genel istatistikleri', inline: false },
                                { name: '`.profil [kullanıcı]`', value: 'Detaylı kullanıcı profili', inline: false }
                            );
                        break;

                    case 'voice_stats':
                        embed = new EmbedBuilder()
                            .setTitle('🎤 Sesli Kanal İstatistikleri')
                            .setColor(0xff6b6b)
                            .setDescription('Sesli kanal kullanım ve aktivite verileri')
                            .addFields(
                                { name: '`.sesli`', value: 'En çok kullanılan sesli kanallar', inline: false },
                                { name: '`.komutlar`', value: 'Komut kullanım istatistikleri', inline: false },
                                { name: '`.roller`', value: 'Rol bazlı üye dağılımı', inline: false }
                            );
                        break;

                    case 'level_system':
                        embed = new EmbedBuilder()
                            .setTitle('🏆 Seviye Sistemi')
                            .setColor(0xffd700)
                            .setDescription('XP kazanma ve seviye atlama sistemi')
                            .addFields(
                                { name: '`.seviye [sayfa]`', value: 'Seviye tablosu ve sıralama', inline: false },
                                { name: '`.rapor`', value: 'Haftalık sunucu performans raporu', inline: false },
                                { name: 'XP Kazanma', value: 'Mesaj: 1 XP\nSesli: 2 XP/dakika', inline: false }
                            );
                        break;

                    case 'role_command_stats':
                        embed = new EmbedBuilder()
                            .setTitle('🎭 Rol & Komut İstatistikleri')
                            .setColor(0x9b59b6)
                            .setDescription('Rol dağılımı ve komut kullanım analizi')
                            .addFields(
                                { name: '`.roller`', value: 'Rol bazlı üye sayıları', inline: false },
                                { name: '`.komutlar`', value: 'En popüler komutlar', inline: false },
                                { name: '`.rapor`', value: 'Haftalık aktivite özeti', inline: false }
                            );
                        break;
                }

                await interaction.reply({ embeds: [embed], ephemeral: true });
            }
        }

    } catch (error) {
        console.error('Interaction hatası:', error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: 'Bir hata oluştu!', ephemeral: true });
        } else {
            await interaction.reply({ content: 'Bir hata oluştu!', ephemeral: true });
        }
    }
});

// Haftalık rapor (her pazartesi saat 09:00)
setInterval(async () => {
    const now = new Date();
    if (now.getDay() === 1 && now.getHours() === 9 && now.getMinutes() === 0) {
        for (const guild of client.guilds.cache.values()) {
            const reportChannel = guild.channels.cache.get(config.weeklyReportChannel);
            if (reportChannel) {
                const weeklyData = await database.getWeeklyStats(guild.id);
                const EmbedBuilder = require('./utils/embedBuilder');
                const embed = EmbedBuilder.createWeeklyReportEmbed(weeklyData, guild);
                await reportChannel.send({ embeds: [embed] });
            }
        }
    }
}, 60000); // Her dakika kontrol et

// Hata yakalama
client.on(Events.Error, error => {
    console.error('Discord.js hatası:', error);
});

process.on('unhandledRejection', error => {
    console.error('İşlenmeyen Promise reddi:', error);
});

// Botu başlat
client.login(config.token);
