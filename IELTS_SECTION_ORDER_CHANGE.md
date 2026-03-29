# IELTS Section Order Dəyişikliyi

## Dəyişiklik

IELTS imtahanlarında section-ların sırasını dəyişdirdik.

### Əvvəlki Sıra:
1. **Listening** (0)
2. **Reading** (1)
3. **Writing** (2)
4. **Speaking** (3)

### Yeni Sıra:
1. **Reading** (0) ✨
2. **Listening** (1) ✨
3. **Writing** (2)
4. **Speaking** (3)

## Dəyişdirilən Fayllar

- `src/components/admin/exams/create/constants.ts`
  - `IELTS_SECTION_ORDER` obyektində Reading və Listening-in yerini dəyişdirdik

## Təsir

Bu dəyişiklik aşağıdakı yerlərə təsir edir:

1. **Exam Create Page** - Yeni IELTS imtahanı yaradarkən section-lar bu sıra ilə görsənəcək
2. **Exam Edit Page** - Mövcud imtahanları redaktə edərkən section-lar bu sıra ilə sıralanacaq
3. **Exam Run Page** - Tələbələr imtahan verərkən section-lar bu sıra ilə görsənəcək
4. **Exam Results** - Nəticələr bu sıra ilə göstəriləcək

## Funksiyalar

`sortIELTSSections()` funksiyası avtomatik olaraq section-ları bu yeni sıra ilə sıralayır.

```typescript
export const sortIELTSSections = (sections: any[]): any[] => {
  return [...sections].sort((a, b) => {
    const aOrder = IELTS_SECTION_ORDER[a.type] ?? 99;
    const bOrder = IELTS_SECTION_ORDER[b.type] ?? 99;
    if (aOrder !== bOrder) return aOrder - bOrder;
    return a.order - b.order;
  });
};
```

## Test

Dəyişikliyi test etmək üçün:

1. Admin panelə daxil olun
2. Yeni IELTS imtahanı yaradın
3. Section-ları əlavə edin
4. Sıralamağın düzgün olduğunu yoxlayın:
   - Reading birinci
   - Listening ikinci
   - Writing üçüncü
   - Speaking dördüncü

## Deployment

Heç bir xüsusi deployment addımı tələb olunmur. Sadəcə kod deploy olunduqdan sonra avtomatik işləyəcək.

## Not

**Mövcud İmtahanlar:** Artıq yaradılmış IELTS imtahanlarının section order-i dəyişməyəcək. Yalnız:
- Yeni yaradılan imtahanlar
- Edit olunan imtahanlar (yenidən save edəndə)
- Göstərilərkən (sortIELTSSections ilə)

bu yeni sıra ilə görsənəcək.
