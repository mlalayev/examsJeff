# Drift Problem Həll Edildi! ✅

## Problem:
**"Drift detected"** xətası gəlirdi çünki:
1. ❌ `teacher_profiles` table migration-da var, amma schema-da yox idi
2. ❌ `student_profiles`-də `paymentDate` migration-da var, amma schema-da yox idi
3. ❌ `PARENT` role-u database-də var, amma schema-da yox idi

## Həll:
✅ **Schema yeniləndi:**
1. `TeacherProfile` modeli əlavə edildi
2. `StudentProfile`-ə `paymentDate` field-i əlavə edildi
3. `PARENT` role-u əlavə edildi (əvvəldən var idi)

---

## 🚀 İndi Migration Apply Etmək:

### Variant 1: Baseline Migration (Ən Təhlükəsiz)
Bu, mövcud database state-ini capture edir və drift-i həll edir:

```bash
# 1. Baseline migration yarat (mövcud state-i capture et)
npx prisma migrate resolve --applied 20251217132333_add_parent_role_and_teacher_profile

# 2. Yeni migration yarat (FILL_IN_BLANK üçün)
npx prisma migrate dev --name add_fill_in_blank_question_type
```

### Variant 2: DB Push (Development üçün)
```bash
npx prisma db push
```

### Variant 3: Manual Baseline (Production üçün)
```bash
# 1. Mövcud migration-ları mark et ki, apply olunub
npx prisma migrate resolve --applied <migration_name>

# 2. Yeni migration yarat
npx prisma migrate dev --name add_fill_in_blank_question_type
```

---

## 📋 Schema Dəyişiklikləri:

### 1. TeacherProfile Model (YENİ):
```prisma
model TeacherProfile {
  id          String   @id @default(cuid())
  teacherId   String   @unique
  teacher     User     @relation("TeacherProfileUser", ...)
  phoneNumber String
  dateOfBirth DateTime?
  program     String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  @@map("teacher_profiles")
}
```

### 2. StudentProfile - paymentDate əlavə edildi:
```prisma
model StudentProfile {
  // ... existing fields
  paymentDate   DateTime? // ✅ YENİ
  // ... other fields
}
```

### 3. Role Enum - PARENT əlavə edildi:
```prisma
enum Role {
  // ... existing roles
  PARENT // ✅ Legacy role
}
```

### 4. QuestionType Enum - FILL_IN_BLANK əlavə edildi:
```prisma
enum QuestionType {
  // ... existing types
  FILL_IN_BLANK // ✅ YENİ
}
```

---

## ⚠️ Qeyd:

Əgər `teacher_profiles` table database-də yoxdursa və istifadə olunmursa, onu silmək olar. Amma data loss olmasın deyə, schema-da saxladıq.

---

## ✅ Hazırdır!

İndi migration təhlükəsiz şəkildə apply edilə bilər!





