# Medipol Lead CRM Üniversite Sunucusu Kurulum Kılavuzu

## 📋 Genel Bakış
Medipol Üniversitesi için kayıt olmakla ilgilenen uluslararası öğrencileri yönetmek amacıyla geliştirilmiş Potansiyel Müşteri Yönetim Sistemi uygulaması.

## 🛠️ Teknik Gereksinimler

### Web Sunucusu
- **Node.js**: Sürüm 16 veya daha yeni
- **İşletim Sistemi**: Linux (Ubuntu/CentOS) veya Windows Server
- **Bellek**: Minimum 2GB RAM
- **Depolama**: 10GB boş alan

### Veritabanı
- **Test İçin**: SQLite (uygulama içinde dahil)
- **Üretim İçin**: PostgreSQL veya MySQL

## 📦 Kurulum Adımları

### 1. Sunucu Hazırlığı
```bash
# Sistemi güncelle
sudo apt update && sudo apt upgrade -y

# Node.js yükle
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Kurulumu doğrula
node --version
npm --version
```

### 2. Uygulama Dosyalarını Kopyalama
```bash
# Uygulama dizini oluştur
sudo mkdir -p /var/www/medipol-leadapp
sudo chown $USER:$USER /var/www/medipol-leadapp

# Dosyaları kopyala (çıkardıktan sonra)
cp -r leadapp/* /var/www/medipol-leadapp/
```

### 3. Arka Yüz Sunucu Kurulumu
```bash
cd /var/www/medipol-leadapp/server

# Gerekli paketleri yükle
npm install

# Yapılandırma dosyasını kopyala
cp .env.example .env

# Yapılandırmayı düzenle (çok önemli!)
nano .env
```

### 4. Veritabanı Kurulumu
```bash
# Veritabanını oluştur
npm run prisma:generate
npm run db:push

# Başlangıç verilerini ekle (yönetici ve roller)
npm run seed
```

### 5. Uygulamayı Çalıştırma
```bash
# Test için geçici çalıştırma
npm start

# Kalıcı kurulum için (PM2 kullanarak)
npm install -g pm2
pm2 start src/index.js --name medipol-leadapp
pm2 save
pm2 startup
```

### 6. Web Sunucusu Yapılandırması (Nginx)
```nginx
# Yapılandırma dosyası: /etc/nginx/sites-available/medipol-leadapp
server {
    listen 80;
    server_name leadapp.medipol.edu.tr;  # Gerçek domain ile değiştirin
    
    # Ön yüz
    location / {
        root /var/www/medipol-leadapp/front\ 2;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
    
    # Arka yüz API
    location /api/ {
        proxy_pass http://localhost:4000/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

```bash
# Siteyi etkinleştir
sudo ln -s /etc/nginx/sites-available/medipol-leadapp /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## ⚙️ Yapılandırma Dosyası (.env)

`/var/www/medipol-leadapp/server/.env` dosyasını düzenleyin:

```bash
# Sunucu portu
PORT=4000

# Veritabanı
DATABASE_URL="file:./dev.db"

# PostgreSQL ile üretim için:
# DATABASE_URL="postgresql://kullaniciadi:sifre@localhost:5432/medipol_leadapp"

# Güvenlik anahtarı (değiştirilmeli!)
JWT_SECRET="medipol_guclu_gizli_anahtar_2025"

# CORS ayarları
CORS_ORIGIN="http://leadapp.medipol.edu.tr"
```

## 🔐 Varsayılan Hesaplar

### Yönetici Hesabı
- **E-posta**: admin@leadapp.com
- **Şifre**: admin123

**⚠️ Çok Önemli**: Kurulumdan hemen sonra şifreyi değiştirin!

## 🧪 Uygulamayı Test Etme

### 1. Arka Yüz Sunucuyu Test Etme
```bash
curl http://localhost:4000/health
# Şunu döndürmeli: {"status": "ok"}
```

### 2. Ön Yüzü Test Etme
Tarayıcıyı açın ve şuraya gidin: `http://sunucu-ip` veya `http://leadapp.medipol.edu.tr`

### 3. Giriş Testı
- Sistemin çalıştığını doğrulamak için varsayılan hesabı kullanın
- Yeni bir potansiyel müşteri oluşturmayı deneyin
- Dashboard istatistiklerinin çalıştığını doğrulayın

## 🔒 Güvenlik ve Koruma

### 1. Şifreleri Değiştirme
- Dashboard'dan yönetici şifresini değiştirin
- `.env` dosyasındaki `JWT_SECRET`'ı değiştirin

### 2. HTTPS Etkinleştirme
```bash
# Let's Encrypt yükle
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d leadapp.medipol.edu.tr
```

### 3. Güvenlik Duvarı
```bash
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
```

## 📊 İzleme ve Bakım

### 1. Uygulama İzleme
```bash
# PM2 durumu
pm2 status
pm2 logs medipol-leadapp

# Kaynak kullanımı
pm2 monit
```

### 2. Yedekleme
```bash
# Yedekleme scripti oluştur
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
cp /var/www/medipol-leadapp/server/prisma/dev.db /backup/leadapp_$DATE.db

# Günlük çalıştırma için crontab'a ekle
0 2 * * * /path/to/backup-script.sh
```

## 🆘 Sorun Giderme

### Yaygın Sorunlar:

1. **Veritabanı Bağlantı Hatası**
   - `.env`'deki `DATABASE_URL`'yi doğrulayın
   - `npm run prisma:generate`'in çalıştırıldığından emin olun

2. **API 404 Hatası**
   - Arka yüz sunucunun 4000 portunda çalıştığını doğrulayın
   - Nginx yapılandırmasını kontrol edin

3. **Giriş Sorunları**
   - `npm run seed`'in çalıştırıldığından emin olun
   - `.env`'deki `JWT_SECRET`'ı kontrol edin

## 📞 Teknik Destek

Yardım için:
1. Log dosyalarını kontrol edin: `pm2 logs medipol-leadapp`
2. Servis durumunu doğrulayın: `pm2 status`
3. Nginx loglarını kontrol edin: `sudo tail -f /var/log/nginx/error.log`

---

**Medipol Üniversitesi BT Ekibi için oluşturulmuştur**  
**Tarih: Eylül 2025**
