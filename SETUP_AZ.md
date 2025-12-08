# Creator Hesabı Quraşdırma (Azərbaycan dilində)

## Problem
Deploy etdikdən sonra creator hesabı avtomatik yaranmır, çünki bəzi hosting platformalar (Vercel, Netlify və s.) Next.js instrumentation hook-ları dəstəkləmir.

## Həll Yolu (3 Addım)

### 1-ci Addım: Database-i yoxla

Əvvəlcə saytın database-ə qoşulub-qoşulmadığını yoxla. Browserə bu linki yapışdır:

```
https://SAYTINIZIN_DOMENI.com/api/setup/check
```

**Nümunə:** `https://aimentor.vercel.app/api/setup/check`

Bu səhifə göstərəcək:
- Database qoşulubmu?
- Neçə branch var?
- Neçə user var?
- Creator hesabı varmı?

### 2-ci Addım: Branch yarat (lazım olsa)

Əgər "branches: 0" görsənirsə, bu linki aç:

```
https://SAYTINIZIN_DOMENI.com/api/setup/init-branch?secret=aimentor-setup-secret-2024
```

Bu, avtomatik bir branch yaradacaq.

### 3-cü Addım: Creator hesabını yarat

İndi creator hesabını yarat. Bu linki browserə yapışdır:

```
https://SAYTINIZIN_DOMENI.com/api/setup/creator?secret=aimentor-setup-secret-2024
```

**Uğurlu olsa görəcəksən:**
```json
{
  "success": true,
  "message": "Creator account created successfully",
  "account": {
    "email": "creator@creator.com",
    "password": "murad123",
    "role": "CREATOR"
  }
}
```

### 4-cü Addım: Login ol

İndi sayta gir:
- **Email:** `creator@creator.com`
- **Password:** `murad123`

## Alternativ Yol: curl istifadə et

Terminal/CMD-də:

```bash
# 1. Database yoxla
curl https://SAYTINIZIN_DOMENI.com/api/setup/check

# 2. Branch yarat (lazımsa)
curl -X POST "https://SAYTINIZIN_DOMENI.com/api/setup/init-branch?secret=aimentor-setup-secret-2024"

# 3. Creator yarat
curl -X POST "https://SAYTINIZIN_DOMENI.com/api/setup/creator?secret=aimentor-setup-secret-2024"
```

## Tez-tez verilən suallar

### ❓ "Invalid setup secret" xətası alıram
Secret yanlışdır. Default: `aimentor-setup-secret-2024`

Environment variable olaraq dəyişdirilib olarsa, `.env` faylına bax:
```env
SETUP_SECRET=sizin-custom-secret
```

### ❓ "User with this email already exists" xətası
Bu o deməkdir ki, `creator@creator.com` email-i artıq database-də var, amma CREATOR rolu yoxdur.

Həll:
1. Login olmağa çalış `creator@creator.com` / `murad123` ilə
2. Olmursa, `/api/setup/creator?secret=...` yenidən çağır, o avtomatik update edəcək

### ❓ Registration işləmir - yeni hesab yaratmaq olmur
Səbəblər:
1. **Branch yoxdur** - `/api/setup/init-branch?secret=...` çağır
2. **Database problemi** - `/api/setup/check` ilə yoxla
3. **Frontend xətası** - Browser console-da error var?

Registration üçün branch mütləq lazımdır!

### ❓ Creator hesabı yarandı, amma login ola bilmirəm
Yoxla:
1. Email düzdür? → `creator@creator.com` (kiçik hərflərlə)
2. Password düzdür? → `murad123` (heç bir boşluq olmadan)
3. `/api/setup/check` ilə yoxla creator-un `approved: true` olduğunu

### ❓ Bu endpoint-ları sildikdən sonra problem olarmı?
Xeyr. Creator hesabı yaradıldıqdan sonra bu endpoint-ları silə bilərsən:
```bash
rm -rf src/app/api/setup
```

Ya da saxla, problemi olsa yenidən istifadə edərsən.

## Test et (Local)

Local test etmək istəyirsənsə:

```bash
# 1. Development server-i başlat
npm run dev

# 2. Browser-də aç
http://localhost:3000/api/setup/check
http://localhost:3000/api/setup/creator?secret=aimentor-setup-secret-2024
```

## Təhlükəsizlik

Setup endpoint-ları yalnız bir dəfə işlədir və secret key tələb edir. Amma production-da:

1. **.env faylına custom secret əlavə et:**
```env
SETUP_SECRET=cox-gucluk-parol-12345
```

2. **Və ya sonra setup folder-ini sil:**
```bash
rm -rf src/app/api/setup
```

3. **Və ya Vercel-də environment variable əlavə et:**
   - Vercel Dashboard → Project → Settings → Environment Variables
   - `SETUP_SECRET` = `sizin-cox-gucluk-parol`

## Daha da çətindirsə...

Əgər heç biri işləməsə, Prisma Studio istifadə et:

```bash
# Local database üçün
npx prisma studio

# Production database üçün (DATABASE_URL ilə)
DATABASE_URL="your-production-url" npx prisma studio
```

Sonra User table-ində manual olaraq creator yarat:
- email: `creator@creator.com`
- role: `CREATOR`
- approved: `true`
- passwordHash: bcrypt hash of "murad123"

Ya da mənə yaz, kömək edərəm! 😊

