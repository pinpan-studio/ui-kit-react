export type UploadStatus = 'queued' | 'uploading' | 'done' | 'error' | 'canceled';
export interface UploadItem {
  id: string;
  file: File;
  progress: number;
  status: UploadStatus;
  error?: string;
}

/** Fonction d'envoi : appelle onProgress(0–100), résout ou rejette ; retourne une fonction d'annulation. */
export type Uploader = (
  file: File,
  h: { progress: (p: number) => void; done: () => void; error: (e: Error) => void },
) => () => void;
