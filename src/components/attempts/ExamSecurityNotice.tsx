import { requiresLockdown } from '@/lib/exam-integrity-policy';
export function ExamSecurityNotice({ category }: { category: string }) {
  if (!requiresLockdown(category)) return null;
  return <aside className="my-4 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950"><strong>Yeni imtahanlar üçün nəzarət qaydası</strong><p>Kompüterdə tam ekran tələb olunur. Planşetdə tam ekran tələb olunmur, amma başqa taba, səhifəyə və ya tətbiqə keçmək cəhdi etibarsız edir. Planşetdə ekranı kilidləməyin və səhifəni yeniləməyin.</p><p>Writing cavabları AI dəstəkli müəllim baxışından keçə bilər. Yalnız imtahan daxilində paste ölçüləri və yazının uzunluq dəyişiklikləri qeydə alınır; bunlar köçürmə sübutu deyil.</p></aside>;
}
