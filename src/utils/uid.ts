import crypto from 'crypto';

export function uid(length = 12): string {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const randomBytes = crypto.randomBytes(length);
  let id = '';
  for (let i = 0; i < length; i++) {
    id += chars[randomBytes[i] % chars.length];
  }
  return id;
}

export function prefixedUid(prefix: string, length = 12): string {
  return `${prefix}_${uid(length)}`;
}
