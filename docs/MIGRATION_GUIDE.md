# Migration Guide - FILL_IN_BLANK Question Type

## ✅ Problem Həll Edildi!

**Problem:** Migration zamanı data loss xəbərdarlıqları:
- `Role` enum-dan `PARENT` silinirdi
- `student_profiles` cədvəlindən sütunlar silinirdi (məlumat var idi)

**Həll:** 
1. ✅ `PARENT` role-u schema-ya əlavə edildi (legacy support)
2. ✅ `student_profiles` sütunları schema-ya əlavə edildi:
   - `dateOfBirth` (optional)
   - `paymentAmount` (optional)
   - `phoneNumber` (optional)
   - `program` (optional)

---

## 🚀 Migration Apply Etmək:

### Variant 1: Prisma DB Push (Sürətli, development üçün)
```bash
npx prisma db push
```
Bu komanda schema-nı birbaşa database-ə tətbiq edir, migration faylı yaratmır.

### Variant 2: Migration Create (Production üçün)
```bash
# 1. Migration faylını yarat (yalnız fayl, apply etmə)
npx prisma migrate dev --create-only --name add_fill_in_blank_question_type

# 2. Migration faylını yoxla: prisma/migrations/.../migration.sql

# 3. Apply et
npx prisma migrate deploy
```

---

## 📋 Schema Dəyişiklikləri:

### 1. QuestionType Enum:
```prisma
enum QuestionType {
  // ... existing types
  FILL_IN_BLANK  // ✅ YENİ
}
```

### 2. StudentProfile Model:
```prisma
model StudentProfile {
  // ... existing fields
  dateOfBirth   DateTime?  // ✅ Legacy field
  paymentAmount Decimal?  // ✅ Legacy field
  phoneNumber   String?     // ✅ Legacy field
  program       String?     // ✅ Legacy field
}
```

### 3. Role Enum:
```prisma
enum Role {
  // ... existing roles
  PARENT  // ✅ Legacy role
}
```

---

## ⚠️ Qeyd:

Bu legacy field-lər **optional**-dır və data loss olmayacaq. İstəsəniz sonra təmizləyə bilərsiniz, amma indi məlumatlar qorunur.

---

## ✅ Hazırdır!

İndi migration təhlükəsiz şəkildə apply edilə bilər!


