# Deploy Checklist - Audio Player Yeniləməsi

## Problem
Audio player-də yeni dəyişikliklər görünmür. Köhnə versiyanı göstərir.

## Səbəb
1. Next.js rebuild olunmayıb
2. Browser cache-də köhnə versiya qalıb
3. Production server-də PM2 restart olunmayıb

## Həll (Serverdə icra edin)

### 1. SSH ilə serverə qoşulun
```bash
ssh root@exams.jeff.az
cd /root/examsJeff
```

### 2. Git pull edin
```bash
git pull origin main
```

### 3. Node modules yeniləyin (lazım olarsa)
```bash
npm install
```

### 4. Next.js-i rebuild edin (ƏN VACIB!)
```bash
npm run build
```

Bu əmr:
- `.next` folder-ini yenidən yaradır
- Bütün komponentləri compile edir
- Production üçün optimize edir

### 5. PM2-ni restart edin
```bash
pm2 restart aimentor
```

### 6. PM2 logs yoxlayın
```bash
pm2 logs aimentor --lines 50
```

Axtarın:
- "✓ Ready in Xms" mesajı
- Heç bir error olmamalıdır

### 7. Browser cache-i təmizləyin

**Chrome/Edge:**
1. DevTools açın (F12)
2. Network tab-a keçin
3. "Disable cache" checkbox-u işarələyin
4. Səhifəni reload edin (Ctrl+Shift+R)

**və ya:**
1. Səhifəni açın
2. Ctrl+Shift+Delete basın
3. "Cached images and files" seçin
4. "Clear data" basın

**və ya:**
1. Incognito/Private mode-da açın (Ctrl+Shift+N)
2. Test edin

### 8. Test edin

1. https://exams.jeff.az/attempts/[attemptId]/run açın
2. Listening section-a keçin
3. Yeni audio player-i görməlisiniz:
   - 🔄 Restart düyməsi
   - ⏪ Skip Back düyməsi
   - ▶️⏸️ Play/Pause düyməsi (ortada)
   - ⏩ Skip Forward düyməsi
   - Klikləyə bilən progress bar
   - Vaxt göstəricisi: "1:23 / 5:45"

### 9. Əgər hələ də görünmürsə

**Server-də faylı yoxlayın:**
```bash
cat /root/examsJeff/src/components/audio/IELTSAudioPlayer.tsx | head -20
```

Görməlisiniz:
```typescript
import { Play, Pause, RotateCcw, SkipBack, SkipForward } from "lucide-react";
```

**Build olunub-olunmadığını yoxlayın:**
```bash
ls -la /root/examsJeff/.next/
```

`.next` folder-i yeni yaranmalıdır (son 5 dəqiqədə).

**Əgər köhnə tarixi göstərirsə:**
```bash
rm -rf /root/examsJeff/.next
npm run build
pm2 restart aimentor
```

### 10. Son yoxlama

**Browser Console-da:**
```javascript
// DevTools açın (F12)
// Console tab-a keçin
// Bu kodu yazın:
console.log(document.querySelector('audio')?.parentElement?.innerHTML);
```

Axtarın:
- `RotateCcw` - Restart icon
- `SkipBack` - Geri düyməsi
- `SkipForward` - İrəli düyməsi
- `Pause` - Pause icon

Əgər bunlar varsa, yeni versiya yüklənib.

## Sürətli Test Komandaları

```bash
# Hamısını bir yerdə (copy-paste edin)
cd /root/examsJeff && \
git pull origin main && \
npm run build && \
pm2 restart aimentor && \
pm2 logs aimentor --lines 20
```

## Gözlənilən Nəticə

✅ Git pull: "Already up to date" və ya yeni commit-lər
✅ npm run build: "✓ Compiled successfully"
✅ pm2 restart: "Process aimentor restarted"
✅ pm2 logs: "✓ Ready in Xms"
✅ Browser: Yeni audio player görünür

## Troubleshooting

### Problem: Build error alırsınız
**Həll:**
```bash
rm -rf node_modules
rm package-lock.json
npm install
npm run build
```

### Problem: PM2 restart işləmir
**Həll:**
```bash
pm2 stop aimentor
pm2 delete aimentor
pm2 start npm --name "aimentor" -- start
pm2 save
```

### Problem: Port məşğuldur
**Həll:**
```bash
lsof -ti:3000 | xargs kill -9
pm2 restart aimentor
```

### Problem: Fayl dəyişməyib
**Həll:**
```bash
# Git status yoxlayın
git status

# Əgər local dəyişikliklər varsa
git stash
git pull origin main

# Faylı əl ilə yoxlayın
cat src/components/audio/IELTSAudioPlayer.tsx | grep "SkipBack"
```

## Browser Cache Təmizləmə (Detallı)

### Chrome/Edge:
1. Səhifəni açın: exams.jeff.az
2. F12 basın (DevTools)
3. Network tab
4. Checkbox: "Disable cache"
5. Səhifə refresh: Ctrl+Shift+R
6. və ya Application tab → Clear storage → Clear site data

### Firefox:
1. Ctrl+Shift+Delete
2. "Cache" seçin
3. Time range: "Everything"
4. Clear now

### Safari:
1. Develop menu → Empty Caches
2. və ya Cmd+Option+E

### Hər brauzerdə işləyən:
Incognito/Private mode-da açın (cache istifadə etmir)

## Son Addım

Bütün bunları etdikdən sonra:

1. **Server-də:** `pm2 logs aimentor`
2. **Browser-də:** Hard refresh (Ctrl+Shift+R)
3. **Test:** Audio player-də yeni düymələr görünməlidir

Əgər hələ də problem varsa, mənə bildirin:
- pm2 logs-un output-u
- Browser console error-ları
- Network tab-da IELTSAudioPlayer-lə bağlı request-lər
