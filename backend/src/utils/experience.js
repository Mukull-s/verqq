/**
 * Experience calculation for resume profiles.
 *
 * The old approach counted each experience entry as a flat 1.5 years, so a single
 * two-month internship was reported as "1.5 yrs exp". This parses real dates /
 * durations and separates internships from full-time roles so a fresher reads as
 * a fresher.
 */

const PRESENT = /^(present|current|now|ongoing)$/i;

const parseYearMonth = (value) => {
  if (!value || typeof value !== 'string') return null;
  const v = value.trim().toLowerCase();
  if (PRESENT.test(v)) return { present: true };
  const ymd = v.match(/^(\d{4})[-/.](\d{1,2})/);
  if (ymd) {
    const month = parseInt(ymd[2], 10);
    if (month >= 1 && month <= 12) return { year: parseInt(ymd[1], 10), month };
  }
  const ym = v.match(/^(\d{4})$/);
  if (ym) return { year: parseInt(ym[1], 10), month: 1 };
  return null;
};

const monthsBetween = (start, end, now = new Date()) => {
  const s = parseYearMonth(start);
  if (!s || !s.year) return null;

  let endY;
  let endM;
  const e = parseYearMonth(end);
  if (!end || (e && e.present)) {
    endY = now.getFullYear();
    endM = now.getMonth() + 1;
  } else if (e && e.year) {
    endY = e.year;
    endM = e.month;
  } else {
    return null;
  }

  const months = (endY - s.year) * 12 + (endM - s.month);
  return months >= 0 ? months : null;
};

const isInternship = (exp) => {
  const haystack = `${exp?.type || ''} ${exp?.role || ''} ${exp?.company || ''} ${exp?.summary || ''}`.toLowerCase();
  return haystack.includes('intern');
};

const isFullTime = (exp) => {
  const t = `${exp?.type || ''}`.toLowerCase();
  return t.includes('full') || (t && !t.includes('intern') && !t.includes('part') && !t.includes('contract'));
};

/**
 * @param {Array} experienceList - entries from the resume profile.
 * @returns {{ fullTimeYears:number, internshipMonths:number, totalMonths:number, entryCount:number }}
 */
const computeExperience = (experienceList = [], now = new Date()) => {
  let fullTimeMonths = 0;
  let internshipMonths = 0;
  let entryCount = 0;

  for (const exp of experienceList) {
    if (!exp || typeof exp !== 'object') continue;
    entryCount += 1;

    let months = Number(exp.durationMonths);
    if (!Number.isFinite(months) || months <= 0) {
      months = monthsBetween(exp.start, exp.end, now);
    }
    if (!Number.isFinite(months) || months <= 0) {
      // No usable dates: use a conservative, type-aware fallback rather than a
      // flat 1.5-year guess (a 2-month internship must not read as 1.5 years).
      months = isInternship(exp) ? 2 : 6;
    }
    months = Math.min(months, 480); // clamp: 40 years max for a single role

    if (isInternship(exp)) internshipMonths += months;
    else if (isFullTime(exp)) fullTimeMonths += months;
    else internshipMonths += months; // unknown type -> treat as experience-adjacent
  }

  const fullTimeYears = Math.round((fullTimeMonths / 12) * 10) / 10;
  return {
    fullTimeYears,
    internshipMonths: Math.round(internshipMonths),
    totalMonths: Math.round(fullTimeMonths + internshipMonths),
    entryCount,
  };
};

/**
 * Human label for the analysis badge.
 */
const experienceLabel = ({ fullTimeYears, internshipMonths }) => {
  if (fullTimeYears >= 1) return `${fullTimeYears} yr${fullTimeYears === 1 ? '' : 's'} exp`;
  if (internshipMonths > 0) {
    const y = Math.round((internshipMonths / 12) * 10) / 10;
    return internshipMonths >= 12
      ? `${y} yr${y === 1 ? '' : 's'} intern`
      : `Fresher · ${internshipMonths} mo internship`;
  }
  return 'Fresher';
};

module.exports = {
  computeExperience,
  experienceLabel,
  monthsBetween,
  parseYearMonth,
};
