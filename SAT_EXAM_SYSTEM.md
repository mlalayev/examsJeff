# Digital SAT Exam System

## Overview
Bu sistem Digital SAT imtahanları üçün xüsusi olaraq hazırlanmışdır. Sistem aşağıdakı xüsusiyyətləri dəstəkləyir:

### Əsas Xüsusiyyətlər

1. **İki Əsas Bölmə**
   - Math (Riyaziyyat)
   - Verbal (Oxu və Yaz)

2. **Hər Bölmədə 2 Modul**
   - Math Module 1: 22 sual (minimum), 35 dəqiqə
   - Math Module 2: 22 sual (minimum), 35 dəqiqə
   - Verbal Module 1: 27 sual (minimum), 32 dəqiqə
   - Verbal Module 2: 27 sual (minimum), 32 dəqiqə

3. **Bölmə Şifrə Qoruması**
   - Hər əsas bölməyə (Math və Verbal) girməzdən əvvəl şifrə tələb olunur
   - Şifrə: `TopscoreJEFF!`
   - Şifrə düzgün daxil edilməzsə, bölməyə giriş qadağandır

4. **Avtomatik Taymer Sistemi**
   - Hər modul başlayanda avtomatik olaraq taymer işə düşür
   - Vaxt bitəndə avtomatik olaraq cavablar yadda saxlanılır və modul kilidlənir
   - Tələbə vaxt bitdikdən sonra cavabları dəyişdirə bilməz

5. **Modul Ardıcıllığı**
   - Modullar ardıcıl olaraq tamamlanmalıdır:
     1. Math Module 1
     2. Math Module 2
     3. Verbal Module 1
     4. Verbal Module 2
   - Modulları atlamaq mümkün deyil
   - Modul tamamlandıqdan sonra geriyə qayıtmaq olmaz

## Fayllar və Strukturlar

### 1. SAT Template (`src/lib/sat-template.ts`)
SAT imtahan strukturunu və qaydalarını müəyyən edir:
- `SAT_PASSWORD`: Bölmə şifrəsi
- `SAT_STRUCTURE`: Bütün modulların strukturu
- `validateSATModule()`: Modul doğruluğunu yoxlayır
- `canAccessSATModule()`: Modulə giriş icazəsini yoxlayır

### 2. Şifrə Modal (`src/components/attempts/SectionPasswordModal.tsx`)
Bölməyə girərkən şifrə tələb edən modal:
- Şifrə düzgün deyilsə xəta göstərir
- Cancel düyməsi ilə ləğv etmək mümkündür

### 3. Taymer Komponenti (`src/components/attempts/SectionTimer.tsx`)
Hər modul üçün taymer:
- Qalan vaxtı göstərir
- Son 10%-də xəbərdarlıq verir (qırmızı rəng)
- Vaxt bitəndə avtomatik olaraq cavabları yadda saxlayır

### 4. SAT Imtahan Yaratma Səhifəsi (`src/app/dashboard/admin/exams/create-sat/page.tsx`)
Admin üçün SAT imtahan yaratma interfeysi:
- Hər modul üçün sual sayını təyin etmək
- Minimum sual saylarını yoxlamaq
- Avtomatik olaraq düzgün struktur yaratmaq

### 5. SAT Attempt Runner (`src/app/attempts/[attemptId]/run-sat/page.tsx`)
Tələbələr üçün SAT imtahan götürmə səhifəsi:
- Şifrə yoxlaması
- Taymer idarəetməsi
- Avtomatik kilidlənmə
- Modul ardıcıllığının idarə edilməsi

## İstifadə Qaydası

### Admin üçün (İmtahan Yaratma)

1. Admin dashboardına daxil olun
2. `/dashboard/admin/exams/create-sat` səhifəsinə gedin
3. İmtahan başlığını daxil edin
4. Hər modul üçün sual sayını təyin edin (minimum: Math-22, Verbal-27)
5. "Create SAT Exam" düyməsinə basın
6. Yaradıldıqdan sonra hər sualı ayrıca redaktə edə bilərsiniz

