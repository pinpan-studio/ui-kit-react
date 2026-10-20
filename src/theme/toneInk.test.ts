import { describe, expect, it } from 'vitest';
import { toneInk } from './toneInk';

describe('toneInk', () => {
  it('associe un ton à son jeton de texte, avec repli sur le ton', () => {
    expect(toneInk('var(--info-color)')).toBe('var(--tone-info-text, var(--info-color))');
    expect(toneInk('var(--error-color)')).toBe('var(--tone-error-text, var(--error-color))');
  });
  it('laisse les autres couleurs inchangées', () => {
    expect(toneInk('var(--primary-color)')).toBe('var(--primary-color)');
    expect(toneInk('#123456')).toBe('#123456');
  });
});

describe('toneIcon', () => {
  it('prend la nuance 700 pour success / warning / cyan, l’encre du texte sinon', async () => {
    const { toneIcon } = await import('./toneInk');
    expect(toneIcon('var(--success-color)')).toBe('var(--tone-success-icon, var(--success-color))');
    expect(toneIcon('var(--info-color)')).toBe('var(--tone-info-text, var(--info-color))');
  });
});
