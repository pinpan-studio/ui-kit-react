// Porté depuis shared/components/media/media.utils.ts (Angular).
/** Utilitaires communs aux composants média. */

/** 75 → « 1:15 », 3725 → « 1:02:05 ». */
export function formatMediaTime(s: number): string {
  if (!isFinite(s) || s < 0) s = 0;
  const h = Math.floor(s / 3600),
    m = Math.floor((s % 3600) / 60),
    sec = Math.floor(s % 60);
  return h
    ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
    : `${m}:${String(sec).padStart(2, '0')}`;
}

export type MediaKind = 'image' | 'pdf' | 'video' | 'audio' | 'text' | 'other';

/** Déduit le type d'aperçu à partir du type MIME ou, à défaut, de l'extension. */
export function mediaKind(name = '', mime = ''): MediaKind {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  if (mime.startsWith('image/') || /^(png|jpe?g|gif|webp|svg|avif|bmp)$/.test(ext)) return 'image';
  if (mime === 'application/pdf' || ext === 'pdf') return 'pdf';
  if (mime.startsWith('video/') || /^(mp4|webm|ogv|mov|m4v)$/.test(ext)) return 'video';
  if (mime.startsWith('audio/') || /^(mp3|wav|ogg|oga|m4a|aac|flac|opus)$/.test(ext)) return 'audio';
  if (mime.startsWith('text/') || /^(txt|csv|json|md|log|xml)$/.test(ext)) return 'text';
  return 'other';
}

export const MEDIA_ICON: Record<MediaKind, string> = {
  image: 'image',
  pdf: 'picture_as_pdf',
  video: 'movie',
  audio: 'audiotrack',
  text: 'description',
  other: 'insert_drive_file',
};
