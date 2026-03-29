# IELTS Listening Audio Player - Seek/Control Funksiyası

## Əlavə Edilən Xüsusiyyətlər

### 1. ✅ Oynatma İdarəetməsi
- **Play/Pause** - Audio-nu oynat və dayandır
- **Restart** - Əvvəldən başlat
- **Skip Backward (-10s)** - 10 saniyə geri
- **Skip Forward (+10s)** - 10 saniyə irəli

### 2. ✅ Seek Funksiyası (İrəli-Geri Keçmə)
- **Progress Bar-a Klik** - İstədiyiniz yerə dərhal keç
- **Drag & Drop** - Progress bar-ı sürüşdürərək istədiyiniz yerə get
- **Real-time göstərici** - Hansı vaxtda olduğunuz görünür

### 3. ✅ İstifadəçi Dostu İnterfeys
- Böyük Play/Pause düyməsi ortada
- Kiçik idarəetmə düymələri ətrafda
- Progress bar klikləyə və sürüşdürə bilərsiniz
- Vaxt göstəricisi: "1:23 / 5:45" formatında

## Dəyişikliklər

### Əvvəlki Versiya:
- ❌ Yalnız bir dəfə play düyməsi
- ❌ Dayandırmaq olmurdu
- ❌ İrəli-geri keçmək olmurdu
- ❌ Progress bar yalnız göstəricidir (klikləyə bilməzdiniz)

### Yeni Versiya:
- ✅ Play/Pause - istədiyiniz qədər
- ✅ Əvvəldən başlatmaq
- ✅ 10 saniyə irəli/geri düymələri
- ✅ Progress bar-a klikləyərək istədiyiniz yerə keçin
- ✅ Progress bar-ı sürüşdürün (drag)
- ✅ Vaxt göstəricisi (cari vaxt / ümumi müddət)

## İşləmə Qaydası

### Play/Pause Düyməsi
```
🎵 Ortadakı böyük düymə:
- İlk dəfə kliklədikdə → oynatmağa başlayır
- Təkrar kliklədikdə → dayandırır
- Yenidən kliklədikdə → davam etdirir
```

### Skip Düymələri
```
⏪ Sol düymə (Skip Back):
- 10 saniyə geri keçir
- Əvvəldə olarsa 0:00-a qayıdır

⏩ Sağ düymə (Skip Forward):
- 10 saniyə irəli keçir
- Sonda olarsa sonunu keçmir
```

### Restart Düyməsi
```
🔄 Solda (Restart):
- Audio-nu əvvəldən başladır
- 0:00-a qayıdır
```

### Progress Bar (Seek)
```
▬▬▬▬🔵▬▬▬▬▬▬▬▬

1. Klik etmək:
   - Progress bar-ın istədiyiniz yerinə klikləyin
   - Audio dərhal ora keçəcək

2. Sürüşdürmək (Drag):
   - Progress bar-ın üzərində mouse-u basıb saxlayın
   - Sol-sağa sürüşdürün
   - Buraxdığınız yerdə dayanacaq
```

## UI Layout

```
┌─────────────────────────────────────────────────────┐
│  🔄  ⏪  ▶️  ⏩      1:23 / 5:45                    │
│                                                     │
│  ▬▬▬▬▬🔵▬▬▬▬▬▬▬▬▬▬▬                              │
│                                                     │
│  Progress bar-ı klikləyərək və ya sürüşdürərək... │
└─────────────────────────────────────────────────────┘

🔄 = Restart (Əvvəldən başlat)
⏪ = 10s geri
▶️ = Play/Pause (Ortadakı böyük düymə)
⏩ = 10s irəli
🔵 = Progress indicator (sürüşdürə bilərsiniz)
```

## Kod Dəyişiklikləri

### State-lər:
```typescript
// Əvvəl:
const [hasStarted, setHasStarted] = useState(false); // Yalnız bir dəfə play

// İndi:
const [isPlaying, setIsPlaying] = useState(false);   // Play/Pause state
const [isDragging, setIsDragging] = useState(false); // Drag state
```

### Yeni Funksiyalar:
```typescript
handlePlayPause()     // Play və Pause arasında keçid
handleRestart()       // Əvvəldən başlat
handleSkipBackward()  // 10 saniyə geri
handleSkipForward()   // 10 saniyə irəli
handleSeek()          // Progress bar-da seek
handleProgressClick() // Progress bar-a klik
handleMouseDown()     // Drag başlat
```

### Seek Mexanizmi:
```typescript
const handleSeek = (clientX: number) => {
  // Mouse-un X koordinatından progress bar-da hansı faiz olduğunu hesabla
  const rect = progressBar.getBoundingClientRect();
  const pos = (clientX - rect.left) / rect.width;
  
  // Yeni vaxtı hesabla və audio-ya təyin et
  const newTime = pos * duration;
  audio.currentTime = newTime;
};
```

### Drag & Drop:
```typescript
// Mouse-u basıb saxladıqda
handleMouseDown() → isDragging = true

// Sürüşdürəndə
document.mousemove → handleSeek()

// Buraxdıqda
document.mouseup → isDragging = false
```

## İstifadə Təcrübəsi

### IELTS Listening Exam:
1. Tələbə səhifəyə daxil olur
2. Audio player görünür
3. Play düyməsinə basır → audio başlayır
4. Bir yeri qaçırdı? Progress bar-da geri keçir
5. Çox irəli getdi? Geri düyməsi ilə 10s geri
6. Əvvəldən dinləmək istəyir? Restart düyməsi

### Üstünlüklər:
- ✅ İstədiyiniz hissəni təkrar-təkrar dinləyə bilərsiniz
- ✅ Sürətli navigate: 10s skip düymələri
- ✅ Dəqiq navigate: Progress bar drag
- ✅ Asan istifadə: Aydın UI
- ✅ Vizual feedback: Progress görünür

## Browser Dəstəyi

Bütün müasir brauzerlərdə işləyir:
- ✅ Chrome/Edge
- ✅ Firefox
- ✅ Safari
- ✅ Opera

## File Modified

- `src/components/audio/IELTSAudioPlayer.tsx` - Tam yeniləndi

## Deploy Sonrası Test

1. IELTS Listening bölməsinə daxil olun
2. Audio player-i görün
3. Play düyməsinə basın → oynatmalıdır
4. Pause düyməsinə basın → dayanmalıdır
5. Progress bar-a klikləyin → ora keçməlidir
6. Progress bar-ı sürüşdürün → işləməlidir
7. Skip düymələrini test edin → 10s irəli/geri

## Əlavə Qeydlər

- Audio hələ də yalnız bir dəfə yüklənir (performance üçün)
- Progress bar smooth drag dəstəkləyir
- Vaxt göstəricisi real-time yenilənir
- Responsive design - bütün ekran ölçülərində işləyir
- Accessibility: Keyboard navigation da əlavə edilə bilər (lazım olarsa)

## Növbəti Mərhələ

İstəsəniz əlavə funksiyalar:
- [ ] Playback speed control (0.5x, 0.75x, 1x, 1.25x, 1.5x, 2x)
- [ ] Volume control (səs səviyyəsi)
- [ ] Keyboard shortcuts (Space=Play/Pause, Arrow keys=Skip)
- [ ] Loop function (təkrar oynatma)
- [ ] Transcript sync (audio ilə mətn sinxron)
