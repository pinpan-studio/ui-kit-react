import type { Uploader } from './uploadTypes';

/** Envoi simulé (progression pseudo-aléatoire ; échec si le nom contient « erreur »). */
export const simulatedUploader: Uploader = (file, h) => {
  let p = 0;
  const fail = /erreur|error/i.test(file.name);
  const speed = 4 + Math.random() * 10 + Math.max(0, 6 - file.size / 500_000);
  const t = setInterval(() => {
    p = Math.min(100, p + speed * (0.6 + Math.random()));
    if (fail && p > 55) {
      clearInterval(t);
      h.error(new Error('Le serveur a refusé le fichier (démo)'));
      return;
    }
    h.progress(Math.round(p));
    if (p >= 100) {
      clearInterval(t);
      h.done();
    }
  }, 160);
  return () => clearInterval(t);
};