### Tələbə üçün (İmtahan Götürmə)

1. İmtahana başlamaq üçün "Start" düyməsinə basın
2. **Math Section:**
   - Şifrə soruşulacaq: `TopscoreJEFF!`
   - Module 1 başlayacaq (35 dəqiqə)
   - Vaxt bitəndə avtomatik olaraq Module 2-yə keçid
   - Module 2 başlayacaq (35 dəqiqə)

3. **Verbal Section:**
   - Şifrə soruşulacaq: `TopscoreJEFF!`
   - Module 1 başlayacaq (32 dəqiqə)
   - Vaxt bitəndə avtomatik olaraq Module 2-yə keçid
   - Module 2 başlayacaq (32 dəqiqə)

4. Bütün modullar tamamlandıqdan sonra "Submit Exam" düyməsinə basın

## Texniki Detallar

### API Endpoints

**GET /api/attempts/[attemptId]**
- İmtahan məlumatlarını və seksiya şifrəsini qaytarır
- `sectionStartTimes` obyektini qaytarır (hər modul üçün başlama vaxtı)

**POST /api/attempts/[attemptId]/save**
- Cavabları və `sectionStartTimes` məlumatlarını yadda saxlayır
- Body: `{ sectionType?, answers?, sectionStartTimes? }`

**POST /api/admin/exams**
- SAT imtahan yaradır
- Body-də `sectionPassword: "TopscoreJEFF!"` olmalıdır

### Database Schema
Mövcud Prisma schema istifadə olunur:
- `Exam.sectionPassword`: Bölmə şifrəsi (artıq mövcuddur)
- `ExamSection.durationMin`: Modul müddəti (artıq mövcuddur)
- `Attempt.answers`: Cavablar və `sectionStartTimes` JSON-da saxlanılır

## Önəmli Qeydlər

1. **Şifrə:** `TopscoreJEFF!` - böyük-kiçik hərf fərqi var
2. **Minimum Suallar:** Math-22, Verbal-27
3. **Taymer:** Vaxt bitəndə avtomatik submit edilir
4. **Kilidlənmə:** Vaxt bitdikdən sonra cavablar dəyişdirilə bilməz
5. **Ardıcıllıq:** Modullar ardıcıl olaraq tamamlanmalıdır

## Əlaqəli Fayllar

```
src/
├── lib/
│   └── sat-template.ts                          # SAT struktur və validasiya
├── components/
│   └── attempts/
│       ├── SectionPasswordModal.tsx             # Şifrə modal
│       └── SectionTimer.tsx                     # Taymer komponenti
├── app/
│   ├── dashboard/
│   │   └── admin/
│   │       └── exams/
│   │           └── create-sat/
│   │               └── page.tsx                 # SAT yaratma səhifəsi
│   ├── attempts/
│   │   └── [attemptId]/
│   │       └── run-sat/
│   │           └── page.tsx                     # SAT götürmə səhifəsi
│   └── api/
│       └── attempts/
│           └── [attemptId]/
│               ├── route.ts                     # İmtahan məlumatları API
│               └── save/
│                   └── route.ts                 # Cavabları yadda saxlama API
```

## Test Etmək

1. Admin olaraq `/dashboard/admin/exams/create-sat` səhifəsinə gedin
2. Yeni SAT imtahan yaradın
3. Tələbə hesabı ilə imtahana start verin
4. Şifrə `TopscoreJEFF!` daxil edin
5. Taymer işlədiyini yoxlayın
6. Vaxt bitəndə avtomatik kilidləndiyini təsdiq edin

## Gələcək Təkmilləşdirmələr

- [ ] Adaptive testing (Module 2 çətinliyi Module 1 nəticəsinə görə)
- [ ] Detailed analytics hər modul üçün
- [ ] Section-based scoring (Math və Verbal ayrı-ayrı)
- [ ] Practice mode (şifrəsiz və taylaysız)








