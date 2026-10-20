// Porté depuis data/static/media.data.ts (Angular) — PDF et WAV seulement pour l'instant.
/**
 * Médias de démonstration générés localement (aucun fichier distant, aucun appel réseau) :
 * PDF multi-pages, piste audio WAV synthétisée, images dessinées sur canvas et courte vidéo
 * enregistrée depuis un canvas animé. Tout est déterministe hormis la vidéo (dépend du navigateur).
 */

// ── PDF ────────────────────────────────────────────────

/** Échappe une chaîne pour un objet texte PDF (les caractères latin-1 sont conservés tels quels). */
function pdfText(s: string): string {
  return s
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/[’]/g, "'")
    .replace(/[—–]/g, '-');
}

/** Construit un PDF A4 de `pages` pages (texte Helvetica, en-tête coloré, tableau simple). */
export function buildSamplePdf(title = 'Contrat cadre 2026', pages = 4): Blob {
  const objects: string[] = [];
  const add = (body: string) => {
    objects.push(body);
    return objects.length;
  };

  const catalog = add('');
  const pagesObj = add('');
  const font = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
  const fontBold = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');

  const sections = [
    [
      'Objet du contrat',
      'Le présent contrat définit les conditions de fourniture du service de géolocalisation',
      'de flotte, de maintenance des balises et d’assistance technique pour le client.',
    ],
    [
      'Durée et renouvellement',
      'Le contrat est conclu pour une durée de douze (12) mois à compter de la date',
      'de signature. Il est renouvelable par tacite reconduction pour des périodes égales.',
    ],
    [
      'Conditions financières',
      'Les prestations sont facturées mensuellement, terme à échoir. Le règlement',
      'intervient à trente (30) jours date de facture par virement ou mobile money.',
    ],
    [
      'Annexes',
      'Annexe 1 : liste des véhicules équipés. Annexe 2 : grille tarifaire.',
      'Annexe 3 : procès-verbal d’installation signé par les deux parties.',
    ],
  ];

  const kids: number[] = [];
  for (let p = 1; p <= pages; p++) {
    const s = (sections[(p - 1) % sections.length] ?? sections[0]) as [string, string, string];
    const rows = Array.from({ length: 6 }, (_, i) => {
      const y = 470 - i * 26;
      return `0.93 0.95 0.98 rg 56 ${y - 8} 483 22 re ${i % 2 ? 'f' : 'n'}
BT /F1 10 Tf 0.2 0.25 0.33 rg 64 ${y} Td (${pdfText(`CI-${4500 + p * 10 + i}-AB`)}) Tj ET
BT /F1 10 Tf 0.2 0.25 0.33 rg 220 ${y} Td (${pdfText(['Abidjan', 'Bouaké', 'San-Pédro', 'Yamoussoukro', 'Daloa', 'Korhogo'][i] ?? '')}) Tj ET
BT /F1 10 Tf 0.2 0.25 0.33 rg 420 ${y} Td (${(12500 * (i + 1)).toLocaleString('fr-FR').replace(/\s/g, ' ')} FCFA) Tj ET`;
    }).join('\n');
    const content = `0.27 0.35 0.89 rg 0 762 595 80 re f
BT /F2 22 Tf 1 1 1 rg 56 795 Td (${pdfText(title)}) Tj ET
BT /F1 11 Tf 1 1 1 rg 56 775 Td (Référence CTR-2026-0412 - Document de démonstration) Tj ET
BT /F2 16 Tf 0.1 0.12 0.18 rg 56 710 Td (${p}. ${pdfText(s[0])}) Tj ET
BT /F1 11 Tf 0.3 0.33 0.4 rg 56 684 Td (${pdfText(s[1])}) Tj ET
BT /F1 11 Tf 0.3 0.33 0.4 rg 56 668 Td (${pdfText(s[2])}) Tj ET
BT /F2 12 Tf 0.1 0.12 0.18 rg 56 520 Td (Véhicules concernés) Tj ET
0.8 0.83 0.88 RG 1 w 56 505 m 539 505 l S
${rows}
0.8 0.83 0.88 RG 56 80 m 539 80 l S
BT /F1 9 Tf 0.5 0.53 0.6 rg 56 64 Td (UI Kit - PDF généré localement) Tj ET
BT /F1 9 Tf 0.5 0.53 0.6 rg 490 64 Td (Page ${p} / ${pages}) Tj ET`;
    const stream = add(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
    kids.push(
      add(
        `<< /Type /Page /Parent ${pagesObj} 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${font} 0 R /F2 ${fontBold} 0 R >> >> /Contents ${stream} 0 R >>`,
      ),
    );
  }
  objects[catalog - 1] = `<< /Type /Catalog /Pages ${pagesObj} 0 R >>`;
  objects[pagesObj - 1] = `<< /Type /Pages /Kids [${kids.map((k) => `${k} 0 R`).join(' ')}] /Count ${kids.length} >>`;

  let out = '%PDF-1.4\n';
  const offsets: number[] = [];
  objects.forEach((body, i) => {
    offsets.push(out.length);
    out += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xref = out.length;
  out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  out += offsets.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('');
  out += `trailer\n<< /Size ${objects.length + 1} /Root ${catalog} 0 R >>\nstartxref\n${xref}\n%%EOF`;

  // Les longueurs sont calculées en caractères : tous sont < 256, donc 1 caractère = 1 octet.
  const bytes = new Uint8Array(out.length);
  for (let i = 0; i < out.length; i++) bytes[i] = out.charCodeAt(i) & 0xff;
  return new Blob([bytes], { type: 'application/pdf' });
}

// ── Audio ──────────────────────────────────────────────

/** Petite mélodie synthétisée (sinus + harmonique, enveloppe ADSR) encodée en WAV 16 bits mono. */
export function buildSampleWav(seconds = 12, seed = 0): Blob {
  const rate = 22050;
  const n = Math.floor(seconds * rate);
  const data = new Int16Array(n);
  const scale = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33];
  const melody = [0, 2, 4, 2, 3, 4, 5, 4, 2, 0, 1, 2, 4, 3, 2, 0].map((d) => scale[(d + seed) % scale.length] ?? 440);
  const noteLen = 0.375;
  for (let i = 0; i < n; i++) {
    const t = i / rate;
    const k = Math.floor(t / noteLen);
    const f = melody[k % melody.length] ?? 440;
    const lt = t - k * noteLen;
    const env = Math.min(1, lt / 0.02) * Math.exp(-lt * 4.2);
    const bass = 0.25 * Math.sin(2 * Math.PI * ((melody[(Math.floor(k / 4) * 4) % melody.length] ?? 440) / 2) * t);
    const v = env * (Math.sin(2 * Math.PI * f * t) + 0.3 * Math.sin(4 * Math.PI * f * t)) * 0.5 + bass * 0.5;
    data[i] = Math.max(-1, Math.min(1, v * 0.7)) * 32767;
  }
  const buf = new ArrayBuffer(44 + n * 2);
  const dv = new DataView(buf);
  const str = (o: number, s: string) => {
    for (let i = 0; i < s.length; i++) dv.setUint8(o + i, s.charCodeAt(i));
  };
  str(0, 'RIFF');
  dv.setUint32(4, 36 + n * 2, true);
  str(8, 'WAVE');
  str(12, 'fmt ');
  dv.setUint32(16, 16, true);
  dv.setUint16(20, 1, true);
  dv.setUint16(22, 1, true);
  dv.setUint32(24, rate, true);
  dv.setUint32(28, rate * 2, true);
  dv.setUint16(32, 2, true);
  dv.setUint16(34, 16, true);
  str(36, 'data');
  dv.setUint32(40, n * 2, true);
  new Int16Array(buf, 44).set(data);
  return new Blob([buf], { type: 'audio/wav' });
}
