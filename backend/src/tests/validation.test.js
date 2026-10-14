const test = require('node:test');
const assert = require('node:assert');

const {
  isValidObjectId,
  isOwner,
  isPdfBuffer,
  normalizeResumeProfile,
  isClosedStatus
} = require('../utils/validation');

test('VRQ-017: isValidObjectId accepts 24-hex ids and rejects malformed input', () => {
  assert.strictEqual(isValidObjectId('507f1f77bcf86cd799439011'), true);
  assert.strictEqual(isValidObjectId('ABCdef0123456789ABCDEF01'), true);
  assert.strictEqual(isValidObjectId('abc'), false);
  assert.strictEqual(isValidObjectId(''), false);
  assert.strictEqual(isValidObjectId(undefined), false);
  assert.strictEqual(isValidObjectId('507f1f77bcf86cd79943901'), false); // 23 chars
});

test('VRQ-001/002: isOwner only allows the owning user (IDOR guard)', () => {
  const owner = '507f1f77bcf86cd799439011';
  const other = '507f1f77bcf86cd799439012';

  // populated ref
  assert.strictEqual(isOwner({ user: { _id: owner } }, owner), true);
  // raw ObjectId-like ref
  assert.strictEqual(isOwner({ user: owner }, owner), true);

  // Victim-owned interview accessed by another user -> denied
  assert.strictEqual(isOwner({ user: owner }, other), false);
  // Missing data -> denied (fail closed)
  assert.strictEqual(isOwner(null, owner), false);
  assert.strictEqual(isOwner({}, owner), false);
  assert.strictEqual(isOwner({ user: owner }, null), false);
});

test('VRQ-015: isPdfBuffer requires the %PDF- magic bytes', () => {
  const ok = Buffer.from('%PDF-1.7\n%...', 'utf8');
  const bad = Buffer.from('GIF89a', 'utf8');
  const short = Buffer.from('%PD', 'utf8');

  assert.strictEqual(isPdfBuffer(ok), true);
  assert.strictEqual(isPdfBuffer(bad), false);
  assert.strictEqual(isPdfBuffer(short), false);
  assert.strictEqual(isPdfBuffer(null), false);
});

test('VRQ-016: normalizeResumeProfile rejects non-objects and sanitizes arrays', () => {
  assert.strictEqual(normalizeResumeProfile(null), null);
  assert.strictEqual(normalizeResumeProfile('nope'), null);
  assert.strictEqual(normalizeResumeProfile(42), null);

  const messy = {
    skills: ['React', 123, null, 'Node'],
    projects: [{ name: 'X', technologies: ['A', 5], summary: 's' }, 'garbage', null],
    experience: [{ role: 'Dev', company: 'Acme', summary: 'did things' }, 7]
  };
  const clean = normalizeResumeProfile(messy);
  assert.deepStrictEqual(clean.skills, ['React', 'Node']);
  assert.strictEqual(clean.projects.length, 1);
  assert.deepStrictEqual(clean.projects[0].technologies, ['A']);
  assert.strictEqual(clean.experience.length, 1);

  // Unknown/garbage fields default to safe empty structures
  const empty = normalizeResumeProfile({});
  assert.deepStrictEqual(empty, { skills: [], projects: [], experience: [] });
});

test('VRQ-036: isClosedStatus blocks completed and cancelled interviews', () => {
  assert.strictEqual(isClosedStatus('completed'), true);
  assert.strictEqual(isClosedStatus('cancelled'), true);
  assert.strictEqual(isClosedStatus('in_progress'), false);
  assert.strictEqual(isClosedStatus('pending'), false);
});
