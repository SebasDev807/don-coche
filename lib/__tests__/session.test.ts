import { encrypt, decrypt, SessionPayload } from '../session';

jest.mock('jose', () => ({
  SignJWT: class {
    payload: any;
    constructor(payload: any) { this.payload = payload; }
    setProtectedHeader() { return this; }
    setIssuedAt() { return this; }
    setExpirationTime() { return this; }
    sign() { return Promise.resolve('mocked-jwt-token-' + this.payload.userId); }
  },
  jwtVerify: (token: string) => {
    if (token.startsWith('mocked-jwt-token-')) {
      return Promise.resolve({
        payload: { userId: '123', name: 'Admin', role: 'ADMINISTRADOR' }
      });
    }
    throw new Error('Invalid token');
  }
}));

describe('Session Security', () => {
  const mockPayload: SessionPayload = {
    userId: '123',
    name: 'Admin',
    role: 'ADMINISTRADOR',
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24), // 1 day
  };

  it('encrypts and decrypts a session payload successfully', async () => {
    // 1. Encrypt payload
    const token = await encrypt(mockPayload);
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(10);

    // 2. Decrypt token
    const decrypted = await decrypt(token);
    expect(decrypted).toBeDefined();
    expect(decrypted?.userId).toBe(mockPayload.userId);
    expect(decrypted?.role).toBe(mockPayload.role);
    expect(decrypted?.name).toBe(mockPayload.name);
  });

  it('returns undefined for invalid tokens', async () => {
    const decrypted = await decrypt('invalid.token.format');
    expect(decrypted).toBeUndefined();
  });

  it('returns undefined for empty tokens', async () => {
    const decrypted = await decrypt('');
    expect(decrypted).toBeUndefined();
  });
});
