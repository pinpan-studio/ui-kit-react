import { keyLabels } from './keys';

describe('keyLabels', () => {
  it('affiche Ctrl K hors Mac et ⌘K sur Mac', () => {
    expect(keyLabels('mod+k', false)).toEqual(['Ctrl', 'K']);
    expect(keyLabels('mod+k', true)).toEqual(['⌘', 'K']);
  });
  it('traduit Maj et les touches spéciales', () => {
    expect(keyLabels('shift+?', false)).toEqual(['Maj', '?']);
    expect(keyLabels('mod+shift+enter', true)).toEqual(['⌘', '⇧', '↵']);
  });
});
