import { frenchTypography } from './frenchTypography';

describe('frenchTypography', () => {
  it('insère des espaces insécables avant la ponctuation haute', () => {
    const out = frenchTypography('Bonjour ! Prêt ?');
    expect(out).not.toBe('Bonjour ! Prêt ?');
    expect(out).toMatch(/Bonjour[\u00a0\u202f]!/);
  });
});
