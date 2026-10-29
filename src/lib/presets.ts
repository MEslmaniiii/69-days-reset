// Example "starter systems" — including the original Mohamed spiritual+health
// routine, now just one preset among many. Used as inspiration and as an
// offline fallback if AI generation is unavailable.

import type { GeneratedPlan, ProposedHabit } from '../types'

export interface Preset {
  id: string
  title: string
  emoji: string
  description: string
  plan: GeneratedPlan
}

const h = (p: ProposedHabit): ProposedHabit => p

export const PRESETS: Preset[] = [
  {
    id: 'spiritual-health',
    title: 'Faith & Health — روتين العبادة والصحة',
    emoji: '🕌',
    description:
      'روتين واقعي يجمع العبادة والحركة والفرنساوي وتعلّم AI، ويحمي وقت الأسرة بعد الشغل — بدون يوم مزدحم ولا شعور بالتقصير.',
    plan: {
      summary:
        'صباح مرتبط بالفجر وترتيب الأنشطة (بدون تثبيت وقت أذان)، ثم مذاكرة ولغة، مع حماية وقت الأسرة مساءً. الأنشطة الاختيارية لا تُحتسب فشلًا، وفيه «يوم خفيف» قابل للاختيار: الصلاة + الأذكار + 10 دقائق مشي + 10 دقائق مراجعة فرنساوي، وبقية الأنشطة تؤجَّل دون أن تقطع سلسلتك.',
      mainGoals: [
        'العبادة والالتزام بصلاة الفجر',
        'الحركة والتمارين البسيطة',
        'الفرنساوي وتعلّم AI',
        'حماية وقت الأسرة',
      ],
      dailyHabits: [
        h({
          name: 'صلاة الفجر',
          category: 'spirituality',
          frequency: 'daily',
          recommendedTime: 'morning',
          lightDay: true,
          rationale: 'الاستيقاظ لصلاة الفجر — تُرسّخ اليوم كله. علامة إتمام.',
        }),
        h({
          name: 'أذكار الصباح',
          category: 'spirituality',
          frequency: 'daily',
          recommendedTime: 'morning',
          lightDay: true,
          rationale: 'تُقال أثناء المشي على المشاية؛ نشاطان متزامنان فلا يُحسب وقتهما مرتين.',
        }),
        h({
          name: 'المشي على المشاية',
          category: 'fitness',
          frequency: 'daily',
          measurable: true,
          targetValue: 25,
          unit: 'دقيقة',
          recommendedTime: 'morning',
          lightDay: true,
          lightTargetValue: 10,
          rationale:
            '20–30 دقيقة أثناء أذكار الصباح. عادة مستقلة عن تمارين القوة. (يوم خفيف: 10 دقائق).',
        }),
        h({
          name: 'تمارين القوة (سكوات + بلانك)',
          category: 'fitness',
          frequency: 'custom',
          days: [1, 3, 5],
          recommendedTime: 'morning',
          rationale:
            'بعد استراحة 5–10 دقائق: سكوات وبلانك 10–15 دقيقة، مع إمكانية إضافة ضغط على الحائط. 3 أيام أسبوعيًا والأيام قابلة للتعديل. علامة إتمام.',
        }),
        h({
          name: 'مذاكرة الفرنساوي',
          category: 'language',
          frequency: 'daily',
          measurable: true,
          targetValue: 25,
          unit: 'دقيقة',
          recommendedTime: 'morning',
          lightDay: true,
          lightTargetValue: 10,
          rationale:
            'مراجعة الدرس + الواجب + تدريب النطق (20–30 دقيقة). يومَي السبت والثلاثاء اجعلها مراجعة خفيفة ~10 دقائق للتحضير للحصة. (يوم خفيف: 10 دقائق).',
        }),
        h({
          name: 'حصة الفرنساوي',
          category: 'language',
          frequency: 'custom',
          days: [2, 6],
          recommendedTime: 'morning',
          rationale: 'حصة من 9:00 إلى 10:00 صباحًا (السبت والثلاثاء). علامة إتمام.',
        }),
        h({
          name: 'جلسة تعلّم AI',
          category: 'learning',
          frequency: 'custom',
          days: [0, 1, 3, 4, 5],
          measurable: true,
          targetValue: 60,
          unit: 'دقيقة',
          recommendedTime: 'morning',
          rationale:
            'في الأيام غير أيام الحصة: حتى 60 دقيقة (قابلة للتعديل) إذا سمح جدول الشغل. لا تتعارض مع حصة الفرنساوي. الأيام قابلة للتعديل.',
        }),
        h({
          name: 'تجهيز وجبة الإفطار',
          category: 'nutrition',
          frequency: 'daily',
          recommendedTime: 'morning',
          rationale:
            'جهّز الفطار واستعد للشغل. الصيام المتقطع: التجهيز منفصل عن التناول، ونافذة الأكل تُضبط يدويًا في الإعدادات.',
        }),
        h({
          name: 'وقت الأسرة والصلاة (محمي)',
          category: 'relationships',
          frequency: 'daily',
          optional: true,
          recommendedTime: 'evening',
          rationale:
            'بعد الشغل الأولوية للبيت والأسرة والصلاة، مع إمكانية الخروج. مساحة محمية — ليست عدّاد إنتاجية، وعدم تسجيلها لا يؤثر على نسبتك ولا يقطع سلسلتك.',
        }),
      ],
      weeklyHabits: [
        h({
          name: 'كتابة محتوى',
          category: 'content',
          frequency: 'weekly',
          weeklyTarget: 2,
          optional: true,
          recommendedTime: 'evening',
          rationale:
            'عند عدم الخروج ووجود طاقة: 20–30 دقيقة. اختياري مرتين–ثلاث أسبوعيًا، وليس التزامًا يوميًا.',
        }),
        h({
          name: 'تصوير المحتوى (جلسة مجمّعة)',
          category: 'content',
          frequency: 'weekly',
          weeklyTarget: 1,
          rationale: 'جلسة تصوير واحدة مجمّعة في آخر الأسبوع. اليوم والوقت قابلان للتعديل.',
        }),
      ],
      milestones: [],
    },
  },
  {
    id: 'weight-loss',
    title: 'Lose Weight',
    emoji: '🏃',
    description: 'Steps, strength, protein and sleep — sustainable fat loss.',
    plan: {
      summary: 'Move more, eat enough protein, sleep well. Consistency over intensity.',
      mainGoals: ['Lose weight sustainably', 'Build a movement habit'],
      dailyHabits: [
        h({ name: 'Steps', category: 'fitness', frequency: 'daily', measurable: true, targetValue: 8000, unit: 'steps' }),
        h({ name: 'Protein target', category: 'nutrition', frequency: 'daily', measurable: true, targetValue: 120, unit: 'g' }),
        h({ name: 'Water', category: 'nutrition', frequency: 'daily', measurable: true, targetValue: 2.5, unit: 'L' }),
        h({ name: 'Sleep 7h+', category: 'sleep', frequency: 'daily', recommendedTime: 'evening' }),
      ],
      weeklyHabits: [
        h({ name: 'Strength workout', category: 'fitness', frequency: 'weekly', weeklyTarget: 4 }),
        h({ name: 'Weigh-in', category: 'health', frequency: 'weekly', weeklyTarget: 1, measurable: true, targetValue: 1, unit: 'check' }),
      ],
      milestones: [],
    },
  },
  {
    id: 'learn-language',
    title: 'Learn a Language',
    emoji: '🗣️',
    description: 'Daily vocabulary, listening and weekly speaking practice.',
    plan: {
      summary: 'Small daily reps beat cramming. Speak early and often.',
      mainGoals: ['Reach conversational level'],
      dailyHabits: [
        h({ name: 'Vocabulary', category: 'language', frequency: 'daily', measurable: true, targetValue: 20, unit: 'min' }),
        h({ name: 'Listening', category: 'language', frequency: 'daily', measurable: true, targetValue: 20, unit: 'min' }),
      ],
      weeklyHabits: [
        h({ name: 'Speaking practice', category: 'language', frequency: 'weekly', weeklyTarget: 3 }),
        h({ name: 'Weekly review', category: 'learning', frequency: 'weekly', weeklyTarget: 1 }),
      ],
      milestones: [],
    },
  },
  {
    id: 'build-business',
    title: 'Build a Business',
    emoji: '🚀',
    description: 'Deep work, outreach, content and a weekly KPI review.',
    plan: {
      summary: 'Protect deep work, show up daily, review the numbers weekly.',
      mainGoals: ['Grow revenue', 'Build an audience'],
      dailyHabits: [
        h({ name: 'Deep work', category: 'business', frequency: 'custom', days: [0, 1, 2, 3, 4], measurable: true, targetValue: 60, unit: 'min', recommendedTime: 'morning' }),
        h({ name: 'Outreach', category: 'business', frequency: 'custom', days: [0, 1, 2, 3, 4], measurable: true, targetValue: 5, unit: 'contacts' }),
      ],
      weeklyHabits: [
        h({ name: 'Publish content', category: 'content', frequency: 'weekly', weeklyTarget: 2 }),
        h({ name: 'KPI review', category: 'business', frequency: 'weekly', weeklyTarget: 1 }),
      ],
      milestones: [],
    },
  },
]

export function presetById(id: string): Preset | undefined {
  return PRESETS.find((p) => p.id === id)
}
