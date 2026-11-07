export const LOCKDOWN_POLICY_VERSION = 2;
export const LOCKDOWN_CATEGORIES = ['IELTS', 'TOEFL', 'PLACEMENT', 'GENERAL_ENGLISH', 'KIDS'];
export const requiresLockdown = (category: string) => LOCKDOWN_CATEGORIES.includes(category);
export const LOCKDOWN_NOTICE = 'Bu imtahan tam ekran rejimində keçirilir. İmtahan başladıqdan sonra tam ekran rejimindən çıxsanız, cəhdiniz qayda pozuntusu kimi işarələnəcək və nəticəniz etibarsız sayılacaq. Mikrofonu, səsi və internet bağlantınızı əvvəlcədən yoxlayın. F11 basmağa ehtiyac yoxdur.';
export const LOCKDOWN_NOTICE_V2 = 'Bu imtahan tam ekran rejimində keçirilir. İmtahan zamanı tam ekrandan çıxmaq, başqa taba, tətbiqə və ya virtual desktopa keçmək, səhifəni yeniləmək və ya bağlamaq cəhdinizi etibarsız edə bilər. İmtahan pəncərəsi aktiv qalmalıdır. Ekranı kilidləməyin. Mikrofon və səs icazələrini başlamazdan əvvəl yoxlayın. Yazı köməkçilərini və qrammatika extension-larını söndürün. F11 basmağa ehtiyac yoxdur. Brauzer nəzarəti bütün sistem keçidlərini bloklamır; aşkarlanan çıxışlar serverdə qeydə alınır.';

export function newIntegrityPolicy(category: string) {
  return requiresLockdown(category) && process.env.EXAM_LOCKDOWN_ENABLED === 'true'
    ? { create: { policyVersion: LOCKDOWN_POLICY_VERSION } } : undefined;
}
