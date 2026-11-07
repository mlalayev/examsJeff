export type MonitoringMode = 'FULLSCREEN' | 'TABLET';

// iPadOS may present the desktop Safari user agent. Touch support distinguishes
// it from a Mac; touch-enabled Windows laptops still use fullscreen.
export function isTabletDevice(userAgent: string, maxTouchPoints = 0) {
  return /iPad|Tablet|Silk/i.test(userAgent)
    || (/Android/i.test(userAgent) && !/Mobile/i.test(userAgent))
    || (/Macintosh|MacIntel/i.test(userAgent) && maxTouchPoints > 1);
}

export const FOCUS_LOSS_GRACE_MS = 1200;

export function isTerminalSecurityEvent(kind: string, mode: string = 'FULLSCREEN', policyVersion = 1) {
  return mode === 'TABLET'
    ? kind === 'PAGE_HIDDEN' || kind === 'PAGE_LEAVE'
    : kind === 'FULLSCREEN_EXIT' || (policyVersion >= 2 && ['PAGE_HIDDEN', 'PAGE_LEAVE', 'FOCUS_LOST'].includes(kind));
}

export const TABLET_LOCKDOWN_NOTICE = 'Planşetdə tam ekran tələb olunmur. İmtahan başladıqdan sonra başqa taba, səhifəyə və ya tətbiqə keçmək cəhdi etibarsız edəcək. Ekranı kilidləməyin və səhifəni yeniləməyin — bunlar da imtahanı dayandıra bilər. Mikrofonu, səsi və internet bağlantınızı əvvəlcədən yoxlayın.';
