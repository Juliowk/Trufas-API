import { validateEnv } from './env.validation';

const baseEnv = {
  DATABASE_URL: 'postgres://postgres:postgres@localhost:5432/kaka_trufas',
  JWT_SECRET: 'segredo-suficientemente-longo',
};

describe('validateEnv', () => {
  it('aceita a configuracao minima e aplica os defaults', () => {
    const env = validateEnv({ ...baseEnv });

    expect(env.PORT).toBe(3000);
    expect(env.JWT_EXPIRES_IN).toBe('12h');
    expect(env.CORS_ORIGIN).toBe('http://localhost:5173');
  });

  // O Heroku injeta PORT como string; a validacao precisa converter antes de
  // checar se e inteiro, senao a aplicacao nao sobe em producao.
  it('converte PORT recebido como string', () => {
    const env = validateEnv({ ...baseEnv, PORT: '3000' });

    expect(env.PORT).toBe(3000);
  });

  it('rejeita PORT fora da faixa valida', () => {
    expect(() => validateEnv({ ...baseEnv, PORT: '99999' })).toThrow(/PORT/);
  });

  it('rejeita DATABASE_URL ausente', () => {
    expect(() => validateEnv({ JWT_SECRET: baseEnv.JWT_SECRET })).toThrow(/DATABASE_URL/);
  });

  it('rejeita JWT_SECRET curto', () => {
    expect(() => validateEnv({ ...baseEnv, JWT_SECRET: 'curto' })).toThrow(/JWT_SECRET/);
  });

  it('rejeita ADMIN_EMAIL invalido', () => {
    expect(() => validateEnv({ ...baseEnv, ADMIN_EMAIL: 'nao-e-email' })).toThrow(/ADMIN_EMAIL/);
  });
});
