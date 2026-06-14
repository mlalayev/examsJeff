import { getOpenAI } from "@/lib/openai-client";

// Which template a class uses, derived from its lesson type / class name.
export type ReportTemplateKind = "ENGLISH" | "MATH" | "IT";

// Per-student data gathered for one subject (class) over a single week.
export type WeeklyReportStudent = {
  studentId: string;
  name: string;
  lessonsHeld: number;
  lessonsAttended: number;
  hadAbsence: boolean;
  topics: string[];
  homeworkSummary: string;
  teacherNotes: string[];
  behaviorNotes: string[];
  performances: string[];
};

export type WeeklyReportResult = {
  studentId: string;
  text: string;
};

const TEMPLATES: Record<ReportTemplateKind, string> = {
  ENGLISH: `Hörmətli valideyn,

[Tələbə adı] bu həftə keçirilən [x] dərsin [x]-də iştirak etmişdir. Bu həftə [mövzu/qaydalar] öyrədilmiş, əlavə olaraq yeni sözlər keçilmiş və müxtəlif praktik çalışmalar vasitəsilə möhkəmləndirilmişdir.

Ev tapşırıqları [tam/qismən/natamam] şəkildə yerinə yetirilmişdir. Dərs zamanı fəal iştirak edir, mövzuları diqqətlə qavrayır və öyrəndiklərini tətbiq etməyə çalışır. Vocabulary hissəsində yeni sözlər öyrənilir və istifadə olunur. [Əlavə qeyd: sözləri tez öyrənir / daha çox təkrara ehtiyac duyur və s.]

[Tələbə adı] potensiallı və çalışqan tələbədir. [Əlavə qeyd: evdə daha çox çalışması tövsiyə olunur / bu tempdə davam edərsə daha yüksək nəticələr əldə edə bilər / inkişafı hiss olunur].

Hörmətlə,
JEFF Colleges`,
  MATH: `Hörmətli valideyn,

[Tələbə adı] bu həftə keçirilən [x] dərsin [x]-də iştirak etmişdir. Dərslərdə [mövzu adı] mövzusu öyrədilmiş, müxtəlif tipli suallar və tapşırıqlar həll edilərək mövzu möhkəmləndirilmişdir.

Ev tapşırıqları [tam/qismən/natamam] şəkildə yerinə yetirilmişdir. Dərs zamanı fəal iştirak edir, verilən tapşırıqları həll etməyə çalışır və riyazi məntiqini inkişaf etdirmək istiqamətində irəliləyiş göstərir.

[Tələbə adı] potensiallı tələbədir. Evdə daha çox çalışma və mütəmadi təkrar etməsi nəticələrinin daha da yaxşılaşmasına kömək edəcəkdir.

Hörmətlə,
JEFF Colleges`,
  IT: `Hörmətli valideyn,

[Tələbə adı] bu həftə keçirilən [x] dərsin [x]-də iştirak etmişdir. Dərslərdə [HTML/CSS/JavaScript/React və s.] mövzuları öyrədilmiş, həmçinin praktik layihələr və tapşırıqlar vasitəsilə biliklər tətbiq edilmişdir.

Ev tapşırıqları [tam/qismən/natamam] şəkildə yerinə yetirilmişdir. Dərs zamanı fəal iştirak edir, verilən tapşırıqları maraqla yerinə yetirir və proqramlaşdırma məntiqini inkişaf etdirmək istiqamətində irəliləyiş göstərir.

[Tələbə adı] potensiallı tələbədir. Dərsdən əlavə evdə də praktika etdiyi halda texniki bacarıqları daha sürətlə inkişaf edəcək və daha yüksək nəticələr əldə edəcəkdir.

Hörmətlə,
JEFF Colleges`,
};

const SYSTEM_PROMPT = `Sən JEFF Colleges adından valideynlər üçün həftəlik tələbə hesabatları yazan müəllim köməkçisisən. Hesabatlar Azərbaycan dilində, peşəkar, səmimi və qısa olmalıdır.

Qaydalar:
- Verilən ŞABLONA ciddi əməl et. Şablonun strukturunu, cümlələrini və "Hörmətlə, JEFF Colleges" imzasını saxla.
- [Tələbə adı] yerinə tələbənin adını yaz.
- "[x] dərsin [x]-də iştirak etmişdir" yerinə real rəqəmləri yaz (keçirilən dərs sayı və iştirak etdiyi dərs sayı).
- Mövzu yer-tutucularını (məsələn [mövzu/qaydalar], [mövzu adı], [HTML/CSS...]) verilən mövzularla əvəz et. Əgər mövzu verilməyibsə, fənnə uyğun ümumi, təbii ifadə yaz.
- Ev tapşırığı vəziyyətini (tam/qismən/natamam) verilən məlumata uyğun seç.
- [Əlavə qeyd] hissəsini müəllimin qeydləri və tələbənin nəticələri əsasında doldur. Əgər heç bir qeyd verilməyibsə, şablonun tonuna uyğun məntiqli və müsbət bir qeyd özün yaz. Mötərizələri ([ ]) son mətndə saxlama.
- Əgər tələbə bu həftə hər hansı dərsdə iştirak etməyibsə (buraxılış varsa), "Buraxılmış dərs həftə ərzində əvəz ediləcəkdir." cümləsini birinci abzasa əlavə et.
- Cavabı YALNIZ etibarlı JSON kimi qaytar: {"reports":[{"studentId":"...","text":"..."}]}. text sahəsində abzaslar üçün \\n istifadə et.`;

export async function generateWeeklyReports(
  templateKind: ReportTemplateKind,
  subjectLabel: string,
  students: WeeklyReportStudent[]
): Promise<WeeklyReportResult[]> {
  if (students.length === 0) return [];

  const userPayload = {
    fənn: subjectLabel,
    şablon: TEMPLATES[templateKind],
    tələbələr: students.map((s) => ({
      studentId: s.studentId,
      ad: s.name,
      keçirilən_dərs: s.lessonsHeld,
      iştirak: s.lessonsAttended,
      buraxılış_var: s.hadAbsence,
      mövzular: s.topics,
      ev_tapşırığı: s.homeworkSummary,
      müəllim_qeydləri: s.teacherNotes,
      davranış_qeydləri: s.behaviorNotes,
      performans: s.performances,
    })),
  };

  const completion = await getOpenAI().chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.5,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `Hər tələbə üçün bir hesabat yaz. Məlumat:\n${JSON.stringify(
          userPayload,
          null,
          2
        )}`,
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  let parsed: { reports?: WeeklyReportResult[] };
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = {};
  }

  const byId = new Map<string, string>();
  for (const r of parsed.reports ?? []) {
    if (r?.studentId && typeof r.text === "string") byId.set(r.studentId, r.text);
  }

  // Preserve input order; drop any the model failed to return.
  return students
    .filter((s) => byId.has(s.studentId))
    .map((s) => ({ studentId: s.studentId, text: byId.get(s.studentId)! }));
}
