# دليل تشغيل تطبيق Medipol Lead CRM على خادم الجامعة

## 📋 نظرة عامة
تطبيق إدارة العملاء المحتملين (Lead Management System) لجامعة ميديبول لإدارة الطلاب الدوليين المهتمين بالالتحاق.

## 🛠️ المتطلبات التقنية

### خادم الويب
- **Node.js**: الإصدار 16 أو أحدث
- **نظام التشغيل**: Linux (Ubuntu/CentOS) أو Windows Server
- **الذاكرة**: 2GB RAM كحد أدنى
- **التخزين**: 10GB مساحة فارغة

### قاعدة البيانات
- **للتجربة**: SQLite (مُضمنة في التطبيق)
- **للإنتاج**: PostgreSQL أو MySQL

## 📦 خطوات التشغيل

### 1. تحضير الخادم
```bash
# تحديث النظام
sudo apt update && sudo apt upgrade -y

# تثبيت Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# التحقق من التثبيت
node --version
npm --version
```

### 2. نسخ ملفات التطبيق
```bash
# إنشاء مجلد التطبيق
sudo mkdir -p /var/www/medipol-leadapp
sudo chown $USER:$USER /var/www/medipol-leadapp

# نسخ الملفات (بعد فك الضغط)
cp -r leadapp/* /var/www/medipol-leadapp/
```

### 3. تشغيل الخادم الخلفي (Backend)
```bash
cd /var/www/medipol-leadapp/server

# تثبيت المكتبات المطلوبة
npm install

# نسخ ملف الإعدادات
cp .env.example .env

# تعديل الإعدادات (مهم جداً!)
nano .env
```

### 4. إعداد قاعدة البيانات
```bash
# إنشاء قاعدة البيانات
npm run prisma:generate
npm run db:push

# إضافة البيانات الأولية (المدير والأدوار)
npm run seed
```

### 5. تشغيل التطبيق
```bash
# تشغيل مؤقت للتجربة
npm start

# للتشغيل الدائم (باستخدام PM2)
npm install -g pm2
pm2 start src/index.js --name medipol-leadapp
pm2 save
pm2 startup
```

### 6. إعداد خادم الويب (Nginx)
```nginx
# ملف الإعداد: /etc/nginx/sites-available/medipol-leadapp
server {
    listen 80;
    server_name leadapp.medipol.edu.tr;  # غيّر هذا للدومين الفعلي
    
    # الواجهة الأمامية
    location / {
        root /var/www/medipol-leadapp/front\ 2;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
    
    # API الخادم الخلفي
    location /api/ {
        proxy_pass http://localhost:4000/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

```bash
# تفعيل الموقع
sudo ln -s /etc/nginx/sites-available/medipol-leadapp /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## ⚙️ ملف الإعدادات (.env)

يجب تعديل الملف `/var/www/medipol-leadapp/server/.env`:

```bash
# منفذ الخادم
PORT=4000

# قاعدة البيانات
DATABASE_URL="file:./dev.db"

# للإنتاج مع PostgreSQL:
# DATABASE_URL="postgresql://username:password@localhost:5432/medipol_leadapp"

# مفتاح الأمان (يجب تغييره!)
JWT_SECRET="medipol_strong_secret_key_2025"

# إعدادات CORS
CORS_ORIGIN="http://leadapp.medipol.edu.tr"
```

## 🔐 الحسابات الافتراضية

### حساب المدير
- **البريد الإلكتروني**: admin@leadapp.com
- **كلمة المرور**: admin123

**⚠️ مهم جداً**: يجب تغيير كلمة المرور فور التشغيل!

## 🧪 اختبار التطبيق

### 1. اختبار الخادم الخلفي
```bash
curl http://localhost:4000/health
# يجب أن يعيد: {"status": "ok"}
```

### 2. اختبار الواجهة الأمامية
افتح المتصفح واذهب إلى: `http://server-ip` أو `http://leadapp.medipol.edu.tr`

### 3. اختبار تسجيل الدخول
- استخدم الحساب الافتراضي للتأكد من عمل النظام
- جرب إنشاء lead جديد
- تأكد من عمل الإحصائيات في لوحة التحكم

## 🔒 الأمان والحماية

### 1. تغيير كلمات المرور
- غيّر كلمة مرور المدير من لوحة التحكم
- غيّر `JWT_SECRET` في ملف `.env`

### 2. تفعيل HTTPS
```bash
# تثبيت Let's Encrypt
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d leadapp.medipol.edu.tr
```

### 3. جدار الحماية
```bash
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
```

## 📊 المراقبة والصيانة

### 1. مراقبة التطبيق
```bash
# حالة PM2
pm2 status
pm2 logs medipol-leadapp

# استخدام الموارد
pm2 monit
```

### 2. النسخ الاحتياطي
```bash
# إنشاء سكريبت النسخ الاحتياطي
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
cp /var/www/medipol-leadapp/server/prisma/dev.db /backup/leadapp_$DATE.db

# إضافة إلى crontab للتشغيل اليومي
0 2 * * * /path/to/backup-script.sh
```

## 🆘 استكشاف الأخطاء

### مشاكل شائعة:

1. **خطأ في الاتصال بقاعدة البيانات**
   - تأكد من صحة `DATABASE_URL` في `.env`
   - تأكد من تشغيل `npm run prisma:generate`

2. **خطأ 404 في API**
   - تأكد من تشغيل الخادم الخلفي على المنفذ 4000
   - تحقق من إعدادات Nginx

3. **مشكلة في تسجيل الدخول**
   - تأكد من تشغيل `npm run seed`
   - تحقق من `JWT_SECRET` في `.env`

## 📞 الدعم التقني

للحصول على المساعدة:
1. راجع ملفات السجل: `pm2 logs medipol-leadapp`
2. تحقق من حالة الخدمات: `pm2 status`
3. راجع سجلات Nginx: `sudo tail -f /var/log/nginx/error.log`

---

**تم إنشاء هذا الدليل لفريق تكنولوجيا المعلومات بجامعة ميديبول**  
**التاريخ: سبتمبر 2025**
