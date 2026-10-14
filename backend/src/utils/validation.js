/**
 * Small, dependency-free validation + authorization helpers.
 *
 * These were previously inlined in route handlers, which made them untestable
 * without booting Express + MongoDB. Extracting them lets us prove behaviour
 * (VRQ-001/002/015/016/017) with the built-in Node test runner.
 */

// True only for a 24-hex-character Mongo ObjectId string (VRQ-017).
const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(typeof id === 'string' ? id : '');

// Compare an interview's owner reference against the authenticated user id.
// Used to block IDOR on read/answer/follow-up (VRQ-001/002).
const isOwner = (interview, userId) => {
  if (!interview || interview.user == null || userId == null) return false;
  const ownerId = interview.user._id ? interview.user._id : interview.user;
  return String(ownerId) === String(userId);
};

// PDF magic-byte check: do not trust the client mimetype alone (VRQ-015).
const isPdfBuffer = (buf) => {
  if (!buf || buf.length < 5) return false;
  // "%PDF-"
  return buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46 && buf[4] === 0x2d;
};

// Validate + normalize the structured resume profile sent from the client (VRQ-016).
const normalizeResumeProfile = (profile) => {
  if (!profile || typeof profile !== 'object') return null;
  const asArray = (v) => (Array.isArray(v) ? v : []);
  const skills = asArray(profile.skills).filter(s => typeof s === 'string').slice(0, 100);
  const projects = asArray(profile.projects)
    .filter(p => p && typeof p === 'object')
    .slice(0, 50)
    .map(p => ({
      name: typeof p.name === 'string' ? p.name : '',
      technologies: asArray(p.technologies).filter(t => typeof t === 'string'),
      summary: typeof p.summary === 'string' ? p.summary : ''
    }));
  const experience = asArray(profile.experience)
    .filter(e => e && typeof e === 'object')
    .slice(0, 50)
    .map(e => {
      const entry = {
        role: typeof e.role === 'string' ? e.role : '',
        company: typeof e.company === 'string' ? e.company : '',
        summary: typeof e.summary === 'string' ? e.summary : ''
      };
      // Preserve structured experience fields when present (used to compute real tenure).
      if (typeof e.type === 'string') entry.type = e.type;
      if (typeof e.start === 'string') entry.start = e.start;
      if (typeof e.end === 'string') entry.end = e.end;
      const months = Number(e.durationMonths);
      if (Number.isFinite(months) && months >= 0) entry.durationMonths = months;
      return entry;
    });
  return { skills, projects, experience };
};

// An interview that is closed must not accept new answers/follow-ups (VRQ-036).
const isClosedStatus = (status) => status === 'completed' || status === 'cancelled';

module.exports = {
  isValidObjectId,
  isOwner,
  isPdfBuffer,
  normalizeResumeProfile,
  isClosedStatus
};
