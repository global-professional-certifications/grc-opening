const parseCsvEnv = (value: string | undefined): string[] =>
  (value || '')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

const isTruthy = (value: string | undefined): boolean =>
  ['1', 'true', 'yes', 'on'].includes((value || '').trim().toLowerCase());

export const isDevEmailVerificationBypassEnabled = (): boolean =>
  process.env.NODE_ENV !== 'production' &&
  isTruthy(process.env.DEV_EMAIL_VERIFICATION_BYPASS_ENABLED);

export const shouldBypassEmailVerificationForEmail = (email: string): boolean => {
  if (!isDevEmailVerificationBypassEnabled()) {
    return false;
  }

  const domain = email.split('@')[1]?.trim().toLowerCase();
  if (!domain) {
    return false;
  }

  return parseCsvEnv(process.env.DEV_EMAIL_VERIFICATION_BYPASS_DOMAINS).includes(domain);
};
