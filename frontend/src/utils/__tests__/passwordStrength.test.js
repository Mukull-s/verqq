import { getPasswordStrength } from '../passwordStrength';

describe('getPasswordStrength (VRQ-026)', () => {
  it('returns the weakest score for an empty password', () => {
    const result = getPasswordStrength('');
    expect(result.score).toBe(0);
    expect(result.label).toBe('Enter a password');
  });

  it('flags common passwords and caps their score', () => {
    const result = getPasswordStrength('password123');
    expect(result.isCommon).toBe(true);
    expect(result.score).toBeLessThanOrEqual(1);
  });

  it('rewards length, mixed case, digits and symbols', () => {
    const weak = getPasswordStrength('abcdefgh');
    const strong = getPasswordStrength('Str0ng!Passw0rd#2026');
    expect(strong.score).toBeGreaterThan(weak.score);
    expect(strong.score).toBe(4);
    expect(strong.isCommon).toBe(false);
  });

  it('requires at least 8 characters for the length check', () => {
    expect(getPasswordStrength('Ab1!').checks.length).toBe(false);
    expect(getPasswordStrength('Ab1!5678').checks.length).toBe(true);
  });
});
