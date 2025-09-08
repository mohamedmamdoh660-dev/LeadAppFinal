# Medipol Lead CRM Teslim Kılavuzu

## 📋 Bu Uygulama Nedir?
Medipol Üniversitesi için kayıt olmakla ilgilenen uluslararası öğrencileri yönetmek amacıyla geliştirilmiş bir Potansiyel Müşteri Yönetim uygulamasıdır.

## 📦 Teslim İçin Gerekli Dosyalar

### 1. Tam Proje Klasörü
```
leadapp/
├── front 2/              (Ön Yüz)
│   ├── index.html
│   ├── styles.css
│   ├── main.js
│   ├── pages/
│   └── components/
└── server/               (Arka Yüz)
    ├── src/
    ├── prisma/
    ├── package.json
    └── .env.example
```

### 2. Önemli Ek Dosyalar
- ✅ `deployment-guide-tr.md` - Teknik kurulum kılavuzu
- ✅ `.env.example` - Yapılandırma şablon dosyası
- ✅ `handover-instructions-tr.md` - Bu dosya

## 🚀 Basit Teslim Adımları

### Adım 1: Dosyaları Paketleme
1. `leadapp` klasörüne sağ tıklayın
2. "Sıkıştır" veya "Arşivle" seçeneğini seçin
3. Bu `leadapp.zip` dosyasını oluşturacaktır

### Adım 2: BT Departmanına Teslim
Aşağıdakileri gönderin:
- 📁 `leadapp.zip` dosyası (tam proje)
- 📄 Bu dosya `handover-instructions-tr.md`
- 📧 Aşağıdaki bilgileri içeren e-posta:

```
Konu: Medipol Lead CRM Uygulaması Kurulum Talebi

Sayın BT Ekibi,

Medipol Üniversitesi için Potansiyel Müşteri Yönetim CRM uygulamasını ekte bulabilirsiniz.

Uygulama Bilgileri:
- Adı: Medipol Lead CRM
- Amacı: Kayıt olmakla ilgilenen uluslararası öğrencilerin yönetimi
- Teknolojiler: HTML, CSS, JavaScript, Node.js, SQLite

Ekteki Dosyalar:
- leadapp.zip (tam proje)
- Kurulum ve yükleme talimatları

Detaylı teknik talimatlar için deployment-guide-tr.md dosyasına bakınız.

Teşekkürler
```

## 🔧 Teknik Bilgi Özeti

### BT Departmanının İhtiyaç Duyduğu:
1. **Web Sunucusu** (Apache veya Nginx)
2. **Node.js** (Sürüm 16 veya daha yeni)
3. **Veritabanı** (Test için SQLite, üretim için PostgreSQL)
4. **Domain veya URL** uygulama erişimi için

### Varsayılan Hesaplar:
- **Yönetici**: admin@leadapp.com
- **Şifre**: admin123

## ⚠️ Teknik Ekip İçin Önemli Noktalar

### 1. Güvenlik
- Yönetici şifresi değiştirilmeli
- `.env` dosyasındaki `JWT_SECRET` değiştirilmeli
- Üretim için HTTPS etkinleştirilmeli

### 2. Veritabanı
- Uygulama şu anda SQLite kullanıyor (test için uygun)
- Üretim için PostgreSQL veya MySQL önerilir

### 3. Yedekleme
- Günlük veritabanı yedeklemesi gerekli
- Uygulama dosyalarının yedeklenmesi gerekli

## 📞 Destek ve Sorular
Herhangi bir teknik sorunuz için benimle iletişime geçebilir veya şunlara bakabilirsiniz:
- Detaylı talimatlar için `deployment-guide-tr.md`
- Ek bilgiler için `README.md`

## ✅ Son Kontrol Listesi
Teslimden önce aşağıdakilerin olduğundan emin olun:
- [ ] Sıkıştırılmış proje dosyası (leadapp.zip)
- [ ] Bu talimat dosyası
- [ ] Açıklamalı teslim e-postası
- [ ] Destek için iletişim bilgileri

---
**Windsurf AI kullanılarak oluşturulmuştur**
**Teslim Tarihi: Eylül 2025**
