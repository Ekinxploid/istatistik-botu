# Discord İstatistik Botu

Gelişmiş özelliklerle donatılmış Discord istatistik botu. `.` prefix kullanarak çalışır ve kapsamlı sunucu analizi sağlar.

## 🚀 Özellikler

### 📊 Üye İstatistikleri
- Toplam üye sayısı
- Çevrimiçi/çevrimdışı üye sayıları
- Bot sayısı ve insan sayısı
- Detaylı durum dağılımı

### 🏠 Sunucu İstatistikleri
- Günlük ve haftalık mesaj sayıları
- Yeni katılan ve ayrılan üye sayıları
- En aktif kanallar
- Net büyüme oranları

### 👤 Kullanıcı Profilleri
- Kişisel seviye ve XP bilgileri
- Toplam mesaj sayısı
- Sesli kanal süresi
- En aktif olduğu kanal
- Sunucuya katılma tarihi

### 🎤 Sesli Kanal İstatistikleri
- En çok kullanılan sesli kanallar
- Toplam sesli kanal süresi
- Kanal bazlı kullanım istatistikleri

### ⚡ Komut İstatistikleri
- En çok kullanılan komutlar
- Komut kullanım sayıları
- Detaylı komut analizi

### 🎭 Rol İstatistikleri
- Rol bazlı üye dağılımı
- En popüler roller
- Rol kullanım oranları

### 🏆 Seviye Sistemi
- Mesaj ve sesli kanal aktivitesinden XP kazanma
- Otomatik seviye atlama
- Seviye tablosu ve sıralama
- Sonraki seviye için gerekli XP gösterimi

### 📈 Haftalık Raporlar
- Otomatik haftalık sunucu raporu
- Günlük aktivite analizi
- Büyüme ve düşüş trendleri

### 🎴 Seviye Kartları (Canvacord)
- Canvacord ile oluşturulan görsel seviye kartları
- Gerçek zamanlı veriler
- 50 mesajda bir otomatik kart gönderimi
- Components v2 ile interaktif butonlar
- Tebrik kartları seviye atlama anında
- En aktif günler

## 🛠️ Kurulum

### Gereksinimler
- Node.js 16.9.0 veya üzeri
- Discord Bot Token
- SQLite3 veritabanı desteği

### Adım 1: Projeyi İndirin
```bash
git clone <repository-url>
cd discord-istatistik-botu
```

### Adım 2: Bağımlılıkları Yükleyin
```bash
npm install
```

### Adım 3: Konfigürasyon
`config.json` dosyasını düzenleyin:

```json
{
  "token": "YOUR_BOT_TOKEN_HERE",
  "prefix": ".",
  "ownerID": "YOUR_USER_ID_HERE",
  "databasePath": "./database.sqlite",
  "xpPerMessage": 1,
  "xpPerVoiceMinute": 2,
  "levelUpMultiplier": 1.5,
  "weeklyReportChannel": "YOUR_CHANNEL_ID_HERE"
}
```

### Adım 4: Discord Bot Oluşturun
1. [Discord Developer Portal](https://discord.com/developers/applications) adresine gidin
2. "New Application" butonuna tıklayın
3. Bot adını girin ve oluşturun
4. "Bot" sekmesine gidin
5. "Add Bot" butonuna tıklayın
6. Token'ı kopyalayın ve `config.json` dosyasına yapıştırın

### Adım 5: Bot İzinleri
Bot için gerekli izinler:
- Send Messages
- Read Message History
- View Channels
- Connect (Sesli kanallar için)
- Speak (Sesli kanallar için)
- Read Members

### Adım 6: Botu Çalıştırın
```bash
npm start
```

## 📋 Komutlar

| Komut | Açıklama | Kullanım |
|-------|----------|----------|
| `.uyeler` | Sunucu üye istatistiklerini gösterir | `.uyeler` |
| `.sunucu` | Sunucu genel istatistiklerini gösterir | `.sunucu` |
| `.profil [kullanıcı]` | Kullanıcı profil bilgilerini gösterir | `.profil @kullanıcı` |
| `.sesli` | Sesli kanal istatistiklerini gösterir | `.sesli` |
| `.komutlar` | En çok kullanılan komutları listeler | `.komutlar` |
| `.roller` | Rol istatistiklerini gösterir | `.roller` |
| `.seviye [sayfa]` | Seviye tablosunu gösterir | `.seviye 1` |
| `.rapor` | Haftalık sunucu raporunu gösterir | `.rapor` |
| `.kart` | Seviye kartınızı gösterir (Canvacord) | `.kart` |
| `.yardim` | İnteraktif yardım menüsü (Components v2) | `.yardim` |

## 🔧 Konfigürasyon Seçenekleri

### XP Sistemi
- `xpPerMessage`: Her mesaj için verilen XP (varsayılan: 1)
- `xpPerVoiceMinute`: Sesli kanalda geçirilen her dakika için verilen XP (varsayılan: 2)
- `levelUpMultiplier`: Seviye atlama çarpanı (varsayılan: 1.5)

### Veritabanı
- `databasePath`: SQLite veritabanı dosya yolu (varsayılan: ./database.sqlite)

### Raporlama
- `weeklyReportChannel`: Haftalık raporların gönderileceği kanal ID'si

## 📊 Veritabanı Yapısı

Bot aşağıdaki tabloları kullanır:
- `users`: Kullanıcı bilgileri ve XP/seviye verileri
- `message_stats`: Mesaj istatistikleri
- `voice_stats`: Sesli kanal istatistikleri
- `command_stats`: Komut kullanım istatistikleri
- `guild_stats`: Sunucu istatistikleri
- `role_stats`: Rol istatistikleri

## 🚨 Sorun Giderme

### Bot Çevrimiçi Değil
- Token'ın doğru olduğundan emin olun
- Bot izinlerini kontrol edin
- İnternet bağlantınızı kontrol edin

### Komutlar Çalışmıyor
- Bot'un sunucuda olduğundan emin olun
- Gerekli izinlerin verildiğini kontrol edin
- Prefix'in doğru kullanıldığını kontrol edin

### Veritabanı Hataları
- SQLite3'ün yüklü olduğundan emin olun
- Veritabanı dosyasına yazma izni olduğundan emin olun

## 📝 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/AmazingFeature`)
3. Commit yapın (`git commit -m 'Add some AmazingFeature'`)
4. Branch'i push edin (`git push origin feature/AmazingFeature`)
5. Pull Request oluşturun

## 📞 Destek

Sorunlarınız için GitHub Issues kullanabilirsiniz.

---

**Not**: Bu bot Discord.js v14 kullanır ve Node.js 16.9.0+ gerektirir.
