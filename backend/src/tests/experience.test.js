const test = require('node:test');
const assert = require('node:assert');

const { computeExperience, experienceLabel, monthsBetween } = require('../utils/experience');

const NOW = new Date('2026-10-14T00:00:00Z');

test('VRQ-EXP: a single 2-month internship is NOT reported as 1.5 years', () => {
  const list = [
    { role: 'Software Engineer Intern', company: 'Acme', type: 'internship', start: '2026-06', end: '2026-08' },
  ];
  const exp = computeExperience(list, NOW);
  assert.strictEqual(exp.internshipMonths, 2);
  assert.strictEqual(exp.fullTimeYears, 0);
  assert.strictEqual(exp.totalMonths, 2);
  const label = experienceLabel(exp);
  assert.match(label, /Fresher/i);
  assert.match(label, /2 mo internship/i);
  assert.doesNotMatch(label, /1\.5/);
});

test('VRQ-EXP: "Present" end date is computed against now', () => {
  const list = [
    { role: 'Backend Engineer', company: 'X', type: 'full-time', start: '2024-10', end: 'Present' },
  ];
  const exp = computeExperience(list, NOW);
  assert.strictEqual(exp.fullTimeYears, 2); // 2024-10 → 2026-10
  assert.strictEqual(experienceLabel(exp), '2 yrs exp');
});

test('VRQ-EXP: internships are excluded from full-time years', () => {
  const list = [
    { role: 'SDE Intern', company: 'A', type: 'internship', start: '2025-06', end: '2025-08' },
    { role: 'Software Engineer', company: 'B', type: 'full-time', start: '2024-01', end: '2025-01' },
  ];
  const exp = computeExperience(list, NOW);
  assert.strictEqual(exp.internshipMonths, 2);
  assert.strictEqual(exp.fullTimeYears, 1);
});

test('VRQ-EXP: durationMonths is honored when provided', () => {
  const exp = computeExperience([{ role: 'Intern', type: 'internship', durationMonths: 3 }], NOW);
  assert.strictEqual(exp.internshipMonths, 3);
  assert.strictEqual(experienceLabel(exp), 'Fresher · 3 mo internship');
});

test('VRQ-EXP: no experience -> Fresher', () => {
  const exp = computeExperience([], NOW);
  assert.strictEqual(exp.fullTimeYears, 0);
  assert.strictEqual(experienceLabel(exp), 'Fresher');
});

test('VRQ-EXP: monthsBetween handles year-only and malformed dates', () => {
  assert.strictEqual(monthsBetween('2024-01', '2025-01', NOW), 12);
  assert.strictEqual(monthsBetween('2024', '2025', NOW), 12);
  assert.strictEqual(monthsBetween('not-a-date', '2025-01', NOW), null);
  assert.strictEqual(monthsBetween('2025-01', null, NOW), 21); // to NOW (2025-01 → 2026-10)
});
