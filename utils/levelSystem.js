const config = require('../config.json');

class LevelSystem {
    static calculateLevel(xp) {
        return Math.floor(Math.sqrt(xp / 100));
    }

    static calculateXPForLevel(level) {
        return Math.pow(level, 2) * 100;
    }

    static calculateXPToNextLevel(currentXP) {
        const currentLevel = this.calculateLevel(currentXP);
        const nextLevelXP = this.calculateXPForLevel(currentLevel + 1);
        return nextLevelXP - currentXP;
    }

    static async checkLevelUp(userId, newXP, database) {
        const user = await database.getUser(userId);
        if (!user) return false;

        const oldLevel = user.level;
        const newLevel = this.calculateLevel(newXP);

        if (newLevel > oldLevel) {
            await database.updateUserLevel(userId, newLevel);
            return {
                leveledUp: true,
                oldLevel,
                newLevel,
                xpToNext: this.calculateXPToNextLevel(newXP)
            };
        }

        return { leveledUp: false };
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

    static formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }
}

module.exports = LevelSystem;
