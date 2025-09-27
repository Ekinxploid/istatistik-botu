const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const config = require('./config.json');

class Database {
    constructor() {
        this.db = new sqlite3.Database(config.databasePath);
        this.init();
    }

    init() {
        // Kullanıcı tablosu
        this.db.run(`
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                username TEXT,
                discriminator TEXT,
                joinedAt TEXT,
                totalMessages INTEGER DEFAULT 0,
                totalVoiceTime INTEGER DEFAULT 0,
                xp INTEGER DEFAULT 0,
                level INTEGER DEFAULT 0,
                lastMessage TEXT,
                lastVoiceJoin TEXT
            )
        `);

        // Mesaj istatistikleri
        this.db.run(`
            CREATE TABLE IF NOT EXISTS message_stats (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                userId TEXT,
                channelId TEXT,
                messageCount INTEGER DEFAULT 0,
                date TEXT,
                FOREIGN KEY (userId) REFERENCES users (id)
            )
        `);

        // Sesli kanal istatistikleri
        this.db.run(`
            CREATE TABLE IF NOT EXISTS voice_stats (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                userId TEXT,
                channelId TEXT,
                duration INTEGER DEFAULT 0,
                joinTime TEXT,
                leaveTime TEXT,
                FOREIGN KEY (userId) REFERENCES users (id)
            )
        `);

        // Komut kullanım istatistikleri
        this.db.run(`
            CREATE TABLE IF NOT EXISTS command_stats (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                commandName TEXT,
                userId TEXT,
                guildId TEXT,
                usedAt TEXT
            )
        `);

        // Sunucu istatistikleri
        this.db.run(`
            CREATE TABLE IF NOT EXISTS guild_stats (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                guildId TEXT,
                date TEXT,
                messageCount INTEGER DEFAULT 0,
                newMembers INTEGER DEFAULT 0,
                leftMembers INTEGER DEFAULT 0,
                totalMembers INTEGER DEFAULT 0,
                onlineMembers INTEGER DEFAULT 0,
                botCount INTEGER DEFAULT 0
            )
        `);

        // Rol istatistikleri
        this.db.run(`
            CREATE TABLE IF NOT EXISTS role_stats (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                roleId TEXT,
                roleName TEXT,
                memberCount INTEGER DEFAULT 0,
                date TEXT
            )
        `);

        console.log('Veritabanı tabloları oluşturuldu.');
    }

    // Kullanıcı işlemleri
    async getUser(userId) {
        return new Promise((resolve, reject) => {
            this.db.get('SELECT * FROM users WHERE id = ?', [userId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    async createUser(user) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'INSERT OR REPLACE INTO users (id, username, discriminator, joinedAt) VALUES (?, ?, ?, ?)',
                [user.id, user.username, user.discriminator, new Date().toISOString()],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });
    }

    async updateUserXP(userId, xp) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'UPDATE users SET xp = xp + ? WHERE id = ?',
                [xp, userId],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.changes);
                }
            );
        });
    }

    async updateUserLevel(userId, level) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'UPDATE users SET level = ? WHERE id = ?',
                [level, userId],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.changes);
                }
            );
        });
    }

    async updateMessageCount(userId, channelId) {
        const today = new Date().toISOString().split('T')[0];
        return new Promise((resolve, reject) => {
            // Önce mevcut kaydı kontrol et
            this.db.get(
                'SELECT messageCount FROM message_stats WHERE userId = ? AND channelId = ? AND date = ?',
                [userId, channelId, today],
                (err, row) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    
                    if (row) {
                        // Mevcut kaydı güncelle
                        this.db.run(
                            'UPDATE message_stats SET messageCount = messageCount + 1 WHERE userId = ? AND channelId = ? AND date = ?',
                            [userId, channelId, today],
                            function(err) {
                                if (err) reject(err);
                                else resolve(this.changes);
                            }
                        );
                    } else {
                        // Yeni kayıt oluştur
                        this.db.run(
                            'INSERT INTO message_stats (userId, channelId, messageCount, date) VALUES (?, ?, 1, ?)',
                            [userId, channelId, today],
                            function(err) {
                                if (err) reject(err);
                                else resolve(this.lastID);
                            }
                        );
                    }
                }
            );
        });
    }

    async updateVoiceTime(userId, channelId, duration) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'INSERT INTO voice_stats (userId, channelId, duration, joinTime, leaveTime) VALUES (?, ?, ?, ?, ?)',
                [userId, channelId, duration, new Date().toISOString(), new Date().toISOString()],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });
    }

    async logCommand(commandName, userId, guildId) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'INSERT INTO command_stats (commandName, userId, guildId, usedAt) VALUES (?, ?, ?, ?)',
                [commandName, userId, guildId, new Date().toISOString()],
                function(err) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });
    }

    async getTopUsers(limit = 10) {
        return new Promise((resolve, reject) => {
            this.db.all(
                'SELECT * FROM users ORDER BY xp DESC LIMIT ?',
                [limit],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });
    }

    async getTopChannels(guildId, limit = 10) {
        return new Promise((resolve, reject) => {
            this.db.all(
                `SELECT channelId, SUM(messageCount) as totalMessages 
                 FROM message_stats 
                 GROUP BY channelId 
                 ORDER BY totalMessages DESC 
                 LIMIT ?`,
                [limit],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });
    }

    async getTopCommands(limit = 10) {
        return new Promise((resolve, reject) => {
            this.db.all(
                'SELECT commandName, COUNT(*) as usageCount FROM command_stats GROUP BY commandName ORDER BY usageCount DESC LIMIT ?',
                [limit],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });
    }

    async getWeeklyStats(guildId) {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        
        return new Promise((resolve, reject) => {
            this.db.all(
                `SELECT * FROM guild_stats 
                 WHERE guildId = ? AND date >= ? 
                 ORDER BY date DESC`,
                [guildId, weekAgo.toISOString().split('T')[0]],
                (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows);
                }
            );
        });
    }

    close() {
        this.db.close();
    }
}

module.exports = Database;
