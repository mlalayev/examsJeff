export const LOCKDOWN_POLICY_VERSION = 1;
export const LOCKDOWN_CATEGORIES = ['IELTS', 'TOEFL', 'PLACEMENT', 'GENERAL_ENGLISH', 'KIDS'];
export const requiresLockdown = (category: string) => LOCKDOWN_CATEGORIES.includes(category);
export const LOCKDOWN_NOTICE = 'Bu imtahan tam ekran rejimində keçirilir. İmtahan başladıqdan sonra tam ekran rejimindən çıxsanız, cəhdiniz qayda pozuntusu kimi işarələnəcək və nəticəniz etibarsız sayılacaq. Mikrofonu, səsi və internet bağlantınızı əvvəlcədən yoxlayın. F11 basmağa ehtiyac yoxdur.';

export function newIntegrityPolicy(category: string) {
  return requiresLockdown(category) && process.env.EXAM_LOCKDOWN_ENABLED === 'true'
    ? { create: { policyVersion: LOCKDOWN_POLICY_VERSION } } : undefined;
}
