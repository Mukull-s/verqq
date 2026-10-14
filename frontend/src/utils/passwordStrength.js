// Minimal, dependency-free password strength + common-password check (VRQ-026).
// Used by the registration form to nudge users away from weak passwords.

const COMMON_PASSWORDS = new Set([
  'password', 'password1', 'password123', '12345678', '123456789', '1234567890',
  'qwerty123', 'qwertyuiop', 'letmein', 'welcome', 'admin123', 'iloveyou',
  'abc12345', 'football', 'monkey123', 'dragon123', 'sunshine', 'princess',
  'verq1234', 'interview', 'candidate'
]);

const hasLower = (s) => /[a-z]/.test(s);
const hasUpper = (s) => /[A-Z]/.test(s);
const hasDigit = (s) => /[0-9]/.test(s);
const hasSymbol = (s) => /[^A-Za-z0-9]/.test(s);

/**
 * Score a password 0-4 with a human label.
 * @param {string} password
 * @returns {{ score: number, label: string, isCommon: boolean, checks: object }}
 */
export const getPasswordStrength = (password = '') => {
  const checks = {
    length: password.length >= 8,
    lower: hasLower(password),
    upper: hasUpper(password),
    digit: hasDigit(password),
    symbol: hasSymbol(password),
  };

  const isCommon = COMMON_PASSWORDS.has(password.toLowerCase());

  if (!password) {
    return { score: 0, label: 'Enter a password', isCommon: false, checks };
  }

  let score = 0;
  if (checks.length) score += 1;
  if (checks.lower && checks.upper) score += 1;
  if (checks.digit) score += 1;
  if (checks.symbol) score += 1;
  if (password.length >= 12) score += 1;

  if (isCommon) score = Math.min(score, 1);
  score = Math.max(0, Math.min(4, score));

  const labels = ['Very weak', 'Weak', 'Fair', 'Good', 'Strong'];
  return { score, label: labels[score], isCommon, checks };
};
